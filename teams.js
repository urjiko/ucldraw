/**
 * Competition and team data.
 *
 * To update a season:
 * 1. Edit the teams array for the relevant competition.
 * 2. Keep `name`, `country` and `pot`.
 * 3. Add a `crest` slug when a matching PNG exists in /crests.
 *
 * The draw engine reads the competition shape from `potCount` and
 * `opponentsPerPot`, so Conference League can use six pots while UCL/UEL use four.
 */
window.UCLDRAW_DATA = {
  competitions: {
    ucl: {
      id: 'ucl',
      name: 'UEFA Champions League',
      shortName: 'Champions League',
      color: '#022ae2',
      logo: 'crests/pools/champions/UCL_Logo.svg',
      background: 'assets/arkaplanucl.jpg',
      potCount: 4,
      opponentsPerPot: 2,
      teams: [
        { name: 'Paris Saint-Germain', country: 'FRA', pot: 1, crest: 'psg' },
        { name: 'Real Madrid', country: 'ESP', pot: 1, crest: 'real' },
        { name: 'Manchester City', country: 'ENG', pot: 1, crest: 'city' },
        { name: 'Bayern München', country: 'GER', pot: 1, crest: 'bayern' },
        { name: 'Liverpool', country: 'ENG', pot: 1, crest: 'lfc' },
        { name: 'Inter', country: 'ITA', pot: 1, crest: 'inter' },
        { name: 'Chelsea', country: 'ENG', pot: 1, crest: 'cfc' },
        { name: 'Borussia Dortmund', country: 'GER', pot: 1, crest: 'bvb' },
        { name: 'Barcelona', country: 'ESP', pot: 1, crest: 'barcelona' },

        { name: 'Arsenal', country: 'ENG', pot: 2, crest: 'arsenal' },
        { name: 'Bayer Leverkusen', country: 'GER', pot: 2, crest: 'bayer' },
        { name: 'Atlético Madrid', country: 'ESP', pot: 2, crest: 'atleti' },
        { name: 'Benfica', country: 'POR', pot: 2, crest: 'benfica' },
        { name: 'Atalanta', country: 'ITA', pot: 2, crest: 'atalanta' },
        { name: 'Villarreal', country: 'ESP', pot: 2, crest: 'villareal' },
        { name: 'Juventus', country: 'ITA', pot: 2, crest: 'juve' },
        { name: 'Eintracht Frankfurt', country: 'GER', pot: 2, crest: 'frankfurt' },
        { name: 'Club Brugge', country: 'BEL', pot: 2, crest: 'brugge' },

        { name: 'Tottenham Hotspur', country: 'ENG', pot: 3, crest: 'spurs' },
        { name: 'PSV Eindhoven', country: 'NED', pot: 3, crest: 'psv' },
        { name: 'Ajax', country: 'NED', pot: 3, crest: 'ajax' },
        { name: 'Napoli', country: 'ITA', pot: 3, crest: 'napoli' },
        { name: 'Sporting CP', country: 'POR', pot: 3, crest: 'sporting' },
        { name: 'Olympiacos', country: 'GRE', pot: 3, crest: 'olympiacos' },
        { name: 'Slavia Praha', country: 'CZE', pot: 3, crest: 'slavia' },
        { name: 'Bodø/Glimt', country: 'NOR', pot: 3, crest: 'bodo' },
        { name: 'Marseille', country: 'FRA', pot: 3, crest: 'marseille' },

        { name: 'Copenhagen', country: 'DEN', pot: 4, crest: 'copenhagen' },
        { name: 'Monaco', country: 'FRA', pot: 4, crest: 'monaco' },
        { name: 'Galatasaray', country: 'TUR', pot: 4, crest: 'gs' },
        { name: 'Union SG', country: 'BEL', pot: 4, crest: 'union' },
        { name: 'Qarabağ', country: 'AZE', pot: 4, crest: 'qarabag' },
        { name: 'Athletic Club', country: 'ESP', pot: 4, crest: 'athletic' },
        { name: 'Newcastle United', country: 'ENG', pot: 4, crest: 'newcastle' },
        { name: 'Pafos', country: 'CYP', pot: 4, crest: 'pafos' },
        { name: 'Kairat Almaty', country: 'KAZ', pot: 4, crest: 'kairat' }
      ]
    },

    uel: {
      id: 'uel',
      name: 'UEFA Europa League',
      shortName: 'Europa League',
      color: '#ff6900',
      logo: 'crests/pools/europa/UEL_Logo.svg',
      background: 'assets/arkaplanuel.jpg',
      potCount: 4,
      opponentsPerPot: 2,
      teams: [
        { name: 'Roma', country: 'ITA', pot: 1, crest: 'roma' },
        { name: 'Porto', country: 'POR', pot: 1, crest: 'porto' },
        { name: 'Rangers', country: 'SCO', pot: 1, crest: 'rangers' },
        { name: 'Feyenoord', country: 'NED', pot: 1, crest: 'feyenoord' },
        { name: 'Lille', country: 'FRA', pot: 1, crest: 'lille' },
        { name: 'Dinamo Zagreb', country: 'CRO', pot: 1, crest: 'dinamo' },
        { name: 'Real Betis', country: 'ESP', pot: 1, crest: 'betis' },
        { name: 'Red Bull Salzburg', country: 'AUT', pot: 1, crest: 'salzburg' },
        { name: 'Aston Villa', country: 'ENG', pot: 1, crest: 'villa' },

        { name: 'Fenerbahçe', country: 'TUR', pot: 2, crest: 'fener' },
        { name: 'Braga', country: 'POR', pot: 2, crest: 'braga' },
        { name: 'Crvena zvezda', country: 'SRB', pot: 2, crest: 'kizilyildiz' },
        { name: 'Lyon', country: 'FRA', pot: 2, crest: 'lyon' },
        { name: 'PAOK', country: 'GRE', pot: 2, crest: 'paok' },
        { name: 'Viktoria Plzeň', country: 'CZE', pot: 2, crest: 'plzen' },
        { name: 'Ferencváros', country: 'HUN', pot: 2, crest: 'ferencvaros' },
        { name: 'Celtic', country: 'SCO', pot: 2, crest: 'celtic' },
        { name: 'Maccabi Tel-Aviv', country: 'ISR', pot: 2, crest: 'maccabi' },

        { name: 'Young Boys', country: 'SUI', pot: 3, crest: 'youngboys' },
        { name: 'Basel', country: 'SUI', pot: 3, crest: 'basel' },
        { name: 'Midtjylland', country: 'DEN', pot: 3, crest: 'midtjylland' },
        { name: 'SC Freiburg', country: 'GER', pot: 3, crest: 'freiburg' },
        { name: 'Ludogorets', country: 'BUL', pot: 3, crest: 'ludogorets' },
        { name: 'Nottingham Forest', country: 'ENG', pot: 3, crest: 'forest' },
        { name: 'Sturm Graz', country: 'AUT', pot: 3, crest: 'sturm' },
        { name: 'FCSB', country: 'ROU', pot: 3, crest: 'fcsb' },
        { name: 'Nice', country: 'FRA', pot: 3, crest: 'nice' },

        { name: 'Bologna', country: 'ITA', pot: 4, crest: 'bologna' },
        { name: 'Celta Vigo', country: 'ESP', pot: 4, crest: 'celta' },
        { name: 'VfB Stuttgart', country: 'GER', pot: 4, crest: 'stuttgart' },
        { name: 'Panathinaikos', country: 'GRE', pot: 4, crest: 'panathinaikos' },
        { name: 'Malmö', country: 'SWE', pot: 4, crest: 'malmo' },
        { name: 'Go Ahead Eagles', country: 'NED', pot: 4, crest: 'goaheadeagles' },
        { name: 'Utrecht', country: 'NED', pot: 4, crest: 'utrecht' },
        { name: 'Genk', country: 'BEL', pot: 4, crest: 'genk' },
        { name: 'Brann', country: 'NOR', pot: 4, crest: 'brann' }
      ]
    },

    uecl: {
      id: 'uecl',
      name: 'UEFA Conference League',
      shortName: 'Conference League',
      color: '#00be14',
      logo: 'crests/pools/conference/CON_Logo.svg',
      background: null,
      potCount: 6,
      opponentsPerPot: 1,

      // Placeholder season data. Replace these 36 entries when the final clubs are known.
      teams: [
        { name: 'Conference Club 01', country: 'ITA', pot: 1 },
        { name: 'Conference Club 02', country: 'ENG', pot: 1 },
        { name: 'Conference Club 03', country: 'ESP', pot: 1 },
        { name: 'Conference Club 04', country: 'GER', pot: 1 },
        { name: 'Conference Club 05', country: 'FRA', pot: 1 },
        { name: 'Conference Club 06', country: 'POR', pot: 1 },

        { name: 'Conference Club 07', country: 'NED', pot: 2 },
        { name: 'Conference Club 08', country: 'BEL', pot: 2 },
        { name: 'Conference Club 09', country: 'TUR', pot: 2 },
        { name: 'Conference Club 10', country: 'GRE', pot: 2 },
        { name: 'Conference Club 11', country: 'AUT', pot: 2 },
        { name: 'Conference Club 12', country: 'CZE', pot: 2 },

        { name: 'Conference Club 13', country: 'SCO', pot: 3 },
        { name: 'Conference Club 14', country: 'DEN', pot: 3 },
        { name: 'Conference Club 15', country: 'NOR', pot: 3 },
        { name: 'Conference Club 16', country: 'SWE', pot: 3 },
        { name: 'Conference Club 17', country: 'POL', pot: 3 },
        { name: 'Conference Club 18', country: 'SUI', pot: 3 },

        { name: 'Conference Club 19', country: 'ROU', pot: 4 },
        { name: 'Conference Club 20', country: 'CRO', pot: 4 },
        { name: 'Conference Club 21', country: 'SRB', pot: 4 },
        { name: 'Conference Club 22', country: 'BUL', pot: 4 },
        { name: 'Conference Club 23', country: 'ISR', pot: 4 },
        { name: 'Conference Club 24', country: 'CYP', pot: 4 },

        { name: 'Conference Club 25', country: 'HUN', pot: 5 },
        { name: 'Conference Club 26', country: 'SVK', pot: 5 },
        { name: 'Conference Club 27', country: 'SVN', pot: 5 },
        { name: 'Conference Club 28', country: 'UKR', pot: 5 },
        { name: 'Conference Club 29', country: 'KAZ', pot: 5 },
        { name: 'Conference Club 30', country: 'AZE', pot: 5 },

        { name: 'Conference Club 31', country: 'ARM', pot: 6 },
        { name: 'Conference Club 32', country: 'GEO', pot: 6 },
        { name: 'Conference Club 33', country: 'ISL', pot: 6 },
        { name: 'Conference Club 34', country: 'IRL', pot: 6 },
        { name: 'Conference Club 35', country: 'FIN', pot: 6 },
        { name: 'Conference Club 36', country: 'BIH', pot: 6 }
      ]
    }
  }
};