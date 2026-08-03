import fs from 'node:fs';

function replaceOrVerify(text, oldText, newText, label) {
  if (text.includes(newText)) return text;
  if (!text.includes(oldText)) throw new Error(`Missing ${label} anchor.`);
  return text.replace(oldText, newText);
}

const testPath = 'tests/home-advantage-model.test.js';
let tests = fs.readFileSync(testPath, 'utf8');
tests = replaceOrVerify(tests,
  "assert.equal(records.length, 974, 'Stored source archive must contain 974 home matches.');",
  "assert.equal(records.length, 1059, 'Stored source archive must contain 1059 home matches.');",
  'stored archive count');
tests = replaceOrVerify(tests,
  "assert.equal(records.filter((match) => match.competitionType === 'domestic').length, 959);",
  "assert.equal(records.filter((match) => match.competitionType === 'domestic').length, 1044);",
  'stored domestic count');
tests = replaceOrVerify(tests,
  "assert.equal(records.filter((match) => match.homeSlug === 'viking').length, 15);",
  "assert.equal(records.filter((match) => match.homeSlug === 'viking').length, 15);\nassert.equal(records.filter((match) => match.homeSlug === 'crete').length, 16);\nassert.equal(records.filter((match) => match.homeSlug === 'lillestrom').length, 15);\nassert.equal(records.filter((match) => match.homeSlug === 'trabzonspor').length, 58);\nassert.equal(records.filter((match) => match.homeSlug === 'truidense').length, 18);\nassert.equal(records.filter((match) => match.homeSlug === 'viktoriaplzen').length, 18);",
  'Europa playoff match counts');
tests = replaceOrVerify(tests,
  "assert.match(builderSource, /competition: 'champions', stage: 'playoffs'/);",
  "assert.match(builderSource, /competition: 'champions', stage: 'playoffs'/);\nassert.match(builderSource, /competition: 'europa', stage: 'playoffs'/);",
  'Europa playoff scope assertion');
tests = replaceOrVerify(tests, 'assert.equal(generated.sourceSummary.storedMatches, 974);', 'assert.equal(generated.sourceSummary.storedMatches, 1059);', 'generated stored count');
tests = replaceOrVerify(tests, 'assert.equal(generated.sourceSummary.matches, 862);', 'assert.equal(generated.sourceSummary.matches, 987);', 'generated active count');
tests = replaceOrVerify(tests, 'assert.equal(generated.sourceSummary.excludedStoredMatches, 112);', 'assert.equal(generated.sourceSummary.excludedStoredMatches, 72);', 'generated excluded count');
tests = replaceOrVerify(tests, 'assert.equal(generated.sourceSummary.teams, 46);', 'assert.equal(generated.sourceSummary.teams, 51);', 'generated team count');
tests = replaceOrVerify(tests, 'assert.equal(generated.sourceSummary.activeTeamScope, 46);', 'assert.equal(generated.sourceSummary.activeTeamScope, 51);', 'generated scope count');
tests = replaceOrVerify(tests, 'assert.equal(generated.sourceSummary.domesticMatches, 850);', 'assert.equal(generated.sourceSummary.domesticMatches, 972);', 'generated domestic count');
tests = replaceOrVerify(tests, 'assert.equal(generated.sourceSummary.europeanMatches, 12);', 'assert.equal(generated.sourceSummary.europeanMatches, 15);', 'generated Europe count');
tests = replaceOrVerify(tests,
  "assert.deepEqual(Array.from(generated.scope.priority[2].teams), ['aek', 'celtic', 'lask', 'viking']);\nassert.equal(generated.scope.teams.length, 46);\nassert.equal(new Set(generated.scope.teams).size, 46);",
  "assert.deepEqual(Array.from(generated.scope.priority[2].teams), ['aek', 'celtic', 'lask', 'viking']);\nassert.equal(generated.scope.priority[3].competition, 'europa');\nassert.equal(generated.scope.priority[3].stage, 'playoffs');\nassert.deepEqual(Array.from(generated.scope.priority[3].teams), ['crete', 'lillestrom', 'trabzonspor', 'truidense', 'viktoriaplzen']);\nassert.equal(generated.scope.teams.length, 51);\nassert.equal(new Set(generated.scope.teams).size, 51);",
  'Europa playoff priority');
