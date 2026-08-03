# Europa playoff domestic home data, 2024/25

This batch adds complete domestic home seasons for the five clubs listed under `europa.playoffs` in `generated-team-pools.js`.

## Coverage

| Club | Competition | New home matches |
|---|---|---:|
| OFI Crete | Greek Super League 2024/25 | 16 |
| Lillestrøm | Norwegian Eliteserien 2024 | 15 |
| Trabzonspor | Turkish Süper Lig 2024/25 | 18 |
| Sint-Truiden | Belgian First Division A 2024/25 | 18 |
| Viktoria Plzeň | Czech First League 2024/25 | 18 |

The 85 normalized records are stored in `data/home-advantage-matches/crete-lillestrom-trabzonspor-truidense-viktoriaplzen-2024-25.json`.

## Sources and validation

- OFI Crete: OpenFootball Football.JSON, `2024-25/gr.1.json`, validated against all 236 source matches.
- Lillestrøm: OpenFootball Europe, `norway/2024_no1.txt`, validated against all 240 source matches.
- Trabzonspor: OpenFootball Football.JSON, `2024-25/tr.1.json`, validated against all 342 source matches.
- Sint-Truiden: OpenFootball Football.JSON, `2024-25/be.1.json`, validated against all 313 source matches.
- Viktoria Plzeň: OpenFootball Europe, `czech-republic/2024-25_cz1.txt`, validated against all 276 source matches.

Belgian and Czech post-split fixtures remain included. Full-time results are not discarded merely because they belong to placement, championship, or relegation stages.

## Pinned strength values

Target-club coefficients use the generated 2026 project snapshot:

- OFI Crete: `9.682`;
- Lillestrøm: `2.000`;
- Trabzonspor: `11.000`;
- Sint-Truiden: `12.450`;
- Viktoria Plzeň: `50.500`.

Unmatched opponents use association floors already pinned by existing project data:

- Greece: `9.682`;
- Norway: `8.247`;
- Türkiye: `10.375`;
- Belgium: `12.450`;
- Czechia: `9.705`.

Historical pot fields remain neutral at `1`. Activating Trabzonspor also activates 40 existing archived observations, so its generated profile contains 58 total matches rather than only the 18 newly added fixtures.
