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

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const label = (index, sourceFile) => `${sourceFile} match ${index + 1}`;

function numberField(value, field, index, sourceFile) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`${label(index, sourceFile)}: ${field} must be numeric.`);
  return number;
}

function integerField(value, field, index, sourceFile, minimum = 0) {
  const number = numberField(value, field, index, sourceFile);
  if (!Number.isInteger(number) || number < minimum) {
    throw new Error(`${label(index, sourceFile)}: ${field} must be an integer >= ${minimum}.`);
  }
  return number;
}

function textField(value, field, index, sourceFile) {
  const text = String(value || '').trim();
  if (!text) throw new Error(`${label(index, sourceFile)}: ${field} is required.`);
  return text;
}

function normalizeMatch(raw, index, sourceFile) {
  const date = textField(raw.date, 'date', index, sourceFile);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    throw new Error(`${label(index, sourceFile)}: date must use YYYY-MM-DD.`);
  }
  const competitionType = textField(raw.competitionType, 'competitionType', index, sourceFile);
  if (!['domestic', 'europe'].includes(competitionType)) {
    throw new Error(`${label(index, sourceFile)}: competitionType must be domestic or europe.`);
  }
  return {
    date,
    competitionType,
    competition: String(raw.competition || '').trim() || null,
    homeSlug: textField(raw.homeSlug, 'homeSlug', index, sourceFile),
    homeName: String(raw.homeName || raw.homeSlug).trim(),
    homeCountry: textField(raw.homeCountry, 'homeCountry', index, sourceFile).toUpperCase(),
    awaySlug: textField(raw.awaySlug, 'awaySlug', index, sourceFile),
    awayName: String(raw.awayName || raw.awaySlug).trim(),
    awayCountry: textField(raw.awayCountry, 'awayCountry', index, sourceFile).toUpperCase(),
    homeCoefficient: numberField(raw.homeCoefficient, 'homeCoefficient', index, sourceFile),
    awayCoefficient: numberField(raw.awayCoefficient, 'awayCoefficient', index, sourceFile),
    homePot: integerField(raw.homePot, 'homePot', index, sourceFile, 1),
    awayPot: integerField(raw.awayPot, 'awayPot', index, sourceFile, 1),
    potCount: integerField(raw.potCount, 'potCount', index, sourceFile, 1),
    homeGoals: integerField(raw.homeGoals, 'homeGoals', index, sourceFile),
    awayGoals: integerField(raw.awayGoals, 'awayGoals', index, sourceFile),
    sourceFile
  };
}

function inputFiles() {
  const files = fs.existsSync(legacyInputPath) ? [legacyInputPath] : [];
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
      const key = [match.date, match.competitionType, match.competition || '', match.homeSlug, match.awaySlug].join('|');
      if (seen.has(key)) {
        throw new Error(`Duplicate home-advantage match ${key} in ${sourceFile}; already defined in ${seen.get(key)}.`);
      }
      seen.set(key, sourceFile);
      matches.push(match);
    });
  }
  return { files, matches };
}

function loadPriorityScope() {
  const context = { window: {}, Object };
  vm.runInNewContext(fs.readFileSync(poolManifestPath, 'utf8'), context, {
    filename: path.basename(poolManifestPath)
  });
  const manifest = context.window.UCLDRAW_POOL_MANIFEST;
  const priorities = [
    { competition: 'champions', stage: 'guaranteed' },
    { competition: 'europa', stage: 'guaranteed' },
    { competition: 'champions', stage: 'playoffs' },
    { competition: 'europa', stage: 'playoffs' },
    { competition: 'conference', stage: 'playoffs' },
    { competition: 'champions', stage: 'q3' },
    { competition: 'champions', stage: 'q2' }
  ];
  const priority = priorities.map(({ competition, stage }) => {
    const filenames = manifest?.[competition]?.[stage];
    if (!Array.isArray(filenames)) {
      throw new Error(`Pool manifest does not expose ${competition}.${stage}.`);
    }
    return {
      competition,
      stage,
      teams: filenames.map((filename) => path.basename(String(filename), '.png'))
    };
  });
  const teams = priority.flatMap((group) => group.teams);
  if (new Set(teams).size !== teams.length) {
    throw new Error('Active home-advantage scope contains a duplicate team slug.');
  }
  return {
    source: 'generated-team-pools.js',
    priority,
    teams,
    teamSet: new Set(teams)
  };
}

function strength(coefficient, pot, potCount) {
  return Math.log2(Math.max(0, coefficient) + 8)
    + (Math.max(1, potCount) - Math.max(1, pot)) * 0.16;
}

