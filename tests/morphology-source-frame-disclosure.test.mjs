import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  canonicalMorphologySourceFrameDisclosureSha256,
  validateMorphologySourceFrameDisclosure,
} from "../scripts/validate-morphology-source-frame-disclosure-0.1.mjs";

const CONTRACT_URL = new URL("../data/morphology-source-frame-disclosure-0.1.json", import.meta.url);
const contract = JSON.parse(await readFile(CONTRACT_URL, "utf8"));

function record(neuronId, document = contract) {
  return document.records.find((item) => item.neuronId === neuronId);
}

function mutatedDocument(mutate, { rehash = true } = {}) {
  const document = structuredClone(contract);
  mutate(document);
  if (rehash) document.contractContentSha256 = canonicalMorphologySourceFrameDisclosureSha256(document);
  return document;
}

test("validates the deterministic 142 + 7 source-local disclosure contract", async () => {
  const report = await validateMorphologySourceFrameDisclosure();
  assert.deepEqual(report, {
    releaseId: "ohri-morphology-source-frame-disclosure-0.1.0",
    frozenCensusRecordCount: 142,
    supplementaryRecordCount: 7,
    viewableSourceObjectCount: 149,
    geometry2DCount: 2,
    geometry3DCount: 147,
    preparationContextConflictCount: 5,
    scaleEligibleRecordCount: 149,
    sharedScaleAdmissionCount: 0,
    restoredInVivoDimensionCount: 0,
    inferredMissingCoordinateCount: 0,
    repairedCutNeuriteCount: 0,
    registrationCount: 0,
    contractContentSha256: contract.contractContentSha256,
  });
  assert.equal(canonicalMorphologySourceFrameDisclosureSha256(contract), contract.contractContentSha256);
  assert.deepEqual(contract.records.map((item) => item.neuronId), [...contract.records.map((item) => item.neuronId)].sort((left, right) => left - right));
  assert.equal(new Set(contract.records.map((item) => item.neuronId)).size, 149);
  assert.deepEqual(
    contract.records.filter((item) => item.membership.collection === "supplementary").map((item) => item.neuronId),
    [45674, 45718, 50394, 50408, 50424, 170035, 249676],
  );
});

test("locks source-local scale, source-coordinate, and zero-registration policy", () => {
  assert.deepEqual(contract.displayScalePolicy, {
    algorithmId: "camera_target_plane_source_local_scale_v1",
    sourceCoordinateUnit: "micrometre_reported_by_source",
    measurementPlane: "camera_target_depth",
    targetPixelLength: 92,
    preferredNiceSeries: [1, 2, 5],
    updatesOn: ["initial_fit", "orbit_zoom", "viewport_resize"],
    sourceLocalOnly: true,
    sharedAcrossViewports: false,
    apparentObjectSizeComparable: false,
    restoresInVivoDimensions: false,
    infersMissingCoordinates: false,
    establishesAnatomicalOrientation: false,
    establishesAtlasRegistration: false,
  });
  assert.equal(contract.records.every((item) => item.sourceCoordinates.unit === "micrometre_reported_by_source"), true);
  assert.equal(contract.records.every((item) => item.sourceCoordinates.sourceFrame === "NeuroMorpho_CNG_standardized_local_frame"), true);
  assert.equal(contract.records.every((item) => item.sourceCoordinates.displayTransform.use === "viewer_only"), true);
  assert.equal(contract.records.every((item) => item.sourceCoordinates.sharedScaleAuthority === false), true);
  assert.equal(contract.records.every((item) => item.sourceCoordinates.atlasRegistrationAuthority === false), true);
  assert.equal(contract.scientificBoundary.commonScaleClaim, false);
  assert.equal(contract.scientificBoundary.registrationCount, 0);
});

