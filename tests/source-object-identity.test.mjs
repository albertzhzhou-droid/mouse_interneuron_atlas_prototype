import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildIndependentSourceObjectIndex, listIndependentSourceObjects } from "../app/independent-source-objects.js";
import { loadCanoCholInRoster } from "../app/cano-chol-in-nucleus-roster.js";
import { independentSourceReplayExport, validateIndependentSourceViewReplay } from "../app/independent-source-workspace-state.js";
import { SOURCE_IDENTITY_LEVELS, sourceNamespacedObjectKey, createSourceIdentityHierarchy, validateSourceIdentityHierarchy,
  resolveSourceRelationship, independentSourceIdentityHierarchy, canoSourceIdentityHierarchy, canoSourcePopulationEvidence } from "../app/source-object-identity.js";

const json = async (name) => JSON.parse(await readFile(new URL(`../data/${name}.json`, import.meta.url), "utf8"));
const base = await json("neurolucida-native-contour-admission-catalog-0.3"), delta = await json("neurolucida-native-contour-admission-catalog-0.4");
const index = buildIndependentSourceObjectIndex({ nativeContourCatalog: { ...delta, baseCatalogSnapshot: base, records: [...base.records, ...delta.addedRecords] },
  micronsReference: await json("microns-observed-cell-nucleus-reference-0.1"), bancMorphologyRoute: await json("banc-v888-in14a018-morphology-route-0.1"),
  superClemReference: await json("super-clem-palm-localization-reference-0.1"), microStructFormerReference: await json("microstructformer-ultrastructure-reference-0.1"),
  bancCandidateAudit: await json("banc-v888-candidate-audit-0.1"), nativeContourSourceContext: await json("native-contour-source-context-0.1") });
const registry = await json("cano-gomez-p56-multiome-interneuron-registry-0.1");
const compressed = await readFile(new URL("../public/data/cano_gomez_p56_multiome_interneuron_v1/GSE318731_confirmed_interneuron_nucleus_roster.csv.gz", import.meta.url));
const roster = await loadCanoCholInRoster(registry, { fetchImpl: async () => new Response(new Uint8Array(compressed)) });

// Synthetic fixtures exercise a contract. They are not entries in a live source adapter.
const unknown = () => ({ status: "unknown", id: null, locator: null, reason: "Synthetic missing field." });
const known = (id) => ({ status: "known", id, locator: "synthetic-fixture.tsv#test-row", reason: null });
function synthetic(section = "section-A", namespace = "test-run-A") {
  const scope = { sourceId: "synthetic-test-source", releaseId: "v1", namespace };
  const nodes = Object.fromEntries(SOURCE_IDENTITY_LEVELS.map((level) => [level, unknown()]));
  nodes.specimen = known("specimen-A"); nodes.section = known(section); nodes.cell = known("cell-1");
  return createSourceIdentityHierarchy({ ...scope, objectKind: "cell_root", objectLevel: "cell", objectId: "cell-1", objectLocator: "synthetic-fixture.tsv#cell-1", unit: "synthetic_test_cells", nodes, population: known("population-A"),
    parentEvidence: { section: { ...scope, parentLevel: "specimen", childLevel: "section", parentId: "specimen-A", childId: section, locator: "synthetic-fixture.tsv#section-parent" },
      cell: { ...scope, parentLevel: "section", childLevel: "cell", parentId: section, childId: "cell-1", locator: "synthetic-fixture.tsv#cell-parent" } } });
}
function syntheticEvidence(left, right, type = "same_physical_object") {
  const binding = (hierarchy) => ({ sourceId: hierarchy.sourceId, releaseId: hierarchy.releaseId, namespace: hierarchy.namespace,
    objectKind: hierarchy.objectKind, objectId: hierarchy.objectId, specimen: hierarchy.nodes.specimen.id, section: hierarchy.nodes.section.id, cell: hierarchy.nodes.cell.id, population: hierarchy.population.id });
  return { id: "synthetic-contract-proof-not-a-live-source-assertion", type, leftKey: left.key, rightKey: right.key,
    locator: "synthetic-fixture.tsv#test-mapping", bindings: { left: binding(left), right: binding(right) },
    qc: { exactObjectMappingVerified: true, specimenIdentityVerified: true, sourceFileReceiptsVerified: true,
      samePhysicalObjectNotMerelyParentChild: true, exactSectionMappingVerified: true, exactPopulationAssignmentVerified: true },
    sourceReceipts: [{ path: "synthetic-fixture.tsv", bytes: 10, algorithm: "SHA-256", digest: "a".repeat(64), status: "verified" }] };
}

