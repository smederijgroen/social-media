// Maakt per job in jobs/*.json de opgemaakte post (1080x1350) en het verhaal (1080x1920).
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const logos={dvs:'dvs',smederij:'smederij',vistamont:'vistamont'};
const b64=f=>'data:image/png;base64,'+fs.readFileSync(f).toString('base64');
const esc=s=>String(s||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function html(j,w,h){const logo=b64(`logos/${logos[j.brand]}-logo-transparant-zwart.png`);const story=h>1400;const top=story?250:190,ph=story?1240:930;
return `<!doctype html><meta charset=utf-8><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap" rel=stylesheet><style>
*{margin:0;box-sizing:border-box}body{width:${w}px;height:${h}px;background:#f7f5f1;position:relative;overflow:hidden;font-family:Inter,sans-serif;color:#111}
.logo{position:absolute;top:${story?80:36}px;left:0;right:0;text-align:center}.logo img{height:${story?140:124}px}
.p{position:absolute;left:0;right:0;top:${top}px;height:${ph}px;background:url("${j.image}") ${j.position||'center'}/cover;border-top:1px solid #b08d57;border-bottom:1px solid #b08d57}
.b{position:absolute;left:0;right:0;top:${top+ph+(story?60:44)}px;text-align:center}.l{width:64px;height:2px;background:#b08d57;margin:0 auto 26px}
.t{font-size:${story?26:24}px;letter-spacing:.3em;font-weight:500;padding-left:.3em}</style><div class=logo><img src="${logo}"></div><div class=p></div><div class=b><div class=l></div><div class=t>${esc(j.line).toUpperCase()}</div></div>`}
(async()=>{const b=await chromium.launch();const done=[];
for(const f of fs.readdirSync('jobs').filter(x=>x.endsWith('.json'))){const j=JSON.parse(fs.readFileSync('jobs/'+f));
 if(j.type!=='photo'||fs.existsSync(`output/${j.id}-post.jpg`))continue;
 for(const [n,w,h] of [['post',1080,1350],['verhaal',1080,1920]]){const p=await b.newPage({viewport:{width:w,height:h}});
  await p.setContent(html(j,w,h),{waitUntil:'networkidle'});await p.waitForTimeout(800);
  await p.screenshot({path:`output/${j.id}-${n}.jpg`,type:'jpeg',quality:92});await p.close();done.push(`${j.id}-${n}`)}}
console.log('klaar',done);await b.close()})().catch(e=>{console.error(e);process.exit(1)});
