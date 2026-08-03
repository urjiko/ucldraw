from pathlib import Path


def replace_or_verify(text: str, old: str, new: str, label: str) -> str:
    if old in text:
        return text.replace(old, new)
    if new in text:
        return text
    raise SystemExit(f"missing {label} anchor")


test_path = Path("tests/home-advantage-model.test.js")
text = test_path.read_text()

for old, new, label in [
    ("assert.equal(records.length, 906, 'Stored source archive must contain 906 home matches.');", "assert.equal(records.length, 974, 'Stored source archive must contain 974 home matches.');", "stored match count"),
    ("assert.equal(records.filter((match) => match.competitionType === 'domestic').length, 891);", "assert.equal(records.filter((match) => match.competitionType === 'domestic').length, 959);", "stored domestic count"),
    ("assert.equal(generated.sourceSummary.storedMatches, 906);", "assert.equal(generated.sourceSummary.storedMatches, 974);", "generated stored count"),
    ("assert.equal(generated.sourceSummary.matches, 794);", "assert.equal(generated.sourceSummary.matches, 862);", "active match count"),
    ("assert.equal(generated.sourceSummary.teams, 42);", "assert.equal(generated.sourceSummary.teams, 46);", "profile count"),
    ("assert.equal(generated.sourceSummary.activeTeamScope, 42);", "assert.equal(generated.sourceSummary.activeTeamScope, 46);", "scope count"),
    ("assert.equal(generated.sourceSummary.domesticMatches, 782);", "assert.equal(generated.sourceSummary.domesticMatches, 850);", "active domestic count"),
    ("assert.equal(generated.scope.teams.length, 42);", "assert.equal(generated.scope.teams.length, 46);", "scope length"),
    ("assert.equal(new Set(generated.scope.teams).size, 42);", "assert.equal(new Set(generated.scope.teams).size, 46);", "scope unique count"),
    ("console.log('Guaranteed-team home profile checks passed.');", "console.log('Active-scope home profile checks passed.');", "test completion message"),
]:
    text = replace_or_verify(text, old, new, label)

if "match.homeSlug === 'aek'" not in text:
    anchor = "assert.equal(records.filter((match) => match.homeSlug === 'slavia').length, 18);\n"
    block = anchor + """assert.equal(records.filter((match) => match.homeSlug === 'aek').length, 16);
assert.equal(records.filter((match) => match.homeSlug === 'celtic').length, 19);
assert.equal(records.filter((match) => match.homeSlug === 'lask').length, 18);
assert.equal(records.filter((match) => match.homeSlug === 'viking').length, 15);
"""
    if anchor not in text:
        raise SystemExit("missing target count anchor")
    text = text.replace(anchor, block)

if "stage: 'playoffs'" not in text:
    anchor = "assert.match(builderSource, /competition: 'europa', stage: 'guaranteed'/);\n"
    if anchor not in text:
        raise SystemExit("missing builder scope anchor")
    text = text.replace(anchor, anchor + "assert.match(builderSource, /competition: 'champions', stage: 'playoffs'/);\n")

if "generated.scope.priority[2].competition" not in text:
    anchor = "assert.equal(generated.scope.priority[1].teams.length, 13);\nassert.equal(generated.scope.teams.length, 46);\n"
    block = """assert.equal(generated.scope.priority[1].teams.length, 13);
assert.equal(generated.scope.priority[2].competition, 'champions');
assert.equal(generated.scope.priority[2].stage, 'playoffs');
assert.deepEqual(Array.from(generated.scope.priority[2].teams), ['aek', 'celtic', 'lask', 'viking']);
assert.equal(generated.scope.teams.length, 46);
"""
    if anchor not in text:
        raise SystemExit("missing scope assertion anchor")
    text = text.replace(anchor, block)

if "  aek: 1.1073," not in text:
    anchor = "const expectedDomesticAttack = {\n  arsenal: 0.9824,"
    block = """const expectedDomesticAttack = {
  aek: 1.1073,
  arsenal: 0.9824,
  celtic: 1.18,
  lask: 1.0245,
  viking: 1.18,"""
    if anchor not in text:
        raise SystemExit("missing attack map anchor")
    text = text.replace(anchor, block)

