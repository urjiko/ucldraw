# Contextual home advantage model

## Active research order

Profile work follows the guaranteed-team groups in `generated-team-pools.js`:

1. `champions.guaranteed`;
2. `europa.guaranteed`.

Missing guaranteed Champions League clubs always remain ahead of the first guaranteed Europa League club. Qualifying-stage records may stay in the archive, but they do not affect runtime generation unless their club is also in an active guaranteed group.

Current manifest scope:

- 29 guaranteed Champions League clubs;
- 13 guaranteed Europa League clubs;
- 42 unique active clubs.

## Current snapshot

The archive contains 457 verified home matches. The guaranteed-team filter currently includes 345 matches across 17 active profiles:

- Galatasaray: 48;
- Arsenal, Aston Villa, Atlético Madrid, Barcelona, Como, Internazionale, Liverpool, Manchester City, Manchester United, Napoli, and Roma: 19 each;
- Bayern München, Borussia Dortmund, Feyenoord, and PSV: 17 each;
- Club Brugge: 20, including the championship play-off round.

The remaining 112 archived records are retained but excluded from runtime generation. The next missing guaranteed Champions League club is RB Leipzig.

## Data batches

### England 2024/25

- `arsenal-liverpool-2024-25.json`: 38 Premier League matches;
- `astonvilla-2024-25.json`, `city-2024-25.json`, and `manu-2024-25.json`: 57 matches.

English clubs without an individual coefficient use the `23.903` association floor.

| Club | Domestic attack |
|---|---:|
| Arsenal | 0.9824 |
| Aston Villa | 1.0210 |
| Manchester City | 1.1130 |
| Liverpool | 1.0948 |
| Manchester United | 0.8400 |

### Spain and Germany 2024/25

- `atleti-barcelona-2024-25.json`: 38 La Liga matches;
- `bayern-bvb-2024-25.json`: 34 Bundesliga matches.

Spanish opponents without a higher individual value use `19.409`; German opponents use `18.580`.

| Club | Domestic attack |
|---|---:|
| Atlético Madrid | 1.1061 |
| Barcelona | 1.1800 |
| Bayern München | 1.1800 |
| Borussia Dortmund | 1.1800 |

Barcelona, Bayern, and Dortmund reach the conservative attack ceiling. Bayern remains approximately neutral against similar-strength opponents at `0.9930`, while Atlético's similar-opponent value is `1.1184`.

### Belgium 2024/25

`brugge-2024-25.json` contains all 20 Club Brugge league home matches, including five championship play-off fixtures. Belgian opponents without a higher individual coefficient use `12.450`.

| Context | Multiplier |
|---|---:|
| Domestic attack | 1.1168 |
| Overall attack | 1.0974 |
| Weaker-opponent attack | 1.1168 |
| Domestic visiting-goal multiplier | 1.1600 |

All 20 domestic opponents fall into the weaker-opponent bucket under the current coefficient snapshot. No unsupported similar- or stronger-opponent effect is invented.

### Italy 2024/25

`como-inter-napoli-roma-2024-25.json` contains every Serie A home match for Como, Internazionale, Napoli, and Roma, 19 per club and 76 total. Scores come from the OpenFootball Italy 2024/25 Serie A dataset. Strength values use the project's 2026 UEFA coefficient snapshot; Italian opponents without a higher individual coefficient use the `19.989` association floor. Historical pot values remain neutral at `1`.

| Club | Domestic attack | Notable context |
|---|---:|---:|
| Como | 1.0620 | Stronger opponents: 1.0466 |
| Internazionale | 1.0253 | Weaker opponents: 1.0527 |
| Napoli | 0.9873 | Domestic visiting-goal multiplier: 0.9089 |
| Roma | 1.0170 | Weaker opponents: 1.0533 |

Napoli's attack residual is approximately neutral, but its `0.9089` visiting-goal multiplier indicates a positive home defensive effect in this sample. Como has both stronger- and similar-opponent observations; Inter and Roma are driven mostly by weaker-opponent matches because of their higher coefficients.

### Netherlands 2024/25

`feyenoord-psv-2024-25.json` contains all 34 Eredivisie home matches for Feyenoord and PSV, 17 per club. Results come from OpenFootball's complete 306-match Eredivisie season file. Club and opponent strength values use the project's 2026 UEFA coefficient snapshot; Dutch clubs without a higher individual value use the Netherlands association floor from the same generated coefficient source.

| Club | Domestic attack | Notable context |
|---|---:|---:|
| Feyenoord | 1.0988 | Similar opponents: 1.0202 |
| PSV | 1.1800 | Similar opponents: 1.0140 |

PSV reaches the conservative attack ceiling, while its similar-opponent residual is approximately neutral. Feyenoord remains below the ceiling with an overall attack residual of `1.0812`. Both clubs' domestic visiting-goal multipliers reach `1.1600`, so this single-season sample does not support a positive home defensive adjustment for either club.

The source uses `AFC Ajax` and `SC Heerenveen`; those exact names are normalized to the project's `ajax` and `heerenveen` slugs. This prevents the four Feyenoord/PSV home fixtures against those clubs from being silently omitted.

## Interpretation

The values are residual multipliers after the existing UEFA-coefficient expected-goal model, not raw goal rates or subjective club ratings.

- Attack above `1.0` means the home club scored above the coefficient baseline.
- Attack below `1.0` means it scored below that already-adjusted baseline.
- The field named `defense` multiplies the visiting team's expected goals.
- A visiting-goal multiplier below `1.0` is a positive home defensive effect.
- A value above `1.0` means visitors scored above the baseline.

Single-season effects are shrunk toward neutral and clamped. Attack is bounded to `0.84–1.18`; visiting-goal effects are bounded to `0.82–1.16`.

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
9. Clamp attack and visiting-goal effects to the safety bounds.
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
