// ============================================================================
// Refstay — Slack/Discord notifier (fire-and-forget)
// Reads NOTIFY_WEBHOOK_URL from env. Works with:
//   - Slack incoming webhooks: https://hooks.slack.com/services/...
//   - Discord webhooks: append /slack to the URL (Discord accepts Slack format)
//
// All calls are best-effort — failures don't bubble up to disrupt main logic.
// ============================================================================

const COLOR = {
  signup: '#FF7A45',
  booking: '#00C8B8',
  message: '#7C3AED',
  payout: '#F4B942',
  error: '#DC2626',
};

/**
 * Send a notification to the configured webhook.
 * @param {Object} opts
 * @param {string} opts.text   Plain-text fallback (shown on desktop notification)
 * @param {string} [opts.title]  Bold header in the attachment
 * @param {string} [opts.body]   Body text (markdown supported in Slack)
 * @param {string} [opts.color]  Hex color for the attachment sidebar (e.g. '#00C8B8')
 * @param {Array<{label:string, value:string, short?:boolean}>} [opts.fields]
 * @param {string} [opts.url]    Optional action URL (admin link)
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
async function notifyWebhook(opts) {
  const webhookUrl = process.env.NOTIFY_WEBHOOK_URL;
  if (!webhookUrl) {
    // Silently skip if not configured — not an error
    return { ok: false, error: 'NOTIFY_WEBHOOK_URL not set' };
  }

  const { text, title, body, color, fields, url } = opts;

  // Slack-format payload (Discord also accepts this if URL ends in /slack)
  const attachment = {
    color: color || '#FF385C',
    title: title || undefined,
    title_link: url || undefined,
    text: body || undefined,
    fields: (fields || []).map(f => ({
      title: f.label,
      value: f.value,
      short: f.short !== false,
    })),
    footer: 'Refstay',
    footer_icon: 'https://refstay.com/favicon.ico',
    ts: Math.floor(Date.now() / 1000),
  };

  const payload = {
    text: text || title || 'Refstay notification',
    attachments: [attachment],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      console.error('[slack] webhook returned', res.status, txt);
      return { ok: false, error: `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    console.error('[slack] threw:', e);
    return { ok: false, error: String(e.message || e) };
  }
}

module.exports = { notifyWebhook, COLOR };
