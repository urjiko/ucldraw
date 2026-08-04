import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const routes = Object.freeze({
  ucl: Object.freeze({
    directory: 'champions-league',
    title: 'UEFA Champions League Kura Simülatörü',
    description: 'UEFA Champions League lig aşaması kurasını çekin, takımınızı seçin ve maç sonuçlarını tahmin edin.',
    themeColor: '#022ae2'
  }),
  uel: Object.freeze({
    directory: 'europa-league',
    title: 'UEFA Europa League Kura Simülatörü',
    description: 'UEFA Europa League lig aşaması kurasını çekin, takımınızı seçin ve maç sonuçlarını tahmin edin.',
    themeColor: '#ff6900'
  }),
  uecl: Object.freeze({
    directory: 'conference-league',
    title: 'UEFA Conference League Kura Simülatörü',
    description: 'UEFA Conference League lig aşaması kurasını çekin, takımınızı seçin ve maç sonuçlarını tahmin edin.',
    themeColor: '#00be14'
  })
});

function pageSource(leagueId, route) {
  const canonical = `https://urjiko.github.io/UEFA/${route.directory}/`;
  return `<!doctype html>
<html lang="tr" class="route-loading">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <base href="../">
  <meta name="theme-color" content="${route.themeColor}">
  <meta name="description" content="${route.description}">
  <title>${route.title}</title>
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${route.title}">
  <meta property="og:description" content="${route.description}">
  <meta property="og:url" content="${canonical}">
  <link rel="icon" type="image/png" href="crests/pools/uefa_logo.png">
  <link rel="apple-touch-icon" href="crests/pools/uefa_logo.png">
  <style>
    html.route-loading body { opacity: 0; }
    body { margin: 0; transition: opacity 120ms ease; }
    .route-error { max-width: 720px; margin: 15vh auto; padding: 24px; font-family: system-ui, sans-serif; }
  </style>
</head>
<body data-league="${leagueId}" data-initial-league="${leagueId}">
  <noscript>Bu simülatörün çalışması için JavaScript gereklidir.</noscript>
  <script src="league-route-shell.js" data-league="${leagueId}"></script>
</body>
</html>
`;
}

for (const [leagueId, route] of Object.entries(routes)) {
  const directory = path.join(root, route.directory);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'index.html'), pageSource(leagueId, route));
}

console.log('Generated three canonical league route pages.');