test("locks representative preparation, shrinkage, truncation, and unresolved-context disclosures", () => {
  const supplementary = record(45674);
  assert.equal(supplementary.membership.collection, "supplementary");
  assert.equal(supplementary.preparation.sourceSectionWording, "50 micrometre · horizontal");
  assert.equal(supplementary.preparation.shrinkage.status, "reported_not_corrected");
  assert.equal(supplementary.preparation.shrinkage.restoredInVivoDimensions, false);
  assert.match(supplementary.preparation.paperPreparationContext, /400 micrometre transverse L5 slices/i);
  assert.match(supplementary.preparation.unresolvedPreparationConflict, /remain distinct/i);
  assert.equal(supplementary.truncation.sourcePhysicalIntegrityVerbatim, "Dendrites & Axon Moderate");
  assert.equal(supplementary.truncation.wholeBiologicalAxonClaim, false);
  assert.equal(supplementary.truncation.cutNeuriteRepairApplied, false);

  const census = record(109005);
  assert.equal(census.membership.collection, "census");
  assert.equal(census.preparation.sourceSectionWording, "300 micrometre · parasagittal");
  assert.equal(census.preparation.shrinkage.status, "not_reported");
  assert.equal(census.preparation.unresolvedPreparationConflict, null);
  assert.equal(census.truncation.moderateOrIncompleteSourceLabel, true);
});

test("locks exactly two planar geometries and positive z extent for all 147 three-dimensional geometries", () => {
  const planar = contract.records.filter((item) => item.preparation.dimensionality === "2D");
  const volumetric = contract.records.filter((item) => item.preparation.dimensionality === "3D");
  assert.deepEqual(planar.map((item) => item.neuronId), [194468, 194469]);
  assert.equal(planar.every((item) => item.sourceCoordinates.extentMicrometre[2] === 0), true);
  assert.equal(planar.every((item) => item.sourceCoordinates.boundsMicrometre.min[2] === item.sourceCoordinates.boundsMicrometre.max[2]), true);
  assert.equal(volumetric.length, 147);
  assert.equal(volumetric.every((item) => item.sourceCoordinates.extentMicrometre[2] > 0), true);
});

test("rejects canonical content drift before accepting a modified contract", async () => {
  const staleHash = mutatedDocument((document) => {
    document.purpose += " Changed without updating the canonical receipt.";
  }, { rehash: false });
  await assert.rejects(
    () => validateMorphologySourceFrameDisclosure(staleHash),
    /canonical content SHA-256 drifted/i,
  );
});

test("rejects a shared scale, apparent-size comparison, or common frame", async () => {
  const sharedScale = mutatedDocument((document) => {
    document.displayScalePolicy.sharedAcrossViewports = true;
    document.displayScalePolicy.apparentObjectSizeComparable = true;
    document.scientificBoundary.commonScaleClaim = true;
    document.scientificBoundary.sharedCoordinateFrameClaim = true;
    document.records[0].sourceCoordinates.sharedScaleAuthority = true;
  });
  await assert.rejects(
    () => validateMorphologySourceFrameDisclosure(sharedScale),
    /schema validation|shared scale|shared coordinate/i,
  );
});

test("rejects restored in-vivo dimensions, inferred coordinates, or repaired neurites", async () => {
  const restored = mutatedDocument((document) => {
    document.displayScalePolicy.restoresInVivoDimensions = true;
    document.summary.restoredInVivoDimensionCount = 1;
    document.scientificBoundary.restoredInVivoDimensionCount = 1;
    document.records[0].preparation.shrinkage.restoredInVivoDimensions = true;
  });
  await assert.rejects(
    () => validateMorphologySourceFrameDisclosure(restored),
    /schema validation|restored in-vivo/i,
  );

  const inferred = mutatedDocument((document) => {
    document.displayScalePolicy.infersMissingCoordinates = true;
    document.summary.inferredMissingCoordinateCount = 1;
    document.scientificBoundary.inferredMissingCoordinateCount = 1;
    document.records[0].truncation.missingCoordinateInferenceApplied = true;
  });
  await assert.rejects(
    () => validateMorphologySourceFrameDisclosure(inferred),
    /schema validation|inferred coordinates|missing coordinates/i,
  );

  const repaired = mutatedDocument((document) => {
    document.summary.repairedCutNeuriteCount = 1;
    document.scientificBoundary.cutNeuriteRepairCount = 1;
    document.records[0].truncation.cutNeuriteRepairApplied = true;
    document.records[0].truncation.wholeBiologicalAxonClaim = true;
  });
  await assert.rejects(
    () => validateMorphologySourceFrameDisclosure(repaired),
    /schema validation|repaired neurites|complete biological axon/i,
  );
});

