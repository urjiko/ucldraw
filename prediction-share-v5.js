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
  const gradientProfiles = Object.freeze({
    uel: Object.freeze({
      accent: 'rgba(82, 25, 2, 0.82)',
      middle: 'rgba(25, 7, 1, 0.90)',
      black: 'rgba(0, 0, 0, 0.98)',
      edgeAlpha: 0.34
    }),
    uecl: Object.freeze({
      accent: 'rgba(3, 54, 17, 0.80)',
      middle: 'rgba(1, 18, 6, 0.91)',
      black: 'rgba(0, 0, 0, 0.98)',
      edgeAlpha: 0.36
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

  function clampChannel(value) {
    return Math.max(0, Math.min(255, Math.round(value)));
  }

  function restoreLightDetails(original, toned) {
    for (let index = 0; index < original.length; index += 4) {
      if (original[index + 3] === 0) continue;

      const red = original[index];
      const green = original[index + 1];
      const blue = original[index + 2];
      const maximum = Math.max(red, green, blue);
      const minimum = Math.min(red, green, blue);
      const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
      const neutralLight = maximum > 150 && maximum - minimum < 42;
      const brightDetail = luminance > 172;
      if (!neutralLight && !brightDetail) continue;

      const restore = luminance > 220 ? 0.94 : luminance > 190 ? 0.84 : 0.70;
      toned[index] = clampChannel(toned[index] * (1 - restore) + red * restore);
      toned[index + 1] = clampChannel(toned[index + 1] * (1 - restore) + green * restore);
      toned[index + 2] = clampChannel(toned[index + 2] * (1 - restore) + blue * restore);
    }
  }

  function applyLeagueGradient(canvas, snapshot) {
    const leagueId = snapshot.competition?.id || document.body.dataset.league || 'ucl';
    const profile = gradientProfiles[leagueId];
    if (!profile) return canvas;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return canvas;

    const original = context.getImageData(0, 0, canvas.width, canvas.height);

    context.save();
    context.globalCompositeOperation = 'overlay';
    const leagueGradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    leagueGradient.addColorStop(0, profile.accent);
    leagueGradient.addColorStop(0.30, profile.middle);
    leagueGradient.addColorStop(0.68, profile.black);
    leagueGradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
    context.fillStyle = leagueGradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.globalCompositeOperation = 'source-over';
    const vignette = context.createRadialGradient(
      canvas.width * 0.34,
      canvas.height * 0.22,
      canvas.width * 0.08,
      canvas.width * 0.50,
      canvas.height * 0.50,
      canvas.height * 0.82
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0.03)');
    vignette.addColorStop(0.48, 'rgba(0, 0, 0, 0.14)');
    vignette.addColorStop(1, `rgba(0, 0, 0, ${profile.edgeAlpha})`);
    context.fillStyle = vignette;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.restore();

    const toned = context.getImageData(0, 0, canvas.width, canvas.height);
    restoreLightDetails(original.data, toned.data);
    context.putImageData(toned, 0, 0);
    return canvas;
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
      context.fillStyle = 'rgba(255, 255, 255, 0.72)';
      context.fillText(formatDate(fixture.date), rowX + rowWidth / 2, rowY + 27);
      context.restore();
    }

    return canvas;
  }

  async function renderShareCard(snapshot) {
    const canvas = await V4.renderShareCard(snapshot);
    applyLeagueGradient(canvas, snapshot);
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
    redrawFixtureDates,
    applyLeagueGradient
  });
})();