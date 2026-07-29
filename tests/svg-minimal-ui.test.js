'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const teams = read('teams.js');
const branding = read('branding-fixes.js');
const css = read('minimal-copy-v2.css');
const share = read('prediction-share-v5.js');

for (const asset of [
  'crests/pools/champions/UCL_Logo.svg',
  'crests/pools/europa/UEL_Logo.svg',
  'crests/pools/conference/CON_Logo.svg'
]) {
  assert.ok(fs.existsSync(path.join(root, asset)), `SVG logo missing: ${asset}`);
  assert.ok(teams.includes(`logo: '${asset}'`), `Competition data does not use ${asset}`);
}

assert.ok(branding.includes("competitions.uecl.logo = 'crests/pools/conference/CON_Logo.svg'"));
assert.ok(branding.includes("image.src = 'crests/pools/conference/CON_Logo.svg'"));
assert.match(css, /\.rules-chip,[\s\S]*\.pot-count[\s\S]*display:\s*none\s*!important/);
assert.match(css, /\.prediction-fixture-top\s*>\s*span/);
assert.match(css, /\.prediction-fixture-top\s*>\s*small/);
assert.match(css, /\.prediction-fixture-top\s*>\s*time/);
assert.ok(html.includes('<link rel="stylesheet" href="minimal-copy-v2.css">'));
assert.ok(html.includes('<script src="prediction-share-v5.js"></script>'));
assert.ok(html.indexOf('prediction-share-v4.js') < html.indexOf('prediction-share-v5.js'));
assert.match(share, /formatDate\(fixture\.date\)/);
assert.doesNotMatch(share, /fixture\.week/);
assert.match(share, /prediction-share-v4-button/);
assert.match(share, /stopImmediatePropagation/);
assert.match(share, /image\/png/);

assert.match(share, /const componentThemes = Object\.freeze/);
assert.match(share, /uel:[\s\S]*header:[\s\S]*start:\s*\[76, 24, 4\][\s\S]*end:\s*\[4, 4, 4\]/);
assert.match(share, /uecl:[\s\S]*header:[\s\S]*start:\s*\[7, 61, 21\][\s\S]*end:\s*\[4, 4, 4\]/);
assert.match(share, /function applyGradientRegion\(image, canvasWidth, canvasHeight, rect, profile\)/);
assert.match(share, /function applyComponentGradients\(canvas, snapshot\)/);
assert.match(share, /applyGradientRegion\(image, canvas\.width, canvas\.height, scaleRect\(HEADER\), theme\.header\)/);
assert.match(share, /BODY\.leftX[\s\S]*theme\.panel/);
assert.match(share, /BODY\.rightX[\s\S]*theme\.panel/);
assert.match(share, /fixtureRects\(snapshot\)\.forEach[\s\S]*theme\.fixture/);
assert.doesNotMatch(share, /standings.*forEach[\s\S]*applyGradientRegion/i);
assert.match(share, /tile:\s*'rgba\(0, 0, 0, 0\.58\)'/);

assert.match(share, /function drawUntintedImage\(context, image, x, y, width, height\)/);
assert.match(share, /context\.globalAlpha = 1/);
assert.match(share, /context\.globalCompositeOperation = 'source-over'/);
assert.match(share, /context\.filter = 'none'/);
assert.match(share, /function buildLogoMap\(snapshot\)/);
assert.match(share, /add\(snapshot\.activeCrest\)/);
assert.match(share, /add\(snapshot\.competition\?\.logo\)/);
assert.match(share, /add\(fixture\.home\?\.crest\)/);
assert.match(share, /add\(fixture\.away\?\.crest\)/);
assert.match(share, /snapshot\.standings\.forEach\(\(row\) => add\(row\.team\?\.crest\)\)/);
assert.match(share, /function redrawUntintedLogos\(canvas, snapshot\)/);
assert.match(share, /STANDINGS_CENTER_X - headerLogoSize \/ 2/);
assert.match(share, /crestSize = Math\.min\(58, rect\.height - 54\)/);
assert.match(share, /crestSize = Math\.min\(20, rowHeight - 5\)/);
assert.match(share, /applyComponentGradients\(canvas, snapshot\);[\s\S]*redrawFixtureDates\(canvas, snapshot\)[\s\S]*redrawUntintedLogos\(canvas, snapshot\)/);
assert.match(share, /redrawLogoTile:\s*redrawUntintedLogos/);
assert.doesNotMatch(share, /function applyLeagueGradient/);
assert.doesNotMatch(share, /globalCompositeOperation\s*=\s*'overlay'/);

console.log('SVG branding, component gradients and untinted logo redraw checks passed.');