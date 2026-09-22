import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest234 } from "../scripts/validate-research-iteration-manifest-2.34.mjs";
import { buildResearchIterationManifest234 } from "../tools/build_research_iteration_manifest_2_34.mjs";

const manifestBytes = await readFile(new URL("../data/research-iteration-manifest-2.34.json", import.meta.url));
const manifest = JSON.parse(manifestBytes.toString("utf8"));

function mutated(update) {
  const copy = structuredClone(manifest);
  update(copy);
  copy.manifestContentSha256 = computeManifestContentSha256(copy);
  return copy;
}

test("validates the deterministic 2.34 exact NeuroMorpho universe snapshot", async () => {
  const report = await validateResearchIterationManifest234();
  assert.deepEqual(report, {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.34.0",
    fileBytes: 125197,
    fileSha256: "76ead4e29455c8e9250f294afa4e78b6a72bb76709115d15954564545bb43d1e",
    manifestContentSha256: "266ee889a591368d30b655ee059659485e746df424f448a85a6819d28e3e920c",
    inputCount: 102,
    researchUpgradeCount: 155,
    admittedSourceObjectCount: 1097,
    existingGeometryReferenceCount: 149,
    deltaRawSwcCount: 948,
    sourceLabelled2DCount: 39,
    generatedGeometryCopyCount: 0,
    registrationCount: 0,
  });
});

test("rebuilds byte-identically from the immutable 2.33 parent and 102 exact inputs", async () => {
  const built = await buildResearchIterationManifest234();
  assert.deepEqual(built.bytes, manifestBytes);
  assert.deepEqual(manifest.parentIterationManifest, {
    path: "data/research-iteration-manifest-2.33.json",
    releaseId: "ohri-mouse-interneuron-research-iteration-2.33.0",
    bytes: 109358,
    fileSha256: "6b2c1571c8dccf5aeced3518435dfe4bf0bff4c605f9a9255524299d72dda081",
    contentSha256: "1b4632ea19ea00b27422408bf96d4dabe39e7e23330d6511fe4b6ccdafa6752f",
  });
  assert.equal(manifest.authoritativeInputs.length, 102);
  assert.equal(new Set(manifest.authoritativeInputs.map((input) => input.id)).size, 102);
  assert.equal(new Set(manifest.authoritativeInputs.map((input) => input.path)).size, 102);
});

test("pins the exact universe denominators without manufacturing geometry or identity", () => {
  const value = manifest.exactReferences.neuromorphoNoAgeQueryUniverseIntegrity;
  assert.equal(value.queryRecordCount, 1097);
  assert.equal(value.admittedSourceObjectCount, 1097);
  assert.equal(value.existingGeometryReferenceCount, 149);
  assert.equal(value.deltaRawSwcCount, 948);
  assert.deepEqual(value.officialApiPageRecordCounts, [500, 500, 97]);
  assert.equal(value.sourceLabelled3DCount, 1058);
  assert.equal(value.sourceLabelled2DCount, 39);
  assert.equal(value.diameterAuthorizedCount, 955);
  assert.equal(value.diameterUnavailableCount, 142);
  assert.equal(value.axonDomainCount, 253);
  for (const field of [
    "quarantinedSourceObjectCount",
    "geometryCopyCount",
    "completeAxonClaimCount",
    "registrationCount",
    "sameSpecimenInternalStructureCount",
    "duplicateRawSwcGroupCount",
    "duplicateCanonicalGeometryGroupCount",
    "crossSourceIdentityCount",
    "generatedGeometryCopyCount",
    "projectCopyCount",
    "packageCopyCount",
  ]) assert.equal(value[field], 0, field);
});

test("rejects denominator, fail-closed, parent and registry mutations", async () => {
  await assert.rejects(
    validateResearchIterationManifest234(mutated((value) => { value.exactReferences.neuromorphoNoAgeQueryUniverseIntegrity.admittedSourceObjectCount = 1096; })),
    /admittedSourceObjectCount|denominator|exact reference/,
  );
  await assert.rejects(
    validateResearchIterationManifest234(mutated((value) => { value.exactReferences.neuromorphoNoAgeQueryUniverseIntegrity.unknownFocusFailsClosed = false; })),
    /unknownFocusFailsClosed|exact reference/,
  );
  await assert.rejects(
    validateResearchIterationManifest234(mutated((value) => { value.parentIterationManifest.fileSha256 = "0".repeat(64); })),
    /parent|fileSha256/,
  );
  await assert.rejects(
    validateResearchIterationManifest234(mutated((value) => { value.registrySummary.researchUpgradeCount = 154; })),
    /researchUpgradeCount|registry/,
  );
});
