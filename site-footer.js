(() => {
  'use strict';

  const existingRuntime = document.querySelector('script[data-league-routes-runtime]');
  if (!existingRuntime) {
    const runtime = document.createElement('script');
    runtime.src = 'league-routes.js';
    runtime.dataset.leagueRoutesRuntime = 'true';
    document.body.appendChild(runtime);
  }

  if (document.querySelector('.site-disclaimer')) return;
  const app = document.getElementById('app');
  if (!app) return;

  const footer = document.createElement('footer');
  footer.className = 'site-disclaimer';
  footer.setAttribute('aria-label', 'Proje açıklaması');
  footer.innerHTML = `
    <p>
      <strong>Bağımsız ve resmi olmayan bir simülasyondur.</strong>
      UEFA, federasyonlar veya kulüplerle bağlantılı değildir; gösterilen kura ve tahminler resmi sonuç niteliği taşımaz.
      Sistemin nasıl çalıştığını merak ediyorsanız
      <a href="About/">ayrıntılı açıklamaya buradan ulaşabilirsiniz</a>.
    </p>
  `;

  app.insertAdjacentElement('afterend', footer);
})();
