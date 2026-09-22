import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest230 } from "../scripts/validate-research-iteration-manifest-2.30.mjs";
import { buildResearchIterationManifest230, serializeResearchIterationManifest230 } from "../tools/build_research_iteration_manifest_2_30.mjs";

const manifestBytes = await readFile(new URL("../data/research-iteration-manifest-2.30.json", import.meta.url));
const manifest = JSON.parse(manifestBytes.toString("utf8"));
const parent = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.29.json", import.meta.url), "utf8"));
const reference = manifest.exactReferences.sourceFrameDisclosure;

test("validates the exact 2.30 source-frame disclosure snapshot", async () => {
  assert.deepEqual(await validateResearchIterationManifest230(), {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.30.0",
    inputCount: 42,
    frozenCensusRecordCount: 142,
    supplementaryRecordCount: 7,
    viewableSourceObjectCount: 149,
    geometry2DCount: 2,
    geometry3DCount: 147,
    preparationContextConflictCount: 5,
    sourceModerateOrIncompleteCount: 70,
    scaleEligibleRecordCount: 149,
    commonScaleAdmissionCount: 0,
    projectCopyCount: 0,
    packageCopyCount: 0,
    researchUpgradeCount: 140,
    manifestContentSha256: "c80407736016bf95e0b4dc9d937126e8955628cef4c2485384df835639c3538f",
  });
  assert.equal(manifest.manifestContentSha256, computeManifestContentSha256(manifest));
});

test("pins immutable 2.29 and all 42 authoritative inputs", () => {
  assert.deepEqual(manifest.parentIterationManifest, {
    path: "data/research-iteration-manifest-2.29.json",
    releaseId: "ohri-mouse-interneuron-research-iteration-2.29.0",
    bytes: 77136,
    fileSha256: "8856ad6413fae98f5f6f9d13cbb0627c8b41b8a9dbaa04ebd9a232689edaeba5",
    contentSha256: "069b1be3a37a8086f89ea4467503235ed0734afcbfd2974538bae528c4995982",
  });
  assert.equal(manifest.authoritativeInputs.length, 42);
  assert.equal(new Set(manifest.authoritativeInputs.map((input) => input.id)).size, 42);
  assert.equal(new Set(manifest.authoritativeInputs.map((input) => input.path)).size, 42);
  const inputs = new Map(manifest.authoritativeInputs.map((input) => [input.id, input]));
  assert.deepEqual([
    "morphologySourceFrameDisclosure",
    "morphologySourceFrameDisclosureSchema",
    "morphologySourceFrameDisclosureBuilder",
    "morphologyViewportScaleAlgorithm",
  ].map((id) => [id, inputs.get(id).bytes, inputs.get(id).sha256]), [
    ["morphologySourceFrameDisclosure", 469544, "e76abace7e59995f4b1849ce87a7e10e0d066a80844959589d5f06fcba0c5230"],
    ["morphologySourceFrameDisclosureSchema", 14554, "382bc051000d96d7142b5176598dad969f36568579e70f563e83606ac6ca8e4b"],
    ["morphologySourceFrameDisclosureBuilder", 20391, "dae31dc3d47d203b3374c1cc902c09950e705147386e44a8fe96af8175c72633"],
    ["morphologyViewportScaleAlgorithm", 3658, "f51a96dd5fe21d36ca7455245145b002a232116115e5af992d0f6465542f1aac"],
  ]);
});

test("preserves every inherited 2.29 exact reference and boundary", () => {
  const refs = structuredClone(manifest.exactReferences);
  delete refs.sourceFrameDisclosure;
  assert.deepEqual(refs, parent.exactReferences);
  const boundaries = structuredClone(manifest.scientificBoundaries);
  delete boundaries.sourceFrameDisclosure;
  assert.deepEqual(boundaries, parent.scientificBoundaries);
});

test("pins source-local scale, preparation and truncation denominators", () => {
  assert.equal(reference.contractReceipt.contentSha256, "cd6b85eb5961e49667bdc126b0230fba35db534fdcc2c8008d5655893978a8ad");
  assert.deepEqual({
    frozen: reference.frozenCensusRecordCount,
    supplementary: reference.supplementaryRecordCount,
    viewable: reference.viewableSourceObjectCount,
    twoD: reference.geometry2DCount,
    threeD: reference.geometry3DCount,
    conflicts: reference.preparationContextConflictCount,
    moderateOrIncomplete: reference.sourceModerateOrIncompleteCount,
    scaleEligible: reference.scaleEligibleRecordCount,
  }, { frozen: 142, supplementary: 7, viewable: 149, twoD: 2, threeD: 147, conflicts: 5, moderateOrIncomplete: 70, scaleEligible: 149 });
  assert.equal(reference.displayScalePolicy.sourceLocalOnly, true);
  assert.equal(reference.displayScalePolicy.sharedAcrossViewports, false);
  assert.equal(reference.displayScalePolicy.apparentObjectSizeComparable, false);
});

