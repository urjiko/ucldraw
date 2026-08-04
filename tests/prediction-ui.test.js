'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const bridge = read('prediction-bridge.js');
const ui = read('prediction-ui.js');
const header = read('prediction-header-v2.js');
const css = read('prediction.css');
const compactCss = read('prediction-compact.css');
const headerCss = read('prediction-header-v2.css');
const refinementCss = read('ui-refinement-v6.css');
const branding = read('branding-fixes.js');
const polish = read('interface-polish.js');
const polishCss = read('interface-polish.css');

for (const file of ['prediction.css', 'prediction-engine.js', 'prediction-bridge.js', 'prediction-ui.js']) {
  assert.ok(html.includes(file), `${file} must be loaded by index.html`);
}

assert.ok(html.indexOf('draw-engine-v2.js') < html.indexOf('prediction-bridge.js'), 'prediction bridge must load after the draw engine');
assert.ok(html.indexOf('prediction-bridge.js') < html.indexOf('app-v3.js'), 'prediction bridge must be available before the app starts');
assert.ok(html.indexOf('app-v3.js') < html.indexOf('prediction-ui.js'), 'prediction UI must load after the draw app');
assert.ok(html.indexOf('prediction-ui.js') < html.indexOf('interface-polish.js'), 'prediction header polish must load after prediction UI');
assert.match(bridge, /UCLDRAW_LAST_DRAW/);
assert.match(bridge, /ucldraw:draw-generated/);
assert.match(bridge, /DOMContentLoaded/);
assert.match(ui, /prediction-outcome-team/);
assert.match(ui, /prediction-draw-choice/);
assert.match(ui, /ENGINE\.applyOutcome/);
assert.match(ui, /ENGINE\.setManualScore/);
assert.match(ui, /ENGINE\.toggleTeamLock/);
assert.match(ui, /Takımı Kilitle/);
assert.match(ui, /button\.addEventListener\('click'/);
assert.doesNotMatch(ui, /\[3,\s*1,\s*0\]/);
assert.doesNotMatch(ui, /travelContext|Akdeniz|Kuzey deplasmanı/);

assert.match(header, /engine\.standings\(state\)/);
assert.match(header, /setText\(rank, `\$\{row\.rank\}\. sıra`\)/);
assert.match(header, /setText\(status, zoneText\(row\.zone\)\)/);
assert.match(header, /setText\(stats, `\$\{progress\.completed\}\/\$\{progress\.total\} maç · \$\{average\} AV`\)/);
assert.match(header, /prediction-header-progress-track/);
assert.match(header, /if \(element && element\.textContent !== value\)/);
assert.match(headerCss, /\.prediction-header-compact \.prediction-summary-status[\s\S]*display:\s*block !important/);
assert.match(refinementCss, /width:\s*min\(920px, 100%\)\s*!important/);
assert.match(refinementCss, /\.prediction-header-refined \.prediction-back-button::before[\s\S]*content:\s*'←'/);
assert.match(refinementCss, /width:\s*42px\s*!important/);

assert.doesNotMatch(css, /prediction-hover-card/);
assert.match(css, /\.prediction-outcome-team/);
assert.match(css, /\.prediction-draw-choice/);
assert.match(css, /\.prediction-team-lock/);
assert.match(css, /body\.prediction-active \.draw-stage/);
assert.match(css, /\.prediction-standing-row/);
assert.match(compactCss, /\.prediction-outcome-team > small/);
assert.match(compactCss, /max-width:\s*480px/);
assert.match(compactCss, /grid-template-columns:\s*26px minmax\(0, 1fr\) 40px 40px/);
assert.match(compactCss, /prediction-standing-row > :nth-child\(5\)/);
assert.match(compactCss, /min-width:\s*0 !important/);
assert.match(compactCss, /overflow:\s*hidden !important/);
assert.match(compactCss, /\.prediction-zone-legend\s*\{[\s\S]*display:\s*none !important/);
assert.match(compactCss, /animation:\s*fixtureSettle/);
assert.doesNotMatch(compactCss, /animation:\s*fixtureIn(?:Left|Right)/);
assert.match(branding, /retryButton:\s*'Tekrar Dene'/);
assert.match(branding, /showOverviewButton:\s*'Tüm Maçlar'/);
assert.match(branding, /customizeButton:\s*'Düzenle'/);
assert.match(branding, /changeTeamButton:\s*'Çıkış'/);
assert.match(branding, /Devam Et/);
assert.match(branding, /prediction-compact\.css/);
assert.match(branding, /ui-refinement-v4\.css/);
assert.ok(html.includes('<script src="ui-refinement-v4.js"></script>'));
assert.ok(html.includes('<script src="ui-refinement-v5.js"></script>'));
assert.match(polish, /prediction-header-identity/);
assert.match(polish, /copy\.querySelector\('p'\)\?\.remove\(\)/);
assert.match(polish, /Kuraya Dön/);
assert.match(polish, /syncCompletedDrawUi/);
assert.match(polish, /drawStatus\.hidden = completed/);
assert.match(polish, /openedByUser/);
assert.match(polishCss, /\.prediction-panel-heading > span/);
assert.match(polishCss, /\.prediction-header\.themed-hero/);
assert.match(polishCss, /text-shadow:/);

console.log('Compact logo prediction UI checks passed.');
