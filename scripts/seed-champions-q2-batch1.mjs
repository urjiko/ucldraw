import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  SOURCE_URL,
  parseKassiesaRows,
  parseCatalog,
  normalize as normalizeClub
} from './update-uefa-coefficients.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataPath = path.join(root, 'data', 'home-advantage-matches', 'aarhus-ararat-celje-crvenazvezda-dinamo-2024-25.json');
const sourceDocPath = path.join(root, 'docs', 'home-advantage-sources', 'champions-q2-batch1-2024-25.md');
const modelDocPath = path.join(root, 'docs', 'home-advantage-model.md');
const builderPath = path.join(root, 'scripts', 'build-home-advantage-profiles.mjs');
const generatedPath = path.join(root, 'generated-home-advantage-profiles.js');
const coefficientsPath = path.join(root, 'generated-club-coefficients.js');
const catalogPath = path.join(root, 'team-pool-loader.js');
const testPath = path.join(root, 'tests', 'home-advantage-model.test.js');

const targets = Object.freeze([
  {
    slug: 'aarhus', sourceNames: ['Aarhus GF'], displayName: 'AGF Aarhus', country: 'DEN',
    competition: 'Danish Superliga 2024/25', sourceKey: 'openfootball-dk-2024-25',
    sourcePath: 'denmark/2024-25_dk1.txt', expectedHomeMatches: 16, declaredMatches: 193
  },
  {
    slug: 'ararat', sourceNames: ['FC Ararat-Armenia'], displayName: 'Ararat-Armenia', country: 'ARM',
    competition: 'Armenian Premier League 2024/25', sourceKey: 'openfootball-am-2024-25',
    sourcePath: 'armenia/2024-25_am1.txt', expectedHomeMatches: 15, declaredMatches: 165
  },
  {
    slug: 'celje', sourceNames: ['NK Celje'], displayName: 'NK Celje', country: 'SVN',
    competition: 'Slovenian First League 2024/25', sourceKey: 'openfootball-si-2024-25',
    sourcePath: 'slovenia/2024-25_si1.txt', expectedHomeMatches: 18, declaredMatches: 180
  },
  {
    slug: 'crvenazvezda', sourceNames: ['Crvena Zvezda'], displayName: 'Crvena Zvezda', country: 'SRB',
    competition: 'Serbian Super League 2024/25', sourceKey: 'openfootball-rs-2024-25',
    sourcePath: 'serbia/2024-25_rs1.txt', expectedHomeMatches: 19, declaredMatches: 296
  },
  {
    slug: 'dinamo', sourceNames: ['Dinamo Zagreb'], displayName: 'Dinamo Zagreb', country: 'CRO',
    competition: 'Croatian HNL 2024/25', sourceKey: 'openfootball-hr-2024-25',
    sourcePath: 'croatia/2024-25_hr1.txt', expectedHomeMatches: 18, declaredMatches: 180
  }
]);

const sourceAliases = Object.freeze({
  aarhus: ['Aarhus GF', 'AGF Aarhus'],
  ararat: ['FC Ararat-Armenia', 'Ararat-Armenia'],
  celje: ['NK Celje'],
  crvenazvezda: ['Crvena Zvezda', 'Red Star Belgrade'],
  dinamo: ['Dinamo Zagreb', 'GNK Dinamo Zagreb'],
  copenhagen: ['FC København', 'København'],
  nordsjaelland: ['FC Nordsjælland', 'Nordsjælland'],
  midtjylland: ['FC Midtjylland'],
  noah: ['FC Noah'],
  pyunik: ['Pyunik FC'],
  urartu: ['FC Urartu'],
  partizan: ['Partizan'],
  hajduksplit: ['Hajduk Split'],
  rijeka: ['HNK Rijeka']
});

const monthNumbers = Object.freeze({
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12
});

function requiredReplace(source, pattern, replacement, label) {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`Could not update ${label}.`);
  return next;
}

