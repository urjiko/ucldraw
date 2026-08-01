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
assert.match(controller, /function simulateMatchday\(state, matchday/);
assert.match(controller, /simulateAdjustedScore\(match, state\.comp, state\.seed, version\)/);
assert.match(controller, /__homeAdvantageModel: true/);
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
assert.ok(share.includes('Inter, "Segoe UI", Arial, sans-serif'));
assert.doesNotMatch(share, /`“\$\{snapshot\.activeName\}”`/);
assert.doesNotMatch(share, /activeRow\.rank/);
assert.match(css, /prediction-share-button[\s\S]*display: none !important/);
assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);

const home = {
  name: 'Home FC',
  poolSlug: 'home-fc',
  country: 'TUR',
  coefficient: 50,
  pot: 2
};
const away = {
  name: 'Away FC',
  poolSlug: 'away-fc',
  country: 'ENG',
  coefficient: 80,
  pot: 1
};
const state = {
  comp: { id: 'ucl', potCount: 4 },
  seed: 'share-ai-regression',
  matches: [
    { id: 'm1', matchday: 1, home, away },
    { id: 'm2', matchday: 2, home: away, away: home }
  ],
  scores: { m1: { homeGoals: 9, awayGoals: 0, source: 'user-score' } },
  matchLocks: { m1: true },
  teamLocks: { Example: true },
  activeMatchdays: { 1: true },
  rerollVersion: { 1: 7, 2: 4 }
};
const base = {
  createState: () => state
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
};
vm.runInNewContext(controller, context, { filename: 'prediction-ai-controller.js' });
const wrappedState = context.window.UCLDRAW_PREDICTION_ENGINE.createState();
context.window.UCLDRAW_PREDICTION_AI.predictAll(wrappedState);
assert.deepEqual(Object.keys(wrappedState.matchLocks), []);
assert.deepEqual(Object.keys(wrappedState.teamLocks), []);
assert.equal(wrappedState.scores.m1.source, 'model');
assert.equal(wrappedState.scores.m2.source, 'model');
assert.equal(wrappedState.activeMatchdays[1], true);
assert.equal(wrappedState.activeMatchdays[2], true);
assert.equal(wrappedState.rerollVersion[1], 1);
assert.equal(wrappedState.rerollVersion[2], 1);

console.log('League share card and AI prediction checks passed.');
