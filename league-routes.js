(() => {
  'use strict';

  if (window.UCLDRAW_LEAGUE_ROUTES) return;

  const routes = Object.freeze({
    ucl: Object.freeze({ path: 'champions-league/', title: 'UEFA Champions League Kura Simülatörü' }),
    uel: Object.freeze({ path: 'europa-league/', title: 'UEFA Europa League Kura Simülatörü' }),
    uecl: Object.freeze({ path: 'conference-league/', title: 'UEFA Conference League Kura Simülatörü' })
  });
  const baseUrl = new URL('.', document.baseURI);
  let bypassNavigation = false;

  function routeUrl(leagueId) {
    const route = routes[leagueId] || routes.ucl;
    return new URL(route.path, baseUrl);
  }

  function leagueFromPath(pathname = window.location.pathname) {
    const normalized = pathname.endsWith('/') ? pathname : `${pathname}/`;
    return Object.keys(routes).find((leagueId) => routeUrl(leagueId).pathname === normalized) || null;
  }

  function activate(leagueId) {
    if (!routes[leagueId]) return false;
    document.body.dataset.initialLeague = leagueId;
    const active = document.querySelector(`.competition-picker [data-league="${leagueId}"]`);
    if (!active) return leagueId === 'ucl';
    if (active.getAttribute('aria-pressed') !== 'true') {
      bypassNavigation = true;
      active.click();
      bypassNavigation = false;
    }
    document.title = routes[leagueId].title;
    return true;
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('.competition-picker [data-league]');
    // Internal UI refreshes use HTMLElement.click(). Those synthetic clicks must
    // update the in-memory league view without turning into a page navigation.
    if (!button || bypassNavigation || !event.isTrusted) return;
    const leagueId = button.dataset.league;
    if (!routes[leagueId]) return;
    const target = routeUrl(leagueId);
    if (window.location.pathname === target.pathname) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    window.location.assign(target.href);
  }, true);

  const api = Object.freeze({ activate, leagueFromPath, routeUrl, routes });
  window.UCLDRAW_LEAGUE_ROUTES = api;
  window.dispatchEvent(new CustomEvent('ucldraw:league-routes-ready', { detail: api }));
})();
