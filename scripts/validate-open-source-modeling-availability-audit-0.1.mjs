#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_PATH = path.join(ROOT, "data/open-source-modeling-availability-audit-0.1.json");

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function exactKeys(value, keys, label) {
  check(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  check(same(Object.keys(value).sort(), [...keys].sort()), `${label} fields are invalid`);
}

function isSha256(value) {
  return typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
}

function candidateById(value, candidateId) {
  const candidate = value.candidates.find((item) => item.candidateId === candidateId);
  check(candidate, `Missing availability candidate ${candidateId}`);
  return candidate;
}

function validateZeroAdmission(candidate) {
  const admission = candidate.admission;
  check(admission.currentUiExposure === "none", `${candidate.candidateId} must have no current UI exposure`);
  check(admission.sourceObjectBundled === false, `${candidate.candidateId} must not bundle a source object`);
  for (const key of [
    "selectedCellJoinCount",
    "sameCellInternalChainCount",
    "registrationCount",
    "atlasRegistrationCount",
    "admittedGeometryCount",
    "admittedInternalObjectCount",
    "renderedObjectCount",
  ]) {
    check(admission[key] === 0, `${candidate.candidateId} ${key} must remain zero`);
  }
}

function validateReceiptSet(receipts, expected, label) {
  check(Array.isArray(receipts) && receipts.length === Object.keys(expected).length, `${label} receipt count drifted`);
  check(new Set(receipts.map((receipt) => receipt.receiptId)).size === receipts.length, `${label} receipt IDs must be unique`);
  for (const receipt of receipts) {
    const expectedReceipt = expected[receipt.receiptId];
    check(expectedReceipt, `${label} has an unexpected receipt ${receipt.receiptId}`);
    check(receipt.url === expectedReceipt.url, `${label} ${receipt.receiptId} URL drifted`);
    check(isSha256(receipt.sha256) && receipt.sha256 === expectedReceipt.sha256, `${label} ${receipt.receiptId} SHA-256 drifted`);
    check(receipt.verifiedAt === "2026-09-02" && receipt.remoteObjectBundled === false, `${label} ${receipt.receiptId} must remain a remote-only 2026-09-02 receipt`);
  }
}

function scaledExtent(shape, scaleNanometre) {
  return shape.map((length, axis) => (length * scaleNanometre[axis]) / 1000);
}

function chunkBounds(chunkIndex, chunkShape, scaleNanometre) {
  const minimum = chunkIndex.map((index, axis) => (index * chunkShape[axis] * scaleNanometre[axis]) / 1000);
  const maximumExclusive = minimum.map((value, axis) => value + (chunkShape[axis] * scaleNanometre[axis]) / 1000);
  return { minimum, maximumExclusive };
}

function validateJanelia(value) {
  exactKeys(value, [
    "candidateId", "queueItemIds", "priorityDisposition", "status", "readiness", "source", "rights", "identity",
    "coordinateAndCalibration", "descriptorReceipts", "boundedPair", "annotationReadiness", "ariadneAvailabilityCheck",
    "availability", "admission", "blockers",
  ], "Janelia candidate");
  check(same(value.queueItemIds, ["UPG-179", "UPG-195", "UPG-196"]), "Janelia queue linkage drifted");
  check(value.priorityDisposition === "release_2.39_availability_receipt_only"
    && value.status === "queue_only"
    && value.readiness === "bounded_receipt_verified_modeling_blocked", "Janelia must remain a 2.39 queue-only availability receipt");
  check(value.source.datasetId === "jrc_mus-sc-zp104a"
    && value.source.species === "Mus musculus"
    && value.source.tissue === "dorsal corticospinal tract"
    && value.source.rawDatasetDoi === "10.25378/janelia.20134574.v1"
    && value.source.manualNucleiDoi === "10.25378/janelia.26513224.v1", "Janelia source identity drifted");
  check(value.source.rawDatasetApiUrl === "https://api.figshare.com/v2/articles/20134574"
    && value.source.manualNucleiApiUrl === "https://api.figshare.com/v2/articles/26513224"
    && value.source.openDataRegistryUrl === "https://registry.opendata.aws/janelia-cosem/", "Janelia official-source URLs drifted");
  check(value.rights.rawDatasetLicense === "CC-BY-4.0"
    && value.rights.manualNucleiLicense === "CC-BY-4.0"
    && value.rights.sourceLicensePermitsRedistributionWithConditions === true
    && value.rights.currentReleaseSourceObjectBundling === false
    && value.rights.currentDisposition === "rights_verified_but_not_admitted", "Janelia rights boundary drifted");
  check(value.rights.requiredConditions.length === 3, "Janelia CC BY conditions must remain explicit");
  check(value.identity.cellClass === "unknown"
    && value.identity.interneuronIdentityEstablished === false
    && value.identity.neuronIdentityEstablished === false
    && value.identity.residentSpinalCellIdentityEstablished === false
    && value.identity.selectedCellIdentityEstablished === false
    && value.identity.stableBiologicalCellIdAvailable === false
    && value.identity.labelInstanceValue === 2
    && value.identity.labelInstanceIsStableBiologicalCellId === false
    && value.identity.selectedCellJoinCount === 0
    && value.identity.sameCellInternalChainCount === 0
    && value.identity.relationshipToSelectedInterneuron === "none", "Janelia cell-class and identity boundary drifted");

  const frame = value.coordinateAndCalibration;
  check(same(frame.axisOrder, ["z", "y", "x"])
    && same(frame.sourceRecordNominalFieldSizeMicrometreXYZ, [40, 30, 75])
    && same(frame.sourceRecordNominalFieldSizeMicrometreZYX, [75, 30, 40]), "Janelia nominal coordinate receipt drifted");
  check(same(frame.rawS0.shapeZYX, [12698, 7000, 9000])
    && same(frame.rawS0.chunkShapeZYX, [128, 128, 128])
    && same(frame.rawS0.scaleNanometreZYX, [6, 6, 6])
    && same(frame.rawS0.translationNanometreZYX, [0, 0, 0])
    && same(frame.rawS0.voxelSupportExtentMicrometreZYX, scaledExtent(frame.rawS0.shapeZYX, frame.rawS0.scaleNanometreZYX)), "Janelia raw Zarr calibration drifted");
  check(same(frame.manualNucleusS0.shapeZYX, [793, 437, 562])
    && same(frame.manualNucleusS0.chunkShapeZYX, [64, 64, 64])
    && same(frame.manualNucleusS0.scaleNanometreZYX, [96, 96, 96])
    && same(frame.manualNucleusS0.translationNanometreZYX, [45, 45, 45])
    && same(frame.manualNucleusS0.voxelSupportExtentMicrometreZYX, scaledExtent(frame.manualNucleusS0.shapeZYX, frame.manualNucleusS0.scaleNanometreZYX)), "Janelia nucleus Zarr calibration drifted");
  check(!same(frame.sourceRecordNominalFieldSizeMicrometreZYX, frame.rawS0.voxelSupportExtentMicrometreZYX)
    && frame.nominalDescriptionVersusLiveArrayStatus === "unresolved"
    && frame.arrayFrameCoordinatesExactForReceipt === true
    && frame.biologicalMeasurementAuthorized === false
    && frame.atlasTransformAvailable === false, "Janelia coordinate discrepancy must remain unresolved and measurement-forbidden");

  validateReceiptSet(value.descriptorReceipts, {
    raw_group_zattrs: {
      url: "https://janelia-cosem-datasets.s3.amazonaws.com/jrc_mus-sc-zp104a/jrc_mus-sc-zp104a.zarr/recon-1/em/fibsem-uint8/.zattrs",
      sha256: "45afde34e3799ca539062bec353188d0ea8ffd86c49cb71b817410ee826d185c",
    },
    raw_s0_zarray: {
      url: "https://janelia-cosem-datasets.s3.amazonaws.com/jrc_mus-sc-zp104a/jrc_mus-sc-zp104a.zarr/recon-1/em/fibsem-uint8/s0/.zarray",
      sha256: "782a586f7cf910125d46407d58f534fcbc1d8adb883b5d3d235e581822c2d321",
    },
    manual_nucleus_group_zattrs: {
      url: "https://janelia-cosem-datasets.s3.amazonaws.com/jrc_mus-sc-zp104a/jrc_mus-sc-zp104a.zarr/recon-1/labels/inference/segmentations/nuc/.zattrs",
      sha256: "ae9fb70dff01cbd10cb2d3ef833551a55be6bf628ee3fe9bb00cc2cbb238980c",
    },
    manual_nucleus_s0_zarray: {
      url: "https://janelia-cosem-datasets.s3.amazonaws.com/jrc_mus-sc-zp104a/jrc_mus-sc-zp104a.zarr/recon-1/labels/inference/segmentations/nuc/s0/.zarray",
      sha256: "d40ada38e475c5d54e10154790bc95f3951522ac85c977737a0a6e2455f3d761",
    },
  }, "Janelia descriptor");

  const pair = value.boundedPair;
  check(pair.pinStatus === "pin_ready_as_remote_availability_receipt_only"
    && pair.relationship === "same_source_volume_spatial_overlap_only", "Janelia bounded pair was promoted beyond an availability receipt");
  check(pair.rawChunk.url.endsWith("/fibsem-uint8/s0/82/22/17")
    && same(pair.rawChunk.chunkIndexZYX, [82, 22, 17])
    && same(pair.rawChunk.shapeZYX, [128, 128, 128])
    && pair.rawChunk.storedBytes === 1376848
    && pair.rawChunk.uncompressedBytes === 2097152
    && pair.rawChunk.etag === "6d7fcf3f265d0aefe92c8c0d58d1a647"
    && pair.rawChunk.sha256 === "efdbb0aeff783cc57ab0a94629d70644f99969fe48a901db79d3777b8282a23f"
    && pair.rawChunk.remoteObjectBundled === false, "Janelia raw chunk receipt drifted");
  check(same(pair.rawChunk.physicalBoundsMicrometreHalfOpenZYX, chunkBounds(
    pair.rawChunk.chunkIndexZYX,
    pair.rawChunk.shapeZYX,
    frame.rawS0.scaleNanometreZYX,
  )), "Janelia raw chunk physical bounds drifted");
  check(pair.manualNucleusChunk.url.endsWith("/nuc/s0/10/2/2")
    && same(pair.manualNucleusChunk.chunkIndexZYX, [10, 2, 2])
    && same(pair.manualNucleusChunk.shapeZYX, [64, 64, 64])
    && pair.manualNucleusChunk.storedBytes === 6699
    && pair.manualNucleusChunk.uncompressedBytes === 262144
    && pair.manualNucleusChunk.etag === "c427d1cdc5b7290859f75007543ac282"
    && pair.manualNucleusChunk.sha256 === "0d833b9fff0223c7ba75a2c117c30988aec74bec2eff603d8ee06a426c06fbcf"
    && pair.manualNucleusChunk.instanceValue === 2
    && pair.manualNucleusChunk.instanceVoxelCountInChunk === 69867
    && same(pair.manualNucleusChunk.instanceLocalBoundsInclusiveZYX, { minimum: [0, 20, 0], maximum: [63, 63, 35] })
    && pair.manualNucleusChunk.remoteObjectBundled === false, "Janelia manual-nucleus chunk receipt drifted");
  const labelScaleRatio = frame.manualNucleusS0.scaleNanometreZYX.map((valueAtAxis, axis) => valueAtAxis / frame.rawS0.scaleNanometreZYX[axis]);
  const expectedLocalMinimum = pair.rawChunk.chunkIndexZYX.map((chunkIndex, axis) => (
    (chunkIndex * pair.rawChunk.shapeZYX[axis]) / labelScaleRatio[axis]
      - pair.manualNucleusChunk.chunkIndexZYX[axis] * pair.manualNucleusChunk.shapeZYX[axis]
  ));
  const expectedLocalMaximum = expectedLocalMinimum.map((valueAtAxis, axis) => valueAtAxis + pair.rawChunk.shapeZYX[axis] / labelScaleRatio[axis]);
  check(same(pair.verifiedOverlap.labelTileIndexWithinChunkZYX, [2, 6, 1])
    && same(pair.verifiedOverlap.labelLocalVoxelBoundsHalfOpenZYX, { minimum: expectedLocalMinimum, maximumExclusive: expectedLocalMaximum })
    && pair.verifiedOverlap.labelVoxelCount === 512
    && pair.verifiedOverlap.uniformInstanceValue === 2
    && pair.verifiedOverlap.rawToLabelSpatialOverlapVerified === true, "Janelia bounded raw/nucleus overlap receipt drifted");
  for (const key of [
    "completeNucleusEstablished", "completeCellEstablished", "cellMembraneEstablished", "neuritesEstablished",
    "organelleEstablished", "synapseEstablished", "interneuronIdentityEstablished", "selectedCellJoinEstablished",
    "atlasRegistrationEstablished",
  ]) check(pair[key] === false, `Janelia bounded pair ${key} must remain false`);
  check(value.annotationReadiness.annotationClass === "nuc"
    && value.annotationReadiness.annotationType === "instance_segmentation"
    && value.annotationReadiness.method === "manual dense segmentation"
    && value.annotationReadiness.protocolDoi === "10.17504/protocols.io.bp2l61rb5vqe/v3"
    && value.annotationReadiness.independentProofreadingReported === false
    && value.annotationReadiness.proofreadingCompletenessMetricReported === false
    && value.annotationReadiness.proofreadClaimAuthorized === false
    && value.annotationReadiness.wholeCellMappingAvailable === false, "Janelia annotation/proofreading boundary drifted");
  check(value.ariadneAvailabilityCheck.queueItemId === "UPG-196"
    && value.ariadneAvailabilityCheck.wildTypeSegmentationDoi === "10.25378/janelia.22577524.v1"
    && value.ariadneAvailabilityCheck.mutantSegmentationDoi === "10.25378/janelia.22577542.v1"
    && value.ariadneAvailabilityCheck.figshareFileMode === "link_only_zero_byte_records"
    && value.ariadneAvailabilityCheck.wildTypePrefixListingKeyCount === 0
    && value.ariadneAvailabilityCheck.wildTypeAttributesHttpStatus === 404
    && value.ariadneAvailabilityCheck.checkedAt === "2026-09-02"
    && value.ariadneAvailabilityCheck.status === "not_currently_pin_ready"
    && value.ariadneAvailabilityCheck.admittedObjectCount === 0, "Janelia Ariadne availability blocker drifted");
  check(value.availability.rawVolumeAvailable === true
    && value.availability.manualNucleusLabelsAvailable === true
    && value.availability.boundedRawNucleusPairPinReady === true
    && value.availability.wholeCellSegmentationPinReady === false
    && value.availability.organelleSegmentationPinReady === false
    && value.availability.skeletonPinReady === false
    && value.availability.eligibleForCurrentModelingObjectAdmission === false, "Janelia availability gate drifted");
  validateZeroAdmission(value);
  check(Array.isArray(value.blockers) && value.blockers.length === 5, "Janelia blocker summary drifted");
}

function validateFish1(value) {
  exactKeys(value, [
    "candidateId", "queueItemIds", "priorityDisposition", "status", "readiness", "source", "descriptorReceipts",
    "coordinateAndCalibration", "identityAndJoin", "proofreading", "rights", "admission", "blockers",
  ], "Fish1 candidate");
  check(same(value.queueItemIds, ["UPG-177", "UPG-189"])
    && value.priorityDisposition === "long_term_queue_only"
    && value.status === "queue_only"
    && value.readiness === "blocked", "Fish1 must remain a blocked queue-only candidate");
  check(value.source.species === "Danio rerio"
    && value.source.lifeStage === "larval"
    && value.source.releaseUrl === "https://fish1-release.storage.googleapis.com/index.html"
    && value.source.programmaticGuideUrl === "https://fish1-release.storage.googleapis.com/programmatic.html"
    && value.source.dataPolicyUrl === "https://fish1-release.storage.googleapis.com/data_policy.html"
    && value.source.primaryPreprintDoi === "10.1101/2025.06.10.658982"
    && value.source.caveDatastack === "fish1_full"
    && value.source.caveDataset === "fish1_v250915", "Fish1 source identity or official URLs drifted");
  validateReceiptSet(value.descriptorReceipts, {
    fish1_em_vast_descriptor: {
      url: "https://storage.googleapis.com/fish1-release/paper_data/vast/Petkova_ZFish1_EM_Clahe23.vsvi",
      sha256: "0b5c974e3f3ce3de8fed3b278ab0bf4abedbe328fd94ff49b0e9b805c9a2648e",
    },
    fish1_base_segmentation_vast_descriptor: {
      url: "https://storage.googleapis.com/fish1-release/paper_data/vast/Petkova_ZFish1_Base_Segmentation.vsvi",
      sha256: "80de38e12a9305d23db2f9ae1924807f69972390e5921f7360eb9ec76ca1894d",
    },
    fish1_agglomerated_segmentation_vast_descriptor: {
      url: "https://storage.googleapis.com/fish1-release/paper_data/vast/Petkova_ZFish1_Agglo_Segmentation.vsvi",
      sha256: "fe0f7b6577ee373efdc56242f9c0c3dee25d80994a6abaa89ac70e611b448939",
    },
  }, "Fish1 descriptor");
  check(same(value.coordinateAndCalibration.reportedAcquisitionNanometreXYZ, [4, 4, 30])
    && same(value.coordinateAndCalibration.publicRawInfoNanometreXYZ, [8, 8, 30])
    && same(value.coordinateAndCalibration.publicStaticSegmentationInfoNanometreXYZ, [16, 16, 30])
    && value.coordinateAndCalibration.status === "unresolved"
    && value.coordinateAndCalibration.biologicalMeasurementAuthorized === false
    && value.coordinateAndCalibration.atlasTransformAvailable === false, "Fish1 coordinate/calibration blocker drifted");
  check(value.identityAndJoin.selectedLoreId === null
    && value.identityAndJoin.selectedRootId === null
    && value.identityAndJoin.independentlyAnnotatedSpinalInterneuronRosterAvailable === false
    && value.identityAndJoin.inhibitoryCellTypeValueAloneEstablishesSpinalInterneuron === false
    && value.identityAndJoin.staticSegmentationToCurrentCaveLoreRootMappingAvailable === false
    && value.identityAndJoin.rootLatestnessVerifiedForSelectedCell === false
    && value.identityAndJoin.sameCellSomaNucleusNeuriteOrganelleSynapseChainAvailable === false
    && value.identityAndJoin.selectedCellJoinCount === 0
    && value.identityAndJoin.sameCellInternalChainCount === 0, "Fish1 identity/join blocker drifted");
  check(value.proofreading.reportedEditedRootCount === 42712
    && value.proofreading.selectedRootProofreadingStatePinned === false
    && value.proofreading.completeDatasetProofreadingClaimAuthorized === false
    && value.proofreading.independentObjectReviewAvailable === false, "Fish1 proofreading boundary drifted");
  check(value.rights.policyAllowsIndependentResearchAndPublication === true
    && value.rights.explicitRawObjectRedistributionLicenseAvailable === false
    && value.rights.explicitDerivedGeometryRedistributionLicenseAvailable === false
    && value.rights.rightsStatus === "ambiguous_for_redistribution"
    && value.rights.deliveryDisposition === "link_only"
    && value.rights.sourceObjectBundled === false, "Fish1 rights boundary drifted");
  validateZeroAdmission(value);
  check(Array.isArray(value.blockers) && value.blockers.length === 5, "Fish1 blocker summary drifted");
}

function validatePkd2l1(value) {
  exactKeys(value, [
    "candidateId", "queueItemIds", "priorityDisposition", "status", "readiness", "source", "rights", "availability",
    "experimentBoundary", "relatedLightSheetEvidence", "admission", "blockers",
  ], "PKD2L1 candidate");
  check(same(value.queueItemIds, ["UPG-188"])
    && value.priorityDisposition === "long_term_queue_only"
    && value.status === "queue_only"
    && value.readiness === "blocked", "PKD2L1 must remain a blocked queue-only candidate");
  check(value.source.species === "Mus musculus"
    && value.source.articleDoi === "10.7554/eLife.83108"
    && value.source.articleUrl === "https://elifesciences.org/articles/83108"
    && value.source.articleApiUrl === "https://api.elifesciences.org/articles/83108"
    && value.source.articleApiReceiptBytes === 247909
    && value.source.articleApiReceiptSha256 === "854963b39bbb091f4cf3a03c470e3a644a69444741b59aa6287b31ed10f97944", "PKD2L1 source receipt drifted");
  check(value.rights.articleLicense === "CC-BY-4.0"
    && value.rights.rawSbfsemObjectAvailable === false
    && value.rights.rawSbfsemObjectSpecificReuseTermsAvailable === false
    && value.rights.currentDisposition === "publication_video_reference_only"
    && value.rights.sourceObjectBundled === false, "PKD2L1 rights boundary drifted");
  const unavailable = [
    "rawSerialEmStackAvailable", "zCalibrationManifestAvailable", "segmentationLabelsAvailable", "mibOrAmiraSourceObjectAvailable",
    "reconstructionMeshAvailable", "skeletonAvailable", "stableObjectIdsAvailable", "objectChecksumsAvailable",
    "eligibleForThreeDimensionalReconstruction",
  ];
  check(value.availability.publicationVideoAvailable === true
    && unavailable.every((key) => value.availability[key] === false), "PKD2L1 raw-object availability blocker drifted");
  check(value.experimentBoundary.mitochondriaConstruct === "COX4-dAPEX2"
    && value.experimentBoundary.vesicleConstruct === "SYP-HRP"
    && value.experimentBoundary.constructsShareExactSample === false
    && value.experimentBoundary.crossSampleFusionAuthorized === false
    && value.experimentBoundary.sameCellMitochondriaVesicleChainAvailable === false, "PKD2L1 separate-experiment boundary drifted");
  check(value.relatedLightSheetEvidence.articleDoi === "10.1038/s42003-025-08559-x"
    && value.relatedLightSheetEvidence.figshareDoi === "10.6084/m9.figshare.29430869"
    && value.relatedLightSheetEvidence.singleSomaIdentificationSupported === false, "PKD2L1 related light-sheet boundary drifted");
  validateZeroAdmission(value);
  check(Array.isArray(value.blockers) && value.blockers.length === 4, "PKD2L1 blocker summary drifted");
}

export function validateOpenSourceModelingAvailabilityAudit(value) {
  exactKeys(value, [
    "documentType", "schemaVersion", "contractId", "releaseTarget", "auditedAt", "auditMode", "scope",
    "releaseDisposition", "candidates", "globalHardBoundaries",
  ], "open-source modeling availability audit");
  check(value.documentType === "open_source_modeling_availability_audit"
    && value.schemaVersion === "0.1.0"
    && value.contractId === "ohri-open-source-modeling-availability-audit-0.1.0"
    && value.releaseTarget === "2.39"
    && value.auditedAt === "2026-09-02"
    && value.auditMode === "availability_receipt_queue_only", "availability-audit identity drifted");
  const disposition = value.releaseDisposition;
  check(disposition.status === "queue_only"
    && disposition.availabilityReceiptOnly === true
    && disposition.currentUiExposure === "none"
    && disposition.candidateCount === 3
    && disposition.queueOnlyCandidateCount === 3
    && disposition.boundedPairAvailabilityReceiptCount === 1, "availability audit must remain a three-candidate queue-only receipt");
  for (const key of [
    "sourceObjectBundleAdmissionCount", "selectedCellJoinCount", "sameCellInternalChainCount", "registrationCount",
    "atlasRegistrationCount", "admittedGeometryCount", "admittedInternalObjectCount", "renderedObjectCount", "currentUiSurfaceCount",
  ]) check(disposition[key] === 0, `releaseDisposition.${key} must remain zero`);
  check(Array.isArray(value.candidates) && value.candidates.length === 3, "availability audit must contain exactly three candidates");
  check(same(value.candidates.map((candidate) => candidate.candidateId), [
    "JANELIA_JRC_MUS_SC_ZP104A_BOUNDED_RAW_NUCLEUS",
    "FISH1_LARVAL_ZEBRAFISH_INTERNAL_DETAIL",
    "PKD2L1_MOUSE_CSF_CONTACTING_NEURON_RAW_SBFSEM_CHAIN",
  ]), "availability candidate roster or order drifted");
  check(value.candidates.every((candidate) => candidate.status === "queue_only"), "every availability candidate must remain queue-only");

  validateJanelia(candidateById(value, "JANELIA_JRC_MUS_SC_ZP104A_BOUNDED_RAW_NUCLEUS"));
  validateFish1(candidateById(value, "FISH1_LARVAL_ZEBRAFISH_INTERNAL_DETAIL"));
  validatePkd2l1(candidateById(value, "PKD2L1_MOUSE_CSF_CONTACTING_NEURON_RAW_SBFSEM_CHAIN"));

  const summed = value.candidates.reduce((summary, candidate) => {
    summary.sourceObjectBundleAdmissionCount += Number(candidate.admission.sourceObjectBundled);
    summary.selectedCellJoinCount += candidate.admission.selectedCellJoinCount;
    summary.sameCellInternalChainCount += candidate.admission.sameCellInternalChainCount;
    summary.registrationCount += candidate.admission.registrationCount;
    summary.atlasRegistrationCount += candidate.admission.atlasRegistrationCount;
    summary.admittedGeometryCount += candidate.admission.admittedGeometryCount;
    summary.admittedInternalObjectCount += candidate.admission.admittedInternalObjectCount;
    summary.renderedObjectCount += candidate.admission.renderedObjectCount;
    summary.currentUiSurfaceCount += Number(candidate.admission.currentUiExposure !== "none");
    return summary;
  }, {
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
  for (const [key, count] of Object.entries(summed)) check(disposition[key] === count, `releaseDisposition.${key} does not match candidate totals`);
  check(Array.isArray(value.globalHardBoundaries)
    && value.globalHardBoundaries.length === 6
    && /without implying neuron or interneuron identity/i.test(value.globalHardBoundaries[1])
    && /no selected-cell join.*atlas registration/i.test(value.globalHardBoundaries[2])
    && /No audited candidate contributes a current UI surface/i.test(value.globalHardBoundaries[3]), "availability-audit hard boundaries drifted");

  return {
    contractId: value.contractId,
    candidateCount: value.candidates.length,
    queueOnlyCandidateCount: value.candidates.filter((candidate) => candidate.status === "queue_only").length,
    boundedPairAvailabilityReceiptCount: Number(Boolean(value.candidates[0].boundedPair)),
    sourceObjectBundleAdmissionCount: summed.sourceObjectBundleAdmissionCount,
    selectedCellJoinCount: summed.selectedCellJoinCount,
    sameCellInternalChainCount: summed.sameCellInternalChainCount,
    registrationCount: summed.registrationCount,
    atlasRegistrationCount: summed.atlasRegistrationCount,
    admittedGeometryCount: summed.admittedGeometryCount,
    admittedInternalObjectCount: summed.admittedInternalObjectCount,
    renderedObjectCount: summed.renderedObjectCount,
    currentUiSurfaceCount: summed.currentUiSurfaceCount,
  };
}

export async function validateOpenSourceModelingAvailabilityAuditFile() {
  return validateOpenSourceModelingAvailabilityAudit(JSON.parse(await readFile(DATA_PATH, "utf8")));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateOpenSourceModelingAvailabilityAuditFile()
    .then((report) => console.log(
      `Open-source modeling availability audit validation passed: ${report.candidateCount} queue-only candidates; ${report.boundedPairAvailabilityReceiptCount} bounded pair receipt; ${report.selectedCellJoinCount} selected-cell joins; ${report.registrationCount} registrations; ${report.currentUiSurfaceCount} UI surfaces`,
    ))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