if "generated.profiles.aek.attack.overall" not in text:
    anchor = "assert.equal(generated.profiles.astonvilla.attack.vsStronger, 1.0687);\n"
    block = """assert.equal(generated.profiles.aek.attack.overall, 1.0875);
assert.equal(generated.profiles.aek.attack.vsStronger, 0.9087);
assert.equal(generated.profiles.aek.attack.vsWeaker, 1.168);
assert.equal(generated.profiles.aek.defense.domestic, 0.8981);
assert.equal(generated.profiles.aek.defense.vsWeaker, 0.82);
assert.equal(generated.profiles.aek.samples.overall.raw, 16);
assert.equal(generated.profiles.celtic.attack.overall, 1.18);
assert.equal(generated.profiles.celtic.attack.vsSimilar, 1.1033);
assert.equal(generated.profiles.celtic.defense.domestic, 0.8945);
assert.equal(generated.profiles.celtic.defense.vsWeaker, 0.82);
assert.equal(generated.profiles.celtic.samples.overall.raw, 19);
assert.equal(generated.profiles.lask.attack.overall, 1.0202);
assert.equal(generated.profiles.lask.attack.vsStronger, 0.9351);
assert.equal(generated.profiles.lask.attack.vsSimilar, 1.0915);
assert.equal(generated.profiles.lask.defense.domestic, 1.0922);
assert.equal(generated.profiles.lask.samples.overall.raw, 18);
assert.equal(generated.profiles.viking.attack.overall, 1.18);
assert.equal(generated.profiles.viking.attack.vsStronger, 0.991);
assert.equal(generated.profiles.viking.attack.vsSimilar, 1.18);
assert.equal(generated.profiles.viking.defense.vsStronger, 0.9122);
assert.equal(generated.profiles.viking.samples.overall.raw, 15);
assert.equal(generated.profiles.astonvilla.attack.vsStronger, 1.0687);
"""
    if anchor not in text:
        raise SystemExit("missing profile assertion anchor")
    text = text.replace(anchor, block)

test_path.write_text(text)

doc_path = Path("docs/home-advantage-model.md")
doc = doc_path.read_text()
old_intro = """Profile work follows the guaranteed-team groups in `generated-team-pools.js`:

1. `champions.guaranteed`;
2. `europa.guaranteed`.

Missing guaranteed Champions League clubs always remain ahead of the first guaranteed Europa League club. Qualifying-stage records may stay in the archive, but they do not affect runtime generation unless their club is also in an active guaranteed group.

Current manifest scope:

- 29 guaranteed Champions League clubs;
- 13 guaranteed Europa League clubs;
- 42 unique active clubs.

## Current snapshot

The archive contains 906 verified home matches. The guaranteed-team filter currently includes 794 matches across all 42 active profiles:
"""
new_intro = """Profile work follows the active groups in `generated-team-pools.js`:

1. `champions.guaranteed`;
2. `europa.guaranteed`;
3. `champions.playoffs`.

Guaranteed Champions and Europa clubs remain the first two priorities. The next active group is the four-club Champions League play-off pool. Records outside these configured groups remain archived but do not affect runtime generation.

Current manifest scope:

- 29 guaranteed Champions League clubs;
- 13 guaranteed Europa League clubs;
- 4 Champions League play-off clubs;
- 46 unique active clubs.

## Current snapshot

The archive contains 974 verified home matches. The active-team filter currently includes 862 matches across all 46 active profiles:
"""
doc = replace_or_verify(doc, old_intro, new_intro, "documentation intro")

old_list = """- Slavia Prague: 18, including the championship round;
- Sunderland: 24, including its home Championship play-off semifinal.

The remaining 112 archived records are retained but excluded from runtime generation. All 29 guaranteed Champions League clubs and all 13 guaranteed Europa League clubs now have active profiles. The guaranteed-team research queue is empty.
"""
new_list = """- Slavia Prague: 18, including the championship round;
- Sunderland: 24, including its home Championship play-off semifinal;
- AEK Athens: 16;
- Celtic: 19;
- LASK: 18, including two European-place play-off home fixtures;
- Viking: 15.

The remaining 112 archived records are retained but excluded from runtime generation. All 29 guaranteed Champions League clubs, all 13 guaranteed Europa League clubs, and all four Champions League play-off clubs now have active profiles. The active-scope research queue is empty.
"""
doc = replace_or_verify(doc, old_list, new_list, "documentation snapshot")

if "### Champions League play-off clubs, 2024/25" not in doc:
    anchor = "\n### Spain and Germany 2024/25\n"
    section = """
### Champions League play-off clubs, 2024/25

`aek-celtic-lask-viking-2024-25.json` adds 68 domestic home matches for the four clubs in `champions.playoffs`: AEK Athens 16, Celtic 19, LASK 18, and Viking 15. The LASK sample includes two home European-place play-off fixtures. Opponents without a higher individual coefficient use the parsed 2026 association floors: Greece `9.682`, Scotland `6.410`, Austria `6.770`, and Norway `8.247`.

| Club | Domestic attack | Domestic visiting-goal multiplier | Notable context |
|---|---:|---:|---|
| AEK Athens | 1.1073 | 0.8981 | Weaker opponents: 1.1680 attack / 0.8200 visiting goals |
| Celtic | 1.1800 | 0.8945 | Weaker opponents: 1.1800 attack / 0.8200 visiting goals |
| LASK | 1.0245 | 1.0922 | Similar opponents: 1.0915 attack |
| Viking | 1.1800 | 1.0349 | Stronger opponents: 0.9122 visiting goals |

AEK and Celtic combine strong attacking residuals with positive home defensive effects. LASK remains close to neutral overall and does not show the same defensive signal. Viking reaches the attack ceiling, but its stronger-opponent attack residual is approximately neutral at `0.9910`.
"""
    if anchor not in doc:
        raise SystemExit("missing documentation section anchor")
    doc = doc.replace(anchor, section + anchor)

doc_path.write_text(doc)
