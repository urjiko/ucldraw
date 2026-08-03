import fs from 'node:fs';
import vm from 'node:vm';

const urls = {
  italy: 'https://raw.githubusercontent.com/openfootball/football.json/master/2024-25/it.1.json',
  england: 'https://raw.githubusercontent.com/openfootball/football.json/master/2024-25/en.1.json',
  germany: 'https://raw.githubusercontent.com/openfootball/football.json/master/2024-25/de.1.json',
  spain: 'https://raw.githubusercontent.com/openfootball/football.json/master/2024-25/es.1.json',
  france: 'https://raw.githubusercontent.com/openfootball/football.json/master/2024-25/fr.1.json'
};

const expectedLeagueSizes = {
  italy: 380,
  england: 380,
  germany: 306,
  spain: 380,
  france: 306
};

const floors = Object.freeze({
  ITA: 19.989,
  ENG: 23.903,
  GER: 18.58,
  ESP: 19.409,
  FRA: 16.699
});

const targets = new Map([
  ['Atalanta BC', {
    slug: 'atalanta', country: 'ITA', name: 'Atalanta',
    competition: 'Italian Serie A 2024/25', sourceKey: 'openfootball-json-italy-2024-25'
  }],
  ['Brighton & Hove Albion FC', {
    slug: 'brighton', country: 'ENG', name: 'Brighton & Hove Albion',
    competition: 'English Premier League 2024/25', sourceKey: 'openfootball-json-england-2024-25'
  }],
  ['SC Freiburg', {
    slug: 'freiburg', country: 'GER', name: 'SC Freiburg',
    competition: 'German Bundesliga 2024/25', sourceKey: 'openfootball-json-germany-2024-25'
  }],
  ['Getafe CF', {
    slug: 'getafe', country: 'ESP', name: 'Getafe',
    competition: 'Spanish La Liga 2024/25', sourceKey: 'openfootball-json-spain-2024-25'
  }],
  ['AS Monaco FC', {
    slug: 'monaco', country: 'FRA', name: 'AS Monaco',
    competition: 'French Ligue 1 2024/25', sourceKey: 'openfootball-json-france-2024-25'
  }]
]);

const aliases = Object.freeze({
  'Atalanta BC': ['atalanta', 'Atalanta'],
  'AC Milan': ['milan', 'AC Milan'],
  'AS Roma': ['roma', 'AS Roma'],
  'Como 1907': ['como', 'Como'],
  'FC Internazionale Milano': ['inter', 'Internazionale'],
  'Juventus FC': ['juventus', 'Juventus'],
  'SSC Napoli': ['napoli', 'Napoli'],
  'AFC Bournemouth': ['bournemouth', 'AFC Bournemouth'],
  'Arsenal FC': ['arsenal', 'Arsenal'],
  'Aston Villa FC': ['astonvilla', 'Aston Villa'],
  'Brighton & Hove Albion FC': ['brighton', 'Brighton & Hove Albion'],
  'Crystal Palace FC': ['crystalpalace', 'Crystal Palace'],
  'Liverpool FC': ['liverpool', 'Liverpool'],
  'Manchester City FC': ['city', 'Manchester City'],
  'Manchester United FC': ['manu', 'Manchester United'],
  'Bayer 04 Leverkusen': ['bayerleverkusen', 'Bayer Leverkusen'],
  'Borussia Dortmund': ['bvb', 'Borussia Dortmund'],
  'FC Bayern München': ['bayern', 'Bayern München'],
  'RB Leipzig': ['leipzig', 'RB Leipzig'],
  'SC Freiburg': ['freiburg', 'SC Freiburg'],
  'TSG 1899 Hoffenheim': ['hoffenheim', 'Hoffenheim'],
  'VfB Stuttgart': ['stuttgart', 'VfB Stuttgart'],
  'Club Atlético de Madrid': ['atleti', 'Atlético Madrid'],
  'FC Barcelona': ['barcelona', 'FC Barcelona'],
  'Getafe CF': ['getafe', 'Getafe'],
  'RC Celta de Vigo': ['celtavigo', 'Celta Vigo'],
  'Real Betis Balompié': ['realbetis', 'Real Betis'],
  'Real Madrid CF': ['real', 'Real Madrid'],
  'Real Sociedad de Fútbol': ['realsociedad', 'Real Sociedad'],
  'Villarreal CF': ['villareal', 'Villarreal'],
  'AS Monaco FC': ['monaco', 'AS Monaco'],
  'Lille OSC': ['lille', 'Lille'],
  'Olympique de Marseille': ['marseille', 'Marseille'],
  'Paris Saint-Germain FC': ['psg', 'Paris Saint-Germain'],
  'Racing Club de Lens': ['lens', 'Lens'],
  'Stade Rennais FC 1901': ['rennais', 'Rennes']
});

function simpleSlug(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(?:fc|afc|cf|sc|ac|as|ss|ssc|tsg|vfb|rc|racing|club)\b/g, '')
    .replace(/[^a-z0-9]+/g, '') || 'unknown';
}

