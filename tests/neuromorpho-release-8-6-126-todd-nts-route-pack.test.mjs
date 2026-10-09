import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateNeuromorphoRelease126ToddNtsRoutePack01 } from "../scripts/validate-neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.mjs";
import { loadAndValidateNeuromorphoRelease126ToddStableIdAudit02, validateNeuromorphoRelease126ToddStableIdAudit02 } from "../scripts/validate-neuromorpho-release-8-6-126-todd-stable-id-audit-0.2.mjs";

test("UPG-245 routes the exact 30 public 8.6.126 reconstructions without changing the frozen universe", async () => {
  const result = await validateNeuromorphoRelease126ToddNtsRoutePack01();
  assert.equal(result.routeCount, 30);
  assert.equal(result.completeCurrentRosterCount, 339);
  assert.equal(result.baselineToddRecordCount, 309);
  assert.equal(result.sharedStableIdCount, 309);
  assert.equal(result.addedStableIdCount, 30);
  assert.equal(result.removedStableIdCount, 0);
  assert.equal(result.metadataChangeCount, 0);
  assert.equal(result.parsedNodeCount, 24209);
  assert.equal(result.parsedSegmentCount, 24179);
  assert.equal(result.sourceDiameterReportedCount, 10);
  assert.equal(result.sourceDiameterNotReportedCount, 20);
  assert.equal(result.internalPrimitiveCount, 0);
  assert.equal(result.paperCrosswalkCount, 0);
});

test("UPG-245 route pack rejects invented paper identity, census expansion, or unsupported radii", async () => {
  const pack = JSON.parse(await readFile(new URL("../data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json", import.meta.url), "utf8"));
  for (const mutate of [
    (value) => { value.candidateStudyContext.relationStatus = "verified_record_level_crosswalk"; },
    (value) => { value.runtimeMergePolicy.censusExpansionCount = 30; },
    (value) => { value.routes[0].fidelityRecord.modes.radiusSurface.available = true; },
    (value) => { value.routes[0].fidelityRecord.modes.internalStructure.available = true; },
  ]) {
    const altered = structuredClone(pack);
    mutate(altered);
    await assert.rejects(validateNeuromorphoRelease126ToddNtsRoutePack01(altered));
  }
});

test("UPG-245 0.2 summary is hash-linked to the exact roster and route package", async () => {
  const { summary } = await loadAndValidateNeuromorphoRelease126ToddStableIdAudit02();
  assert.equal(summary.auditId, "neuromorpho-release-8-6-126-todd-stable-id-audit-0.2");
  assert.equal(summary.currentRosterCount, 339);
  assert.equal(summary.addedCount, 30);
  assert.equal(summary.removedCount, 0);
  assert.equal(summary.topologyQcCount, 30);
  assert.equal(summary.standardizedSwcNodeCount, 24209);
  assert.equal(summary.standardizedSwcSegmentCount, 24179);
  assert.equal(summary.sourceDiameterReportedCount, 10);
  assert.equal(summary.sourceDiameterNotReportedCount, 20);
  assert.equal(summary.paperCrosswalkCount, 0);
  assert.equal(summary.censusExpansion, 0);
});

test("UPG-245 audit rejects a confirmed paper crosswalk", async () => {
  const [{ audit }, schema, routeBytes, queryBytes, report] = await Promise.all([
    loadAndValidateNeuromorphoRelease126ToddStableIdAudit02(),
    readFile(new URL("../schemas/neuromorpho-release-8-6-126-todd-stable-id-audit-0.2.schema.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json", import.meta.url)),
    readFile(new URL("../data/source-candidates/neuromorpho-release-8-6-126-todd-nts-v1/official-current-query-response.json", import.meta.url)),
    validateNeuromorphoRelease126ToddNtsRoutePack01(),
  ]);
  const changed = structuredClone(audit);
  changed.contextualStudy.relationStatus = "verified_record_level_crosswalk";
  assert.throws(() => validateNeuromorphoRelease126ToddStableIdAudit02(changed, schema, routeBytes, report, queryBytes));
});
