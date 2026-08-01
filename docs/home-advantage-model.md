# Contextual home advantage model

## Goal

Add a conservative, reproducible home-advantage layer on top of the UEFA-coefficient and Poisson prediction model. Historic home form may adjust expected goals, but it must not replace current team strength with a stadium myth or a tiny unbeaten streak.

## Current coverage

The generated runtime profile now uses **160 home matches**:

- 145 Süper Lig matches;
- 15 UEFA competition matches;
- 48 Galatasaray matches;
- 40 Trabzonspor matches;
- 18 Fenerbahçe matches;
- 18 Beşiktaş matches;
- 18 İstanbul Başakşehir matches;
- 18 Samsunspor matches.

Galatasaray and Trabzonspor cover 2023/24 and 2024/25. Fenerbahçe, Beşiktaş, İstanbul Başakşehir, and Samsunspor currently cover 2024/25. Galatasaray has 12 European home matches; Trabzonspor has three. The other four profiles remain domestic-only until their verified European batches are added.

Galatasaray's awarded 3-0 Adana Demirspor match is excluded because no played score exists. Trabzonspor's St. Gallen tie is stored as 1-1 after extra time; the penalty shootout is not treated as football goals. OpenFootball left the final 2024/25 Samsunspor-Kayserispor score blank, so the 2-1 result is completed from the official TFF record and marked with `sourceKey: tff-turkey-2024-25`.

The available OpenFootball 2025/26 Süper Lig file contains results only through the opening part of the season and fixture-only rows afterwards. It is not loaded as a completed season.

## Files and deterministic loading

- `data/home-advantage-matches.json`: original Galatasaray and Trabzonspor 2024/25 batch;
- `data/home-advantage-matches/*.json`: additional season and club batches;
- `scripts/build-home-advantage-profiles.mjs`: deterministic multi-file profile generator;
- `generated-home-advantage-profiles.js`: generated runtime data;
- `prediction-ai-controller.js`: applies the profile to AI simulations and affected-matchday rerolls;
- `tests/home-advantage-model.test.js`: source counts, duplicate protection, profile values, safety bounds, neutral fallback, and deterministic simulation.

The generator reads the legacy file first, then every JSON file in `data/home-advantage-matches/` alphabetically. A match duplicated across files stops generation instead of silently counting twice. The generated payload records its input file list.

## Strength proxy

Historical opponent strength is estimated with the same logarithmic UEFA-coefficient function used by the prediction engine. The data currently uses the project's 2026 five-year coefficient snapshot.

For Turkish clubs without a higher individual value, the 2026 Turkish association floor of `10.375` is used. Historical records set `homePot`, `awayPot`, and `potCount` to `1`, disabling pot bonuses. This prevents 2026 league-phase pots from being projected backwards and avoids counting the same strength signal twice.

A later revision may replace current coefficients with season-specific pre-match Elo or coefficient values, but it must regenerate every affected profile and pass the deterministic checks.

## Method

1. Recreate the base model's expected home and away goals for every historical match.
2. Compare actual goals with those expected goals.
3. Weight recent matches more heavily with a three-year half-life.
4. Produce separate home attack and visiting-goal multipliers.
5. Split context into overall, domestic, Europe, stronger, similar, and weaker opponents.
6. Create opponent-country interactions only after at least six matches.
7. Shrink every estimate toward `1.0` according to effective sample size.
8. Clamp attack and visiting-goal effects to conservative limits.

## Reading the values

- `attack > 1.0`: the home team scored more than the base model expected;
- `attack < 1.0`: the home team scored less than expected;
- `defense < 1.0`: visiting teams scored less than expected, a positive home defensive effect;
- `defense > 1.0`: visiting teams scored more than expected;
- `confidence`: effective sample size after recency weighting and prior shrinkage.

The internal property remains named `defense` for compatibility, but it is applied to the visiting team's expected goals. It is not a defensive-quality score where a larger number is better.

## Current profile signals

- **Galatasaray:** domestic attack remains at the `1.18` safety ceiling. European attack is `1.1513` across 12 matches. The broader sample still does not justify a home defensive bonus.
- **Trabzonspor:** domestic attack remains at `1.18`. Adding 2023/24 moved the stronger-opponent attack value from `0.9295` to `0.9806`, reducing a one-season penalty. European estimates still rely on three matches.
- **Fenerbahçe:** 2024/25 domestic attack is `1.1128`. Most matches fall into the weaker-opponent band, so the similar- and stronger-opponent splits remain weakly informed.
- **Beşiktaş:** 2024/25 domestic attack is `1.1459`. Its small stronger-opponent sample shows a defensive benefit, while the broad sample does not support a general defensive bonus.
- **İstanbul Başakşehir:** domestic attack is `1.1035`. The contextual split is meaningful: `1.1646` against weaker opponents but `0.9493` against similar opponents.
- **Samsunspor:** domestic attack is `1.1437`; the similar-opponent attack value is `1.1503`. The broad visiting-goal multiplier is close to neutral rather than a large defensive bonus.

Several values hit safety bounds. A bound means the measured residual is at least that strong under the current proxy; it does not authorize indefinite extrapolation.

## Runtime behavior

The model adjusts expected goals, not the final score directly:

- home attack multiplier modifies home expected goals;
- the internal `defense` multiplier modifies visiting expected goals;
- teams without a profile remain on the previous algorithm;
- association-specific history is capped at 45% confidence;
- the seeded Poisson simulation remains reproducible;
- adding a club profile does not alter draw pot construction or coefficient sorting.

## Research queue

The next domestic batch is:

1. Göztepe;
2. Konyaspor;
3. Çaykur Rizespor;
4. Gaziantep FK;
5. Alanyaspor;
6. Kasımpaşa.

After that, verified European batches for Fenerbahçe, Beşiktaş, İstanbul Başakşehir, and Samsunspor take priority before the model expands across the active European league-phase field.

## Update command

```bash
node scripts/build-home-advantage-profiles.mjs
```

The generated file must remain byte-for-byte unchanged when the source records have not changed.
