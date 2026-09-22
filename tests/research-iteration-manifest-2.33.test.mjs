import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest233 } from "../scripts/validate-research-iteration-manifest-2.33.mjs";
import { buildResearchIterationManifest233 } from "../tools/build_research_iteration_manifest_2_33.mjs";

const manifestBytes = await readFile(new URL("../data/research-iteration-manifest-2.33.json", import.meta.url));
const manifest = JSON.parse(manifestBytes.toString("utf8"));
const parent = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.32.json", import.meta.url), "utf8"));
const reference = manifest.exactReferences.micronsClippingAndSourceRecordDeltaIntegrity;

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function mutated(mutator) {
  const value = structuredClone(manifest);
  mutator(value);
  value.manifestContentSha256 = computeManifestContentSha256(value);
  return value;
}

test("validates the exact deterministic 2.33 clipping and source-record delta snapshot", async () => {
  const result = await validateResearchIterationManifest233();
  assert.deepEqual(result, {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.33.0",
    fileBytes: 109358,
    fileSha256: "6b2c1571c8dccf5aeced3518435dfe4bf0bff4c605f9a9255524299d72dda081",
    manifestContentSha256: "1b4632ea19ea00b27422408bf96d4dabe39e7e23330d6511fe4b6ccdafa6752f",
    inputCount: 75,
    researchUpgradeCount: manifest.registrySummary.researchUpgradeCount,
    clippingCellRootId: "648518346349516051",
    clippingLinkedNucleusId: "4309",
    clippingAxisCount: 3,
    sourceRecordDeltaUiWhitelistedRowCount: 24,
    sourceRecordDeltaDemonstrationWhitelistedRowCount: 8,
    sourceRecordDeltaDemonstrationSharedRowCount: 5,
    sourceRecordDeltaDemonstrationChangedRowCount: 3,
    crossSourceSameCellIdentityCount: 0,
    generatedGeometryCount: 0,
    registrationCount: 0,
  });
  const built = await buildResearchIterationManifest233();
  assert.ok(manifestBytes.equals(built.bytes));
  assert.equal(manifestBytes.byteLength, 109358);
  assert.equal(sha256(manifestBytes), "6b2c1571c8dccf5aeced3518435dfe4bf0bff4c605f9a9255524299d72dda081");
});

test("pins immutable 2.32 and 75 unique authoritative inputs", () => {
  assert.deepEqual(manifest.parentIterationManifest, {
    path: "data/research-iteration-manifest-2.32.json",
    releaseId: "ohri-mouse-interneuron-research-iteration-2.32.0",
    bytes: 98357,
    fileSha256: "eaacd5bb0acae3c704e24ac2c1ffa4ef508bc5491155898bec6f28a825ea5e77",
    contentSha256: "4b0ed4508655553736b656f7a72a6d2e869218e0a4eff886811c7f0f15e113a2",
  });
  assert.equal(manifest.authoritativeInputs.length, 75);
  assert.equal(new Set(manifest.authoritativeInputs.map((input) => input.id)).size, 75);
  assert.equal(new Set(manifest.authoritativeInputs.map((input) => input.path)).size, 75);
  assert.deepEqual(manifest.authoritativeInputs.slice(0, 63).map((input) => input.id), parent.authoritativeInputs.map((input) => input.id));
  assert.deepEqual(manifest.authoritativeInputs.slice(63).map((input) => input.id), [
    "micronsSourceNativeClippingContract",
    "micronsSourceNativeClippingSchema",
    "micronsSourceNativeClippingRuntime",
    "micronsSourceNativeClippingValidator",
    "micronsSourceNativeClippingTest",
    "internalStructureReferencePanel",
    "sourceRecordDeltaRuntime",
    "sourceRecordDeltaInspector",
    "sourceRecordDeltaTest",
    "micronsImportProvenanceRuntime",
    "micronsImportProvenanceTest",
    "atlasTypeContracts",
  ]);
});

