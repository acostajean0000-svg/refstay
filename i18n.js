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
    'dash.nav.invite':      { en: 'Invite friends',           es: 'Invita amigos' },
    'dash.nav.settings':    { en: 'Settings',                 es: 'Ajustes' },
    'dash.nav.help':        { en: 'Help',                     es: 'Ayuda' },

    // ----- Invite tab -----
    'dash.title.invite':       { en: '🤝 Invite a fellow host',           es: '🤝 Invita a otro anfitrión' },
    'invite.sub':              { en: 'When they get their first paid booking, you both earn $25 — added to your next payout.', es: 'Cuando obtenga su primera reserva pagada, ambos ganan $25 — se agrega a tu próximo pago.' },
    'invite.copy':             { en: 'Copy link',                          es: 'Copiar enlace' },
    'invite.whatsapp':         { en: 'WhatsApp',                           es: 'WhatsApp' },
    'invite.email':            { en: 'Email',                              es: 'Correo' },
    'invite.reward.title':     { en: '$25 × 2 = $50 unlocked',            es: '$25 × 2 = $50 desbloqueados' },
    'invite.reward.sub':       { en: 'when your friend gets their first paid booking', es: 'cuando tu amigo obtenga su primera reserva pagada' },
    'invite.list.title':       { en: 'Your invitees',                      es: 'Tus invitados' },
    'invite.list.sub':         { en: 'Everyone who signed up via your invite link.', es: 'Todos los que se registraron con tu enlace.' },
    'invite.empty.title':      { en: 'No invitees yet',                    es: 'Aún sin invitados' },
    'invite.empty.sub':        { en: 'Share your invite link with another Airbnb host. When they get their first paid booking, you both earn $25.', es: 'Comparte tu enlace con otro anfitrión de Airbnb. Cuando obtenga su primera reserva pagada, ambos ganan $25.' },
    'invite.how.title':        { en: 'How it works',                       es: 'Cómo funciona' },
    'invite.how.s1.t':         { en: 'Share your invite link',             es: 'Comparte tu enlace de invitación' },
    'invite.how.s1.b':         { en: 'Copy and send via WhatsApp, email, or DM. Anyone who signs up via that link is "yours".', es: 'Copia y envía por WhatsApp, email o DM. Quien se registre por ese enlace es "tuyo".' },
    'invite.how.s2.t':         { en: 'They sign up + add their link to their welcome book', es: 'Se registra y agrega su enlace al welcome book' },
    'invite.how.s2.b':         { en: 'Standard onboarding. We email them tips automatically.', es: 'Onboarding estándar. Le mandamos tips por email automáticamente.' },
    'invite.how.s3.t':         { en: 'Their first guest books → bonus unlocks', es: 'Su primer huésped reserva → desbloquea bonus' },
    'invite.how.s3.b':         { en: 'When the booking is marked paid, both of you get $25 added to your next monthly payout.', es: 'Cuando la reserva quede pagada, ambos reciben $25 en su próximo pago mensual.' },
    'dash.nav.logout':      { en: 'Log out',                  es: 'Cerrar sesión' },

    // ----- Help tab -----
    'help.title':              { en: '❓ Help & FAQs',                   es: '❓ Ayuda y preguntas frecuentes' },
    'help.sub':                { en: 'Quick guides, FAQs, and troubleshooting. Most questions are answered below.', es: 'Guías rápidas, FAQ y solución de problemas. La mayoría de las dudas están respondidas abajo.' },
    'help.search.placeholder': { en: 'Search help…',                     es: 'Buscar en ayuda…' },
    'help.quickstart.title':   { en: '🚀 Quick start (5 steps)',         es: '🚀 Inicio rápido (5 pasos)' },
    'help.quickstart.sub':     { en: 'Most hosts get their first booking within 2 weeks of completing these.', es: 'La mayoría de los anfitriones obtiene su primera reserva en 2 semanas tras completar estos.' },
    'help.qs.s1.title':        { en: 'Copy your link from the "Your link" tab', es: 'Copia tu enlace desde la pestaña "Tu enlace"' },
    'help.qs.s1.body':         { en: 'Your unique link is refstay.com/r/your-slug. Click Copy in the dashboard.', es: 'Tu enlace único es refstay.com/r/tu-slug. Haz clic en Copiar en el panel.' },
    'help.qs.s2.title':        { en: 'Paste it in your Airbnb welcome book', es: 'Pégalo en tu welcome book de Airbnb' },
    'help.qs.s2.body':         { en: 'Airbnb → Listings → House manual → add one line: "Best activities: refstay.com/r/your-slug". Takes 30 sec.', es: 'Airbnb → Anuncios → Manual de la casa → agrega una línea: "Mejores actividades: refstay.com/r/tu-slug". Toma 30 seg.' },
    'help.qs.s3.title':        { en: 'Send the WhatsApp template at check-in', es: 'Envía el template de WhatsApp al check-in' },
    'help.qs.s3.body':         { en: 'Highest-converting channel by far. Click WhatsApp on Overview to get the auto-formatted message.', es: 'El canal con mejor conversión. Haz clic en WhatsApp en Resumen para obtener el mensaje preformateado.' },
    'help.qs.s4.title':        { en: 'Print a welcome card or fridge magnet', es: 'Imprime una tarjeta o imán para nevera' },
    'help.qs.s4.body':         { en: 'Go to "Print assets" → pick a design → print. Free templates, designed for letter-size paper.', es: 'Ve a "Materiales impresos" → elige un diseño → imprime. Plantillas gratis, en tamaño carta.' },
    'help.qs.s5.title':        { en: 'Add your payout info in Settings', es: 'Agrega tus datos de pago en Ajustes' },
    'help.qs.s5.body':         { en: 'PayPal or Zelle. We pay on the 5th of every month if your balance is $25+.', es: 'PayPal o Zelle. Pagamos el día 5 de cada mes si tu saldo es $25+.' },
    'help.topic.share.title':  { en: '🔗 Sharing your link',              es: '🔗 Compartir tu enlace' },
    'help.share.q1':           { en: 'Where exactly do I paste it in Airbnb?', es: '¿Dónde exactamente lo pego en Airbnb?' },
    'help.share.a1':           { en: 'Airbnb host dashboard → Listings → your listing → "Guest resources" → "House manual" → "Things to do" section. Paste a single line: Best activities: refstay.com/r/your-slug. Guests see this when they book the stay.', es: 'Panel de Airbnb → Anuncios → tu anuncio → "Recursos para huéspedes" → "Manual de la casa" → sección "Cosas que hacer". Pega una línea: Mejores actividades: refstay.com/r/tu-slug. Los huéspedes lo ven al reservar.' },
    'help.share.q2':           { en: 'What\'s the best WhatsApp message?', es: '¿Cuál es el mejor mensaje de WhatsApp?' },
    'help.share.a2':           { en: 'From Overview → click WhatsApp → it auto-fills the recommended welcome message with your link.', es: 'En Resumen → clic en WhatsApp → se rellena automáticamente con el mensaje recomendado de bienvenida y tu enlace.' },
    'help.share.q3':           { en: 'Can I use a QR code?',              es: '¿Puedo usar un código QR?' },
    'help.share.a3':           { en: 'Yes. Click QR code on Overview to download it, or use any print asset (welcome card, fridge magnet, poster) — all include your unique QR.', es: 'Sí. Clic en QR en Resumen para descargarlo, o usa cualquier material impreso (tarjeta, imán, póster) — todos incluyen tu QR único.' },
    'help.topic.earn.title':   { en: '💰 Earnings & payouts',             es: '💰 Ganancias y pagos' },
    'help.earn.q1':            { en: 'When do I get paid?',                es: '¿Cuándo me pagan?' },
    'help.earn.a1':            { en: 'On the 5th of each month, for all confirmed completed bookings from the prior month. Minimum payout: $25. If below $25, it rolls to the next month.', es: 'El día 5 de cada mes, por todas las reservas confirmadas y completadas del mes anterior. Mínimo: $25. Si es menor, rueda al mes siguiente.' },
    'help.earn.q2':            { en: 'How is my commission calculated?',   es: '¿Cómo se calcula mi comisión?' },
    'help.earn.a2':            { en: 'Flat 5% of the gross booking amount (before tax). Example: $200 jet ski rental → you earn $10. No tiers, no fees deducted from your 5%.', es: '5% fijo sobre el monto bruto de la reserva (antes de impuestos). Ej: $200 de jet ski → ganas $10. Sin escalones, sin descuentos a tu 5%.' },
    'help.earn.q3':            { en: 'What if a guest cancels?',            es: '¿Qué pasa si un huésped cancela?' },
    'help.earn.a3':            { en: 'Cancellations before the activity date are removed from your pending balance. Already-paid commissions stay yours — we never claw back paid earnings.', es: 'Las cancelaciones antes de la actividad se quitan de tu saldo pendiente. Las comisiones ya pagadas son tuyas — nunca recuperamos lo pagado.' },
    'help.earn.q4':            { en: 'Do I owe taxes on commissions?',     es: '¿Debo pagar impuestos sobre las comisiones?' },
    'help.earn.a4':            { en: 'If you earn $600+ in a calendar year, you\'ll receive a 1099 (US) or equivalent. Refstay is not a tax advisor — consult yours for specifics.', es: 'Si ganas $600+ en un año calendario, recibirás un 1099 (US) o equivalente. Refstay no es asesor fiscal — consulta al tuyo para detalles.' },
    'help.topic.track.title':  { en: '📊 Tracking & metrics',             es: '📊 Métricas y seguimiento' },
    'help.track.q1':           { en: 'What counts as a "click"?',          es: '¿Qué cuenta como "clic"?' },
    'help.track.a1':           { en: 'Any visit to your /r/ or /g/ link. Dashboard splits them: /r/ = direct redirects, /g/ = guest landing page. Both lead to bookings.', es: 'Cualquier visita a tu /r/ o /g/. El panel los separa: /r/ = redirecciones directas, /g/ = página del huésped. Ambos llevan a reservas.' },
    'help.track.q2':           { en: 'How is a booking attributed to me?', es: '¿Cómo se atribuye una reserva a mí?' },
    'help.track.a2':           { en: 'When a guest clicks your /r/ link, we tag the booking with your slug via FareHarbor\'s marketing_source. When they complete a booking — even days later — we receive a webhook with your slug and automatically credit you.', es: 'Cuando un huésped abre tu /r/, etiquetamos la reserva con tu slug vía FareHarbor. Al completar la reserva — incluso días después — recibimos un webhook con tu slug y te acreditamos automáticamente.' },
    'help.track.q3':           { en: 'What\'s a good conversion rate?',     es: '¿Cuál es una buena tasa de conversión?' },
    'help.track.a3':           { en: 'Active hosts: 30-50% of guests who click your link complete a booking. New hosts: 10-20%. If yours is below 10%, try the welcome book + WhatsApp combo.', es: 'Hosts activos: 30-50% de los huéspedes que abren tu enlace completan una reserva. Nuevos: 10-20%. Si es menor a 10%, prueba combo welcome book + WhatsApp.' },
    'help.topic.fh.title':     { en: '🎟️ FareHarbor & bookings',          es: '🎟️ FareHarbor y reservas' },
    'help.fh.q1':              { en: 'What\'s FareHarbor?',                 es: '¿Qué es FareHarbor?' },
    'help.fh.a1':              { en: 'FareHarbor is the booking platform 95% of Miami activity operators use. Same one Airbnb Experiences runs on. Your guest books directly with the operator — instant confirmation.', es: 'FareHarbor es la plataforma que usan el 95% de los operadores de Miami. La misma de Airbnb Experiences. Tu huésped reserva directo con el operador — confirmación instantánea.' },
    'help.fh.q2':              { en: 'How does my guest know a booking is confirmed?', es: '¿Cómo sabe mi huésped que la reserva está confirmada?' },
    'help.fh.a2':              { en: 'FareHarbor sends a confirmation email immediately after checkout. They also get reminders 24h before the activity.', es: 'FareHarbor envía email de confirmación al instante. También recibe recordatorios 24h antes de la actividad.' },
    'help.fh.q3':              { en: 'What if my guest has an issue at the activity?', es: '¿Y si mi huésped tiene un problema en la actividad?' },
    'help.fh.a3':              { en: 'Operators handle on-site issues directly. Your guest can contact the operator via FareHarbor or by replying to their confirmation email. You don\'t need to mediate.', es: 'Los operadores manejan los problemas en sitio. Tu huésped puede contactarlos vía FareHarbor o respondiendo el email de confirmación. No tienes que mediar.' },
    'help.topic.tshoot.title': { en: '🔧 Troubleshooting',                 es: '🔧 Solución de problemas' },
    'help.ts.q1':              { en: 'Why are my click counts at zero?',   es: '¿Por qué mis clics están en cero?' },
    'help.ts.a1':              { en: 'Most likely you haven\'t shared the link yet or guests haven\'t visited. Test: open your link in an incognito tab — within 60 sec it should show in Overview.', es: 'Lo más probable: aún no compartiste el enlace o los huéspedes no han entrado. Prueba: abre tu enlace en pestaña incógnita — en 60 seg debe aparecer en Resumen.' },
    'help.ts.q2':              { en: 'Clicks but no bookings — why?',      es: 'Clics pero sin reservas — ¿por qué?' },
    'help.ts.a2':              { en: 'Common reasons: guests browsing without deciding, prices on the landing don\'t match what you mentioned, or wrong zone — your link shows Miami but guests are in Orlando. Check your zone in Settings.', es: 'Razones comunes: huéspedes navegando sin decidir, precios distintos de lo que mencionaste, o zona equivocada — tu enlace muestra Miami pero los huéspedes están en Orlando. Revisa zona en Ajustes.' },
    'help.ts.q3':              { en: 'Why is a booking "pending" so long?', es: '¿Por qué una reserva está "pendiente" tanto tiempo?' },
    'help.ts.a3':              { en: 'Bookings stay pending until the activity date passes. Once it completes, it auto-converts to confirmed and joins your next payout cycle.', es: 'Las reservas quedan pendientes hasta que pasa la fecha de la actividad. Al completarse, se convierte en confirmada automáticamente.' },
    'help.ts.q4':              { en: 'My link says "Host not found" — what happened?', es: 'Mi enlace dice "Host no encontrado" — ¿qué pasó?' },
    'help.ts.a4':              { en: 'Likely your slug was changed and the old link is cached. Always check your current link in Overview. If using a printed asset, regenerate from Print assets.', es: 'Probablemente cambiaste tu slug y el enlace viejo está en caché. Revisa tu enlace actual en Resumen. Si usas material impreso, regéneralo desde Materiales impresos.' },
    'help.topic.contact.title': { en: '💬 Still stuck?',                   es: '💬 ¿Aún sin resolver?' },
    'help.contact.body':       { en: 'We reply within 24 hours, usually faster. Three ways to reach us:', es: 'Respondemos en 24h, casi siempre más rápido. Tres formas de contactarnos:' },
    'help.contact.dm':         { en: '💬 Message us in-app (fastest)',     es: '💬 Mándanos un mensaje en la app (lo más rápido)' },
    'help.contact.email':      { en: '📧 Email support@refstay.com',       es: '📧 Email a support@refstay.com' },
    'help.contact.blog':       { en: '📚 Read in-depth guides on the blog', es: '📚 Lee guías completas en el blog' },

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
