# Contextual home advantage model

## Active scope

Runtime home-advantage profiles are generated **only for clubs in the current Champions League pool** defined by `generated-team-pools.js`.

The active pool includes every club under:

- `champions.guaranteed`;
- `champions.playoffs`;
- `champions.q3`;
- `champions.q2`.

This is intentional while qualifying is in progress. The generator follows the project roster rather than maintaining a second hand-written list that would inevitably become stale because apparently one source of truth was too peaceful.

Historical records for clubs outside the Champions League scope are retained in `data/home-advantage-matches*.json`, but they are excluded from generated runtime profiles. They can be reused later if Europa League or Conference League coverage is enabled.

## Current snapshot

The stored research archive contains 160 home matches for six Turkish clubs. Under the current Champions League pool, only Galatasaray and Fenerbahçe are active:

- 160 stored matches;
- 66 matches included in Champions-scoped generation;
- 94 archived matches excluded from runtime generation;
- 53 current Champions League candidate clubs in the project manifest;
- 2 clubs currently backed by a generated home profile;
- 54 included domestic matches;
- 12 included European matches.

The runtime research queue is generated automatically from the Champions League manifest and contains every active club that does not yet have a profile.

## Data and source files

- `generated-team-pools.js`: authoritative active Champions League scope;
- `data/home-advantage-matches.json`: original Galatasaray and Trabzonspor 2024/25 batch;
- `data/home-advantage-matches/*.json`: additional season and club batches;
- `scripts/build-home-advantage-profiles.mjs`: deterministic scope loader and profile generator;
- `generated-home-advantage-profiles.js`: generated runtime payload;
- `prediction-ai-controller.js`: applies the profile to expected goals;
- `tests/home-advantage-model.test.js`: scope, source, profile, fallback, and reproducibility checks.

The generator reads all stored match files, rejects duplicates, loads the Champions League pool through a sandboxed Node `vm` context, and then filters records by the home club's pool slug.

## Why archived records remain

Beşiktaş, Trabzonspor, İstanbul Başakşehir, and Samsunspor records are not deleted. Removing verified source data because a club changed competitions would be impressive wastefulness. They remain available for later competition-specific models but do not affect current Champions League predictions.

## Strength proxy

Historical opponent strength is estimated using the same logarithmic UEFA-coefficient function as the prediction engine. Historical records disable pot bonuses by setting `homePot`, `awayPot`, and `potCount` to `1`, preventing modern league-phase pots from being projected backwards.

The recency anchor is the latest date in the full stored archive. Filtering the active competition therefore does not make old records artificially younger simply because another competition's data is temporarily hidden.

## Method

1. Load and validate every normalized source match.
2. Reject duplicate date, competition, home-team, and away-team combinations.
3. Load the current Champions League team pool from `generated-team-pools.js`.
4. Keep only matches whose home club is in that pool.
5. Recreate the base model's expected goals.
6. Compare actual goals with expected goals.
7. Apply a three-year recency half-life.
8. Split results by domestic/European context and opponent strength.
9. Shrink small samples toward `1.0`.
10. Clamp all adjustments to conservative bounds.

## Runtime behavior

- Clubs with a generated profile receive contextual expected-goal adjustments.
- Current Champions League clubs without enough data use the original prediction algorithm unchanged.
- Clubs outside the active Champions League pool receive no generated profile, even if archived data exists.
- The seeded Poisson simulation remains reproducible.
- Draw pots, coefficient sorting, and qualification logic are not modified.

## Current active profiles

### Galatasaray

- 48 included home matches;
- 36 domestic matches;
- 12 European matches;
- European home attack multiplier: `1.1512`.

### Fenerbahçe

- 18 included domestic home matches;
- domestic home attack multiplier: `1.1127`;
- European split remains neutral until verified European home data is added.

## Update command

```bash
node scripts/build-home-advantage-profiles.mjs
```

The generated payload records:

- stored match count;
- included and excluded match counts;
- active Champions League team count;
- exact scope stages and slugs;
- automatically derived research queue;
- source file list.

The generated file must remain byte-for-byte unchanged when neither the match archive nor `generated-team-pools.js` has changed.