test("rejects atlas registration and unit or source-frame promotion", async () => {
  const registered = mutatedDocument((document) => {
    document.displayScalePolicy.establishesAtlasRegistration = true;
    document.summary.registrationCount = 1;
    document.scientificBoundary.registrationCount = 1;
    document.records[0].sourceCoordinates.atlasRegistrationAuthority = true;
  });
  await assert.rejects(
    () => validateMorphologySourceFrameDisclosure(registered),
    /schema validation|registration/i,
  );

  const promotedFrame = mutatedDocument((document) => {
    document.records[0].sourceCoordinates.unit = "atlas_micrometre";
    document.records[0].sourceCoordinates.sourceFrame = "common_atlas_frame";
  });
  await assert.rejects(
    () => validateMorphologySourceFrameDisclosure(promotedFrame),
    /schema validation|unit|source frame/i,
  );
});

test("rejects node-bound, display-transform, and 2D z-axis drift", async () => {
  const changedBounds = mutatedDocument((document) => {
    document.records[0].sourceCoordinates.boundsMicrometre.min[0] += 1;
  });
  await assert.rejects(
    () => validateMorphologySourceFrameDisclosure(changedBounds),
    /source bounds|extents|display transform/i,
  );

  const changedTransform = mutatedDocument((document) => {
    document.records[0].sourceCoordinates.displayTransform.scaleViewerUnitPerMicrometre *= 2;
  });
  await assert.rejects(
    () => validateMorphologySourceFrameDisclosure(changedTransform),
    /display transform/i,
  );

  const inferredZ = mutatedDocument((document) => {
    const planar = record(194468, document);
    planar.sourceCoordinates.boundsMicrometre.max[2] = 1;
    planar.sourceCoordinates.extentMicrometre[2] = 1;
  });
  await assert.rejects(
    () => validateMorphologySourceFrameDisclosure(inferredZ),
    /source bounds|extents|2D contract|z extent/i,
  );
});

test("rejects removal of a preparation conflict or rewriting of source integrity", async () => {
  const erasedConflict = mutatedDocument((document) => {
    record(45674, document).preparation.unresolvedPreparationConflict = null;
    document.summary.preparationContextConflictCount = 4;
  });
  await assert.rejects(
    () => validateMorphologySourceFrameDisclosure(erasedConflict),
    /preparation|unresolved conflict|summary/i,
  );

  const rewrittenIntegrity = mutatedDocument((document) => {
    record(45674, document).truncation.sourcePhysicalIntegrityVerbatim = "Complete biological axon";
  });
  await assert.rejects(
    () => validateMorphologySourceFrameDisclosure(rewrittenIntegrity),
    /integrity|truncation/i,
  );
});

test("rejects geometry receipt drift and census/supplementary membership drift", async () => {
  const changedReceipt = mutatedDocument((document) => {
    document.records[0].geometryReceipt.bytes += 1;
  });
  await assert.rejects(
    () => validateMorphologySourceFrameDisclosure(changedReceipt),
    /geometry receipt drifted/i,
  );

  const changedMembership = mutatedDocument((document) => {
    const censusRecord = document.records.find((item) => item.membership.collection === "census");
    censusRecord.membership = {
      collection: "supplementary",
      censusContribution: 0,
      supplementaryContribution: 1,
    };
  });
  await assert.rejects(
    () => validateMorphologySourceFrameDisclosure(changedMembership),
    /membership|denominator|supplementary.*roster/i,
  );
});