test("identity keys separate namespace, parent section and release, without numeric coercion", () => {
  const first = synthetic();
  assert.notEqual(first.key, synthetic("section-B").key);
  assert.notEqual(first.nodes.cell.key, synthetic("section-B").nodes.cell.key);
  assert.notEqual(first.key, synthetic("section-A", "test-run-B").key);
  assert.notEqual(sourceNamespacedObjectKey(first), sourceNamespacedObjectKey({ ...first, releaseId: "v2" }));
  assert.equal(sourceNamespacedObjectKey({ ...first, objectId: 123 }), null);
  assert.equal(sourceNamespacedObjectKey({ ...first, objectId: "\ud800" }), null);
  assert.equal(sourceNamespacedObjectKey({ ...first, namespace: "" }), null);
});

test("actual MICrONS/BANC parent context remains distinct from physical-object identity and missing specimen/section", () => {
  for (const sourceId of ["microns-phase1", "banc-v888"]) {
    const records = listIndependentSourceObjects(index, { sourceId }).records;
    const hierarchies = records.map((record) => independentSourceIdentityHierarchy(index, record.key));
    assert.ok(hierarchies.every((hierarchy) => hierarchy.nodes.specimen.id === null && hierarchy.nodes.section.id === null));
    assert.equal(hierarchies[0].nodes.cell.id, hierarchies[1].nodes.cell.id);
    assert.equal(hierarchies[1].parents.component.key, hierarchies[0].nodes.cell.key);
    assert.equal(hierarchies[1].parents.component.status, "source_reported");
    assert.equal(resolveSourceRelationship(...hierarchies).type, "co_display_only");
    assert.throws(() => resolveSourceRelationship(...hierarchies, "same_physical_object"), /independently verified/);
    const changed = structuredClone(hierarchies[1]); changed.nodes.cell.id = "different-parent";
    assert.throws(() => validateSourceIdentityHierarchy(changed), /parent evidence/);
  }
  const microns = listIndependentSourceObjects(index, { sourceId: "microns-phase1" }).records[0];
  assert.equal(independentSourceIdentityHierarchy(index, microns.key).nodes.cell.id, "648518346349516051");
  assert.throws(() => independentSourceIdentityHierarchy(index, microns.key.replace("v185.4", "v185.3")), /unavailable/);
});

test("native contours, PALM detections and image/mask rows do not gain invented cell or section parents", () => {
  for (const sourceId of ["native-contours", "super-clem-palm", "microstructformer"]) {
    const record = listIndependentSourceObjects(index, { sourceId }).records[0];
    const hierarchy = independentSourceIdentityHierarchy(index, record.key);
    assert.equal(hierarchy.nodes.cell.id, null);
    assert.equal(hierarchy.nodes.section.id, null);
    assert.equal(hierarchy.parents.component.key, null);
    assert.ok(hierarchy.parents.component.reason);
    assert.equal(hierarchy.geometryTransferAllowed, false);
    assert.equal(hierarchy.nodes.specimen.id, sourceId === "super-clem-palm" ? "AQ848" : null);
  }
});

