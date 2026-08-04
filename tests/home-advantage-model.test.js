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

assert.equal(records.length, 1338, 'Stored source archive must contain 1338 home matches.');
assert.equal(new Set(matchKeys).size, records.length, 'Stored home matches must be unique.');
assert.equal(records.filter((match) => match.competitionType === 'domestic').length, 1323);
assert.equal(records.filter((match) => match.competitionType === 'europe').length, 15);
for (const slug of [
  'arsenal', 'astonvilla', 'atleti', 'barcelona', 'bournemouth', 'celtavigo',
  'city', 'como', 'crystalpalace', 'inter', 'juventus', 'liverpool', 'manu',
  'milan', 'napoli', 'real', 'realbetis', 'realsociedad', 'roma', 'villareal'
]) {
  assert.equal(records.filter((match) => match.homeSlug === slug).length, 19);
}
assert.equal(records.filter((match) => match.homeSlug === 'brugge').length, 20);
assert.equal(records.filter((match) => match.homeSlug === 'shakhtar').length, 15);
assert.equal(records.filter((match) => match.homeSlug === 'slavia').length, 18);
assert.equal(records.filter((match) => match.homeSlug === 'aek').length, 16);
assert.equal(records.filter((match) => match.homeSlug === 'celtic').length, 19);
assert.equal(records.filter((match) => match.homeSlug === 'lask').length, 18);
assert.equal(records.filter((match) => match.homeSlug === 'viking').length, 15);
assert.equal(records.filter((match) => match.homeSlug === 'crete').length, 16);
assert.equal(records.filter((match) => match.homeSlug === 'lillestrom').length, 15);
assert.equal(records.filter((match) => match.homeSlug === 'trabzonspor').length, 58);
assert.equal(records.filter((match) => match.homeSlug === 'truidense').length, 18);
assert.equal(records.filter((match) => match.homeSlug === 'viktoriaplzen').length, 18);
assert.equal(records.filter((match) => match.homeSlug === 'atalanta').length, 19);
assert.equal(records.filter((match) => match.homeSlug === 'brighton').length, 19);
assert.equal(records.filter((match) => match.homeSlug === 'freiburg').length, 17);
assert.equal(records.filter((match) => match.homeSlug === 'getafe').length, 19);
assert.equal(records.filter((match) => match.homeSlug === 'monaco').length, 17);
assert.equal(records.filter((match) => match.homeSlug === 'bodo').length, 15);
assert.equal(records.filter((match) => match.homeSlug === 'lyon').length, 17);
assert.equal(records.filter((match) => match.homeSlug === 'nec').length, 17);
assert.equal(records.filter((match) => match.homeSlug === 'olympiacos').length, 16);
assert.equal(records.filter((match) => match.homeSlug === 'spartapraha').length, 17);
assert.equal(records.filter((match) => match.homeSlug === 'union').length, 20);
assert.equal(records.filter((match) => match.homeSlug === 'aarhus').length, 16);
assert.equal(records.filter((match) => match.homeSlug === 'ararat').length, 15);
assert.equal(records.filter((match) => match.homeSlug === 'celje').length, 18);
assert.equal(records.filter((match) => match.homeSlug === 'crvenazvezda').length, 19);
assert.equal(records.filter((match) => match.homeSlug === 'dinamo').length, 18);
assert.equal(records.filter((match) => match.sourceKey === 'openfootball-italy-complete-2024-25').length, 1);
assert.equal(records.filter((match) => match.sourceKey === 'transfermarkt-getafe-2024-25').length, 1);
assert.equal(records.filter((match) => match.homeSlug === 'sunderland').length, 24);
assert.equal(records.filter((match) => match.homeSlug === 'sunderland' && match.date === '2025-05-13').length, 1);
assert.equal(records.filter((match) => match.sourceKey === 'liga-portugal-official-2024-25').length, 4);
for (const slug of [
  'azalkmaar', 'bayerleverkusen', 'bayern', 'bvb', 'feyenoord', 'hoffenheim',
  'leipzig', 'lens', 'lille', 'marseille', 'porto', 'psg', 'psv', 'rennais',
  'sporting', 'stuttgart', 'torreense'
]) {
  assert.equal(records.filter((match) => match.homeSlug === slug).length, 17);
}
assert.match(builderSource, /competition: 'champions', stage: 'guaranteed'/);
assert.match(builderSource, /competition: 'europa', stage: 'guaranteed'/);
assert.match(builderSource, /competition: 'champions', stage: 'playoffs'/);
assert.match(builderSource, /competition: 'europa', stage: 'playoffs'/);
assert.match(builderSource, /competition: 'conference', stage: 'playoffs'/);
assert.match(builderSource, /competition: 'champions', stage: 'q3'/);
assert.match(builderSource, /competition: 'champions', stage: 'q2'/);
assert.match(builderSource, /Duplicate home-advantage match/);

