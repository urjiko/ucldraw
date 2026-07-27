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
          homeForA: Boolean(fixture.home),
          aFixture: fixture,
          bFixture: reciprocal
        });
      }
    }
    return edges;
  }

  function homeForTeam(edge, team) {
    return edge.a === team ? edge.homeForA : !edge.homeForA;
  }

  function sequenceIsValid(sequence) {
    if (sequence.length < 2) return true;
    if (sequence[0] === sequence[1]) return false;
    if (sequence[sequence.length - 2] === sequence[sequence.length - 1]) return false;
    for (let index = 2; index < sequence.length; index += 1) {
      if (sequence[index] === sequence[index - 1] && sequence[index] === sequence[index - 2]) return false;
    }
    return true;
  }

  function validateVenueSequence(comp, table) {
    const matchdayCount = comp.potCount * comp.opponentsPerPot;
    for (const team of comp.teams) {
      const fixtures = [...(table[team.name] || [])].sort((first, second) => first.matchday - second.matchday);
      if (fixtures.length !== matchdayCount) return { valid: false, reason: `${team.name}: maç sayısı hatalı.` };
      const sequence = fixtures.map((fixture) => Boolean(fixture.home));
      if (!sequenceIsValid(sequence)) {
        return { valid: false, reason: `${team.name}: iç saha/deplasman maç haftası dizilimi hatalı.` };
      }
    }
    return { valid: true, reason: '' };
  }

  function partialSequenceAllows(sequence, day, home, matchdayCount) {
    const valueAt = (index) => (index === day ? home : sequence[index]);
    const first = valueAt(1);
    const second = valueAt(2);
    if (first !== null && second !== null && first === second) return false;

    const penultimate = valueAt(matchdayCount - 1);
    const last = valueAt(matchdayCount);
    if (penultimate !== null && last !== null && penultimate === last) return false;

    for (let index = 3; index <= matchdayCount; index += 1) {
      const current = valueAt(index);
      const previous = valueAt(index - 1);
      const beforePrevious = valueAt(index - 2);
      if (current !== null && previous !== null && beforePrevious !== null
        && current === previous && current === beforePrevious) return false;
    }
    return true;
  }

  function validVenuePatterns(length, homeCount) {
    const patterns = [];
    const current = [];
    function build(index, homesUsed) {
      if (index === length) {
        if (homesUsed === homeCount && sequenceIsValid(current)) patterns.push([...current]);
        return;
      }
      const remaining = length - index;
      if (homesUsed > homeCount || homesUsed + remaining < homeCount) return;
      current.push(true); build(index + 1, homesUsed + 1); current.pop();
      current.push(false); build(index + 1, homesUsed); current.pop();
    }
    build(0, 0);
    return patterns;
  }

  function assignConstrainedMatchdays(comp, table, options = {}) {
    const matchdayCount = comp.potCount * comp.opponentsPerPot;
    const edges = collectEdges(comp, table);
    if (!edges || edges.length !== (comp.teams.length * matchdayCount) / 2) return null;

    const edgeIndexesByTeam = new Map(comp.teams.map((team) => [team.name, []]));
    edges.forEach((edge, index) => {
      edgeIndexesByTeam.get(edge.a.name).push(index);
      edgeIndexesByTeam.get(edge.b.name).push(index);
    });

    const maxNodes = Number.isInteger(options.maxVenueScheduleNodes) ? options.maxVenueScheduleNodes : 900000;
    const seedAttempts = Number.isInteger(options.venueSeedAttempts) ? options.venueSeedAttempts : 30;
    const assignedDays = Array(edges.length).fill(0);
    const usedDays = new Map(comp.teams.map((team) => [team.name, Array(matchdayCount + 1).fill(false)]));
    const venueByDay = new Map(comp.teams.map((team) => [team.name, Array(matchdayCount + 1).fill(null)]));

    function clearAssignments() {
      assignedDays.fill(0);
      for (const team of comp.teams) {
        usedDays.get(team.name).fill(false);
        venueByDay.get(team.name).fill(null);
      }
    }

    function canAssign(edgeIndex, day) {
      const edge = edges[edgeIndex];
      if (assignedDays[edgeIndex]) return false;
      if (usedDays.get(edge.a.name)[day] || usedDays.get(edge.b.name)[day]) return false;
      if (!partialSequenceAllows(venueByDay.get(edge.a.name), day, edge.homeForA, matchdayCount)) return false;
      if (!partialSequenceAllows(venueByDay.get(edge.b.name), day, !edge.homeForA, matchdayCount)) return false;
      return true;
    }

    function place(edgeIndex, day) {
      const edge = edges[edgeIndex];
      assignedDays[edgeIndex] = day;
      usedDays.get(edge.a.name)[day] = true;
      usedDays.get(edge.b.name)[day] = true;
      venueByDay.get(edge.a.name)[day] = edge.homeForA;
      venueByDay.get(edge.b.name)[day] = !edge.homeForA;
    }

    function remove(edgeIndex, day) {
      const edge = edges[edgeIndex];
      assignedDays[edgeIndex] = 0;
      usedDays.get(edge.a.name)[day] = false;
      usedDays.get(edge.b.name)[day] = false;
      venueByDay.get(edge.a.name)[day] = null;
      venueByDay.get(edge.b.name)[day] = null;
    }

    function domains(edgeIndex) {
      const result = [];
      for (let day = 1; day <= matchdayCount; day += 1) if (canAssign(edgeIndex, day)) result.push(day);
      return result;
    }

    function affectedTeamHasCoverage(team) {
      const incident = edgeIndexesByTeam.get(team.name);
      for (let day = 1; day <= matchdayCount; day += 1) {
        if (usedDays.get(team.name)[day]) continue;
        let found = false;
        for (const edgeIndex of incident) {
          if (!assignedDays[edgeIndex] && canAssign(edgeIndex, day)) { found = true; break; }
        }
        if (!found) return false;
      }
      return true;
    }

    function chooseNextEdge() {
      let best = null;
      for (let edgeIndex = 0; edgeIndex < edges.length; edgeIndex += 1) {
        if (assignedDays[edgeIndex]) continue;
        const edgeDomains = domains(edgeIndex);
        if (!edgeDomains.length) return { deadEnd: true };
        if (!best || edgeDomains.length < best.edgeDomains.length) {
          best = { edgeIndex, edgeDomains };
          if (edgeDomains.length === 1) break;
        }
      }
      return best;
    }

    function dayPressure(edgeIndex, day) {
      const edge = edges[edgeIndex];
      let pressure = 0;
      for (const team of [edge.a, edge.b]) {
        for (const incidentEdge of edgeIndexesByTeam.get(team.name)) {
          if (!assignedDays[incidentEdge] && canAssign(incidentEdge, day)) pressure += 1;
        }
      }
      return pressure;
    }

    function runSearch() {
      let visitedNodes = 0;
      function search() {
        visitedNodes += 1;
        if (visitedNodes > maxNodes) return false;
        const next = chooseNextEdge();
        if (!next) return true;
        if (next.deadEnd) return false;
        const orderedDays = shuffle(next.edgeDomains)
          .sort((first, second) => dayPressure(next.edgeIndex, first) - dayPressure(next.edgeIndex, second));
        const edge = edges[next.edgeIndex];
        for (const day of orderedDays) {
          place(next.edgeIndex, day);
          if (affectedTeamHasCoverage(edge.a) && affectedTeamHasCoverage(edge.b) && search()) return true;
          remove(next.edgeIndex, day);
        }
        return false;
      }
      return search();
    }

    const seedTeams = shuffle(comp.teams).slice(0, Math.min(comp.teams.length, 6));
    for (let attempt = 0; attempt < seedAttempts; attempt += 1) {
      clearAssignments();
      const seedTeam = seedTeams[attempt % seedTeams.length];
      const incident = edgeIndexesByTeam.get(seedTeam.name);
      const homeEdges = shuffle(incident.filter((edgeIndex) => homeForTeam(edges[edgeIndex], seedTeam)));
      const awayEdges = shuffle(incident.filter((edgeIndex) => !homeForTeam(edges[edgeIndex], seedTeam)));
      const patterns = shuffle(validVenuePatterns(matchdayCount, homeEdges.length));
      const pattern = patterns[attempt % patterns.length];
      if (!pattern) continue;
      let homeCursor = 0;
      let awayCursor = 0;
      let seedValid = true;
      for (let day = 1; day <= matchdayCount; day += 1) {
        const edgeIndex = pattern[day - 1] ? homeEdges[homeCursor++] : awayEdges[awayCursor++];
        if (!canAssign(edgeIndex, day)) { seedValid = false; break; }
        place(edgeIndex, day);
      }
      if (!seedValid) continue;
      if (runSearch()) {
        edges.forEach((edge, index) => {
          edge.aFixture.matchday = assignedDays[index];
          edge.bFixture.matchday = assignedDays[index];
        });
        for (const team of comp.teams) table[team.name].sort((first, second) => first.matchday - second.matchday);
        return table;
      }
    }
    return null;
  }

  function wrapEngine(baseEngine) {
    if (!baseEngine?.generateCompetitionDraw || !baseEngine?.validateCompetitionDraw) return baseEngine;
    return {
      generateCompetitionDraw(comp, options = {}) {
        const attempts = Number.isInteger(options.venueSequenceAttempts) ? options.venueSequenceAttempts : 18;
        for (let attempt = 0; attempt < attempts; attempt += 1) {
          const baseTable = cloneTable(comp, baseEngine.generateCompetitionDraw(comp, options));
          const scheduled = assignConstrainedMatchdays(comp, baseTable, options);
          if (!scheduled) continue;
          const validation = this.validateCompetitionDraw(comp, scheduled);
          if (validation.valid) return scheduled;
        }
        throw new Error('Rakipler üretildi ancak UEFA iç saha/deplasman hafta dizilimine uygun fikstür oluşturulamadı. Tekrar dene.');
      },
      validateCompetitionDraw(comp, table) {
        const baseValidation = baseEngine.validateCompetitionDraw(comp, table);
        if (!baseValidation.valid) return baseValidation;
        return validateVenueSequence(comp, table);
      }
    };
  }

  const api = { assignConstrainedMatchdays, sequenceIsValid, validateVenueSequence, wrapEngine };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined' && window.UCLDRAW_ENGINE) window.UCLDRAW_ENGINE = wrapEngine(window.UCLDRAW_ENGINE);
})();
