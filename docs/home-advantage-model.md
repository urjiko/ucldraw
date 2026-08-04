# Contextual home advantage model

## Active research order

Profile work follows the active groups in `generated-team-pools.js`:

1. `champions.guaranteed`;
2. `europa.guaranteed`;
3. `champions.playoffs`;
4. `europa.playoffs`;
5. `conference.playoffs`;
6. `champions.q3`.

Guaranteed Champions and Europa clubs remain the first two priorities, followed by the Champions, Europa, and Conference play-off pools and then the Champions League third qualifying-round pool. All six configured groups are complete. Records outside these groups remain archived and do not affect runtime generation.

Current manifest scope:

- 29 guaranteed Champions League clubs;
- 13 guaranteed Europa League clubs;
- 4 Champions League play-off clubs;
- 5 Europa League play-off clubs;
- 5 Conference League play-off clubs;
- 6 Champions League third qualifying-round clubs;
- 62 unique active clubs.

## Current snapshot

The archive contains 1,252 verified home matches. The active-team filter currently includes 1,180 matches across all 62 active profiles:

- Galatasaray: 48;
- Arsenal, Aston Villa, Atlético Madrid, Barcelona, Bournemouth, Celta Vigo, Como, Crystal Palace, Internazionale, Juventus, Liverpool, Manchester City, Manchester United, Milan, Napoli, Real Betis, Real Madrid, Real Sociedad, Roma, and Villarreal: 19 each;
- AZ Alkmaar, Bayer Leverkusen, Bayern München, Borussia Dortmund, Feyenoord, Hoffenheim, Lens, Lille, Marseille, Paris Saint-Germain, Porto, PSV, RB Leipzig, Rennes, Sporting CP, Torreense, and VfB Stuttgart: 17 each;
- Club Brugge: 20, including the championship play-off round;
- Shakhtar Donetsk: 15;
- Slavia Prague: 18, including the championship round;
- Sunderland: 24, including its home Championship play-off semifinal;
- AEK Athens: 16;
- Celtic: 19;
- LASK: 18, including two European-place play-off home fixtures;
- Viking: 15;
- OFI Crete: 16;
- Lillestrøm: 15;
- Trabzonspor: 58 total observations, including 55 domestic and 3 European matches;
- Sint-Truiden: 18;
- Viktoria Plzeň: 18;
- Atalanta, Brighton & Hove Albion, and Getafe: 19 each;
- SC Freiburg and AS Monaco: 17 each;
- Bodø/Glimt: 15;
- Olympique Lyonnais, NEC, and Sparta Praha: 17 each;
- Olympiacos: 16;
- Union Saint-Gilloise: 20, including the championship play-off round.

The remaining 72 archived records are retained but excluded from runtime generation. All 29 guaranteed Champions League clubs, all 13 guaranteed Europa League clubs, all four Champions League play-off clubs, all five Europa League play-off clubs, all five Conference League play-off clubs, and all six Champions League third qualifying-round clubs now have active profiles. The active-scope research queue is empty.

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

`bournemouth-palace-2024-25.json` adds all 38 Premier League home matches for two guaranteed Europa League clubs, 19 per club.

| Club | Domestic attack | Domestic visiting-goal multiplier |
|---|---:|---:|
| Bournemouth | 0.9345 | 0.8499 |
| Crystal Palace | 0.9824 | 1.1096 |

Bournemouth scores below its coefficient baseline but shows a strong positive home defensive effect. Its attack values are `0.9967` against stronger opponents and `0.9308` against similar opponents. Crystal Palace is approximately neutral overall, rises to `1.1448` against stronger opponents, and falls to `0.9192` against similar opponents. Neither club has weaker-opponent observations under the current coefficient snapshot.

`sunderland-torreense-2024-25.json` adds Sunderland's 23 regular Championship home matches plus its home play-off semifinal. The neutral Wembley final is not treated as a home fixture.

| Club | Domestic attack | Domestic visiting-goal multiplier |
|---|---:|---:|
| Sunderland | 0.9235 | 0.8614 |

