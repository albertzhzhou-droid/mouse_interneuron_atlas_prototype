import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { CONTEXT_PATH, SCHEMA_PATH, validatePkd2l1IndependentPopulationContext } from "../scripts/validate-pkd2l1-independent-population-context-0.1.mjs";

const [context, schema] = await Promise.all([
  readFile(new URL(`../${CONTEXT_PATH}`, import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL(`../${SCHEMA_PATH}`, import.meta.url), "utf8").then(JSON.parse),
]);
const clone = () => structuredClone(context);

test("retains the eight published PKD2L1 Table 5 population summaries and exact study frame", () => {
  assert.deepEqual(validatePkd2l1IndependentPopulationContext(context, schema), {
    contextId: "leblond-2025-pkd2l1-independent-population-context",
    mouseCount: 18,
    sectionCount: 811,
    ageSexSectionDenominatorsReconciled: true,
    tableFiveStrata: 8,
    publicRawDataDepositVerified: false,
    perCellMorphologyAvailable: false,
    geometryPrimitivesAdmitted: 0,
    sameCellJoinToCrozat: false,
  });
  const lumbar = context.publishedSummaries.find((row) => row.group === "Lumbar");
  assert.deepEqual(lumbar.pkd2l1PositiveCellsPerSection, { mean: 9.32, standardDeviation: 4.75, minimum: 2, maximum: 21 });
  assert.deepEqual(lumbar.centroidDistanceFromCentralCanalCenterMicrometers, { mean: 94.51, standardDeviation: 53.17, minimum: 0.63, maximum: 226.83 });
});

test("rejects inferred region denominators, open-data claims and cell-specific geometry", () => {
  for (const mutate of [
    (value) => { value.publishedSummaries.find((row) => row.group === "Lumbar").sectionsInStudyFrame = 200; },
    (value) => { value.source.publicRawDataDepositVerified = true; },
    (value) => { value.identityAndRepresentationBoundary.perCellMorphologyAvailable = true; },
    (value) => { value.identityAndRepresentationBoundary.geometryPrimitivesAdmitted = 1; },
    (value) => { value.identityAndRepresentationBoundary.sameCellJoinToCrozat = true; },
    (value) => { value.identityAndRepresentationBoundary.includedInInterneuronTypeCounts = true; },
    (value) => { value.studyFrame.sectionCount = 812; },
  ]) {
    const changed = clone();
    mutate(changed);
    assert.throws(() => validatePkd2l1IndependentPopulationContext(changed, schema));
  }
});
