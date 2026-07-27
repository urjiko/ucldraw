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
        edges.push({
          a: team,
          b: fixture.opponent,
          baseHomeForA: Boolean(fixture.home),
          homeForA: Boolean(fixture.home),
          aFixture: fixture,
          bFixture: reciprocal
        });
      }
    }
    return edges;
  }

  const homeForTeam = (edge, team) => (edge.a === team ? edge.homeForA : !edge.homeForA);

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
      const fixtures = [...(table[team.name] || [])].sort((a, b) => a.matchday - b.matchday);
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

  function buildOrientationComponents(comp, edges, incidentByTeam) {
    const parent = edges.map((_, index) => index);
    const find = (value) => {
      while (parent[value] !== value) {
        parent[value] = parent[parent[value]];
        value = parent[value];
      }
      return value;
    };
    const union = (first, second) => {
      const a = find(first);
      const b = find(second);
      if (a !== b) parent[b] = a;
    };
    for (const team of comp.teams) {
      const incident = incidentByTeam.get(team.name);
      for (const group of venueGroups(comp)) {
        const pair = incident.filter((edgeIndex) => {
          const edge = edges[edgeIndex];
          const opponent = edge.a === team ? edge.b : edge.a;
          return group.includes(opponent.pot);
        });
        if (pair.length !== 2) return null;
        union(pair[0], pair[1]);
      }
    }
    const grouped = new Map();
    edges.forEach((_, index) => {
      const root = find(index);
      if (!grouped.has(root)) grouped.set(root, []);
      grouped.get(root).push(index);
    });
    return [...grouped.values()];
  }

  function partialAllows(sequence, day, home, count) {
    const at = (index) => (index === day ? home : sequence[index]);
    if (at(1) !== null && at(2) !== null && at(1) === at(2)) return false;
    if (at(count - 1) !== null && at(count) !== null && at(count - 1) === at(count)) return false;
    for (let index = 3; index <= count; index += 1) {
      const a = at(index);
      const b = at(index - 1);
      const c = at(index - 2);
      if (a !== null && b !== null && c !== null && a === b && a === c) return false;
    }
    return true;
  }

  function validPatterns(length, homes) {
    const patterns = [];
    const current = [];
    function build(index, usedHomes) {
      if (index === length) {
        if (usedHomes === homes && sequenceIsValid(current)) patterns.push([...current]);
        return;
      }
      const remaining = length - index;
      if (usedHomes > homes || usedHomes + remaining < homes) return;
      current.push(true); build(index + 1, usedHomes + 1); current.pop();
      current.push(false); build(index + 1, usedHomes); current.pop();
    }
    build(0, 0);
    return patterns;
  }

  function scheduleWithVenueRules(comp, table, options = {}) {
    const count = comp.potCount * comp.opponentsPerPot;
    const edges = collectEdges(comp, table);
    if (!edges || edges.length !== comp.teams.length * count / 2) return null;

    const incidentByTeam = new Map(comp.teams.map((team) => [team.name, []]));
    edges.forEach((edge, index) => {
      incidentByTeam.get(edge.a.name).push(index);
      incidentByTeam.get(edge.b.name).push(index);
    });
    const components = buildOrientationComponents(comp, edges, incidentByTeam);
    if (!components) return null;

    const assigned = Array(edges.length).fill(0);
    const used = new Map(comp.teams.map((team) => [team.name, Array(count + 1).fill(false)]));
    const venues = new Map(comp.teams.map((team) => [team.name, Array(count + 1).fill(null)]));
    const maxNodes = Number.isInteger(options.maxVenueScheduleNodes) ? options.maxVenueScheduleNodes : 260000;
    const attempts = Number.isInteger(options.venueSeedAttempts) ? options.venueSeedAttempts : 32;

    const reset = () => {
      assigned.fill(0);
      for (const team of comp.teams) {
        used.get(team.name).fill(false);
        venues.get(team.name).fill(null);
      }
    };
    const canPlace = (edgeIndex, day) => {
      const edge = edges[edgeIndex];
      if (assigned[edgeIndex] || used.get(edge.a.name)[day] || used.get(edge.b.name)[day]) return false;
      return partialAllows(venues.get(edge.a.name), day, edge.homeForA, count)
        && partialAllows(venues.get(edge.b.name), day, !edge.homeForA, count);
    };
    const place = (edgeIndex, day) => {
      const edge = edges[edgeIndex];
      assigned[edgeIndex] = day;
      used.get(edge.a.name)[day] = used.get(edge.b.name)[day] = true;
      venues.get(edge.a.name)[day] = edge.homeForA;
      venues.get(edge.b.name)[day] = !edge.homeForA;
    };
    const remove = (edgeIndex, day) => {
      const edge = edges[edgeIndex];
      assigned[edgeIndex] = 0;
      used.get(edge.a.name)[day] = used.get(edge.b.name)[day] = false;
      venues.get(edge.a.name)[day] = venues.get(edge.b.name)[day] = null;
    };
    const domain = (edgeIndex) => {
      const days = [];
      for (let day = 1; day <= count; day += 1) if (canPlace(edgeIndex, day)) days.push(day);
      return days;
    };
    const teamHasCoverage = (team) => {
      for (let day = 1; day <= count; day += 1) {
        if (used.get(team.name)[day]) continue;
        if (!incidentByTeam.get(team.name).some((edgeIndex) => !assigned[edgeIndex] && canPlace(edgeIndex, day))) return false;
      }
      return true;
    };
    const chooseEdge = () => {
      let best = null;
      for (let edgeIndex = 0; edgeIndex < edges.length; edgeIndex += 1) {
        if (assigned[edgeIndex]) continue;
        const days = domain(edgeIndex);
        if (!days.length) return { dead: true };
        if (!best || days.length < best.days.length) {
          best = { edgeIndex, days };
          if (days.length === 1) break;
        }
      }
      return best;
    };

    function search() {
      let nodes = 0;
      function visit() {
        if (++nodes > maxNodes) return false;
        const next = chooseEdge();
        if (!next) return true;
        if (next.dead) return false;
        const edge = edges[next.edgeIndex];
        for (const day of shuffle(next.days)) {
          place(next.edgeIndex, day);
          if (teamHasCoverage(edge.a) && teamHasCoverage(edge.b) && visit()) return true;
          remove(next.edgeIndex, day);
        }
        return false;
      }
      return visit();
    }

    const seedTeams = shuffle(comp.teams).slice(0, 8);
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      reset();
      for (const component of components) {
        const flip = Math.random() < 0.5;
        for (const edgeIndex of component) {
          edges[edgeIndex].homeForA = flip ? !edges[edgeIndex].baseHomeForA : edges[edgeIndex].baseHomeForA;
        }
      }
      const seed = seedTeams[attempt % seedTeams.length];
      const incident = incidentByTeam.get(seed.name);
      const homeEdges = shuffle(incident.filter((index) => homeForTeam(edges[index], seed)));
      const awayEdges = shuffle(incident.filter((index) => !homeForTeam(edges[index], seed)));
      const patterns = shuffle(validPatterns(count, homeEdges.length));
      const pattern = patterns[attempt % patterns.length];
      if (!pattern) continue;
      let homeIndex = 0;
      let awayIndex = 0;
      let validSeed = true;
      for (let day = 1; day <= count; day += 1) {
        const edgeIndex = pattern[day - 1] ? homeEdges[homeIndex++] : awayEdges[awayIndex++];
        if (!canPlace(edgeIndex, day)) { validSeed = false; break; }
        place(edgeIndex, day);
      }
      if (!validSeed || !search()) continue;

      edges.forEach((edge, index) => {
        edge.aFixture.home = edge.homeForA;
        edge.bFixture.home = !edge.homeForA;
        edge.aFixture.matchday = assigned[index];
        edge.bFixture.matchday = assigned[index];
      });
      for (const team of comp.teams) table[team.name].sort((a, b) => a.matchday - b.matchday);
      return table;
    }
    return null;
  }

  function wrapEngine(baseEngine) {
    if (!baseEngine?.generateCompetitionDraw || !baseEngine?.validateCompetitionDraw) return baseEngine;
    return {
      generateCompetitionDraw(comp, options = {}) {
        const attempts = Number.isInteger(options.venueSequenceAttempts) ? options.venueSequenceAttempts : 10;
        for (let attempt = 0; attempt < attempts; attempt += 1) {
          const table = cloneTable(comp, baseEngine.generateCompetitionDraw(comp, options));
          const scheduled = scheduleWithVenueRules(comp, table, options);
          if (scheduled && this.validateCompetitionDraw(comp, scheduled).valid) return scheduled;
        }
        throw new Error('UEFA iç saha/deplasman hafta dizilimine uygun fikstür oluşturulamadı. Tekrar dene.');
      },
      validateCompetitionDraw(comp, table) {
        const base = baseEngine.validateCompetitionDraw(comp, table);
        return base.valid ? validateVenueSequence(comp, table) : base;
      }
    };
  }

  const api = { scheduleWithVenueRules, sequenceIsValid, validateVenueSequence, wrapEngine };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined' && window.UCLDRAW_ENGINE) window.UCLDRAW_ENGINE = wrapEngine(window.UCLDRAW_ENGINE);
})();
