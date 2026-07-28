'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const controller = read('prediction-ai-controller.js');
const share = read('prediction-share-v2.js');
const css = read('prediction-share-v2.css');

assert.ok(html.includes('prediction-share-v2.css'));
assert.ok(html.includes('prediction-ai-controller.js'));
assert.ok(html.includes('prediction-share-v2.js'));
assert.ok(html.indexOf('prediction-engine.js') < html.indexOf('prediction-ai-controller.js'));
assert.ok(html.indexOf('prediction-ai-controller.js') < html.indexOf('prediction-ui.js'));
assert.ok(html.indexOf('prediction-share.js') < html.indexOf('prediction-share-v2.js'));

assert.match(controller, /state\.scores = \{\}/);
assert.match(controller, /state\.matchLocks = \{\}/);
assert.match(controller, /state\.teamLocks = \{\}/);
assert.match(controller, /base\.simulateMatchday\(state, matchday\)/);
assert.match(share, /Yapay Zeka Tahmini/);
assert.match(share, /AI\.predictAll\(\)/);
assert.match(share, /prediction-share-actions-v2/);
assert.match(share, /shareButton\.hidden = !complete/);
assert.match(share, /Şampiyonlar Ligi Yolculuğu/);
assert.match(share, /Avrupa Ligi Yolculuğu/);
assert.match(share, /Konferans Ligi Yolculuğu/);
assert.match(share, /urjiko\.github\.io\/UEFA/);
assert.match(share, /drawRotatedCover\(context, background\)/);
assert.match(share, /if \(leagueId === 'ucl'\)/);
assert.match(share, /uel:[\s\S]*header: 'rgba\(83, 29, 3/);
assert.match(share, /uecl:[\s\S]*header: 'rgba\(4, 61, 18/);
assert.match(share, /Inter, \\"Segoe UI\\", Arial, sans-serif/);
assert.doesNotMatch(share, /`“\$\{snapshot\.activeName\}”`/);
assert.doesNotMatch(share, /activeRow\.rank/);
assert.match(css, /prediction-share-button[\s\S]*display: none !important/);
assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);

const state = {
  matches: [
    { id: 'm1', matchday: 1 },
    { id: 'm2', matchday: 2 }
  ],
  scores: { m1: { homeGoals: 9, awayGoals: 0, source: 'user-score' } },
  matchLocks: { m1: true },
  teamLocks: { Example: true },
  activeMatchdays: { 1: true },
  rerollVersion: { 1: 7, 2: 4 }
};
const simulated = [];
const base = {
  createState: () => state,
  simulateMatchday: (target, matchday) => {
    simulated.push(matchday);
    target.activeMatchdays[matchday] = true;
    target.scores[`ai-${matchday}`] = { homeGoals: matchday, awayGoals: 0, source: 'model' };
  }
};
const context = {
  window: {
    UCLDRAW_PREDICTION_ENGINE: Object.freeze(base),
    dispatchEvent: () => {}
  },
  CustomEvent: class CustomEvent {
    constructor(type, options) {
      this.type = type;
      this.detail = options?.detail;
    }
  },
  console
};
vm.runInNewContext(controller, context, { filename: 'prediction-ai-controller.js' });
const wrappedState = context.window.UCLDRAW_PREDICTION_ENGINE.createState();
context.window.UCLDRAW_PREDICTION_AI.predictAll(wrappedState);
assert.deepEqual(simulated, [1, 2]);
assert.deepEqual(Object.keys(wrappedState.matchLocks), []);
assert.deepEqual(Object.keys(wrappedState.teamLocks), []);
assert.equal(wrappedState.scores.m1, undefined);
assert.equal(wrappedState.scores['ai-1'].source, 'model');
assert.equal(wrappedState.scores['ai-2'].source, 'model');

console.log('League share card and AI prediction checks passed.');
