import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createSourceIdentityHierarchy, SOURCE_IDENTITY_LEVELS } from "../app/source-object-identity.js";
import { evaluateSameCellInternalSource, SAME_CELL_INTERNAL_SOURCE_FIELDS } from "../app/same-cell-internal-source-contract.js";
import { buildExactRecordDetailCoverage } from "../app/exact-record-detail-coverage.js";

// Entirely synthetic contract/QC fixture. Never a live source or scientific admission.
const known = (id) => ({ status: "known", id, locator: "synthetic-only.tsv#test-record", reason: null });
const unknown = () => ({ status: "unknown", id: null, locator: null, reason: "Synthetic unreported identity." });
function fixture() {
  const scope = { sourceId: "synthetic-only-source", releaseId: "test-v1", namespace: "test-volume" };
  const nodes = Object.fromEntries(SOURCE_IDENTITY_LEVELS.map((level) => [level, unknown()]));
  nodes.specimen = known("test-specimen-1"); nodes.section = known("test-section-1"); nodes.cell = known("test-cell-1");
  const parent = (parentLevel, childLevel, parentId, childId) => ({ ...scope, parentLevel, childLevel, parentId, childId, locator: "synthetic-only.tsv#test-parent" });
  const target = createSourceIdentityHierarchy({ ...scope, objectKind: "cell_root", objectId: "test-cell-1", objectLevel: "cell", objectLocator: "synthetic-only.tsv#test-cell", unit: "synthetic_test_cell", nodes,
    parentEvidence: { section: parent("specimen", "section", "test-specimen-1", "test-section-1"), cell: parent("section", "cell", "test-section-1", "test-cell-1") }, population: unknown() });
  const componentInput = structuredClone(target);
  componentInput.objectKind = "nucleus"; componentInput.objectId = "test-nucleus-1"; componentInput.objectLevel = "component";
  componentInput.nodes.component = known("test-nucleus-1"); componentInput.parentEvidence.component = parent("cell", "component", "test-cell-1", "test-nucleus-1");
  const component = createSourceIdentityHierarchy(componentInput);
  const frame = { ...scope, id: "test-native-frame", dimensions: 3, unit: "nanometre", axisOrder: ["x", "y", "z"], axisDirections: [1, 1, 1], origin: [0, 0, 0], locator: "synthetic-only.tsv#test-frame" };
  const receipt = (path, digit) => ({ path, bytes: 10, algorithm: "SHA-256", digest: digit.repeat(64), status: "verified" });
  const candidate = { hierarchy: component, doi: "10.1234/synthetic-contract-fixture", repositoryObjectUri: "https://example.org/synthetic-only/nucleus-1/v1",
    specimenId: "test-specimen-1", cellId: "test-cell-1", geometryId: "test-nucleus-1-mesh", geometryVersion: "test-mesh-v1", releaseId: scope.releaseId,
    geometryLocator: "synthetic-only.tsv#test-geometry", structureKind: "nucleus", modality: "serial_volume_em", coordinateFrame: frame,
    voxelResolution: { values: [4, 4, 40], unit: "nanometre", locator: "synthetic-only.tsv#test-voxel" },
    boundingBox: { min: [0, 0, 0], max: [100, 100, 200], unit: "nanometre", frameId: frame.id, locator: "synthetic-only.tsv#test-bounds" },
    rights: { status: "verified_file_reuse", license: "synthetic-test-only", termsUri: "https://example.org/synthetic-only/terms", objectUri: "https://example.org/synthetic-only/nucleus-1/v1", locator: "synthetic-only.tsv#test-rights" },
    geometryReceipt: receipt("synthetic-only/geometry", "a"), rawReceipts: [receipt("synthetic-only/raw-volume", "b"), receipt("synthetic-only/segmentation", "c")] };
  const proof = { id: "synthetic-only-link", relation: "source_reported_component_of_exact_cell", targetKey: target.key, componentKey: component.key,
    locator: "synthetic-only.tsv#test-link", targetHierarchy: target, targetCoordinateFrame: frame, candidateContract: structuredClone(candidate),
    sourceReceipts: [receipt("synthetic-only/source-link", "d")], qc: { sameSpecimenVerified: true, sameCellVerified: true, notPopulationMarkerOrColocationOnly: true,
      geometryVersionAndBoundsVerified: true, assetRightsVerified: true, originalVolumeSlicesChecked: true, segmentationMatchesRawSource: true,
      method: "synthetic-contract-test", methodVersion: "test-v1", locator: "synthetic-only.tsv#test-qc" } };
  candidate.sameCellJoinEvidence = proof;
  return { targetHierarchy: target, targetCoordinateFrame: frame, candidate, verifiedEvidence: [proof], runtimeReceipts: [candidate.geometryReceipt, ...candidate.rawReceipts, ...proof.sourceReceipts] };
}

