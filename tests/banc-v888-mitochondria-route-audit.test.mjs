import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { loadAndValidateBancV888MitochondriaRouteAudit } from "../scripts/validate-banc-v888-mitochondria-route-audit-0.1.mjs";

test("BANC route audit satisfies its strict JSON Schema", async () => {
  const [audit, schema] = await Promise.all([
    readFile(new URL("../data/banc-v888-mitochondria-route-audit-0.1.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../schemas/banc-v888-mitochondria-route-audit-0.1.schema.json", import.meta.url), "utf8").then(JSON.parse),
  ]);
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  assert.equal(validate(audit), true, JSON.stringify(validate.errors));
  const altered = structuredClone(audit);
  altered.candidate.mitochondriaCountMetric.value = 32;
  assert.equal(validate(altered), false);
});

test("retains the exact v888 candidate's source-reported mitochondria count without inventing positions", async () => {
  const audit = await loadAndValidateBancV888MitochondriaRouteAudit();
  assert.equal(audit.candidate.rootId, "720575941350424112");
  assert.equal(audit.candidate.mitochondriaCountMetric.value, 31);
  assert.equal(audit.candidate.mitochondriaCountMetric.perMitochondrionAnnotationRowsRetrieved, false);
  assert.equal(audit.representation.mitochondriaPointMarkersAdmitted, 0);
  assert.equal(audit.representation.mitochondriaSurfacesAdmitted, 0);
  assert.equal(audit.representation.mouseCellJoinCount, 0);
});

test("keeps the public archive separate from the credentialed root-filter query route", async () => {
  const audit = await loadAndValidateBancV888MitochondriaRouteAudit();
  assert.equal(audit.source.mitochondriaTable.restricted, false);
  assert.equal(audit.source.mitochondriaTable.bytes, 1107598431);
  assert.equal(audit.queryRoute.rootFilteredQuerySupported, true);
  assert.equal(audit.queryRoute.configuredCaveClientRequiredByDocumentedImplementation, true);
  assert.equal(audit.queryRoute.credentialsInspectedOrUsed, false);
  assert.equal(audit.queryRoute.queryExecuted, false);
  assert.equal(audit.source.separateSegmentationProductStatus, "MISSING");
});

test("the comparative card reports a count metric while preserving zero source geometry", async () => {
  const panel = await readFile(new URL("../app/InternalStructureReferencePanel.tsx", import.meta.url), "utf8");
  assert.match(panel, /Source-reported count metric/);
  assert.match(panel, /root-filtered/);
  assert.match(panel, /no spatial positions or mitochondria geometry/);
  assert.match(panel, /not linked to the selected mouse record/);
});
