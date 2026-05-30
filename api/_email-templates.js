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

// ============================================================================
// 4. NEW MESSAGE EMAIL — sent when host writes to admin OR admin replies to host
// ============================================================================
function newMessage({ recipient_name, from_label, body, is_admin_reply }) {
  const firstName = (recipient_name || 'friend').split(' ')[0];
  const ctaText = is_admin_reply ? 'Read & reply →' : 'Read & reply in admin →';
  const ctaUrl = is_admin_reply ? `${BRAND.url}/dashboard.html` : `${BRAND.url}/admin`;
  const title = is_admin_reply
    ? `New reply from ${from_label || 'the Refstay team'}`
    : `New message from ${from_label || 'a host'}`;

  const html_body = `
    <div style="font-size:36px;margin-bottom:6px;">💬</div>
    <h1 style="font-size:24px;font-weight:800;letter-spacing:-0.02em;margin:0 0 12px;color:${BRAND.ink};">${escape(title)}</h1>
    <p style="font-size:15px;color:${BRAND.ink2};margin:0 0 18px;">Hi ${escape(firstName)} — you have a new message:</p>

    <div style="background:${BRAND.bgSoft};border-left:4px solid ${BRAND.primary};border-radius:0 10px 10px 0;padding:16px 20px;margin:0 0 22px;font-size:15px;color:${BRAND.ink};line-height:1.6;white-space:pre-wrap;">
      ${escape((body || '').slice(0, 1000))}${body && body.length > 1000 ? '…' : ''}
    </div>

    ${ctaButton(ctaText, ctaUrl)}

    <p style="font-size:13px;color:${BRAND.muted};margin:18px 0 0;line-height:1.5;">Reply by opening the conversation in your ${is_admin_reply ? 'dashboard' : 'admin panel'}.</p>
  `;

  return {
    subject: title,
    html: wrap({
      preview: (body || '').slice(0, 140),
      body: html_body,
    }),
  };
}

// ============================================================================
// 5. ONBOARDING DAY 3 — nudge hosts who haven't copied their link yet
// ============================================================================
function onboardingDay3({ name, slug }) {
  const firstName = (name || 'friend').split(' ')[0];
  const link = `${BRAND.url}/r/${slug}`;
  const guestPage = `${BRAND.url}/g/${slug}`;

  const body = `
    <h1 style="font-size:26px;font-weight:800;letter-spacing:-0.02em;margin:0 0 16px;color:${BRAND.ink};">3 days in — let's get your first booking, ${escape(firstName)} 🚀</h1>
    <p style="font-size:16px;color:${BRAND.ink2};margin:0 0 18px;">Welcome again! Most hosts get their first booking within 2 weeks of sharing their link. Here's the fastest path:</p>

    <h2 style="font-size:18px;font-weight:700;margin:24px 0 12px;color:${BRAND.ink};">The 5-minute first-booking checklist</h2>

    <div style="background:${BRAND.bgSoft};border-radius:12px;padding:18px 22px;margin:0 0 18px;">
      <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:14px;">
        <div style="font-size:22px;line-height:1;">1️⃣</div>
        <div>
          <div style="font-weight:700;font-size:15px;color:${BRAND.ink};margin-bottom:2px;">Add your link to Airbnb's "House manual"</div>
          <div style="font-size:13px;color:${BRAND.muted};">One line under "Things to do nearby" — guests read it before arrival.</div>
        </div>
      </div>
      <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:14px;">
        <div style="font-size:22px;line-height:1;">2️⃣</div>
        <div>
          <div style="font-weight:700;font-size:15px;color:${BRAND.ink};margin-bottom:2px;">Send the WhatsApp template at check-in</div>
          <div style="font-size:13px;color:${BRAND.muted};">Copy from the dashboard. This is your highest-converting channel.</div>
        </div>
      </div>
      <div style="display:flex;align-items:flex-start;gap:12px;">
        <div style="font-size:22px;line-height:1;">3️⃣</div>
        <div>
          <div style="font-weight:700;font-size:15px;color:${BRAND.ink};margin-bottom:2px;">Print a welcome card and leave it on the table</div>
          <div style="font-size:13px;color:${BRAND.muted};">Free templates in your dashboard — letter-size, color print.</div>
        </div>
      </div>
    </div>

    <div style="background:${BRAND.bgSoft};border:1px solid ${BRAND.border};border-radius:12px;padding:18px 20px;margin:0 0 24px;">
      <div style="font-size:11px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.08em;font-weight:700;margin-bottom:6px;">Your link</div>
      <div style="font-family:'SF Mono','Monaco','Menlo',monospace;font-size:15px;font-weight:600;color:${BRAND.primary};word-break:break-all;">${escape(link)}</div>
      <div style="font-size:13px;color:${BRAND.muted};margin-top:8px;">Preview the page guests see: <a href="${guestPage}" style="color:${BRAND.primary};font-weight:600;text-decoration:none;">${escape(guestPage)}</a></div>
    </div>

    ${ctaButton('Copy my link from dashboard →', `${BRAND.url}/dashboard.html`)}

    <p style="font-size:14px;color:${BRAND.muted};margin:22px 0 0;line-height:1.6;">Stuck on anything? Just reply — we'll personally help you get set up.</p>
  `;

  return {
    subject: `${escape(firstName)}, your first booking is 1 link share away 🌴`,
    html: wrap({
      preview: `3 quick wins to get your first Refstay booking this week. Most hosts earn their first commission within 14 days.`,
      body,
    }),
  };
}

