import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { validatePvIndependentRoutes } from "../scripts/validate-pv-independent-morphology-routes-0.1.mjs";
import { readVerifiedMainSceneMorphology, mainSceneMorphologyVerification } from "../app/main-scene-morphology-verification.js";
import { loadVerifiedPvResearchRecords, resolvePvResearchRecord } from "../app/pv-independent-research-records.js";
import { deriveResearchMorphologyRenderingPolicy } from "../app/research-morphology-rendering-policy.js";
const pack = JSON.parse(await readFile(new URL("../data/pv-independent-morphology-routes-0.1.json", import.meta.url)));
const actualFetch = async url => { const bytes = await readFile(new URL("../public" + url, import.meta.url)); return { ok: true, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) }; };

test("two independent PV routes exactly replay frozen official API/SWC and deterministic derivatives", async () => {
  const result = await validatePvIndependentRoutes(); assert.deepEqual(result.nodes, [1681, 540]);
  assert.equal(result.pairedExperiment, false); assert.equal(result.censusContribution, 0);
});
for (const [label, mutate] of [
  ["source labels", p => p.routes[0].sourceRecord.cellTypeLabels[3] = "Pax2-positive"],
  ["no diameter surface", p => p.routes[0].fidelityRecord.modes.radiusSurface.available = true],
  ["source identity", p => p.routes[0].sourceRecord.neuronId = 118824],
  ["paper physiology", p => p.routes[1].renderingContract.sameCellPhysiologyJoinCount = 1],
  ["census expansion", p => p.routes[1].censusMembership = true],
  ["inferred axon", p => p.routes[0].topology.inferredAxonCount = 1],
  ["paired experiment", p => p.routes[0].identityBoundary.sameAnimalPairEstablished = true],
]) test(`rejects PV contract drift: ${label}`, async () => { const changed = structuredClone(pack); mutate(changed); await assert.rejects(() => validatePvIndependentRoutes(changed)); });

test("PV records enter shared research selection with exact declared policies and no fabricated source parent", async () => {
  const records = await loadVerifiedPvResearchRecords(); assert.equal(records.length, 2);
  for (const record of records) {
    assert.strictEqual(await resolvePvResearchRecord({ focusKind: "morphology_record", focusId: record.focusId }), record);
    const policy = deriveResearchMorphologyRenderingPolicy(record);
    assert.equal(policy.membership, "pv_supplementary"); assert.equal(policy.repositoryRelease, "8.6.124");
    assert.equal(policy.radiusSurface.allowedAfterCurrentByteVerification, record.focusId === "NeuroMorpho:118824");
    assert.equal(policy.sameCellInternalGeometryAllowed, false); assert.equal(policy.actualGeometryVerification.status, "not_included");
    assert.equal(record.navigation.params.cellForm, record.focusId.split(":")[1]);
  }
  assert.equal(await resolvePvResearchRecord({ focusKind: "morphology_record", focusId: "NeuroMorpho:118825" }), null);
});

test("each PV main-scene private proof rejects copies, cross-record payloads, damaged bytes and forged surface permission", async () => {
  for (const route of pack.routes) {
    const record = route.fidelityRecord, geometry = await readVerifiedMainSceneMorphology(record, { fetchImpl: actualFetch, forceReload: true });
    const { geometryVerification: proof, sourceContext: context } = mainSceneMorphologyVerification(record, geometry);
    assert.equal(proof.membership, "pv_supplementary"); assert.equal(proof.mainSceneRosterCount, 181); assert.equal(proof.requestCacheMode, "no-store");
    assert.equal(context.sourceFrameDisclosure.documentType, "pv_8_6_124_verified_geometry_frame");
    assert.equal(context.sourceIdentity.nodes.cell.id, null); assert.equal(context.sourceIdentity.releaseId, "8.6.124");
    assert.equal(context.sourceFrameDisclosure.paperMapping.exactStudyCellJoin, false);
    assert.throws(() => mainSceneMorphologyVerification(record, structuredClone(geometry)), /no current main-scene runtime proof/);
    const other = pack.routes.find(r => r.sourceRecord.neuronId !== record.neuronId).fidelityRecord;
    assert.throws(() => mainSceneMorphologyVerification(other, geometry), /no current main-scene runtime proof/);
    const changed = structuredClone(record); changed.modes.radiusSurface.available = !changed.modes.radiusSurface.available;
    await assert.rejects(() => readVerifiedMainSceneMorphology(changed, { fetchImpl: actualFetch }), /authority changed/);
    await assert.rejects(() => readVerifiedMainSceneMorphology(record, { fetchImpl: async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) }) }), /byte count changed/);
  }
});
