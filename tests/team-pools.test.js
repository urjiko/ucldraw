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
    JSON,
    TypeError
  });
  context.window = context;
  return context;
}

const manifestContext = createContext();
load('generated-team-pools.js', manifestContext);
const manifest = manifestContext.window.UCLDRAW_POOL_MANIFEST;
for (const [competitionKey, stages] of Object.entries(manifest)) {
  for (const [stage, entries] of Object.entries(stages)) {
    for (const entry of entries) {
      const file = typeof entry === 'string' ? entry : entry.file;
      const crestPath = path.join(root, 'crests', 'pools', competitionKey, stage, file);
      assert.ok(
        fs.existsSync(crestPath),
        `${competitionKey}/${stage}/${file} is still in generated-team-pools.js but the crest file was deleted; run node scripts/generate-team-pools.mjs`
      );
    }
  }
}

for (let run = 0; run < 20; run += 1) {
  const context = createContext();
  load('teams.js', context);
  load('generated-team-pools.js', context);
  load('generated-club-coefficients.js', context);
  load('qualification-bracket.js', context);
  load('team-pool-loader.js', context);
  load('coefficient-pots.js', context);

  const competitions = context.window.UCLDRAW_DATA.competitions;
  const diagnostics = context.window.UCLDRAW_POOL_DIAGNOSTICS;
  const qualification = context.window.UCLDRAW_QUALIFICATION_RESULT;

  for (const id of ['ucl', 'uel', 'uecl']) {
    const competition = competitions[id];
    assert.equal(competition.teams.length, 36, `${id} must contain 36 teams`);

    const potSizes = Array.from({ length: competition.potCount }, (_, index) => (
      competition.teams.filter((team) => team.pot === index + 1).length
    ));
    assert.equal(new Set(potSizes).size, 1, `${id} pots must be equal`);

    const names = competition.teams.map((team) => team.name);
    assert.equal(new Set(names).size, names.length, `${id} team names must be unique`);
    assert.equal(diagnostics[id].placeholderCount, 0, `${id} must not use independent placeholders`);

    competition.teams.filter((team) => team.crest).forEach((team) => {
      assert.ok(
        fs.existsSync(path.join(root, 'crests', `${team.crest}.png`)),
        `${id}/${team.name} points to a missing crest ${team.crest}.png`
      );
    });
  }

  const allQualificationIds = Object.values(competitions)
    .flatMap((competition) => competition.teams)
    .map((team) => team.qualificationId);
  assert.equal(
    new Set(allQualificationIds).size,
    108,
    'the same club must not appear in more than one league phase'
  );

  const psg = competitions.ucl.teams.find((team) => team.poolSlug === 'psg');
  assert.ok(psg, 'psg.png must stay in the guaranteed Champions group');
  assert.equal(psg.name, 'Paris Saint-Germain');
  assert.equal(psg.crest, 'pools/champions/guaranteed/psg');

  const allGuaranteedUcl = context.window.UCLDRAW_POOL_MANIFEST.champions.guaranteed
    .map((entry) => entry.replace(/\.png$/i, '').toLowerCase());
  const selectedUcl = new Set(diagnostics.ucl.selectedSlugs);
  allGuaranteedUcl.forEach((slug) => assert.ok(selectedUcl.has(slug), `${slug} must stay guaranteed`));

  assert.equal(diagnostics.ucl.guaranteedCount, 29);
  assert.equal(diagnostics.ucl.qualifierCount, 7);
  assert.equal(diagnostics.uel.guaranteedCount, 13);
  assert.equal(diagnostics.uel.qualifierCount, 23);
  assert.equal(diagnostics.uecl.guaranteedCount, 0);
  assert.equal(diagnostics.uecl.qualifierCount, 36);

  assert.equal(qualification.qualifiers.ucl.length, 7);
  assert.equal(qualification.qualifiers.uel.length, 23);
  assert.equal(qualification.qualifiers.uecl.length, 36);
}

console.log('Team pool generation checks passed.');
