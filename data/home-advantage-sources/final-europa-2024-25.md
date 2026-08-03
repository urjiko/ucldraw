# Sunderland and Torreense 2024/25 home-profile sources

## Sunderland

- Competition: English Championship 2024/25
- Source: OpenFootball Football.JSON, `2024-25/en.2.json`
- Source URL: `https://raw.githubusercontent.com/openfootball/football.json/master/2024-25/en.2.json`
- Complete source competition: 552 regular-season matches plus five promotion play-off matches
- Included Sunderland records: 24
  - 23 regular-season home matches
  - one home promotion play-off semifinal on 13 May 2025
- Neutral Wembley final: excluded from home-match treatment
- Opponent fallback coefficient: England association floor `23.903`

## Torreense

- Competition: Portuguese Segunda Liga 2024/25
- Pinned OpenFootball schedule/results source: `openfootball/europe` commit `e27eb01726f394ddf9fa68b15d37b900487b5903`, file `portugal/2024-25_pt2.txt`
- Pinned source URL: `https://raw.githubusercontent.com/openfootball/europe/e27eb01726f394ddf9fa68b15d37b900487b5903/portugal/2024-25_pt2.txt`
- The pinned file declares all 306 fixtures but supplies 234 final scores through matchday 26.
- Thirteen Torreense home results come from that pinned source.
- Four later Torreense home results come from official Liga Portugal match records:
  - 30 March 2025: Torreense 2-4 FC Porto B, `https://www.ligaportugal.pt/match/20242025/ligaportugalmeusuper/27/4`
  - 13 April 2025: Torreense 1-1 FC Felgueiras, `https://www.ligaportugal.pt/match/20242025/ligaportugalmeusuper/29/3`
  - 26 April 2025: Torreense 2-2 Marítimo, `https://www.ligaportugal.pt/match/20242025/ligaportugalmeusuper/31/4`
  - 11 May 2025: Torreense 3-2 Leixões, `https://www.ligaportugal.pt/match/20242025/ligaportugalmeusuper/33/5`
- Included Torreense records: 17
- Opponent fallback coefficient: Portugal association floor `14.633`

The normalized records are stored in `data/home-advantage-matches/sunderland-torreense-2024-25.json`. The four official Liga Portugal complements use `sourceKey: liga-portugal-official-2024-25`; other Portuguese records retain the OpenFootball source key. Historical pot fields remain neutral at `1`. Generated multipliers are deterministic outputs of `scripts/build-home-advantage-profiles.mjs`.
