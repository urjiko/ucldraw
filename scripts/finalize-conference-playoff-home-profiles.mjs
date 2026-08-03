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
  "assert.equal(records.length, 1059, 'Stored source archive must contain 1059 home matches.');\nassert.equal(new Set(matchKeys).size, records.length, 'Stored home matches must be unique.');\nassert.equal(records.filter((match) => match.competitionType === 'domestic').length, 1044);",
  "assert.equal(records.length, 1150, 'Stored source archive must contain 1150 home matches.');\nassert.equal(new Set(matchKeys).size, records.length, 'Stored home matches must be unique.');\nassert.equal(records.filter((match) => match.competitionType === 'domestic').length, 1135);",
  'stored archive totals'
);

test = replaceOrVerify(
  test,
  "assert.equal(records.filter((match) => match.homeSlug === 'viktoriaplzen').length, 18);\nassert.equal(records.filter((match) => match.homeSlug === 'sunderland').length, 24);",
  "assert.equal(records.filter((match) => match.homeSlug === 'viktoriaplzen').length, 18);\nassert.equal(records.filter((match) => match.homeSlug === 'atalanta').length, 19);\nassert.equal(records.filter((match) => match.homeSlug === 'brighton').length, 19);\nassert.equal(records.filter((match) => match.homeSlug === 'freiburg').length, 17);\nassert.equal(records.filter((match) => match.homeSlug === 'getafe').length, 19);\nassert.equal(records.filter((match) => match.homeSlug === 'monaco').length, 17);\nassert.equal(records.filter((match) => match.sourceKey === 'openfootball-italy-complete-2024-25').length, 1);\nassert.equal(records.filter((match) => match.sourceKey === 'transfermarkt-getafe-2024-25').length, 1);\nassert.equal(records.filter((match) => match.homeSlug === 'sunderland').length, 24);",
  'Conference match counts'
);

test = replaceOrVerify(
  test,
  "assert.match(builderSource, /competition: 'europa', stage: 'playoffs'/);\nassert.match(builderSource, /Duplicate home-advantage match/);",
  "assert.match(builderSource, /competition: 'europa', stage: 'playoffs'/);\nassert.match(builderSource, /competition: 'conference', stage: 'playoffs'/);\nassert.match(builderSource, /Duplicate home-advantage match/);",
  'Conference scope source check'
);

test = replaceOrVerify(
  test,
  "assert.equal(generated.sourceSummary.storedMatches, 1059);\nassert.equal(generated.sourceSummary.matches, 987);\nassert.equal(generated.sourceSummary.excludedStoredMatches, 72);\nassert.equal(generated.sourceSummary.teams, 51);\nassert.equal(generated.sourceSummary.activeTeamScope, 51);\nassert.equal(generated.sourceSummary.domesticMatches, 972);",
  "assert.equal(generated.sourceSummary.storedMatches, 1150);\nassert.equal(generated.sourceSummary.matches, 1078);\nassert.equal(generated.sourceSummary.excludedStoredMatches, 72);\nassert.equal(generated.sourceSummary.teams, 56);\nassert.equal(generated.sourceSummary.activeTeamScope, 56);\nassert.equal(generated.sourceSummary.domesticMatches, 1063);",
  'generated summary totals'
);

test = replaceOrVerify(
  test,
  "assert.deepEqual(Array.from(generated.scope.priority[3].teams), ['crete', 'lillestrom', 'trabzonspor', 'truidense', 'viktoriaplzen']);\nassert.equal(generated.scope.teams.length, 51);\nassert.equal(new Set(generated.scope.teams).size, 51);",
  "assert.deepEqual(Array.from(generated.scope.priority[3].teams), ['crete', 'lillestrom', 'trabzonspor', 'truidense', 'viktoriaplzen']);\nassert.equal(generated.scope.priority[4].competition, 'conference');\nassert.equal(generated.scope.priority[4].stage, 'playoffs');\nassert.deepEqual(Array.from(generated.scope.priority[4].teams), ['atalanta', 'brighton', 'freiburg', 'getafe', 'monaco']);\nassert.equal(generated.scope.teams.length, 56);\nassert.equal(new Set(generated.scope.teams).size, 56);",
  'Conference scope order'
);

test = replaceOrVerify(
  test,
  "const expectedDomesticAttack = {\n  aek: 1.1073,\n  arsenal: 0.9824,\n  celtic: 1.18,",
  "const expectedDomesticAttack = {\n  aek: 1.1073,\n  arsenal: 0.9824,\n  atalanta: 1.0058,\n  brighton: 1.1701,\n  celtic: 1.18,",
  'Conference domestic attack map start'
);

