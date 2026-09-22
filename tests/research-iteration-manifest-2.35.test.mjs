import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest235 } from "../scripts/validate-research-iteration-manifest-2.35.mjs";
import { buildResearchIterationManifest235 } from "../tools/build_research_iteration_manifest_2_35.mjs";

const manifestBytes = await readFile(new URL("../data/research-iteration-manifest-2.35.json", import.meta.url));
const manifest = JSON.parse(manifestBytes.toString("utf8"));
const EXPECTED_FILE_BYTES = 134630;
const EXPECTED_FILE_SHA256 = "71f90cfc2c6ad2c6f74146d1992493fc77229c131764faff83657dcada797dc1";
const EXPECTED_CONTENT_SHA256 = "0691b27bd2cd46e0d96d9a8862ff8478819572f7cfde225d20b9d9c93aeff828";

function mutated(update) {
  const copy = structuredClone(manifest);
  update(copy);
  copy.manifestContentSha256 = computeManifestContentSha256(copy);
  return copy;
}

test("validates the deterministic 2.35 Crozat PKD2L1 functional-profile manifest", async () => {
  const report = await validateResearchIterationManifest235();
  assert.deepEqual(report, {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.35.0",
    fileBytes: EXPECTED_FILE_BYTES,
    fileSha256: EXPECTED_FILE_SHA256,
    manifestContentSha256: EXPECTED_CONTENT_SHA256,
    inputCount: 113,
    researchUpgradeCount: 158,
    canonicalSourceCount: 25,
    canonicalRecordSetCount: 29,
    sourceProfileCount: 162,
    sourceNamespaceCount: 6,
    researchExplorerRecordCount: 414,
    quarantinedConflictCount: 4,
    admittedGeometryCount: 0,
    registrationCount: 0,
  });
});

test("rebuilds byte-identically from the immutable 2.34 parent and 113 exact inputs", async () => {
  const built = await buildResearchIterationManifest235();
  assert.deepEqual(built.bytes, manifestBytes);
  assert.deepEqual(manifest.parentIterationManifest, {
    path: "data/research-iteration-manifest-2.34.json",
    releaseId: "ohri-mouse-interneuron-research-iteration-2.34.0",
    bytes: 125197,
    fileSha256: "76ead4e29455c8e9250f294afa4e78b6a72bb76709115d15954564545bb43d1e",
    contentSha256: "266ee889a591368d30b655ee059659485e746df424f448a85a6819d28e3e920c",
  });
  assert.equal(manifest.authoritativeInputs.length, 113);
  assert.equal(new Set(manifest.authoritativeInputs.map((input) => input.id)).size, 113);
  assert.equal(new Set(manifest.authoritativeInputs.map((input) => input.path)).size, 113);
  assert.equal(manifest.authoritativeInputs.some((input) => input.id === "crozatPkd2l1Contract"), true);
});

test("pins source, Explorer and experiment-family denominators without manufacturing geometry", () => {
  const value = manifest.exactReferences.crozatPkd2l1FunctionalProfileIntegrity;
  assert.equal(value.canonicalSourceCount, 25);
  assert.equal(value.canonicalRecordSetCount, 29);
  assert.equal(value.sourceProfileCount, 162);
  assert.equal(value.sourceNamespaceCount, 6);
  assert.equal(value.researchExplorerRecordCount, 414);
  assert.equal(value.researchExplorerMolecularProfileCount, 162);
  assert.equal(value.figshareFileCount, 92);
  assert.equal(value.keyFileReceiptCount, 7);
  assert.equal(value.quarantinedConflictCount, 4);
  assert.equal(value.firingPatternCellCount, 65);
  assert.equal(value.tonicCount, 38);
  assert.equal(value.singleSpikeCount, 27);
  assert.equal(value.passiveArticleAnimalCount, 191);
  assert.equal(value.passiveArticleCellCount, 659);
  assert.equal(value.passiveDepositedRowCount, 654);
  assert.equal(value.rmpAnimalCount, 25);
  assert.equal(value.rmpObservationCount, 125);
  assert.equal(value.canonicalTransmitterProfileCount, 162);
  assert.equal(value.internalStructureGapProfileCount, 162);
  for (const field of [
    "observedElectrophysiologyAxis",
    "sourceConflictQuarantineRequired",
    "staleGeometryClearedForMissingRecordGeometry",
    "specializedViewsExitOnNonMorphologyFocus",
    "exactFocusZeroGeometryReadout",
    "selectedGroupForcedVisible",
    "sourceWideEvidenceCollapseDisplayOnly",
    "expandedMissingnessFingerprintAxes",
  ]) assert.equal(value[field], true, field);
  for (const field of [
    "globalStableCellRosterCount",
    "rawElectrophysiologyTraceCount",
    "rawMicroscopyObjectCount",
    "admittedGeometryCount",
    "atlasTransformCount",
    "registrationCount",
    "sameCellCrossModalJoinCount",
    "linkToSeparatePkd2l1SbfSemStudyCount",
    "sameSpecimenInternalStructureCount",
    "projectCopyCount",
    "packageCopyCount",
  ]) assert.equal(value[field], 0, field);
});

test("rejects denominator, quarantine, geometry, parent and registry mutations", async () => {
  const cases = [
    mutated((value) => { value.exactReferences.crozatPkd2l1FunctionalProfileIntegrity.sourceProfileCount = 163; }),
    mutated((value) => { value.exactReferences.crozatPkd2l1FunctionalProfileIntegrity.quarantinedConflictCount = 3; }),
    mutated((value) => { value.exactReferences.crozatPkd2l1FunctionalProfileIntegrity.admittedGeometryCount = 1; }),
    mutated((value) => { value.parentIterationManifest.fileSha256 = "0".repeat(64); }),
    mutated((value) => { value.registrySummary.researchUpgradeCount = 157; }),
  ];
  for (const value of cases) {
    await assert.rejects(
      () => validateResearchIterationManifest235(value),
      /content receipt|Crozat|parent|registry|schema/i,
    );
  }
});
