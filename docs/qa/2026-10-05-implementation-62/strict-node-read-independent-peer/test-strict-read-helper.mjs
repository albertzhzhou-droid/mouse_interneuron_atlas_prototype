import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const source=fs.readFileSync(new URL('./exact-root-helper.mjs',import.meta.url),'utf8');
const imports=source.match(/^import .*;$/gm);assert.equal(imports.length,4);
const program=source.replace(/^import .*;\n/gm,'');
const assemble=new Function('fs','fileURLToPath','resolve','syncBuiltinESMExports','process','Buffer','DOMException',program+'\nreturn fs.promises.readFile;');
const digest=b=>createHash('sha256').update(b).digest('hex');
const base=(size,changes={})=>({dev:1n,ino:2n,size:BigInt(size),mtimeNs:10n,ctimeNs:11n,...changes});
function setup(plans){
 let index=-1,statCalls=0,fstatCalls=0;const events=[],logs=[],delegated=[];
 const fake={promises:{readFile:async(...args)=>{delegated.push(args);return 'ORIGINAL_NON_FILENAME';}},
 openSync(file,mode){index++;assert(index<plans.length);events.push(['open',index]);assert.equal(mode,'r');fstatCalls=0;statCalls=0;return 90+index;},
 fstatSync(fd,options){assert.equal(options.bigint,true);assert.equal(fd,90+index);fstatCalls++;return fstatCalls===1?plans[index].before:plans[index].end??plans[index].before;},
 statSync(file,options){assert.equal(options.bigint,true);statCalls++;events.push(['pathStat',index,statCalls]);
  if(index<0)return plans[0].pathPre??plans[0].before;
  if(plans[index].pathOverride)return plans[index].pathOverride;
  return plans[index].pathEnd??plans[index].end??plans[index].before;},
 readSync(fd,out,offset,length,position){assert.equal(fd,90+index);assert.equal(position,offset);assert(length<=4096);events.push(['read',index,offset,length]);const p=plans[index];
  if(p.io)throw Object.assign(new Error('synthetic IO'),{code:'EIO'});
  if(p.eof)return 0;
  const n=Math.min(length,p.short??length,p.body.length-offset);if(n<=0)return 0;p.body.copy(out,offset,offset,offset+n);if(p.abortOnRead)p.abortOnRead.aborted=true;return n;},
 closeSync(fd){events.push(['close',index]);assert.equal(fd,90+index);},
 readdirSync(...args){return {original:'sync-readdir',args};},writeFileSync(...args){return {original:'sync-write',args};}};
 const read=assemble(fake,fileURLToPath,resolve,()=>{}, {stderr:{write:s=>logs.push(JSON.parse(s))}},Buffer,DOMException);
 return {read,fake,events,logs,delegated,plan:plans,get opens(){return events.filter(e=>e[0]==='open').length;},get closes(){return events.filter(e=>e[0]==='close').length;},setPath(epoch){plans[index].pathOverride=epoch;}};
}
const tests=[];function test(name,fn){tests.push([name,fn]);}
const path=resolve('/private/tmp/ohri-i62-strict-node-read-bounded-peer-20261005/fake-source.json');
function plan(text,over={}){const body=Buffer.from(text);return {body,before:base(body.length),...over};}
test('4K positional complete bytes and UTF8 original encoding',async()=>{const text='x'.repeat(9000);let s=setup([plan(text)]);assert.deepEqual(await s.read(path),Buffer.from(text));assert.deepEqual(s.events.filter(e=>e[0]==='read').map(e=>e[2]),[0,4096,8192]);assert.equal(s.opens,1);assert.equal(s.closes,1);s=setup([plan(text)]);assert.equal(await s.read(path,'utf8'),text);});
test('short reads advance by actual n',async()=>{const s=setup([plan('abcdefghijk',{short:3})]);assert.equal((await s.read(path)).toString(),'abcdefghijk');assert.deepEqual(s.events.filter(e=>e[0]==='read').map(e=>e[2]),[0,3,6,9]);});
test('unseen metadata retry discards all first body',async()=>{const s=setup([plan('REFUSED',{end:base(7,{mtimeNs:20n})}),plan('ACCEPT!',{before:base(7,{mtimeNs:20n})})]);assert.equal((await s.read(path)).toString(),'ACCEPT!');assert.equal(s.opens,2);assert.equal(s.closes,2);assert.equal(s.logs.length,1);assert.equal(s.logs[0].attempt,1);assert.equal(s.logs[0].previouslyAccepted,false);});
test('permanent unseen metadata refusal stops at3 complete bodies',async()=>{const s=setup([plan('abc',{end:base(3,{ctimeNs:99n})}),plan('def',{end:base(3,{ctimeNs:99n})}),plan('ghi',{end:base(3,{ctimeNs:99n})})]);await assert.rejects(()=>s.read(path),/Source epoch changed/);assert.equal(s.opens,3);assert.equal(s.closes,3);assert.equal(s.logs.length,3);assert.deepEqual(s.logs.map(x=>x.attempt),[1,2,3]);});
test('accepted later pre-read epoch drift never retries or opens',async()=>{const s=setup([plan('abc')]);await s.read(path);s.setPath(base(3,{mtimeNs:99n}));await assert.rejects(()=>s.read(path),/Previously accepted/);assert.equal(s.opens,1);assert.equal(s.closes,1);assert.equal(s.logs.length,0);});
test('accepted mid-read drift never retries',async()=>{const s=setup([plan('abc'),plan('abc',{end:base(3,{ctimeNs:99n})})]);await s.read(path);await assert.rejects(()=>s.read(path),/Source epoch changed/);assert.equal(s.opens,2);assert.equal(s.closes,2);assert.equal(s.logs.length,1);assert.equal(s.logs[0].previouslyAccepted,true);assert.equal(s.logs[0].attempt,1);});
test('accepted drift after pre-check and before fd before rejects no retry',async()=>{const s=setup([plan('abc'),plan('abc',{before:base(3,{mtimeNs:99n})})]);await s.read(path);await assert.rejects(()=>s.read(path),/Previously accepted source epoch changed after read/);assert.equal(s.opens,2);assert.equal(s.closes,2);assert.equal(s.logs.length,0);});
test('pathEnd disagreement only unseen allows fresh full retry',async()=>{const s=setup([plan('abc',{pathEnd:base(3,{ino:50n})}),plan('def',{before:base(3,{ino:50n})})]);assert.equal((await s.read(path)).toString(),'def');assert.equal(s.opens,2);assert.equal(s.logs.length,1);});
test('EOF never retries',async()=>{const s=setup([plan('abc',{eof:true})]);await assert.rejects(()=>s.read(path),/Incomplete exact positional read/);assert.equal(s.opens,1);assert.equal(s.closes,1);assert.equal(s.logs.length,0);});
test('IO never retries',async()=>{const s=setup([plan('abc',{io:true})]);await assert.rejects(()=>s.read(path),e=>e.code==='EIO');assert.equal(s.opens,1);assert.equal(s.closes,1);assert.equal(s.logs.length,0);});
test('aborted before read never opens or retries',async()=>{const s=setup([plan('abc')]);await assert.rejects(()=>s.read(path,{signal:{aborted:true}}),e=>e.name==='AbortError');assert.equal(s.opens,0);assert.equal(s.logs.length,0);});
test('aborted during partial read closes no retry',async()=>{const signal={aborted:false};const s=setup([plan('abcdefgh',{short:3,abortOnRead:signal})]);await assert.rejects(()=>s.read(path,{signal}),e=>e.name==='AbortError');assert.equal(s.opens,1);assert.equal(s.closes,1);assert.equal(s.logs.length,0);});
test('relative string and fileURL share immutable absolute anchor',async()=>{const relative='alias-source.json',absolute=resolve(relative);const s=setup([plan('abc'),plan('abc')]);await s.read(relative);await s.read(pathToFileURL(absolute));s.setPath(base(3,{ctimeNs:99n}));await assert.rejects(()=>s.read(absolute),/Previously accepted/);assert.equal(s.opens,2);});
test('external original SHA validator retains authority',async()=>{const expected=digest(Buffer.from('abc'));const s=setup([plan('xyz')]);const b=await s.read(path);assert.throws(()=>assert.equal(digest(b),expected));assert.equal(s.opens,1);assert.equal(s.logs.length,0);});
test('external original length validator retains authority',async()=>{const s=setup([plan('xyz')]);const b=await s.read(path);assert.throws(()=>assert.equal(b.length,4));assert.equal(s.opens,1);});
test('empty regular file retains stable exact epoch',async()=>{const s=setup([plan('')]);assert.deepEqual(await s.read(path),Buffer.alloc(0));assert.equal(s.opens,1);assert.equal(s.closes,1);assert.equal(s.events.filter(e=>e[0]==='read').length,0);});
test('non filename path delegates original behavior',async()=>{const s=setup([]);assert.equal(await s.read({fd:23},'utf8'),'ORIGINAL_NON_FILENAME');assert.equal(s.delegated.length,1);assert.equal(s.opens,0);});
let passed=0;for(const [name,fn]of tests){await fn();console.log('PASS',name);passed++;}console.log(JSON.stringify({status:'PASS_SYNTHETIC_ONLY_STRICT_FIRST_EPOCH_READER',passed,failed:0,sourceFullReads:0,sourceOrRootOrStageWrites:0,scope:'Exact copiedhelper instantiated with injected fake FS; no actual fs.promises patch/import execution or product validators.'}));
