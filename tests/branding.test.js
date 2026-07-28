'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const javascript = fs.readFileSync(path.join(root, 'branding-fixes.js'), 'utf8');
const teams = fs.readFileSync(path.join(root, 'teams.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'branding-fixes.css'), 'utf8');

for (const asset of [
  'crests/pools/uefa_logo.png',
  'crests/pools/champions/UCL_Logo.svg',
  'crests/pools/champions/arkaplanucl.jpg',
  'crests/pools/europa/UEL_Logo.svg',
  'crests/pools/europa/arkaplanuel.jpg',
  'crests/pools/conference/CON_Logo.svg',
  'crests/pools/conference/arkaplancon.jpg'
]) {
  if (!fs.existsSync(path.join(root, asset))) throw new Error(`Missing branding asset: ${asset}`);
}

for (const [league, asset] of [
  ['Champions League', 'crests/pools/champions/UCL_Logo.svg'],
  ['Europa League', 'crests/pools/europa/UEL_Logo.svg'],
  ['Conference League', 'crests/pools/conference/CON_Logo.svg']
]) {
  if (!teams.includes(`logo: '${asset}'`)) throw new Error(`${league} SVG logo is not connected in competition data.`);
}

if (!javascript.includes("competitions.uecl.logo = 'crests/pools/conference/CON_Logo.svg'")) {
  throw new Error('Conference League SVG logo override is not connected.');
}
if (!javascript.includes("competitions.uecl.background = 'crests/pools/conference/arkaplancon.jpg'")) {
  throw new Error('Conference League background is not connected.');
}
if (!javascript.includes("element.lang = 'en'")) {
  throw new Error('English competition names are not locale protected.');
}
if (!javascript.includes('#competitionPicker button[data-league="uecl"] > .league-icon img')) {
  throw new Error('Conference logo refresh is not scoped to the Conference picker button.');
}
if (javascript.includes("'[data-league=\"uecl\"] .league-icon img'")) {
  throw new Error('Conference logo selector is broad enough to rewrite every league icon.');
}
if (!css.includes('var(--league-background')) {
  throw new Error('Conference theme still ignores its image background.');
}
if (!css.includes('body[data-league="uel"] .glass') || !css.includes('body[data-league="uecl"] .glass')) {
  throw new Error('Europa and Conference full glass cards do not have league-specific gradients.');
}
if (!css.includes('--surface: rgba(0, 0, 0, 0.74)') || !css.includes('--surface-strong: rgba(0, 0, 0, 0.93)')) {
  throw new Error('Europa and Conference shared translucent surfaces must use neutral black instead of navy.');
}
if (!css.includes('rgba(0, 0, 0, 0.8)')) {
  throw new Error('Europa and Conference full-card gradients must fade into black.');
}
if (css.includes('body[data-league="ucl"] .glass')) {
  throw new Error('Champions League glass cards must retain their original blue-navy treatment.');
}
if (!css.includes('body[data-league="uel"] .pot-card-header') || !css.includes('body[data-league="uecl"] .pot-card-header')) {
  throw new Error('Europa and Conference pot title strips do not have league-specific gradients.');
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