Sunderland scores below its coefficient baseline but shows a strong positive home defensive residual. All 24 observations fall into the similar-opponent bucket under the current coefficient snapshot.

### Champions League play-off clubs, 2024/25

`aek-celtic-lask-viking-2024-25.json` adds 68 domestic home matches for the four clubs in `champions.playoffs`: AEK Athens 16, Celtic 19, LASK 18, and Viking 15. The LASK sample includes two home European-place play-off fixtures. Opponents without a higher individual coefficient use the parsed 2026 association floors: Greece `9.682`, Scotland `6.410`, Austria `6.770`, and Norway `8.247`.

| Club | Domestic attack | Domestic visiting-goal multiplier | Notable context |
|---|---:|---:|---|
| AEK Athens | 1.1073 | 0.8981 | Weaker opponents: 1.1680 attack / 0.8200 visiting goals |
| Celtic | 1.1800 | 0.8945 | Weaker opponents: 1.1800 attack / 0.8200 visiting goals |
| LASK | 1.0245 | 1.0922 | Similar opponents: 1.0915 attack |
| Viking | 1.1800 | 1.0349 | Stronger opponents: 0.9122 visiting goals |

AEK and Celtic combine strong attacking residuals with positive home defensive effects. LASK remains close to neutral overall and does not show the same defensive signal. Viking reaches the attack ceiling, but its stronger-opponent attack residual is approximately neutral at `0.9910`.

### Europa League play-off clubs, 2024/25

`crete-lillestrom-trabzonspor-truidense-viktoriaplzen-2024-25.json` adds 85 domestic home matches for the five clubs in `europa.playoffs`: OFI Crete 16, Lillestrøm 15, Trabzonspor 18, Sint-Truiden 18, and Viktoria Plzeň 18. Belgian and Czech post-split fixtures are retained. Activating Trabzonspor also brings 40 existing archived observations into runtime scope, producing a 58-match profile with 55 domestic and 3 European matches.

| Club | Domestic attack | Domestic visiting-goal multiplier | Notable context |
|---|---:|---:|---|
| OFI Crete | 0.9945 | 1.1600 | Similar opponents: 1.0824 attack |
| Lillestrøm | 0.9219 | 1.1600 | Stronger opponents: 0.9705 attack |
| Trabzonspor | 1.1800 | 1.1399 | Europe attack: 0.9057; 58 total observations |
| Sint-Truiden | 1.1000 | 1.1600 | Similar opponents: 1.1228 attack |
| Viktoria Plzeň | 1.1341 | 1.1600 | Weaker opponents: 1.1550 attack |

OFI is nearly neutral overall but improves against similar opponents. Lillestrøm remains below its coefficient baseline. Trabzonspor reaches the attack ceiling domestically, while its European sample is below neutral. Sint-Truiden and Viktoria Plzeň show clear positive domestic attacking residuals. A visiting-goal multiplier above 1 means opponents scored above the coefficient baseline; it is not a defensive bonus.

### Conference League play-off clubs, 2024/25

`atalanta-brighton-freiburg-getafe-monaco-2024-25.json` adds 91 domestic home matches for the five clubs in `conference.playoffs`: Atalanta 19, Brighton & Hove Albion 19, SC Freiburg 17, Getafe 19, and AS Monaco 17. The primary OpenFootball JSON sources are validated against their complete league fixture volumes. Two final-round fixtures retained blank scores in those JSON files, so Atalanta 2-3 Parma and Getafe 1-2 Celta Vigo are completed from separately identified season sources.

| Club | Domestic attack | Domestic visiting-goal multiplier | Notable context |
|---|---:|---:|---|
| Atalanta | 1.0058 | 1.1600 | Similar opponents: 1.0353 attack |
| Brighton & Hove Albion | 1.1701 | 1.0693 | Stronger opponents: 1.1800 attack |
| SC Freiburg | 1.0554 | 1.1600 | Weaker opponents: 1.0826 attack |
| Getafe | 0.8400 | 0.9367 | Stronger opponents: 0.9579 attack |
| AS Monaco | 1.1574 | 1.1145 | Weaker opponents: 1.1448 attack |