test("keeps reconstruction, identity, internal and copy claims at zero", () => {
  assert.deepEqual({
    commonScale: reference.commonScaleAdmissionCount,
    sharedFrame: reference.sharedCoordinateFrameAdmissionCount,
    inferred: reference.inferredMissingCoordinateCount,
    repaired: reference.repairedCutNeuriteCount,
    restored: reference.restoredInVivoDimensionCount,
    completeAxon: reference.completeBiologicalAxonClaimCount,
    internal: reference.sameSpecimenInternalStructureCount,
    primitives: reference.renderedInternalPrimitiveCount,
    identity: reference.crossSourceIdentityCount,
    registration: reference.registrationCount,
    projectCopy: reference.projectCopyCount,
    packageCopy: reference.packageCopyCount,
  }, { commonScale: 0, sharedFrame: 0, inferred: 0, repaired: 0, restored: 0, completeAxon: 0, internal: 0, primitives: 0, identity: 0, registration: 0, projectCopy: 0, packageCopy: 0 });
});

test("matches deterministic 2.30 materialization byte-for-byte", async () => {
  const built = await buildResearchIterationManifest230();
  assert.equal(built.bytes.equals(manifestBytes), true);
  assert.equal(serializeResearchIterationManifest230(built.manifest), manifestBytes.toString("utf8"));
});

async function rejectsMutation(mutator, pattern) {
  const changed = structuredClone(manifest);
  mutator(changed.exactReferences.sourceFrameDisclosure);
  changed.manifestContentSha256 = computeManifestContentSha256(changed);
  await assert.rejects(() => validateResearchIterationManifest230(changed), pattern);
}

test("rejects shared scale, inferred coordinates and repaired-neurite mutations", async () => {
  await rejectsMutation((value) => { value.commonScaleAdmissionCount = 1; }, /commonScaleAdmissionCount|unsupported semantics|snapshot content/);
  await rejectsMutation((value) => { value.displayScalePolicy.sharedAcrossViewports = true; }, /displayScalePolicy|shared or biological|snapshot content/);
  await rejectsMutation((value) => { value.inferredMissingCoordinateCount = 1; }, /inferredMissingCoordinateCount|unsupported semantics|snapshot content/);
  await rejectsMutation((value) => { value.repairedCutNeuriteCount = 1; }, /repairedCutNeuriteCount|unsupported semantics|snapshot content/);
});

test("rejects restored dimensions, axon, internal, identity and registration mutations", async () => {
  await rejectsMutation((value) => { value.restoredInVivoDimensionCount = 1; }, /restoredInVivoDimensionCount|unsupported semantics|snapshot content/);
  await rejectsMutation((value) => { value.completeBiologicalAxonClaimCount = 1; }, /completeBiologicalAxonClaimCount|unsupported semantics|snapshot content/);
  await rejectsMutation((value) => { value.sameSpecimenInternalStructureCount = 1; }, /sameSpecimenInternalStructureCount|unsupported semantics|snapshot content/);
  await rejectsMutation((value) => { value.crossSourceIdentityCount = 1; }, /crossSourceIdentityCount|unsupported semantics|snapshot content/);
  await rejectsMutation((value) => { value.registrationCount = 1; }, /registrationCount|unsupported semantics|snapshot content/);
});

test("rejects project/package copies and immutable-parent mutations", async () => {
  await rejectsMutation((value) => { value.projectCopyCount = 1; }, /projectCopyCount|project or package copy|snapshot content/);
  await rejectsMutation((value) => { value.packageCopyCount = 1; }, /packageCopyCount|project or package copy|snapshot content/);
  const changed = structuredClone(manifest);
  changed.parentIterationManifest.fileSha256 = "0".repeat(64);
  changed.manifestContentSha256 = computeManifestContentSha256(changed);
  await assert.rejects(() => validateResearchIterationManifest230(changed), /parentIterationManifest|immutable 2.29 parent|snapshot content/);
});
