import fs from 'node:fs';

function replaceOrVerify(text, oldText, newText, label) {
  if (text.includes(newText)) return text;
  if (!text.includes(oldText)) throw new Error(`Missing ${label} anchor.`);
  return text.replace(oldText, newText);
}

const testPath = 'tests/home-advantage-model.test.js';
let test = fs.readFileSync(testPath, 'utf8');

test = replaceOrVerify(
  test,
  "assert.equal(records.length, 1150, 'Stored source archive must contain 1150 home matches.');\nassert.equal(new Set(matchKeys).size, records.length, 'Stored home matches must be unique.');\nassert.equal(records.filter((match) => match.competitionType === 'domestic').length, 1135);",
  "assert.equal(records.length, 1252, 'Stored source archive must contain 1252 home matches.');\nassert.equal(new Set(matchKeys).size, records.length, 'Stored home matches must be unique.');\nassert.equal(records.filter((match) => match.competitionType === 'domestic').length, 1237);",
  'stored archive totals'
);

test = replaceOrVerify(
  test,
  "assert.equal(records.filter((match) => match.homeSlug === 'monaco').length, 17);\nassert.equal(records.filter((match) => match.sourceKey === 'openfootball-italy-complete-2024-25').length, 1);",
  "assert.equal(records.filter((match) => match.homeSlug === 'monaco').length, 17);\nassert.equal(records.filter((match) => match.homeSlug === 'bodo').length, 15);\nassert.equal(records.filter((match) => match.homeSlug === 'lyon').length, 17);\nassert.equal(records.filter((match) => match.homeSlug === 'nec').length, 17);\nassert.equal(records.filter((match) => match.homeSlug === 'olympiacos').length, 16);\nassert.equal(records.filter((match) => match.homeSlug === 'spartapraha').length, 17);\nassert.equal(records.filter((match) => match.homeSlug === 'union').length, 20);\nassert.equal(records.filter((match) => match.sourceKey === 'openfootball-italy-complete-2024-25').length, 1);",
  'Champions Q3 match counts'
);

test = replaceOrVerify(
  test,
  "assert.match(builderSource, /competition: 'conference', stage: 'playoffs'/);\nassert.match(builderSource, /Duplicate home-advantage match/);",
  "assert.match(builderSource, /competition: 'conference', stage: 'playoffs'/);\nassert.match(builderSource, /competition: 'champions', stage: 'q3'/);\nassert.match(builderSource, /Duplicate home-advantage match/);",
  'Champions Q3 scope source check'
);

test = replaceOrVerify(
  test,
  "assert.equal(generated.sourceSummary.storedMatches, 1150);\nassert.equal(generated.sourceSummary.matches, 1078);\nassert.equal(generated.sourceSummary.excludedStoredMatches, 72);\nassert.equal(generated.sourceSummary.teams, 56);\nassert.equal(generated.sourceSummary.activeTeamScope, 56);\nassert.equal(generated.sourceSummary.domesticMatches, 1063);",
  "assert.equal(generated.sourceSummary.storedMatches, 1252);\nassert.equal(generated.sourceSummary.matches, 1180);\nassert.equal(generated.sourceSummary.excludedStoredMatches, 72);\nassert.equal(generated.sourceSummary.teams, 62);\nassert.equal(generated.sourceSummary.activeTeamScope, 62);\nassert.equal(generated.sourceSummary.domesticMatches, 1165);",
  'generated summary totals'
);

test = replaceOrVerify(
  test,
  "assert.deepEqual(Array.from(generated.scope.priority[4].teams), ['atalanta', 'brighton', 'freiburg', 'getafe', 'monaco']);\nassert.equal(generated.scope.teams.length, 56);\nassert.equal(new Set(generated.scope.teams).size, 56);",
  "assert.deepEqual(Array.from(generated.scope.priority[4].teams), ['atalanta', 'brighton', 'freiburg', 'getafe', 'monaco']);\nassert.equal(generated.scope.priority[5].competition, 'champions');\nassert.equal(generated.scope.priority[5].stage, 'q3');\nassert.deepEqual(Array.from(generated.scope.priority[5].teams), ['bodo', 'lyon', 'nec', 'olympiacos', 'spartapraha', 'union']);\nassert.equal(generated.scope.teams.length, 62);\nassert.equal(new Set(generated.scope.teams).size, 62);\nassert.deepEqual(Array.from(generated.researchQueue), []);",
  'Champions Q3 scope order'
);

test = replaceOrVerify(
  test,
  "  atalanta: 1.0058,\n  brighton: 1.1701,\n  celtic: 1.18,",
  "  atalanta: 1.0058,\n  bodo: 1.18,\n  brighton: 1.1701,\n  celtic: 1.18,",
  'Bodø domestic attack entry'
);

test = replaceOrVerify(
  test,
  "  getafe: 0.84,\n  lask: 1.0245,\n  lillestrom: 0.9219,\n  monaco: 1.1574,",
  "  getafe: 0.84,\n  lask: 1.0245,\n  lillestrom: 0.9219,\n  lyon: 1.121,\n  monaco: 1.1574,\n  nec: 1.18,\n  olympiacos: 1.0039,\n  spartapraha: 1.02,",
  'Champions Q3 domestic attack entries'
);