test("locks exact source-native clipping while the nucleus and source buffers remain intact", () => {
  const clipping = reference.micronsSourceNativeClipping;
  assert.deepEqual({
    cell: clipping.sourceCellRootId,
    nucleus: clipping.sourceLinkedNucleusId,
    frame: clipping.nativeFrame,
    units: clipping.nativeUnits,
    regionBoundary: clipping.regionRelationshipToProject,
    axes: clipping.axisCount,
    defaultState: clipping.defaultState,
  }, {
    cell: "648518346349516051",
    nucleus: "4309",
    frame: "MICrONS_Phase1_aligned_EM_native",
    units: "nanometre",
    regionBoundary: "cross_region_not_spinal_cord",
    axes: 3,
    defaultState: { enabled: false, axis: "z", positionNanometre: 80240, keepSide: "positive" },
  });
  assert.equal(clipping.cellClippingPlaneCountWhenEnabled, 1);
  assert.equal(clipping.nucleusClippingPlaneCount, 0);
  assert.equal(clipping.sourceBufferMutation, false);
  for (const field of ["capPrimitiveCount", "repairCount", "resamplingCount", "generatedGeometryCount", "geometryMutationCount", "joinCount", "registrationCount"]) assert.equal(clipping[field], 0);
});

test("locks one shared block and exact old/current changed rows without identity or geometry claims", () => {
  const delta = reference.sourceRecordDelta;
  assert.deepEqual({
    old: delta.oldRecordId,
    current: delta.currentRecordId,
    uiWhitelisted: delta.uiWhitelistedRowCount,
    demonstrationWhitelisted: delta.demonstrationWhitelistedRowCount,
    demonstrationShared: delta.demonstrationSharedRowCount,
    demonstrationChanged: delta.demonstrationChangedRowCount,
    changedIds: delta.changedRowIds,
    sharedIds: delta.sharedRowIds,
  }, {
    old: "alkaslasi-2021:GSE167597:I1",
    current: "alkaslasi-2021:GSE167597:I2",
    uiWhitelisted: 24,
    demonstrationWhitelisted: 8,
    demonstrationShared: 5,
    demonstrationChanged: 3,
    changedIds: ["sampling-count", "markers", "region-membership"],
    sharedIds: ["life-stage", "transmitter", "morphology", "internal-structure", "same-cell-link"],
  });
  for (const field of ["crossSourceSameCellIdentityCount", "crossSourceSameTypeIdentityCount", "admittedGeometryPrimitiveCount", "generatedBiologicalGeometryPrimitiveCount", "joinCount", "registrationCount"]) assert.equal(delta[field], 0);
});

test("rejects clipping identity, nucleus, geometry and registration mutations", async () => {
  const cases = [
    mutated((copy) => { copy.exactReferences.micronsClippingAndSourceRecordDeltaIntegrity.micronsSourceNativeClipping.sourceLinkedNucleusId = "4310"; }),
    mutated((copy) => { copy.exactReferences.micronsClippingAndSourceRecordDeltaIntegrity.micronsSourceNativeClipping.nucleusClippingPlaneCount = 1; }),
    mutated((copy) => { copy.exactReferences.micronsClippingAndSourceRecordDeltaIntegrity.micronsSourceNativeClipping.generatedGeometryCount = 1; }),
    mutated((copy) => { copy.exactReferences.micronsClippingAndSourceRecordDeltaIntegrity.micronsSourceNativeClipping.registrationCount = 1; }),
  ];
  for (const value of cases) {
    await assert.rejects(() => validateResearchIterationManifest233(value), /schema|content|clipping|exact reference|zero/i);
  }
});

test("rejects source-record whitelist, identity, geometry and input-roster mutations", async () => {
  const cases = [
    mutated((copy) => { copy.exactReferences.micronsClippingAndSourceRecordDeltaIntegrity.sourceRecordDelta.uiWhitelistedRowCount = 23; }),
    mutated((copy) => { copy.exactReferences.micronsClippingAndSourceRecordDeltaIntegrity.sourceRecordDelta.crossSourceSameCellIdentityCount = 1; }),
    mutated((copy) => { copy.exactReferences.micronsClippingAndSourceRecordDeltaIntegrity.sourceRecordDelta.admittedGeometryPrimitiveCount = 1; }),
    mutated((copy) => { copy.integrity.inputCount = 74; }),
  ];
  for (const value of cases) {
    await assert.rejects(() => validateResearchIterationManifest233(value), /schema|content|delta|identity|geometry|input/i);
  }
});
