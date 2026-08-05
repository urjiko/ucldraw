(() => {
  'use strict';

  const data = window.UCLDRAW_DATA;
  const coefficientData = window.UCLDRAW_CLUB_COEFFICIENTS || { clubs: {} };

  if (!data?.competitions) throw new Error('Turnuva verisi yüklenemedi.');

  const definitions = Object.freeze({
    ucl: Object.freeze({ titleHolderSlug: 'psg' }),
    uel: Object.freeze({ titleHolderSlug: null }),
    uecl: Object.freeze({ titleHolderSlug: null })
  });

  // Kassiesa uses Bls/Sma association codes; these two reviewed rows keep
  // their exact 2026 coefficients even before the next generated alias refresh.
  const reviewedFallbacks = Object.freeze({
    dinamominsk: Object.freeze({
      coefficient: 6.5,
      rank: 232,
      officialName: 'Dinamo Minsk',
      country: 'BLR'
    }),
    fiori: Object.freeze({
      coefficient: 2.5,
      rank: 377,
      officialName: 'Tre Fiori',
      country: 'SMR'
    })
  });

  function recordFor(team) {
    const coefficientSlug = team.coefficientSlug || team.poolSlug;
    return coefficientData.clubs?.[coefficientSlug] || reviewedFallbacks[coefficientSlug] || null;
  }

  function coefficientFor(team) {
    const coefficient = Number(recordFor(team)?.coefficient);
    return Number.isFinite(coefficient) ? coefficient : null;
  }

  function rankFor(team) {
    const rank = Number(recordFor(team)?.rank);
    return Number.isInteger(rank) && rank > 0 ? rank : Number.POSITIVE_INFINITY;
  }

  function assignCoefficientPots(competition, definition) {
    const capacity = competition.teams.length / competition.potCount;
    if (!Number.isInteger(capacity)) {
      throw new Error(`${competition.teams.length} takım ${competition.potCount} eşit torbaya ayrılamıyor.`);
    }

    const decorated = competition.teams.map((team) => {
      const record = recordFor(team);
      const coefficient = coefficientFor(team);
      return {
        ...team,
        coefficient,
        coefficientRank: rankFor(team),
        coefficientOfficialName: record?.officialName || null,
        coefficientMissing: coefficient === null
      };
    });

    decorated.sort((first, second) => {
      const firstTitleHolder = definition.titleHolderSlug && first.poolSlug === definition.titleHolderSlug;
      const secondTitleHolder = definition.titleHolderSlug && second.poolSlug === definition.titleHolderSlug;
      if (firstTitleHolder !== secondTitleHolder) return firstTitleHolder ? -1 : 1;

      const firstKnown = first.coefficient !== null;
      const secondKnown = second.coefficient !== null;
      if (firstKnown !== secondKnown) return firstKnown ? -1 : 1;
      if (firstKnown && secondKnown && second.coefficient !== first.coefficient) {
        return second.coefficient - first.coefficient;
      }
      if (first.coefficientRank !== second.coefficientRank) {
        return first.coefficientRank - second.coefficientRank;
      }
      return first.name.localeCompare(second.name, 'tr');
    });

    return decorated.map((team, index) => ({
      ...team,
      pot: Math.floor(index / capacity) + 1
    }));
  }

  const diagnostics = window.UCLDRAW_POOL_DIAGNOSTICS || {};

  Object.entries(definitions).forEach(([competitionId, definition]) => {
    const competition = data.competitions[competitionId];
    if (!competition) return;

    competition.teams = assignCoefficientPots(competition, definition);
    const missing = competition.teams
      .filter((team) => team.coefficientMissing && !team.isPlaceholder)
      .map((team) => team.poolSlug);

    diagnostics[competitionId] ||= {};
    diagnostics[competitionId].coefficientSeason = coefficientData.season || null;
    diagnostics[competitionId].coefficientSource = coefficientData.sourceUrl || null;
    diagnostics[competitionId].coefficientUpdatedAt = coefficientData.updatedAt || null;
    diagnostics[competitionId].missingCoefficientSlugs = missing;
    diagnostics[competitionId].missingCoefficientCount = missing.length;

    if (missing.length) {
      const warning = `${competitionId}: UEFA katsayısı bulunamayan ${missing.length} takım son torbalara yerleştirildi (${missing.join(', ')}).`;
      diagnostics[competitionId].warnings ||= [];
      diagnostics[competitionId].warnings.push(warning);
      console.warn(`[UCL Draw Pools] ${warning}`);
    }
  });

  window.UCLDRAW_POOL_DIAGNOSTICS = diagnostics;
  window.UCLDRAW_COEFFICIENT_POTS = Object.freeze({ assignCoefficientPots });
})();
