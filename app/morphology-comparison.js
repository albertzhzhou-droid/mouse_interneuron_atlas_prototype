import { buildMorphologyMicrodetailCoverage } from "./morphology-microdetail.js";
import { computeMorphologyViewportScaleBar } from "./morphology-viewport-scale.js";
import { morphologySourceIdentityHierarchy, morphologyComparisonSourceRelationships, validateMorphologyComparisonIdentityReceipt } from "./morphology-source-identity.js";
import { canUseRadiusDerivedSurface } from "./morphology-render-mode.js";
import { morphologyGeometryVerificationReceipt } from "./morphology-geometry-verification.js";

const MORPHOLOGY_SOURCE_FRAME_DISCLOSURE_CONTENT_SHA256 = "cd6b85eb5961e49667bdc126b0230fba35db534fdcc2c8008d5655893978a8ad";

export const MORPHOLOGY_COMPARISON_METRICS = [
  { key: "stemCount", label: "Stem count", unit: "count" },
  { key: "terminalNodeCount", label: "Terminal-node count", unit: "count" },
  { key: "bifurcationNodeCount", label: "Bifurcation-node count", unit: "count" },
  { key: "maximumCentrifugalBranchOrder", label: "Maximum centrifugal branch order", unit: "order" },
  { key: "maximumRootPathLengthMicrometre", label: "Maximum root path", unit: "micrometre" },
  { key: "maximumRootEuclideanDistanceMicrometre", label: "Maximum root Euclidean distance", unit: "micrometre" },
  { key: "neuriteCableLengthMicrometre", label: "Neurite cable length", unit: "micrometre" },
];

