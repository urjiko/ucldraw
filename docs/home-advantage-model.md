# Contextual home advantage model

## Active research order

Profile work follows two guaranteed-team groups from `generated-team-pools.js`:

1. `champions.guaranteed`;
2. `europa.guaranteed`.

The queue preserves that order. Missing guaranteed Champions League clubs always appear before the first guaranteed Europa League club. Qualifying-stage records remain stored but do not affect the active model until their priority group is enabled.

Current manifest scope:

- 29 guaranteed Champions League clubs;
- 13 guaranteed Europa League clubs;
- 42 unique active clubs.

## Current snapshot

The archive contains 327 verified home matches. The guaranteed-team filter currently includes 215:

- Galatasaray: 48 matches;
- Arsenal: 19 Premier League home matches;
- Aston Villa: 19 Premier League home matches;
- Manchester City: 19 Premier League home matches;
- Liverpool: 19 Premier League home matches;
- Manchester United: 19 Premier League home matches;
- Atlético Madrid: 19 La Liga home matches;
- Barcelona: 19 La Liga home matches;
- Bayern München: 17 Bundesliga home matches;
- Borussia Dortmund: 17 Bundesliga home matches.

The remaining 112 archived records are retained but excluded from runtime generation.

## English 2024/25 batches

The two English source files contain every league home match from the 2024/25 season for five guaranteed Champions League clubs:

- `arsenal-liverpool-2024-25.json`: 38 matches;
- `astonvilla-city-manu-2024-25.json`: 57 matches.

Match scores come from the OpenFootball England 2024/25 Premier League dataset. Strength values use the project's 2026 UEFA coefficient snapshot. English clubs without an individual coefficient use the English association floor of `23.903`. Historical pot values are fixed at `1`, so modern draw pots are not projected backwards.

Generated domestic attack residuals:

| Club | Multiplier |
|---|---:|
| Arsenal | 0.9824 |
| Aston Villa | 1.0210 |
| Manchester City | 1.1130 |
| Liverpool | 1.0948 |
| Manchester United | 0.8400 |

These are residuals after the existing UEFA-coefficient expectation. A value below `1.0` does not claim the club was objectively weak at home; it says the club scored below what the base model already expected from its coefficient and opponents. Manchester United reaches the conservative attack floor, preventing a single season from lowering expected goals without limit.

Context examples:

- Aston Villa against stronger opponents: `1.0687`;
- Manchester City against weaker opponents: `1.1129`;
- Manchester United against similar opponents: `0.8892`;
- Arsenal against similar opponents: `1.1547`;
- Liverpool against weaker opponents: `1.0763`.

## Spain and Germany 2024/25 batches

The next guaranteed-Champions batch adds every domestic league home match from 2024/25 for four clubs:

- `atleti-barcelona-2024-25.json`: 38 La Liga matches;
- `bayern-bvb-2024-25.json`: 34 Bundesliga matches.

Scores come from the OpenFootball Spain and Germany season datasets. The project’s 2026 UEFA coefficient snapshot supplies individual club values above the association minimum. Other Spanish opponents use the `19.409` association floor; other German opponents use `18.580`. Historical pot values remain fixed at `1`.

Generated domestic attack residuals:

| Club | Multiplier |
|---|---:|
| Atlético Madrid | 1.1061 |
| Barcelona | 1.1800 |
| Bayern München | 1.1800 |
| Borussia Dortmund | 1.1800 |

Barcelona and Bayern reach the conservative attack ceiling. Dortmund reaches the domestic ceiling while its broader overall value is `1.1710`. Atlético remains below the ceiling and shows a stronger `1.1184` signal against similar-strength opponents. Bayern’s similar-opponent attack value is approximately neutral at `0.9930`, despite its large weaker-opponent residual.

## Files

- `generated-team-pools.js`: guaranteed-team source of truth;
- `data/home-advantage-matches.json`: original source batch;
- `data/home-advantage-matches/*.json`: modular club and season batches;
- `scripts/build-home-advantage-profiles.mjs`: validation, filtering, generation, and queue ordering;
- `generated-home-advantage-profiles.js`: deterministic runtime payload;
- `prediction-ai-controller.js`: expected-goal adjustment layer;
- `tests/home-advantage-model.test.js`: archive, scope, values, fallback, and reproducibility checks.

## Method

1. Load every stored match and reject duplicates.
2. Read guaranteed Champions and guaranteed Europa slugs from the manifest.
3. Keep only matches whose home club belongs to those groups.
4. Preserve the full archive's latest date as the recency anchor.
5. Recreate base expected goals from UEFA coefficients.
6. Measure home scoring and visiting scoring residuals separately.
7. Split domestic, European, stronger, similar, and weaker-opponent contexts.
8. Apply a three-year recency half-life and sample-size shrinkage.
9. Clamp attack effects to `0.84–1.18` and visiting-goal effects to `0.82–1.16`.
10. Emit missing teams in Champions-guaranteed, then Europa-guaranteed order.

## Runtime behavior

- Clubs with generated profiles receive contextual expected-goal adjustments.
- Guaranteed clubs without data retain the previous coefficient and seeded Poisson model.
- Clubs outside the active guaranteed scope receive no runtime profile, even when archived data exists.
- Draw construction, qualification paths, coefficient sorting, and deterministic seeds remain unchanged.

## Update command

```bash
node scripts/build-home-advantage-profiles.mjs
```

The output must remain byte-for-byte unchanged when neither the match archive nor the guaranteed-team manifest changes.
