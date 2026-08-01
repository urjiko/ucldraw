import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const legacyInputPath = path.join(root, 'data', 'home-advantage-matches.json');
const inputDirectory = path.join(root, 'data', 'home-advantage-matches');
const poolManifestPath = path.join(root, 'generated-team-pools.js');
const outputPath = path.join(root, 'generated-home-advantage-profiles.js');

const methodology = Object.freeze({
  recencyHalfLifeYears: 3,
  overallPriorMatches: 18,
  contextPriorMatches: 12,
  opponentStrengthThreshold: 0.55,
  minimumAssociationSample: 6,
  attackBounds: Object.freeze([0.84, 1.18]),
  defenseBounds: Object.freeze([0.82, 1.16])
});

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function matchLabel(index, sourceFile) {
  return `${sourceFile} match ${index + 1}`;
}

function finiteNumber(value, field, index, sourceFile) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`${matchLabel(index, sourceFile)}: ${field} must be numeric.`);
  return number;
}

function integer(value, field, index, sourceFile, minimum = 0) {
  const number = finiteNumber(value, field, index, sourceFile);
  if (!Number.isInteger(number) || number < minimum) {
    throw new Error(`${matchLabel(index, sourceFile)}: ${field} must be an integer >= ${minimum}.`);
  }
  return number;
}

function requiredText(value, field, index, sourceFile) {
  const text = String(value || '').trim();
  if (!text) throw new Error(`${matchLabel(index, sourceFile)}: ${field} is required.`);
  return text;
}

function strength(coefficient, pot, potCount) {
  return Math.log2(Math.max(0, coefficient) + 8)
    + (Math.max(1, potCount) - Math.max(1, pot)) * 0.16;
}

function baselineExpectedGoals(match) {
  const difference = strength(match.homeCoefficient, match.homePot, match.potCount)
    - strength(match.awayCoefficient, match.awayPot, match.potCount);
  return {
    home: clamp(1.48 + difference * 0.28, 0.25, 3.45),
    away: clamp(1.02 - difference * 0.24, 0.2, 3.1),
    difference
  };
}

function opponentBand(difference) {
  if (difference < -methodology.opponentStrengthThreshold) return 'vsStronger';
  if (difference > methodology.opponentStrengthThreshold) return 'vsWeaker';
  return 'vsSimilar';
}

function normalizeMatch(raw, index, sourceFile) {
  const date = requiredText(raw.date, 'date', index, sourceFile);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    throw new Error(`${matchLabel(index, sourceFile)}: date must use YYYY-MM-DD.`);
  }
  const competitionType = requiredText(raw.competitionType, 'competitionType', index, sourceFile);
  if (!['domestic', 'europe'].includes(competitionType)) {
    throw new Error(`${matchLabel(index, sourceFile)}: competitionType must be domestic or europe.`);
  }
  return {
    date,
    competitionType,
    competition: String(raw.competition || '').trim() || null,
    homeSlug: requiredText(raw.homeSlug, 'homeSlug', index, sourceFile),
    homeName: String(raw.homeName || raw.homeSlug).trim(),
    homeCountry: requiredText(raw.homeCountry, 'homeCountry', index, sourceFile).toUpperCase(),
    awaySlug: requiredText(raw.awaySlug, 'awaySlug', index, sourceFile),
    awayName: String(raw.awayName || raw.awaySlug).trim(),
    awayCountry: requiredText(raw.awayCountry, 'awayCountry', index, sourceFile).toUpperCase(),
    homeCoefficient: finiteNumber(raw.homeCoefficient, 'homeCoefficient', index, sourceFile),
    awayCoefficient: finiteNumber(raw.awayCoefficient, 'awayCoefficient', index, sourceFile),
    homePot: integer(raw.homePot, 'homePot', index, sourceFile, 1),
    awayPot: integer(raw.awayPot, 'awayPot', index, sourceFile, 1),
    potCount: integer(raw.potCount, 'potCount', index, sourceFile, 1),
    homeGoals: integer(raw.homeGoals, 'homeGoals', index, sourceFile),
    awayGoals: integer(raw.awayGoals, 'awayGoals', index, sourceFile),
    sourceFile
  };
}

function inputFiles() {
  const files = [];
  if (fs.existsSync(legacyInputPath)) files.push(legacyInputPath);
  if (fs.existsSync(inputDirectory)) {
    files.push(...fs.readdirSync(inputDirectory)
      .filter((name) => name.endsWith('.json'))
      .sort((first, second) => first.localeCompare(second))
      .map((name) => path.join(inputDirectory, name)));
  }
  return files;
}

