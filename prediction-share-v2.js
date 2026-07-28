(() => {
  'use strict';

  const SHARE = window.UCLDRAW_PREDICTION_SHARE;
  const AI = window.UCLDRAW_PREDICTION_AI;
  if (!SHARE?.collectSnapshot || !AI?.predictAll) return;

  const CARD_WIDTH = 1200;
  const CARD_HEIGHT = 1600;
  const SITE_LINK = 'urjiko.github.io/UEFA';
  const imageCache = new Map();
  const leagueTitles = Object.freeze({
    ucl: 'Şampiyonlar Ligi Yolculuğu',
    uel: 'Avrupa Ligi Yolculuğu',
    uecl: 'Konferans Ligi Yolculuğu'
  });
  const palettes = Object.freeze({
    ucl: Object.freeze({
      page: '#020714',
      header: 'rgba(6, 15, 48, 0.90)',
      panel: 'rgba(5, 13, 40, 0.86)',
      rowA: 'rgba(22, 39, 83, 0.48)',
      rowB: 'rgba(12, 27, 65, 0.58)',
      overlayTop: 'rgba(0, 4, 20, 0.25)',
      overlayBottom: 'rgba(0, 3, 15, 0.94)'
    }),
    uel: Object.freeze({
      page: '#170800',
      header: 'rgba(83, 29, 3, 0.91)',
      panel: 'rgba(58, 20, 3, 0.87)',
      rowA: 'rgba(123, 47, 6, 0.35)',
      rowB: 'rgba(83, 29, 4, 0.52)',
      overlayTop: 'rgba(46, 13, 0, 0.24)',
      overlayBottom: 'rgba(19, 6, 0, 0.95)'
    }),
    uecl: Object.freeze({
      page: '#031507',
      header: 'rgba(4, 61, 18, 0.90)',
      panel: 'rgba(3, 44, 14, 0.88)',
      rowA: 'rgba(10, 91, 30, 0.34)',
      rowB: 'rgba(5, 60, 20, 0.50)',
      overlayTop: 'rgba(0, 42, 12, 0.20)',
      overlayBottom: 'rgba(1, 19, 7, 0.96)'
    })
  });

  function absoluteAsset(source) {
    if (!source) return null;
    try {
      return new URL(source, document.baseURI).href;
    } catch {
      return source;
    }
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
    return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
  }

  function rgba(hex, alpha) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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

  function fillRoundedRect(context, x, y, width, height, radius, fill, stroke = null, lineWidth = 1.5) {
    context.save();
    roundedRectPath(context, x, y, width, height, radius);
    context.fillStyle = fill;
    context.fill();
    if (stroke) {
      context.strokeStyle = stroke;
      context.lineWidth = lineWidth;
      context.stroke();
    }
    context.restore();
  }

  function drawImageContain(context, image, x, y, width, height) {
    if (!image?.naturalWidth || !image?.naturalHeight) return false;
    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const targetWidth = image.naturalWidth * scale;
    const targetHeight = image.naturalHeight * scale;
    context.drawImage(image, x + (width - targetWidth) / 2, y + (height - targetHeight) / 2, targetWidth, targetHeight);
    return true;
  }

  function drawImageCover(context, image, x, y, width, height) {
    if (!image?.naturalWidth || !image?.naturalHeight) return false;
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const sourceWidth = width / scale;
    const sourceHeight = height / scale;
    const sourceX = (image.naturalWidth - sourceWidth) / 2;
    const sourceY = (image.naturalHeight - sourceHeight) / 2;
    context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
    return true;
  }

  function drawRotatedCover(context, image) {
    context.save();
    context.translate(CARD_WIDTH / 2, CARD_HEIGHT / 2);
    context.rotate(Math.PI / 2);
    drawImageCover(context, image, -CARD_HEIGHT / 2, -CARD_WIDTH / 2, CARD_HEIGHT, CARD_WIDTH);
    context.restore();
  }

  function fitFont(context, text, maximumWidth, startingSize, minimumSize = 12, family = 'Inter, "Segoe UI", Arial, sans-serif') {
    let size = startingSize;
    while (size > minimumSize) {
      context.font = `900 ${size}px ${family}`;
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

  function formatDate(value) {
    if (!value) return 'Tarih bekleniyor';
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(new Date(`${value}T12:00:00Z`));
  }

  function zoneColor(zone) {
    if (zone === 'direct') return '#39dd8f';
    if (zone === 'playoff') return '#ffbe4a';
    return '#ff6174';
  }

  async function drawCrest(context, team, image, x, y, size, accent, withTile = true) {
    if (withTile) fillRoundedRect(context, x, y, size, size, size * 0.22, 'rgba(0, 0, 0, 0.28)', 'rgba(255, 255, 255, 0.16)');
    context.save();
    context.shadowColor = rgba(accent, 0.34);
    context.shadowBlur = size * 0.22;
    const inset = withTile ? size * 0.09 : 0;
    const drawn = drawImageContain(context, image, x + inset, y + inset, size - inset * 2, size - inset * 2);
    context.restore();
    if (drawn) return;

    context.save();
    context.fillStyle = '#fff';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = `900 ${Math.round(size * 0.28)}px Inter, "Segoe UI", Arial, sans-serif`;
    context.fillText(initials(team?.name), x + size / 2, y + size / 2 + 1);
    context.restore();
  }

  function drawMotif(context, leagueId, accent) {
    context.save();
    context.globalAlpha = leagueId === 'ucl' ? 0.13 : 0.11;
    context.strokeStyle = '#fff';
    context.lineWidth = 2;

    if (leagueId === 'uel') {
      for (let x = -360; x < CARD_WIDTH + 360; x += 92) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x + 430, CARD_HEIGHT);
        context.stroke();
      }
    } else if (leagueId === 'uecl') {
      for (const [x, y, radius] of [[110, 370, 180], [1090, 440, 230], [940, 1420, 210]]) {
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.stroke();
        context.beginPath();
        context.arc(x, y, radius * 0.68, 0, Math.PI * 2);
        context.stroke();
      }
    } else {
      for (let x = -140; x < CARD_WIDTH + 180; x += 132) {
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

    const glow = context.createRadialGradient(CARD_WIDTH * 0.5, 160, 0, CARD_WIDTH * 0.5, 160, 560);
    glow.addColorStop(0, rgba(accent, 0.46));
    glow.addColorStop(1, rgba(accent, 0));
    context.globalAlpha = 1;
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

  function drawTeamName(context, name, x, y, maximumWidth, align) {
    context.textAlign = align;
    context.font = '800 20px Inter, "Segoe UI", Arial, sans-serif';
    context.fillStyle = '#fff';
    drawEllipsis(context, name, x, y, maximumWidth);
  }

  async function renderShareCard(snapshot) {
    if (!snapshot.competition || !snapshot.activeRow || !snapshot.fixtures.length || !snapshot.standings.length) {
      throw new Error('Paylaşım görseli için tahmin verileri hazır değil.');
    }

    if (document.fonts?.ready) await document.fonts.ready;
    const images = await buildImageMap(snapshot);
    const competition = snapshot.competition;
    const leagueId = competition.id || document.body.dataset.league || 'ucl';
    const accent = competition.color || '#022ae2';
    const palette = palettes[leagueId] || palettes.ucl;
    const canvas = document.createElement('canvas');
    canvas.width = CARD_WIDTH;
    canvas.height = CARD_HEIGHT;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Görsel tuvali oluşturulamadı.');

    context.fillStyle = palette.page;
    context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
    const background = images.get(absoluteAsset(competition.background));
    if (background) {
      if (leagueId === 'ucl') drawRotatedCover(context, background);
      else drawImageCover(context, background, 0, 0, CARD_WIDTH, CARD_HEIGHT);
    }

    const overlay = context.createLinearGradient(0, 0, 0, CARD_HEIGHT);
    overlay.addColorStop(0, palette.overlayTop);
    overlay.addColorStop(0.42, palette.panel);
    overlay.addColorStop(1, palette.overlayBottom);
    context.fillStyle = overlay;
    context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
    drawMotif(context, leagueId, accent);

    const padding = 48;
    const headerY = 36;
    const headerHeight = 236;
    fillRoundedRect(context, padding, headerY, CARD_WIDTH - padding * 2, headerHeight, 30, palette.header, rgba(accent, 0.54), 2);

    const logoSize = 168;
    const logoY = headerY + (headerHeight - logoSize) / 2;
    const activeCrestImage = images.get(absoluteAsset(snapshot.activeCrest));
    await drawCrest(context, { name: snapshot.activeName }, activeCrestImage, padding + 28, logoY, logoSize, accent);

    const leagueLogo = images.get(absoluteAsset(competition.logo));
    if (leagueLogo) {
      const leagueLogoX = CARD_WIDTH - padding - 28 - logoSize;
      context.save();
      context.globalAlpha = 0.96;
      drawImageContain(context, leagueLogo, leagueLogoX, logoY, logoSize, logoSize);
      context.restore();
    }

    const copyX = padding + 28 + logoSize + 32;
    const copyWidth = CARD_WIDTH - copyX - padding - 28 - logoSize - 34;
    context.textAlign = 'left';
    context.textBaseline = 'alphabetic';
    context.fillStyle = 'rgba(255, 255, 255, 0.72)';
    context.font = '800 21px Inter, "Segoe UI", Arial, sans-serif';
    context.fillText('2026-27', copyX, headerY + 55);

    const titleSize = fitFont(context, snapshot.activeName, copyWidth, 72, 39);
    context.font = `900 ${titleSize}px Inter, "Segoe UI", Arial, sans-serif`;
    context.fillStyle = '#fff';
    context.shadowColor = 'rgba(0, 0, 0, 0.92)';
    context.shadowBlur = 18;
    context.fillText(snapshot.activeName, copyX, headerY + 129);
    context.shadowBlur = 0;

    const journey = leagueTitles[leagueId] || `${competition.shortName || 'Avrupa Kupası'} Yolculuğu`;
    const journeySize = fitFont(context, journey, copyWidth, 37, 25);
    context.font = `800 ${journeySize}px Inter, "Segoe UI", Arial, sans-serif`;
    context.fillStyle = 'rgba(255, 255, 255, 0.72)';
    context.fillText(journey, copyX, headerY + 188);

    const bodyY = headerY + headerHeight + 34;
    const bodyHeight = CARD_HEIGHT - bodyY - 64;
    const gap = 24;
    const leftWidth = 680;
    const rightWidth = CARD_WIDTH - padding * 2 - gap - leftWidth;
    const rightX = padding + leftWidth + gap;

    context.save();
    context.shadowColor = 'rgba(0, 0, 0, 0.48)';
    context.shadowBlur = 34;
    context.shadowOffsetY = 14;
    fillRoundedRect(context, padding, bodyY, leftWidth, bodyHeight, 28, palette.panel, 'rgba(255, 255, 255, 0.14)');
    fillRoundedRect(context, rightX, bodyY, rightWidth, bodyHeight, 28, palette.panel, 'rgba(255, 255, 255, 0.14)');
    context.restore();

    context.font = '900 30px Inter, "Segoe UI", Arial, sans-serif';
    context.fillStyle = '#fff';
    context.fillText('Maç Sonuçları', padding + 24, bodyY + 48);
    context.fillText('Puan Durumu', rightX + 22, bodyY + 48);

    const fixtureGap = 9;
    const fixtureAreaTop = bodyY + 70;
    const fixtureAreaHeight = bodyHeight - 94;
    const fixtureHeight = Math.min(150, (fixtureAreaHeight - fixtureGap * Math.max(0, snapshot.fixtures.length - 1)) / snapshot.fixtures.length);
    const totalFixtureHeight = fixtureHeight * snapshot.fixtures.length + fixtureGap * Math.max(0, snapshot.fixtures.length - 1);
    const fixtureStartY = fixtureAreaTop + Math.max(0, (fixtureAreaHeight - totalFixtureHeight) / 2);

    for (let index = 0; index < snapshot.fixtures.length; index += 1) {
      const fixture = snapshot.fixtures[index];
      const rowY = fixtureStartY + index * (fixtureHeight + fixtureGap);
      const rowX = padding + 18;
      const rowWidth = leftWidth - 36;
      fillRoundedRect(context, rowX, rowY, rowWidth, fixtureHeight, 18, index % 2 ? palette.rowA : palette.rowB, 'rgba(255, 255, 255, 0.08)');

      context.font = '700 16px Inter, "Segoe UI", Arial, sans-serif';
      context.fillStyle = 'rgba(255, 255, 255, 0.60)';
      context.textAlign = 'left';
      context.fillText(`${fixture.week}  ·  ${formatDate(fixture.date)}`, rowX + 20, rowY + 27);

      const crestSize = Math.min(58, fixtureHeight - 54);
      const contentY = rowY + 40;
      const centerX = rowX + rowWidth / 2;
      const scoreGap = 82;
      const sidePadding = 22;
      const homeCrestX = rowX + sidePadding;
      const awayCrestX = rowX + rowWidth - sidePadding - crestSize;
      const homeImage = images.get(absoluteAsset(fixture.home.crest));
      const awayImage = images.get(absoluteAsset(fixture.away.crest));
      await drawCrest(context, fixture.home, homeImage, homeCrestX, contentY, crestSize, accent);
      await drawCrest(context, fixture.away, awayImage, awayCrestX, contentY, crestSize, accent);

      const textY = contentY + crestSize / 2 + 7;
      drawTeamName(context, fixture.home.name, homeCrestX + crestSize + 13, textY, centerX - scoreGap - (homeCrestX + crestSize + 13), 'left');
      drawTeamName(context, fixture.away.name, awayCrestX - 13, textY, awayCrestX - 13 - (centerX + scoreGap), 'right');

      context.textAlign = 'center';
      context.font = '900 35px Inter, "Segoe UI", Arial, sans-serif';
      context.fillStyle = '#fff';
      const score = fixture.score ? `${fixture.score.homeGoals} – ${fixture.score.awayGoals}` : '– –';
      context.fillText(score, centerX, textY + 4);
    }

    const standingsX = rightX + 14;
    const standingsWidth = rightWidth - 28;
    const labelsY = bodyY + 68;
    context.font = '800 14px Inter, "Segoe UI", Arial, sans-serif';
    context.fillStyle = 'rgba(255, 255, 255, 0.52)';
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
        selected ? rgba(accent, 0.30) : (index % 2 ? palette.rowA : palette.rowB),
        selected ? rgba(accent, 0.76) : null
      );
      context.fillStyle = zoneColor(row.zone);
      context.fillRect(standingsX, rowY + 4, 4, Math.max(12, rowHeight - 8));

      context.textBaseline = 'middle';
      context.textAlign = 'center';
      context.font = selected ? '900 16px Inter, "Segoe UI", Arial, sans-serif' : '800 15px Inter, "Segoe UI", Arial, sans-serif';
      context.fillStyle = '#fff';
      context.fillText(String(row.rank), standingsX + 19, rowY + rowHeight / 2);

      const crestSize = Math.min(20, rowHeight - 5);
      const crestImage = images.get(absoluteAsset(row.team.crest));
      await drawCrest(context, row.team, crestImage, standingsX + 34, rowY + (rowHeight - crestSize) / 2, crestSize, accent, false);

      context.textAlign = 'left';
      context.font = selected ? '800 16px Inter, "Segoe UI", Arial, sans-serif' : '700 15px Inter, "Segoe UI", Arial, sans-serif';
      drawEllipsis(context, row.team.name, standingsX + 60, rowY + rowHeight / 2 + 1, standingsWidth - 150);

      context.textAlign = 'center';
      context.font = '800 15px Inter, "Segoe UI", Arial, sans-serif';
      context.fillText(`${row.goalDifference >= 0 ? '+' : ''}${row.goalDifference}`, standingsX + standingsWidth - 63, rowY + rowHeight / 2 + 1);
      context.font = '900 16px Inter, "Segoe UI", Arial, sans-serif';
      context.fillText(String(row.points), standingsX + standingsWidth - 20, rowY + rowHeight / 2 + 1);
    }

    context.textBaseline = 'alphabetic';
    context.textAlign = 'right';
    context.fillStyle = 'rgba(255, 255, 255, 0.66)';
    context.font = '800 16px Inter, "Segoe UI", Arial, sans-serif';
    context.fillText(SITE_LINK, CARD_WIDTH - padding, CARD_HEIGHT - 24);
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

  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.setTimeout(() => toast.classList.remove('is-visible'), 2800);
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

  async function shareCurrent() {
    const snapshot = SHARE.collectSnapshot();
    const canvas = await renderShareCard(snapshot);
    const blob = await canvasToBlob(canvas);
    const filename = `2026-27-${slug(snapshot.activeName)}-${snapshot.competition.id}-yolculugu.png`;
    const file = new File([blob], filename, { type: 'image/png' });
    const title = `2026-27 ${snapshot.activeName} ${leagueTitles[snapshot.competition.id] || snapshot.competition.shortName}`;

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title, files: [file] });
      showToast('Paylaşım görseli hazır.');
      return 'shared';
    }

    downloadBlob(blob, filename);
    showToast('Paylaşım görseli indirildi.');
    return 'downloaded';
  }

  function predictionsComplete() {
    const cards = [...document.querySelectorAll('#predictionSection .prediction-fixture-card')];
    return cards.length > 0 && cards.every((card) => card.classList.contains('is-resolved'));
  }

  function refreshPredictionView() {
    const selectedRow = document.querySelector('#predictionSection .prediction-standing-row.is-selected-team');
    if (selectedRow) selectedRow.click();
    else window.dispatchEvent(new CustomEvent('ucldraw:prediction-refresh-requested'));
  }

  function createActionButton(text, className) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `action-button ${className}`;
    button.textContent = text;
    return button;
  }

  function ensureActions() {
    const panel = document.querySelector('#predictionSection .prediction-standings-panel');
    if (!panel) return;

    panel.querySelectorAll(':scope > .prediction-share-button').forEach((button) => { button.hidden = true; });
    let row = panel.querySelector(':scope > .prediction-share-actions-v2');
    if (!row) {
      row = document.createElement('div');
      row.className = 'prediction-share-actions-v2';

      const aiButton = createActionButton('Yapay Zeka Tahmini', 'prediction-ai-button');
      aiButton.addEventListener('click', () => {
        if (aiButton.dataset.busy === 'true') return;
        aiButton.dataset.busy = 'true';
        aiButton.disabled = true;
        aiButton.textContent = 'Hazırlanıyor...';
        try {
          AI.predictAll();
          refreshPredictionView();
          showToast('Tüm maçlar yapay zeka ile yeniden tahmin edildi.');
        } catch (error) {
          console.error(error);
          showToast(error?.message || 'Yapay zeka tahmini oluşturulamadı.');
        } finally {
          delete aiButton.dataset.busy;
          aiButton.disabled = false;
          aiButton.textContent = 'Yapay Zeka Tahmini';
          window.requestAnimationFrame(ensureActions);
        }
      });

      const shareButton = createActionButton('Paylaş', 'primary prediction-share-v2-button');
      shareButton.addEventListener('click', async () => {
        if (shareButton.dataset.busy === 'true' || !predictionsComplete()) return;
        shareButton.dataset.busy = 'true';
        shareButton.disabled = true;
        shareButton.textContent = 'Hazırlanıyor...';
        try {
          await shareCurrent();
        } catch (error) {
          if (error?.name !== 'AbortError') {
            console.error(error);
            showToast(error?.message || 'Paylaşım görseli oluşturulamadı.');
          }
        } finally {
          delete shareButton.dataset.busy;
          shareButton.disabled = false;
          shareButton.textContent = 'Paylaş';
        }
      });

      row.append(aiButton, shareButton);
      panel.appendChild(row);
    }

    const complete = predictionsComplete();
    const shareButton = row.querySelector('.prediction-share-v2-button');
    shareButton.hidden = !complete;
    row.classList.toggle('has-share', complete);
  }

  const predictionSection = document.getElementById('predictionSection');
  if (predictionSection) {
    let refreshQueued = false;
    new MutationObserver(() => {
      if (refreshQueued) return;
      refreshQueued = true;
      window.requestAnimationFrame(() => {
        refreshQueued = false;
        ensureActions();
      });
    }).observe(predictionSection, { childList: true, subtree: true });
  }

  window.addEventListener('ucldraw:ai-predictions-applied', () => window.requestAnimationFrame(ensureActions));
  window.UCLDRAW_PREDICTION_SHARE_V2 = Object.freeze({ renderShareCard, shareCurrent, ensureActions });
  ensureActions();
})();
