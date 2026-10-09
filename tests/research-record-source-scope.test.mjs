import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { deriveResearchRecordSourceScope, exportResearchRecordDossier, researchRecordDossierCsv } from "../app/research-record-source-scope.js";
import { loadVerifiedSupplementalMorphologyResearchRecords } from "../app/research-supplemental-morphology-records.js";

const read = async (path) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), "utf8"));
const [registry, mvp, baseIndex] = await Promise.all([read("data/research-source-registry-0.1.json"), read("data/research-mvp-release-0.2.json"), read("public/data/research_explorer_index_v1/search-index.json")]);
const supplemental = await loadVerifiedSupplementalMorphologyResearchRecords();
const collection = [...baseIndex.records, ...supplemental];
const pick = (key) => collection.find((record) => record.key === key);
const input = (record = collection[0]) => ({ record, collection, baseIndex, registry, mvp });
const options = (record) => ({ applicationVersion: "2.91.0-research.1", selectionGeneration: 7, requestedKey: record.key });

test("all 641 fixed records and 30 independent Todd records and 2 PV routes retain their exact parent scope and every field locator", () => {
  assert.equal(collection.length, 673);
  const parentCounts = {};
  for (const record of collection) {
    const scope = deriveResearchRecordSourceScope(input(record));
    assert.equal(scope.recordKey, record.key); assert.ok(scope.sourceId);
    assert.equal(scope.fieldLocators.length, record.evidence.length);
    assert.deepEqual(scope.gaps, record.gaps); assert.equal(scope.physicalSpecimenIdentity.id, null);
    assert.equal(scope.relationship.type, "co_display_only"); assert.equal(scope.relationship.grantsGeometryTransfer, false);
    scope.fieldLocators.forEach((row, index) => {
      assert.equal(row.value, record.evidence[index].value); assert.equal(row.locator, record.evidence[index].locator);
      assert.ok(row.projectFieldLocator.endsWith(`/evidence/${index}`)); assert.equal(row.biologicalTruthVerifiedByHash, false);
    });
    parentCounts[scope.sourceId] = (parentCounts[scope.sourceId] ?? 0) + 1;
  }
  assert.equal(parentCounts["SRC-NEUROMORPHO-8-6-124"], 151);
  assert.equal(parentCounts["SRC-NEUROMORPHO-8-6-126-TODD-NTS"], 30);
});

test("molecular aggregate display unit is separate from nuclei and independent pooled samples", () => {
  const record = collection.find((record) => record.recordSemantics?.parentSourceId === "SRC-SATHYAMURTHY-2018");
  const scope = deriveResearchRecordSourceScope(input(record));
  assert.equal(scope.displayUnit, "source_profile_aggregate"); assert.equal(scope.underlyingObservationUnit, "nucleus");
  assert.deepEqual(scope.experimentalUnits.map((unit) => [unit.unit, unit.count]), [["independent_pooled_sample", 19], ["assigned_neuronal_nucleus", 4280]]);
  assert.ok(scope.experimentalUnits.every((unit) => unit.pooledWithOtherUnits === false));
});

test("source age range does not overwrite an exact young morphology record or create an animal identity", () => {
  const record = pick("morphology_record:NeuroMorpho:45718"), scope = deriveResearchRecordSourceScope(input(record));
  assert.ok(scope.lifeStages.some((item) => item.value === "adult")); assert.ok(scope.lifeStages.some((item) => item.value === "young"));
  assert.equal(scope.fieldLocators.find((row) => row.label === "Life stage").value, "young");
  assert.equal(scope.physicalSpecimenIdentity.status, "not_established");
});

test("mouse and human SCI conditions stay distinct with exact values and native source IDs", () => {
  const scope = deriveResearchRecordSourceScope(input(pick("sci_entity:mouse.sc.vsx2_hoxa10")));
  assert.equal(scope.conditions.length, 5);
  assert.equal(scope.conditions.filter((condition) => condition.species === "Mus musculus").length, 4);
  const human = scope.conditions.find((condition) => condition.species === "Homo sapiens");
  assert.equal(human.experimentalUnit, "participant"); assert.equal(human.sampleSize, "n=9"); assert.equal(human.sourceId, "SRC-P09");
  assert.equal(human.canonicalParentSourceId, "SRC-KATHE-2022");
  for (const condition of scope.conditions) {
    const native = mvp.conditions.find((item) => item.id === condition.id);
    for (const field of Object.keys(condition.fieldLocators)) assert.deepEqual(condition[field], native[field]);
    assert.equal(condition.denominatorPoolingAllowed, false);
  }
});

test("neonatal and adult conditions and null sample sizes are never collapsed into zero", () => {
  const ageScope = deriveResearchRecordSourceScope(input(pick("sci_entity:mouse.overlay.vglut2_vgat_switch")));
  assert.deepEqual(ageScope.conditions.map((item) => item.lifeStage), ["neonatal", "adult"]);
  const relay = deriveResearchRecordSourceScope(input(pick("sci_entity:mouse.propriospinal.relay")));
  assert.deepEqual(relay.conditions[0].sampleSize, { value: null, missingReason: "not_reported" });
  assert.ok(relay.experimentalUnits.every((unit) => unit.count !== 0));
});

