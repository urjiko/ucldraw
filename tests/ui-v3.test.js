'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app-v3.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'v3.css'), 'utf8');

const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
const refs = [...app.matchAll(/getElementById\('([^']+)'\)/g)].map((match) => match[1]);
const missing = refs.filter((id) => !ids.has(id));
if (missing.length) throw new Error(`Missing HTML IDs: ${missing.join(', ')}`);

for (const required of ['manualSelectButton','finishAllButton','allFixturesSection','initialModeChoice','speedControl','appHeader']) {
  if (!ids.has(required)) throw new Error(`Required control missing: ${required}`);
}
if (!html.includes('<script src="app-v3.js"></script>')) throw new Error('app-v3.js is not loaded.');
if (!html.includes('<link rel="stylesheet" href="v3.css">')) throw new Error('v3.css is not loaded.');
if (!css.includes('body.draw-active #appHeader')) throw new Error('Draw mode does not hide the header.');
if (!app.includes('manualWindow: 10000')) throw new Error('Manual draw timeout must be 10 seconds.');
if (!app.includes('[1, 1.5, 2]')) throw new Error('Automatic speed options are missing.');

console.log('UI v3 static checks passed.');
