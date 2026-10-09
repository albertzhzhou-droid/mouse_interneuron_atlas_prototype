import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createComparativeSwcReferenceIndex, findComparativeSwcReference, loadComparativeSwcReference, comparativeSwcNodesCsv } from "../app/comparative-swc-reference.js";

const contract = JSON.parse(await readFile(new URL("../data/comparative-swc-reference-0.1.json", import.meta.url), "utf8"));
const index = createComparativeSwcReferenceIndex(structuredClone(contract));
const buffer = (bytes) => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
const fsFetch = async (path) => {
  assert.match(path, /^\/data\/comparative_swc_reference_v1\/nmo-(183779|34024)(-api\.json|-morphometry\.json|\.swc)$/);
  const bytes = await readFile(new URL(`../public${path}`, import.meta.url));
  return { ok: true, status: 200, arrayBuffer: async () => buffer(bytes) };
};

test("builder reproduces exact two-species objects and six unchanged source assets", async () => {
  assert.match(execFileSync(process.execPath, ["tools/build_comparative_swc_reference.mjs", "--check"], { cwd: new URL("..", import.meta.url), encoding: "utf8" }), /Verified 2/);
  assert.deepEqual(index.objects.map((record) => [record.sourceObjectId, record.context.species]), [["183779", "zebrafish"], ["34024", "rat"]]);
  assert.deepEqual(contract.scope, { comparativeSourceObjects: 2, scientificDenominators: "one zebrafish reconstruction; one rat reconstruction; separate species and frames", mouseCensusAdditions: 0, sameCellJoins: 0, registrations: 0, membraneSurfaces: 0, internalObjects: 0 });
  for (const object of index.objects) for (const file of object.files) {
    const bytes = await readFile(new URL(`../public${file.path}`, import.meta.url));
    assert.equal(bytes.byteLength, file.bytes);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), file.checksum.digest);
    assert.ok(bytes.equals(await readFile(new URL(`../${file.sourcePath}`, import.meta.url))));
  }
  assert.ok(contract.auxiliarySourceReceipts.every((file) => file.publicPackaging === false));
});

test("real zebrafish SWC stays exact axon-only with no soma, dendrites or physical diameter", async () => {
  const object = index.objects[0], payload = await loadComparativeSwcReference(object, { fetchImpl: fsFetch });
  assert.equal(payload.edges.length, 3848);
  assert.equal(payload.rawNodes.length, 3849);
  assert.ok(payload.rawNodes.every((row) => row[1] === 2 && row[5] === 0.125));
  assert.deepEqual(payload.rawNodes[0], [1, 2, 0, 0, 0, 0.125, -1]);
  assert.deepEqual(payload.receipt.nativeMetrics.nodeTypeCounts, { 2: 3849 });
  assert.equal(payload.receipt.sourceDiameterAttributePresent, false);
  assert.equal(payload.receipt.radiusSurfaceAdmitted, false);
  assert.deepEqual(payload.receipt.nativeMetrics.radiusDerived, { value: null, missingReason: "official_attributes_report_no_diameter" });
  assert.equal(payload.meshes.length + payload.contours.length + payload.points.length, 0);
  assert.equal(payload.receipt.verifiedFiles.length, 3);
  assert.deepEqual(object.context.rawMetadata.cell_type, ["interneuron", "glutamatergic", "V3", "tonic-spiking"]);
  assert.equal(object.context.rawMetadata.min_age, "5.0");
});

test("real rat SWC preserves 23-to-12 source assertion and name/receipt conflicts without same-cell claims", async () => {
  const object = index.objects[1], payload = await loadComparativeSwcReference(object, { fetchImpl: fsFetch });
  assert.equal(payload.edges.length, 17972);
  assert.deepEqual(payload.receipt.nativeMetrics.nodeTypeCounts, { 1: 12, 2: 14988, 3: 2973 });
  assert.deepEqual(payload.receipt.nativeMetrics.extentMicrometre, [3614.3, 672.56, 491.13]);
  assert.ok(Math.abs(payload.receipt.nativeMetrics.totalCableLengthMicrometre - 32766.011309305515) < 1e-9);
  assert.equal(payload.receipt.nativeMetrics.zeroLengthEdgeCount, 0);
  assert.ok(!("radiusSurfaceAuthorized" in payload.receipt.nativeMetrics));
  assert.equal(payload.meshes.length + payload.contours.length, 0);
  assert.equal(object.context.rawMetadata.gender, "Male/Female");
  assert.equal(object.context.rawMetadata.shrinkage_corrected, "Not Corrected");
  assert.equal(object.context.conflicts.find(({ id }) => id === "historical-morphometry-receipt").historicalBytesAvailable, false);
  assert.ok(object.context.boundaries.some((text) => /pia removal/.test(text)));
  assert.equal(payload.receipt.relationships.length, 0);
});