test("relation enums require their own immutable source-registry entry, exact endpoint bindings and QC", () => {
  const left = synthetic(), right = synthetic();
  const evidence = syntheticEvidence(left, right);
  const result = resolveSourceRelationship(left, right, "same_physical_object", evidence, [evidence]);
  assert.equal(result.type, "same_physical_object");
  assert.equal(result.grantsGeometryTransfer, false);
  assert.equal(result.sameCellInternalAdmission, false);
  assert.equal(result.registrationCount, 0);
  assert.throws(() => resolveSourceRelationship(left, right, "same_physical_object", evidence, []), /registry/);
  assert.throws(() => resolveSourceRelationship(left, right, "same_section", evidence, [evidence]), /type.*endpoints/);
  assert.throws(() => resolveSourceRelationship(left, right, "same_physical_object", evidence, [evidence, evidence]), /ambiguous/);
  for (const mutate of [(proof) => { proof.qc.exactObjectMappingVerified = false; }, (proof) => { proof.bindings.right.namespace = "other-run"; },
    (proof) => { proof.sourceReceipts[0].status = "source_reported"; }, (proof) => { proof.qc.samePhysicalObjectNotMerelyParentChild = false; }]) {
    const changed = structuredClone(evidence); mutate(changed);
    assert.throws(() => resolveSourceRelationship(left, right, "same_physical_object", changed, [changed]));
  }
  assert.equal(resolveSourceRelationship(left, right).type, "co_display_only");
  assert.throws(() => resolveSourceRelationship(left, right, "same_cell"), /unknown relation/);
  assert.throws(() => resolveSourceRelationship(left, right, "co_display_only", evidence), /cannot carry/);
});

test("missing identity and unproven parent chains fail closed even with complete synthetic QC flags", () => {
  const input = structuredClone(synthetic());
  delete input.parentEvidence.cell;
  const incomplete = createSourceIdentityHierarchy(input);
  const evidence = syntheticEvidence(incomplete, incomplete);
  assert.throws(() => resolveSourceRelationship(incomplete, incomplete, "same_physical_object", evidence, [evidence]), /parent chain/);
  input.nodes.specimen = unknown(); delete input.parentEvidence.section;
  const missing = createSourceIdentityHierarchy(input), proof = syntheticEvidence(missing, missing);
  assert.throws(() => resolveSourceRelationship(missing, missing, "same_physical_object", proof, [proof]), /specimen identity/);
  const stale = structuredClone(synthetic()); stale.nodes.section.id = "changed-section";
  assert.throws(() => validateSourceIdentityHierarchy(stale), /parent evidence/);
});

test("all eleven actual Cano source populations bind their verified nucleus rows without animal/cell geometry claims", () => {
  for (const profile of registry.profiles) {
    const row = roster.rows.find((item) => item.profileId === profile.profileId);
    const aggregate = canoSourceIdentityHierarchy(registry, roster, profile.profileId);
    const nucleus = canoSourceIdentityHierarchy(registry, roster, profile.profileId, row.key);
    const proof = canoSourcePopulationEvidence(registry, roster, profile.profileId, null, row.key);
    const relation = resolveSourceRelationship(aggregate, nucleus, "same_source_population", proof, [proof]);
    assert.equal(relation.type, "same_source_population");
    assert.equal(nucleus.nodes.component.id, row.key);
    assert.equal(nucleus.nodes.cell.id, null);
    assert.equal(nucleus.nodes.specimen.id, null);
    assert.equal(nucleus.parents.component.key, null);
    assert.equal(relation.sameCellInternalAdmission, false);
    assert.equal(proof.sourceReceipts[0].bytes, 428897);
    assert.match(proof.sourceReceipts[0].path, /representation=decoded-csv$/);
  }
  const profile = registry.profiles[0], otherRow = roster.rows.find((row) => row.profileId !== profile.profileId);
  assert.throws(() => canoSourceIdentityHierarchy(registry, roster, profile.profileId, otherRow.key), /does not belong/);
  const changed = structuredClone(roster); changed.verification.uncompressedSha256 = "0".repeat(64);
  assert.throws(() => canoSourceIdentityHierarchy(registry, changed, profile.profileId), /runtime-verified/);
});

test("a changed key, authority or coordinate-like proximity cannot promote an exported hierarchy", () => {
  const hierarchy = synthetic();
  for (const mutate of [(value) => { value.key += "fake"; }, (value) => { value.geometryTransferAllowed = true; },
    (value) => { value.sharedMarkers = ["Pax2"]; }, (value) => { value.registrationCount = 1; }]) {
    const changed = structuredClone(hierarchy); mutate(changed);
    assert.throws(() => validateSourceIdentityHierarchy(changed), /were changed/);
  }
});

