(() => {
  'use strict';

  const section = document.getElementById('predictionSection');
  if (!section) return;

  function parseProgress(summary) {
    const source = [...summary.querySelectorAll('span')]
      .map((node) => node.textContent || '')
      .find((text) => /\d+\s*\/\s*\d+\s*maç/i.test(text));
    const match = source?.match(/(\d+)\s*\/\s*(\d+)\s*maç/i);
    if (!match) return { completed: 0, total: 0, percentage: 0 };
    const completed = Number(match[1]);
    const total = Number(match[2]);
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  }

  function enhanceHeader(header) {
    const summary = header.querySelector('.prediction-summary');
    if (!summary) return;
    header.classList.add('prediction-header-compact');

    const progress = parseProgress(summary);
    let block = summary.querySelector('.prediction-header-progress');
    if (!block) {
      block = document.createElement('div');
      block.className = 'prediction-header-progress';
      block.innerHTML = [
        '<span class="prediction-header-progress-label"></span>',
        '<strong class="prediction-header-progress-value"></strong>',
        '<span class="prediction-header-progress-track" aria-hidden="true"><span></span></span>'
      ].join('');
      summary.appendChild(block);
    }

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
  new MutationObserver(queueRefresh).observe(section, { childList: true, subtree: true });
})();