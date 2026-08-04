import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = path.join(root, 'index.html');
const aboutPath = path.join(root, 'About', 'index.html');
const appPath = path.join(root, 'app-v3.js');
const workflowPath = path.join(root, '.github', 'workflows', 'static-checks.yml');
const generatorPath = path.join(root, 'scripts', 'generate-league-routes.mjs');
const testPath = path.join(root, 'tests', 'league-routes.test.js');
const sitemapPath = path.join(root, 'sitemap.xml');
const robotsPath = path.join(root, 'robots.txt');

function replaceOnce(source, pattern, replacement, label) {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`Could not update ${label}.`);
  return next;
}

let index = fs.readFileSync(indexPath, 'utf8');
index = replaceOnce(
  index,
  '  <meta name="viewport" content="width=device-width, initial-scale=1">\n',
  '  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <base href="./">\n',
  'root base URL'
);
index = replaceOnce(
  index,
  '  <meta name="description" content="UEFA Champions League, Europa League ve Conference League için interaktif lig aşaması kura simülatörü.">\n  <title>UEFA Draw Simulator</title>\n',
  '  <meta name="description" id="pageDescription" content="UEFA Champions League lig aşaması kurasını çekin, takımınızı seçin ve maç sonuçlarını tahmin edin.">\n'
    + '  <title>UEFA Champions League Kura Simülatörü</title>\n'
    + '  <link rel="canonical" id="canonicalLink" href="https://urjiko.github.io/UEFA/champions-league/">\n'
    + '  <meta property="og:type" content="website">\n'
    + '  <meta property="og:title" id="openGraphTitle" content="UEFA Champions League Kura Simülatörü">\n'
    + '  <meta property="og:description" id="openGraphDescription" content="UEFA Champions League lig aşaması kurasını çekin, takımınızı seçin ve maç sonuçlarını tahmin edin.">\n'
    + '  <meta property="og:url" id="openGraphUrl" content="https://urjiko.github.io/UEFA/champions-league/">\n',
  'root route metadata'
);
index = replaceOnce(
  index,
  '<body data-league="ucl">',
  '<body data-league="ucl" data-initial-league="ucl">',
  'root initial league'
);
fs.writeFileSync(indexPath, index);

let about = fs.readFileSync(aboutPath, 'utf8');
about = replaceOnce(
  about,
  '  <title>Sistem Nasıl Çalışıyor? | UEFA Draw Simulator</title>\n',
  '  <title>Sistem Nasıl Çalışıyor? | UEFA Draw Simulator</title>\n'
    + '  <link rel="canonical" href="https://urjiko.github.io/UEFA/About/">\n'
    + '  <meta property="og:type" content="article">\n'
    + '  <meta property="og:title" content="Sistem Nasıl Çalışıyor? | UEFA Draw Simulator">\n'
    + '  <meta property="og:description" content="Kura motoru, torbalar, iç saha modeli ve skor tahmin sisteminin ayrıntılı açıklaması.">\n'
    + '  <meta property="og:url" content="https://urjiko.github.io/UEFA/About/">\n',
  'About canonical metadata'
);
fs.writeFileSync(aboutPath, about);

