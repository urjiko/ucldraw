const jsonSources = Object.freeze({
  france: 'https://raw.githubusercontent.com/openfootball/football.json/master/2024-25/fr.1.json',
  netherlands: 'https://raw.githubusercontent.com/openfootball/football.json/master/2024-25/nl.1.json',
  greece: 'https://raw.githubusercontent.com/openfootball/football.json/master/2024-25/gr.1.json',
  belgium: 'https://raw.githubusercontent.com/openfootball/football.json/master/2024-25/be.1.json'
});

const targetHints = Object.freeze({
  france: ['lyon'],
  netherlands: ['nec'],
  greece: ['olympi'],
  belgium: ['union', 'gilloise']
});

function simplify(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

const report = {};
for (const [key, url] of Object.entries(jsonSources)) {
  const response = await fetch(url, { headers: { 'user-agent': 'UEFA-home-profile-inspector/1.0' } });
  if (!response.ok) throw new Error(`${key} source failed: ${response.status}`);
  const source = await response.json();
  const teams = [...new Set(source.matches.flatMap((match) => [match.team1, match.team2]))].sort();
  const matchingTeams = teams.filter((team) => targetHints[key].some((hint) => simplify(team).includes(hint)));
  const homeCounts = Object.fromEntries(matchingTeams.map((team) => [
    team,
    source.matches.filter((match) => match.team1 === team && Array.isArray(match.score?.ft)).length
  ]));
  report[key] = {
    sourceName: source.name,
    totalMatches: source.matches.length,
    completedMatches: source.matches.filter((match) => Array.isArray(match.score?.ft)).length,
    matchingTeams,
    homeCounts
  };
}

const textSources = Object.freeze({
  norway: {
    url: 'https://raw.githubusercontent.com/openfootball/europe/master/norway/2024_no1.txt',
    pattern: /bod[oø]/i
  },
  czechia: {
    url: 'https://raw.githubusercontent.com/openfootball/europe/master/czech-republic/2024-25_cz1.txt',
    pattern: /sparta/i
  }
});

for (const [key, config] of Object.entries(textSources)) {
  const response = await fetch(config.url, { headers: { 'user-agent': 'UEFA-home-profile-inspector/1.0' } });
  if (!response.ok) throw new Error(`${key} source failed: ${response.status}`);
  const text = await response.text();
  const targetLines = text.split(/\r?\n/).filter((line) => config.pattern.test(line));
  report[key] = {
    source: config.url,
    fixtureHeader: text.match(/\d+\s+matches?/i)?.[0] || null,
    targetLines
  };
}

console.log(JSON.stringify(report, null, 2));
