import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DANDI_TRACE_CONTRACT as contract, validateDandiTraceContract, validateDandiTracePayload, verifyDandiTraceBytes, loadDandiTrace,
  dandiTraceIdentity, dandiTraceWindow, buildDandiTraceReceipt, restoreDandiTraceReceipt, dandiTraceWindowCsv } from "../app/dandi-spinalcordnet-trace.js";
import { validateDandiSpinalCordTracePreview } from "../scripts/validate-dandi-spinalcordnet-trace-preview-0.1.mjs";
const bytes = new Uint8Array(await readFile(new URL("../public/data/dandi_spinalcordnet_trace_preview_v1/trace-channel-0.json", import.meta.url)));
const verified = await verifyDandiTraceBytes(bytes);
function csvRows(text) {
  const rows=[]; let row=[],value="",quoted=false;
  for(let i=0;i<text.length;i++) {
    const c=text[i];
    if(c==='"') { if(quoted && text[i+1]==='"'){value+='"';i++;}else quoted=!quoted; }
    else if(c===','&&!quoted){row.push(value);value="";}
    else if(c==='\n'&&!quoted){row.push(value);rows.push(row);row=[];value="";}
    else value+=c;
  }
  assert.equal(quoted,false);assert.deepEqual(row,[]);assert.equal(value,"");return rows;
}

test("15 exact cached ranges and native references validate without a whole-file claim", async () => {
  assert.deepEqual(await validateDandiSpinalCordTracePreview(), { previewBytes:76202,previewSamples:30000,previewChannels:1,sourceRangeBytes:3918112,fullNwbChecksumVerified:false,identifiedInterneurons:0 });
  assert.equal(contract.sourceContext.sessionId,null); assert.equal(contract.coordinateScope.unit,null);
  const hierarchy=dandiTraceIdentity(); assert.equal(hierarchy.nodes.specimen.id,"Chronic Implant 1"); assert.equal(hierarchy.nodes.cell.id,null);
  assert.equal(hierarchy.nodes.component.id,"9622a561-6b2a-461b-af83-6b9aae2d1c22"); assert.equal(hierarchy.parents.component.status,"not_established");
});
test("native source versions, units, IDs and unverified calibration cannot be rewritten", () => {
  for (const edit of [c=>c.releaseId="draft",c=>c.sourceContext.sessionId="Chronic Implant 1",c=>c.amplitude.nativeDeclaration.unit="microvolts",
    c=>c.amplitude.nativeDeclaration.conversion=0.000001,c=>c.amplitude.physicalVoltageClaimAllowed=true,c=>c.sourceAsset.wholeFileSha256Verified=true,
    c=>c.coordinateScope.unit="micrometre",c=>c.claims.identifiedInterneurons=1,c=>c.electrodes[0].nativeElectrodeId="1"]) {
    const changed=structuredClone(contract); edit(changed); assert.throws(()=>validateDandiTraceContract(changed),/pinned native/);
  }
  assert.throws(()=>{contract.sourceContext.sessionId="invented";},TypeError);
});
test("only exact checksum-verified derivative objects can display or export samples", async () => {
  const corrupt=new Uint8Array(bytes); corrupt[bytes.length-2]^=1;
  await assert.rejects(verifyDandiTraceBytes(corrupt),/SHA-256/); await assert.rejects(verifyDandiTraceBytes(bytes.slice(1)),/length/);
  const cloned=structuredClone(verified); assert.throws(()=>dandiTraceWindow(cloned,0),/runtime byte/); assert.throws(()=>dandiTraceWindowCsv(cloned,0),/runtime byte/);
  for (const edit of [p=>p.nativeElectrodeId="1",p=>p.sampleRateHz=29999,p=>p.nativeAmplitudeDeclaration.unit="microvolts",p=>p.samples[0]=1.2,p=>delete p.samples[0]]) {
    const changed=structuredClone(verified);edit(changed);assert.throws(()=>validateDandiTracePayload(changed));
  }
});
test("all ten windows preserve every native sample and exact source time, including zero", () => {
  for(let start=0;start<=27000;start+=3000) {
    const window=dandiTraceWindow(verified,start,2999); assert.deepEqual(window.samples,verified.samples.slice(start,start+3000));
    assert.equal(window.firstTimeSeconds,start/30000);assert.equal(window.cursor.sourceSampleIndex,start+2999);assert.equal(window.cursor.timeSeconds,(start+2999)/30000);
  }
  for (const [start,cursor] of [[-3000,0],[30000,0],[1,0],[NaN,0],[0,-1],[0,3000]]) assert.throws(()=>dandiTraceWindow(verified,start,cursor));
});
test("current receipt restores the exact window/cursor while refusing source and scientific tampering", () => {
  const receipt=JSON.parse(JSON.stringify(buildDandiTraceReceipt(verified,27000,234,3,"2026-09-30T22:00:00Z")));
  assert.deepEqual(restoreDandiTraceReceipt(receipt,verified),{firstSample:27000,cursorOffset:234});
  assert.equal(receipt.sourceCitation,contract.citation);assert.equal(receipt.sourceUrl,contract.sourceUrl);assert.equal(receipt.datasetDoi,contract.doi);
  for(const edit of [r=>r.previewSelection.cursor.storedValue+=1,r=>r.previewSelection.cursor.timeSeconds+=0.01,r=>r.sourceContext.sessionId="made-up",
    r=>r.sourceIdentity.nodes.cell.id="0",r=>r.currentLoaderReceipt.wholeNwbSha256Verified=true,r=>r.amplitude.physicalVoltageClaimAllowed=true,
    r=>r.channel.nativeElectrodeId="1",r=>r.display.decimation=true,r=>r.claims.sameCellLinks=1]) {
    const changed=structuredClone(receipt); edit(changed); assert.throws(()=>restoreDandiTraceReceipt(changed,verified),/changed/);
  }
});
test("window CSV preserves all 3000 observations, null session and original amplitude declaration", () => {
  const rows=csvRows(dandiTraceWindowCsv(verified,24000));
  assert.equal(rows.length,3001); const header=rows.shift(); const ix=name=>header.indexOf(name);
  for(let i=0;i<rows.length;i++) { const row=rows[i]; assert.equal(row[ix("source_sample_index")],String(24000+i));assert.equal(Number(row[ix("stored_int16_value")]),verified.samples[24000+i]);
    assert.equal(row[ix("session_id")],"");assert.equal(row[ix("native_declared_unit")],"volts");assert.equal(row[ix("physical_calibration")],"unverified");assert.equal(row[ix("whole_nwb_sha256_verified")],"false");
    assert.equal(row[ix("dataset_citation")],contract.citation);assert.equal(row[ix("source_url")],contract.sourceUrl);assert.equal(row[ix("dataset_license")],"spdx:CC-BY-4.0");assert.equal(row.length,header.length); }
});
test("a closed request cannot publish a payload even when its byte response arrives later", async () => {
  const controller=new AbortController();let release;
  const pending=loadDandiTrace({signal:controller.signal,fetchImpl:async()=>({ok:true,arrayBuffer:()=>new Promise(resolve=>{release=resolve;})})});
  await Promise.resolve();controller.abort();release(bytes.buffer);await assert.rejects(pending,/abort/i);
  await assert.rejects(loadDandiTrace({fetchImpl:async()=>({ok:false,status:404})}),/404/);
  const loaded=await loadDandiTrace({fetchImpl:async(url)=>{assert.equal(url,contract.preview.url);return {ok:true,arrayBuffer:async()=>bytes.buffer};}});
  assert.deepEqual(dandiTraceWindow(loaded,0).samples,verified.samples.slice(0,3000));
});
