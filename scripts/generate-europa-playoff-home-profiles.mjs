import fs from 'node:fs';
import vm from 'node:vm';

const urls = {
  greece: 'https://raw.githubusercontent.com/openfootball/football.json/master/2024-25/gr.1.json',
  turkey: 'https://raw.githubusercontent.com/openfootball/football.json/master/2024-25/tr.1.json',
  belgium: 'https://raw.githubusercontent.com/openfootball/football.json/master/2024-25/be.1.json',
  norway: 'https://raw.githubusercontent.com/openfootball/europe/master/norway/2024_no1.txt',
  czech: 'https://raw.githubusercontent.com/openfootball/europe/master/czech-republic/2024-25_cz1.txt'
};

const floors = Object.freeze({
  GRE: 9.682,
  NOR: 8.247,
  TUR: 10.375,
  BEL: 12.45,
  CZE: 9.705
});

const expectedLeagueSizes = Object.freeze({
  greece: 236,
  turkey: 342,
  belgium: 313,
  norway: 240,
  czech: 276
});

const expectedTargets = Object.freeze({
  crete: 16,
  lillestrom: 15,
  trabzonspor: 18,
  truidense: 18,
  viktoriaplzen: 18
});

const coefficientContext = { window: {}, Object };
vm.runInNewContext(fs.readFileSync('generated-club-coefficients.js', 'utf8'), coefficientContext);
const generatedCoefficients = coefficientContext.window.UCLDRAW_CLUB_COEFFICIENTS.clubs;

const teamAliases = {
  'OFI Heraklion': { slug: 'crete', name: 'OFI Crete' },
  'AEK Athen': { slug: 'aek', name: 'AEK Athens' },
  'Olympiakos Piraeus': { slug: 'olympiacos', name: 'Olympiakos Piraeus' },
  'PAOK Saloniki': { slug: 'paok', name: 'PAOK Thessaloniki' },
  'Panathinaikos': { slug: 'panathinaikos', name: 'Panathinaikos' },
  'Lillestrøm SK': { slug: 'lillestrom', name: 'Lillestrøm' },
  'FK Bodø/Glimt': { slug: 'bodo', name: 'Bodø/Glimt' },
  'SK Brann': { slug: 'brann', name: 'Brann' },
  'Tromsø IL': { slug: 'tromso', name: 'Tromsø' },
  'Viking FK': { slug: 'viking', name: 'Viking' },
  'Trabzonspor': { slug: 'trabzonspor', name: 'Trabzonspor' },
  'Galatasaray': { slug: 'galatasaray', name: 'Galatasaray' },
  'Fenerbahçe': { slug: 'fenerbahce', name: 'Fenerbahçe' },
  'Beşiktaş': { slug: 'besiktas', name: 'Beşiktaş' },
  'İstanbul Başakşehir': { slug: 'basaksehir', name: 'İstanbul Başakşehir' },
  'Samsunspor': { slug: 'samsunspor', name: 'Samsunspor' },
  'Sint-Truidense VV': { slug: 'truidense', name: 'Sint-Truiden' },
  'Club Brugge KV': { slug: 'brugge', name: 'Club Brugge' },
  'Union Saint-Gilloise': { slug: 'union', name: 'Union Saint-Gilloise' },
  'RSC Anderlecht': { slug: 'anderlecht', name: 'Anderlecht' },
  'KRC Genk': { slug: 'genk', name: 'Genk' },
  'KAA Gent': { slug: 'gent', name: 'Gent' },
  'Royal Antwerp FC': { slug: 'antwerp', name: 'Royal Antwerp' },
  'Cercle Brugge': { slug: 'cerclebrugge', name: 'Cercle Brugge' },
  'Viktoria Plzeň': { slug: 'viktoriaplzen', name: 'Viktoria Plzeň' },
  'Slavia Praha': { slug: 'slavia', name: 'Slavia Praha' },
  'AC Sparta Praha': { slug: 'spartapraha', name: 'Sparta Praha' },
  'Baník Ostrava': { slug: 'banikostrava', name: 'Baník Ostrava' },
  'FK Jablonec': { slug: 'jablonec', name: 'Jablonec' },
  'FC Hradec Králové': { slug: 'hradeckralove', name: 'Hradec Králové' }
};

const targets = new Map([
  ['OFI Heraklion', { slug: 'crete', country: 'GRE', competition: 'Greek Super League 2024/25', sourceKey: 'openfootball-gr-2024-25' }],
  ['Lillestrøm SK', { slug: 'lillestrom', country: 'NOR', competition: 'Norwegian Eliteserien 2024', sourceKey: 'openfootball-no-2024' }],
  ['Trabzonspor', { slug: 'trabzonspor', country: 'TUR', competition: 'Turkish Süper Lig 2024/25', sourceKey: 'openfootball-tr-2024-25' }],
  ['Sint-Truidense VV', { slug: 'truidense', country: 'BEL', competition: 'Belgian First Division A 2024/25', sourceKey: 'openfootball-be-2024-25' }],
  ['Viktoria Plzeň', { slug: 'viktoriaplzen', country: 'CZE', competition: 'Czech First League 2024/25', sourceKey: 'openfootball-cz-2024-25' }]
]);

function simpleSlug(value) {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/\b(?:fc|afc|fk|bk|sk|sc|ac|cf|nfc|if|il|kv|kvc|kaa|krc|rsc|vv)\b/g, '')
    .replace(/[^a-z0-9]+/g, '') || 'unknown';
}

