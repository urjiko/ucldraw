import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const branchTargets = Object.freeze({
  bodo: Object.freeze({ sourceName: 'FK Bodø/Glimt', name: 'Bodø/Glimt', country: 'NOR', competition: 'Norwegian Eliteserien 2024', sourceKey: 'openfootball-no-2024' }),
  lyon: Object.freeze({ sourceName: 'Olympique Lyonnais', name: 'Olympique Lyonnais', country: 'FRA', competition: 'French Ligue 1 2024/25', sourceKey: 'openfootball-fr-2024-25' }),
  nec: Object.freeze({ sourceName: 'NEC', name: 'NEC', country: 'NED', competition: 'Netherlands Eredivisie 2024/25', sourceKey: 'openfootball-nl-2024-25' }),
  olympiacos: Object.freeze({ sourceName: 'Olympiakos Piraeus', name: 'Olympiacos', country: 'GRE', competition: 'Greek Super League 2024/25', sourceKey: 'openfootball-gr-2024-25' }),
  spartapraha: Object.freeze({ sourceName: 'AC Sparta Praha', name: 'Sparta Praha', country: 'CZE', competition: 'Czech First League 2024/25', sourceKey: 'openfootball-cz-2024-25' }),
  union: Object.freeze({ sourceName: 'Union Saint-Gilloise', name: 'Union Saint-Gilloise', country: 'BEL', competition: 'Belgian First Division A 2024/25', sourceKey: 'openfootball-be-2024-25' })
});

const expectedCounts = Object.freeze({ bodo: 15, lyon: 17, nec: 17, olympiacos: 16, spartapraha: 18, union: 20 });
const expectedLeagueSizes = Object.freeze({ france: 306, netherlands: 306, greece: 236, belgium: 313, norway: 240, czechia: 276 });
const floors = Object.freeze({ NOR: 8.247, FRA: 16.699, NED: 15.166, GRE: 9.682, CZE: 9.705, BEL: 12.45 });

const urls = Object.freeze({
  france: 'https://raw.githubusercontent.com/openfootball/football.json/master/2024-25/fr.1.json',
  netherlands: 'https://raw.githubusercontent.com/openfootball/football.json/master/2024-25/nl.1.json',
  greece: 'https://raw.githubusercontent.com/openfootball/football.json/master/2024-25/gr.1.json',
  belgium: 'https://raw.githubusercontent.com/openfootball/football.json/master/2024-25/be.1.json',
  norway: 'https://raw.githubusercontent.com/openfootball/europe/master/norway/2024_no1.txt',
  czechia: 'https://raw.githubusercontent.com/openfootball/europe/master/czech-republic/2024-25_cz1.txt'
});