function slugify(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function tokenScore(first, second) {
  const left = new Set(normalizeClub(first).split(' ').filter(Boolean));
  const right = new Set(normalizeClub(second).split(' ').filter(Boolean));
  if (!left.size || !right.size) return 0;
  let common = 0;
  left.forEach((token) => { if (right.has(token)) common += 1; });
  return common / Math.max(left.size, right.size);
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; UEFAHomeProfileSeeder/1.0)',
      accept: 'text/plain,text/html;q=0.9,*/*;q=0.8'
    }
  });
  if (!response.ok) throw new Error(`${url} returned ${response.status}.`);
  return response.text();
}

function isoDate(year, monthName, day) {
  const month = monthNumbers[monthName];
  if (!month) throw new Error(`Unknown month ${monthName}.`);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseFootballText(text, target) {
  const sourceNames = new Set(target.sourceNames.map((name) => normalizeClub(name)));
  let currentYear = 2024;
  let currentDate = null;
  const records = [];
  const datePattern = /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+([A-Z][a-z]{2})\s+(\d{1,2})(?:\s+(\d{4}))?$/;

  for (const rawLine of String(text).split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const dateMatch = line.match(datePattern);
    if (dateMatch) {
      if (dateMatch[3]) currentYear = Number(dateMatch[3]);
      currentDate = isoDate(currentYear, dateMatch[1], Number(dateMatch[2]));
      continue;
    }

    if (!currentDate || /\[(?:awarded|cancelled|abandoned)\]/i.test(line)) continue;
    const withoutTime = line.replace(/^\d{1,2}:\d{2}\s+/, '');
    const match = withoutTime.match(/^(.+?)\s+v\s+(.+?)\s+(\d+)-(\d+)(?:\s+\([^)]*\))?\s*$/);
    if (!match) continue;

    const homeName = match[1].trim();
    if (!sourceNames.has(normalizeClub(homeName))) continue;
    records.push({
      date: currentDate,
      awayName: match[2].trim(),
      homeGoals: Number(match[3]),
      awayGoals: Number(match[4])
    });
  }

  records.sort((first, second) => first.date.localeCompare(second.date) || first.awayName.localeCompare(second.awayName));
  if (records.length !== target.expectedHomeMatches) {
    throw new Error(`${target.displayName}: expected ${target.expectedHomeMatches} home matches, parsed ${records.length}.`);
  }
  return records;
}

function loadWindowObject(file, property) {
  const context = { window: {}, Object };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), context, { filename: path.basename(file) });
  return context.window[property];
}

function buildClubMatcher(catalog, coefficientData) {
  const candidates = Object.entries(coefficientData.clubs).map(([slug, club]) => {
    const names = new Set([
      catalog[slug]?.name,
      String(club.officialName || '').replace(/\s+\(association floor\)$/i, ''),
      ...(sourceAliases[slug] || [])
    ].filter(Boolean));
    return { slug, club, names: [...names] };
  });

  return (sourceName, country) => {
    const sameCountry = candidates.filter((candidate) => candidate.club.country === country);
    const normalizedSource = normalizeClub(sourceName);
    const exact = sameCountry.find((candidate) => candidate.names.some((name) => normalizeClub(name) === normalizedSource));
    if (exact) return exact;

    const ranked = sameCountry
      .map((candidate) => ({
        candidate,
        score: Math.max(...candidate.names.map((name) => tokenScore(sourceName, name)))
      }))
      .sort((first, second) => second.score - first.score || first.candidate.slug.localeCompare(second.candidate.slug));
    if (ranked[0]?.score >= 0.8 && (!ranked[1] || ranked[0].score > ranked[1].score)) return ranked[0].candidate;
    return null;
  };
}

function loadGeneratedProfiles() {
  return loadWindowObject(generatedPath, 'UCLDRAW_HOME_ADVANTAGE_PROFILES');
}

function jsArray(values) {
  return `[${values.map((value) => `'${value}'`).join(', ')}]`;
}