Atalanta remains close to its coefficient baseline. Brighton and Monaco show strong positive attacking residuals, while Freiburg is moderately positive overall. Getafe reaches the attack floor but also shows a positive home defensive residual because its visiting-goal multiplier is below 1. A visiting-goal multiplier above 1 means opponents scored above baseline; it is not a defensive bonus.

### Champions League third qualifying-round clubs, 2024/25

`bodo-lyon-nec-olympiacos-spartapraha-union-2024-25.json` adds 102 domestic home matches for the six clubs in `champions.q3`: Bodø/Glimt 15, Olympique Lyonnais 17, NEC 17, Olympiacos 16, Sparta Praha 17, and Union Saint-Gilloise 20. Belgian and Czech championship-round matches remain included. Sparta has 17 rather than 18 home observations because its five-match championship group contained two home and three away fixtures.

| Club | Domestic attack | Domestic visiting-goal multiplier | Notable context |
|---|---:|---:|---|
| Bodø/Glimt | 1.1800 | 1.1600 | All 15 observations: weaker opponents |
| Olympique Lyonnais | 1.1210 | 1.1600 | Weaker opponents: 1.1236 attack |
| NEC | 1.1800 | 1.1544 | Stronger and similar opponents: 1.1800 attack |
| Olympiacos | 1.0039 | 1.1600 | All 16 observations: weaker opponents |
| Sparta Praha | 1.0200 | 1.1600 | Similar opponents: 1.0576 attack |
| Union Saint-Gilloise | 1.0924 | 0.8888 | Similar opponents: 0.8342 visiting goals |

Bodø/Glimt and NEC reach the attack ceiling, while Lyon and Union show clear positive domestic attacking residuals. Olympiacos and Sparta remain close to their coefficient baselines. Union also shows the strongest positive home defensive residual in this batch. Values above 1 in the visiting-goal column mean opponents scored above baseline; they are not defensive bonuses.

### Spain and Germany 2024/25

- `atleti-barcelona-2024-25.json`: 38 La Liga matches;
- `bayern-bvb-2024-25.json`: 34 Bundesliga matches;
- `leipzig-stuttgart-2024-25.json`: 34 Bundesliga matches.

Spanish opponents without a higher individual value use `19.409`; German opponents use `18.580`.

| Club | Domestic attack | Notable context |
|---|---:|---:|
| Atlético Madrid | 1.1061 | Similar opponents: 1.1184 |
| Barcelona | 1.1800 | Similar opponents: 1.1055 |
| Bayern München | 1.1800 | Similar opponents: 0.9930 |
| Borussia Dortmund | 1.1800 | Overall: 1.1710 |
| RB Leipzig | 1.0758 | Stronger opponents: 1.1707 |
| VfB Stuttgart | 1.1800 | Similar opponents: 0.9977 |

Leipzig remains below the general attack ceiling but shows a strong residual against stronger opponents. Its similar-opponent visiting-goal multiplier is `0.9400`, a positive home defensive signal for that context. Stuttgart reaches the domestic attack ceiling, while its similar-opponent residual is essentially neutral and its single weaker-opponent observation is not treated as a broad conclusion.

`leverkusen-hoffenheim-2024-25.json` adds 34 Bundesliga home matches for the guaranteed Europa League scope, 17 per club.

| Club | Domestic attack | Notable context |
|---|---:|---:|
| Bayer Leverkusen | 1.0482 | Weaker opponents: 1.0649 |
| Hoffenheim | 1.1800 | Stronger opponents: 1.1800 |

Leverkusen remains close to neutral against similar opponents at `0.9614`, while its similar-opponent visiting-goal multiplier is `1.1277`. Hoffenheim reaches the attack ceiling. Under the current coefficient snapshot, all 17 Hoffenheim league opponents fall into the stronger-opponent bucket, so no unsupported similar- or weaker-opponent effect is emitted.

The follow-up Spanish batch `real-betis-villarreal-2024-25.json` adds 57 more La Liga home matches, 19 per club.

