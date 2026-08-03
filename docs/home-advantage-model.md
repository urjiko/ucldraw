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

The archive contains 423 verified home matches. The guaranted-team filter currently includes 311 matches across 15 active profiles:

- Galatasaray: 48;
- Arsenal, Aston Villa, AtlÃ©tico Madrid, Barcelona, Como, Internazionale, Liverpool, Manchester City, Manchester United, Napoli, and Roma: 19 each;
- Bayern MÃ¼nchen and Borussia Dortmund: 17 each;
- Club Brugge: 20, including the championship play-off round.

The remaining 112 archived records are retained but excluded from runtime generation. The next missing guaranteed Champions League club is Feyenoord.

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

Spanish opponents without a higher individual value use `19.409`; German opponents use `18.580K‚‚ŸÛXˆÛY\İXÈ]XÚÈŸKK_KKNŸŸ]0ê]XÛÈXYšYKŒLŒHŸ˜\˜Ù[Û˜HKŒNŸ˜^Y\›ˆpï˜Ú[ˆKŒNŸ›Ü\ÜÚXHÜ][™KŒN‚˜\˜Ù[Û˜K˜^Y\›‹[™Ü][™™XXÚHÛÛœÙ\˜]]™H]XÚÈÙZ[[™Ëˆ˜^Y\›ˆ™[XZ[œÈ\›Ş[X][H™]]˜[YØZ[œİÚ[Z[\‹\İ™[™İÜÛ™[È]NLÌÚ[H]0ê]XÛÉÜÈÚ[Z[\‹[ÜÛ™[˜[YH\ÈKŒLN‚‚ˆÈÈÈ™[Ú][HŒÌB‚˜œYÙÙKLŒLKšœÛÛ˜ÛÛZ[œÈ[ŒÛXˆœYÙÙHXYİYHÛYHX]Ú\Ë[˜ÛY[™Èš]™HÚ[\[ÛœÚ\^K[Ù™ˆš^\™\Ëˆ™[ÚX[ˆÜÛ™[ÈÚ]İ]HYÚ\ˆ[™]šYX[ÛÙY™šXÚY[\ÙHL‹L‚‚ŸÛÛ^][\Y\ˆŸKK_KKNŸŸÛY\İXÈ]XÚÈKŒLMŸİ™\˜[]XÚÈKŒMÍŸÙXZÙ\‹[ÜÛ™[]XÚÈKŒLMŸÛY\İXÈš\Ú][™ËYÛØ[][\Y\ˆKŒMŒ‚[ŒÛY\İXÈÜÛ™[È˜[[ÈHÙXZÙ\‹[ÜÛ™[XÚÙ][™\ˆHİ\œ™[ÛÙY™šXÚY[Û˜\Úİˆ›È[œİ\ÜYÚ[Z[\‹HÜˆİ›Û™Ù\‹[ÜÛ™[Y™™Xİ\È[™[Y‚‚ˆÈÈÈ][HŒÌB‚˜ÛÛ[ËZ[\‹[˜\ÛK\›ÛXKLŒLKšœÛÛ˜ÛÛZ[œÈ]™\HÙ\šYHHÛYHX]Ú›ÜˆÛÛ[Ë[\›˜^š[Û˜[K˜\ÛK[™›ÛXKNH\ˆÛXˆ[™Íˆİ[ˆØÛÜ™\ÈÛÛYHœ›ÛHHÜ[‘›Ûİ˜[][HŒÌHÙ\šYHH]\Ù]ˆİ™[™İ˜[Y\È\ÙHH›Ú™Xİ	ÜÈŒˆQQHÛÙY™šXÚY[Û˜\ÚİÈ][X[ˆÜÛ™[ÈÚ]İ]HYÚ\ˆ[™]šYX[ÛÙY™šXÚY[\ÙHHNKNX\ÜÛØÚX][Ûˆ›ÛÜ‹ˆ\İÜšXØ[İ˜[Y\È™[XZ[ˆ™]]˜[]X‚‚ŸÛXˆÛY\İXÈ]XÚÈ›İX›HÛÛ^ŸKK_KKNŸKKNŸŸÛÛ[ÈKŒŒŒİ›Û™Ù\ˆÜÛ™[ÎˆKŒˆŸ[\›˜^š[Û˜[HKŒLÈÙXZÙ\ˆÜÛ™[ÎˆKŒLÈŸ˜\ÛHNÌÈÛY\İXÈš\Ú][™ËYÛØ[][\Y\ˆLHŸ›ÛXHKŒMÌÙXZÙ\ˆÜÛ™[ÎˆKŒLÌÈ‚“˜\ÛIÜÈ]XÚÈ™\ÚYX[\È\›Ş[X][H™]]˜[]]ÈLXš\Ú][™ËYÛØ[][\Y\ˆ[™XØ]\ÈHÜÚ]]™HÛYHY™[œÚ]™HY™™Xİ[ˆ\ÈØ[\KˆÛÛ[È\È›İİ›Û™Ù\‹H[™Ú[Z[\‹[ÜÛ™[ØœÙ\˜][ÛœÎÈ[\ˆ[™›ÛXH\™Hš]™[ˆ[ÜİHHÙXZÙ\‹[ÜÛ™[X]Ú\È™XØ]\ÙHÙˆZ\ˆYÚ\ˆÛÙY™šXÚY[Ë‚‚ˆÈÈ[\œ™]][Û‚‚•H˜[Y\È\™H™\ÚYX[][\Y\œÈY\ˆH^\İ[™ÈQQKXÛÙY™šXÚY[^XİYYÛØ[[Ù[›İ˜]ÈÛØ[˜]\ÈÜˆİXš™Xİ]™HÛXˆ˜][™ÜË‚‚‹H]XÚÈX›İ™HKŒYX[œÈHÛYHÛXˆØÛÜ™YX›İ™HHÛÙY™šXÚY[˜\Ù[[™K‚‹H]XÚÈ™[İÈKŒYX[œÈ]ØÛÜ™Y™[İÈ][™XYKXY\İY˜\Ù[[™K‚‹HHšY[˜[YYY™[œÙX][\Y\ÈHš\Ú][™ÈX[IÜÈ^XİYÛØ[Ë‚‹HHš\Ú][™ËYÛØ[][\Y\ˆ™[İÈKŒ\ÈHÜÚ]]™HÛYHY™[œÚ]™HY™™Xİ‚‹HH˜[YHX›İ™HKŒYX[œÈš\Ú]ÜœÈØÛÜ™YX›İ™HH˜\Ù[[™K‚‚”Ú[™ÛK\ÙX\ÛÛˆY™™XİÈ\™HÚ[šÈİØ\™™]]˜[[™Û[\Yˆ]XÚÈ\È›İ[™YÈ8 $ÌKŒNÈš\Ú][™ËYÛØ[Y™™XİÈ\™H›İ[™YÈ¸ $ÌKŒM˜‚‚ˆÈÈš[\Â‚‹HÙ[™\˜]Y]X[K\ÛÛËšœØˆİX\˜[YY]X[HÛİ\˜ÙHÙˆ]Â‹H]KÚÛYKXY˜[YÙK[X]Ú\ËšœÛÛ˜ˆÜšYÚ[˜[Ûİ\˜ÙH˜]ÚÂ‹H]KÚÛYKXY˜[YÙK[X]Ú\ËÊ‹šœÛÛ˜ˆ[Ù[\ˆÛXˆ[™ÙX\ÛÛˆ˜]Ú\ÎÂ‹HØÜš\ËØZ[ZÛYKXY˜[YÙK\›Ùš[\Ë›ZœØˆ˜[Y][Û‹š[\š[™ËÙ[™\˜][Û‹[™]Y]YHÜ™\š[™ÎÂ‹HÙ[™\˜]YZÛYKXY˜[YÙK\›Ùš[\ËšœØˆ]\›Z[š\İXÈ[[YH^[ØYÂ‹H™YXİ[Û‹XZKXÛÛ›Û\‹šœØˆ^XİYYÛØ[Y\İY[^Y\Â‹H\İËÚÛYKXY˜[YÙK[[Ù[\İšœØˆ\˜Ú]™KØÛÜK˜[Y\Ë˜[˜XÚË[™™\›ÙXÚXš[]HÚXÚÜË‚‚ˆÈÈY]Ù‚ŒKˆØY]™\HİÜ™YX]Ú[™™Z™Xİ\XØ]\Ë‚Œ‹ˆ™XYİX\˜[YYÚ[\[ÛœÈ[™İX\˜[YY]\›ÜHÛYÜÈœ›ÛHHX[šY™\İ‚ŒËˆÙY\Û›HX]Ú\ÈÚÜÙHÛYHÛXˆ™[Û™ÜÈÈÜÙHÜ›İ\Ë‚ˆ™\Ù\™HH[\˜Ú]™IÜÈ]\İ]H\ÈH™XÙ[˜ŞH[˜ÚÜ‹‚Kˆ™XÜ™X]H˜\ÙH^XİYÛØ[Èœ›ÛHQQHÛÙY™šXÚY[Ë‚‹ˆYX\İ\™HÛYHØÛÜš[™È[™š\Ú][™ÈØÛÜš[™È™\ÚYX[ÈÙ\\˜][K‚ËˆÜ]ÛY\İXË]\›ÜX[‹İ›Û™Ù\‹Ú[Z[\‹[™ÙXZÙ\‹[ÜÛ™[ÛÛ^Ë‚ˆ\HH™YK^YX\ˆ™XÙ[˜ŞH[‹[Y™H[™Ø[\K\Ú^™HÚš[šØYÙK‚KˆÛ[\]XÚÈ[™š\Ú][™ËYÛØ[Y™™XİÈÈHØY™]H›İ[™Ë‚ŒLˆ[Z]Z\ÜÚ[™ÈX[\È[ˆÚ[\[ÛœËYİX\˜[YY[ˆ]\›ÜKYİX\˜[YYÜ™\‹‚‚ˆÈÈ[[YH™Z]š[Ü‚‚‹HÛXœÈÚ]Ù[™\˜]Y›Ùš[\È™XÙZ]™HÛÛ^X[^XİYYÛØ[Y\İY[Ë‚‹HİX\˜[YYÛXœÈÚ]İ]]H™]Z[ˆH™]š[İ\ÈÛÙY™šXÚY[[™ÙYYYÚ\ÜÛÛˆ[Ù[‚‹HÛXœÈİ]ÚYHHXİ]™HİX\˜[YYØÛÜH™XÙZ]™H›È[[YH›Ùš[K]™[ˆÚ[ˆ\˜Ú]™Y]H^\İË‚‹H˜]ÈÛÛœİXİ[Û‹]X[YšXØ][Ûˆ]ËÛÙY™šXÚY[ÛÜ[™Ë[™]\›Z[š\İXÈÙYYÈ™[XZ[ˆ[˜Ú[™ÙY‚‚ˆÈÈ\]HÛÛ[X[™‚˜˜\Ú››ÙHØÜš\ËØZ[ZÛYKXY˜[YÙK\›Ùš[\Ë›ZœÂ˜‚•Hİ]]]\İ™[XZ[ˆ]KY›Ü‹X]H[˜Ú[™ÙYÚ[ˆ™Z]\ˆHX]Ú\˜Ú]™H›ÜˆHİX\˜[YY]X[HX[šY™\İÚ[™Ù\Ë‚