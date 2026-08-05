# 2026/27 qualification bracket snapshot

This project resolves the three UEFA league-phase rosters from one connected qualification tree instead of independently sampling clubs from `q2`, `q3`, and `playoffs` folders.

Snapshot date: **2026-08-05**.

## League-phase composition

- Champions League: 29 direct entrants + 7 Champions League play-off winners.
- Europa League: 13 direct entrants + 4 Champions League league-path Q3 losers + 7 Champions League play-off losers + 12 Europa League play-off winners.
- Conference League: 12 Europa League play-off losers + 24 Conference League play-off winners.

The same club is therefore never allowed to appear in more than one league phase.

## Draw sources

Official third qualifying round draws:

- Champions League: https://www.uefa.com/uefachampionsleague/news/02a7-211a524fc0ef-eb55dc7dccd8-1000--uefa-champions-league-third-qualifying-round-draw/
- Europa League: https://www.uefa.com/uefaeuropaleague/news/02a7-211a52dae2c1-7f4984de0afd-1000--uefa-europa-league-third-qualifying-round-draw/
- Conference League: https://www.uefa.com/uefaconferenceleague/news/02a7-211a532e4696-3c0037cb8ac0-1000--uefa-conference-league-third-qualifying-round-draw/

Play-off draw result transcriptions used to connect the already resolved Q3 participants:

- Champions League: https://www.reddit.com/r/soccer/comments/1ve9d3b/uefa_champions_league_playoff_round_draw_results/
- Europa League: https://www.reddit.com/r/soccer/comments/1veak4g/uefa_europa_league_playoff_round_draw_results/
- Conference League: https://www.reddit.com/r/soccer/comments/1vebxiq/uefa_conference_league_playoff_round_draw_results/

## Simulation rule

Each unresolved tie is simulated once in dependency order. The winner and loser are then passed to the exact next node in the bracket. UEFA club coefficients provide the strength signal, transformed into a bounded win probability so upsets remain possible.

The bracket distinguishes clubs that previously shared misleading local slugs, including:

- Kauno Žalgiris and FK Žalgiris
- Hapoel Beer-Sheva and Hapoel Tel Aviv
- PFC CSKA Sofia and CSKA 1948
- Iberia 1999 Tbilisi and Dinamo Tbilisi

When official results are known, the relevant tie can be pinned or replaced without rebuilding the downstream structure.
