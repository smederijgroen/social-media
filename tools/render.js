// Maakt per job in jobs/*.json de opgemaakte post (1080x1350) en het verhaal (1080x1920).
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const logos={dvs:'dvs',smederij:'smederij',vistamont:'vistamont'};
const b64=f=>'data:image/png;base64,'+fs.readFileSync(f).toString('base64');
const esc=s=>String(s||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function html(j,w,h){const logo=b64(`logos/${logos[j.brand]}-logo-transparant-wit.png`);const story=h>1400;
return `<!doctype html><meta charset=utf-8><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap" rel=stylesheet><style>
*{margin:0;box-sizing:border-box}body{width:${w}px;height:${h}px;background:#0b0b0b;position:relative;overflow:hidden;font-family:Inter,sans-serif;color:#fff}
.p{position:absolute;inset:0;background:url("${j.image}") ${j.position||'center'}/cover}
.g{position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,11,11,.4) 0,rgba(11,11,11,0) 14%,rgba(11,11,11,0) ${story?62:58}%,rgba(11,11,11,.92) ${story?82:80}%,#0b0b0b 100%)}
.f{position:absolute;inset:32px;border:1px solid rgba(176,141,87,.75)}
.b{position:absolute;left:0;right:0;bottom:${story?190:78}px;text-align:center}
.b img{height:${j.logoHeight||190}px;display:block;margin:0 auto 34px}
.l{width:64px;height:1px;background:#b08d57;margin:0 auto 22px}
.t{font-size:20px;letter-spacing:.34em;font-weight:500;padding-left:.34em}
</style><div class=p></div><div class=g></div><div class=f></div><div class=b><img src="${logo}"><div class=l></div><div class=t>${esc(j.line).toUpperCase()}</div></div>`}
(async()=>{const b=await chromium.launch();const done=[];
for(const f of fs.readdirSync('jobs').filter(x=>x.endsWith('.json'))){const j=JSON.parse(fs.readFileSync('jobs/'+f));
 if(j.type!=='photo'||fs.existsSync(`output/${j.id}-post.jpg`))continue;
 for(const [n,w,h] of [['post',1080,1350],['verhaal',1080,1920]]){const p=await b.newPage({viewport:{width:w,height:h}});
  await p.setContent(html(j,w,h),{waitUntil:'networkidle'});await p.waitForTimeout(800);
  await p.screenshot({path:`output/${j.id}-${n}.jpg`,type:'jpeg',quality:92});await p.close();done.push(`${j.id}-${n}`)}}
console.log('klaar',done);await b.close()})().catch(e=>{console.error(e);process.exit(1)});
