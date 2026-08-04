'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const share = read('prediction-share-v6.js');
const headerJs = read('prediction-header-v2.js');
const headerCss = read('prediction-header-v2.css');
const refinementCss = read('ui-refinement-v8.css');
const branding = read('branding-fixes.js');

assert.ok(html.includes('<link rel="stylesheet" href="prediction-header-v2.css">'));
assert.ok(html.includes('<script src="prediction-header-v2.js"></script>'));
assert.ok(html.includes('<script src="prediction-share-v6.js"></script>'));
assert.ok(html.indexOf('prediction-share-v5.js') < html.indexOf('prediction-share-v6.js'));

assert.match(share, /const V5 = window\.UCLDRAW_PREDICTION_SHARE_V5/);
assert.match(share, /const CARD_OPACITY = 0\.62/);
assert.match(share, /function restorePanelSurface\(context, canvas, rect, scaleX, scaleY\)/);
assert.match(share, /function fillCardGradient\(context, rect, theme\)/);
assert.match(share, /gradient\.addColorStop\(0, rgba\(theme\.cardStart\)\)/);
assert.match(share, /gradient\.addColorStop\(0\.56, rgba\(theme\.cardMiddle\)\)/);
assert.match(share, /gradient\.addColorStop\(1, rgba\(theme\.cardEnd\)\)/);
assert.match(share, /uecl:[\s\S]*cardStart: Object\.freeze\(\[8, 57, 24\]\)[\s\S]*cardEnd: Object\.freeze\(\[3, 23, 10\]\)/);
assert.doesNotMatch(share, /gradient\.addColorStop\(1, '#040404'\)/);
assert.match(share, /context\.strokeStyle = theme\.stroke/);
assert.match(share, /context\.lineWidth = 1\.8/);
assert.match(share, /const crestSize = Math\.min\(72, Math\.max\(58, rect\.height \* 0\.51\)\)/);
assert.match(share, /const scoreX = rect\.x \+ rect\.width \/ 2/);
assert.match(share, /const scoreY = rect\.y \+ rect\.height \/ 2/);
assert.match(share, /context\.font = '700 38px "Champions Sans", Arial, sans-serif'/);
assert.match(share, /context\.fillText\(score, scoreX, scoreY\)/);
assert.match(share, /context\.fillText\(fixture\.home\.name, homeCenterX, nameY, nameWidth\)/);
assert.match(share, /context\.fillText\(fixture\.away\.name, awayCenterX, nameY, nameWidth\)/);
assert.match(share, /context\.fillText\(formatDate\(fixture\.date\), rect\.x \+ rect\.width \/ 2, rect\.y \+ 18\)/);
assert.doesNotMatch(share, /dateBanner|dateBackground|fillText\(fixture\.week/);
assert.match(share, /if \(leagueId === 'uecl'\)[\s\S]*context\.fillStyle = '#03180b'/);
assert.match(share, /context\.fillText\('2026-27', copyX, HEADER\.y \+ 51\)/);
assert.match(share, /context\.fillText\(snapshot\.activeName, copyX, HEADER\.y \+ 117\)/);
assert.match(share, /context\.fillText\(journey, copyX, HEADER\.y \+ 166\)/);
assert.match(share, /drawCrestWithShadow\(context, clubCrest/);
assert.match(share, /document\.addEventListener\('click',[\s\S]*prediction-share-v4-button[\s\S]*true\);/);

for (const [leagueId, asset] of Object.entries({
  ucl: 'crests/pools/champions/UCL_Logo.svg',
  uel: 'crests/pools/europa/UEL_Logo.svg',
  uecl: 'crests/pools/conference/CON_Logo.svg'
})) {
  assert.ok(branding.includes(`${leagueId}: '${asset}'`), `${leagueId} SVG mapping missing`);
}
assert.match(branding, /Object\.entries\(svgLogos\)\.forEach/);
assert.match(branding, /#competitionPicker button\[data-league\]/);
assert.match(branding, /#brandMark img/);
assert.match(branding, /ui-refinement-v8\.css/);
assert.match(branding, /data-ui-refinement-v8/);

assert.match(headerJs, /function fallbackProgress\(summary\)/);
assert.match(headerJs, /engine\.standings\(state\)/);
assert.match(headerJs, /engine\.progress\(state, activeName\)/);
assert.match(headerJs, /setText\(rank, `\$\{row\.rank\}\. sıra`\)/);
assert.match(headerJs, /setText\(status, zoneText\(row\.zone\)\)/);
assert.match(headerJs, /prediction-header-progress-track/);
assert.match(headerJs, /new ClipboardItem|prediction-header-progress-value/);
assert.doesNotMatch(headerJs, /prediction-header-progress-label/);
assert.match(headerJs, /header\.dataset\.progress = String\(progress\.percentage\)/);
assert.match(headerCss, /width:\s*min\(920px, 100%\)/);
assert.match(headerCss, /\.prediction-back-button::before[\s\S]*content:\s*'←'/);
assert.match(headerCss, /\.prediction-header-progress-track/);

assert.match(refinementCss, /grid-template-columns:\s*38px minmax\(0, 1fr\) minmax\(220px, 300px\)/);
assert.match(refinementCss, /grid-template-rows:\s*1fr\s*!important/);
assert.match(refinementCss, /\.prediction-header-progress[\s\S]*display:\s*contents\s*!important/);
assert.match(refinementCss, /@media \(max-width:\s*600px\)[\s\S]*grid-template-columns:\s*34px minmax\(0, 1fr\) minmax\(132px, 150px\)/);
assert.match(refinementCss, /\.prediction-summary-status,[\s\S]*\.prediction-header-progress-value[\s\S]*display:\s*block\s*!important/);
assert.match(refinementCss, /draw-header-refined\.is-complete[\s\S]*place-items:\s*center\s*!important/);
assert.match(refinementCss, /:has\(\.progress-track\.is-complete\)/);

console.log('Soft glass share-card, SVG picker and one-row prediction-header checks passed.');