let app = fs.readFileSync(appPath, 'utf8');
app = replaceOnce(
  app,
  "  const competitionOrder = ['ucl', 'uel', 'uecl'];\n",
  "  const competitionOrder = ['ucl', 'uel', 'uecl'];\n"
    + "  const publicBaseUrl = new URL('https://urjiko.github.io/UEFA/');\n"
    + "  const appBaseUrl = new URL('.', document.baseURI);\n"
    + "  const leagueRoutes = Object.freeze({\n"
    + "    ucl: Object.freeze({\n"
    + "      path: 'champions-league/',\n"
    + "      title: 'UEFA Champions League Kura Simülatörü',\n"
    + "      description: 'UEFA Champions League lig aşaması kurasını çekin, takımınızı seçin ve maç sonuçlarını tahmin edin.'\n"
    + "    }),\n"
    + "    uel: Object.freeze({\n"
    + "      path: 'europa-league/',\n"
    + "      title: 'UEFA Europa League Kura Simülatörü',\n"
    + "      description: 'UEFA Europa League lig aşaması kurasını çekin, takımınızı seçin ve maç sonuçlarını tahmin edin.'\n"
    + "    }),\n"
    + "    uecl: Object.freeze({\n"
    + "      path: 'conference-league/',\n"
    + "      title: 'UEFA Conference League Kura Simülatörü',\n"
    + "      description: 'UEFA Conference League lig aşaması kurasını çekin, takımınızı seçin ve maç sonuçlarını tahmin edin.'\n"
    + "    })\n"
    + "  });\n"
    + "  function routeUrl(leagueId, base = appBaseUrl) { return new URL(leagueRoutes[leagueId].path, base); }\n"
    + "  function leagueIdFromPath(pathname = window.location.pathname) {\n"
    + "    const normalized = pathname.endsWith('/') ? pathname : `${pathname}/`;\n"
    + "    return competitionOrder.find((leagueId) => normalized === routeUrl(leagueId).pathname)\n"
    + "      || document.body.dataset.initialLeague\n"
    + "      || 'ucl';\n"
    + "  }\n"
    + "  function initialLeagueId() {\n"
    + "    const leagueId = leagueIdFromPath();\n"
    + "    return DATA.competitions[leagueId] ? leagueId : 'ucl';\n"
    + "  }\n",
  'league route configuration'
);
app = replaceOnce(
  app,
  "    leagueId: 'ucl', selectedTeam: null, pendingTeam: null,\n",
  "    leagueId: initialLeagueId(), selectedTeam: null, pendingTeam: null,\n",
  'initial route state'
);
app = replaceOnce(
  app,
  "  function setLeague(leagueId) {\n    if (!DATA.competitions[leagueId]) return;\n    state.leagueId = leagueId; applyTheme(); renderBrand(); renderCompetitionPicker(); showSelectionScreen();\n  }\n",
  "  function updatePageMetadata(leagueId) {\n"
    + "    const route = leagueRoutes[leagueId];\n"
    + "    const canonical = routeUrl(leagueId, publicBaseUrl).href;\n"
    + "    document.title = route.title;\n"
    + "    document.querySelector('meta[name=\"description\"]')?.setAttribute('content', route.description);\n"
    + "    document.getElementById('canonicalLink')?.setAttribute('href', canonical);\n"
    + "    document.getElementById('openGraphTitle')?.setAttribute('content', route.title);\n"
    + "    document.getElementById('openGraphDescription')?.setAttribute('content', route.description);\n"
    + "    document.getElementById('openGraphUrl')?.setAttribute('content', canonical);\n"
    + "  }\n"
    + "  function syncLeagueRoute(leagueId, historyMode) {\n"
    + "    const target = routeUrl(leagueId);\n"
    + "    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;\n"
    + "    const next = `${target.pathname}${target.search}${target.hash}`;\n"
    + "    if (historyMode === 'replace') window.history.replaceState({ leagueId }, '', next);\n"
    + "    else if (historyMode === 'push' && current !== next) window.history.pushState({ leagueId }, '', next);\n"
    + "  }\n"
    + "  function setLeague(leagueId, { historyMode = 'push' } = {}) {\n"
    + "    if (!DATA.competitions[leagueId]) return;\n"
    + "    state.leagueId = leagueId;\n"
    + "    updatePageMetadata(leagueId);\n"
    + "    syncLeagueRoute(leagueId, historyMode);\n"
    + "    applyTheme(); renderBrand(); renderCompetitionPicker(); showSelectionScreen();\n"
    + "  }\n",
  'route-aware league selection'
);
app = replaceOnce(
  app,
  "  setLeague('ucl');\n",
  "  window.addEventListener('popstate', () => {\n"
    + "    const leagueId = leagueIdFromPath();\n"
    + "    if (leagueId !== state.leagueId) setLeague(leagueId, { historyMode: 'none' });\n"
    + "    else updatePageMetadata(leagueId);\n"
    + "  });\n\n"
    + "  setLeague(initialLeagueId(), { historyMode: 'replace' });\n",
  'initial route boot'
);
fs.writeFileSync(appPath, app);

