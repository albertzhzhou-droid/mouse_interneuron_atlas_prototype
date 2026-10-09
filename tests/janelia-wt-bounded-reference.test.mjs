import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildJaneliaWtPlaneReceipt, getJaneliaWtNativePlanes, getJaneliaWtSliceMapping, interpretJaneliaWtLabel, validateJaneliaWtReference, verifyJaneliaWtPayload } from "../app/janelia-wt-bounded-reference.js";

const root = new URL("../", import.meta.url);
const reference = JSON.parse(await readFile(new URL("data/janelia-wt-bounded-reference-0.1.json", root), "utf8"));
const raw = new Uint8Array(await readFile(new URL("public" + reference.raw.payload.url, root)));
const nucleus = new Uint8Array(await readFile(new URL("public" + reference.nucleus.payload.url, root)));
const mutate = (operation) => { const copy = structuredClone(reference); operation(copy); return copy; };

test("exact native source payloads pass hashes; corruption or truncation cannot display", async () => {
  assert.equal(validateJaneliaWtReference(reference).sourceFiles, 8);
  assert.deepEqual(await verifyJaneliaWtPayload(raw, reference.raw.payload), raw);
  assert.deepEqual(await verifyJaneliaWtPayload(nucleus, reference.nucleus.payload), nucleus);
  const corrupted = new Uint8Array(raw); corrupted[42] ^= 1;
  await assert.rejects(verifyJaneliaWtPayload(corrupted, reference.raw.payload), /checksum mismatch/);
  await assert.rejects(verifyJaneliaWtPayload(raw.subarray(1), reference.raw.payload), /length mismatch/);
});

test("unverified identity, frame, rights or biological promotion fail closed", () => {
  for (const change of [
    (copy) => { copy.datasetId = "jrc_mus-sc-zp105a"; },
    (copy) => { copy.raw.scaleNanometreZYX[0] = 96; },
    (copy) => { copy.nucleus.translationNanometreZYX[0] = 0; },
    (copy) => { copy.nucleus.annotation.unknownValue = 0; },
    (copy) => { copy.sourceRecords[1].license.name = "unknown"; },
    (copy) => { copy.nucleus.stableBiologicalCellId = "selected-IN"; },
    (copy) => { copy.nucleus.completeNucleusEstablished = true; },
    (copy) => { copy.claims.interneuronGeometryCount = 1; },
    (copy) => { copy.claims.selectedCellJoinCount = 1; },
    (copy) => { copy.sourceExtentDifference.biologicalMeasurementAuthorized = true; },
  ]) assert.throws(() => validateJaneliaWtReference(mutate(change)), /Janelia WT reference/);
});

test("128 raw Z planes map to eight native label planes at group mean sample coordinates", () => {
  const seen = new Set();
  for (let slice = 0; slice < 128; slice += 1) {
    const mapping = getJaneliaWtSliceMapping(reference, slice);
    const minimum = 10496 + mapping.rawGroupMinimumSlice;
    const maximum = 10496 + mapping.rawGroupMaximumExclusiveSlice - 1;
    assert.equal(mapping.labelSampleZNanometre, (minimum + maximum) * 6 / 2);
    assert.equal(mapping.rawSampleZNanometre, (10496 + slice) * 6);
    assert.equal(mapping.relationship, "same_source_volume_spatial_overlap_only");
    seen.add(mapping.labelSlice);
    const planes = getJaneliaWtNativePlanes(raw, nucleus, slice);
    assert.equal(planes.raw.length, 128 ** 2);
    assert.equal(planes.nucleus.length, 64 ** 2);
    assert.equal(planes.raw[0], raw[slice * 128 ** 2]);
    assert.equal(planes.nucleus[0], nucleus[mapping.labelSlice * 64 ** 2]);
  }
  assert.deepEqual([...seen], [16, 17, 18, 19, 20, 21, 22, 23]);
  for (const invalid of [-1, 128, 1.5, NaN]) assert.throws(() => getJaneliaWtSliceMapping(reference, invalid), /outside this chunk/);
});

test("native source labels identify a partial instance and uniformly cover only the bounded raw patch", () => {
  assert.deepEqual([...new Set(nucleus)].sort((a, b) => a - b), [0, 2]);
  assert.equal(nucleus.reduce((sum, value) => sum + Number(value === 2), 0), 69867);
  let covered = 0;
  for (let z = 16; z < 24; z += 1) for (let y = 48; y < 56; y += 1) for (let x = 8; x < 16; x += 1) {
    assert.equal(nucleus[(z * 64 + y) * 64 + x], 2); covered += 1;
  }
  assert.equal(covered, 512);
  assert.ok(nucleus.subarray(0, 64 ** 2).includes(2));
  assert.ok(nucleus.subarray(63 * 64 ** 2).includes(2));
  assert.equal(interpretJaneliaWtLabel(0), "annotation_absent");
  assert.equal(interpretJaneliaWtLabel(255), "annotation_unknown");
  assert.equal(interpretJaneliaWtLabel(7), "uninspected_instance_value");
  assert.match(interpretJaneliaWtLabel(2), /cell_class_unknown/);
});

test("plane receipt retains native calibration and zero cell/atlas/measurement claims", () => {
  const receipt = buildJaneliaWtPlaneReceipt(reference, 127);
  assert.equal(receipt.plane.labelSlice, 23);
  assert.equal(receipt.sourceRecords[1].doi, "10.25378/janelia.26513224.v1");
  assert.equal(receipt.claims.selectedCellJoinCount, 0);
  assert.equal(receipt.claims.sameCellInternalChainCount, 0);
  assert.equal(receipt.claims.biologicalMeasurements, 0);
  assert.equal(receipt.sourceExtentDifference.biologicalMeasurementAuthorized, false);
});
