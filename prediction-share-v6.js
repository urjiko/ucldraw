(() => {
  'use strict';

  const V5 = window.UCLDRAW_PREDICTION_SHARE_V5;
  const SHARE = window.UCLDRAW_PREDICTION_SHARE;
  if (!V5?.renderShareCard || !SHARE?.collectSnapshot) return;

  const CARD_WIDTH = 1200;
  const CARD_HEIGHT = 1600;
  const SITE_LINK = 'urjiko.github.io/UEFA';
  const HEADER = Object.freeze({ x: 48, y: 36, width: 1104, height: 236, radius: 30 });
  const BODY = Object.freeze({ y: 306, height: 1230, leftX: 48, leftWidth: 680, rightX: 752, rightWidth: 400 });
  const imageCache = new Map();

  const themes = Object.freeze({
    ucl: Object.freeze({
      headerStart: '#102a82',
      headerEnd: '#050914',
      cardStart: '#142a65',
      cardEnd: '#060a16',
      stroke: 'rgba(100, 137, 255, 0.58)',
      glow: 'rgba(65, 105, 255, 0.56)'
    }),
    uel: Object.freeze({
      headerStart: '#4b1704',
      headerEnd: '#050505',
      cardStart: '#3d1203',
      cardEnd: '#080808',
      stroke: 'rgba(216, 91, 25, 0.54)',
      glow: 'rgba(196, 70, 16, 0.50)'
    }),
    uecl: Object.freeze({
      headerStart: '#063814',
      headerEnd: '#050505',
      cardStart: '#072e13',
      cardEnd: '#080808',
      stroke: 'rgba(55, 180, 91, 0.50)',
      glow: 'rgba(35, 158, 73, 0.48)'
    })
  });

  const journeyTitles = Object.freeze({
    ucl: 'Şampiyonlar Ligi Yolculuğu',
    uel: 'Avrupa Ligi Yolculuğu',
    uecl: 'Konferans Ligi Yolculuğu'
  });

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

  function formatDate(value) {
    if (!value) return 'Tarih bekleniyor';
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(new Date(`${value}T12:00:00Z`));
  }

  function fitFont(context, text, maximumWidth, startingSize, minimumSize, weight = 700) {
    let size = startingSize;
    while (size > minimumSize) {
      context.font = `${weight} ${size}px "Champions Sans", Inter, Arial, sans-serif`;
      if (context.measureText(text).width <= maximumWidth) break;
      size -= 1;
    }
    return size;
  }

  function fixtureRects(snapshot) {
    const fixtureGap = 9;
    const fixtureAreaTop = BODY.y + 70;
    const fixtureAreaHeight = BODY.height - 94;
    const fixtureHeight = Math.min(
      150,
      (fixtureAreaHeight - fixtureGap * Math.max(0, snapshot.fixtures.length - 1)) / snapshot.fixtures.length
    );
    const totalHeight = fixtureHeight * snapshot.fixtures.length
      + fixtureGap * Math.max(0, snapshot.fixtures.length - 1);
    const startY = fixtureAreaTop + Math.max(0, (fixtureAreaHeight - totalHeight) / 2);
    return snapshot.fixtures.map((_, index) => ({
      x: BODY.leftX + 18,
      y: startY + index * (fixtureHeight + fixtureGap),
      width: BODY.leftWidth - 36,
      height: fixtureHeight,
      radius: 18
    }));
  }

  function fillCardGradient(context, rect, theme) {
    context.save();
    roundedRectPath(context, rect.x, rect.y, rect.width, rect.height, rect.radius);
    const gradient = context.createLinearGradient(rect.x, rect.y, rect.x + rect.width, rect.y + rect.height);
    gradient.addColorStop(0, theme.cardStart);
    gradient.addColorStop(0.48, theme.cardEnd);
    gradient.addColorStop(1, '#040404');
    context.fillStyle = gradient;
    context.fill();
    context.strokeStyle = theme.stroke;
    context.lineWidth = 1.8;
    context.stroke();
    context.restore();
  }

  function drawCrestWithShadow(context, image, x, y, width, height, glow, blur = 22) {
    if (!image) return false;
    context.save();
    context.globalCompositeOperation = 'source-over';
    context.globalAlpha = 1;
    context.filter = 'none';
    context.shadowColor = 'rgba(0, 0, 0, 0.88)';
    context.shadowBlur = blur;
    context.shadowOffsetY = Math.max(3, blur * 0.2);
    const drawn = drawImageContain(context, image, x, y, width, height);
    context.shadowColor = glow;
    context.shadowBlur = blur * 0.65;
    context.shadowOffsetY = 0;
    if (drawn) drawImageContain(context, image, x, y, width, height);
    context.restore();
    return drawn;
  }

  async function redrawHeader(canvas, snapshot) {
    await window.UCLDRAW_CHAMPIONS_FONT_READY;
    const context = canvas.getContext('2d');
    if (!context) return canvas;
    const leagueId = snapshot.competition?.id || document.body.dataset.league || 'ucl';
    const theme = themes[leagueId] || themes.ucl;
    const [clubCrest, leagueLogo] = await Promise.all([
      loadImage(snapshot.activeCrest),
      loadImage(snapshot.competition?.logo)
    ]);
    const scaleX = canvas.width / CARD_WIDTH;
    const scaleY = canvas.height / CARD_HEIGHT;

    context.save();
    context.scale(scaleX, scaleY);
    roundedRectPath(context, HEADER.x, HEADER.y, HEADER.width, HEADER.height, HEADER.radius);
    const gradient = context.createLinearGradient(HEADER.x, HEADER.y, HEADER.x + HEADER.width, HEADER.y + HEADER.height);
    gradient.addColorStop(0, theme.headerStart);
    gradient.addColorStop(0.42, theme.headerEnd);
    gradient.addColorStop(1, '#030303');
    context.fillStyle = gradient;
    context.fill();
    context.strokeStyle = theme.stroke;
    context.lineWidth = 2;
    context.stroke();

    const clubSize = 166;
    const clubX = HEADER.x + 30;
    const clubY = HEADER.y + (HEADER.height - clubSize) / 2;
    drawCrestWithShadow(context, clubCrest, clubX, clubY, clubSize, clubSize, theme.glow, 26);

    const leagueSize = 160;
    const standingsCenterX = BODY.rightX + BODY.rightWidth / 2;
    const leagueX = standingsCenterX - leagueSize / 2;
    const leagueY = HEADER.y + (HEADER.height - leagueSize) / 2;
    drawCrestWithShadow(context, leagueLogo, leagueX, leagueY, leagueSize, leagueSize, theme.glow, 18);

    const copyX = clubX + clubSize + 34;
    const copyWidth = Math.max(310, leagueX - 34 - copyX);
    context.textAlign = 'left';
    context.textBaseline = 'alphabetic';
    context.fillStyle = 'rgba(255, 255, 255, 0.72)';
    context.font = '400 23px "Champions Sans", Arial, sans-serif';
    context.fillText('2026-27', copyX, HEADER.y + 54);

    const titleSize = fitFont(context, snapshot.activeName, copyWidth, 72, 39, 700);
    context.font = `700 ${titleSize}px "Champions Sans", Arial, sans-serif`;
    context.fillStyle = '#fff';
    context.shadowColor = 'rgba(0, 0, 0, 0.90)';
    context.shadowBlur = 16;
    context.fillText(snapshot.activeName, copyX, HEADER.y + 132);
    context.shadowBlur = 0;

    const journey = journeyTitles[leagueId] || `${snapshot.competition?.shortName || 'Avrupa Kupası'} Yolculuğu`;
    const journeySize = fitFont(context, journey, copyWidth, 39, 25, 400);
    context.font = `400 ${journeySize}px "Champions Sans", Arial, sans-serif`;
    context.fillStyle = 'rgba(255, 255, 255, 0.76)';
    context.fillText(journey, copyX, HEADER.y + 191);

    context.textAlign = 'right';
    context.font = '700 16px "Champions Sans", Arial, sans-serif';
    context.fillStyle = 'rgba(255, 255, 255, 0.66)';
    context.fillText(SITE_LINK, CARD_WIDTH - 48, CARD_HEIGHT - 24);
    context.restore();
    return canvas;
  }

  async function redrawFixtureCards(canvas, snapshot) {
    await window.UCLDRAW_CHAMPIONS_FONT_READY;
    const context = canvas.getContext('2d');
    if (!context || !snapshot.fixtures.length) return canvas;
    const leagueId = snapshot.competition?.id || document.body.dataset.league || 'ucl';
    const theme = themes[leagueId] || themes.ucl;
    const scaleX = canvas.width / CARD_WIDTH;
    const scaleY = canvas.height / CARD_HEIGHT;
    const rects = fixtureRects(snapshot);

    for (let index = 0; index < snapshot.fixtures.length; index += 1) {
      const fixture = snapshot.fixtures[index];
      const rect = rects[index];
      const [homeLogo, awayLogo] = await Promise.all([
        loadImage(fixture.home.crest),
        loadImage(fixture.away.crest)
      ]);

      context.save();
      context.scale(scaleX, scaleY);
      fillCardGradient(context, rect, theme);

      context.textAlign = 'center';
      context.textBaseline = 'alphabetic';
      context.fillStyle = 'rgba(255, 255, 255, 0.68)';
      context.font = '400 16px "Champions Sans", Arial, sans-serif';
      context.fillText(formatDate(fixture.date), rect.x + rect.width / 2, rect.y + 23);

      const crestSize = Math.min(68, Math.max(54, rect.height * 0.48));
      const crestY = rect.y + 33;
      const homeCenterX = rect.x + rect.width * 0.27;
      const awayCenterX = rect.x + rect.width * 0.73;
      drawCrestWithShadow(context, homeLogo, homeCenterX - crestSize / 2, crestY, crestSize, crestSize, theme.glow, 13);
      drawCrestWithShadow(context, awayLogo, awayCenterX - crestSize / 2, crestY, crestSize, crestSize, theme.glow, 13);

      const scoreY = crestY + crestSize * 0.62;
      context.font = '700 32px "Champions Sans", Arial, sans-serif';
      context.fillStyle = '#fff';
      context.shadowColor = 'rgba(0, 0, 0, 0.84)';
      context.shadowBlur = 10;
      const score = fixture.score ? `${fixture.score.homeGoals} – ${fixture.score.awayGoals}` : '– –';
      context.fillText(score, rect.x + rect.width / 2, scoreY);
      context.shadowBlur = 0;

      const nameY = rect.y + rect.height - 14;
      const nameWidth = Math.min(215, rect.width * 0.34);
      const homeSize = fitFont(context, fixture.home.name, nameWidth, 17, 12, 700);
      context.font = `700 ${homeSize}px "Champions Sans", Arial, sans-serif`;
      context.fillStyle = '#fff';
      context.fillText(fixture.home.name, homeCenterX, nameY, nameWidth);
      const awaySize = fitFont(context, fixture.away.name, nameWidth, 17, 12, 700);
      context.font = `700 ${awaySize}px "Champions Sans", Arial, sans-serif`;
      context.fillText(fixture.away.name, awayCenterX, nameY, nameWidth);
      context.restore();
    }
    return canvas;
  }

  async function renderShareCard(snapshot) {
    const canvas = await V5.renderShareCard(snapshot);
    await redrawHeader(canvas, snapshot);
    await redrawFixtureCards(canvas, snapshot);
    return canvas;
  }

  function slug(value = '') {
    return String(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('en-US')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
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

  document.addEventListener('click', async (event) => {
    const button = event.target.closest?.('.prediction-share-v4-button');
    if (!button || button.hidden) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (button.dataset.busy === 'true') return;
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

  window.UCLDRAW_PREDICTION_SHARE_V6 = Object.freeze({
    renderShareCard,
    shareCurrent,
    redrawHeader,
    redrawFixtureCards,
    fixtureRects
  });
})();