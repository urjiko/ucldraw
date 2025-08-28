// crest mapping: adapt to your local PNG filenames inside /crests
const CREST_MAP = {
  'Paris Saint-Germain': 'psg',
  'Real Madrid': 'real',
  'Manchester City': 'city',
  'Bayern München': 'bayern',
  'Liverpool': 'lfc',
  'Inter': 'inter',
  'Chelsea': 'cfc',
  'Borussia Dortmund': 'bvb',
  'Barcelona': 'barcelona',
  'Arsenal': 'arsenal',
  'Bayer Leverkusen': 'bayer',
  'Atlético Madrid': 'atleti',
  'Benfica': 'benfica',
  'Atalanta': 'atalanta',
  'Villarreal': 'villareal', // note your file is villareal.png, keep consistent
  'Juventus': 'juve',
  'Eintracht Frankfurt': 'frankfurt',
  'Club Brugge': 'brugge',
  'Tottenham Hotspur': 'spurs',
  'PSV Eindhoven': 'psv',
  'Ajax': 'ajax',
  'Napoli': 'napoli',
  'Sporting CP': 'sporting',
  'Olympiacos': 'olympiacos',
  'Slavia Praha': 'slavia',
  'Bodø/Glimt': 'bodo',
  'Marseille': 'marseille',
  'FC København': 'copenhagen',
  'AS Monaco': 'monaco',
  'Galatasaray': 'gs',
  'Union SG': 'union',
  'Qarabağ': 'qarabag',
  'Athletic Club': 'athletic',
  'Newcastle United': 'newcastle',
  'Pafos': 'pafos',
  'Kairat Almaty': 'kairat'
};

const CREST_BASE = '/crests';

export function crestUrl(name){
  const slug = CREST_MAP[name];
  return slug ? `${CREST_BASE}/${slug}.png` : `${CREST_BASE}/missing.png`;
}
