# Contextual home advantage model

## Goal

Add a conservative, reproducible home-advantage layer on top of the existing UEFA-coefficient and Poisson prediction model. The layer must remain neutral for clubs without enough data and must never replace current team strength with a historic streak.

## Current coverage

The first sourced data batch covers Galatasaray and Trabzonspor in 2024/25:

- 44 valid home matches in total;
- 35 Süper Lig matches;
- 9 UEFA competition matches;
- 23 Galatasaray matches: 17 domestic and 6 European;
- 21 Trabzonspor matches: 18 domestic and 3 European.

Galatasaray's awarded 3-0 Adana Demirspor match is excluded because no played score exists. Trabzonspor's St. Gallen tie is stored as 1-1 after extra time; the penalty shootout is not treated as football goals.

This is an initial one-season profile, not a final historical verdict. European splits, especially Trabzonspor's three-match sample, remain deliberately low-confidence until more seasons are added.

## Files

- `data/home-advantage-matches.json`: normalized source matches.
- `scripts/build-home-advantage-profiles.mjs`: deterministic profile generator.
- `generated-home-advantage-profiles.js`: generated runtime data.
- `prediction-ai-controller.js`: applies the profile to AI simulations and affected-matchday rerolls.
- `tests/home-advantage-model.test.js`: neutral behavior, safety bounds, context selection, and deterministic simulation.

## Source registry

The match records use compact `sourceKey` values. Their canonical datasets are:

- `openfootball-turkey-2024-25`: `openfootball/europe`, `turkey/2024-25_tr1.txt`;
- `openfootball-uclq-2024-25`: `openfootball/champions-league`, `2024-25/clq.txt`;
- `openfootball-uel-2024-25`: `openfootball/champions-league`, `2024-25/el.txt`;
- `openfootball-uelq-2024-25`: `openfootball/champions-league`, `2024-25/elq.txt`;
- `openfootball-ueclq-2024-25`: `openfootball/champions-league`, `2024-25/confq.txt`.

OpenFootball publishes these datasets under CC0-1.0. Match records are committed locally so runtime predictions do not depend on an external service.

## Strength proxy used by the first batch

Historical match strength is estimated with the same logarithmic UEFA-coefficient function used by the prediction engine. The first batch uses the 2026 five-year club coefficients already maintained by the project.

For Turkish clubs without a higher individual five-year value, the 2026 Turkish association floor of `10.375` is used. Historical records set `homePot`, `awayPot`, and `potCount` to `1`, which disables pot bonuses. This prevents current league-phase pots from being projected backwards onto domestic or qualifying matches.

This is a transparent approximation. A later data revision may replace current coefficients with season-specific pre-match ratings, but it must regenerate every affected profile and pass the same deterministic checks.

## Match input schema

Each match record contains:

```json
{
  "date": "2024-11-07",
  "competitionType": "europe",
  "competition": "UEFA Europa League 2024/25",
  "homeSlug": "galatasaray",
  "homeName": "Galatasaray",
  "homeCountry": "TUR",
  "awaySlug": "tottenham",
  "awayName": "Tottenham Hotspur",
  "awayCountry": "ENG",
  "homeCoefficient": 53.5,
  "awayCoefficient": 82,
  "homePot": 1,
  "awayPot": 1,
  "potCount": 1,
  "homeGoals": 3,
  "awayGoals": 2,
  "sourceKey": "openfootball-uel-2024-25"
}
```

## Method

1. Recreate the current model's expected home and away goals for every historical match.
2. Compare actual goals with those expected goals.
3. Weight recent matches more heavily with a three-year half-life.
4. Produce separate home attack and away-goal multipliers.
5. Split context into overall, domestic, Europe, stronger, similar, and weaker opponents.
6. Create opponent-country interactions only after at least six matches.
7. Shrink every estimate toward `1.0` according to effective sample size.
8. Clamp attack and concession effects to conservative limits.

## Reading the generated values

- `attack > 1.0`: the home team scored more than the base model expected.
- `attack < 1.0`: the home team scored less than expected.
- `defense < 1.0`: visiting teams scored less than expected, indicating a positive home defensive effect.
- `defense > 1.0`: visiting teams scored more than expected. Despite the internal property name, this is a multiplier applied to away expected goals, not a defensive-quality score.
- `confidence`: effective sample size after recency weighting and prior shrinkage.

The first batch produces these broad signals:

- Galatasaray: strong positive home scoring residual domestically and in Europe; the away-goal multiplier is above `1.0`, so the data does not justify granting a defensive bonus.
- Trabzonspor: strong domestic home scoring residual; the three-game European attack split is below `1.0` and low-confidence, so it only nudges rather than controls European predictions.

Several attack estimates reach the safety ceiling of `1.18`. That is intentional: the model records that the measured residual is at least that strong without allowing one season to inflate expected goals indefinitely.

## Runtime behavior

The model adjusts expected goals, not the final score directly:

- home attack multiplier modifies the home expected-goal value;
- the internal `defense` multiplier modifies the visiting team's expected-goal value;
- teams without a profile remain exactly on the previous algorithm;
- association-specific history is capped at 45% confidence even when the raw sample reports a higher value;
- the seeded Poisson simulation remains reproducible.

## Research stages

### Stage 1: active

- Galatasaray and Trabzonspor 2024/25 complete.
- Add 2023/24 and 2025/26 to reduce single-season noise.
- Validate season-specific coefficient or Elo alternatives before changing the strength proxy.

### Stage 2

- Remaining Turkish clubs and clubs with large home/away residuals.
- Prioritize Fenerbahçe, Beşiktaş, İstanbul Başakşehir, and Samsunspor.

### Stage 3

- Fill every active 108-club league-phase roster.
- Expand to all candidate-pool clubs only after source coverage and aliases pass validation.

## Update command

```bash
node scripts/build-home-advantage-profiles.mjs
```

The generated file must not change when the normalized input has not changed.
