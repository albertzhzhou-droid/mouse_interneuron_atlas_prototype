import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AUDIT_PATH, buildNativeDatSwcCandidateAudit, auditCandidateCorrespondence, fitCandidateFamily, mapCandidatePoint } from '../tools/audit_native_dat_swc_candidates_0_1.mjs';
import { readVerifiedNativeContours } from '../app/native-contour-verification.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const actual = await buildNativeDatSwcCandidateAudit();
const candidate = actual.records.find(r => r.neuronId === 249676);

test('all six exact-byte source candidates replay their deposited node tuples and stable audit', async () => {
  assert.deepEqual(actual, JSON.parse(await readFile(path.join(root, AUDIT_PATH))));
  assert.deepEqual(actual.summary, { sourceRecords: 6, uniqueNumericZSomaLandmarkCandidates: 1, heldSourceRecords: 5, evaluatedModels: 8, newGeometryAdmissions: 0, newCanonicalProfiles: 0, newSameCellInternalJoins: 0, registrations: 0 });
  for (const record of actual.records) {
    assert.equal(record.assetId, `NeuroMorpho:${record.neuronId}`);
    assert.match(record.standardizedSwcReceipt.sha256, /^[a-f\d]{64}$/);
    assert.equal(record.newSurfaceVolumeInternalObjectCount, 0);
    assert.equal(record.registrationCount, 0);
  }
  assert.equal(actual.standardizationLogAudit.summary.exactStandardizedNodeCoordinateChecks, 13);
});

test('unique numeric z candidate preserves all source IDs and raw order without anatomical section claims', () => {
  assert.equal(candidate.sourceContourCount, 12); assert.equal(candidate.sourceVertexCount, 156);
  assert.deepEqual(candidate.zTranslationCandidates, [36]);
  assert.deepEqual(candidate.sourceOrder.map(c => c.zValuesMicrometre[0]), [-36,-35,-34,-33,-32,-31,-37.5,-38.5,-39.5,-40.5,-41.5,-42.5]);
  assert.deepEqual(candidate.swcSomaSourceOrder.map(n => n.nodeId), [1,2,3,4,5,6,70,71,72,73,74,75]);
  assert.deepEqual(candidate.matchedPairs.map(p => p.swcNodeId).sort((a,b) => a-b), [1,2,3,4,5,6,70,71,72,73,74,75]);
  assert.equal(candidate.physicalSectionCorrespondenceEstablished, false);
  assert.equal(candidate.sourceDepositedVertexToNodeIdentity, false);
});

test('all predeclared families and averaging alternatives retain disjoint held-out failures', () => {
  assert.equal(new Set(candidate.modelEvaluations.map(m => `${m.averagingHypothesis}/${m.family}/${m.split}`)).size, 8);
  assert.equal(candidate.observedSWCXYSerialization.gridMicrometre, 0.01);
  for (const model of candidate.modelEvaluations) {
    assert.ok(model.fitPairIndices.length >= 3 && model.heldOutPairIndices.length >= 3);
    assert.equal(model.fitPairIndices.some(i => model.heldOutPairIndices.includes(i)), false);
    assert.equal(new Set([...model.fitPairIndices, ...model.heldOutPairIndices]).size, 12);
    assert.equal(model.heldOut.allWithinExploratoryXYHalfGrid, false);
    assert.ok(model.heldOut.maximumAbsoluteZMicrometre <= 1e-12, "Floating-point mean z replay guard, not biological tolerance");
    assert.equal(Math.sign(model.fit.determinant), model.family === 'proper_similarity' ? 1 : -1);
  }
  assert.match(candidate.displayAdmission, /^held:/);
  assert.equal(candidate.sourceRoundingRuleEstablished, false); assert.equal(candidate.biologicalToleranceCalibrated, false);
});

test('held-out coordinates cannot change training coefficients, and proper/reflected fits recover distinct families', () => {
  const model = candidate.modelEvaluations[0], source = candidate.matchedPairs.map(p => p.nativeArithmeticMeanMicrometre), target = candidate.matchedPairs.map(p => p.swcPositionMicrometre);
  const before = fitCandidateFamily(source, target, model.fitPairIndices, model.family, 36);
  for (const i of model.heldOutPairIndices) { source[i] = [999, -777, source[i][2]]; target[i] = [-888, 666, target[i][2]]; }
  assert.deepEqual(fitCandidateFamily(source, target, model.fitPairIndices, model.family, 36), before);
  const points = [[0,0,1],[1,0,2],[0,2,3],[2,3,4]];
  for (const family of ['proper_similarity', 'reflected_similarity']) {
    const truth = { family, a: 0.6, b: 0.8, sourceXYMean: [0,0], targetXYMean: [3,-5], zOffsetMicrometre: 36 };
    const targets = points.map(p => mapCandidatePoint(p, truth));
    const fit = fitCandidateFamily(points, targets, [0,1,2], family, 36);
    const held = mapCandidatePoint(points[3], fit); assert.ok(held.every((v,a) => Math.abs(v-targets[3][a]) < 1e-12));
  }
  assert.throws(() => fitCandidateFamily([[0,0,0],[1,1,0],[2,2,0]], [[0,0,0],[1,1,0],[2,2,0]], [0,1,2], 'proper_similarity', 0), /two-dimensional/);
});

test('five held records retain method-specific count/header/z causes rather than a global impossibility assertion', () => {
  const held = new Map(actual.records.filter(r => r.reasons.length).map(r => [r.neuronId, r]));
  for (const id of [50424,50394,50408,45674]) assert.ok(held.get(id).reasons.includes('native_contour_and_swc_soma_point_counts_differ'));
  for (const id of [45674,108978]) assert.ok(held.get(id).reasons.includes('repeated_swc_soma_z_prevents_unique_matching'));
  assert.equal(held.get(108978).sourceContourCount, held.get(108978).swcSomaPointCount);
  for (const record of held.values()) { assert.equal(record.matchedPairs.length, 0); assert.equal(record.modelEvaluations.length, 0); }
});

test('a JSON clone or mismatched neuron cannot acquire native analysis authority', async () => {
  const fetchImpl = async (url, options) => { assert.equal(options.cache, 'no-store'); const b = await readFile(path.join(root, 'public' + url)); return { ok: true, status: 200, arrayBuffer: async () => b.buffer.slice(b.byteOffset,b.byteOffset+b.length) }; };
  const payload = await readVerifiedNativeContours(249676, { forceReload: true, fetchImpl });
  const swc = await readFile(path.join(root, candidate.standardizedSwcReceipt.path), 'utf8');
  assert.throws(() => auditCandidateCorrespondence(249676, structuredClone(payload), swc));
  assert.throws(() => auditCandidateCorrespondence(50424, payload, swc));
});

test('same-size mutation of each actual scientific authority fails before candidate admission', async () => {
  for (const relative of ['public/data/neurolucida_dat_originals_v1/nmo-249676.dat', candidate.standardizedSwcReceipt.path, candidate.standardizedGeometryReceipt.path, 'data/morphology-source-frame-disclosure-0.1.json', 'data/source-candidates/nmo-249676-standardization-20261003/061118B-S6-02_cell_2-RQ.CNG.swc.std']) {
    let touched = false;
    const readImpl = async p => { const b = await readFile(p); if (p === path.join(root, relative)) { touched = true; const bad = Buffer.from(b); bad[bad.length-3] ^= 1; return bad; } return b; };
    await assert.rejects(buildNativeDatSwcCandidateAudit({ readImpl })); assert.equal(touched, true, relative);
  }
});
