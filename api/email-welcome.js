// ============================================================================
// /api/email-welcome — send welcome email after signup
//
// Called from index.html signup form after Supabase auth.signUp() succeeds.
// We look up the host row in Supabase to confirm they exist + grab slug.
//
// POST /api/email-welcome
// Body: { email, name?, slug? }
//
// No secret protection — anyone could call this, but the worst they could do
// is trigger emails to addresses already in our hosts table (rate-limited by
// Resend itself + we only send if a matching host row exists).
// ============================================================================

const { sendEmail } = require('./_email-client');
const templates = require('./_email-templates');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const body = req.body || {};
  const email = (body.email || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  // Look up the host so we only send to registered users + grab their slug
  let name = body.name;
  let slug = body.slug;
  try {
    const { createClient } = require('@supabase/supabase-js');
    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { data: host } = await sb
      .from('hosts')
      .select('slug, name')
      .eq('email', email)
      .maybeSingle();
    if (host) {
      slug = slug || host.slug;
      name = name || host.name;
    }
  } catch (e) {
    console.warn('[welcome] lookup failed:', e.message || e);
  }

  if (!slug) {
    // No slug = host row not created yet (Supabase trigger usually creates it
    // within 1 second of signup, but a race is possible). Try again later, or
    // just send with a generic slug.
    console.log('[welcome] no host slug found for', email, '— sending without link');
    slug = '';
  }

  const { subject, html } = templates.welcome({ name, slug });
  const result = await sendEmail({ to: email, subject, html });
  if (!result.ok) return res.status(500).json({ error: result.error });
  return res.status(200).json({ ok: true, id: result.id });
};
