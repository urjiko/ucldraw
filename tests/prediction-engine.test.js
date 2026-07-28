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
assert.equal(Object.keys(state.scores).length, 0, 'prediction screen must start with no simulated scores');

const selectedMatches = state.matches
  .filter((match) => match.home.name === selected.name || match.away.name === selected.name)
  .sort((first, second) => first.matchday - second.matchday);
assert.equal(selectedMatches.length, 8);
assert.deepEqual(prediction.progress(state, selected.name), { completed: 0, total: 8, done: false });
assert.deepEqual(prediction.tournamentProgress(state), { completed: 0, total: 144, done: false });

let rows = prediction.standings(state);
assert.equal(rows.length, 36);
assert.ok(rows.every((row) => row.played === 0 && row.points === 0), 'nobody has played before the first click');

const firstMatch = selectedMatches[0];
const selectedWinsFirst = firstMatch.home.name === selected.name ? 'home' : 'away';
prediction.applyOutcome(state, firstMatch.id, selectedWinsFirst);
assert.equal(prediction.selectedPoints(firstMatch, state.scores[firstMatch.id], selected.name), 3);
assert.equal(Object.keys(state.scores).length, 18, 'first click must simulate only that 18-match matchday');
assert.equal(Object.keys(state.activeMatchdays).length, 1);

rows = prediction.standings(state);
assert.ok(rows.every((row) => row.played === 1), 'one activated matchday gives every club one played match');
assert.equal(rows.find((row) => row.team.name === selected.name).points, 3);

const sameDayMatches = state.matches.filter((match) => match.matchday === firstMatch.matchday);
const firstScore = { ...state.scores[firstMatch.id] };
const otherMatch = sameDayMatches.find((match) => match.id !== firstMatch.id);
prediction.applyOutcome(state, otherMatch.id, 'draw');
assert.deepEqual(state.scores[firstMatch.id], firstScore, 'a manually edited match stays locked during later rerolls');

const lockCandidate = sameDayMatches.find((match) => ![firstMatch.id, otherMatch.id].includes(match.id));
const lockScore = { ...state.scores[lockCandidate.id] };
prediction.toggleTeamLock(state, lockCandidate.home.name, true);
const rerollTrigger = sameDayMatches.find((match) => ![firstMatch.id, otherMatch.id, lockCandidate.id].includes(match.id)
  && match.home.name !== lockCandidate.home.name
  && match.away.name !== lockCandidate.home.name);
prediction.applyOutcome(state, rerollTrigger.id, 'home');
assert.deepEqual(state.scores[lockCandidate.id], lockScore, 'team lock must preserve existing model results');
assert.equal(prediction.isTeamLocked(state, lockCandidate.home.name), true);

const secondMatch = selectedMatches[1];
prediction.setManualScore(state, secondMatch.id, secondMatch.home.name === selected.name ? 2 : 0, secondMatch.home.name === selected.name ? 0 : 2);
assert.equal(prediction.selectedPoints(secondMatch, state.scores[secondMatch.id], selected.name), 3);
assert.equal(state.matchLocks[secondMatch.id], true, 'manual score changes lock the match');

for (const match of selectedMatches.slice(2)) {
  prediction.applyOutcome(state, match.id, match.home.name === selected.name ? 'home' : 'away');
}

assert.deepEqual(prediction.progress(state, selected.name), { completed: 8, total: 8, done: true });
assert.deepEqual(prediction.tournamentProgress(state), { completed: 144, total: 144, done: true });
rows = prediction.standings(state);
assert.ok(rows.every((row) => row.played === 8), 'activating all eight matchdays completes the entire league phase');
assert.equal(rows.filter((row) => row.zone === 'direct').length, 8);
assert.equal(rows.filter((row) => row.zone === 'playoff').length, 16);
assert.equal(rows.filter((row) => row.zone === 'eliminated').length, 12);
assert.ok(rows.every((row) => Number.isInteger(row.goalDifference)));

assert.equal(prediction.outcomeFromScore({ homeGoals: 2, awayGoals: 1 }), 'home');
assert.equal(prediction.outcomeFromScore({ homeGoals: 1, awayGoals: 1 }), 'draw');
assert.equal(prediction.outcomeFromScore({ homeGoals: 0, awayGoals: 1 }), 'away');
assert.equal(prediction.MATCHDAY_DATES.uel.length, 8);
assert.equal(prediction.MATCHDAY_DATES.uecl.length, 6);

console.log('Progressive locked prediction engine checks passed.');