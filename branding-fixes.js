(() => {
  'use strict';

  const competitions = window.UCLDRAW_DATA?.competitions;
  if (competitions?.uecl) {
    competitions.uecl.logo = 'crests/pools/conference/CON_Logo.svg';
    competitions.uecl.background = 'crests/pools/conference/arkaplancon.jpg';
  }

  const englishCompetitionPattern = /(?:UEFA\s+)?(?:Champions|Europa|Conference)\s+League/i;
  const conferenceLogoSelector = '#competitionPicker button[data-league="uecl"] > .league-icon img';
  const actionLabels = Object.freeze({
    retryButton: 'Yeni Kura',
    showOverviewButton: 'Tüm Maçlar',
    customizeButton: 'Kurayı Düzenle',
    changeTeamButton: 'Başa Dön'
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

  function refreshConferenceLogo(root = document) {
    root.querySelectorAll?.(conferenceLogoSelector).forEach((image) => {
      if (!image.src.endsWith('/crests/pools/conference/CON_Logo.svg')) {
        image.src = 'crests/pools/conference/CON_Logo.svg';
      }
    });
  }

  function installCompactPredictionStyles() {
    if (document.querySelector('link[data-prediction-compact]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'prediction-compact.css';
    link.dataset.predictionCompact = 'true';
    document.head.appendChild(link);
  }

  function applyInterfaceCopy(root = document) {
    Object.entries(actionLabels).forEach(([id, label]) => {
      const button = root.getElementById?.(id) || document.getElementById(id);
      if (button && button.textContent !== label) button.textContent = label;
    });

    root.querySelectorAll?.('.prediction-entry-button').forEach((button) => {
      if (button.textContent !== 'Tahmin Yap') button.textContent = 'Tahmin Yap';
    });
  }

  function refreshBranding() {
    applyCompetitionLanguages();
    refreshConferenceLogo();
    applyInterfaceCopy();
  }

  function startObserver() {
    installCompactPredictionStyles();
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