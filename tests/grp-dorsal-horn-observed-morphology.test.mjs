import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateGrpDorsalHornObservedMorphology } from "../scripts/validate-grp-dorsal-horn-observed-morphology-0.1.mjs";

const contract = JSON.parse(await readFile(new URL("../data/grp-dorsal-horn-observed-morphology-0.1.json", import.meta.url), "utf8"));

test("pins the independent NMO 109021 GRP morphology route and its zero-join boundary", async () => {
  assert.deepEqual(await validateGrpDorsalHornObservedMorphology(), {
    releaseId: "ohri-grp-dorsal-horn-observed-morphology-0.1.0",
    routeId: "mouse.sc.grp_dorsal_horn.observed.nmo_109021",
    neuronId: 109021,
    nodeCount: 2790,
    segmentCount: 2789,
    internalPrimitiveCount: 0,
    crossSourceIdentityCount: 0,
    projectRegistrationCount: 0,
  });
});

test("rejects invented internal detail, selected-entity identity and registration", async () => {
  const internals = structuredClone(contract);
  internals.renderingContract.sameSpecimenInternalStructure.renderedPrimitiveCount = 1;
  await assert.rejects(() => validateGrpDorsalHornObservedMorphology(internals), /renderedPrimitiveCount|zero primitives/i);

  const linked = structuredClone(contract);
  linked.identityBoundary.selectedSciEntityRelationship = "mouse.sc.vsx2_hoxa10";
  await assert.rejects(() => validateGrpDorsalHornObservedMorphology(linked), /selectedSciEntityRelationship|constant/i);

  const registered = structuredClone(contract);
  registered.identityBoundary.projectRegistrationCount = 1;
  await assert.rejects(() => validateGrpDorsalHornObservedMorphology(registered), /projectRegistrationCount|constant/i);
});

test("retains truncation and soma-node interpretation boundaries", () => {
  assert.match(contract.hardBoundaries.join(" "), /300 micrometre parasagittal slice.*truncation-aware/i);
  assert.match(contract.hardBoundaries.join(" "), /12 original soma contours.*averaged into 12 standardized source-type-1 soma points.*not original contour vertices/i);
  assert.match(contract.observedCellFormRecord.phenotype, /GRP-reporter-positive/i);
  assert.match(contract.hardBoundaries.join(" "), /not an independent direct GRP-mRNA measurement/i);
  assert.equal(contract.sourceRecord.physicalIntegrity, "Dendrites & Axon Moderate");
  assert.equal(contract.geometryReceipt.nodeTypeCounts["2"], 2202);
});
