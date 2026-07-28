(() => {
  'use strict';

  const MATCHDAY_DATES = Object.freeze({
    ucl: Object.freeze([
      ['2026-09-08', '2026-09-09', '2026-09-10'],
      ['2026-10-13', '2026-10-14'],
      ['2026-10-20', '2026-10-21'],
      ['2026-11-03', '2026-11-04'],
      ['2026-11-24', '2026-11-25'],
      ['2026-12-08', '2026-12-09'],
      ['2027-01-19', '2027-01-20'],
      ['2027-01-27']
    ]),
    uel: Object.freeze([
      ['2026-09-16', '2026-09-17'],
      ['2026-10-15'],
      ['2026-10-22'],
      ['2026-11-05'],
      ['2026-11-26'],
      ['2026-12-10'],
      ['2027-01-21'],
      ['2027-01-28']
    ]),
    uecl: Object.freeze([
      ['2026-10-15'],
      ['2026-10-22'],
      ['2026-11-05'],
      ['2026-11-26'],
      ['2026-12-10'],
      ['2026-12-17']
    ])
  });

  const NORTHERN = new Set(['NOR', 'SWE', 'FIN', 'ISL', 'DEN', 'SCO', 'EST', 'LVA', 'LTU']);
  const WET_WEST = new Set(['ENG', 'SCO', 'WAL', 'NIR', 'IRL', 'NED', 'BEL', 'POR']);
  const MEDITERRANEAN = new Set(['ESP', 'POR', 'ITA', 'GRE', 'TUR', 'CYP', 'CRO', 'ISR']);

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function hashString(value) {
    let hash = 2166136261;
    const text = String(value);
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function seededRandom(seed) {
    let value = hashString(seed) || 1;
    return () => {
      value += 0x6D2B79F5;
      let result = value;
      result = Math.imul(result ^ (result >>> 15), result | 1);
      result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
      return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
    };
  }

  function slug(value) {
    return String(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('en-US')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function coefficient(team) {
    const value = Number(team?.coefficient);
    return Number.isFinite(value) ? value : 0;
  }

  function strength(team, potCount) {
    const coefficientStrength = Math.log2(coefficient(team) + 8);
    const potStrength = (Math.max(1, potCount) - Number(team?.pot || potCount)) * 0.16;
    return coefficientStrength + potStrength;
  }

  function samplePoisson(expected, random) {
    const threshold = Math.exp(-expected);
    let product = 1;
    let count = 0;
    do {
      count += 1;
      product *= Math.max(0.000001, random());
    } while (product > threshold && count < 9);
    return clamp(count - 1, 0, 6);
  }

  function matchDate(leagueId, matchday, matchId, seed) {
    const dates = MATCHDAY_DATES[leagueId]?.[matchday - 1];
    if (!dates?.length) return null;
    return dates[hashString(`${seed}:${matchId}:date`) % dates.length];
  }

  function uniqueMatches(comp, table, leagueId, seed = 'default') {
    const seen = new Set();
    const matches = [];
    for (const team of comp.teams) {
      const fixtures = table?.[team.name] || [];
      for (const fixture of fixtures) {
        const opponent = fixture.opponent;
        if (!opponent) continue;
        const pair = [team.name, opponent.name].sort().join('::');
        if (seen.has(pair)) continue;
        seen.add(pair);
        const home = fixture.home ? team : opponent;
        const away = fixture.home ? opponent : team;
        const matchday = Number(fixture.matchday);
        const id = `${matchday}:${slug(home.name)}:${slug(away.name)}`;
        matches.push({ id, matchday, home, away, date: matchDate(leagueId, matchday, id, seed) });
      }
    }
    return matches.sort((first, second) => first.matchday - second.matchday
      || String(first.date).localeCompare(String(second.date))
      || first.home.name.localeCompare(second.home.name, 'tr'));
  }

  function simulateScore(match, comp, seed, version = 0) {
    const random = seededRandom(`${seed}:${version}:${match.id}`);
    const difference = strength(match.home, comp.potCount) - strength(match.away, comp.potCount);
    const homeExpected = clamp(1.48 + difference * 0.28, 0.25, 3.45);
    const awayExpected = clamp(1.02 - difference * 0.24, 0.2, 3.1);
    return {
      homeGoals: samplePoisson(homeExpected, random),
      awayGoals: samplePoisson(awayExpected, random),
      source: 'model'
    };
  }

  function forceOutcome(match, selectedTeamName, points, seed) {
    const random = seededRandom(`${seed}:${match.id}:forced:${points}`);
    const selectedHome = match.home.name === selectedTeamName;
    let selectedGoals;
    let opponentGoals;
    if (points === 1) {
      selectedGoals = Math.floor(random() * 4);
      opponentGoals = selectedGoals;
    } else {
      const winnerGoals = 1 + Math.floor(random() * 4);
      const loserGoals = Math.floor(random() * winnerGoals);
      const selectedWins = points === 3;
      selectedGoals = selectedWins ? winnerGoals : loserGoals;
      opponentGoals = selectedWins ? loserGoals : winnerGoals;
    }
    return selectedHome
      ? { homeGoals: selectedGoals, awayGoals: opponentGoals, source: 'user-points' }
      : { homeGoals: opponentGoals, awayGoals: selectedGoals, source: 'user-points' };
  }

  function selectedPoints(match, score, selectedTeamName) {
    const selectedHome = match.home.name === selectedTeamName;
    const selectedGoals = selectedHome ? score.homeGoals : score.awayGoals;
    const opponentGoals = selectedHome ? score.awayGoals : score.homeGoals;
    if (selectedGoals > opponentGoals) return 3;
    if (selectedGoals === opponentGoals) return 1;
    return 0;
  }

  function createState(comp, table, leagueId, selectedTeamName, seed = Date.now()) {
    const matches = uniqueMatches(comp, table, leagueId, seed);
    const scores = {};
    const rerollVersion = {};
    matches.forEach((match) => {
      rerollVersion[match.matchday] = 0;
      scores[match.id] = simulateScore(match, comp, seed, 0);
    });
    return {
      comp,
      table,
      leagueId,
      selectedTeamName,
      seed: String(seed),
      matches,
      scores,
      locked: {},
      rerollVersion
    };
  }

  function rerollMatchday(state, matchday, protectedMatchId) {
    state.rerollVersion[matchday] = Number(state.rerollVersion[matchday] || 0) + 1;
    const version = state.rerollVersion[matchday];
    state.matches
      .filter((match) => match.matchday === matchday && match.id !== protectedMatchId && !state.locked[match.id])
      .forEach((match) => {
        state.scores[match.id] = simulateScore(match, state.comp, state.seed, version);
      });
  }

  function applyPoints(state, matchId, points) {
    if (![0, 1, 3].includes(Number(points))) throw new Error('Puan seçimi 3, 1 veya 0 olmalı.');
    const match = state.matches.find((candidate) => candidate.id === matchId);
    if (!match || (match.home.name !== state.selectedTeamName && match.away.name !== state.selectedTeamName)) {
      throw new Error('Seçilen takımın maçı bulunamadı.');
    }
    state.scores[matchId] = forceOutcome(match, state.selectedTeamName, Number(points), `${state.seed}:${Date.now()}`);
    state.locked[matchId] = true;
    rerollMatchday(state, match.matchday, matchId);
    return state.scores[matchId];
  }

  function setManualScore(state, matchId, homeGoals, awayGoals) {
    const match = state.matches.find((candidate) => candidate.id === matchId);
    const home = clamp(Number.parseInt(homeGoals, 10) || 0, 0, 15);
    const away = clamp(Number.parseInt(awayGoals, 10) || 0, 0, 15);
    if (!match) throw new Error('Skoru değiştirilecek maç bulunamadı.');
    state.scores[matchId] = { homeGoals: home, awayGoals: away, source: 'user-score' };
    state.locked[matchId] = true;
    rerollMatchday(state, match.matchday, matchId);
    return state.scores[matchId];
  }

  function blankRow(team) {
    return {
      team,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      awayGoals: 0,
      awayWins: 0,
      points: 0,
      opponentPoints: 0,
      opponentGoalDifference: 0,
      opponentGoalsFor: 0,
      fixtures: []
    };
  }

  function standings(state) {
    const rows = new Map(state.comp.teams.map((team) => [team.name, blankRow(team)]));
    for (const match of state.matches) {
      const score = state.scores[match.id];
      if (!score) continue;
      const home = rows.get(match.home.name);
      const away = rows.get(match.away.name);
      if (!home || !away) continue;
      const selectedMatch = match.home.name === state.selectedTeamName || match.away.name === state.selectedTeamName;
      const pending = selectedMatch && !state.locked[match.id];
      home.fixtures.push({ match, score, opponent: match.away, home: true, pending });
      away.fixtures.push({ match, score, opponent: match.home, home: false, pending });
      if (pending) continue;
      home.played += 1;
      away.played += 1;
      home.goalsFor += score.homeGoals;
      home.goalsAgainst += score.awayGoals;
      away.goalsFor += score.awayGoals;
      away.goalsAgainst += score.homeGoals;
      away.awayGoals += score.awayGoals;
      if (score.homeGoals > score.awayGoals) {
        home.wins += 1;
        away.losses += 1;
        home.points += 3;
      } else if (score.homeGoals < score.awayGoals) {
        away.wins += 1;
        away.awayWins += 1;
        home.losses += 1;
        away.points += 3;
      } else {
        home.draws += 1;
        away.draws += 1;
        home.points += 1;
        away.points += 1;
      }
    }
    rows.forEach((row) => { row.goalDifference = row.goalsFor - row.goalsAgainst; });
    rows.forEach((row) => {
      for (const fixture of row.fixtures.filter((item) => !item.pending)) {
        const opponent = rows.get(fixture.opponent.name);
        row.opponentPoints += opponent?.points || 0;
        row.opponentGoalDifference += opponent?.goalDifference || 0;
        row.opponentGoalsFor += opponent?.goalsFor || 0;
      }
    });
    const ordered = [...rows.values()].sort((first, second) => second.points - first.points
      || second.goalDifference - first.goalDifference
      || second.goalsFor - first.goalsFor
      || second.awayGoals - first.awayGoals
      || second.wins - first.wins
      || second.awayWins - first.awayWins
      || second.opponentPoints - first.opponentPoints
      || second.opponentGoalDifference - first.opponentGoalDifference
      || second.opponentGoalsFor - first.opponentGoalsFor
      || coefficient(second.team) - coefficient(first.team)
      || first.team.name.localeCompare(second.team.name, 'tr'));
    ordered.forEach((row, index) => {
      row.rank = index + 1;
      row.zone = row.rank <= 8 ? 'direct' : row.rank <= 24 ? 'playoff' : 'eliminated';
      row.fixtures.sort((first, second) => first.match.matchday - second.match.matchday);
    });
    return ordered;
  }

  function progress(state) {
    const selectedMatches = state.matches.filter((match) => match.home.name === state.selectedTeamName || match.away.name === state.selectedTeamName);
    const completed = selectedMatches.filter((match) => state.locked[match.id]).length;
    return { completed, total: selectedMatches.length, done: completed === selectedMatches.length };
  }

  function travelContext(team, dateValue) {
    const month = Number(String(dateValue || '').slice(5, 7));
    const winter = month === 12 || month === 1 || month === 2;
    if (NORTHERN.has(team.country)) return winter ? 'Kuzey deplasmanı · soğuk/kış koşulları' : 'Kuzey deplasmanı · serin hava olası';
    if (WET_WEST.has(team.country)) return 'Batı Avrupa · yağış ve rüzgâr olası';
    if (MEDITERRANEAN.has(team.country)) return month >= 10 ? 'Akdeniz iklimi · ılık/yağışlı dönem' : 'Akdeniz iklimi · ılıman koşullar';
    return winter ? 'Kış dönemi · soğuk hava olası' : 'Sonbahar/kış fikstürü';
  }

  const api = {
    MATCHDAY_DATES,
    uniqueMatches,
    simulateScore,
    createState,
    applyPoints,
    setManualScore,
    selectedPoints,
    standings,
    progress,
    travelContext
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.UCLDRAW_PREDICTION_ENGINE = api;
})();
