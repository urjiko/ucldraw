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

const reserve = manager.reserveTeams('ucl').find((team) => team.poolSlug === 'fenerbahce')
  || manager.reserveTeams('ucl')[0];
assert.ok(reserve, 'At least one reserve team is required for replacement testing');

const removable = competition.teams.filter((team) => manager.isRemovable('ucl', team));
const guaranteed = competition.teams.filter((team) => manager.isGuaranteed(team));
assert.ok(removable.length > 0, 'the active roster needs at least one removable qualification team');
assert.ok(guaranteed.length > 0, 'the active roster needs guaranteed participants');

const scenarios = manager.replacementScenarios('ucl', reserve);
assert.equal(scenarios.length, removable.length, 'every removable team must produce a full final-roster scenario');
assert.ok(scenarios.every((scenario) => !manager.isGuaranteed(scenario.outgoing)), 'guaranteed teams must never be offered for removal');
assert.ok(scenarios.every((scenario) => scenario.outgoing.poolSlug !== 'psg'), 'Champions League titleholder must stay protected');

for (const scenario of scenarios) {
  assert.equal(scenario.teams.length, 36, 'every scenario must preserve the 36-team roster');
  assert.equal(new Set(scenario.teams.map((team) => team.poolSlug)).size, 36, 'scenario roster must stay unique');
  assert.ok(scenario.teams.some((team) => team.poolSlug === reserve.poolSlug), 'scenario must contain the incoming team');
  assert.ok(!scenario.teams.some((team) => team.poolSlug === scenario.outgoing.poolSlug), 'scenario must remove the selected outgoing team');
  assert.equal(scenario.teams.find((team) => team.poolSlug === reserve.poolSlug).pot, scenario.incomingPot);
  const potSizes = Array.from({ length: competition.potCount }, (_, index) => (
    scenario.teams.filter((team) => team.pot === index + 1).length
  ));
  assert.deepEqual(potSizes, [9, 9, 9, 9]);
}

const scenarioPots = [...new Set(scenarios.map((scenario) => scenario.incomingPot))].sort();
assert.deepEqual([...manager.possiblePots('ucl', reserve)], scenarioPots, 'search result pots must come from real 36-team replacement scenarios');
assert.equal(manager.replacementCandidates('ucl', reserve).length, removable.length, 'legacy candidate list must no longer be limited to one projected pot');

assert.throws(
  () => manager.simulateReplacement('ucl', reserve, guaranteed[0]),
  /Garanti katılımcılar/,
  'guaranteed participants must be impossible to remove'
);

const outgoing = removable[0];
const incomingScenarios = manager.incomingScenarios('ucl', outgoing);
assert.equal(incomingScenarios.length, manager.reserveTeams('ucl').length, 'clicking a removable pot team must offer every reserve team');
assert.ok(incomingScenarios.every((scenario) => scenario.outgoing.poolSlug === outgoing.poolSlug));

const chosen = scenarios[0];
const inserted = manager.replaceTeam('ucl', reserve.poolSlug, chosen.outgoing.poolSlug);
assert.equal(competition.teams.length, 36, 'replacement must preserve the 36-team roster');
assert.equal(new Set(competition.teams.map((team) => team.poolSlug)).size, 36, 'replacement roster must stay unique');
assert.equal(inserted.poolSlug, reserve.poolSlug);
assert.equal(inserted.pot, chosen.incomingPot, 'applied replacement must match its simulated final pot');
assert.equal(manager.selectedTeam('ucl', chosen.outgoing.poolSlug), null, 'chosen outgoing team must leave the active roster');
assert.equal(dispatched.at(-1)?.type, 'ucldraw:roster-changed');
assert.equal(dispatched.at(-1)?.detail?.incoming?.poolSlug, reserve.poolSlug);
assert.ok(Array.isArray(dispatched.at(-1)?.detail?.potChanges));

console.log('Guaranteed locks and coefficient replacement scenarios passed.');
