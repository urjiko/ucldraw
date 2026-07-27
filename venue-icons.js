(() => {
  'use strict';

  const fixtureList = document.getElementById('fixtureList');
  const allFixturesGrid = document.getElementById('allFixturesGrid');

  const ICONS = Object.freeze({
    home: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4.5 10.6 12 4.5l7.5 6.1v8.1a.8.8 0 0 1-.8.8h-4.5v-5.1H9.8v5.1H5.3a.8.8 0 0 1-.8-.8v-8.1Z"/>
      </svg>`,
    away: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="m3.8 13.1 7.1-2.3 3.8-6.4c.5-.8 1.5-1.1 2.3-.7.8.4 1.2 1.4.9 2.2l-2.5 6.6 4.5 2.2c.6.3.8 1 .5 1.6-.2.4-.6.7-1.1.7l-5.3-.3-3.5 3.4-1.8-.2 1.7-4.2-4.2-.9-1.6 1.7-1.4-.2.6-3.2Z"/>
      </svg>`
  });

  function createIcon(home, compact = false) {
    const label = home ? 'İç saha' : 'Deplasman';
    const icon = document.createElement('span');
    icon.className = `venue-icon ${home ? 'home' : 'away'}${compact ? ' compact' : ''}`;
    icon.setAttribute('role', 'img');
    icon.setAttribute('aria-label', label);
    icon.title = label;
    icon.innerHTML = home ? ICONS.home : ICONS.away;
    return icon;
  }

  function decorateVenueBadge(badge) {
    if (badge.dataset.venueIconDecorated === 'true') return;
    const home = badge.classList.contains('home');
    badge.replaceChildren(createIcon(home));
    badge.dataset.venueIconDecorated = 'true';
    badge.setAttribute('aria-label', home ? 'İç saha' : 'Deplasman');
    badge.title = home ? 'İç saha' : 'Deplasman';
  }

  function decorateOverviewMeta(meta) {
    if (meta.dataset.venueIconDecorated === 'true') return;
    const original = meta.textContent.replace(/\s+/g, ' ').trim();
    const match = original.match(/^(.*?)(?:\s*·\s*)(H|A)$/i);
    if (!match) return;

    const home = match[2].toUpperCase() === 'H';
    const prefix = match[1].trim();
    meta.replaceChildren(
      document.createTextNode(prefix ? `${prefix} · ` : ''),
      createIcon(home, true)
    );
    meta.dataset.venueIconDecorated = 'true';
    meta.setAttribute('aria-label', `${prefix ? `${prefix}, ` : ''}${home ? 'İç saha' : 'Deplasman'}`);
  }

  function decorate(root = document) {
    root.querySelectorAll?.('.venue-badge').forEach(decorateVenueBadge);
    root.querySelectorAll?.('.overview-meta').forEach(decorateOverviewMeta);
  }

  decorate();

  [fixtureList, allFixturesGrid].filter(Boolean).forEach((root) => {
    new MutationObserver(() => decorate(root)).observe(root, {
      childList: true,
      subtree: true,
      characterData: true
    });
  });
})();
