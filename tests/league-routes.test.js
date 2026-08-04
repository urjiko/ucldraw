'use strict';

const fs = require('node:fs');
const path = require('node:path');
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

console.log('Canonical league route checks passed.');
