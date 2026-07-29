(() => {
  'use strict';

  const logos = Object.freeze({
    ucl: 'crests/pools/champions/UCL_Logo.svg',
    uel: 'crests/pools/europa/UEL_Logo.svg',
    uecl: 'crests/pools/conference/CON_Logo.svg'
  });

  const competitions = window.UCLDRAW_DATA?.competitions;
  if (!competitions) return;

  Object.entries(logos).forEach(([leagueId, source]) => {
    if (competitions[leagueId]) competitions[leagueId].logo = source;
  });

  window.UCLDRAW_COMPETITION_SVG_LOGOS = logos;
})();