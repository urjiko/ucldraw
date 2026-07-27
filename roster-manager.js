(() => {
  'use strict';

  const data = window.UCLDRAW_DATA;
  const manifest = window.UCLDRAW_POOL_MANIFEST;
  const coefficientData = window.UCLDRAW_CLUB_COEFFICIENTS || { clubs: {} };
  const coefficientPots = window.UCLDRAW_COEFFICIENT_POTS;

  if (!data?.competitions || !manifest || !coefficientPots?.assignCoefficientPots) {
    throw new Error('Kadro yöneticisi için gerekli veriler yüklenemedi.');
  }

  const competitionKeys = Object.freeze({
    ucl: 'champions',
    uel: 'europa',
    uecl: 'conference'
  });
  const stages = Object.freeze(['guaranteed', 'playoffs', 'q3', 'q2']);
  const definitions = Object.freeze({
    ucl: Object.freeze({ titleHolderSlug: 'psg' }),
    uel: Object.freeze({ titleHolderSlug: null }),
    uecl: Object.freeze({ titleHolderSlug: null })
  });
  const stagePriority = Object.freeze({ q2: 0, q3: 1, playoffs: 2, placeholder: 3, guaranteed: 99 });

  function slugFromEntry(entry) {
    const file = typeof entry === 'string' ? entry : entry.file;
    return String(typeof entry === 'string' ? file.replace(/\.png$/i, '') : entry.slug)
      .toLocaleLowerCase('en-US');
  }

  function fileFromEntry(entry) {
    return typeof entry === 'string' ? entry : entry.file;
  }

  function humanizeSlug(slug) {
    return String(slug)
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toLocaleUpperCase('tr-TR'));
  }

  function coefficientRecord(slug) {
    return coefficientData.clubs?.[slug] || null;
  }

  function decorateCandidate(team) {
    const record = coefficientRecord(team.poolSlug);
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

  function allTeams(competitionId) {
    const competition = data.competitions[competitionId];
    const competitionKey = competitionKeys[competitionId];
    const source = manifest[competitionKey];
    if (!competition || !source) return [];

    const selectedBySlug = new Map(competition.teams.map((team) => [team.poolSlug, team]));
    const teams = [];
    const seen = new Set();

    stages.forEach((stage) => {
      (source[stage] || []).forEach((entry) => {
        const slug = slugFromEntry(entry);
        if (seen.has(slug)) return;
        seen.add(slug);

        const selected = selectedBySlug.get(slug);
        if (selected) {
          teams.push(selected);
          return;
        }

        const file = fileFromEntry(entry);
        const fileStem = String(file).replace(/\.png$/i, '');
        const record = coefficientRecord(slug);
        teams.push(decorateCandidate({
          name: record?.officialName || humanizeSlug(slug),
          country: record?.country || '---',
          pot: 0,
          crest: `pools/${competitionKey}/${stage}/${fileStem}`,
          poolSlug: slug,
          qualificationStage: stage,
          isReserveCandidate: true
        }));
      });
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
        return Object.freeze({
          team,
          fromPot: previous.pot,
          toPot: team.pot
        });
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
