// Verkent live configuratoren: legt schermbeelden en knoppen vast.
const {chromium}=require('playwright');const fs=require('fs');
const targets=[['deur','https://app.smederijpapendrecht.nl/embed/configurator-3d?brand=dvs'],['kantoorwand','https://app.smederijpapendrecht.nl/embed-kantoorwand.html?brand=vistamont'],['balustrade','https://app.smederijpapendrecht.nl/embed-balustrade.html?brand=vistamont']];
(async()=>{fs.mkdirSync('output/probe',{recursive:true});const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
for(const [n,u] of targets){const c=await b.newContext({viewport:{width:540,height:960},deviceScaleFactor:2,isMobile:true,hasTouch:true});const p=await c.newPage();
 try{await p.goto(u,{timeout:90000,waitUntil:'domcontentloaded'});await p.waitForTimeout(30000);await p.screenshot({path:`output/probe/${n}.jpg`,type:'jpeg',quality:75});
  const t=await p.$$eval('button,a,[role=button]',bs=>bs.filter(x=>x.offsetParent).map(x=>x.innerText.trim().replace(/\s+/g,' ')).filter(Boolean).slice(0,80));
  fs.writeFileSync(`output/probe/${n}.txt`,t.join('\n')+'\n---\n'+(await p.innerText('body')).slice(0,1500));
 }catch(e){fs.writeFileSync(`output/probe/${n}.txt`,'FOUT '+e.message)}await c.close()}
await b.close()})();