function loadMatches() {
  const files = inputFiles();
  const matches = [];
  const seen = new Map();

  for (const file of files) {
    const sourceFile = path.relative(root, file).replaceAll(path.sep, '/');
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!Array.isArray(raw)) throw new Error(`${sourceFile} must contain an array.`);

    raw.forEach((entry, index) => {
      const match = normalizeMatch(entry, index, sourceFile);
      const duplicateKey = [
        match.date,
        match.competitionType,
        match.competition || '',
        match.homeSlug,
        match.awaySlug
      ].join('|');
      if (seen.has(duplicateKey)) {
        throw new Error(`Duplicate home-advantage match ${duplicateKey} in ${sourceFile}; already defined in ${seen.get(duplicateKey)}.`);
      }
      seen.set(duplicateKey, sourceFile);
      matches.push(match);
    });
  }

  return { files, matches };
}

function loadChampionsScope() {
  const context = { window: {}, Object };
  vm.runInNewContext(fs.readFileSync(poolManifestPath, 'utf8'), context, {
    filename: path.basename(poolManifestPath)
  });
  const champions = context.window.UCLDRAW_POOL_MANIFEST?.champions;
  if (!champions || typeof champions !== 'object') {
    throw new Error('generated-team-pools.js does not expose a champions pool.');
  }

  const stages = {};
  const teams = [];
  for (const [stage, filenames] of Object.entries(champions)) {
    if (!Array.isArray(filenames)) throw new Error(`Champions pool stage ${stage} must be an array.`);
    stages[stage] = filenames.map((filename) => path.basename(String(filename), '.png'));
    teams.push(...stages[stage]);
  }

  const uniqueTeams = [...new Set(teams)];
  if (uniqueTeams.length !== teams.length) {
    throw new Error('Champions pool contains a duplicate team slug across stages.');
  }
  return {
    competition: 'champions',
    source: 'generated-team-pools.js',
    stages,
    teams: uniqueTeams,
    teamSet: new Set(uniqueTeams)
  };
}

function yearsBetween(firstDate, secondDate) {
  return Math.max(0, (Date.parse(`${secondDate}T00:00:00Z`) - Date.parse(`${firstDate}T00:00:00Z`))
    / (365.25 * 24 * 60 * 60 * 1000));
}

function recencyWeight(date, latestDate) {
  return 0.5 ** (yearsBetween(date, latestDate) / methodology.recencyHalfLifeYears);
}

function emptyBucket() {
  return { weightedActual: 0, weightedExpected: 0, effectiveSample: 0, rawMatches: 0 };
}

function addObservation(bucket, actual, expected, weight) {
  bucket.weightedActual += actual * weight;
  bucket.weightedExpected += expected * weight;
  bucket.effectiveSample += weight;
  bucket.rawMatches += 1;
}

function summary(bucket, priorMatches, bounds) {
  if (!bucket || bucket.weightedExpected <= 0 || bucket.rawMatches === 0) {
    return { multiplier: 1, confidence: 0, samples: 0, effectiveSample: 0 };
  }
  const rawMultiplier = bucket.weightedActual / bucket.weightedExpected;
  const confidence = bucket.effectiveSample / (bucket.effectiveSample + priorMatches);
  return {
    multiplier: Number(clamp(1 + (rawMultiplier - 1) * confidence, bounds[0], bounds[1]).toFixed(4)),
    confidence: Number(confidence.toFixed(4)),
    samples: bucket.rawMatches,
    effectiveSample: Number(bucket.effectiveSample.toFixed(2))
  };
}

function createAccumulator(team) {
  return {
    team,
    attack: {
      overall: emptyBucket(), domestic: emptyBucket(), europe: emptyBucket(),
      vsStronger: emptyBucket(), vsSimilar: emptyBucket(), vsWeaker: emptyBucket()
    },
    defense: {
      overall: emptyBucket(), domestic: emptyBucket(), europe: emptyBucket(),
      vsStronger: emptyBucket(), vsSimilar: emptyBucket(), vsWeaker: emptyBucket()
    },
    associations: new Map()
  };
}

function associationAccumulator(accumulator, country) {
  if (!accumulator.associations.has(country)) {
    accumulator.associations.set(country, { attack: emptyBucket(), defense: emptyBucket() });
  }
  return accumulator.associations.get(country);
}

function serializeMetric(metricBuckets, bounds) {
  const values = {};
  const confidence = {};
  const samples = {};
  for (const [key, bucket] of Object.entries(metricBuckets)) {
    const prior = key === 'overall' ? methodology.overallPriorMatches : methodology.contextPriorMatches;
    const result = summary(bucket, prior, bounds);
    values[key] = result.multiplier;
    confidence[key] = result.confidence;
    samples[key] = Object.freeze({ raw: result.samples, effective: result.effectiveSample });
  }
  return { values, confidence, samples };
}