// ============================================================================
// 6. ONBOARDING DAY 7 — nudge hosts who haven't favorited or printed yet
// ============================================================================
function onboardingDay7({ name, slug }) {
  const firstName = (name || 'friend').split(' ')[0];
  const guestPage = `${BRAND.url}/g/${slug}`;

  const body = `
    <h1 style="font-size:26px;font-weight:800;letter-spacing:-0.02em;margin:0 0 16px;color:${BRAND.ink};">Make your page yours, ${escape(firstName)} ⭐</h1>
    <p style="font-size:16px;color:${BRAND.ink2};margin:0 0 18px;">A week ago you joined Refstay — thank you! Now the page guests see (<a href="${guestPage}" style="color:${BRAND.primary};font-weight:600;text-decoration:none;">${escape(guestPage.replace('https://', ''))}</a>) is using our default order.</p>

    <p style="font-size:16px;color:${BRAND.ink2};margin:0 0 22px;">Hosts who pick <strong>5–10 favorites</strong> get 2x more clicks per guest. It takes 90 seconds.</p>

    <h2 style="font-size:18px;font-weight:700;margin:24px 0 12px;color:${BRAND.ink};">Why favorites matter</h2>
    <ul style="font-size:15px;color:${BRAND.ink2};padding-left:22px;margin:0 0 22px;line-height:1.7;">
      <li><strong>Curated = trusted.</strong> Guests don't want 400 options. They want yours.</li>
      <li><strong>Your favorites bubble to the top</strong> of the guest page, ahead of everything else.</li>
      <li><strong>You can write a short note</strong> on each favorite ("Best sunset cruise — leaves from Bayside") that shows under the activity.</li>
    </ul>

    ${ctaButton('Star my 5 favorites →', `${BRAND.url}/dashboard.html?tab=direct`)}

    <h2 style="font-size:18px;font-weight:700;margin:32px 0 12px;color:${BRAND.ink};">Bonus: print a welcome asset</h2>
    <p style="font-size:15px;color:${BRAND.ink2};margin:0 0 18px;line-height:1.6;">A printed card or fridge magnet in your Airbnb converts ~30% of guests. We made 4 free designs you can print at home in 5 minutes — no tools needed.</p>

    ${ctaButton('See print templates →', `${BRAND.url}/dashboard.html?tab=print`)}

    <p style="font-size:14px;color:${BRAND.muted};margin:22px 0 0;line-height:1.6;">Reply if you'd like help picking favorites for your zone — we know which activities convert best in each area.</p>
  `;

  return {
    subject: `${escape(firstName)}, pick your 5 favorites (2x more clicks)`,
    html: wrap({
      preview: `Hosts who curate 5–10 favorites get 2x more guest engagement. Takes 90 seconds.`,
      body,
    }),
  };
}

