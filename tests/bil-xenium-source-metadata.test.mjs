import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { assessBilXeniumPilotAdmission, buildBilXeniumRunReceipt, validateBilXeniumMetadata } from "../app/bil-xenium-source-metadata.js";
import { validateBilXeniumMetadataSources } from "../scripts/validate-bil-xenium-source-metadata-0.1.mjs";

const metadata = JSON.parse(await readFile(new URL("../data/bil-xenium-source-metadata-0.1.json", import.meta.url), "utf8"));

test("current BIL small metadata receipt verifies actual bytes and retains zero admitted geometry", async () => {
  assert.deepEqual(await validateBilXeniumMetadataSources(), {
    runSlideBundleCount: 16, rawSegmentedCellCount: 3387300, namedOutlineLabelCount: 329,
    geometryObjects: 0, inputFiles: 82, inputBytes: 2320586, coreInputFiles: 34, coreInputBytes: 1187125,
  });
  assert.equal(metadata.workbook.templateExampleRow6Excluded, true);
  assert.equal(metadata.panel.uniqueGeneTargetCount, 480);
  assert.equal(metadata.workbook.spatialTxRow7.cellId, null);
  assert.equal(metadata.workbook.spatialTxRow7.nuclearImageTransform, null);
});

test("exact run receipt exposes observed mixed segmentation rather than chemistry-inferred nuclear expansion", () => {
  const run = buildBilXeniumRunReceipt(metadata, "BIL:ace-pie-bin");
  assert.equal(run.directoryFolder, "Run1_Slide1_Mus_M1_F1");
  assert.equal(run.processing.analysisSoftware, "xenium-3.3.0.1");
  assert.deepEqual(run.processing.methodCounts, { boundary: 1121, interior: 194741, nuc_expansion: 12937 });
  assert.equal(run.processing.nuclearExpansionDistanceUm, null);
  assert.equal(run.pilotAdmission.admitted, false);
  assert.equal(run.pilotAdmission.geometry, null);
});

test("selection remains source-keyed even when deposited specimen donor keys repeat", () => {
  const a = buildBilXeniumRunReceipt(metadata, "BIL:ace-pie-cat");
  const b = buildBilXeniumRunReceipt(metadata, "BIL:ace-pie-cop");
  assert.equal(a.apiSpecimens[0].samplelocalid, b.apiSpecimens[0].samplelocalid);
  assert.notEqual(a.manifestIdentity.roi_uuid, b.manifestIdentity.roi_uuid);
  assert.notEqual(a.directoryFolder, b.directoryFolder);
  assert.equal(a.claims.interneuronObjects, 0);
  assert.equal(buildBilXeniumRunReceipt(metadata, "BIL:missing"), null);
  assert.equal(buildBilXeniumRunReceipt(metadata, "Mus_M1_F1"), null);
});

test("all current pilot dependencies stay explicit; metadata and outlines cannot promote geometry", () => {
  const admission = assessBilXeniumPilotAdmission(metadata);
  assert.equal(admission.admitted, false);
  assert.deepEqual(admission.blockers.map((gate) => gate.id), ["file_rights", "section_identity", "specimen_identity", "cell_schema", "curated_labels"]);
  for (const mutate of [
    (value) => { value.admission.cellBoundaryObjects = 1; },
    (value) => { value.admission.sameCellMorphologyJoins = 1; },
    (value) => { value.collection.outlineLabelsAreVerifiedSections = true; },
    (value) => { value.runs[0].cellToSectionJoinVerified = true; },
    (value) => { value.runs[0].processing.nuclearExpansionDistanceUm = 5; },
    (value) => { value.runs[1].manifestIdentity.roi_uuid = value.runs[0].manifestIdentity.roi_uuid; },
    (value) => { value.runs[0].processing.methodCounts.interior += 1; },
    (value) => { value.runs[0].rights.policyDifferenceResolved = true; },
    (value) => { value.pilotGates.pop(); },
    (value) => { value.pilotGates[1].status = "verified"; },
  ]) {
    const altered = structuredClone(metadata);
    mutate(altered);
    assert.throws(() => validateBilXeniumMetadata(altered));
  }
});

test("normalized identity, checksum and specimen changes are rejected against current source bytes", async () => {
  for (const mutate of [
    (value) => { value.runs[0].sourceFiles[0].sha256 = "f".repeat(64); },
    (value) => { value.runs[0].manifestIdentity.cassette_name = "invented"; },
    (value) => { value.runs[0].apiSpecimens[0].sex = "unknown"; },
    (value) => { value.runs[0].processing.methodCounts.boundary += 1; value.runs[0].processing.methodCounts.interior -= 1; },
    (value) => { value.runs[0].namedOutlineLabels[0] = "Cervical_invented"; },
  ]) {
    const altered = structuredClone(metadata);
    mutate(altered);
    await assert.rejects(validateBilXeniumMetadataSources(altered));
  }
});
