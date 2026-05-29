// ============================================================================
// Shared Resend client wrapper. Each endpoint imports sendEmail() and uses it.
// ============================================================================

const { BRAND } = require('./_email-templates');

/**
 * Send an email via Resend.
 * @param {Object} opts
 * @param {string} opts.to - recipient email
 * @param {string} opts.subject
 * @param {string} opts.html
 * @param {string} [opts.from] - defaults to BRAND.fromEmail
 * @param {string} [opts.reply_to] - defaults to BRAND.supportEmail
 * @returns {Promise<{ok: boolean, id?: string, error?: string}>}
 */
async function sendEmail({ to, subject, html, from, reply_to }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[email] RESEND_API_KEY not set');
    return { ok: false, error: 'RESEND_API_KEY missing' };
  }
  if (!to) return { ok: false, error: 'No recipient' };

  try {
    const { Resend } = require('resend');
    const resend = new Resend(apiKey);

    const result = await resend.emails.send({
      from: from || `Refstay <${BRAND.fromEmail}>`,
      to: [to],
      subject,
      html,
      reply_to: reply_to || BRAND.supportEmail,
    });

    if (result.error) {
      console.error('[email] Resend error:', result.error);
      return { ok: false, error: result.error.message || String(result.error) };
    }

    return { ok: true, id: result.data && result.data.id };
  } catch (e) {
    console.error('[email] Threw:', e);
    return { ok: false, error: String(e.message || e) };
  }
}

module.exports = { sendEmail };
