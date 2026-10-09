import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { deriveResearchMorphologyRenderingPolicy, researchEvidenceDisplayLabel } from "../app/research-morphology-rendering-policy.js";
import { deriveResearchRecordSourceScope, exportResearchRecordDossier, researchRecordDossierCsv } from "../app/research-record-source-scope.js";
import { loadVerifiedSupplementalMorphologyResearchRecords } from "../app/research-supplemental-morphology-records.js";

const json = async path => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url)));
const [baseIndex, registry, mvp] = await Promise.all([json("public/data/research_explorer_index_v1/search-index.json"), json("data/research-source-registry-0.1.json"), json("data/research-mvp-release-0.2.json")]);
const collection = [...baseIndex.records, ...await loadVerifiedSupplementalMorphologyResearchRecords()];
const morphologies = collection.filter(record => record.focusKind === "morphology_record");
const byId = id => morphologies.find(record => record.focusId === `NeuroMorpho:${id}`);
const input = record => ({ record, collection, baseIndex, registry, mvp });
const exportRecord = record => exportResearchRecordDossier(input(record), { applicationVersion: "2.91.0-research.1", selectionGeneration: 9, requestedKey: record.key });

test("all 181 policies agree with exact deposited geometry bytes, native dimension and diameter while claiming no runtime proof", async () => {
  assert.equal(morphologies.length, 181);
  const counts = { census: 0, supplementary: 0, todd_supplementary: 0, pv_supplementary: 0, diameter: 0, surface: 0, planar: 0, noDiameter: 0, archived: 0 };
  for (const record of morphologies) {
    const before = JSON.stringify(record), policy = deriveResearchMorphologyRenderingPolicy(record), source = policy.declaredSource;
    const bytes = await readFile(new URL(`../public${source.geometryPath}`, import.meta.url));
    const geometry = JSON.parse(bytes);
    assert.equal(source.geometryBytes, bytes.length); assert.equal(source.geometrySha256, createHash("sha256").update(bytes).digest("hex"));
    assert.equal(source.dimensionality, geometry.swc.dimensionality); assert.equal(source.sourceDiameterAvailable, geometry.swc.sourceDiameterAvailable);
    assert.equal(source.rawSwcSha256Declared, geometry.swc.sha256); assert.equal(source.sourceFrame, geometry.sourceFrame);
    assert.equal(source.neuronId, geometry.neuronId); assert.equal(policy.radiusSurface.allowedAfterCurrentByteVerification, geometry.swc.dimensionality === "3D" && geometry.swc.sourceDiameterAvailable);
    assert.equal(policy.actualGeometryVerification.status, "not_included"); assert.equal(policy.actualGeometryVerification.verifiedBytes, null);
    assert.equal(policy.actualRenderedView.status, "not_included"); assert.equal(policy.actualRenderedView.camera, null);
    assert.equal(policy.registrationCount, 0); assert.equal(policy.sameCellInternalGeometryAllowed, false);
    assert.equal(JSON.stringify(record), before); assert.ok(Object.isFrozen(policy.declaredSource));
    counts[policy.membership] += 1; counts.diameter += Number(source.sourceDiameterAvailable); counts.surface += Number(policy.radiusSurface.allowedAfterCurrentByteVerification);
    counts.planar += Number(source.dimensionality === "2D"); counts.noDiameter += Number(!source.sourceDiameterAvailable); counts.archived += policy.archivedSurfaceDeclarations.length;
  }
  assert.deepEqual(counts, { census: 142, supplementary: 7, todd_supplementary: 30, pv_supplementary: 2, diameter: 110, surface: 108, planar: 2, noDiameter: 71, archived: 149 });
});

