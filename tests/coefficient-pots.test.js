'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'coefficient-pots.js'), 'utf8');

function teams(prefix) {
  return Array.from({ length: 36 }, (_, index) => ({
    name: `${prefix} ${String(index + 1).padStart(2, '0')}`,
    country: `C${String(index % 12).padStart(2, '0')}`,
    pot: (index % 4) + 1,
    poolSlug: index === 35 && prefix === 'UCL' ? 'psg' : `${prefix.toLowerCase()}-${index + 1}`
  }));
}

const competitions = {
  ucl: { id: 'ucl', potCount: 4, teams: teams('UCL') },
  uel: { id: 'uel', potCount: 4, teams: teams('UEL') },
  uecl: { id: 'uecl', potCount: 6, teams: teams('UECL') }
};

const clubs = {};
Object.values(competitions).flatMap((competition) => competition.teams).forEach((team, index) => {
  clubs[team.poolSlug] = {
    coefficient: team.poolSlug === 'psg' ? 1 : 500 - index,
    rank: index + 1,
    officialName: team.name,
    country: team.country
  };
});
delete clubs['uecl-36'];

const context = vm.createContext({
  window: {
    UCLDRAW_DATA: { competitions },
    UCLDRAW_CLUB_COEFFICIENTS: {
      season: '2026/27',
      sourceUrl: 'https://www.uefa.com/',
      updatedAt: '2026-05-30T00:00:00.000Z',
      clubs
    },
    UCLDRAW_POOL_DIAGNOSTICS: {}
  },
  console: { warn() {} },
  Object,
  Number,
  Math
});

vm.runInContext(source, context, { filename: 'coefficient-pots.js' });

assert.equal(competitions.ucl.teams[0].poolSlug, 'psg', 'Champions League titleholder must lead Pot 1');
assert.equal(competitions.ucl.teams[0].pot, 1);

for (const competition of Object.values(competitions)) {
  const capacity = competition.teams.length / competition.potCount;
  for (let pot = 1; pot <= competition.potCount; pot += 1) {
    assert.equal(competition.teams.filter((team) => team.pot === pot).length, capacity, `${competition.id} Pot ${pot} must be full`);
  }

  const ranked = competition.id === 'ucl' ? competition.teams.slice(1) : competition.teams;
  const known = ranked.filter((team) => team.coefficient !== null);
  for (let index = 1; index < known.length; index += 1) {
    assert.ok(known[index - 1].coefficient >= known[index].coefficient, `${competition.id} must descend by coefficient`);
  }
}

assert.equal(competitions.uecl.teams.at(-1).poolSlug, 'uecl-36', 'Missing coefficient must be placed last');
assert.equal(competitions.uecl.teams.at(-1).coefficientMissing, true);
assert.equal(context.window.UCLDRAW_POOL_DIAGNOSTICS.uecl.missingCoefficientCount, 1);

console.log('UEFA coefficient pot checks passed.');
