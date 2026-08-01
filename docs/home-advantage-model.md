# Contextual home advantage model

## Goal

Add a conservative, reproducible home-advantage layer on top of the existing UEFA-coefficient and Poisson prediction model. The layer must remain neutral for clubs without enough data and must never replace current team strength with a historic streak.

## Scope

- The three active league phases contain 108 clubs in total.
- The current candidate folders contain 156 competition entries before cross-competition deduplication.
- Hand-researching every club is not the source of truth. Normalized match records are the source of truth and the generated profile file is the runtime artifact.
- Initial research queue: `galatasaray`, `trabzonspor`.

## Files

- `data/home-advantage-matches.json`: normalized source matches.
- `scripts/build-home-advantage-profiles.mjs`: deterministic profile generator.
- `generated-home-advantage-profiles.js`: generated runtime data.
- `prediction-ai-controller.js`: applies the profile to AI simulations and affected-matchday rerolls.
- `tests/home-advantage-model.test.js`: neutral behavior, safety bounds, context selection, and deterministic simulation.

## Match input schema

Each match record contains:

```json
{
  "date": "2026-01-01",
  "competitionType": "europe",
  "competition": "UEFA Champions League",
  "homeSlug": "galatasaray",
  "homeName": "Galatasaray",
  "homeCountry": "TUR",
  "awaySlug": "liverpool",
  "awayName": "Liverpool",
  "awayCountry": "ENG",
  "homeCoefficient": 45,
  "awayCoefficient": 130,
  "homePot": 3,
  "awayPot": 1,
  "potCount": 4,
  "homeGoals": 2,
  "awayGoals": 1
}
```

The example values above describe the schema only. They are not a historical result and must not be inserted as data without a source.

## Method

1. Recreate the current model's expected home and away goals for every historical match.
2. Compare actual goals with those expected goals.
3. Weight recent matches more heavily with a three-year half-life.
4. Produce separate home attack and home defense multipliers.
5. Split context into:
   - overall
   - domestic
   - Europe
   - against stronger opponents
   - against similar opponents
   - against weaker opponents
6. Create opponent-country interactions only after at least six matches.
7. Shrink every estimate toward `1.0` according to effective sample size.
8. Clamp attack and defense effects to conservative limits.

## Runtime behavior

The model adjusts expected goals, not the final score directly:

- home attack multiplier modifies the home expected-goal value;
- home defense multiplier modifies the visiting team's expected-goal value;
- teams without a profile remain exactly on the previous algorithm;
- association-specific history is capped at 45% confidence even when the raw sample reports a higher value;
- the seeded Poisson simulation remains reproducible.

## Data-source strategy

Preferred order:

1. Official federation or UEFA match records for validation and current fixtures.
2. Structured match APIs or exports for repeatable ingestion.
3. CC0/open datasets for historical domestic and European results.
4. RSSSF or comparable archives only as a cross-check when structured data is missing.

Runtime code must not fetch external data. Data is collected and normalized during profile generation, then committed as a deterministic artifact.

## Research stages

### Stage 1

- Galatasaray and Trabzonspor.
- Verify name aliases and current coefficient mapping.
- Load recent domestic home matches and European home matches.
- Compare performance against stronger, similar, and weaker opponents.

### Stage 2

- Remaining Turkish clubs and clubs with large home/away residuals.
- This tests whether the model captures stadium or travel effects without nationality-based assumptions.

### Stage 3

- Fill every active 108-club league-phase roster.
- Expand to all candidate-pool clubs only after source coverage and aliases pass validation.

## Update command

```bash
node scripts/build-home-advantage-profiles.mjs
```

The generated file must not change when the normalized input has not changed.