test("a cell and its exact source component cannot become the same physical object through synthetic QC flags", () => {
  const cell = synthetic();
  const input = structuredClone(cell);
  input.objectKind = "nucleus"; input.objectLevel = "component"; input.objectId = "nucleus-1";
  input.nodes.component = known("nucleus-1");
  input.parentEvidence.component = { sourceId: cell.sourceId, releaseId: cell.releaseId, namespace: cell.namespace,
    parentLevel: "cell", childLevel: "component", parentId: "cell-1", childId: "nucleus-1", locator: "synthetic-fixture.tsv#component-parent" };
  const component = createSourceIdentityHierarchy(input);
  for (const [left, right] of [[cell, component], [component, cell]]) {
    const proof = syntheticEvidence(left, right);
    assert.throws(() => resolveSourceRelationship(left, right, "same_physical_object", proof, [proof]), /distinct source component/);
    const sectionProof = syntheticEvidence(left, right, "same_section");
    assert.equal(resolveSourceRelationship(left, right, "same_section", sectionProof, [sectionProof]).grantsGeometryTransfer, false);
  }
});

test("even registry-approved population evidence cannot merge distinct actual Cano profiles", () => {
  const [first, second] = registry.profiles;
  const left = canoSourceIdentityHierarchy(registry, roster, first.profileId);
  const right = canoSourceIdentityHierarchy(registry, roster, second.profileId);
  const proof = structuredClone(canoSourcePopulationEvidence(registry, roster, first.profileId));
  proof.rightKey = right.key;
  proof.bindings.right = { sourceId: right.sourceId, releaseId: right.releaseId, namespace: right.namespace,
    objectKind: right.objectKind, objectId: right.objectId, population: right.population.id };
  assert.throws(() => resolveSourceRelationship(left, right, "same_source_population", proof, [proof]), /different source populations/);
  assert.equal(resolveSourceRelationship(left, right).type, "co_display_only");
});

test("actual MICrONS view replay binds canonical identity, parent IDs and missingness while retaining older exports", () => {
  const record = listIndependentSourceObjects(index, { sourceId: "microns-phase1" }).records[1];
  const view = { key: record.key, representation: "microns_mesh", status: "rendered", revision: "test-only-revision",
    layers: [{ id: "nucleus", requested: true, actual: true }],
    camera: { position: [1, 2, 3], target: [0, 0, 0], up: [0, 1, 0], projection: "perspective", fov: 38, near: .1, far: 4000 },
    displayTransform: { centerNative: [1, 2, 3], scale: 2, coordinateFrame: record.coordinateFrame },
    renderer: { name: "three", version: "185", width: 600, height: 400 } };
  const version = "2.91.0-research.1";
  const saved = independentSourceReplayExport(record, { key: record.key, receipt: { objectKey: record.key, status: "verified" } }, view, version, index);
  assert.equal(saved.sourceIdentity.nodes.component.id, "4309");
  assert.equal(validateIndependentSourceViewReplay(index, saved, version).record.key, record.key);
  for (const mutate of [
    (value) => { value.sourceIdentity.namespace = "different-run"; value.sourceIdentity = createSourceIdentityHierarchy({ ...value.sourceIdentity, parentEvidence: {} }); },
    (value) => { value.sourceIdentity.nodes.cell.id = "other-parent"; },
    (value) => { value.sourceIdentity.nodes.specimen = known("invented-specimen"); value.sourceIdentity = createSourceIdentityHierarchy(value.sourceIdentity); },
    (value) => { value.sourceIdentity = null; },
    (value) => { delete value.sourceIdentity.parentEvidence.component; value.sourceIdentity = createSourceIdentityHierarchy(value.sourceIdentity); },
  ]) {
    const changed = structuredClone(saved); mutate(changed);
    assert.throws(() => validateIndependentSourceViewReplay(index, changed, version));
  }
  const legacy = structuredClone(saved); delete legacy.sourceIdentity;
  assert.equal(validateIndependentSourceViewReplay(index, legacy, version).record.key, record.key);
});
