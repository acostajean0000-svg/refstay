// ============================================================================
// Refstay — onboarding nurture cron
// Runs daily via Vercel Cron. Sends 4 emails based on host tenure + engagement:
//   - Day 3:  if no link copied / no print opened / no booking yet
//   - Day 7:  if no favorites + no print opened
//   - Day 14: if no bookings
//   - Monthly digest (1st of each month): all hosts with >=14 days tenure
//
// All sends are deduped via the email_log table (UNIQUE INDEX).
//
// Auth: Vercel Cron sends a request with `Authorization: Bearer ${CRON_SECRET}`
//       header. We verify it before doing anything.
//
// Manual testing: ?secret=<CRON_SECRET>&dry=1 to preview without sending
// ============================================================================

const { createClient } = require('@supabase/supabase-js');
const { sendEmail } = require('./_email-client');
const tpl = require('./_email-templates');

module.exports = async function handler(req, res) {
  // ---- Auth ----
  const provided =
    (req.headers && req.headers.authorization && req.headers.authorization.replace(/^Bearer\s+/i, '')) ||
    (req.query && req.query.secret);
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    return res.status(500).json({ ok: false, error: 'CRON_SECRET not configured' });
  }
  if (!provided || provided !== expected) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  const dryRun = req.query && (req.query.dry === '1' || req.query.dry === 'true');

  // ---- Supabase service-role client ----
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ ok: false, error: 'Supabase env vars missing' });
  }
  const sb = createClient(supabaseUrl, serviceKey);

  const stats = {
    day3: { found: 0, sent: 0, errors: 0 },
    day7: { found: 0, sent: 0, errors: 0 },
    day14: { found: 0, sent: 0, errors: 0 },
    monthly: { found: 0, sent: 0, errors: 0, period_key: null, ran: false },
  };
  const log = [];

  // ---- Day 3 ----
  try {
    const { data, error } = await sb.rpc('onboarding_candidates_day3');
    if (error) throw error;
    stats.day3.found = (data || []).length;
    for (const c of (data || [])) {
      const r = await sendOne(sb, {
        host_id: c.host_id, email: c.email,
        type: 'onboarding_day3',
        message: tpl.onboardingDay3({ name: c.name, slug: c.slug }),
        dryRun,
      });
      if (r.ok) stats.day3.sent++; else stats.day3.errors++;
      log.push({ type: 'day3', slug: c.slug, ok: r.ok, error: r.error });
    }
  } catch (e) {
    log.push({ type: 'day3', error: String(e.message || e) });
  }

  // ---- Day 7 ----
  try {
    const { data, error } = await sb.rpc('onboarding_candidates_day7');
    if (error) throw error;
    stats.day7.found = (data || []).length;
    for (const c of (data || [])) {
      const r = await sendOne(sb, {
        host_id: c.host_id, email: c.email,
        type: 'onboarding_day7',
        message: tpl.onboardingDay7({ name: c.name, slug: c.slug }),
        dryRun,
      });
      if (r.ok) stats.day7.sent++; else stats.day7.errors++;
      log.push({ type: 'day7', slug: c.slug, ok: r.ok, error: r.error });
    }
  } catch (e) {
    log.push({ type: 'day7', error: String(e.message || e) });
  }

  // ---- Day 14 ----
  try {
    const { data, error } = await sb.rpc('onboarding_candidates_day14');
    if (error) throw error;
    stats.day14.found = (data || []).length;
    for (const c of (data || [])) {
      const r = await sendOne(sb, {
        host_id: c.host_id, email: c.email,
        type: 'onboarding_day14',
        message: tpl.onboardingDay14({
          name: c.name, slug: c.slug,
          clicks_total: Number(c.clicks_total || 0),
        }),
        dryRun,
      });
      if (r.ok) stats.day14.sent++; else stats.day14.errors++;
      log.push({ type: 'day14', slug: c.slug, ok: r.ok, error: r.error });
    }
  } catch (e) {
    log.push({ type: 'day14', error: String(e.message || e) });
  }

  // ---- Monthly digest — only on the 1st-3rd of each month ----
  // Sends a digest for the PREVIOUS month
  const now = new Date();
  const dayOfMonth = now.getUTCDate();
  const RUN_DIGEST = dayOfMonth >= 1 && dayOfMonth <= 3;  // 3-day window for retries
  if (RUN_DIGEST) {
    stats.monthly.ran = true;
    // Previous month period_key (YYYY-MM)
    const prevMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const pkey = `${prevMonth.getUTCFullYear()}-${String(prevMonth.getUTCMonth() + 1).padStart(2, '0')}`;
    const periodLabel = prevMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    stats.monthly.period_key = pkey;

    try {
      const { data, error } = await sb.rpc('monthly_digest_candidates', { p_period_key: pkey });
      if (error) throw error;
      stats.monthly.found = (data || []).length;
      for (const c of (data || [])) {
        const r = await sendOne(sb, {
          host_id: c.host_id, email: c.email,
          type: 'monthly_digest',
          period_key: pkey,
          message: tpl.monthlyDigest({
            name: c.name, slug: c.slug,
            period_label: periodLabel,
            clicks: Number(c.clicks || 0),
            bookings: Number(c.bookings || 0),
            earnings: Number(c.earnings || 0),
            top_activity: c.top_activity,
          }),
          dryRun,
        });
        if (r.ok) stats.monthly.sent++; else stats.monthly.errors++;
        log.push({ type: 'monthly', slug: c.slug, ok: r.ok, error: r.error });
      }
    } catch (e) {
      log.push({ type: 'monthly', error: String(e.message || e) });
    }
  }

  return res.status(200).json({
    ok: true,
    dry_run: dryRun,
    timestamp: now.toISOString(),
    stats,
    log: log.slice(0, 100),  // Don't blow up Vercel logs
  });
};

// ---------------------------------------------------------------------------
// Helper: send one email, log to email_log
// ---------------------------------------------------------------------------
async function sendOne(sb, { host_id, email, type, message, period_key = null, dryRun = false }) {
  if (dryRun) {
    return { ok: true, dryRun: true };
  }
  let result;
  try {
    result = await sendEmail({
      to: email,
      subject: message.subject,
      html: message.html,
    });
  } catch (e) {
    result = { ok: false, error: String(e.message || e) };
  }

  // Log it — even if send failed (so admin can see attempts).
  // Only log success with ok=true to participate in unique index.
  try {
    await sb.from('email_log').insert({
      host_id,
      email,
      email_type: type,
      period_key,
      resend_id: result.id || null,
      ok: !!result.ok,
      error: result.error || null,
      metadata: { subject: message.subject },
    });
  } catch (logErr) {
    // If the UNIQUE constraint fires, that's expected (race between concurrent runs)
    console.error('[cron] email_log insert failed:', logErr);
  }

  return result;
}
