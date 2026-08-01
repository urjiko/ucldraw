'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'prediction-ai-controller.js'), 'utf8');

const home = { name: 'Galatasaray', poolSlug: 'galatasaray', country: 'TUR', coefficient: 45, pot: 3 };
const strongerAway = { name: 'Liverpool', poolSlug: 'liverpool', country: 'ENG', coefficient: 130, pot: 1 };
const neutralHome = { name: 'Neutral FC', poolSlug: 'neutral-fc', country: 'NED', coefficient: 45, pot: 3 };

const baseEngine = {
  createState(comp, table, leagueId, selectedTeamName, seed = 'test') {
    return {
      comp,
      table,
      leagueId,
      selectedTeamName,
      seed,
      matches: [],
      scores: {},
      matchLocks: {},
      teamLocks: {},
      activeMatchdays: {},
      rerollVersion: {}
    };
  },
  applyOutcome(state, matchId) {
    state.scores[matchId] = { homeGoals: 1, awayGoals: 0, source: 'user-outcome' };
    state.matchLocks[matchId] = true;
    const match = state.matches.find((candidate) => candidate.id === matchId);
    state.rerollVersion[match.matchday] = Number(state.rerollVersion[match.matchday] || 0) + 1;
    return state.scores[matchId];
  },
  applyPoints(state, matchId) {
    return this.applyOutcome(state, matchId);
  },
  setManualScore(state, matchId, homeGoals, awayGoals) {
    state.scores[matchId] = { homeGoals: Number(homeGoals), awayGoals: Number(awayGoals), source: 'user-score' };
    state.matchLocks[matchId] = true;
    const match = state.matches.find((candidate) => candidate.id === matchId);
    state.rerollVersion[match.matchday] = Number(state.rerollVersion[match.matchday] || 0) + 1;
    return state.scores[matchId];
  }
};

const context = vm.createContext({
  window: {
    UCLDRAW_PREDICTION_ENGINE: baseEngine,
    UCLDRAW_HOME_ADVANTAGE_PROFILES: {
      version: 1,
      methodology: {
        opponentStrengthThreshold: 0.55,
        attackBounds: [0.84, 1.18],
        defenseBounds: [0.82, 1.16]
      },
      profiles: {
        galatasaray: {
          attack: { overall: 1.06, europe: 1.12, vsStronger: 1.16 },
          defense: { overall: 0.96, europe: 0.92, vsStronger: 0.9 },
          confidence: { overall: 0.8, europe: 0.75, vsStronger: 0.7 },
          defenseConfidence: { overall: 0.8, europe: 0.75, vsStronger: 0.7 },
          associationMatchups: {
            ENG: { attack: 1.18, defense: 0.88, confidence: 0.8, samples: 9 }
          }
        }
      }
    },
    dispatchEvent() {}
  },
  CustomEvent: class CustomEvent {
    constructor(type, options) { this.type = type; this.detail = options?.detail; }
  },
  console,
  Math,
  Object,
  Number,
  String,
  Boolean,
  Array,
  Map,
  Set,
  JSON
});
context.window.window = context.window;

vm.runInContext(source, context, { filename: 'prediction-ai-controller.js' });

const model = context.window.UCLDRAW_HOME_ADVANTAGE_MODEL;
const engine = context.window.UCLDRAW_PREDICTION_ENGINE;
assert.ok(model, 'Home advantage model must be exposed.');
assert.equal(engine.__homeAdvantageModel, true, 'Prediction engine must expose the adjusted model marker.');
assert.equal(model.opponentBand(home, strongerAway, 4), 'vsStronger');

const adjusted = model.adjustExpectedGoals(
  { home, away: strongerAway },
  { id: 'ucl', potCount: 4 },
  1.5,
  1
);
assert.ok(adjusted.homeExpected > 1.5, 'Strong home profile must raise home expected goals.');
assert.ok(adjusted.awayExpected < 1, 'Strong home defense profile must reduce away expected goals.');
assert.ok(adjusted.attackMultiplier <= 1.18, 'Attack adjustment must stay inside the safety bound.');
assert.ok(adjusted.defenseMultiplier >= 0.82, 'Defense adjustment must stay inside the safety bound.');
assert.equal(adjusted.context, 'vsStronger');
assert.equal(adjusted.profileSlug, 'galatasaray');

const neutral = model.adjustExpectedGoals(
  { home: neutralHome, away: strongerAway },
  { id: 'ucl', potCount: 4 },
  1.5,
  1
);
assert.equal(neutral.homeExpected, 1.5, 'Teams without a profile must preserve the current model.');
assert.equal(neutral.awayExpected, 1, 'Teams without a profile must preserve the current model.');
assert.equal(neutral.profileSlug, null);

const match = { id: '1:galatasaray:liverpool', matchday: 1, home, away: strongerAway };
const state = {
  comp: { id: 'ucl', potCount: 4 },
  seed: 'fixed-seed',
  matches: [match],
  scores: {},
  matchLocks: {},
  teamLocks: {},
  activeMatchdays: {},
  rerollVersion: { 1: 0 }
};
engine.simulateMatchday(state, 1);
assert.equal(state.scores[match.id].source, 'model-home-adjusted');
assert.equal(state.scores[match.id].model.homeProfile, 'galatasaray');
assert.equal(state.activeMatchdays[1], true);
assert.equal(state.rerollVersion[1], 1);

const firstScore = JSON.stringify(state.scores[match.id]);
state.scores = {};
state.activeMatchdays = {};
state.rerollVersion[1] = 0;
engine.simulateMatchday(state, 1);
assert.equal(JSON.stringify(state.scores[match.id]), firstScore, 'Seeded adjusted predictions must remain reproducible.');

console.log('Home advantage prediction model checks passed.');
