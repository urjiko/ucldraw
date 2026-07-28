'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const css = read('champions-font.css');
const loader = read('champions-font-loader.js');
const share = read('prediction-share-v4.js');

function readFont(prefix) {
  const parts = [1, 2, 3, 4].map((part) => {
    const source = read(`font-data/champions-${prefix}-${part}.js`);
    const match = source.match(/\+'([A-Za-z0-9+/=]+)'/);
    assert.ok(match, `${prefix} font parçası ${part} okunamadı`);
    return match[1];
  });
  return Buffer.from(parts.join(''), 'base64');
}

const regular = readFont('regular');
const bold = readFont('bold');
assert.equal(regular.subarray(0, 4).toString('ascii'), 'wOF2');
assert.equal(bold.subarray(0, 4).toString('ascii'), 'wOF2');
assert.equal(regular.length, 17200);
assert.equal(bold.length, 17312);

for (const file of [
  'font-data/champions-regular-1.js',
  'font-data/champions-regular-2.js',
  'font-data/champions-regular-3.js',
  'font-data/champions-regular-4.js',
  'font-data/champions-bold-1.js',
  'font-data/champions-bold-2.js',
  'font-data/champions-bold-3.js',
  'font-data/champions-bold-4.js',
  'champions-font-loader.js'
]) assert.ok(html.includes(file), `${file} index içinde bulunamadı`);

assert.ok(html.indexOf('champions-regular-1.js') < html.indexOf('champions-font-loader.js'));
assert.ok(html.indexOf('champions-bold-4.js') < html.indexOf('champions-font-loader.js'));
assert.ok(html.indexOf('champions-font-loader.js') < html.indexOf('prediction-share-v4.js'));
assert.match(loader, /new FontFace\(FONT_FAMILY/);
assert.match(loader, /installFont\(400/);
assert.match(loader, /installFont\(700/);
assert.match(loader, /document\.fonts\.add/);
assert.match(css, /font-family: "Champions Sans"/);
assert.match(share, /UCLDRAW_CHAMPIONS_FONT_READY/);
assert.match(share, /700 74px \"Champions Sans\"/);
assert.match(share, /400 40px \"Champions Sans\"/);
assert.match(share, /image\/png/);
assert.doesNotMatch(share, /image\/jpeg/);

console.log('Licensed Champions webfont checks passed.');
