(() => {
  'use strict';

  const V6 = window.UCLDRAW_PREDICTION_SHARE_V6;
  const SHARE = window.UCLDRAW_PREDICTION_SHARE;
  if (!V6?.renderShareCard || !SHARE?.collectSnapshot) return;

  const CARD_WIDTH = 1200;
  const CARD_HEIGHT = 1600;
  const CARD_OPACITY = 0.62;
  const SITE_LINK = 'urjiko.github.io/UEFA';
  const HEADER = Object.freeze({ x: 48, y: 36, width: 1104, height: 236, radius: 30 });
  const BODY = Object.freeze({ y: 306, height: 1230, leftX: 48, leftWidth: 680, rightX: 752, rightWidth: 400 });
  const imageCache = new Map();

  const themes = Object.freeze({
    ucl: Object.freeze({
      headerStart: '#102a82', headerEnd: '#050914',
      cardStart: Object.freeze([20, 43, 103]), cardMiddle: Object.freeze([10, 24, 66]), cardEnd: Object.freeze([5, 12, 32]),
      stroke: 'rgba(118, 151, 255, 0.52)', glow: 'rgba(65, 105, 255, 0.56)'
    }),
    uel: Object.freeze({
      headerStart: '#4b1704', headerEnd: '#120701',
      cardStart: Object.freeze([67, 25, 7]), cardMiddle: Object.freeze([43, 15, 4]), cardEnd: Object.freeze([23, 8, 3]),
      stroke: 'rgba(227, 111, 48, 0.48)', glow: 'rgba(196, 70, 16, 0.50)'
    }),
    uecl: Object.freeze({
      headerStart: '#063814', headerEnd: '#03180b',
      cardStart: Object.freeze([8, 57, 24]), cardMiddle: Object.freeze([5, 39, 17]), cardEnd: Object.freeze([3, 23, 10]),
      stroke: 'rgba(73, 194, 106, 0.46)', glow: 'rgba(35, 158, 73, 0.48)'
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

  function fitFont(context, text, maximumWidth, startingSize, minimumSize, weight = 700) {
    let size = startingSize;
    while (size > minimumSize) {
      context.font = `${weight} ${size}px "Champions Sans", Inter, Arial, sans-serif`;
      if (context.measureText(text).width <= maximumWidth) break;
      size -= 1;
    }
    return size;
  }

  function formatDate(value) {
    if (!value) return 'Tarih bekleniyor';
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
    }).format(new Date(`${value}T12:00:00Z`));
  }

  function rgba(rgb, alpha = CARD_OPACITY) {
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
  }

  function drawCrestWithShadow(context, image, x, y, width, height, glow, blackBlur, glowBlur) {
    if (!image) return false;
    context.save();
    context.globalCompositeOperation = 'source-over';
    context.globalAlpha = 1;
    context.filter = 'none';
    context.shadowColor = 'rgba(0, 0, 0, 0.92)';
    context.shadowBlur = blackBlur;
    context.shadowOffsetY = 5;
    const drawn = drawImageContain(context, image, x, y, width, height);
    context.shadowColor = glow;
    context.shadowBlur = glowBlur;
    context.shadowOffsetY = 0;
    if (drawn) drawImageContain(context, image, x, y, width, height);
    context.restore();
    return drawn;
  }

  async function redrawAlignedHeader(canvas, snapshot) {
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
    context.clip();
    context.globalAlpha = 1;
    context.globalCompositeOperation = 'source-over';
    const gradient = context.createLinearGradient(HEADER.x, HEADER.y, HEADER.x + HEADER.width, HEADER.y + HEADER.height);
    gradient.addColorStop(0, theme.headerStart);
    gradient.addColorStop(0.58, theme.headerEnd);
    gradient.addColorStop(1, leagueId === 'uecl' ? '#021108' : '#030303');
    context.fillStyle = gradient;
    context.fillRect(HEADER.x, HEADER.y, HEADER.width, HEADER.height);
    context.restore();

    context.save();
    context.scale(scaleX, scaleY);
    roundedRectPath(context, HEADER.x, HEADER.y, HEADER.width, HEADER.height, HEADER.radius);
    context.strokeStyle = theme.stroke;
    context.lineWidth = 2;
    context.stroke();

    const clubSize = 178;
    const clubX = HEADER.x + 28;
    const clubY = HEADER.y + (HEADER.height - clubSize) / 2;
    drawCrestWithShadow(context, clubCrest, clubX, clubY, clubSize, clubSize, theme.glow, 30, 23);

    const leagueSize = 166;
    const standingsCenterX = BODY.rightX + BODY.rightWidth / 2;
    const leagueX = standingsCenterX - leagueSize / 2;
    const leagueY = HEADER.y + (HEADER.height - leagueSize) / 2;
    drawCrestWithShadow(context, leagueLogo, leagueX, leagueY, leagueSize, leagueSize, theme.glow, 30, 44);

    const copyX = clubX + clubSize + 28;
    const copyWidth = Math.max(300, leagueX - 34 - copyX);
    context.textAlign = 'left';
    context.textBaseline = 'alphabetic';
    context.fillStyle = 'rgba(255, 255, 255, 0.72)';
    context.font = '400 23px "Champions Sans", Arial, sans-serif';
    context.fillText('2026-27', copyX, clubY + 30);

    const titleSize = fitFont(context, snapshot.activeName, copyWidth, 72, 39, 700);
    context.font = `700 ${titleSize}px "Champions Sans", Arial, sans-serif`;
    context.fillStyle = '#fff';
    context.shadowColor = 'rgba(0, 0, 0, 0.94)';
    context.shadowBlur = 28;
    context.fillText(snapshot.activeName, copyX, clubY + 96);
    context.shadowBlur = 0;

    const journey = journeyTitles[leagueId] || `${snapshot.competition?.shortName || 'Avrupa Kupası'} Yolculuğu`;
    const journeySize = fitFont(context, journey, copyWidth, 38, 24, 400);
    context.font = `400 ${journeySize}px "Champions Sans", Arial, sans-serif`;
    context.fillStyle = 'rgba(255, 255, 255, 0.76)';
    context.fillText(journey, copyX, clubY + 145);

    context.textAlign = 'right';
    context.font = '700 16px "Champions Sans", Arial, sans-serif';
    context.fillStyle = 'rgba(255, 255, 255, 0.66)';
    context.fillText(SITE_LINK, CARD_WIDTH - 48, CARD_HEIGHT - 24);
    context.restore();
    return canvas;
  }

  function conferenceFixtureRects(snapshot) {
    const gap = 9;
    const startY = BODY.y + 62;
    const bottomMargin = 18;
    const availableHeight = BODY.height - 62 - bottomMargin;
    const height = (availableHeight - gap * Math.max(0, snapshot.fixtures.length - 1)) / snapshot.fixtures.length;
    return snapshot.fixtures.map((_, index) => ({
      x: BODY.leftX + 18,
      y: startY + index * (height + gap),
      width: BODY.leftWidth - 36,
      height,
      radius: 18
    }));
  }

  function clearConferenceFixtureArea(context, canvas, scaleX, scaleY) {
    const startY = BODY.y + 58;
    const bottomY = BODY.y + BODY.height - 18;
    const sourceX = (BODY.leftX + BODY.leftWidth - 12) * scaleX;
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.drawImage(
      canvas,
      sourceX,
      startY * scaleY,
      Math.max(2, 6 * scaleX),
      (bottomY - startY) * scaleY,
      (BODY.leftX + 12) * scaleX,
      startY * scaleY,
      (BODY.leftWidth - 24) * scaleX,
      (bottomY - startY) * scaleY
    );
    context.restore();
  }

  function fillCardGradient(context, rect, theme) {
    roundedRectPath(context, rect.x, rect.y, rect.width, rect.height, rect.radius);
    const gradient = context.createLinearGradient(rect.x, rect.y, rect.x + rect.width, rect.y + rect.height);
    gradient.addColorStop(0, rgba(theme.cardStart));
    gradient.addColorStop(0.56, rgba(theme.cardMiddle));
    gradient.addColorStop(1, rgba(theme.cardEnd));
    context.fillStyle = gradient;
    context.fill();
    context.strokeStyle = theme.stroke;
    context.lineWidth = 1.8;
    context.stroke();
  }

  async function redrawConferenceFixtures(canvas, snapshot) {
    if (snapshot.competition?.id !== 'uecl' || snapshot.fixtures.length !== 6) return canvas;
    await window.UCLDRAW_CHAMPIONS_FONT_READY;
    const context = canvas.getContext('2d');
    if (!context) return canvas;
    const theme = themes.uecl;
    const scaleX = canvas.width / CARD_WIDTH;
    const scaleY = canvas.height / CARD_HEIGHT;
    const rects = conferenceFixtureRects(snapshot);
    clearConferenceFixtureArea(context, canvas, scaleX, scaleY);

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
      context.textBaseline = 'middle';
      context.fillStyle = 'rgba(255, 255, 255, 0.70)';
      context.font = '400 17px "Champions Sans", Arial, sans-serif';
      context.fillText(formatDate(fixture.date), rect.x + rect.width / 2, rect.y + 21);

      const crestSize = Math.min(90, Math.max(74, rect.height * 0.48));
      const crestY = rect.y + 37;
      const homeCenterX = rect.x + rect.width * 0.27;
      const awayCenterX = rect.x + rect.width * 0.73;
      drawCrestWithShadow(context, homeLogo, homeCenterX - crestSize / 2, crestY, crestSize, crestSize, theme.glow, 15, 10);
      drawCrestWithShadow(context, awayLogo, awayCenterX - crestSize / 2, crestY, crestSize, crestSize, theme.glow, 15, 10);

      context.font = '700 40px "Champions Sans", Arial, sans-serif';
      context.fillStyle = '#fff';
      context.shadowColor = 'rgba(0, 0, 0, 0.86)';
      context.shadowBlur = 12;
      const score = fixture.score ? `${fixture.score.homeGoals} – ${fixture.score.awayGoals}` : '– –';
      context.fillText(score, rect.x + rect.width / 2, rect.y + rect.height / 2);
      context.shadowBlur = 0;

      const nameY = rect.y + rect.height - 17;
      const nameWidth = Math.min(225, rect.width * 0.35);
      const homeSize = fitFont(context, fixture.home.name, nameWidth, 19, 12, 700);
      context.font = `700 ${homeSize}px "Champions Sans", Arial, sans-serif`;
      context.fillText(fixture.home.name, homeCenterX, nameY, nameWidth);
      const awaySize = fitFont(context, fixture.away.name, nameWidth, 19, 12, 700);
      context.font = `700 ${awaySize}px "Champions Sans", Arial, sans-serif`;
      context.fillText(fixture.away.name, awayCenterX, nameY, nameWidth);
      context.restore();
    }
    return canvas;
  }

  async function renderShareCard(snapshot) {
    const canvas = await V6.renderShareCard(snapshot);
    await redrawAlignedHeader(canvas, snapshot);
    await redrawConferenceFixtures(canvas, snapshot);
    return canvas;
  }

  function slug(value = '') {
    return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('en-US').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG dosyası oluşturulamadı.')), 'image/png', 1);
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

  window.UCLDRAW_PREDICTION_SHARE_V7 = Object.freeze({
    renderShareCard,
    shareCurrent,
    redrawAlignedHeader,
    redrawConferenceFixtures,
    conferenceFixtureRects,
    cardOpacity: CARD_OPACITY
  });
})();
