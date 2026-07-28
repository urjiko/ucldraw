(() => {
  'use strict';

  const engine = window.UCLDRAW_ENGINE;
  if (!engine?.generateCompetitionDraw || engine.__predictionWrapped) return;

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
})();
