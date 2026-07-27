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
  let replacementBackdrop = null;
  let toastTimer = null;

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
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3600);
  }

  function isSelectionVisible() {
    return !selectionScreen.hidden;
  }

  function selectedVersion(team) {
    return manager.selectedTeam(leagueId(), team.poolSlug);
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
        const projectedPot = selected?.pot || manager.projectedPot(id, team);
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
          : `Pot ${projectedPot} · ${team.country} · Kadroya ekle`;
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

  function selectCurrentTeam(team) {
    const competition = data.competitions[leagueId()];
    const selected = competition.teams.find((candidate) => candidate.poolSlug === team.poolSlug);
    const index = competition.teams.indexOf(selected);
    const button = selectionPots.querySelector(`.team-button[data-team-index="${index}"]`);
    if (button) {
      closeSearch();
      button.click();
      return true;
    }
    return false;
  }

  function frame() {
    return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }

  async function refreshLeagueAndSelect(targetLeagueId, incomingSlug) {
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
    const inserted = manager.selectedTeam(targetLeagueId, incomingSlug);
    if (!inserted || !selectCurrentTeam(inserted)) throw new Error('Eklenen takım seçim ekranında bulunamadı.');
  }

  function closeReplacementModal() {
    replacementBackdrop?.remove();
    replacementBackdrop = null;
    document.body.style.overflow = '';
  }

  function replacementButton(team, incoming, targetLeagueId) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'roster-replacement-option';
    button.appendChild(createCrest(team));

    const copy = document.createElement('span');
    const name = document.createElement('strong');
    name.textContent = team.name;
    const meta = document.createElement('span');
    const stage = team.qualificationStage === 'guaranteed' ? 'Garanti takım' : 'Eleme adayı';
    meta.textContent = `${team.country} · ${stage} · ${Number(team.coefficient || 0).toFixed(3)}`;
    copy.append(name, meta);

    const action = document.createElement('span');
    action.className = 'roster-replacement-action';
    action.textContent = 'Çıkar';
    button.append(copy, action);
    button.addEventListener('click', async () => {
      button.disabled = true;
      try {
        manager.replaceTeam(targetLeagueId, incoming.poolSlug, team.poolSlug);
        closeReplacementModal();
        await refreshLeagueAndSelect(targetLeagueId, incoming.poolSlug);
        showToast(`${incoming.name}, ${team.name} yerine kadroya eklendi.`);
      } catch (error) {
        button.disabled = false;
        showToast(error.message);
      }
    });
    return button;
  }

  function openReplacementModal(incoming) {
    closeSearch();
    closeReplacementModal();
    const targetLeagueId = leagueId();
    const pot = manager.projectedPot(targetLeagueId, incoming);
    const candidates = manager.replacementCandidates(targetLeagueId, incoming);

    replacementBackdrop = document.createElement('div');
    replacementBackdrop.className = 'modal-backdrop roster-replacement-backdrop';
    const modal = document.createElement('section');
    modal.className = 'confirm-modal glass roster-replacement-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'rosterReplacementTitle');

    const incomingRow = document.createElement('div');
    incomingRow.className = 'roster-incoming-team';
    incomingRow.appendChild(createCrest(incoming, true));
    const incomingCopy = document.createElement('div');
    const kicker = document.createElement('span');
    kicker.textContent = `Pot ${pot} kadro değişikliği`;
    const title = document.createElement('h2');
    title.id = 'rosterReplacementTitle';
    title.textContent = incoming.name;
    const description = document.createElement('p');
    description.textContent = `${incoming.name} katsayısına göre Pot ${pot} sınırına giriyor. Aşağıdan yerine çıkacak takımı seç.`;
    incomingCopy.append(kicker, title, description);
    incomingRow.appendChild(incomingCopy);

    const list = document.createElement('div');
    list.className = 'roster-replacement-list';
    candidates.forEach((team) => list.appendChild(replacementButton(team, incoming, targetLeagueId)));

    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'action-button';
    cancel.textContent = 'Vazgeç';
    cancel.addEventListener('click', closeReplacementModal);

    modal.append(incomingRow, list, cancel);
    replacementBackdrop.appendChild(modal);
    replacementBackdrop.addEventListener('click', (event) => {
      if (event.target === replacementBackdrop) closeReplacementModal();
    });
    document.body.appendChild(replacementBackdrop);
    document.body.style.overflow = 'hidden';
    cancel.focus();
  }

  function activateTeam(team) {
    const selected = selectedVersion(team);
    if (selected) selectCurrentTeam(selected);
    else openReplacementModal(team);
  }

  searchInput.placeholder = 'Kadroda olmasa da takım ara...';
  const selectionDescription = document.querySelector('.selection-heading p');
  if (selectionDescription) {
    selectionDescription.textContent = 'Mevcut torbalardan seç veya kadro dışındaki bir takımı arayıp aynı pottaki takımla değiştir.';
  }

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
    if (event.key === 'Escape' && replacementBackdrop) closeReplacementModal();
  });
})();
