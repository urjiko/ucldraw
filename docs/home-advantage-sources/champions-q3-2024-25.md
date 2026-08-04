# Champions League Q3 domestic home data, 2024/25

This batch adds complete domestic home seasons for the six clubs listed under `champions.q3` in `generated-team-pools.js`.

## Coverage

| Club | Competition | Home matches |
|---|---|---:|
| Bodø/Glimt | Norwegian Eliteserien 2024 | 15 |
| Olympique Lyonnais | French Ligue 1 2024/25 | 17 |
| NEC | Netherlands Eredivisie 2024/25 | 17 |
| Olympiacos | Greek Super League 2024/25 | 16 |
| Sparta Praha | Czech First League 2024/25 | 17 |
| Union Saint-Gilloise | Belgian First Division A 2024/25 | 20 |

The 102 normalized records are stored in `data/home-advantage-matches/bodo-lyon-nec-olympiacos-spartapraha-union-2024-25.json`. Czech and Belgian post-split championship fixtures remain included.

## Sources and validation

- Bodø/Glimt: OpenFootball Europe, `norway/2024_no1.txt`, 240 matches.
- Olympique Lyonnais: OpenFootball Football.JSON, `2024-25/fr.1.json`, 306 matches.
- NEC: OpenFootball Football.JSON, `2024-25/nl.1.json`, 306 matches.
- Olympiacos: OpenFootball Football.JSON, `2024-25/gr.1.json`, 236 matches.
- Sparta Praha: OpenFootball Europe, `czech-republic/2024-25_cz1.txt`, 276 matches.
- Union Saint-Gilloise: OpenFootball Football.JSON, `2024-25/be.1.json`, 313 matches.

Target clubs use the pinned 2026 UEFA coefficient snapshot. Unmatched opponents use association floors: Norway `8.247`, France `16.699`, Netherlands `15.166`, Greece `9.682`, Czechia `9.705`, and Belgium `12.450`. Historical pot fields remain neutral at `1`.