const generator = `import fs from 'node:fs';\nimport path from 'node:path';\nimport { fileURLToPath } from 'node:url';\n\nconst root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');\nconst templatePath = path.join(root, 'index.html');\nconst template = fs.readFileSync(templatePath, 'utf8');\n\nconst routes = Object.freeze({\n  ucl: Object.freeze({\n    directory: 'champions-league',\n    title: 'UEFA Champions League Kura Simülatörü',\n    description: 'UEFA Champions League lig aşaması kurasını çekin, takımınızı seçin ve maç sonuçlarını tahmin edin.',\n    themeColor: '#022ae2'\n  }),\n  uel: Object.freeze({\n    directory: 'europa-league',\n    title: 'UEFA Europa League Kura Simülatörü',\n    description: 'UEFA Europa League lig aşaması kurasını çekin, takımınızı seçin ve maç sonuçlarını tahmin edin.',\n    themeColor: '#ff6900'\n  }),\n  uecl: Object.freeze({\n    directory: 'conference-league',\n    title: 'UEFA Conference League Kura Simülatörü',\n    description: 'UEFA Conference League lig aşaması kurasını çekin, takımınızı seçin ve maç sonuçlarını tahmin edin.',\n    themeColor: '#00be14'\n  })\n});\n\nfunction replaceRequired(source, pattern, replacement, label) {\n  const next = source.replace(pattern, replacement);\n  if (next === source) throw new Error(\`Could not generate \${label}.\`);\n  return next;\n}\n\nfor (const [leagueId, route] of Object.entries(routes)) {\n  const canonical = \`https://urjiko.github.io/UEFA/\${route.directory}/\`;\n  let page = template;\n  page = replaceRequired(page, '<base href="./">', '<base href="../">', \`\${leagueId} base URL\`);\n  page = replaceRequired(page, /<meta name="theme-color" content="[^"]+">/, \`<meta name="theme-color" content="\${route.themeColor}">\`, \`\${leagueId} theme color\`);\n  page = replaceRequired(page, /<meta name="description" id="pageDescription" content="[^"]+">/, \`<meta name="description" id="pageDescription" content="\${route.description}">\`, \`\${leagueId} description\`);\n  page = replaceRequired(page, /<title>[^<]+<\\/title>/, \`<title>\${route.title}</title>\`, \`\${leagueId} title\`);\n  page = replaceRequired(page, /<link rel="canonical" id="canonicalLink" href="[^"]+">/, \`<link rel="canonical" id="canonicalLink" href="\${canonical}">\`, \`\${leagueId} canonical\`);\n  page = replaceRequired(page, /<meta property="og:title" id="openGraphTitle" content="[^"]+">/, \`<meta property="og:title" id="openGraphTitle" content="\${route.title}">\`, \`\${leagueId} Open Graph title\`);\n  page = replaceRequired(page, /<meta property="og:description" id="openGraphDescription" content="[^"]+">/, \`<meta property="og:description" id="openGraphDescription" content="\${route.description}">\`, \`\${leagueId} Open Graph description\`);\n  page = replaceRequired(page, /<meta property="og:url" id="openGraphUrl" content="[^"]+">/, \`<meta property="og:url" id="openGraphUrl" content="\${canonical}">\`, \`\${leagueId} Open Graph URL\`);\n  page = replaceRequired(page, /<body data-league="[^"]+" data-initial-league="[^"]+">/, \`<body data-league="\${leagueId}" data-initial-league="\${leagueId}">\`, \`\${leagueId} body state\`);\n  const directory = path.join(root, route.directory);\n  fs.mkdirSync(directory, { recursive: true });\n  fs.writeFileSync(path.join(directory, 'index.html'), page);\n}\n\nconsole.log('Generated three canonical league entry pages.');\n`;
fs.writeFileSync(generatorPath, generator);

