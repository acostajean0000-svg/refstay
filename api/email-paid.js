// ============================================================================
// /api/email-paid — send "payment sent" email after admin marks paid
//
// Called from admin.html after admin_mark_paid RPC succeeds. Protected by
// requiring a logged-in admin session (we verify via Supabase Auth).
//
// POST /api/email-paid
// Body: { host_id, amount, booking_count? }
// Headers: Authorization: Bearer <user-jwt> (from the admin's session)
// ============================================================================

const { sendEmail } = require('./_email-client');
const templates = require('./_email-templates');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const body = req.body || {};
  const host_id = body.host_id;
  const amount = Number(body.amount);
  const booking_count = body.booking_count ? Number(body.booking_count) : null;
  if (!host_id || !amount || amount <= 0) {
    return res.status(400).json({ error: 'host_id and amount required' });
  }

  // Verify caller is an admin via their JWT
  const auth = req.headers.authorization || req.headers.Authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing auth' });

  let host;
  try {
    const { createClient } = require('@supabase/supabase-js');
    // Verify the caller is an admin
    const sbUser = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY || token, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: userErr } = await sbUser.auth.getUser(token);
    if (userErr || !user) return res.status(401).json({ error: 'Invalid auth' });

    // Use service role to look up the host (RLS would block cross-host reads otherwise)
    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { data: caller } = await sb.from('hosts').select('is_admin').eq('id', user.id).maybeSingle();
    if (!caller || !caller.is_admin) {
      return res.status(403).json({ error: 'Admin only' });
    }

    const { data: targetHost, error: hostErr } = await sb
      .from('hosts')
      .select('email, name, payout_method, payout_destination')
      .eq('id', host_id)
      .maybeSingle();
    if (hostErr) throw hostErr;
    if (!targetHost || !targetHost.email) {
      return res.status(404).json({ error: 'Host not found' });
    }
    host = targetHost;
  } catch (e) {
    console.error('[email-paid] auth/lookup error:', e);
    return res.status(500).json({ error: 'Server error' });
  }

  const { subject, html } = templates.paymentSent({
    name: host.name,
    amount,
    method: host.payout_method,
    destination: host.payout_destination,
    booking_count,
  });
  const result = await sendEmail({ to: host.email, subject, html });
  if (!result.ok) return res.status(500).json({ error: result.error });
  return res.status(200).json({ ok: true, id: result.id });
};
