import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest237 } from "../scripts/validate-research-iteration-manifest-2.37.mjs";
import {
  RESEARCH_ITERATION_237_PARENT,
  buildResearchIterationManifest237,
} from "../tools/build_research_iteration_manifest_2_37.mjs";

const manifestBytes = await readFile(new URL("../data/research-iteration-manifest-2.37.json", import.meta.url));
const manifest = JSON.parse(manifestBytes.toString("utf8"));
const EXPECTED_FILE_BYTES = 161281;
const EXPECTED_FILE_SHA256 = "2ddc5b4cce26cbe5db492234446a52f3c0f182c0ff0ed896104ec6a9c4fb3b08";
const EXPECTED_CONTENT_SHA256 = "04b6f7a09968489afa420edb527a159e04f4dc07bab4ce402e394808256ca765";

function mutated(update) {
  const copy = structuredClone(manifest);
  update(copy);
  copy.manifestContentSha256 = computeManifestContentSha256(copy);
  return copy;
}

test("validates the deterministic 2.37 Roome and record-driven workspace manifest", async () => {
  const report = await validateResearchIterationManifest237();
  assert.deepEqual(report, {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.37.0",
    fileBytes: EXPECTED_FILE_BYTES,
    fileSha256: EXPECTED_FILE_SHA256,
    manifestContentSha256: EXPECTED_CONTENT_SHA256,
    inputCount: 146,
    researchUpgradeCount: 164,
    canonicalSourceCount: 27,
    canonicalRecordSetCount: 31,
    sourceProfileCount: 325,
    sourceNamespaceCount: 8,
    researchExplorerRecordCount: 579,
    researchExplorerSourceLaneCount: 8,
    refinedTypeCount: 157,
    sourceFeatureRowCount: 15900,
    quarantinedGeneCellCount: 26,
    previewCollisionCount: 0,
    admittedGeometryCount: 0,
    registrationCount: 0,
  });
});

test("rebuilds byte-identically from the immutable 2.36 parent and 146 exact inputs", async () => {
  const built = await buildResearchIterationManifest237();
  assert.deepEqual(built.bytes, manifestBytes);
  assert.deepEqual(manifest.parentIterationManifest, RESEARCH_ITERATION_237_PARENT);
  assert.equal(manifest.authoritativeInputs.length, 146);
  assert.equal(new Set(manifest.authoritativeInputs.map((input) => input.id)).size, 146);
  assert.equal(new Set(manifest.authoritativeInputs.map((input) => input.path)).size, 146);
  assert.equal(createHash("sha256").update(manifestBytes).digest("hex"), EXPECTED_FILE_SHA256);
  assert.equal(computeManifestContentSha256(manifest), EXPECTED_CONTENT_SHA256);
});

test("pins the Roome contracts, atomic workspace and immutable parent snapshot additions", () => {
  for (const id of [
    "roomeWorkbookParser",
    "roomeTaxonomyBuilder",
    "roomeTaxonomyContract",
    "roomeDifferentialFeaturesContract",
    "roomeTaxonomySchema",
    "roomeDifferentialFeaturesSchema",
    "roomeTaxonomyValidator",
    "roomeTaxonomyTest",
    "researchFocusWorkspaceState",
    "researchFocusEvidencePanel",
    "researchFocusWorkspaceTest",
    "researchIteration236SnapshotValidator",
    "researchIteration236SnapshotTest",
    "researchTimeline237",
    "researchUpgradeRegistryBuilder",
    "researchUpgradeRegistryValidator",
    "researchUpgradeRegistryTest",
    "applicationLayout",
    "observedMorphologyRuntimeContractTest",
  ]) assert.equal(manifest.authoritativeInputs.some((input) => input.id === id), true, id);
});

test("locks the exact Roome roster, family, feature, experimental-unit and quarantine denominators", () => {
  const value = manifest.exactReferences.roomeDilAndRecordWorkspaceIntegrity;
  assert.equal(value.refinedTypeCount, 157);
  assert.equal(value.familyCount, 12);
  assert.deepEqual(value.familyTypeCounts, {
    dILA1: 19,
    dILA2: 14,
    dILA3: 27,
    dILA4: 15,
    dILA5: 12,
    dILA6: 8,
    dILB1: 16,
    dILB2: 14,
    dILB3: 4,
    dILB4: 6,
    dILB5: 7,
    dILB6: 15,
  });
  assert.equal(value.refinedDilCellCount, 61444);
  assert.equal(value.biologicalLitterPoolCount, 15);
  assert.equal(value.retainedTechnicalOutputCount, 29);
  assert.equal(value.sourceFeatureRowCount, 15900);
  assert.equal(value.retainedTextGeneRowCount, 15874);
  assert.equal(value.quarantinedGeneCellCount, 26);
  assert.equal(value.nonRosterDevelopmentalLabelCount, 2);
  assert.equal(value.positiveDisplayFeaturesPerType, 6);
});

