import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const loaderPath = path.join(root, 'team-pool-loader.js');
const outputPath = path.join(root, 'generated-club-coefficients.js');

export const SOURCE_URL = 'https://kassiesa.net/uefa/data/method5/trank2026.html';
export const UEFA_VALIDATION_URL = 'https://www.uefa.com/nationalassociations/uefarankings/?year=2026';

const aliases = {
  psg: ['Paris', 'Paris SG', 'Paris Saint-Germain'], city: ['Man City', 'Manchester City'],
  manu: ['Man United', 'Manchester United'], bayern: ['Bayern Munich'], bvb: ['Dortmund', 'Borussia Dortmund'],
  inter: ['Internazionale'], milan: ['Milan', 'AC Milan'], atleti: ['Atletico Madrid', 'Atlético Madrid'],
  sporting: ['Sporting', 'Sporting CP Lisbon'], brugge: ['Club Brugge KV'], slavia: ['Slavia Prague', 'Slavia Praha'],
  spartapraha: ['Sparta Prague', 'Sparta Praha'], crvenazvezda: ['Red Star Belgrade'],
  fenerbahce: ['Fenerbahce SK', 'Fenerbahçe'], galatasaray: ['Galatasaray AS', 'Galatasaray A.Ş.'],
  besiktas: ['Besiktas JK', 'Besiktas'], basaksehir: ['Istanbul Basaksehir'], qarabag: ['Qarabag', 'Qarabag FK'],
  copenhagen: ['FC København', 'København'], bodo: ['Bodo/Glimt', 'Bodø/Glimt'],
  union: ['Union Saint-Gilloise'], salzburg: ['Salzburg', 'FC Salzburg'],
  bayerleverkusen: ['Leverkusen', 'Bayer Leverkusen'], azalkmaar: ['AZ', 'AZ Alkmaar'], psv: ['PSV'],
  olympiacos: ['Olympiakos', 'Olympiakos Piraeus'], dynamokyiv: ['Dynamo Kiev', 'Dynamo Kyiv'],
  maccabitelaviv: ['Maccabi Tel-Aviv'], ferencvarosi: ['Ferencvaros', 'Ferencváros'],
  poznan: ['Lech Poznan', 'Lech Poznań'], klaksvik: ['KI Klaksvik', 'KÍ Klaksvík'], kuopio: ['KuPS Kuopio', 'KuPS'],
  vikingurreykjavik: ['Vikingur Reykjavik', 'Víkingur Reykjavík'], ludogorets: ['Ludogorets Razgrad'],
  fcsb: ['Steaua Bucharest'], nordsjaelland: ['Nordsjaelland', 'Nordsjælland'],
  interclubdescaldes: ['Inter Escaldes'], lyon: ['Olympique Lyon'], marseille: ['Olympique Marseille'],
  roma: ['AS Roma'], porto: ['FC Porto'], rangers: ['Glasgow Rangers'], braga: ['Sporting Braga'],
  genk: ['Racing Genk'], gent: ['AA Gent'], paok: ['PAOK Thessaloniki'],
  viktoriaplzen: ['Viktoria Plzen', 'Viktoria Plzeň'], pafos: ['Pafos FC'], celtavigo: ['Celta de Vigo'],
  lens: ['RC Lens'], rennais: ['Stade Rennais'], basel: ['FC Basel'], malmo: ['Malmö FF'],
  sherifftiraspol: ['Sheriff Tiraspol'], cluj: ['CFR Cluj'], celje: ['NK Celje'],
  rapid: ['Rapid Wien'], hapoel: ['Hapoel Beer-Sheva'], lincoln: ['Lincoln Red Imps'],
  shamrockrovers: ['Shamrock Rovers'], stuttgart: ['VfB Stuttgart'],
  brann: ['SK Brann', 'Brann Bergen'], dinamominsk: ['Dinamo Minsk'], egnatia: ['KF Egnatia'],
  fiori: ['Tre Fiori'], gallen: ['FC St. Gallen', 'St. Gallen'], hammarby: ['Hammarby IF'],
  hearts: ['Heart of Midlothian'], hoffenheim: ['1899 Hoffenheim'], jagiellonia: ['Jagiellonia Bialystok'],
  lille: ['Lille OSC'], nec: ['NEC Nijmegen'], omonia: ['Omonia Nicosia'],
  partizan: ['Partizan Belgrade'], tromso: ['Tromsø IL', 'Tromso IL'],
  twente: ['FC Twente Enschede'], viking: ['Viking Stavanger'], zalgiris: ['Zalgiris Vilnius', 'FK Zalgiris Vilnius']
};

