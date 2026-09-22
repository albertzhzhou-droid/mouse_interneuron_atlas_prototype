import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest240 } from "../scripts/validate-research-iteration-manifest-2.40.mjs";
import {
  RESEARCH_ITERATION_240_ADDITIONAL_INPUTS,
  RESEARCH_ITERATION_240_PARENT,
  RESEARCH_ITERATION_240_PURPOSE_OVERRIDES,
  buildResearchIterationManifest240,
} from "../tools/build_research_iteration_manifest_2_40.mjs";

const manifestBytes = await readFile(new URL("../data/research-iteration-manifest-2.40.json", import.meta.url));
const manifest = JSON.parse(manifestBytes.toString("utf8"));
const parent = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.39.json", import.meta.url), "utf8"));

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function mutated(update) {
  const copy = structuredClone(manifest);
  update(copy);
  copy.manifestContentSha256 = computeManifestContentSha256(copy);
  return copy;
}

test("validates deterministic 2.40 record completeness and five-DAT contour admission", async () => {
  const report = await validateResearchIterationManifest240();
  assert.deepEqual(report, {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.40.0",
    fileBytes: manifestBytes.byteLength,
    fileSha256: sha256(manifestBytes),
    manifestContentSha256: manifest.manifestContentSha256,
    inputCount: 187,
    researchUpgradeCount: 186,
    lastResearchUpgradeId: "UPG-204",
    canonicalSourceCount: 27,
    canonicalRecordSetCount: 33,
    bundledExactRosterCount: 9,
    bundledExactObjectSetCount: 1,
    molecularProfileCount: 376,
    sourceNamespaceCount: 9,
    completenessSlotCount: 8,
    auditedDatFileCount: 5,
    admittedRecordCount: 2,
    heldRecordCount: 3,
    admittedContourObjectCount: 15,
    admittedVertexCount: 475,
    admittedSurfaceCount: 0,
    admittedInternalStructureCount: 0,
    registrationCount: 0,
  });
});

test("rebuilds byte-identically from the immutable 2.39 parent and exact 187-input roster", async () => {
  const built = await buildResearchIterationManifest240();
  assert.deepEqual(built.bytes, manifestBytes);
  assert.deepEqual(manifest.parentIterationManifest, RESEARCH_ITERATION_240_PARENT);
  assert.equal(parent.authoritativeInputs.length, 172);
  assert.equal(RESEARCH_ITERATION_240_ADDITIONAL_INPUTS.length, 15);
  assert.equal(manifest.authoritativeInputs.length, parent.authoritativeInputs.length + RESEARCH_ITERATION_240_ADDITIONAL_INPUTS.length);
  assert.equal(new Set(manifest.authoritativeInputs.map((input) => input.id)).size, 187);
  assert.equal(new Set(manifest.authoritativeInputs.map((input) => input.path)).size, 187);
  assert.deepEqual(
    manifest.authoritativeInputs.slice(0, 172).map(({ id, scope, path }) => ({ id, scope, path })),
    parent.authoritativeInputs.map(({ id, scope, path }) => ({ id, scope, path })),
  );
  for (const [id, purpose] of Object.entries(RESEARCH_ITERATION_240_PURPOSE_OVERRIDES)) assert.equal(manifest.authoritativeInputs.find((input) => input.id === id)?.purpose, purpose);
  for (const parentInput of parent.authoritativeInputs.filter((input) => !(input.id in RESEARCH_ITERATION_240_PURPOSE_OVERRIDES))) assert.equal(manifest.authoritativeInputs.find((input) => input.id === parentInput.id)?.purpose, parentInput.purpose);
  assert.deepEqual(manifest.authoritativeInputs.slice(172).map((input) => input.id), RESEARCH_ITERATION_240_ADDITIONAL_INPUTS.map((input) => input.id));
});

test("locks five audited DATs, two exact admissions and three held records", () => {
  const value = manifest.exactReferences.recordCompletenessAndNativeContourCatalogIntegrity;
  assert.deepEqual(value.auditedNeuronIds, [45718, 45674, 50424, 50394, 50408]);
  assert.deepEqual(value.admittedNeuronIds, [45718, 45674]);
  assert.deepEqual(value.heldNeuronIds, [50424, 50394, 50408]);
  assert.equal(value.auditedDatFileCount, 5);
  assert.equal(value.admittedRecordCount, 2);
  assert.equal(value.heldRecordCount, 3);
  assert.equal(value.admittedContourObjectCount, 15);
  assert.equal(value.admittedVertexCount, 475);
  assert.equal(value.nmo45718ContourObjectCount, 8);
  assert.equal(value.nmo45718VertexCount, 275);
  assert.equal(value.nmo45674AdmittedContourObjectCount, 7);
  assert.equal(value.nmo45674AdmittedVertexCount, 200);
  assert.equal(value.nmo45674GeometryBytes, 35842);
  assert.equal(value.nmo45674GeometrySha256, "1e41538a6443dcf7893386c180d3d22ddf81cc72a4d96f66a16193c97747cec3");
  assert.equal(value.heldToddSomaContourObjectCount, 33);
  assert.equal(value.heldToddSomaVertexCount, 1904);
});

