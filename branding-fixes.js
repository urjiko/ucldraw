(() => {
  'use strict';

  const competitions = window.UCLDRAW_DATA?.competitions;
  if (competitions?.uecl) {
    competitions.uecl.logo = 'crests/pools/conference/ConferenceLeague.png';
    competitions.uecl.background = 'crests/pools/conference/arkaplancon.jpg';
  }

  const englishCompetitionPattern = /(?:UEFA\s+)?(?:Champions|Europa|Conference)\s+League/i;

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
    root.querySelectorAll?.('[data-league="uecl"] .league-icon img').forEach((image) => {
      if (!image.src.endsWith('/crests/pools/conference/ConferenceLeague.png')) {
        image.src = 'crests/pools/conference/ConferenceLeague.png';
      }
    });
  }

  function refreshBranding() {
    applyCompetitionLanguages();
    refreshConferenceLogo();
  }

  function startObserver() {
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
