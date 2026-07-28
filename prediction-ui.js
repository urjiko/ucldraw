(() => {
  'use strict';

  const ENGINE = window.UCLDRAW_PREDICTION_ENGINE;
  const drawScreen = document.getElementById('drawScreen');
  const drawActions = document.getElementById('drawActions');
  const drawTitle = document.getElementById('drawTitle');
  if (!ENGINE || !drawScreen || !drawActions || !drawTitle) return;

  let predictionState = null;
  let predictionKey = null;

  const entryButton = document.createElement('button');
  entryButton.type = 'button';
  entryButton.className = 'action-button primary prediction-entry-button';
  entryButton.textContent = 'Tahmin kısmına geç';
  entryButton.hidden = true;
  drawActions.appendChild(entryButton);

  const section = document.createElement('section');
  section.id = 'predictionSection';
  section.className = 'prediction-section';
  section.hidden = true;
  drawScreen.appendChild(section);

  function createCrest(team, size = 'normal') {
    const shell = document.createElement('span');
    shell.className = `crest-shell prediction-crest${size === 'large' ? ' large' : ''}`;
    const fallback = document.createElement('span');
    fallback.className = 'crest-fallback';
    fallback.textContent = String(team.name).split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
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
    if (!value) return 'Tarih daha sonra';
    return new Intl.DateTimeFormat('tr-TR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(new Date(`${value}T12:00:00Z`));
  }

  function zoneText(zone) {
    if (zone === 'direct') return 'Son 16';
    if (zone === 'playoff') return 'Play-off';
    return 'Elendi';
  }

  function resultText(points) {
    if (points === 3) return 'Galibiyet';
    if (points === 1) return 'Beraberlik';
    return 'Mağlubiyet';
  }

  function selectedMatches() {
    if (!predictionState) return [];
    return predictionState.matches
      .filter((match) => match.home.name === predictionState.selectedTeamName || match.away.name === predictionState.selectedTeamName)
      .sort((first, second) => first.matchday - second.matchday);
  }

  function scoreForTeam(fixture) {
    const score = fixture.score;
    return fixture.home
      ? `${score.homeGoals}-${score.awayGoals}`
      : `${score.awayGoals}-${score.homeGoals}`;
  }

  function buildHeader(rows) {
    const selectedRow = rows.find((row) => row.team.name === predictionState.selectedTeamName);
    const completion = ENGINE.progress(predictionState);
    const header = document.createElement('header');
    header.className = 'prediction-header glass';

    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'action-button prediction-back-button';
    back.textContent = 'Kura sonuçlarına dön';
    back.addEventListener('click', leavePrediction);

    const copy = document.createElement('div');
    copy.className = 'prediction-header-copy';
    const kicker = document.createElement('span');
    kicker.className = 'prediction-kicker';
    kicker.textContent = `${predictionState.comp.shortName} · Lig aşaması tahmini`;
    const title = document.createElement('h2');
    title.textContent = predictionState.selectedTeamName;
    const description = document.createElement('p');
    description.textContent = 'Her maç için 3, 1 veya 0 puanı seç. Skoru değiştirdiğinde aynı haftadaki diğer maçlar yeniden simüle edilir.';
    copy.append(kicker, title, description);

    const summary = document.createElement('div');
    summary.className = `prediction-summary zone-${selectedRow.zone}`;
    const rank = document.createElement('strong');
    rank.textContent = `${selectedRow.rank}. sıra`;
    const stats = document.createElement('span');
    stats.textContent = `${selectedRow.points} puan · ${selectedRow.goalDifference >= 0 ? '+' : ''}${selectedRow.goalDifference} averaj`;
    const status = document.createElement('span');
    status.className = 'prediction-summary-status';
    status.textContent = completion.done
      ? zoneText(selectedRow.zone)
      : `${completion.completed}/${completion.total} kişisel tahmin · geçici olarak ${zoneText(selectedRow.zone)}`;
    summary.append(rank, stats, status);

    header.append(back, copy, summary);
    return header;
  }

  function createPointsControl(match, score) {
    const control = document.createElement('div');
    control.className = 'prediction-points-control';
    const locked = Boolean(predictionState.locked[match.id]);
    const currentPoints = ENGINE.selectedPoints(match, score, predictionState.selectedTeamName);
    [3, 1, 0].forEach((points) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'prediction-points-button';
      button.textContent = String(points);
      button.title = `${resultText(points)} tahmini`;
      button.setAttribute('aria-label', `${resultText(points)}: ${points} puan`);
      button.classList.toggle('is-active', locked && currentPoints === points);
      button.addEventListener('click', () => {
        ENGINE.applyPoints(predictionState, match.id, points);
        render();
      });
      control.appendChild(button);
    });
    return control;
  }

  function createFixtureCard(match) {
    const score = predictionState.scores[match.id];
    const selectedHome = match.home.name === predictionState.selectedTeamName;
    const opponent = selectedHome ? match.away : match.home;
    const card = document.createElement('article');
    card.className = `prediction-fixture-card glass${predictionState.locked[match.id] ? ' is-confirmed' : ''}`;

    const top = document.createElement('div');
    top.className = 'prediction-fixture-top';
    const week = document.createElement('span');
    week.textContent = `Hafta ${match.matchday}`;
    const date = document.createElement('time');
    date.dateTime = match.date || '';
    date.textContent = formatDate(match.date);
    top.append(week, date);

    const teams = document.createElement('div');
    teams.className = 'prediction-fixture-teams';
    function teamSide(team, home) {
      const side = document.createElement('div');
      side.className = `prediction-team-side${team.name === predictionState.selectedTeamName ? ' is-user-team' : ''}`;
      side.appendChild(createCrest(team));
      const copy = document.createElement('span');
      const name = document.createElement('strong');
      name.textContent = team.name;
      const venue = document.createElement('small');
      venue.textContent = home ? 'İç saha' : 'Deplasman';
      copy.append(name, venue);
      side.appendChild(copy);
      return side;
    }
    teams.append(teamSide(match.home, true), teamSide(match.away, false));

    const scoreEditor = document.createElement('div');
    scoreEditor.className = 'prediction-score-editor';
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
    apply.textContent = 'Skoru uygula';
    apply.addEventListener('click', () => {
      ENGINE.setManualScore(predictionState, match.id, homeInput.value, awayInput.value);
      render();
    });
    scoreEditor.append(homeInput, separator, awayInput, apply);

    const footer = document.createElement('div');
    footer.className = 'prediction-fixture-footer';
    footer.appendChild(createPointsControl(match, score));
    const context = document.createElement('span');
    context.className = 'prediction-travel-context';
    context.textContent = selectedHome
      ? `${opponent.country} rakibi · ev sahibi avantajı`
      : ENGINE.travelContext(opponent, match.date);
    footer.appendChild(context);

    const modelLabel = document.createElement('span');
    modelLabel.className = 'prediction-model-label';
    modelLabel.textContent = predictionState.locked[match.id]
      ? `${ENGINE.selectedPoints(match, score, predictionState.selectedTeamName)} puan seçildi`
      : 'Model tahmini · henüz kişisel seçim yapılmadı';

    card.append(top, teams, scoreEditor, footer, modelLabel);
    return card;
  }

  function buildFixturesPanel() {
    const panel = document.createElement('section');
    panel.className = 'prediction-fixtures-panel';
    const heading = document.createElement('div');
    heading.className = 'prediction-panel-heading';
    const title = document.createElement('h3');
    title.textContent = 'Maç tahminleri';
    const note = document.createElement('span');
    note.textContent = '3 galibiyet · 1 beraberlik · 0 mağlubiyet';
    heading.append(title, note);
    const list = document.createElement('div');
    list.className = 'prediction-fixture-list';
    selectedMatches().forEach((match) => list.appendChild(createFixtureCard(match)));
    panel.append(heading, list);
    return panel;
  }

  function createHoverFixture(fixture) {
    const row = document.createElement('div');
    row.className = 'prediction-hover-fixture';
    const week = document.createElement('span');
    week.textContent = `H${fixture.match.matchday}`;
    const opponent = document.createElement('span');
    opponent.textContent = `${fixture.home ? 'Ev' : 'Dep'} · ${fixture.opponent.name}`;
    const score = document.createElement('strong');
    score.textContent = scoreForTeam(fixture);
    row.append(week, opponent, score);
    return row;
  }

  function createStandingRow(row) {
    const element = document.createElement('div');
    element.className = `prediction-standing-row zone-${row.zone}${row.team.name === predictionState.selectedTeamName ? ' is-selected-team' : ''}`;
    element.tabIndex = 0;

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
    element.append(rank, team, played, goalsFor, goalsAgainst, difference, points);

    const hover = document.createElement('aside');
    hover.className = 'prediction-hover-card';
    const hoverTitle = document.createElement('strong');
    hoverTitle.textContent = `${row.team.name} tahmini fikstürü`;
    hover.appendChild(hoverTitle);
    row.fixtures.forEach((fixture) => hover.appendChild(createHoverFixture(fixture)));
    element.appendChild(hover);
    return element;
  }

  function buildStandingsPanel(rows) {
    const panel = document.createElement('section');
    panel.className = 'prediction-standings-panel glass';
    const heading = document.createElement('div');
    heading.className = 'prediction-panel-heading';
    const title = document.createElement('h3');
    title.textContent = 'Canlı tahmini puan durumu';
    const note = document.createElement('span');
    note.textContent = 'Takımın üstüne gelerek tahmini fikstürü gör';
    heading.append(title, note);

    const legend = document.createElement('div');
    legend.className = 'prediction-zone-legend';
    legend.innerHTML = '<span class="zone-direct">1–8 Son 16</span><span class="zone-playoff">9–24 Play-off</span><span class="zone-eliminated">25–36 Elendi</span>';

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
    if (!predictionState) return;
    const rows = ENGINE.standings(predictionState);
    section.replaceChildren();
    section.appendChild(buildHeader(rows));
    const layout = document.createElement('div');
    layout.className = 'prediction-layout';
    layout.append(buildFixturesPanel(), buildStandingsPanel(rows));
    section.appendChild(layout);
  }

  function enterPrediction() {
    const draw = window.UCLDRAW_LAST_DRAW;
    const selectedName = drawTitle.textContent.trim();
    if (!draw?.competition || !draw?.table || !draw.competition.teams.some((team) => team.name === selectedName)) return;
    const nextKey = `${draw.generatedAt}:${selectedName}`;
    if (!predictionState || predictionKey !== nextKey) {
      predictionState = ENGINE.createState(draw.competition, draw.table, draw.leagueId, selectedName, nextKey);
      predictionKey = nextKey;
    }
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
    leavePrediction();
    updateEntryVisibility();
  });
  new MutationObserver(() => {
    if (document.body.dataset.league !== window.UCLDRAW_LAST_DRAW?.leagueId) leavePrediction();
  }).observe(document.body, { attributes: true, attributeFilter: ['data-league'] });
  updateEntryVisibility();
})();
