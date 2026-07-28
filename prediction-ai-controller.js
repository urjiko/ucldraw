(() => {
  'use strict';

  const base = window.UCLDRAW_PREDICTION_ENGINE;
  if (!base?.createState || window.UCLDRAW_PREDICTION_AI) return;

  let latestState = null;

  function createState(...args) {
    latestState = base.createState(...args);
    return latestState;
  }

  function resetState(state) {
    state.scores = {};
    state.matchLocks = {};
    state.teamLocks = {};
    state.activeMatchdays = {};
    state.rerollVersion = {};

    const lastMatchday = state.matches.reduce((maximum, match) => Math.max(maximum, Number(match.matchday) || 0), 0);
    for (let matchday = 1; matchday <= lastMatchday; matchday += 1) state.rerollVersion[matchday] = 0;
    return lastMatchday;
  }

  function predictAll(state = latestState) {
    if (!state?.matches?.length) throw new Error('Yapay zeka tahmini için aktif bir turnuva bulunamadı.');

    const lastMatchday = resetState(state);
    for (let matchday = 1; matchday <= lastMatchday; matchday += 1) base.simulateMatchday(state, matchday);

    window.dispatchEvent(new CustomEvent('ucldraw:ai-predictions-applied', {
      detail: { state, matchdays: lastMatchday }
    }));
    return state;
  }

  window.UCLDRAW_PREDICTION_ENGINE = Object.freeze({
    ...base,
    createState
  });

  window.UCLDRAW_PREDICTION_AI = Object.freeze({
    getState: () => latestState,
    predictAll
  });
})();
