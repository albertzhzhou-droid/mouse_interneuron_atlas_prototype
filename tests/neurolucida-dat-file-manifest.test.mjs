import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import manifest from "../data/neurolucida-dat-file-manifest-0.1.json" with { type: "json" };
import { inspectNativeDat } from "../app/neurolucida-dat-inventory.js";
import { canonicalDatAudit, datAuditPayload, validateNativeDatAdmission } from "../app/neurolucida-dat-file-admission.js";
import { buildDatManifest } from "../tools/build_neurolucida_dat_file_manifest.mjs";
import { readVerifiedNativeContours, nativeContourVerification } from "../app/native-contour-verification.js";
const actual = async (url, init) => {
  assert.ok(["default", "no-store"].includes(init.cache));
  const bytes = await readFile(new URL(`../public${url}`, import.meta.url));
  return { ok: true, status: 200, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
};
const bytesFor = file => readFile(new URL(`../public${file.originalDat.publicPath}`, import.meta.url));
const geometryFor = async file => JSON.parse(await readFile(new URL(`../public${file.derivedGeometry.path}`, import.meta.url), "utf8"));
test("independent Python and JS replay every source byte boundary and all ordered contours", async () => {
  assert.deepEqual(await buildDatManifest(), manifest);
  assert.equal(manifest.records.length, 7);
  assert.equal(manifest.records.reduce((n, r) => n + r.topLevelObjects.length, 0), 234);
  assert.equal(manifest.records.reduce((n, r) => n + r.originalContourCount, 0), 89);
  assert.equal(manifest.records.reduce((n, r) => n + r.admittedContours.length, 0), 72);
  assert.equal(manifest.records.reduce((n, r) => n + r.admittedContours.reduce((a, c) => a + c.vertexCount, 0), 0), 5149);
});
test("all seven original public byte receipts and inventory fingerprints match exact unchanged sources", async () => {
  for (const file of manifest.records) {
    const b = await bytesFor(file), parsed = inspectNativeDat(b, file);
    assert.equal(b.length, file.originalDat.bytes); assert.equal(createHash("sha256").update(b).digest("hex"), file.originalDat.sha256);
    assert.equal(parsed.topLevelObjects.reduce((n, row) => n + row.actualBytes, 74), b.length);
    assert.equal(createHash("sha256").update(canonicalDatAudit(datAuditPayload(parsed))).digest("hex"), file.fullAuditSha256);
    validateNativeDatAdmission(parsed, await geometryFor(file), file);
    const proof = nativeContourVerification(file.neuronId, await readVerifiedNativeContours(file.neuronId, { fetchImpl: actual, forceReload: true }));
    assert.equal(proof.originalDat.sha256, file.originalDat.sha256); assert.equal(proof.originalDat.requestCacheMode, "no-store");
    assert.equal(proof.originalDat.topLevelObjectCount, file.topLevelObjects.length);
  }
});
test("unsupported blocks, truncation, closure ambiguity and nested count corruption fail the complete file", async () => {
  const file = manifest.records.find(r => r.neuronId === 108978), b = await bytesFor(file);
  const first = file.topLevelObjects.find(r => r.sourceType === "contour");
  const cases = [x => x.subarray(0, x.length-1), x => { x.writeUInt16LE(0x9999,70); return x; },
    x => { x.writeUInt32LE(x.length,72); return x; },
    x => { const nameBytes=x.readUInt32LE(first.offsetByte+8);x.writeUInt16LE(2,first.offsetByte+6+nameBytes);return x; },
    x => { x.writeUInt16LE(1,76);return x; }];
  for (const change of cases) assert.throws(() => inspectNativeDat(change(Buffer.from(b)), file), /DAT inventory/);
  // A plausible contour sequence inside a thumbnail is not a top-level object.
  const thumbnail = file.topLevelObjects.find(r => r.sourceType === "thumbnail"), embedded = Buffer.from(b);
  embedded.set(b.subarray(first.offsetByte, first.offsetByte + first.actualBytes), thumbnail.offsetByte + 6);
  assert.equal(inspectNativeDat(embedded, file).contours.length, 12);
});
test("source marker size exceptions are exact-file policies, never a global allowance", async () => {
  const file = manifest.records.find(r => r.neuronId === 249676), b = await bytesFor(file);
  assert.throws(() => inspectNativeDat(b), /unmanifested marker/);
  for (const policy of [[], [file.markerSizeCorrections[0],file.markerSizeCorrections[0]],
    [{...file.markerSizeCorrections[0],offsetByte:file.markerSizeCorrections[0].offsetByte+1}],
    [{...file.markerSizeCorrections[0],sizeCorrectionBytes:0}]]) assert.throws(() => inspectNativeDat(b,{markerSizeCorrections:policy}));
  const other = manifest.records.find(r => r.neuronId === 108978);
  assert.throws(() => inspectNativeDat(b,other), /unmanifested marker/);
});
test("a new file cannot reuse admitted source identity, closure exceptions or ordered coordinates", async () => {
  const file=manifest.records.find(r=>r.neuronId===108978), audit=inspectNativeDat(await bytesFor(file),file), geometry=await geometryFor(file);
  for (const change of [g=>g.contours[0].points[0][0]+=.1,g=>g.contours[0].sourceClosedFlag=true,
    g=>g.contours[0].closureBasis="NMO45718 legacy exception",g=>g.contours[1].sourceBlockOffsetByte=g.contours[0].sourceBlockOffsetByte,
    g=>g.contours[0].sourcePropertyReceipts[0].values.push(1),g=>g.contours[0].sourceName="other"])
    { const copy=structuredClone(geometry);change(copy);assert.throws(()=>validateNativeDatAdmission(audit,copy,file)); }
  const changed=structuredClone(file);changed.topLevelObjects.pop();assert.throws(()=>validateNativeDatAdmission(audit,geometry,changed),/inventory/);
});
test("bad or missing original DAT rejects even when unchanged derived geometry is available; another file remains admitted",async()=>{
  const file=manifest.records.find(r=>r.neuronId===249676), wrong=async(url,init)=>{
    if(url===file.originalDat.publicPath){const b=Buffer.from(await bytesFor(file));b[100]^=1;return {ok:true,status:200,arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.length)};}
    return actual(url,init);
  };
  await assert.rejects(readVerifiedNativeContours(file.neuronId,{fetchImpl:wrong}),/SHA-256/);
  await assert.rejects(readVerifiedNativeContours(file.neuronId,{fetchImpl:async(url,init)=>url===file.originalDat.publicPath?{ok:false,status:404}:actual(url,init)}),/404/);
  const good=await readVerifiedNativeContours(108978,{fetchImpl:actual});assert.equal(nativeContourVerification(108978,good).originalDat.status,"verified");
  assert.throws(()=>nativeContourVerification(108978,structuredClone(good)),/private/);
});
test("cancel during selected manifest, original DAT or derived read never issues a new combined private proof",async()=>{
  for(const stage of [1,2,3]){
    const control=new AbortController();let seen=0;
    const fetchImpl=async(url,init)=>{const response=await actual(url,init);return {...response,arrayBuffer:async()=>{const b=await response.arrayBuffer();if(++seen===stage)control.abort();return b;}};};
    await assert.rejects(readVerifiedNativeContours(108978,{fetchImpl,signal:control.signal}),/cancelled/);
    assert.equal(seen,stage);
  }
});
