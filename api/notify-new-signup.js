// ============================================================================
// Refstay — new signup notification endpoint
// Called from the client immediately after a successful signup (or from a
// Supabase database webhook). Looks up host details and pings Slack.
//
// Public endpoint (anyone can call it) — but it only does anything if the
// host_id resolves to a real row in the DB. Safe to expose.
// ============================================================================

const { createClient } = require('@supabase/supabase-js');
const { notifyWebhook, COLOR } = require('./_slack-client');

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch (e) {
    return res.status(400).json({ ok: false, error: 'Invalid JSON' });
  }

  // Two possible shapes:
  //   { host_id: '...' }   - called by client after signup
  //   { record: {...} }    - called by Supabase database webhook
  const hostId = body.host_id || (body.record && body.record.id);
  if (!hostId) return res.status(400).json({ ok: false, error: 'host_id required' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return res.status(500).json({ ok: false, error: 'Supabase env vars missing' });

  const sb = createClient(supabaseUrl, serviceKey);

  // Look up host
  const { data: host, error } = await sb
    .from('hosts')
    .select('id, slug, name, email, zone, listing, is_admin, joined')
    .eq('id', hostId)
    .single();
  if (error || !host) return res.status(404).json({ ok: false, error: 'Host not found' });

  // Skip notify for admin signups (you, testing)
  if (host.is_admin) return res.status(200).json({ ok: true, skipped: 'admin' });

  // Count total hosts (for context: "you're host #N")
  const { count: totalCount } = await sb
    .from('hosts')
    .select('*', { count: 'exact', head: true });

  const fields = [
    { label: 'Name', value: host.name || '—', short: true },
    { label: 'Slug', value: `/r/${host.slug}`, short: true },
    { label: 'Email', value: host.email || '—', short: true },
    { label: 'Zone', value: host.zone || '—', short: true },
  ];
  if (host.listing) fields.push({ label: 'Listing', value: host.listing, short: false });
  fields.push({ label: 'Total hosts now', value: String(totalCount || '?'), short: true });

  const slackResult = await notifyWebhook({
    text: `🎉 New Refstay signup: ${host.name || host.slug}`,
    title: `🎉 New signup — ${host.name || host.slug}`,
    body: `*${host.name || host.slug}* just joined Refstay. Open the admin to see their full profile.`,
    color: COLOR.signup,
    fields,
    url: `https://refstay.com/admin`,
  });

  return res.status(200).json({ ok: true, notified: slackResult.ok });
};
