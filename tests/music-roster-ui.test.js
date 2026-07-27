const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const html = read('index.html');
const music = read('league-music.js');
const musicCss = read('league-music.css');
const rosterUi = read('roster-search-ui.js');
const rosterCss = read('roster-search.css');

for (const file of [
  'roster-manager.js',
  'roster-search-ui.js',
  'league-music.js',
  'roster-search.css',
  'league-music.css'
]) {
  assert.ok(html.includes(file), `${file} must be loaded by index.html`);
}

assert.ok(html.indexOf('roster-manager.js') < html.indexOf('app-v3.js'), 'roster manager must load before the app');
assert.ok(html.indexOf('app-v3.js') < html.indexOf('roster-search-ui.js'), 'search UI must load after the app');
assert.ok(html.indexOf('app-v3.js') < html.indexOf('league-music.js'), 'music observer must load after initial league rendering');

assert.match(music, /ucl:\s*'music\/ucl_anthem\.mp3'/);
assert.match(music, /uel:\s*'music\/uel_anthem\.mp3'/);
assert.match(music, /uecl:\s*'music\/con_anthem\.mp3'/);
assert.match(music, /audio\.loop\s*=\s*true/);
assert.match(music, /MutationObserver/);
assert.match(music, /localStorage/);
assert.match(musicCss, /\.league-music-toggle/);

assert.match(rosterUi, /Kadroda olmasa da takım ara/);
assert.match(rosterUi, /manager\.projectedPot/);
assert.match(rosterUi, /manager\.replacementCandidates/);
assert.match(rosterUi, /manager\.replaceTeam/);
assert.match(rosterUi, /aynı pottaki takımla değiştir/i);
assert.match(rosterCss, /\.roster-replacement-modal/);
assert.match(rosterCss, /\.roster-search-result\.is-reserve-roster/);

const musicDirectory = path.join(root, 'music');
if (fs.existsSync(musicDirectory)) {
  for (const file of ['ucl_anthem.mp3', 'uel_anthem.mp3', 'con_anthem.mp3']) {
    assert.ok(fs.existsSync(path.join(musicDirectory, file)), `music/${file} must exist with exact casing`);
  }
} else {
  console.warn('music/ directory is not present on this branch yet; runtime keeps the integration ready and shows an unavailable state.');
}

console.log('League music and reserve search UI checks passed.');