// ============================================================================
// 7. ONBOARDING DAY 14 — for hosts who still have zero bookings
// ============================================================================
function onboardingDay14({ name, slug, clicks_total }) {
  const firstName = (name || 'friend').split(' ')[0];
  const hasClicks = (clicks_total || 0) > 0;

  const body = `
    <h1 style="font-size:26px;font-weight:800;letter-spacing:-0.02em;margin:0 0 16px;color:${BRAND.ink};">Two weeks in — let's make your first commission, ${escape(firstName)} 💰</h1>
    ${hasClicks
      ? `<p style="font-size:16px;color:${BRAND.ink2};margin:0 0 22px;">Good news: you've already had <strong>${clicks_total} click${clicks_total === 1 ? '' : 's'}</strong> on your link. That means guests are seeing it — now we just need to convert them.</p>`
      : `<p style="font-size:16px;color:${BRAND.ink2};margin:0 0 22px;">No clicks yet on your link — that means guests haven't seen it where they'd actually use it. Let's fix that.</p>`}

    <h2 style="font-size:18px;font-weight:700;margin:24px 0 12px;color:${BRAND.ink};">The #1 thing that gets bookings</h2>

    <div style="background:linear-gradient(135deg, #FFF8F4 0%, #FFFCFA 100%);border:1px solid ${BRAND.border};border-radius:12px;padding:22px 24px;margin:0 0 22px;">
      <div style="font-size:14px;font-weight:700;color:${BRAND.primary};text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">The Welcome Book trick</div>
      <p style="font-size:15px;color:${BRAND.ink2};margin:0 0 12px;line-height:1.6;">Open Airbnb → Listings → Your listing → Guest resources → House manual. Paste this exact line under "Things to do":</p>
      <div style="background:white;border:1px solid ${BRAND.border};border-radius:8px;padding:12px 14px;font-family:'SF Mono','Monaco','Menlo',monospace;font-size:13px;color:${BRAND.ink};margin:0 0 12px;line-height:1.5;">
        🌴 Best activities I'd recommend (jet skis, boats, sunset cruises):<br>
        ${escape(`${BRAND.url}/g/${slug}`)}
      </div>
      <div style="font-size:13px;color:${BRAND.muted};">Takes 30 seconds. Guests see it the moment they book the stay.</div>
    </div>

    <h2 style="font-size:18px;font-weight:700;margin:28px 0 12px;color:${BRAND.ink};">Other quick channels</h2>
    <ul style="font-size:15px;color:${BRAND.ink2};padding-left:22px;margin:0 0 22px;line-height:1.7;">
      <li><strong>Auto-reply on Airbnb</strong> — set it so every check-in message includes the link.</li>
      <li><strong>WhatsApp on check-in</strong> — copy the template from your dashboard.</li>
      <li><strong>Fridge magnet</strong> — print one, stick it on the fridge, guests see it daily.</li>
    </ul>

    ${ctaButton('Open my dashboard →', `${BRAND.url}/dashboard.html`)}

    <p style="font-size:14px;color:${BRAND.muted};margin:22px 0 0;line-height:1.6;">Honest question: what's stopping you from sharing the link more? Reply and we'll fix it together. We genuinely want you to make money on this.</p>
  `;

  return {
    subject: `${escape(firstName)} — 30 seconds to your first commission`,
    html: wrap({
      preview: `The one thing that gets Refstay hosts their first booking: a single line in the Airbnb welcome book.`,
      body,
    }),
  };
}

// ============================================================================
// 8. MONTHLY DIGEST — sent on the 1st of every month to all active hosts
// ============================================================================
function monthlyDigest({ name, slug, period_label, clicks, bookings, earnings, top_activity }) {
  const firstName = (name || 'friend').split(' ')[0];
  const hadActivity = (clicks || 0) > 0 || (bookings || 0) > 0;

  const body = `
    <div style="font-size:11px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.1em;font-weight:700;margin-bottom:8px;">Your ${escape(period_label || 'monthly')} report</div>
    <h1 style="font-size:28px;font-weight:800;letter-spacing:-0.02em;margin:0 0 16px;color:${BRAND.ink};">${hadActivity ? `Here's your month, ${escape(firstName)} 📊` : `Quiet month — let's change that, ${escape(firstName)}`}</h1>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px;">
      <tr>
        <td style="padding:6px;">
          <div style="background:${BRAND.bgSoft};border:1px solid ${BRAND.border};border-radius:12px;padding:18px 16px;text-align:center;">
            <div style="font-size:11px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.08em;font-weight:700;margin-bottom:4px;">Clicks</div>
            <div style="font-size:30px;font-weight:800;color:${BRAND.ink};font-family:'SF Mono','Monaco','Menlo',monospace;">${clicks || 0}</div>
          </div>
        </td>
        <td style="padding:6px;">
          <div style="background:${BRAND.bgSoft};border:1px solid ${BRAND.border};border-radius:12px;padding:18px 16px;text-align:center;">
            <div style="font-size:11px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.08em;font-weight:700;margin-bottom:4px;">Bookings</div>
            <div style="font-size:30px;font-weight:800;color:${BRAND.ink};font-family:'SF Mono','Monaco','Menlo',monospace;">${bookings || 0}</div>
          </div>
        </td>
        <td style="padding:6px;">
          <div style="background:linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 100%);border:1px solid #6EE7B7;border-radius:12px;padding:18px 16px;text-align:center;">
            <div style="font-size:11px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.08em;font-weight:700;margin-bottom:4px;">Earned</div>
            <div style="font-size:24px;font-weight:800;color:${BRAND.accent};font-family:'SF Mono','Monaco','Menlo',monospace;">${fmtMoney(earnings || 0)}</div>
          </div>
        </td>
      </tr>
    </table>

    ${top_activity ? `
      <div style="background:${BRAND.bgSoft};border-radius:12px;padding:16px 20px;margin:0 0 22px;">
        <div style="font-size:12px;color:${BRAND.muted};font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Top activity your guests booked</div>
        <div style="font-size:16px;font-weight:700;color:${BRAND.ink};">${escape(top_activity)}</div>
      </div>
    ` : ''}

    ${hadActivity
      ? `<p style="font-size:15px;color:${BRAND.ink2};margin:0 0 18px;line-height:1.6;">Want to grow next month? The single highest-leverage thing is making sure every guest sees your link before they arrive. <strong>Auto-replies and welcome books</strong> are doing the heavy lifting for top hosts.</p>`
      : `<p style="font-size:15px;color:${BRAND.ink2};margin:0 0 18px;line-height:1.6;">Hosts often have quiet months when they only share their link in person. Try adding it to your Airbnb welcome book this week — 80% of bookings come from there.</p>`}

    ${ctaButton('See full analytics →', `${BRAND.url}/dashboard.html`)}

    <p style="font-size:14px;color:${BRAND.muted};margin:22px 0 0;line-height:1.6;">Anything we can help with? Reply to this email — we read everything.</p>
  `;

  return {
    subject: hadActivity
      ? `📊 ${escape(period_label || 'Your month')}: ${bookings || 0} booking${bookings === 1 ? '' : 's'}, ${fmtMoney(earnings || 0)} earned`
      : `📊 Your ${escape(period_label || 'monthly')} Refstay report`,
    html: wrap({
      preview: hadActivity
        ? `${clicks || 0} clicks · ${bookings || 0} bookings · ${fmtMoney(earnings || 0)} earned this period.`
        : `Quiet month on your link. Quick fix inside — takes 30 seconds.`,
      body,
    }),
  };
}

module.exports = {
  welcome,
  newBooking,
  paymentSent,
  newMessage,
  onboardingDay3,
  onboardingDay7,
  onboardingDay14,
  monthlyDigest,
  BRAND,
};
