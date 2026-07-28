'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const script = read('prediction-share-v3.js');
const css = read('prediction-share-v3.css');

assert.ok(html.includes('prediction-share-v3.css'));
assert.ok(html.includes('prediction-share-v3.js'));
assert.ok(html.indexOf('prediction-share-v2.js') < html.indexOf('prediction-share-v3.js'));
assert.match(script, /CHAMPIONS LEAGUE · TAHMİN/);
assert.doesNotMatch(script, /CHAMPİONS/);
assert.match(script, /prediction-kicker-exact-case/);
assert.match(css, /text-transform: none !important/);
assert.match(script, /const STANDINGS_CENTER_X = RIGHT_PANEL_X \+ RIGHT_PANEL_WIDTH \/ 2/);
assert.match(script, /const leagueLogoX = STANDINGS_CENTER_X - leagueLogoSize \/ 2/);
assert.match(script, /"Barlow Condensed"/);
assert.match(script, /document\.fonts\.load\('800 72px "Barlow Condensed"'\)/);
assert.match(script, /Şampiyonlar Ligi Yolculuğu/);
assert.match(script, /Konferans Ligi Yolculuğu/);
assert.match(script, /urjiko\.github\.io\/UEFA/);
assert.match(css, /prediction-share-actions-v2[\s\S]*display: none !important/);
assert.match(css, /prediction-share-actions-v3\.has-share[\s\S]*repeat\(2/);
assert.equal(fs.existsSync(path.join(root, 'Champions-Bold.ttf')), false);
assert.equal(fs.existsSync(path.join(root, 'fonts', 'Champions-Bold.ttf')), false);

console.log('Prediction banner and share header v3 checks passed.');
