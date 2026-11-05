// Neemt een live configurator op in stappen en maakt er een opgemaakte reel van (1080x1920).
const {chromium}=require('playwright');const fs=require('fs'),{execFileSync}=require('child_process');
const b64=(f,t='png')=>`data:image/${t};base64,`+fs.readFileSync(f).toString('base64');
const esc=s=>String(s||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const SCALE=900/1080;
function frame(j,s,shot,ring){const logo=b64(`logos/${j.brand}-logo-transparant-wit.png`);
 const r=ring?`<div style="position:absolute;left:${90+ring.x*2*SCALE-46}px;top:${j.top+ring.y*2*SCALE-46}px;width:92px;height:92px;border:3px solid #b08d57;border-radius:50%;background:rgba(176,141,87,.22)"></div>`:'';
 return `<!doctype html><meta charset=utf-8><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap" rel=stylesheet><style>*{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;background:#0b0b0b;position:relative;overflow:hidden;font-family:Inter,sans-serif;color:#fff}
.lg{position:absolute;top:70px;left:0;right:0;text-align:center}.lg img{height:${j.logoHeight||110}px}
.h{position:absolute;top:${70+(j.logoHeight||110)+24}px;left:70px;right:70px;text-align:center;font-size:44px;line-height:1.2;font-weight:500}
.s{position:absolute;left:90px;top:${j.top}px;width:900px;height:${j.frameH}px;overflow:hidden;border:1px solid rgba(176,141,87,.75)}.s img{width:100%;display:block}
.c{position:absolute;left:0;right:0;top:${j.top+j.frameH+36}px;text-align:center}.l{width:64px;height:1px;background:#b08d57;margin:0 auto 18px}.t{font-size:26px;letter-spacing:.2em;font-weight:500}</style>
<div class=lg><img src="${logo}"></div><div class=h>${esc(s.text)}</div><div class=s><img src="${b64(shot,'jpeg')}"></div>${r}<div class=c><div class=l></div><div class=t>${esc(j.cta).toUpperCase()}</div></div>`}
async function act(p,a){if(a.click){const l=p.getByRole('button',{name:a.click,exact:!!a.exact}).first();const c=await l.count()?l:p.getByText(a.click,{exact:!!a.exact}).first();
  await c.scrollIntoViewIfNeeded({timeout:8000});const box=await c.boundingBox();await c.click({timeout:8000});return box&&{x:box.x+box.width/2,y:box.y+box.height/2}}
 if(a.scroll){await p.mouse.wheel(0,a.scroll)}return null}
(async()=>{const jobs=fs.readdirSync('jobs').filter(x=>x.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync('jobs/'+f))).filter(j=>j.type==='reel'&&!fs.existsSync(`output/${j.id}-reel.mp4`));
 if(!jobs.length)return;const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
 for(const j of jobs){j.top=j.top||(70+(j.logoHeight||110)+24+130);j.frameH=1920-j.top-300;const tmp=`/tmp/${j.id}`;fs.mkdirSync(tmp,{recursive:true});const log=[];
  const c=await b.newContext({viewport:{width:540,height:Math.round(j.frameH/SCALE/2)},deviceScaleFactor:2,isMobile:true,hasTouch:true});const p=await c.newPage();
  await p.goto(j.url,{timeout:120000,waitUntil:'domcontentloaded'});await p.waitForTimeout(j.firstWait||25000);
  const v=await b.newPage({viewport:{width:1080,height:1920}});const files=[];let n=0;
  for(const s of j.scenes){let ring=null;for(const a of (s.do||[])){try{ring=await act(p,a)||ring}catch(e){log.push('FOUT '+JSON.stringify(a)+' '+e.message.split('\n')[0])}}
   await p.waitForTimeout(s.wait||5000);const shot=`${tmp}/s${n}.jpg`;await p.screenshot({path:shot,type:'jpeg',quality:92});
   log.push(`scene ${n}: `+(await p.$$eval('button',bs=>bs.filter(x=>x.offsetParent).map(x=>x.innerText.trim().replace(/\s+/g,' ')).filter(Boolean).slice(0,45).join(' | '))));
   await v.setContent(frame(j,s,shot,null),{waitUntil:'networkidle'});await v.waitForTimeout(300);const f=`${tmp}/f${n}.png`;await v.screenshot({path:f});files.push({f,d:s.dur||3});
   n++}
  await c.close();await v.close();
  const fade=.5;const inp=[];files.forEach(x=>inp.push('-loop','1','-t',String(x.d),'-framerate','30','-i',x.f));
  let fc='',last='0:v',off=0;for(let i=1;i<files.length;i++){off+=files[i-1].d-fade;fc+=`[${last}][${i}:v]xfade=transition=fade:duration=${fade}:offset=${off.toFixed(2)}[v${i}];`;last=`v${i}`}
  fc+=`[${last}]format=yuv420p[out]`;const total=off+files[files.length-1].d;
  execFileSync('ffmpeg',['-y',...inp,'-f','lavfi','-t',total.toFixed(2),'-i','anullsrc=r=44100:cl=stereo','-filter_complex',fc,'-map','[out]','-map',`${files.length}:a`,'-c:v','libx264','-preset','medium','-crf','20','-r','30','-c:a','aac','-b:a','128k','-movflags','+faststart',`output/${j.id}-reel.mp4`],{stdio:'inherit'});
  fs.copyFileSync(files[Math.min(1,files.length-1)].f,`output/${j.id}-still.png`);fs.writeFileSync(`output/${j.id}-log.txt`,log.join('\n'));}
 await b.close()})().catch(e=>{console.error(e);process.exit(1)});
