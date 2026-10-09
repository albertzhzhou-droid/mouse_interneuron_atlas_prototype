import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  AUDIT_PATH,
  SCHEMA_PATH,
  validateNeuromorphoReleaseDeltaAudit,
} from "../scripts/validate-neuromorpho-release-8-6-125-query-delta-audit-0.1.mjs";

const [audit, schema, baselineIndex] = await Promise.all([
  readFile(new URL(`../${AUDIT_PATH}`, import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL(`../${SCHEMA_PATH}`, import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../public/data/neuromorpho_release_8_6_124_census_v1/census-index.json", import.meta.url), "utf8").then(JSON.parse),
]);

test("records the observed 8.6.125 exact-query metadata-only delta without changing the active 8.6.124 model", () => {
  assert.deepEqual(validateNeuromorphoReleaseDeltaAudit(audit, schema, baselineIndex), {
    auditId: "neuromorpho-release-8-6-125-query-delta-audit-0.1",
    baselineRelease: "8.6.124",
    candidateRelease: "8.6.125",
    comparedRecords: 142,
    changedSemanticMetadataRecords: 0,
    activeGeometryRelease: "8.6.124",
    geometryAndRightsRechecked: false,
  });
});

test("rejects any attempt to turn metadata equality into a geometry, rights, or active-release promotion", () => {
  for (const mutate of [
    (copy) => { copy.assetAndAdmissionBoundaries.perObjectGeometryHashesRechecked = true; },
    (copy) => { copy.assetAndAdmissionBoundaries.fileSpecificReuseAndAttributionRightsRechecked = true; },
    (copy) => { copy.assetAndAdmissionBoundaries.promotedIntoActiveModel = true; },
    (copy) => { copy.comparison.changedSemanticMetadataRecordCount = 1; },
  ]) {
    const copy = structuredClone(audit);
    mutate(copy);
    assert.throws(() => validateNeuromorphoReleaseDeltaAudit(copy, schema, baselineIndex));
  }
});