test("no source object leaves every required field explicitly unavailable, with no proxy admission", () => {
  const result = evaluateSameCellInternalSource();
  assert.equal(result.internalLayerStatus, "Unavailable"); assert.equal(result.eligible, false);
  assert.deepEqual(result.missingRequiredFields.toSorted(), SAME_CELL_INTERNAL_SOURCE_FIELDS.map((field) => field.id).toSorted());
  assert.equal(result.geometryObjectsAdmittedByThisEvaluation, 0); assert.equal(result.registrationsCreated, 0);
});

test("a complete synthetic source/loader/QC chain can pass eligibility without creating an admitted object", () => {
  const result = evaluateSameCellInternalSource(fixture());
  assert.equal(result.eligible, true); assert.equal(result.internalLayerStatus, "Eligible_for_source_local_renderer");
  assert.deepEqual(result.missingRequiredFields, []); assert.equal(result.geometryObjectsAdmittedByThisEvaluation, 0);
  assert.equal(result.crossSourceIdentityCreated, false); assert.equal(result.registrationsCreated, 0);
  assert.ok(evaluateSameCellInternalSource({ ...fixture(), requiredStructureKind: "organelle" }).missingRequiredFields.includes("cell"));
});

test("complete client declarations do not substitute for independent source evidence or current verified bytes", () => {
  const input = fixture();
  for (const overrides of [{ verifiedEvidence: [] }, { runtimeReceipts: [] }, { verifiedEvidence: [input.verifiedEvidence[0], input.verifiedEvidence[0]] }]) {
    assert.equal(evaluateSameCellInternalSource({ ...input, ...overrides }).eligible, false);
  }
  const corrupted = structuredClone(input.runtimeReceipts); corrupted[0].digest = "f".repeat(64);
  assert.ok(evaluateSameCellInternalSource({ ...input, runtimeReceipts: corrupted }).missingRequiredFields.includes("byte_receipts"));
  const repeated = [...input.runtimeReceipts, input.runtimeReceipts[0]];
  assert.equal(evaluateSameCellInternalSource({ ...input, runtimeReceipts: repeated }).eligible, false);
});

test("edited geometry version, rights or exact target invalidate an earlier independently verified proof", () => {
  for (const mutate of [
    (input) => { input.candidate.geometryVersion = "different-version"; },
    (input) => { input.candidate.rights.objectUri = "https://example.org/different-object"; },
    (input) => { input.candidate.repositoryObjectUri = "https://example.org/different-object"; },
    (input) => { input.targetCoordinateFrame.origin[2] = 40; },
    (input) => { input.candidate.specimenId = "test-specimen-2"; },
    (input) => { input.candidate.cellId = "test-cell-2"; },
  ]) {
    const input = fixture(); mutate(input);
    assert.equal(evaluateSameCellInternalSource(input).eligible, false);
  }
});

test("2D, missing physical calibration, degenerate boxes and absent raw QC cannot become an internal 3D object", () => {
  for (const mutate of [
    (input) => { input.candidate.modality = "spatial_transcriptomics_2d"; },
    (input) => { input.candidate.voxelResolution.values[2] = 0; },
    (input) => { input.candidate.voxelResolution.unit = "pixel"; },
    (input) => { input.candidate.coordinateFrame.axisOrder = ["x", "x", "z"]; },
    (input) => { input.candidate.boundingBox.max[0] = 0; },
    (input) => { input.candidate.rawReceipts = []; },
    (input) => { input.candidate.sameCellJoinEvidence.qc.originalVolumeSlicesChecked = false; },
    (input) => { input.candidate.sameCellJoinEvidence.qc.notPopulationMarkerOrColocationOnly = false; },
  ]) {
    const input = fixture(); mutate(input);
    // Even accepting the edited proposal into this synthetic trusted registry
    // cannot override the field-specific guards.
    const { sameCellJoinEvidence: proof, ...snapshot } = input.candidate;
    proof.candidateContract = structuredClone(snapshot); proof.targetCoordinateFrame = structuredClone(input.targetCoordinateFrame);
    input.verifiedEvidence = [proof];
    assert.equal(evaluateSameCellInternalSource(input).eligible, false);
  }
});

