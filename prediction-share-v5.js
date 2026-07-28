(() => {
  'use strict';

  const V4 = window.UCLDRAW_PREDICTION_SHARE_V4;
  const SHARE = window.UCLDRAW_PREDICTION_SHARE;
  if (!V4?.renderShareCard || !SHARE?.collectSnapshot) return;

  const CARD_WIDTH = 1200;
  const CARD_HEIGHT = 1600;
  const SITE_LINK = 'urjiko.github.io/UEFA';
  const journeyTitles = Object.freeze({
    ucl: 'Şampiyonlar Ligi Yolculuğu',
    uel: 'Avrupa Ligi Yolculuğu',
    uecl: 'Konferans Ligi Yolculuğu'
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

  async function redrawFixtureDates(canvas, snapshot) {
    await window.UCLDRAW_CHAMPIONS_FONT_READY;
    if (document.fonts?.load) await document.fonts.load('400 17px "Champions Sans"');

    const context = canvas.getContext('2d');
    if (!context || !snapshot.fixtures.length) return canvas;

    const scaleX = canvas.width / CARD_WIDTH;
    const scaleY = canvas.height / CARD_HEIGHT;
    const padding = 48;
    const bodyY = 36 + 236 + 34;
    const bodyHeight = CARD_HEIGHT - bodyY - 64;
    const leftWidth = 680;
    const fixtureGap = 9;
    const fixtureAreaTop = bodyY + 70;
    const fixtureAreaHeight = bodyHeight - 94;
    const fixtureHeight = Math.min(
      150,
      (fixtureAreaHeight - fixtureGap * Math.max(0, snapshot.fixtures.length - 1)) / snapshot.fixtures.length
    );
    const totalFixtureHeight = fixtureHeight * snapshot.fixtures.length
      + fixtureGap * Math.max(0, snapshot.fixtures.length - 1);
    const fixtureStartY = fixtureAreaTop + Math.max(0, (fixtureAreaHeight - totalFixtureHeight) / 2);
    const rowX = padding + 18;
    const rowWidth = leftWidth - 36;

    for (let index = 0; index < snapshot.fixtures.length; index += 1) {
      const fixture = snapshot.fixtures[index];
      const rowY = fixtureStartY + index * (fixtureHeight + fixtureGap);

      // Copy a clean two-pixel strip from the same row across the old week/date label.
      // This preserves the exact translucent row colour without drawing a second overlay.
      const sourceX = (rowX + rowWidth - 34) * scaleX;
      const sourceY = (rowY + 8) * scaleY;
      const sourceWidth = Math.max(1, 2 * scaleX);
      const sourceHeight = 25 * scaleY;
      const destinationX = (rowX + 12) * scaleX;
      const destinationWidth = (rowWidth - 24) * scaleX;
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
      context.fillText(formatDate(fixture.date), rowX + rowWidth / 2, rowY + 27);
      context.restore();
    }

    return canvas;
  }

  async function renderShareCard(snapshot) {
    const canvas = await V4.renderShareCard(snapshot);
    return redrawFixtureDates(canvas, snapshot);
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
    redrawFixtureDates
  });
})();