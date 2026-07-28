(() => {
  'use strict';

  const ENGINE = window.UCLDRAW_PREDICTION_ENGINE;
  const drawScreen = document.getElementById('drawScreen');
  const drawActions = document.getElementById('drawActions');
  const drawTitle = document.getElementById('drawTitle');
  const changeTeamButton = document.getElementById('changeTeamButton');
  if (!ENGINE || !drawScreen || !drawActions || !drawTitle) return;
  if (changeTeamButton) changeTeamButton.textContent = 'Başa Dön';

  let predictionState = null;
  let predictionKey = null;
  let activeTeamName = null;

  const entryButton = document.createElement('button');
  entryButton.type = 'button';
  entryButton.className = 'action-button primary prediction-entry-button';
  entryButton.textContent = 'Tahminlere Geç';
  entryButton.hidden = true;
  drawActions.appendChild(entryButton);

  const section = document.createElement('section');
  section.id = 'predictionSection';
  section.className = 'prediction-section';
  section.hidden = true;
  drawScreen.appendChild(section);

  function initials(name) {
    return String(name).split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  }

  function createCrest(team, large = false) {
    const shell = document.createElement('span');
    shell.className = `crest-shell prediction-crest${large ? ' large' : ''}`;
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

  function formatDate(value) {
    if (!value) return 'Tarih bekleniyor';
    return new Intl.DateTimeFormat('tr-TR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(new Date(`${value}T12:00:00Z`));
  }

  function zoneText(zone) {
    if (zone === 'direct') return 'Son 16';
    if (zone === 'playoff') return 'Play-off';
    return 'Elendi';
  }

  function activeTeam() {
    return predictionState?.comp.teams.find((team) => team.name === activeTeamName) || null;
  }

  function matchesForTeam(teamName = activeTeamName) {
    if (!predictionState || !teamName) return [];
    return predictionState.matches
      .filter((match) => match.home.name === teamName || match.away.name === teamName)
      .sort((first, second) => first.matchday - second.matchday);
  }

  function buildHeader(rows) {
    const row = rows.find((candidate) => candidate.team.name === activeTeamName);
    const teamProgress = ENGINE.progress(predictionState, activeTeamName);
    const tournament = ENGINE.tournamentProgress(predictionState);
    const header = document.createElement('header');
    header.className = 'prediction-header glass';

    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'action-button prediction-back-button';
    back.textContent = 'Kura Sonuçları';
    back.addEventListener('click', leavePrediction);

    const copy = document.createElement('div');
    copy.className = 'prediction-header-copy';
    const kicker = document.createElement('span');
    kicker.className = 'prediction-kicker';
    kicker.textContent = `${predictionState.comp.shortName} · Tahmin`;
    const title = document.createElement('h2');
    title.textContent = activeTeamName;
    const description = document.createElement('p');
    description.textContent = 'Kazanan takımın logosuna bas. Beraberlik için ortadaki X’i seç.';
    copy.append(kicker, title, description);

    const controls = document.createElement('div');
    controls.className = 'prediction-header-controls';

    const lock = document.createElement('button');
    lock.type = 'button';
    lock.className = `prediction-team-lock${ENGINE.isTeamLocked(predictionState, activeTeamName) ? ' is-locked' : ''}`;
    lock.textContent = ENGINE.isTeamLocked(predictionState, activeTeamName) ? 'Kilidi Aç' : 'Takımı Kilitle';
    lock.setAttribute('aria-pressed', String(ENGINE.isTeamLocked(predictionState, activeTeamName)));
    lock.addEventListener('click', () => {
      ENGINE.toggleTeamLock(predictionState, activeTeamName);
      render();
    });

    const summary = document.createElement('div');
    summary.className = `prediction-summary zone-${row.zone}`;
    const rank = document.createElement('strong');
    rank.textContent = tournament.completed ? `${row.rank}. sıra` : `${row.points} puan`;
    const stats = document.createElement('span');
    stats.textContent = `${teamProgress.completed}/${teamProgress.total} maç · ${row.goalDifference >= 0 ? '+' : ''}${row.goalDifference} AV`;
    const status = document.createElement('span');
    status.className = 'prediction-summary-status';
    status.textContent = tournament.done
      ? zoneText(row.zone)
      : tournament.completed
        ? `${tournament.completed}/${tournament.total} maç işlendi`
        : 'Henüz maç oynanmadı';
    summary.append(rank, stats, status);

    controls.append(lock, summary);
    header.append(back, copy, controls);
    return header;
  }

  function outcomeButton(match, team, outcome, currentOutcome) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `prediction-outcome-team${currentOutcome === outcome ? ' is-active' : ''}${team.name === activeTeamName ? ' is-focus-team' : ''}`;
    button.setAttribute('aria-label', `${team.name} kazanır`);
    button.appendChild(createCrest(team, true));
    const name = document.createElement('strong');
    name.textContent = team.name;
    const venue = document.createElement('small');
    venue.textContent = outcome === 'home' ? 'Ev' : 'Dep';
    button.append(name, venue);
    button.addEventListener('click', () => {
      ENGINE.applyOutcome(predictionState, match.id, outcome);
      render();
    });
    return button;
  }

  function drawButton(match, currentOutcome) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `prediction-draw-choice${currentOutcome === 'draw' ? ' is-active' : ''}`;
    button.textContent = 'X';
    button.title = 'Beraberlik';
    button.setAttribute('aria-label', 'Beraberlik');
    button.addEventListener('click', () => {
      ENGINE.applyOutcome(predictionState, match.id, 'draw');
      render();
    });
    return button;
  }

  function scoreEditor(match, score) {
    const editor = document.createElement('div');
    editor.className = 'prediction-score-editor';
    if (!score) {
      const pending = document.createElement('span');
      pending.className = 'prediction-score-pending';
      pending.textContent = '– : –';
      editor.appendChild(pending);
      return editor;
    }

    const homeInput = document.createElement('input');
    homeInput.type = 'number';
    homeInput.min = '0';
    homeInput.max = '15';
    homeInput.inputMode = 'numeric';
    homeInput.value = String(score.homeGoals);
    homeInput.setAttribute('aria-label', `${match.home.name} gol sayısı`);

    const separator = document.createElement('span');
    separator.textContent = '–';

    const awayInput = document.createElement('input');
    awayInput.type = 'number';
    awayInput.min = '0';
    awayInput.max = '15';
    awayInput.inputMode = 'numeric';
    awayInput.value = String(score.awayGoals);
    awayInput.setAttribute('aria-label', `${match.away.name} gol sayısı`);

    const apply = document.createElement('button');
    apply.type = 'button';
    apply.className = 'prediction-score-apply';
    apply.textContent = 'Uygula';
    apply.addEventListener('click', () => {
      ENGINE.setManualScore(predictionState, match.id, homeInput.value, awayInput.value);
      render();
    });

    editor.append(homeInput, separator, awayInput, apply);
    return editor;
  }

  function createFixtureCard(match) {
    const score = predictionState.scores[match.id] || null;
    const outcome = ENGINE.outcomeFromScore(score);
    const card = document.createElement('article');
    const matchLocked = Boolean(predictionState.matchLocks[match.id]);
    const teamLocked = ENGINE.isTeamLocked(predictionState, match.home.name)
      || ENGINE.isTeamLocked(predictionState, match.away.name);
    card.className = `prediction-fixture-card glass${score ? ' is-resolved' : ''}${matchLocked ? ' is-locked' : ''}`;

    const top = document.createElement('div');
    top.className = 'prediction-fixture-top';
    const week = document.createElement('span');
    week.textContent = `H${match.matchday}`;
    const date = document.createElement('time');
    date.dateTime = match.date || '';
    date.textContent = formatDate(match.date);
    const stateLabel = document.createElement('small');
    stateLabel.textContent = matchLocked ? 'Kilitli' : teamLocked && score ? 'Takım kilidi' : score ? 'Tahmin edildi' : 'Bekliyor';
    top.append(week, date, stateLabel);

    const choices = document.createElement('div');
    choices.className = 'prediction-outcome-picker';
    choices.append(
      outcomeButton(match, match.home, 'home', outcome),
      drawButton(match, outcome),
      outcomeButton(match, match.away, 'away', outcome)
    );

    card.append(top, choices, scoreEditor(match, score));
    return card;
  }

  function buildFixturesPanel() {
    const panel = document.createElement('section');
    panel.className = 'prediction-fixtures-panel';
    const heading = document.createElement('div');
    heading.className = 'prediction-panel-heading';
    const title = document.createElement('h3');
    title.textContent = 'Maçlar';
    const note = document.createElement('span');
    note.textContent = ENGINE.isTeamLocked(predictionState, activeTeamName) ? 'Takım kilitli' : 'Sonuç seçmek için logoya bas';
    heading.append(title, note);

    const list = document.createElement('div');
    list.className = 'prediction-fixture-list';
    matchesForTeam().forEach((match) => list.appendChild(createFixtureCard(match)));
    panel.append(heading, list);
    return panel;
  }

  function createStandingRow(row) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `prediction-standing-row zone-${row.zone}${row.team.name === activeTeamName ? ' is-selected-team' : ''}${ENGINE.isTeamLocked(predictionState, row.team.name) ? ' is-locked-team' : ''}`;
    button.setAttribute('aria-label', `${row.team.name} maçlarını düzenle`);

    const rank = document.createElement('span');
    rank.className = 'prediction-rank';
    rank.textContent = String(row.rank);

    const team = document.createElement('span');
    team.className = 'prediction-standing-team';
    team.appendChild(createCrest(row.team));
    const name = document.createElement('strong');
    name.textContent = row.team.name;
    team.appendChild(name);

    const played = document.createElement('span');
    played.textContent = String(row.played);
    const goalsFor = document.createElement('span');
    goalsFor.textContent = String(row.goalsFor);
    const goalsAgainst = document.createElement('span');
    goalsAgainst.textContent = String(row.goalsAgainst);
    const difference = document.createElement('span');
    difference.textContent = `${row.goalDifference >= 0 ? '+' : ''}${row.goalDifference}`;
    const points = document.createElement('strong');
    points.className = 'prediction-standing-points';
    points.textContent = String(row.points);

    button.append(rank, team, played, goalsFor, goalsAgainst, difference, points);
    button.addEventListener('click', () => {
      activeTeamName = row.team.name;
      render();
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return button;
  }

  function buildStandingsPanel(rows) {
    const panel = document.createElement('section');
    panel.className = 'prediction-standings-panel glass';
    const heading = document.createElement('div');
    heading.className = 'prediction-panel-heading';
    const title = document.createElement('h3');
    title.textContent = 'Puan Durumu';
    const note = document.createElement('span');
    note.textContent = 'Takıma basarak maçlarını düzenle';
    heading.append(title, note);

    const legend = document.createElement('div');
    legend.className = 'prediction-zone-legend';
    legend.innerHTML = '<span class="zone-direct">1–8</span><span class="zone-playoff">9–24</span><span class="zone-eliminated">25–36</span>';

    const table = document.createElement('div');
    table.className = 'prediction-standings-table';
    const labels = document.createElement('div');
    labels.className = 'prediction-standing-labels';
    labels.innerHTML = '<span>#</span><span>Takım</span><span>O</span><span>A</span><span>Y</span><span>AV</span><span>P</span>';
    table.appendChild(labels);
    rows.forEach((row) => table.appendChild(createStandingRow(row)));

    panel.append(heading, legend, table);
    return panel;
  }

  function render() {
    if (!predictionState || !activeTeam()) return;
    const rows = ENGINE.standings(predictionState);
    section.replaceChildren(buildHeader(rows));
    const layout = document.createElement('div');
    layout.className = 'prediction-layout';
    layout.append(buildFixturesPanel(), buildStandingsPanel(rows));
    section.appendChild(layout);
  }

  function enterPrediction() {
    const draw = window.UCLDRAW_LAST_DRAW;
    const selectedName = drawTitle.textContent.trim();
    if (!draw?.competition || !draw?.table || !draw.competition.teams.some((team) => team.name === selectedName)) return;

    const nextKey = String(draw.generatedAt);
    if (!predictionState || predictionKey !== nextKey) {
      predictionState = ENGINE.createState(draw.competition, draw.table, draw.leagueId, selectedName, nextKey);
      predictionKey = nextKey;
    }
    activeTeamName = selectedName;
    document.body.classList.add('prediction-active');
    section.hidden = false;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function leavePrediction() {
    document.body.classList.remove('prediction-active');
    section.hidden = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateEntryVisibility() {
    entryButton.hidden = drawActions.hidden || !window.UCLDRAW_LAST_DRAW;
  }

  entryButton.addEventListener('click', enterPrediction);
  new MutationObserver(updateEntryVisibility).observe(drawActions, { attributes: true, attributeFilter: ['hidden'] });
  new MutationObserver(() => {
    if (section.hidden) updateEntryVisibility();
  }).observe(drawTitle, { childList: true, characterData: true, subtree: true });

  window.addEventListener('ucldraw:draw-generated', () => {
    predictionState = null;
    predictionKey = null;
    activeTeamName = null;
    leavePrediction();
    updateEntryVisibility();
  });

  new MutationObserver(() => {
    if (document.body.dataset.league !== window.UCLDRAW_LAST_DRAW?.leagueId) leavePrediction();
  }).observe(document.body, { attributes: true, attributeFilter: ['data-league'] });

  updateEntryVisibility();
})();