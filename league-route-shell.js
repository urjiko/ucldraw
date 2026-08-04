(() => {
  'use strict';

  const loader = document.currentScript;
  const leagueId = loader?.dataset.league || document.body.dataset.initialLeague || 'ucl';
  const loaderUrl = new URL(loader?.src || 'league-route-shell.js', window.location.href);
  const appRootUrl = new URL('./', loaderUrl);

  window.UCLDRAW_APP_ROOT = appRootUrl.href;

  let base = document.querySelector('base');
  if (!base) {
    base = document.createElement('base');
    document.head.prepend(base);
  }
  base.href = appRootUrl.href;

  function appUrl(source) {
    return new URL(source, appRootUrl).href;
  }

  function loadScript(source, attributes = {}) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = appUrl(source);
      script.async = false;
      Object.entries(attributes).forEach(([name, value]) => script.setAttribute(name, value));
      script.addEventListener('load', resolve, { once: true });
      script.addEventListener('error', () => reject(new Error(`${script.src} yüklenemedi.`)), { once: true });
      document.body.appendChild(script);
    });
  }

  async function waitForRouteRuntime() {
    if (window.UCLDRAW_LEAGUE_ROUTES) return window.UCLDRAW_LEAGUE_ROUTES;
    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error('Lig yönlendirme sistemi yüklenemedi.')), 8000);
      window.addEventListener('ucldraw:league-routes-ready', (event) => {
        window.clearTimeout(timeout);
        resolve(event.detail);
      }, { once: true });
    });
  }

  async function boot() {
    const response = await fetch(appUrl('index.html'), { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Ana uygulama ${response.status} hatası verdi.`);
    const source = await response.text();
    const parsed = new DOMParser().parseFromString(source, 'text/html');

    parsed.head.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
      const copy = document.createElement('link');
      copy.rel = 'stylesheet';
      copy.href = appUrl(link.getAttribute('href'));
      document.head.appendChild(copy);
    });

    const scripts = [...parsed.body.querySelectorAll('script[src]')].map((script) => ({
      source: script.getAttribute('src'),
      attributes: [...script.attributes]
        .filter((attribute) => attribute.name !== 'src')
        .reduce((result, attribute) => ({ ...result, [attribute.name]: attribute.value }), {})
    }));
    parsed.body.querySelectorAll('script').forEach((script) => script.remove());

    document.body.className = parsed.body.className;
    document.body.dataset.league = leagueId;
    document.body.dataset.initialLeague = leagueId;
    document.body.replaceChildren(...[...parsed.body.childNodes].map((node) => document.importNode(node, true)));

    for (const script of scripts) await loadScript(script.source, script.attributes);
    const routes = await waitForRouteRuntime();
    routes.activate(leagueId);
    document.documentElement.classList.remove('route-loading');
  }

  boot().catch((error) => {
    document.documentElement.classList.remove('route-loading');
    document.body.innerHTML = `<main class="route-error"><h1>Sayfa yüklenemedi</h1><p>${error.message}</p><a href="${appRootUrl.href}">Ana sayfaya dön</a></main>`;
    console.error(error);
  });
})();
