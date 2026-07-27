const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');

function load(file, context) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  vm.runInContext(source, context, { filename: file });
}

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
    JSON
  });
  context.window = context;
  return context;
}

for (let run = 0; run < 20; run += 1) {
  const context = createContext();
  load('teams.js', context);
  load('generated-team-pools.js', context);
  load('team-pool-loader.js', context);

  const competitions = context.window.UCLDRAW_DATA.competitions;
  const diagnostics = context.window.UCLDRAW_POOL_DIAGNOSTICS;

  for (const id of ['ucl', 'uel', 'uecl']) {
    const competition = competitions[id];
    assert.equal(competition.teams.length, 36, `${id} must contain 36 teams`);

    const potSizes = Array.from({ length: competition.potCount }, (_, index) => (
      competition.teams.filter((team) => team.pot === index + 1).length
    ));
    assert.equal(new Set(potSizes).size, 1, `${id} pots must be equal`);

    const names = competition.teams.map((team) => team.name);
    assert.equal(new Set(names).size, names.length, `${id} team names must be unique`);
  }

  const psg = competitions.ucl.teams.find((team) => team.poolSlug === 'psg');
  assert.ok(psg, 'psg.png must be selected from the guaranteed folder');
  assert.equal(psg.name, 'Paris Saint-Germain');
  assert.equal(psg.crest, 'pools/champions/guaranteed/psg');

  const allGuaranteedUcl = context.window.UCLDRAW_POOL_MANIFEST.champions.guaranteed.map((entry) => entry.replace(/\.png$/i, '').toLowerCase());
  const selectedUcl = new Set(diagnostics.ucl.selectedSlugs);
  allGuaranteedUcl.forEach((slug) => assert.ok(selectedUcl.has(slug), `${slug} must stay guaranteed`));

  assert.equal(diagnostics.uecl.placeholderCount, 9, 'current Conference pool needs nine temporary clubs');
}

console.log('Team pool generation checks passed.');
