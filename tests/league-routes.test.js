'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const runtime = read('league-routes.js');
const shell = read('league-route-shell.js');
const branding = read('branding-fixes.js');
const footer = read('site-footer.js');
const routes = {
  ucl: { directory: 'champions-league', title: 'UEFA Champions League Kura Simülatörü' },
  uel: { directory: 'europa-league', title: 'UEFA Europa League Kura Simülatörü' },
  uecl: { directory: 'conference-league', title: 'UEFA Conference League Kura Simülatörü' }
};

for (const [leagueId, route] of Object.entries(routes)) {
  const page = read(`${route.directory}/index.html`);
  assert.match(page, /<base href="\.\.\/">/);
  assert.ok(page.includes(`<title>${route.title}</title>`));
  assert.ok(page.includes(`data-league="${leagueId}" data-initial-league="${leagueId}"`));
  assert.ok(page.includes(`https://urjiko.github.io/UEFA/${route.directory}/`));
  assert.ok(page.includes(`data-league="${leagueId}"></script>`));
}

assert.match(runtime, /champions-league\//);
assert.match(runtime, /europa-league\//);
assert.match(runtime, /conference-league\//);
assert.match(runtime, /window\.location\.assign/);
assert.match(runtime, /stopImmediatePropagation/);
assert.match(runtime, /!event\.isTrusted/);
assert.match(runtime, /Internal UI refreshes use HTMLElement\.click/);
assert.match(shell, /window\.UCLDRAW_APP_ROOT = appRootUrl\.href/);
assert.match(shell, /base\.href = appRootUrl\.href/);
assert.match(shell, /fetch\(appUrl\('index\.html'\)/);
assert.match(shell, /copy\.href = appUrl\(link\.getAttribute\('href'\)\)/);
assert.match(shell, /script\.src = appUrl\(source\)/);
assert.match(shell, /DOMParser/);
assert.match(shell, /ucldraw:league-routes-ready/);
assert.match(branding, /new URL\(window\.UCLDRAW_APP_ROOT \|\| '\.', document\.baseURI\)/);
assert.match(branding, /competitions\[leagueId\]\.logo = assetUrl\(source\)/);
assert.match(branding, /image\.src !== expected/);
assert.match(branding, /link\.href = assetUrl\('prediction-compact\.css'\)/);
assert.match(footer, /league-routes\.js/);
assert.match(read('sitemap.xml'), /<loc>https:\/\/urjiko\.github\.io\/UEFA\/europa-league\/<\/loc>/);
assert.match(read('robots.txt'), /Sitemap: https:\/\/urjiko\.github\.io\/UEFA\/sitemap\.xml/);

const routeRoot = new URL('./', 'https://urjiko.github.io/UEFA/league-route-shell.js');
assert.equal(new URL('crests/pools/europa/UEL_Logo.svg', routeRoot).pathname, '/UEFA/crests/pools/europa/UEL_Logo.svg');
assert.equal(new URL('crests/pools/conference/CON_Logo.svg', routeRoot).pathname, '/UEFA/crests/pools/conference/CON_Logo.svg');
assert.equal(new URL('crests/pools/europa/guaranteed/milan.png', routeRoot).pathname, '/UEFA/crests/pools/europa/guaranteed/milan.png');

let clickHandler = null;
const assignedUrls = [];
const fakeDocument = {
  baseURI: 'https://urjiko.github.io/UEFA/',
  body: { dataset: {} },
  querySelector() { return null; },
  addEventListener(type, handler) {
    if (type === 'click') clickHandler = handler;
  }
};
const fakeWindow = {
  location: {
    pathname: '/UEFA/champions-league/',
    assign(url) { assignedUrls.push(url); }
  },
  dispatchEvent() {}
};
const context = vm.createContext({
  window: fakeWindow,
  document: fakeDocument,
  URL,
  Object,
  CustomEvent: class CustomEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail;
    }
  }
});
vm.runInContext(runtime, context, { filename: 'league-routes.js' });
assert.equal(typeof clickHandler, 'function', 'route runtime must register its click interceptor');

const europaButton = { dataset: { league: 'uel' } };
function routeClick(isTrusted) {
  const effects = { prevented: false, stopped: false };
  clickHandler({
    isTrusted,
    target: { closest: () => europaButton },
    preventDefault() { effects.prevented = true; },
    stopImmediatePropagation() { effects.stopped = true; }
  });
  return effects;
}

const internalClick = routeClick(false);
assert.equal(assignedUrls.length, 0, 'programmatic roster refresh must not navigate to another league URL');
assert.equal(internalClick.prevented, false, 'programmatic refresh must reach the app league button handler');
assert.equal(internalClick.stopped, false, 'programmatic refresh must not be stopped by route navigation');

const userClick = routeClick(true);
assert.equal(assignedUrls.length, 1, 'trusted user league selection must still navigate');
assert.equal(new URL(assignedUrls[0]).pathname, '/UEFA/europa-league/');
assert.equal(userClick.prevented, true);
assert.equal(userClick.stopped, true);

console.log('Canonical league route checks passed.');