const generatedContext = { window: {}, Object };
vm.runInNewContext(generatedSource, generatedContext, {
  filename: 'generated-home-advantage-profiles.js'
});
const generated = generatedContext.window.UCLDRAW_HOME_ADVANTAGE_PROFILES;
assert.equal(generated.latestMatchDate, '2025-06-01');
assert.equal(generated.sourceSummary.storedMatches, 1338);
assert.equal(generated.sourceSummary.matches, 1284);
assert.equal(generated.sourceSummary.excludedStoredMatches, 54);
assert.equal(generated.sourceSummary.teams, 68);
assert.equal(generated.sourceSummary.activeTeamScope, 76);
assert.equal(generated.sourceSummary.domesticMatches, 1269);
assert.equal(generated.sourceSummary.europeanMatches, 15);
assert.equal(generated.sourceSummary.latestIncludedMatchDate, '2025-05-31');
assert.deepEqual(Array.from(generated.sourceSummary.files), dataFiles);

assert.equal(generated.scope.priority[0].competition, 'champions');
assert.equal(generated.scope.priority[0].stage, 'guaranteed');
assert.equal(generated.scope.priority[0].teams.length, 29);
assert.equal(generated.scope.priority[1].competition, 'europa');
assert.equal(generated.scope.priority[1].stage, 'guaranteed');
assert.equal(generated.scope.priority[1].teams.length, 13);
assert.equal(generated.scope.priority[2].competition, 'champions');
assert.equal(generated.scope.priority[2].stage, 'playoffs');
assert.deepEqual(Array.from(generated.scope.priority[2].teams), ['aek', 'celtic', 'lask', 'viking']);
assert.equal(generated.scope.priority[3].competition, 'europa');
assert.equal(generated.scope.priority[3].stage, 'playoffs');
assert.deepEqual(Array.from(generated.scope.priority[3].teams), ['crete', 'lillestrom', 'trabzonspor', 'truidense', 'viktoriaplzen']);
assert.equal(generated.scope.priority[4].competition, 'conference');
assert.equal(generated.scope.priority[4].stage, 'playoffs');
assert.deepEqual(Array.from(generated.scope.priority[4].teams), ['atalanta', 'brighton', 'freiburg', 'getafe', 'monaco']);
assert.equal(generated.scope.priority[5].competition, 'champions');
assert.equal(generated.scope.priority[5].stage, 'q3');
assert.deepEqual(Array.from(generated.scope.priority[5].teams), ['bodo', 'lyon', 'nec', 'olympiacos', 'spartapraha', 'union']);
assert.equal(generated.scope.priority[6].competition, 'champions');
assert.equal(generated.scope.priority[6].stage, 'q2');
assert.deepEqual(Array.from(generated.scope.priority[6].teams), ['aarhus', 'ararat', 'celje', 'crvenazvezda', 'dinamo', 'fenerbahce', 'hapoelbeersheva', 'kairat', 'levskisofia', 'mjallby', 'sabah', 'slovanbratislava', 'strumgraz', 'zalgiris']);
assert.equal(generated.scope.teams.length, 76);
assert.equal(new Set(generated.scope.teams).size, 76);
assert.deepEqual(Array.from(generated.researchQueue), ['hapoelbeersheva', 'kairat', 'levskisofia', 'mjallby', 'sabah', 'slovanbratislava', 'strumgraz', 'zalgiris']);

