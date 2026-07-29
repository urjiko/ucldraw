'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const branding = read('branding-fixes.js');
const css = read('ui-refinement-v5.css');
const ui = read('ui-refinement-v5.js');
const share = read('prediction-share-v7.js');

assert.ok(html.includes('<script src="ui-refinement-v5.js"></script>'));
assert.ok(html.includes('<script src="prediction-share-v7.js" data-prediction-share-v7="true"></script>'));
assert.ok(html.indexOf('ui-refinement-v5.js') < html.indexOf('prediction-share-v4.js'), 'share interception must register before legacy share listeners');
assert.ok(html.indexOf('prediction-share-v6.js') < html.indexOf('prediction-share-v7.js'), 'v7 must render after v6');
assert.match(branding, /ui-refinement-v5\.css/);

assert.match(css, /\.draw-topbar\.themed-hero::before[\s\S]*content:\s*none\s*!important/);
assert.match(css, /\.prediction-header\.themed-hero::after[\s\S]*display:\s*none\s*!important/);
assert.match(css, /\.roster-team-action-simple \.roster-incoming-team[\s\S]*gap:\s*0\s*!important/);
assert.match(css, /padding:\s*3px 12px\s*!important/);
assert.match(css, /width:\s*102px\s*!important/);
assert.match(css, /\.draw-header-refined \.draw-kicker[\s\S]*display:\s*block\s*!important/);
assert.match(css, /0 0 88px rgba\(0, 0, 0, 0\.82\)/);
assert.match(css, /grid-template-columns:\s*minmax\(0, 1fr\) minmax\(190px, 245px\) auto\s*!important/);
assert.match(css, /\.prediction-header-refined \.prediction-header-controls[\s\S]*grid-column:\s*2\s*!important/);
assert.match(css, /\.prediction-header-refined \.prediction-back-button[\s\S]*grid-column:\s*3\s*!important/);
assert.match(css, /\.prediction-outcome-team:disabled[\s\S]*opacity:\s*1\s*!important/);
assert.match(css, /\.prediction-share-floating[\s\S]*position:\s*fixed/);
assert.match(css, /bottom:\s*max\(14px, env\(safe-area-inset-bottom\)\)/);

assert.match(ui, /return `\$\{name\} - KURA`/);
assert.match(ui, /delete state\.matchLocks\[match\.id\]/);
assert.match(ui, /button\.classList\.remove\('is-match-locked'\)/);
assert.match(ui, /setText\(button, 'Kilitle'\)/);
assert.match(ui, /button\.disabled = false/);
assert.match(ui, /IntersectionObserver/);
assert.match(ui, /prediction-share-floating-button/);
assert.match(ui, /event\.stopImmediatePropagation\(\)/);
assert.match(ui, /UCLDRAW_PREDICTION_SHARE_V7/);

assert.match(share, /const V6 = window\.UCLDRAW_PREDICTION_SHARE_V6/);
assert.match(share, /async function redrawAlignedHeader/);
assert.match(share, /context\.fillText\('2026-27', copyX, clubY \+ 30\)/);
assert.match(share, /context\.fillText\(snapshot\.activeName, copyX, clubY \+ 96\)/);
assert.match(share, /context\.fillText\(journey, copyX, clubY \+ 145\)/);
assert.match(share, /drawCrestWithShadow\(context, leagueLogo[\s\S]*30, 44\)/);
assert.match(share, /function conferenceFixtureRects\(snapshot\)/);
assert.match(share, /const bottomMargin = 18/);
assert.match(share, /x:\s*BODY\.leftX \+ 18/);
assert.match(share, /width:\s*BODY\.leftWidth - 36/);
assert.match(share, /snapshot\.competition\?\.id !== 'uecl'/);
assert.match(share, /await redrawAlignedHeader\(canvas, snapshot\)/);
assert.match(share, /await redrawConferenceFixtures\(canvas, snapshot\)/);
assert.doesNotMatch(share, /repeating-linear-gradient|radial-gradient/);

console.log('Header, unlockable lock, floating share and v7 output checks passed.');
