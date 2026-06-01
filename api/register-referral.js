// ============================================================================
// Refstay — register a host-refer-host relationship
// Called from the client after signup, if the signup came via an invite link.
//
// Body: { host_id, inviter_slug }
//
// Flow:
//   1. Look up inviter_slug → inviter_id
//   2. Insert into referrals table (status='pending')
//   3. Update hosts.referred_by on the new host
//   4. Ping Slack so admin sees new referral
//
// Public endpoint — but does nothing useful if host_id doesn't exist.
// Self-referral and duplicate pairs are blocked by DB constraints.
// ============================================================================

const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

  let body = {};
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); }
  catch (e) { return res.status(400).json({ ok: false, error: 'Invalid JSON' }); }

  const { host_id, inviter_slug } = body;
  if (!host_id || !inviter_slug) {
    return res.status(400).json({ ok: false, error: 'host_id and inviter_slug required' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ ok: false, error: 'Supabase env vars missing' });
  }

  const sb = createClient(supabaseUrl, serviceKey);

  // 1. Resolve inviter
  const cleanSlug = String(inviter_slug).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 60);
  const { data: inviter, error: invErr } = await sb
    .from('hosts')
    .select('id, slug, name')
    .eq('slug', cleanSlug)
    .maybeSingle();
  if (invErr || !inviter) {
    return res.status(404).json({ ok: false, error: 'Inviter not found' });
  }
  if (inviter.id === host_id) {
    return res.status(400).json({ ok: false, error: 'Cannot refer yourself' });
  }

  // 2. Verify referred host exists
  const { data: referred } = await sb
    .from('hosts')
    .select('id, slug, name, email, referred_by')
    .eq('id', host_id)
    .maybeSingle();
  if (!referred) {
    return res.status(404).json({ ok: false, error: 'Referred host not found' });
  }

  // If already has a referred_by, don't overwrite
  if (referred.referred_by) {
    return res.status(200).json({ ok: true, note: 'Already referred', skipped: true });
  }

  // 3. Insert referral row
  const { error: insErr } = await sb
    .from('referrals')
    .insert({
      inviter_id: inviter.id,
      referred_id: host_id,
      status: 'pending',
      bonus_amount: 25.00,
    });
  if (insErr) {
    // Unique constraint fired = duplicate, OK
    if (!String(insErr.message || '').includes('duplicate')) {
      console.error('[register-referral] insert failed:', insErr);
    }
  }

  // 4. Update host.referred_by
  await sb
    .from('hosts')
    .update({ referred_by: inviter.id })
    .eq('id', host_id);

  // 5. Slack ping (fire-and-forget)
  try {
    const { notifyWebhook, COLOR } = require('./_slack-client');
    notifyWebhook({
      text: `🤝 Referral: ${referred.name || referred.slug} was invited by ${inviter.name || inviter.slug}`,
      title: `🤝 New referral — ${inviter.slug} → ${referred.slug}`,
      body: `*${inviter.name || inviter.slug}* invited *${referred.name || referred.slug}*. Both unlock $25 when ${referred.slug} gets their first paid booking.`,
      color: COLOR.signup,
      fields: [
        { label: 'Inviter', value: `/r/${inviter.slug}`, short: true },
        { label: 'Referred', value: `/r/${referred.slug}`, short: true },
        { label: 'Bonus each', value: '$25 (on first paid booking)', short: false },
      ],
      url: 'https://refstay.com/admin',
    }).catch(() => {});
  } catch (_) { /* non-fatal */ }

  return res.status(200).json({
    ok: true,
    inviter_slug: inviter.slug,
    inviter_name: inviter.name,
    bonus_amount: 25,
  });
};
