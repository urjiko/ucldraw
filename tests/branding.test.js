'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const javascript = fs.readFileSync(path.join(root, 'branding-fixes.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'branding-fixes.css'), 'utf8');

for (const asset of ['crests/ConferenceLeague.png', 'assets/arkaplancon.jpg']) {
  if (!fs.existsSync(path.join(root, asset))) throw new Error(`Missing branding asset: ${asset}`);
}

if (!javascript.includes("competitions.uecl.logo = 'crests/ConferenceLeague.png'")) {
  throw new Error('Conference League logo is not connected.');
}
if (!javascript.includes("competitions.uecl.background = 'assets/arkaplancon.jpg'")) {
  throw new Error('Conference League background is not connected.');
}
if (!javascript.includes("element.lang = 'en'")) {
  throw new Error('English competition names are not locale protected.');
}
if (!css.includes('var(--league-background')) {
  throw new Error('Conference theme still ignores its image background.');
}

const teamsIndex = html.indexOf('<script src="teams.js"></script>');
const brandingIndex = html.indexOf('<script src="branding-fixes.js"></script>');
const appIndex = html.indexOf('<script src="app-v3.js"></script>');
if (!(teamsIndex >= 0 && brandingIndex > teamsIndex && appIndex > brandingIndex)) {
  throw new Error('Branding script must load after team data and before the app.');
}
if (!html.includes('<link rel="stylesheet" href="branding-fixes.css">')) {
  throw new Error('Branding stylesheet is not loaded.');
}

console.log('Branding checks passed.');