const countryCodes = Object.freeze({
  alb:'ALB', and:'AND', arm:'ARM', aut:'AUT', azb:'AZE', bel:'BEL', bih:'BIH', blr:'BLR', bos:'BIH',
  bul:'BUL', cro:'CRO', cyp:'CYP', cze:'CZE', den:'DEN', eng:'ENG', esp:'ESP', est:'EST', far:'FRO',
  fin:'FIN', fra:'FRA', fro:'FRO', geo:'GEO', ger:'GER', gib:'GIB', gre:'GRE', hun:'HUN', ice:'ISL',
  irl:'IRL', isl:'ISL', isr:'ISR', ita:'ITA', kaz:'KAZ', kos:'KOS', lat:'LVA', lie:'LIE', lit:'LTU',
  ltu:'LTU', lux:'LUX', mac:'MKD', mda:'MDA', mol:'MDA', mlt:'MLT', mon:'MCO', ned:'NED', nir:'NIR',
  nor:'NOR', pol:'POL', por:'POR', rou:'ROU', rom:'ROU', rus:'RUS', sco:'SCO', smr:'SMR', srb:'SRB',
  sui:'SUI', svk:'SVK', svn:'SVN', slo:'SVN', swe:'SWE', tur:'TUR', ukr:'UKR', wal:'WAL'
});

const stop = new Set(['fc','cf','sc','ac','afc','sk','jk','fk','as','aş','club','football','futbol','calcio','the']);

