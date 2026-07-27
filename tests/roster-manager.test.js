const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');

function load(file, context) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  vm.runInContext(source, context, { filename: file });
}

const dispatched = [];
class TestCustomEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.detail = options.detail;
  }
}

const context = vm.createContext({
  console: { warn() {}, log() {}, error() {} },
  Math,
  Object,
  Array,
  Map,
  Set,
  String,
  Number,
  Boolean,
  RegExp,
  JSON,
  CustomEvent: TestCustomEvent
});
context.window = context;
context.window.dispatchEvent = (event) => dispatched.push(event);

load('teams.js', context);
load('generated-team-pools.js', context);
load('generated-club-coefficients.js', context);
load('team-pool-loader.js', context);
load('coefficient-pots.js', context);
load('roster-manager.js', context);

const data = context.window.UCLDRAW_DATA;
const manager = context.window.UCLDRAW_ROSTER_MANAGER;
const competition = data.competitions.ucl;
const all = manager.allTeams('ucl');

assert.ok(all.length > competition.teams.length, 'UCL search must include reserve qualification teams');
assert.ok(all.some((team) => team.poolSlug === 'fenerbahce'), 'Fenerbahçe must stay searchable even when outside the random 36');

const reserve = all.find((team) => !manager.selectedTeam('ucl', team.poolSlug));
assert.ok(reserve, 'At least one reserve team is required for replacement testing');

const projectedPot = manager.projectedPot('ucl', reserve);
assert.ok(projectedPot >= 1 && projectedPot <= competition.potCount, 'reserve team needs a coefficient-based projected pot');

const replacements = manager.replacementCandidates('ucl', reserve);
assert.ok(replacements.length > 0, 'projected pot must offer replacement choices');
assert.ok(replacements.every((team) => team.pot === projectedPot), 'only teams from the projected pot may be replaced');
assert.ok(replacements.every((team) => team.poolSlug !== 'psg'), 'Champions League titleholder must be protected');

const outgoing = replacements[0];
const inserted = manager.replaceTeam('ucl', reserve.poolSlug, outgoing.poolSlug);

assert.equal(competition.teams.length, 36, 'replacement must preserve the 36-team roster');
assert.equal(new Set(competition.teams.map((team) => team.poolSlug)).size, 36, 'replacement roster must stay unique');
assert.ok(manager.selectedTeam('ucl', reserve.poolSlug), 'incoming reserve must enter the active roster');
assert.equal(manager.selectedTeam('ucl', outgoing.poolSlug), null, 'chosen outgoing team must leave the active roster');
assert.equal(inserted.poolSlug, reserve.poolSlug);
assert.equal(inserted.pot, projectedPot, 'incoming team must remain in its projected coefficient pot');

const potSizes = Array.from({ length: competition.potCount }, (_, index) => (
  competition.teams.filter((team) => team.pot === index + 1).length
));
assert.deepEqual(potSizes, [9, 9, 9, 9]);
assert.equal(dispatched.at(-1)?.type, 'ucldraw:roster-changed');
assert.equal(dispatched.at(-1)?.detail?.incoming?.poolSlug, reserve.poolSlug);

console.log('Searchable roster replacement checks passed.');
