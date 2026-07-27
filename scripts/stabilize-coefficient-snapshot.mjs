import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const snapshotPath = path.join(root, 'generated-club-coefficients.js');
const officialUpdatedAt = '2026-05-30T19:00:00.000Z';

const source = await readFile(snapshotPath, 'utf8');
const stabilized = source.replace(
  /"updatedAt":\s*"[^"]+"/,
  `"updatedAt": "${officialUpdatedAt}"`
);

if (stabilized === source && !source.includes(`"updatedAt": "${officialUpdatedAt}"`)) {
  throw new Error('Coefficient snapshot updatedAt field could not be stabilized.');
}

await writeFile(snapshotPath, stabilized, 'utf8');
console.log(`Coefficient snapshot date stabilized at ${officialUpdatedAt}.`);
