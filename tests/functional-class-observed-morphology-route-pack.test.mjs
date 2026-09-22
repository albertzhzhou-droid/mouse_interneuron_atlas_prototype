import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateFunctionalClassObservedMorphologyRoutePack } from "../scripts/validate-functional-class-observed-morphology-route-pack-0.1.mjs";

const contract = JSON.parse(
  await readFile(new URL("../data/functional-class-observed-morphology-route-pack-0.1.json", import.meta.url), "utf8"),
);

test("pins exact Renshaw and NPY routes without expanding the census or inventing internals", async () => {
  assert.deepEqual(await validateFunctionalClassObservedMorphologyRoutePack(), {
    releaseId: "ohri-functional-class-observed-morphology-route-pack-0.1.0",
    routeCount: 2,
    uniqueMainSceneNeuronCount: 10,
    censusRecordCount: 142,
    censusExpansionCount: 0,
    sourceDiameterAvailableCount: 2,
    observedAxonRouteCount: 2,
    sourceCompleteAxonCount: 0,
    nativeDatSemanticAdmissionCount: 0,
    sameCellElectrophysiologyJoinCount: 0,
    internalPrimitiveCount: 0,
    crossSourceIdentityCount: 0,
    projectRegistrationCount: 0,
  });

  assert.deepEqual(
    contract.routes.map((route) => [route.sourceRecord.neuronId, route.sourceObjects.swc.sha256, route.sourceObjects.originalDat.sha256]),
    [
      [45674, "95b2fc29900a994ef87d6f50c07481115f94207c5ebaeb9f436e7e494edac1fd", "9d5a8670fdb97656c18eb8819b3c4723f438fb8929e66ea8dc6103c6bb547d87"],
      [50424, "0cdb5c32555f94d2ffd1765d8c21f1f95703692c45917f2a2d2449ecc457138b", "90662374ccfacc0404b1b8817161015fa52c6c384911700f428a4c5421cb79d9"],
    ],
  );
});

test("rejects DAT semantic promotion, invented internals, physiology joins and registration", async () => {
  const dat = structuredClone(contract);
  dat.routes[0].nativeDatContract.parsed = true;
  await assert.rejects(() => validateFunctionalClassObservedMorphologyRoutePack(dat), /parsed|DAT semantics|constant/i);

  const internals = structuredClone(contract);
  internals.routes[0].renderingContract.sameSpecimenInternalStructure.renderedPrimitiveCount = 1;
  await assert.rejects(() => validateFunctionalClassObservedMorphologyRoutePack(internals), /renderedPrimitiveCount|internals|constant/i);

  const physiology = structuredClone(contract);
  physiology.routes[1].identityBoundary.sameCellElectrophysiologyJoinStatus = "joined";
  await assert.rejects(() => validateFunctionalClassObservedMorphologyRoutePack(physiology), /sameCellElectrophysiologyJoinStatus|electrophysiology join|constant/i);

  const registered = structuredClone(contract);
  registered.routes[0].identityBoundary.projectRegistrationCount = 1;
  await assert.rejects(() => validateFunctionalClassObservedMorphologyRoutePack(registered), /projectRegistrationCount|registration|constant/i);
});

test("rejects erasure of preparation, PCA-morphometry, strain and weight conflicts", async () => {
  const preparation = structuredClone(contract);
  preparation.routes[0].hardBoundaries = preparation.routes[0].hardBoundaries.filter((boundary) => !boundary.includes("400 micrometre"));
  await assert.rejects(() => validateFunctionalClassObservedMorphologyRoutePack(preparation), /preparation ambiguity/i);

  const pca = structuredClone(contract);
  pca.routes[1].geometryReceipt.repositoryMorphometry.equivalentToSwcBounds = true;
  await assert.rejects(() => validateFunctionalClassObservedMorphologyRoutePack(pca), /equivalentToSwcBounds|conflated|constant/i);

  const strain = structuredClone(contract);
  strain.routes[1].sourceRecord.repositoryStrainRaw = "Swiss-Webster";
  await assert.rejects(() => validateFunctionalClassObservedMorphologyRoutePack(strain), /strain conflict|normalized away/i);

  const weight = structuredClone(contract);
  weight.routes[1].sourceRecord.repositoryWeightGrams.validForBiologicalInterpretation = true;
  await assert.rejects(() => validateFunctionalClassObservedMorphologyRoutePack(weight), /validForBiologicalInterpretation|weight bounds|constant/i);
});
