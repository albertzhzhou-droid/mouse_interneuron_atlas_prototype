import { open,writeFile,readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
async function readFile(path,encoding){
 const file=await open(path,'r');
 try{
  const info=await file.stat();assert.ok(info.isFile(),path);const bytes=Buffer.alloc(info.size);let offset=0;
  while(offset<bytes.length){const result=await file.read(bytes,offset,bytes.length-offset,offset);assert.ok(result.bytesRead>0,path);offset+=result.bytesRead;}
  assert.equal((await file.stat()).size,bytes.length,path);return encoding?bytes.toString(encoding):bytes;
 }finally{await file.close();}
}
const root='/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype', temp='/private/tmp/ohri-i22-local-verification', qa=root+'/docs/qa/2026-10-02-implementation-37/';
const sha=b=>createHash('sha256').update(b).digest('hex');
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const manifestBytes=await readFile(root+'/data/research-iteration-manifest-2.91.json'), manifest=JSON.parse(manifestBytes);
const before=await json(qa+'before-authoritative-inputs.json'), owned=await json(qa+'before-owned-inputs.json');
const allow=new Set(owned.map(x=>x.path)), pins=new Map(manifest.authoritativeInputs.map(x=>[x.path,x]));
let checked=0,compiled=0,preserved=0;
for(const x of manifest.authoritativeInputs){
 for(const dir of [root,temp]){const b=await readFile(dir+'/'+x.path);assert.equal(b.length,x.bytes,x.path);assert.equal(sha(b),x.sha256,x.path);}
 if(x.path.startsWith('public/data/svara_catalogue_pages_v1/')){const b=await readFile(temp+'/dist/client/'+x.path.slice(7));assert.equal(b.length,x.bytes);assert.equal(sha(b),x.sha256);compiled++;}
 checked++;if(checked%500===0) console.log('Current input pairs checked:',checked);
}
for(const x of before){assert.ok(pins.has(x.path));if(!allow.has(x.path)){const b=await readFile(root+'/'+x.path);assert.equal(b.length,x.bytes);assert.equal(sha(b),x.sha256,x.path);preserved++;}}
const {unzipSync}=createRequire(temp+'/package.json')('fflate'); const zip=unzipSync(await readFile(qa+'owned-before.zip'));
for(const x of owned){const b=zip[x.path];assert.equal(b.length,x.bytes);assert.equal(sha(b),x.sha256);assert.equal(x.capturedBeforeEdit,true);}
assert.deepEqual(manifestBytes,await readFile(temp+'/data/research-iteration-manifest-2.91.json'));
const docs=['docs/UPGRADE_PLAN_2026-09-24.md','docs/GOAL_REQUIREMENT_AUDIT_2026-09-30.md','docs/RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_37_SVARA_LINKS.md'];const hits={};
for(const p of docs){hits[p]={};for(const [scope,dir] of [['client','dist/client/_next/static/chunks'],['server','dist/server/ssr/_next/static']]){const files=(await readdir(temp+'/'+dir)).filter(name=>name.startsWith('source-view-png-raster-')&&name.endsWith('.js'));const matched=[];for(const name of files){if((await readFile(temp+'/'+dir+'/'+name)).includes(Buffer.from(pins.get(p).sha256)))matched.push(dir+'/'+name);}assert.ok(matched.length,p);hits[p][scope]=matched;}}
const previous=new Set(before.map(x=>x.path));const result={authoritativeInputs:checked,workspaceAndTempInputMismatches:0,compiledPngsChecked:compiled,compiledPngMismatches:0,priorUnownedInputsPreserved:preserved,priorUnownedDrift:0,ownedPreimagesVerified:owned.length,allPreimagesCapturedBeforeEdit:true,manifestSha256:sha(manifestBytes),addedManifestPaths:[...pins.keys()].filter(p=>!previous.has(p)),removedManifestPaths:[],finalDocumentFingerprintsInCompiledBundles:hits,reader:'Node exact-size explicit-offset reads with before/after fstat; interrupted Python read_bytes and Node readFile checks did not complete and are not counted'};
assert.equal(checked,2255);assert.equal(compiled,212);assert.equal(preserved,2245);
await writeFile(qa+'final-input-replay.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
