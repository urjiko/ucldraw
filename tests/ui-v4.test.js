'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scheduleUi = fs.readFileSync(path.join(root, 'schedule-ui.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'v4.css'), 'utf8');

if (!html.includes('<script src="draw-engine-v2.js"></script>')) throw new Error('Scheduled draw engine is not loaded.');
if (!html.includes('<script src="schedule-ui.js"></script>')) throw new Error('Schedule UI layer is not loaded.');
if (!html.includes('<link rel="stylesheet" href="v4.css">')) throw new Error('v4.css is not loaded.');
if (!html.includes('data-control-mode="manual">Manuel</button>')) throw new Error('Controlled mode label is not concise.');

const selectedIndex = html.indexOf('id="selectedClubCard"');
const controlIndex = html.indexOf('id="drawControlPanel"');
const statusIndex = html.indexOf('id="drawStatus"');
if (!(selectedIndex < controlIndex && controlIndex < statusIndex)) {
  throw new Error('Draw controls must sit below the selected club card and above the status area.');
}

if (!scheduleUi.includes('Hafta ${index + 1}')) throw new Error('Fixture rows are not decorated with matchweeks.');
if (!css.includes('body.draw-active .draw-side .team-button')) throw new Error('Compact side-pot layout is missing.');
if (!css.includes('.draw-center .draw-control-panel-inline')) throw new Error('Inline center control styling is missing.');

console.log('UI v4 static checks passed.');