| Club | Domestic attack | Notable context |
|---|---:|---:|
| Real Madrid | 1.0853 | Weaker opponents: 1.1217 |
| Real Betis | 0.9686 | Stronger opponents: 1.0752 |
| Villarreal | 1.1800 | Similar opponents: 1.0069 |

Real Madrid remains below the attack ceiling and is weaker than neutral against the two similar-strength observations at `0.9119`. Real Betis scores below its overall coefficient baseline but rises above it against stronger opponents; its similar-opponent visiting-goal multiplier is `0.9432`. Villarreal reaches the domestic attack ceiling, while its similar-opponent attack residual is approximately neutral. The project keeps the historical runtime slug `villareal` for compatibility, while display text and source records use the correct club name.

`celta-sociedad-2024-25.json` adds all 38 La Liga home matches for two guaranteed Europa League clubs, 19 per club.

| Club | Domestic attack | Notable context |
|---|---:|---:|
| Celta Vigo | 1.1800 | Stronger opponents: 1.1800 |
| Real Sociedad | 0.8400 | Similar opponents: 1.0061 |

Celta reaches the attack ceiling but also has a positive home defensive signal, with a domestic visiting-goal multiplier of `0.9591` and `0.9288` against stronger opponents. Real Sociedad reaches the conservative attack floor overall; however, its similar-opponent attack value is neutral and its corresponding visiting-goal multiplier is `0.8691`. Neither club has weaker-opponent observations under the current coefficient snapshot.

### France 2024/25

`lens-lille-psg-2024-25.json` contains every Ligue 1 home match for Lens, Lille, and Paris Saint-Germain, 17 per club and 51 total. Scores come from OpenFootball's complete 306-match Ligue 1 season file. Strength values use the project's 2026 UEFA coefficient snapshot; French opponents without a higher individual coefficient use the `16.699` association floor. Historical pot values remain neutral at `1`.

| Club | Domestic attack | Notable context |
|---|---:|---:|
| Lens | 0.9374 | Stronger opponents: 1.1007 |
| Lille | 0.9966 | Similar opponents: 0.9750 |
| Paris Saint-Germain | 1.1445 | Weaker opponents: 1.1445 |

Lens scored below the coefficient baseline overall but above it against stronger opponents. Its stronger-opponent visiting-goal multiplier is `0.9804`, a small positive home defensive effect in that context. Lille is approximately neutral overall, while Paris Saint-Germain shows a strong domestic attacking residual. All PSG league opponents fall into the weaker-opponent bucket under the current coefficient snapshot, so no unsupported similar- or stronger-opponent effect is emitted.

`marseille-rennes-2024-25.json` adds all 34 Ligue 1 home matches for two guaranteed Europa League clubs, 17 per club.

| Club | Domestic attack | Notable context |
|---|---:|---:|
| Marseille | 1.1800 | Similar opponents: 1.1700 |
| Rennes | 0.9583 | Weaker-opponent visiting-goal multiplier: 0.8610 |

Marseille reaches the conservative attack ceiling overall and against weaker opponents, while its single stronger-opponent observation is below neutral at `0.9323`. Rennes remains slightly below its coefficient baseline in attack, but the `0.8610` visiting-goal multiplier against weaker opponents indicates a strong positive home defensive effect in that context.

### Portugal 2024/25

`porto-sporting-2024-25.json` contains every Primeira Liga home match for Porto and Sporting CP, 17 per club and 34 total. Scores come from OpenFootball's complete 306-match Primeira Liga season file. Strength values use the project's 2026 UEFA coefficient snapshot; Portuguese opponents without a higher individual coefficient use the `14.633` association floor. Historical pot values remain neutral at `1`.

| Club | Domestic attack | Notable context |
|---|---:|---:|
| Porto | 1.1002 | Weaker opponents: 1.1157 |
| Sporting CP | 1.1129 | Weaker opponents: 1.1303 |

