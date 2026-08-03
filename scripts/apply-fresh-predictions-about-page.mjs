import fs from 'node:fs';

function replaceOrVerify(text, oldText, newText, label) {
  if (text.includes(newText)) return text;
  if (!text.includes(oldText)) throw new Error(`Missing ${label} anchor.`);
  return text.replace(oldText, newText);
}

const controllerPath = 'prediction-ai-controller.js';
let controller = fs.readFileSync(controllerPath, 'utf8');
controller = replaceOrVerify(
  controller,
  `    const version = Number(state.rerollVersion[matchday] || 0);\n    state.activeMatchdays[matchday] = true;\n\n    for (const match of state.matches.filter((candidate) => candidate.matchday === matchday)) {\n      if (match.id === protectedMatchId || isProtectedResult(state, match)) continue;\n      state.scores[match.id] = simulateAdjustedScore(match, state.comp, state.seed, version);\n    }`,
  `    const version = Number(state.rerollVersion[matchday] || 0);\n    const predictionRun = Number(state.aiPredictionVersion || 0);\n    const predictionSeed = \`${'${state.seed}'}:ai-run-${'${predictionRun}'}\`;\n    state.activeMatchdays[matchday] = true;\n\n    for (const match of state.matches.filter((candidate) => candidate.matchday === matchday)) {\n      if (match.id === protectedMatchId || isProtectedResult(state, match)) continue;\n      const score = simulateAdjustedScore(match, state.comp, predictionSeed, version);\n      score.model.predictionRun = predictionRun;\n      state.scores[match.id] = score;\n    }`,
  'prediction-run seed'
);
controller = replaceOrVerify(
  controller,
  `  function createState(...args) {\n    latestState = base.createState(...args);\n    return latestState;\n  }`,
  `  function createState(...args) {\n    latestState = base.createState(...args);\n    latestState.aiPredictionVersion = Number(latestState.aiPredictionVersion || 0);\n    return latestState;\n  }`,
  'prediction version initialization'
);
controller = replaceOrVerify(
  controller,
  `  function predictAll(state = latestState) {\n    if (!state?.matches?.length) throw new Error('Yapay zeka tahmini için aktif bir turnuva bulunamadı.');\n\n    const lastMatchday = resetState(state);`,
  `  function predictAll(state = latestState) {\n    if (!state?.matches?.length) throw new Error('Yapay zeka tahmini için aktif bir turnuva bulunamadı.');\n\n    state.aiPredictionVersion = Number(state.aiPredictionVersion || 0) + 1;\n    const predictionRun = state.aiPredictionVersion;\n    const lastMatchday = resetState(state);`,
  'full prediction reroll version'
);
controller = replaceOrVerify(
  controller,
  `        matchdays: lastMatchday,\n        homeAdvantageProfileVersion: profileData().version || 0`,
  `        matchdays: lastMatchday,\n        predictionRun,\n        homeAdvantageProfileVersion: profileData().version || 0`,
  'prediction event run detail'
);
fs.writeFileSync(controllerPath, controller);

const indexPath = 'index.html';
let index = fs.readFileSync(indexPath, 'utf8');
index = replaceOrVerify(
  index,
  `  <link rel="stylesheet" href="prediction-header-v2.css">\n`,
  `  <link rel="stylesheet" href="prediction-header-v2.css">\n  <link rel="stylesheet" href="site-footer.css">\n`,
  'footer stylesheet'
);
index = replaceOrVerify(
  index,
  `  <script src="prediction-share-v7.js" data-prediction-share-v7="true"></script>\n</body>`,
  `  <script src="prediction-share-v7.js" data-prediction-share-v7="true"></script>\n  <script src="site-footer.js"></script>\n</body>`,
  'footer script'
);
fs.writeFileSync(indexPath, index);

