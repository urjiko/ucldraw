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

assert.match(share, /uel:\s*Object\.freeze\([\s\S]*neutral:\s*0\.88/);
assert.match(share, /uecl:\s*Object\.freeze\([\s\S]*neutral:\s*0\.86/);
assert.match(share, /function applyLeagueTone\(canvas, snapshot\)/);
assert.match(share, /function isLeagueAccent\(leagueId, red, green, blue\)/);
assert.match(share, /context\.getImageData\(0, 0, canvas\.width, canvas\.height\)/);
assert.match(share, /context\.putImageData\(image, 0, 0\)/);
assert.match(share, /if \(!profile\) return canvas/);
assert.match(share, /applyLeagueTone\(canvas, snapshot\);[\s\S]*redrawFixtureDates\(canvas, snapshot\)/);
assert.match(share, /minimum > 185 && maximum > 215/);
assert.match(share, /maximum > 145 && chroma < 35/);

console.log('SVG branding, minimal metadata and dark share-tone checks passed.');