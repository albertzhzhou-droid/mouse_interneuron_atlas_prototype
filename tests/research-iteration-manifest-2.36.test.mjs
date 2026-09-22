import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest236 } from "../scripts/validate-research-iteration-manifest-2.36.mjs";
import { buildResearchIterationManifest236 } from "../tools/build_research_iteration_manifest_2_36.mjs";

const manifestBytes = await readFile(new URL("../data/research-iteration-manifest-2.36.json", import.meta.url));
const manifest = JSON.parse(manifestBytes.toString("utf8"));
const EXPECTED_FILE_BYTES = 148126;
const EXPECTED_FILE_SHA256 = "93d8a624a5a132a91f3f423cb7b3bc966ef4082f71e18e0e82c0384267588e15";
const EXPECTED_CONTENT_SHA256 = "3021dd9d9ce1d515634f0d1ea575d624767972411edc923e9b75621979b0e344";

function mutated(update) {
  const copy = structuredClone(manifest);
  update(copy);
  copy.manifestContentSha256 = computeManifestContentSha256(copy);
  return copy;
}

test("validates the deterministic 2.36 Dmrt3/dI6 and record-specific UI manifest", async () => {
  const report = await validateResearchIterationManifest236();
  assert.deepEqual(report, {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.36.0",
    fileBytes: EXPECTED_FILE_BYTES,
    fileSha256: EXPECTED_FILE_SHA256,
    manifestContentSha256: EXPECTED_CONTENT_SHA256,
    inputCount: 127,
    researchUpgradeCount: 162,
    canonicalSourceCount: 26,
    canonicalRecordSetCount: 30,
    sourceProfileCount: 168,
    sourceNamespaceCount: 7,
    researchExplorerRecordCount: 421,
    researchExplorerSourceLaneCount: 7,
    dmrt3GroupCount: 6,
    quarantinedConflictCount: 1,
    admittedGeometryCount: 0,
    registrationCount: 0,
  });
});

test("rebuilds byte-identically from the immutable 2.35 parent and 127 exact inputs", async () => {
  const built = await buildResearchIterationManifest236();
  assert.deepEqual(built.bytes, manifestBytes);
  assert.deepEqual(manifest.parentIterationManifest, {
    path: "data/research-iteration-manifest-2.35.json",
    releaseId: "ohri-mouse-interneuron-research-iteration-2.35.0",
    bytes: 134630,
    fileSha256: "71f90cfc2c6ad2c6f74146d1992493fc77229c131764faff83657dcada797dc1",
    contentSha256: "0691b27bd2cd46e0d96d9a8862ff8478819572f7cfde225d20b9d9c93aeff828",
  });
  assert.equal(manifest.authoritativeInputs.length, 127);
  assert.equal(new Set(manifest.authoritativeInputs.map((input) => input.id)).size, 127);
  assert.equal(new Set(manifest.authoritativeInputs.map((input) => input.path)).size, 127);
  for (const id of [
    "dmrt3Di6Builder",
    "dmrt3Di6Contract",
    "dmrt3Di6Schema",
    "dmrt3Di6Validator",
    "dmrt3Di6Test",
    "knowledgeCoverageContract",
    "knowledgeCoverageSchema",
    "knowledgeCoverageValidator",
    "knowledgeCoverageTest",
    "manifestHashRuntime",
    "researchIteration235SnapshotValidator",
    "researchIteration235SnapshotTest",
    "currentResearchTestRunner",
    "researchTimeline236",
  ]) assert.equal(manifest.authoritativeInputs.some((input) => input.id === id), true, id);
});

