'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const [prefix, partValue, expectedValue] = process.argv.slice(2);
const part = Number(partValue);
const expected = Number(expectedValue);
assert.ok(prefix && part && expected, 'prefix, part ve expected gerekli');
const file = path.resolve(__dirname, '..', 'font-data', `champions-${prefix}-${part}.js`);
const source = fs.readFileSync(file, 'utf8');
const match = source.match(/\+'([A-Za-z0-9+/=]+)'/);
assert.ok(match, `${prefix} ${part} okunamadı`);
assert.equal(match[1].length, expected, `${prefix} ${part} uzunluğu yanlış`);
console.log(`${prefix} part ${part}: ${match[1].length}`);
