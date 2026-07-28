(() => {
  'use strict';

  const CARD_WIDTH = 1200;
  const CARD_HEIGHT = 1600;
  const imageCache = new Map();
  const leagueTitles = Object.freeze({
    ucl: 'Şampiyonlar Ligi',
    uel: 'Avrupa Ligi',
    uecl: 'Konferans Ligi'
  });

  function initials(name = '') {
    return String(name)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  function slug(value = '') {
    return String(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('en-US')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function hexToRgb(hex = '#022ae2') {
    const normalized = String(hex).replace('#', '').trim();
    const full = normalized.length === 3
      ? normalized.split('').map((character) => `${character}${character}`).join('')
      : normalized.padEnd(6, '0').slice(0, 6);
    const value = Number.parseInt(full, 16);
    return {
      r: (value >> 16) & 255,
      g: (value >> 8) & 255,
      b: value & 255
    };
  }

  function rgba(hex, alpha) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function currentCompetition() {
    return window.UCLDRAW_LAST_DRAW?.competition
      || window.UCLDRAW_DATA?.competitions?.[document.body.dataset.league || 'ucl']
      || null;
  }

  function absoluteAsset(source) {
    if (!source) return null;
    try {
      return new URL(source, document.baseURI).href;
    } catch {
      return source;
    }
  }

  function imageSource(root) {
    const image = root?.querySelector?.('img');
    return image?.currentSrc || image?.src || null;
  }

  function loadImage(source) {
    const url = absoluteAsset(source);
    if (!url) return Promise.resolve(null);
    if (imageCache.has(url)) return imageCache.get(url);

    const request = new Promise((resolve) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.decoding = 'async';
      image.addEventListener('load', () => resolve(image), { once: true });
      image.addEventListener('error', () => resolve(null), { once: true });
      image.src = url;
    });
    imageCache.set(url, request);
    return request;
  }

  function formatDate(value) {
    if (!value) return 'Tarih bekleniyor';
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(new Date(`${value}T12:00:00Z`));
  }

  function collectFixtures() {
    return [...document.querySelectorAll('#predictionSection .prediction-fixture-card')].map((card) => {
      const teams = [...card.querySelectorAll('.prediction-outcome-team')];
      const scoreInputs = [...card.querySelectorAll('.prediction-score-editor input')];
      const week = card.querySelector('.prediction-fixture-top span')?.textContent?.trim() || '';
      const time = card.querySelector('.prediction-fixture-top time');
      const readTeam = (button) => ({
        name: button?.querySelector('strong')?.textContent?.trim() || 'Takım',
        crest: imageSource(button)
      });
      return {
        week,
        date: time?.dateTime || '',
        home: readTeam(teams[0]),
        away: readTeam(teams[1]),
        score: scoreInputs.length >= 2
          ? {
              homeGoals: Number(scoreInputs[0].value || 0),
              awayGoals: Number(scoreInputs[1].value || 0)
            }
          : null
      };
    });
  }

  function collectStandings() {
    return [...document.querySelectorAll('#predictionSection .prediction-standing-row')].map((row) => {
      const cells = [...row.children];
      const zone = row.classList.contains('zone-direct')
        ? 'direct'
        : row.classList.contains('zone-playoff')
          ? 'playoff'
          : 'eliminated';
      return {
        rank: Number(cells[0]?.textContent || 0),
        team: {
          name: cells[1]?.querySelector('strong')?.textContent?.trim() || 'Takım',
          crest: imageSource(cells[1])
        },
        played: Number(cells[2]?.textContent || 0),
        goalsFor: Number(cells[3]?.textContent || 0),
        goalsAgainst: Number(cells[4]?.textContent || 0),
        goalDifference: Number(cells[5]?.textContent || 0),
        points: Number(cells[6]?.textContent || 0),
        zone,
        selected: row.classList.contains('is-selected-team')
      };
    });
  }

  function collectSnapshot() {
    const competition = currentCompetition();
    const activeName = document.querySelector('#predictionSection .prediction-header h2')?.textContent?.trim();
    const fixtures = collectFixtures();
    const standings = collectStandings();
    const activeRow = standings.find((row) => row.team.name === activeName) || standings.find((row) => row.selected) || null;
    const activeCrest = imageSource(document.querySelector('#predictionSection .prediction-header'))
      || activeRow?.team.crest
      || null;
    return {
      competition,
      activeName: activeName || 'Takım',
      activeCrest,
      fixtures,
      standings,
      activeRow
    };
  }

  function predictionsComplete() {
    const cards = [...document.querySelectorAll('#predictionSection .prediction-fixture-card')];
    return cards.length > 0 && cards.every((card) => card.classList.contains('is-resolved'));
  }

  function roundedRectPath(context, x, y, width, height, radius) {
    const safeRadius = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + safeRadius, y);
    context.arcTo(x + width, y, x + width, y + height, safeRadius);
    context.arcTo(x + width, y + height, x, y + height, safeRadius);
    context.arcTo(x, y + height, x, y, safeRadius);
    context.arcTo(x, y, x + width, y, safeRadius);
    context.closePath();
  }

  function fillRoundedRect(context, x, y, width, height, radius, fill, stroke = null) {
    context.save();
    roundedRectPath(context, x, y, width, height, radius);
    context.fillStyle = fill;
    context.fill();
    if (stroke) {
      context.strokeStyle = stroke;
      context.lineWidth = 1.5;
      context.stroke();
    }
    context.restore();
  }

  function drawImageCover(context, image, x, y, width, height) {
    if (!image?.naturalWidth || !image?.naturalHeight) return;
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const sourceWidth = width / scale;
    const sourceHeight = height / scale;
    const sourceX = (image.naturalWidth - sourceWidth) / 2;
    const sourceY = (image.naturalHeight - sourceHeight) / 2;
    context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
  }

  function drawImageContain(context, image, x, y, width, height) {
    if (!image?.naturalWidth || !image?.naturalHeight) return false;
    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const targetWidth = image.naturalWidth * scale;
    const targetHeight = image.naturalHeight * scale;
    context.drawImage(image, x + (width - targetWidth) / 2, y + (height - targetHeight) / 2, targetWidth, targetHeight);
    return true;
  }

  function fitFont(context, text, maximumWidth, startingSize, minimumSize = 12, family = 'Inter') {
    let size = startingSize;
    while (size > minimumSize) {
      context.font = `800 ${size}px ${family}`;
      if (context.measureText(text).width <= maximumWidth) break;
      size -= 1;
    }
    return size;
  }

  function drawEllipsis(context, text, x, y, maximumWidth) {
    let output = String(text || '');
    if (context.measureText(output).width <= maximumWidth) {
      context.fillText(output, x, y);
      return;
    }
    while (output.length > 1 && context.measureText(`${output}…`).width > maximumWidth) output = output.slice(0, -1);
    context.fillText(`${output}…`, x, y);
  }

  function zoneColor(zone) {
    if (zone === 'direct') return '#39dd8f';
    if (zone === 'playoff') return '#ffbe4a';
    return '#ff6174';
  }

  function zoneText(zone) {
    if (zone === 'direct') return 'Son 16';
    if (zone === 'playoff') return 'Play-off';
    return 'Elendi';
  }

  async function drawCrest(context, team, image, x, y, size, accent) {
    fillRoundedRect(context, x, y, size, size, size * 0.24, 'rgba(0, 0, 0, 0.38)', 'rgba(255, 255, 255, 0.16)');
    context.save();
    context.shadowColor = rgba(accent, 0.34);
    context.shadowBlur = size * 0.28;
    const drawn = drawImageContain(context, image, x + size * 0.12, y + size * 0.12, size * 0.76, size * 0.76);
    context.restore();
    if (drawn) return;

    context.save();
    context.fillStyle = '#fff';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = `800 ${Math.round(size * 0.3)}px Inter`;
    context.fillText(initials(team?.name), x + size / 2, y + size / 2 + 1);
    context.restore();
  }

  function drawMotif(context, leagueId, accent) {
    context.save();
    context.globalAlpha = 0.16;
    context.strokeStyle = '#fff';
    context.lineWidth = 2;
    if (leagueId === 'uel') {
      for (let x = -300; x < CARD_WIDTH + 300; x += 86) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x + 430, CARD_HEIGHT);
        context.stroke();
      }
    } else if (leagueId === 'uecl') {
      for (const [x, y, radius] of [[120, 350, 170], [1080, 470, 230], [880, 1420, 190]]) {
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.stroke();
        context.beginPath();
        context.arc(x, y, radius * 0.68, 0, Math.PI * 2);
        context.stroke();
      }
    } else {
      for (let x = -120; x < CARD_WIDTH + 180; x += 132) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x + 520, CARD_HEIGHT);
        context.stroke();
        context.beginPath();
        context.moveTo(x + 260, 0);
        context.lineTo(x - 260, CARD_HEIGHT);
        context.stroke();
      }
    }
    context.globalAlpha = 0.2;
    const glow = context.createRadialGradient(CARD_WIDTH * 0.5, 180, 0, CARD_WIDTH * 0.5, 180, 540);
    glow.addColorStop(0, rgba(accent, 0.82));
    glow.addColorStop(1, rgba(accent, 0));
    context.fillStyle = glow;
    context.fillRect(0, 0, CARD_WIDTH, 760);
    context.restore();
  }

  async function buildImageMap(snapshot) {
    const sources = new Set();
    const competition = snapshot.competition;
    for (const source of [competition?.background, competition?.logo, snapshot.activeCrest]) if (source) sources.add(source);
    for (const fixture of snapshot.fixtures) {
      if (fixture.home.crest) sources.add(fixture.home.crest);
      if (fixture.away.crest) sources.add(fixture.away.crest);
    }
    for (const row of snapshot.standings) if (row.team.crest) sources.add(row.team.crest);

    const entries = await Promise.all([...sources].map(async (source) => [absoluteAsset(source), await loadImage(source)]));
    return new Map(entries);
  }

  async function renderShareCard(snapshot) {
    if (!snapshot.competition || !snapshot.activeRow || !snapshot.fixtures.length || !snapshot.standings.length) {
      throw new Error('Paylaşım görseli için tahmin verileri hazır değil.');
    }

    if (document.fonts?.ready) await document.fonts.ready;
    const images = await buildImageMap(snapshot);
    const competition = snapshot.competition;
    const accent = competition.color || '#022ae2';
    const leagueId = competition.id || document.body.dataset.league || 'ucl';
    const leagueTitle = leagueTitles[leagueId] || competition.shortName || 'Avrupa Kupası';
    const canvas = document.createElement('canvas');
    canvas.width = CARD_WIDTH;
    canvas.height = CARD_HEIGHT;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Görsel tuvali oluşturulamadı.');

    context.fillStyle = '#020714';
    context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
    const background = images.get(absoluteAsset(competition.background));
    if (background) drawImageCover(context, background, 0, 0, CARD_WIDTH, CARD_HEIGHT);

    const darkOverlay = context.createLinearGradient(0, 0, 0, CARD_HEIGHT);
    darkOverlay.addColorStop(0, 'rgba(0, 4, 14, 0.34)');
    darkOverlay.addColorStop(0.38, 'rgba(0, 4, 14, 0.7)');
    darkOverlay.addColorStop(1, 'rgba(0, 4, 14, 0.96)');
    context.fillStyle = darkOverlay;
    context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
    drawMotif(context, leagueId, accent);

    const padding = 48;
    const headerHeight = 230;
    const activeCrestImage = images.get(absoluteAsset(snapshot.activeCrest));
    await drawCrest(context, { name: snapshot.activeName }, activeCrestImage, padding, 56, 132, accent);

    const leagueLogo = images.get(absoluteAsset(competition.logo));
    if (leagueLogo) {
      context.save();
      context.globalAlpha = 0.9;
      drawImageContain(context, leagueLogo, CARD_WIDTH - 142, 58, 82, 82);
      context.restore();
    }

    context.textAlign = 'left';
    context.textBaseline = 'alphabetic';
    context.fillStyle = 'rgba(255, 255, 255, 0.72)';
    context.font = '800 20px Inter';
    context.fillText('2026-27', 214, 77);

    const titleLine = `“${snapshot.activeName}”`;
    const titleSize = fitFont(context, titleLine, 770, 70, 39, '"Barlow Condensed", Inter');
    context.font = `800 ${titleSize}px "Barlow Condensed", Inter`;
    context.fillStyle = '#fff';
    context.shadowColor = 'rgba(0, 0, 0, 0.92)';
    context.shadowBlur = 18;
    context.fillText(titleLine, 214, 139);
    context.shadowBlur = 0;

    const journeyLine = `${leagueTitle} Yolculuğu`;
    const journeySize = fitFont(context, journeyLine, 820, 49, 30, '"Barlow Condensed", Inter');
    context.font = `800 ${journeySize}px "Barlow Condensed", Inter`;
    context.fillStyle = rgba(accent, 0.96);
    context.fillText(journeyLine, 214, 188);

    const activeRow = snapshot.activeRow;
    const summary = `${activeRow.rank}. sıra  ·  ${activeRow.points} puan  ·  ${activeRow.goalDifference >= 0 ? '+' : ''}${activeRow.goalDifference} AV  ·  ${zoneText(activeRow.zone)}`;
    context.font = '700 19px Inter';
    context.fillStyle = 'rgba(255, 255, 255, 0.78)';
    context.fillText(summary, 214, 221);

    const bodyY = headerHeight + 54;
    const bodyHeight = CARD_HEIGHT - bodyY - 58;
    const gap = 26;
    const leftWidth = 672;
    const rightWidth = CARD_WIDTH - padding * 2 - gap - leftWidth;
    const rightX = padding + leftWidth + gap;

    context.save();
    context.shadowColor = 'rgba(0, 0, 0, 0.46)';
    context.shadowBlur = 34;
    context.shadowOffsetY = 16;
    fillRoundedRect(context, padding, bodyY, leftWidth, bodyHeight, 28, 'rgba(4, 10, 25, 0.78)', 'rgba(255, 255, 255, 0.14)');
    fillRoundedRect(context, rightX, bodyY, rightWidth, bodyHeight, 28, 'rgba(4, 10, 25, 0.82)', 'rgba(255, 255, 255, 0.14)');
    context.restore();

    context.font = '800 31px "Barlow Condensed", Inter';
    context.fillStyle = '#fff';
    context.fillText('Maç Sonuçları', padding + 24, bodyY + 48);
    context.fillText('Puan Durumu', rightX + 22, bodyY + 48);

    const fixtureGap = 9;
    const fixtureAreaTop = bodyY + 70;
    const fixtureAreaHeight = bodyHeight - 94;
    const fixtureHeight = Math.min(146, (fixtureAreaHeight - fixtureGap * Math.max(0, snapshot.fixtures.length - 1)) / snapshot.fixtures.length);
    const fixtureStartY = fixtureAreaTop + Math.max(0, (fixtureAreaHeight - (fixtureHeight * snapshot.fixtures.length + fixtureGap * Math.max(0, snapshot.fixtures.length - 1))) / 2);

    for (let index = 0; index < snapshot.fixtures.length; index += 1) {
      const fixture = snapshot.fixtures[index];
      const rowY = fixtureStartY + index * (fixtureHeight + fixtureGap);
      fillRoundedRect(context, padding + 18, rowY, leftWidth - 36, fixtureHeight, 18, index % 2 ? 'rgba(255, 255, 255, 0.045)' : 'rgba(255, 255, 255, 0.065)', 'rgba(255, 255, 255, 0.07)');

      context.font = '700 16px Inter';
      context.fillStyle = 'rgba(255, 255, 255, 0.58)';
      context.fillText(`${fixture.week}  ·  ${formatDate(fixture.date)}`, padding + 36, rowY + 27);

      const crestSize = Math.min(58, fixtureHeight - 54);
      const contentY = rowY + 39;
      const homeCrestX = padding + 34;
      const awayCrestX = padding + leftWidth - 34 - crestSize;
      const homeImage = images.get(absoluteAsset(fixture.home.crest));
      const awayImage = images.get(absoluteAsset(fixture.away.crest));
      await drawCrest(context, fixture.home, homeImage, homeCrestX, contentY, crestSize, accent);
      await drawCrest(context, fixture.away, awayImage, awayCrestX, contentY, crestSize, accent);

      context.font = '800 20px Inter';
      context.fillStyle = '#fff';
      context.textAlign = 'left';
      drawEllipsis(context, fixture.home.name, homeCrestX + crestSize + 12, contentY + crestSize / 2 + 7, 188);
      context.textAlign = 'right';
      drawEllipsis(context, fixture.away.name, awayCrestX - 12, contentY + crestSize / 2 + 7, 188);

      context.textAlign = 'center';
      context.font = '900 34px "Barlow Condensed", Inter';
      context.fillStyle = '#fff';
      const score = fixture.score ? `${fixture.score.homeGoals}  –  ${fixture.score.awayGoals}` : '–  –';
      context.fillText(score, padding + leftWidth / 2, contentY + crestSize / 2 + 10);
      context.textAlign = 'left';
    }

    const standingsX = rightX + 14;
    const standingsWidth = rightWidth - 28;
    const labelsY = bodyY + 68;
    context.font = '800 14px Inter';
    context.fillStyle = 'rgba(255, 255, 255, 0.48)';
    context.textAlign = 'center';
    context.fillText('#', standingsX + 18, labelsY + 18);
    context.textAlign = 'left';
    context.fillText('TAKIM', standingsX + 48, labelsY + 18);
    context.textAlign = 'center';
    context.fillText('AV', standingsX + standingsWidth - 63, labelsY + 18);
    context.fillText('P', standingsX + standingsWidth - 20, labelsY + 18);

    const standingsTop = labelsY + 31;
    const standingsHeight = bodyY + bodyHeight - 20 - standingsTop;
    const standingRowHeight = standingsHeight / snapshot.standings.length;
    for (let index = 0; index < snapshot.standings.length; index += 1) {
      const row = snapshot.standings[index];
      const rowY = standingsTop + standingRowHeight * index;
      const rowHeight = Math.max(24, standingRowHeight - 1.5);
      const selected = row.team.name === snapshot.activeName;
      fillRoundedRect(
        context,
        standingsX,
        rowY,
        standingsWidth,
        rowHeight,
        7,
        selected ? rgba(accent, 0.24) : (index % 2 ? 'rgba(255, 255, 255, 0.028)' : 'rgba(255, 255, 255, 0.052)'),
        selected ? rgba(accent, 0.7) : null
      );
      context.fillStyle = zoneColor(row.zone);
      context.fillRect(standingsX, rowY + 4, 4, Math.max(12, rowHeight - 8));

      context.textBaseline = 'middle';
      context.textAlign = 'center';
      context.font = selected ? '900 16px Inter' : '800 15px Inter';
      context.fillStyle = '#fff';
      context.fillText(String(row.rank), standingsX + 19, rowY + rowHeight / 2);

      const crestSize = Math.min(20, rowHeight - 5);
      const crestImage = images.get(absoluteAsset(row.team.crest));
      await drawCrest(context, row.team, crestImage, standingsX + 34, rowY + (rowHeight - crestSize) / 2, crestSize, accent);

      context.textAlign = 'left';
      context.font = selected ? '800 16px Inter' : '700 15px Inter';
      drawEllipsis(context, row.team.name, standingsX + 60, rowY + rowHeight / 2 + 1, standingsWidth - 150);

      context.textAlign = 'center';
      context.font = '800 15px Inter';
      context.fillText(`${row.goalDifference >= 0 ? '+' : ''}${row.goalDifference}`, standingsX + standingsWidth - 63, rowY + rowHeight / 2 + 1);
      context.font = '900 16px Inter';
      context.fillText(String(row.points), standingsX + standingsWidth - 20, rowY + rowHeight / 2 + 1);
    }

    context.textBaseline = 'alphabetic';
    context.textAlign = 'left';
    context.fillStyle = 'rgba(255, 255, 255, 0.42)';
    context.font = '700 14px Inter';
    context.fillText('UEFA Draw Simulator', padding, CARD_HEIGHT - 22);
    context.textAlign = 'right';
    context.fillText(`${snapshot.fixtures.length} maçlık tahmin`, CARD_WIDTH - padding, CARD_HEIGHT - 22);
    return canvas;
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('PNG dosyası oluşturulamadı.'));
      }, 'image/png', 1);
    });
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.setTimeout(() => toast.classList.remove('is-visible'), 2800);
  }

  async function shareCurrent(button) {
    const snapshot = collectSnapshot();
    const canvas = await renderShareCard(snapshot);
    const blob = await canvasToBlob(canvas);
    const filename = `2026-27-${slug(snapshot.activeName)}-${snapshot.competition.id}-yolculugu.png`;
    const file = new File([blob], filename, { type: 'image/png' });
    const title = `2026-27 “${snapshot.activeName}” ${leagueTitles[snapshot.competition.id] || snapshot.competition.shortName} Yolculuğu`;

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title, files: [file] });
      showToast('Paylaşım görseli hazır.');
      return 'shared';
    }

    downloadBlob(blob, filename);
    showToast('Paylaşım görseli indirildi.');
    return 'downloaded';
  }

  function ensureShareButton() {
    const panel = document.querySelector('#predictionSection .prediction-standings-panel');
    if (!panel) return;
    let button = panel.querySelector('.prediction-share-button');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'action-button primary prediction-share-button';
      button.textContent = 'Paylaş';
      button.addEventListener('click', async () => {
        if (button.dataset.busy === 'true') return;
        button.dataset.busy = 'true';
        button.disabled = true;
        button.textContent = 'Hazırlanıyor...';
        try {
          await shareCurrent(button);
        } catch (error) {
          if (error?.name !== 'AbortError') {
            console.error(error);
            showToast(error?.message || 'Paylaşım görseli oluşturulamadı.');
          }
        } finally {
          delete button.dataset.busy;
          button.textContent = 'Paylaş';
          button.disabled = !predictionsComplete();
        }
      });
      panel.appendChild(button);
    }

    const complete = predictionsComplete();
    button.hidden = !complete;
    button.disabled = !complete || button.dataset.busy === 'true';
    button.title = complete ? '3:4 paylaşım görseli oluştur' : 'Önce tüm maçları tahmin et';
  }

  function syncCompletedProgress() {
    const drawActions = document.getElementById('drawActions');
    const progressTrack = document.querySelector('.draw-topbar .progress-track');
    if (!drawActions || !progressTrack) return;
    const completed = !drawActions.hidden;
    progressTrack.classList.toggle('is-complete', completed);
    progressTrack.setAttribute('aria-hidden', String(completed));
  }

  const predictionSection = document.getElementById('predictionSection');
  if (predictionSection) {
    new MutationObserver(() => window.requestAnimationFrame(ensureShareButton)).observe(predictionSection, {
      childList: true,
      subtree: true
    });
  }

  const drawActions = document.getElementById('drawActions');
  if (drawActions) {
    new MutationObserver(syncCompletedProgress).observe(drawActions, {
      attributes: true,
      attributeFilter: ['hidden']
    });
  }

  window.UCLDRAW_PREDICTION_SHARE = Object.freeze({
    collectSnapshot,
    renderShareCard,
    shareCurrent
  });

  ensureShareButton();
  syncCompletedProgress();
})();