import fs from 'node:fs';

const file = 'scripts/generate-champions-q3-home-profiles.mjs';
let source = fs.readFileSync(file, 'utf8');
source = source
  .replace('spartapraha: 18, union: 20', 'spartapraha: 17, union: 20')
  .replace('records.length !== 103', 'records.length !== 102')
  .replace('Expected 103 Champions Q3 home matches', 'Expected 102 Champions Q3 home matches')
  .replace('The 103 normalized records', 'The 102 normalized records')
  .replace('| Sparta Praha | Czech First League 2024/25 | 18 |', '| Sparta Praha | Czech First League 2024/25 | 17 |');
if (!source.includes('spartapraha: 17, union: 20') || !source.includes('records.length !== 102')) {
  throw new Error('Champions Q3 count correction was not applied.');
}
fs.writeFileSync(file, source);
