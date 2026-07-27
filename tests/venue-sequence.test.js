'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const baseEngine = require('../draw-engine-v2.js');
const venueSequence = require('../venue-sequence-v4.js');

const engine = venueSequence.wrapEngine(baseEngine);
const teamsSource = fs.readFileSync(path.resolve(__dirname, '..', 'teams.js'), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(teamsSource, sandbox, { filename: 'teams.js' });
const competitions = sandbox.window.UCLDRAW_DATA.competitions;

const doubleAllowed = venueSequence.sequenceViolations([true, true, false, true, false, false]).triples === 0;
const tripleRejected = venueSequence.sequenceViolations([true, true, true, false, true, false]).triples > 0;
if (!doubleAllowed || !tripleRejected) {
  throw new Error('Venue rule must allow two consecutive matches and reject three consecutive matches.');
}

for (const competition of Object.values(competitions)) {
  console.log(`testing ${competition.id}...`);
  for (let run = 0; run < 3; run += 1) {
    const table = engine.generateCompetitionDraw(competition);
    const validation = engine.validateCompetitionDraw(competition, table);
    if (!validation.valid) throw new Error(`${competition.id}: ${validation.reason}`);

    for (const team of competition.teams) {
      const fixtures = table[team.name];
      const sequence = fixtures.map((fixture) => fixture.home);
      for (let index = 2; index < sequence.length; index += 1) {
        if (sequence[index] === sequence[index - 1] && sequence[index] === sequence[index - 2]) {
          throw new Error(`${competition.id}/${team.name}: three identical venue statuses in a row.`);
        }
      }
    }
  }
  console.log(`${competition.id}: venue sequence passed.`);
}