const expectedDomesticAttack = {
  aek: 1.1073,
  arsenal: 0.9824,
  atalanta: 1.0058,
  bodo: 1.18,
  brighton: 1.1701,
  celtic: 1.18,
  crete: 0.9945,
  freiburg: 1.0554,
  getafe: 0.84,
  lask: 1.0245,
  lillestrom: 0.9219,
  lyon: 1.121,
  monaco: 1.1574,
  nec: 1.18,
  olympiacos: 1.0039,
  spartapraha: 1.02,
  trabzonspor: 1.18,
  truidense: 1.1,
  union: 1.0924,
  viktoriaplzen: 1.1341,
  viking: 1.18,
  astonvilla: 1.021,
  atleti: 1.1061,
  azalkmaar: 0.9596,
  barcelona: 1.18,
  bayerleverkusen: 1.0482,
  bayern: 1.18,
  bournemouth: 0.9345,
  brugge: 1.1168,
  bvb: 1.18,
  celtavigo: 1.18,
  city: 1.113,
  como: 1.062,
  crystalpalace: 0.9824,
  feyenoord: 1.0988,
  galatasaray: 1.18,
  hoffenheim: 1.18,
  inter: 1.0253,
  juventus: 0.9539,
  leipzig: 1.0758,
  lens: 0.9374,
  lille: 0.9966,
  liverpool: 1.0948,
  manu: 0.84,
  marseille: 1.18,
  milan: 0.9424,
  napoli: 0.9873,
  porto: 1.1002,
  psg: 1.1445,
  psv: 1.18,
  real: 1.0853,
  realbetis: 0.9686,
  realsociedad: 0.84,
  rennais: 0.9583,
  roma: 1.017,
  shakhtar: 1.1538,
  slavia: 1.1747,
  sporting: 1.1129,
  stuttgart: 1.18,
  sunderland: 0.9235,
  torreense: 1.0528,
  villareal: 1.18
};
for (const [slug, multiplier] of Object.entries(expectedDomesticAttack)) {
  assert.equal(generated.profiles[slug].attack.domestic, multiplier);
}
assert.equal(generated.profiles.aek.attack.overall, 1.0875);
assert.equal(generated.profiles.aek.attack.vsStronger, 0.9087);
assert.equal(generated.profiles.aek.attack.vsWeaker, 1.168);
assert.equal(generated.profiles.aek.defense.domestic, 0.8981);
assert.equal(generated.profiles.aek.defense.vsWeaker, 0.82);
assert.equal(generated.profiles.aek.samples.overall.raw, 16);
assert.equal(generated.profiles.celtic.attack.overall, 1.18);
assert.equal(generated.profiles.celtic.attack.vsSimilar, 1.1033);
assert.equal(generated.profiles.celtic.defense.domestic, 0.8945);
assert.equal(generated.profiles.celtic.defense.vsWeaker, 0.82);
assert.equal(generated.profiles.celtic.samples.overall.raw, 19);
assert.equal(generated.profiles.lask.attack.overall, 1.0202);
assert.equal(generated.profiles.lask.attack.vsStronger, 0.9351);
assert.equal(generated.profiles.lask.attack.vsSimilar, 1.0915);
assert.equal(generated.profiles.lask.defense.domestic, 1.0922);
assert.equal(generated.profiles.lask.samples.overall.raw, 18);
assert.equal(generated.profiles.viking.attack.overall, 1.18);
assert.equal(generated.profiles.viking.attack.vsStronger, 0.991);
assert.equal(generated.profiles.viking.attack.vsSimilar, 1.18);
assert.equal(generated.profiles.viking.defense.vsStronger, 0.9122);
assert.equal(generated.profiles.viking.samples.overall.raw, 15);
assert.equal(generated.profiles.crete.attack.overall, 0.9955);
assert.equal(generated.profiles.crete.attack.vsStronger, 0.84);
assert.equal(generated.profiles.crete.attack.vsSimilar, 1.0824);
assert.equal(generated.profiles.crete.defense.domestic, 1.16);
assert.equal(generated.profiles.crete.defense.vsSimilar, 1.1051);
assert.equal(generated.profiles.crete.samples.overall.raw, 16);
assert.equal(generated.profiles.lillestrom.attack.overall, 0.9373);
assert.equal(generated.profiles.lillestrom.attack.vsStronger, 0.9705);
assert.equal(generated.profiles.lillestrom.attack.vsSimilar, 0.9199);
assert.equal(generated.profiles.lillestrom.defense.domestic, 1.16);
assert.equal(generated.profiles.lillestrom.samples.overall.raw, 15);
assert.equal(generated.profiles.trabzonspor.attack.overall, 1.18);
assert.equal(generated.profiles.trabzonspor.attack.europe, 0.9057);
assert.equal(generated.profiles.trabzonspor.attack.vsStronger, 0.9771);
assert.equal(generated.profiles.trabzonspor.attack.vsSimilar, 1.18);
assert.equal(generated.profiles.trabzonspor.attack.vsWeaker, 0.9747);
assert.equal(generated.profiles.trabzonspor.defense.domestic, 1.1399);
assert.equal(generated.profiles.trabzonspor.defense.europe, 0.9405);
assert.equal(generated.profiles.trabzonspor.samples.overall.raw, 58);
assert.equal(generated.profiles.trabzonspor.samples.domestic.raw, 55);
assert.equal(generated.profiles.trabzonspor.samples.europe.raw, 3);
assert.equal(generated.profiles.truidense.attack.overall, 1.0825);
assert.equal(generated.profiles.truidense.attack.vsStronger, 0.9767);
assert.equal(generated.profiles.truidense.attack.vsSimilar, 1.1228);
assert.equal(generated.profiles.truidense.defense.domestic, 1.16);
assert.equal(generated.profiles.truidense.samples.overall.raw, 18);
assert.equal(generated.profiles.viktoriaplzen.attack.overall, 1.1107);
assert.equal(generated.profiles.viktoriaplzen.attack.vsSimilar, 0.9748);
assert.equal(generated.profiles.viktoriaplzen.attack.vsWeaker, 1.155);
assert.equal(generated.profiles.viktoriaplzen.defense.domestic, 1.16);
assert.equal(generated.profiles.viktoriaplzen.samples.overall.raw, 18);
assert.equal(generated.profiles.atalanta.attack.overall, 1.0048);
assert.equal(generated.profiles.atalanta.attack.vsStronger, 0.9265);
assert.equal(generated.profiles.atalanta.attack.vsSimilar, 1.0353);
assert.equal(generated.profiles.atalanta.attack.vsWeaker, 1.0149);
assert.equal(generated.profiles.atalanta.defense.domestic, 1.16);
assert.equal(generated.profiles.atalanta.samples.overall.raw, 19);
assert.equal(generated.profiles.brighton.attack.overall, 1.1413);
assert.equal(generated.profiles.brighton.attack.vsStronger, 1.18);
assert.equal(generated.profiles.brighton.attack.vsSimilar, 1.0812);
assert.equal(generated.profiles.brighton.defense.domestic, 1.0693);
assert.equal(generated.profiles.brighton.samples.overall.raw, 19);
assert.equal(generated.profiles.freiburg.attack.overall, 1.0455);
assert.equal(generated.profiles.freiburg.attack.vsStronger, 1.0198);
assert.equal(generated.profiles.freiburg.attack.vsSimilar, 0.9268);
assert.equal(generated.profiles.freiburg.attack.vsWeaker, 1.0826);
assert.equal(generated.profiles.freiburg.defense.vsSimilar, 0.9268);
assert.equal(generated.profiles.freiburg.samples.overall.raw, 17);
assert.equal(generated.profiles.getafe.attack.overall, 0.84);
assert.equal(generated.profiles.getafe.attack.vsStronger, 0.9579);
assert.equal(generated.profiles.getafe.attack.vsSimilar, 0.84);
assert.equal(generated.profiles.getafe.defense.overall, 0.9474);
assert.equal(generated.profiles.getafe.defense.domestic, 0.9367);
assert.equal(generated.profiles.getafe.samples.overall.raw, 19);
assert.equal(generated.profiles.monaco.attack.overall, 1.1291);
assert.equal(generated.profiles.monaco.attack.vsStronger, 1.0502);
assert.equal(generated.profiles.monaco.attack.vsSimilar, 1.012);
assert.equal(generated.profiles.monaco.attack.vsWeaker, 1.1448);
assert.equal(generated.profiles.monaco.defense.vsSimilar, 0.8673);
assert.equal(generated.profiles.monaco.samples.overall.raw, 17);
assert.equal(generated.profiles.bodo.attack.overall, 1.1659);
assert.equal(generated.profiles.bodo.attack.vsWeaker, 1.18);
assert.equal(generated.profiles.bodo.defense.domestic, 1.16);
assert.equal(generated.profiles.bodo.samples.overall.raw, 15);
assert.equal(generated.profiles.bodo.samples.vsWeaker.raw, 15);
assert.equal(generated.profiles.lyon.attack.overall, 1.0993);
assert.equal(generated.profiles.lyon.attack.vsStronger, 1.0463);
assert.equal(generated.profiles.lyon.attack.vsSimilar, 0.9826);
assert.equal(generated.profiles.lyon.attack.vsWeaker, 1.1236);
assert.equal(generated.profiles.lyon.defense.domestic, 1.16);
assert.equal(generated.profiles.lyon.samples.overall.raw, 17);
assert.equal(generated.profiles.nec.attack.overall, 1.18);
assert.equal(generated.profiles.nec.attack.vsStronger, 1.18);
assert.equal(generated.profiles.nec.attack.vsSimilar, 1.18);
assert.equal(generated.profiles.nec.defense.domestic, 1.1544);
assert.equal(generated.profiles.nec.defense.vsSimilar, 1.0493);
assert.equal(generated.profiles.nec.samples.overall.raw, 17);
assert.equal(generated.profiles.olympiacos.attack.overall, 1.0032);
assert.equal(generated.profiles.olympiacos.attack.vsWeaker, 1.0039);
assert.equal(generated.profiles.olympiacos.defense.domestic, 1.16);
assert.equal(generated.profiles.olympiacos.samples.overall.raw, 16);
assert.equal(generated.profiles.olympiacos.samples.vsWeaker.raw, 16);
assert.equal(generated.profiles.spartapraha.attack.overall, 1.0164);
assert.equal(generated.profiles.spartapraha.attack.vsSimilar, 1.0576);
assert.equal(generated.profiles.spartapraha.attack.vsWeaker, 0.9971);
assert.equal(generated.profiles.spartapraha.defense.vsSimilar, 1.1184);
assert.equal(generated.profiles.spartapraha.samples.overall.raw, 17);
assert.equal(generated.profiles.union.attack.overall, 1.0771);
assert.equal(generated.profiles.union.attack.vsStronger, 0.9631);
assert.equal(generated.profiles.union.attack.vsSimilar, 0.9633);
assert.equal(generated.profiles.union.attack.vsWeaker, 1.1413);
assert.equal(generated.profiles.union.defense.overall, 0.9072);
assert.equal(generated.profiles.union.defense.domestic, 0.8888);
assert.equal(generated.profiles.union.defense.vsSimilar, 0.8342);
assert.equal(generated.profiles.union.samples.overall.raw, 20);
assert.equal(generated.profiles.astonvilla.attack.vsStronger, 1.0687);
assert.equal(generated.profiles.atleti.attack.vsSimilar, 1.1184);
assert.equal(generated.profiles.azalkmaar.attack.overall, 0.9668);
assert.equal(generated.profiles.azalkmaar.attack.vsSimilar, 0.9385);
assert.equal(generated.profiles.azalkmaar.attack.vsWeaker, 0.9843);
assert.equal(generated.profiles.barcelona.attack.vsSimilar, 1.1055);
assert.equal(generated.profiles.bayerleverkusen.attack.overall, 1.0396);
assert.equal(generated.profiles.bayerleverkusen.attack.vsSimilar, 0.9614);
assert.equal(generated.profiles.bayerleverkusen.attack.vsWeaker, 1.0649);
assert.equal(generated.profiles.bayerleverkusen.defense.vsSimilar, 1.1277);
assert.equal(generated.profiles.bournemouth.attack.overall, 0.9456);
assert.equal(generated.profiles.bournemouth.attack.vsStronger, 0.9967);
assert.equal(generated.profiles.bournemouth.attack.vsSimilar, 0.9308);
assert.equal(generated.profiles.bournemouth.defense.overall, 0.8754);
assert.equal(generated.profiles.bournemouth.defense.domestic, 0.8499);
assert.equal(generated.profiles.bournemouth.defense.vsStronger, 0.9156);
assert.equal(generated.profiles.bournemouth.defense.vsSimilar, 0.8825);
assert.equal(generated.profiles.brugge.attack.overall, 1.0974);
assert.equal(generated.profiles.brugge.attack.vsWeaker, 1.1168);
assert.equal(generated.profiles.bayern.attack.vsSimilar, 0.993);
assert.equal(generated.profiles.bvb.attack.overall, 1.171);
assert.equal(generated.profiles.celtavigo.attack.overall, 1.1571);
assert.equal(generated.profiles.celtavigo.attack.vsStronger, 1.18);
assert.equal(generated.profiles.celtavigo.attack.vsSimilar, 1.0569);
assert.equal(generated.profiles.celtavigo.defense.overall, 0.9661);
assert.equal(generated.profiles.celtavigo.defense.domestic, 0.9591);
assert.equal(generated.profiles.celtavigo.defense.vsStronger, 0.9288);
assert.equal(generated.profiles.city.attack.vsWeaker, 1.1129);
assert.equal(generated.profiles.como.attack.overall, 1.0515);
assert.equal(generated.profiles.como.attack.vsStronger, 1.0466);
assert.equal(generated.profiles.crystalpalace.attack.overall, 0.9854);
assert.equal(generated.profiles.crystalpalace.attack.vsStronger, 1.1448);
assert.equal(generated.profiles.crystalpalace.attack.vsSimilar, 0.9192);
assert.equal(generated.profiles.crystalpalace.defense.domestic, 1.1096);
assert.equal(generated.profiles.feyenoord.attack.overall, 1.0812);
assert.equal(generated.profiles.feyenoord.attack.vsSimilar, 1.0202);
assert.equal(generated.profiles.hoffenheim.attack.overall, 1.1645);
assert.equal(generated.profiles.hoffenheim.attack.vsStronger, 1.18);
assert.equal(generated.profiles.hoffenheim.defense.vsStronger, 1.16);
assert.equal(generated.profiles.hoffenheim.samples.vsStronger.raw, 17);
assert.equal(generated.profiles.inter.attack.vsWeaker, 1.0527);
assert.equal(generated.profiles.juventus.attack.overall, 0.9618);
assert.equal(generated.profiles.juventus.attack.vsStronger, 0.9846);
assert.equal(generated.profiles.juventus.attack.vsSimilar, 0.8521);
assert.equal(generated.profiles.juventus.attack.vsWeaker, 1.0256);
assert.equal(generated.profiles.juventus.defense.domestic, 1.0224);
assert.equal(generated.profiles.juventus.defense.vsStronger, 0.9277);
assert.equal(generated.profiles.leipzig.attack.overall, 1.0623);
assert.equal(generated.profiles.leipzig.attack.vsStronger, 1.1707);
assert.equal(generated.profiles.leipzig.defense.vsSimilar, 0.94);
assert.equal(generated.profiles.lens.attack.overall, 0.9486);
assert.equal(generated.profiles.lens.attack.vsStronger, 1.1007);
assert.equal(generated.profiles.lens.defense.vsStronger, 0.9804);
assert.equal(generated.profiles.lille.attack.overall, 0.9972);
assert.equal(generated.profiles.lille.attack.vsSimilar, 0.975);
assert.equal(generated.profiles.manu.attack.vsSimilar, 0.8892);
assert.equal(generated.profiles.marseille.attack.overall, 1.18);
assert.equal(generated.profiles.marseille.attack.vsStronger, 0.9323);
assert.equal(generated.profiles.marseille.attack.vsSimilar, 1.17);
assert.equal(generated.profiles.marseille.attack.vsWeaker, 1.18);
assert.equal(generated.profiles.marseille.defense.vsSimilar, 1.1145);
assert.equal(generated.profiles.milan.attack.overall, 0.9522);
assert.equal(generated.profiles.milan.attack.vsStronger, 0.9862);
assert.equal(generated.profiles.milan.attack.vsSimilar, 0.84);
assert.equal(generated.profiles.milan.attack.vsWeaker, 1.0328);
assert.equal(generated.profiles.milan.defense.domestic, 1.04);
assert.equal(generated.profiles.milan.defense.vsSimilar, 0.9831);
assert.equal(generated.profiles.napoli.defense.domestic, 0.9089);
assert.equal(generated.profiles.porto.attack.overall, 1.0822);
assert.equal(generated.profiles.porto.attack.vsSimilar, 0.9779);
assert.equal(generated.profiles.porto.defense.vsWeaker, 0.8311);
assert.equal(generated.profiles.psg.attack.overall, 1.1187);
assert.equal(generated.profiles.psg.attack.vsWeaker, 1.1445);
assert.equal(generated.profiles.psv.attack.vsSimilar, 1.014);
assert.equal(generated.profiles.real.attack.overall, 1.0708);
assert.equal(generated.profiles.real.attack.vsSimilar, 0.9119);
assert.equal(generated.profiles.real.attack.vsWeaker, 1.1217);
assert.equal(generated.profiles.realbetis.attack.overall, 0.974);
assert.equal(generated.profiles.realbetis.attack.vsStronger, 1.0752);
assert.equal(generated.profiles.realbetis.defense.vsSimilar, 0.9432);
assert.equal(generated.profiles.realsociedad.attack.overall, 0.84);
assert.equal(generated.profiles.realsociedad.attack.vsStronger, 0.9213);
assert.equal(generated.profiles.realsociedad.attack.vsSimilar, 1.0061);
assert.equal(generated.profiles.realsociedad.defense.overall, 1.1259);
assert.equal(generated.profiles.realsociedad.defense.domestic, 1.1517);
assert.equal(generated.profiles.realsociedad.defense.vsStronger, 0.9624);
assert.equal(generated.profiles.realsociedad.defense.vsSimilar, 0.8691);
assert.equal(generated.profiles.rennais.attack.overall, 0.9658);
assert.equal(generated.profiles.rennais.attack.vsStronger, 1.0003);
assert.equal(generated.profiles.rennais.attack.vsSimilar, 0.9823);
assert.equal(generated.profiles.rennais.attack.vsWeaker, 0.9618);
assert.equal(generated.profiles.rennais.defense.domestic, 1.0401);
assert.equal(generated.profiles.rennais.defense.vsWeaker, 0.861);
assert.equal(generated.profiles.roma.attack.vsWeaker, 1.0533);
assert.equal(generated.profiles.shakhtar.attack.overall, 1.1245);
assert.equal(generated.profiles.shakhtar.attack.vsWeaker, 1.1538);
assert.equal(generated.profiles.slavia.attack.overall, 1.1442);
assert.equal(generated.profiles.slavia.attack.vsSimilar, 1.0413);
assert.equal(generated.profiles.slavia.attack.vsWeaker, 1.1654);
assert.equal(generated.profiles.slavia.defense.overall, 0.8419);
assert.equal(generated.profiles.slavia.defense.domestic, 0.82);
assert.equal(generated.profiles.sporting.attack.overall, 1.0927);
assert.equal(generated.profiles.sporting.attack.vsSimilar, 0.9754);
assert.equal(generated.profiles.sporting.defense.vsSimilar, 0.8817);
assert.equal(generated.profiles.stuttgart.attack.vsSimilar, 0.9977);
assert.equal(generated.profiles.stuttgart.attack.vsWeaker, 0.9697);
assert.equal(generated.profiles.sunderland.attack.overall, 0.935);
assert.equal(generated.profiles.sunderland.attack.vsSimilar, 0.9235);
assert.equal(generated.profiles.sunderland.defense.overall, 0.8822);
assert.equal(generated.profiles.sunderland.defense.domestic, 0.8614);
assert.equal(generated.profiles.sunderland.samples.overall.raw, 24);
assert.equal(generated.profiles.torreense.attack.overall, 1.0434);
assert.equal(generated.profiles.torreense.attack.vsStronger, 1.0899);
assert.equal(generated.profiles.torreense.attack.vsSimilar, 1.0241);
assert.equal(generated.profiles.torreense.defense.domestic, 1.1549);
assert.equal(generated.profiles.torreense.defense.vsSimilar, 1.1024);
assert.equal(generated.profiles.villareal.attack.overall, 1.1617);
assert.equal(generated.profiles.villareal.attack.vsSimilar, 1.0069);
assert.equal(generated.profiles.villareal.defense.vsSimilar, 1.1224);
assert.ok(generated.profiles.aarhus);
assert.equal(generated.profiles.aarhus.samples.overall.raw, 16);
assert.equal(generated.profiles.aarhus.attack.domestic, 1.18);
assert.equal(generated.profiles.aarhus.defense.domestic, 1.005);
assert.ok(generated.profiles.ararat);
assert.equal(generated.profiles.ararat.samples.overall.raw, 15);
assert.equal(generated.profiles.ararat.attack.domestic, 1.18);
assert.equal(generated.profiles.ararat.defense.domestic, 0.9686);
assert.ok(generated.profiles.celje);
assert.equal(generated.profiles.celje.samples.overall.raw, 18);
assert.equal(generated.profiles.celje.attack.domestic, 1.1774);
assert.equal(generated.profiles.celje.defense.domestic, 1.16);
assert.ok(generated.profiles.crvenazvezda);
assert.equal(generated.profiles.crvenazvezda.samples.overall.raw, 19);
assert.equal(generated.profiles.crvenazvezda.attack.domestic, 1.18);
assert.equal(generated.profiles.crvenazvezda.defense.domestic, 1.16);
assert.ok(generated.profiles.dinamo);
assert.equal(generated.profiles.dinamo.samples.overall.raw, 18);
assert.equal(generated.profiles.dinamo.attack.domestic, 1.1163);
assert.equal(generated.profiles.dinamo.defense.domestic, 1.16);
assert.ok(generated.profiles.fenerbahce);
assert.equal(generated.profiles.fenerbahce.samples.overall.raw, 18);
assert.equal(generated.profiles.fenerbahce.attack.domestic, 1.1127);
assert.equal(generated.profiles.fenerbahce.defense.domestic, 1.16);

assert.equal(generated.researchQueue.length, 8);
assert.deepEqual(Array.from(generated.researchQueue), ['hapoelbeersheva', 'kairat', 'levskisofia', 'mjallby', 'sabah', 'slovanbratislava', 'strumgraz', 'zalgiris']);

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

console.log('Active-scope home profile checks passed.');