test("exact project row positions do not turn hashes or paper/object references into upstream field proof", () => {
  const scope = deriveResearchRecordSourceScope(input(pick("morphology_record:NeuroMorpho:45718")));
  assert.equal(scope.fieldLocators.find((row) => row.label === "Neurite cable length").upstreamLocatorStatus, "integrity_reference_only");
  assert.equal(scope.fieldLocators.find((row) => row.label === "Region").upstreamLocatorStatus, "source_object_reference_without_field");
  assert.equal(scope.fieldLocators.find((row) => row.label === "Source-coordinate extent").upstreamLocatorStatus, "retained_field_or_section_locator");
  const index = baseIndex.records.findIndex((record) => record.key === scope.recordKey);
  assert.equal(scope.fieldLocators[0].projectFieldLocator, `public/data/research_explorer_index_v1/search-index.json#/records/${index}/evidence/0`);
});

test("Todd materialized fields point to their separate source route rather than a nonexistent fixed-index row", () => {
  const scope = deriveResearchRecordSourceScope(input(supplemental[0]));
  assert.equal(scope.sourceId, "SRC-NEUROMORPHO-8-6-126-TODD-NTS");
  assert.equal(scope.recordLocation.status, "runtime_materialized_source_route_record");
  assert.equal(scope.recordLocation.releaseId, "ohri-neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.0");
  assert.equal(scope.recordLocation.contractSha256, supplemental[0].morphologyMembership.routeContractSha256);
  assert.ok(scope.fieldLocators.every((row) => !row.projectFieldLocator.includes("search-index.json")));
  assert.ok(scope.experimentalUnits.some((unit) => unit.count === 30));
});

test("changed, duplicate, stale and absent current records reject rather than retaining another scope", () => {
  const record = collection[0], changed = structuredClone(record); changed.namespace = "other-release";
  assert.throws(() => deriveResearchRecordSourceScope(input(changed)), /changed or ambiguous/);
  assert.throws(() => deriveResearchRecordSourceScope({ ...input(record), collection: [record, record] }), /changed or ambiguous/);
  assert.throws(() => deriveResearchRecordSourceScope({ ...input(record), collection: [] }), /absent/);
  const other = structuredClone(baseIndex); other.records.find((item) => item.key === record.key).title = "changed title";
  assert.throws(() => deriveResearchRecordSourceScope({ ...input(record), baseIndex: other }), /changed after verification/);
});

test("missing exact parent and changed SCI source binding fail closed despite a matching DOI", () => {
  const record = collection.find((record) => record.recordSemantics?.parentSourceId === "SRC-SATHYAMURTHY-2018");
  const other = structuredClone(registry); other.sources = other.sources.filter((source) => source.id !== "SRC-SATHYAMURTHY-2018"); other.sourceCount = other.sources.length;
  assert.throws(() => deriveResearchRecordSourceScope({ ...input(record), registry: other }), /parent is unavailable/);
  const altered = structuredClone(mvp); altered.conditions.find((condition) => condition.id === "CND-P09-HUMAN-EES").sourceId = "SRC-P03";
  assert.throws(() => deriveResearchRecordSourceScope({ ...input(pick("sci_entity:mouse.sc.vsx2_hoxa10")), mvp: altered }), /another source/);
});

test("unknown source aliases retain null and a reason; DOI and similar labels are not fallback identities", () => {
  const record = structuredClone(pick("source_lane:delile-2019"));
  record.namespace = "coverage:unmapped"; record.focusId = "unmapped"; record.key = "source_lane:unmapped";
  const scope = deriveResearchRecordSourceScope({ ...input(record), collection: [record], baseIndex: { assetSetId: baseIndex.assetSetId, records: [record] } });
  assert.equal(scope.sourceId, null); assert.equal(scope.sourceResolution, "not_established");
  assert.equal(scope.experimentalUnits.length, 0); assert.match(scope.sourceMissingReason, /DOI/);
});

test("current-generation dossier preserves all original fields and locators without claiming a rendered view", () => {
  const record = pick("sci_entity:mouse.sc.vsx2_hoxa10"), dossier = exportResearchRecordDossier(input(record), options(record));
  assert.deepEqual(dossier.record, record); assert.deepEqual(dossier.sourceScope.gaps, record.gaps);
  assert.equal(dossier.selection.generation, 7); assert.equal(dossier.view.status, "not_included"); assert.equal(dossier.view.camera, null);
  const csv = researchRecordDossierCsv(dossier);
  assert.match(csv, /condition:CND-P09-HUMAN-EES/); assert.match(csv, /Homo sapiens/); assert.match(csv, /participant/);
  for (const row of dossier.sourceScope.fieldLocators) assert.ok(csv.includes(row.projectFieldLocator));
  assert.throws(() => exportResearchRecordDossier(input(record), { ...options(record), requestedKey: collection[0].key }), /current ready selection/);
  assert.throws(() => exportResearchRecordDossier(input(record), { ...options(record), selectionGeneration: 0 }), /current ready selection/);
});

test("CSV preserves null reasons, quotes/newlines and guards formulas while JSON keeps raw values", () => {
  const record = structuredClone(collection[0]); record.evidence[0].value = '=HYPERLINK("x")\nsource';
  const changedIndex = { ...baseIndex, records: [record] };
  const dossier = exportResearchRecordDossier({ ...input(record), collection: [record], baseIndex: changedIndex }, options(record));
  assert.equal(dossier.record.evidence[0].value, '=HYPERLINK("x")\nsource');
  const csv = researchRecordDossierCsv(dossier);
  assert.match(csv, /"'=HYPERLINK\(""x""\)\nsource"/);
  const relay = pick("sci_entity:mouse.propriospinal.relay");
  assert.match(researchRecordDossierCsv(exportResearchRecordDossier(input(relay), options(relay))), /not_reported/);
  const wrong = structuredClone(dossier); wrong.selection.key = "another-key";
  assert.throws(() => researchRecordDossierCsv(wrong), /same current dossier/);
});
