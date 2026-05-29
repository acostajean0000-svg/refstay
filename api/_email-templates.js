// ============================================================================
// Refstay email templates (transactional emails sent via Resend)
//
// Each template returns { subject, html, text } so the same function works
// across all client types. CSS is inlined (Gmail/Outlook strip <style>).
// Tested on Gmail, Apple Mail, Outlook.com.
// ============================================================================

const BRAND = {
  name: 'Refstay',
  primary: '#FF385C',
  ink: '#0B1020',
  ink2: '#334155',
  muted: '#64748B',
  bg: '#FFFFFF',
  bgSoft: '#F8FAFC',
  border: '#E2E8F0',
  accent: '#00D97E',
  gradient: 'linear-gradient(135deg, #FF385C 0%, #FF7A45 35%, #7C3AED 100%)',
  url: 'https://refstay.com',
  supportEmail: 'support@refstay.com',
  fromEmail: 'notifications@refstay.com',
};

function escape(s) { return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function fmtMoney(n) { return '$' + (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

// Shared base template — header + body + footer
function wrap({ preview, body, footer_note }) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${BRAND.name}</title></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.ink};line-height:1.5;">
<!-- Preview text (shown in inbox preview) -->
<div style="display:none;font-size:1px;color:#F8FAFC;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escape(preview)}</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F8FAFC;">
  <tr><td align="center" style="padding:32px 16px;">

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="580" style="max-width:580px;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.05);">

      <!-- Header with gradient + logo -->
      <tr><td style="background:${BRAND.gradient};padding:28px 32px;text-align:left;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding-right:12px;">
              <div style="width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,0.18);display:inline-block;text-align:center;line-height:40px;color:#FFFFFF;font-weight:900;font-size:20px;">R</div>
            </td>
            <td style="vertical-align:middle;">
              <div style="color:#FFFFFF;font-weight:800;font-size:20px;letter-spacing:-0.02em;">Refstay</div>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- Body -->
      <tr><td style="padding:36px 36px 24px;">
        ${body}
      </td></tr>

      <!-- Footer note (if any) -->
      ${footer_note ? `
      <tr><td style="padding:0 36px 24px;">
        <div style="background:${BRAND.bgSoft};border-radius:10px;padding:14px 18px;font-size:13px;color:${BRAND.ink2};">
          ${footer_note}
        </div>
      </td></tr>
      ` : ''}

      <!-- Footer -->
      <tr><td style="padding:24px 36px 28px;border-top:1px solid ${BRAND.border};background:#FAFBFC;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="font-size:12px;color:${BRAND.muted};line-height:1.6;">
              You're receiving this because you signed up for ${BRAND.name}.<br>
              <a href="${BRAND.url}/dashboard.html" style="color:${BRAND.primary};text-decoration:none;font-weight:600;">Dashboard</a> ·
              <a href="${BRAND.url}/privacy" style="color:${BRAND.muted};text-decoration:none;">Privacy</a> ·
              <a href="mailto:${BRAND.supportEmail}?subject=Unsubscribe" style="color:${BRAND.muted};text-decoration:none;">Unsubscribe</a>
            </td>
          </tr>
          <tr><td style="padding-top:12px;font-size:11px;color:${BRAND.muted};">
            © 2026 Refstay. Not affiliated with Airbnb, Inc.
          </td></tr>
        </table>
      </td></tr>

    </table>

  </td></tr>
</table>
</body></html>`;
}

// Helper: render a CTA button
function ctaButton(text, href) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
    <tr><td style="background:${BRAND.gradient};border-radius:10px;">
      <a href="${href}" style="display:inline-block;padding:14px 28px;color:#FFFFFF;font-weight:700;font-size:15px;text-decoration:none;border-radius:10px;">${text}</a>
    </td></tr>
  </table>`;
}

// ============================================================================
// 1. WELCOME EMAIL — sent after signup
// ============================================================================
function welcome({ name, slug }) {
  const firstName = (name || 'friend').split(' ')[0];
  const link = `${BRAND.url}/r/${slug}`;

  const body = `
    <h1 style="font-size:26px;font-weight:800;letter-spacing:-0.02em;margin:0 0 16px;color:${BRAND.ink};">Welcome to Refstay, ${escape(firstName)} 🌴</h1>
    <p style="font-size:16px;color:${BRAND.ink2};margin:0 0 18px;">Your account is set up and your unique referral link is ready to share.</p>

    <div style="background:${BRAND.bgSoft};border:1px solid ${BRAND.border};border-radius:12px;padding:18px 20px;margin:0 0 24px;">
      <div style="font-size:11px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.08em;font-weight:700;margin-bottom:6px;">Your link</div>
      <div style="font-family:'SF Mono','Monaco','Menlo',monospace;font-size:15px;font-weight:600;color:${BRAND.primary};word-break:break-all;">${escape(link)}</div>
    </div>

    ${ctaButton('Open my dashboard →', `${BRAND.url}/dashboard.html`)}

    <h2 style="font-size:18px;font-weight:700;margin:28px 0 12px;color:${BRAND.ink};">3 quick wins for your first week</h2>
    <ol style="font-size:15px;color:${BRAND.ink2};padding-left:22px;margin:0 0 22px;line-height:1.7;">
      <li><strong>Add your link to your Airbnb welcome book</strong> — one line under "Things to do nearby" converts 30-50% of guests.</li>
      <li><strong>Star 5-10 favorite activities</strong> in your dashboard so guests see your top picks first.</li>
      <li><strong>Send the WhatsApp template at check-in</strong> — it's the highest-converting channel by far.</li>
    </ol>

    <p style="font-size:15px;color:${BRAND.ink2};margin:18px 0;">Questions? Just reply to this email — we read every message.</p>
    <p style="font-size:15px;color:${BRAND.ink2};margin:18px 0 0;">— The Refstay team</p>
  `;

  return {
    subject: `Welcome to Refstay — your link is ready 🌴`,
    html: wrap({
      preview: `Your unique referral link is ${link} — drop it in your welcome book and start earning 5% on every activity your guests book.`,
      body,
    }),
  };
}

// ============================================================================
// 2. NEW BOOKING EMAIL — sent when webhook receives a booking
// ============================================================================
function newBooking({ name, slug, customer_name, activity, gross_amount, commission, booking_date }) {
  const firstName = (name || 'friend').split(' ')[0];
  const customerFirst = (customer_name || 'A guest').split(' ')[0];
  const fmtDate = booking_date ? new Date(booking_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null;

  const body = `
    <div style="font-size:46px;margin-bottom:8px;">🎉</div>
    <h1 style="font-size:28px;font-weight:800;letter-spacing:-0.02em;margin:0 0 16px;color:${BRAND.ink};">You earned ${fmtMoney(commission)}, ${escape(firstName)}!</h1>
    <p style="font-size:16px;color:${BRAND.ink2};margin:0 0 24px;">One of your guests just booked an activity through your link. Here are the details:</p>

    <div style="background:${BRAND.bgSoft};border:1px solid ${BRAND.border};border-radius:12px;padding:20px 22px;margin:0 0 22px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:6px 0;font-size:13px;color:${BRAND.muted};font-weight:600;width:40%;">Guest</td>
          <td style="padding:6px 0;font-size:15px;color:${BRAND.ink};font-weight:700;">${escape(customerFirst)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:${BRAND.muted};font-weight:600;">Activity</td>
          <td style="padding:6px 0;font-size:15px;color:${BRAND.ink};font-weight:700;">${escape(activity || 'Activity')}</td>
        </tr>
        ${fmtDate ? `<tr>
          <td style="padding:6px 0;font-size:13px;color:${BRAND.muted};font-weight:600;">Activity date</td>
          <td style="padding:6px 0;font-size:15px;color:${BRAND.ink};font-weight:700;">${escape(fmtDate)}</td>
        </tr>` : ''}
        ${gross_amount ? `<tr>
          <td style="padding:6px 0;font-size:13px;color:${BRAND.muted};font-weight:600;">Booking total</td>
          <td style="padding:6px 0;font-size:15px;color:${BRAND.ink};font-weight:700;">${fmtMoney(gross_amount)}</td>
        </tr>` : ''}
        <tr style="border-top:1px solid ${BRAND.border};">
          <td style="padding:14px 0 6px;font-size:13px;color:${BRAND.muted};font-weight:600;">Your commission (5%)</td>
          <td style="padding:14px 0 6px;font-size:22px;color:${BRAND.accent};font-weight:800;font-family:'SF Mono','Monaco','Menlo',monospace;">${fmtMoney(commission)}</td>
        </tr>
      </table>
    </div>

    ${ctaButton('See it in your dashboard →', `${BRAND.url}/dashboard.html`)}

    <p style="font-size:14px;color:${BRAND.muted};margin:18px 0;line-height:1.6;">This commission is pending and will be paid out on the 5th of next month (assuming the activity completes as scheduled). Keep sharing your link to stack more!</p>
  `;

  return {
    subject: `🎉 New booking — ${fmtMoney(commission)} commission from ${customerFirst}`,
    html: wrap({
      preview: `${customerFirst} just booked ${activity || 'an activity'} through your link. You earned ${fmtMoney(commission)}.`,
      body,
    }),
  };
}

// ============================================================================
// 3. PAYMENT SENT EMAIL — sent when admin marks bookings as paid
// ============================================================================
function paymentSent({ name, amount, method, destination, booking_count }) {
  const firstName = (name || 'friend').split(' ')[0];
  const methodLabel = method === 'paypal' ? 'PayPal' : method === 'zelle' ? 'Zelle' : (method || 'your account');
  const maskedDest = (() => {
    if (!destination) return '';
    if (destination.indexOf('@') > 1) return destination[0] + '***' + destination.slice(destination.indexOf('@'));
    const digits = destination.replace(/\D/g, '');
    if (digits.length >= 4) return '***-***-' + digits.slice(-4);
    return '***';
  })();

  const body = `
    <div style="font-size:46px;margin-bottom:8px;">💸</div>
    <h1 style="font-size:28px;font-weight:800;letter-spacing:-0.02em;margin:0 0 16px;color:${BRAND.ink};">Payment sent — ${fmtMoney(amount)}</h1>
    <p style="font-size:16px;color:${BRAND.ink2};margin:0 0 24px;">We just sent your ${methodLabel} payout, ${escape(firstName)}. Here's the receipt:</p>

    <div style="background:${BRAND.bgSoft};border:1px solid ${BRAND.border};border-radius:12px;padding:20px 22px;margin:0 0 24px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:6px 0;font-size:13px;color:${BRAND.muted};font-weight:600;width:40%;">Amount</td>
          <td style="padding:6px 0;font-size:20px;color:${BRAND.accent};font-weight:800;font-family:'SF Mono','Monaco','Menlo',monospace;">${fmtMoney(amount)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:${BRAND.muted};font-weight:600;">Method</td>
          <td style="padding:6px 0;font-size:15px;color:${BRAND.ink};font-weight:700;">${escape(methodLabel)}</td>
        </tr>
        ${maskedDest ? `<tr>
          <td style="padding:6px 0;font-size:13px;color:${BRAND.muted};font-weight:600;">Sent to</td>
          <td style="padding:6px 0;font-size:15px;color:${BRAND.ink};font-weight:700;font-family:'SF Mono','Monaco','Menlo',monospace;">${escape(maskedDest)}</td>
        </tr>` : ''}
        ${booking_count ? `<tr>
          <td style="padding:6px 0;font-size:13px;color:${BRAND.muted};font-weight:600;">Bookings covered</td>
          <td style="padding:6px 0;font-size:15px;color:${BRAND.ink};font-weight:700;">${booking_count}</td>
        </tr>` : ''}
      </table>
    </div>

    <p style="font-size:14px;color:${BRAND.ink2};margin:18px 0;line-height:1.6;">${methodLabel === 'PayPal' ? 'PayPal usually delivers in 1-3 business days. Check your PayPal account.' : methodLabel === 'Zelle' ? 'Zelle is instant. Check your bank account now.' : 'You should see the payment shortly.'}</p>

    ${ctaButton('See your dashboard →', `${BRAND.url}/dashboard.html`)}

    <p style="font-size:14px;color:${BRAND.muted};margin:18px 0;line-height:1.6;">Need anything? Just reply to this email — we read every message.</p>
  `;

  return {
    subject: `💸 Payment sent — ${fmtMoney(amount)} via ${methodLabel}`,
    html: wrap({
      preview: `Your ${methodLabel} payout of ${fmtMoney(amount)} has been sent. Should arrive ${methodLabel === 'Zelle' ? 'instantly' : 'in 1-3 days'}.`,
      body,
    }),
  };
}

module.exports = {
  welcome,
  newBooking,
  paymentSent,
  BRAND,
};
