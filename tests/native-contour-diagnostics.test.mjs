import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import audit from '../data/todd-native-contour-topology-audit-0.1.json' with { type: 'json' };
import { NATIVE_CONTOUR_SOURCE_IDS, readVerifiedNativeContours } from '../app/native-contour-verification.js';
import { analyseNativeContourGroups, evaluateNativeContourDiagnostics, createNativeContourDiagnosticReceipt, validateNativeContourDiagnosticReceipt, nativeContourDiagnosticSensitivity, nativeContourDiagnosticCsv, NATIVE_CONTOUR_DIAGNOSTIC_LIMITS } from '../app/native-contour-diagnostics.js';

const fetchActual = async (url, options) => {
  assert.equal(options.cache, 'no-store');
  const bytes = await readFile(new URL('../public' + url, import.meta.url));
  return { ok: true, status: 200, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
};
const payloads = new Map(), analyses = new Map();
for (const id of NATIVE_CONTOUR_SOURCE_IDS) {
  const payload = await readVerifiedNativeContours(id, { forceReload: true, fetchImpl: fetchActual });
  payloads.set(id, payload); analyses.set(id, analyseNativeContourGroups(id, payload));
}

test('all seven original DAT proofs retain eight exact name groups and hold repeated or multi-z correspondence', () => {
  const totals = [...analyses.values()].reduce((total, analysis) => {
    total.contours += analysis.summary.sourceContourCount;
    total.vertices += analysis.summary.sourceVertexCount;
    total.groups += analysis.summary.sourceNameGroupCount;
    total.comparableGroups += analysis.summary.comparableGroupCount;
    total.intervals += analysis.summary.numericNeighbourIntervalCount;
    return total;
  }, { contours: 0, vertices: 0, groups: 0, comparableGroups: 0, intervals: 0 });
  assert.deepEqual(totals, { contours: 72, vertices: 5149, groups: 8, comparableGroups: 5, intervals: 47 });
  assert.equal(analyses.get(45718).groups.find(group => group.sourceName === 'Soma 1').transitions.length, 6);
  const separate = analyses.get(45718).groups.find(group => group.sourceName === 'Cell Body');
  assert.ok(separate.reasons.includes('source_contour_spans_multiple_z_values'));
  assert.equal(separate.transitions.length, 0);
  for (const id of [45674, 108978]) {
    const group = analyses.get(id).groups[0];
    assert.ok(group.reasons.includes('multiple_distinct_source_contours_share_z_without_correspondence'));
    assert.equal(group.transitions.length, 0);
    assert.equal(group.sourceOrder.length, payloads.get(id).contours.length);
  }
  const unequalGaps = analyses.get(249676).groups[0].transitions.map(row => row.zGapMicrometre);
  assert.deepEqual([...new Set(unequalGaps)].sort(), [1, 1.5]);
});
test('new calculations independently reproduce all 17 pinned Todd reference diagnostics without changing their historical screen', () => {
  for (const record of audit.records) {
    const current = evaluateNativeContourDiagnostics(analyses.get(record.neuronId));
    const transitions = current.groups[0].transitions;
    assert.equal(transitions.length, record.transitionDiagnostics.length);
    for (let i = 0; i < transitions.length; i++) {
      const actual = transitions[i], expected = record.transitionDiagnostics[i];
      for (const key of ['fromContourId','toContourId','fromZMicrometre','toZMicrometre','phaseShiftAt128Samples','bothSourceContoursSimple']) assert.deepEqual(actual[key], expected[key]);
      for (const [actualKey, expectedKey] of [['centroidShiftMicrometre','centroidShiftMicrometre'],['areaRatio','areaRatio'],['cyclicRmsMicrometre','alignedCyclicRmsMicrometre']]) assert.equal(Number(actual[actualKey].toFixed(4)), expected[expectedKey]);
      assert.equal(actual.numericalLimitsMet && actual.bothSourceContoursSimple, expected.withinReferenceScreen);
    }
    assert.equal(transitions.filter(row => row.numericalLimitsMet && row.bothSourceContoursSimple).length, record.summary.adjacentTransitionsWithinReferenceScreen);
  }
});
test('27 sensitivity combinations remain source-group-specific monotonic software screens and never admit geometry', () => {
  for (const analysis of analyses.values()) {
    const matrix = nativeContourDiagnosticSensitivity(analysis);
    assert.equal(matrix.length, 27);
    for (const lower of matrix) for (const higher of matrix) if (Object.keys(lower.parameters).every(key => lower.parameters[key] <= higher.parameters[key])) {
      for (let i = 0; i < lower.groups.length; i++) {
        assert.equal(lower.groups[i].sourceName, higher.groups[i].sourceName);
        assert.ok(lower.groups[i].withinNumericalLimits <= higher.groups[i].withinNumericalLimits);
        assert.ok(lower.groups[i].withinLimitsAndClearSourceTopology <= higher.groups[i].withinLimitsAndClearSourceTopology);
      }
    }
    const receipt = createNativeContourDiagnosticReceipt(analysis, { centroidShiftMicrometre: 3, areaRatio: 2.4, cyclicRmsMicrometre: 3 });
    assert.equal(receipt.scientificScope.newSurfaceAdmissionCount, 0);
    assert.equal(receipt.scientificScope.independentBiologicalToleranceCalibration, false);
    assert.equal(receipt.scientificScope.physicalSectionCorrespondenceEstablished, false);
    assert.equal(receipt.scientificScope.registrationCount, 0);
    assert.equal(receipt.verification.derivedShell, null);
  }
});
test('analysis and diagnostic export require actual immutable private original-source authority', () => {
  for (const id of NATIVE_CONTOUR_SOURCE_IDS) {
    const payload = payloads.get(id), before = JSON.stringify(payload);
    const analysis = analyseNativeContourGroups(id, payload);
    nativeContourDiagnosticSensitivity(analysis); createNativeContourDiagnosticReceipt(analysis);
    assert.equal(JSON.stringify(payload), before);
    assert.throws(() => analyseNativeContourGroups(id, structuredClone(payload)), /private|verified|authority|original/i);
    assert.throws(() => evaluateNativeContourDiagnostics(structuredClone(analysis)), /private source analysis/);
    assert.throws(() => createNativeContourDiagnosticReceipt(structuredClone(analysis)), /private source analysis/);
  }
  assert.throws(() => analyseNativeContourGroups(108978, payloads.get(45718)));
});
test('fresh same-source replay verifies complete receipt and rejects source build limits topology and scope tampering', async () => {
  const id = 50408, document = createNativeContourDiagnosticReceipt(analyses.get(id));
  const fresh = await readVerifiedNativeContours(id, { forceReload: true, fetchImpl: fetchActual });
  const replayed = validateNativeContourDiagnosticReceipt(document, id, fresh);
  assert.equal(replayed.verification.originalDat.requestCacheMode, 'no-store');
  assert.ok(replayed.verification.sourceGeometry.verificationSequence > document.verification.sourceGeometry.verificationSequence);
  for (const change of [copy => copy.analysisBuild.inputs[0].sha256 = '0'.repeat(64), copy => copy.source.neuronId = 50394,
    copy => copy.report.groups[0].transitions[0].centroidShiftMicrometre = 0, copy => copy.report.groups[0].sourceOrder[0].zeroLengthEdgeIndices = [0],
    copy => copy.scientificScope.independentBiologicalToleranceCalibration = true, copy => copy.scientificScope.newSurfaceAdmissionCount = 1,
    copy => copy.verification.originalDat.sha256 = '0'.repeat(64), copy => delete copy.verification.fileManifest,
    copy => copy.report.parameters.areaRatio = 0, copy => copy.verification.sourceGeometry.verifiedAt = 'unverified']) {
    const changed = structuredClone(document); change(changed);
    assert.throws(() => validateNativeContourDiagnosticReceipt(changed, id, fresh));
  }
});
test('CSV carries exact source proofs current parameters and held-group reasons without turning unknowns into zero metrics', () => {
  for (const id of [45718,108978,249676]) {
    const text = nativeContourDiagnosticCsv(analyses.get(id), NATIVE_CONTOUR_DIAGNOSTIC_LIMITS), lines = text.trimEnd().split('\n');
    assert.ok(lines[0].includes('"original_dat_sha256"'));
    assert.ok(lines[0].includes('"biological_tolerance_validated"'));
    assert.ok(lines[1].includes(`"${id}"`));
    const verification = createNativeContourDiagnosticReceipt(analyses.get(id)).verification;
    for (const line of lines.slice(1)) for (const key of ['originalDat','fileManifest','sourceGeometry']) assert.ok(line.includes(verification[key].sha256));
    if (id === 108978) {
      assert.equal(lines.length, 2);
      assert.ok(lines[1].includes('multiple_distinct_source_contours_share_z_without_correspondence'));
      assert.ok(lines[1].includes(',"","","","","","","","","","1.5"'));
    }
    if (id === 249676) assert.equal(lines.length, 12);
  }
});
