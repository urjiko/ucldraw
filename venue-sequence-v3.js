(() => {
  'use strict';

  const shuffle = (items) => {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [result[index], result[swap]] = [result[swap], result[index]];
    }
    return result;
  };

  const cloneTable = (comp, table) => Object.fromEntries(comp.teams.map((team) => [
    team.name,
    (table[team.name] || []).map((fixture) => ({ ...fixture }))
  ]));

  function collectEdges(comp, table) {
    const seen = new Set();
    const edges = [];
    for (const team of comp.teams) {
      for (const fixture of table[team.name] || []) {
        const key = [team.name, fixture.opponent.name].sort().join('::');
        if (seen.has(key)) continue;
        seen.add(key);
        const reciprocal = table[fixture.opponent.name]?.find((other) => other.opponent === team);
        if (!reciprocal) return null;
        edges.push({ a: team, b: fixture.opponent, aFixture: fixture, bFixture: reciprocal });
      }
    }
    return edges;
  }

  function sequenceIsValid(sequence) {
    if (sequence.length < 2) return true;
    if (sequence[0] === sequence[1]) return false;
    if (sequence.at(-2) === sequence.at(-1)) return false;
    for (let index = 2; index < sequence.length; index += 1) {
      if (sequence[index] === sequence[index - 1] && sequence[index] === sequence[index - 2]) return false;
    }
    return true;
  }

  function validateVenueSequence(comp, table) {
    const count = comp.potCount * comp.opponentsPerPot;
    for (const team of comp.teams) {
      const fixtures = [...(table[team.name] || [])].sort((first, second) => first.matchday - second.matchday);
      if (fixtures.length !== count) return { valid: false, reason: `${team.name}: maç sayısı hatalı.` };
      if (!sequenceIsValid(fixtures.map((fixture) => Boolean(fixture.home)))) {
        return { valid: false, reason: `${team.name}: iç saha/deplasman hafta dizilimi hatalı.` };
      }
    }
    return { valid: true, reason: '' };
  }

  function venueGroups(comp) {
    if (comp.potCount === 4 && comp.opponentsPerPot === 2) {
      return Array.from({ length: 4 }, (_, index) => [index + 1]);
    }
    if (comp.potCount === 6 && comp.opponentsPerPot === 1) return [[1, 2], [3, 4], [5, 6]];
    return [];
  }

  function orientForVenueSequence(comp, table) {
    const count = comp.potCount * comp.opponentsPerPot;
    const edges = collectEdges(comp, table);
    if (!edges) return null;
    const incident = new Map(comp.teams.map((team) => [team.name, []]));
    edges.forEach((edge, index) => {
      incident.get(edge.a.name).push(index);
      incident.get(edge.b.name).push(index);
    });

    const graph = Array.from({ length: edges.length }, () => []);
    const isSecond = (edge, team) => (edge.b === team ? 1 : 0);
    const addOppositeVenueConstraint = (firstEdge, secondEdge, team) => {
      const parity = 1 ^ isSecond(edges[firstEdge], team) ^ isSecond(edges[secondEdge], team);
      graph[firstEdge].push([secondEdge, parity]);
      graph[secondEdge].push([firstEdge, parity]);
    };

    for (const team of comp.teams) {
      const teamEdges = incident.get(team.name);
      for (const group of venueGroups(comp)) {
        const pair = teamEdges.filter((edgeIndex) => {
          const edge = edges[edgeIndex];
          const opponent = edge.a === team ? edge.b : edge.a;
          return group.includes(opponent.pot);
        });
        if (pair.length !== 2) return null;
        addOppositeVenueConstraint(pair[0], pair[1], team);
      }

      const edgeByDay = new Map(teamEdges.map((edgeIndex) => {
        const edge = edges[edgeIndex];
        const fixture = edge.a === team ? edge.aFixture : edge.bFixture;
        return [fixture.matchday, edgeIndex];
      }));
      if (!edgeByDay.has(1) || !edgeByDay.has(2) || !edgeByDay.has(count - 1) || !edgeByDay.has(count)) return null;
      addOppositeVenueConstraint(edgeByDay.get(1), edgeByDay.get(2), team);
      addOppositeVenueConstraint(edgeByDay.get(count - 1), edgeByDay.get(count), team);
    }

    const component = Array(edges.length).fill(-1);
    const relative = Array(edges.length).fill(null);
    let componentCount = 0;
    for (let start = 0; start < edges.length; start += 1) {
      if (relative[start] !== null) continue;
      relative[start] = 0;
      component[start] = componentCount;
      const queue = [start];
      while (queue.length) {
        const current = queue.shift();
        for (const [next, parity] of graph[current]) {
          const expected = relative[current] ^ parity;
          if (relative[next] === null) {
            relative[next] = expected;
            component[next] = componentCount;
            queue.push(next);
          } else if (relative[next] !== expected) return null;
        }
      }
      componentCount += 1;
    }

    const clauses = [];
    for (const team of comp.teams) {
      const edgeByDay = new Map(incident.get(team.name).map((edgeIndex) => {
        const edge = edges[edgeIndex];
        const fixture = edge.a === team ? edge.aFixture : edge.bFixture;
        return [fixture.matchday, edgeIndex];
      }));
      for (let day = 1; day <= count - 2; day += 1) {
        const clause = [day, day + 1, day + 2].map((matchday) => {
          const edgeIndex = edgeByDay.get(matchday);
          return {
            variable: component[edgeIndex],
            constant: relative[edgeIndex] ^ isSecond(edges[edgeIndex], team)
          };
        });
        const constantsByVariable = new Map();
        clause.forEach((literal) => {
          if (!constantsByVariable.has(literal.variable)) constantsByVariable.set(literal.variable, new Set());
          constantsByVariable.get(literal.variable).add(literal.constant);
        });
        if (constantsByVariable.size === 1) {
          const constants = [...constantsByVariable.values()][0];
          if (constants.size === 1) return null;
          continue;
        }
        clauses.push(clause);
      }
    }

    const assignment = Array(componentCount).fill(null);
    const occurrences = Array(componentCount).fill(0);
    clauses.forEach((clause) => clause.forEach((literal) => { occurrences[literal.variable] += 1; }));

    function clauseViolated(clause) {
      const values = clause.map((literal) => {
        const variableValue = assignment[literal.variable];
        return variableValue === null ? null : variableValue ^ literal.constant;
      });
      if (values.some((value) => value === null)) return false;
      return values[0] === values[1] && values[1] === values[2];
    }

    function solve() {
      if (clauses.some(clauseViolated)) return false;
      let variable = -1;
      let bestOccurrences = -1;
      for (let index = 0; index < assignment.length; index += 1) {
        if (assignment[index] === null && occurrences[index] > bestOccurrences) {
          variable = index;
          bestOccurrences = occurrences[index];
        }
      }
      if (variable === -1) return true;
      for (const value of shuffle([0, 1])) {
        assignment[variable] = value;
        if (solve()) return true;
      }
      assignment[variable] = null;
      return false;
    }

    if (!solve()) return null;
    edges.forEach((edge, index) => {
      const aHome = Boolean(assignment[component[index]] ^ relative[index]);
      edge.aFixture.home = aHome;
      edge.bFixture.home = !aHome;
    });
    return table;
  }

  function wrapEngine(baseEngine) {
    if (!baseEngine?.generateCompetitionDraw || !baseEngine?.validateCompetitionDraw) return baseEngine;
    return {
      generateCompetitionDraw(comp, options = {}) {
        const attempts = Number.isInteger(options.venueSequenceAttempts) ? options.venueSequenceAttempts : 24;
        for (let attempt = 0; attempt < attempts; attempt += 1) {
          const table = cloneTable(comp, baseEngine.generateCompetitionDraw(comp, options));
          const oriented = orientForVenueSequence(comp, table);
          if (oriented && this.validateCompetitionDraw(comp, oriented).valid) return oriented;
        }
        throw new Error('UEFA iç saha/deplasman hafta dizilimine uygun fikstür oluşturulamadı. Tekrar dene.');
      },
      validateCompetitionDraw(comp, table) {
        const base = baseEngine.validateCompetitionDraw(comp, table);
        return base.valid ? validateVenueSequence(comp, table) : base;
      }
    };
  }

  const api = { orientForVenueSequence, sequenceIsValid, validateVenueSequence, wrapEngine };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined' && window.UCLDRAW_ENGINE) window.UCLDRAW_ENGINE = wrapEngine(window.UCLDRAW_ENGINE);
})();
