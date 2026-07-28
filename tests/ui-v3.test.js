'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app-v3.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'v3.css'), 'utf8');
const polish = fs.readFileSync(path.join(root, 'interface-polish.js'), 'utf8');
const polishCss = fs.readFileSync(path.join(root, 'interface-polish.css'), 'utf8');

const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
const refs = [...app.matchAll(/getElementById\('([^']+)'\)/g)].map((match) => match[1]);
const missing = refs.filter((id) => !ids.has(id));
if (missing.length) throw new Error(`Missing HTML IDs: ${missing.join(', ')}`);

for (const required of ['manualSelectButton','finishAllButton','allFixturesSection','initialModeChoice','speedControl','appHeader']) {
  if (!ids.has(required)) throw new Error(`Required control missing: ${required}`);
}
if (!html.includes('<script src="app-v3.js"></script>')) throw new Error('app-v3.js is not loaded.');
if (!html.includes('<link rel="stylesheet" href="v3.css">')) throw new Error('v3.css is not loaded.');
if (!html.includes('<link rel="stylesheet" href="interface-polish.css">')) throw new Error('interface-polish.css is not loaded.');
if (!html.includes('<script src="interface-polish.js"></script>')) throw new Error('interface-polish.js is not loaded.');
if (!(html.indexOf('prediction-ui.js') < html.indexOf('interface-polish.js'))) throw new Error('Interface polish must load after prediction UI.');
if (!css.includes('body.draw-active #appHeader')) throw new Error('Draw mode does not hide the header.');
if (!app.includes('manualWindow: 10000')) throw new Error('Manual draw timeout must be 10 seconds.');
if (!app.includes('[1, 1.5, 2]')) throw new Error('Automatic speed options are missing.');
if (!html.includes('placeholder="Takım Ara..."')) throw new Error('Search placeholder is not concise.');
if (html.includes('Arama yap veya aşağıdaki torbalardan')) throw new Error('Verbose selection instructions are still visible.');
if (!polish.includes('decorateDrawHeader') || !polish.includes('decoratePredictionHeader')) throw new Error('Team hero headers are not decorated.');
if (!polish.includes('Kurayı çek, sonuçları tahmin et.')) throw new Error('Concise brand copy is missing.');
for (const league of ['ucl', 'uel', 'uecl']) {
  if (!polishCss.includes(`body[data-league="${league}"] .themed-hero::before`)) throw new Error(`Missing ${league} header motif.`);
}
if (!polishCss.includes('.draw-header-identity') || !polishCss.includes('.prediction-header-identity')) {
  throw new Error('Centered team identities are not styled.');
}
if (!polishCss.includes('body.draw-active .selected-club-card')) throw new Error('Duplicate selected-team card is not hidden.');

console.log('UI v3 static checks passed.');