tests = replaceOrVerify(tests,
  "  celtic: 1.18,\n  lask: 1.0245,\n  viking: 1.18,",
  "  celtic: 1.18,\n  crete: 0.9945,\n  lask: 1.0245,\n  lillestrom: 0.9219,\n  trabzonspor: 1.18,\n  truidense: 1.1,\n  viktoriaplzen: 1.1341,\n  viking: 1.18,",
  'Europa playoff domestic attacks');
const profileAssertions = `assert.equal(generated.profiles.crete.attack.overall, 0.9955);
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
assert.equal(generated.profiles.viktoriaplzen.samples.overall.raw, 18);`;
tests = replaceOrVerify(tests,
  "assert.equal(generated.profiles.viking.samples.overall.raw, 15);\nassert.equal(generated.profiles.astonvilla.attack.vsStronger, 1.0687);",
  `assert.equal(generated.profiles.viking.samples.overall.raw, 15);\n${profileAssertions}\nassert.equal(generated.profiles.astonvilla.attack.vsStronger, 1.0687);`,
  'Europa playoff profile assertions');
tests = tests.replace("console.log('Guaranteed-team home profile checks passed.');", "console.log('Active-scope home profile checks passed.');");
fs.writeFileSync(testPath, tests);

const docsPath = 'docs/home-advantage-model.md';
let docs = fs.readFileSync(docsPath, 'utf8');
docs = replaceOrVerify(docs,
  "1. `champions.guaranteed`;\n2. `europa.guaranteed`;\n3. `champions.playoffs`.",
  "1. `champions.guaranteed`;\n2. `europa.guaranteed`;\n3. `champions.playoffs`;\n4. `europa.playoffs`.",
  'active order');
docs = replaceOrVerify(docs,
  'Guaranteed Champions and Europa clubs remain the first two priorities. The next active group is the four-club Champions League play-off pool. Records outside these configured groups remain archived but do not affect runtime generation.',
  'Guaranteed Champions and Europa clubs remain the first two priorities, followed by the Champions and Europa play-off pools. All four configured groups are complete. Records outside these groups remain archived and do not affect runtime generation.',
  'active order explanation');
docs = replaceOrVerify(docs,
  '- 4 Champions League play-off clubs;\n- 46 unique active clubs.',
  '- 4 Champions League play-off clubs;\n- 5 Europa League play-off clubs;\n- 51 unique active clubs.',
  'manifest scope');
docs = replaceOrVerify(docs,
  'The archive contains 974 verified home matches. The active-team filter currently includes 862 matches across all 46 active profiles:',
  'The archive contains 1,059 verified home matches. The active-team filter currently includes 987 matches across all 51 active profiles:',
  'snapshot totals');
docs = replaceOrVerify(docs,
  '- Viking: 15.\n\nThe remaining 112 archived records are retained but excluded from runtime generation. All 29 guaranteed Champions League clubs, all 13 guaranteed Europa League clubs, and all four Champions League play-off clubs now have active profiles. The active-scope research queue is empty.',
  '- Viking: 15;\n- OFI Crete: 16;\n- Lillestrøm: 15;\n- Trabzonspor: 58 total observations, including 55 domestic and 3 European matches;\n- Sint-Truiden: 18;\n- Viktoria Plzeň: 18.\n\nThe remaining 72 archived records are retained but excluded from runtime generation. All 29 guaranteed Champions League clubs, all 13 guaranteed Europa League clubs, all four Champions League play-off clubs, and all five Europa League play-off clubs now have active profiles. The active-scope research queue is empty.',
  'snapshot team coverage');
