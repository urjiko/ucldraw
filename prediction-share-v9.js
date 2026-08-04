(() => {
  'use strict';

  const V8 = window.UCLDRAW_PREDICTION_SHARE_V8;
  const SHARE = window.UCLDRAW_PREDICTION_SHARE;
  if (!V8?.renderShareCard || !SHARE?.collectSnapshot) return;

  const CARD_WIDTH = 1200;
  const CARD_HEIGHT = 1600;
  const EXPORT_SCALE = 2;
  const OUTPUT_WIDTH = CARD_WIDTH * EXPORT_SCALE;
  const OUTPUT_HEIGHT = CARD_HEIGHT * EXPORT_SCALE;
  const journeyTitles = Object.freeze({
    ucl: 'Şampiyonlar Ligi Yolculuğu',
    uel: 'Avrupa Ligi Yolculuğu',
    uecl: 'Konferans Ligi Yolculuğu'
  });

  let cachedKey = '';
  let cachedExport = null;
  let floatingActions = null;
  let floatingObserver = null;
  let observedRow = null;
  let refreshQueued = false;

  function slug(value = '') {
    return String(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('en-US')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.setTimeout(() => toast.classList.remove('is-visible'), 3200);
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Yüksek çözünürlüklü PNG oluşturulamadı.'));
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
    window.setTimeout(() => URL.revokeObjectURL(url), 1200);
  }

  function predictionsComplete() {
    const cards = [...document.querySelectorAll('#predictionSection .prediction-fixture-card')];
    return cards.length > 0 && cards.every((card) => card.classList.contains('is-resolved'));
  }

  function snapshotKey(snapshot) {
    return JSON.stringify({
      league: snapshot.competition?.id,
      team: snapshot.activeName,
      fixtures: snapshot.fixtures.map((fixture) => [
        fixture.home.name,
        fixture.away.name,
        fixture.score?.homeGoals,
        fixture.score?.awayGoals
      ]),
      standings: snapshot.standings.map((row) => [row.rank, row.team.name, row.points, row.goalDifference])
    });
  }

  function upscaleCanvas(sourceCanvas) {
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_WIDTH;
    canvas.height = OUTPUT_HEIGHT;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Yüksek çözünürlüklü çıktı tuvali oluşturulamadı.');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(sourceCanvas, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
    return canvas;
  }

  async function renderExportCard(snapshot) {
    const sourceCanvas = await V8.renderShareCard(snapshot);
    if (sourceCanvas.width === OUTPUT_WIDTH && sourceCanvas.height === OUTPUT_HEIGHT) return sourceCanvas;
    return upscaleCanvas(sourceCanvas);
  }

  async function prepareExport() {
    const snapshot = SHARE.collectSnapshot();
    const key = snapshotKey(snapshot);
    if (cachedExport && cachedKey === key) return cachedExport;

    cachedKey = key;
    cachedExport = (async () => {
      const canvas = await renderExportCard(snapshot);
      const blob = await canvasToBlob(canvas);
      const filename = `2026-27-${slug(snapshot.activeName)}-${snapshot.competition.id}-yolculugu-2400x3200.png`;
      const title = `2026-27 ${snapshot.activeName} ${journeyTitles[snapshot.competition.id] || snapshot.competition.shortName}`;
      return { snapshot, canvas, blob, filename, title };
    })();

    try {
      return await cachedExport;
    } catch (error) {
      cachedKey = '';
      cachedExport = null;
      throw error;
    }
  }

  function invalidateExportCache() {
    cachedKey = '';
    cachedExport = null;
  }

  async function shareCurrent() {
    const output = await prepareExport();
    const file = new File([output.blob], output.filename, { type: 'image/png' });
    const shareData = { title: output.title, files: [file] };
    const canShareFiles = navigator.share
      && (!navigator.canShare || navigator.canShare(shareData));

    if (canShareFiles) {
      await navigator.share(shareData);
      showToast('Paylaşım menüsü açıldı.');
      return 'shared';
    }

    downloadBlob(output.blob, output.filename);
    showToast('Paylaşım desteklenmedi; PNG indirildi.');
    return 'downloaded';
  }

  function createShareButton(extraClass = '') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `action-button prediction-export-v9-button prediction-export-share-v9-button ${extraClass}`.trim();
    button.textContent = 'Paylaş';
    button.setAttribute('aria-label', 'Tahmin görselini paylaş');
    return button;
  }

  function normalizeShareGroup(group) {
    const buttons = [...group.querySelectorAll(':scope > .prediction-export-v9-button')];
    if (buttons.length === 1 && buttons[0].classList.contains('prediction-export-share-v9-button')) return;
    group.replaceChildren(createShareButton('primary'));
  }

  function ensureExportActions() {
    const row = document.querySelector('#predictionSection .prediction-share-actions-v4');
    const legacyShare = row?.querySelector('.prediction-share-v4-button');
    if (!row || !legacyShare) return;

    legacyShare.hidden = true;
    legacyShare.setAttribute('aria-hidden', 'true');
    legacyShare.classList.add('prediction-share-v9-legacy');

    let group = row.querySelector(':scope > .prediction-export-group-v9');
    if (!group) {
      group = document.createElement('div');
      group.className = 'prediction-export-group-v9';
      row.appendChild(group);
    }
    normalizeShareGroup(group);

    const complete = predictionsComplete();
    group.hidden = !complete;
    row.classList.toggle('has-share-v9', complete);
    group.querySelectorAll('.prediction-export-v9-button').forEach((button) => {
      button.disabled = !complete || group.dataset.busy === 'true';
    });
    syncFloatingActions();
  }

  function createFloatingActions() {
    const wrapper = document.createElement('div');
    wrapper.className = 'prediction-export-floating-v9';
    wrapper.hidden = true;
    wrapper.appendChild(createShareButton('primary'));
    document.body.appendChild(wrapper);
    return wrapper;
  }

  function rowIsVisible(row) {
    if (!row) return false;
    const rect = row.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }

  function observeRow(row) {
    if (observedRow === row) return;
    floatingObserver?.disconnect();
    observedRow = row;
    if (!row || !('IntersectionObserver' in window)) return;
    floatingObserver = new IntersectionObserver(syncFloatingActions, {
      root: null,
      threshold: [0, 0.05, 0.5, 1]
    });
    floatingObserver.observe(row);
  }

  function syncFloatingActions() {
    const row = document.querySelector('#predictionSection .prediction-share-actions-v4');
    const group = row?.querySelector(':scope > .prediction-export-group-v9');
    if (!floatingActions) floatingActions = createFloatingActions();
    observeRow(row);

    const active = document.body.classList.contains('prediction-active')
      && group
      && !group.hidden
      && predictionsComplete();
    if (!active) {
      floatingActions.hidden = true;
      return;
    }

    const busy = group.dataset.busy === 'true';
    floatingActions.querySelectorAll('.prediction-export-v9-button').forEach((button) => {
      button.disabled = busy;
    });
    floatingActions.hidden = rowIsVisible(row);
  }

  function setBusy(group, clickedButton, busy) {
    group.dataset.busy = busy ? 'true' : 'false';
    const buttons = [
      ...group.querySelectorAll('.prediction-export-v9-button'),
      ...document.querySelectorAll('.prediction-export-floating-v9 .prediction-export-v9-button')
    ];
    buttons.forEach((button) => { button.disabled = busy; });
    if (!clickedButton) return;

    if (busy) {
      clickedButton.dataset.idleText = clickedButton.textContent;
      clickedButton.textContent = 'Hazırlanıyor...';
    } else {
      clickedButton.textContent = clickedButton.dataset.idleText || 'Paylaş';
      delete clickedButton.dataset.idleText;
    }
  }

  async function runShareAction(button) {
    const row = document.querySelector('#predictionSection .prediction-share-actions-v4');
    const group = row?.querySelector(':scope > .prediction-export-group-v9');
    if (!group || group.dataset.busy === 'true' || !predictionsComplete()) return;

    setBusy(group, button, true);
    try {
      await shareCurrent();
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error(error);
        showToast(error?.message || 'Görsel çıktısı oluşturulamadı.');
      }
    } finally {
      setBusy(group, button, false);
      ensureExportActions();
      syncFloatingActions();
    }
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('.prediction-export-v9-button');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    runShareAction(button);
  }, true);

  function queueRefresh() {
    if (refreshQueued) return;
    refreshQueued = true;
    window.requestAnimationFrame(() => {
      refreshQueued = false;
      ensureExportActions();
      syncFloatingActions();
    });
  }

  const observationRoot = document.getElementById('predictionSection') || document.body;
  new MutationObserver((mutations) => {
    if (mutations.some((mutation) => mutation.type === 'childList' || mutation.attributeName === 'class')) {
      invalidateExportCache();
    }
    queueRefresh();
  }).observe(observationRoot, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['hidden', 'class', 'value']
  });

  document.addEventListener('input', (event) => {
    if (!event.target.closest?.('#predictionSection')) return;
    invalidateExportCache();
    queueRefresh();
  }, true);
  document.addEventListener('change', (event) => {
    if (!event.target.closest?.('#predictionSection')) return;
    invalidateExportCache();
    queueRefresh();
  }, true);

  window.addEventListener('ucldraw:ai-predictions-applied', () => {
    invalidateExportCache();
    queueRefresh();
  });
  window.addEventListener('resize', queueRefresh, { passive: true });
  window.addEventListener('scroll', syncFloatingActions, { passive: true });

  window.UCLDRAW_PREDICTION_SHARE_V9 = Object.freeze({
    renderExportCard,
    prepareExport,
    shareCurrent,
    outputWidth: OUTPUT_WIDTH,
    outputHeight: OUTPUT_HEIGHT
  });

  ensureExportActions();
  syncFloatingActions();
})();
