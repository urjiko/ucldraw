(() => {
  'use strict';

  const body = document.body;
  const brandSubtitle = document.getElementById('brandSubtitle');
  const drawTopbar = document.querySelector('.draw-topbar');
  const progressTrack = drawTopbar?.querySelector('.progress-track');
  const progressBar = document.getElementById('progressBar');
  const drawActions = document.getElementById('drawActions');

  function setText(element, value) {
    if (element && element.textContent !== value) element.textContent = value;
  }

  function refineBrand() {
    if (brandSubtitle) {
      setText(brandSubtitle, '');
      brandSubtitle.hidden = true;
    }
    document.querySelectorAll('.league-state').forEach((label) => label.remove());
  }

  function refineTeamActionModal() {
    document.querySelectorAll('.roster-team-action-backdrop .roster-replacement-modal').forEach((modal) => {
      modal.classList.add('roster-team-action-simple');
      const header = modal.querySelector('.roster-incoming-team');
      const kicker = header?.querySelector(':scope > div > span');
      const description = header?.querySelector('p');
      const country = kicker?.textContent?.split('·').at(-1)?.trim();
      if (kicker && country) kicker.textContent = country;
      description?.remove();

      const ready = modal.querySelector('.roster-team-actions .action-button.primary');
      setText(ready, 'Hazır');
      modal.querySelector('.roster-locked-note')?.remove();
      const cancel = [...modal.querySelectorAll(':scope > .action-button')].at(-1);
      setText(cancel, 'Vazgeç');
    });
  }

  function refineConfirmation() {
    const backdrop = document.getElementById('confirmBackdrop');
    if (!backdrop || backdrop.hidden) return;
    backdrop.querySelector('.confirm-modal')?.classList.add('confirm-modal-simple');
    const title = document.getElementById('confirmTitle');
    if (title) setText(title, title.textContent.replace(/\s+hazır$/i, '').trim());
    const text = document.getElementById('confirmText');
    if (text) {
      setText(text, '');
      text.hidden = true;
    }
  }

  function refineDrawActions() {
    if (!drawActions) return;
    const retry = document.getElementById('retryButton');
    const continueButton = drawActions.querySelector('.prediction-entry-button');
    const customize = document.getElementById('customizeButton');
    const overview = document.getElementById('showOverviewButton');
    const exit = document.getElementById('changeTeamButton');

    setText(retry, 'Tekrar Dene');
    setText(continueButton, 'Devam Et');
    setText(customize, 'Düzenle');
    setText(overview, 'Tüm Maçlar');
    setText(exit, 'Çıkış');

    retry?.classList.remove('primary');
    continueButton?.classList.add('primary');
    [retry, continueButton, customize, overview, exit].filter(Boolean).forEach((button) => drawActions.appendChild(button));
    drawActions.classList.add('draw-actions-refined');
  }

  function refineDrawHeader() {
    if (!drawTopbar) return;
    drawTopbar.classList.add('draw-header-refined');
    const percentage = Number.parseFloat(progressBar?.style.width || '0');
    const complete = percentage >= 99.5 || Boolean(drawActions && !drawActions.hidden);
    progressTrack?.classList.toggle('is-complete', complete);
    drawTopbar.classList.toggle('is-complete', complete);
  }

  function refinePrediction() {
    document.querySelectorAll('#predictionSection .prediction-header').forEach((header) => {
      header.classList.add('prediction-header-refined');
      header.querySelector('.prediction-team-lock')?.remove();
      setText(header.querySelector('.prediction-back-button'), 'Kuraya Dön');
    });

    document.querySelectorAll('#predictionSection .prediction-fixture-card').forEach((card) => {
      const locked = card.classList.contains('is-locked');
      card.querySelectorAll('.prediction-outcome-team, .prediction-draw-choice').forEach((button) => {
        button.disabled = locked;
        button.setAttribute('aria-disabled', String(locked));
      });
      card.querySelectorAll('.prediction-score-editor input').forEach((input) => { input.disabled = locked; });
      const lockButton = card.querySelector('.prediction-score-apply');
      if (lockButton) {
        setText(lockButton, locked ? 'Kilitli' : 'Kilitle');
        lockButton.disabled = locked;
        lockButton.classList.toggle('is-match-locked', locked);
      }
    });
  }

  function refresh() {
    refineBrand();
    refineTeamActionModal();
    refineConfirmation();
    refineDrawActions();
    refineDrawHeader();
    refinePrediction();
  }

  let queued = false;
  function queueRefresh() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(() => {
      queued = false;
      refresh();
    });
  }

  refresh();
  new MutationObserver(queueRefresh).observe(body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['hidden', 'class', 'style']
  });
})();
