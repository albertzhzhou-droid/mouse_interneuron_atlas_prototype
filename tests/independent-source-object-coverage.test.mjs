import test from "node:test";
import assert from "node:assert/strict";
import micronsReference from "../data/microns-observed-cell-nucleus-reference-0.1.json" with { type: "json" };
import micronsAudit from "../data/microns-subcellular-source-audit-0.1.json" with { type: "json" };
import bancMorphologyRoute from "../data/banc-v888-in14a018-morphology-route-0.1.json" with { type: "json" };
import bancInternalAudit from "../data/banc-v888-internal-object-source-audit-0.1.json" with { type: "json" };
import bancMitochondriaAudit from "../data/banc-v888-mitochondria-route-audit-0.1.json" with { type: "json" };
import superClemReference from "../data/super-clem-palm-localization-reference-0.1.json" with { type: "json" };
import microStructFormerReference from "../data/microstructformer-ultrastructure-reference-0.1.json" with { type: "json" };
import nativeContourAudit from "../data/todd-native-contour-topology-audit-0.1.json" with { type: "json" };
import { buildIndependentSourceObjectCoverage } from "../app/independent-source-object-coverage.js";

const build = (overrides = {}) => buildIndependentSourceObjectCoverage({
  micronsReference,
  micronsAudit,
  bancMorphologyRoute,
  bancInternalAudit,
  bancMitochondriaAudit,
  superClemReference,
  microStructFormerReference,
  nativeContourAudit,
  ...overrides,
});

test("independent structural references keep five source-local registries and non-pooled denominators", () => {
  const rows = build();
  assert.deepEqual(rows.map((row) => row.id), ["microns-phase1", "banc-v888", "super-clem-palm", "microstructformer", "todd-native-contours"]);
  assert.equal(new Set(rows.map((row) => row.sourceScopedCount)).size, 5);
  assert.ok(rows.every((row) => row.sourceUrl.startsWith("https://") && row.objectIds.length > 0));
  assert.match(rows[0].sourceScopedCount, /1 exact cortical cell root/);
  assert.match(rows[1].sourceScopedCount, /1 exact neuron root/);
  assert.match(rows[2].sourceScopedCount, /18,358 detections.*not a cell count/);
  assert.match(rows[3].sourceScopedCount, /540 image\/mask rows.*no unique-cell/);
  assert.match(rows[4].sourceScopedCount, /2 audited records.*19 contours.*1,136 vertices/);
});

test("source frame, identity, rights and completeness boundaries remain distinct by lane", () => {
  const rows = Object.fromEntries(build().map((row) => [row.id, row]));
  assert.match(rows["microns-phase1"].objectIds, /648518346349516051.*4309/);
  assert.match(rows["microns-phase1"].coordinateFrame, /MICrONS_Phase1_aligned_EM_native.*nanometre/);
  assert.match(rows["microns-phase1"].rights, /CC BY 4.0/);
  assert.match(rows["banc-v888"].objectIds, /720575941350424112.*73044750394982464/);
  assert.match(rows["banc-v888"].coordinateFrame, /BANC native source frame.*nanometre/);
  assert.match(rows["banc-v888"].rights, /CC BY 4.0.*separate mutable EM\/internal-object routes/);
  assert.match(rows["super-clem-palm"].coordinateFrame, /unit, origin, axis orientation and drift correction are not established/);
  assert.match(rows["microstructformer"].rights, /CC BY-NC-SA 4.0.*link-only/);
  assert.match(rows["todd-native-contours"].coordinateFrame, /Neurolucida_DAT_source_native_unregistered/);
});

test("source-reported metrics and image detections do not become admitted internal geometry", () => {
  const rows = Object.fromEntries(build().map((row) => [row.id, row]));
  assert.match(rows["microns-phase1"].notAdmitted, /0 synapse points and 0 mitochondria objects/);
  assert.match(rows["banc-v888"].notAdmitted, /0 mitochondria points.*0 synapse objects/);
  assert.match(rows["super-clem-palm"].notAdmitted, /No 3D geometry/);
  assert.match(rows.microstructformer.notAdmitted, /0 identified interneurons, 0 cell geometries and 0 internal geometries/);
  assert.match(rows["todd-native-contours"].displayed, /0 contour-derived surfaces and 0 triangles/);
  assert.ok(build().every((row) => row.detailHref.length > 0 && row.detailLabel.length > 0));
});