test("locks Dmrt3/dI6, source, Explorer and coverage denominators without manufacturing a cell", () => {
  const value = manifest.exactReferences.dmrt3Di6AndRecordUiIntegrity;
  assert.equal(value.canonicalSourceCount, 26);
  assert.equal(value.canonicalRecordSetCount, 30);
  assert.equal(value.sourceProfileCount, 168);
  assert.equal(value.sourceNamespaceCount, 7);
  assert.equal(value.researchExplorerRecordCount, 421);
  assert.equal(value.researchExplorerMolecularProfileCount, 168);
  assert.equal(value.researchExplorerSourceLaneCount, 7);
  assert.equal(value.knowledgeCoverageLaneCount, 7);
  assert.equal(value.knowledgeCoverageAxisCount, 7);
  assert.equal(value.knowledgeCoverageJudgmentCount, 49);
  assert.deepEqual(value.groupLabels, ["M1", "M2", "M3", "M4", "M5", "M6"]);
  assert.deepEqual(value.groupCountVector, [84, 34, 33, 45, 54, 24]);
  assert.equal(value.retainedGroupCountSum, 274);
  assert.equal(value.sourceEmbryoCount, 3);
  assert.equal(value.poolCount, 1);
  assert.equal(value.tubeCount, 1);
  assert.equal(value.independentLibraryCount, 1);
  assert.equal(value.depositedMouseWellCount, 384);
  assert.equal(value.qcRetainedCellCount, 354);
  assert.equal(value.di6LineageRetainedCellCount, 274);
  assert.deepEqual(value.quarantinedConflictIds, ["methods-vs-executed-notebook-qc-hvg"]);
  assert.equal(value.researchUpgradeCount, 162);
  assert.equal(value.lastResearchUpgradeId, "UPG-180");
  for (const field of [
    "animalResolvedReplicateCount",
    "perWellMGroupRosterCount",
    "admittedGeometryCount",
    "admittedInternalStructureCount",
    "registrationCount",
    "sameCellCrossModalJoinCount",
    "sameRecordInternalPrimitiveCount",
    "projectCopyCount",
    "packageCopyCount",
    "completeContentFolderCopyCount",
  ]) assert.equal(value[field], 0, field);
});

test("locks exact-focus gating, record-specific cards, consolidated gaps and immutable snapshot separation", () => {
  const value = manifest.exactReferences.dmrt3Di6AndRecordUiIntegrity;
  for (const field of [
    "groupSummaryOnly",
    "perWellMGroupRosterUnavailable",
    "methodsNotebookConflictQuarantined",
    "sciSyntheticAnchorExactFocusGate",
    "nonSciFocusHidesSciSyntheticAnchors",
    "exactCurrentRecordZeroInternalPrimitiveReadout",
    "recordSwitchUpdatesEvidenceFingerprint",
    "sameRecordInternalSceneRemainsEmptyWithoutObject",
    "missingAxisDisclosureConsolidated",
    "allMissingAxesRetainedInDisclosure",
    "recordSpecificResultSnippets",
    "immutableParentSnapshotValidationSeparatedFromLiveInputs",
  ]) assert.equal(value[field], true, field);
});

test("rejects denominator, group, UI-gate, geometry, parent and registry mutations", async () => {
  const cases = [
    mutated((value) => { value.exactReferences.dmrt3Di6AndRecordUiIntegrity.researchExplorerRecordCount = 420; }),
    mutated((value) => { value.exactReferences.dmrt3Di6AndRecordUiIntegrity.groupCountVector[0] = 85; }),
    mutated((value) => { value.exactReferences.dmrt3Di6AndRecordUiIntegrity.sciSyntheticAnchorExactFocusGate = false; }),
    mutated((value) => { value.exactReferences.dmrt3Di6AndRecordUiIntegrity.admittedGeometryCount = 1; }),
    mutated((value) => { value.parentIterationManifest.fileSha256 = "0".repeat(64); }),
    mutated((value) => { value.registrySummary.researchUpgradeCount = 161; }),
  ];
  for (const value of cases) {
    await assert.rejects(
      () => validateResearchIterationManifest236(value),
      /content receipt|Dmrt3|parent|registry|schema|must remain/i,
    );
  }
});
