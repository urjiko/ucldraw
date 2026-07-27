(() => {
  'use strict';

  const tracks = Object.freeze({
    ucl: 'music/ucl_anthem.mp3',
    uel: 'music/uel_anthem.mp3',
    uecl: 'music/con_anthem.mp3'
  });

  const brandRow = document.querySelector('.brand-row');
  if (!brandRow || typeof Audio === 'undefined') return;

  const audio = new Audio();
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = 0.34;

  let activeLeague = null;
  let userActivated = false;
  let muted = window.localStorage.getItem('ucldraw-music-muted') === 'true';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'league-music-toggle';
  const icon = document.createElement('span');
  icon.className = 'league-music-icon';
  icon.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span');
  label.className = 'league-music-label';
  label.textContent = 'Müzik';
  button.append(icon, label);
  brandRow.appendChild(button);

  function iconMarkup() {
    if (muted) {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="m17 9 4 6m0-6-4 6" class="music-icon-stroke"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" class="music-icon-stroke"/></svg>';
  }

  function updateButton() {
    icon.innerHTML = iconMarkup();
    button.classList.toggle('is-muted', muted);
    button.setAttribute('aria-pressed', String(!muted));
    button.setAttribute('aria-label', muted ? 'Lig müziğini aç' : 'Lig müziğini kapat');
    button.title = muted ? 'Lig müziğini aç' : 'Lig müziğini kapat';
  }

  async function playCurrent() {
    if (muted || !userActivated || !audio.src) return;
    try {
      await audio.play();
      button.classList.remove('is-blocked', 'is-unavailable');
    } catch {
      button.classList.add('is-blocked');
    }
  }

  function setLeagueTrack(leagueId) {
    const path = tracks[leagueId];
    if (!path || activeLeague === leagueId) return;
    activeLeague = leagueId;
    button.classList.remove('is-unavailable');
    audio.pause();
    audio.src = new URL(path, document.baseURI).href;
    audio.currentTime = 0;
    audio.load();
    playCurrent();
  }

  function activateAudio() {
    userActivated = true;
    playCurrent();
  }

  button.addEventListener('click', (event) => {
    event.stopPropagation();
    userActivated = true;
    muted = !muted;
    window.localStorage.setItem('ucldraw-music-muted', String(muted));
    if (muted) audio.pause();
    else playCurrent();
    updateButton();
  });

  audio.addEventListener('error', () => {
    button.classList.add('is-unavailable');
    button.title = 'Bu lig için müzik dosyası bulunamadı';
    audio.pause();
  });

  document.addEventListener('pointerdown', activateAudio, { once: true, capture: true });
  document.addEventListener('keydown', activateAudio, { once: true, capture: true });

  new MutationObserver(() => {
    setLeagueTrack(document.body.dataset.league || 'ucl');
  }).observe(document.body, { attributes: true, attributeFilter: ['data-league'] });

  updateButton();
  setLeagueTrack(document.body.dataset.league || 'ucl');

  window.UCLDRAW_LEAGUE_MUSIC = Object.freeze({
    audio,
    tracks,
    setLeagueTrack
  });
})();