const europaSection = `### Europa League play-off clubs, 2024/25

\`crete-lillestrom-trabzonspor-truidense-viktoriaplzen-2024-25.json\` adds 85 domestic home matches for the five clubs in \`europa.playoffs\`: OFI Crete 16, Lillestrøm 15, Trabzonspor 18, Sint-Truiden 18, and Viktoria Plzeň 18. Belgian and Czech post-split fixtures are retained. Activating Trabzonspor also brings 40 existing archived observations into runtime scope, producing a 58-match profile with 55 domestic and 3 European matches.

| Club | Domestic attack | Domestic visiting-goal multiplier | Notable context |
|---|---:|---:|---|
| OFI Crete | 0.9945 | 1.1600 | Similar opponents: 1.0824 attack |
| Lillestrøm | 0.9219 | 1.1600 | Stronger opponents: 0.9705 attack |
| Trabzonspor | 1.1800 | 1.1399 | Europe attack: 0.9057; 58 total observations |
| Sint-Truiden | 1.1000 | 1.1600 | Similar opponents: 1.1228 attack |
| Viktoria Plzeň | 1.1341 | 1.1600 | Weaker opponents: 1.1550 attack |

OFI is nearly neutral overall but improves against similar opponents. Lillestrøm remains below its coefficient baseline. Trabzonspor reaches the attack ceiling domestically, while its European sample is below neutral. Sint-Truiden and Viktoria Plzeň show clear positive domestic attacking residuals. A visiting-goal multiplier above 1 means opponents scored above the coefficient baseline; it is not a defensive bonus.

`;
docs = replaceOrVerify(docs,
  '### Spain and Germany 2024/25',
  `${europaSection}### Spain and Germany 2024/25`,
  'Europa playoff documentation section');
fs.writeFileSync(docsPath, docs);

const sourceNote = `# Europa playoff domestic home data, 2024/25

This batch adds complete domestic home seasons for the five clubs listed under \`europa.playoffs\` in \`generated-team-pools.js\`.

## Coverage

| Club | Competition | New home matches |
|---|---|---:|
| OFI Crete | Greek Super League 2024/25 | 16 |
| Lillestrøm | Norwegian Eliteserien 2024 | 15 |
| Trabzonspor | Turkish Süper Lig 2024/25 | 18 |
| Sint-Truiden | Belgian First Division A 2024/25 | 18 |
| Viktoria Plzeň | Czech First League 2024/25 | 18 |

The 85 normalized records are stored in \`data/home-advantage-matches/crete-lillestrom-trabzonspor-truidense-viktoriaplzen-2024-25.json\`.

## Sources and validation

- OFI Crete: OpenFootball Football.JSON, \`2024-25/gr.1.json\`, validated against all 236 source matches.
- Lillestrøm: OpenFootball Europe, \`norway/2024_no1.txt\`, validated against all 240 source matches.
- Trabzonspor: OpenFootball Football.JSON, \`2024-25/tr.1.json\`, validated against all 342 source matches.
- Sint-Truiden: OpenFootball Football.JSON, \`2024-25/be.1.json\`, validated against all 313 source matches.
- Viktoria Plzeň: OpenFootball Europe, \`czech-republic/2024-25_cz1.txt\`, validated against all 276 source matches.

Belgian and Czech post-split fixtures remain included. Full-time results are not discarded merely because they belong to placement, championship, or relegation stages.

## Pinned strength values

Target-club coefficients use the generated 2026 project snapshot:

- OFI Crete: \`9.682\`;
- Lillestrøm: \`2.000\`;
- Trabzonspor: \`11.000\`;
- Sint-Truiden: \`12.450\`;
- Viktoria Plzeň: \`50.500\`.

Unmatched opponents use association floors already pinned by existing project data:

- Greece: \`9.682\`;
- Norway: \`8.247\`;
- Türkiye: \`10.375\`;
- Belgium: \`12.450\`;
- Czechia: \`9.705\`.

Historical pot fields remain neutral at \`1\`. Activating Trabzonspor also activates 40 existing archived observations, so its generated profile contains 58 total matches rather than only the 18 newly added fixtures.
`;
fs.writeFileSync('docs/home-advantage-sources/europa-playoffs-2024-25.md', sourceNote);

console.log('Finalized Europa playoff tests and documentation.');
