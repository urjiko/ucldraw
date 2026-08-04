'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const runtime = read('league-routes.js');
const shell = read('league-route-shell.js');
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
assert.match(shell, /fetch\('index\.html'/);
assert.match(shell, /DOMParser/);
assert.match(shell, /ucldraw:league-routes-ready/);
assert.match(footer, /league-routes\.js/);
assert.match(read('sitemap.xml'), /<loc>https:\/\/urjiko\.github\.io\/UEFA\/europa-league\/<\/loc>/);
assert.match(read('robots.txt'), /Sitemap: https:\/\/urjiko\.github\.io\/UEFA\/sitemap\.xml/);

console.log('Canonical league route checks passed.');
