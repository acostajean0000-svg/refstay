# Hostlink — referral landing page

A fully functional referral landing page for a platform that lets Airbnb hosts earn 7% on every booking made through their unique link.

## Files

```
deploy/
├── index.html        # Landing page (hero, calculator, pricing, dashboard preview, signup, FAQ)
├── dashboard.html    # Host dashboard (login → overview, referrals, payouts, settings)
├── 404.html          # Branded not-found page
├── vercel.json       # Vercel config (clean URLs, redirects, security headers)
├── robots.txt        # Search-engine instructions
├── sitemap.xml       # Sitemap (update YOUR_DOMAIN.com first)
└── README.md         # This file
```

## Before you deploy — 3 quick swaps

These are the only three placeholders you must replace before going live. All three are clearly marked in the files.

### 1. Plausible analytics domain

Open `index.html` and `dashboard.html`. Search for:

```
data-domain="YOUR_DOMAIN.com"
```

Replace `YOUR_DOMAIN.com` with the exact domain you'll deploy to (no `https://`, no trailing slash). Example: `hostlink.com`.

Sign up at [plausible.io](https://plausible.io) and add a site with that same domain. Custom events (`Signup`, `Link Copy`, `Share Click`, `Calculator Use`, `Login`, etc.) will start showing up in your dashboard automatically.

### 2. Formspree form ID

Open `index.html` and search for:

```
formspree.io/f/FORMSPREE_FORM_ID
```

Sign up at [formspree.io](https://formspree.io), create a new form, copy its ID (looks like `xqkrdpwe`), and paste it in place of `FORMSPREE_FORM_ID`. Submissions will arrive in your email and the Formspree dashboard.

Until you do this, the form runs in demo mode — a small notice appears below the submit button and submissions are not sent anywhere.

### 3. Sitemap + robots URLs

Open `sitemap.xml` and `robots.txt` and replace `YOUR_DOMAIN.com` with your real domain.

## Deploy to Vercel — 3 options

### Option A: drag-and-drop (easiest, 30 seconds)

1. Zip the `deploy/` folder
2. Go to [vercel.com/new](https://vercel.com/new)
3. Drag the zip onto the page
4. Done. You'll get a `*.vercel.app` URL instantly

### Option B: GitHub + Vercel (recommended for production)

1. Create a new GitHub repo and push the `deploy/` folder contents to the root
2. Go to [vercel.com/new](https://vercel.com/new), import the repo
3. Framework preset: **Other** (it's static HTML, no build command needed)
4. Click Deploy

Vercel auto-redeploys on every push to `main`.

### Option C: Vercel CLI

```bash
npm i -g vercel
cd deploy
vercel
```

Follow the prompts. First deploy is to a preview URL; run `vercel --prod` to push to production.

## Custom domain

In Vercel: **Project → Settings → Domains** → add your domain. Vercel walks you through the DNS records.

Once your custom domain is connected, double-check that you used that exact domain in `data-domain="..."` for Plausible.

## Local preview

Any of these will serve the site locally:

```bash
# Python
python3 -m http.server 3000 -d deploy

# Node (npx — no install)
npx serve deploy -p 3000

# Or just open deploy/index.html in your browser
```

Then visit `http://localhost:3000`.

## What's wired up

**Landing page (`index.html`)**

- Hero with animated counter and gradient mesh
- 3-step "how it works" section
- Live earnings calculator (debounced Plausible event tracking)
- Flat 7% pricing card with industry comparison
- Mock dashboard preview (KPIs + SVG chart + recent bookings)
- Signup form with validation + honeypot anti-spam + Formspree POST
- Generated unique referral link (`hostlink.com/r/<name>-<random>`)
- Share buttons (WhatsApp, Email, X) — each tracked
- 7 FAQ entries
- Smooth scroll, sticky nav, dark footer

**Dashboard (`dashboard.html`)**

- Login form with validation, plus "demo account" one-click bypass
- Persists session in `localStorage` under `hostlink_user`
- **Overview tab**: 4 KPIs, 30D/90D/1Y chart, activity feed
- **Referrals tab**: 18-row table with paid/pending/confirmed status, CSV export
- **Payouts tab**: 3-month payout history, payout method selector
- **Your link tab**: copyable link + 5 share targets, custom slug editor, top-sources breakdown
- **Settings tab**: profile editing, 4 notification toggles, delete-account flow
- All tabs track view events in Plausible

## Replacing the mock data with a real backend

The dashboard is currently 100% frontend with mock data so you can show it off immediately. To wire it to a real backend:

1. **Auth** — replace the localStorage check in `dashboard.html` with a session cookie / JWT check. The login form is already structured to POST credentials.
2. **Data** — every `render*()` function in `dashboard.html` (e.g. `renderReferrals()`, `renderPayouts()`) currently builds rows from hardcoded arrays. Swap each one for a `fetch()` call to your API.
3. **Slug uniqueness** — `saveSlug` writes to localStorage. In production, POST to your API and have it return success/conflict.

## Tech notes

- Zero build step. Pure HTML + CSS + vanilla JS.
- Fonts loaded from Google Fonts (Inter + Space Grotesk).
- No frameworks, no npm install. Total page weight: ~50 KB each (gzipped: ~12 KB).
- Mobile responsive down to ~360px.
- Plausible is privacy-friendly — no cookie banner required.
- Form has a `_gotcha` honeypot field for spam protection.
- Strict security headers via `vercel.json`.

## License

This is your codebase — do whatever you want with it.
