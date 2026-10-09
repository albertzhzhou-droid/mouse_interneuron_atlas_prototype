import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { AUDIT_PATH_233, buildGintyNeuroMorphoStrainFacetAuditFromDisk } from "../tools/build_ginty_neuromorpho_strain_facet_audit_0_1.mjs";
import { SCHEMA_PATH_233, validateGintyNeuroMorphoStrainFacetAudit } from "../scripts/validate-ginty-neuromorpho-strain-facet-audit-0.1.mjs";

const [audit, schema, rebuilt] = await Promise.all([
  readFile(new URL(`../${AUDIT_PATH_233}`, import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL(`../${SCHEMA_PATH_233}`, import.meta.url), "utf8").then(JSON.parse),
  buildGintyNeuroMorphoStrainFacetAuditFromDisk(),
]);

test("pins the paper-linked 650-record repository roster and raw source-strain facets", () => {
  const result = validateGintyNeuroMorphoStrainFacetAudit(audit, schema, rebuilt);
  assert.deepEqual(result, {
    auditId: "ginty-neuromorpho-strain-facet-audit-0.1",
    repositoryRecords: 650,
    exactRawStrainLabels: 12,
    sourceClassCounts: { Excitatory: 208, Inhibitory: 442 },
    dimensionalityCounts: { "2D": 10, "3D": 640 },
    paperAnalysisMembershipReconciled: false,
    internalStructurePrimitiveCount: 0,
  });
  const rorbeta = audit.repositoryRoster.sourceStrainGroups.find((group) => group.sourceStrainLabel === "Rorbeta-CreER");
  assert.equal(rorbeta.recordCount, 44);
  assert.ok(rorbeta.neuronIds.includes(75265));
});

test("keeps paper-reported 305 and 351 sample statements separate and unresolved", () => {
  assert.deepEqual(audit.paperScopeReconciliation.distinctReportedMorphologyAnalysisCounts.map((item) => item.count), [305, 351]);
  assert.ok(audit.paperScopeReconciliation.distinctReportedMorphologyAnalysisCounts.every((item) => item.rosterCrosswalk === false));
  assert.equal(audit.paperScopeReconciliation.independentAnimalDenominator, false);
  assert.equal(audit.representationBoundary.representativeOrMeanNeuronCreated, false);
});

test("mutated source identity, geometry, or scientific interpretation is rejected", () => {
  for (const mutate of [
    (copy) => { copy.repositoryRoster.uniqueIndexedSwcSha256Count -= 1; },
    (copy) => { copy.paperScopeReconciliation.paperAnalysisMembershipReconciled = true; },
    (copy) => { copy.representationBoundary.sourceStrainValuesAreCanonicalSubtypeIds = true; },
    (copy) => { copy.representationBoundary.representativeOrMeanNeuronCreated = true; },
    (copy) => { copy.representationBoundary.sameCellJoinCount = 1; },
  ]) {
    const changed = structuredClone(audit);
    mutate(changed);
    assert.throws(() => validateGintyNeuroMorphoStrainFacetAudit(changed, schema, rebuilt));
  }
});