export function morphologyShrinkageInterpretation(shrinkage) {
  assert(
    ["not_reported", "reported_not_corrected", "reported_correction_status_unresolved", "source_text_unresolved"].includes(shrinkage?.status),
    "Morphology shrinkage normalized status is invalid",
  );
  if (shrinkage?.status === "reported_not_corrected") return "Reported · not corrected · no numeric correction";
  if (shrinkage?.status === "reported_correction_status_unresolved") return "Reported · correction status unresolved";
  if (shrinkage?.status === "source_text_unresolved") return "Source text unresolved · no numeric correction admitted";
  return "Not reported by source";
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function csvValue(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function comparisonMembership(record) {
  const membership = record.comparisonMembership;
  assert(membership && typeof membership === "object", `Morphology comparison membership ${record.neuronId} is missing`);
  assert(["census", "supplementary"].includes(membership.collection), `Morphology comparison membership ${record.neuronId} has an invalid collection`);
  const isCensus = membership.collection === "census";
  assert(membership.censusContribution === (isCensus ? 1 : 0), `Morphology comparison membership ${record.neuronId} has census denominator drift`);
  assert(membership.supplementaryContribution === (isCensus ? 0 : 1), `Morphology comparison membership ${record.neuronId} has supplementary denominator drift`);
  if (isCensus) {
    assert([
      membership.routeId,
      membership.routeContractPath,
      membership.routeContractSha256,
      membership.routeAssetManifestPath,
      membership.routeAssetManifestSha256,
    ].every((value) => value === null), `Census record ${record.neuronId} cannot inherit supplementary route provenance`);
  } else {
    assert(typeof membership.routeId === "string" && membership.routeId.length > 0, `Supplementary record ${record.neuronId} routeId is missing`);
    assert(typeof membership.routeContractPath === "string" && membership.routeContractPath.length > 0, `Supplementary record ${record.neuronId} route contract is missing`);
    assert(/^[a-f0-9]{64}$/.test(membership.routeContractSha256 ?? ""), `Supplementary record ${record.neuronId} route contract receipt is invalid`);
    assert(typeof membership.routeAssetManifestPath === "string" && membership.routeAssetManifestPath.length > 0, `Supplementary record ${record.neuronId} route asset manifest is missing`);
    assert(/^[a-f0-9]{64}$/.test(membership.routeAssetManifestSha256 ?? ""), `Supplementary record ${record.neuronId} route asset receipt is invalid`);
  }
  return membership;
}

function analysisAssetAuthority(authority, collection) {
  const receipt = authority?.[collection];
  assert(receipt && typeof receipt === "object", `Morphology comparison ${collection} analysis asset receipt is missing`);
  assert(typeof receipt.path === "string" && receipt.path.length > 0, `Morphology comparison ${collection} analysis asset path is missing`);
  assert(/^[a-f0-9]{64}$/.test(receipt.sha256 ?? ""), `Morphology comparison ${collection} analysis asset checksum is invalid`);
  assert(Number.isInteger(receipt.recordCount) && receipt.recordCount > 0, `Morphology comparison ${collection} analysis denominator is invalid`);
  return receipt;
}

function sourceFrameDisclosureAuthority(authority) {
  const receipt = authority?.sourceFrameDisclosureAuthority;
  assert(receipt && typeof receipt === "object", "Morphology source-frame disclosure authority is missing");
  assert(receipt.path === "data/morphology-source-frame-disclosure-0.1.json", "Morphology source-frame disclosure path drifted");
  assert(receipt.contractId === "morphology-source-frame-disclosure-0.1", "Morphology source-frame disclosure identity drifted");
  assert(receipt.schemaVersion === "0.1.0", "Morphology source-frame disclosure schema drifted");
  assert(receipt.contentSha256 === MORPHOLOGY_SOURCE_FRAME_DISCLOSURE_CONTENT_SHA256, "Morphology source-frame disclosure content receipt drifted");
  assert(receipt.recordCount === 149, "Morphology source-frame disclosure denominator drifted");
  return receipt;
}

function sourceFrameDisclosure(record, authority) {
  const disclosure = (authority?.sourceFrameDisclosures ?? []).find((candidate) => candidate?.neuronId === record.neuronId);
  assert(disclosure, `Morphology source-frame disclosure ${record.neuronId} is missing`);
  const membership = comparisonMembership(record);
  assert(disclosure.assetId === record.assetId, `Morphology source-frame disclosure ${record.neuronId} asset identity drifted`);
  assert(
    disclosure.membership?.collection === membership.collection &&
      disclosure.membership?.censusContribution === membership.censusContribution &&
      disclosure.membership?.supplementaryContribution === membership.supplementaryContribution,
    `Morphology source-frame disclosure ${record.neuronId} membership drifted`,
  );
  assert(
    disclosure.geometryReceipt?.path === record.geometry.path &&
      disclosure.geometryReceipt?.bytes === record.geometry.bytes &&
      disclosure.geometryReceipt?.sha256 === record.geometry.sha256 &&
      disclosure.geometryReceipt?.rawSwcSha256 === record.geometry.rawSwcSha256 &&
      disclosure.geometryReceipt?.geometryStatus === "OBS_STANDARDIZED_SOURCE_LOCAL",
    `Morphology source-frame disclosure ${record.neuronId} geometry receipt drifted`,
  );
  assert(disclosure.sourceCoordinates?.unit === "micrometre_reported_by_source", `Morphology source-frame disclosure ${record.neuronId} unit drifted`);
  assert(disclosure.sourceCoordinates?.sourceFrame === record.normalizedMetadata.sourceFrame, `Morphology source-frame disclosure ${record.neuronId} frame drifted`);
  assert(disclosure.sourceCoordinates?.displayTransform?.kind === "soma_centered_uniform_scale", `Morphology source-frame disclosure ${record.neuronId} transform kind drifted`);
  assert(disclosure.sourceCoordinates?.displayTransform?.use === "viewer_only", `Morphology source-frame disclosure ${record.neuronId} transform gained scientific authority`);
  assert(Number.isFinite(disclosure.sourceCoordinates?.displayTransform?.scaleViewerUnitPerMicrometre) && disclosure.sourceCoordinates.displayTransform.scaleViewerUnitPerMicrometre > 0, `Morphology source-frame disclosure ${record.neuronId} transform scale is invalid`);
  assert(disclosure.sourceCoordinates?.sharedScaleAuthority === false, `Morphology source-frame disclosure ${record.neuronId} gained shared scale`);
  assert(disclosure.sourceCoordinates?.atlasRegistrationAuthority === false, `Morphology source-frame disclosure ${record.neuronId} gained registration authority`);
  assert(disclosure.preparation?.dimensionality === record.normalizedMetadata.dimensionality, `Morphology source-frame disclosure ${record.neuronId} dimensionality drifted`);
  assert(disclosure.preparation?.shrinkage?.restoredInVivoDimensions === false, `Morphology source-frame disclosure ${record.neuronId} restored in-vivo dimensions`);
  assert(disclosure.truncation?.wholeBiologicalAxonClaim === false, `Morphology source-frame disclosure ${record.neuronId} gained a complete-axon claim`);
  assert(disclosure.truncation?.cutNeuriteRepairApplied === false, `Morphology source-frame disclosure ${record.neuronId} repaired cut neurites`);
  assert(disclosure.truncation?.missingCoordinateInferenceApplied === false, `Morphology source-frame disclosure ${record.neuronId} inferred missing coordinates`);
  return disclosure;
}

function approximatelyEqual(left, right, tolerance = 1e-9) {
  return Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) <= Math.max(tolerance, Math.abs(right) * tolerance);
}

function finiteVector3(value) {
  return Array.isArray(value) && value.length === 3 && value.every(Number.isFinite);
}

function viewportScaleReceipt(record, disclosure, authority, expectedEffectiveRenderMode, expectedBinding) {
  const receipt = (authority?.runtimeScaleReceipts ?? []).find((candidate) => candidate?.neuronId === record.neuronId);
  assert(receipt, `Morphology viewport scale ${record.neuronId} is missing`);
  assert(expectedBinding, `Morphology viewport binding ${record.neuronId} is missing`);
  assert(expectedBinding.geometrySha256 === record.geometry.sha256, `Morphology viewport binding ${record.neuronId} geometry receipt drifted`);
  assert(expectedBinding.effectiveRenderMode === expectedEffectiveRenderMode, `Morphology viewport binding ${record.neuronId} render mode is stale`);
  assert(typeof expectedBinding.viewportInstanceId === "string" && expectedBinding.viewportInstanceId.length > 0, `Morphology viewport binding ${record.neuronId} instance is invalid`);
  assert(Number.isInteger(expectedBinding.viewportRevision) && expectedBinding.viewportRevision > 0, `Morphology viewport binding ${record.neuronId} revision is invalid`);
  assert(receipt.geometrySha256 === record.geometry.sha256, `Morphology viewport scale ${record.neuronId} geometry receipt drifted`);
  assert(receipt.effectiveRenderMode === expectedEffectiveRenderMode, `Morphology viewport scale ${record.neuronId} render mode is stale`);
  assert(receipt.viewportInstanceId === expectedBinding.viewportInstanceId, `Morphology viewport scale ${record.neuronId} viewport instance is stale`);
  assert(receipt.viewportRevision === expectedBinding.viewportRevision, `Morphology viewport scale ${record.neuronId} viewport revision is stale`);
  assert(receipt.algorithmId === "camera_target_plane_source_local_scale_v1", `Morphology viewport scale ${record.neuronId} algorithm drifted`);
  assert(receipt.measurementPlane === "camera_target_depth", `Morphology viewport scale ${record.neuronId} measurement plane drifted`);
  assert(receipt.sourceCoordinateUnit === "micrometre_reported_by_source", `Morphology viewport scale ${record.neuronId} unit drifted`);
  assert(receipt.sourceLocalOnly === true && receipt.sharedAcrossViewports === false && receipt.apparentObjectSizeComparable === false, `Morphology viewport scale ${record.neuronId} gained cross-object authority`);
  assert(receipt.scaleViewerUnitPerMicrometre === disclosure.sourceCoordinates.displayTransform.scaleViewerUnitPerMicrometre, `Morphology viewport scale ${record.neuronId} transform drifted`);
  assert(receipt.dimensionality === disclosure.preparation.dimensionality, `Morphology viewport scale ${record.neuronId} dimensionality drifted`);
  assert(receipt.sourcePlaneLocked === (receipt.dimensionality === "2D"), `Morphology viewport scale ${record.neuronId} 2D source-plane lock drifted`);
  assert(Number.isFinite(receipt.viewportCssWidth) && receipt.viewportCssWidth > 0, `Morphology viewport scale ${record.neuronId} viewport width is invalid`);
  assert(finiteVector3(receipt.cameraPositionViewerUnit) && finiteVector3(receipt.orbitTargetViewerUnit), `Morphology viewport scale ${record.neuronId} camera vectors are invalid`);
  const cameraOffset = receipt.cameraPositionViewerUnit.map((value, axis) => value - receipt.orbitTargetViewerUnit[axis]);
  const vectorDistance = Math.hypot(...cameraOffset);
  assert(approximatelyEqual(receipt.cameraTargetDistanceViewerUnit, vectorDistance), `Morphology viewport scale ${record.neuronId} camera distance is stale or inconsistent`);
  if (receipt.dimensionality === "2D") {
    assert(
      approximatelyEqual(cameraOffset[0], 0) && approximatelyEqual(cameraOffset[1], 0) && cameraOffset[2] > 0,
      `Morphology viewport scale ${record.neuronId} is not locked straight-on to the 2D source XY plane`,
    );
  }
  const recomputed = computeMorphologyViewportScaleBar({
    cameraTargetDistanceViewerUnit: receipt.cameraTargetDistanceViewerUnit,
    effectiveVerticalFovDegrees: receipt.effectiveVerticalFovDegrees,
    viewportHeightCssPixel: receipt.viewportCssHeight,
    scaleViewerUnitPerMicrometre: receipt.scaleViewerUnitPerMicrometre,
    targetPixelLength: receipt.targetPixelLength,
  });
  for (const key of ["lengthMicrometre", "pixelLength", "micrometrePerCssPixel"]) {
    assert(approximatelyEqual(receipt[key], recomputed[key]), `Morphology viewport scale ${record.neuronId} ${key} is stale or inconsistent`);
  }
  const exportedReceipt = { ...receipt };
  delete exportedReceipt.viewportInstanceId;
  delete exportedReceipt.viewportRevision;
  exportedReceipt.runtimeBindingValidation = "matched_current_viewport_instance_revision";
  return exportedReceipt;
}

export function buildMorphologyComparisonReceipt(
  records,
  analysisRecords,
  requestedModes,
  generatedAt = new Date().toISOString(),
  authority = {},
) {
  assert(Array.isArray(records) && records.length >= 2 && records.length <= 4, "Morphology comparison requires two to four records");
  assert(new Set(records.map((record) => record.neuronId)).size === records.length, "Morphology comparison records must be unique");
  const selectedRuntimeBindings = records.map((record) =>
    (authority.runtimeViewportBindings ?? []).find((binding) => binding?.neuronId === record.neuronId),
  );
  assert(
    selectedRuntimeBindings.every((binding) => binding && typeof binding.viewportInstanceId === "string" && binding.viewportInstanceId.length > 0),
    "Morphology comparison requires one current runtime viewport binding per selected record",
  );
  assert(
    new Set(selectedRuntimeBindings.map((binding) => binding.viewportInstanceId)).size === records.length,
    "Morphology comparison viewport instances must be unique",
  );
  const runtimeBindingById = new Map(selectedRuntimeBindings.map((binding) => [binding.neuronId, binding]));
  const verifiedGeometryById = new Map((authority.runtimeGeometryReceipts ?? []).map((receipt) => [receipt.neuronId, receipt.sha256]));
  const runtimeGeometryById = new Map((authority.runtimeGeometryPayloads ?? []).map(payload => [payload.neuronId, payload.geometry]));
  const analysisById = new Map(analysisRecords.map((record) => [record.neuronId, record]));
  const disclosureAuthority = sourceFrameDisclosureAuthority(authority);
  const sourceObjects = records.map((record, index) => {
    const membership = comparisonMembership(record);
    const disclosure = sourceFrameDisclosure(record, authority);
    const requestedMode = requestedModes[index] === "radius" ? "radius" : "skeleton";
    const radiusAuthorized = canUseRadiusDerivedSurface(record.normalizedMetadata);
    const actualMode = requestedMode === "radius" && radiusAuthorized ? "radius" : "skeleton";
    const viewportScale = viewportScaleReceipt(
      record,
      disclosure,
      authority,
      actualMode,
      runtimeBindingById.get(record.neuronId),
    );
    const analysis = analysisById.get(record.neuronId);
    assert(analysis, `Morphology comparison analysis record ${record.neuronId} is missing`);
    assert(
      analysis.sourceGeometry?.path === record.geometry.path &&
      analysis.sourceGeometry?.sha256 === record.geometry.sha256,
      `Morphology comparison analysis geometry receipt ${record.neuronId} does not match the rendered source object`,
    );
    assert(
      analysis.denominatorBoundary?.analysisUnit === "NeuroMorpho_record" &&
      analysis.denominatorBoundary?.recordCountContribution === 1,
      `Morphology comparison analysis denominator ${record.neuronId} changed`,
    );
    assert(
      verifiedGeometryById.get(record.neuronId) === record.geometry.sha256,
      `Morphology comparison geometry ${record.neuronId} was not checksum verified in this runtime session`,
    );
    const byteReceipt = morphologyGeometryVerificationReceipt(record, disclosure, runtimeGeometryById.get(record.neuronId));
    const analysisAsset = analysisAssetAuthority(authority, membership.collection);
    return {
      slot: String.fromCharCode(65 + index),
      neuronId: record.neuronId,
      assetId: record.assetId,
      sourceIdentity: morphologySourceIdentityHierarchy(record),
      name: record.normalizedMetadata.name,
      sourceFrame: record.normalizedMetadata.sourceFrame,
      dimensionality: record.normalizedMetadata.dimensionality,
      domain: record.normalizedMetadata.domain,
      physicalIntegrity: record.normalizedMetadata.physicalIntegrity,
      sourceLabels: record.normalizedMetadata.cellType,
      sourcePaper: record.sourcePaper,
      membership: {
        collection: membership.collection,
        censusContribution: membership.censusContribution,
        supplementaryContribution: membership.supplementaryContribution,
        routeId: membership.routeId,
        routeContractPath: membership.routeContractPath,
        routeContractSha256: membership.routeContractSha256,
        routeAssetManifestPath: membership.routeAssetManifestPath,
        routeAssetManifestSha256: membership.routeAssetManifestSha256,
      },
      geometry: {
        path: record.geometry.path,
        bytes: record.geometry.bytes,
        sha256: record.geometry.sha256,
        rawSwcSha256: record.geometry.rawSwcSha256,
        geometryStatus: "OBS_STANDARDIZED_SOURCE_LOCAL",
        runtimeVerification: "verified_before_export",
        runtimeByteReceipt: byteReceipt,
      },
      sourceFrameDisclosure: {
        sourceCoordinates: disclosure.sourceCoordinates,
        preparation: disclosure.preparation,
        truncation: disclosure.truncation,
      },
      viewportScale,
      rendering: {
        requestedMode,
        actualMode,
        radiusAuthorized,
        sourceDiameterAvailable: record.normalizedMetadata.sourceDiameterAvailable,
        radiusUnavailableReason: radiusAuthorized ? null : record.normalizedMetadata.dimensionality === "2D" ? "source_labelled_2d_no_depth_or_extrusion" : "official_attributes_report_no_diameter",
        radiusSurfaceStatus: actualMode === "radius" ? "DERIVED_FROM_OBSERVED_RADIUS" : "not_rendered",
        membraneClaim: false,
      },
      analysis: {
        unit: "NeuroMorpho_record",
        asset: analysisAsset,
        sourceGeometry: analysis.sourceGeometry,
        metrics: Object.fromEntries(MORPHOLOGY_COMPARISON_METRICS.map((metric) => [metric.key, analysis.metrics[metric.key]])),
        shollProfile: analysis.metrics.shollProfile,
      },
      registrationCount: 0,
      sameSpecimenInternalStructure: "UNAVAILABLE",
      microdetailCoverage: buildMorphologyMicrodetailCoverage(record),
    };
  });
  const receipt = {
    documentType: "source_local_morphology_comparison_receipt",
    schemaVersion: "0.5.0",
    generatedAt,
    release: "2.91.0-research.1",
    previousReceiptRelease: "2.30.0-research.1",
    relationshipClass: "co_display_only",
    sourceRelationships: morphologyComparisonSourceRelationships(records),
    sourceFrameDisclosureAuthority: disclosureAuthority,
    denominatorPolicy: {
      kind: "declared_release_membership_not_runtime_availability",
      frozenCensusRecordCount: 142,
      supplementaryRecordCount: 7,
      viewableSourceObjectCount: 149,
      combinedCensusClaim: false,
      selectedCensusRecordCount: sourceObjects.reduce((total, record) => total + record.membership.censusContribution, 0),
      selectedSupplementaryRecordCount: sourceObjects.reduce((total, record) => total + record.membership.supplementaryContribution, 0),
    },
    comparisonPolicy: {
      independentSourceFrames: true,
      cameraPolicy: "independent_aspect_safe_auto_fit",
      independentSourceCoordinateScales: true,
      scaleMeasurementPlane: "camera_target_depth",
      sharedScale: false,
      apparentSizeComparable: false,
      registrationCount: 0,
      sameCellIdentity: false,
      sameTypeIdentity: false,
      crossPaperAcquisitionHarmonized: false,
      internalDetailPrimitiveCount: 0,
    },
    runtimeAvailability: authority.runtimeAvailability ?? null,
    sourceObjects,
    forbiddenClaims: [
      "atlas_registration",
      "same_cell_identity",
      "same_type_identity",
      "canonical_morphology",
      "complete_axon",
      "connectivity",
      "same_specimen_internal_structure",
      "apparent_viewport_size_as_physical_scale",
      "shared_scale_across_viewports",
      "restored_in_vivo_dimensions",
      "inferred_missing_coordinates",
      "repaired_cut_neurites",
      "149_record_census",
      "supplementary_record_as_census_member",
    ],
  };
  validateMorphologyComparisonIdentityReceipt(receipt);
  return receipt;
}

export function morphologyComparisonReceiptCsv(receipt) {
  validateMorphologyComparisonIdentityReceipt(receipt);
  const header = ["slot", "neuron_id", "name", "collection", "census_contribution", "supplementary_contribution", "route_id", "route_contract_path", "route_contract_sha256", "route_asset_manifest_path", "route_asset_manifest_sha256", "source_section", "shrinkage_normalized_status", "shrinkage_normalized_interpretation", "shrinkage_reported_raw", "shrinkage_corrected_raw", "source_extent_micrometre", "source_physical_integrity", "axon_field", "scale_algorithm", "scale_measurement_plane", "scale_bar_micrometre", "scale_bar_css_pixel", "micrometre_per_css_pixel", "viewport_css_width", "viewport_css_height", "metric", "value", "unit", "actual_mode", "radius_authorized", "geometry_sha256", "runtime_geometry_verification", "analysis_asset_sha256", "analysis_source_geometry_sha256", "relationship_class", "registration_count"];
  const rows = [header];
  header.push("source_identity_key", "repository_release", "source_namespace", "observation_kind", "native_observation_id", "specimen_status", "specimen_id", "specimen_missing_reason", "section_status", "section_id", "section_missing_reason", "physical_cell_status", "physical_cell_id", "physical_cell_missing_reason", "source_identity_json", "pairwise_source_relationships_json");
  header.push("geometry_runtime_byte_receipt_json");
  for (const sourceObject of receipt.sourceObjects) {
    for (const metric of MORPHOLOGY_COMPARISON_METRICS) {
      rows.push([
        sourceObject.slot,
        sourceObject.neuronId,
        sourceObject.name,
        sourceObject.membership.collection,
        sourceObject.membership.censusContribution,
        sourceObject.membership.supplementaryContribution,
        sourceObject.membership.routeId,
        sourceObject.membership.routeContractPath,
        sourceObject.membership.routeContractSha256,
        sourceObject.membership.routeAssetManifestPath,
        sourceObject.membership.routeAssetManifestSha256,
        sourceObject.sourceFrameDisclosure.preparation.sourceSectionWording,
        sourceObject.sourceFrameDisclosure.preparation.shrinkage.status,
        morphologyShrinkageInterpretation(sourceObject.sourceFrameDisclosure.preparation.shrinkage),
        sourceObject.sourceFrameDisclosure.preparation.shrinkage.reportedRaw,
        sourceObject.sourceFrameDisclosure.preparation.shrinkage.correctedRaw,
        sourceObject.sourceFrameDisclosure.sourceCoordinates.extentMicrometre.join(" x "),
        sourceObject.sourceFrameDisclosure.truncation.sourcePhysicalIntegrityVerbatim,
        sourceObject.sourceFrameDisclosure.truncation.axonField,
        sourceObject.viewportScale.algorithmId,
        sourceObject.viewportScale.measurementPlane,
        sourceObject.viewportScale.lengthMicrometre,
        sourceObject.viewportScale.pixelLength,
        sourceObject.viewportScale.micrometrePerCssPixel,
        sourceObject.viewportScale.viewportCssWidth,
        sourceObject.viewportScale.viewportCssHeight,
        metric.key,
        sourceObject.analysis.metrics[metric.key],
        metric.unit,
        sourceObject.rendering.actualMode,
        sourceObject.rendering.radiusAuthorized,
        sourceObject.geometry.sha256,
        sourceObject.geometry.runtimeVerification,
        sourceObject.analysis.asset.sha256,
        sourceObject.analysis.sourceGeometry.sha256,
        receipt.relationshipClass,
        sourceObject.registrationCount,
        sourceObject.sourceIdentity.key,
        sourceObject.sourceIdentity.releaseId,
        sourceObject.sourceIdentity.namespace,
        sourceObject.sourceIdentity.objectKind,
        sourceObject.sourceIdentity.objectId,
        ...["specimen", "section", "cell"].flatMap(level => [sourceObject.sourceIdentity.nodes[level].status, sourceObject.sourceIdentity.nodes[level].id, sourceObject.sourceIdentity.nodes[level].reason]),
        JSON.stringify(sourceObject.sourceIdentity),
        JSON.stringify(receipt.sourceRelationships.filter(relation => relation.leftKey === sourceObject.sourceIdentity.key || relation.rightKey === sourceObject.sourceIdentity.key)),
        JSON.stringify(sourceObject.geometry.runtimeByteReceipt),
      ]);
    }
  }
  return `${rows.map((row) => row.map(csvValue).join(",")).join("\n")}\n`;
}
