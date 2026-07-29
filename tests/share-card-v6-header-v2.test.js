'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const share = read('prediction-share-v6.js');
const headerJs = read('prediction-header-v2.js');
const headerCss = read('prediction-header-v2.css');

assert.ok(html.includes('<link rel="stylesheet" href="prediction-header-v2.css">'));
assert.ok(html.includes('<script src="prediction-header-v2.js"></script>'));
assert.ok(html.includes('<script src="prediction-share-v6.js"></script>'));
assert.ok(html.indexOf('prediction-share-v5.js') < html.indexOf('prediction-share-v6.js'));

assert.match(share, /const V5 = window\.UCLDRAW_PREDICTION_SHARE_V5/);
assert.match(share, /function fillCardGradient\(context, rect, theme\)/);
assert.match(share, /context\.strokeStyle = theme\.stroke/);
assert.match(share, /context\.lineWidth = 1\.8/);
assert.match(share, /const crestSize = Math\.min\(68, Math\.max\(54, rect\.height \* 0\.48\)\)/);
assert.match(share, /context\.fillText\(fixture\.home\.name, homeCenterX, nameY, nameWidth\)/);
assert.match(share, /context\.fillText\(fixture\.away\.name, awayCenterX, nameY, nameWidth\)/);
assert.match(share, /context\.fillText\(formatDate\(fixture\.date\), rect\.x \+ rect\.width \/ 2, rect\.y \+ 23\)/);
assert.doesNotMatch(share, /dateBanner|dateBackground|fillText\(fixture\.week/);
assert.match(share, /drawCrestWithShadow\(context, clubCrest/);
assert.doesNotMatch(share, /tile:\s*'rgba\(0, 0, 0/);
assert.match(share, /document\.addEventListener\('click',[\s\S]*prediction-share-v4-button[\s\S]*true\);/);
assert.match(share, /redrawHeader\(canvas, snapshot\)[\s\S]*redrawFixtureCards\(canvas, snapshot\)/);

assert.match(headerJs, /function parseProgress\(summary\)/);
assert.match(headerJs, /Math\.round\(\(completed \/ total\) \* 100\)/);
assert.match(headerJs, /prediction-header-progress-track/);
assert.match(headerJs, /style\.width = `\$\{progress\.percentage\}%`/);
assert.match(headerCss, /width:\s*min\(1120px, 100%\)/);
assert.match(headerCss, /min-height:\s*94px/);
assert.match(headerCss, /width:\s*60px !important/);
assert.match(headerCss, /grid-template-columns:\s*auto minmax\(205px, 238px\)/);
assert.match(headerCss, /\.prediction-header-progress-track/);

console.log('Refined share-card and prediction-header checks passed.');