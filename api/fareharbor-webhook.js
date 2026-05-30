// ============================================================================
// Refstay — FareHarbor booking webhook
// URL:   https://refstay.com/api/fareharbor-webhook?secret=<FH_WEBHOOK_SECRET>
// Method: POST
//
// Flow:
//   1. Validate the shared secret (query param or x-refstay-secret header)
//   2. Parse FH payload — extract booking + sub_source / marketing_source
//   3. Pull the host_slug from the marketing_source (format: miamistylerentals-<slug>)
//   4. Look up host_id from slug
//   5. Compute the host's 5% commission
//   6. Upsert the booking row in Supabase (idempotent by fh_booking_uuid)
//
// Env vars (set in Vercel → Project → Settings → Environment Variables):
//   - SUPABASE_URL                 https://nexsrqqoqerajjquoiqk.supabase.co
//   - SUPABASE_SERVICE_ROLE_KEY    <service_role key from Supabase, NOT the anon key>
//   - FH_WEBHOOK_SECRET            <random 32+ char string you set; FH uses it in the URL>
// ============================================================================

const COMMISSION_RATE = 0.05;          // 5% to host
const REF_PREFIX = 'miamistylerentals-'; // strip this to get the host slug

module.exports = async (req, res) => {
  // CORS — allow any origin to POST. Security comes from the secret in the URL,
  // NOT from origin checking (FareHarbor servers won't send a meaningful Origin
  // anyway). This lets the standalone webhook-tester.html work from file:// too.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-refstay-secret');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // 1. Method guard
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Secret validation
  const expected = process.env.FH_WEBHOOK_SECRET;
  if (!expected) {
    console.error('[webhook] FH_WEBHOOK_SECRET not set in env');
    return res.status(500).json({ error: 'Server misconfigured' });
  }
  const provided = (req.query && req.query.secret) || req.headers['x-refstay-secret'];
  if (!provided || provided !== expected) {
    console.warn('[webhook] Invalid secret');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 3. Parse payload (Vercel parses JSON bodies automatically for application/json)
  const body = req.body || {};
  const eventType = body.event_type || body.type || 'booking.created';
  const booking = body.booking || body.data || body;

  if (!booking) {
    return res.status(400).json({ error: 'No booking payload' });
  }

  // 4. Extract fields. FH webhook payload structure (per FH docs):
  //    booking.uuid                  → unique id
  //    booking.display_id            → human-readable id like "351165534"
  //    booking.status                → 'booked' / 'canceled' / etc.
  //    booking.marketing.sub_source  → our "miamistylerentals-jean-acosta"
  //    booking.contact.name          → guest's full name
  //    booking.amount_paid           → number in dollars
  //    booking.availability.start_at → ISO date when activity happens
  //    booking.items[0].title        → activity name
  const fhUuid = booking.uuid || booking.pk || null;
  const displayId = String(booking.display_id || booking.id || '');
  const status = String(booking.status || '').toLowerCase();
  const subSource = (booking.marketing && (booking.marketing.sub_source || booking.marketing.subSource)) ||
                    booking.sub_source || booking.subSource || '';
  const customerFull = (booking.contact && booking.contact.name) || booking.customer_name || '';
  const customerFirst = customerFull.split(/\s+/)[0] || null; // privacy — first name only
  const grossAmount = Number(booking.amount_paid || booking.amount_total || booking.total || 0);
  const startAt = (booking.availability && booking.availability.start_at) || booking.start_at || booking.date || null;
  const bookingDate = parseDateOnly(startAt);
  const items = Array.isArray(booking.items) ? booking.items : [];
  const activity = (items[0] && (items[0].title || items[0].headline)) || booking.activity || null;

  // 5. Pull host slug from sub_source
  let hostSlug = '';
  if (typeof subSource === 'string' && subSource.toLowerCase().startsWith(REF_PREFIX)) {
    hostSlug = subSource.slice(REF_PREFIX.length).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 64);
  }
  if (!hostSlug) {
    // Not a Refstay-attributed booking — acknowledge and skip
    console.log('[webhook] No host slug, skipping. sub_source=', subSource);
    return res.status(200).json({ ok: true, skipped: 'no-host-slug' });
  }

  // 6. Map event to status
  let dbStatus = 'pending';
  if (eventType.endsWith('.canceled') || /cancel/.test(status)) dbStatus = 'canceled';
  else if (/paid|complet/.test(status)) dbStatus = 'paid';
  else dbStatus = 'pending';

  // 7. Compute commission (5% of gross, but $0 if canceled)
  const commission = dbStatus === 'canceled' ? 0 : round2(grossAmount * COMMISSION_RATE);

  // 8. Look up host_id from slug
  const supabase = createSupabaseClient();
  if (!supabase) {
    return res.status(500).json({ error: 'Server misconfigured (Supabase env)' });
  }

  // Resolve the slug to a host_id. The slug might be either:
  //   (a) the host's primary slug (hosts.slug), or
  //   (b) one of their tracking aliases (host_aliases.alias).
  // resolve_host_id() handles both. We keep the original alias in host_slug
  // so per-alias stats group correctly in the dashboard.
  let hostId = null;
  try {
    const { data: resolved, error: rpcErr } = await supabase
      .rpc('resolve_host_id', { input_slug: hostSlug });
    if (rpcErr) throw rpcErr;
    if (resolved) hostId = resolved;
  } catch (e) {
    console.error('[webhook] host resolve error:', e);
  }
  // Even if host_id is null (host not found / pending signup), still log the
  // booking — keyed by slug. The host may have signed up afterwards.

  // 9. Upsert by fh_booking_uuid (idempotent)
  const payload = {
    host_id: hostId,
    host_slug: hostSlug,
    fh_booking_uuid: fhUuid,
    fh_display_id: displayId,
    activity,
    customer_name: customerFirst,
    booking_date: bookingDate,
    gross_amount: grossAmount || null,
    amount: commission,
    status: dbStatus,
    marketing_source: subSource,
    raw_event: body,
    updated_at: new Date().toISOString(),
  };

  // Upsert by fh_booking_uuid (idempotent). The .select() chain forces PostgREST
  // to return the inserted row, so we can confirm the write succeeded and grab
  // the new id. On error, we surface enough detail to debug from Vercel logs.
  let upsertResult;
  try {
    if (fhUuid) {
      upsertResult = await supabase
        .from('bookings')
        .upsert(payload, { onConflict: 'fh_booking_uuid' })
        .select('id');
    } else {
      upsertResult = await supabase
        .from('bookings')
        .insert(payload)
        .select('id');
    }
  } catch (e) {
    console.error('[webhook] Upsert threw:', e);
    return res.status(500).json({
      error: 'DB write threw',
      detail: String(e.message || e),
    });
  }

  if (upsertResult.error) {
    console.error('[webhook] Upsert error:', upsertResult.error);
    return res.status(500).json({
      error: 'DB write failed',
      detail: upsertResult.error.message || String(upsertResult.error),
      code: upsertResult.error.code,
      hint: upsertResult.error.hint,
    });
  }

  const insertedRow = Array.isArray(upsertResult.data) && upsertResult.data[0];

  // Log a compact line for Vercel logs (audit trail without spamming)
  console.log(`[webhook] OK host=${hostSlug} uuid=${fhUuid} commission=${commission} status=${dbStatus} id=${insertedRow ? insertedRow.id : 'n/a'}`);

  // Fire-and-forget: send "new booking" email to the host. We don't await it
  // or block the response — even if Resend is down, FareHarbor gets 200 OK
  // and the booking row is safe in Supabase. Emails can be re-sent later.
  if (hostId && dbStatus === 'pending') {
    sendNewBookingEmail({
      supabase,
      hostId,
      customer_name: customerFirst,
      activity,
      gross_amount: grossAmount,
      commission,
      booking_date: bookingDate,
    }).catch(e => console.warn('[webhook] email send failed (non-blocking):', e.message || e));

    // Fire-and-forget: ping Slack/Discord
    pingSlackOnBooking({
      supabase,
      hostId,
      hostSlug,
      customer_name: customerFirst,
      activity,
      gross_amount: grossAmount,
      commission,
    }).catch(e => console.warn('[webhook] slack notify failed (non-blocking):', e.message || e));
  }

  // Concise success response (FareHarbor only needs to know we accepted it).
  return res.status(200).json({
    ok: true,
    host_slug: hostSlug,
    commission,
    status: dbStatus,
    booking_id: insertedRow ? insertedRow.id : null,
  });
};