async function main() {
  const coefficientData = loadWindowObject(coefficientsPath, 'UCLDRAW_CLUB_COEFFICIENTS');
  const catalog = parseCatalog(fs.readFileSync(catalogPath, 'utf8'));
  const matchClub = buildClubMatcher(catalog, coefficientData);

  const rankingHtml = await fetchText(SOURCE_URL);
  const rankingRows = parseKassiesaRows(rankingHtml);
  if (rankingRows.length < 300) throw new Error(`Only ${rankingRows.length} UEFA coefficient rows parsed.`);
  const associationFloors = new Map();
  for (const row of rankingRows) {
    if (!Number.isFinite(row.countryPart)) continue;
    associationFloors.set(row.country, Math.max(associationFloors.get(row.country) || 0, row.countryPart));
  }

  const normalizedRecords = [];
  const coverage = [];
  for (const target of targets) {
    const sourceUrl = `https://raw.githubusercontent.com/openfootball/europe/master/${target.sourcePath}`;
    const sourceText = await fetchText(sourceUrl);
    const declared = Number(sourceText.match(/^# Matches\s+(\d+)/m)?.[1]);
    if (declared !== target.declaredMatches) {
      throw new Error(`${target.sourcePath}: expected ${target.declaredMatches} declared matches, found ${declared}.`);
    }
    const targetClub = coefficientData.clubs[target.slug];
    if (!targetClub || targetClub.country !== target.country) throw new Error(`Missing target coefficient for ${target.slug}.`);
    const floor = associationFloors.get(target.country);
    if (!Number.isFinite(floor) || floor <= 0) throw new Error(`Missing ${target.country} association floor.`);

    const parsed = parseFootballText(sourceText, target);
    for (const match of parsed) {
      const awayClub = matchClub(match.awayName, target.country);
      normalizedRecords.push({
        date: match.date,
        competitionType: 'domestic',
        competition: target.competition,
        homeSlug: target.slug,
        homeName: target.displayName,
        homeCountry: target.country,
        awaySlug: awayClub?.slug || slugify(match.awayName),
        awayName: match.awayName,
        awayCountry: target.country,
        homeCoefficient: targetClub.coefficient,
        awayCoefficient: awayClub?.club.coefficient || floor,
        homePot: 1,
        awayPot: 1,
        potCount: 1,
        homeGoals: match.homeGoals,
        awayGoals: match.awayGoals,
        sourceKey: target.sourceKey
      });
    }
    coverage.push({ ...target, floor, parsed: parsed.length });
  }

  normalizedRecords.sort((first, second) =>
    first.date.localeCompare(second.date)
    || first.homeSlug.localeCompare(second.homeSlug)
    || first.awaySlug.localeCompare(second.awaySlug)
  );
  const unique = new Set(normalizedRecords.map((match) => [match.date, match.competitionType, match.competition, match.homeSlug, match.awaySlug].join('|')));
  if (unique.size !== normalizedRecords.length) throw new Error('Generated Q2 batch contains duplicate match keys.');
  if (normalizedRecords.length !== 86) throw new Error(`Expected 86 normalized records, created ${normalizedRecords.length}.`);
  fs.writeFileSync(dataPath, `${JSON.stringify(normalizedRecords)}\n`);

  let builder = fs.readFileSync(builderPath, 'utf8');
  builder = requiredReplace(
    builder,
    "    { competition: 'champions', stage: 'q3' }\n",
    "    { competition: 'champions', stage: 'q3' },\n    { competition: 'champions', stage: 'q2' }\n",
    'Champions Q2 priority scope'
  );
  fs.writeFileSync(builderPath, builder);

  const sourceRows = coverage.map((entry) =>
    `| ${entry.displayName} | ${entry.competition} | ${entry.parsed} | ${entry.declaredMatches} | ${entry.floor.toFixed(3)} |`
  ).join('\n');
  const tick = '`';
  const sourceDoc = `# Champions League Q2 domestic home data, batch 1 (2024/25)\n\n`
    + `This batch opens the ${tick}champions.q2${tick} priority scope and adds complete domestic home seasons for its first five clubs. `
    + `Fenerbahçe already has a stored domestic profile and becomes active automatically when the Q2 group enters scope.\n\n`
    + `## Coverage\n\n| Club | Competition | Home matches | Source matches | Association floor |\n|---|---|---:|---:|---:|\n${sourceRows}\n\n`
    + `The ${normalizedRecords.length} normalized records are stored in ${tick}${path.relative(root, dataPath).replaceAll(path.sep, '/')}${tick}. `
    + `Awarded results are excluded because the model requires a played score.\n\n`
    + `## Sources and validation\n\n`
    + coverage.map((entry) => `- ${entry.displayName}: OpenFootball Europe, ${tick}${entry.sourcePath}${tick}, ${entry.declaredMatches} declared matches.`).join('\n')
    + `\n\nTarget clubs and any matched project opponents use the pinned 2026 UEFA coefficient snapshot. `
    + `Other domestic opponents use the corresponding association floor shown above. Historical pot fields remain neutral at ${tick}1${tick}.\n`;
  fs.writeFileSync(sourceDocPath, sourceDoc);

  let modelDoc = fs.readFileSync(modelDocPath, 'utf8');
  const marker = '<!-- champions-q2-batch1 -->';
  if (!modelDoc.includes(marker)) {
    modelDoc += `\n\n${marker}\n## Active-scope extension: Champions Q2 batch 1\n\n`
      + `The active priority order now continues from ${tick}champions.q3${tick} into ${tick}champions.q2${tick}. `
      + `The first Q2 data batch covers AGF Aarhus, Ararat-Armenia, NK Celje, Crvena Zvezda, and Dinamo Zagreb. `
      + `Fenerbahçe's previously stored profile is also reactivated; remaining Q2 clubs stay on the research queue and retain neutral fallback until sourced.\n`;
    fs.writeFileSync(modelDocPath, modelDoc);
  }

  execFileSync(process.execPath, [builderPath], { cwd: root, stdio: 'inherit' });
  const generated = loadGeneratedProfiles();
  const q2Priority = generated.scope.priority.at(-1);
  if (q2Priority?.competition !== 'champions' || q2Priority.stage !== 'q2') throw new Error('Generated scope did not append champions.q2.');

  let test = fs.readFileSync(testPath, 'utf8');
  const summary = generated.sourceSummary;
  test = test
    .replace(/assert\.equal\(records\.length, \d+, 'Stored source archive must contain \d+ home matches\.'\);/, `assert.equal(records.length, ${summary.storedMatches}, 'Stored source archive must contain ${summary.storedMatches} home matches.');`)
    .replace(/assert\.equal\(records\.filter\(\(match\) => match\.competitionType === 'domestic'\)\.length, \d+\);/, `assert.equal(records.filter((match) => match.competitionType === 'domestic').length, ${normalizedRecords.length + 1237});`)
    .replace(/assert\.equal\(generated\.sourceSummary\.storedMatches, \d+\);/, `assert.equal(generated.sourceSummary.storedMatches, ${summary.storedMatches});`)
    .replace(/assert\.equal\(generated\.sourceSummary\.matches, \d+\);/, `assert.equal(generated.sourceSummary.matches, ${summary.matches});`)
    .replace(/assert\.equal\(generated\.sourceSummary\.excludedStoredMatches, \d+\);/, `assert.equal(generated.sourceSummary.excludedStoredMatches, ${summary.excludedStoredMatches});`)
    .replace(/assert\.equal\(generated\.sourceSummary\.teams, \d+\);/, `assert.equal(generated.sourceSummary.teams, ${summary.teams});`)
    .replace(/assert\.equal\(generated\.sourceSummary\.activeTeamScope, \d+\);/, `assert.equal(generated.sourceSummary.activeTeamScope, ${summary.activeTeamScope});`)
    .replace(/assert\.equal\(generated\.sourceSummary\.domesticMatches, \d+\);/, `assert.equal(generated.sourceSummary.domesticMatches, ${summary.domesticMatches});`)
    .replace(/assert\.equal\(generated\.sourceSummary\.latestIncludedMatchDate, '[^']+'\);/, `assert.equal(generated.sourceSummary.latestIncludedMatchDate, '${summary.latestIncludedMatchDate}');`)
    .replace(/assert\.equal\(generated\.scope\.teams\.length, \d+\);/, `assert.equal(generated.scope.teams.length, ${generated.scope.teams.length});`)
    .replace(/assert\.equal\(new Set\(generated\.scope\.teams\)\.size, \d+\);/, `assert.equal(new Set(generated.scope.teams).size, ${generated.scope.teams.length});`);

  test = requiredReplace(
    test,
    "assert.match(builderSource, /competition: 'champions', stage: 'q3'/);",
    "assert.match(builderSource, /competition: 'champions', stage: 'q3'/);\nassert.match(builderSource, /competition: 'champions', stage: 'q2'/);",
    'builder Q2 assertion'
  );
  test = requiredReplace(
    test,
    "assert.equal(records.filter((match) => match.homeSlug === 'union').length, 20);",
    "assert.equal(records.filter((match) => match.homeSlug === 'union').length, 20);\n"
      + targets.map((target) => `assert.equal(records.filter((match) => match.homeSlug === '${target.slug}').length, ${target.expectedHomeMatches});`).join('\n'),
    'Q2 source-count assertions'
  );

  const q3Needle = "assert.deepEqual(Array.from(generated.scope.priority[5].teams), ['bodo', 'lyon', 'nec', 'olympiacos', 'spartapraha', 'union']);";
  test = requiredReplace(
    test,
    q3Needle,
    `${q3Needle}\nassert.equal(generated.scope.priority[6].competition, 'champions');\nassert.equal(generated.scope.priority[6].stage, 'q2');\nassert.deepEqual(Array.from(generated.scope.priority[6].teams), ${jsArray(q2Priority.teams)});`,
    'Q2 generated priority assertions'
  );

  const queueLiteral = jsArray(generated.researchQueue);
  test = test
    .replace(/assert\.deepEqual\(Array\.from\(generated\.researchQueue\), \[\]\);/g, `assert.deepEqual(Array.from(generated.researchQueue), ${queueLiteral});`)
    .replace(/assert\.equal\(generated\.researchQueue\.length, 0\);/g, `assert.equal(generated.researchQueue.length, ${generated.researchQueue.length});`);

  const activeProfiles = [...targets.map((target) => target.slug), 'fenerbahce'];
  const profileAssertions = activeProfiles.map((slug) => {
    const profile = generated.profiles[slug];
    if (!profile) throw new Error(`Generated profile missing for ${slug}.`);
    return [
      `assert.ok(generated.profiles.${slug});`,
      `assert.equal(generated.profiles.${slug}.samples.overall.raw, ${profile.samples.overall.raw});`,
      `assert.equal(generated.profiles.${slug}.attack.domestic, ${profile.attack.domestic});`,
      `assert.equal(generated.profiles.${slug}.defense.domestic, ${profile.defense.domestic});`
    ].join('\n');
  }).join('\n');
  test = requiredReplace(
    test,
    "assert.equal(generated.profiles.fenerbahce, undefined);",
    profileAssertions,
    'new active-profile assertions'
  );
  fs.writeFileSync(testPath, test);

  execFileSync(process.execPath, [testPath], { cwd: root, stdio: 'inherit' });
  console.log(`Prepared Champions Q2 batch 1: ${normalizedRecords.length} records, ${summary.teams}/${summary.activeTeamScope} active profiles, ${generated.researchQueue.length} queued.`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
