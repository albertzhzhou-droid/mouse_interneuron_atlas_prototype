import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateMorphologyMatrixContract } from "../scripts/validate-morphology-matrix-contract-0.1.mjs";

const contract = JSON.parse(await readFile(new URL("../data/morphology-matrix-contract-0.1.json", import.meta.url), "utf8"));

test("validates all 142 selectable morphologies and strict evidence gates", async () => {
  assert.deepEqual(await validateMorphologyMatrixContract(), {
    releaseId: "ohri-morphology-matrix-contract-0.1.0",
    recordCount: 142,
    radiusAuthorizedCount: 92,
    sourceDiameterInputCount: 94,
    dimensionalityBlockedRadiusCount: 2,
    noDiameterCount: 48,
    comparisonMaximum: 4,
    registrationCount: 0,
    internalStructureCount: 0,
    microdetailAxisCount: 13,
    microdetailRecordCount: 142,
    microdetailTopologyCount: 142,
    microdetailSomaContourCount: 0,
  });
});

test("rejects expanded comparison, internal structures, registrations, and no-diameter surfaces", async () => {
  for (const mutate of [
    (value) => { value.comparator.maximumSelections = 5; },
    (value) => { value.internalDetailGate.renderedPrimitiveCount = 1; },
    (value) => { value.comparator.registrationCount = 1; },
    (value) => { value.radiusGate.noDiameterSurfacePrimitiveCount = 1; },
    (value) => { value.microdetailCoverage.sameSpecimenInternalObservedCount = 1; },
    (value) => { value.microdetailCoverage.axisOrder[5] = "generic_nucleus"; },
    (value) => { value.microdetailCoverage.conflictPolicy = "best_effort"; },
  ]) {
    const altered = structuredClone(contract);
    mutate(altered);
    await assert.rejects(() => validateMorphologyMatrixContract(altered), /schema validation|contract validation/);
  }
});