// Fire-and-forget email notification: looks up the host's email + name, then
// sends the "new booking" template via Resend. Failures are logged but never
// block the webhook response.
async function sendNewBookingEmail({ supabase, hostId, customer_name, activity, gross_amount, commission, booking_date }) {
  try {
    const { data: host } = await supabase
      .from('hosts')
      .select('email, name')
      .eq('id', hostId)
      .maybeSingle();
    if (!host || !host.email) {
      console.log('[webhook] no host email found, skipping notification');
      return;
    }
    const { sendEmail } = require('./_email-client');
    const templates = require('./_email-templates');
    const { subject, html } = templates.newBooking({
      name: host.name,
      customer_name,
      activity,
      gross_amount,
      commission,
      booking_date,
    });
    const result = await sendEmail({ to: host.email, subject, html });
    if (result.ok) console.log('[webhook] booking email sent id=' + result.id);
    else console.warn('[webhook] booking email failed:', result.error);
  } catch (e) {
    console.warn('[webhook] booking email threw:', e.message || e);
  }
}

// Fire-and-forget Slack/Discord notification for new booking
async function pingSlackOnBooking({ supabase, hostId, hostSlug, customer_name, activity, gross_amount, commission }) {
  try {
    const { data: host } = await supabase.from('hosts').select('name').eq('id', hostId).maybeSingle();
    const { notifyWebhook, COLOR } = require('./_slack-client');
    await notifyWebhook({
      text: `💸 New booking — $${commission} commission for ${host && host.name ? host.name : hostSlug}`,
      title: `💸 New booking — $${commission} commission`,
      body: `*${activity || 'Activity'}* booked by ${customer_name || 'a guest'} via ${host && host.name ? host.name : hostSlug}'s link.`,
      color: COLOR.booking,
      fields: [
        { label: 'Host', value: `/r/${hostSlug}`, short: true },
        { label: 'Activity', value: activity || '—', short: true },
        { label: 'Gross', value: `$${gross_amount || 0}`, short: true },
        { label: 'Commission (5%)', value: `$${commission || 0}`, short: true },
      ],
      url: 'https://refstay.com/admin',
    });
  } catch (e) {
    console.warn('[webhook] slack threw:', e.message || e);
  }
}

// ----- helpers -----

function round2(n) {
  if (!isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

function parseDateOnly(iso) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  } catch (e) {
    return null;
  }
}

// Lazy-require Supabase client. The serverless function runs in a Node.js
// environment that supports require() (Vercel installs deps via package.json).
function createSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try {
    const { createClient } = require('@supabase/supabase-js');
    return createClient(url, key, { auth: { persistSession: false } });
  } catch (e) {
    console.error('[webhook] Failed to load supabase-js:', e);
    return null;
  }
}