const routeTest = `'use strict';\n\nconst fs = require('node:fs');\nconst path = require('node:path');\nconst assert = require('node:assert/strict');\n\nconst root = path.resolve(__dirname, '..');\nconst read = (file) => fs.readFileSync(path.join(root, file), 'utf8');\nconst app = read('app-v3.js');\nconst rootIndex = read('index.html');\n\nconst routes = {\n  ucl: { directory: 'champions-league', title: 'UEFA Champions League Kura Simülatörü' },\n  uel: { directory: 'europa-league', title: 'UEFA Europa League Kura Simülatörü' },\n  uecl: { directory: 'conference-league', title: 'UEFA Conference League Kura Simülatörü' }\n};\n\nassert.match(rootIndex, /<base href="\.\\/">/);\nassert.match(rootIndex, /data-initial-league="ucl"/);\nassert.match(rootIndex, /https:\\/\\/urjiko\.github\.io\\/UEFA\\/champions-league\\//);\n\nfor (const [leagueId, route] of Object.entries(routes)) {\n  const page = read(\`\${route.directory}/index.html\`);\n  assert.match(page, /<base href="\.\.\\/">/);\n  assert.ok(page.includes(\`<title>\${route.title}</title>\`));\n  assert.ok(page.includes(\`data-league="\${leagueId}" data-initial-league="\${leagueId}"\`));\n  assert.ok(page.includes(\`https://urjiko.github.io/UEFA/\${route.directory}/\`));\n}\n\nassert.match(app, /champions-league\\//);\nassert.match(app, /europa-league\\//);\nassert.match(app, /conference-league\\//);\nassert.match(app, /window\\.history\\.pushState/);\nassert.match(app, /window\\.history\\.replaceState/);\nassert.match(app, /window\\.addEventListener\\('popstate'/);\nassert.match(app, /updatePageMetadata/);\nassert.match(read('sitemap.xml'), /<loc>https:\\/\\/urjiko\.github\.io\\/UEFA\\/europa-league\\/<\\/loc>/);\nassert.match(read('robots.txt'), /Sitemap: https:\\/\\/urjiko\.github\.io\\/UEFA\\/sitemap\.xml/);\n\nconsole.log('Canonical league route checks passed.');\n`;
fs.writeFileSync(testPath, routeTest);

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://urjiko.github.io/UEFA/champions-league/</loc></url>\n  <url><loc>https://urjiko.github.io/UEFA/europa-league/</loc></url>\n  <url><loc>https://urjiko.github.io/UEFA/conference-league/</loc></url>\n  <url><loc>https://urjiko.github.io/UEFA/About/</loc></url>\n</urlset>\n`;
fs.writeFileSync(sitemapPath, sitemap);
fs.writeFileSync(robotsPath, 'User-agent: *\nAllow: /\n\nSitemap: https://urjiko.github.io/UEFA/sitemap.xml\n');

let workflow = fs.readFileSync(workflowPath, 'utf8');
workflow = replaceOnce(
  workflow,
  '          node --check scripts/build-home-advantage-profiles.mjs\n',
  '          node --check scripts/build-home-advantage-profiles.mjs\n          node --check scripts/generate-league-routes.mjs\n',
  'route generator syntax check'
);
workflow = replaceOnce(
  workflow,
  '          node tests/prediction-export-v9.test.js\n',
  '          node tests/prediction-export-v9.test.js\n          node scripts/generate-league-routes.mjs\n          git diff --exit-code -- champions-league/index.html europa-league/index.html conference-league/index.html\n          node tests/league-routes.test.js\n',
  'league route checks'
);
fs.writeFileSync(workflowPath, workflow);

execFileSync(process.execPath, [generatorPath], { cwd: root, stdio: 'inherit' });
execFileSync(process.execPath, ['--check', appPath], { cwd: root, stdio: 'inherit' });
execFileSync(process.execPath, [testPath], { cwd: root, stdio: 'inherit' });
console.log('Prepared canonical league routes, metadata, sitemap, and browser history support.');
