import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateOpenSourceModelingAvailabilityAudit } from "../scripts/validate-open-source-modeling-availability-audit-0.1.mjs";

const contract = JSON.parse(await readFile(
  new URL("../data/open-source-modeling-availability-audit-0.1.json", import.meta.url),
  "utf8",
));

function mutate(callback) {
  const value = structuredClone(contract);
  callback(value);
  return value;
}

function candidate(candidateId, value = contract) {
  return value.candidates.find((item) => item.candidateId === candidateId);
}

test("validates three queue-only availability candidates with no modeling or UI admission", () => {
  assert.deepEqual(validateOpenSourceModelingAvailabilityAudit(contract), {
    contractId: "ohri-open-source-modeling-availability-audit-0.1.0",
    candidateCount: 3,
    queueOnlyCandidateCount: 3,
    boundedPairAvailabilityReceiptCount: 1,
    sourceObjectBundleAdmissionCount: 0,
    selectedCellJoinCount: 0,
    sameCellInternalChainCount: 0,
    registrationCount: 0,
    atlasRegistrationCount: 0,
    admittedGeometryCount: 0,
    admittedInternalObjectCount: 0,
    renderedObjectCount: 0,
    currentUiSurfaceCount: 0,
  });
  assert.equal(contract.releaseDisposition.currentUiExposure, "none");
  assert.equal(contract.candidates.every((item) => item.status === "queue_only"), true);
});

test("pins the exact Janelia remote raw/nucleus pair without implying cell identity", () => {
  const janelia = candidate("JANELIA_JRC_MUS_SC_ZP104A_BOUNDED_RAW_NUCLEUS");
  assert.equal(janelia.identity.cellClass, "unknown");
  assert.equal(janelia.identity.interneuronIdentityEstablished, false);
  assert.equal(janelia.boundedPair.rawChunk.storedBytes, 1_376_848);
  assert.equal(janelia.boundedPair.rawChunk.sha256, "efdbb0aeff783cc57ab0a94629d70644f99969fe48a901db79d3777b8282a23f");
  assert.equal(janelia.boundedPair.manualNucleusChunk.storedBytes, 6_699);
  assert.equal(janelia.boundedPair.manualNucleusChunk.sha256, "0d833b9fff0223c7ba75a2c117c30988aec74bec2eff603d8ee06a426c06fbcf");
  assert.deepEqual(janelia.boundedPair.verifiedOverlap.labelLocalVoxelBoundsHalfOpenZYX, {
    minimum: [16, 48, 8],
    maximumExclusive: [24, 56, 16],
  });
  assert.equal(janelia.boundedPair.verifiedOverlap.labelVoxelCount, 512);
  assert.equal(janelia.boundedPair.completeNucleusEstablished, false);
  assert.equal(janelia.annotationReadiness.proofreadClaimAuthorized, false);
  assert.equal(janelia.admission.selectedCellJoinCount, 0);
  assert.equal(janelia.admission.registrationCount, 0);
});

test("locks the unresolved Janelia coordinate discrepancy and unavailable Ariadne path", () => {
  const janelia = candidate("JANELIA_JRC_MUS_SC_ZP104A_BOUNDED_RAW_NUCLEUS");
  assert.deepEqual(janelia.coordinateAndCalibration.sourceRecordNominalFieldSizeMicrometreXYZ, [40, 30, 75]);
  assert.deepEqual(janelia.coordinateAndCalibration.rawS0.voxelSupportExtentMicrometreZYX, [76.188, 42, 54]);
  assert.equal(janelia.coordinateAndCalibration.nominalDescriptionVersusLiveArrayStatus, "unresolved");
  assert.equal(janelia.coordinateAndCalibration.biologicalMeasurementAuthorized, false);
  assert.equal(janelia.ariadneAvailabilityCheck.wildTypePrefixListingKeyCount, 0);
  assert.equal(janelia.ariadneAvailabilityCheck.wildTypeAttributesHttpStatus, 404);
  assert.equal(janelia.ariadneAvailabilityCheck.admittedObjectCount, 0);
});

