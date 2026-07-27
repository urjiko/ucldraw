import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  matchRows,
  normalize,
  parseCatalog,
  parseRows
} from '../scripts/update-uefa-coefficients.mjs';

assert.equal(normalize('Paris Saint-Germain FC'), 'paris saint germain');
assert.equal(normalize('Galatasaray A.Ş.'), 'galatasaray');

const rows = parseRows(`
1 Bayern München GER 147.500 18.580
2 Real Madrid ESP 144.500 19.409
3 Paris FRA 132.000 16.699
4 Man City ENG 121.000 23.903
5 Galatasaray A.Ş. TUR 42.500 10.000
`);

assert.equal(rows.length, 5);
assert.equal(rows[0].coefficient, 147.5);
assert.equal(rows[2].officialName, 'Paris');

const loaderSource = await readFile(new URL('../team-pool-loader.js', import.meta.url), 'utf8');
const catalog = parseCatalog(loaderSource);
const matched = matchRows(catalog, rows);

assert.equal(matched.clubs.bayern.coefficient, 147.5);
assert.equal(matched.clubs.real.rank, 2);
assert.equal(matched.clubs.psg.coefficient, 132);
assert.equal(matched.clubs.city.officialName, 'Man City');
assert.equal(matched.clubs.galatasaray.country, 'TUR');

console.log('UEFA coefficient parser checks passed.');
