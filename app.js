(() => {
  'use strict';

  const DATA = window.UCLDRAW_DATA;
  if (!DATA?.competitions) throw new Error('Competition data could not be loaded.');

  const competitionOrder = ['ucl', 'uel', 'uecl'];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const els = {
    body: document.body,
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
    drawActions: document.getElementById('drawActions'),
    customActions: document.getElementById('customActions'),
    customNote: document.getElementById('customNote'),
    pairControls: document.getElementById('pairControls'),
    retryButton: document.getElementById('retryButton'),
    customizeButton: document.getElementById('customizeButton'),
    changeTeamButton: document.getElementById('changeTeamButton'),
    finishCustomButton: document.getElementById('finishCustomButton'),
    resetCustomButton: document.getElementById('resetCustomButton'),
    cancelCustomButton: document.getElementById('cancelCustomButton'),
    confirmBackdrop: document.getElementById('confirmBackdrop'),
    confirmCrest: document.getElementById('confirmCrest'),
    confirmTitle: document.getElementById('confirmTitle'),
    confirmText: document.getElementById('confirmText'),
    cancelConfirmButton: document.getElementById('cancelConfirmButton'),
    confirmDrawButton: document.getElementById('confirmDrawButton'),
    toast: document.getElementById('toast')
  };

  const state = {
    leagueId: 'ucl', selectedTeam: null, pendingTeam: null, mode: 'selection',
    fixtures: [], revealedCount: 0, running: false, drawToken: 0,
    activeCustomSlot: null, customBackup: null, toastTimer: null
  };

  const competition = () => DATA.competitions[state.leagueId];

  function normalize(value = '') {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('tr-TR').trim();
  }

  function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function randomItem(items) { return items[Math.floor(Math.random() * items.length)]; }
  function wait(ms) { return new Promise((resolve) => window.setTimeout(resolve, prefersReducedMotion ? 5 : ms)); }
  function nextFrame() { return new Promise((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve))); }

  function hexToRgb(hex) {
    const value = Number.parseInt(hex.replace('#', ''), 16);
    return `${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}`;
  }

  function initials(name) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  }

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

  function teamIndex(team) { return competition().teams.indexOf(team); }

  function showToast(message) {
    window.clearTimeout(state.toastTimer);
    els.toast.textContent = message;
    els.toast.classList.add('is-visible');
    state.toastTimer = window.setTimeout(() => els.toast.classList.remove('is-visible'), 2600);
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
    els.rulesChip.textContent = comp.potCount === 6
      ? '6 torba · 6 rakip · 3 iç saha / 3 deplasman'
      : '4 torba · 8 rakip · 4 iç saha / 4 deplasman';
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

    button.addEventListener('click', () => {
      if (comp.id === state.leagueId) return;
      if (state.running) { showToast('Kura devam ederken lig değiştirilemez.'); return; }
      setLeague(comp.id);
    });
    return button;
  }

  function renderCompetitionPicker() {
    const primary = createLeagueButton(competition(), true);
    const secondaryRow = document.createElement('div');
    secondaryRow.className = 'league-secondary-row';
    competitionOrder.filter((id) => id !== state.leagueId)
      .forEach((id) => secondaryRow.appendChild(createLeagueButton(DATA.competitions[id], false)));
    els.competitionPicker.replaceChildren(primary, secondaryRow);
  }

  function getTeamsForPot(pot) { return competition().teams.filter((team) => team.pot === pot); }
  function getSelectedFixtureTeams() { return state.fixtures.map((fixture) => fixture.team).filter(Boolean); }

  function customCandidateValidity(team, slotIndex) {
    const slot = state.fixtures[slotIndex];
    if (!slot) return { valid: false, reason: 'Önce bir eşleşme yuvası seç.' };
    if (team.pot !== slot.pot) return { valid: false, reason: `Bu yuva Pot ${slot.pot} için ayrıldı.` };
    if (team === state.selectedTeam) return { valid: false, reason: 'Takım kendisiyle eşleşemez.' };
    if (team.country === state.selectedTeam.country) return { valid: false, reason: 'Aynı ülkeden takımlar eşleşemez.' };

    const otherTeams = state.fixtures.filter((_, index) => index !== slotIndex)
      .map((fixture) => fixture.team).filter(Boolean);
    if (otherTeams.includes(team)) return { valid: false, reason: 'Aynı rakip iki kez seçilemez.' };
    const associationCount = otherTeams.filter((otherTeam) => otherTeam.country === team.country).length;
    if (associationCount >= 2) return { valid: false, reason: 'Aynı federasyondan en fazla iki rakip seçilebilir.' };
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
      button.title = 'Seçtiğin takım';
    }
    if (getSelectedFixtureTeams().includes(team)) button.classList.add('is-drawn');

    if (state.mode === 'custom') {
      const validity = state.activeCustomSlot === null
        ? { valid: false, reason: 'Önce bir eşleşme yuvası seç.' }
        : customCandidateValidity(team, state.activeCustomSlot);
      if (!validity.valid) button.classList.add('is-unavailable');
      button.disabled = false;
      button.title = validity.reason;
      button.addEventListener('click', () => handleCustomTeamSelection(team));
    } else button.disabled = true;
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

  function drawPotSides() {
    return competition().potCount === 6
      ? { left: [1, 2, 3], right: [4, 5, 6] }
      : { left: [1, 2], right: [3, 4] };
  }

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

  function closeSearch() {
    els.searchResults.hidden = true;
    els.teamSearch.setAttribute('aria-expanded', 'false');
  }

  function renderSearchResults() {
    const teams = searchTeams(els.teamSearch.value).slice(0, 36);
    els.searchResults.replaceChildren();
    if (!teams.length) {
      const empty = document.createElement('li');
      empty.className = 'empty-state';
      empty.textContent = 'Takım bulunamadı.';
      els.searchResults.appendChild(empty);
    } else {
      teams.forEach((team) => {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.appendChild(createCrest(team));
        const label = document.createElement('span');
        label.textContent = `${team.name} · Pot ${team.pot} · ${team.country}`;
        button.appendChild(label);
        button.addEventListener('mousedown', (event) => {
          event.preventDefault(); openConfirmation(team); closeSearch();
        });
        item.appendChild(button);
        els.searchResults.appendChild(item);
      });
    }
    els.searchResults.hidden = false;
    els.teamSearch.setAttribute('aria-expanded', 'true');
  }

  function openConfirmation(team) {
    state.pendingTeam = team;
    els.confirmCrest.replaceChildren(createCrest(team, 'large'));
    els.confirmTitle.textContent = `${team.name} hazır`;
    els.confirmText.textContent = `${team.name} ile kura çekimi başlayacak. Rakipler turnuva kurallarına göre belirlenecek. Hazır mısın?`;
    els.confirmBackdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    els.confirmDrawButton.focus();
  }

  function closeConfirmation() {
    els.confirmBackdrop.hidden = true;
    document.body.style.overflow = '';
    state.pendingTeam = null;
  }

  function buildSlotPots(comp) {
    const pots = [];
    for (let round = 0; round < comp.opponentsPerPot; round += 1)
      for (let pot = 1; pot <= comp.potCount; pot += 1) pots.push(pot);
    return pots;
  }

  function solveOpponentSlots(comp, selectedTeam) {
    const slotPots = buildSlotPots(comp);
    const candidatesByPot = new Map();
    for (let pot = 1; pot <= comp.potCount; pot += 1) {
      candidatesByPot.set(pot, comp.teams.filter((team) =>
        team.pot === pot && team !== selectedTeam && team.country !== selectedTeam.country));
    }

    const selected = [];
    const associationCounts = new Map();
    function backtrack(slotIndex) {
      if (slotIndex >= slotPots.length) return true;
      const pot = slotPots[slotIndex];
      const candidates = shuffle(candidatesByPot.get(pot) || []).sort((a, b) =>
        (associationCounts.get(a.country) || 0) - (associationCounts.get(b.country) || 0));
      for (const candidate of candidates) {
        if (selected.includes(candidate)) continue;
        const countryCount = associationCounts.get(candidate.country) || 0;
        if (countryCount >= 2) continue;
        selected.push(candidate);
        associationCounts.set(candidate.country, countryCount + 1);
        if (backtrack(slotIndex + 1)) return true;
        selected.pop();
        if (countryCount === 0) associationCounts.delete(candidate.country);
        else associationCounts.set(candidate.country, countryCount);
      }
      return false;
    }

    if (!backtrack(0)) throw new Error('Bu takım listesiyle kurallara uygun kura üretilemedi. Torba ve ülke dağılımını kontrol et.');
    return slotPots.map((pot, index) => ({ pot, team: selected[index], home: false }));
  }

  function assignVenues(fixtures, comp) {
    if (comp.potCount === 4) {
      for (let pot = 1; pot <= 4; pot += 1) {
        const indexes = fixtures.map((fixture, index) => ({ fixture, index }))
          .filter((entry) => entry.fixture.pot === pot).map((entry) => entry.index);
        const firstIsHome = Math.random() < 0.5;
        fixtures[indexes[0]].home = firstIsHome;
        fixtures[indexes[1]].home = !firstIsHome;
      }
      return fixtures;
    }
    [[1, 2], [3, 4], [5, 6]].forEach(([firstPot, secondPot]) => {
      const first = fixtures.find((fixture) => fixture.pot === firstPot);
      const second = fixtures.find((fixture) => fixture.pot === secondPot);
      const firstIsHome = Math.random() < 0.5;
      first.home = firstIsHome;
      second.home = !firstIsHome;
    });
    return fixtures;
  }

  function generateFixtures() { return assignVenues(solveOpponentSlots(competition(), state.selectedTeam), competition()); }

  function renderSelectedClub() {
    els.selectedClubCard.replaceChildren();
    if (!state.selectedTeam) return;
    const copy = document.createElement('div');
    copy.className = 'selected-club-copy';
    const label = document.createElement('div');
    label.className = 'selected-club-label';
    label.textContent = `${competition().shortName} kura takımı`;
    const name = document.createElement('div');
    name.className = 'selected-club-name';
    name.textContent = state.selectedTeam.name;
    copy.append(label, name);
    els.selectedClubCard.append(createCrest(state.selectedTeam, 'large'), copy);
  }

  function createFixtureSlot(fixture, index, enteringIndex) {
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = 'fixture-slot';
    slot.dataset.fixtureIndex = String(index);
    const isVisible = state.mode === 'custom' || state.mode === 'complete' || index < state.revealedCount;
    if (isVisible && fixture.team) slot.classList.add('is-filled');
    if (index === enteringIndex && fixture.team) {
      const side = drawPotSides().left.includes(fixture.pot) ? 'from-left' : 'from-right';
      slot.classList.add('is-entering', side);
    }
    if (state.mode === 'custom' && state.activeCustomSlot === index) slot.classList.add('is-custom-active');

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

    if (state.mode === 'custom') {
      slot.addEventListener('click', () => {
        state.activeCustomSlot = index;
        setStatus(`Pot ${fixture.pot} için bir rakip seç.`);
        renderFixtureList(); renderDrawPots();
      });
    } else slot.disabled = true;
    return slot;
  }

  function renderFixtureList(enteringIndex = null) {
    els.fixtureList.replaceChildren(...state.fixtures.map((fixture, index) => createFixtureSlot(fixture, index, enteringIndex)));
  }

  function updateProgress() {
    const total = state.fixtures.length || 1;
    const visible = state.mode === 'custom' || state.mode === 'complete'
      ? state.fixtures.filter((fixture) => fixture.team).length : state.revealedCount;
    els.progressBar.style.width = `${Math.round((visible / total) * 100)}%`;
  }

  function clearAnimationClasses() {
    document.querySelectorAll('.team-button.is-roulette, .team-button.is-decoy, .team-button.is-winner')
      .forEach((button) => button.classList.remove('is-roulette', 'is-decoy', 'is-winner'));
  }

  function findTeamButton(team) {
    return document.querySelector(`.draw-side .team-button[data-team-index="${teamIndex(team)}"]`);
  }

  function revealedFixtures() { return state.fixtures.slice(0, state.revealedCount); }

  function currentlyEligibleTeams(pot) {
    const alreadyDrawn = revealedFixtures().map((fixture) => fixture.team);
    const associationCounts = new Map();
    alreadyDrawn.forEach((team) => associationCounts.set(team.country, (associationCounts.get(team.country) || 0) + 1));
    return getTeamsForPot(pot).filter((team) => {
      if (team === state.selectedTeam || team.country === state.selectedTeam.country || alreadyDrawn.includes(team)) return false;
      return (associationCounts.get(team.country) || 0) < 2;
    });
  }

  async function pulseCandidates(candidates, cycles, token) {
    let previousButton = null;
    for (let step = 0; step < cycles; step += 1) {
      if (token !== state.drawToken) return;
      previousButton?.classList.remove('is-roulette');
      const button = findTeamButton(candidates[step % candidates.length]);
      button?.classList.add('is-roulette');
      previousButton = button;
      await wait(55 + Math.min(step * 8, 90));
    }
    previousButton?.classList.remove('is-roulette');
  }

  async function flyTeamCard(team, sourceElement, reverse = false) {
    if (prefersReducedMotion || !sourceElement) { await wait(80); return; }
    const sourceRect = sourceElement.getBoundingClientRect();
    const targetRect = els.fixtureList.getBoundingClientRect();
    const card = document.createElement('div');
    card.className = 'flying-card';
    card.style.left = `${sourceRect.left}px`;
    card.style.top = `${sourceRect.top}px`;
    card.style.width = `${Math.max(210, sourceRect.width)}px`;
    const inner = document.createElement('div');
    inner.className = 'flying-card-inner';
    inner.appendChild(createCrest(team));
    const name = document.createElement('div');
    name.className = 'flying-card-name';
    name.textContent = team.name;
    inner.appendChild(name);
    card.appendChild(inner);
    document.body.appendChild(card);
    await nextFrame();
    const targetX = targetRect.left + targetRect.width / 2 - sourceRect.left - sourceRect.width / 2;
    const targetY = targetRect.top + Math.min(targetRect.height, 220) / 2 - sourceRect.top;
    card.style.transform = `translate(${targetX}px, ${targetY}px) scale(0.92)`;
    if (reverse) {
      await wait(330);
      card.style.transform = 'translate(0, 0) scale(1)';
      card.style.opacity = '0.35';
      await wait(300);
    } else {
      await wait(500); card.style.opacity = '0'; await wait(130);
    }
    card.remove();
  }

  async function animateFixtureSelection(fixture, fixtureIndex, token) {
    const allEligible = currentlyEligibleTeams(fixture.pot);
    const candidates = shuffle(allEligible.includes(fixture.team) ? allEligible : [...allEligible, fixture.team]);
    if (!candidates.length) return;
    const variant = randomItem(['roulette', 'fakeout', 'late-switch', 'double-check']);
    setStatus(`Pot ${fixture.pot} taranıyor...`);
    await pulseCandidates(candidates, 9 + Math.floor(Math.random() * 6), token);
    if (token !== state.drawToken) return;

    const decoys = candidates.filter((team) => team !== fixture.team);
    if (variant !== 'roulette' && decoys.length) {
      const decoy = randomItem(decoys);
      const decoyButton = findTeamButton(decoy);
      decoyButton?.classList.add('is-decoy');
      if (variant === 'fakeout') setStatus(`${decoy.name} öne çıktı... uygunluk kontrol ediliyor.`);
      else if (variant === 'late-switch') setStatus('Son saniye kontrolü yapılıyor...');
      else setStatus('Federasyon ve iç saha/deplasman dengesi doğrulanıyor...');
      await flyTeamCard(decoy, decoyButton, true);
      decoyButton?.classList.remove('is-decoy');
      if (token !== state.drawToken) return;
      await pulseCandidates(shuffle(candidates.filter((team) => team !== decoy)), 5 + Math.floor(Math.random() * 4), token);
    }

    if (token !== state.drawToken) return;
    const winnerButton = findTeamButton(fixture.team);
    winnerButton?.classList.add('is-winner');
    setStatus(`${fixture.team.name} seçildi. ${fixture.home ? 'İç saha' : 'Deplasman'} maçı.`);
    await wait(220);
    await flyTeamCard(fixture.team, winnerButton, false);
    winnerButton?.classList.remove('is-winner');
  }

  async function runDraw(token) {
    await wait(450);
    for (let index = 0; index < state.fixtures.length; index += 1) {
      if (token !== state.drawToken) return;
      const fixture = state.fixtures[index];
      await animateFixtureSelection(fixture, index, token);
      if (token !== state.drawToken) return;
      state.revealedCount = index + 1;
      clearAnimationClasses(); renderFixtureList(index); renderDrawPots(); updateProgress();
      await wait(390);
    }
    if (token !== state.drawToken) return;
    state.running = false;
    state.mode = 'complete';
    setStatus('Kura tamamlandı. Sonuçları değiştirebilir veya aynı takım için yeniden deneyebilirsin.');
    els.drawActions.hidden = false;
    renderFixtureList(); renderDrawPots(); updateProgress();
  }

  function showDrawScreen() {
    closeSearch();
    els.selectionScreen.hidden = true;
    els.drawScreen.hidden = false;
    els.drawTitle.textContent = state.selectedTeam.name;
    els.drawKicker.textContent = competition().name;
    renderSelectedClub();
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }

  function startDraw() {
    if (!state.selectedTeam) return;
    state.drawToken += 1;
    const token = state.drawToken;
    state.running = true;
    state.mode = 'draw';
    state.revealedCount = 0;
    state.activeCustomSlot = null;
    state.customBackup = null;
    try { state.fixtures = generateFixtures(); }
    catch (error) { state.running = false; state.mode = 'selection'; showToast(error.message); return; }
    showDrawScreen();
    els.drawActions.hidden = true;
    els.customActions.hidden = true;
    els.customNote.hidden = true;
    els.pairControls.hidden = true;
    els.progressBar.style.width = '0%';
    setStatus('Kura motoru kuralları kontrol ediyor...');
    renderDrawPots(); renderFixtureList(); runDraw(token);
  }

  function showSelectionScreen() {
    state.drawToken += 1;
    state.running = false;
    state.mode = 'selection';
    state.selectedTeam = null;
    state.pendingTeam = null;
    state.fixtures = [];
    state.revealedCount = 0;
    state.activeCustomSlot = null;
    state.customBackup = null;
    els.teamSearch.value = '';
    els.selectionScreen.hidden = false;
    els.drawScreen.hidden = true;
    closeSearch(); renderSelectionPots();
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }

  function validateFixtureSet(fixtures = state.fixtures) {
    const comp = competition();
    if (fixtures.some((fixture) => !fixture.team)) return { valid: false, reason: 'Tüm eşleşme yuvalarını doldur.' };
    const names = fixtures.map((fixture) => fixture.team.name);
    if (new Set(names).size !== names.length) return { valid: false, reason: 'Aynı rakip iki kez seçilemez.' };
    if (fixtures.some((fixture) => fixture.team.country === state.selectedTeam.country)) return { valid: false, reason: 'Aynı ülkeden rakip seçilemez.' };
    const associationCounts = {};
    fixtures.forEach((fixture) => { associationCounts[fixture.team.country] = (associationCounts[fixture.team.country] || 0) + 1; });
    if (Object.values(associationCounts).some((count) => count > 2)) return { valid: false, reason: 'Aynı federasyondan en fazla iki rakip seçilebilir.' };

    for (let pot = 1; pot <= comp.potCount; pot += 1) {
      const potFixtures = fixtures.filter((fixture) => fixture.pot === pot);
      if (potFixtures.length !== comp.opponentsPerPot) return { valid: false, reason: `Pot ${pot} eşleşmeleri eksik.` };
      if (comp.potCount === 4 && potFixtures.filter((fixture) => fixture.home).length !== 1)
        return { valid: false, reason: `Pot ${pot} için bir iç saha ve bir deplasman maçı olmalı.` };
    }

    if (comp.potCount === 6) {
      for (const [firstPot, secondPot] of [[1, 2], [3, 4], [5, 6]]) {
        const pair = fixtures.filter((fixture) => fixture.pot === firstPot || fixture.pot === secondPot);
        if (pair.filter((fixture) => fixture.home).length !== 1)
          return { valid: false, reason: `Pot ${firstPot}-${secondPot} çiftinde bir iç saha ve bir deplasman olmalı.` };
      }
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
    const changedIndex = state.activeCustomSlot;
    state.fixtures[changedIndex].team = team;
    state.activeCustomSlot = nextCustomSlot(changedIndex);
    const nextFixture = state.fixtures[state.activeCustomSlot];
    setStatus(state.fixtures.every((fixture) => fixture.team)
      ? 'Kişisel kura hazır. Son kontrolleri yapıp tamamlayabilirsin.'
      : `Pot ${nextFixture.pot} için bir rakip seç.`);
    renderFixtureList(changedIndex); renderDrawPots(); renderPairControls(); updateProgress();
    els.finishCustomButton.disabled = !validateFixtureSet().valid;
  }

  function swapHomeAwayForPots(pots) {
    state.fixtures.filter((fixture) => pots.includes(fixture.pot)).forEach((fixture) => { fixture.home = !fixture.home; });
    renderFixtureList(); renderPairControls();
  }

  function renderPairControls() {
    if (state.mode !== 'custom') {
      els.pairControls.hidden = true;
      els.pairControls.replaceChildren();
      return;
    }
    const groups = competition().potCount === 4 ? [[1], [2], [3], [4]] : [[1, 2], [3, 4], [5, 6]];
    els.pairControls.replaceChildren();
    groups.forEach((pots) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pair-swap';
      button.textContent = pots.length === 1 ? `Pot ${pots[0]} H/A değiştir` : `Pot ${pots.join('-')} H/A değiştir`;
      button.addEventListener('click', () => swapHomeAwayForPots(pots));
      els.pairControls.appendChild(button);
    });
    els.pairControls.hidden = false;
  }

  function enterCustomMode() {
    state.mode = 'custom';
    state.customBackup = state.fixtures.map((fixture) => ({ ...fixture }));
    state.activeCustomSlot = 0;
    els.drawActions.hidden = true;
    els.customActions.hidden = false;
    els.customNote.hidden = false;
    setStatus(`Pot ${state.fixtures[0].pot} için bir rakip seç veya mevcut sonucu düzenle.`);
    renderFixtureList(); renderDrawPots(); renderPairControls(); updateProgress();
    els.finishCustomButton.disabled = !validateFixtureSet().valid;
  }

  function cancelCustomMode() {
    state.fixtures = state.customBackup.map((fixture) => ({ ...fixture }));
    state.customBackup = null;
    state.activeCustomSlot = null;
    state.mode = 'complete';
    state.revealedCount = state.fixtures.length;
    els.customActions.hidden = true;
    els.customNote.hidden = true;
    els.drawActions.hidden = false;
    setStatus('Kişisel seçim iptal edildi. Önceki kura sonucu geri yüklendi.');
    renderPairControls(); renderFixtureList(); renderDrawPots(); updateProgress();
  }

  function resetCustomSelections() {
    state.fixtures = state.fixtures.map((fixture) => ({ ...fixture, team: null }));
    state.activeCustomSlot = 0;
    els.finishCustomButton.disabled = true;
    setStatus(`Pot ${state.fixtures[0].pot} için bir rakip seç.`);
    renderFixtureList(); renderDrawPots(); renderPairControls(); updateProgress();
  }

  function finishCustomMode() {
    const validation = validateFixtureSet();
    if (!validation.valid) { showToast(validation.reason); return; }
    state.mode = 'complete';
    state.revealedCount = state.fixtures.length;
    state.activeCustomSlot = null;
    state.customBackup = null;
    els.customActions.hidden = true;
    els.customNote.hidden = true;
    els.drawActions.hidden = false;
    setStatus('Kişisel kura tamamlandı ve bütün kurallar doğrulandı.');
    renderPairControls(); renderFixtureList(); renderDrawPots(); updateProgress();
  }

  function setLeague(leagueId) {
    if (!DATA.competitions[leagueId]) return;
    state.leagueId = leagueId;
    state.selectedTeam = null;
    state.pendingTeam = null;
    state.fixtures = [];
    state.revealedCount = 0;
    state.mode = 'selection';
    state.running = false;
    state.drawToken += 1;
    applyTheme(); renderBrand(); renderCompetitionPicker(); showSelectionScreen();
  }

  els.teamSearch.addEventListener('focus', renderSearchResults);
  els.teamSearch.addEventListener('input', renderSearchResults);
  els.teamSearch.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { closeSearch(); els.teamSearch.blur(); return; }
    if (event.key === 'Enter') {
      event.preventDefault();
      const firstTeam = searchTeams(els.teamSearch.value)[0];
      if (firstTeam) { openConfirmation(firstTeam); closeSearch(); }
    }
  });

  document.addEventListener('pointerdown', (event) => {
    if (!els.searchResults.hidden && !els.searchResults.contains(event.target) && event.target !== els.teamSearch) closeSearch();
  });

  els.cancelConfirmButton.addEventListener('click', closeConfirmation);
  els.confirmBackdrop.addEventListener('click', (event) => { if (event.target === els.confirmBackdrop) closeConfirmation(); });
  els.confirmDrawButton.addEventListener('click', () => {
    if (!state.pendingTeam) return;
    state.selectedTeam = state.pendingTeam;
    closeConfirmation(); startDraw();
  });
  els.retryButton.addEventListener('click', startDraw);
  els.customizeButton.addEventListener('click', enterCustomMode);
  els.changeTeamButton.addEventListener('click', showSelectionScreen);
  els.cancelCustomButton.addEventListener('click', cancelCustomMode);
  els.resetCustomButton.addEventListener('click', resetCustomSelections);
  els.finishCustomButton.addEventListener('click', finishCustomMode);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !els.confirmBackdrop.hidden) closeConfirmation(); });

  setLeague('ucl');
})();
