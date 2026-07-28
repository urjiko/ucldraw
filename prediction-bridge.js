(() => {
  'use strict';

  function installPredictionBridge() {
    const engine = window.UCLDRAW_ENGINE;
    if (!engine?.generateCompetitionDraw || engine.__predictionWrapped) return false;

    const originalGenerate = engine.generateCompetitionDraw.bind(engine);
    engine.generateCompetitionDraw = function generateCompetitionDrawWithPredictionBridge(competition, options) {
      const table = originalGenerate(competition, options);
      window.UCLDRAW_LAST_DRAW = {
        competition,
        table,
        leagueId: competition.id,
        generatedAt: Date.now()
      };
      window.dispatchEvent(new CustomEvent('ucldraw:draw-generated', {
        detail: window.UCLDRAW_LAST_DRAW
      }));
      return table;
    };
    engine.__predictionWrapped = true;
    return true;
  }

  window.UCLDRAW_INSTALL_PREDICTION_BRIDGE = installPredictionBridge;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installPredictionBridge, { once: true });
  } else {
    installPredictionBridge();
  }
})();