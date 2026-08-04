const fs = require('node:fs');
const assert = require('node:assert/strict');

const v8 = fs.readFileSync('prediction-share-v8.js', 'utf8');
const v9 = fs.readFileSync('prediction-share-v9.js', 'utf8');
const css = fs.readFileSync('prediction-share-v9.css', 'utf8');

assert.match(v8, /stylesheet\.href\s*=\s*'prediction-share-v9\.css'/);
assert.match(v8, /script\.src\s*=\s*'prediction-share-v9\.js'/);
assert.match(v8, /installHighResolutionExport\(\)/);

assert.match(v9, /const EXPORT_SCALE = 2/);
assert.match(v9, /const OUTPUT_WIDTH = CARD_WIDTH \* EXPORT_SCALE/);
assert.match(v9, /const OUTPUT_HEIGHT = CARD_HEIGHT \* EXPORT_SCALE/);
assert.match(v9, /context\.imageSmoothingQuality = 'high'/);
assert.match(v9, /2400x3200\.png/);
assert.match(v9, /async function shareCurrent\(\)/);
assert.match(v9, /navigator\.share/);
assert.match(v9, /navigator\.canShare/);
assert.match(v9, /button\.textContent = 'Paylaş'/);
assert.match(v9, /group\.replaceChildren\(createShareButton\('primary'\)\)/);
assert.match(v9, /Paylaşım desteklenmedi; PNG indirildi\./);
assert.doesNotMatch(v9, /createExportButton\('PNG İndir'/);
assert.doesNotMatch(v9, /createExportButton\('Kopyala'/);
assert.doesNotMatch(v9, /async function copyCurrent\(\)/);
assert.doesNotMatch(v9, /async function downloadCurrent\(\)/);
assert.match(v9, /window\.UCLDRAW_PREDICTION_SHARE_V9 = Object\.freeze/);

assert.match(css, /\.prediction-share-v4-button\.prediction-share-v9-legacy/);
assert.match(css, /\.prediction-export-group-v9[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\)/);
assert.match(css, /\.prediction-export-floating-v9[\s\S]*position:\s*fixed/);
assert.match(css, /width:\s*min\(260px, calc\(100vw - 24px\)\)/);
assert.doesNotMatch(css, /repeat\(3/);
assert.doesNotMatch(css, /repeat\(2/);

console.log('Single high-resolution native-share export checks passed.');
