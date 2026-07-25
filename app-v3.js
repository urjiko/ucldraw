(() => {
  'use strict';

  const DATA = window.UCLDRAW_DATA;
  const ENGINE = window.UCLDRAW_ENGINE;
  if (!DATA?.competitions) throw new Error('Competition data could not be loaded.');
  if (!ENGINE?.generateCompetitionDraw) throw new Error('Draw engine could not be loaded.');

  const competitionOrder = ['ucl', 'uel', 'uecl'];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const BASE_TIMING = {
    initialPause: 650,
    rouletteStep: 130,
    rouletteCycles: 13,
    decoyHold: 420,
    fly: 900,
    flyBack: 760,
    winnerHold: 260,
    fade: 200,
    betweenFixtures: 620,
    manualPulse: 260,
    manualWindow: 10000,
    manualFlyPressed: 560,
    manualFlyTimeout: 820
  };

  const els = {
    body: document.body,
    appHeader: document.getElementById('appHeader'),
    themeMeta: document.querySelector('meta[name="theme-color"]'),
    brandMark: document.getElementById('brandMark'),
    brandSubtitle: document.getElementById('brandSubtitle'),
    rulesChip: document.getElementById('rulesChip'),
    competitionPicker: document.getElementById('competitionPicker'),
    selectionScreen: document.getElementById('selectionScreen'),
    drawScreen: document.getElementById('drawScreen'),
    selectionPots: document.getElementById('selectionPots'),
    teamSearch: document.getElementById('teamSearch'),
    searchResults: document.getElementById('searchResults'),
    leftPots: document.getElementById('leftPots'),
    rightPots: document.getElementById('rightPots'),
    selectedClubCard: document.getElementById('selectedClubCard'),
    drawKicker: document.getElementById('drawKicker'),
    drawTitle: document.getElementById('drawTitle'),
    drawStatus: document.getElementById('drawStatus'),
    fixtureList: document.getElementById('fixtureList'),
    progressBar: document.getElementById('progressBar'),
    drawControlPanel: document.getElementById('drawControlPanel'),
    modeControl: document.getElementById('modeControl'),
    speedControl: document.getElementById('speedControl'),
    speedControlGroup: document.getElementById('speedControlGroup'),
    manualControl: document.getElementById('manualControl'),
    manualSelectButton: document.getElementById('manualSelectButton'),
    manualCountdown: document.getElementById('manualCountdown'),
    finishAllButton: document.getElementById('finishAllButton'),
    drawActions: document.getElementById('drawActions'),
    customActions: document.getElementById('customActions'),
    customNote: document.getElementById('customNote'),
    pairControls: document.getElementById('pairControls'),
    retryButton: document.getElementById('retryButton'),
    showOverviewButton: document.getElementById('showOverviewButton'),
    customizeButton: document.getElementById('customizeButton'),
    changeTeamButton: document.getElementById('changeTeamButton'),
    finishCustomButton: document.getElementById('finishCustomButton'),
    resetCustomButton: document.getElementById('resetCustomButton'),
    cancelCustomButton: document.getElementById('cancelCustomButton'),
    allFixturesSection: document.getElementById('allFixturesSection'),
    allFixturesGrid: document.getElementById('allFixturesGrid'),
    hideOverviewButton: document.getElementById('hideOverviewButton'),
    confirmBackdrop: document.getElementById('confirmBackdrop'),
    confirmCrest: document.getElementById('confirmCrest'),
    confirmTitle: document.getElementById('confirmTitle'),
    confirmText: document.getElementById('confirmText'),
    initialModeChoice: document.getElementById('initialModeChoice'),
    initialSpeedControl: document.getElementById('initialSpeedControl'),
    cancelConfirmButton: document.getElementById('cancelConfirmButton'),
    confirmDrawButton: document.getElementById('confirmDrawButton'),
    toast: document.getElementById('toast')
  };

  const state = {
    leagueId: 'ucl', selectedTeam: null, pendingTeam: null,
    pendingControlMode: 'auto', pendingSpeed: 1,
    drawTable: null, overrides: new Map(), fixtures: [],
    revealedCount: 0, currentIndex: 0, screenMode: 'selection',
    controlMode: 'auto', autoSpeed: 1, running: false, processing: false,
    drawToken: 0, autoTimer: null, manualActive: false,
    manualPulseTimer: null, manualCountdownTimer: null, manualTimeout: null,
    manualPulseButton: null, activeCustomSlot: null, customBackup: null,
    toastTimer: null
  };

  const competition = () => DATA.competitions[state.leagueId];

  function normalize(value = '') {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('tr-TR').trim();
  }
  function shuffle(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  }
  function randomItem(items) { return items[Math.floor(Math.random() * items.length)]; }
  function cloneFixtures(fixtures) { return fixtures.map((fixture) => ({ ...fixture })); }
  function wait(ms) { return new Promise((resolve) => window.setTimeout(resolve, prefersReducedMotion ? 8 : ms)); }
  function nextFrame() { return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))); }
  function autoTime(ms) { return prefersReducedMotion ? 8 : Math.max(50, Math.round(ms / state.autoSpeed)); }
  function hexToRgb(hex) {
    const value = Number.parseInt(hex.replace('#', ''), 16);
    return `${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}`;
  }
  function initials(name) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase(); }
  function teamIndex(team) { return competition().teams.indexOf(team); }

  function createCrest(team, size = 'normal') {
    const shell = document.createElement('span');
    shell.className = `crest-shell${size === 'large' ? ' large' : ''}`;
    const fallback = document.createElement('span');
    fallback.className = 'crest-fallback';
    fallback.textContent = initials(team.name);
    shell.appendChild(fallback);
    if (team.crest) {
      const image = document.createElement('img');
      image.src = `crests/${team.crest}.png`;
      image.alt = '';
      image.loading = 'lazy';
      image.addEventListener('load', () => { fallback.hidden = true; });
      image.addEventListener('error', () => { image.remove(); fallback.hidden = false; });
      shell.appendChild(image);
    }
    return shell;
  }
  function createLeagueIcon(comp) {
    const shell = document.createElement('span');
    shell.className = 'league-icon';
    if (comp.logo) {
      const image = document.createElement('img');
      image.src = comp.logo;
      image.alt = '';
      shell.appendChild(image);
    } else shell.textContent = comp.shortName.slice(0, 1);
    return shell;
  }
  function showToast(message) {
    clearTimeout(state.toastTimer);
    els.toast.textContent = message;
    els.toast.classList.add('is-visible');
    state.toastTimer = setTimeout(() => els.toast.classList.remove('is-visible'), 3200);
  }
  function setStatus(message) { els.drawStatus.textContent = message; }

  function applyTheme() {
    const comp = competition();
    els.body.dataset.league = comp.id;
    els.body.style.setProperty('--accent', comp.color);
    els.body.style.setProperty('--accent-rgb', hexToRgb(comp.color));
    els.body.style.setProperty('--league-background', comp.background ? `url("${comp.background}")` : 'none');
    els.themeMeta?.setAttribute('content', comp.color);
  }
  function renderBrand() {
    const comp = competition();
    els.brandMark.replaceChildren();
    if (comp.logo) {
      const image = document.createElement('img');
      image.src = comp.logo;
      image.alt = '';
      els.brandMark.appendChild(image);
    }
    els.brandSubtitle.textContent = `${comp.shortName}: takımını seç, kurayı canlı olarak izle.`;
    els.rulesChip.textContent = comp.potCount === 6 ? '6 torba · 6 rakip · 3 iç saha / 3 deplasman' : '4 torba · 8 rakip · 4 iç saha / 4 deplasman';
  }
  function createLeagueButton(comp, primary) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = primary ? 'league-primary' : 'league-secondary';
    button.style.setProperty('--league-color', comp.color);
    button.dataset.league = comp.id;
    button.setAttribute('aria-pressed', primary ? 'true' : 'false');
    button.appendChild(createLeagueIcon(comp));
    const title = document.createElement('span');
    title.className = 'league-title';
    title.textContent = comp.name;
    button.appendChild(title);
    if (primary) {
      const stateLabel = document.createElement('span');
      stateLabel.className = 'league-state';
      stateLabel.textContent = 'Seçili lig';
      button.appendChild(stateLabel);
    }
    button.addEventListener('click', () => { if (comp.id !== state.leagueId) setLeague(comp.id); });
    return button;
  }
  function renderCompetitionPicker() {
    const primary = createLeagueButton(competition(), true);
    const secondaryRow = document.createElement('div');
    secondaryRow.className = 'league-secondary-row';
    competitionOrder.filter((id) => id !== state.leagueId).forEach((id) => secondaryRow.appendChild(createLeagueButton(DATA.competitions[id], false)));
    els.competitionPicker.replaceChildren(primary, secondaryRow);
  }

  function getTeamsForPot(pot) { return competition().teams.filter((team) => team.pot === pot); }
  function visibleFixtureTeams() {
    if (state.screenMode === 'draw') return state.fixtures.slice(0, state.revealedCount).map((fixture) => fixture.team);
    return state.fixtures.map((fixture) => fixture.team).filter(Boolean);
  }
  function fixturesForTeam(team) {
    const override = state.overrides.get(team.name);
    if (override) return cloneFixtures(override);
    const generated = state.drawTable?.[team.name] || [];
    return generated.map((fixture) => ({ team: fixture.opponent, pot: fixture.pot, home: fixture.home }));
  }
  function customCandidateValidity(team, slotIndex) {
    const slot = state.fixtures[slotIndex];
    if (!slot) return { valid: false, reason: 'Önce bir eşleşme yuvası seç.' };
    if (team.pot !== slot.pot) return { valid: false, reason: `Bu yuva Pot ${slot.pot} için ayrıldı.` };
    if (team === state.selectedTeam) return { valid: false, reason: 'Takım kendisiyle eşleşemez.' };
    if (team.country === state.selectedTeam.country) return { valid: false, reason: 'Aynı ülkeden takımlar eşleşemez.' };
    const otherTeams = state.fixtures.filter((_, index) => index !== slotIndex).map((fixture) => fixture.team).filter(Boolean);
    if (otherTeams.includes(team)) return { valid: false, reason: 'Aynı rakip iki kez seçilemez.' };
    if (otherTeams.filter((other) => other.country === team.country).length >= 2) return { valid: false, reason: 'Aynı federasyondan en fazla iki rakip seçilebilir.' };
    return { valid: true, reason: '' };
  }

  function createTeamButton(team, context) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'team-button';
    button.dataset.teamIndex = String(teamIndex(team));
    button.dataset.pot = String(team.pot);
    button.appendChild(createCrest(team));
    const main = document.createElement('span');
    main.className = 'team-main';
    const name = document.createElement('span');
    name.className = 'team-name';
    name.textContent = team.name;
    const country = document.createElement('span');
    country.className = 'team-country';
    country.textContent = team.country;
    main.append(name, country);
    const tag = document.createElement('span');
    tag.className = 'team-tag';
    tag.textContent = `P${team.pot}`;
    button.append(main, tag);
    if (context === 'selection') {
      button.addEventListener('click', () => openConfirmation(team));
      return button;
    }
    if (team === state.selectedTeam) {
      button.classList.add('is-selected-club');
      button.disabled = true;
      button.title = 'Görüntülenen takım';
    }
    if (visibleFixtureTeams().includes(team)) button.classList.add('is-drawn');
    if (state.screenMode === 'custom') {
      const validity = state.activeCustomSlot === null ? { valid: false, reason: 'Önce bir eşleşme yuvası seç.' } : customCandidateValidity(team, state.activeCustomSlot);
      if (!validity.valid) button.classList.add('is-unavailable');
      button.disabled = false;
      button.title = validity.reason;
      button.addEventListener('click', () => handleCustomTeamSelection(team));
    } else if (state.screenMode === 'complete' && team !== state.selectedTeam) {
      button.disabled = false;
      button.classList.add('can-view');
      button.title = `${team.name} kura sonucunu görüntüle`;
      button.addEventListener('click', () => viewTeamDraw(team));
    } else if (team !== state.selectedTeam) button.disabled = true;
    return button;
  }
  function createPotCard(pot, context) {
    const card = document.createElement('section');
    card.className = 'pot-card glass';
    card.dataset.potCard = String(pot);
    const header = document.createElement('header');
    header.className = 'pot-card-header';
    const title = document.createElement('h3');
    title.textContent = `Pot ${pot}`;
    const count = document.createElement('span');
    count.className = 'pot-count';
    count.textContent = `${getTeamsForPot(pot).length} takım`;
    header.append(title, count);
    const teams = document.createElement('div');
    teams.className = 'pot-teams';
    getTeamsForPot(pot).forEach((team) => teams.appendChild(createTeamButton(team, context)));
    card.append(header, teams);
    return card;
  }
  function renderSelectionPots() {
    const comp = competition();
    els.selectionPots.style.setProperty('--pot-columns', comp.potCount === 6 ? '3' : '4');
    els.selectionPots.replaceChildren();
    for (let pot = 1; pot <= comp.potCount; pot += 1) els.selectionPots.appendChild(createPotCard(pot, 'selection'));
  }
  function drawPotSides() { return competition().potCount === 6 ? { left: [1, 2, 3], right: [4, 5, 6] } : { left: [1, 2], right: [3, 4] }; }
  function renderDrawPots() {
    const sides = drawPotSides();
    els.leftPots.replaceChildren(...sides.left.map((pot) => createPotCard(pot, 'draw')));
    els.rightPots.replaceChildren(...sides.right.map((pot) => createPotCard(pot, 'draw')));
  }

  function searchTeams(query) {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return competition().teams;
    return competition().teams.filter((team) => normalize(`${team.name} ${team.country}`).includes(normalizedQuery));
  }
  function closeSearch() { els.searchResults.hidden = true; els.teamSearch.setAttribute('aria-expanded', 'false'); }
  function renderSearchResults() {
    const teams = searchTeams(els.teamSearch.value).slice(0, 36);
    els.searchResults.replaceChildren();
    if (!teams.length) {
      const empty = document.createElement('li');
      empty.className = 'empty-state';
      empty.textContent = 'Takım bulunamadı.';
      els.searchResults.appendChild(empty);
    } else teams.forEach((team) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.appendChild(createCrest(team));
      const label = document.createElement('span');
      label.textContent = `${team.name} · Pot ${team.pot} · ${team.country}`;
      button.appendChild(label);
      button.addEventListener('mousedown', (event) => { event.preventDefault(); openConfirmation(team); closeSearch(); });
      item.appendChild(button);
      els.searchResults.appendChild(item);
    });
    els.searchResults.hidden = false;
    els.teamSearch.setAttribute('aria-expanded', 'true');
  }

  function updateInitialModeUI() {
    els.initialModeChoice.querySelectorAll('[data-initial-mode]').forEach((button) => button.classList.toggle('is-selected', button.dataset.initialMode === state.pendingControlMode));
    els.initialSpeedControl.classList.toggle('is-disabled', state.pendingControlMode !== 'auto');
    els.initialSpeedControl.querySelectorAll('[data-initial-speed]').forEach((button) => button.classList.toggle('is-active', Number(button.dataset.initialSpeed) === state.pendingSpeed));
  }
  function openConfirmation(team) {
    state.pendingTeam = team;
    state.pendingControlMode = state.controlMode || 'auto';
    state.pendingSpeed = state.autoSpeed || 1;
    els.confirmCrest.replaceChildren(createCrest(team, 'large'));
    els.confirmTitle.textContent = `${team.name} hazır`;
    els.confirmText.textContent = `${team.name} ile kura çekimi başlayacak. Otomatik akışı veya her rakipte Seç tuşuna basacağın kontrollü akışı seç.`;
    updateInitialModeUI();
    els.confirmBackdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    els.confirmDrawButton.focus();
  }
  function closeConfirmation() { els.confirmBackdrop.hidden = true; document.body.style.overflow = ''; state.pendingTeam = null; }

  function renderSelectedClub() {
    els.selectedClubCard.replaceChildren();
    if (!state.selectedTeam) return;
    const copy = document.createElement('div');
    copy.className = 'selected-club-copy';
    const label = document.createElement('div');
    label.className = 'selected-club-label';
    label.textContent = state.screenMode === 'complete' ? `${competition().shortName} kura sonucu` : `${competition().shortName} kura takımı`;
    const name = document.createElement('div');
    name.className = 'selected-club-name';
    name.textContent = state.selectedTeam.name;
    copy.append(label, name);
    els.selectedClubCard.append(createCrest(state.selectedTeam, 'large'), copy);
  }
  function createFixtureSlot(fixture, index, enteringIndex = null) {
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = 'fixture-slot';
    slot.dataset.fixtureIndex = String(index);
    const isVisible = state.screenMode === 'custom' || state.screenMode === 'complete' || index < state.revealedCount;
    if (isVisible && fixture.team) slot.classList.add('is-filled');
    if (index === enteringIndex && fixture.team) slot.classList.add('is-entering', drawPotSides().left.includes(fixture.pot) ? 'from-left' : 'from-right');
    if (state.screenMode === 'custom' && state.activeCustomSlot === index) slot.classList.add('is-custom-active');
    if (state.screenMode === 'draw' && state.controlMode === 'manual' && index === state.currentIndex) slot.classList.add('is-current-manual');
    if (isVisible && fixture.team) slot.appendChild(createCrest(fixture.team));
    else {
      const fixtureIndex = document.createElement('span');
      fixtureIndex.className = 'fixture-index';
      fixtureIndex.textContent = String(index + 1).padStart(2, '0');
      slot.appendChild(fixtureIndex);
    }
    const main = document.createElement('span');
    main.className = 'fixture-main';
    const teamName = document.createElement('span');
    teamName.className = 'fixture-team';
    teamName.textContent = isVisible && fixture.team ? fixture.team.name : `Pot ${fixture.pot} rakibi bekleniyor`;
    const meta = document.createElement('span');
    meta.className = 'fixture-meta';
    meta.textContent = isVisible && fixture.team ? `Pot ${fixture.pot} · ${fixture.team.country}` : `Pot ${fixture.pot}`;
    main.append(teamName, meta);
    const venue = document.createElement('span');
    venue.className = `venue-badge ${fixture.home ? 'home' : 'away'}`;
    venue.textContent = fixture.home ? 'H' : 'A';
    venue.title = fixture.home ? 'İç saha' : 'Deplasman';
    slot.append(main, venue);
    if (state.screenMode === 'custom') slot.addEventListener('click', () => {
      state.activeCustomSlot = index;
      setStatus(`Pot ${fixture.pot} için bir rakip seç.`);
      renderFixtureList(); renderDrawPots();
    });
    else slot.disabled = true;
    return slot;
  }
  function renderFixtureList(enteringIndex = null) { els.fixtureList.replaceChildren(...state.fixtures.map((fixture, index) => createFixtureSlot(fixture, index, enteringIndex))); }
  function updateProgress() {
    const total = state.fixtures.length || 1;
    const visible = state.screenMode === 'custom' || state.screenMode === 'complete' ? state.fixtures.filter((fixture) => fixture.team).length : state.revealedCount;
    els.progressBar.style.width = `${Math.round((visible / total) * 100)}%`;
  }

  function updateControlPanel() {
    const drawing = state.screenMode === 'draw';
    els.drawControlPanel.hidden = !drawing;
    els.modeControl.querySelectorAll('[data-control-mode]').forEach((button) => button.classList.toggle('is-active', button.dataset.controlMode === state.controlMode));
    els.speedControl.querySelectorAll('[data-speed]').forEach((button) => button.classList.toggle('is-active', Number(button.dataset.speed) === state.autoSpeed));
    els.speedControlGroup.style.opacity = state.controlMode === 'auto' ? '1' : '0.48';
    els.manualControl.hidden = !drawing || state.controlMode !== 'manual';
    els.manualSelectButton.classList.toggle('is-running', state.manualActive);
    els.manualSelectButton.textContent = state.manualActive ? 'Şimdi seç' : 'Seçimi başlat';
    els.manualSelectButton.disabled = !drawing || state.processing || state.currentIndex >= state.fixtures.length;
    if (!state.manualActive) els.manualCountdown.textContent = state.currentIndex >= state.fixtures.length ? 'Bitti' : 'Hazır';
  }
  function clearPulseClasses() {
    document.querySelectorAll('.team-button.is-roulette, .team-button.is-decoy, .team-button.is-winner, .team-button.is-manual-pulse').forEach((button) => button.classList.remove('is-roulette', 'is-decoy', 'is-winner', 'is-manual-pulse'));
    state.manualPulseButton = null;
  }
  function findTeamButton(team) { return document.querySelector(`.draw-side .team-button[data-team-index="${teamIndex(team)}"]`); }
  function fixtureTarget(index) { return els.fixtureList.querySelector(`[data-fixture-index="${index}"]`); }
  function clearManualTimers() {
    clearInterval(state.manualPulseTimer); clearInterval(state.manualCountdownTimer); clearTimeout(state.manualTimeout);
    state.manualPulseTimer = null; state.manualCountdownTimer = null; state.manualTimeout = null; state.manualActive = false;
    state.manualPulseButton?.classList.remove('is-manual-pulse'); state.manualPulseButton = null;
  }
  function clearAutoTimer() { clearTimeout(state.autoTimer); state.autoTimer = null; }

  async function pulseCandidates(candidates, cycles, token) {
    let previous = null;
    for (let step = 0; step < cycles; step += 1) {
      if (token !== state.drawToken || state.screenMode !== 'draw') break;
      previous?.classList.remove('is-roulette');
      const button = findTeamButton(candidates[step % candidates.length]);
      button?.classList.add('is-roulette');
      previous = button;
      await wait(autoTime(BASE_TIMING.rouletteStep));
    }
    previous?.classList.remove('is-roulette');
  }
  async function flyTeamCard(team, sourceElement, targetElement, options = {}) {
    const { reverse = false, duration = autoTime(BASE_TIMING.fly) } = options;
    if (prefersReducedMotion || !sourceElement || !targetElement) { await wait(20); return; }
    const sourceRect = sourceElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    const card = document.createElement('div');
    card.className = 'flying-card';
    Object.assign(card.style, { left: `${sourceRect.left}px`, top: `${sourceRect.top}px`, width: `${sourceRect.width}px`, height: `${sourceRect.height}px`, '--fly-duration': `${duration}ms`, '--fly-back-duration': `${duration}ms` });
    const inner = document.createElement('div');
    inner.className = 'flying-card-inner';
    inner.appendChild(createCrest(team));
    const name = document.createElement('div');
    name.className = 'flying-card-name';
    name.textContent = team.name;
    inner.appendChild(name); card.appendChild(inner); document.body.appendChild(card);
    await nextFrame();
    card.classList.add('is-travelling');
    Object.assign(card.style, { left: `${targetRect.left}px`, top: `${targetRect.top}px`, width: `${targetRect.width}px`, height: `${targetRect.height}px` });
    await wait(duration);
    if (reverse) {
      card.classList.add('is-rejected'); await wait(autoTime(BASE_TIMING.decoyHold)); card.classList.add('is-returning');
      Object.assign(card.style, { left: `${sourceRect.left}px`, top: `${sourceRect.top}px`, width: `${sourceRect.width}px`, height: `${sourceRect.height}px` });
      await wait(duration);
    } else {
      card.classList.add('is-arrived'); await wait(autoTime(BASE_TIMING.winnerHold)); card.style.opacity = '0'; await wait(autoTime(BASE_TIMING.fade));
    }
    card.remove();
  }
  async function animateAutoFixture(fixture, fixtureIndex, token) {
    const allPotTeams = shuffle(getTeamsForPot(fixture.pot));
    if (!allPotTeams.length) return;
    setStatus(`Pot ${fixture.pot} taranıyor...`);
    await pulseCandidates(allPotTeams, BASE_TIMING.rouletteCycles + Math.floor(Math.random() * 5), token);
    if (token !== state.drawToken || state.screenMode !== 'draw') return;
    const target = fixtureTarget(fixtureIndex);
    const decoys = allPotTeams.filter((team) => team !== fixture.team);
    if (decoys.length && Math.random() < 0.58) {
      const decoy = randomItem(decoys); const decoyButton = findTeamButton(decoy);
      decoyButton?.classList.add('is-decoy'); setStatus(`${decoy.name} öne çıktı... son uygunluk kontrolü yapılıyor.`);
      await flyTeamCard(decoy, decoyButton, target, { reverse: true }); decoyButton?.classList.remove('is-decoy');
      if (token !== state.drawToken || state.screenMode !== 'draw') return;
      await pulseCandidates(shuffle(allPotTeams), 5 + Math.floor(Math.random() * 4), token);
    }
    const winnerButton = findTeamButton(fixture.team);
    winnerButton?.classList.add('is-winner');
    setStatus(`${fixture.team.name} seçildi. ${fixture.home ? 'İç saha' : 'Deplasman'} maçı.`);
    await flyTeamCard(fixture.team, winnerButton, target, { reverse: false });
    winnerButton?.classList.remove('is-winner');
  }
  function revealCurrentFixture() {
    const enteringIndex = state.currentIndex;
    state.revealedCount = Math.min(state.currentIndex + 1, state.fixtures.length);
    state.currentIndex = state.revealedCount;
    clearPulseClasses(); renderFixtureList(enteringIndex); renderDrawPots(); updateProgress();
  }
  function scheduleAutoNext(delay = BASE_TIMING.betweenFixtures) {
    clearAutoTimer();
    if (state.controlMode !== 'auto' || state.screenMode !== 'draw' || state.processing) return;
    state.autoTimer = setTimeout(() => runAutoNext(), autoTime(delay));
  }
  async function runAutoNext() {
    if (state.controlMode !== 'auto' || state.screenMode !== 'draw' || state.processing) return;
    if (state.currentIndex >= state.fixtures.length) { completeDraw({ showOverview: true }); return; }
    state.processing = true; updateControlPanel();
    const token = state.drawToken; const fixture = state.fixtures[state.currentIndex]; const fixtureIndex = state.currentIndex;
    try {
      await animateAutoFixture(fixture, fixtureIndex, token);
      if (token !== state.drawToken || state.screenMode !== 'draw') return;
      revealCurrentFixture();
    } finally { state.processing = false; updateControlPanel(); }
    if (state.currentIndex >= state.fixtures.length) completeDraw({ showOverview: true });
    else if (state.controlMode === 'auto') scheduleAutoNext();
    else setStatus(`Pot ${state.fixtures[state.currentIndex].pot} için Seçimi başlat tuşuna bas.`);
  }

  function startManualRoulette() {
    if (state.screenMode !== 'draw' || state.controlMode !== 'manual' || state.processing || state.manualActive) return;
    if (state.currentIndex >= state.fixtures.length) { completeDraw({ showOverview: true }); return; }
    const fixture = state.fixtures[state.currentIndex];
    let candidates = shuffle(getTeamsForPot(fixture.pot)); let cursor = 0;
    const deadline = Date.now() + BASE_TIMING.manualWindow;
    state.manualActive = true;
    setStatus(`Pot ${fixture.pot}: takımlar yanıyor. Şimdi seç'e bas veya 10 saniye dolunca sistem seçsin.`);
    const pulse = () => {
      state.manualPulseButton?.classList.remove('is-manual-pulse');
      if (cursor >= candidates.length) { candidates = shuffle(candidates); cursor = 0; }
      const button = findTeamButton(candidates[cursor++]);
      button?.classList.add('is-manual-pulse'); state.manualPulseButton = button;
    };
    pulse();
    state.manualPulseTimer = setInterval(pulse, prefersReducedMotion ? 20 : BASE_TIMING.manualPulse);
    const updateCountdown = () => { const remaining = Math.max(0, deadline - Date.now()); els.manualCountdown.textContent = `${(remaining / 1000).toFixed(1)} sn`; };
    updateCountdown(); state.manualCountdownTimer = setInterval(updateCountdown, 100);
    state.manualTimeout = setTimeout(() => settleManualSelection(false), BASE_TIMING.manualWindow);
    updateControlPanel();
  }
  async function settleManualSelection(byUser) {
    if (!state.manualActive || state.processing || state.screenMode !== 'draw') return;
    clearManualTimers(); state.processing = true; updateControlPanel();
    const token = state.drawToken; const fixture = state.fixtures[state.currentIndex]; const fixtureIndex = state.currentIndex;
    const winnerButton = findTeamButton(fixture.team); const target = fixtureTarget(fixtureIndex);
    clearPulseClasses(); winnerButton?.classList.add('is-winner');
    setStatus(byUser ? `${fixture.team.name} seçildi. Tuşa basma anın sonucu etkilemez; kura kurallı tablodan gelir.` : `10 saniye doldu. ${fixture.team.name} otomatik seçildi.`);
    await flyTeamCard(fixture.team, winnerButton, target, { duration: prefersReducedMotion ? 8 : (byUser ? BASE_TIMING.manualFlyPressed : BASE_TIMING.manualFlyTimeout) });
    winnerButton?.classList.remove('is-winner');
    if (token !== state.drawToken || state.screenMode !== 'draw') { state.processing = false; return; }
    revealCurrentFixture(); state.processing = false; updateControlPanel();
    if (state.currentIndex >= state.fixtures.length) completeDraw({ showOverview: true });
    else if (state.controlMode === 'auto') scheduleAutoNext(300);
    else setStatus(`Pot ${state.fixtures[state.currentIndex].pot} için Seçimi başlat tuşuna bas.`);
  }
  function setControlMode(mode) {
    if (!['auto', 'manual'].includes(mode) || state.screenMode !== 'draw' || state.controlMode === mode) return;
    state.controlMode = mode; clearAutoTimer(); updateControlPanel();
    if (mode === 'auto') {
      if (state.manualActive) settleManualSelection(true);
      else if (!state.processing) { setStatus(`Otomatik moda geçildi. Hız: ${state.autoSpeed}×.`); scheduleAutoNext(180); }
    } else if (state.processing) setStatus('Seç tuşu modu aktif. Devam eden seçim tamamlandıktan sonra kura duraklayacak.');
    else setStatus(`Pot ${state.fixtures[state.currentIndex]?.pot || '-'} için Seçimi başlat tuşuna bas.`);
  }
  function setAutoSpeed(speed) {
    if (![1, 1.5, 2].includes(speed)) return;
    state.autoSpeed = speed; updateControlPanel();
    if (state.screenMode === 'draw' && state.controlMode === 'auto') {
      setStatus(`Otomatik hız ${speed}× olarak ayarlandı.`);
      if (!state.processing) scheduleAutoNext(150);
    }
  }
  function stopDrawActivity() {
    clearAutoTimer(); clearManualTimers(); clearPulseClasses();
    document.querySelectorAll('.flying-card').forEach((card) => card.remove());
    state.processing = false; state.running = false;
  }
  function completeDraw({ showOverview = true, scrollOverview = false } = {}) {
    stopDrawActivity(); state.screenMode = 'complete'; state.currentIndex = state.fixtures.length; state.revealedCount = state.fixtures.length;
    els.drawActions.hidden = false; els.customActions.hidden = true; els.customNote.hidden = true; els.pairControls.hidden = true;
    renderSelectedClub(); renderFixtureList(); renderDrawPots(); updateProgress(); updateControlPanel();
    setStatus('Kura tamamlandı. Aşağıda bütün takımların fikstürü hazır.');
    if (showOverview) showAllFixtures({ scroll: scrollOverview });
  }
  function finishEverything() {
    if (!state.drawTable || !state.selectedTeam) return;
    state.drawToken += 1; state.fixtures = fixturesForTeam(state.selectedTeam);
    completeDraw({ showOverview: true, scrollOverview: true });
  }

  function renderOverviewFixture(fixture) {
    const row = document.createElement('div'); row.className = 'overview-fixture'; row.appendChild(createCrest(fixture.team));
    const name = document.createElement('span'); name.className = 'overview-opponent'; name.textContent = fixture.team.name;
    const meta = document.createElement('span'); meta.className = `overview-meta ${fixture.home ? 'home' : 'away'}`; meta.textContent = `P${fixture.pot} · ${fixture.home ? 'H' : 'A'}`;
    row.append(name, meta); return row;
  }
  function createOverviewTeamCard(team) {
    const card = document.createElement('button'); card.type = 'button'; card.className = 'overview-team-card';
    const head = document.createElement('div'); head.className = 'overview-team-head'; head.appendChild(createCrest(team));
    const copy = document.createElement('span'); const name = document.createElement('span'); name.className = 'overview-team-name'; name.textContent = team.name;
    const country = document.createElement('span'); country.className = 'overview-team-country'; country.textContent = team.country; copy.append(name, country);
    const tag = document.createElement('span'); tag.className = 'team-tag'; tag.textContent = `P${team.pot}`; head.append(copy, tag);
    const list = document.createElement('div'); list.className = 'overview-fixture-list'; fixturesForTeam(team).forEach((fixture) => list.appendChild(renderOverviewFixture(fixture)));
    card.append(head, list); card.addEventListener('click', () => { viewTeamDraw(team); window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' }); });
    return card;
  }
  function renderAllFixtures() {
    els.allFixturesGrid.replaceChildren();
    for (let pot = 1; pot <= competition().potCount; pot += 1) {
      const group = document.createElement('section'); group.className = 'overview-pot-group';
      const title = document.createElement('h3'); title.className = 'overview-pot-title'; title.textContent = `Pot ${pot}`;
      const grid = document.createElement('div'); grid.className = 'overview-team-grid'; getTeamsForPot(pot).forEach((team) => grid.appendChild(createOverviewTeamCard(team)));
      group.append(title, grid); els.allFixturesGrid.appendChild(group);
    }
  }
  function showAllFixtures({ scroll = false } = {}) {
    if (!state.drawTable) return;
    renderAllFixtures(); els.allFixturesSection.hidden = false;
    if (scroll) setTimeout(() => els.allFixturesSection.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' }), 80);
  }
  function viewTeamDraw(team) {
    if (state.running || state.screenMode === 'custom' || !state.drawTable) return;
    state.selectedTeam = team; state.fixtures = fixturesForTeam(team); state.revealedCount = state.fixtures.length; state.currentIndex = state.fixtures.length; state.screenMode = 'complete'; state.activeCustomSlot = null;
    els.drawTitle.textContent = team.name; renderSelectedClub(); renderFixtureList(); renderDrawPots(); updateProgress(); updateControlPanel();
    setStatus(`${team.name} için kura sonucu. Aşağıdaki kartlardan başka bir takıma geçebilirsin.`);
  }

  function showDrawScreen() {
    closeSearch(); els.body.classList.add('draw-active'); els.appHeader.hidden = true; els.selectionScreen.hidden = true; els.drawScreen.hidden = false;
    els.drawTitle.textContent = state.selectedTeam.name; els.drawKicker.textContent = competition().name; renderSelectedClub();
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }
  function startDraw() {
    if (!state.selectedTeam) return;
    stopDrawActivity(); state.drawToken += 1; state.running = true; state.processing = false; state.screenMode = 'draw'; state.revealedCount = 0; state.currentIndex = 0; state.activeCustomSlot = null; state.customBackup = null; state.overrides.clear();
    try { state.drawTable = ENGINE.generateCompetitionDraw(competition()); state.fixtures = fixturesForTeam(state.selectedTeam); }
    catch (error) { state.running = false; state.screenMode = 'selection'; showToast(error.message); return; }
    showDrawScreen(); els.drawActions.hidden = true; els.customActions.hidden = true; els.customNote.hidden = true; els.pairControls.hidden = true; els.allFixturesSection.hidden = true; els.progressBar.style.width = '0%';
    renderDrawPots(); renderFixtureList(); updateControlPanel();
    if (state.controlMode === 'auto') { setStatus(`Otomatik kura ${state.autoSpeed}× hızla başlıyor...`); scheduleAutoNext(BASE_TIMING.initialPause); }
    else setStatus(`Pot ${state.fixtures[0].pot} için Seçimi başlat tuşuna bas.`);
  }
  function showSelectionScreen() {
    state.drawToken += 1; stopDrawActivity(); state.screenMode = 'selection'; state.selectedTeam = null; state.pendingTeam = null; state.drawTable = null; state.overrides.clear(); state.fixtures = []; state.revealedCount = 0; state.currentIndex = 0; state.activeCustomSlot = null; state.customBackup = null;
    els.teamSearch.value = ''; els.body.classList.remove('draw-active'); els.appHeader.hidden = false; els.selectionScreen.hidden = false; els.drawScreen.hidden = true; els.allFixturesSection.hidden = true;
    closeSearch(); renderSelectionPots(); window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }

  function validateFixtureSet(fixtures = state.fixtures) {
    const comp = competition();
    if (fixtures.some((fixture) => !fixture.team)) return { valid: false, reason: 'Tüm eşleşme yuvalarını doldur.' };
    const names = fixtures.map((fixture) => fixture.team.name);
    if (new Set(names).size !== names.length) return { valid: false, reason: 'Aynı rakip iki kez seçilemez.' };
    if (fixtures.some((fixture) => fixture.team.country === state.selectedTeam.country)) return { valid: false, reason: 'Aynı ülkeden rakip seçilemez.' };
    const associationCounts = {}; fixtures.forEach((fixture) => { associationCounts[fixture.team.country] = (associationCounts[fixture.team.country] || 0) + 1; });
    if (Object.values(associationCounts).some((count) => count > 2)) return { valid: false, reason: 'Aynı federasyondan en fazla iki rakip seçilebilir.' };
    for (let pot = 1; pot <= comp.potCount; pot += 1) {
      const potFixtures = fixtures.filter((fixture) => fixture.pot === pot);
      if (potFixtures.length !== comp.opponentsPerPot) return { valid: false, reason: `Pot ${pot} eşleşmeleri eksik.` };
      if (comp.potCount === 4 && potFixtures.filter((fixture) => fixture.home).length !== 1) return { valid: false, reason: `Pot ${pot} için bir iç saha ve bir deplasman maçı olmalı.` };
    }
    if (comp.potCount === 6) for (const [firstPot, secondPot] of [[1, 2], [3, 4], [5, 6]]) {
      const pair = fixtures.filter((fixture) => fixture.pot === firstPot || fixture.pot === secondPot);
      if (pair.filter((fixture) => fixture.home).length !== 1) return { valid: false, reason: `Pot ${firstPot}-${secondPot} çiftinde bir iç saha ve bir deplasman olmalı.` };
    }
    return { valid: true, reason: '' };
  }
  function nextCustomSlot(afterIndex = -1) {
    const emptyAfter = state.fixtures.findIndex((fixture, index) => index > afterIndex && !fixture.team);
    if (emptyAfter !== -1) return emptyAfter;
    const anyEmpty = state.fixtures.findIndex((fixture) => !fixture.team);
    if (anyEmpty !== -1) return anyEmpty;
    return Math.min(afterIndex + 1, state.fixtures.length - 1);
  }
  function handleCustomTeamSelection(team) {
    if (state.activeCustomSlot === null) { showToast('Önce ortadaki eşleşme yuvalarından birini seç.'); return; }
    const validity = customCandidateValidity(team, state.activeCustomSlot);
    if (!validity.valid) { showToast(validity.reason); return; }
    const changedIndex = state.activeCustomSlot; state.fixtures[changedIndex].team = team; state.activeCustomSlot = nextCustomSlot(changedIndex);
    const nextFixture = state.fixtures[state.activeCustomSlot];
    setStatus(state.fixtures.every((fixture) => fixture.team) ? 'Kişisel kura hazır. Son kontrolleri yapıp tamamlayabilirsin.' : `Pot ${nextFixture.pot} için bir rakip seç.`);
    renderFixtureList(changedIndex); renderDrawPots(); renderPairControls(); updateProgress(); els.finishCustomButton.disabled = !validateFixtureSet().valid;
  }
  function swapHomeAwayForPots(pots) { state.fixtures.filter((fixture) => pots.includes(fixture.pot)).forEach((fixture) => { fixture.home = !fixture.home; }); renderFixtureList(); renderPairControls(); }
  function renderPairControls() {
    if (state.screenMode !== 'custom') { els.pairControls.hidden = true; els.pairControls.replaceChildren(); return; }
    const groups = competition().potCount === 4 ? [[1], [2], [3], [4]] : [[1, 2], [3, 4], [5, 6]];
    els.pairControls.replaceChildren();
    groups.forEach((pots) => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'pair-swap';
      button.textContent = pots.length === 1 ? `Pot ${pots[0]} H/A değiştir` : `Pot ${pots.join('-')} H/A değiştir`;
      button.addEventListener('click', () => swapHomeAwayForPots(pots)); els.pairControls.appendChild(button);
    });
    els.pairControls.hidden = false;
  }
  function enterCustomMode() {
    stopDrawActivity(); state.screenMode = 'custom'; state.customBackup = cloneFixtures(state.fixtures); state.activeCustomSlot = 0;
    els.drawActions.hidden = true; els.customActions.hidden = false; els.customNote.hidden = false; els.allFixturesSection.hidden = true;
    setStatus(`Pot ${state.fixtures[0].pot} için bir rakip seç veya mevcut sonucu düzenle.`);
    renderFixtureList(); renderDrawPots(); renderPairControls(); updateProgress(); updateControlPanel(); els.finishCustomButton.disabled = !validateFixtureSet().valid;
  }
  function cancelCustomMode() {
    state.fixtures = cloneFixtures(state.customBackup); state.customBackup = null; state.activeCustomSlot = null; state.screenMode = 'complete'; state.revealedCount = state.fixtures.length;
    els.customActions.hidden = true; els.customNote.hidden = true; els.drawActions.hidden = false;
    setStatus('Kişisel seçim iptal edildi. Önceki kura sonucu geri yüklendi.');
    renderPairControls(); renderFixtureList(); renderDrawPots(); updateProgress(); updateControlPanel(); showAllFixtures();
  }
  function resetCustomSelections() {
    state.fixtures = state.fixtures.map((fixture) => ({ ...fixture, team: null })); state.activeCustomSlot = 0; els.finishCustomButton.disabled = true;
    setStatus(`Pot ${state.fixtures[0].pot} için bir rakip seç.`); renderFixtureList(); renderDrawPots(); renderPairControls(); updateProgress();
  }
  function finishCustomMode() {
    const validation = validateFixtureSet(); if (!validation.valid) { showToast(validation.reason); return; }
    state.overrides.set(state.selectedTeam.name, cloneFixtures(state.fixtures)); state.screenMode = 'complete'; state.revealedCount = state.fixtures.length; state.currentIndex = state.fixtures.length; state.activeCustomSlot = null; state.customBackup = null;
    els.customActions.hidden = true; els.customNote.hidden = true; els.drawActions.hidden = false;
    setStatus('Kişisel kura tamamlandı ve bütün kurallar doğrulandı.');
    renderPairControls(); renderFixtureList(); renderDrawPots(); updateProgress(); updateControlPanel(); showAllFixtures();
  }
  function setLeague(leagueId) {
    if (!DATA.competitions[leagueId]) return;
    state.leagueId = leagueId; applyTheme(); renderBrand(); renderCompetitionPicker(); showSelectionScreen();
  }

  els.teamSearch.addEventListener('focus', renderSearchResults);
  els.teamSearch.addEventListener('input', renderSearchResults);
  els.teamSearch.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { closeSearch(); els.teamSearch.blur(); return; }
    if (event.key === 'Enter') { event.preventDefault(); const firstTeam = searchTeams(els.teamSearch.value)[0]; if (firstTeam) { openConfirmation(firstTeam); closeSearch(); } }
  });
  document.addEventListener('pointerdown', (event) => { if (!els.searchResults.hidden && !els.searchResults.contains(event.target) && event.target !== els.teamSearch) closeSearch(); });
  els.initialModeChoice.addEventListener('click', (event) => { const button = event.target.closest('[data-initial-mode]'); if (button) { state.pendingControlMode = button.dataset.initialMode; updateInitialModeUI(); } });
  els.initialSpeedControl.addEventListener('click', (event) => { const button = event.target.closest('[data-initial-speed]'); if (button) { state.pendingSpeed = Number(button.dataset.initialSpeed); updateInitialModeUI(); } });
  els.cancelConfirmButton.addEventListener('click', closeConfirmation);
  els.confirmBackdrop.addEventListener('click', (event) => { if (event.target === els.confirmBackdrop) closeConfirmation(); });
  els.confirmDrawButton.addEventListener('click', () => {
    if (!state.pendingTeam) return;
    const team = state.pendingTeam; state.controlMode = state.pendingControlMode; state.autoSpeed = state.pendingSpeed; state.selectedTeam = team;
    closeConfirmation(); startDraw();
  });
  els.modeControl.addEventListener('click', (event) => { const button = event.target.closest('[data-control-mode]'); if (button) setControlMode(button.dataset.controlMode); });
  els.speedControl.addEventListener('click', (event) => { const button = event.target.closest('[data-speed]'); if (button) setAutoSpeed(Number(button.dataset.speed)); });
  els.manualSelectButton.addEventListener('click', () => { if (state.manualActive) settleManualSelection(true); else startManualRoulette(); });
  els.finishAllButton.addEventListener('click', finishEverything);
  els.retryButton.addEventListener('click', startDraw);
  els.showOverviewButton.addEventListener('click', () => showAllFixtures({ scroll: true }));
  els.customizeButton.addEventListener('click', enterCustomMode);
  els.changeTeamButton.addEventListener('click', showSelectionScreen);
  els.cancelCustomButton.addEventListener('click', cancelCustomMode);
  els.resetCustomButton.addEventListener('click', resetCustomSelections);
  els.finishCustomButton.addEventListener('click', finishCustomMode);
  els.hideOverviewButton.addEventListener('click', () => { els.allFixturesSection.hidden = true; });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !els.confirmBackdrop.hidden) closeConfirmation(); });

  setLeague('ucl');
})();
