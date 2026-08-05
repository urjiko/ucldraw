(() => {
  'use strict';

  const data = window.UCLDRAW_DATA;
  const manifest = window.UCLDRAW_POOL_MANIFEST;
  const bracket = window.UCLDRAW_QUALIFICATION_BRACKET;
  const catalog = Object.fromEntries(`aarhus|AGF Aarhus|DEN
aek|AEK Athens|GRE
ajax|Ajax|NED
anderlecht|Anderlecht|BEL
ararat|Ararat-Armenia|ARM
arsenal|Arsenal|ENG
astonvilla|Aston Villa|ENG
atalanta|Atalanta|ITA
atleti|Atlético Madrid|ESP
austriawien|Austria Wien|AUT
azalkmaar|AZ Alkmaar|NED
barcelona|Barcelona|ESP
basaksehir|Başakşehir|TUR
bayerleverkusen|Bayer Leverkusen|GER
bayern|Bayern München|GER
benfica|Benfica|POR
besiktas|Beşiktaş|TUR
bodo|Bodø/Glimt|NOR
bournemouth|Bournemouth|ENG
braga|Braga|POR
brann|Brann|NOR
brighton|Brighton & Hove Albion|ENG
brugge|Club Brugge|BEL
bvb|Borussia Dortmund|GER
celje|Celje|SVN
celtavigo|Celta Vigo|ESP
celtic|Celtic|SCO
city|Manchester City|ENG
cluj|CFR Cluj|ROU
como|Como|ITA
copenhagen|Copenhagen|DEN
craiova|Universitatea Craiova|ROU
crete|OFI Crete|GRE
crvenazvezda|Crvena zvezda|SRB
crystalpalace|Crystal Palace|ENG
cskasofia|CSKA Sofia|BUL
dinamo|Dinamo Zagreb|CRO
dinamominsk|Dinamo Minsk|BLR
dynamokyiv|Dynamo Kyiv|UKR
egnatia|Egnatia|ALB
fcsb|FCSB|ROU
fenerbahce|Fenerbahçe|TUR
ferencvarosi|Ferencváros|HUN
feyenoord|Feyenoord|NED
fiori|Tre Fiori|SMR
freiburg|SC Freiburg|GER
galatasaray|Galatasaray|TUR
gallen|St. Gallen|SUI
genk|Genk|BEL
gent|Gent|BEL
getafe|Getafe|ESP
gornikzabrze|Górnik Zabrze|POL
hajduksplit|Hajduk Split|CRO
hammarby|Hammarby|SWE
hapoel|Hapoel Be'er Sheva|ISR
hearts|Heart of Midlothian|SCO
helsinki|HJK Helsinki|FIN
hibernian|Hibernian|SCO
hoffenheim|Hoffenheim|GER
hradeckralove|Hradec Králové|CZE
inter|Inter|ITA
interclubdescaldes|Inter Club d'Escaldes|AND
jagiellonia|Jagiellonia Białystok|POL
juventus|Juventus|ITA
kairat|Kairat Almaty|KAZ
klaksvik|KÍ Klaksvík|FRO
kuopio|KuPS|FIN
larne|Larne|NIR
lask|LASK|AUT
leipzig|RB Leipzig|GER
lens|Lens|FRA
levskisofia|Levski Sofia|BUL
lille|Lille|FRA
lillestrom|Lillestrøm|NOR
lincoln|Lincoln Red Imps|GIB
liverpool|Liverpool|ENG
ludogorets|Ludogorets|BUL
lyon|Lyon|FRA
maccabitelaviv|Maccabi Tel Aviv|ISR
manu|Manchester United|ENG
marseille|Marseille|FRA
midtjylland|Midtjylland|DEN
milan|AC Milan|ITA
mjallby|Mjällby|SWE
monaco|Monaco|FRA
napoli|Napoli|ITA
nec|NEC Nijmegen|NED
nordsjaelland|Nordsjælland|DEN
olympiacos|Olympiacos|GRE
omonia|Omonia|CYP
pafos|Pafos|CYP
panathinaikos|Panathinaikos|GRE
paok|PAOK|GRE
partizan|Partizan|SRB
porto|Porto|POR
poznan|Lech Poznań|POL
psg|Paris Saint-Germain|FRA
psv|PSV Eindhoven|NED
qarabag|Qarabağ|AZE
rangers|Rangers|SCO
rapid|Rapid Wien|AUT
real|Real Madrid|ESP
realbetis|Real Betis|ESP
realsociedad|Real Sociedad|ESP
rennais|Rennes|FRA
roma|Roma|ITA
sabah|Sabah|AZE
salzburg|Red Bull Salzburg|AUT
shakhtar|Shakhtar Donetsk|UKR
shamrockrovers|Shamrock Rovers|IRL
sherifftiraspol|Sheriff Tiraspol|MDA
sion|Sion|SUI
slavia|Slavia Praha|CZE
slovanbratislava|Slovan Bratislava|SVK
spartapraha|Sparta Praha|CZE
sporting|Sporting CP|POR
strumgraz|Sturm Graz|AUT
stuttgart|VfB Stuttgart|GER
sunderland|Sunderland|ENG
tblisi|Dinamo Tbilisi|GEO
thun|Thun|SUI
torreense|Torreense|POR
trabzonspor|Trabzonspor|TUR
tromso|Tromsø|NOR
truidense|Sint-Truiden|BEL
twente|Twente|NED
union|Union SG|BEL
viking|Viking|NOR
vikingurreykjavik|Víkingur Reykjavík|ISL
viktoriaplzen|Viktoria Plzeň|CZE
villareal|Villarreal|ESP
zalgiris|Žalgiris|LTU
zimbru|Zimbru Chișinău|MDA`.trim().split('\n').map((row) => {
    const [slug, name, country] = row.split('|');
    return [slug, Object.freeze({ name, country })];
  }));

  if (!data?.competitions || !manifest) {
    throw new Error('Takım havuzu verileri yüklenemedi.');
  }
  if (!bracket?.simulate) {
    throw new Error('2026/27 eleme ağacı yüklenemedi; bağımsız aday seçimi güvenli olmadığı için kadro üretilmedi.');
  }

  const COMPETITIONS = Object.freeze({
    champions: Object.freeze({
      id: 'ucl',
      target: 36,
      guaranteedCount: 29,
      logo: 'crests/pools/champions/ucl_logo.png',
      background: 'crests/pools/champions/arkaplanucl.jpg'
    }),
    europa: Object.freeze({
      id: 'uel',
      target: 36,
      guaranteedCount: 13,
      logo: 'crests/pools/europa/europaleague.png',
      background: 'crests/pools/europa/arkaplanuel.jpg'
    }),
    conference: Object.freeze({
      id: 'uecl',
      target: 36,
      guaranteedCount: 0,
      logo: 'crests/pools/conference/ConferenceLeague.png',
      background: 'crests/pools/conference/arkaplancon.jpg'
    })
  });

  function humanizeSlug(slug) {
    return String(slug)
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toLocaleUpperCase('tr-TR'));
  }

  function entryParts(entry) {
    const file = typeof entry === 'string' ? entry : entry.file;
    const slug = typeof entry === 'string'
      ? entry.replace(/\.png$/i, '').toLocaleLowerCase('en-US')
      : entry.slug;
    return { file, slug };
  }

  function createGuaranteedTeam(competitionKey, entry, fallbackIndex) {
    const { file, slug } = entryParts(entry);
    const metadata = catalog[slug];
    const fileStem = file.replace(/\.png$/i, '');
    return {
      name: metadata?.name || humanizeSlug(slug),
      country: metadata?.country || `X${String(fallbackIndex).padStart(2, '0')}`,
      pot: 0,
      crest: `pools/${competitionKey}/guaranteed/${fileStem}`,
      poolSlug: slug,
      coefficientSlug: slug,
      qualificationId: slug,
      qualificationStage: 'guaranteed',
      qualificationRoute: 'direct',
      metadataMissing: !metadata
    };
  }

  function createQualifiedTeam(descriptor, destinationId) {
    const source = descriptor.source;
    const team = {
      name: descriptor.name,
      country: descriptor.country,
      pot: 0,
      poolSlug: descriptor.poolSlug,
      coefficientSlug: descriptor.coefficientSlug || descriptor.poolSlug,
      qualificationId: descriptor.id,
      qualificationStage: 'qualified',
      qualificationRoute: destinationId,
      metadataMissing: false
    };
    if (source) {
      team.crest = `pools/${source.competitionKey}/${source.stage}/${source.fileSlug}`;
      team.qualificationSourceCompetition = source.competitionKey;
      team.qualificationSourceStage = source.stage;
    }
    return team;
  }

  const simulation = bracket.simulate(Math.random);
  const diagnostics = {};

  Object.entries(COMPETITIONS).forEach(([competitionKey, definition]) => {
    const competition = data.competitions[definition.id];
    const guaranteed = (manifest[competitionKey]?.guaranteed || [])
      .map((entry, index) => createGuaranteedTeam(competitionKey, entry, index + 1));
    const qualifiers = simulation.qualifiers[definition.id]
      .map((descriptor) => createQualifiedTeam(descriptor, definition.id));
    const selected = [...guaranteed, ...qualifiers];

    if (guaranteed.length !== definition.guaranteedCount) {
      throw new Error(`${competitionKey} doğrudan katılımcı sayısı ${definition.guaranteedCount} yerine ${guaranteed.length}.`);
    }
    if (selected.length !== definition.target) {
      throw new Error(`${competitionKey} lig aşaması ${definition.target} yerine ${selected.length} takım üretti.`);
    }

    const identities = selected.map((team) => team.qualificationId);
    if (new Set(identities).size !== identities.length) {
      throw new Error(`${competitionKey} kadrosunda aynı takım iki kez yer aldı.`);
    }

    competition.teams = selected;
    competition.logo = definition.logo;
    competition.background = definition.background;
    diagnostics[definition.id] = {
      warnings: [],
      selectedSlugs: selected.map((team) => team.poolSlug),
      selectedQualificationIds: identities,
      guaranteedCount: guaranteed.length,
      qualifierCount: qualifiers.length,
      placeholderCount: 0,
      bracketVersion: simulation.diagnostics.bracketVersion,
      qualificationTransfers: simulation.diagnostics.transferCounts
    };
  });

  const allQualificationIds = Object.values(data.competitions)
    .flatMap((competition) => competition.teams)
    .map((team) => team.qualificationId);
  if (new Set(allQualificationIds).size !== allQualificationIds.length) {
    throw new Error('Aynı kulüp birden fazla UEFA lig aşamasına yerleştirildi.');
  }

  window.UCLDRAW_POOL_DIAGNOSTICS = diagnostics;
  window.UCLDRAW_QUALIFICATION_RESULT = simulation;
})();
