import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { morphologySourceIdentityHierarchy, morphologyComparisonSourceRelationships, validateMorphologyComparisonIdentityReceipt } from "../app/morphology-source-identity.js";
import { morphologyComparisonReceiptCsv } from "../app/morphology-comparison.js";
import { resolveSourceRelationship } from "../app/source-object-identity.js";

const read = async path => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), "utf8"));
const census = await read("public/data/neuromorpho_release_8_6_124_census_v1/census-index.json");
const supplementary = await read("data/supplementary-morphology-comparison-adapter-0.1.json");
const censusRecords = census.records.map(record => ({ ...record, comparisonMembership: {
  collection: "census", censusContribution: 1, supplementaryContribution: 0,
  routeId: null, routeContractPath: null, routeContractSha256: null,
  routeAssetManifestPath: null, routeAssetManifestSha256: null,
} }));
const records = [...censusRecords, ...supplementary.records];
const mixed = [censusRecords[0], supplementary.records[0], censusRecords[1], supplementary.records[1]];
function identityReceipt(selected = mixed) {
  return { relationshipClass: "co_display_only", sourceRelationships: morphologyComparisonSourceRelationships(selected),
    sourceObjects: selected.map(record => ({ neuronId: record.neuronId, assetId: record.assetId,
      sourceFrame: record.normalizedMetadata.sourceFrame, dimensionality: record.normalizedMetadata.dimensionality,
      membership: record.comparisonMembership, geometry: record.geometry, sourceIdentity: morphologySourceIdentityHierarchy(record) })) };
}

test("all 149 canonical observations have unique source/release keys and no fabricated physical experiment hierarchy", () => {
  const before = JSON.stringify(records), identities = records.map(morphologySourceIdentityHierarchy);
  assert.equal(identities.length, 149);
  assert.equal(new Set(identities.map(row => row.key)).size, 149);
  assert.equal(identities.filter(row => row.namespace.includes("adult-mouse-spinal-interneuron-census-v1")).length, 142);
  for (const [i, row] of identities.entries()) {
    assert.equal(row.releaseId, "8.6.124"); assert.equal(row.sourceId, "NeuroMorpho.Org");
    assert.equal(row.objectId, String(records[i].neuronId)); assert.equal(typeof row.objectId, "string");
    assert.equal(row.objectKind, "swc_reconstruction"); assert.equal(row.nodes.component.status, "known");
    for (const level of ["specimen", "section", "cell", "synapse"]) {
      assert.equal(row.nodes[level].status, "unknown"); assert.equal(row.nodes[level].id, null);
      assert.ok(row.nodes[level].reason); assert.equal(row.nodes[level].key, null);
    }
    assert.equal(row.parents.component.status, "not_established");
    assert.equal(row.population.status, "unknown"); assert.equal(row.geometryTransferAllowed, false);
    assert.equal(row.registrationCount, 0); assert.equal(Object.isFrozen(row), true);
  }
  assert.equal(JSON.stringify(records), before);
});

test("two through four mixed observations retain every pair as typed co-display with no geometry or same-cell grant", () => {
  for (let count = 2; count <= 4; count++) {
    const relations = morphologyComparisonSourceRelationships(mixed.slice(0, count));
    assert.equal(relations.length, count * (count - 1) / 2);
    assert.equal(new Set(relations.map(row => `${row.leftKey}:${row.rightKey}`)).size, relations.length);
    for (const row of relations) {
      assert.equal(row.type, "co_display_only"); assert.equal(row.evidence, null);
      assert.equal(row.grantsGeometryTransfer, false); assert.equal(row.sameCellInternalAdmission, false);
    }
  }
  for (const selected of [[], [mixed[0]], [...mixed, mixed[0]], [mixed[0], mixed[0]]]) {
    assert.throws(() => morphologyComparisonSourceRelationships(selected), /two to four|unique/);
  }
});

