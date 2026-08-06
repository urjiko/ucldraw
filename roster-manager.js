(() => {
  'use strict';

  const data = window.UCLDRAW_DATA;
  const bracket = window.UCLDRAW_QUALIFICATION_BRACKET;
  const qualificationResult = window.UCLDRAW_QUALIFICATION_RESULT;
  const coefficientData = window.UCLDRAW_CLUB_COEFFICIENTS || { clubs: {} };
  const coefficientPots = window.UCLDRAW_COEFFICIENT_POTS;

  if (!data?.competitions || !bracket?.rounds || !qualificationResult?.rounds || !coefficientPots?.assignCoefficientPots) {
    throw new Error('Kadro yöneticisi için gerekli eleme verileri yüklenemedi.');
  }

  const STORAGE_KEY = 'ucldraw:qualification-slot-assignments:v1';
  const definitions = Object.freeze({
    ucl: Object.freeze({ titleHolderSlug: 'psg' }),
    uel: Object.freeze({ titleHolderSlug: null }),
    uecl: Object.freeze({ titleHolderSlug: null })
  });
  const stagePriority = Object.freeze({ q2: 0, q3: 1, playoffs: 2, qualified: 3, guaranteed: 99 });
  const tieById = new Map(bracket.rounds.flatMap((round) => round.ties.map((entry) => [entry.id, entry])));
  const outcomeById = new Map(Object.values(qualificationResult.rounds)
    .flat()
    .map((outcome) => [outcome.id, outcome]));
  const leafCache = new Map();

  function coefficientRecord(teamOrSlug) {
    const slug = typeof teamOrSlug === 'string'
      ? teamOrSlug
      : teamOrSlug?.coefficientSlug || teamOrSlug?.poolSlug;
    return coefficientData.clubs?.[slug] || null;
  }

  function decorateCandidate(team) {
    const record = coefficientRecord(team);
    const coefficient = Number(record?.coefficient);
    const rank = Number(record?.rank);
    return {
      ...team,
      coefficient: Number.isFinite(coefficient) ? coefficient : null,
      coefficientRank: Number.isInteger(rank) && rank > 0 ? rank : Number.POSITIVE_INFINITY,
      coefficientOfficialName: record?.officialName || null,
      coefficientMissing: !Number.isFinite(coefficient)
    };
  }

  function collectLeafIds(participant, ids, visiting) {
    if (participant?.id) {
      ids.add(participant.id);
      return;
    }
    const tieId = participant?.tieId;
    if (!tieId || visiting.has(tieId)) return;
    const tie = tieById.get(tieId);
    if (!tie) throw new Error(`Eleme ağacında eşleşme bulunamadı: ${tieId}`);
    visiting.add(tieId);
    collectLeafIds(tie.first, ids, visiting);
    collectLeafIds(tie.second, ids, visiting);
    visiting.delete(tieId);
  }

  function candidateIdsForTie(tieId) {
    if (leafCache.has(tieId)) return leafCache.get(tieId);
    const tie = tieById.get(tieId);
    if (!tie) throw new Error(`Eleme eşleşmesi bulunamadı: ${tieId}`);
    const ids = new Set();
    collectLeafIds(tie.first, ids, new Set());
    collectLeafIds(tie.second, ids, new Set());
    const result = Object.freeze([...ids]);
    leafCache.set(tieId, result);
    return result;
  }

  function createSlot(competitionId, tieId, resultKind) {
    const outcome = outcomeById.get(tieId);
    if (!outcome?.[resultKind]?.id) {
      throw new Error(`Eleme sonucu bulunamadı: ${tieId} ${resultKind}`);
    }
    return Object.freeze({
      id: `${competitionId}:${tieId}:${resultKind}`,
      competitionId,
      tieId,
      resultKind,
      candidateIds: candidateIdsForTie(tieId),
      initialTeamId: outcome[resultKind].id
    });
  }

  function buildQualificationSlots() {
    const slots = [];
    const uclQ3 = bracket.rounds.find((round) => round.id === 'ucl-q3');
    const uclPlayoffs = bracket.rounds.find((round) => round.id === 'ucl-playoffs');
    const uelPlayoffs = bracket.rounds.find((round) => round.id === 'uel-playoffs');
    const ueclPlayoffs = bracket.rounds.find((round) => round.id === 'uecl-playoffs');
    if (!uclQ3 || !uclPlayoffs || !uelPlayoffs || !ueclPlayoffs) {
      throw new Error('Eleme kontenjanlarını oluşturan turlar eksik.');
    }

    uclPlayoffs.ties.forEach((entry) => slots.push(createSlot('ucl', entry.id, 'winner')));
    uclQ3.ties
      .filter((entry) => entry.route === 'league')
      .forEach((entry) => slots.push(createSlot('uel', entry.id, 'loser')));
    uclPlayoffs.ties.forEach((entry) => slots.push(createSlot('uel', entry.id, 'loser')));
    uelPlayoffs.ties.forEach((entry) => slots.push(createSlot('uel', entry.id, 'winner')));
    uelPlayoffs.ties.forEach((entry) => slots.push(createSlot('uecl', entry.id, 'loser')));
    ueclPlayoffs.ties.forEach((entry) => slots.push(createSlot('uecl', entry.id, 'winner')));

    const counts = slots.reduce((totals, slot) => {
      totals[slot.competitionId] += 1;
      return totals;
    }, { ucl: 0, uel: 0, uecl: 0 });
    if (counts.ucl !== 7 || counts.uel !== 23 || counts.uecl !== 36) {
      throw new Error(`Eleme slotları bozuldu: UCL ${counts.ucl}, UEL ${counts.uel}, UECL ${counts.uecl}.`);
    }
    return Object.freeze(slots);
  }

  const qualificationSlots = buildQualificationSlots();
  const slotById = new Map(qualificationSlots.map((slot) => [slot.id, slot]));
  const slotsByCompetition = new Map(['ucl', 'uel', 'uecl'].map((competitionId) => [
    competitionId,
    qualificationSlots.filter((slot) => slot.competitionId === competitionId)
  ]));
  let assignmentBySlot = new Map(qualificationSlots.map((slot) => [slot.id, slot.initialTeamId]));

  function findAssignedSlot(assignments, teamId) {
    for (const [slotId, assignedId] of assignments.entries()) {
      if (assignedId === teamId) return slotId;
    }
    return null;
  }

  function validateAssignments(assignments) {
    if (!(assignments instanceof Map) || assignments.size !== qualificationSlots.length) return false;
    const assignedIds = [];
    for (const slot of qualificationSlots) {
      const teamId = assignments.get(slot.id);
      if (!teamId || !slot.candidateIds.includes(teamId)) return false;
      assignedIds.push(teamId);
    }
    return new Set(assignedIds).size === assignedIds.length;
  }

  function storedAssignments() {
    try {
      const raw = window.sessionStorage?.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const assignments = new Map(Object.entries(parsed?.assignments || {}));
      return validateAssignments(assignments) ? assignments : null;
    } catch {
      return null;
    }
  }

  function persistAssignments() {
    try {
      window.sessionStorage?.setItem(STORAGE_KEY, JSON.stringify({
        version: 1,
        bracketVersion: qualificationResult.diagnostics?.bracketVersion || null,
        assignments: Object.fromEntries(assignmentBySlot)
      }));
    } catch {
      // Session storage is optional; the in-memory roster still remains valid.
    }
  }

  function teamFromDescriptor(descriptor, slotId = null) {
    const source = descriptor.source;
    const slot = slotId ? slotById.get(slotId) : null;
    const team = decorateCandidate({
      name: descriptor.name,
      country: descriptor.country,
      pot: 0,
      poolSlug: descriptor.poolSlug,
      coefficientSlug: descriptor.coefficientSlug || descriptor.poolSlug,
      qualificationId: descriptor.id,
      qualificationSlotId: slotId,
      qualificationStage: source?.stage || 'qualified',
      qualificationRoute: slot?.competitionId || 'candidate',
      isReserveCandidate: !slotId
    });
    if (source) team.crest = `pools/${source.competitionKey}/${source.stage}/${source.fileSlug}`;
    return team;
  }

  function qualificationCandidates(competitionId) {
    const descriptors = new Map();
    (slotsByCompetition.get(competitionId) || []).forEach((slot) => {
      slot.candidateIds.forEach((teamId) => {
        const descriptor = bracket.teams[teamId];
        if (descriptor) descriptors.set(teamId, descriptor);
      });
    });
    return [...descriptors.values()];
  }

  function allTeams(competitionId) {
    const competition = data.competitions[competitionId];
    if (!competition) return [];

    const teams = [];
    const seen = new Set();
    competition.teams.forEach((team) => {
      const identity = team.qualificationId || team.poolSlug;
      if (seen.has(identity)) return;
      seen.add(identity);
      teams.push(team);
    });

    qualificationCandidates(competitionId).forEach((descriptor) => {
      if (seen.has(descriptor.id)) return;
      seen.add(descriptor.id);
      teams.push(teamFromDescriptor(descriptor));
    });

    return teams;
  }

  function selectedTeam(competitionId, slug) {
    return data.competitions[competitionId]?.teams.find((team) => team.poolSlug === slug) || null;
  }

  function candidateTeam(competitionId, slug) {
    return allTeams(competitionId).find((team) => team.poolSlug === slug) || null;
  }

  function reserveTeams(competitionId) {
    return allTeams(competitionId).filter((team) => !selectedTeam(competitionId, team.poolSlug));
  }

  function isGuaranteed(team) {
    return team?.qualificationStage === 'guaranteed';
  }

  function slotForTeam(team) {
    const explicit = team?.qualificationSlotId;
    if (explicit && slotById.has(explicit)) return slotById.get(explicit);
    const qualificationId = team?.qualificationId || team?.poolSlug;
    const slotId = qualificationId ? findAssignedSlot(assignmentBySlot, qualificationId) : null;
    return slotId ? slotById.get(slotId) : null;
  }

  function isRemovable(competitionId, team) {
    if (!team || isGuaranteed(team)) return false;
    if (team.poolSlug === definitions[competitionId]?.titleHolderSlug) return false;
    return slotForTeam(team)?.competitionId === competitionId;
  }

  function assignedRoster(competitionId, teams) {
    const competition = data.competitions[competitionId];
    if (!competition) throw new Error('Turnuva bulunamadı.');
    return coefficientPots.assignCoefficientPots(
      { ...competition, teams: teams.map(decorateCandidate) },
      definitions[competitionId]
    );
  }

  function buildCompetitionRoster(competitionId, assignments) {
    const competition = data.competitions[competitionId];
    if (!competition) throw new Error('Turnuva bulunamadı.');
    const guaranteed = competition.teams.filter(isGuaranteed);
    const qualifiers = (slotsByCompetition.get(competitionId) || []).map((slot) => {
      const teamId = assignments.get(slot.id);
      const descriptor = bracket.teams[teamId];
      if (!descriptor) throw new Error(`Eleme takımı bulunamadı: ${teamId}`);
      return teamFromDescriptor(descriptor, slot.id);
    });
    const roster = assignedRoster(competitionId, [...guaranteed, ...qualifiers]);
    if (roster.length !== 36 || new Set(roster.map((team) => team.qualificationId || team.poolSlug)).size !== 36) {
      throw new Error(`${competitionId} kadrosu eleme slotlarından doğru üretilemedi.`);
    }
    return roster;
  }

  function buildAllRosters(assignments) {
    return Object.freeze(Object.fromEntries(['ucl', 'uel', 'uecl'].map((competitionId) => [
      competitionId,
      Object.freeze(buildCompetitionRoster(competitionId, assignments))
    ])));
  }

  function candidateOrder(slot, assignments, preferredTeamId) {
    const original = assignmentBySlot.get(slot.id);
    const unused = slot.candidateIds.filter((teamId) => !findAssignedSlot(assignments, teamId));
    return [...new Set([
      preferredTeamId,
      original,
      ...unused,
      ...slot.candidateIds
    ].filter(Boolean))];
  }

  function fillVacancy(slotId, assignments, preferredTeamId, lockedSlots, path = new Set()) {
    if (path.has(slotId)) return false;
    const slot = slotById.get(slotId);
    if (!slot) return false;
    const nextPath = new Set(path).add(slotId);

    for (const teamId of candidateOrder(slot, assignments, preferredTeamId)) {
      if (!slot.candidateIds.includes(teamId)) continue;
      const occupiedSlotId = findAssignedSlot(assignments, teamId);
      if (!occupiedSlotId) {
        assignments.set(slotId, teamId);
        return true;
      }
      if (occupiedSlotId === slotId || lockedSlots.has(occupiedSlotId) || nextPath.has(occupiedSlotId)) continue;

      assignments.set(slotId, teamId);
      assignments.delete(occupiedSlotId);
      if (fillVacancy(occupiedSlotId, assignments, preferredTeamId, lockedSlots, nextPath)) return true;
      assignments.delete(slotId);
      assignments.set(occupiedSlotId, teamId);
    }
    return false;
  }

  function solveSlotReplacement(targetSlotId, incomingId) {
    const targetSlot = slotById.get(targetSlotId);
    if (!targetSlot) throw new Error('Değiştirilecek eleme kontenjanı bulunamadı.');
    if (!targetSlot.candidateIds.includes(incomingId)) {
      throw new Error('Bu takım seçilen takımın eleme yolundaki aynı kontenjana ulaşamaz.');
    }

    const outgoingId = assignmentBySlot.get(targetSlotId);
    if (outgoingId === incomingId) {
      return Object.freeze({
        targetSlotId,
        incomingId,
        outgoingId,
        assignments: Object.freeze(Object.fromEntries(assignmentBySlot)),
        changes: Object.freeze([])
      });
    }

    const next = new Map(assignmentBySlot);
    const sourceSlotId = findAssignedSlot(next, incomingId);
    next.set(targetSlotId, incomingId);

    if (sourceSlotId && sourceSlotId !== targetSlotId) {
      next.delete(sourceSlotId);
      const filled = fillVacancy(sourceSlotId, next, outgoingId, new Set([targetSlotId]));
      if (!filled) {
        throw new Error('Bu değişiklik eleme ağacındaki diğer kontenjanlarla birlikte çözülemiyor.');
      }
    }

    if (!validateAssignments(next)) {
      throw new Error('Eleme ağacı değişiklikten sonra geçerli bir takım dağılımı üretemedi.');
    }

    const changes = qualificationSlots
      .filter((slot) => assignmentBySlot.get(slot.id) !== next.get(slot.id))
      .map((slot) => Object.freeze({
        slotId: slot.id,
        competitionId: slot.competitionId,
        fromTeamId: assignmentBySlot.get(slot.id),
        toTeamId: next.get(slot.id)
      }));

    return Object.freeze({
      targetSlotId,
      sourceSlotId,
      incomingId,
      outgoingId,
      assignments: Object.freeze(Object.fromEntries(next)),
      changes: Object.freeze(changes)
    });
  }

  function resolveIncoming(competitionId, incomingOrSlug) {
    if (typeof incomingOrSlug === 'string') return candidateTeam(competitionId, incomingOrSlug);
    return incomingOrSlug || null;
  }

  function resolveOutgoing(competitionId, outgoingOrSlug) {
    if (typeof outgoingOrSlug === 'string') return selectedTeam(competitionId, outgoingOrSlug);
    return outgoingOrSlug || null;
  }

  function potChangesFor(beforeTeams, afterTeams) {
    const beforeById = new Map(beforeTeams.map((team) => [team.qualificationId || team.poolSlug, team]));
    return afterTeams
      .map((team) => {
        const identity = team.qualificationId || team.poolSlug;
        const previous = beforeById.get(identity);
        if (!previous || previous.pot === team.pot) return null;
        return Object.freeze({ team, fromPot: previous.pot, toPot: team.pot });
      })
      .filter(Boolean);
  }

  function simulateReplacement(competitionId, incomingOrSlug, outgoingOrSlug) {
    const competition = data.competitions[competitionId];
    const incoming = resolveIncoming(competitionId, incomingOrSlug);
    const outgoing = resolveOutgoing(competitionId, outgoingOrSlug);

    if (!competition || !incoming) throw new Error('Eklenecek takım bulunamadı.');
    if (!outgoing) throw new Error('Çıkarılacak takım mevcut kadroda değil.');
    if (selectedTeam(competitionId, incoming.poolSlug)) throw new Error('Bu takım zaten mevcut kadroda.');
    if (!isRemovable(competitionId, outgoing)) {
      throw new Error('Garanti katılımcılar kadrodan çıkarılamaz.');
    }

    const outgoingSlot = slotForTeam(outgoing);
    const incomingId = incoming.qualificationId || incoming.poolSlug;
    const solution = solveSlotReplacement(outgoingSlot.id, incomingId);
    const assignments = new Map(Object.entries(solution.assignments));
    const competitionUpdates = buildAllRosters(assignments);
    const targetTeams = competitionUpdates[competitionId];
    const inserted = targetTeams.find((team) => (team.qualificationId || team.poolSlug) === incomingId);
    const potChangesByCompetition = Object.freeze(Object.fromEntries(['ucl', 'uel', 'uecl'].map((id) => [
      id,
      Object.freeze(potChangesFor(data.competitions[id].teams, competitionUpdates[id]))
    ])));

    return Object.freeze({
      competitionId,
      incoming: inserted,
      outgoing,
      incomingPot: inserted?.pot || null,
      potChanges: potChangesByCompetition[competitionId],
      potChangesByCompetition,
      teams: targetTeams,
      competitionUpdates,
      affectedCompetitionIds: Object.freeze([...new Set(solution.changes.map((change) => change.competitionId))]),
      slotChanges: solution.changes,
      slotSolution: solution
    });
  }

  function sortScenarios(first, second) {
    const firstStage = stagePriority[first.outgoing.qualificationStage] ?? 50;
    const secondStage = stagePriority[second.outgoing.qualificationStage] ?? 50;
    return first.incomingPot - second.incomingPot
      || firstStage - secondStage
      || first.outgoing.pot - second.outgoing.pot
      || (first.outgoing.coefficient || 0) - (second.outgoing.coefficient || 0)
      || first.outgoing.name.localeCompare(second.outgoing.name, 'tr');
  }

  function safeScenario(competitionId, incoming, outgoing) {
    try {
      return simulateReplacement(competitionId, incoming, outgoing);
    } catch {
      return null;
    }
  }

  function replacementScenarios(competitionId, incomingOrSlug) {
    const incoming = resolveIncoming(competitionId, incomingOrSlug);
    const competition = data.competitions[competitionId];
    if (!incoming || !competition || selectedTeam(competitionId, incoming.poolSlug)) return [];
    const incomingId = incoming.qualificationId || incoming.poolSlug;

    return competition.teams
      .filter((team) => {
        if (!isRemovable(competitionId, team)) return false;
        return slotForTeam(team)?.candidateIds.includes(incomingId);
      })
      .map((outgoing) => safeScenario(competitionId, incoming, outgoing))
      .filter(Boolean)
      .sort(sortScenarios);
  }

  function incomingScenarios(competitionId, outgoingOrSlug) {
    const outgoing = resolveOutgoing(competitionId, outgoingOrSlug);
    if (!outgoing || !isRemovable(competitionId, outgoing)) return [];
    const slot = slotForTeam(outgoing);

    return slot.candidateIds
      .map((teamId) => bracket.teams[teamId])
      .filter(Boolean)
      .map((descriptor) => teamFromDescriptor(descriptor))
      .filter((incoming) => !selectedTeam(competitionId, incoming.poolSlug))
      .map((incoming) => safeScenario(competitionId, incoming, outgoing))
      .filter(Boolean)
      .sort((first, second) => first.incomingPot - second.incomingPot
        || (second.incoming.coefficient || 0) - (first.incoming.coefficient || 0)
        || first.incoming.name.localeCompare(second.incoming.name, 'tr'));
  }

  function possiblePots(competitionId, incomingOrSlug) {
    const incoming = resolveIncoming(competitionId, incomingOrSlug);
    const selected = incoming && selectedTeam(competitionId, incoming.poolSlug);
    if (selected) return [selected.pot];
    return [...new Set(replacementScenarios(competitionId, incoming).map((scenario) => scenario.incomingPot))]
      .sort((first, second) => first - second);
  }

  function projectedPot(competitionId, incomingOrSlug) {
    return possiblePots(competitionId, incomingOrSlug)[0] || null;
  }

  function replacementCandidates(competitionId, incomingOrSlug) {
    return replacementScenarios(competitionId, incomingOrSlug).map((scenario) => scenario.outgoing);
  }

  function applyAssignments(assignments, persist = true) {
    if (!validateAssignments(assignments)) throw new Error('Geçersiz eleme slotu dağılımı uygulanamaz.');
    const rosters = buildAllRosters(assignments);
    ['ucl', 'uel', 'uecl'].forEach((competitionId) => {
      data.competitions[competitionId].teams = [...rosters[competitionId]];
    });
    assignmentBySlot = new Map(assignments);
    if (persist) persistAssignments();
    return rosters;
  }

  function replaceTeam(competitionId, incomingSlug, outgoingSlug) {
    const competition = data.competitions[competitionId];
    if (!competition) throw new Error('Turnuva bulunamadı.');
    const current = selectedTeam(competitionId, incomingSlug);
    if (current) return current;

    const scenario = simulateReplacement(competitionId, incomingSlug, outgoingSlug);
    const assignments = new Map(Object.entries(scenario.slotSolution.assignments));
    applyAssignments(assignments, true);
    const inserted = selectedTeam(competitionId, incomingSlug);

    window.dispatchEvent(new CustomEvent('ucldraw:roster-changed', {
      detail: {
        competitionId,
        incoming: inserted,
        outgoing: scenario.outgoing,
        pot: inserted?.pot || null,
        potChanges: scenario.potChanges,
        potChangesByCompetition: scenario.potChangesByCompetition,
        affectedCompetitionIds: scenario.affectedCompetitionIds,
        slotChanges: scenario.slotChanges
      }
    }));

    return inserted;
  }

  const restored = storedAssignments();
  if (restored) applyAssignments(restored, false);
  else {
    qualificationSlots.forEach((slot) => {
      const team = data.competitions[slot.competitionId].teams
        .find((candidate) => candidate.qualificationId === assignmentBySlot.get(slot.id));
      if (team) team.qualificationSlotId = slot.id;
    });
    persistAssignments();
  }

  window.UCLDRAW_ROSTER_MANAGER = Object.freeze({
    allTeams,
    reserveTeams,
    candidateTeam,
    selectedTeam,
    isGuaranteed,
    isRemovable,
    simulateReplacement,
    replacementScenarios,
    incomingScenarios,
    possiblePots,
    projectedPot,
    replacementCandidates,
    replaceTeam,
    qualificationSlots,
    slotForTeam,
    solveSlotReplacement
  });
})();