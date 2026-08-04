'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const css = read('ui-refinement-v4.css');
const css6 = read('ui-refinement-v6.css');
const css7 = read('ui-refinement-v7.css');
const ui = read('ui-refinement-v4.js');
const ui5 = read('ui-refinement-v5.js');
const branding = read('branding-fixes.js');
const ai = read('prediction-ai-controller.js');

assert.match(branding, /ui-refinement-v4\.css/);
assert.match(branding, /ui-refinement-v5\.css/);
assert.match(branding, /ui-refinement-v6\.css/);
assert.match(branding, /ui-refinement-v7\.css/);
assert.ok(branding.indexOf('ui-refinement-v6.css') < branding.indexOf('ui-refinement-v7.css'));
assert.ok(html.includes('<script src="ui-refinement-v4.js"></script>'));
assert.ok(html.indexOf('ui-refinement-v4.js') < html.indexOf('ui-refinement-v5.js'));
assert.match(branding, /retryButton:\s*'Tekrar Dene'/);
assert.match(branding, /customizeButton:\s*'Düzenle'/);
assert.match(branding, /changeTeamButton:\s*'Çıkış'/);
assert.match(branding, /Devam Et/);

assert.match(css, /html,[\s\S]*body[\s\S]*background-color:\s*#000\s*!important/);
assert.match(css, /#brandSubtitle[\s\S]*display:\s*none\s*!important/);
assert.match(css, /\.brand-copy h1[\s\S]*font-size:\s*clamp\(2\.45rem/);
assert.match(css, /\.team-search[\s\S]*rgba\(var\(--accent-rgb\), 0\.28\)/);
assert.match(css, /\.roster-team-action-simple[\s\S]*\.crest-shell\.large[\s\S]*width:\s*104px/);
assert.match(css, /\.draw-actions\.draw-actions-refined[\s\S]*grid-template-columns:\s*repeat\(6/);
assert.match(css, /\.prediction-entry-button\.primary[\s\S]*background:\s*var\(--accent\)/);
assert.match(css, /draw-header-refined[\s\S]*grid-template-columns:\s*1fr/);
assert.match(css, /draw-header-refined[\s\S]*\.progress-track\.is-complete[\s\S]*display:\s*none\s*!important/);
assert.match(css, /body\.prediction-active \.prediction-header\.prediction-header-refined[\s\S]*position:\s*sticky/);
assert.match(css, /\.prediction-header-refined \.prediction-back-button[\s\S]*grid-column:\s*2[\s\S]*grid-row:\s*1/);
assert.match(css, /\.prediction-outcome-team[\s\S]*flex-direction:\s*column/);
assert.match(css, /\.prediction-outcome-team \.prediction-crest[\s\S]*width:\s*94px/);
assert.match(css, /\.prediction-outcome-team strong[\s\S]*text-align:\s*center/);

assert.match(css6, /body\[data-league="uel"\][\s\S]*var\(--league-background, url\("assets\/arkaplanuel\.jpg"\)\)/);
assert.match(css6, /background-blend-mode:\s*color, multiply, normal/);
assert.match(css6, /\.team-search[\s\S]*rgba\(var\(--accent-rgb\), 0\.42\)[\s\S]*rgba\(0, 0, 0, 0\.34\)/);
assert.match(css6, /\.selection-toolbar\.glass[\s\S]*rgba\(0, 0, 0, 0\.42\)/);
assert.match(css6, /body\.draw-active \.draw-screen[\s\S]*gap:\s*0\s*!important/);
assert.match(css6, /body\.draw-active \.draw-stage[\s\S]*margin-top:\s*-2px\s*!important/);
assert.match(css6, /body\.draw-active \.draw-topbar\.themed-hero\.draw-header-refined[\s\S]*width:\s*min\(1080px, 100%\)[\s\S]*height:\s*76px/);
assert.match(css6, /body\.draw-active \.draw-topbar\.themed-hero\.draw-header-refined[\s\S]*padding:\s*2px 8px 12px\s*!important/);
assert.match(css6, /\.draw-header-refined \.polished-hero-crest[\s\S]*width:\s*58px/);
assert.match(css6, /body\.draw-active \.draw-topbar\.draw-header-refined \.progress-track[\s\S]*bottom:\s*3px/);
assert.match(css6, /body\.prediction-active \.prediction-header\.prediction-header-refined[\s\S]*--prediction-header-column-gap:\s*clamp\(18px, 2\.4vw, 28px\)/);
assert.match(css6, /grid-template-columns:\s*42px minmax\(0, 1fr\) minmax\(250px, 320px\)/);
assert.match(css6, /column-gap:\s*var\(--prediction-header-column-gap\)/);
assert.match(css6, /body\.prediction-active \.prediction-header\.prediction-header-refined[\s\S]*width:\s*min\(920px, 100%\)/);
assert.match(css6, /body\.prediction-active \.prediction-header\.prediction-header-refined[\s\S]*min-height:\s*70px/);
assert.match(css6, /\.prediction-header-refined \.prediction-back-button[\s\S]*width:\s*42px\s*!important/);
assert.match(css6, /\.prediction-header-refined \.prediction-back-button::before[\s\S]*content:\s*'←'/);
assert.match(css6, /\.prediction-header-refined \.prediction-hero-crest \.polished-hero-crest[\s\S]*width:\s*54px/);
assert.match(css6, /\.prediction-header-refined \.prediction-summary-status[\s\S]*display:\s*block\s*!important/);

assert.match(css7, /body\.draw-active \.draw-screen[\s\S]*align-content:\s*start\s*!important/);
assert.match(css7, /body\.draw-active \.draw-screen[\s\S]*grid-auto-rows:\s*max-content\s*!important/);
assert.match(css7, /body\.draw-active \.draw-screen[\s\S]*gap:\s*10px\s*!important/);
assert.match(css7, /body\.draw-active \.draw-stage[\s\S]*margin-top:\s*0\s*!important/);

assert.match(ui, /brandSubtitle\.hidden = true/);
assert.match(ui, /querySelectorAll\('\.league-state'\)/);
assert.match(ui, /setText\(ready, 'Hazır'\)/);
assert.match(ui, /roster-locked-note/);
assert.match(ui, /replace\(\/\\s\+hazır\$\/i/);
assert.match(ui, /const desired = \[retry, continueButton, customize, overview, exit\]/);
assert.match(ui, /retry\?\.classList\.remove\('primary'\)/);
assert.match(ui, /continueButton\?\.classList\.add\('primary'\)/);
assert.match(ui, /prediction-team-lock/);
assert.match(ui, /locked \? 'Kilitli' : 'Kilitle'/);
assert.match(ui, /button\.disabled !== locked/);

assert.match(ui5, /toLocaleUpperCase\('en-US'\)/);
assert.doesNotMatch(ui5, /toLocaleUpperCase\('tr-TR'\)/);
assert.match(ui5, /UCLDRAW_PREDICTION_SHARE_V8 \|\| window\.UCLDRAW_PREDICTION_SHARE_V7/);
assert.match(ui5, /prediction-share-v8\.js/);

assert.match(ai, /function applyOutcome\(state, matchId, outcome\)/);
assert.match(ai, /delete state\.matchLocks\[matchId\]/);
assert.match(ai, /__explicitMatchLock:\s*true/);

console.log('Full UI flow refinement checks passed.');