test("exact native IDs, canonical geometry receipts, dimensionality and frozen membership fail closed after edits", () => {
  const changes = [r => r.neuronId = "104003", r => r.assetId = "NeuroMorpho:other",
    r => r.geometry.bytes++, r => r.geometry.sha256 = "0".repeat(64), r => r.geometry.path += ".other",
    r => r.geometry.rawSwcSha256 = "f".repeat(64), r => r.geometry.available = false,
    r => r.normalizedMetadata.dimensionality = "2D", r => r.normalizedMetadata.sourceFrame = "atlas",
    r => r.comparisonMembership.censusContribution = 0, r => r.comparisonMembership.routeId = "inferred",
    r => r.officialMetadata.neuron_id = 123456, r => r.officialMetadata.repositoryRelease = "8.6.126",
    r => r.geometry.sourceAssetSetId = "neuromorpho:8.6.126:other",
    r => r.missingness.specimenId.value = "invented animal"];
  for (const change of changes) { const record = structuredClone(censusRecords[0]); change(record); assert.throws(() => morphologySourceIdentityHierarchy(record)); }
});

test("each supplementary record binds its own route namespace and exact route/file version", () => {
  for (const original of supplementary.records) {
    const hierarchy = morphologySourceIdentityHierarchy(original);
    assert.equal(hierarchy.namespace, original.geometry.sourceAssetSetId);
    assert.equal(hierarchy.objectLocator.includes("supplementary-morphology-comparison-adapter"), true);
    for (const field of ["routeId", "routeContractPath", "routeContractSha256", "routeAssetManifestPath", "routeAssetManifestSha256"]) {
      const record = structuredClone(original); record.comparisonMembership[field] += "different";
      assert.throws(() => morphologySourceIdentityHierarchy(record), /supplementary route/);
    }
  }
});

test("labels, slicing terms, shared paper or source record number cannot produce a physical-cell, section or population relation", () => {
  const [left, right] = mixed.map(morphologySourceIdentityHierarchy);
  for (const type of ["same_physical_object", "same_section", "same_source_population"]) {
    assert.throws(() => resolveSourceRelationship(left, right, type), /independently verified source evidence/);
  }
  const alteredContext = structuredClone(censusRecords[0]);
  alteredContext.normalizedMetadata.brainRegion = ["same section"];
  alteredContext.officialMetadata.slicing_direction = "animal-001/section-001/cell-001";
  assert.deepEqual(morphologySourceIdentityHierarchy(alteredContext), morphologySourceIdentityHierarchy(censusRecords[0]));
});

test("identity receipt survives JSON and property-order round trips while preserving original unknown fields", () => {
  const receipt = identityReceipt();
  assert.equal(validateMorphologyComparisonIdentityReceipt(JSON.parse(JSON.stringify(receipt))), true);
  for (const row of receipt.sourceObjects) row.membership = Object.fromEntries(Object.entries(row.membership).reverse());
  assert.equal(validateMorphologyComparisonIdentityReceipt(receipt), true);
});

test("edited hierarchy, missingness, namespace or pair endpoints are rejected before CSV export", () => {
  const mutations = [r => r.sourceObjects[0].sourceIdentity.nodes.cell = { status: "known", id: "invented", locator: "paper", reason: null },
    r => r.sourceObjects[0].sourceIdentity.key += "changed", r => r.sourceObjects[0].sourceIdentity.namespace = "same cell",
    r => r.sourceObjects[0].sourceIdentity.nodes.specimen.reason = "not needed",
    r => r.sourceRelationships[0].type = "same_physical_object", r => r.sourceRelationships[0].sameCellInternalAdmission = true,
    r => r.sourceRelationships[0].rightKey = r.sourceRelationships[0].leftKey, r => r.sourceRelationships.pop(),
    r => r.relationshipClass = "same_source_population"];
  for (const mutate of mutations) {
    const receipt = structuredClone(identityReceipt()); mutate(receipt);
    assert.throws(() => validateMorphologyComparisonIdentityReceipt(receipt));
    assert.throws(() => morphologyComparisonReceiptCsv(receipt));
  }
});
