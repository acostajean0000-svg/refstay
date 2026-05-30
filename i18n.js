/* ============================================================
 * Refstay — Lightweight EN/ES i18n
 * Used by index.html + dashboard.html.
 *
 * Usage in HTML:
 *   <h1 data-i18n="hero.title">Default EN string</h1>
 *   <input data-i18n-attr="placeholder" data-i18n="search.placeholder">
 *
 * On page load, call:  Refstay.i18n.init();
 * Toggle language:     Refstay.i18n.setLang('es');
 * ============================================================ */
(function () {
  'use strict';

  // Persisted language code: 'en' or 'es'. Defaults to 'en'.
  const KEY = 'refstay_lang';

  // Master translation map. Keys are dot-paths (group.string).
  const STRINGS = {
    // ----- Shared (landing + dashboard) -----
    'nav.login':            { en: 'Log in',                   es: 'Entrar' },
    'nav.signup':           { en: 'Sign up',                  es: 'Registrarse' },
    'cta.signup':           { en: 'Sign up — free',           es: 'Registrarse — gratis' },
    'cta.dashboard':        { en: 'Go to dashboard →',        es: 'Ir al panel →' },

    // ----- Landing hero -----
    'hero.eyebrow':         { en: 'Built for Miami Airbnb hosts · earn 5% on every activity booking', es: 'Hecho para anfitriones de Airbnb · gana 5% en cada reserva' },
    'hero.h1.html':         { en: 'Your guests already book <span class="grad">jet skis, boats &amp; tours.</span> Now you get paid when they do.', es: 'Tus huéspedes ya reservan <span class="grad">jet skis, lanchas y tours.</span> Ahora tú ganas cuando lo hacen.' },
    'hero.subtitle':        { en: 'A 5% flat commission on every jet ski, boat, sunset cruise, and tour your guests book. No setup fees, no minimums, no fine print.', es: 'Una comisión fija de 5% en cada jet ski, lancha, atardecer o tour que reserven tus huéspedes. Sin costos, sin mínimos, sin letra chica.' },
    'hero.cta':             { en: 'Get my link →',              es: 'Obtener mi enlace →' },
    'hero.demo':            { en: 'See demo dashboard',         es: 'Ver panel de demostración' },
    'hero.bullet1':         { en: '✓ Free signup',            es: '✓ Registro gratis' },
    'hero.bullet2':         { en: '✓ Paid monthly',           es: '✓ Pagos mensuales' },
    'hero.bullet3':         { en: '✓ Cancel anytime',         es: '✓ Cancela cuando quieras' },

    // ----- How it works -----
    'how.eyebrow':          { en: 'How it works',                es: 'Cómo funciona' },
    'how.title.html':       { en: 'Three steps. <span class="grad">No selling required.</span>', es: 'Tres pasos. <span class="grad">Sin vender nada.</span>' },
    'how.sub':              { en: 'Your guests are already asking "what should we do in Miami?" — now you have an answer that pays you back.', es: 'Tus huéspedes ya preguntan "¿qué hacemos en Miami?" — ahora tienes una respuesta que te paga.' },
    'how.step1.title':      { en: 'Get your link in 60 seconds', es: 'Obtén tu enlace en 60 segundos' },
    'how.step2.title':      { en: 'Drop it where guests look',   es: 'Colócalo donde miran tus huéspedes' },
    'how.step3.title':      { en: 'Get paid every month',        es: 'Cobra cada mes' },

    // ----- Coverage -----
    'coverage.eyebrow':     { en: 'Where Refstay works',         es: 'Dónde funciona Refstay' },
    'coverage.title.html':  { en: 'From Miami to Maui — <span class="grad">13 destinations covered</span>', es: 'De Miami a Maui — <span class="grad">13 destinos cubiertos</span>' },
    'coverage.sub':         { en: "Wherever your guests vacation, Refstay has activity partners ready. Florida's hottest beaches, Hawaii's islands, and the Caribbean's top resort zones.", es: 'Donde sea que tus huéspedes vacacionen, Refstay tiene operadores listos. Las mejores playas de Florida, las islas de Hawaii, y las zonas turísticas top del Caribe.' },
    'coverage.add':         { en: "Don't see your zone? <a href=\"mailto:support@refstay.com\" style=\"color:#FF385C;font-weight:600;text-decoration:none;\">Drop us a line</a> — new regions added every month.", es: '¿No ves tu zona? <a href="mailto:support@refstay.com" style="color:#FF385C;font-weight:600;text-decoration:none;">Escríbenos</a> — agregamos zonas nuevas cada mes.' },

    // ----- Calculator -----
    'calc.title':           { en: 'Punch in your numbers.',     es: 'Pon tus números.' },
    'calc.title2':          { en: 'See your payout.',           es: 'Mira lo que ganas.' },

    // ----- Pricing -----
    'price.title':          { en: 'One rate.',                 es: 'Una sola tarifa.' },
    'price.title2':         { en: 'No fine print.',            es: 'Sin letra chica.' },

    // ----- Dashboard preview -----
    'dashpreview.title':    { en: "Watch your guests' bookings", es: 'Mira las reservas de tus huéspedes' },
    'dashpreview.title2':   { en: 'become your income.',         es: 'convertirse en tu ingreso.' },

    // ----- Signup -----
    'signup.cta':           { en: 'Start earning in',          es: 'Empieza a ganar en' },
    'signup.cta2':          { en: 'under 60 seconds',          es: 'menos de 60 segundos' },
    'signup.btn':           { en: 'Create my account →',       es: 'Crear mi cuenta →' },

    // ----- FAQ -----
    'faq.title':            { en: 'Questions, answered.',      es: 'Respuestas, claras.' },

    // ----- Dashboard sidebar nav -----
    'dash.nav.overview':    { en: 'Overview',                 es: 'Resumen' },
    'dash.nav.link':        { en: 'Your link',                es: 'Tu enlace' },
    'dash.nav.activities':  { en: 'Direct links',             es: 'Enlaces directos' },
    'dash.nav.favorites':   { en: 'Favorites',                es: 'Favoritos' },
    'dash.nav.print':       { en: 'Print assets',             es: 'Materiales impresos' },
    'dash.nav.settings':    { en: 'Settings',                 es: 'Ajustes' },
    'dash.nav.logout':      { en: 'Log out',                  es: 'Cerrar sesión' },

    // ----- Dashboard topbar / overview -----
    'dash.title.overview':       { en: 'Overview',                          es: 'Resumen' },
    'dash.title.link':           { en: 'Your referral link',                es: 'Tu enlace de referido' },
    'dash.title.activities':     { en: 'Direct booking links',              es: 'Enlaces de reserva directos' },
    'dash.title.favorites':      { en: '⭐ Your favorites',                 es: '⭐ Tus favoritos' },
    'dash.title.print':          { en: 'Print assets for your Airbnb',      es: 'Materiales impresos para tu Airbnb' },
    'dash.title.settings':       { en: 'Settings',                          es: 'Ajustes' },

    // ----- Dashboard KPIs -----
    'kpi.clicks':           { en: 'Clicks this month',        es: 'Clics este mes' },
    'kpi.bookings':         { en: 'Bookings this month',      es: 'Reservas este mes' },
    'kpi.earnings':         { en: 'Total earnings',           es: 'Total ganado' },
    'kpi.pending':          { en: 'Pending payout',           es: 'Pago pendiente' },

    // ----- Dashboard buttons -----
    'btn.copy':             { en: 'Copy',                    es: 'Copiar' },
    'btn.share.whatsapp':   { en: '📱 WhatsApp',             es: '📱 WhatsApp' },
    'btn.share.email':      { en: '✉️ Email',                es: '✉️ Correo' },
    'btn.share.qr':         { en: '📷 Show QR code',         es: '📷 Ver código QR' },
    'btn.load.more':        { en: 'Load more activities',    es: 'Ver más actividades' },

    // ----- Login form -----
    'login.title':          { en: 'Welcome back',            es: 'Bienvenido de vuelta' },
    'login.sub':            { en: 'Log in to see your earnings and links.', es: 'Entra para ver tus ganancias y enlaces.' },
    'login.email':          { en: 'Email',                   es: 'Correo' },
    'login.password':       { en: 'Password',                es: 'Contraseña' },
    'login.submit':         { en: 'Log in →',                es: 'Entrar →' },
    'login.forgot':         { en: 'Forgot password?',        es: '¿Olvidaste tu contraseña?' },
    'login.demo':           { en: 'View demo dashboard',     es: 'Ver panel de demostración' },

    // ----- Misc -----
    'fav.empty.title':      { en: 'No favorites yet',                                          es: 'Aún no tienes favoritos' },
    'fav.empty.cta':        { en: 'Browse activities →',                                       es: 'Explorar actividades →' },
  };

  function getLang() {
    try { return localStorage.getItem(KEY) || 'en'; }
    catch (e) { return 'en'; }
  }
  function setLang(lang) {
    try { localStorage.setItem(KEY, lang); } catch (e) {}
    apply(lang);
    updateToggle(lang);
    document.documentElement.lang = lang;
    // Allow page-specific extensions
    window.dispatchEvent(new CustomEvent('refstay:langchange', { detail: { lang } }));
  }

  // Apply translation to every [data-i18n] element on the page.
  // Variants:
  //   <el data-i18n="key">                  -> textContent
  //   <el data-i18n="key" data-i18n-html>   -> innerHTML (allows inline <span class="grad">)
  //   <el data-i18n="key" data-i18n-attr="placeholder">  -> setAttribute
  function apply(lang) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const entry = STRINGS[key];
      if (!entry) return;
      const v = entry[lang] || entry.en;
      const attr = el.dataset.i18nAttr;
      if (attr) el.setAttribute(attr, v);
      else if (el.hasAttribute('data-i18n-html')) el.innerHTML = v;
      else el.textContent = v;
    });
  }

  // Update toggle visual state (highlight current language)
  function updateToggle(lang) {
    document.querySelectorAll('[data-lang-toggle]').forEach(btn => {
      btn.classList.toggle('on', btn.dataset.langToggle === lang);
    });
  }

  function init() {
    const lang = getLang();
    document.documentElement.lang = lang;
    apply(lang);
    // Wire toggle buttons (any element with data-lang-toggle="en"/"es")
    document.querySelectorAll('[data-lang-toggle]').forEach(btn => {
      btn.addEventListener('click', () => setLang(btn.dataset.langToggle));
    });
    updateToggle(lang);
  }

  // Public API
  window.Refstay = window.Refstay || {};
  window.Refstay.i18n = { init, setLang, getLang, t: (k) => (STRINGS[k] && (STRINGS[k][getLang()] || STRINGS[k].en)) || k };
})();