function team(sourceName, country, targetSlug = null) {
  const configured = teamAliases[sourceName] || {};
  return {
    slug: targetSlug || configured.slug || simpleSlug(sourceName),
    name: configured.name || sourceName,
    country
  };
}

function coefficientFor(candidate) {
  const exact = Number(generatedCoefficients[candidate.slug]?.coefficient);
  return Number.isFinite(exact) ? exact : floors[candidate.country];
}

const records = [];
function addRecord({ date, homeSource, awaySource, homeGoals, awayGoals, target }) {
  const home = team(homeSource, target.country, target.slug);
  const away = team(awaySource, target.country);
  records.push({
    date,
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
    homeGoals: Number(homeGoals),
    awayGoals: Number(awayGoals),
    sourceKey: target.sourceKey
  });
}

function parseText(text, expectedTotal) {
  const monthIndex = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  let currentYear = 2024;
  let previousMonth = null;
  let currentDate = null;
  let parsed = 0;
  for (const line of text.split(/\r?\n/)) {
    const dateMatch = line.match(/^\s*(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+([A-Z][a-z]{2})\s+(\d{1,2})(?:\s+(\d{4}))?\s*$/);
    if (dateMatch) {
      const month = monthIndex[dateMatch[1]];
      if (dateMatch[3]) currentYear = Number(dateMatch[3]);
      else if (previousMonth !== null && month < previousMonth - 6) currentYear += 1;
      previousMonth = month;
      currentDate = `${currentYear}-${String(month + 1).padStart(2, '0')}-${String(Number(dateMatch[2])).padStart(2, '0')}`;
      continue;
    }
    const result = line.match(/^\s*(?:\d{2}:\d{2}\s+)?(.+?)\s+v\s+(.+?)\s+(\d+)-(\d+)(?:\s+.*)?$/);
    if (!result || !currentDate) continue;
    parsed += 1;
    const homeSource = result[1].trim();
    const target = targets.get(homeSource);
    if (!target) continue;
    addRecord({ date: currentDate, homeSource, awaySource: result[2].trim(), homeGoals: result[3], awayGoals: result[4], target });
  }
  if (parsed !== expectedTotal) throw new Error(`Expected ${expectedTotal} text matches, received ${parsed}.`);
}

const responses = Object.fromEntries(await Promise.all(Object.entries(urls).map(async ([key, url]) => {
  const response = await fetch(url, { headers: { 'user-agent': 'UEFA-home-profile-builder/1.0' } });
  if (!response.ok) throw new Error(`${key} source request failed: ${response.status}`);
  return [key, response];
})));
const [greece, turkey, belgium, norway, czech] = await Promise.all([
  responses.greece.json(),
  responses.turkey.json(),
  responses.belgium.json(),
  responses.norway.text(),
  responses.czech.text()
]);

for (const [key, source] of Object.entries({ greece, turkey, belgium })) {
  if (!Array.isArray(source.matches) || source.matches.length !== expectedLeagueSizes[key]) {
    throw new Error(`Expected ${expectedLeagueSizes[key]} ${key} matches, received ${source.matches?.length}.`);
  }
  for (const match of source.matches) {
    const target = targets.get(match.team1);
    if (!target) continue;
    const score = match.score?.ft;
    if (!Array.isArray(score) || score.length !== 2) throw new Error(`Missing FT score: ${match.date} ${match.team1} v ${match.team2}`);
    addRecord({ date: match.date, homeSource: match.team1, awaySource: match.team2, homeGoals: score[0], awayGoals: score[1], target });
  }
}

parseText(norway, expectedLeagueSizes.norway);
parseText(czech, expectedLeagueSizes.czech);
records.sort((left, right) => left.date.localeCompare(right.date) || left.homeSlug.localeCompare(right.homeSlug));

for (const [slug, expected] of Object.entries(expectedTargets)) {
  const actual = records.filter((record) => record.homeSlug === slug).length;
  if (actual !== expected) throw new Error(`Expected ${expected} ${slug} home matches, received ${actual}.`);
}
if (records.length !== 85) throw new Error(`Expected 85 Europa playoff home matches, received ${records.length}.`);
const keys = records.map((record) => [record.date, record.competition, record.homeSlug, record.awaySlug].join('|'));
if (new Set(keys).size !== records.length) throw new Error('Europa playoff batch contains duplicate matches.');

fs.writeFileSync('data/home-advantage-matches/crete-lillestrom-trabzonspor-truidense-viktoriaplzen-2024-25.json', `${JSON.stringify(records)}\n`);

const builderPath = 'scripts/build-home-advantage-profiles.mjs';
let builder = fs.readFileSync(builderPath, 'utf8');
const oldPriorities = `  const priorities = [\n    { competition: 'champions', stage: 'guaranteed' },\n    { competition: 'europa', stage: 'guaranteed' },\n    { competition: 'champions', stage: 'playoffs' }\n  ];`;
const newPriorities = `  const priorities = [\n    { competition: 'champions', stage: 'guaranteed' },\n    { competition: 'europa', stage: 'guaranteed' },\n    { competition: 'champions', stage: 'playoffs' },\n    { competition: 'europa', stage: 'playoffs' }\n  ];`;
if (!builder.includes(newPriorities)) {
  if (!builder.includes(oldPriorities)) throw new Error('Priority scope block changed unexpectedly.');
  builder = builder.replace(oldPriorities, newPriorities);
}
fs.writeFileSync(builderPath, builder);

const targetCoefficients = Object.fromEntries(Object.keys(expectedTargets).map((slug) => [slug, generatedCoefficients[slug]?.coefficient]));
console.log(JSON.stringify({ counts: expectedTargets, floors, targetCoefficients, stored: records.length }));