const aliases = Object.freeze({
  'FK Bodø/Glimt': ['bodo', 'Bodø/Glimt'],
  'Viking FK': ['viking', 'Viking'],
  'Lillestrøm SK': ['lillestrom', 'Lillestrøm'],
  'SK Brann': ['brann', 'Brann'],
  'Tromsø IL': ['tromso', 'Tromsø'],
  'Olympique Lyonnais': ['lyon', 'Olympique Lyonnais'],
  'Paris Saint-Germain FC': ['psg', 'Paris Saint-Germain'],
  'Olympique de Marseille': ['marseille', 'Marseille'],
  'Lille OSC': ['lille', 'Lille'],
  'Racing Club de Lens': ['lens', 'Lens'],
  'Stade Rennais FC 1901': ['rennais', 'Rennes'],
  'AS Monaco FC': ['monaco', 'AS Monaco'],
  'NEC': ['nec', 'NEC'],
  'AFC Ajax': ['ajax', 'Ajax'],
  'PSV': ['psv', 'PSV Eindhoven'],
  'Feyenoord': ['feyenoord', 'Feyenoord'],
  'AZ': ['azalkmaar', 'AZ Alkmaar'],
  'FC Twente': ['twente', 'Twente'],
  'FC Utrecht': ['utrecht', 'Utrecht'],
  'Go Ahead Eagles': ['goaheadeagles', 'Go Ahead Eagles'],
  'Olympiakos Piraeus': ['olympiacos', 'Olympiacos'],
  'AEK Athens': ['aek', 'AEK Athens'],
  'Panathinaikos': ['panathinaikos', 'Panathinaikos'],
  'PAOK Thessaloniki': ['paok', 'PAOK'],
  'AC Sparta Praha': ['spartapraha', 'Sparta Praha'],
  'Slavia Praha': ['slavia', 'Slavia Praha'],
  'Viktoria Plzeň': ['viktoriaplzen', 'Viktoria Plzeň'],
  'FC Hradec Králové': ['hradeckralove', 'Hradec Králové'],
  'FK Jablonec': ['jablonec', 'Jablonec'],
  'Union Saint-Gilloise': ['union', 'Union Saint-Gilloise'],
  'Club Brugge KV': ['brugge', 'Club Brugge'],
  'RSC Anderlecht': ['anderlecht', 'Anderlecht'],
  'KAA Gent': ['gent', 'Gent'],
  'KRC Genk': ['genk', 'Genk'],
  'Sint-Truidense VV': ['truidense', 'Sint-Truiden']
});

