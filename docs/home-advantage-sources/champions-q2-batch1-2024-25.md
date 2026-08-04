# Champions League Q2 domestic home data, batch 1 (2024/25)

This batch opens the `champions.q2` priority scope and adds complete domestic home seasons for its first five clubs. Fenerbahçe already has a stored domestic profile and becomes active automatically when the Q2 group enters scope.

## Coverage

| Club | Competition | Home matches | Source matches | Association floor |
|---|---|---:|---:|---:|
| AGF Aarhus | Danish Superliga 2024/25 | 16 | 193 | 8.421 |
| Ararat-Armenia | Armenian Premier League 2024/25 | 15 | 165 | 3.012 |
| NK Celje | Slovenian First League 2024/25 | 18 | 180 | 4.893 |
| Crvena Zvezda | Serbian Super League 2024/25 | 19 | 296 | 5.150 |
| Dinamo Zagreb | Croatian HNL 2024/25 | 18 | 180 | 5.631 |

The 86 normalized records are stored in `data/home-advantage-matches/aarhus-ararat-celje-crvenazvezda-dinamo-2024-25.json`. Awarded results are excluded because the model requires a played score.

## Sources and validation

- AGF Aarhus: OpenFootball Europe, `denmark/2024-25_dk1.txt`, 193 declared matches.
- Ararat-Armenia: OpenFootball Europe, `armenia/2024-25_am1.txt`, 165 declared matches.
- NK Celje: OpenFootball Europe, `slovenia/2024-25_si1.txt`, 180 declared matches.
- Crvena Zvezda: OpenFootball Europe, `serbia/2024-25_rs1.txt`, 296 declared matches.
- Dinamo Zagreb: OpenFootball Europe, `croatia/2024-25_hr1.txt`, 180 declared matches.

Target clubs and any matched project opponents use the pinned 2026 UEFA coefficient snapshot. Other domestic opponents use the corresponding association floor shown above. Historical pot fields remain neutral at `1`.
