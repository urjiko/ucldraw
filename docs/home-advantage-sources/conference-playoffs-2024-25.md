# Conference playoff domestic home data, 2024/25

This batch adds complete domestic home seasons for the five clubs listed under `conference.playoffs` in `generated-team-pools.js`.

## Coverage

| Club | Competition | Home matches |
|---|---|---:|
| Atalanta | Italian Serie A 2024/25 | 19 |
| Brighton & Hove Albion | English Premier League 2024/25 | 19 |
| SC Freiburg | German Bundesliga 2024/25 | 17 |
| Getafe | Spanish La Liga 2024/25 | 19 |
| AS Monaco | French Ligue 1 2024/25 | 17 |

The 91 normalized records are stored in `data/home-advantage-matches/atalanta-brighton-freiburg-getafe-monaco-2024-25.json`.

## Sources and validation

- The five primary fixture sources are OpenFootball Football.JSON files for Italy, England, Germany, Spain, and France.
- Source league volumes are validated at 380, 380, 306, 380, and 306 matches respectively.
- The Football.JSON files leave two final-round scores blank despite retaining the fixtures.
- Atalanta 2-3 Parma on 25 May 2025 is completed from OpenFootball's full `2024-25/1-seriea.txt` season file and stored with `openfootball-italy-complete-2024-25`.
- Getafe 1-2 Celta Vigo on 24 May 2025 is completed from the season match export for Getafe and stored with `transfermarkt-getafe-2024-25`.
- These supplemental records remain separately identifiable instead of being silently folded into the primary source label.

## Pinned strength values

Target-club coefficients use the generated 2026 project snapshot:

- Atalanta: `84.000`;
- Brighton & Hove Albion: `16.000`;
- SC Freiburg: `56.500`;
- Getafe: `19.409`;
- AS Monaco: `56.000`.

Unmatched opponents use the established association floors:

- Italy: `19.989`;
- England: `23.903`;
- Germany: `18.580`;
- Spain: `19.409`;
- France: `16.699`.

Historical pot fields remain neutral at `1`.
