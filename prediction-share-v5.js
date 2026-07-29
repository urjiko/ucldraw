(() => {
  'use strict';

  const V4 = window.UCLDRAW_PREDICTION_SHARE_V4;
  const SHARE = window.UCLDRAW_PREDICTION_SHARE;
  if (!V4?.renderShareCard || !SHARE?.collectSnapshot) return;

  const CARD_WIDTH = 1200;
  const CARD_HEIGHT = 1600;
  const SITE_LINK = 'urjiko.github.io/UEFA';
  const HEADER = Object.freeze({ x: 48, y: 36, width: 1104, height: 236, radius: 30 });
  const BODY = Object.freeze({ y: 306, height: 1230, leftX: 48, leftWidth: 680, rightX: 752, rightWidth: 400, radius: 28 });
  const STANDINGS_CENTER_X = BODY.rightX + BODY.rightWidth / 2;
  const imageCache = new Map();
  const journeyTitles = Object.freeze({
    ucl: 'Şampiyonlar Ligi Yolculuğu',
    uel: 'Avrupa Ligi Yolculuğu',
    uecl: 'Konferans Ligi Yolculuğu'
  });
  const componentThemes = Object.freeze({
    uel: Object.freeze({
      header: Object.freeze({ start: [76, 24, 4], end: [4, 4, 4], strength: 0.82 }),
      panel: Object.freeze({ start: [42, 12, 2], end: [5, 5, 5], strength: 0.80 }),
      fixture: Object.freeze({ start: [55, 17, 3], end: [8, 8, 8], strength: 0.76 }),
      tile: 'rgba(0, 0, 0, 0.58)',
      tileBorder: 'rgba(255, 126, 48, 0.22)'
    }),
    uecl: Object.freeze({
      header: Object.freeze({ start: [7, 61, 21], end: [4, 4, 4], strength: 0.82 }),
      panel: Object.freeze({ start: [5, 39, 14], end: [5, 5, 5], strength: 0.80 }),
      fixture: Object.freeze({ start: [6, 48, 17], end: [8, 8, 8], strength: 0.76 }),
      tile: 'rgba(0, 0, 0, 0.58)',
      tileBorder: 'rgba(77, 213, 112, 0.20)'
    })
  });

  function slug(value = '') {
    return String(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('en-US')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
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

  function absoluteAsset(source) {
    if (!source) return null;
    try { return new URL(source, document.baseURI).href; } catch { return source; }
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

  function drawImageContain(context, image, x, y, width, height) {
    if (!image?.naturalWidth || !image?.naturalHeight) return false;
    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const targetWidth = image.naturalWidth * scale;
    const targetHeight = image.naturalHeight * scale;
    context.drawImage(image, x + (width - targetWidth) / 2, y + (height - targetHeight) / 2, targetWidth, targetHeight);
    return true;
  }

  function drawUntintedImage(context, image, x, y, width, height) {
    context.save();
    context.globalAlpha = 1;
    context.globalCompositeOperation = 'source-over';
    context.filter = 'none';
    context.shadowColor = 'transparent';
    context.shadowBlur = 0;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    const drawn = drawImageContain(context, image, x, y, width, height);
    context.restore();
    return drawn;
  }

  function interpolate(start, end, amount) {
    return start + (end - start) * amount;
  }

  function applyGradientRegion(image, canvasWidth, canvasHeight, rect, profile) {
    const left = Math.max(0, Math.floor(rect.x));
    const top = Math.max(0, Math.floor(rect.y));
    const right = Math.min(canvasWidth, Math.ceil(rect.x + rect.width));
    const bottom = Math.min(canvasHeight, Math.ceil(rect.y + rect.height));
    const radius = Math.max(0, rect.radius || 0);
    const data = image.data;

    for (let y = top; y < bottom; y += 1) {
      for (let x = left; x < right; x += 1) {
        const localX = x - rect.x;
        const localY = y - rect.y;
        const edgeX = Math.min(localX, rect.width - localX);
        const edgeY = Math.min(localY, rect.height - localY);
        if (radius && edgeX < radius && edgeY < radius) {
          const cornerX = radius - edgeX;
          const cornerY = radius - edgeY;
          if (cornerX * cornerX + cornerY * cornerY > radius * radius) continue;
        }

        const index = (y * canvasWidth + x) * 4;
        if (data[index + 3] === 0) continue;
        const red = data[index];
        const green = data[index + 1];
        const blue = data[index + 2];
        const maximum = Math.max(red, green, blue);
        const minimum = Math.min(red, green, blue);
        const chroma = maximum - minimum;
        const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;

        // Text is protected here. All logos are redrawn from their source files afterwards.
        if (luminance > 158 || (maximum > 132 && chroma < 30)) continue;

        const horizontal = Math.max(0, Math.min(1, localX / Math.max(1, rect.width)));
        const vertical = Math.max(0, Math.min(1, localY / Math.max(1, rect.height)));
        const progress = Math.max(0, Math.min(1, horizontal * 0.68 + vertical * 0.32));
        const targetRed = interpolate(profile.start[0], profile.end[0], progress);
        const targetGreen = interpolate(profile.start[1], profile.end[1], progress);
        const targetBlue = interpolate(profile.start[2], profile.end[2], progress);
        const darknessBoost = 1 - Math.min(0.32, luminance / 520);
        const mix = profile.strength * darknessBoost;

        data[index] = Math.round(red * (1 - mix) + targetRed * mix);
        data[index + 1] = Math.round(green * (1 - mix) + targetGreen * mix);
        data[index + 2] = Math.round(blue * (1 - mix) + targetBlue * mix);
      }
    }
  }

  function fixtureRects(snapshot) {
    const fixtureGap = 9;
    const fixtureAreaTop = BODY.y + 70;
    const fixtureAreaHeight = BODY.height - 94;
    const fixtureHeight = Math.min(
      150,
      (fixtureAreaHeight - fixtureGap * Math.max(0, snapshot.fixtures.length - 1)) / snapshot.fixtures.length
    );
    const totalFixtureHeight = fixtureHeight * snapshot.fixtures.length
      + fixtureGap * Math.max(0, snapshot.fixtures.length - 1);
    const fixtureStartY = fixtureAreaTop + Math.max(0, (fixtureAreaHeight - totalFixtureHeight) / 2);
    return snapshot.fixtures.map((_, index) => ({
      x: BODY.leftX + 18,
      y: fixtureStartY + index * (fixtureHeight + fixtureGap),
      width: BODY.leftWidth - 36,
      height: fixtureHeight,
      radius: 18
    }));
  }

  function applyComponentGradients(canvas, snapshot) {
    const leagueId = snapshot.competition?.id || document.body.dataset.league || 'ucl';
    const theme = componentThemes[leagueId];
    if (!theme) return canvas;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return canvas;
    const scaleX = canvas.width / CARD_WIDTH;
    const scaleY = canvas.height / CARD_HEIGHT;
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    const scaleRect = (rect) => ({
      x: rect.x * scaleX,
      y: rect.y * scaleY,
      width: rect.width * scaleX,
      height: rect.height * scaleY,
      radius: rect.radius * Math.min(scaleX, scaleY)
    });

    applyGradientRegion(image, canvas.width, canvas.height, scaleRect(HEADER), theme.header);
    applyGradientRegion(image, canvas.width, canvas.height, scaleRect({ x: BODY.leftX, y: BODY.y, width: BODY.leftWidth, height: BODY.height, radius: BODY.radius }), theme.panel);
    applyGradientRegion(image, canvas.width, canvas.height, scaleRect({ x: BODY.rightX, y: BODY.y, width: BODY.rightWidth, height: BODY.height, radius: BODY.radius }), theme.panel);
    fixtureRects(snapshot).forEach((rect) => applyGradientRegion(image, canvas.width, canvas.height, scaleRect(rect), theme.fixture));

    context.putImageData(image, 0, 0);
    return canvas;
  }

  async function buildLogoMap(snapshot) {
    const sources = new Set();
    const add = (source) => { if (source) sources.add(source); };
    add(snapshot.activeCrest);
    add(snapshot.competition?.logo);
    snapshot.fixtures.forEach((fixture) => {
      add(fixture.home?.crest);
      add(fixture.away?.crest);
    });
    snapshot.standings.forEach((row) => add(row.team?.crest));
    const entries = await Promise.all([...sources].map(async (source) => [absoluteAsset(source), await loadImage(source)]));
    return new Map(entries);
  }

  async function redrawUntintedLogos(canvas, snapshot) {
    const context = canvas.getContext('2d');
    if (!context) return canvas;
    const leagueId = snapshot.competition?.id || document.body.dataset.league || 'ucl';
    const theme = componentThemes[leagueId];
    const logos = await buildLogoMap(snapshot);
    const logoFor = (source) => logos.get(absoluteAsset(source)) || null;
    const scaleX = canvas.width / CARD_WIDTH;
    const scaleY = canvas.height / CARD_HEIGHT;

    context.save();
    context.scale(scaleX, scaleY);

    const headerLogoSize = 168;
    const headerLogoY = HEADER.y + (HEADER.height - headerLogoSize) / 2;
    const clubLogoX = HEADER.x + 28;
    if (theme) {
      roundedRectPath(context, clubLogoX, headerLogoY, headerLogoSize, headerLogoSize, 28);
      context.fillStyle = theme.tile;
      context.fill();
      context.strokeStyle = theme.tileBorder;
      context.lineWidth = 1.5;
      context.stroke();
    }
    drawUntintedImage(
      context,
      logoFor(snapshot.activeCrest),
      clubLogoX + 11,
      headerLogoY + 11,
      headerLogoSize - 22,
      headerLogoSize - 22
    );

    const leagueLogoX = STANDINGS_CENTER_X - headerLogoSize / 2;
    drawUntintedImage(
      context,
      logoFor(snapshot.competition?.logo),
      leagueLogoX,
      headerLogoY,
      headerLogoSize,
      headerLogoSize
    );

    for (const [index, rect] of fixtureRects(snapshot).entries()) {
      const fixture = snapshot.fixtures[index];
      const crestSize = Math.min(58, rect.height - 54);
      const contentY = rect.y + 40;
      const inset = crestSize * 0.09;
      const homeX = rect.x + 22;
      const awayX = rect.x + rect.width - 22 - crestSize;
      drawUntintedImage(
        context,
        logoFor(fixture.home?.crest),
        homeX + inset,
        contentY + inset,
        crestSize - inset * 2,
        crestSize - inset * 2
      );
      drawUntintedImage(
        context,
        logoFor(fixture.away?.crest),
        awayX + inset,
        contentY + inset,
        crestSize - inset * 2,
        crestSize - inset * 2
      );
    }

    const standingsX = BODY.rightX + 14;
    const standingsWidth = BODY.rightWidth - 28;
    const labelsY = BODY.y + 68;
    const standingsTop = labelsY + 31;
    const standingsHeight = BODY.y + BODY.height - 20 - standingsTop;
    const standingRowHeight = standingsHeight / Math.max(1, snapshot.standings.length);
    snapshot.standings.forEach((row, index) => {
      const rowY = standingsTop + standingRowHeight * index;
      const rowHeight = Math.max(24, standingRowHeight - 1.5);
      const crestSize = Math.min(20, rowHeight - 5);
      drawUntintedImage(
        context,
        logoFor(row.team?.crest),
        standingsX + 34,
        rowY + (rowHeight - crestSize) / 2,
        crestSize,
        crestSize
      );
    });

    context.restore();
    return canvas;
  }

  async function redrawFixtureDates(canvas, snapshot) {
    await window.UCLDRAW_CHAMPIONS_FONT_READY;
    if (document.fonts?.load) await document.fonts.load('400 17px "Champions Sans"');

    const context = canvas.getContext('2d');
    if (!context || !snapshot.fixtures.length) return canvas;
    const scaleX = canvas.width / CARD_WIDTH;
    const scaleY = canvas.height / CARD_HEIGHT;

    for (const [index, rect] of fixtureRects(snapshot).entries()) {
      const fixture = snapshot.fixtures[index];
      const sourceX = (rect.x + rect.width - 34) * scaleX;
      const sourceY = (rect.y + 8) * scaleY;
      const sourceWidth = Math.max(1, 2 * scaleX);
      const sourceHeight = 25 * scaleY;
      const destinationX = (rect.x + 12) * scaleX;
      const destinationWidth = (rect.width - 24) * scaleX;
      context.drawImage(
        canvas,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        destinationX,
        sourceY,
        destinationWidth,
        sourceHeight
      );

      context.save();
      context.scale(scaleX, scaleY);
      context.textAlign = 'center';
      context.textBaseline = 'alphabetic';
      context.font = '400 17px "Champions Sans", Arial, sans-serif';
      context.fillStyle = 'rgba(255, 255, 255, 0.68)';
      context.fillText(formatDate(fixture.date), rect.x + rect.width / 2, rect.y + 27);
      context.restore();
    }

    return canvas;
  }

  async function renderShareCard(snapshot) {
    const canvas = await V4.renderShareCard(snapshot);
    applyComponentGradients(canvas, snapshot);
    await redrawFixtureDates(canvas, snapshot);
    return redrawUntintedLogos(canvas, snapshot);
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('PNG dosyası oluşturulamadı.')),
        'image/png',
        1
      );
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
    const title = `2026-27 ${snapshot.activeName} ${journeyTitles[snapshot.competition.id] || snapshot.competition.shortName}`;

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title, files: [file] });
      showToast('Paylaşım görseli hazır.');
      return 'shared';
    }

    downloadBlob(blob, filename);
    showToast('Paylaşım görseli indirildi.');
    return 'downloaded';
  }

  const predictionSection = document.getElementById('predictionSection');
  predictionSection?.addEventListener('click', async (event) => {
    const button = event.target.closest?.('.prediction-share-v4-button');
    if (!button || !predictionSection.contains(button)) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    if (button.dataset.busy === 'true' || button.hidden) return;

    button.dataset.busy = 'true';
    button.disabled = true;
    button.textContent = 'Hazırlanıyor...';
    try {
      await shareCurrent();
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error(error);
        showToast(error?.message || 'Paylaşım görseli oluşturulamadı.');
      }
    } finally {
      delete button.dataset.busy;
      button.disabled = false;
      button.textContent = 'Paylaş';
    }
  }, true);

  window.UCLDRAW_PREDICTION_SHARE_V5 = Object.freeze({
    renderShareCard,
    shareCurrent,
    redrawFixtureDates,
    applyComponentGradients,
    redrawUntintedLogos,
    redrawLogoTile: redrawUntintedLogos
  });
})();