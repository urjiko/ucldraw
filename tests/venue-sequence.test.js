'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const baseEngine = require('../draw-engine-v2.js');
const venueSequence = require('../venue-sequence-v3.js');

const engine = venueSequence.wrapEngine(baseEngine);
const teamsSource = fs.readFileSync(path.resolve(__dirname, '..', 'teams.js'), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(teamsSource, sandbox, { filename: 'teams.js' });
const competitions = sandbox.window.UCLDRAW_DATA.competitions;

for (const competition of Object.values(competitions)) {
  console.log(`testing ${competition.id}...`);
  const matchdayCount = competition.potCount * competition.opponentsPerPot;
  const table = engine.generateCompetitionDraw(competition);
  const validation = engine.validateCompetitionDraw(competition, table);
  if (!validation.valid) throw new Error(`${competition.id}: ${validation.reason}`);

  for (const team of competition.teams) {
    const fixtures = table[team.name];
    const sequence = fixtures.map((fixture) => fixture.home);
    if (sequence[0] === sequence[1]) {
      throw new Error(`${competition.id}/${team.name}: first two matchdays must contain one home and one away match.`);
    }
    if (sequence[matchdayCount - 2] === sequence[matchdayCount - 1]) {
      throw new Error(`${competition.id}/${team.name}: last two matchdays must contain one home and one away match.`);
    }
    for (let index = 2; index < sequence.length; index += 1) {
      if (sequence[index] === sequence[index - 1] && sequence[index] === sequence[index - 2]) {
        throw new Error(`${competition.id}/${team.name}: three identical venue statuses in a row.`);
      }
    }
  }
  console.log(`${competition.id}: venue sequence passed.`);
}