export function normalize(value='') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/&/g,' and ').replace(/[’'`´.(),/\\–—_-]+/g,' ')
    .toLowerCase().split(/\s+/).filter((word)=>word&&!stop.has(word)).join(' ').trim();
}

function decodeHtml(value='') {
  return String(value)
    .replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'").replace(/&ouml;/gi,'ö').replace(/&uuml;/gi,'ü').replace(/&auml;/gi,'ä')
    .replace(/&Ouml;/g,'Ö').replace(/&Uuml;/g,'Ü').replace(/&Auml;/g,'Ä').replace(/&oslash;/gi,'ø')
    .replace(/&aring;/gi,'å').replace(/&aacute;/gi,'á').replace(/&eacute;/gi,'é').replace(/&iacute;/gi,'í')
    .replace(/&ccedil;/gi,'ç').replace(/&#(\d+);/g,(_,code)=>String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi,(_,code)=>String.fromCodePoint(Number.parseInt(code,16)));
}

function cleanCell(value='') {
  return decodeHtml(String(value).replace(/<br\s*\/?\s*>/gi,' ').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();
}

export function parseRows(text) {
  const rows=[];
  for(const raw of String(text).split(/\r?\n/)){
    const line=raw.replace(/\s+/g,' ').trim();
    const match=line.match(/^(\d{1,4})\s+(.+?)\s+([A-Z]{3})\s+(\d{1,3}(?:[.,]\d{3}))(?:\s+\d{1,3}(?:[.,]\d{3}))?$/);
    if(match) rows.push({rank:Number(match[1]),officialName:match[2].trim(),country:match[3],coefficient:Number(match[4].replace(',','.'))});
  }
  return rows;
}

export function parseKassiesaRows(html) {
  const rows=[];
  const rowBlocks=String(html).match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)||[];
  for(const block of rowBlocks){
    const cells=[...block.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((match)=>cleanCell(match[1]));
    const countryIndex=cells.findIndex((cell)=>countryCodes[cell.toLowerCase()]);
    if(countryIndex<1) continue;
    const country=countryCodes[cells[countryIndex].toLowerCase()];
    const officialName=[...cells.slice(0,countryIndex)].reverse().find((cell)=>cell&&!/^[-+]?\d+(?:\.\d+)?$/.test(cell));
    const totals=cells.slice(countryIndex+1).filter((cell)=>/^\d{1,3}\.\d{3}$/.test(cell));
    const coefficient=Number(totals[0]);
    const countryPart=Number(totals[1]);
    if(!officialName||!Number.isFinite(coefficient)) continue;
    const rankCell=cells.find((cell)=>/^\d{1,4}$/.test(cell));
    rows.push({
      rank:Number(rankCell)||rows.length+1,officialName,country,coefficient,
      countryPart:Number.isFinite(countryPart)?countryPart:null
    });
  }
  return rows;
}

export function parseCatalog(source) {
  const match=source.match(/Object\.fromEntries\(`([\s\S]*?)`\.trim\(\)\.split\('\\n'\)/);
  if(!match) throw new Error('Takım kataloğu okunamadı.');
  return Object.fromEntries(match[1].trim().split('\n').map((row)=>{
    const [slug,name,country]=row.split('|'); return [slug,{slug,name,country}];
  }));
}

function score(a,b) {
  const x=new Set(normalize(a).split(' ').filter(Boolean));
  const y=new Set(normalize(b).split(' ').filter(Boolean));
  if(!x.size||!y.size) return 0;
  let common=0; x.forEach((token)=>{if(y.has(token))common+=1;});
  return common/Math.max(x.size,y.size);
}

export function matchRows(catalog,rows) {
  const clubs={},unmatched=[],associationFloorSlugs=[];
  for(const [slug,club] of Object.entries(catalog)){
    const names=[club.name,...(aliases[slug]||[])];
    const exact=new Set(names.map(normalize));
    const sameCountry=rows.filter((row)=>row.country===club.country);
    let hit=sameCountry.find((row)=>exact.has(normalize(row.officialName)));
    if(!hit){
      const ranked=sameCountry.map((row)=>({row,value:Math.max(...names.map((name)=>score(name,row.officialName)))}))
        .sort((a,b)=>b.value-a.value||a.row.rank-b.row.rank);
      if(ranked[0]?.value>=0.66&&(!ranked[1]||ranked[0].value>ranked[1].value)) hit=ranked[0].row;
    }
    if(hit){
      clubs[slug]={coefficient:hit.coefficient,rank:hit.rank,officialName:hit.officialName,country:hit.country,associationFloor:false};
      continue;
    }
    const floor=Math.max(...sameCountry.map((row)=>row.countryPart).filter(Number.isFinite));
    if(Number.isFinite(floor)){
      clubs[slug]={coefficient:floor,rank:null,officialName:`${club.name} (association floor)`,country:club.country,associationFloor:true};
      associationFloorSlugs.push(slug);
      continue;
    }
    unmatched.push(slug);
  }
  return {clubs,unmatched,associationFloorSlugs};
}

function stripHtml(html='') {
  return cleanCell(String(html).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' '));
}

export function parseOfficialTopFive(html) {
  const text=stripHtml(html);
  const start=text.search(/Club coefficients/i);
  if(start<0) return [];
  const section=text.slice(start,start+3500);
  const rows=[];
  const regex=/\b([1-5])\s+(.+?)\s+(GER|ESP|FRA|ENG|ITA)\s+(\d{1,3}\.\d{3})\s+\d{1,3}\.\d{3}/g;
  for(const match of section.matchAll(regex)){
    rows.push({rank:Number(match[1]),officialName:match[2].replace(/^.*?(?=Bayern München|Real Madrid|Paris|Liverpool|Inter)/,'').trim(),country:match[3],coefficient:Number(match[4])});
  }
  return rows.slice(0,5);
}

function validateTopFive(rows,officialRows) {
  const expected=officialRows.length===5?officialRows:[
    {rank:1,coefficient:147.5},{rank:2,coefficient:144.5},{rank:3,coefficient:132},
    {rank:4,coefficient:130},{rank:5,coefficient:127}
  ];
  const top=rows.slice(0,5);
  if(top.length!==5) throw new Error('Tam sıralamanın ilk beş takımı okunamadı.');
  expected.forEach((official,index)=>{
    if(top[index].rank!==official.rank||Math.abs(top[index].coefficient-official.coefficient)>0.0001){
      throw new Error(`UEFA doğrulaması uyuşmadı: sıra ${official.rank}, ${top[index].coefficient} yerine ${official.coefficient}.`);
    }
  });
  return officialRows.length===5?'live-uefa-overview':'reviewed-uefa-snapshot';
}

async function fetchText(url) {
  const response=await fetch(url,{headers:{'user-agent':'Mozilla/5.0 (compatible; UCLDrawCoefficientUpdater/1.0)','accept-language':'en-GB,en;q=0.9'}});
  if(!response.ok) throw new Error(`${url} ${response.status} döndürdü.`);
  return response.text();
}

export async function update() {
  const catalog=parseCatalog(await readFile(loaderPath,'utf8'));
  const [rankingHtml,uefaHtml]=await Promise.all([fetchText(SOURCE_URL),fetchText(UEFA_VALIDATION_URL).catch(()=>null)]);
  const rows=parseKassiesaRows(rankingHtml);
  if(rows.length<300) throw new Error(`Tam katsayı tablosundan yalnızca ${rows.length} kulüp okundu; mevcut dosya korundu.`);
  const officialRows=uefaHtml?parseOfficialTopFive(uefaHtml):[];
  const validationMode=validateTopFive(rows,officialRows);
  const matched=matchRows(catalog,rows);
  if(Object.keys(matched.clubs).length<130) throw new Error(`Yalnızca ${Object.keys(matched.clubs).length} yerel takım katsayı aldı; mevcut dosya korundu.`);
  const clubs=Object.fromEntries(Object.entries(matched.clubs).sort(([a],[b])=>a.localeCompare(b,'en')));
  const payload={
    season:'2026/27',sourceUrl:SOURCE_URL,officialValidationUrl:UEFA_VALIDATION_URL,
    officialValidation:validationMode,updatedAt:new Date().toISOString(),officialRowCount:rows.length,
    associationFloorSlugs:matched.associationFloorSlugs,unmatchedSlugs:matched.unmatched,clubs
  };
  const output=`// Generated from the UEFA 2026 five-year ranking reproduced by Kassiesa.\n// Cross-checked against UEFA.com's official top five.\n(() => {\n  'use strict';\n  window.UCLDRAW_CLUB_COEFFICIENTS = Object.freeze(${JSON.stringify(payload,null,2)});\n})();\n`;
  await writeFile(outputPath,output,'utf8');
  console.log(`UEFA coefficients updated: ${Object.keys(clubs).length}/${Object.keys(catalog).length} clubs, ${matched.associationFloorSlugs.length} association floors, ${rows.length} ranked rows (${validationMode}).`);
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  update().catch((error)=>{console.error(error.stack||error.message);process.exitCode=1;});
}