function expectedGoals(match) {
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

function latestMatchDate(matches) {
  return matches.length
    ? matches.reduce((latest, match) => match.date > latest ? match.date : latest, matches[0].date)
    : null;
}

function weight(date, anchor) {
  const milliseconds = Date.parse(`${anchor}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`);
  const years = Math.max(0, milliseconds / (365.25 * 24 * 60 * 60 * 1000));
  return 0.5 ** (years / methodology.recencyHalfLifeYears);
}

const emptyBucket = () => ({ weightedActual: 0, weightedExpected: 0, effectiveSample: 0, rawMatches: 0 });

function observe(bucket, actual, expected, observationWeight) {
  bucket.weightedActual += actual * observationWeight;
  bucket.weightedExpected += expected * observationWeight;
  bucket.effectiveSample += observationWeight;
  bucket.rawMatches += 1;
}

function summarize(bucket, priorMatches, bounds) {
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
  const metric = () => ({
    overall: emptyBucket(),
    domestic: emptyBucket(),
    europe: emptyBucket(),
    vsStronger: emptyBucket(),
    vsSimilar: emptyBucket(),
    vsWeaker: emptyBucket()
  });
  return { team, attack: metric(), defense: metric(), associations: new Map() };
}

function serializeMetric(buckets, bounds) {
  const values = {};
  const confidence = {};
  const samples = {};
  for (const [key, bucket] of Object.entries(buckets)) {
    const prior = key === 'overall' ? methodology.overallPriorMatches : methodology.contextPriorMatches;
    const result = summarize(bucket, prior, bounds);
    values[key] = result.multiplier;
    confidence[key] = result.confidence;
    samples[key] = Object.freeze({ raw: result.samples, effective: result.effectiveSample });
  }
  return { values, confidence, samples };
}

function buildProfiles(matches, anchor) {
  const accumulators = new Map();
  for (const match of matches) {
    if (!accumulators.has(match.homeSlug)) {
      accumulators.set(match.homeSlug, createAccumulator({
        name: match.homeName,
        country: match.homeCountry
      }));
    }
    const accumulator = accumulators.get(match.homeSlug);
    const baseline = expectedGoals(match);
    const band = opponentBand(baseline.difference);
    const observationWeight = weight(match.date, anchor);
    for (const key of ['overall', match.competitionType, band]) {
      observe(accumulator.attack[key], match.homeGoals, baseline.home, observationWeight);
      observe(accumulator.defense[key], match.awayGoals, baseline.away, observationWeight);
    }
    if (!accumulator.associations.has(match.awayCountry)) {
      accumulator.associations.set(match.awayCountry, { attack: emptyBucket(), defense: emptyBucket() });
    }
    const association = accumulator.associations.get(match.awayCountry);
    observe(association.attack, match.homeGoals, baseline.home, observationWeight);
    observe(association.defense, match.awayGoals, baseline.away, observationWeight);
  }

  const profiles = {};
  for (const [slug, accumulator] of [...accumulators.entries()].sort(([first], [second]) => first.localeCompare(second))) {
    const attack = serializeMetric(accumulator.attack, methodology.attackBounds);
    const defense = serializeMetric(accumulator.defense, methodology.defenseBounds);
    const associationMatchups = {};
    for (const [country, buckets] of [...accumulator.associations.entries()].sort(([first], [second]) => first.localeCompare(second))) {
      if (buckets.attack.rawMatches < methodology.minimumAssociationSample) continue;
      const attackResult = summarize(buckets.attack, methodology.contextPriorMatches, methodology.attackBounds);
      const defenseResult = summarize(buckets.defense, methodology.contextPriorMatches, methodology.defenseBounds);
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

function generatedSource(storedMatches, scopedMatches, profiles, files, scope, anchor) {
  const payload = {
    version: 1,
    generatedAt: anchor ? `${anchor}T00:00:00.000Z` : null,
    latestMatchDate: anchor,
    sourceSummary: {
      storedMatches: storedMatches.length,
      matches: scopedMatches.length,
      excludedStoredMatches: storedMatches.length - scopedMatches.length,
      teams: Object.keys(profiles).length,
      activeTeamScope: scope.teams.length,
      domesticMatches: scopedMatches.filter((match) => match.competitionType === 'domestic').length,
      europeanMatches: scopedMatches.filter((match) => match.competitionType === 'europe').length,
      latestIncludedMatchDate: latestMatchDate(scopedMatches),
      files: files.map((file) => path.relative(root, file).replaceAll(path.sep, '/'))
    },
    methodology,
    scope: {
      source: scope.source,
      priority: scope.priority,
      teams: scope.teams
    },
    researchQueue: scope.teams.filter((slug) => !profiles[slug]),
    profiles
  };
  return `// Generated by scripts/build-home-advantage-profiles.mjs.\n// Do not hand-edit multipliers. Add normalized match records under data/home-advantage-matches*.\n(() => {\n  'use strict';\n  window.UCLDRAW_HOME_ADVANTAGE_PROFILES = Object.freeze(${JSON.stringify(payload, null, 2)});\n})();\n`;
}

const { files, matches: storedMatches } = loadMatches();
const scope = loadPriorityScope();
const anchor = latestMatchDate(storedMatches);
const scopedMatches = storedMatches.filter((match) => scope.teamSet.has(match.homeSlug));
const profiles = buildProfiles(scopedMatches, anchor);
fs.writeFileSync(outputPath, generatedSource(storedMatches, scopedMatches, profiles, files, scope, anchor));
console.log(
  `Generated ${path.relative(root, outputPath)} from ${scopedMatches.length}/${storedMatches.length} stored matches `
  + `for ${Object.keys(profiles).length}/${scope.teams.length} guaranteed Champions/Europa teams.`
);
