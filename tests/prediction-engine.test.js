'use strict';

const assert = require('node:assert/strict');
const { generateCompetitionDraw, validateCompetitionDraw } = require('../draw-engine-v2.js');
const prediction = require('../prediction-engine.js');

function teamsFromPots(pots) {
  let coefficient = 150;
  return pots.flatMap((countries, potIndex) => countries.map((country, teamIndex) => ({
    name: `P${potIndex + 1}-${teamIndex + 1}-${country}`,
    country,
    pot: potIndex + 1,
    coefficient: coefficient--,
    crest: '',
    poolSlug: `p${potIndex + 1}-${teamIndex + 1}-${country.toLowerCase()}`
  })));
}

const competition = {
  id: 'ucl',
  shortName: 'UCL',
  potCount: 4,
  opponentsPerPot: 2,
  teams: teamsFromPots([
    ['FRA','ESP','ENG','GER','ENG','ITA','ENG','GER','ESP'],
    ['ENG','GER','ESP','POR','ITA','ESP','ITA','GER','BEL'],
    ['ENG','NED','NED','ITA','POR','GRE','CZE','NOR','FRA'],
    ['DEN','FRA','TUR','BEL','AZE','ESP','ENG','CYP','KAZ']
  ])
};

const table = generateCompetitionDraw(competition);
const validation = validateCompetitionDraw(competition, table);
assert.equal(validation.valid, true, validation.reason);

const selected = competition.teams[0];
const state = prediction.createState(competition, table, 'ucl', selected.name, 'prediction-test-seed');

assert.equal(state.matches.length, 144, '36 teams playing eight matches must create 144 unique matches');
assert.equal(new Set(state.matches.map((match) => match.id)).size, 144, 'match IDs must stay unique');
assert.ok(state.matches.every((match) => prediction.MATCHDAY_DATES.ucl[match.matchday - 1].includes(match.date)), 'every match date must use its official UEFA matchday window');

const selectedMatches = state.matches.filter((match) => match.home.name === selected.name || match.away.name === selected.name);
assert.equal(selectedMatches.length, 8);
assert.deepEqual(prediction.progress(state), { completed: 0, total: 8, done: false });

let rows = prediction.standings(state);
let selectedRow = rows.find((row) => row.team.name === selected.name);
assert.equal(selectedRow.played, 0, 'model previews for the selected team must not count before confirmation');
assert.equal(selectedRow.points, 0, 'the selected team starts on zero confirmed points');
assert.equal(rows.length, 36);

const firstMatch = selectedMatches[0];
const firstDayVersion = state.rerollVersion[firstMatch.matchday];
prediction.applyPoints(state, firstMatch.id, 3);
assert.equal(prediction.selectedPoints(firstMatch, state.scores[firstMatch.id], selected.name), 3);
assert.equal(state.rerollVersion[firstMatch.matchday], firstDayVersion + 1, 'other matches on the same matchday must be re-simulated');
rows = prediction.standings(state);
selectedRow = rows.find((row) => row.team.name === selected.name);
assert.equal(selectedRow.played, 1);
assert.equal(selectedRow.points, 3, 'pressing 3 must add exactly three confirmed points');

const secondMatch = selectedMatches[1];
const selectedHome = secondMatch.home.name === selected.name;
prediction.setManualScore(state, secondMatch.id, selectedHome ? 2 : 0, selectedHome ? 0 : 2);
assert.equal(prediction.selectedPoints(secondMatch, state.scores[secondMatch.id], selected.name), 3, 'manual score must determine the active points choice');

for (const match of selectedMatches.slice(2)) prediction.applyPoints(state, match.id, 3);
assert.deepEqual(prediction.progress(state), { completed: 8, total: 8, done: true });
rows = prediction.standings(state);
selectedRow = rows.find((row) => row.team.name === selected.name);
assert.equal(selectedRow.played, 8);
assert.equal(selectedRow.points, 24);
assert.equal(rows.filter((row) => row.zone === 'direct').length, 8);
assert.equal(rows.filter((row) => row.zone === 'playoff').length, 16);
assert.equal(rows.filter((row) => row.zone === 'eliminated').length, 12);
assert.ok(rows.every((row) => row.played === 8), 'all teams must have eight counted matches after all personal predictions are complete');
assert.ok(rows.every((row) => Number.isInteger(row.goalDifference)));

assert.match(prediction.travelContext({ country: 'NOR' }, '2027-01-20'), /Kuzey|soğuk/);
assert.equal(prediction.MATCHDAY_DATES.uel.length, 8);
assert.equal(prediction.MATCHDAY_DATES.uecl.length, 6);

console.log('League-phase prediction engine checks passed.');