test("exact source key/frame/rights/relationship/caution and file identity gates reject before fetch", async () => {
  const mutations = [
    (r) => { r.releaseId = "8.6.124"; }, (r) => { r.coordinateFrame.unit = "nanometre"; }, (r) => { r.coordinateFrame.frame = "atlas"; },
    (r) => { r.context.species = "mouse"; }, (r) => { r.viewer.radiusSurfaceAdmitted = true; }, (r) => { r.provenance.reuse.status = "rights_held"; },
    (r) => { r.relationships = [{ kind: "same_cell", parent: "L420_E2" }]; }, (r) => { r.files[1].path = "/data/substitute.swc"; },
    (r) => { r.files[0].url = "https://neuromorpho.org/api/neuron/id/1"; }, (r) => { r.context.conflicts = []; },
  ];
  for (const mutate of mutations) {
    const object = structuredClone(index.objects[1]); mutate(object); let calls = 0;
    await assert.rejects(loadComparativeSwcReference(object, { fetchImpl: async () => { calls += 1; throw new Error("fetch should not run"); } }));
    assert.equal(calls, 0);
  }
  assert.equal(findComparativeSwcReference(index, "unknown"), null);
  assert.equal(findComparativeSwcReference(index, index.objects[0].key.replace("183779", "183778")), null);
  const expanded = structuredClone(contract); expanded.scope.mouseCensusAdditions = 2;
  assert.throws(() => createComparativeSwcReferenceIndex(expanded), /scope/);
});

test("any damaged file or embedded metadata/QC drift withholds all geometry", async () => {
  for (const fileId of ["api", "swc", "morphometry"]) {
    const object = index.objects[0];
    await assert.rejects(loadComparativeSwcReference(object, { fetchImpl: async (path) => {
      const response = await fsFetch(path);
      if (path !== object.files.find(({ id }) => id === fileId).path) return response;
      const bytes = new Uint8Array(await response.arrayBuffer()); bytes[bytes.length - 1] ^= 1;
      return { ...response, arrayBuffer: async () => bytes.buffer };
    } }), /SHA-256 mismatch/);
  }
  for (const mutate of [(r) => { r.context.rawMetadata.protocol = "invented"; }, (r) => { r.context.computedFromExactSwc.nodeCount = 1; }]) {
    const object = structuredClone(index.objects[0]); mutate(object);
    await assert.rejects(loadComparativeSwcReference(object, { fetchImpl: fsFetch }), /metadata differs|QC differs/);
  }
  const aborted = new AbortController(); aborted.abort();
  await assert.rejects(loadComparativeSwcReference(index.objects[0], { fetchImpl: fsFetch, signal: aborted.signal }), /cancelled/);
});

test("CSV exports every raw node and native parent with source-radius limits; foreign receipt cannot export", async () => {
  const object = index.objects[0], payload = await loadComparativeSwcReference(object, { fetchImpl: fsFetch });
  const lines = comparativeSwcNodesCsv(object, payload).trimEnd().split("\n");
  assert.equal(lines.length, 3850);
  assert.match(lines[0], /source_diameter_attribute_present,radius_surface_admitted$/);
  assert.match(lines[1], /,1,2,0,0,0,0.125,-1,false,false$/);
  const last = lines.at(-1).split(",");
  assert.equal(Number(last[1]), payload.rawNodes.at(-1)[0]);
  assert.equal(Number(last[7]), Number(payload.rawNodes.at(-1)[6]));
  assert.throws(() => comparativeSwcNodesCsv(index.objects[1], payload), /exact selected/);
});
