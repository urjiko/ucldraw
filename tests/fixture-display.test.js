'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'fixture-display.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'fixture-display.css'), 'utf8');
const schedule = fs.readFileSync(path.join(root, 'schedule-ui.js'), 'utf8');
const manualScript = fs.readFileSync(path.join(root, 'manual-draw-v2.js'), 'utf8');
const manualCss = fs.readFileSync(path.join(root, 'manual-draw-v2.css'), 'utf8');

const baseEngineIndex = html.indexOf('<script src="draw-engine-v2.js"></script>');
const venueSequenceIndex = html.indexOf('<script src="venue-sequence-v4.js"></script>');
const appIndex = html.indexOf('<script src="app-v3.js"></script>');
const scheduleUiIndex = html.indexOf('<script src="schedule-ui.js"></script>');
const fixtureDisplayIndex = html.indexOf('<script src="fixture-display.js"></script>');

if (!(baseEngineIndex < venueSequenceIndex && venueSequenceIndex < appIndex)) {
  throw new Error('Venue sequence wrapper must load after the base engine and before the app.');
}
if (!(scheduleUiIndex < fixtureDisplayIndex)) {
  throw new Error('Fixture display formatter must load after matchweek decoration.');
}
if (!html.includes('<link rel="stylesheet" href="fixture-display.css">')) {
  throw new Error('Fixture display stylesheet is not loaded.');
}

const potPosition = script.indexOf("metadataSpan('fixture-pot'");
const teamPosition = script.indexOf('line.appendChild(teamName)');
const countryPosition = script.indexOf("metadataSpan('fixture-country'");
if (!(potPosition < teamPosition && teamPosition < countryPosition)) {
  throw new Error('Fixture metadata order must be Pot, Team, Country.');
}
if (script.includes("metadataSpan('fixture-week'")) {
  throw new Error('Duplicate matchweek text must not be rendered at the row end.');
}
if (!css.includes('.fixture-team.fixture-team-primary') || !css.includes('color: #fff')) {
  throw new Error('Team name must be explicitly white.');
}
if (!css.includes('.fixture-country') || !css.includes('margin-left: auto')) {
  throw new Error('Country abbreviation must occupy the row-end metadata position.');
}
if (!css.includes('.fixture-week { display: none !important; }')) {
  throw new Error('Legacy matchweek metadata must remain hidden.');
}

if (!schedule.includes("stylesheet.href = 'manual-draw-v2.css'")) {
  throw new Error('Manual draw refinement stylesheet loader is missing.');
}
if (!schedule.includes("script.src = 'manual-draw-v2.js'")) {
  throw new Error('Manual draw refinement script loader is missing.');
}

new Function(manualScript);
if (!manualScript.includes("window.matchMedia('(max-width: 930px), (orientation: portrait)')")) {
  throw new Error('Portrait/dar layout detection is missing.');
}
if (!manualScript.includes('BASE_MANUAL_WINDOW / speed')) {
  throw new Error('Manual draw duration must scale with the selected speed.');
}
if (!manualScript.includes("Pot ${pot}'ten takım seçiliyor...")) {
  throw new Error('Manual draw status must identify the active pot.');
}
if (!manualScript.includes('fixture-inline-roulette') || !manualScript.includes('candidate.crest')) {
  throw new Error('Inline candidate names and crests are not rendered in the active slot.');
}
if (!manualScript.includes("manualButton.style.setProperty('--manual-progress'")) {
  throw new Error('Manual progress must drive the button fill.');
}
if (!manualCss.includes('.manual-countdown') || !manualCss.includes('display: none !important')) {
  throw new Error('Standalone manual countdown must be hidden.');
}
if (!manualCss.includes('var(--manual-progress)') || !manualCss.includes('.fixture-inline-roulette')) {
  throw new Error('Manual draining bar or inline roulette styles are missing.');
}
if (!manualCss.includes('.initial-speed.is-disabled') || !manualCss.includes('pointer-events: auto !important')) {
  throw new Error('Speed controls must remain usable in manual mode.');
}

console.log('Fixture display and portrait manual draw refinements passed.');
