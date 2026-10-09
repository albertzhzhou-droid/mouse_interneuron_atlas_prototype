import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const [inventoryPath, outputPath] = process.argv.slice(2);
const inventory=JSON.parse(await readFile(inventoryPath,'utf8'));
const page=new URL(inventory.pageUrl);if(!['localhost','127.0.0.1','[::1]'].includes(page.hostname))throw Error('Localhost receipts only');
const rows=[{kind:'document',url:page.href},...inventory.assets.filter(x=>new URL(x.url).origin===page.origin)];
const files=await Promise.all(rows.map(async x=>{const r=await fetch(x.url,{redirect:'error',headers:{'accept-encoding':'identity'}});const b=Buffer.from(await r.arrayBuffer());return {kind:x.kind,url:x.url,status:r.status,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex'),contentType:r.headers.get('content-type'),contentEncoding:r.headers.get('content-encoding'),contentLength:r.headers.get('content-length')};}));
const result={scope:'HTTP identity response bodies for the actual browser-observed local asset set; not browser wire transfer, parse/execute or latency',pageUrl:page.href,excludedRemoteAssets:inventory.assets.filter(x=>new URL(x.url).origin!==page.origin).map(x=>x.url),files,totals:Object.fromEntries(['document','script','stylesheet','other'].map(k=>[k,{count:files.filter(x=>x.kind===k && x.status===200).length,bytes:files.filter(x=>x.kind===k && x.status===200).reduce((s,x)=>s+x.bytes,0)}]))};
await writeFile(outputPath,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result.totals));