test = replaceOrVerify(
  test,
  "  crete: 0.9945,\n  lask: 1.0245,\n  lillestrom: 0.9219,",
  "  crete: 0.9945,\n  freiburg: 1.0554,\n  getafe: 0.84,\n  lask: 1.0245,\n  lillestrom: 0.9219,\n  monaco: 1.1574,",
  'Conference domestic attack map middle'
);

const detailedAnchor = "assert.equal(generated.profiles.viktoriaplzen.samples.overall.raw, 18);\nassert.equal(generated.profiles.astonvilla.attack.vsStronger, 1.0687);";
const detailedReplacement = `assert.equal(generated.profiles.viktoriaplzen.samples.overall.raw, 18);
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
assert.equal(generated.profiles.astonvilla.attack.vsStronger, 1.0687);`;
test = replaceOrVerify(test, detailedAnchor, detailedReplacement, 'Conference detailed assertions');
fs.writeFileSync(testPath, test);

const docsPath = 'docs/home-advantage-model.md';
let docs = fs.readFileSync(docsPath, 'utf8');
docs = replaceOrVerify(
  docs,
  "3. `champions.playoffs`;\n4. `europa.playoffs`.\n\nGuaranteed Champions and Europa clubs remain the first two priorities, followed by the Champions and Europa play-off pools. All four configured groups are complete.",
  "3. `champions.playoffs`;\n4. `europa.playoffs`;\n5. `conference.playoffs`.\n\nGuaranteed Champions and Europa clubs remain the first two priorities, followed by the Champions, Europa, and Conference play-off pools. All five configured groups are complete.",
  'research order'
);
docs = replaceOrVerify(
  docs,
  "- 5 Europa League play-off clubs;\n- 51 unique active clubs.",
  "- 5 Europa League play-off clubs;\n- 5 Conference League play-off clubs;\n- 56 unique active clubs.",
  'manifest scope totals'
);
docs = replaceOrVerify(
  docs,
  "The archive contains 1,059 verified home matches. The active-team filter currently includes 987 matches across all 51 active profiles:",
  "The archive contains 1,150 verified home matches. The active-team filter currently includes 1,078 matches across all 56 active profiles:",
  'snapshot totals'
);
docs = replaceOrVerify(
  docs,
  "- Sint-Truiden: 18;\n- Viktoria Plzeň: 18.\n\nThe remaining 72 archived records are retained but excluded from runtime generation. All 29 guaranteed Champions League clubs, all 13 guaranteed Europa League clubs, all four Champions League play-off clubs, and all five Europa League play-off clubs now have active profiles.",
  "- Sint-Truiden: 18;\n- Viktoria Plzeň: 18;\n- Atalanta, Brighton & Hove Albion, and Getafe: 19 each;\n- SC Freiburg and AS Monaco: 17 each.\n\nThe remaining 72 archived records are retained but excluded from runtime generation. All 29 guaranteed Champions League clubs, all 13 guaranteed Europa League clubs, all four Champions League play-off clubs, all five Europa League play-off clubs, and all five Conference League play-off clubs now have active profiles.",
  'Conference snapshot clubs'
);

const conferenceSection = `### Conference League play-off clubs, 2024/25

\`atalanta-brighton-freiburg-getafe-monaco-2024-25.json\` adds 91 domestic home matches for the five clubs in \`conference.playoffs\`: Atalanta 19, Brighton & Hove Albion 19, SC Freiburg 17, Getafe 19, and AS Monaco 17. The primary OpenFootball JSON sources are validated against their complete league fixture volumes. Two final-round fixtures retained blank scores in those JSON files, so Atalanta 2-3 Parma and Getafe 1-2 Celta Vigo are completed from separately identified season sources.

| Club | Domestic attack | Domestic visiting-goal multiplier | Notable context |
|---|---:|---:|---|
| Atalanta | 1.0058 | 1.1600 | Similar opponents: 1.0353 attack |
| Brighton & Hove Albion | 1.1701 | 1.0693 | Stronger opponents: 1.1800 attack |
| SC Freiburg | 1.0554 | 1.1600 | Weaker opponents: 1.0826 attack |
| Getafe | 0.8400 | 0.9367 | Stronger opponents: 0.9579 attack |
| AS Monaco | 1.1574 | 1.1145 | Weaker opponents: 1.1448 attack |

Atalanta remains close to its coefficient baseline. Brighton and Monaco show strong positive attacking residuals, while Freiburg is moderately positive overall. Getafe reaches the attack floor but also shows a positive home defensive residual because its visiting-goal multiplier is below 1. A visiting-goal multiplier above 1 means opponents scored above baseline; it is not a defensive bonus.

`;
docs = replaceOrVerify(
  docs,
  "### Spain and Germany 2024/25\n",
  `${conferenceSection}### Spain and Germany 2024/25\n`,
  'Conference documentation section'
);
fs.writeFileSync(docsPath, docs);