const testPath = 'tests/prediction-share-v2.test.js';
let test = fs.readFileSync(testPath, 'utf8');
test = replaceOrVerify(
  test,
  `const css = read('prediction-share-v2.css');\n`,
  `const css = read('prediction-share-v2.css');\nconst footerScript = read('site-footer.js');\nconst footerCss = read('site-footer.css');\nconst aboutHtml = read('About/index.html');\nconst aboutCss = read('about.css');\n`,
  'footer and About test fixtures'
);
test = replaceOrVerify(
  test,
  `assert.ok(html.includes('prediction-share-v2.js'));\n`,
  `assert.ok(html.includes('prediction-share-v2.js'));\nassert.ok(html.includes('site-footer.css'));\nassert.ok(html.includes('site-footer.js'));\nassert.ok(html.indexOf('prediction-share-v7.js') < html.indexOf('site-footer.js'));\n`,
  'footer asset assertions'
);
test = replaceOrVerify(
  test,
  'assert.match(controller, /function simulateMatchday\\(state, matchday/);\nassert.match(controller, /simulateAdjustedScore\\(match, state\\.comp, state\\.seed, version\\)/);',
  'assert.match(controller, /function simulateMatchday\\(state, matchday/);\nassert.match(controller, /state\\.aiPredictionVersion = Number\\(state\\.aiPredictionVersion \\|\\| 0\\) \\+ 1/);\nassert.match(controller, /ai-run-/);\nassert.match(controller, /simulateAdjustedScore\\(match, state\\.comp, predictionSeed, version\\)/);\nassert.match(controller, /score\\.model\\.predictionRun = predictionRun/);',
  'fresh prediction controller assertions'
);
test = replaceOrVerify(
  test,
  `assert.match(css, /grid-template-columns: repeat\\(2, minmax\\(0, 1fr\\)\\)/);\n`,
  `assert.match(css, /grid-template-columns: repeat\\(2, minmax\\(0, 1fr\\)\\)/);\nassert.match(footerScript, /Bağımsız ve resmi olmayan bir simülasyondur/);\nassert.match(footerScript, /href="About\\/"/);\nassert.match(footerCss, /font-size: 0\\.67rem/);\nassert.match(aboutHtml, /Sistem nasıl çalışıyor\\?/);\nassert.match(aboutHtml, /Resmî olmayan bağımsız proje/);\nassert.match(aboutHtml, /Torba sistemi nasıl belirleniyor\\?/);\nassert.match(aboutHtml, /Kura neye göre yapılıyor\\?/);\nassert.match(aboutHtml, /“Yapay Zeka Tahmini” neye göre çalışıyor\\?/);\nassert.match(aboutHtml, /Poisson dağılımından/);\nassert.match(aboutHtml, /aiPredictionVersion|tahmin turu numarası/);\nassert.match(aboutCss, /about-section/);\n`,
  'About page assertions'
);
test = replaceOrVerify(
  test,
  `assert.equal(wrappedState.rerollVersion[1], 1);\nassert.equal(wrappedState.rerollVersion[2], 1);\n\nconsole.log('League share card and AI prediction checks passed.');`,
  `assert.equal(wrappedState.rerollVersion[1], 1);\nassert.equal(wrappedState.rerollVersion[2], 1);\nassert.equal(wrappedState.aiPredictionVersion, 1);\nassert.equal(wrappedState.scores.m1.model.predictionRun, 1);\nassert.equal(wrappedState.scores.m2.model.predictionRun, 1);\nconst firstPrediction = JSON.stringify(wrappedState.scores);\n\ncontext.window.UCLDRAW_PREDICTION_AI.predictAll(wrappedState);\nassert.equal(wrappedState.aiPredictionVersion, 2);\nassert.equal(wrappedState.rerollVersion[1], 1);\nassert.equal(wrappedState.rerollVersion[2], 1);\nassert.equal(wrappedState.scores.m1.model.predictionRun, 2);\nassert.equal(wrappedState.scores.m2.model.predictionRun, 2);\nassert.notEqual(JSON.stringify(wrappedState.scores), firstPrediction);\n\nconsole.log('League share card, fresh AI prediction, footer and About page checks passed.');`,
  'fresh prediction runtime assertions'
);
fs.writeFileSync(testPath, test);

const workflowPath = '.github/workflows/static-checks.yml';
let workflow = fs.readFileSync(workflowPath, 'utf8');
workflow = replaceOrVerify(
  workflow,
  `          node --check prediction-share-v9.js\n          node --check ui-refinement-v4.js`,
  `          node --check prediction-share-v9.js\n          node --check site-footer.js\n          node --check ui-refinement-v4.js`,
  'footer syntax check'
);
fs.writeFileSync(workflowPath, workflow);
