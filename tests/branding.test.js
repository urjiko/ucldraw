'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const javascript = fs.readFileSync(path.join(root, 'branding-fixes.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'branding-fixes.css'), 'utf8');

for (const asset of [
  'crests/pools/uefa_logo.png',
  'crests/pools/champions/ucl_logo.png',
  'crests/pools/champions/arkaplanucl.jpg',
  'crests/pools/europa/europaleague.png',
  'crests/pools/europa/arkaplanuel.jpg',
  'crests/pools/conference/ConferenceLeague.png',
  'crests/pools/conference/arkaplancon.jpg'
]) {
  if (!fs.existsSync(path.join(root, asset))) throw new Error(`Missing branding asset: ${asset}`);
}

if (!javascript.includes("competitions.uecl.logo = 'crests/pools/conference/ConferenceLeague.png'")) {
  throw new Error('Conference League logo is not connected.');
}
if (!javascript.includes("competitions.uecl.background = 'crests/pools/conference/arkaplancon.jpg'")) {
  throw new Error('Conference League background is not connected.');
}
if (!javascript.includes("element.lang = 'en'")) {
  throw new Error('English competition names are not locale protected.');
}
if (!css.includes('var(--league-background')) {
  throw new Error('Conference theme still ignores its image background.');
}

for (const faviconLink of [
  '<link rel="icon" type="image/png" href="crests/pools/uefa_logo.png">',
  '<link rel="shortcut icon" type="image/png" href="crests/pools/uefa_logo.png">',
  '<link rel="apple-touch-icon" href="crests/pools/uefa_logo.png">'
]) {
  if (!html.includes(faviconLink)) throw new Error(`Missing site icon link: ${faviconLink}`);
}

const teamsIndex = html.indexOf('<script src="teams.js"></script>');
const manifestIndex = html.indexOf('<script src="generated-team-pools.js"></script>');
const poolLoaderIndex = html.indexOf('<script src="team-pool-loader.js"></script>');
const brandingIndex = html.indexOf('<script src="branding-fixes.js"></script>');
const appIndex = html.indexOf('<script src="app-v3.js"></script>');
if (!(teamsIndex >= 0 && manifestIndex > teamsIndex && poolLoaderIndex > manifestIndex && brandingIndex > poolLoaderIndex && appIndex > brandingIndex)) {
  throw new Error('Team pools and branding must load after base data and before the app.');
}
if (!html.includes('<link rel="stylesheet" href="branding-fixes.css">')) {
  throw new Error('Branding stylesheet is not loaded.');
}

console.log('Branding checks passed.');
