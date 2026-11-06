// Verkent live configuratoren: legt schermbeelden en knoppen vast.
const {chromium}=require('playwright');const fs=require('fs');
const targets=[['deur','https://app.smederijpapendrecht.nl/embed/configurator-3d?brand=dvs'],['kantoorwand','https://app.smederijpapendrecht.nl/embed-kantoorwand.html?brand=vistamont'],['balustrade','https://app.smederijpapendrecht.nl/embed-balustrade.html?brand=vistamont']];
(async()=>{fs.mkdirSync('output/probe',{recursive:true});const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
// Optioneel: jobs/probe-*.json met {name,url,wait,walk:[{click,exact?}]} loopt stappen af en legt per stap beeld en knoppen vast.
const walks=fs.readdirSync('jobs').filter(f=>f.startsWith('probe-')&&f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync('jobs/'+f))).filter(j=>j.walk);
for(const j of walks){const c=await b.newContext({viewport:{width:540,height:1000},deviceScaleFactor:2,isMobile:true,hasTouch:true});const p=await c.newPage();
 const dump=async n=>{await p.screenshot({path:`output/probe/${j.name}-${n}.jpg`,type:'jpeg',quality:70});const t=await p.$$eval('button,a,[role=button]',bs=>bs.filter(x=>x.offsetParent).map(x=>x.innerText.trim().replace(/\s+/g,' ')).filter(Boolean));fs.writeFileSync(`output/probe/${j.name}-${n}.txt`,t.join('\n'))};
 try{await p.goto(j.url,{timeout:120000,waitUntil:'domcontentloaded'});await p.waitForTimeout(j.wait||30000);await dump(0);
  for(let i=0;i<j.walk.length;i++){const a=j.walk[i];const ok=await p.evaluate(({t,exact})=>{const n=x=>x.innerText.trim().replace(/\s+/g,' ');const el=[...document.querySelectorAll('button,a,[role=button]')].filter(x=>x.offsetParent).find(x=>exact?n(x)===t:n(x).includes(t));if(!el)return false;el.click();return true},{t:a.click,exact:!!a.exact});await p.waitForTimeout(a.wait||6000);if(!ok)fs.appendFileSync(`output/probe/${j.name}-log.txt`,`niet gevonden: ${a.click}\n`);await dump(i+1)}
 }catch(e){fs.appendFileSync(`output/probe/${j.name}-log.txt`,'FOUT '+e.message+'\n')}await c.close()}
if(walks.length){await b.close();return}
for(const [n,u] of targets){const c=await b.newContext({viewport:{width:540,height:960},deviceScaleFactor:2,isMobile:true,hasTouch:true});const p=await c.newPage();
 try{await p.goto(u,{timeout:90000,waitUntil:'domcontentloaded'});await p.waitForTimeout(30000);await p.screenshot({path:`output/probe/${n}.jpg`,type:'jpeg',quality:75});
  const t=await p.$$eval('button,a,[role=button]',bs=>bs.filter(x=>x.offsetParent).map(x=>x.innerText.trim().replace(/\s+/g,' ')).filter(Boolean).slice(0,80));
  fs.writeFileSync(`output/probe/${n}.txt`,t.join('\n')+'\n---\n'+(await p.innerText('body')).slice(0,1500));
 }catch(e){fs.writeFileSync(`output/probe/${n}.txt`,'FOUT '+e.message)}await c.close()}
await b.close()})();