Porto remains below the attack ceiling and is approximately neutral against similar-strength opponents at `0.9779`. Its weaker-opponent visiting-goal multiplier is `0.8311`, a strong positive home defensive signal in that context. Sporting is also below the ceiling; its similar-opponent attack residual is `0.9754`, while the corresponding visiting-goal multiplier is `0.8817`.

The final batch also contains all 17 Torreense Segunda Liga home matches. The pinned OpenFootball file provides scores through matchday 26; four later home results are completed from official Liga Portugal match records and carry a separate source key.

| Club | Domestic attack | Notable context |
|---|---:|---:|
| Torreense | 1.0528 | Similar opponents: 1.0241 |

Torreense scores modestly above its coefficient baseline. Its domestic visiting-goal multiplier is `1.1549`, so this sample does not show a positive home defensive residual. No weaker-opponent observation exists under the current coefficient snapshot.

### Ukraine and Czechia 2024/25

`shakhtar-slavia-2024-25.json` contains all 15 Shakhtar Donetsk Ukrainian Premier League home matches and all 18 Slavia Prague Czech First League home matches. Slavia's records include its three championship-round home fixtures. Ukrainian opponents without a higher individual coefficient use the `5.182` association floor; Czech opponents use `9.705`.

| Club | Domestic attack | Notable context |
|---|---:|---:|
| Shakhtar Donetsk | 1.1538 | Weaker opponents: 1.1538 |
| Slavia Prague | 1.1747 | Domestic visiting-goal multiplier: 0.8200 |

All Shakhtar league opponents fall into the weaker-opponent bucket under the current coefficient snapshot, so no unsupported similar- or stronger-opponent effect is emitted. Slavia remains just below the attack ceiling and combines that signal with a visiting-goal multiplier at the conservative `0.82` floor. Its similar-opponent attack value is `1.0413`, while the broader weaker-opponent attack value is `1.1654`.

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

Napoli's attack residual is approximately neutral, but its `0.9089` visiting-goal multiplier indicates a positive home defensive effect in this sample.

`juventus-milan-2024-25.json` adds all 38 Serie A home matches for two guaranteed Europa League clubs, 19 per club.

| Club | Domestic attack | Notable context |
|---|---:|---:|
| Juventus | 0.9539 | Similar opponents: 0.8521 |
| Milan | 0.9424 | Similar opponents: 0.8400 |

Juventus and Milan both score below their coefficient baselines at home in this season. Juventus rises to `1.0256` against weaker opponents and has a positive home defensive signal against its single stronger-opponent observation at `0.9277`. Milan also rises above neutral against weaker opponents at `1.0328`, while its similar-opponent attack value reaches the conservative `0.84` floor. The values remain residuals after coefficient adjustment, not raw league rankings.

### Netherlands 2024/25

`feyenoord-psv-2024-25.json` contains all 34 Eredivisie home matches for Feyenoord and PSV, 17 per club. `azalkmaar-2024-25.json` adds all 17 AZ Alkmaar home matches as the first guaranteed Europa League profile. Results come from OpenFootball's complete 306-match Eredivisie season file. Club and opponent strength values use the project's 2026 UEFA coefficient snapshot.

| Club | Domestic attack | Notable context |
|---|---:|---:|
| AZ Alkmaar | 0.9596 | Similar opponents: 0.9385 |
| Feyenoord | 1.0988 | Similar opponents: 1.0202 |
| PSV | 1.1800 | Similar opponents: 1.0140 |

AZ scores slightly below its coefficient baseline, with an overall attack residual of `0.9668` and a weaker-opponent value of `0.9843`. PSV reaches the conservative attack ceiling, while Feyenoord remains below it with an overall attack residual of `1.0812`.

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


<!-- champions-q2-batch1 -->
## Active-scope extension: Champions Q2 batch 1

The active priority order now continues from `champions.q3` into `champions.q2`. The first Q2 data batch covers AGF Aarhus, Ararat-Armenia, NK Celje, Crvena Zvezda, and Dinamo Zagreb. Fenerbahçe's previously stored profile is also reactivated; remaining Q2 clubs stay on the research queue and retain neutral fallback until sourced.
