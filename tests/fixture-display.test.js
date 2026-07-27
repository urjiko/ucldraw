'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'fixture-display.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'fixture-display.css'), 'utf8');

const baseEngineIndex = html.indexOf('<script src="draw-engine-v2.js"></script>');
const venueSequenceIndex = html.indexOf('<script src="venue-sequence-v2.js"></script>');
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
const weekPosition = script.indexOf("metadataSpan('fixture-week'");
if (!(potPosition < teamPosition && teamPosition < countryPosition && countryPosition < weekPosition)) {
  throw new Error('Fixture metadata order must be Pot, Team, Country, Matchweek.');
}
if (!css.includes('.fixture-team.fixture-team-primary') || !css.includes('color: #fff')) {
  throw new Error('Team name must be explicitly white.');
}
if (!css.includes('.fixture-pot') || !css.includes('.fixture-country') || !css.includes('.fixture-week')) {
  throw new Error('Muted fixture metadata selectors are missing.');
}

console.log('Fixture display hierarchy passed.');
