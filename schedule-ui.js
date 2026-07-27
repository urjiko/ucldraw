(() => {
  'use strict';

  const controlPanel = document.getElementById('drawControlPanel');
  const selectedClubCard = document.getElementById('selectedClubCard');
  const fixtureList = document.getElementById('fixtureList');
  const allFixturesGrid = document.getElementById('allFixturesGrid');
  const overviewHeading = document.querySelector('#allFixturesSection h2');
  const overviewDescription = document.querySelector('#allFixturesSection p');

  function renameControlledMode() {
    document.querySelectorAll('[data-control-mode="manual"]').forEach((button) => {
      button.textContent = 'Durdurmalı Kura';
    });
    document.querySelectorAll('[data-initial-mode="manual"] strong').forEach((label) => {
      label.textContent = 'Durdurmalı Kura';
    });
    document.querySelectorAll('[data-initial-mode="manual"] span').forEach((description) => {
      description.textContent = 'Takımları akıtır; istediğin anda durdurup seçimi tamamlarsın.';
    });
  }

  function relocateControlPanel() {
    if (!controlPanel || !selectedClubCard) return;
    selectedClubCard.insertAdjacentElement('afterend', controlPanel);
    controlPanel.classList.add('draw-control-panel-inline');
  }

  function decorateFixtureSlots() {
    if (!fixtureList) return;
    fixtureList.querySelectorAll('.fixture-slot').forEach((slot, index) => {
      if (slot.dataset.matchdayDecorated === 'true') return;
      slot.dataset.matchdayDecorated = 'true';
      slot.dataset.matchday = String(index + 1);

      const number = slot.querySelector('.fixture-index');
      if (number) number.textContent = `H${index + 1}`;

      const meta = slot.querySelector('.fixture-meta');
      if (meta) meta.textContent = `Hafta ${index + 1} · ${meta.textContent}`;
    });
  }

  function decorateOverviewRows() {
    if (!allFixturesGrid) return;
    allFixturesGrid.querySelectorAll('.overview-team-card').forEach((card) => {
      card.querySelectorAll('.overview-fixture').forEach((row, index) => {
        if (row.dataset.matchdayDecorated === 'true') return;
        row.dataset.matchdayDecorated = 'true';
        row.dataset.matchday = String(index + 1);
        const meta = row.querySelector('.overview-meta');
        if (meta) meta.textContent = `H${index + 1} · ${meta.textContent}`;
      });
    });
  }

  relocateControlPanel();
  renameControlledMode();
  decorateFixtureSlots();
  decorateOverviewRows();

  if (overviewHeading) overviewHeading.textContent = 'Tüm takımların maç haftaları';
  if (overviewDescription) {
    overviewDescription.textContent = 'Her satır gerçek bir maç haftasıdır. Aynı takım aynı hafta yalnızca bir maçta yer alır.';
  }

  if (fixtureList) {
    new MutationObserver(decorateFixtureSlots).observe(fixtureList, { childList: true, subtree: true });
  }
  if (allFixturesGrid) {
    new MutationObserver(decorateOverviewRows).observe(allFixturesGrid, { childList: true, subtree: true });
  }
})();
