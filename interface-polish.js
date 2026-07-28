(() => {
  'use strict';

  const body = document.body;
  const data = window.UCLDRAW_DATA;
  const drawTopbar = document.querySelector('.draw-topbar');
  const drawTitle = document.getElementById('drawTitle');
  const drawKicker = document.getElementById('drawKicker');
  const drawCopy = drawTopbar?.querySelector('.draw-topbar-copy');
  const progressTrack = drawTopbar?.querySelector('.progress-track');
  const predictionSection = document.getElementById('predictionSection');

  function setText(element, value) {
    if (element && element.textContent !== value) element.textContent = value;
  }

  function initials(name = '') {
    return String(name)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  function currentCompetition() {
    return data?.competitions?.[body.dataset.league || 'ucl'] || window.UCLDRAW_LAST_DRAW?.competition || null;
  }

  function findTeam(name, competition = currentCompetition()) {
    const normalized = String(name || '').trim();
    if (!normalized || !competition?.teams) return null;
    return competition.teams.find((team) => team.name === normalized) || null;
  }

  function createCrest(team) {
    const shell = document.createElement('span');
    shell.className = 'crest-shell large polished-hero-crest';

    const fallback = document.createElement('span');
    fallback.className = 'crest-fallback';
    fallback.textContent = initials(team?.name);
    shell.appendChild(fallback);

    if (team?.crest) {
      const image = document.createElement('img');
      image.src = `crests/${team.crest}.png`;
      image.alt = '';
      image.addEventListener('load', () => { fallback.hidden = true; });
      image.addEventListener('error', () => { image.remove(); fallback.hidden = false; });
      shell.appendChild(image);
    }

    return shell;
  }

  function decorateDrawHeader() {
    if (!drawTopbar || !drawCopy || !drawTitle) return;
    drawTopbar.classList.add('themed-hero');

    let identity = drawTopbar.querySelector('.draw-header-identity');
    if (!identity) {
      identity = document.createElement('div');
      identity.className = 'draw-header-identity';

      const crestHost = document.createElement('div');
      crestHost.className = 'draw-hero-crest';
      identity.append(crestHost, drawCopy);
      drawTopbar.insertBefore(identity, progressTrack || null);
    }

    const competition = currentCompetition();
    const team = findTeam(drawTitle.textContent, competition);
    const crestHost = identity.querySelector('.draw-hero-crest');
    crestHost.replaceChildren();
    if (team) crestHost.appendChild(createCrest(team));
    identity.classList.toggle('has-team', Boolean(team));
    setText(drawKicker, competition?.shortName ? `${competition.shortName} Kura` : 'Kura');
  }

  function decoratePredictionHeader(header) {
    if (!header || header.querySelector('.prediction-header-identity')) return;
    const copy = header.querySelector('.prediction-header-copy');
    const controls = header.querySelector('.prediction-header-controls');
    const title = copy?.querySelector('h2');
    if (!copy || !controls || !title) return;

    header.classList.add('themed-hero');
    copy.querySelector('p')?.remove();

    const competition = window.UCLDRAW_LAST_DRAW?.competition || currentCompetition();
    const team = findTeam(title.textContent, competition);
    const kicker = copy.querySelector('.prediction-kicker');
    setText(kicker, competition?.shortName ? `${competition.shortName} Tahmin` : 'Tahmin');

    const identity = document.createElement('div');
    identity.className = 'prediction-header-identity';
    const crestHost = document.createElement('div');
    crestHost.className = 'prediction-hero-crest';
    if (team) crestHost.appendChild(createCrest(team));
    identity.append(crestHost, copy);
    header.insertBefore(identity, controls);

    setText(header.querySelector('.prediction-back-button'), 'Kuraya Dön');
    const lockButton = header.querySelector('.prediction-team-lock');
    if (lockButton) setText(lockButton, lockButton.classList.contains('is-locked') ? 'Kilidi Aç' : 'Kilitle');
  }

  function decoratePredictionHeaders(root = document) {
    root.querySelectorAll?.('.prediction-header').forEach(decoratePredictionHeader);
  }

  function simplifyCopy() {
    const competition = currentCompetition();
    setText(document.getElementById('brandSubtitle'), 'Kurayı çek, sonuçları tahmin et.');
    setText(document.getElementById('rulesChip'), competition?.potCount === 6 ? '6 torba · 6 maç' : '4 torba · 8 maç');

    const search = document.getElementById('teamSearch');
    if (search) {
      search.placeholder = 'Takım Ara...';
      search.setAttribute('aria-label', 'Takım Ara');
    }

    const labels = document.querySelectorAll('.draw-control-panel .control-label');
    setText(labels[0], 'Mod');
    setText(labels[1], 'Hız');
    setText(document.querySelector('[data-control-mode="manual"]'), 'Manuel');
    setText(document.getElementById('manualSelectButton'), 'Seç');
    setText(document.getElementById('finishAllButton'), 'Kurayı Tamamla');
    setText(document.getElementById('customNote'), 'Maçı seç, sonra rakibi belirle.');

    setText(document.querySelector('.mode-choice-fieldset legend'), 'Mod');
    setText(document.querySelector('[data-initial-mode="manual"] strong'), 'Manuel');
    setText(document.querySelector('[data-initial-mode="auto"] span'), 'Kura otomatik ilerler.');
    setText(document.querySelector('[data-initial-mode="manual"] span'), 'Her seçimde sen durdurursun.');
    setText(document.getElementById('cancelConfirmButton'), 'Geri');
    setText(document.getElementById('confirmDrawButton'), 'Başlat');
    setText(document.getElementById('confirmText'), 'Kura modunu seç.');

    setText(document.querySelector('.all-fixtures-header h2'), 'Tüm Maçlar');
    setText(document.getElementById('finishCustomButton'), 'Kurayı Tamamla');
    setText(document.getElementById('resetCustomButton'), 'Sıfırla');
  }

  function refresh() {
    simplifyCopy();
    decorateDrawHeader();
    decoratePredictionHeaders(predictionSection || document);
  }

  refresh();

  if (drawTitle) {
    new MutationObserver(decorateDrawHeader).observe(drawTitle, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }

  if (predictionSection) {
    new MutationObserver(() => decoratePredictionHeaders(predictionSection)).observe(predictionSection, {
      childList: true,
      subtree: true
    });
  }

  new MutationObserver(refresh).observe(body, {
    attributes: true,
    attributeFilter: ['data-league']
  });

  const confirmBackdrop = document.getElementById('confirmBackdrop');
  if (confirmBackdrop) {
    new MutationObserver(simplifyCopy).observe(confirmBackdrop, {
      attributes: true,
      attributeFilter: ['hidden']
    });
  }

  for (const target of [document.getElementById('brandSubtitle'), document.getElementById('rulesChip')]) {
    if (target) new MutationObserver(simplifyCopy).observe(target, { childList: true, characterData: true, subtree: true });
  }
})();
