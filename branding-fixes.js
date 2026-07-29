(() => {
  'use strict';

  const competitions = window.UCLDRAW_DATA?.competitions;
  const svgLogos = Object.freeze({
    ucl: 'crests/pools/champions/UCL_Logo.svg',
    uel: 'crests/pools/europa/UEL_Logo.svg',
    uecl: 'crests/pools/conference/CON_Logo.svg'
  });

  Object.entries(svgLogos).forEach(([leagueId, source]) => {
    if (competitions?.[leagueId]) competitions[leagueId].logo = source;
  });
  if (competitions?.uecl) competitions.uecl.background = 'crests/pools/conference/arkaplancon.jpg';

  const englishCompetitionPattern = /(?:UEFA\s+)?(?:Champions|Europa|Conference)\s+League/i;
  const actionLabels = Object.freeze({
    retryButton: 'Tekrar Dene',
    showOverviewButton: 'Tüm Maçlar',
    customizeButton: 'Düzenle',
    changeTeamButton: 'Çıkış'
  });

  function applyCompetitionLanguages(root = document) {
    root.querySelectorAll?.(
      '.league-title, .draw-kicker, .selected-club-label, #brandSubtitle, #confirmText'
    ).forEach((element) => {
      if (englishCompetitionPattern.test(element.textContent || '')) {
        element.lang = 'en';
      }
    });
  }

  function refreshCompetitionLogos(root = document) {
    root.querySelectorAll?.('#competitionPicker button[data-league]').forEach((button) => {
      const expected = svgLogos[button.dataset.league];
      const image = button.querySelector('.league-icon img');
      if (expected && image && !image.src.endsWith(`/${expected}`)) image.src = expected;
    });

    const activeLeague = document.body.dataset.league || 'ucl';
    const activeLogo = svgLogos[activeLeague];
    const brandImage = document.querySelector('#brandMark img');
    if (activeLogo && brandImage && !brandImage.src.endsWith(`/${activeLogo}`)) brandImage.src = activeLogo;
  }

  function installCompactPredictionStyles() {
    if (document.querySelector('link[data-prediction-compact]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'prediction-compact.css';
    link.dataset.predictionCompact = 'true';
    document.head.appendChild(link);
  }

  function installUiRefinementAssets() {
    if (!document.querySelector('link[data-ui-refinement-v4]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'ui-refinement-v4.css';
      link.dataset.uiRefinementV4 = 'true';
      document.head.appendChild(link);
    }

    if (!document.querySelector('script[data-ui-refinement-v4]')) {
      const script = document.createElement('script');
      script.src = 'ui-refinement-v4.js';
      script.dataset.uiRefinementV4 = 'true';
      document.body.appendChild(script);
    }
  }

  function applyInterfaceCopy(root = document) {
    Object.entries(actionLabels).forEach(([id, label]) => {
      const button = root.getElementById?.(id) || document.getElementById(id);
      if (button && button.textContent !== label) button.textContent = label;
    });

    root.querySelectorAll?.('.prediction-entry-button').forEach((button) => {
      if (button.textContent !== 'Devam Et') button.textContent = 'Devam Et';
    });
  }

  function refreshBranding() {
    applyCompetitionLanguages();
    refreshCompetitionLogos();
    applyInterfaceCopy();
  }

  function startObserver() {
    installCompactPredictionStyles();
    installUiRefinementAssets();
    refreshBranding();
    const observer = new MutationObserver(refreshBranding);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver, { once: true });
  } else {
    startObserver();
  }
})();
