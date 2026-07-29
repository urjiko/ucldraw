(() => {
  'use strict';

  const body = document.body;
  const drawKicker = document.getElementById('drawKicker');
  const predictionSection = document.getElementById('predictionSection');
  let floatingShare = null;
  let floatingObserver = null;
  let observedShareRow = null;

  function setText(element, value) {
    if (element && element.textContent !== value) element.textContent = value;
  }

  function competitionDrawLabel() {
    const leagueId = body.dataset.league || 'ucl';
    const competition = window.UCLDRAW_DATA?.competitions?.[leagueId];
    const name = String(competition?.name || competition?.shortName || 'UEFA')
      .replace(/^UEFA\s+/i, '')
      .trim()
      .toLocaleUpperCase('tr-TR');
    return `${name} - KURA`;
  }

  function refineDrawKicker() {
    if (drawKicker && body.classList.contains('draw-active')) {
      setText(drawKicker, competitionDrawLabel());
      drawKicker.hidden = false;
    }
  }

  function refineTeamActionButtons() {
    document.querySelectorAll('.roster-team-action-simple').forEach((modal) => {
      const actions = modal.querySelector('.roster-team-actions');
      modal.classList.toggle('is-simple-action-modal', Boolean(actions && actions.children.length === 1));
    });
  }

  function refineStandingsPanel() {
    document.querySelectorAll('#predictionSection .prediction-standings-panel').forEach((panel) => {
      panel.classList.remove('glass');
      if (panel.querySelector(':scope > .prediction-standings-card')) return;

      const legend = panel.querySelector(':scope > .prediction-zone-legend');
      const table = panel.querySelector(':scope > .prediction-standings-table');
      if (!table) return;

      const card = document.createElement('div');
      card.className = 'prediction-standings-card glass';
      if (legend) card.appendChild(legend);
      card.appendChild(table);

      const actions = panel.querySelector(':scope > .prediction-share-actions-v4');
      panel.insertBefore(card, actions || null);
    });
  }

  function predictionState() {
    return window.UCLDRAW_PREDICTION_AI?.getState?.() || null;
  }

  function matchForCard(card) {
    const state = predictionState();
    const activeName = document.querySelector('#predictionSection .prediction-header h2')?.textContent?.trim();
    if (!state || !activeName || !card) return null;
    const cards = [...document.querySelectorAll('#predictionSection .prediction-fixture-card')];
    const index = cards.indexOf(card);
    if (index < 0) return null;
    const matches = state.matches
      .filter((match) => match.home.name === activeName || match.away.name === activeName)
      .sort((first, second) => first.matchday - second.matchday);
    return matches[index] || null;
  }

  function unlockCard(card, button) {
    const state = predictionState();
    const match = matchForCard(card);
    if (!state || !match) return false;
    delete state.matchLocks[match.id];
    card.classList.remove('is-locked');
    card.querySelectorAll('.prediction-outcome-team, .prediction-draw-choice').forEach((choice) => {
      choice.disabled = false;
      choice.setAttribute('aria-disabled', 'false');
    });
    card.querySelectorAll('.prediction-score-editor input').forEach((input) => { input.disabled = false; });
    button.classList.remove('is-match-locked');
    button.disabled = false;
    setText(button, 'Kilitle');
    return true;
  }

  function refinePredictionLocks() {
    document.querySelectorAll('#predictionSection .prediction-fixture-card').forEach((card) => {
      const locked = card.classList.contains('is-locked');
      const button = card.querySelector('.prediction-score-apply');
      if (!button) return;
      button.disabled = false;
      button.classList.toggle('is-match-locked', locked);
      setText(button, locked ? 'Kilitli' : 'Kilitle');
    });
  }

  function createFloatingShare() {
    const wrapper = document.createElement('div');
    wrapper.className = 'prediction-share-floating';
    wrapper.hidden = true;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'action-button primary prediction-share-floating-button';
    button.textContent = 'Paylaş';
    button.addEventListener('click', () => {
      const original = document.querySelector('#predictionSection .prediction-share-v4-button');
      if (original && !original.hidden && !original.disabled) original.click();
    });
    wrapper.appendChild(button);
    document.body.appendChild(wrapper);
    return wrapper;
  }

  function shareRowIsVisible(row) {
    if (!row) return false;
    const rect = row.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }

  function observeShareRow(row) {
    if (observedShareRow === row) return;
    floatingObserver?.disconnect();
    observedShareRow = row;
    if (!row || !('IntersectionObserver' in window)) return;
    floatingObserver = new IntersectionObserver(() => syncFloatingShare(), {
      root: null,
      threshold: [0, 0.05, 0.5, 1]
    });
    floatingObserver.observe(row);
  }

  function syncFloatingShare() {
    const original = document.querySelector('#predictionSection .prediction-share-v4-button');
    const row = original?.closest('.prediction-share-actions-v4') || null;
    const active = body.classList.contains('prediction-active') && original && !original.hidden;
    if (!floatingShare) floatingShare = createFloatingShare();
    observeShareRow(row);
    if (!active) {
      floatingShare.hidden = true;
      return;
    }
    const proxy = floatingShare.querySelector('.prediction-share-floating-button');
    proxy.disabled = Boolean(original.disabled);
    setText(proxy, original.textContent || 'Paylaş');
    floatingShare.hidden = shareRowIsVisible(row);
  }

  function installShareRendererV7() {
    if (document.querySelector('script[data-prediction-share-v7]')) return true;
    if (!window.UCLDRAW_PREDICTION_SHARE_V6) return false;
    const script = document.createElement('script');
    script.src = 'prediction-share-v7.js';
    script.async = false;
    script.dataset.predictionShareV7 = 'true';
    document.body.appendChild(script);
    return true;
  }

  document.addEventListener('click', (event) => {
    const lockedButton = event.target.closest?.('.prediction-score-apply.is-match-locked');
    if (lockedButton) {
      const card = lockedButton.closest('.prediction-fixture-card');
      if (card && unlockCard(card, lockedButton)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
    }

    const shareButton = event.target.closest?.('.prediction-share-v4-button');
    const renderer = window.UCLDRAW_PREDICTION_SHARE_V7;
    if (!shareButton || shareButton.hidden || !renderer?.shareCurrent) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (shareButton.dataset.busy === 'true') return;
    shareButton.dataset.busy = 'true';
    shareButton.disabled = true;
    setText(shareButton, 'Hazırlanıyor...');
    Promise.resolve(renderer.shareCurrent())
      .catch((error) => {
        if (error?.name !== 'AbortError') console.error(error);
      })
      .finally(() => {
        delete shareButton.dataset.busy;
        shareButton.disabled = false;
        setText(shareButton, 'Paylaş');
        syncFloatingShare();
      });
  }, true);

  function refresh() {
    refineDrawKicker();
    refineTeamActionButtons();
    refineStandingsPanel();
    refinePredictionLocks();
    syncFloatingShare();
    installShareRendererV7();
  }

  let queued = false;
  function queueRefresh() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(() => {
      queued = false;
      refresh();
    });
  }

  refresh();
  const rendererTimer = window.setInterval(() => {
    if (installShareRendererV7()) window.clearInterval(rendererTimer);
  }, 60);
  window.setTimeout(() => window.clearInterval(rendererTimer), 12000);

  new MutationObserver(queueRefresh).observe(body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['hidden', 'class', 'style']
  });
  window.addEventListener('resize', queueRefresh, { passive: true });
  window.addEventListener('scroll', queueRefresh, { passive: true });
})();
