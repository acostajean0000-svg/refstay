// ============================================================================
// Refstay — admin bulk broadcast
// Sends a single message to many hosts at once. Supports:
//   - in-app messages (rows in `messages` table — appears in their dashboard)
//   - email (via Resend, branded template)
//   - both
//
// Audience filters:
//   - 'all'           every non-admin host with confirmed email
//   - 'with_booking'  hosts who have at least 1 booking
//   - 'inactive_7d'   hosts with no host_activity in the last 7 days
//   - 'host_ids'      explicit list of UUIDs (manual selection)
//
// Body:
//   { subject?, body, mode: 'inapp'|'email'|'both', audience: 'all'|..., host_ids?: [] }
//
// Returns:
//   { ok, total_targets, inapp_sent, emails_sent, errors: [...] }
// ============================================================================

const { createClient } = require('@supabase/supabase-js');
const { sendEmail } = require('./_email-client');

// Lightweight branded email body for broadcast — simpler than the nurture templates
function renderBroadcastEmail({ name, subject, body_text }) {
  const firstName = (name || 'friend').split(' ')[0];
  // Convert simple newlines to <br>, preserve paragraphs
  const escape = s => String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const html_body = escape(body_text).replace(/\n\n+/g, '</p><p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">').replace(/\n/g, '<br>');
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0B1020;line-height:1.5;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F8FAFC;">
<tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="580" style="max-width:580px;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.05);">
    <tr><td style="background:linear-gradient(135deg,#FF385C 0%,#FF7A45 35%,#7C3AED 100%);padding:28px 32px;">
      <div style="color:#FFFFFF;font-weight:800;font-size:20px;letter-spacing:-0.02em;">Refstay</div>
    </td></tr>
    <tr><td style="padding:36px 36px 24px;">
      <p style="margin:0 0 16px;color:#0B1020;font-size:16px;font-weight:600;">Hi ${escape(firstName)},</p>
      <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">${html_body}</p>
      <p style="margin:24px 0 0;color:#334155;font-size:15px;line-height:1.6;">— The Refstay team</p>
    </td></tr>
    <tr><td style="padding:24px 36px 28px;border-top:1px solid #E2E8F0;background:#FAFBFC;font-size:12px;color:#64748B;line-height:1.6;">
      <a href="https://refstay.com/dashboard.html" style="color:#FF385C;text-decoration:none;font-weight:600;">Open dashboard</a> ·
      <a href="mailto:support@refstay.com?subject=Unsubscribe" style="color:#64748B;text-decoration:none;">Unsubscribe</a>
      <div style="margin-top:8px;color:#94A3B8;">© 2026 Refstay. Not affiliated with Airbnb, Inc.</div>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return res.status(500).json({ ok: false, error: 'Supabase env vars missing' });

  // Auth
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ ok: false, error: 'No auth token' });

  const sbAdmin = createClient(supabaseUrl, serviceKey);
  let userId, userEmail;
  try {
    const { data: { user }, error } = await sbAdmin.auth.getUser(token);
    if (error || !user) return res.status(401).json({ ok: false, error: 'Invalid token' });
    userId = user.id;
    userEmail = user.email;
  } catch (e) {
    return res.status(401).json({ ok: false, error: 'Auth failed' });
  }

  const { data: requester } = await sbAdmin.from('hosts').select('id, is_admin').eq('id', userId).maybeSingle();
  if (!requester || !requester.is_admin) return res.status(403).json({ ok: false, error: 'Admin only' });

  // Parse body
  let body = {};
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); }
  catch (e) { return res.status(400).json({ ok: false, error: 'Invalid JSON' }); }

  const { mode, audience, subject, host_ids } = body;
  const messageText = (body.body || '').trim();

  if (!messageText) return res.status(400).json({ ok: false, error: 'Empty body' });
  if (!['inapp', 'email', 'both'].includes(mode)) return res.status(400).json({ ok: false, error: 'Invalid mode' });
  if (!['all', 'with_booking', 'inactive_7d', 'host_ids'].includes(audience)) return res.status(400).json({ ok: false, error: 'Invalid audience' });
  if ((mode === 'email' || mode === 'both') && !subject) return res.status(400).json({ ok: false, error: 'Email mode requires subject' });

  // ---- Resolve target hosts ----
  let targets = [];
  if (audience === 'host_ids') {
    if (!Array.isArray(host_ids) || host_ids.length === 0) {
      return res.status(400).json({ ok: false, error: 'host_ids must be a non-empty array' });
    }
    const { data, error } = await sbAdmin.from('hosts').select('id, slug, name, email, is_admin').in('id', host_ids);
    if (error) return res.status(500).json({ ok: false, error: 'Lookup failed: ' + error.message });
    targets = (data || []).filter(h => !h.is_admin);
  } else if (audience === 'all') {
    const { data, error } = await sbAdmin.from('hosts').select('id, slug, name, email, is_admin').eq('is_admin', false);
    if (error) return res.status(500).json({ ok: false, error: error.message });
    targets = data || [];
  } else if (audience === 'with_booking') {
    // Hosts who have at least one booking row
    const { data: bookingHosts } = await sbAdmin.from('bookings').select('host_id').not('host_id', 'is', null);
    const ids = Array.from(new Set((bookingHosts || []).map(b => b.host_id)));
    if (ids.length === 0) targets = [];
    else {
      const { data } = await sbAdmin.from('hosts').select('id, slug, name, email, is_admin').in('id', ids).eq('is_admin', false);
      targets = data || [];
    }
  } else if (audience === 'inactive_7d') {
    // Hosts with NO host_activity in last 7 days
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentActivity } = await sbAdmin.from('host_activity').select('host_slug').gte('created_at', cutoff);
    const activeSlugs = new Set((recentActivity || []).map(r => r.host_slug));
    const { data: allHosts } = await sbAdmin.from('hosts').select('id, slug, name, email, is_admin').eq('is_admin', false);
    targets = (allHosts || []).filter(h => !activeSlugs.has(h.slug));
  }

  if (targets.length === 0) {
    return res.status(200).json({ ok: true, total_targets: 0, inapp_sent: 0, emails_sent: 0, note: 'No hosts matched audience filter' });
  }

  // ---- Send to each target ----
  const errors = [];
  let inappSent = 0;
  let emailsSent = 0;

  for (const host of targets) {
    // In-app message
    if (mode === 'inapp' || mode === 'both') {
      try {
        const { error } = await sbAdmin.from('messages').insert({
          host_id: host.id,
          from_role: 'admin',
          body: messageText,
        });
        if (error) errors.push({ host: host.slug, type: 'inapp', error: error.message });
        else inappSent++;
      } catch (e) {
        errors.push({ host: host.slug, type: 'inapp', error: String(e.message || e) });
      }
    }
    // Email
    if ((mode === 'email' || mode === 'both') && host.email) {
      try {
        const html = renderBroadcastEmail({ name: host.name, subject, body_text: messageText });
        const result = await sendEmail({ to: host.email, subject, html });
        if (result.ok) emailsSent++;
        else errors.push({ host: host.slug, type: 'email', error: result.error });
      } catch (e) {
        errors.push({ host: host.slug, type: 'email', error: String(e.message || e) });
      }
    }
  }

  return res.status(200).json({
    ok: true,
    total_targets: targets.length,
    inapp_sent: inappSent,
    emails_sent: emailsSent,
    errors: errors.slice(0, 20), // cap for response size
    triggered_by: userEmail,
  });
};
