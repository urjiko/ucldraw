'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'qualification-bracket.js'), 'utf8');

function createContext() {
  const context = vm.createContext({
    console: { warn() {}, log() {}, error() {} },
    Math,
    Object,
    Array,
    Map,
    Set,
    String,
    Number,
    Boolean,
    RegExp,
    JSON,
    TypeError
  });
  context.window = context;
  context.UCLDRAW_CLUB_COEFFICIENTS = {
    clubs: {
      fenerbahce: { coefficient: 47 },
      strumgraz: { coefficient: 25 },
      spartapraha: { coefficient: 30.5 },
      lyon: { coefficient: 44 }
    }
  };
  vm.runInContext(source, context, { filename: 'qualification-bracket.js' });
  return context;
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

const context = createContext();
const bracket = context.UCLDRAW_QUALIFICATION_BRACKET;
assert.ok(bracket?.simulate, 'qualification bracket runtime must be exposed');
assert.deepEqual(
  Array.from(bracket.rounds, (round) => round.ties.length),
  [10, 7, 13, 12, 30, 24],
  'all current Q3 and playoff ties must be represented'
);

assert.equal(bracket.teams.kaunozalgiris.name, 'Kauno Žalgiris');
assert.equal(bracket.teams.zalgiris.name, 'FK Žalgiris');
assert.notEqual(bracket.teams.kaunozalgiris.id, bracket.teams.zalgiris.id);
assert.equal(bracket.teams.hapoelbeersheva.name, "Hapoel Be'er Sheva");
assert.equal(bracket.teams.hapoeltelaviv.name, 'Hapoel Tel Aviv');
assert.notEqual(bracket.teams.hapoelbeersheva.id, bracket.teams.hapoeltelaviv.id);
assert.equal(bracket.teams.iberia1999.name, 'Iberia 1999 Tbilisi');
assert.equal(bracket.teams.cska1948.name, 'CSKA 1948');

for (let run = 1; run <= 50; run += 1) {
  const result = bracket.simulate(seededRandom(run));
  assert.equal(result.qualifiers.ucl.length, 7);
  assert.equal(result.qualifiers.uel.length, 23);
  assert.equal(result.qualifiers.uecl.length, 36);

  const all = Object.values(result.qualifiers).flat();
  const ids = all.map((team) => team.id);
  assert.equal(new Set(ids).size, 66, 'qualifier destinations must be mutually exclusive');

  const fenerTie = result.rounds['ucl-q3'].find((tie) => tie.id === 'ucl-q3-fener-sturm');
  assert.deepEqual(
    [...new Set([fenerTie.first.id, fenerTie.second.id])].sort(),
    ['fenerbahce', 'strumgraz']
  );
  const leaguePlayoff = result.rounds['ucl-playoffs']
    .find((tie) => tie.id === 'ucl-po-fener-sturm-sparta-lyon');
  assert.ok(
    [leaguePlayoff.first.id, leaguePlayoff.second.id].includes(fenerTie.winner.id),
    'Fenerbahçe/Sturm winner must enter the assigned Champions playoff'
  );

  const uclIds = new Set(result.qualifiers.ucl.map((team) => team.id));
  const uelIds = new Set(result.qualifiers.uel.map((team) => team.id));
  assert.ok(uclIds.has(leaguePlayoff.winner.id));
  assert.ok(uelIds.has(leaguePlayoff.loser.id));
  assert.ok(uelIds.has(fenerTie.loser.id));
  assert.ok(!uclIds.has(fenerTie.loser.id));

  assert.deepEqual(
    JSON.parse(JSON.stringify(result.diagnostics.transferCounts)),
    {
      uclPlayoffWinners: 7,
      uclLeaguePathQ3LosersToUel: 4,
      uclPlayoffLosersToUel: 7,
      uelPlayoffWinners: 12,
      uelPlayoffLosersToUecl: 12,
      ueclPlayoffWinners: 24
    }
  );
}

console.log('Qualification bracket checks passed.');