function simplify(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/\b(?:fc|fk|sk|afc|ac|as|rsc|kaa|krc|kv|vv|osc|club|racing|olympique|stade)\b/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

function simpleSlug(value) {
  return simplify(value) || 'unknown';
}

function loadCoefficientSnapshot() {
  const context = { window: {}, Object };
  vm.runInNewContext(fs.readFileSync('generated-club-coefficients.js', 'utf8'), context, {
    filename: 'generated-club-coefficients.js'
  });
  return context.window.UCLDRAW_CLUB_COEFFICIENTS.clubs;
}

const coefficients = loadCoefficientSnapshot();
const normalizedCoefficientNames = new Map();
for (const [slug, record] of Object.entries(coefficients)) {
  normalizedCoefficientNames.set(simplify(record.officialName), slug);
}

function teamFor(sourceName, country, forcedSlug = null, forcedName = null) {
  const configured = aliases[sourceName];
  const matchedSlug = forcedSlug
    || configured?.[0]
    || normalizedCoefficientNames.get(simplify(sourceName))
    || simpleSlug(sourceName);
  return {
    slug: matchedSlug,
    name: forcedName || configured?.[1] || sourceName,
    country
  };
}

function coefficientFor(team) {
  const value = Number(coefficients[team.slug]?.coefficient);
  return Number.isFinite(value) ? value : floors[team.country];
}

function isoDate(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const months = Object.freeze({ Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 });
function parseTextLeague(text, yearForMonth) {
  const fixtures = [];
  let currentDate = null;
  for (const line of text.split(/\r?\n/)) {
    const dateMatch = line.match(/^\s{2}(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+([A-Z][a-z]{2})\s+(\d{1,2})(?:\s+(\d{4}))?\s*$/);
    if (dateMatch) {
      const month = months[dateMatch[1]];
      const explicitYear = Number(dateMatch[3]);
      const year = Number.isInteger(explicitYear) && explicitYear > 0 ? explicitYear : yearForMonth(month);
      currentDate = isoDate(year, month, Number(dateMatch[2]));
      continue;
    }
    const fixture = line.match(/^\s*(?:(\d{1,2}:\d{2})\s+)?(.+?)\s+v\s+(.+?)\s+(\d+)-(\d+)(?:\s+\(\d+-\d+\))?\s*$/);
    if (!fixture || !currentDate) continue;
    fixtures.push({ date: currentDate, team1: fixture[2].trim(), team2: fixture[3].trim(), score: { ft: [Number(fixture[4]), Number(fixture[5])] } });
  }
  return fixtures;
}

async function fetchText(url, key) {
  const response = await fetch(url, { headers: { 'user-agent': 'UEFA-home-profile-builder/1.0' } });
  if (!response.ok) throw new Error(`${key} source failed: ${response.status}`);
  return response.text();
}

const [france, netherlands, greece, belgium, norwayText, czechText] = await Promise.all([
  fetchText(urls.france, 'france').then(JSON.parse),
  fetchText(urls.netherlands, 'netherlands').then(JSON.parse),
  fetchText(urls.greece, 'greece').then(JSON.parse),
  fetchText(urls.belgium, 'belgium').then(JSON.parse),
  fetchText(urls.norway, 'norway'),
  fetchText(urls.czechia, 'czechia')
]);

const sources = Object.freeze({
  france: france.matches,
  netherlands: netherlands.matches,
  greece: greece.matches,
  belgium: belgium.matches,
  norway: parseTextLeague(norwayText, () => 2024),
  czechia: parseTextLeague(czechText, (month) => month <= 6 ? 2025 : 2024)
});

for (const [key, matches] of Object.entries(sources)) {
  if (!Array.isArray(matches) || matches.length !== expectedLeagueSizes[key]) {
    throw new Error(`Expected ${expectedLeagueSizes[key]} ${key} matches, received ${matches?.length}.`);
  }
  if (matches.some((match) => !Array.isArray(match.score?.ft))) {
    throw new Error(`${key} source contains an incomplete full-time score.`);
  }
}

const sourceByTarget = Object.freeze({ bodo: sources.norway, lyon: sources.france, nec: sources.netherlands, olympiacos: sources.greece, spartapraha: sources.czechia, union: sources.belgium });
const records = [];
for (const [slug, target] of Object.entries(branchTargets)) {
  for (const match of sourceByTarget[slug]) {
    if (match.team1 !== target.sourceName || !Array.isArray(match.score?.ft)) continue;
    const home = teamFor(match.team1, target.country, slug, target.name);
    const away = teamFor(match.team2, target.country);
    records.push({
      date: match.date,
      competitionType: 'domestic',
      competition: target.competition,
      homeSlug: home.slug,
      homeName: home.name,
      homeCountry: home.country,
      awaySlug: away.slug,
      awayName: away.name,
      awayCountry: away.country,
      homeCoefficient: coefficientFor(home),
      awayCoefficient: coefficientFor(away),
      homePot: 1,
      awayPot: 1,
      potCount: 1,
      homeGoals: Number(match.score.ft[0]),
      awayGoals: Number(match.score.ft[1]),
      sourceKey: target.sourceKey
    });
  }
}

records.sort((left, right) => left.date.localeCompare(right.date) || left.homeSlug.localeCompare(right.homeSlug));
for (const [slug, expected] of Object.entries(expectedCounts)) {
  const actual = records.filter((record) => record.homeSlug === slug).length;
  if (actual !== expected) throw new Error(`Expected ${expected} ${slug} home matches, received ${actual}.`);
}
if (records.length !== 103) throw new Error(`Expected 103 Champions Q3 home matches, received ${records.length}.`);
const recordKeys = records.map((record) => [record.date, record.competitionType, record.competition, record.homeSlug, record.awaySlug].join('|'));
if (new Set(recordKeys).size !== records.length) throw new Error('Champions Q3 batch contains duplicate matches.');

const existingFiles = [
  'data/home-advantage-matches.json',
  ...fs.readdirSync('data/home-advantage-matches').filter((name) => name.endsWith('.json')).sort().map((name) => path.join('data/home-advantage-matches', name))
];
const existing = existingFiles.flatMap((file) => JSON.parse(fs.readFileSync(file, 'utf8')));
const existingKeys = new Set(existing.map((match) => [match.date, match.competitionType, match.competition || '', match.homeSlug, match.awaySlug].join('|')));
const collisions = recordKeys.filter((key) => existingKeys.has(key));
if (collisions.length) throw new Error(`Champions Q3 batch collides with existing records: ${collisions.join(', ')}`);
const existingTargetCounts = Object.fromEntries(Object.keys(expectedCounts).map((slug) => [slug, existing.filter((match) => match.homeSlug === slug).length]));

const outputPath = 'data/home-advantage-matches/bodo-lyon-nec-olympiacos-spartapraha-union-2024-25.json';
fs.writeFileSync(outputPath, `${JSON.stringify(records)}\n`);

const builderPath = 'scripts/build-home-advantage-profiles.mjs';
let builder = fs.readFileSync(builderPath, 'utf8');
const oldPriorities = `  const priorities = [\n    { competition: 'champions', stage: 'guaranteed' },\n    { competition: 'europa', stage: 'guaranteed' },\n    { competition: 'champions', stage: 'playoffs' },\n    { competition: 'europa', stage: 'playoffs' },\n    { competition: 'conference', stage: 'playoffs' }\n  ];`;
const newPriorities = `  const priorities = [\n    { competition: 'champions', stage: 'guaranteed' },\n    { competition: 'europa', stage: 'guaranteed' },\n    { competition: 'champions', stage: 'playoffs' },\n    { competition: 'europa', stage: 'playoffs' },\n    { competition: 'conference', stage: 'playoffs' },\n    { competition: 'champions', stage: 'q3' }\n  ];`;
if (!builder.includes(newPriorities)) {
  if (!builder.includes(oldPriorities)) throw new Error('Priority scope block changed unexpectedly.');
  builder = builder.replace(oldPriorities, newPriorities);
}
fs.writeFileSync(builderPath, builder);

const targetCoefficients = Object.fromEntries(Object.keys(expectedCounts).map((slug) => [slug, coefficients[slug]?.coefficient]));
const sourceNote = `# Champions League Q3 domestic home data, 2024/25\n\nThis batch adds complete domestic home seasons for the six clubs listed under \`champions.q3\` in \`generated-team-pools.js\`.\n\n## Coverage\n\n| Club | Competition | Home matches |\n|---|---|---:|\n| Bodø/Glimt | Norwegian Eliteserien 2024 | 15 |\n| Olympique Lyonnais | French Ligue 1 2024/25 | 17 |\n| NEC | Netherlands Eredivisie 2024/25 | 17 |\n| Olympiacos | Greek Super League 2024/25 | 16 |\n| Sparta Praha | Czech First League 2024/25 | 18 |\n| Union Saint-Gilloise | Belgian First Division A 2024/25 | 20 |\n\nThe 103 normalized records are stored in \`${outputPath}\`. Czech and Belgian post-split championship fixtures remain included.\n\n## Sources and validation\n\n- Bodø/Glimt: OpenFootball Europe, \`norway/2024_no1.txt\`, 240 matches.\n- Olympique Lyonnais: OpenFootball Football.JSON, \`2024-25/fr.1.json\`, 306 matches.\n- NEC: OpenFootball Football.JSON, \`2024-25/nl.1.json\`, 306 matches.\n- Olympiacos: OpenFootball Football.JSON, \`2024-25/gr.1.json\`, 236 matches.\n- Sparta Praha: OpenFootball Europe, \`czech-republic/2024-25_cz1.txt\`, 276 matches.\n- Union Saint-Gilloise: OpenFootball Football.JSON, \`2024-25/be.1.json\`, 313 matches.\n\nTarget clubs use the pinned 2026 UEFA coefficient snapshot. Unmatched opponents use association floors: Norway \`8.247\`, France \`16.699\`, Netherlands \`15.166\`, Greece \`9.682\`, Czechia \`9.705\`, and Belgium \`12.450\`. Historical pot fields remain neutral at \`1\`.\n`;
fs.writeFileSync('docs/home-advantage-sources/champions-q3-2024-25.md', sourceNote);

console.log(JSON.stringify({ expectedCounts, expectedLeagueSizes, floors, targetCoefficients, existingTargetCounts, stored: records.length }, null, 2));
