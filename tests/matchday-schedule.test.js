'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const engine = require('../draw-engine-v2.js');

const teamsSource = fs.readFileSync(path.resolve(__dirname, '..', 'teams.js'), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(teamsSource, sandbox, { filename: 'teams.js' });
const competitions = sandbox.window.UCLDRAW_DATA.competitions;

for (const competition of Object.values(competitions)) {
  const matchdayCount = competition.potCount * competition.opponentsPerPot;
  for (let run = 0; run < 12; run += 1) {
    const table = engine.generateCompetitionDraw(competition);
    const validation = engine.validateCompetitionDraw(competition, table);
    if (!validation.valid) throw new Error(`${competition.id}: ${validation.reason}`);

    for (const team of competition.teams) {
      const fixtures = table[team.name];
      const days = fixtures.map((fixture) => fixture.matchday);
      const expectedDays = Array.from({ length: matchdayCount }, (_, index) => index + 1);
      if (days.join(',') !== expectedDays.join(',')) {
        throw new Error(`${competition.id}/${team.name}: fixtures are not ordered by matchday.`);
      }
    }

    for (let matchday = 1; matchday <= matchdayCount; matchday += 1) {
      const seenTeams = new Set();
      const matches = new Set();
      for (const team of competition.teams) {
        const fixture = table[team.name].find((entry) => entry.matchday === matchday);
        if (!fixture) throw new Error(`${competition.id}/${team.name}: missing matchday ${matchday}.`);
        if (seenTeams.has(team.name)) throw new Error(`${competition.id}: duplicate team on matchday ${matchday}.`);
        seenTeams.add(team.name);
        matches.add([team.name, fixture.opponent.name].sort().join('::'));
        const reciprocal = table[fixture.opponent.name].find((entry) => entry.opponent.name === team.name);
        if (!reciprocal || reciprocal.matchday !== matchday) {
          throw new Error(`${competition.id}: reciprocal matchday mismatch.`);
        }
      }
      if (seenTeams.size !== competition.teams.length) {
        throw new Error(`${competition.id}: not every team plays on matchday ${matchday}.`);
      }
      if (matches.size !== competition.teams.length / 2) {
        throw new Error(`${competition.id}: invalid match count on matchday ${matchday}.`);
      }
    }
  }
  console.log(`${competition.id}: matchday schedule passed.`);
}