test("retains Fish1 identity, calibration, proofreading and redistribution blockers", () => {
  const fish1 = candidate("FISH1_LARVAL_ZEBRAFISH_INTERNAL_DETAIL");
  assert.equal(fish1.readiness, "blocked");
  assert.equal(fish1.identityAndJoin.selectedLoreId, null);
  assert.equal(fish1.identityAndJoin.selectedRootId, null);
  assert.equal(fish1.identityAndJoin.independentlyAnnotatedSpinalInterneuronRosterAvailable, false);
  assert.equal(fish1.identityAndJoin.inhibitoryCellTypeValueAloneEstablishesSpinalInterneuron, false);
  assert.deepEqual(fish1.coordinateAndCalibration.reportedAcquisitionNanometreXYZ, [4, 4, 30]);
  assert.deepEqual(fish1.coordinateAndCalibration.publicRawInfoNanometreXYZ, [8, 8, 30]);
  assert.deepEqual(fish1.coordinateAndCalibration.publicStaticSegmentationInfoNanometreXYZ, [16, 16, 30]);
  assert.equal(fish1.proofreading.completeDatasetProofreadingClaimAuthorized, false);
  assert.equal(fish1.rights.rightsStatus, "ambiguous_for_redistribution");
  assert.equal(fish1.rights.deliveryDisposition, "link_only");
});

test("retains the PKD2L1 raw-object and separate-experiment blockers", () => {
  const pkd2l1 = candidate("PKD2L1_MOUSE_CSF_CONTACTING_NEURON_RAW_SBFSEM_CHAIN");
  assert.equal(pkd2l1.readiness, "blocked");
  assert.equal(pkd2l1.availability.publicationVideoAvailable, true);
  assert.equal(pkd2l1.availability.rawSerialEmStackAvailable, false);
  assert.equal(pkd2l1.availability.segmentationLabelsAvailable, false);
  assert.equal(pkd2l1.availability.eligibleForThreeDimensionalReconstruction, false);
  assert.equal(pkd2l1.experimentBoundary.constructsShareExactSample, false);
  assert.equal(pkd2l1.experimentBoundary.crossSampleFusionAuthorized, false);
  assert.equal(pkd2l1.admission.admittedInternalObjectCount, 0);
});

test("rejects identity, measurement, proofreading, admission and receipt promotion", () => {
  assert.throws(() => validateOpenSourceModelingAvailabilityAudit(mutate((value) => {
    candidate("JANELIA_JRC_MUS_SC_ZP104A_BOUNDED_RAW_NUCLEUS", value).identity.cellClass = "interneuron";
  })), /cell-class and identity boundary/i);
  assert.throws(() => validateOpenSourceModelingAvailabilityAudit(mutate((value) => {
    candidate("JANELIA_JRC_MUS_SC_ZP104A_BOUNDED_RAW_NUCLEUS", value).coordinateAndCalibration.nominalDescriptionVersusLiveArrayStatus = "resolved";
  })), /coordinate discrepancy/i);
  assert.throws(() => validateOpenSourceModelingAvailabilityAudit(mutate((value) => {
    candidate("JANELIA_JRC_MUS_SC_ZP104A_BOUNDED_RAW_NUCLEUS", value).annotationReadiness.proofreadClaimAuthorized = true;
  })), /annotation\/proofreading boundary/i);
  assert.throws(() => validateOpenSourceModelingAvailabilityAudit(mutate((value) => {
    candidate("JANELIA_JRC_MUS_SC_ZP104A_BOUNDED_RAW_NUCLEUS", value).boundedPair.rawChunk.sha256 = "0".repeat(64);
  })), /raw chunk receipt drifted/i);
  assert.throws(() => validateOpenSourceModelingAvailabilityAudit(mutate((value) => {
    candidate("JANELIA_JRC_MUS_SC_ZP104A_BOUNDED_RAW_NUCLEUS", value).admission.selectedCellJoinCount = 1;
  })), /selectedCellJoinCount must remain zero/i);
  assert.throws(() => validateOpenSourceModelingAvailabilityAudit(mutate((value) => {
    candidate("FISH1_LARVAL_ZEBRAFISH_INTERNAL_DETAIL", value).rights.rightsStatus = "redistribution_authorized";
  })), /Fish1 rights boundary/i);
  assert.throws(() => validateOpenSourceModelingAvailabilityAudit(mutate((value) => {
    candidate("PKD2L1_MOUSE_CSF_CONTACTING_NEURON_RAW_SBFSEM_CHAIN", value).availability.rawSerialEmStackAvailable = true;
  })), /PKD2L1 raw-object availability blocker/i);
  assert.throws(() => validateOpenSourceModelingAvailabilityAudit(mutate((value) => {
    candidate("PKD2L1_MOUSE_CSF_CONTACTING_NEURON_RAW_SBFSEM_CHAIN", value).admission.currentUiExposure = "internal_reference";
  })), /must have no current UI exposure/i);
});
