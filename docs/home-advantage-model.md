# Contextual home advantage model

## Goal

Add a conservative, reproducible home-advantage layer on top of the existing UEFA-coefficient and Poisson prediction model. Historic home form may adjust expected goals, but it must never replace current team strength with a stadium myth or a tiny unbeaten streak.

## Current coverage

The generated runtime profile now uses **124 home matches**:

- 109 Süper Lig matches;
- 15 UEFA competition matches;
- 48 Galatasaray matches: 36 domestic and 12 European;
- 40 Trabzonspor matches: 37 domestic and 3 European;
- 18 Fenerbahçe domestic matches;
- 18 Beşiktaş domestic matches.

Included seasons and teams:

- Galatasaray and Trabzonspor: 2023/24 and 2024/25;
- Fenerbahçe and Beşiktaş: 2024/25;
- Galatasaray's 2023/24 Champions League qualifying and group-stage home matches;
- Galatasaray and Trabzonspor's 2024/25 UEFA home matches.

Galatasaray's awarded 3-0 Adana Demirspor match is excluded because no played score exists. Trabzonspor's St. Gallen tie is stored as 1-1 after extra time; the penalty shootout is not treated as football goals.

The available OpenFootball 2025/26 Süper Lig file contains results only through the opening part of the season and fixture-only rows afterwards. It is not loaded as a completed season. Incomplete public data is preferable to imaginary completeness only in fiction, not in model inputs.

## Files

- `data/home-advantage-matches.json`: original Galatasaray and Trabzonspor 2024/25 batch;
- `data/home-advantage-matches/*.json`: additional season and club batches;
- `scripts/build-home-advantage-profiles.mjs`: deterministic multi-file profile generator;
- `generated-home-advantage-profiles.js`: generated runtime data;
- `prediction-ai-controller.js`: applies the profile to AI simulations and affected-matchday rerolls;
- `tests/home-advantage-model.test.js`: source counts, duplicate protection, profile values, safety bounds, neutral fallback, and deterministic simulation.

The generator reads the legacy file first, then every JSON file in `data/home-advantage-matches/` alphabetically. A match duplicated across files stops generation instead of silently counting twice. The generated payload records its input file list.

## Source registry

The match records use compact `sourceKey` values. Canonical datasets include:

- `openfootball-turkey-2023-24`: `openfootball/europe`, `turkey/2023-24_tr1.txt`;
- `openfootball-turkey-2024-25`: `openfootball/europe`, `turkey/2024-25_tr1.txt`;
- `openfootball-ucl-2023-24`: `openfootball/champions-league`, `2023-24/cl.txt`;
- `openfootball-uclq-2023-24`: UEFA qualifying results cross-checked with match-result archives;
- `openfootball-uclq-2024-25`: `openfootball/champions-league`, `2024-25/clq.txt`;
- `openfootball-uel-2024-25`: `openfootball/champions-league`, `2024-25/el.txt`;
- `openfootball-uelq-2024-25`: `openfootball/champions-league`, `2024-25/elq.txt`;
- `openfootball-ueclq-2024-25`: `openfootball/champions-league`, `2024-25/confq.txt`.

OpenFootball publishes its football datasets under CC0-1.0. Match records are committed locally, so runtime predictions do not depend on a third-party service remaining online.

## Strength proxy

Historical opponent strength is estimated with the same logarithmic UEFA-coefficient function used by the prediction engine. The data currently uses the project's 2026 five-year coefficient snapshot.

For Turkish clubs without a higher individual value, the 2026 Turkish association floor of `10.375` is used. Historical records set `homePot`, `awayPot`, and `potCount` to `1`, disabling pot bonuses. This prevents 2026 league-phase pots from being projected backwards onto domestic or qualifying matches and avoids counting the same strength signal twice.

This is a transparent approximation. A later revision may replace current coefficients with season-specific pre-match Elo or coefficient values, but it must regenerate every affected profile and pass the deterministic checks.

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

- **Galatasaray:** domestic attack remains at the `1.18` safety ceiling. European attack settles at `1.1513` across 12 matches, lower than the first one-season estimate but supported by more evidence. The data still does not justify a home defensive bonus.
- **Trabzonspor:** domestic attack remains at the `1.18` ceiling. Adding 2023/24 moves the stronger-opponent attack value from `0.9295` to `0.9806`, reducing the one-season penalty. European estimates still rely on only three matches.
- **Fenerbahçe:** 2024/25 domestic attack is `1.1128`. Most matches are classified against weaker opponents, so the similar- and stronger-opponent splits remain weakly informed.
- **Beşiktaş:** 2024/25 domestic attack is `1.1459`. The small stronger-opponent sample produces a positive visiting-goal suppression signal, while the broader sample does not support a general defensive bonus.

Several attack or visiting-goal values hit their safety bounds. A bound means the measured residual is at least that strong under the current proxy; it does not authorize the model to extrapolate indefinitely.

## Runtime behavior

The model adjusts expected goals, not the final score directly:

- home attack multiplier modifies home expected goals;
- the internal `defense` multiplier modifies visiting expected goals;
- teams without a profile remain on the previous algorithm;
- association-specific history is capped at 45% confidence;
- the seeded Poisson simulation remains reproducible;
- adding a club profile does not alter draw pot construction or coefficient chain sorting.

## Research queue

1. Complete adjacent-season European samples for Fenerbahçe and Beşiktaş.
2. Add İstanbul Başakşehir and Samsunspor.
3. Add remaining Turkish clubs with sufficient European or domestic coverage.
4. Expand to active league-phase clubs, preserving coefficient and pot regression checks.
5. Expand to candidate-pool clubs only after aliases and source coverage pass validation.

## Update command

```bash
node scripts/build-home-advantage-profiles.mjs
```

The generated file must remain byte-for-byte unchanged when the source records have not changed.
