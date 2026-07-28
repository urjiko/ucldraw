'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const bridge = read('prediction-bridge.js');
const ui = read('prediction-ui.js');
const css = read('prediction.css');

for (const file of ['prediction.css', 'prediction-engine.js', 'prediction-bridge.js', 'prediction-ui.js']) {
  assert.ok(html.includes(file), `${file} must be loaded by index.html`);
}

assert.ok(html.indexOf('draw-engine-v2.js') < html.indexOf('prediction-bridge.js'), 'prediction bridge must load after the draw engine');
assert.ok(html.indexOf('prediction-bridge.js') < html.indexOf('app-v3.js'), 'prediction bridge must be available before the app starts');
assert.ok(html.indexOf('app-v3.js') < html.indexOf('prediction-ui.js'), 'prediction UI must load after the draw app');
assert.match(bridge, /UCLDRAW_LAST_DRAW/);
assert.match(bridge, /ucldraw:draw-generated/);
assert.match(bridge, /DOMContentLoaded/);
assert.match(ui, /changeTeamButton\.textContent\s*=\s*'Başa Dön'/);
assert.match(ui, /Tahminlere Geç/);
assert.match(ui, /prediction-outcome-team/);
assert.match(ui, /prediction-draw-choice/);
assert.match(ui, /ENGINE\.applyOutcome/);
assert.match(ui, /ENGINE\.setManualScore/);
assert.match(ui, /ENGINE\.toggleTeamLock/);
assert.match(ui, /Takımı Kilitle/);
assert.match(ui, /Takıma basarak maçlarını düzenle/);
assert.match(ui, /button\.addEventListener\('click'/);
assert.doesNotMatch(ui, /\[3,\s*1,\s*0\]/);
assert.doesNotMatch(ui, /travelContext|Akdeniz|Kuzey deplasmanı/);
assert.doesNotMatch(css, /prediction-hover-card/);
assert.match(css, /\.prediction-outcome-team/);
assert.match(css, /\.prediction-draw-choice/);
assert.match(css, /\.prediction-team-lock/);
assert.match(css, /body\.prediction-active \.draw-stage/);
assert.match(css, /\.prediction-standing-row/);

console.log('Minimal logo prediction UI checks passed.');