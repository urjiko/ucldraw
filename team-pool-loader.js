(() => {
  'use strict';

  const data = window.UCLDRAW_DATA;
  const manifest = window.UCLDRAW_POOL_MANIFEST;
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

  const STAGE_WEIGHTS = Object.freeze({
    guaranteed: Infinity,
    playoffs: 8,
    q3: 4,
    q2: 2
  });

  const COMPETITIONS = Object.freeze({
    champions: Object.freeze({
      id: 'ucl',
      target: 36,
      logo: 'crests/pools/champions/ucl_logo.png',
      background: 'crests/pools/champions/arkaplanucl.jpg'
    }),
    europa: Object.freeze({
      id: 'uel',
      target: 36,
      logo: 'crests/pools/europa/europaleague.png',
      background: 'crests/pools/europa/arkaplanuel.jpg'
    }),
    conference: Object.freeze({
      id: 'uecl',
      target: 36,
      logo: 'crests/pools/conference/ConferenceLeague.png',
      background: 'crests/pools/conference/arkaplancon.jpg'
    })
  });

  function shuffle(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  }

  function humanizeSlug(slug) {
    return String(slug)
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toLocaleUpperCase('tr-TR'));
  }

  function createPoolTeam(competitionKey, stage, entry, fallbackIndex) {
    const file = typeof entry === 'string' ? entry : entry.file;
    const slug = typeof entry === 'string'
      ? entry.replace(/\.png$/i, '').toLocaleLowerCase('en-US')
      : entry.slug;
    const metadata = catalog[slug];
    const fileStem = file.replace(/\.png$/i, '');
    const unknownCountry = `X${String(fallbackIndex).padStart(2, '0')}`;

    return {
      name: metadata?.name || humanizeSlug(slug),
      country: metadata?.country || unknownCountry,
      pot: 0,
      crest: `pools/${competitionKey}/${stage}/${fileStem}`,
      poolSlug: slug,
      qualificationStage: stage,
      metadataMissing: !metadata
    };
  }

  function weightedSample(candidates, count) {
    const available = [...candidates];
    const selected = [];

    while (selected.length < count && available.length) {
      const totalWeight = available.reduce((total, candidate) => total + candidate.weight, 0);
      let cursor = Math.random() * totalWeight;
      let selectedIndex = available.length - 1;

      for (let index = 0; index < available.length; index += 1) {
        cursor -= available[index].weight;
        if (cursor <= 0) {
          selectedIndex = index;
          break;
        }
      }

      selected.push(available.splice(selectedIndex, 1)[0].team);
    }

    return selected;
  }

  function createPlaceholder(competitionKey, index) {
    const label = competitionKey === 'conference' ? 'Conference' : competitionKey;
    return {
      name: `${label} Adayı ${String(index).padStart(2, '0')}`,
      country: `X${String(index).padStart(2, '0')}`,
      pot: 0,
      poolSlug: `placeholder-${competitionKey}-${index}`,
      qualificationStage: 'placeholder',
      isPlaceholder: true
    };
  }

  function assignPots(teams, potCount) {
    const capacity = teams.length / potCount;
    if (!Number.isInteger(capacity)) {
      throw new Error(`${teams.length} takım ${potCount} eşit torbaya ayrılamıyor.`);
    }

    const countryFrequency = new Map();
    teams.forEach((team) => {
      countryFrequency.set(team.country, (countryFrequency.get(team.country) || 0) + 1);
    });

    const ordered = shuffle(teams).sort((first, second) => (
      (countryFrequency.get(second.country) || 0) - (countryFrequency.get(first.country) || 0)
    ));
    const pots = Array.from({ length: potCount }, () => []);

    ordered.forEach((team) => {
      const availablePots = pots
        .map((pot, index) => ({ pot, index }))
        .filter(({ pot }) => pot.length < capacity)
        .map(({ pot, index }) => ({
          index,
          sameCountry: pot.filter((candidate) => candidate.country === team.country).length,
          size: pot.length,
          random: Math.random()
        }))
        .sort((first, second) => (
          first.sameCountry - second.sameCountry
          || first.size - second.size
          || first.random - second.random
        ));

      pots[availablePots[0].index].push(team);
    });

    return pots.flatMap((pot, index) => pot.map((team) => ({ ...team, pot: index + 1 })));
  }

  function buildCompetitionRoster(competitionKey, definition) {
    const source = manifest[competitionKey];
    if (!source) throw new Error(`${competitionKey} takım havuzu bulunamadı.`);

    let fallbackIndex = 1;
    const guaranteed = (source.guaranteed || []).map((entry) => (
      createPoolTeam(competitionKey, 'guaranteed', entry, fallbackIndex++)
    ));

    const candidates = ['playoffs', 'q3', 'q2'].flatMap((stage) => (
      (source[stage] || []).map((entry) => ({
        team: createPoolTeam(competitionKey, stage, entry, fallbackIndex++),
        weight: STAGE_WEIGHTS[stage]
      }))
    ));

    let selected;
    const warnings = [];

    if (guaranteed.length > definition.target) {
      selected = shuffle(guaranteed).slice(0, definition.target);
      warnings.push(`${competitionKey}: garanti klasöründe ${definition.target} sınırını aşan takım var.`);
    } else {
      selected = [
        ...guaranteed,
        ...weightedSample(candidates, definition.target - guaranteed.length)
      ];
    }

    let placeholderIndex = 1;
    while (selected.length < definition.target) {
      selected.push(createPlaceholder(competitionKey, placeholderIndex++));
    }

    const missingMetadata = selected.filter((team) => team.metadataMissing).map((team) => team.poolSlug);
    if (missingMetadata.length) {
      warnings.push(`${competitionKey}: metadata eksik (${missingMetadata.join(', ')}).`);
    }
    if (placeholderIndex > 1) {
      warnings.push(`${competitionKey}: havuzda ${definition.target} takım olmadığı için ${placeholderIndex - 1} geçici aday eklendi.`);
    }

    return {
      teams: assignPots(selected, data.competitions[definition.id].potCount),
      warnings
    };
  }

  const diagnostics = {};

  Object.entries(COMPETITIONS).forEach(([competitionKey, definition]) => {
    const competition = data.competitions[definition.id];
    const result = buildCompetitionRoster(competitionKey, definition);
    competition.teams = result.teams;
    competition.logo = definition.logo;
    competition.background = definition.background;
    diagnostics[definition.id] = {
      warnings: result.warnings,
      selectedSlugs: result.teams.filter((team) => !team.isPlaceholder).map((team) => team.poolSlug),
      placeholderCount: result.teams.filter((team) => team.isPlaceholder).length
    };
  });

  window.UCLDRAW_POOL_DIAGNOSTICS = diagnostics;

  Object.values(diagnostics).flatMap((entry) => entry.warnings).forEach((warning) => {
    console.warn(`[UCL Draw Pools] ${warning}`);
  });
})();
