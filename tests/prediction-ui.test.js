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
assert.ok(html.indexOf('prediction-bridge.js') < html.indexOf('app-v3.js'), 'prediction bridge must wrap draw generation before the app starts');
assert.ok(html.indexOf('app-v3.js') < html.indexOf('prediction-ui.js'), 'prediction UI must load after the draw app');
assert.match(bridge, /UCLDRAW_LAST_DRAW/);
assert.match(bridge, /ucldraw:draw-generated/);
assert.match(ui, /Tahmin kısmına geç/);
assert.match(ui, /\[3, 1, 0\]/);
assert.match(ui, /ENGINE\.applyPoints/);
assert.match(ui, /ENGINE\.setManualScore/);
assert.match(ui, /ENGINE\.standings/);
assert.match(ui, /Skoru uygula/);
assert.match(ui, /Takımın üstüne gelerek tahmini fikstürü gör/);
assert.match(ui, /Kura sonuçlarına dön/);
assert.match(css, /\.prediction-standing-row:hover \.prediction-hover-card/);
assert.match(css, /body\.prediction-active \.draw-stage/);
assert.match(css, /\.prediction-score-editor/);
assert.match(css, /\.prediction-zone-legend/);

console.log('Prediction UI wiring checks passed.');
