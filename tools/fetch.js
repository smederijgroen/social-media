// Downloadt bestanden uit jobs/fetch-*.json naar output/<out>.
const fs=require('fs'),path=require('path');
(async()=>{for(const f of fs.readdirSync('jobs').filter(x=>x.startsWith('fetch-'))){const j=JSON.parse(fs.readFileSync('jobs/'+f));
 for(const it of j.items){const o=path.join('output',it.out);fs.mkdirSync(path.dirname(o),{recursive:true});try{const r=await fetch(it.url);if(!r.ok)throw new Error(r.status);fs.writeFileSync(o,Buffer.from(await r.arrayBuffer()));console.log('ok',it.out)}catch(e){console.log('FOUT',it.out,e.message)}}
 fs.unlinkSync('jobs/'+f)}})();
