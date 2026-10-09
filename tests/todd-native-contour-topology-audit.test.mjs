import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildToddNativeContourTopologyAudit } from "../tools/audit_todd_native_contour_topology_0_1.mjs";
import {
  AUDIT_PATH,
  SCHEMA_PATH,
  validateToddNativeContourTopologyAudit,
} from "../scripts/validate-todd-native-contour-topology-audit-0.1.mjs";

const [audit, schema, expected, viewerSource] = await Promise.all([
  readFile(new URL(`../${AUDIT_PATH}`, import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL(`../${SCHEMA_PATH}`, import.meta.url), "utf8").then(JSON.parse),
  buildToddNativeContourTopologyAudit(),
  readFile(new URL("../app/NativeContourRecordViewer.tsx", import.meta.url), "utf8"),
]);

test("recomputes Todd native contour topology and keeps all 19 exact source loops line-only", () => {
  assert.deepEqual(validateToddNativeContourTopologyAudit(audit, schema, expected), {
    releaseId: "ohri-todd-native-contour-topology-audit-0.1.0",
    auditedRecordCount: 2,
    contourCount: 19,
    vertexCount: 1136,
    selfIntersectionCount: 2,
    zeroLengthEdgeCount: 1,
    adjacentTransitionCount: 17,
    transitionsWithinExploratoryScreen: 9,
    transitionsHeld: 8,
    contourDerivedSurfaceAdmittedCount: 0,
  });
  const nmo50408 = audit.records.find((record) => record.neuronId === 50408);
  assert.deepEqual(nmo50408.contoursSortedByZ.filter((contour) => contour.selfIntersectionEdgePairs.length > 0).map((contour) => ({ id: contour.id, z: contour.zMicrometre, edges: contour.selfIntersectionEdgePairs })), [
    { id: "nmo-50408-mbf-cell-body-line-loop-7", z: -22, edges: [[0, 79]] },
    { id: "nmo-50408-mbf-cell-body-line-loop-4", z: -18, edges: [[61, 63]] },
  ]);
  assert.deepEqual(nmo50408.contoursSortedByZ.filter((contour) => contour.zeroLengthEdgeIndices.length > 0).map((contour) => ({ id: contour.id, z: contour.zMicrometre, edges: contour.zeroLengthEdgeIndices })), [
    { id: "nmo-50408-mbf-cell-body-line-loop-4", z: -18, edges: [62] },
  ]);
});

test("rejects source-topology and false shell-admission mutations", () => {
  for (const mutate of [
    (copy) => { copy.records[0].summary.adjacentTransitionsHeld = 0; },
    (copy) => { copy.records[1].summary.selfIntersectionCount = 0; },
    (copy) => { copy.records[1].summary.zeroLengthEdgeCount = 0; },
    (copy) => { copy.summary.contourDerivedSurfaceAdmittedCount = 1; },
    (copy) => { copy.referenceScreen.independentlyValidatedAsBiologicalTolerances = true; },
  ]) {
    const changed = structuredClone(audit);
    mutate(changed);
    assert.throws(() => validateToddNativeContourTopologyAudit(changed, schema, expected));
  }
});

test("the existing per-record inspector exposes the source-local screen and its interpretation boundary", () => {
  assert.match(viewerSource, /data-topology-audit-release="ohri-todd-native-contour-topology-audit-0\.1\.0"/);
  assert.match(viewerSource, /Adjacent-section topology screen/);
  assert.match(viewerSource, /not independently validated as a biological tolerance/);
  assert.match(viewerSource, /not biological measurements or a claim of cell change/);
  assert.match(viewerSource, /No source points are repaired, smoothed, interpolated or registered/);
  assert.match(viewerSource, /0 shells admitted/);
});