test = replaceOrVerify(
  test,
  "  truidense: 1.1,\n  viktoriaplzen: 1.1341,\n  viking: 1.18,",
  "  truidense: 1.1,\n  union: 1.0924,\n  viktoriaplzen: 1.1341,\n  viking: 1.18,",
  'Union domestic attack entry'
);

const detailedAnchor = "assert.equal(generated.profiles.monaco.samples.overall.raw, 17);\nassert.equal(generated.profiles.astonvilla.attack.vsStronger, 1.0687);";
const detailedReplacement = `assert.equal(generated.profiles.monaco.samples.overall.raw, 17);
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
assert.equal(generated.profiles.astonvilla.attack.vsStronger, 1.0687);`;
test = replaceOrVerify(test, detailedAnchor, detailedReplacement, 'Champions Q3 detailed assertions');
fs.writeFileSync(testPath, test);

const docsPath = 'docs/home-advantage-model.md';
let docs = fs.readFileSync(docsPath, 'utf8');
docs = replaceOrVerify(
  docs,
  "4. `europa.playoffs`;\n5. `conference.playoffs`.\n\nGuaranteed Champions and Europa clubs remain the first two priorities, followed by the Champions, Europa, and Conference play-off pools. All five configured groups are complete.",
  "4. `europa.playoffs`;\n5. `conference.playoffs`;\n6. `champions.q3`.\n\nGuaranteed Champions and Europa clubs remain the first two priorities, followed by the Champions, Europa, and Conference play-off pools and then the Champions League third qualifying-round pool. All six configured groups are complete.",
  'research order'
);
docs = replaceOrVerify(
  docs,
  "- 5 Conference League play-off clubs;\n- 56 unique active clubs.",
  "- 5 Conference League play-off clubs;\n- 6 Champions League third qualifying-round clubs;\n- 62 unique active clubs.",
  'manifest scope totals'
);
docs = replaceOrVerify(
  docs,
  "The archive contains 1,150 verified home matches. The active-team filter currently includes 1,078 matches across all 56 active profiles:",
  "The archive contains 1,252 verified home matches. The active-team filter currently includes 1,180 matches across all 62 active profiles:",
  'snapshot totals'
);
docs = replaceOrVerify(
  docs,
  "- Atalanta, Brighton & Hove Albion, and Getafe: 19 each;\n- SC Freiburg and AS Monaco: 17 each.\n\nThe remaining 72 archived records are retained but excluded from runtime generation. All 29 guaranteed Champions League clubs, all 13 guaranteed Europa League clubs, all four Champions League play-off clubs, all five Europa League play-off clubs, and all five Conference League play-off clubs now have active profiles.",
  "- Atalanta, Brighton & Hove Albion, and Getafe: 19 each;\n- SC Freiburg and AS Monaco: 17 each;\n- Bodø/Glimt: 15;\n- Olympique Lyonnais, NEC, and Sparta Praha: 17 each;\n- Olympiacos: 16;\n- Union Saint-Gilloise: 20, including the championship play-off round.\n\nThe remaining 72 archived records are retained but excluded from runtime generation. All 29 guaranteed Champions League clubs, all 13 guaranteed Europa League clubs, all four Champions League play-off clubs, all five Europa League play-off clubs, all five Conference League play-off clubs, and all six Champions League third qualifying-round clubs now have active profiles.",
  'Champions Q3 snapshot clubs'
);

const q3Section = `### Champions League third qualifying-round clubs, 2024/25

\`bodo-lyon-nec-olympiacos-spartapraha-union-2024-25.json\` adds 102 domestic home matches for the six clubs in \`champions.q3\`: Bodø/Glimt 15, Olympique Lyonnais 17, NEC 17, Olympiacos 16, Sparta Praha 17, and Union Saint-Gilloise 20. Belgian and Czech championship-round matches remain included. Sparta has 17 rather than 18 home observations because its five-match championship group contained two home and three away fixtures.

| Club | Domestic attack | Domestic visiting-goal multiplier | Notable context |
|---|---:|---:|---|
| Bodø/Glimt | 1.1800 | 1.1600 | All 15 observations: weaker opponents |
| Olympique Lyonnais | 1.1210 | 1.1600 | Weaker opponents: 1.1236 attack |
| NEC | 1.1800 | 1.1544 | Stronger and similar opponents: 1.1800 attack |
| Olympiacos | 1.0039 | 1.1600 | All 16 observations: weaker opponents |
| Sparta Praha | 1.0200 | 1.1600 | Similar opponents: 1.0576 attack |
| Union Saint-Gilloise | 1.0924 | 0.8888 | Similar opponents: 0.8342 visiting goals |

Bodø/Glimt and NEC reach the attack ceiling, while Lyon and Union show clear positive domestic attacking residuals. Olympiacos and Sparta remain close to their coefficient baselines. Union also shows the strongest positive home defensive residual in this batch. Values above 1 in the visiting-goal column mean opponents scored above baseline; they are not defensive bonuses.

`;
docs = replaceOrVerify(
  docs,
  "### Spain and Germany 2024/25\n",
  `${q3Section}### Spain and Germany 2024/25\n`,
  'Champions Q3 documentation section'
);
fs.writeFileSync(docsPath, docs);
