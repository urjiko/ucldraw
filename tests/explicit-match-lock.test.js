'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = fs.readFileSync(path.resolve(__dirname, '..', 'prediction-ai-controller.js'), 'utf8');

const base = {
  createState() {
    return { matches: [{ id: 'm1', matchday: 1 }], scores: {}, matchLocks: {}, teamLocks: {}, activeMatchdays: {}, rerollVersion: {} };
  },
  applyOutcome(state, matchId) {
    state.scores[matchId] = { homeGoals: 2, awayGoals: 1 };
    state.matchLocks[matchId] = true;
    return state.scores[matchId];
  },
  applyPoints(state, matchId) {
    state.scores[matchId] = { homeGoals: 1, awayGoals: 1 };
    state.matchLocks[matchId] = true;
    return state.scores[matchId];
  },
  setManualScore(state, matchId, homeGoals, awayGoals) {
    state.scores[matchId] = { homeGoals: Number(homeGoals), awayGoals: Number(awayGoals) };
    state.matchLocks[matchId] = true;
    return state.scores[matchId];
  },
  simulateMatchday() {}
};

class CustomEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.detail = options.detail;
  }
}

const window = {
  UCLDRAW_PREDICTION_ENGINE: base,
  dispatchEvent() {}
};

vm.runInNewContext(source, { window, CustomEvent, console });
const engine = window.UCLDRAW_PREDICTION_ENGINE;
const state = engine.createState();

engine.applyOutcome(state, 'm1', 'home');
assert.equal(state.matchLocks.m1, undefined, 'outcome choice must remain editable until the user presses Kilitle');

engine.applyPoints(state, 'm1', 3);
assert.equal(state.matchLocks.m1, undefined, 'point choice must remain editable until the user presses Kilitle');

engine.setManualScore(state, 'm1', 3, 2);
assert.equal(state.matchLocks.m1, true, 'the explicit score confirmation must lock the match');
assert.equal(engine.__explicitMatchLock, true);

console.log('Explicit prediction match locking checks passed.');
