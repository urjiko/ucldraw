(() => {
  'use strict';

  const V7 = window.UCLDRAW_PREDICTION_SHARE_V7;
  const SHARE = window.UCLDRAW_PREDICTION_SHARE;
  if (!V7?.renderShareCard || !SHARE?.collectSnapshot) return;

  const CARD_WIDTH = 1200;
  const CARD_HEIGHT = 1600;
  const HEADER = Object.freeze({ x: 48, y: 36, width: 1104, height: 236, radius: 30 });
  const CLUB = Object.freeze({ x: 76, y: 65, size: 178, repaintRight: 278 });
  const FOOTER = Object.freeze({ y: 1536, height: 64, leftX: 48, rightX: 1152, textY: 1568 });
  const SITE_LINK = 'urjiko.github.io/UEFA';
  const FOOTER_LABEL = 'Unofficial Simulation';
  const imageCache = new Map();

  const headerThemes = Object.freeze({
    ucl: Object.freeze({ start: '#102a82', end: '#050914', final: '#030303', stroke: 'rgba(118, 151, 255, 0.52)' }),
    uel: Object.freeze({ start: '#4b1704', end: '#120701', final: '#030303', stroke: 'rgba(227, 111, 48, 0.48)' }),
    uecl: Object.freeze({ start: '#063814', end: '#03180b', final: '#021108', stroke: 'rgba(73, 194, 106, 0.46)' })
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

  async function redrawClubCrestWithBlackShadow(canvas, snapshot) {
    const context = canvas.getContext('2d');
    if (!context) return canvas;
    const crest = await loadImage(snapshot.activeCrest);
    if (!crest) return canvas;

    const leagueId = snapshot.competition?.id || document.body.dataset.league || 'ucl';
    const theme = headerThemes[leagueId] || headerThemes.ucl;
    const scaleX = canvas.width / CARD_WIDTH;
    const scaleY = canvas.height / CARD_HEIGHT;

    context.save();
    context.scale(scaleX, scaleY);
    roundedRectPath(context, HEADER.x, HEADER.y, HEADER.width, HEADER.height, HEADER.radius);
    context.clip();

    const gradient = context.createLinearGradient(HEADER.x, HEADER.y, HEADER.x + HEADER.width, HEADER.y + HEADER.height);
    gradient.addColorStop(0, theme.start);
    gradient.addColorStop(0.58, theme.end);
    gradient.addColorStop(1, theme.final);
    context.fillStyle = gradient;
    context.fillRect(HEADER.x, HEADER.y, CLUB.repaintRight - HEADER.x, HEADER.height);
    context.restore();

    context.save();
    context.scale(scaleX, scaleY);
    context.globalCompositeOperation = 'source-over';
    context.globalAlpha = 1;
    context.filter = 'none';
    context.shadowColor = 'rgba(0, 0, 0, 0.96)';
    context.shadowBlur = 42;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 8;
    drawImageContain(context, crest, CLUB.x, CLUB.y, CLUB.size, CLUB.size);
    context.shadowColor = 'transparent';
    context.shadowBlur = 0;
    context.shadowOffsetY = 0;
    drawImageContain(context, crest, CLUB.x, CLUB.y, CLUB.size, CLUB.size);

    roundedRectPath(context, HEADER.x, HEADER.y, HEADER.width, HEADER.height, HEADER.radius);
    context.strokeStyle = theme.stroke;
    context.lineWidth = 2;
    context.stroke();
    context.restore();
    return canvas;
  }

  function redrawFooter(canvas, snapshot) {
    const context = canvas.getContext('2d');
    if (!context) return canvas;
    const leagueId = snapshot.competition?.id || document.body.dataset.league || 'ucl';
    const theme = headerThemes[leagueId] || headerThemes.ucl;
    const scaleX = canvas.width / CARD_WIDTH;
    const scaleY = canvas.height / CARD_HEIGHT;

    context.save();
    context.scale(scaleX, scaleY);
    context.globalCompositeOperation = 'source-over';
    context.globalAlpha = 1;
    context.filter = 'none';
    context.shadowColor = 'transparent';
    context.shadowBlur = 0;

    const footerGradient = context.createLinearGradient(0, FOOTER.y, CARD_WIDTH, FOOTER.y);
    footerGradient.addColorStop(0, theme.end);
    footerGradient.addColorStop(0.38, '#030303');
    footerGradient.addColorStop(1, theme.final);
    context.fillStyle = footerGradient;
    context.fillRect(0, FOOTER.y, CARD_WIDTH, FOOTER.height);

    context.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(48, FOOTER.y + 0.5);
    context.lineTo(CARD_WIDTH - 48, FOOTER.y + 0.5);
    context.stroke();

    context.textBaseline = 'middle';
    context.fillStyle = 'rgba(255, 255, 255, 0.62)';
    context.font = '600 16px "Champions Sans", Arial, sans-serif';
    context.textAlign = 'left';
    context.fillText(FOOTER_LABEL, FOOTER.leftX, FOOTER.textY);

    context.fillStyle = 'rgba(255, 255, 255, 0.78)';
    context.font = '700 16px "Champions Sans", Arial, sans-serif';
    context.textAlign = 'right';
    context.fillText(SITE_LINK, FOOTER.rightX, FOOTER.textY);
    context.restore();
    return canvas;
  }

  async function renderShareCard(snapshot) {
    const canvas = await V7.renderShareCard(snapshot);
    await redrawClubCrestWithBlackShadow(canvas, snapshot);
    redrawFooter(canvas, snapshot);
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

  function installHighResolutionExport() {
    if (!document.querySelector('link[data-prediction-share-v9]')) {
      const stylesheet = document.createElement('link');
      stylesheet.rel = 'stylesheet';
      stylesheet.href = 'prediction-share-v9.css';
      stylesheet.dataset.predictionShareV9 = 'true';
      document.head.appendChild(stylesheet);
    }
    if (window.UCLDRAW_PREDICTION_SHARE_V9 || document.querySelector('script[data-prediction-share-v9]')) return;
    const script = document.createElement('script');
    script.src = 'prediction-share-v9.js';
    script.async = false;
    script.dataset.predictionShareV9 = 'true';
    document.body.appendChild(script);
  }

  window.UCLDRAW_PREDICTION_SHARE_V8 = Object.freeze({
    renderShareCard,
    shareCurrent,
    redrawClubCrestWithBlackShadow,
    redrawFooter,
    footerLabel: FOOTER_LABEL,
    siteLink: SITE_LINK
  });

  installHighResolutionExport();
})();