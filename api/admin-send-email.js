// ============================================================================
// Refstay — admin manual email send
// Lets admins trigger ANY email template for ANY host from the dashboard.
// Useful for testing, re-engagement, or sending the monthly digest mid-month.
//
// Auth: requires admin JWT in Authorization header.
// Body: { host_id, email_type, period_key? }
//   - host_id:   UUID of target host
//   - email_type: 'welcome' | 'onboarding_day3' | 'onboarding_day7'
//                 'onboarding_day14' | 'monthly_digest'
//   - period_key: required for monthly_digest only ('YYYY-MM')
//
// If the host already has an email_log row with ok=true for the same type+period,
// we DELETE it first so the new send isn't blocked by the unique index.
// ============================================================================

const { createClient } = require('@supabase/supabase-js');
const { sendEmail } = require('./_email-client');
const tpl = require('./_email-templates');

const ALLOWED_TYPES = new Set([
  'welcome',
  'onboarding_day3',
  'onboarding_day7',
  'onboarding_day14',
  'monthly_digest',
]);

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'POST only' });
  }

  // ---- Env ----
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ ok: false, error: 'Supabase env vars missing' });
  }

  // ---- Auth: verify admin via JWT ----
  const authHeader = (req.headers && req.headers.authorization) || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return res.status(401).json({ ok: false, error: 'No auth token' });
  }

  const sbAdmin = createClient(supabaseUrl, serviceKey);
  let userId, userEmail;
  try {
    const { data: { user }, error } = await sbAdmin.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ ok: false, error: 'Invalid token' });
    }
    userId = user.id;
    userEmail = user.email;
  } catch (e) {
    return res.status(401).json({ ok: false, error: 'Auth check failed' });
  }

  // Confirm requesting user is an admin
  const { data: requesterHost, error: requesterErr } = await sbAdmin
    .from('hosts')
    .select('id, is_admin')
    .eq('id', userId)
    .maybeSingle();
  if (requesterErr || !requesterHost || !requesterHost.is_admin) {
    return res.status(403).json({ ok: false, error: 'Not authorized (admin only)' });
  }

  // ---- Parse body ----
  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch (e) {
    return res.status(400).json({ ok: false, error: 'Invalid JSON body' });
  }

  const { host_id, email_type } = body;
  let { period_key } = body;

  if (!host_id) return res.status(400).json({ ok: false, error: 'host_id required' });
  if (!email_type || !ALLOWED_TYPES.has(email_type)) {
    return res.status(400).json({ ok: false, error: 'Invalid email_type', allowed: Array.from(ALLOWED_TYPES) });
  }

  // For monthly_digest, default to previous month if no period_key given
  if (email_type === 'monthly_digest' && !period_key) {
    const now = new Date();
    const prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    period_key = `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  // ---- Look up host details ----
  const { data: host, error: hostErr } = await sbAdmin
    .from('hosts')
    .select('id, slug, name, email')
    .eq('id', host_id)
    .single();
  if (hostErr || !host) {
    return res.status(404).json({ ok: false, error: 'Host not found' });
  }
  if (!host.email) {
    return res.status(400).json({ ok: false, error: 'Host has no email on file' });
  }

  // ---- Render template ----
  let message;
  try {
    if (email_type === 'welcome') {
      message = tpl.welcome({ name: host.name, slug: host.slug });
    } else if (email_type === 'onboarding_day3') {
      message = tpl.onboardingDay3({ name: host.name, slug: host.slug });
    } else if (email_type === 'onboarding_day7') {
      message = tpl.onboardingDay7({ name: host.name, slug: host.slug });
    } else if (email_type === 'onboarding_day14') {
      // Pull clicks total for personalized copy
      const { count } = await sbAdmin
        .from('clicks')
        .select('*', { count: 'exact', head: true })
        .eq('host_slug', host.slug);
      message = tpl.onboardingDay14({ name: host.name, slug: host.slug, clicks_total: count || 0 });
    } else if (email_type === 'monthly_digest') {
      // Pull period stats
      const v_start = new Date(period_key + '-01T00:00:00Z');
      const v_end = new Date(v_start);
      v_end.setUTCMonth(v_end.getUTCMonth() + 1);
      const periodLabel = v_start.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

      const [clicksRes, bookingsRes] = await Promise.all([
        sbAdmin.from('clicks').select('*', { count: 'exact', head: true })
          .eq('host_slug', host.slug)
          .gte('ts', v_start.toISOString())
          .lt('ts', v_end.toISOString()),
        sbAdmin.from('bookings').select('amount, activity')
          .eq('host_id', host.id)
          .gte('created_at', v_start.toISOString())
          .lt('created_at', v_end.toISOString()),
      ]);

      const bookings = bookingsRes.data || [];
      const earnings = bookings.reduce((s, b) => s + (Number(b.amount) || 0), 0);
      // Most common activity
      const activityCounts = {};
      bookings.forEach(b => {
        if (b.activity) activityCounts[b.activity] = (activityCounts[b.activity] || 0) + 1;
      });
      const top_activity = Object.keys(activityCounts).sort((a, b) => activityCounts[b] - activityCounts[a])[0] || null;

      message = tpl.monthlyDigest({
        name: host.name, slug: host.slug,
        period_label: periodLabel,
        clicks: clicksRes.count || 0,
        bookings: bookings.length,
        earnings,
        top_activity,
      });
    }
  } catch (e) {
    console.error('[admin-send-email] template render failed:', e);
    return res.status(500).json({ ok: false, error: 'Template render failed: ' + String(e.message || e) });
  }

  // ---- Delete existing log row if any (so re-send isn't blocked by unique index) ----
  try {
    let delQuery = sbAdmin.from('email_log').delete().eq('host_id', host.id).eq('email_type', email_type).eq('ok', true);
    if (period_key) {
      delQuery = delQuery.eq('period_key', period_key);
    } else {
      delQuery = delQuery.is('period_key', null);
    }
    await delQuery;
  } catch (e) {
    // Non-fatal — continue with send
    console.error('[admin-send-email] delete prior log failed (non-fatal):', e);
  }

  // ---- Send ----
  const result = await sendEmail({
    to: host.email,
    subject: message.subject,
    html: message.html,
  });

  // ---- Log the send (regardless of outcome) ----
  try {
    await sbAdmin.from('email_log').insert({
      host_id: host.id,
      email: host.email,
      email_type,
      period_key: period_key || null,
      resend_id: result.id || null,
      ok: !!result.ok,
      error: result.error || null,
      metadata: {
        subject: message.subject,
        triggered_by: 'admin_manual',
        admin_email: userEmail,
      },
    });
  } catch (logErr) {
    console.error('[admin-send-email] email_log insert failed:', logErr);
  }

  if (!result.ok) {
    return res.status(500).json({ ok: false, error: result.error || 'Send failed' });
  }

  return res.status(200).json({
    ok: true,
    sent_to: host.email,
    email_type,
    period_key: period_key || null,
    resend_id: result.id || null,
    subject: message.subject,
  });
};
