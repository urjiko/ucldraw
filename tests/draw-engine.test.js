const { generateCompetitionDraw, validateCompetitionDraw } = require('../draw-engine.js');

function teamsFromPots(pots) {
  return pots.flatMap((countries, potIndex) => countries.map((country, teamIndex) => ({
    name: `P${potIndex + 1}-${teamIndex + 1}-${country}`,
    country,
    pot: potIndex + 1
  })));
}

const competitions = [
  {
    id: 'ucl', potCount: 4, opponentsPerPot: 2,
    teams: teamsFromPots([
      ['FRA','ESP','ENG','GER','ENG','ITA','ENG','GER','ESP'],
      ['ENG','GER','ESP','POR','ITA','ESP','ITA','GER','BEL'],
      ['ENG','NED','NED','ITA','POR','GRE','CZE','NOR','FRA'],
      ['DEN','FRA','TUR','BEL','AZE','ESP','ENG','CYP','KAZ']
    ])
  },
  {
    id: 'uel', potCount: 4, opponentsPerPot: 2,
    teams: teamsFromPots([
      ['ITA','POR','SCO','NED','FRA','CRO','ESP','AUT','ENG'],
      ['TUR','POR','SRB','FRA','GRE','CZE','HUN','SCO','ISR'],
      ['SUI','SUI','DEN','GER','BUL','ENG','AUT','ROU','FRA'],
      ['ITA','ESP','GER','GRE','SWE','NED','NED','BEL','NOR']
    ])
  },
  {
    id: 'uecl', potCount: 6, opponentsPerPot: 1,
    teams: teamsFromPots([
      ['ITA','ENG','ESP','GER','FRA','POR'],
      ['NED','BEL','TUR','GRE','AUT','CZE'],
      ['SCO','DEN','NOR','SWE','POL','SUI'],
      ['ROU','CRO','SRB','BUL','ISR','CYP'],
      ['HUN','SVK','SVN','UKR','KAZ','AZE'],
      ['ARM','GEO','ISL','IRL','FIN','BIH']
    ])
  }
];

for (const competition of competitions) {
  for (let run = 0; run < 100; run += 1) {
    const table = generateCompetitionDraw(competition);
    const validation = validateCompetitionDraw(competition, table);
    if (!validation.valid) throw new Error(`${competition.id} run ${run}: ${validation.reason}`);
  }
}

console.log('300 reciprocal draw simulations passed.');
