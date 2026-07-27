import { access, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const loaderPath = path.join(root, 'team-pool-loader.js');
const outputPath = path.join(root, 'generated-club-coefficients.js');
export const SOURCE_URL = 'https://www.uefa.com/nationalassociations/uefarankings/?year=2026';

const aliases = {
  psg: ['Paris', 'Paris SG'], city: ['Man City'], manu: ['Man United'],
  bayern: ['Bayern Munich'], bvb: ['Dortmund'], inter: ['Internazionale'],
  milan: ['Milan'], atleti: ['Atletico Madrid'], sporting: ['Sporting'],
  brugge: ['Club Brugge KV'], slavia: ['Slavia Prague'], spartapraha: ['Sparta Prague'],
  crvenazvezda: ['Red Star Belgrade'], fenerbahce: ['Fenerbahce SK'],
  galatasaray: ['Galatasaray AS', 'Galatasaray A.Ş.'], besiktas: ['Besiktas JK'],
  basaksehir: ['Istanbul Basaksehir'], qarabag: ['Qarabag'],
  copenhagen: ['FC København', 'København'], bodo: ['Bodo/Glimt'],
  union: ['Union Saint-Gilloise'], salzburg: ['Salzburg'],
  bayerleverkusen: ['Leverkusen'], azalkmaar: ['AZ'], psv: ['PSV'],
  olympiacos: ['Olympiakos'], dynamokyiv: ['Dynamo Kiev'],
  maccabitelaviv: ['Maccabi Tel-Aviv'], ferencvarosi: ['Ferencvaros'],
  poznan: ['Lech Poznan'], klaksvik: ['KI Klaksvik'], kuopio: ['KuPS'],
  vikingurreykjavik: ['Vikingur Reykjavik'], ludogorets: ['Ludogorets Razgrad'],
  fcsb: ['Steaua Bucharest'], nordsjaelland: ['Nordsjaelland'],
  interclubdescaldes: ['Inter Escaldes']
};
const stop = new Set(['fc','cf','sc','ac','afc','sk','jk','fk','as','aş','club','football','futbol','calcio','the']);

export function normalize(value='') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/&/g,' and ').replace(/[’'`´.(),/\\–—_-]+/g,' ')
    .toLowerCase().split(/\s+/).filter((word)=>word&&!stop.has(word)).join(' ').trim();
}

export function parseRows(text) {
  const rows = [];
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.replace(/\s+/g,' ').trim();
    const match = line.match(/^(\d{1,4})\s+(.+?)\s+([A-Z]{3})\s+(\d{1,3}(?:[.,]\d{3}))(?:\s+\d{1,3}(?:[.,]\d{3}))?$/);
    if (!match) continue;
    rows.push({ rank:Number(match[1]), officialName:match[2].trim(), country:match[3], coefficient:Number(match[4].replace(',','.')) });
  }
  return rows;
}