test("both planar records retain diameter and archived source fields while current JSON and CSV refuse 3D surface permission", () => {
  for (const id of [194468, 194469]) {
    const record = byId(id), dossier = exportRecord(record), policy = dossier.sourceScope.renderingPolicy;
    assert.equal(dossier.schemaVersion, "0.2.0"); assert.deepEqual(dossier.record, record);
    assert.equal(policy.declaredSource.sourceDiameterAvailable, true); assert.equal(policy.declaredSource.dimensionality, "2D");
    assert.equal(policy.radiusSurface.allowedAfterCurrentByteVerification, false); assert.equal(policy.radiusSurface.authority, "UNAVAILABLE");
    assert.equal(policy.radiusSurface.reason, "source_labelled_2d_no_3d_surface"); assert.equal(policy.radiusSurface.depthInferenceAllowed, false);
    const archived = policy.archivedSurfaceDeclarations[0], original = record.evidence[archived.evidenceIndex];
    assert.match(original.value, /^Available after checksum verification/);
    assert.equal(archived.originalValue, original.value); assert.equal(archived.originalAuthority, original.authority); assert.equal(archived.originalLocator, original.locator);
    assert.equal(researchEvidenceDisplayLabel(record, original), "Archived radius-surface declaration");
    const csv = researchRecordDossierCsv(JSON.parse(JSON.stringify(dossier)));
    assert.match(csv, /"current_morphology_rendering_policy","allowedAfterCurrentByteVerification","false"/);
    assert.match(csv, /"archived_project_render_declaration","Archived radius-surface declaration","Available after checksum verification/);
    assert.match(csv, /retained_archived_declaration_not_current_permission/);
    assert.ok(csv.includes(dossier.sourceScope.fieldLocators[archived.evidenceIndex].projectFieldLocator));
    assert.match(csv, /actual_geometry_verification.*not_included/);
    assert.equal(dossier.view.camera, null); assert.equal(dossier.view.status, "not_included");
  }
});

test("non-census release, No Diameter and derived-after-verification cases remain independent across 8.6.124 and Todd 8.6.126", () => {
  for (const [id, release, membership, allowed] of [[45674, "8.6.124", "supplementary", true], [242822, "8.6.124", "census", false], [322379, "8.6.126", "todd_supplementary", false], [322382, "8.6.126", "todd_supplementary", true]]) {
    const dossier = exportRecord(byId(id)), policy = dossier.sourceScope.renderingPolicy;
    assert.equal(policy.repositoryRelease, release); assert.equal(policy.membership, membership); assert.equal(policy.censusContribution, membership === "census" ? 1 : 0);
    assert.equal(policy.radiusSurface.allowedAfterCurrentByteVerification, allowed);
    assert.equal(policy.radiusSurface.observedMembrane, false); assert.equal(policy.actualGeometryVerification.status, "not_included");
    assert.equal(dossier.sourceScope.physicalSpecimenIdentity.id, null); assert.equal(dossier.sourceScope.relationship.grantsGeometryTransfer, false);
    if (id === 322379 || id === 322382) { assert.equal(policy.archivedSurfaceDeclarations.length, 0); assert.match(policy.declaredSource.contractLocator, /8-6-126/); }
    if (!allowed) assert.equal(policy.radiusSurface.reason, "source_reports_no_diameter");
  }
});

test("all 673 source dossiers preserve every original field and expose morphology policy only for their 181 exact objects", () => {
  let count = 0;
  for (const record of collection) {
    const scope = deriveResearchRecordSourceScope(input(record));
    assert.equal(scope.fieldLocators.length, record.evidence.length);
    scope.fieldLocators.forEach((row, index) => assert.deepEqual([row.label, row.value, row.authority, row.locator], Object.values(record.evidence[index])));
    if (record.focusKind === "morphology_record") { count += 1; assert.equal(scope.renderingPolicy.recordKey, record.key); }
    else { assert.equal(scope.renderingPolicy, null); assert.equal(deriveResearchMorphologyRenderingPolicy(record), null); }
  }
  assert.equal(count, 181);
});

test("changed file, source namespace, membership, frame, registration and unsupported IDs cannot receive a declared policy", () => {
  for (const id of [194469, 45674, 322379]) for (const mutate of [
    record => { record.namespace += ":other"; }, record => { record.morphologyMembership.geometrySha256 = "0".repeat(64); },
    record => { record.morphologyMembership.geometryPath = "/another-file.json"; }, record => { record.coordinate.frame = "another-frame"; },
    record => { record.coordinate.registrationCount = 1; }, record => { record.morphologyMembership.censusContribution = 2; },
    record => { record.morphologyMembership.collection = "unknown"; },
  ]) { const changed = structuredClone(byId(id)); mutate(changed); assert.throws(() => deriveResearchMorphologyRenderingPolicy(changed), /changed/); }
  const unknown = structuredClone(byId(194469)); unknown.focusId = "NeuroMorpho:999999"; unknown.key = `morphology_record:${unknown.focusId}`;
  assert.throws(() => deriveResearchMorphologyRenderingPolicy(unknown), /not admitted/);
  const wrongTodd = structuredClone(byId(322379)); wrongTodd.morphologyMembership.routeContractPath = "data/8.6.124.json";
  assert.throws(() => deriveResearchMorphologyRenderingPolicy(wrongTodd), /Todd release/);
});

test("CSV rejects copied permissions, fabricated runtime verification, changed retained fields and the obsolete dossier schema", () => {
  const original = exportRecord(byId(194469));
  for (const mutate of [
    dossier => { dossier.sourceScope.renderingPolicy.radiusSurface.allowedAfterCurrentByteVerification = true; },
    dossier => { dossier.sourceScope.renderingPolicy.actualGeometryVerification.status = "verified"; },
    dossier => { dossier.sourceScope.renderingPolicy.actualRenderedView.camera = [0, 0, 1]; },
    dossier => { dossier.sourceScope.renderingPolicy = exportRecord(byId(45674)).sourceScope.renderingPolicy; },
  ]) { const changed = structuredClone(original); mutate(changed); assert.throws(() => researchRecordDossierCsv(changed), /rendering policy differs/); }
  const changed = structuredClone(original); changed.sourceScope.fieldLocators[0].value = "another value";
  assert.throws(() => researchRecordDossierCsv(changed), /retained fields differ/);
  const old = structuredClone(original); old.schemaVersion = "0.1.0"; assert.throws(() => researchRecordDossierCsv(old), /current dossier schema/);
});
