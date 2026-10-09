import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import full from "../data/neurolucida-dat-file-manifest-0.1.json" with { type: "json" };
import index from "../data/native-dat-manifest-transport-0.1.json" with { type: "json" };
import { buildNativeDatManifestTransport } from "../tools/build_native_dat_manifest_transport.mjs";
import { validateNativeDatManifestTransport } from "../app/native-dat-manifest-transport.js";
import { readVerifiedNativeContours, nativeContourVerification } from "../app/native-contour-verification.js";
const actual = async (url, init) => {
  assert.ok(["default","no-store"].includes(init.cache));
  const b=await readFile(new URL(`../public${url}`,import.meta.url));
  return {ok:true,status:200,arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.length)};
};
test("all complete per-file transports preserve every original inventory field and exact canonical source",async()=>{
  assert.deepEqual(await buildNativeDatManifestTransport(),index);
  for(const row of index.records){const b=await readFile(new URL(`../public${row.transport.path}`,import.meta.url));
    assert.equal(b.length,row.transport.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),row.transport.sha256);
    assert.deepEqual(validateNativeDatManifestTransport(JSON.parse(b),row),full.records.find(r=>r.neuronId===row.neuronId));
    assert.equal(Object.hasOwn(row,'topLevelObjects'),false);assert.equal(Object.hasOwn(row,'markerSizeCorrections'),false);
  }
  const runtime=await readFile(new URL('../app/native-contour-verification.js',import.meta.url),'utf8');
  assert.equal(runtime.includes('import datManifest from "../data/neurolucida-dat-file-manifest-0.1.json"'),false);
});
test("each selection requests only its exact manifest, DAT and geometry; every fresh replay verifies all three",async()=>{
  for(const row of index.records)for(const fresh of [false,true]){
    const requests=[];const contours=await readVerifiedNativeContours(row.neuronId,{forceReload:fresh,fetchImpl:async(url,init)=>{requests.push({url,cache:init.cache});return actual(url,init);}});
    assert.deepEqual(requests.map(r=>r.url),[row.transport.path,row.originalDat.publicPath,row.derivedGeometry.path]);
    assert.ok(requests.every(r=>r.cache===(fresh?'no-store':'default')));
    const proof=nativeContourVerification(row.neuronId,contours);assert.equal(proof.fileManifest.sha256,row.transport.sha256);
    assert.equal(proof.originalDat.topLevelObjectCount,row.topLevelObjectCount);assert.equal(Object.isFrozen(proof.fileManifest),true);
  }
});
test("bad, truncated, absent or different-record manifests stop before original DAT and never receive private geometry proof",async()=>{
  const row=index.records.find(r=>r.neuronId===108978),wrong=index.records.find(r=>r.neuronId===249676);
  for(const kind of ['bad','short','missing','other']){
    const requests=[];const fetchImpl=async url=>{requests.push(url);assert.equal(url,row.transport.path);
      if(kind==='missing')return {ok:false,status:404};
      const b=Buffer.from(await readFile(new URL(`../public${kind==='other'?wrong.transport.path:url}`,import.meta.url)));
      if(kind==='bad')b[100]^=1;const result=kind==='short'?b.subarray(1):b;
      return {ok:true,status:200,arrayBuffer:async()=>result.buffer.slice(result.byteOffset,result.byteOffset+result.length)};
    };
    await assert.rejects(readVerifiedNativeContours(row.neuronId,{fetchImpl}),/byte count|SHA-256|404/);assert.equal(requests.length,1);
  }
});
test("changed eager metadata and full inventory remain rejected even as independently checksum-pinned transport",()=>{
  const row=index.records[0],file=full.records[0];
  for(const change of [r=>r.fullAuditSha256='0'.repeat(64),r=>r.topLevelObjectCount++,r=>r.parserVersion='other',r=>r.originalDat.sha256='0'.repeat(64)]){
    const copy=structuredClone(row);change(copy);assert.throws(()=>validateNativeDatManifestTransport(file,copy),/pinned index/);
  }
  const copy=structuredClone(file);delete copy.topLevelObjects;assert.throws(()=>validateNativeDatManifestTransport(copy,row),/incomplete/);
});