test("locks eight completeness slots for 376 profiles and separates source objects from rosters", () => {
  const value = manifest.exactReferences.recordCompletenessAndNativeContourCatalogIntegrity;
  assert.equal(value.molecularProfileCount, 376);
  assert.equal(value.completenessProfileCount, 376);
  assert.equal(value.sourceNamespaceCount, 9);
  assert.equal(value.completenessSlotCount, 8);
  assert.equal(value.canonicalSourceCount, 27);
  assert.equal(value.canonicalRecordSetCount, 33);
  assert.equal(value.bundledExactRosterCount, 9);
  assert.equal(value.bundledExactObjectSetCount, 1);
  assert.equal(value.fixedCompletenessSlotsForEveryMolecularProfile, true);
  assert.equal(value.contourObjectsAreNotCellsOrTypes, true);
  assert.match(manifest.scientificBoundaries.recordCompletenessAndNativeContourCatalogIntegrity, /neither cells nor interneuron types/);
});

test("keeps line-only rendering and all unsupported authority at zero", () => {
  const value = manifest.exactReferences.recordCompletenessAndNativeContourCatalogIntegrity;
  for (const field of ["admittedSurfaceCount", "admittedVolumeCount", "admittedInternalStructureCount", "generatedFallbackPrimitiveCount", "filledPolygonCount", "triangleCount", "standardizedSwcOverlayCount", "sameCellCrossModalJoinCount", "crossSourceIdentityCount", "registrationCount", "atlasRegistrationCount"]) assert.equal(value[field], 0, field);
  for (const field of ["lineLoopsOnly", "selectedRecordIdentityGated", "priorRecordGeometryCleared", "sourceCoordinatesPreserved", "viewerTransformReversible", "traceRadiusRenderingForbidden", "datToSwcOverlayForbidden", "heldRecordsRenderZeroPrimitives", "noGenericGeometrySubstitution"]) assert.equal(value[field], true, field);
});

test("pins current UI, data registries, commands and immutable 2.39 snapshot receipts", () => {
  const value = manifest.exactReferences.recordCompletenessAndNativeContourCatalogIntegrity;
  const expectedPaths = new Map([
    ["catalogReceipt", "data/neurolucida-native-contour-admission-catalog-0.2.json"],
    ["observedMorphologyRouteLibraryReceipt", "app/ObservedMorphologyRouteLibrary.tsx"],
    ["atlasFocusSynchronizationReceipt", "app/AtlasPrototype.tsx"],
    ["atlasTypeContractsReceipt", "app/atlas-types.ts"],
    ["researchRecordPresentationRuntimeReceipt", "app/research-record-presentation.js"],
    ["sourceRegistryReceipt", "data/research-source-registry-0.1.json"],
    ["upgradeQueueReceipt", "docs/RESEARCH_MODEL_UPGRADE_QUEUE.md"],
    ["upgradeRegistryReceipt", "data/research-model-upgrade-registry-0.1.json"],
    ["projectReadmeReceipt", "README.md"],
    ["applicationPackageReceipt", "package.json"],
    ["parentSnapshotValidatorReceipt", "scripts/validate-research-iteration-manifest-2.39-snapshot.mjs"],
  ]);
  for (const [receiptField, expectedPath] of expectedPaths) {
    assert.equal(value[receiptField].path, expectedPath);
    const input = manifest.authoritativeInputs.find((candidate) => candidate.path === expectedPath);
    assert.deepEqual(value[receiptField], { path: input.path, bytes: input.bytes, sha256: input.sha256 });
  }
});

test("rejects DAT identity, completeness, roster, surface, parent and upgrade mutations", async () => {
  const cases = [
    mutated((value) => { value.exactReferences.recordCompletenessAndNativeContourCatalogIntegrity.auditedNeuronIds[0] = 45674; }),
    mutated((value) => { value.exactReferences.recordCompletenessAndNativeContourCatalogIntegrity.admittedContourObjectCount = 14; }),
    mutated((value) => { value.exactReferences.recordCompletenessAndNativeContourCatalogIntegrity.completenessSlotCount = 7; }),
    mutated((value) => { value.exactReferences.recordCompletenessAndNativeContourCatalogIntegrity.bundledExactRosterCount = 10; }),
    mutated((value) => { value.exactReferences.recordCompletenessAndNativeContourCatalogIntegrity.admittedSurfaceCount = 1; }),
    mutated((value) => { value.registrySummary.canonicalRecordSetCount = 32; }),
    mutated((value) => { value.parentIterationManifest.fileSha256 = "0".repeat(64); }),
    mutated((value) => { value.registrySummary.researchUpgradeCount = 185; }),
  ];
  for (const value of cases) {
    await assert.rejects(
      () => validateResearchIterationManifest240(value),
      /content receipt|schema|parent|registry|contour|completeness|roster|surface|must remain|upgrade|identity/i,
    );
  }
});
