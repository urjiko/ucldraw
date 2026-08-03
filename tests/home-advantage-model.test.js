'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const controllerSource = read('prediction-ai-controller.js');
const builderSource = read('scripts/build-home-advantage-profiles.mjs');
const generatedSource = read('generated-home-advantage-profiles.js');

const dataDirectory = path.join(root, 'data', 'home-advantage-matches');
const dataFiles = [
  'data/home-advantage-matches.json',
  ...fs.readdirSync(dataDirectory)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => `data/home-advantage-matches/${name}`)
];
const records = dataFiles.flatMap((file) => JSON.parse(read(file)));
const matchKeys = records.map((match) => [
  match.date,
  match.competitionType,
  match.competition || '',
  match.homeSlug,
  match.awaySlug
].join('|'));

assert.equal(records.length, 347, 'Stored source archive must contain 347 home matches.');
assert.equal(new Set(matchKeys).size, records.length, 'Stored home matches must be unique.');
assert.equal(records.filter((match) => match.competitionType === 'domestic').length, 332);
assert.equal(records.filter((match) => match.competitionType === 'europe').length, 15);
for (const slug of ['arsenal', 'astonvilla', 'atleti', 'barcelona', 'city', 'liverpool', 'manu']) {
  assert.equal(records.filter((match) => match.homeSlug === slug).length, 19);
}
assert.equal(records.filter((match) => match.homeSlug === 'brugge').length, 20);
for (const slug of ['bayern', 'bvb']) {
  assert.equal(records.filter((match) => match.homeSlug === slug).length, 17);
}
assert.match(builderSource, /competition: 'champions', stage: 'guaranteed'/);
assert.match(builderSource, /competition: 'europa', stage: 'guaranteed'/);
assert.match(builderSource, /Duplicate home-advantage match/);

const generatedContext = { window: {}, Object };
vm.runInNewContext(generatedSource, generatedContext, {
  filename: 'generated-home-advantage-profiles.js'
});
const generated = generatedContext.window.UCLDRAW_HOME_ADVANTAGE_PROFILES;
assert.equal(generated.latestMatchDate, '2025-06-01');
assert.equal(generated.sourceSummary.storedMatches, 347);
assert.equal(generated.sourceSummary.matches, 235);
assert.equal(generated.sourceSummary.excludedStoredMatches, 112);
assert.equal(generated.sourceSummary.teams, 11);
assert.equal(generated.sourceSummary.activeTeamScope, 42);
assert.equal(generated.sourceSummary.domesticMatches, 223);
assert.equal(generated.sourceSummary.europeanMatches, 12);
assert.equal(generated.sourceSummary.latestIncludedMatchDate, '2025-05-30');
assert.deepEqual(Array.from(generated.sourceSummary.files), dataFiles);

assert.equal(generated.scope.priority[0].competition, 'champions');
assert.equal(generated.scope.priority[0].stage, 'guaranteed');
assert.equal(generated.scope.priority[0].teams.length, 29);
assert.equal(generated.scope.priority[1].competition, 'europa');
assert.equal(generated.scope.priority[1].stage, 'guaranteed');
assert.equal(generated.scope.priority[1].teams.length, 13);
assert.equal(generated.scope.teams.length, 42);
assert.equal(new Set(generated.scope.teams).size, 42);

const expectedDomesticAttack = {
  arsenal: 0.9824,
  astonvilla: 1.021,
  atleti: 1.1061,
  barcelona: 1.18,
  bayern: 1.18,
  brugge: 1.1168,
  bvb: 1.18,
  city: 1.113,
  galatasaray: 1.18,
  liverpool: 1.0948,
  manu: 0.84
};
for (const [slug, multiplier] of Object.entries(expectedDomesticAttack)) {
  assert.equal(generated.profiles[slug].attack.domestic, multiplier);
}
assert.equal(generated.profiles.astonvilla.attack.vsStronger, 1.0687);
assert.equal(generated.profiles.atleti.attack.vsSimilar, 1.1184);
assert.equal(generated.profiles.barcelona.attack.vsSimilar, 1.1055);
assert.equal(generated.profiles.brugge.attack.overall, 1.0974);
assert.equal(generated.profiles.brugge.attack.vsWeaker, 1.1168);
assert.equal(generated.profiles.bayern.attack.vsSimilar, 0.993);
assert.equal(generated.profiles.bvb.attack.overall, 1.171);
assert.equal(generated.profiles.city.attack.vsWeaker, 1.1129);
assert.equal(generated.profiles.manu.attack.vsSimilar, 0.8892);
assert.equal(generated.profiles.fenerbahce, undefined);

assert.equal(generated.researchQueue[0], 'como');
assert.equal(generated.researchQueue[17], 'villareal');
assert.equal(generated.researchQueue[18], 'azalkmaar');
assert.equal(generated.researchQueue.at(-1), 'torreense');

const home = { name: 'Galatasaray', poolSlug: 'galatasaray', country: 'TUR', coefficient: 45, pot: 3 };
const strongerAway = { name: 'Liverpool', poolSlug: 'liverpool', country: 'ENG', coefficient: 130, pot: 1 };
const neutralHome = { name: 'Neutral FC', poolSlug: 'neutral-fc', country: 'NED', coefficient: 45, pot: 3 };

const baseEngine = {
  createState(comp, table, leagueId, selectedTeamName, seed = 'test') {
    return {
      comp, table, leagueId, selectedTeamName, seed,
      matches: [], scores: {}, matchLocks: {}, teamLocks: {},
      activeMatchdays: {}, rerollVersion: {}
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
    state.scores[matchId] = {
      homeGoals: Number(homeGoals),
      awayGoals: Number(awayGoals),
      source: 'user-score'
    };
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
  console, Math, Object, Number, String, Boolean, Array, Map, Set, JSON
});
context.window.window = context.window;
vm.runInContext(controllerSource, context, { filename: 'prediction-ai-controller.js' });

const model = context.window.UCLDRAW_HOME_ADVANTAGE_MODEL;
const engine = context.window.UCLDRAW_PREDICTION_ENGINE;
assert.ok(model);
assert.equal(engine.__homeAdvantageModel, true);
assert.equal(model.opponentBand(home, strongerAway, 4), 'vsStronger');

const adjusted = model.adjustExpectedGoals(
  { home, away: strongerAway },
  { id: 'ucl', potCount: 4 },
  1.5,
  1
);
assert.ok(adjusted.homeExpected > 1.5);
assert.ok(adjusted.awayExpected < 1);
assert.ok(adjusted.attackMultiplier <= 1.18);
assert.ok(adjusted.defenseMultiplier >= 0.82);
assert.equal(adjusted.profileSlug, 'galatasaray');

const neutral = model.adjustExpectedGoals(
  { home: neutralHome, away: strongerAway },
  { id: 'ucl', potCount: 4 },
  1.5,
  1
);
assert.equal(neutral.homeExpected, 1.5);
assert.equal(neutral.awayExpected, 1);
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
const firstScore = JSON.stringify(state.scores[match.id]);

state.scores = {};
state.activeMatchdays = {};
state.rerollVersion[1] = 0;
engine.simulateMatchday(state, 1);
assert.equal(JSON.stringify(state.scores[match.id]), firstScore);

console.log('Guaranteed-team home profile checks passed.');
