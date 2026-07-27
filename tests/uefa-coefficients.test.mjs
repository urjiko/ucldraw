import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  matchRows,
  normalize,
  parseCatalog,
  parseKassiesaRows,
  parseOfficialTopFive,
  parseRows
} from '../scripts/update-uefa-coefficients.mjs';

assert.equal(normalize('Paris Saint-Germain FC'), 'paris saint germain');
assert.equal(normalize('Galatasaray A.Ş.'), 'galatasaray a s');

const rows = parseRows(`
1 Bayern München GER 147.500 18.580
2 Real Madrid ESP 144.500 19.409
3 Paris FRA 132.000 16.699
4 Man City ENG 125.500 23.903
5 Galatasaray A.Ş. TUR 53.500 10.375
`);

assert.equal(rows.length, 5);
assert.equal(rows[0].coefficient, 147.5);
assert.equal(rows[2].officialName, 'Paris');

const kassiesaRows = parseKassiesaRows(`
<table>
<tr><td>1</td><td></td><td><b>Bayern München</b></td><td>Ger</td><td>26.00</td><td>27.00</td><td>28.00</td><td>27.25</td><td>39.25</td><td>147.500</td><td>18.580</td></tr>
<tr><td>2</td><td></td><td>Real Madrid</td><td>Esp</td><td>30.00</td><td>29.00</td><td>34.00</td><td>24.50</td><td>27.00</td><td>144.500</td><td>19.409</td></tr>
<tr><td>3</td><td></td><td>Paris Saint-Germain</td><td>Fra</td><td>19.00</td><td>19.00</td><td>23.00</td><td>33.50</td><td>37.50</td><td>132.000</td><td>16.699</td></tr>
</table>`);

assert.equal(kassiesaRows.length, 3);
assert.equal(kassiesaRows[0].country, 'GER');
assert.equal(kassiesaRows[2].coefficient, 132);

const officialTopFive = parseOfficialTopFive(`
<section><h2>Club coefficients</h2>
1 Bayern München GER 147.500 18.580
2 Real Madrid ESP 144.500 19.409
3 Paris FRA 132.000 16.699
4 Liverpool ENG 130.000 23.903
5 Inter ITA 127.000 19.989
<a>View full rankings</a></section>`);
assert.equal(officialTopFive.length, 5);
assert.equal(officialTopFive[4].coefficient, 127);

const loaderSource = await readFile(new URL('../team-pool-loader.js', import.meta.url), 'utf8');
const catalog = parseCatalog(loaderSource);
const matched = matchRows(catalog, rows);

assert.equal(matched.clubs.bayern.coefficient, 147.5);
assert.equal(matched.clubs.real.rank, 2);
assert.equal(matched.clubs.psg.coefficient, 132);
assert.equal(matched.clubs.city.officialName, 'Man City');
assert.equal(matched.clubs.galatasaray.country, 'TUR');

console.log('UEFA coefficient parser checks passed.');