export function parseCatalog(source) {
  const match = source.match(/Object\.fromEntries\(`([\s\S]*?)`\.trim\(\)\.split\('\\n'\)/);
  if (!match) throw new Error('Takım kataloğu okunamadı.');
  return Object.fromEntries(match[1].trim().split('\n').map((row)=>{
    const [slug,name,country]=row.split('|');
    return [slug,{slug,name,country}];
  }));
}

function score(a,b) {
  const x = new Set(normalize(a).split(' ').filter(Boolean));
  const y = new Set(normalize(b).split(' ').filter(Boolean));
  if (!x.size || !y.size) return 0;
  let common=0; x.forEach((token)=>{ if(y.has(token)) common+=1; });
  return common/Math.max(x.size,y.size);
}

export function matchRows(catalog, rows) {
  const clubs = {}, unmatched = [];
  for (const [slug, club] of Object.entries(catalog)) {
    const names = [club.name, ...(aliases[slug]||[])];
    const exact = new Set(names.map(normalize));
    const sameCountry = rows.filter((row)=>row.country===club.country);
    let hit = sameCountry.find((row)=>exact.has(normalize(row.officialName)));
    if (!hit) {
      const ranked = sameCountry.map((row)=>({row,value:Math.max(...names.map((name)=>score(name,row.officialName))) }))
        .sort((a,b)=>b.value-a.value||a.row.rank-b.row.rank);
      if (ranked[0]?.value>=0.72 && (!ranked[1] || ranked[0].value>ranked[1].value)) hit=ranked[0].row;
    }
    if (!hit) { unmatched.push(slug); continue; }
    clubs[slug]={coefficient:hit.coefficient,rank:hit.rank,officialName:hit.officialName,country:hit.country};
  }
  return {clubs,unmatched};
}

async function chromePath() {
  const candidates=[process.env.CHROME_PATH,process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'];
  for (const candidate of candidates.filter(Boolean)) {
    try { await access(candidate,constants.X_OK); return candidate; } catch {}
  }
  for (const command of ['google-chrome','google-chrome-stable','chromium']) {
    try { const value=execFileSync('which',[command],{encoding:'utf8'}).trim(); if(value) return value; } catch {}
  }
  throw new Error('Chrome bulunamadı.');
}

async function officialRows() {
  const {default:puppeteer}=await import('puppeteer-core');
  const browser=await puppeteer.launch({executablePath:await chromePath(),headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const texts=[], json=[];
  try {
    const page=await browser.newPage();
    await page.setViewport({width:1440,height:1100});
    page.on('response',async(response)=>{
      const type=response.headers()['content-type']||'';
      if (!type.includes('json')) return;
      try { json.push(await response.json()); } catch {}
    });
    await page.goto(SOURCE_URL,{waitUntil:'networkidle2',timeout:120000});
    await new Promise((resolve)=>setTimeout(resolve,3500));
    await page.evaluate(()=>{
      [...document.querySelectorAll('button')].find((button)=>/accept|agree|allow all/i.test(button.textContent||''))?.click();
    }).catch(()=>{});
    await new Promise((resolve)=>setTimeout(resolve,1200));

    const target=await page.evaluate(()=>{
      const headings=[...document.querySelectorAll('h1,h2,h3,h4')];
      const heading=headings.find((node)=>/^club coefficients$/i.test((node.textContent||'').replace(/\s+/g,' ').trim()));
      if(!heading)return null;
      const headingBottom=heading.getBoundingClientRect().bottom;
      const actions=[...document.querySelectorAll('a,button')]
        .filter((node)=>/view full rankings/i.test((node.textContent||'').replace(/\s+/g,' ').trim()))
        .map((node)=>({node,top:node.getBoundingClientRect().top}))
        .filter((entry)=>entry.top>=headingBottom-8)
        .sort((first,second)=>first.top-second.top);
      const action=actions[0]?.node;
      if(!action)return null;
      if(action.tagName==='A'&&action.href)return {href:action.href};
      action.click();
      return {clicked:true};
    });

    if(target?.href){
      await page.goto(target.href,{waitUntil:'networkidle2',timeout:120000});
    }else if(target?.clicked){
      await page.waitForNetworkIdle({idleTime:1000,timeout:45000}).catch(()=>{});
    }else{
      throw new Error('UEFA genel sıralama sayfasında Club coefficients tam sıralama bağlantısı bulunamadı.');
    }

    await new Promise((resolve)=>setTimeout(resolve,4500));
    await page.evaluate(()=>{
      document.querySelectorAll('select').forEach((select)=>{
        const option=[...select.options].filter((item)=>/all|100|200|500/i.test(item.textContent||item.value)).at(-1);
        if(option){select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));}
      });
    }).catch(()=>{});
    await new Promise((resolve)=>setTimeout(resolve,1800));

    for(let index=0;index<30;index+=1){
      texts.push(...await page.evaluate(()=>[...new Set([...document.querySelectorAll('tr,[role="row"]')].map((node)=>(node.innerText||'').replace(/\s+/g,' ').trim()).filter(Boolean))]));
      const clicked=await page.evaluate(()=>{
        const next=[...document.querySelectorAll('button,a')].find((node)=>{
          const label=`${node.getAttribute('aria-label')||''} ${node.textContent||''}`.replace(/\s+/g,' ').trim();
          return !node.matches('[disabled],[aria-disabled="true"]') && /^(next|next page|›|»|chevron_right)$/i.test(label);
        });
        if(!next)return false; next.click(); return true;
      }).catch(()=>false);
      if(!clicked)break;
      await new Promise((resolve)=>setTimeout(resolve,1300));
    }
    texts.push(await page.evaluate(()=>document.body.innerText||''));
  } finally { await browser.close(); }

  function walk(value,out=[]){
    if(!value||typeof value!=='object')return out;
    if(Array.isArray(value)){value.forEach((item)=>walk(item,out));return out;}
    const name=value.clubName||value.teamName||value.displayName||value.name||value.club?.displayName||value.club?.internationalName||value.team?.displayName||value.team?.internationalName||value.participant?.displayName||value.participant?.internationalName;
    const country=value.countryCode||value.associationCode||value.association?.code||value.association?.countryCode||value.country?.code;
    const rank=Number(value.rank??value.position??value.ranking??value.order);
    const coefficient=Number(String(value.coefficient??value.clubCoefficient??value.totalCoefficient??value.total??value.points??value.value??value.coefficients?.total??'').replace(',','.'));
    if(typeof name==='string'&&/^[A-Z]{3}$/.test(country||'')&&Number.isInteger(rank)&&rank>0&&Number.isFinite(coefficient)&&coefficient<1000)out.push({rank,officialName:name,country,coefficient});
    Object.values(value).forEach((item)=>walk(item,out)); return out;
  }
  const all=[...parseRows(texts.join('\n')),...json.flatMap((item)=>walk(item))];
  const unique=new Map();
  all.forEach((row)=>unique.set(`${row.rank}|${normalize(row.officialName)}|${row.country}`,row));
  return [...unique.values()].sort((a,b)=>a.rank-b.rank);
}

export async function update() {
  const catalog=parseCatalog(await readFile(loaderPath,'utf8'));
  const rows=await officialRows();
  if(rows.length<100)throw new Error(`UEFA tablosundan yalnızca ${rows.length} satır okundu; mevcut dosya korundu.`);
  const matched=matchRows(catalog,rows);
  if(Object.keys(matched.clubs).length<75)throw new Error(`Yalnızca ${Object.keys(matched.clubs).length} takım eşleşti; mevcut dosya korundu.`);
  const clubs=Object.fromEntries(Object.entries(matched.clubs).sort(([a],[b])=>a.localeCompare(b,'en')));
  const payload={season:'2026/27',sourceUrl:SOURCE_URL,updatedAt:new Date().toISOString(),officialRowCount:rows.length,unmatchedSlugs:matched.unmatched,clubs};
  const output=`// Generated from UEFA's official men's club coefficient ranking.\n// Source: ${SOURCE_URL}\n(() => {\n  'use strict';\n  window.UCLDRAW_CLUB_COEFFICIENTS = Object.freeze(${JSON.stringify(payload,null,2)});\n})();\n`;
  await writeFile(outputPath,output,'utf8');
  console.log(`UEFA coefficients updated: ${Object.keys(clubs).length}/${Object.keys(catalog).length} matched from ${rows.length} rows.`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  update().catch((error)=>{console.error(error.stack||error.message);process.exitCode=1;});
}
