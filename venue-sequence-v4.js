(() => {
  'use strict';

  function shuffle(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  }

  function cloneTable(comp, table) {
    return Object.fromEntries(comp.teams.map((team) => [
      team.name,
      (table[team.name] || []).map((fixture) => ({ ...fixture }))
    ]));
  }

  function venueGroups(comp) {
    if (comp.potCount === 4 && comp.opponentsPerPot === 2) {
      return Array.from({ length: 4 }, (_, index) => [index + 1]);
    }
    if (comp.potCount === 6 && comp.opponentsPerPot === 1) {
      return [[1, 2], [3, 4], [5, 6]];
    }
    return [];
  }

  function createState(comp, table) {
    const seen = new Set();
    const edges = [];
    for (const team of comp.teams) {
      for (const fixture of table[team.name] || []) {
        const key = [team.name, fixture.opponent.name].sort().join('::');
        if (seen.has(key)) continue;
        seen.add(key);
        const reciprocal = table[fixture.opponent.name]?.find((other) => other.opponent === team);
        if (!reciprocal) return null;
        edges.push({
          a: team,
          b: fixture.opponent,
          aHome: Boolean(fixture.home),
          day: fixture.matchday,
          aFixture: fixture,
          bFixture: reciprocal
        });
      }
    }

    const incident = new Map(comp.teams.map((team) => [team.name, []]));
    edges.forEach((edge, index) => {
      incident.get(edge.a.name).push(index);
      incident.get(edge.b.name).push(index);
    });

    const parent = edges.map((_, index) => index);
    function find(value) {
      while (parent[value] !== value) {
        parent[value] = parent[parent[value]];
        value = parent[value];
      }
      return value;
    }
    function union(first, second) {
      const firstRoot = find(first);
      const secondRoot = find(second);
      if (firstRoot !== secondRoot) parent[secondRoot] = firstRoot;
    }

    for (const team of comp.teams) {
      for (const group of venueGroups(comp)) {
        const pair = incident.get(team.name).filter((edgeIndex) => {
          const edge = edges[edgeIndex];
          const opponent = edge.a === team ? edge.b : edge.a;
          return group.includes(opponent.pot);
        });
        if (pair.length !== 2) return null;
        union(pair[0], pair[1]);
      }
    }

    const componentMap = new Map();
    edges.forEach((_, index) => {
      const root = find(index);
      if (!componentMap.has(root)) componentMap.set(root, []);
      componentMap.get(root).push(index);
    });

    return { edges, incident, components: [...componentMap.values()] };
  }

  function homeForTeam(edge, team) {
    return edge.a === team ? edge.aHome : !edge.aHome;
  }

  function sequenceForTeam(comp, state, team) {
    const matchdayCount = comp.potCount * comp.opponentsPerPot;
    const sequence = Array(matchdayCount).fill(null);
    for (const edgeIndex of state.incident.get(team.name)) {
      const edge = state.edges[edgeIndex];
      sequence[edge.day - 1] = homeForTeam(edge, team);
    }
    return sequence;
  }

  function sequenceViolations(sequence) {
    let triples = 0;
    for (let index = 2; index < sequence.length; index += 1) {
      if (sequence[index] === sequence[index - 1]
        && sequence[index] === sequence[index - 2]) triples += 1;
    }
    const edgePairs = sequence.length >= 2
      ? Number(sequence[0] === sequence[1]) + Number(sequence.at(-2) === sequence.at(-1))
      : 0;
    return { triples, edgePairs };
  }

  function scoreState(comp, state) {
    let triples = 0;
    let edgePairs = 0;
    for (const team of comp.teams) {
      const score = sequenceViolations(sequenceForTeam(comp, state, team));
      triples += score.triples;
      edgePairs += score.edgePairs;
    }
    return { triples, edgePairs, value: triples * 20 + edgePairs };
  }

  function cyclesForDays(comp, state, firstDay, secondDay) {
    const remaining = new Set();
    state.edges.forEach((edge, index) => {
      if (edge.day === firstDay || edge.day === secondDay) remaining.add(index);
    });
    const cycles = [];
    while (remaining.size) {
      const start = remaining.values().next().value;
      remaining.delete(start);
      const stack = [start];
      const cycle = [];
      while (stack.length) {
        const edgeIndex = stack.pop();
        cycle.push(edgeIndex);
        const edge = state.edges[edgeIndex];
        for (const team of [edge.a, edge.b]) {
          for (const otherIndex of state.incident.get(team.name)) {
            const other = state.edges[otherIndex];
            if (remaining.has(otherIndex)
              && (other.day === firstDay || other.day === secondDay)) {
              remaining.delete(otherIndex);
              stack.push(otherIndex);
            }
          }
        }
      }
      cycles.push(cycle);
    }
    return cycles;
  }

  function snapshotState(state) {
    return {
      homes: state.edges.map((edge) => edge.aHome),
      days: state.edges.map((edge) => edge.day)
    };
  }

  function restoreState(state, snapshot) {
    state.edges.forEach((edge, index) => {
      edge.aHome = snapshot.homes[index];
      edge.day = snapshot.days[index];
    });
  }

  function optimizeVenueSequence(comp, table, options = {}) {
    const state = createState(comp, table);
    if (!state) return null;
    const matchdayCount = comp.potCount * comp.opponentsPerPot;
    const maxIterations = Number.isInteger(options.venueIterations)
      ? options.venueIterations
      : (matchdayCount === 8 ? 70000 : 25000);
    const restarts = Number.isInteger(options.venueRestarts) ? options.venueRestarts : 4;
    let globalBest = null;
    let globalBestScore = { triples: Infinity, edgePairs: Infinity, value: Infinity };

    for (let restart = 0; restart < restarts; restart += 1) {
      if (globalBest) restoreState(state, globalBest);
      for (const component of state.components) {
        if (Math.random() < 0.5) {
          for (const edgeIndex of component) state.edges[edgeIndex].aHome = !state.edges[edgeIndex].aHome;
        }
      }

      let currentScore = scoreState(comp, state);
      let bestSnapshot = snapshotState(state);
      let bestScore = currentScore;

      for (let iteration = 0; iteration < maxIterations; iteration += 1) {
        let undo;
        if (Math.random() < 0.34) {
          const component = state.components[Math.floor(Math.random() * state.components.length)];
          for (const edgeIndex of component) state.edges[edgeIndex].aHome = !state.edges[edgeIndex].aHome;
          undo = () => {
            for (const edgeIndex of component) state.edges[edgeIndex].aHome = !state.edges[edgeIndex].aHome;
          };
        } else {
          const firstDay = 1 + Math.floor(Math.random() * matchdayCount);
          let secondDay = 1 + Math.floor(Math.random() * matchdayCount);
          if (firstDay === secondDay) secondDay = (secondDay % matchdayCount) + 1;
          const cycles = cyclesForDays(comp, state, firstDay, secondDay);
          const cycle = cycles[Math.floor(Math.random() * cycles.length)];
          for (const edgeIndex of cycle) {
            state.edges[edgeIndex].day = state.edges[edgeIndex].day === firstDay ? secondDay : firstDay;
          }
          undo = () => {
            for (const edgeIndex of cycle) {
              state.edges[edgeIndex].day = state.edges[edgeIndex].day === firstDay ? secondDay : firstDay;
            }
          };
        }

        const nextScore = scoreState(comp, state);
        const temperature = Math.max(0.08, 3.2 * (1 - iteration / maxIterations));
        const delta = nextScore.value - currentScore.value;
        if (delta <= 0 || Math.random() < Math.exp(-delta / temperature)) {
          currentScore = nextScore;
          if (nextScore.triples < bestScore.triples
            || (nextScore.triples === bestScore.triples && nextScore.edgePairs < bestScore.edgePairs)) {
            bestScore = nextScore;
            bestSnapshot = snapshotState(state);
            if (bestScore.triples === 0) break;
          }
        } else {
          undo();
        }
      }

      if (bestScore.triples < globalBestScore.triples
        || (bestScore.triples === globalBestScore.triples && bestScore.edgePairs < globalBestScore.edgePairs)) {
        globalBestScore = bestScore;
        globalBest = bestSnapshot;
      }
      if (globalBestScore.triples === 0) break;
    }

    if (!globalBest || globalBestScore.triples !== 0) return null;
    restoreState(state, globalBest);
    state.edges.forEach((edge) => {
      edge.aFixture.home = edge.aHome;
      edge.bFixture.home = !edge.aHome;
      edge.aFixture.matchday = edge.day;
      edge.bFixture.matchday = edge.day;
    });
    for (const team of comp.teams) {
      table[team.name].sort((first, second) => first.matchday - second.matchday);
    }
    return table;
  }

  function validateVenueSequence(comp, table) {
    for (const team of comp.teams) {
      const score = sequenceViolations(
        [...(table[team.name] || [])]
          .sort((first, second) => first.matchday - second.matchday)
          .map((fixture) => Boolean(fixture.home))
      );
      if (score.triples > 0) {
        return { valid: false, reason: `${team.name}: üç iç saha veya deplasman maçı art arda geliyor.` };
      }
    }
    return { valid: true, reason: '' };
  }

  function wrapEngine(baseEngine) {
    if (!baseEngine?.generateCompetitionDraw || !baseEngine?.validateCompetitionDraw) return baseEngine;
    return {
      generateCompetitionDraw(comp, options = {}) {
        const attempts = Number.isInteger(options.venueSequenceAttempts)
          ? options.venueSequenceAttempts
          : 4;
        for (let attempt = 0; attempt < attempts; attempt += 1) {
          const table = cloneTable(comp, baseEngine.generateCompetitionDraw(comp, options));
          const optimized = optimizeVenueSequence(comp, table, options);
          if (!optimized) continue;
          const validation = this.validateCompetitionDraw(comp, optimized);
          if (validation.valid) return optimized;
        }
        throw new Error('İç saha/deplasman serileri UEFA planlama ilkesine uygun hâle getirilemedi. Tekrar dene.');
      },
      validateCompetitionDraw(comp, table) {
        const baseValidation = baseEngine.validateCompetitionDraw(comp, table);
        return baseValidation.valid ? validateVenueSequence(comp, table) : baseValidation;
      }
    };
  }

  const api = {
    optimizeVenueSequence,
    sequenceViolations,
    validateVenueSequence,
    wrapEngine
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined' && window.UCLDRAW_ENGINE) {
    window.UCLDRAW_ENGINE = wrapEngine(window.UCLDRAW_ENGINE);
  }
})();
