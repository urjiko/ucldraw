(() => {
  'use strict';

  const manualButton = document.getElementById('manualSelectButton');
  const speedControl = document.getElementById('speedControl');
  const drawStatus = document.getElementById('drawStatus');
  const fixtureList = document.getElementById('fixtureList');
  if (!manualButton || !speedControl || !drawStatus || !fixtureList) return;

  const compactDraw = window.matchMedia('(max-width: 930px), (orientation: portrait)');
  const BASE_MANUAL_WINDOW = 10000;
  const BASE_CANDIDATE_STEP = 260;
  let manualSession = null;
  let autoSyncQueued = false;

  function activeSpeed() {
    const active = speedControl.querySelector('[data-speed].is-active');
    const speed = Number(active?.dataset.speed || 1);
    return [1, 1.5, 2].includes(speed) ? speed : 1;
  }

  function shuffle(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
  }

  function currentSlot() {
    return fixtureList.querySelector('.fixture-slot.is-current-manual:not(.is-filled)')
      || fixtureList.querySelector('.fixture-slot:not(.is-filled)');
  }

  function potNumber(slot = currentSlot()) {
    if (!slot) return null;
    const source = slot.querySelector('.fixture-pot')?.textContent
      || slot.querySelector('.fixture-meta')?.textContent
      || slot.textContent;
    const match = source.match(/Pot\s+(\d+)/i);
    return match ? Number(match[1]) : null;
  }

  function candidateFromButton(button) {
    if (!button) return null;
    return {
      key: button.dataset.teamIndex || button.querySelector('.team-name')?.textContent || '',
      name: button.querySelector('.team-name')?.textContent?.trim() || 'Takım',
      country: button.querySelector('.team-country')?.textContent?.trim() || '',
      crest: button.querySelector('.crest-shell')?.cloneNode(true) || null
    };
  }

  function candidatesForPot(pot) {
    if (!pot) return [];
    const buttons = [...document.querySelectorAll(`.draw-side .team-button[data-pot="${pot}"]`)]
      .filter((button) => !button.classList.contains('is-selected-club') && !button.classList.contains('is-drawn'));
    return shuffle(buttons.map(candidateFromButton).filter(Boolean));
  }

  function ensurePreview(slot) {
    let preview = slot.querySelector(':scope > .fixture-inline-roulette');
    if (preview) return preview;
    preview = document.createElement('span');
    preview.className = 'fixture-inline-roulette';
    preview.setAttribute('aria-hidden', 'true');
    slot.appendChild(preview);
    return preview;
  }

  function showCandidate(candidate, kind = 'rolling') {
    if (!compactDraw.matches || !candidate) return;
    const slot = currentSlot();
    if (!slot || slot.classList.contains('is-filled')) return;
    const preview = ensurePreview(slot);
    const previewKey = `${candidate.key}:${kind}`;
    if (preview.dataset.previewKey === previewKey) return;

    const crest = candidate.crest || document.createElement('span');
    if (!candidate.crest) crest.className = 'crest-shell';
    const name = document.createElement('span');
    name.className = 'fixture-inline-team';
    name.textContent = candidate.name;
    const country = document.createElement('span');
    country.className = 'fixture-inline-country';
    country.textContent = candidate.country;

    preview.replaceChildren(crest, name, country);
    preview.dataset.previewKey = previewKey;
    preview.classList.remove('is-rolling', 'is-winner', 'is-decoy', 'is-ticking');
    preview.classList.add(kind === 'winner' ? 'is-winner' : kind === 'decoy' ? 'is-decoy' : 'is-rolling');
    void preview.offsetWidth;
    preview.classList.add('is-ticking');
    slot.classList.add('has-inline-roulette');
  }

  function clearPreviews() {
    fixtureList.querySelectorAll('.fixture-inline-roulette').forEach((preview) => preview.remove());
    fixtureList.querySelectorAll('.fixture-slot.has-inline-roulette').forEach((slot) => slot.classList.remove('has-inline-roulette'));
  }

  function setManualStatus() {
    const pot = potNumber();
    drawStatus.textContent = pot ? `Pot ${pot}'ten takım seçiliyor...` : 'Takım seçiliyor...';
  }

  function sessionProgress(session, now = performance.now()) {
    return Math.max(0, Math.min(1, 1 - ((now - session.startedAt) / session.duration)));
  }

  function paintProgress() {
    if (!manualSession) return;
    const progress = sessionProgress(manualSession);
    manualButton.style.setProperty('--manual-progress', `${(progress * 100).toFixed(2)}%`);
    manualSession.frame = window.requestAnimationFrame(paintProgress);
  }

  function advanceManualCandidate() {
    if (!manualSession || !manualSession.candidates.length) return;
    if (manualSession.cursor >= manualSession.candidates.length) {
      manualSession.candidates = shuffle(manualSession.candidates);
      manualSession.cursor = 0;
    }
    showCandidate(manualSession.candidates[manualSession.cursor++], 'rolling');
  }

  function scheduleManualTimers(session, remainingFraction = 1) {
    window.clearTimeout(session.endTimer);
    window.clearInterval(session.candidateTimer);
    const remaining = Math.max(80, session.duration * remainingFraction);
    session.endTimer = window.setTimeout(() => {
      if (manualButton.classList.contains('is-running')) manualButton.click();
    }, Math.max(40, remaining - 40));
    session.candidateTimer = window.setInterval(
      advanceManualCandidate,
      Math.max(70, Math.round(BASE_CANDIDATE_STEP / session.speed))
    );
  }

  function startManualSession() {
    if (manualSession || !manualButton.classList.contains('is-running')) return;
    const slot = currentSlot();
    const pot = potNumber(slot);
    const speed = activeSpeed();
    const duration = BASE_MANUAL_WINDOW / speed;
    manualSession = {
      speed,
      duration,
      startedAt: performance.now(),
      pot,
      candidates: candidatesForPot(pot),
      cursor: 0,
      candidateTimer: null,
      endTimer: null,
      frame: null
    };
    manualButton.textContent = 'Şimdi Seç';
    manualButton.style.setProperty('--manual-progress', '100%');
    manualButton.dataset.manualRefinedActive = 'true';
    setManualStatus();
    advanceManualCandidate();
    scheduleManualTimers(manualSession, 1);
    manualSession.frame = window.requestAnimationFrame(paintProgress);
  }

  function stopManualSession() {
    if (!manualSession) return;
    window.clearTimeout(manualSession.endTimer);
    window.clearInterval(manualSession.candidateTimer);
    window.cancelAnimationFrame(manualSession.frame);
    manualSession = null;
    delete manualButton.dataset.manualRefinedActive;
    manualButton.style.setProperty('--manual-progress', '100%');
  }

  function retimeManualSession() {
    if (!manualSession) return;
    const remainingFraction = sessionProgress(manualSession);
    const speed = activeSpeed();
    manualSession.speed = speed;
    manualSession.duration = BASE_MANUAL_WINDOW / speed;
    manualSession.startedAt = performance.now() - ((1 - remainingFraction) * manualSession.duration);
    scheduleManualTimers(manualSession, remainingFraction);
    setManualStatus();
  }

  function syncManualButton() {
    if (manualButton.classList.contains('is-running')) startManualSession();
    else stopManualSession();
  }

  function syncMirroredCandidate() {
    autoSyncQueued = false;
    if (!compactDraw.matches) {
      clearPreviews();
      return;
    }
    if (manualSession) return;
    const active = document.querySelector('.draw-side .team-button.is-winner')
      || document.querySelector('.draw-side .team-button.is-decoy')
      || document.querySelector('.draw-side .team-button.is-roulette')
      || document.querySelector('.draw-side .team-button.is-manual-pulse');
    if (!active) {
      if (!currentSlot()) clearPreviews();
      return;
    }
    const kind = active.classList.contains('is-winner')
      ? 'winner'
      : active.classList.contains('is-decoy')
        ? 'decoy'
        : 'rolling';
    showCandidate(candidateFromButton(active), kind);
  }

  function queueMirroredCandidate() {
    if (autoSyncQueued) return;
    autoSyncQueued = true;
    window.requestAnimationFrame(syncMirroredCandidate);
  }

  manualButton.addEventListener('click', () => window.setTimeout(syncManualButton, 0));
  speedControl.addEventListener('click', () => window.setTimeout(retimeManualSession, 0));
  compactDraw.addEventListener?.('change', () => {
    if (!compactDraw.matches) clearPreviews();
    else queueMirroredCandidate();
  });

  new MutationObserver((mutations) => {
    if (mutations.some((mutation) => mutation.target === manualButton)) syncManualButton();
    queueMirroredCandidate();
  }).observe(document.body, {
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
  });

  new MutationObserver(() => {
    if (!currentSlot()) clearPreviews();
    else queueMirroredCandidate();
  }).observe(fixtureList, { childList: true, subtree: false });
})();
