// ============================================================================
// /api/email-new-message — notify recipient when a new message is sent
//
// Two flows:
//   1. Host wrote → notify ADMIN(s) (from dashboard.html, no auth required)
//   2. Admin replied → notify HOST (from admin.html, requires admin JWT)
//
// Body for case 1: { host_email, host_name, host_slug, body }
// Body for case 2: { to_host_id, body, from_role: 'admin' }
// ============================================================================

const { sendEmail } = require('./_email-client');
const templates = require('./_email-templates');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const body = req.body || {};
  const messageText = (body.body || '').trim();
  if (!messageText) return res.status(400).json({ error: 'Empty message body' });

  try {
    const { createClient } = require('@supabase/supabase-js');
    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    if (body.from_role === 'admin') {
      // FLOW 2: Admin replied → notify the host
      const auth = req.headers.authorization || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
      if (!token) return res.status(401).json({ error: 'Missing auth' });

      const sbUser = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: { user } } = await sbUser.auth.getUser(token);
      if (!user) return res.status(401).json({ error: 'Invalid auth' });

      const { data: caller } = await sb.from('hosts').select('is_admin').eq('id', user.id).maybeSingle();
      if (!caller || !caller.is_admin) return res.status(403).json({ error: 'Admin only' });

      const { data: host } = await sb.from('hosts').select('email, name').eq('id', body.to_host_id).maybeSingle();
      if (!host || !host.email) return res.status(404).json({ error: 'Host not found' });

      const { subject, html } = templates.newMessage({
        recipient_name: host.name,
        from_label: 'the Refstay team',
        body: messageText,
        is_admin_reply: true,
      });
      const result = await sendEmail({ to: host.email, subject, html });
      if (!result.ok) return res.status(500).json({ error: result.error });
      return res.status(200).json({ ok: true, id: result.id });

    } else {
      // FLOW 1: Host wrote → notify all admins
      const { data: admins } = await sb.from('hosts').select('email, name').eq('is_admin', true);
      if (!admins || admins.length === 0) {
        console.log('[email-new-message] no admins configured');
        return res.status(200).json({ ok: true, sent: 0, note: 'no admins' });
      }

      const fromLabel = body.host_name || body.host_slug || 'a host';
      let sent = 0;
      for (const admin of admins) {
        if (!admin.email) continue;
        const { subject, html } = templates.newMessage({
          recipient_name: admin.name,
          from_label: fromLabel,
          body: messageText,
          is_admin_reply: false,
        });
        const result = await sendEmail({ to: admin.email, subject, html });
        if (result.ok) sent++;
      }
      return res.status(200).json({ ok: true, sent });
    }
  } catch (e) {
    console.error('[email-new-message] error:', e);
    return res.status(500).json({ error: String(e.message || e) });
  }
};
