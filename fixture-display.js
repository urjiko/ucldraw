(() => {
  'use strict';

  const fixtureList = document.getElementById('fixtureList');
  if (!fixtureList) return;

  function metadataSpan(className, text) {
    const span = document.createElement('span');
    span.className = className;
    span.textContent = text;
    return span;
  }

  function decorateFixtureSlot(slot) {
    if (slot.dataset.fixtureDisplayDecorated === 'true') return;
    const main = slot.querySelector('.fixture-main');
    const teamName = slot.querySelector('.fixture-team');
    const oldMeta = slot.querySelector('.fixture-meta');
    if (!main || !teamName || !oldMeta) return;

    const parts = oldMeta.textContent.split('·').map((part) => part.trim()).filter(Boolean);
    const pot = parts.find((part) => /^Pot\s+\d+/i.test(part)) || `Pot ${slot.dataset.pot || '?'}`;
    const country = parts.find((part) => /^[A-Z]{3}$/.test(part)) || '';

    if (/^Pot\s+\d+\s+rakibi\s+bekleniyor$/i.test(teamName.textContent.trim())) {
      teamName.textContent = 'Rakip bekleniyor';
    }

    const line = document.createElement('span');
    line.className = 'fixture-info-line';
    line.appendChild(metadataSpan('fixture-pot', pot));
    teamName.classList.add('fixture-team-primary');
    line.appendChild(teamName);
    if (country) line.appendChild(metadataSpan('fixture-country', country));

    main.replaceChildren(line);
    slot.dataset.fixtureDisplayDecorated = 'true';
  }

  function decorateFixtureList() {
    fixtureList.querySelectorAll('.fixture-slot').forEach(decorateFixtureSlot);
  }

  decorateFixtureList();
  new MutationObserver(decorateFixtureList).observe(fixtureList, { childList: true, subtree: true });
})();
