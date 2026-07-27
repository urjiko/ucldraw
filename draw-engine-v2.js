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

  function assertCompetitionShape(comp) {
    if (!comp || !Array.isArray(comp.teams) || !Number.isInteger(comp.potCount) || !Number.isInteger(comp.opponentsPerPot)) {
      throw new Error('Turnuva verisi eksik veya geçersiz.');
    }
    const potSizes = [];
    for (let pot = 1; pot <= comp.potCount; pot += 1) {
      const size = comp.teams.filter((team) => team.pot === pot).length;
      if (!size) throw new Error(`Pot ${pot} boş bırakılamaz.`);
      potSizes.push(size);
    }
    if (new Set(potSizes).size !== 1) throw new Error('Bütün torbalarda eşit sayıda takım olmalı.');
    const matchdayCount = comp.potCount * comp.opponentsPerPot;
    if ((comp.teams.length * matchdayCount) % 2 !== 0) {
      throw new Error('Takım ve torba yapısı karşılıklı eşleşme üretmeye uygun değil.');
    }
  }

  function createMaps(comp) {
    const needs = new Map();
    const opponents = new Map();
    const associations = new Map();
    comp.teams.forEach((team) => {
      const teamNeeds = Array(comp.potCount + 1).fill(0);
      for (let pot = 1; pot <= comp.potCount; pot += 1) teamNeeds[pot] = comp.opponentsPerPot;
      needs.set(team.name, teamNeeds);
      opponents.set(team.name, new Set());
      associations.set(team.name, new Map());
    });
    return { needs, opponents, associations };
  }

  function associationCount(associations, teamName, country) {
    return associations.get(teamName).get(country) || 0;
  }

  function candidateList(comp, maps, team, targetPot) {
    const { needs, opponents, associations } = maps;
    return comp.teams.filter((candidate) => {
      if (candidate.pot !== targetPot) return false;
      if (candidate === team || candidate.country === team.country) return false;
      if (opponents.get(team.name).has(candidate.name)) return false;
      if (needs.get(team.name)[targetPot] <= 0) return false;
      if (needs.get(candidate.name)[team.pot] <= 0) return false;
      if (associationCount(associations, team.name, candidate.country) >= 2) return false;
      if (associationCount(associations, candidate.name, team.country) >= 2) return false;
      return true;
    });
  }

  function placeEdge(maps, team, candidate, edges) {
    const { needs, opponents, associations } = maps;
    needs.get(team.name)[candidate.pot] -= 1;
    needs.get(candidate.name)[team.pot] -= 1;
    opponents.get(team.name).add(candidate.name);
    opponents.get(candidate.name).add(team.name);
    associations.get(team.name).set(candidate.country, associationCount(associations, team.name, candidate.country) + 1);
    associations.get(candidate.name).set(team.country, associationCount(associations, candidate.name, team.country) + 1);
    edges.push({ a: team, b: candidate });
  }

  function remainingEdgeCount(comp) {
    return (comp.teams.length * comp.potCount * comp.opponentsPerPot) / 2;
  }

  function chooseNextSlot(comp, maps) {
    const { needs } = maps;
    let best = null;
    for (const team of shuffle(comp.teams)) {
      for (let targetPot = 1; targetPot <= comp.potCount; targetPot += 1) {
        if (needs.get(team.name)[targetPot] <= 0) continue;
        const candidates = candidateList(comp, maps, team, targetPot);
        if (!candidates.length) return { deadEnd: true };
        if (!best || candidates.length < best.candidates.length) {
          best = { team, targetPot, candidates };
          if (candidates.length === 1) return best;
        }
      }
    }
    return best;
  }

  function candidateScore(comp, maps, team, candidate) {
    const reverseNeed = maps.needs.get(candidate.name)[team.pot];
    const associationPressure = associationCount(maps.associations, team.name, candidate.country)
      + associationCount(maps.associations, candidate.name, team.country);
    const reverseCandidates = candidateList(comp, maps, candidate, team.pot).length;
    return reverseCandidates * 100 + reverseNeed * 8 + associationPressure * 5 + Math.random() * 3;
  }

  function buildEdges(comp, maxAttempts) {
    const targetEdges = remainingEdgeCount(comp);
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const maps = createMaps(comp);
      const edges = [];
      let failed = false;
      while (edges.length < targetEdges) {
        const slot = chooseNextSlot(comp, maps);
        if (!slot || slot.deadEnd) { failed = true; break; }
        const ordered = shuffle(slot.candidates)
          .sort((first, second) => candidateScore(comp, maps, slot.team, first) - candidateScore(comp, maps, slot.team, second));
        const poolSize = Math.min(ordered.length, attempt < 80 ? 2 : 4);
        const candidate = ordered[Math.floor(Math.random() * poolSize)];
        placeEdge(maps, slot.team, candidate, edges);
      }
      if (!failed && edges.length === targetEdges) return edges;
    }
    throw new Error('Tüm takımlar için kurallara uygun kura üretilemedi. Takım ve ülke dağılımını kontrol et.');
  }

  function venueConstraintGroups(comp) {
    if (comp.potCount === 4 && comp.opponentsPerPot === 2) {
      return Array.from({ length: comp.potCount }, (_, index) => [index + 1]);
    }
    if (comp.potCount === 6 && comp.opponentsPerPot === 1) return [[1, 2], [3, 4], [5, 6]];
    throw new Error('Bu turnuva yapısı için iç saha/deplasman kuralı tanımlı değil.');
  }

  function orientEdges(comp, edges) {
    const edgeIndexesByTeam = new Map(comp.teams.map((team) => [team.name, []]));
    edges.forEach((edge, index) => {
      edgeIndexesByTeam.get(edge.a.name).push(index);
      edgeIndexesByTeam.get(edge.b.name).push(index);
    });

    const graph = Array.from({ length: edges.length }, () => []);
    const groups = venueConstraintGroups(comp);
    function teamIsSecond(edge, team) { return edge.b === team ? 1 : 0; }

    for (const team of comp.teams) {
      const incident = edgeIndexesByTeam.get(team.name);
      for (const potGroup of groups) {
        const groupEdges = incident.filter((edgeIndex) => {
          const edge = edges[edgeIndex];
          const opponent = edge.a === team ? edge.b : edge.a;
          return potGroup.includes(opponent.pot);
        });
        if (groupEdges.length !== 2) return null;
        const [firstEdgeIndex, secondEdgeIndex] = groupEdges;
        const parity = 1 ^ teamIsSecond(edges[firstEdgeIndex], team) ^ teamIsSecond(edges[secondEdgeIndex], team);
        graph[firstEdgeIndex].push([secondEdgeIndex, parity]);
        graph[secondEdgeIndex].push([firstEdgeIndex, parity]);
      }
    }

    const values = Array(edges.length).fill(null);
    for (let start = 0; start < edges.length; start += 1) {
      if (values[start] !== null) continue;
      values[start] = Math.random() < 0.5 ? 0 : 1;
      const queue = [start];
      while (queue.length) {
        const current = queue.shift();
        for (const [next, parity] of graph[current]) {
          const expected = values[current] ^ parity;
          if (values[next] === null) {
            values[next] = expected;
            queue.push(next);
          } else if (values[next] !== expected) return null;
        }
      }
    }
    return values;
  }

  function assignMatchdays(comp, edges, nodeLimit = 500000) {
    const matchdayCount = comp.potCount * comp.opponentsPerPot;
    const rowColumns = new Map();
    const columnRows = new Map();

    function addColumnRow(column, rowId) {
      if (!columnRows.has(column)) columnRows.set(column, new Set());
      columnRows.get(column).add(rowId);
    }

    edges.forEach((edge, edgeIndex) => {
      for (let matchday = 1; matchday <= matchdayCount; matchday += 1) {
        const rowId = `${edgeIndex}:${matchday}`;
        const columns = [
          `edge:${edgeIndex}`,
          `team:${edge.a.name}:day:${matchday}`,
          `team:${edge.b.name}:day:${matchday}`
        ];
        rowColumns.set(rowId, columns);
        columns.forEach((column) => addColumnRow(column, rowId));
      }
    });

    const activeColumns = new Set(columnRows.keys());
    const activeRows = new Set(rowColumns.keys());
    const solution = [];
    let visitedNodes = 0;

    function activeOptionCount(column) {
      let count = 0;
      for (const rowId of columnRows.get(column)) if (activeRows.has(rowId)) count += 1;
      return count;
    }

    function search() {
      visitedNodes += 1;
      if (visitedNodes > nodeLimit) return false;
      if (!activeColumns.size) return true;

      let chosenColumn = null;
      let smallestCount = Infinity;
      for (const column of activeColumns) {
        const count = activeOptionCount(column);
        if (!count) return false;
        if (count < smallestCount) {
          chosenColumn = column;
          smallestCount = count;
          if (count === 1) break;
        }
      }

      const options = shuffle([...columnRows.get(chosenColumn)].filter((rowId) => activeRows.has(rowId)));
      for (const rowId of options) {
        const removedColumns = [];
        const removedRows = [];
        for (const column of rowColumns.get(rowId)) {
          if (!activeColumns.has(column)) continue;
          activeColumns.delete(column);
          removedColumns.push(column);
          for (const conflictingRow of columnRows.get(column)) {
            if (!activeRows.has(conflictingRow)) continue;
            activeRows.delete(conflictingRow);
            removedRows.push(conflictingRow);
          }
        }
        solution.push(rowId);
        if (search()) return true;
        solution.pop();
        for (let index = removedRows.length - 1; index >= 0; index -= 1) activeRows.add(removedRows[index]);
        for (let index = removedColumns.length - 1; index >= 0; index -= 1) activeColumns.add(removedColumns[index]);
      }
      return false;
    }

    if (!search()) return null;
    const matchdays = Array(edges.length).fill(null);
    solution.forEach((rowId) => {
      const [edgeIndex, matchday] = rowId.split(':').map(Number);
      matchdays[edgeIndex] = matchday;
    });
    return matchdays;
  }

  function createTable(comp, edges, orientation, matchdays) {
    const table = Object.fromEntries(comp.teams.map((team) => [team.name, []]));
    edges.forEach((edge, index) => {
      const aHome = orientation[index] === 1;
      const matchday = matchdays[index];
      table[edge.a.name].push({ opponent: edge.b, pot: edge.b.pot, home: aHome, matchday });
      table[edge.b.name].push({ opponent: edge.a, pot: edge.a.pot, home: !aHome, matchday });
    });
    comp.teams.forEach((team) => {
      table[team.name].sort((first, second) => first.matchday - second.matchday);
    });
    return table;
  }

  function validateCompetitionDraw(comp, table) {
    const expectedCount = comp.potCount * comp.opponentsPerPot;
    const groups = venueConstraintGroups(comp);
    const matchdayPairs = Array.from({ length: expectedCount + 1 }, () => new Set());

    for (const team of comp.teams) {
      const fixtures = table[team.name];
      if (!Array.isArray(fixtures) || fixtures.length !== expectedCount) {
        return { valid: false, reason: `${team.name}: rakip sayısı hatalı.` };
      }
      const opponentNames = fixtures.map((fixture) => fixture.opponent.name);
      if (new Set(opponentNames).size !== opponentNames.length) return { valid: false, reason: `${team.name}: tekrar eden rakip var.` };
      if (fixtures.some((fixture) => fixture.opponent.country === team.country)) return { valid: false, reason: `${team.name}: aynı ülkeden rakip var.` };

      const matchdays = fixtures.map((fixture) => fixture.matchday);
      if (matchdays.some((day) => !Number.isInteger(day) || day < 1 || day > expectedCount)) {
        return { valid: false, reason: `${team.name}: maç haftası hatalı.` };
      }
      if (new Set(matchdays).size !== expectedCount) return { valid: false, reason: `${team.name}: aynı haftada birden fazla maç var.` };

      const associationCounts = {};
      fixtures.forEach((fixture) => { associationCounts[fixture.opponent.country] = (associationCounts[fixture.opponent.country] || 0) + 1; });
      if (Object.values(associationCounts).some((count) => count > 2)) return { valid: false, reason: `${team.name}: federasyon sınırı aşıldı.` };

      for (let pot = 1; pot <= comp.potCount; pot += 1) {
        if (fixtures.filter((fixture) => fixture.pot === pot).length !== comp.opponentsPerPot) {
          return { valid: false, reason: `${team.name}: Pot ${pot} dağılımı hatalı.` };
        }
      }
      for (const group of groups) {
        const groupFixtures = fixtures.filter((fixture) => group.includes(fixture.pot));
        if (groupFixtures.length !== 2 || groupFixtures.filter((fixture) => fixture.home).length !== 1) {
          return { valid: false, reason: `${team.name}: iç saha/deplasman dengesi hatalı.` };
        }
      }
      for (const fixture of fixtures) {
        const reciprocal = table[fixture.opponent.name]?.find((other) => other.opponent === team);
        if (!reciprocal || reciprocal.home === fixture.home || reciprocal.matchday !== fixture.matchday) {
          return { valid: false, reason: `${team.name}: karşılıklı eşleşme veya hafta tutarsız.` };
        }
        const pairKey = [team.name, fixture.opponent.name].sort().join('::');
        matchdayPairs[fixture.matchday].add(pairKey);
      }
    }

    const expectedMatchesPerDay = comp.teams.length / 2;
    for (let matchday = 1; matchday <= expectedCount; matchday += 1) {
      if (matchdayPairs[matchday].size !== expectedMatchesPerDay) {
        return { valid: false, reason: `Hafta ${matchday}: maç sayısı hatalı.` };
      }
    }
    return { valid: true, reason: '' };
  }

  function generateCompetitionDraw(comp, options = {}) {
    assertCompetitionShape(comp);
    const maxAttempts = Number.isInteger(options.maxAttempts) ? options.maxAttempts : 900;
    const scheduleAttempts = Number.isInteger(options.scheduleAttempts) ? options.scheduleAttempts : 60;
    for (let attempt = 0; attempt < scheduleAttempts; attempt += 1) {
      const edges = buildEdges(comp, maxAttempts);
      const matchdays = assignMatchdays(comp, edges);
      if (!matchdays) continue;
      const orientation = orientEdges(comp, edges);
      if (!orientation) continue;
      const table = createTable(comp, edges, orientation, matchdays);
      const validation = validateCompetitionDraw(comp, table);
      if (validation.valid) return table;
    }
    throw new Error('Rakipler üretildi ancak bütün takımlar için çakışmasız maç haftaları oluşturulamadı. Tekrar dene.');
  }

  const api = { generateCompetitionDraw, validateCompetitionDraw };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.UCLDRAW_ENGINE = api;
})();
