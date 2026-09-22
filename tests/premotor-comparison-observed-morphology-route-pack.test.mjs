import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validatePremotorComparisonObservedMorphologyRoutePack } from "../scripts/validate-premotor-comparison-observed-morphology-route-pack-0.1.mjs";

const CONTRACT_URL = new URL("../data/premotor-comparison-observed-morphology-route-pack-0.1.json", import.meta.url);
const contract = JSON.parse(await readFile(CONTRACT_URL, "utf8"));
const clone = () => structuredClone(contract);

test("pins one exact repository-labelled premotor comparison route without changing the census", async () => {
  assert.deepEqual(await validatePremotorComparisonObservedMorphologyRoutePack(), {
    releaseId: "ohri-premotor-comparison-observed-morphology-route-pack-0.1.0",
    routeCount: 1,
    uniqueMainSceneNeuronCount: 13,
    namedRouteCount: 10,
    censusRecordCount: 142,
    sourceDiameterAvailableCount: 1,
    sourceCompleteAxonCount: 0,
    nativeDatSemanticAdmissionCount: 0,
    sameCellElectrophysiologyJoinCount: 0,
    internalPrimitiveCount: 0,
    crossSourceIdentityCount: 0,
    projectRegistrationCount: 0,
  });
});

test("rejects geometry, topology, complete-axon and internal-detail promotion", async () => {
  const counts = clone();
  counts.routes[0].geometryReceipt.nodeCount += 1;
  await assert.rejects(() => validatePremotorComparisonObservedMorphologyRoutePack(counts), /nodeCount|geometry counts/i);

  const topology = clone();
  topology.routes[0].geometryReceipt.topologySha256 = "0".repeat(64);
  await assert.rejects(() => validatePremotorComparisonObservedMorphologyRoutePack(topology), /topology/i);

  const axon = clone();
  axon.routes[0].fidelityRecord.axon.completeAxon = true;
  await assert.rejects(() => validatePremotorComparisonObservedMorphologyRoutePack(axon), /complete/i);

  const internals = clone();
  internals.routes[0].renderingContract.sameSpecimenInternalStructure.available = true;
  internals.routes[0].renderingContract.sameSpecimenInternalStructure.renderedPrimitiveCount = 1;
  await assert.rejects(() => validatePremotorComparisonObservedMorphologyRoutePack(internals), /internal/i);
});

test("rejects DAT semantics, exact physiology, identity joins and registration", async () => {
  const dat = clone();
  dat.routes[0].nativeDatContract.parsed = true;
  dat.routes[0].nativeDatContract.semanticObjectCountAdmitted = 1;
  await assert.rejects(() => validatePremotorComparisonObservedMorphologyRoutePack(dat), /parsed|semantic/i);

  const physiology = clone();
  physiology.routes[0].identityBoundary.paperMentionsExactNeuronIdOrFilename = true;
  physiology.routes[0].identityBoundary.sameCellElectrophysiologyJoinStatus = "established";
  await assert.rejects(() => validatePremotorComparisonObservedMorphologyRoutePack(physiology), /paperMentions|physiology/i);

  const identity = clone();
  identity.routes[0].identityBoundary.crossSourceIdentityCount = 1;
  await assert.rejects(() => validatePremotorComparisonObservedMorphologyRoutePack(identity), /crossSourceIdentityCount|identity/i);

  const registration = clone();
  registration.routes[0].identityBoundary.projectRegistrationCount = 1;
  await assert.rejects(() => validatePremotorComparisonObservedMorphologyRoutePack(registration), /projectRegistrationCount|registration/i);
});

test("rejects conversion of repository labels into definitive biological exclusions", async () => {
  const paperJoin = clone();
  paperJoin.routes[0].identityBoundary.individualMolecularAssayClaim = true;
  await assert.rejects(() => validatePremotorComparisonObservedMorphologyRoutePack(paperJoin), /individualMolecularAssayClaim|molecular/i);

  const label = clone();
  label.routes[0].sourceRecord.cellTypeLabels = label.routes[0].sourceRecord.cellTypeLabels.filter((value) => value !== "non-renshaw");
  await assert.rejects(() => validatePremotorComparisonObservedMorphologyRoutePack(label), /cell labels|cellTypeLabels/i);

  const washout = clone();
  washout.routes[0].hardBoundaries = washout.routes[0].hardBoundaries.filter((value) => !/calbindin.*washout/i.test(value));
  washout.packBoundaries = washout.packBoundaries.filter((value) => !/calbindin-washout/i.test(value));
  await assert.rejects(() => validatePremotorComparisonObservedMorphologyRoutePack(washout), /washout/i);
});

test("locks the explicit contour-to-point, preparation and shrinkage receipts", async () => {
  const contour = clone();
  contour.routes[0].somaStandardizationReceipt.originalContourCount = null;
  await assert.rejects(() => validatePremotorComparisonObservedMorphologyRoutePack(contour), /originalContourCount|soma contour/i);

  const preparation = clone();
  preparation.routes[0].sourceRecord.repositorySlicingThicknessMicrometre = 400;
  await assert.rejects(() => validatePremotorComparisonObservedMorphologyRoutePack(preparation), /repositorySlicingThicknessMicrometre|slicing/i);

  const shrinkage = clone();
  shrinkage.routes[0].sourceRecord.shrinkageCorrected = "Corrected";
  await assert.rejects(() => validatePremotorComparisonObservedMorphologyRoutePack(shrinkage), /shrinkage/i);
});
