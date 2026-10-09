import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateCensusChildObservedMorphologyRoute01 } from "../scripts/validate-census-child-observed-morphology-route-0.1.mjs";

const contract = JSON.parse(await readFile(new URL("../data/census-child-observed-morphology-route-0.1.json", import.meta.url), "utf8"));

test("admits NMO 108978 as a source-local census child without expanding 142 records", async () => {
  assert.deepEqual(await validateCensusChildObservedMorphologyRoute01(), {
    releaseId: "ohri-census-child-observed-morphology-route-0.1.0",
    routeId: "mouse.sc.tac1_sp_dorsal_horn.observed.nmo_108978",
    inExistingCensus: true,
    censusRecordCount: 142,
    mainSceneMorphologyIncrement: 1,
    nativeSomaLineLoopCount: 12,
    nativeSomaLineLoopVertexCount: 2614,
    dorsalHornRouteCount: 5,
    dorsalHornCensusMemberCount: 3,
    internalPrimitiveCount: 0,
    crossSourceIdentityCount: 0,
    projectRegistrationCount: 0,
  });
});

test("rejects conflating the census child with the frozen lens or a new denominator row", async () => {
  const census = structuredClone(contract);
  census.runtimeMergePolicy.censusExpansionCount = 1;
  await assert.rejects(() => validateCensusChildObservedMorphologyRoute01(census), /expanded the frozen census/i);

  const lensOverlap = structuredClone(contract);
  lensOverlap.route.frozenLensMembership = true;
  await assert.rejects(() => validateCensusChildObservedMorphologyRoute01(lensOverlap), /route schema validation failed/i);
});

test("rejects DAT-to-SWC overlay, unsupported class promotion, and internal geometry", async () => {
  const overlay = structuredClone(contract);
  overlay.route.nativeDatContract.overlayWithStandardizedSwcAllowed = true;
  await assert.rejects(() => validateCensusChildObservedMorphologyRoute01(overlay), /DAT-to-SWC frame boundary drifted/i);

  const promoted = structuredClone(contract);
  promoted.route.observedCellFormRecord.phenotype = "radial cell";
  await assert.rejects(() => validateCensusChildObservedMorphologyRoute01(promoted), /route phenotype wording drifted/i);

  const internal = structuredClone(contract);
  internal.route.renderingContract.sameSpecimenInternalStructure.renderedPrimitiveCount = 1;
  await assert.rejects(() => validateCensusChildObservedMorphologyRoute01(internal), /missing internal structures gained rendered primitives/i);
});

test("rejects altered source-native loop evidence and fabricated molecular joins", async () => {
  const contours = structuredClone(contract);
  contours.route.renderingContract.nativeSomaContours.vertexCount = 0;
  await assert.rejects(() => validateCensusChildObservedMorphologyRoute01(contours), /native soma trace detail counts drifted/i);

  const join = structuredClone(contract);
  join.route.identityBoundary.molecularProfileRelationship = "mouse.sc.vsx2_hoxa10";
  await assert.rejects(() => validateCensusChildObservedMorphologyRoute01(join), /promoted to molecular identity/i);
});