test("locks current knowledge-base and UI denominators without deduplicating source profiles", () => {
  const value = manifest.exactReferences.roomeDilAndRecordWorkspaceIntegrity;
  assert.equal(value.canonicalSourceCount, 27);
  assert.equal(value.canonicalRecordSetCount, 31);
  assert.equal(value.bundledExactRosterCount, 8);
  assert.equal(value.sourceProfileCount, 325);
  assert.equal(value.sourceNamespaceCount, 8);
  assert.equal(value.researchExplorerRecordCount, 579);
  assert.equal(value.researchExplorerMolecularProfileCount, 325);
  assert.equal(value.researchExplorerSourceLaneCount, 8);
  assert.equal(value.knowledgeCoverageLaneCount, 8);
  assert.equal(value.knowledgeCoverageAxisCount, 7);
  assert.equal(value.knowledgeCoverageJudgmentCount, 56);
  assert.equal(value.researchUpgradeCount, 164);
  assert.equal(value.lastResearchUpgradeId, "UPG-182");
});

test("locks unique previews, explicit missingness, memoization and all zero-object boundaries", () => {
  const value = manifest.exactReferences.roomeDilAndRecordWorkspaceIntegrity;
  assert.equal(value.currentRecordPreviewRowCount, 4);
  for (const field of [
    "multiRecordNamespacePreviewCollisionCount",
    "admittedGeometryCount",
    "admittedInternalStructureCount",
    "registrationCount",
    "sameCellCrossModalJoinCount",
    "projectCopyCount",
    "packageCopyCount",
    "completeContentFolderCopyCount",
  ]) assert.equal(value[field], 0, field);
  for (const field of [
    "exactTypeRosterAdmitted",
    "allDifferentialRowsRetained",
    "apparentDateGeneCellsQuarantined",
    "differentialFeaturesAreNotCanonicalMarkers",
    "biologicalAndTechnicalReplicatesSeparated",
    "atomicFocusWorkspaceRouting",
    "recordSpecificPreviewCollisionGate",
    "sharedMissingnessConsolidated",
    "verifiedExplorerIndexMemoized",
    "molecularFocusClearsPriorGeometry",
    "unsupportedGeometryFailsClosed",
    "immutableParentSnapshotValidationSeparatedFromLiveInputs",
  ]) assert.equal(value[field], true, field);
});

test("pins the compact and full Roome derivative receipts", () => {
  const value = manifest.exactReferences.roomeDilAndRecordWorkspaceIntegrity;
  assert.deepEqual(value.taxonomyContractReceipt, {
    path: "data/roome-dil-source-taxonomy-0.1.json",
    bytes: 631320,
    sha256: "dc25145e21a2f3be4faf0d65c2bd8418339a173c99ed1548564cc07c03c348e9",
  });
  assert.deepEqual(value.differentialFeaturesContractReceipt, {
    path: "data/roome-dil-differential-features-0.1.json",
    bytes: 5072736,
    sha256: "5cecf178f75aa00aff1b73ad43565fb9b85b3cfa75093c6cca2ea2ae4615b6c9",
  });
});

test("rejects roster, feature, preview, geometry, parent and registry mutations", async () => {
  const cases = [
    mutated((value) => { value.exactReferences.roomeDilAndRecordWorkspaceIntegrity.refinedTypeCount = 156; }),
    mutated((value) => { value.exactReferences.roomeDilAndRecordWorkspaceIntegrity.sourceFeatureRowCount = 15899; }),
    mutated((value) => { value.exactReferences.roomeDilAndRecordWorkspaceIntegrity.multiRecordNamespacePreviewCollisionCount = 1; }),
    mutated((value) => { value.exactReferences.roomeDilAndRecordWorkspaceIntegrity.admittedGeometryCount = 1; }),
    mutated((value) => { value.exactReferences.roomeDilAndRecordWorkspaceIntegrity.atomicFocusWorkspaceRouting = false; }),
    mutated((value) => { value.parentIterationManifest.fileSha256 = "0".repeat(64); }),
    mutated((value) => { value.registrySummary.researchUpgradeCount = 163; }),
  ];
  for (const value of cases) {
    await assert.rejects(
      () => validateResearchIterationManifest237(value),
      /content receipt|schema|Roome|preview|geometry|parent|registry|must remain/i,
    );
  }
});