function loadCoefficientSnapshot() {
  const context = { window: {}, Object };
  vm.runInNewContext(fs.readFileSync('generated-club-coefficients.js', 'utf8'), context, {
    filename: 'generated-club-coefficients.js'
  });
  return context.window.UCLDRAW_CLUB_COEFFICIENTS.clubs;
}

function candidate(sourceName, country, forcedSlug = null, forcedName = null) {
  const configured = aliases[sourceName];
  return {
    slug: forcedSlug || configured?.[0] || simpleSlug(sourceName),
    name: forcedName || configured?.[1] || sourceName,
    country
  };
}

const responses = Object.fromEntries(await Promise.all(Object.entries(urls).map(async ([key, url]) => {
  const response = await fetch(url, { headers: { 'user-agent': 'UEFA-home-profile-builder/1.0' } });
  if (!response.ok) throw new Error(`${key} source request failed: ${response.status}`);
  return [key, await response.json()];
})));

for (const [key, source] of Object.entries(responses)) {
  if (!Array.isArray(source.matches) || source.matches.length !== expectedLeagueSizes[key]) {
    throw new Error(`Expected ${expectedLeagueSizes[key]} ${key} matches, received ${source.matches?.length}.`);
  }
}

const generatedCoefficients = loadCoefficientSnapshot();
const coefficientFor = (team) => Number.isFinite(Number(generatedCoefficients[team.slug]?.coefficient))
  ? Number(generatedCoefficients[team.slug].coefficient)
  : floors[team.country];

const records = [];
function addRecord({ date, homeSource, awaySource, homeGoals, awayGoals, target, sourceKey = null }) {
  const home = candidate(homeSource, target.country, target.slug, target.name);
  const away = candidate(awaySource, target.country);
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
    sourceKey: sourceKey || target.sourceKey
  });
}

for (const source of Object.values(responses)) {
  for (const match of source.matches) {
    const target = targets.get(match.team1);
    if (!target || !Array.isArray(match.score?.ft)) continue;
    addRecord({
      date: match.date,
      homeSource: match.team1,
      awaySource: match.team2,
      homeGoals: match.score.ft[0],
      awayGoals: match.score.ft[1],
      target
    });
  }
}

addRecord({
  date: '2025-05-25',
  homeSource: 'Atalanta BC',
  awaySource: 'Parma Calcio 1913',
  homeGoals: 2,
  awayGoals: 3,
  target: targets.get('Atalanta BC'),
  sourceKey: 'openfootball-italy-complete-2024-25'
});
addRecord({
  date: '2025-05-24',
  homeSource: 'Getafe CF',
  awaySource: 'RC Celta de Vigo',
  homeGoals: 1,
  awayGoals: 2,
  target: targets.get('Getafe CF'),
  sourceKey: 'transfermarkt-getafe-2024-25'
});

records.sort((left, right) => left.date.localeCompare(right.date) || left.homeSlug.localeCompare(right.homeSlug));

const expected = Object.freeze({ atalanta: 19, brighton: 19, freiburg: 17, getafe: 19, monaco: 17 });
for (const [slug, count] of Object.entries(expected)) {
  const actual = records.filter((record) => record.homeSlug === slug).length;
  if (actual !== count) throw new Error(`Expected ${count} ${slug} home matches, received ${actual}.`);
}
if (records.length !== 91) throw new Error(`Expected 91 Conference playoff home matches, received ${records.length}.`);

const keys = records.map((record) => [record.date, record.competition, record.homeSlug, record.awaySlug].join('|'));
if (new Set(keys).size !== records.length) throw new Error('Conference playoff batch contains duplicate matches.');

fs.writeFileSync(
  'data/home-advantage-matches/atalanta-brighton-freiburg-getafe-monaco-2024-25.json',
  `${JSON.stringify(records)}\n`
);

const builderPath = 'scripts/build-home-advantage-profiles.mjs';
let builder = fs.readFileSync(builderPath, 'utf8');
const oldPriorities = `  const priorities = [\n    { competition: 'champions', stage: 'guaranteed' },\n    { competition: 'europa', stage: 'guaranteed' },\n    { competition: 'champions', stage: 'playoffs' },\n    { competition: 'europa', stage: 'playoffs' }\n  ];`;
const newPriorities = `  const priorities = [\n    { competition: 'champions', stage: 'guaranteed' },\n    { competition: 'europa', stage: 'guaranteed' },\n    { competition: 'champions', stage: 'playoffs' },\n    { competition: 'europa', stage: 'playoffs' },\n    { competition: 'conference', stage: 'playoffs' }\n  ];`;
if (!builder.includes(newPriorities)) {
  if (!builder.includes(oldPriorities)) throw new Error('Priority scope block changed unexpectedly.');
  builder = builder.replace(oldPriorities, newPriorities);
}
fs.writeFileSync(builderPath, builder);

const targetCoefficients = Object.fromEntries(Object.keys(expected).map((slug) => [
  slug,
  generatedCoefficients[slug]?.coefficient
]));
console.log(JSON.stringify({ counts: expected, floors, targetCoefficients, stored: records.length }));
