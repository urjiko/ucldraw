(() => {
  'use strict';

  if (window.UCLDRAW_QUALIFICATION_BRACKET) return;

  const coefficientData = window.UCLDRAW_CLUB_COEFFICIENTS || { clubs: {} };
  const TEAM_ROWS = `dinamo|Dinamo Zagreb|CRO|champions|q2|dinamo|dinamo
kaunozalgiris|Kauno Žalgiris|LTU|champions|q2|zalgiris|zalgiris
mjallby|Mjällby|SWE|champions|q2|mjallby|mjallby
slovanbratislava|Slovan Bratislava|SVK|champions|q2|slovanbratislava|slovanbratislava
levskisofia|Levski Sofia|BUL|champions|q2|levskisofia|levskisofia
kairat|Kairat Almaty|KAZ|champions|q2|kairat|kairat
aarhus|AGF Aarhus|DEN|champions|q2|aarhus|aarhus
sabah|Sabah|AZE|champions|q2|sabah|sabah
ararat|Ararat-Armenia|ARM|champions|q2|ararat|ararat
celje|Celje|SVN|champions|q2|celje|celje
hapoelbeersheva|Hapoel Be'er Sheva|ISR|champions|q2|hapoelbeersheva|hapoelbeersheva
crvenazvezda|Crvena zvezda|SRB|champions|q2|crvenazvezda|crvenazvezda
olympiacos|Olympiacos|GRE|champions|q3|olympiacos|olympiacos
nec|NEC Nijmegen|NED|champions|q3|nec|nec
union|Union SG|BEL|champions|q3|union|union
bodo|Bodø/Glimt|NOR|champions|q3|bodo|bodo
fenerbahce|Fenerbahçe|TUR|champions|q2|fenerbahce|fenerbahce
strumgraz|Sturm Graz|AUT|champions|q2|strumgraz|strumgraz
spartapraha|Sparta Praha|CZE|champions|q3|spartapraha|spartapraha
lyon|Lyon|FRA|champions|q3|lyon|lyon
aek|AEK Athens|GRE|champions|playoffs|aek|aek
celtic|Celtic|SCO|champions|playoffs|celtic|celtic
lask|LASK|AUT|champions|playoffs|lask|lask
viking|Viking|NOR|champions|playoffs|viking|viking
larne|Larne|NIR|europa|q3|larne|larne
iberia1999|Iberia 1999 Tbilisi|GEO|europa|q3|tblisi|tblisi
lincoln|Lincoln Red Imps|GIB|-|-|-|lincoln
omonia|Omonia|CYP|europa|q3|omonia|omonia
kuopio|KuPS|FIN|-|-|-|kuopio
craiova|Universitatea Craiova|ROU|europa|q3|craiova|craiova
shamrockrovers|Shamrock Rovers|IRL|-|-|-|shamrockrovers
egnatia|Egnatia|ALB|-|-|-|egnatia
poznan|Lech Poznań|POL|europa|q3|poznan|poznan
klaksvik|KÍ Klaksvík|FRO|europa|q3|klaksvik|klaksvik
thun|Thun|SUI|-|-|-|thun
vikingurreykjavik|Víkingur Reykjavík|ISL|europa|q3|vikingurreykjavik|vikingurreykjavik
hradeckralove|Hradec Králové|CZE|europa|q2|hradeckralove|hradeckralove
besiktas|Beşiktaş|TUR|europa|q2|besiktas|besiktas
jagiellonia|Jagiellonia Białystok|POL|europa|q3|jagiellonia|jagiellonia
rangers|Rangers|SCO|europa|q3|rangers|rangers
paok|PAOK|GRE|europa|q2|paok|paok
anderlecht|Anderlecht|BEL|europa|q2|anderlecht|anderlecht
pafos|Pafos|CYP|europa|q2|pafos|pafos
salzburg|Red Bull Salzburg|AUT|europa|q3|salzburg|salzburg
benfica|Benfica|POR|europa|q2|benfica|benfica
hearts|Heart of Midlothian|SCO|-|-|-|hearts
maccabitelaviv|Maccabi Tel Aviv|ISR|europa|q2|maccabitelaviv|maccabitelaviv
cskasofia|CSKA Sofia|BUL|europa|q2|cskasofia|cskasofia
ferencvarosi|Ferencváros|HUN|europa|q2|ferencvarosi|ferencvarosi
gornikzabrze|Górnik Zabrze|POL|europa|q3|gornikzabrze|gornikzabrze
trabzonspor|Trabzonspor|TUR|europa|playoffs|trabzonspor|trabzonspor
truidense|Sint-Truiden|BEL|europa|playoffs|truidense|truidense
viktoriaplzen|Viktoria Plzeň|CZE|europa|playoffs|viktoriaplzen|viktoriaplzen
lillestrom|Lillestrøm|NOR|europa|playoffs|lillestrom|lillestrom
crete|OFI Crete|GRE|europa|playoffs|crete|crete
fiori|Tre Fiori|SMR|conference|q3|fiori|fiori
drita|Drita|KOS|conference|q3|drita|drita
borac|Borac Banja Luka|BIH|conference|q3|borac|borac
vitebsk|Vitebsk|BLR|conference|q3|vitebsk|vitebsk
tallinn|Flora Tallinn|EST|conference|q3|tallinn|tallinn
interclubdescaldes|Inter Club d'Escaldes|AND|conference|q3|interclubdescaldes|interclubdescaldes
riga|Riga|LVA|conference|q3|riga|riga
gyor|Győr|HUN|conference|q3|gyor|gyor
helsinki|HJK Helsinki|FIN|conference|q2|helsinki|helsinki
motherwell|Motherwell|SCO|conference|q3|motherwell|motherwell
interturku|Inter Turku|FIN|conference|q3|interturku|interturku
vaduz|Vaduz|LIE|conference|q3|vaduz|vaduz
debreceni|Debreceni|HUN|conference|q3|debreceni|debreceni
copenhagen|Copenhagen|DEN|conference|q2|copenhagen|copenhagen
paide|Paide Linnameeskond|EST|conference|q3|paide|paide
rapid|Rapid Wien|AUT|conference|q2|rapid|rapid
cluj|CFR Cluj|ROU|conference|q2|cluj|cluj
tromso|Tromsø|NOR|conference|q3|tromso|tromso
zalgiris|FK Žalgiris|LTU|conference|q2|zalgiris|zalgiris
hajduksplit|Hajduk Split|CRO|conference|q3|hajduksplit|hajduksplit
rakow|Raków Częstochowa|POL|conference|q3|rakow|rakow
hammarby|Hammarby|SWE|conference|q3|hammarby|hammarby
panathinaikos|Panathinaikos|GRE|conference|q2|panathinaikos|panathinaikos
cska1948|CSKA 1948|BUL|conference|q3|cska|cska
goteborg|IFK Göteborg|SWE|conference|q3|göteborg|göteborg
gent|Gent|BEL|conference|q2|gent|gent
hibernian|Hibernian|SCO|conference|q2|hibernian|hibernian
shkendija|Shkëndija|MKD|conference|q3|shkendija|shkendija
brann|Brann|NOR|conference|q2|brann|brann
apollon|Apollon Limassol|CYP|conference|q3|apollon|apollon
hapoeltelaviv|Hapoel Tel Aviv|ISR|conference|q3|hapoel|hapoel
katowice|GKS Katowice|POL|conference|q3|katowice|katowice
bohemian|Bohemian|IRL|conference|q3|bohemian|bohemian
midtjylland|Midtjylland|DEN|conference|q3|midtjylland|midtjylland
rijeka|Rijeka|CRO|conference|q3|rijeka|rijeka
tampere|Ilves Tampere|FIN|conference|q3|tampere|tampere
jablonec|Jablonec|CZE|conference|q3|jablonec|jablonec
rfs|RFS|LVA|conference|q3|rfs|rfs
valur|Valur|ISL|conference|q3|valur|valur
nordsjaelland|Nordsjælland|DEN|conference|q2|nordsjaelland|nordsjaelland
sherifftiraspol|Sheriff Tiraspol|MDA|conference|q3|sherifftiraspol|sherifftiraspol
gallen|St. Gallen|SUI|conference|q3|gallen|gallen
auda|Auda|LVA|conference|q3|auda|auda
dinamocity|Dinamo City|ALB|conference|q3|dinamocity|dinamocity
noah|Noah|ARM|conference|q3|noah|noah
sion|Sion|SUI|conference|q2|sion|sion
ajax|Ajax|NED|conference|q2|ajax|ajax
shelbourne|Shelbourne|IRL|conference|q3|shelbourne|shelbourne
braga|Braga|POR|conference|q2|braga|braga
dinamominsk|Dinamo Minsk|BLR|conference|q2|dinamominsk|dinamominsk
beitar|Beitar Jerusalem|ISR|conference|q3|beitar|beitar
austriawien|Austria Wien|AUT|conference|q2|austriawien|austriawien
twente|Twente|NED|conference|q3|twente|twente
dac|DAC 1904|SVK|conference|q3|dac|dac
dynamokyiv|Dynamo Kyiv|UKR|conference|q3|dynamokyiv|dynamokyiv
qarabag|Qarabağ|AZE|conference|q3|qarabag|qarabag
partizan|Partizan|SRB|conference|q2|partizan|partizan
tobol|Tobol|KAZ|conference|q3|tobol|tobol
lugano|Lugano|SUI|conference|q3|lugano|lugano
runavik|NSÍ Runavík|FRO|conference|q3|runavik|runavik
freiburg|SC Freiburg|GER|conference|playoffs|freiburg|freiburg
monaco|Monaco|FRA|conference|playoffs|monaco|monaco
brighton|Brighton & Hove Albion|ENG|conference|playoffs|brighton|brighton
atalanta|Atalanta|ITA|conference|playoffs|atalanta|atalanta
getafe|Getafe|ESP|conference|playoffs|getafe|getafe`;
  const teams = Object.freeze(Object.fromEntries(TEAM_ROWS.trim().split('\n').map((row) => {
    const [id, name, country, competitionKey, stage, fileSlug, coefficientSlug] = row.split('|');
    const source = competitionKey === '-' ? null : Object.freeze({ competitionKey, stage, fileSlug });
    return [id, Object.freeze({
      id,
      poolSlug: id,
      name,
      country,
      source,
      coefficientSlug: coefficientSlug === '-' ? id : coefficientSlug
    })];
  })));

  const W = (tieId) => Object.freeze({ tieId, result: 'winner' });
  const L = (tieId) => Object.freeze({ tieId, result: 'loser' });
  const T = (id) => {
    const team = teams[id];
    if (!team) throw new Error(`Bilinmeyen eleme takımı: ${id}`);
    return team;
  };
  const tie = (id, first, second, route) => Object.freeze({ id, first, second, route });

  const rounds = Object.freeze([
    Object.freeze({
      id: 'ucl-q3',
      label: 'Şampiyonlar Ligi 3. eleme turu',
      ties: Object.freeze([
        tie('ucl-q3-dinamo-kauno', T('dinamo'), T('kaunozalgiris'), 'champions'),
        tie('ucl-q3-mjallby-slovan', T('mjallby'), T('slovanbratislava'), 'champions'),
        tie('ucl-q3-levski-kairat', T('levskisofia'), T('kairat'), 'champions'),
        tie('ucl-q3-aarhus-sabah', T('aarhus'), T('sabah'), 'champions'),
        tie('ucl-q3-ararat-celje', T('ararat'), T('celje'), 'champions'),
        tie('ucl-q3-hapoel-crvena', T('hapoelbeersheva'), T('crvenazvezda'), 'champions'),
        tie('ucl-q3-olympiacos-nec', T('olympiacos'), T('nec'), 'league'),
        tie('ucl-q3-union-bodo', T('union'), T('bodo'), 'league'),
        tie('ucl-q3-fener-sturm', T('fenerbahce'), T('strumgraz'), 'league'),
        tie('ucl-q3-sparta-lyon', T('spartapraha'), T('lyon'), 'league')
      ])
    }),
    Object.freeze({
      id: 'ucl-playoffs',
      label: 'Şampiyonlar Ligi play-off turu',
      ties: Object.freeze([
        tie('ucl-po-levski-kairat-aek', W('ucl-q3-levski-kairat'), T('aek'), 'champions'),
        tie('ucl-po-celtic-lask', T('celtic'), T('lask'), 'champions'),
        tie('ucl-po-dinamo-kauno-viking', W('ucl-q3-dinamo-kauno'), T('viking'), 'champions'),
        tie('ucl-po-mjallby-slovan-ararat-celje', W('ucl-q3-mjallby-slovan'), W('ucl-q3-ararat-celje'), 'champions'),
        tie('ucl-po-hapoel-crvena-aarhus-sabah', W('ucl-q3-hapoel-crvena'), W('ucl-q3-aarhus-sabah'), 'champions'),
        tie('ucl-po-fener-sturm-sparta-lyon', W('ucl-q3-fener-sturm'), W('ucl-q3-sparta-lyon'), 'league'),
        tie('ucl-po-olympiacos-nec-union-bodo', W('ucl-q3-olympiacos-nec'), W('ucl-q3-union-bodo'), 'league')
      ])
    }),
    Object.freeze({
      id: 'uel-q3',
      label: 'Avrupa Ligi 3. eleme turu',
      ties: Object.freeze([
        tie('uel-q3-larne-iberia', T('larne'), T('iberia1999'), 'champions'),
        tie('uel-q3-lincoln-omonia', T('lincoln'), T('omonia'), 'champions'),
        tie('uel-q3-kuopio-craiova', T('kuopio'), T('craiova'), 'champions'),
        tie('uel-q3-shamrock-egnatia', T('shamrockrovers'), T('egnatia'), 'champions'),
        tie('uel-q3-poznan-klaksvik', T('poznan'), T('klaksvik'), 'champions'),
        tie('uel-q3-thun-vikingur', T('thun'), T('vikingurreykjavik'), 'champions'),
        tie('uel-q3-hradec-besiktas', T('hradeckralove'), T('besiktas'), 'main'),
        tie('uel-q3-jagiellonia-rangers', T('jagiellonia'), T('rangers'), 'main'),
        tie('uel-q3-paok-anderlecht', T('paok'), T('anderlecht'), 'main'),
        tie('uel-q3-pafos-salzburg', T('pafos'), T('salzburg'), 'main'),
        tie('uel-q3-benfica-hearts', T('benfica'), T('hearts'), 'main'),
        tie('uel-q3-maccabi-cska', T('maccabitelaviv'), T('cskasofia'), 'main'),
        tie('uel-q3-ferencvaros-gornik', T('ferencvarosi'), T('gornikzabrze'), 'main')
      ])
    }),
    Object.freeze({
      id: 'uel-playoffs',
      label: 'Avrupa Ligi play-off turu',
      ties: Object.freeze([
        tie('uel-po-trabzon-ferenc-gornik', T('trabzonspor'), W('uel-q3-ferencvaros-gornik'), 'main'),
        tie('uel-po-kuopio-craiova-ararat-celje', W('uel-q3-kuopio-craiova'), L('ucl-q3-ararat-celje'), 'champions'),
        tie('uel-po-truidense-lincoln-omonia', T('truidense'), W('uel-q3-lincoln-omonia'), 'main'),
        tie('uel-po-hapoel-crvena-plzen', L('ucl-q3-hapoel-crvena'), T('viktoriaplzen'), 'champions'),
        tie('uel-po-shamrock-egnatia-lillestrom', W('uel-q3-shamrock-egnatia'), T('lillestrom'), 'champions'),
        tie('uel-po-jagiellonia-rangers-larne-iberia', W('uel-q3-jagiellonia-rangers'), W('uel-q3-larne-iberia'), 'main'),
        tie('uel-po-mjallby-slovan-pafos-salzburg', L('ucl-q3-mjallby-slovan'), W('uel-q3-pafos-salzburg'), 'champions'),
        tie('uel-po-levski-kairat-paok-anderlecht', L('ucl-q3-levski-kairat'), W('uel-q3-paok-anderlecht'), 'champions'),
        tie('uel-po-poznan-klaksvik-thun-vikingur', W('uel-q3-poznan-klaksvik'), W('uel-q3-thun-vikingur'), 'champions'),
        tie('uel-po-hradec-besiktas-dinamo-kauno', W('uel-q3-hradec-besiktas'), L('ucl-q3-dinamo-kauno'), 'main'),
        tie('uel-po-benfica-hearts-aarhus-sabah', W('uel-q3-benfica-hearts'), L('ucl-q3-aarhus-sabah'), 'main'),
        tie('uel-po-crete-maccabi-cska', T('crete'), W('uel-q3-maccabi-cska'), 'main')
      ])
    }),
    Object.freeze({
      id: 'uecl-q3',
      label: 'Konferans Ligi 3. eleme turu',
      ties: Object.freeze([
        tie('uecl-q3-fiori-drita', T('fiori'), T('drita'), 'champions'),
        tie('uecl-q3-borac-vitebsk', T('borac'), T('vitebsk'), 'champions'),
        tie('uecl-q3-tallinn-inter', T('tallinn'), T('interclubdescaldes'), 'champions'),
        tie('uecl-q3-riga-gyor', T('riga'), T('gyor'), 'champions'),
        tie('uecl-q3-helsinki-motherwell', T('helsinki'), T('motherwell'), 'main'),
        tie('uecl-q3-interturku-vaduz', T('interturku'), T('vaduz'), 'main'),
        tie('uecl-q3-debreceni-copenhagen', T('debreceni'), T('copenhagen'), 'main'),
        tie('uecl-q3-paide-rapid', T('paide'), T('rapid'), 'main'),
        tie('uecl-q3-cluj-tromso', T('cluj'), T('tromso'), 'main'),
        tie('uecl-q3-zalgiris-hajduk', T('zalgiris'), T('hajduksplit'), 'main'),
        tie('uecl-q3-rakow-hammarby', T('rakow'), T('hammarby'), 'main'),
        tie('uecl-q3-panathinaikos-cska1948', T('panathinaikos'), T('cska1948'), 'main'),
        tie('uecl-q3-goteborg-gent', T('goteborg'), T('gent'), 'main'),
        tie('uecl-q3-hibernian-shkendija', T('hibernian'), T('shkendija'), 'main'),
        tie('uecl-q3-brann-apollon', T('brann'), T('apollon'), 'main'),
        tie('uecl-q3-hapoel-katowice', T('hapoeltelaviv'), T('katowice'), 'main'),
        tie('uecl-q3-bohemian-midtjylland', T('bohemian'), T('midtjylland'), 'main'),
        tie('uecl-q3-rijeka-tampere', T('rijeka'), T('tampere'), 'main'),
        tie('uecl-q3-jablonec-rfs', T('jablonec'), T('rfs'), 'main'),
        tie('uecl-q3-valur-nordsjaelland', T('valur'), T('nordsjaelland'), 'main'),
        tie('uecl-q3-sheriff-gallen', T('sherifftiraspol'), T('gallen'), 'main'),
        tie('uecl-q3-auda-dinamocity', T('auda'), T('dinamocity'), 'main'),
        tie('uecl-q3-noah-sion', T('noah'), T('sion'), 'main'),
        tie('uecl-q3-ajax-shelbourne', T('ajax'), T('shelbourne'), 'main'),
        tie('uecl-q3-braga-dinamominsk', T('braga'), T('dinamominsk'), 'main'),
        tie('uecl-q3-beitar-austria', T('beitar'), T('austriawien'), 'main'),
        tie('uecl-q3-twente-dac', T('twente'), T('dac'), 'main'),
        tie('uecl-q3-dynamo-qarabag', T('dynamokyiv'), T('qarabag'), 'main'),
        tie('uecl-q3-partizan-tobol', T('partizan'), T('tobol'), 'main'),
        tie('uecl-q3-lugano-runavik', T('lugano'), T('runavik'), 'main')
      ])
    }),
    Object.freeze({
      id: 'uecl-playoffs',
      label: 'Konferans Ligi play-off turu',
      ties: Object.freeze([
        tie('uecl-po-thun-vikingur-borac-vitebsk', L('uel-q3-thun-vikingur'), W('uecl-q3-borac-vitebsk'), 'champions'),
        tie('uecl-po-shamrock-egnatia-kuopio-craiova', L('uel-q3-shamrock-egnatia'), L('uel-q3-kuopio-craiova'), 'champions'),
        tie('uecl-po-fiori-drita-tallinn-inter', W('uecl-q3-fiori-drita'), W('uecl-q3-tallinn-inter'), 'champions'),
        tie('uecl-po-poznan-klaksvik-riga-gyor', L('uel-q3-poznan-klaksvik'), W('uecl-q3-riga-gyor'), 'champions'),
        tie('uecl-po-lincoln-omonia-larne-iberia', L('uel-q3-lincoln-omonia'), L('uel-q3-larne-iberia'), 'champions'),
        tie('uecl-po-helsinki-motherwell-freiburg', W('uecl-q3-helsinki-motherwell'), T('freiburg'), 'main'),
        tie('uecl-po-ferenc-gornik-monaco', L('uel-q3-ferencvaros-gornik'), T('monaco'), 'main'),
        tie('uecl-po-inter-vaduz-debreceni-copenhagen', W('uecl-q3-interturku-vaduz'), W('uecl-q3-debreceni-copenhagen'), 'main'),
        tie('uecl-po-benfica-hearts-paide-rapid', L('uel-q3-benfica-hearts'), W('uecl-q3-paide-rapid'), 'main'),
        tie('uecl-po-cluj-tromso-brighton', W('uecl-q3-cluj-tromso'), T('brighton'), 'main'),
        tie('uecl-po-zalgiris-hajduk-rakow-hammarby', W('uecl-q3-zalgiris-hajduk'), W('uecl-q3-rakow-hammarby'), 'main'),
        tie('uecl-po-panathinaikos-cska-hradec-besiktas', W('uecl-q3-panathinaikos-cska1948'), L('uel-q3-hradec-besiktas'), 'main'),
        tie('uecl-po-goteborg-gent-hibernian-shkendija', W('uecl-q3-goteborg-gent'), W('uecl-q3-hibernian-shkendija'), 'main'),
        tie('uecl-po-paok-anderlecht-brann-apollon', L('uel-q3-paok-anderlecht'), W('uecl-q3-brann-apollon'), 'main'),
        tie('uecl-po-atalanta-hapoel-katowice', T('atalanta'), W('uecl-q3-hapoel-katowice'), 'main'),
        tie('uecl-po-bohemian-midtjylland-rijeka-tampere', W('uecl-q3-bohemian-midtjylland'), W('uecl-q3-rijeka-tampere'), 'main'),
        tie('uecl-po-jagiellonia-rangers-jablonec-rfs', L('uel-q3-jagiellonia-rangers'), W('uecl-q3-jablonec-rfs'), 'main'),
        tie('uecl-po-valur-nordsjaelland-sheriff-gallen', W('uecl-q3-valur-nordsjaelland'), W('uecl-q3-sheriff-gallen'), 'main'),
        tie('uecl-po-auda-dinamo-pafos-salzburg', W('uecl-q3-auda-dinamocity'), L('uel-q3-pafos-salzburg'), 'main'),
        tie('uecl-po-noah-sion-ajax-shelbourne', W('uecl-q3-noah-sion'), W('uecl-q3-ajax-shelbourne'), 'main'),
        tie('uecl-po-braga-dinamo-beitar-austria', W('uecl-q3-braga-dinamominsk'), W('uecl-q3-beitar-austria'), 'main'),
        tie('uecl-po-twente-dac-dynamo-qarabag', W('uecl-q3-twente-dac'), W('uecl-q3-dynamo-qarabag'), 'main'),
        tie('uecl-po-getafe-partizan-tobol', T('getafe'), W('uecl-q3-partizan-tobol'), 'main'),
        tie('uecl-po-lugano-runavik-maccabi-cska', W('uecl-q3-lugano-runavik'), L('uel-q3-maccabi-cska'), 'main')
      ])
    })
  ]);

  function coefficientFor(team) {
    const value = Number(coefficientData.clubs?.[team.coefficientSlug]?.coefficient);
    return Number.isFinite(value) && value > 0 ? value : 1;
  }

  function probability(first, second) {
    const firstStrength = Math.pow(coefficientFor(first) + 4, 0.72);
    const secondStrength = Math.pow(coefficientFor(second) + 4, 0.72);
    const raw = firstStrength / (firstStrength + secondStrength);
    return Math.min(0.82, Math.max(0.18, raw));
  }

  function resolveParticipant(participant, outcomes) {
    if (participant?.id) return participant;
    const outcome = outcomes.get(participant?.tieId);
    if (!outcome) throw new Error(`Önceki eşleşme çözülmedi: ${participant?.tieId || 'bilinmiyor'}`);
    return outcome[participant.result];
  }

  function playRound(round, outcomes, random) {
    const results = [];
    round.ties.forEach((entry) => {
      const first = resolveParticipant(entry.first, outcomes);
      const second = resolveParticipant(entry.second, outcomes);
      const firstProbability = probability(first, second);
      const firstWins = random() < firstProbability;
      const outcome = Object.freeze({
        id: entry.id,
        route: entry.route,
        first,
        second,
        firstProbability,
        winner: firstWins ? first : second,
        loser: firstWins ? second : first
      });
      outcomes.set(entry.id, outcome);
      results.push(outcome);
    });
    return Object.freeze(results);
  }

  function uniqueTeams(items, label) {
    const ids = items.map((team) => team.id);
    if (new Set(ids).size !== ids.length) {
      throw new Error(`${label} içinde aynı takım birden fazla kez üretildi.`);
    }
    return Object.freeze([...items]);
  }

  function simulate(random = Math.random) {
    if (typeof random !== 'function') throw new TypeError('Eleme simülasyonu için random fonksiyonu gerekir.');

    const outcomes = new Map();
    const roundResults = {};
    rounds.forEach((round) => {
      roundResults[round.id] = playRound(round, outcomes, random);
    });

    const uclPlayoff = roundResults['ucl-playoffs'];
    const uclLeagueQ3Losers = roundResults['ucl-q3']
      .filter((result) => result.route === 'league')
      .map((result) => result.loser);
    const uelPlayoff = roundResults['uel-playoffs'];
    const ueclPlayoff = roundResults['uecl-playoffs'];

    const qualifiers = Object.freeze({
      ucl: uniqueTeams(uclPlayoff.map((result) => result.winner), 'Şampiyonlar Ligi elemeleri'),
      uel: uniqueTeams([
        ...uclLeagueQ3Losers,
        ...uclPlayoff.map((result) => result.loser),
        ...uelPlayoff.map((result) => result.winner)
      ], 'Avrupa Ligi elemeleri'),
      uecl: uniqueTeams([
        ...uelPlayoff.map((result) => result.loser),
        ...ueclPlayoff.map((result) => result.winner)
      ], 'Konferans Ligi elemeleri')
    });

    if (qualifiers.ucl.length !== 7 || qualifiers.uel.length !== 23 || qualifiers.uecl.length !== 36) {
      throw new Error(`Eleme kontenjanları bozuldu: UCL ${qualifiers.ucl.length}, UEL ${qualifiers.uel.length}, UECL ${qualifiers.uecl.length}.`);
    }

    const allIds = Object.values(qualifiers).flat().map((team) => team.id);
    if (new Set(allIds).size !== allIds.length) {
      throw new Error('Bir takım birden fazla lig aşamasına yerleştirildi.');
    }

    return Object.freeze({
      qualifiers,
      rounds: Object.freeze(roundResults),
      diagnostics: Object.freeze({
        season: '2026/27',
        bracketVersion: '2026-08-05',
        qualifierCounts: Object.freeze({ ucl: 7, uel: 23, uecl: 36 }),
        transferCounts: Object.freeze({
          uclPlayoffWinners: 7,
          uclLeaguePathQ3LosersToUel: 4,
          uclPlayoffLosersToUel: 7,
          uelPlayoffWinners: 12,
          uelPlayoffLosersToUecl: 12,
          ueclPlayoffWinners: 24
        })
      })
    });
  }

  window.UCLDRAW_QUALIFICATION_BRACKET = Object.freeze({ rounds, simulate, teams });
})();
