(() => {
  'use strict';

  const base = window.UCLDRAW_PREDICTION_ENGINE;
  if (!base?.applyOutcome || base.__explicitMatchLock) return;

  function applyOutcome(state, matchId, outcome) {
    const score = base.applyOutcome(state, matchId, outcome);
    delete state.matchLocks[matchId];
    return score;
  }

  function applyPoints(state, matchId, points) {
    const score = base.applyPoints(state, matchId, points);
    delete state.matchLocks[matchId];
    return score;
  }

  window.UCLDRAW_PREDICTION_ENGINE = Object.freeze({
    ...base,
    applyOutcome,
    applyPoints,
    __explicitMatchLock: true
  });
})();