test("a source population or unproven component parent remains unavailable even with all synthetic QC flags", () => {
  const input = fixture();
  const target = structuredClone(input.targetHierarchy); target.objectId = "population-1"; target.objectKind = "source_profile"; target.objectLevel = "population"; target.population = known("population-1");
  input.targetHierarchy = createSourceIdentityHierarchy(target);
  const proof = input.candidate.sameCellJoinEvidence;
  proof.targetKey = input.targetHierarchy.key; proof.targetHierarchy = input.targetHierarchy;
  assert.ok(evaluateSameCellInternalSource(input).missingRequiredFields.includes("cell"));
  const other = fixture(), component = structuredClone(other.candidate.hierarchy); delete component.parentEvidence.component;
  other.candidate.hierarchy = createSourceIdentityHierarchy(component);
  const { sameCellJoinEvidence: otherProof, ...snapshot } = other.candidate;
  otherProof.candidateContract = snapshot;
  assert.ok(evaluateSameCellInternalSource(other).missingRequiredFields.includes("cell"));
});

test("legacy selected-record coverage rejects the former positive-count-plus-hash shortcut", () => {
  const digest = "a".repeat(64);
  const record = { key: "morphology_record:synthetic-only", focusKind: "morphology_record", focusId: "synthetic-only",
    evidence: [{ label: "Nucleus surface", value: `claimed nucleus mesh ${digest}`, authority: "OBS", locator: "synthetic-geometry" }],
    provenance: { objectHashes: [{ label: "synthetic-geometry", sha256: digest }] }, gaps: [],
    presentation: { modeling: { admittedInternalObjectCount: 999, axes: [] } } };
  const coverage = buildExactRecordDetailCoverage({ indexState: { status: "ready", records: [record] }, focus: { focusKind: record.focusKind, focusId: record.focusId },
    activeRecordState: { status: "ready", requestKey: record.key, focusKind: record.focusKind, focusId: record.focusId, record } });
  assert.equal(coverage.rows.find((row) => row.id === "nucleus").status, "unavailable");
  assert.equal(coverage.indexSummary.admittedInternalObjectCount, 0);
  assert.equal(coverage.internalSourceGates.nucleus.eligible, false);
});

test("an eligible synthetic nucleus still needs its own geometry hash and cannot occupy the organelle slot", () => {
  const input = fixture(), digest = input.candidate.geometryReceipt.digest;
  const record = { key: "morphology_record:synthetic-fully-bound", focusKind: "morphology_record", focusId: "synthetic-fully-bound",
    sourceIdentityHierarchy: input.targetHierarchy, internalCoordinateFrame: input.targetCoordinateFrame,
    internalSourceContracts: { nucleus: input.candidate, organelles: input.candidate },
    evidence: [{ label: "Nucleus surface", value: `synthetic-only nucleus mesh ${digest}`, authority: "OBS", locator: "synthetic-only/geometry" },
      { label: "Organelle geometry", value: `synthetic-only mismatched structure kind ${digest}`, authority: "OBS", locator: "synthetic-only/geometry" }],
    provenance: { objectHashes: [{ label: "synthetic-only/geometry", sha256: digest }] }, gaps: [],
    presentation: { modeling: { admittedInternalObjectCount: 2, axes: [] } } };
  const options = { indexState: { status: "ready", records: [record] }, focus: { focusKind: record.focusKind, focusId: record.focusId },
    activeRecordState: { status: "ready", requestKey: record.key, focusKind: record.focusKind, focusId: record.focusId, record },
    verifiedInternalEvidence: input.verifiedEvidence, internalRuntimeReceipts: input.runtimeReceipts };
  const coverage = buildExactRecordDetailCoverage(options);
  assert.equal(coverage.rows.find((row) => row.id === "nucleus").status, "observed_source_object");
  assert.equal(coverage.rows.find((row) => row.id === "organelles").status, "unavailable");
  assert.equal(coverage.indexSummary.admittedInternalObjectCount, 1);
  record.provenance.objectHashes[0].sha256 = "f".repeat(64);
  const changed = buildExactRecordDetailCoverage(options);
  assert.equal(changed.rows.find((row) => row.id === "nucleus").status, "unavailable");
  assert.equal(changed.indexSummary.admittedInternalObjectCount, 0);
});

test("all 641 actual verified Explorer records remain free of fabricated same-cell internal admissions", async () => {
  const index = JSON.parse(await readFile(new URL("../public/data/research_explorer_index_v1/search-index.json", import.meta.url), "utf8"));
  assert.equal(index.records.length, 641);
  for (const record of index.records) {
    const result = evaluateSameCellInternalSource({ targetHierarchy: record.sourceIdentityHierarchy ?? null, candidate: record.internalSourceContracts?.nucleus ?? null });
    assert.equal(result.eligible, false, record.key);
  }
});