function buildProfiles(matches, latestDate) {
  if (!matches.length) return {};
  const recencyAnchor = latestDate || matches.reduce(
    (latest, match) => match.date > latest ? match.date : latest,
    matches[0].date
  );
  const accumulators = new Map();

  for (const match of matches) {
    if (!accumulators.has(match.homeSlug)) {
      accumulators.set(match.homeSlug, createAccumulator({
        slug: match.homeSlug,
        name: match.homeName,
        country: match.homeCountry
      }));
    }
    const accumulator = accumulators.get(match.homeSlug);
    const baseline = baselineExpectedGoals(match);
    const band = opponentBand(baseline.difference);
    const weight = recencyWeight(match.date, recencyAnchor);

    for (const key of ['overall', match.competitionType, band]) {
      addObservation(accumulator.attack[key], match.homeGoals, baseline.home, weight);
      addObservation(accumulator.defense[key], match.awayGoals, baseline.away, weight);
    }

    const association = associationAccumulator(accumulator, match.awayCountry);
    addObservation(association.attack, match.homeGoals, baseline.home, weight);
    addObservation(association.defense, match.awayGoals, baseline.away, weight);
  }

  const profiles = {};
  for (const [slug, accumulator] of [...accumulators.entries()].sort(([first], [second]) => first.localeCompare(second))) {
    const attack = serializeMetric(accumulator.attack, methodology.attackBounds);
    const defense = serializeMetric(accumulator.defense, methodology.defenseBounds);
    const associationMatchups = {};

    for (const [country, buckets] of [...accumulator.associations.entries()].sort(([first], [second]) => first.localeCompare(second))) {
      if (buckets.attack.rawMatches < methodology.minimumAssociationSample) continue;
      const attackResult = summary(buckets.attack, methodology.contextPriorMatches, methodology.attackBounds);
      const defenseResult = summary(buckets.defense, methodology.contextPriorMatches, methodology.defenseBounds);
      associationMatchups[country] = {
        attack: attackResult.multiplier,
        defense: defenseResult.multiplier,
        confidence: Math.min(attackResult.confidence, defenseResult.confidence),
        samples: attackResult.samples,
        effectiveSample: Math.min(attackResult.effectiveSample, defenseResult.effectiveSample)
      };
    }

    profiles[slug] = {
      name: accumulator.team.name,
      country: accumulator.team.country,
      attack: attack.values,
      defense: defense.values,
      confidence: attack.confidence,
      defenseConfidence: defense.confidence,
      samples: attack.samples,
      associationMatchups
    };
  }
  return profiles;
}

function latestMatchDate(matches) {
  return matches.length
    ? matches.reduce((latest, match) => match.date > latest ? match.date : latest, matches[0].date)
    : null;
}

function generatedSource(storedMatches, scopedMatches, profiles, files, scope, recencyAnchor) {
  const sourceSummary = {
    storedMatches: storedMatches.length,
    matches: scopedMatches.length,
    excludedStoredMatches: storedMatches.length - scopedMatches.length,
    teams: Object.keys(profiles).length,
    activeTeamScope: scope.teams.length,
    domesticMatches: scopedMatches.filter((match) => match.competitionType === 'domestic').length,
    europeanMatches: scopedMatches.filter((match) => match.competitionType === 'europe').length,
    latestIncludedMatchDate: latestMatchDate(scopedMatches),
    files: files.map((file) => path.relative(root, file).replaceAll(path.sep, '/'))
  };
  const serializableScope = {
    competition: scope.competition,
    source: scope.source,
    stages: scope.stages,
    teams: scope.teams
  };
  const payload = {
    version: 1,
    generatedAt: recencyAnchor ? `${recencyAnchor}T00:00:00.000Z` : null,
    latestMatchDate: recencyAnchor,
    sourceSummary,
    methodology,
    scope: serializableScope,
    researchQueue: scope.teams.filter((slug) => !profiles[slug]),
    profiles
  };
  return `// Generated by scripts/build-home-advantage-profiles.mjs.\n// Do not hand-edit multipliers. Add normalized match records under data/home-advantage-matches*.\n(() => {\n  'use strict';\n  window.UCLDRAW_HOME_ADVANTAGE_PROFILES = Object.freeze(${JSON.stringify(payload, null, 2)});\n})();\n`;
}

const { files, matches: storedMatches } = loadMatches();
const scope = loadChampionsScope();
const recencyAnchor = latestMatchDate(storedMatches);
const scopedMatches = storedMatches.filter((match) => scope.teamSet.has(match.homeSlug));
const profiles = buildProfiles(scopedMatches, recencyAnchor);
fs.writeFileSync(outputPath, generatedSource(storedMatches, scopedMatches, profiles, files, scope, recencyAnchor));
console.log(
  `Generated ${path.relative(root, outputPath)} from ${scopedMatches.length}/${storedMatches.length} stored matches `
  + `for ${Object.keys(profiles).length}/${scope.teams.length} current Champions League teams.`
);
