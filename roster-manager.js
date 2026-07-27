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

  function compareTeams(competitionId, first, second) {
    const titleHolderSlug = definitions[competitionId]?.titleHolderSlug;
    const firstTitleHolder = titleHolderSlug && first.poolSlug === titleHolderSlug;
    const secondTitleHolder = titleHolderSlug && second.poolSlug === titleHolderSlug;
    if (firstTitleHolder !== secondTitleHolder) return firstTitleHolder ? -1 : 1;

    const firstKnown = Number.isFinite(first.coefficient);
    const secondKnown = Number.isFinite(second.coefficient);
    if (firstKnown !== secondKnown) return firstKnown ? -1 : 1;
    if (firstKnown && secondKnown && second.coefficient !== first.coefficient) {
      return second.coefficient - first.coefficient;
    }
    if (first.coefficientRank !== second.coefficientRank) {
      return first.coefficientRank - second.coefficientRank;
    }
    return first.name.localeCompare(second.name, 'tr');
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

  function projectedPot(competitionId, incoming) {
    const competition = data.competitions[competitionId];
    if (!competition || !incoming) return null;
    const selected = selectedTeam(competitionId, incoming.poolSlug);
    if (selected) return selected.pot;

    const capacity = competition.teams.length / competition.potCount;
    const ordered = [
      ...competition.teams.map(decorateCandidate),
      decorateCandidate(incoming)
    ].sort((first, second) => compareTeams(competitionId, first, second));
    const index = ordered.findIndex((team) => team.poolSlug === incoming.poolSlug);
    return Math.min(competition.potCount, Math.floor(index / capacity) + 1);
  }

  function replacementCandidates(competitionId, incoming) {
    const competition = data.competitions[competitionId];
    const pot = projectedPot(competitionId, incoming);
    const protectedSlug = definitions[competitionId]?.titleHolderSlug;
    if (!competition || !pot) return [];

    return competition.teams
      .filter((team) => team.pot === pot && team.poolSlug !== protectedSlug)
      .sort((first, second) => {
        const firstGuaranteed = first.qualificationStage === 'guaranteed';
        const secondGuaranteed = second.qualificationStage === 'guaranteed';
        return Number(firstGuaranteed) - Number(secondGuaranteed)
          || (first.coefficient || 0) - (second.coefficient || 0)
          || first.name.localeCompare(second.name, 'tr');
      });
  }

  function replaceTeam(competitionId, incomingSlug, outgoingSlug) {
    const competition = data.competitions[competitionId];
    const incoming = candidateTeam(competitionId, incomingSlug);
    const outgoing = selectedTeam(competitionId, outgoingSlug);
    const protectedSlug = definitions[competitionId]?.titleHolderSlug;

    if (!competition || !incoming) throw new Error('Eklenecek takım bulunamadı.');
    if (!outgoing) throw new Error('Çıkarılacak takım mevcut kadroda değil.');
    if (incoming.poolSlug === outgoing.poolSlug) return outgoing;
    if (outgoing.poolSlug === protectedSlug) throw new Error('Şampiyon takım Pot 1 seri başı olarak kadroda kalmalı.');
    if (selectedTeam(competitionId, incoming.poolSlug)) return selectedTeam(competitionId, incoming.poolSlug);

    const nextTeams = competition.teams
      .filter((team) => team.poolSlug !== outgoing.poolSlug)
      .concat(decorateCandidate({ ...incoming, isReserveCandidate: false }));

    const nextCompetition = { ...competition, teams: nextTeams };
    competition.teams = coefficientPots.assignCoefficientPots(nextCompetition, definitions[competitionId]);
    const inserted = selectedTeam(competitionId, incoming.poolSlug);

    window.dispatchEvent(new CustomEvent('ucldraw:roster-changed', {
      detail: {
        competitionId,
        incoming: inserted,
        outgoing,
        pot: inserted?.pot || null
      }
    }));

    return inserted;
  }

  window.UCLDRAW_ROSTER_MANAGER = Object.freeze({
    allTeams,
    candidateTeam,
    selectedTeam,
    projectedPot,
    replacementCandidates,
    replaceTeam
  });
})();
