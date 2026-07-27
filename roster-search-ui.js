(() => {
  'use strict';

  const data = window.UCLDRAW_DATA;
  const manager = window.UCLDRAW_ROSTER_MANAGER;
  const searchInput = document.getElementById('teamSearch');
  const searchResults = document.getElementById('searchResults');
  const selectionScreen = document.getElementById('selectionScreen');
  const selectionPots = document.getElementById('selectionPots');
  const toast = document.getElementById('toast');

  if (!data?.competitions || !manager || !searchInput || !searchResults || !selectionScreen || !selectionPots) return;

  let visibleResults = [];
  let activeBackdrop = null;
  let toastTimer = null;
  let bypassPotAction = false;

  function leagueId() {
    return document.body.dataset.league || 'ucl';
  }

  function normalize(value = '') {
    return String(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('tr-TR')
      .trim();
  }

  function initials(name) {
    return String(name).split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  }

  function createCrest(team, large = false) {
    const shell = document.createElement('span');
    shell.className = `crest-shell${large ? ' large' : ''}`;
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

  function showToast(message) {
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 4200);
  }

  function isSelectionVisible() {
    return !selectionScreen.hidden;
  }

  function selectedVersion(team) {
    return manager.selectedTeam(leagueId(), team.poolSlug);
  }

  function formatPots(pots) {
    const values = [...new Set(pots)].sort((first, second) => first - second);
    if (!values.length) return 'Pot belirlenemedi';
    if (values.length === 1) return `Pot ${values[0]}`;
    return values.map((pot) => `Pot ${pot}`).join(' veya ');
  }

  function movementText(scenario, limit = 2) {
    const changes = scenario.potChanges || [];
    if (!changes.length) return 'Diğer takımların potu değişmez';
    const visible = changes.slice(0, limit)
      .map((change) => `${change.team.name}: P${change.fromPot}→P${change.toPot}`);
    const remaining = changes.length - visible.length;
    return remaining > 0 ? `${visible.join(' · ')} · +${remaining} takım` : visible.join(' · ');
  }

  function searchTeams(query) {
    const id = leagueId();
    const normalizedQuery = normalize(query);
    const source = normalizedQuery ? manager.allTeams(id) : data.competitions[id].teams;

    return source
      .filter((team) => {
        if (!normalizedQuery) return true;
        return normalize(`${team.name} ${team.country} ${team.poolSlug}`).includes(normalizedQuery);
      })
      .sort((first, second) => {
        const firstName = normalize(first.name);
        const secondName = normalize(second.name);
        const firstExact = firstName === normalizedQuery;
        const secondExact = secondName === normalizedQuery;
        if (firstExact !== secondExact) return firstExact ? -1 : 1;
        const firstStarts = firstName.startsWith(normalizedQuery);
        const secondStarts = secondName.startsWith(normalizedQuery);
        if (firstStarts !== secondStarts) return firstStarts ? -1 : 1;
        const firstSelected = Boolean(manager.selectedTeam(id, first.poolSlug));
        const secondSelected = Boolean(manager.selectedTeam(id, second.poolSlug));
        if (firstSelected !== secondSelected) return firstSelected ? -1 : 1;
        return (second.coefficient || 0) - (first.coefficient || 0)
          || first.name.localeCompare(second.name, 'tr');
      })
      .slice(0, 50);
  }

  function closeSearch() {
    searchResults.hidden = true;
    searchInput.setAttribute('aria-expanded', 'false');
  }

  function renderSearchResults() {
    if (!isSelectionVisible()) return;
    visibleResults = searchTeams(searchInput.value);
    searchResults.replaceChildren();

    if (!visibleResults.length) {
      const empty = document.createElement('li');
      empty.className = 'empty-state';
      empty.textContent = 'Bu lig havuzunda takım bulunamadı.';
      searchResults.appendChild(empty);
    } else {
      visibleResults.forEach((team) => {
        const id = leagueId();
        const selected = manager.selectedTeam(id, team.poolSlug);
        const possiblePots = selected ? [selected.pot] : manager.possiblePots(id, team);
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `roster-search-result${selected ? ' is-current-roster' : ' is-reserve-roster'}`;
        button.dataset.poolSlug = team.poolSlug;
        button.appendChild(createCrest(selected || team));

        const copy = document.createElement('span');
        copy.className = 'roster-search-copy';
        const name = document.createElement('strong');
        name.textContent = team.name;
        const meta = document.createElement('span');
        meta.textContent = selected
          ? `Pot ${selected.pot} · ${selected.country} · Kadroda`
          : `${formatPots(possiblePots)} · ${team.country} · Kadroya ekle`;
        copy.append(name, meta);

        const badge = document.createElement('span');
        badge.className = 'roster-search-badge';
        badge.textContent = selected ? `P${selected.pot}` : '+';
        button.append(copy, badge);
        button.addEventListener('pointerdown', (event) => event.stopPropagation());
        button.addEventListener('mousedown', (event) => event.preventDefault());
        button.addEventListener('click', () => activateTeam(team));
        item.appendChild(button);
        searchResults.appendChild(item);
      });
    }

    searchResults.hidden = false;
    searchInput.setAttribute('aria-expanded', 'true');
  }

  function frame() {
    return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }

  async function refreshLeague(targetLeagueId) {
    const otherButton = [...document.querySelectorAll('#competitionPicker [data-league]')]
      .find((button) => button.dataset.league !== targetLeagueId);
    if (!otherButton) throw new Error('Lig görünümü yenilenemedi.');

    otherButton.click();
    await frame();
    const targetButton = [...document.querySelectorAll('#competitionPicker [data-league]')]
      .find((button) => button.dataset.league === targetLeagueId);
    if (!targetButton) throw new Error('Seçili lige geri dönülemedi.');

    targetButton.click();
    await frame();
  }

  function nativeSelect(team) {
    const competition = data.competitions[leagueId()];
    const selected = competition.teams.find((candidate) => candidate.poolSlug === team.poolSlug);
    const index = competition.teams.indexOf(selected);
    const button = selectionPots.querySelector(`.team-button[data-team-index="${index}"]`);
    if (!button) return false;

    closeSearch();
    bypassPotAction = true;
    button.click();
    bypassPotAction = false;
    return true;
  }

  async function refreshLeagueAndSelect(targetLeagueId, incomingSlug) {
    await refreshLeague(targetLeagueId);
    const inserted = manager.selectedTeam(targetLeagueId, incomingSlug);
    if (!inserted || !nativeSelect(inserted)) throw new Error('Eklenen takım seçim ekranında bulunamadı.');
  }

  function closeActiveModal() {
    activeBackdrop?.remove();
    activeBackdrop = null;
    document.body.style.overflow = '';
  }

  function createModal(titleId, extraClass = '') {
    closeActiveModal();
    activeBackdrop = document.createElement('div');
    activeBackdrop.className = `modal-backdrop roster-replacement-backdrop ${extraClass}`.trim();
    const modal = document.createElement('section');
    modal.className = 'confirm-modal glass roster-replacement-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', titleId);
    activeBackdrop.appendChild(modal);
    activeBackdrop.addEventListener('click', (event) => {
      if (event.target === activeBackdrop) closeActiveModal();
    });
    document.body.appendChild(activeBackdrop);
    document.body.style.overflow = 'hidden';
    return modal;
  }

  function createTeamHeader(team, kickerText, descriptionText, titleId) {
    const row = document.createElement('div');
    row.className = 'roster-incoming-team';
    row.appendChild(createCrest(team, true));
    const copy = document.createElement('div');
    const kicker = document.createElement('span');
    kicker.textContent = kickerText;
    const title = document.createElement('h2');
    title.id = titleId;
    title.textContent = team.name;
    const description = document.createElement('p');
    description.textContent = descriptionText;
    copy.append(kicker, title, description);
    row.appendChild(copy);
    return row;
  }

  function createCancelButton(label = 'Vazgeç') {
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'action-button';
    cancel.textContent = label;
    cancel.addEventListener('click', closeActiveModal);
    return cancel;
  }

  async function applyScenario(scenario, selectIncoming) {
    const targetLeagueId = scenario.competitionId;
    manager.replaceTeam(targetLeagueId, scenario.incoming.poolSlug, scenario.outgoing.poolSlug);
    closeActiveModal();
    if (selectIncoming) await refreshLeagueAndSelect(targetLeagueId, scenario.incoming.poolSlug);
    else await refreshLeague(targetLeagueId);
    showToast(`${scenario.incoming.name}, ${scenario.outgoing.name} yerine eklendi. ${movementText(scenario, 1)}.`);
  }

  function scenarioOption(scenario, mode, selectIncoming) {
    const displayedTeam = mode === 'outgoing' ? scenario.outgoing : scenario.incoming;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'roster-replacement-option';
    button.appendChild(createCrest(displayedTeam));

    const copy = document.createElement('span');
    const name = document.createElement('strong');
    name.textContent = displayedTeam.name;
    const meta = document.createElement('span');
    if (mode === 'outgoing') {
      meta.textContent = `Şu an P${scenario.outgoing.pot} · ${scenario.incoming.name} P${scenario.incomingPot} olur · ${movementText(scenario)}`;
    } else {
      meta.textContent = `${scenario.incoming.country} · P${scenario.incomingPot} olur · ${movementText(scenario)}`;
    }
    copy.append(name, meta);

    const action = document.createElement('span');
    action.className = 'roster-replacement-action';
    action.textContent = mode === 'outgoing' ? 'Çıkar' : 'Ekle';
    button.append(copy, action);
    button.addEventListener('click', async () => {
      button.disabled = true;
      try {
        await applyScenario(scenario, selectIncoming);
      } catch (error) {
        button.disabled = false;
        showToast(error.message);
      }
    });
    return button;
  }

  function openReplacementModal(incoming) {
    closeSearch();
    const targetLeagueId = leagueId();
    const scenarios = manager.replacementScenarios(targetLeagueId, incoming);
    const possiblePots = manager.possiblePots(targetLeagueId, incoming);
    const modal = createModal('rosterReplacementTitle');
    modal.appendChild(createTeamHeader(
      incoming,
      `${formatPots(possiblePots)} kadro senaryosu`,
      'Yalnızca eleme havuzundan seçilmiş takımlar çıkarılabilir. Her seçenek 36 takımı yeniden sıralar ve gerçek pot kaymalarını gösterir.',
      'rosterReplacementTitle'
    ));

    const list = document.createElement('div');
    list.className = 'roster-replacement-list';
    scenarios.forEach((scenario) => list.appendChild(scenarioOption(scenario, 'outgoing', true)));
    if (!scenarios.length) {
      const empty = document.createElement('p');
      empty.className = 'roster-modal-empty';
      empty.textContent = 'Bu kadroda çıkarılabilecek eleme takımı bulunamadı.';
      list.appendChild(empty);
    }

    const cancel = createCancelButton();
    modal.append(list, cancel);
    cancel.focus();
  }

  function renderIncomingScenarios(list, scenarios, query, outgoing) {
    const normalizedQuery = normalize(query);
    const filtered = scenarios.filter((scenario) => {
      if (!normalizedQuery) return true;
      const team = scenario.incoming;
      return normalize(`${team.name} ${team.country} ${team.poolSlug}`).includes(normalizedQuery);
    });
    list.replaceChildren();
    filtered.forEach((scenario) => list.appendChild(scenarioOption(scenario, 'incoming', false)));
    if (!filtered.length) {
      const empty = document.createElement('p');
      empty.className = 'roster-modal-empty';
      empty.textContent = `${outgoing.name} yerine uygun takım bulunamadı.`;
      list.appendChild(empty);
    }
  }

  function openIncomingPicker(outgoing) {
    const targetLeagueId = leagueId();
    const scenarios = manager.incomingScenarios(targetLeagueId, outgoing);
    const modal = createModal('rosterIncomingTitle', 'roster-incoming-picker-backdrop');
    modal.appendChild(createTeamHeader(
      outgoing,
      `Pot ${outgoing.pot} · kadrodan çıkar`,
      'Aşağıdan yerine gelecek takımı seç. Seçimden sonra bütün 36 takım katsayıya göre yeniden potlara ayrılır.',
      'rosterIncomingTitle'
    ));

    const filter = document.createElement('input');
    filter.type = 'search';
    filter.className = 'roster-modal-search';
    filter.placeholder = 'Yerine gelecek takımı ara...';
    filter.setAttribute('aria-label', 'Yerine gelecek takımı ara');
    const list = document.createElement('div');
    list.className = 'roster-replacement-list';
    renderIncomingScenarios(list, scenarios, '', outgoing);
    filter.addEventListener('input', () => renderIncomingScenarios(list, scenarios, filter.value, outgoing));

    const cancel = createCancelButton('Geri dön');
    modal.append(filter, list, cancel);
    filter.focus();
  }

  function openTeamActionModal(team) {
    closeSearch();
    const id = leagueId();
    const removable = manager.isRemovable(id, team);
    const guaranteed = manager.isGuaranteed(team);
    const modal = createModal('rosterTeamActionTitle', 'roster-team-action-backdrop');
    modal.appendChild(createTeamHeader(
      team,
      `Pot ${team.pot} · ${team.country}`,
      guaranteed
        ? 'Bu takım garanti katılımcı olduğu için kadrodan çıkarılamaz.'
        : 'Bu takımla kura çekebilir veya kura başlamadan kadrodaki yerini başka bir eleme takımıyla değiştirebilirsin.',
      'rosterTeamActionTitle'
    ));

    const actions = document.createElement('div');
    actions.className = 'roster-team-actions';
    const draw = document.createElement('button');
    draw.type = 'button';
    draw.className = 'action-button primary';
    draw.textContent = 'Bu takımla kura çek';
    draw.addEventListener('click', () => {
      closeActiveModal();
      nativeSelect(team);
    });
    actions.appendChild(draw);

    if (removable) {
      const replace = document.createElement('button');
      replace.type = 'button';
      replace.className = 'action-button';
      replace.textContent = 'Kadrodan değiştir';
      replace.addEventListener('click', () => openIncomingPicker(team));
      actions.appendChild(replace);
    } else {
      const locked = document.createElement('div');
      locked.className = 'roster-locked-note';
      locked.textContent = 'Garanti katılımcı kilitli';
      actions.appendChild(locked);
    }

    const cancel = createCancelButton();
    modal.append(actions, cancel);
    draw.focus();
  }

  function activateTeam(team) {
    const selected = selectedVersion(team);
    if (selected) openTeamActionModal(selected);
    else openReplacementModal(team);
  }

  searchInput.placeholder = 'Kadroda olmasa da takım ara...';
  const selectionDescription = document.querySelector('.selection-heading p');
  if (selectionDescription) {
    selectionDescription.textContent = 'Takıma basıp kura çek veya eleme takımını değiştir. Kadro dışındaki takımlar da aramada görünür.';
  }

  selectionPots.addEventListener('click', (event) => {
    if (!isSelectionVisible() || bypassPotAction) return;
    const button = event.target.closest('.team-button[data-team-index]');
    if (!button || !selectionPots.contains(button)) return;
    const competition = data.competitions[leagueId()];
    const team = competition?.teams[Number(button.dataset.teamIndex)];
    if (!team) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openTeamActionModal(team);
  }, true);

  searchInput.addEventListener('focus', (event) => {
    if (!isSelectionVisible()) return;
    event.stopImmediatePropagation();
    renderSearchResults();
  }, true);
  searchInput.addEventListener('input', (event) => {
    if (!isSelectionVisible()) return;
    event.stopImmediatePropagation();
    renderSearchResults();
  }, true);
  searchInput.addEventListener('keydown', (event) => {
    if (!isSelectionVisible()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeSearch();
      searchInput.blur();
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (visibleResults[0]) activateTeam(visibleResults[0]);
    }
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && activeBackdrop) closeActiveModal();
  });
})();
