# Contextual home advantage model

## Active research order

Home-profile work now follows two guaranteed-team groups from `generated-team-pools.js`:

1. `champions.guaranteed`;
2. `europa.guaranteed`.

The generated queue preserves that order. Every missing guaranteed Champions League club appears before the first missing guaranteed Europa League club. Qualifying-stage clubs are retained in the historical archive but are outside the active runtime scope until the guaranteed groups are complete.

Current manifest scope:

- 29 guaranteed Champions League clubs;
- 13 guaranteed Europa League clubs;
- 42 unique clubs in total.

The scope is read from the team-pool manifest rather than duplicated by hand. Moving a team in the project roster therefore changes the next generated queue automatically, because maintaining two supposedly authoritative lists is how spreadsheets become folklore.

## Current snapshot

The stored archive contains 198 verified home matches. The guaranteed-team filter currently includes 86:

- Galatasaray: 48 matches, including 12 European home matches;
- Arsenal: 19 Premier League home matches from 2024/25;
- Liverpool: 19 Premier League home matches from 2024/25.

The other 112 archived matches remain available but do not affect the current guaranteed-team runtime profiles. Fenerbahçe, Beşiktaş, Trabzonspor, İstanbul Başakşehir, and Samsunspor data is not deleted; those records can be reactivated when their competition or priority group is in scope.

## Arsenal and Liverpool source batch

`data/home-advantage-matches/arsenal-liverpool-2024-25.json` contains all 38 league home matches for the two clubs in 2024/25.

- Match results: OpenFootball England 2024/25 Premier League dataset;
- club-strength values: the project's 2026 UEFA five-year coefficient snapshot;
- clubs without an individual UEFA value: the 2026 English association floor of `23.903`;
- historical pot values: fixed at `1`, so present-day draw pots are not projected backwards.

The first generated signals are deliberately residuals against the existing coefficient model:

- Arsenal domestic attack: `0.9824`;
- Arsenal versus similar-strength opponents: `1.1547`;
- Liverpool domestic attack: `1.0948`;
- Liverpool versus weaker opponents: `1.0763`.

Arsenal's broad value being close to neutral does not mean Arsenal was poor at home. The base model already expects a club with coefficient `119` to dominate many opponents. The profile measures what remained above or below that expectation, not whether supporters enjoyed the scoreline.

## Files

- `generated-team-pools.js`: guaranteed-team source of truth;
- `data/home-advantage-matches.json`: original Turkish source batch;
- `data/home-advantage-matches/*.json`: modular club and season batches;
- `scripts/build-home-advantage-profiles.mjs`: validation, filtering, profile generation, and queue ordering;
- `generated-home-advantage-profiles.js`: deterministic runtime payload;
- `prediction-ai-controller.js`: expected-goal adjustment layer;
- `tests/home-advantage-model.test.js`: archive counts, scope priority, generated values, fallback behavior, and seeded reproducibility.

## Method

1. Load all stored match files and reject duplicate matches.
2. Read guaranteed Champions and guaranteed Europa slugs from the pool manifest.
3. Keep only matches whose home club belongs to those groups.
4. Preserve the full archive's latest date as the recency anchor.
5. Recreate base expected goals from UEFA coefficients.
6. Measure actual-goal residuals separately for home attack and visiting goals.
7. Split domestic, European, stronger, similar, and weaker-opponent contexts.
8. Apply a three-year recency half-life and sample-size shrinkage.
9. Clamp attack effects to `0.84–1.18` and visiting-goal effects to `0.82–1.16`.
10. Emit the missing-team queue in Champions-guaranteed, then Europa-guaranteed order.

## Runtime behavior

- Clubs with generated profiles receive contextual expected-goal adjustments.
- Guaranteed clubs without data retain the previous coefficient and seeded Poisson algorithm exactly.
- Clubs outside the active guaranteed scope receive no runtime profile even when archived data exists.
- Draw construction, qualification paths, coefficient sorting, and deterministic seeds are unchanged.

## Update command

```bash
node scripts/build-home-advantage-profiles.mjs
```

The generated payload must remain byte-for-byte unchanged when neither the match archive nor the relevant guaranteed-team manifest entries have changed.
