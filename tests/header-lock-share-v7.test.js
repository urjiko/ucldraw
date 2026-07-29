'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const branding = read('branding-fixes.js');
const css = read('ui-refinement-v5.css');
const css6 = read('ui-refinement-v6.css');
const ui = read('ui-refinement-v5.js');
const share = read('prediction-share-v7.js');
const share8 = read('prediction-share-v8.js');

assert.ok(html.includes('<script src="ui-refinement-v5.js"></script>'));
assert.ok(html.includes('<script src="prediction-share-v7.js" data-prediction-share-v7="true"></script>'));
assert.ok(html.indexOf('ui-refinement-v5.js') < html.indexOf('prediction-share-v4.js'), 'share interception must register before legacy share listeners');
assert.ok(html.indexOf('prediction-share-v6.js') < html.indexOf('prediction-share-v7.js'), 'v7 must render after v6');
assert.match(branding, /ui-refinement-v5\.css/);
assert.match(branding, /ui-refinement-v6\.css/);

assert.match(css, /body\[data-league="uel"\][\s\S]*linear-gradient\(145deg, #2a0d02 0%, #100401 46%, #000 100%\)/);
assert.doesNotMatch(css, /body\[data-league="uel"\][\s\S]*arkaplanuel\.jpg/);
assert.match(css, /\.draw-topbar\.themed-hero::before[\s\S]*content:\s*none\s*!important/);
assert.match(css, /\.prediction-header\.themed-hero::after[\s\S]*display:\s*none\s*!important/);
assert.match(css, /\.roster-team-action-simple \.roster-incoming-team[\s\S]*gap:\s*0\s*!important/);
assert.match(css, /\.roster-team-action-simple\.is-simple-action-modal[\s\S]*grid-template-columns:\s*repeat\(2/);
assert.match(css, /padding:\s*3px 12px\s*!important/);
assert.match(css, /width:\s*102px\s*!important/);
assert.match(css, /\.draw-header-refined \.draw-kicker[\s\S]*display:\s*block\s*!important/);
assert.match(css, /\.draw-header-refined \.draw-title[\s\S]*text-shadow:\s*none\s*!important/);
assert.match(css, /\.prediction-header-refined \.prediction-header-identity h2[\s\S]*text-shadow:\s*none\s*!important/);
assert.match(css, /width:\s*min\(1014px, 100%\)\s*!important/);
assert.match(css, /--prediction-header-control-height:\s*64px/);
assert.match(css, /\.prediction-header-refined \.prediction-back-button[\s\S]*height:\s*var\(--prediction-header-control-height\)/);
assert.match(css, /\.prediction-header-refined \.prediction-summary[\s\S]*align-content:\s*center/);
assert.match(css, /\.prediction-standings-panel[\s\S]*background:\s*none\s*!important/);
assert.match(css, /\.prediction-standings-card[\s\S]*padding:\s*10px/);
assert.match(css, /\.prediction-outcome-team[\s\S]*min-height:\s*108px\s*!important/);
assert.match(css, /\.prediction-outcome-team \.prediction-crest[\s\S]*width:\s*74px\s*!important/);
assert.match(css, /\.prediction-outcome-team:disabled[\s\S]*opacity:\s*1\s*!important/);
assert.match(css, /\.prediction-share-floating[\s\S]*position:\s*fixed/);
assert.match(css, /bottom:\s*max\(14px, env\(safe-area-inset-bottom\)\)/);

assert.match(css6, /body\.draw-active \.draw-topbar\.themed-hero\.draw-header-refined[\s\S]*min-height:\s*70px/);
assert.match(css6, /\.draw-header-refined \.polished-hero-crest[\s\S]*width:\s*64px/);
assert.match(css6, /--prediction-header-column-gap:\s*clamp\(18px, 2\.4vw, 28px\)/);
assert.match(css6, /column-gap:\s*var\(--prediction-header-column-gap\)/);

assert.match(ui, /return `\$\{name\} - KURA`/);
assert.match(ui, /refineTeamActionButtons/);
assert.match(ui, /is-simple-action-modal/);
assert.match(ui, /refineStandingsPanel/);
assert.match(ui, /prediction-standings-card glass/);
assert.match(ui, /panel\.classList\.remove\('glass'\)/);
assert.match(ui, /delete state\.matchLocks\[match\.id\]/);
assert.match(ui, /button\.classList\.remove\('is-match-locked'\)/);
assert.match(ui, /setText\(button, 'Kilitle'\)/);
assert.match(ui, /button\.disabled = false/);
assert.match(ui, /IntersectionObserver/);
assert.match(ui, /prediction-share-floating-button/);
assert.match(ui, /event\.stopImmediatePropagation\(\)/);
assert.match(ui, /UCLDRAW_PREDICTION_SHARE_V8 \|\| window\.UCLDRAW_PREDICTION_SHARE_V7/);
assert.match(ui, /function installShareRendererV8\(\)/);

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

assert.match(share8, /const V7 = window\.UCLDRAW_PREDICTION_SHARE_V7/);
assert.match(share8, /async function redrawClubCrestWithBlackShadow/);
assert.match(share8, /context\.shadowColor = 'rgba\(0, 0, 0, 0\.96\)'/);
assert.match(share8, /context\.shadowBlur = 42/);
assert.match(share8, /context\.fillRect\(HEADER\.x, HEADER\.y, CLUB\.repaintRight - HEADER\.x, HEADER\.height\)/);
assert.match(share8, /await redrawClubCrestWithBlackShadow\(canvas, snapshot\)/);
assert.doesNotMatch(share8, /theme\.glow/);

console.log('Matched live headers, reversible locks and black-shadow v8 output checks passed.');
