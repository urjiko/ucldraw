(() => {
  'use strict';

  const V3 = window.UCLDRAW_PREDICTION_SHARE_V3;
  const SHARE = window.UCLDRAW_PREDICTION_SHARE;
  const AI = window.UCLDRAW_PREDICTION_AI;
  if (!V3?.renderShareCard || !SHARE?.collectSnapshot || !AI?.predictAll) return;

  const CARD_WIDTH = 1200;
  const CARD_HEIGHT = 1600;
  const SITE_LINK = 'urjiko.github.io/UEFA';
  const HEADER = Object.freeze({ x: 48, y: 36, width: 1104, height: 236 });
  const RIGHT_PANEL_X = 48 + 680 + 24;
  const RIGHT_PANEL_WIDTH = CARD_WIDTH - 96 - 680 - 24;
  const STANDINGS_CENTER_X = RIGHT_PANEL_X + RIGHT_PANEL_WIDTH / 2;
  const imageCache = new Map();

  const themes = Object.freeze({
    ucl: Object.freeze({ base: '#061030', accent: '#173dbe', border: 'rgba(71, 118, 255, 0.78)' }),
    uel: Object.freeze({ base: '#531d03', accent: '#a43e08', border: 'rgba(255, 121, 39, 0.76)' }),
    uecl: Object.freeze({ base: '#043d12', accent: '#087d27', border: 'rgba(45, 224, 88, 0.70)' })
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

  function drawHeaderBackground(context, theme) {
    context.save();
    roundedRectPath(context, HEADER.x, HEADER.y, HEADER.width, HEADER.height, 30);
    context.clip();
    const gradient = context.createLinearGradient(HEADER.x, HEADER.y, HEADER.x + HEADER.width, HEADER.y + HEADER.height);
    gradient.addColorStop(0, theme.accent);
    gradient.addColorStop(0.34, theme.base);
    gradient.addColorStop(0.72, theme.base);
    gradient.addColorStop(1, theme.accent);
    context.fillStyle = gradient;
    context.fillRect(HEADER.x, HEADER.y, HEADER.width, HEADER.height);
    context.globalAlpha = 0.12;
    context.strokeStyle = '#fff';
    context.lineWidth = 2;
    for (let x = HEADER.x - 120; x < HEADER.x + HEADER.width + 160; x += 126) {
      context.beginPath();
      context.moveTo(x, HEADER.y);
      context.lineTo(x + 170, HEADER.y + HEADER.height);
      context.stroke();
    }
    context.restore();
    context.save();
    roundedRectPath(context, HEADER.x, HEADER.y, HEADER.width, HEADER.height, 30);
    context.strokeStyle = theme.border;
    context.lineWidth = 2;
    context.stroke();
    context.restore();
  }

  function fitFont(context, text, maximumWidth, startingSize, minimumSize, weight) {
    let size = startingSize;
    while (size > minimumSize) {
      context.font = `${weight} ${size}px "Champions Sans", "Barlow Condensed", Arial, sans-serif`;
      if (context.measureText(text).width <= maximumWidth) break;
      size -= 1;
    }
    return size;
  }

  function drawClubCrest(context, image, x, y, size, theme) {
    context.save();
    roundedRectPath(context, x, y, size, size, 28);
    context.fillStyle = 'rgba(0, 0, 0, 0.24)';
    context.fill();
    context.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    context.lineWidth = 1.5;
    context.stroke();
    context.shadowColor = theme.border;
    context.shadowBlur = 24;
    drawImageContain(context, image, x + 10, y + 10, size - 20, size - 20);
    context.restore();
  }

  async function redrawHeader(canvas, snapshot) {
    await window.UCLDRAW_CHAMPIONS_FONT_READY;
    if (document.fonts?.load) {
      await Promise.all([
        document.fonts.load('700 74px "Champions Sans"'),
        document.fonts.load('400 40px "Champions Sans"')
      ]);
    }

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Paylaşım başlığı çizilemedi.');
    const competition = snapshot.competition;
    const leagueId = competition.id || document.body.dataset.league || 'ucl';
    const theme = themes[leagueId] || themes.ucl;
    const [clubCrest, leagueLogo] = await Promise.all([
      loadImage(snapshot.activeCrest),
      loadImage(competition.logo)
    ]);

    drawHeaderBackground(context, theme);

    const logoSize = 168;
    const logoY = HEADER.y + (HEADER.height - logoSize) / 2;
    const clubX = HEADER.x + 28;
    drawClubCrest(context, clubCrest, clubX, logoY, logoSize, theme);

    const leagueLogoX = STANDINGS_CENTER_X - logoSize / 2;
    context.save();
    context.globalAlpha = 0.98;
    context.shadowColor = 'rgba(0, 0, 0, 0.64)';
    context.shadowBlur = 18;
    drawImageContain(context, leagueLogo, leagueLogoX, logoY, logoSize, logoSize);
    context.restore();

    const copyX = clubX + logoSize + 32;
    const copyWidth = Math.max(300, leagueLogoX - 30 - copyX);
    context.textAlign = 'left';
    context.textBaseline = 'alphabetic';
    context.fillStyle = 'rgba(255, 255, 255, 0.76)';
    context.font = '400 23px "Champions Sans", Arial, sans-serif';
    context.fillText('2026-27', copyX, HEADER.y + 54);

    const teamSize = fitFont(context, snapshot.activeName, copyWidth, 74, 40, 700);
    context.font = `700 ${teamSize}px "Champions Sans", Arial, sans-serif`;
    context.fillStyle = '#fff';
    context.shadowColor = 'rgba(0, 0, 0, 0.94)';
    context.shadowBlur = 18;
    context.fillText(snapshot.activeName, copyX, HEADER.y + 132);
    context.shadowBlur = 0;

    const journey = journeyTitles[leagueId] || `${competition.shortName || 'Avrupa Kupası'} Yolculuğu`;
    const journeySize = fitFont(context, journey, copyWidth, 40, 25, 400);
    context.font = `400 ${journeySize}px "Champions Sans", Arial, sans-serif`;
    context.fillStyle = 'rgba(255, 255, 255, 0.78)';
    context.fillText(journey, copyX, HEADER.y + 191);

    context.textAlign = 'right';
    context.font = '700 16px "Champions Sans", Arial, sans-serif';
    context.fillStyle = 'rgba(255, 255, 255, 0.66)';
    context.fillText(SITE_LINK, CARD_WIDTH - 48, CARD_HEIGHT - 24);
    return canvas;
  }

  async function renderShareCard(snapshot) {
    const canvas = await V3.renderShareCard(snapshot);
    return redrawHeader(canvas, snapshot);
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG dosyası oluşturulamadı.')), 'image/png', 1);
    });
  }

  function slug(value = '') {
    return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('en-US').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
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

  function predictionsComplete() {
    const cards = [...document.querySelectorAll('#predictionSection .prediction-fixture-card')];
    return cards.length > 0 && cards.every((card) => card.classList.contains('is-resolved'));
  }

  function refreshPredictionView() {
    const selectedRow = document.querySelector('#predictionSection .prediction-standing-row.is-selected-team');
    if (selectedRow) selectedRow.click();
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
    let row = panel.querySelector(':scope > .prediction-share-actions-v4');
    if (!row) {
      row = document.createElement('div');
      row.className = 'prediction-share-actions-v4';
      const aiButton = createActionButton('Yapay Zeka Tahmini', 'prediction-ai-v4-button');
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
      const shareButton = createActionButton('Paylaş', 'primary prediction-share-v4-button');
      shareButton.addEventListener('click', async () => {
        if (shareButton.dataset.busy === 'true' || !predictionsComplete()) return;
        shareButton.dataset.busy = 'true';
        shareButton.disabled = true;
        shareButton.textContent = 'Hazırlanıyor...';
        try { await shareCurrent(); }
        catch (error) {
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
    row.querySelector('.prediction-share-v4-button').hidden = !complete;
    row.classList.toggle('has-share', complete);
  }

  const predictionSection = document.getElementById('predictionSection');
  if (predictionSection) {
    let queued = false;
    new MutationObserver(() => {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(() => {
        queued = false;
        ensureActions();
      });
    }).observe(predictionSection, { childList: true, subtree: true });
  }

  window.addEventListener('ucldraw:ai-predictions-applied', () => window.requestAnimationFrame(ensureActions));
  window.UCLDRAW_PREDICTION_SHARE_V4 = Object.freeze({ renderShareCard, shareCurrent, ensureActions });
  ensureActions();
})();
