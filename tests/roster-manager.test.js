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
const stored = new Map();
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
  TypeError,
  CustomEvent: TestCustomEvent
});
context.window = context;
context.window.dispatchEvent = (event) => dispatched.push(event);
context.window.sessionStorage = {
  getItem(key) { return stored.has(key) ? stored.get(key) : null; },
  setItem(key, value) { stored.set(key, String(value)); },
  removeItem(key) { stored.delete(key); }
};

load('teams.js', context);
load('generated-team-pools.js', context);
load('generated-club-coefficients.js', context);
load('qualification-bracket.js', context);
load('team-pool-loader.js', context);
load('coefficient-pots.js', context);
load('roster-manager.js', context);

const data = context.window.UCLDRAW_DATA;
const manager = context.window.UCLDRAW_ROSTER_MANAGER;
const competition = data.competitions.ucl;
const all = manager.allTeams('ucl');

assert.ok(all.length > competition.teams.length, 'UCL search must include reserve qualification teams');
assert.ok(all.some((team) => team.poolSlug === 'fenerbahce'), 'Fenerbahçe must stay searchable through its real qualification slot');

const pathIds = ['fenerbahce', 'strumgraz', 'spartapraha', 'lyon'];
const selectedPathTeams = competition.teams.filter((team) => pathIds.includes(team.poolSlug));
assert.equal(selectedPathTeams.length, 1, 'the Fenerbahçe/Sturm/Sparta/Lyon path must produce exactly one UCL club');
const pathWinner = selectedPathTeams[0];

const pathScenarios = manager.incomingScenarios('ucl', pathWinner);
assert.deepEqual(
  new Set(pathScenarios.map((scenario) => scenario.incoming.poolSlug)),
  new Set(pathIds.filter((id) => id !== pathWinner.poolSlug)),
  'replacing the UCL path winner must only offer clubs from the same four-team path'
);
assert.equal(pathScenarios.length, 3, 'the selected UCL berth must have exactly three alternatives');
assert.ok(pathScenarios.every((scenario) => scenario.outgoing.poolSlug === pathWinner.poolSlug));

const incomingSlug = pathWinner.poolSlug === 'fenerbahce' ? 'lyon' : 'fenerbahce';
const incoming = manager.candidateTeam('ucl', incomingSlug);
const reverseScenarios = manager.replacementScenarios('ucl', incoming);
assert.equal(reverseScenarios.length, 1, 'a reserve team may replace only the active holder of its real UCL berth');
assert.equal(reverseScenarios[0].outgoing.poolSlug, pathWinner.poolSlug);

const guaranteed = competition.teams.filter((team) => manager.isGuaranteed(team));
assert.ok(guaranteed.length > 0, 'the active roster needs guaranteed participants');
assert.throws(
  () => manager.simulateReplacement('ucl', incoming, guaranteed[0]),
  /Garanti katılımcılar/,
  'guaranteed participants must be impossible to remove'
);

const preview = reverseScenarios[0];
for (const id of ['ucl', 'uel', 'uecl']) {
  assert.equal(preview.competitionUpdates[id].length, 36, `${id} preview must preserve 36 clubs`);
}
const previewIds = Object.values(preview.competitionUpdates)
  .flat()
  .map((team) => team.qualificationId || team.poolSlug);
assert.equal(new Set(previewIds).size, 108, 'preview must keep all three league phases globally unique');

const inserted = manager.replaceTeam('ucl', incomingSlug, pathWinner.poolSlug);
assert.equal(inserted.poolSlug, incomingSlug);
assert.equal(data.competitions.ucl.teams.filter((team) => pathIds.includes(team.poolSlug)).length, 1);
assert.equal(data.competitions.ucl.teams.find((team) => pathIds.includes(team.poolSlug)).poolSlug, incomingSlug);

const europaPathIds = data.competitions.uel.teams
  .filter((team) => pathIds.includes(team.poolSlug))
  .map((team) => team.poolSlug);
assert.deepEqual(
  new Set(europaPathIds),
  new Set(pathIds.filter((id) => id !== incomingSlug)),
  'the other three clubs from the path must move coherently into Europa League'
);
assert.equal(data.competitions.uecl.teams.filter((team) => pathIds.includes(team.poolSlug)).length, 0);

const finalIds = Object.values(data.competitions)
  .flatMap((entry) => entry.teams)
  .map((team) => team.qualificationId || team.poolSlug);
assert.equal(new Set(finalIds).size, 108, 'manual replacement must not duplicate a club across competitions');

for (const [id, entry] of Object.entries(data.competitions)) {
  const capacity = entry.teams.length / entry.potCount;
  for (let pot = 1; pot <= entry.potCount; pot += 1) {
    assert.equal(entry.teams.filter((team) => team.pot === pot).length, capacity, `${id} Pot ${pot} must remain full`);
  }
}

assert.equal(dispatched.at(-1)?.type, 'ucldraw:roster-changed');
assert.equal(dispatched.at(-1)?.detail?.incoming?.poolSlug, incomingSlug);
assert.ok(dispatched.at(-1)?.detail?.affectedCompetitionIds.includes('ucl'));
assert.ok(dispatched.at(-1)?.detail?.affectedCompetitionIds.includes('uel'));
assert.ok(Array.isArray(dispatched.at(-1)?.detail?.slotChanges));
assert.ok(stored.has('ucldraw:qualification-slot-assignments:v1'), 'coherent slot assignments must persist across league route reloads');

console.log('Qualification-slot roster replacement checks passed.');