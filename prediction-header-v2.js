(() => {
  'use strict';

  const section = document.getElementById('predictionSection');
  const engine = window.UCLDRAW_PREDICTION_ENGINE;
  if (!section) return;

  function zoneText(zone) {
    if (zone === 'direct') return 'Son 16';
    if (zone === 'playoff') return 'Play-off';
    return 'Elendi';
  }

  function fallbackProgress(summary) {
    const source = [...summary.querySelectorAll(':scope > span')]
      .map((node) => node.textContent || '')
      .find((text) => /\d+\s*\/\s*\d+\s*maç/i.test(text));
    const match = source?.match(/(\d+)\s*\/\s*(\d+)\s*maç/i);
    if (!match) return { completed: 0, total: 0, percentage: 0 };
    const completed = Number(match[1]);
    const total = Number(match[2]);
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  }

  function headerSnapshot(header, summary) {
    const state = window.UCLDRAW_PREDICTION_AI?.getState?.();
    const activeName = header.querySelector('h2')?.textContent?.trim();
    if (!state || !activeName || !engine?.standings || !engine?.progress) {
      return { row: null, progress: fallbackProgress(summary) };
    }

    const row = engine.standings(state).find((candidate) => candidate.team.name === activeName) || null;
    const teamProgress = engine.progress(state, activeName);
    const percentage = teamProgress.total > 0
      ? Math.round((teamProgress.completed / teamProgress.total) * 100)
      : 0;
    return {
      row,
      progress: {
        completed: teamProgress.completed,
        total: teamProgress.total,
        percentage
      }
    };
  }

  function ensureProgress(summary) {
    let block = summary.querySelector(':scope > .prediction-header-progress');
    if (block) return block;

    block = document.createElement('div');
    block.className = 'prediction-header-progress';
    block.innerHTML = [
      '<span class="prediction-header-progress-label"></span>',
      '<strong class="prediction-header-progress-value"></strong>',
      '<span class="prediction-header-progress-track" aria-hidden="true"><span></span></span>'
    ].join('');
    summary.appendChild(block);
    return block;
  }

  function enhanceHeader(header) {
    const summary = header.querySelector('.prediction-summary');
    if (!summary) return;
    header.classList.add('prediction-header-compact');

    const { row, progress } = headerSnapshot(header, summary);
    const rank = summary.querySelector(':scope > strong');
    const stats = summary.querySelector(':scope > span:not(.prediction-summary-status)');
    const status = summary.querySelector(':scope > .prediction-summary-status');

    if (row) {
      if (rank) rank.textContent = `${row.rank}. sıra`;
      if (stats) {
        const average = `${row.goalDifference >= 0 ? '+' : ''}${row.goalDifference}`;
        stats.textContent = `${progress.completed}/${progress.total} maç · ${average} AV`;
      }
      if (status) status.textContent = zoneText(row.zone);
      summary.dataset.zone = row.zone;
    }

    const block = ensureProgress(summary);
    block.querySelector('.prediction-header-progress-label').textContent = `${progress.completed}/${progress.total} maç`;
    block.querySelector('.prediction-header-progress-value').textContent = `${progress.percentage}%`;
    block.querySelector('.prediction-header-progress-track > span').style.width = `${progress.percentage}%`;
    block.setAttribute('aria-label', `Tahmin ilerlemesi yüzde ${progress.percentage}`);
  }

  function refresh() {
    section.querySelectorAll('.prediction-header').forEach(enhanceHeader);
  }

  let queued = false;
  const queueRefresh = () => {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(() => {
      queued = false;
      refresh();
    });
  };

  refresh();
  new MutationObserver(queueRefresh).observe(section, {
    childList: true,
    subtree: true,
    characterData: true
  });
  window.addEventListener('ucldraw:ai-predictions-applied', queueRefresh);
})();
