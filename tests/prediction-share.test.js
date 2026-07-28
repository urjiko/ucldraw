'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const script = read('prediction-share.js');
const css = read('prediction-share.css');

assert.ok(html.includes('<link rel="stylesheet" href="prediction-share.css">'), 'prediction share CSS must be loaded');
assert.ok(html.includes('<script src="prediction-share.js"></script>'), 'prediction share script must be loaded');
assert.ok(html.indexOf('prediction-ui.js') < html.indexOf('prediction-share.js'), 'share controls must load after prediction UI');

assert.match(script, /CARD_WIDTH\s*=\s*1200/);
assert.match(script, /CARD_HEIGHT\s*=\s*1600/);
assert.match(script, /Şampiyonlar Ligi/);
assert.match(script, /Avrupa Ligi/);
assert.match(script, /Konferans Ligi/);
assert.match(script, /Maç Sonuçları/);
assert.match(script, /Puan Durumu/);
assert.match(script, /prediction-share-button/);
assert.match(script, /predictionsComplete/);
assert.match(script, /navigator\.share/);
assert.match(script, /navigator\.canShare/);
assert.match(script, /downloadBlob/);
assert.match(script, /new File/);
assert.match(script, /competition\.background/);
assert.match(script, /2026-27/);
assert.match(script, /progressTrack\.classList\.toggle\('is-complete'/);

assert.match(css, /\.prediction-share-button/);
assert.match(css, /line-height:\s*1\.08/);
assert.match(css, /padding-bottom:\s*0\.11em/);
assert.match(css, /\.progress-track\.is-complete/);
assert.match(css, /visibility:\s*hidden/);

console.log('Prediction journey sharing checks passed.');