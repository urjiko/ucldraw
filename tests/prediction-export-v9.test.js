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
assert.match(v9, /navigator\.clipboard\?\.write/);
assert.match(v9, /new ClipboardItem\(\{ 'image\/png': output\.blob \}\)/);
assert.match(v9, /async function downloadCurrent\(\)/);
assert.match(v9, /async function copyCurrent\(\)/);
assert.match(v9, /async function shareCurrent\(\)/);
assert.match(v9, /createExportButton\('PNG İndir', 'download'/);
assert.match(v9, /createExportButton\('Kopyala', 'copy'/);
assert.match(v9, /createExportButton\('Paylaş', 'share'/);
assert.match(v9, /Tarayıcı görsel kopyalamayı desteklemedi; PNG indirildi\./);
assert.match(v9, /window\.UCLDRAW_PREDICTION_SHARE_V9 = Object\.freeze/);

assert.match(css, /\.prediction-share-v4-button\.prediction-share-v9-legacy/);
assert.match(css, /\.prediction-export-group-v9[\s\S]*grid-template-columns:\s*repeat\(3/);
assert.match(css, /\.prediction-export-floating-v9[\s\S]*position:\s*fixed/);
assert.match(css, /@media \(max-width:\s*460px\)/);

console.log('High-resolution download, clipboard and native-share export checks passed.');