# Champions playoff domestic home data, 2024/25

This batch adds complete domestic home seasons for the four clubs currently listed under `champions.playoffs` in `generated-team-pools.js`. Generation fails unless all 68 expected target fixtures are present and unique. This group follows the two completed guaranteed-team groups in runtime priority.

## Coverage

| Club | Competition | Home matches |
|---|---|---:|
| AEK Athens | Greek Super League 2024/25 | 16 |
| Celtic | Scottish Premiership 2024/25 | 19 |
| LASK | Austrian Bundesliga 2024/25 | 18 |
| Viking | Norwegian Eliteserien 2024 | 15 |

The 68 normalized records are stored in `data/home-advantage-matches/aek-celtic-lask-viking-2024-25.json`.

## Match sources

- AEK Athens: OpenFootball Football.JSON, `2024-25/gr.1.json`.
- Celtic: OpenFootball Football.JSON, `2024-25/sco.1.json`.
- LASK: OpenFootball Football.JSON, `2024-25/at.1.json`.
- Viking: OpenFootball Europe, `norway/2024_no1.txt`.

The LASK sample includes the full league programme plus its two home European-place play-off fixtures against Hartberg and Rapid Wien. No domestic match with a recorded full-time result is discarded merely because it belongs to a post-split or placement round.

## Strength values

Target-club coefficients use the project's generated 2026 UEFA snapshot:

- AEK Athens: `24.000`;
- Celtic: `44.000`;
- LASK: `21.000`;
- Viking: `4.500`.

Opponent values use an individual coefficient when it can be matched in the same 2026 ranking. Otherwise the association floor parsed from that snapshot is used:

- Greece: `9.682`;
- Scotland: `6.410`;
- Austria: `6.770`;
- Norway: `8.247`.

Historical pot fields remain neutral at `1` because these are domestic observations used to estimate residual home effects, not reconstructed UEFA draws. The generated runtime payload is checked byte-for-byte from the stored records.
