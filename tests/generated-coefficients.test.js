'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const context = vm.createContext({ window: {} });

for (const filename of ['generated-team-pools.js', 'generated-club-coefficients.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, filename), 'utf8'), context, { filename });
}

const manifest = context.window.UCLDRAW_POOL_MANIFEST;
const data = context.window.UCLDRAW_CLUB_COEFFICIENTS;
const reviewedFallbacks = new Set(['dinamominsk', 'fiori']);

assert.equal(data.season, '2026/27');
assert.equal(data.officialValidation, 'live-uefa-overview');
assert.ok(data.officialRowCount >= 300, 'Full five-year ranking must contain at least 300 club rows.');
assert.ok(Object.keys(data.clubs).length >= 130, 'At least 130 local clubs must be mapped directly.');

assert.equal(data.clubs.bayern.coefficient, 147.5);
assert.equal(data.clubs.real.coefficient, 144.5);
assert.equal(data.clubs.psg.coefficient, 132);
assert.equal(data.clubs.liverpool.coefficient, 130);
assert.equal(data.clubs.inter.coefficient, 127);

function slugFor(entry) {
  const file = typeof entry === 'string' ? entry : entry.file;
  return file.replace(/\.png$/i, '').toLowerCase();
}

const poolSlugs = new Set();
const guaranteedSlugs = new Set();
const qualifierSlugs = new Set();
Object.values(manifest).forEach((competition) => {
  Object.entries(competition).forEach(([stage, entries]) => {
    entries.forEach((entry) => {
      const slug = slugFor(entry);
      poolSlugs.add(slug);
      if (stage === 'guaranteed') guaranteedSlugs.add(slug);
      else qualifierSlugs.add(slug);
    });
  });
});

const hasCoefficient = (slug) => Boolean(data.clubs[slug] || reviewedFallbacks.has(slug));
const uncoveredGuaranteed = [...guaranteedSlugs].filter((slug) => !hasCoefficient(slug));
assert.deepEqual(
  uncoveredGuaranteed,
  [],
  `Every guaranteed pool crest needs a coefficient: ${uncoveredGuaranteed.join(', ')}`
);

const uncovered = [...poolSlugs].filter((slug) => !hasCoefficient(slug));
const invalidFallbacks = uncovered.filter((slug) => !qualifierSlugs.has(slug));
assert.deepEqual(
  invalidFallbacks,
  [],
  `Only qualification-stage candidates may use the missing-coefficient fallback: ${invalidFallbacks.join(', ')}`
);

for (const [slug, record] of Object.entries(data.clubs)) {
  assert.ok(Number.isFinite(record.coefficient), `${slug} has an invalid coefficient.`);
  assert.ok(record.coefficient >= 0, `${slug} has a negative coefficient.`);
  assert.match(record.country, /^[A-Z]{3}$/, `${slug} has an invalid country code.`);
}

console.log(
  `Generated coefficient checks passed for ${poolSlugs.size} pool crests; `
  + `${uncovered.length} qualification candidates use the tested last-pot fallback.`
);
