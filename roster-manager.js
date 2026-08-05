(() => {
  'use strict';

  const data = window.UCLDRAW_DATA;
  const bracket = window.UCLDRAW_QUALIFICATION_BRACKET;
  const coefficientData = window.UCLDRAW_CLUB_COEFFICIENTS || { clubs: {} };
  const coefficientPots = window.UCLDRAW_COEFFICIENT_POTS;

  if (!data?.competitions || !bracket?.rounds || !coefficientPots?.assignCoefficientPots) {
    throw new Error('Kadro yöneticisi için gerekli eleme verileri yüklenemedi.');
  }

  const definitions = Object.freeze({
    ucl: Object.freeze({ titleHolderSlug: 'psg' }),
    uel: Object.freeze({ titleHolderSlug: null }),
    uecl: Object.freeze({ titleHolderSlug: null })
  });
  const stagePriority = Object.freeze({ q2: 0, q3: 1, playoffs: 2, qualified: 3, guaranteed: 99 });
  const destinationRounds = Object.freeze({
    ucl: Object.freeze(['ucl-playoffs']),
    uel: Object.freeze(['ucl-playoffs', 'uel-playoffs']),
    uecl: Object.freeze(['uel-playoffs', 'uecl-playoffs'])
  });
  const roundById = new Map(bracket.rounds.map((round) => [round.id, round]));
  const tieById = new Map(bracket.rounds.flatMap((round) => round.ties.map((tie) => [tie.id, tie])));

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

  function collectLeafTeams(participant, teams, visiting) {
    if (participant?.id) {
      teams.set(participant.id, participant);
      return;
    }
    const tieId = participant?.tieId;
    if (!tieId || visiting.has(tieId)) return;
    const tie = tieById.get(tieId);
    if (!tie) throw new Error(`Eleme ağacında eşleşme bulunamadı: ${tieId}`);
    visiting.add(tieId);
    collectLeafTeams(tie.first, teams, visiting);
    collectLeafTeams(tie.second, teams, visiting);
    visiting.delete(tieId);
  }

  function qualificationCandidates(competitionId) {
    const teams = new Map();
    (destinationRounds[competitionId] || []).forEach((roundId) => {
      const round = roundById.get(roundId);
      if (!round) throw new Error(`Eleme turu bulunamadı: ${roundId}`);
      round.ties.forEach((tie) => {
        collectLeafTeams(tie.first, teams, new Set());
        collectLeafTeams(tie.second, teams, new Set());
      });
    });
    return [...teams.values()];
  }

  function teamFromDescriptor(descriptor) {
    const source = descriptor.source;
    const team = decorateCandidate({
      name: descriptor.name,
      country: descriptor.country,
      pot: 0,
      poolSlug: descriptor.poolSlug,
      coefficientSlug: descriptor.coefficientSlug || descriptor.poolSlug,
      qualificationId: descriptor.id,
      qualificationStage: source?.stage || 'qualified',
      qualificationRoute: 'candidate',
      isReserveCandidate: true
    });
    if (source) team.crest = `pools/${source.competitionKey}/${source.stage}/${source.fileSlug}`;
    return team;
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

  function isRemovable(competitionId, team) {
    if (!team || isGuaranteed(team)) return false;
    return team.poolSlug !== definitions[competitionId]?.titleHolderSlug;
  }

  function assignedRoster(competitionId, teams) {
    const competition = data.competitions[competitionId];
    if (!competition) throw new Error('Turnuva bulunamadı.');
    return coefficientPots.assignCoefficientPots(
      { ...competition, teams: teams.map(decorateCandidate) },
      definitions[competitionId]
    );
  }

  function resolveIncoming(competitionId, incomingOrSlug) {
    if (typeof incomingOrSlug === 'string') return candidateTeam(competitionId, incomingOrSlug);
    return incomingOrSlug || null;
  }

  function resolveOutgoing(competitionId, outgoingOrSlug) {
    if (typeof outgoingOrSlug === 'string') return selectedTeam(competitionId, outgoingOrSlug);
    return outgoingOrSlug || null;
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

    const beforeBySlug = new Map(competition.teams.map((team) => [team.poolSlug, team]));
    const nextTeams = competition.teams
      .filter((team) => team.poolSlug !== outgoing.poolSlug)
      .concat(decorateCandidate({ ...incoming, isReserveCandidate: false }));
    const teams = assignedRoster(competitionId, nextTeams);
    const inserted = teams.find((team) => team.poolSlug === incoming.poolSlug);
    const potChanges = teams
      .map((team) => {
        const previous = beforeBySlug.get(team.poolSlug);
        if (!previous || previous.pot === team.pot) return null;
        return Object.freeze({ team, fromPot: previous.pot, toPot: team.pot });
      })
      .filter(Boolean);

    return Object.freeze({
      competitionId,
      incoming: inserted,
      outgoing,
      incomingPot: inserted?.pot || null,
      potChanges: Object.freeze(potChanges),
      teams: Object.freeze(teams)
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

  function replacementScenarios(competitionId, incomingOrSlug) {
    const incoming = resolveIncoming(competitionId, incomingOrSlug);
    const competition = data.competitions[competitionId];
    if (!incoming || !competition || selectedTeam(competitionId, incoming.poolSlug)) return [];

    return competition.teams
      .filter((team) => isRemovable(competitionId, team))
      .map((outgoing) => simulateReplacement(competitionId, incoming, outgoing))
      .sort(sortScenarios);
  }

  function incomingScenarios(competitionId, outgoingOrSlug) {
    const outgoing = resolveOutgoing(competitionId, outgoingOrSlug);
    if (!outgoing || !isRemovable(competitionId, outgoing)) return [];

    return reserveTeams(competitionId)
      .map((incoming) => simulateReplacement(competitionId, incoming, outgoing))
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

  function replaceTeam(competitionId, incomingSlug, outgoingSlug) {
    const competition = data.competitions[competitionId];
    if (!competition) throw new Error('Turnuva bulunamadı.');
    const current = selectedTeam(competitionId, incomingSlug);
    if (current) return current;

    const scenario = simulateReplacement(competitionId, incomingSlug, outgoingSlug);
    competition.teams = [...scenario.teams];
    const inserted = selectedTeam(competitionId, incomingSlug);

    window.dispatchEvent(new CustomEvent('ucldraw:roster-changed', {
      detail: {
        competitionId,
        incoming: inserted,
        outgoing: scenario.outgoing,
        pot: inserted?.pot || null,
        potChanges: scenario.potChanges
      }
    }));

    return inserted;
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
    replaceTeam
  });
})();
