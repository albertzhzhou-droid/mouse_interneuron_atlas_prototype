import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  MORPHOLOGY_COMPARISON_METRICS,
  buildMorphologyComparisonReceipt,
  morphologyComparisonReceiptCsv,
  morphologyShrinkageInterpretation,
} from "../app/morphology-comparison.js";
import { computeMorphologyViewportScaleBar } from "../app/morphology-viewport-scale.js";
import { readVerifiedMorphologyGeometry, verifiedMorphologyGeometryUrl } from "../app/morphology-geometry-verification.js";

const census = JSON.parse(await readFile(new URL("../public/data/neuromorpho_release_8_6_124_census_v1/census-index.json", import.meta.url), "utf8"));
const analysis = JSON.parse(await readFile(new URL("../public/data/neuromorpho_release_8_6_124_analysis_v1/analysis-index.json", import.meta.url), "utf8"));
const supplementary = JSON.parse(await readFile(new URL("../data/supplementary-morphology-comparison-adapter-0.1.json", import.meta.url), "utf8"));
const supplementaryAnalysis = JSON.parse(await readFile(new URL("../public/data/supplementary_morphology_comparison_v1/analysis-delta.json", import.meta.url), "utf8"));
const sourceFrameDisclosureContract = JSON.parse(await readFile(new URL("../data/morphology-source-frame-disclosure-0.1.json", import.meta.url), "utf8"));
const comparisonPanelSource = await readFile(new URL("../app/MorphologyComparePanel.tsx", import.meta.url), "utf8");
const recordDisclosureSource = await readFile(new URL("../app/MorphologyRecordDisclosure.tsx", import.meta.url), "utf8");
const sourceFrameDisclosureById = new Map(sourceFrameDisclosureContract.records.map((record) => [record.neuronId, record]));
function parseCsv(text) {
  const rows = []; let row = [], value = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') { if (quoted && text[i + 1] === '"') { value += '"'; i++; } else quoted = !quoted; }
    else if (ch === "," && !quoted) { row.push(value); value = ""; }
    else if (ch === "\n" && !quoted) { row.push(value); rows.push(row); row = []; value = ""; }
    else value += ch;
  }
  assert.equal(quoted, false); return rows;
}
const records = [109005, 260150, 104003, 108974].map((id) => ({
  ...census.records.find((record) => record.neuronId === id),
  comparisonMembership: {
    collection: "census",
    censusContribution: 1,
    supplementaryContribution: 0,
    routeId: null,
    routeContractPath: null,
    routeContractSha256: null,
    routeAssetManifestPath: null,
    routeAssetManifestSha256: null,
  },
}));
const twoDimensionalRecord = {
  ...census.records.find((record) => record.neuronId === 194468),
  comparisonMembership: {
    collection: "census",
    censusContribution: 1,
    supplementaryContribution: 0,
    routeId: null,
    routeContractPath: null,
    routeContractSha256: null,
    routeAssetManifestPath: null,
    routeAssetManifestSha256: null,
  },
};
const runtimeGeometryById = new Map();
for (const record of [...records, twoDimensionalRecord, { ...census.records.find(row => row.neuronId === 194469), comparisonMembership: twoDimensionalRecord.comparisonMembership }, ...supplementary.records]) {
  const disclosure = sourceFrameDisclosureById.get(record.neuronId);
  const bytes = await readFile(new URL(`../public${verifiedMorphologyGeometryUrl(record, disclosure)}`, import.meta.url));
  const geometry = await readVerifiedMorphologyGeometry(record, disclosure, { fetchImpl: async () => ({ ok: true, status: 200,
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) }) });
  runtimeGeometryById.set(record.neuronId, geometry);
}

function viewportScaleFor(record, disclosure, index) {
  const viewportCssWidth = 680 + index * 37;
  const viewportCssHeight = 420 + index * 29;
  const effectiveVerticalFovDegrees = 38;
  const desiredDistance = 8.5 + index * 1.75;
  const orbitTargetViewerUnit = [index * 0.125, index * -0.25, index * 0.0625];
  const rawOffset = disclosure.preparation.dimensionality === "2D" ? [0, 0, 1] : [1.45, 0.9, 1.65];
  const rawOffsetLength = Math.hypot(...rawOffset);
  const cameraOffset = rawOffset.map((value) => value / rawOffsetLength * desiredDistance);
  const cameraPositionViewerUnit = orbitTargetViewerUnit.map((value, axis) => value + cameraOffset[axis]);
  const cameraTargetDistanceViewerUnit = Math.hypot(...cameraOffset);
  const scaleViewerUnitPerMicrometre = disclosure.sourceCoordinates.displayTransform.scaleViewerUnitPerMicrometre;
  const computed = computeMorphologyViewportScaleBar({
    cameraTargetDistanceViewerUnit,
    effectiveVerticalFovDegrees,
    viewportHeightCssPixel: viewportCssHeight,
    scaleViewerUnitPerMicrometre,
    targetPixelLength: sourceFrameDisclosureContract.displayScalePolicy.targetPixelLength,
  });
  return {
    ...computed,
    neuronId: record.neuronId,
    geometrySha256: record.geometry.sha256,
    viewportCssWidth,
    viewportCssHeight,
    effectiveVerticalFovDegrees,
    cameraTargetDistanceViewerUnit,
    cameraPositionViewerUnit,
    orbitTargetViewerUnit,
    scaleViewerUnitPerMicrometre,
    dimensionality: disclosure.preparation.dimensionality,
    sourcePlaneLocked: disclosure.preparation.dimensionality === "2D",
    effectiveRenderMode: "skeleton",
    viewportInstanceId: `test-viewport-${record.neuronId}-${index}`,
    viewportRevision: 3 + index,
  };
}

function effectiveModeFor(record, requestedMode) {
  return requestedMode === "radius" && record.normalizedMetadata.dimensionality === "3D" && record.normalizedMetadata.sourceDiameterAvailable === true
    ? "radius"
    : "skeleton";
}

function authorityFor(selectedRecords, { includeSupplementary = false, modes = [] } = {}) {
  const sourceFrameDisclosures = selectedRecords.map((record) => {
    const disclosure = sourceFrameDisclosureById.get(record.neuronId);
    assert.ok(disclosure, `missing source-frame disclosure fixture for NMO ${record.neuronId}`);
    return structuredClone(disclosure);
  });
  const runtimeScaleReceipts = selectedRecords.map((record, index) => {
    const receipt = viewportScaleFor(record, sourceFrameDisclosures[index], index);
    receipt.effectiveRenderMode = effectiveModeFor(record, modes[index]);
    return receipt;
  });
  return {
    census: {
      path: "/data/neuromorpho_release_8_6_124_analysis_v1/analysis-index.json",
      sha256: "b1cf19da5406d1cbc95f2926fb4b721f690e91857f0ad1468fc8ec8517333905",
      recordCount: 142,
    },
    supplementary: includeSupplementary ? {
      path: "/data/supplementary_morphology_comparison_v1/analysis-delta.json",
      sha256: "b2f90156d9e9eb86cc2dfc72f05a140c6942c802a492274472c86a0c7a29d0df",
      recordCount: 7,
    } : null,
    runtimeGeometryReceipts: selectedRecords.map((record) => ({ neuronId: record.neuronId, sha256: record.geometry.sha256 })),
    runtimeGeometryPayloads: selectedRecords.map(record => ({ neuronId: record.neuronId, geometry: runtimeGeometryById.get(record.neuronId) })),
    sourceFrameDisclosureAuthority: {
      path: "data/morphology-source-frame-disclosure-0.1.json",
      contractId: sourceFrameDisclosureContract.contractId,
      releaseId: sourceFrameDisclosureContract.releaseId,
      schemaVersion: sourceFrameDisclosureContract.schemaVersion,
      contentSha256: sourceFrameDisclosureContract.contractContentSha256,
      recordCount: sourceFrameDisclosureContract.records.length,
    },
    sourceFrameDisclosures,
    runtimeScaleReceipts,
    runtimeViewportBindings: runtimeScaleReceipts.map((receipt) => ({
      neuronId: receipt.neuronId,
      geometrySha256: receipt.geometrySha256,
      effectiveRenderMode: receipt.effectiveRenderMode,
      viewportInstanceId: receipt.viewportInstanceId,
      viewportRevision: receipt.viewportRevision,
    })),
    runtimeAvailability: {
      censusIndexStatus: "verified",
      supplementaryAdapterStatus: "verified",
      indexedCensusRecordCount: 142,
      indexedSupplementaryRecordCount: 7,
    },
  };
}

function recomputeScaleReceipt(receipt) {
  Object.assign(receipt, computeMorphologyViewportScaleBar({
    cameraTargetDistanceViewerUnit: receipt.cameraTargetDistanceViewerUnit,
    effectiveVerticalFovDegrees: receipt.effectiveVerticalFovDegrees,
    viewportHeightCssPixel: receipt.viewportCssHeight,
    scaleViewerUnitPerMicrometre: receipt.scaleViewerUnitPerMicrometre,
    targetPixelLength: receipt.targetPixelLength,
  }));
}

test("builds a replayable co-display-only receipt for two to four real records", () => {
  const requestedModes = ["radius", "radius", "skeleton", "radius"];
  const receipt = buildMorphologyComparisonReceipt(records, analysis.records, requestedModes, "2026-08-30T00:00:00.000Z", authorityFor(records, { modes: requestedModes }));
  assert.equal(receipt.documentType, "source_local_morphology_comparison_receipt");
  assert.equal(receipt.release, "2.91.0-research.1");
  assert.equal(receipt.previousReceiptRelease, "2.30.0-research.1");
  assert.equal(receipt.schemaVersion, "0.5.0");
  assert.equal(receipt.relationshipClass, "co_display_only");
  assert.deepEqual(receipt.sourceFrameDisclosureAuthority, {
    path: "data/morphology-source-frame-disclosure-0.1.json",
    contractId: "morphology-source-frame-disclosure-0.1",
    releaseId: sourceFrameDisclosureContract.releaseId,
    schemaVersion: "0.1.0",
    contentSha256: sourceFrameDisclosureContract.contractContentSha256,
    recordCount: 149,
  });
  assert.deepEqual(receipt.denominatorPolicy, {
    kind: "declared_release_membership_not_runtime_availability",
    frozenCensusRecordCount: 142,
    supplementaryRecordCount: 7,
    viewableSourceObjectCount: 149,
    combinedCensusClaim: false,
    selectedCensusRecordCount: 4,
    selectedSupplementaryRecordCount: 0,
  });
  assert.equal(receipt.comparisonPolicy.independentSourceCoordinateScales, true);
  assert.equal(receipt.comparisonPolicy.scaleMeasurementPlane, "camera_target_depth");
  assert.equal(receipt.comparisonPolicy.sharedScale, false);
  assert.equal(receipt.comparisonPolicy.apparentSizeComparable, false);
  assert.equal(receipt.comparisonPolicy.registrationCount, 0);
  assert.equal(receipt.comparisonPolicy.internalDetailPrimitiveCount, 0);
  assert.equal(receipt.sourceObjects[0].microdetailCoverage.axes.length, 13);
  assert.equal(receipt.sourceObjects[0].microdetailCoverage.sameSpecimenInternalPrimitiveCount, 0);
  assert.equal(receipt.sourceObjects[0].microdetailCoverage.coverageStatus, "verified");
  assert.deepEqual(receipt.sourceObjects[0].microdetailCoverage.sourceRecordLocators.dois, records[0].sourcePaper.dois);
  assert.equal(receipt.sourceObjects.length, 4);
  assert.deepEqual(receipt.sourceObjects.map((record) => record.slot), ["A", "B", "C", "D"]);
  assert.ok(receipt.sourceObjects.every((record) => record.geometry.geometryStatus === "OBS_STANDARDIZED_SOURCE_LOCAL"));
  assert.ok(receipt.sourceObjects.every((record) => record.geometry.runtimeVerification === "verified_before_export"));
  assert.ok(receipt.sourceObjects.every((record) => record.analysis.asset.sha256 === "b1cf19da5406d1cbc95f2926fb4b721f690e91857f0ad1468fc8ec8517333905"));
  assert.ok(receipt.sourceObjects.every((record) => record.analysis.sourceGeometry.sha256 === record.geometry.sha256));
  assert.ok(receipt.sourceObjects.every((record) => record.membership.collection === "census"));
  assert.ok(receipt.sourceObjects.every((record) => record.sourceFrameDisclosure.sourceCoordinates.unit === "micrometre_reported_by_source"));
  assert.ok(receipt.sourceObjects.every((record) => record.sourceFrameDisclosure.sourceCoordinates.sharedScaleAuthority === false));
  assert.ok(receipt.sourceObjects.every((record) => record.sourceFrameDisclosure.preparation.shrinkage.restoredInVivoDimensions === false));
  assert.ok(receipt.sourceObjects.every((record) => record.viewportScale.geometrySha256 === record.geometry.sha256));
  assert.ok(receipt.sourceObjects.every((record) => record.viewportScale.sourceLocalOnly === true && record.viewportScale.sharedAcrossViewports === false));
  assert.ok(receipt.sourceObjects.every((record) => record.viewportScale.sourcePlaneLocked === false));
  assert.ok(receipt.sourceObjects.every((record) => record.viewportScale.runtimeBindingValidation === "matched_current_viewport_instance_revision"));
  assert.ok(receipt.sourceObjects.every((record) => !Object.hasOwn(record.viewportScale, "viewportInstanceId") && !Object.hasOwn(record.viewportScale, "viewportRevision")));
  assert.doesNotMatch(JSON.stringify(receipt), /test-viewport-/);
  assert.ok(receipt.sourceObjects.every((record) => Object.keys(record.analysis.metrics).length === MORPHOLOGY_COMPARISON_METRICS.length));
});

test("fails official No Diameter records closed to observed centerlines", () => {
  const selected = records.slice(0, 2);
  const requestedModes = ["radius", "radius"];
  const receipt = buildMorphologyComparisonReceipt(selected, analysis.records, requestedModes, "2026-08-30T00:00:00.000Z", authorityFor(selected, { modes: requestedModes }));
  assert.equal(receipt.sourceObjects[0].rendering.actualMode, "radius");
  assert.equal(receipt.sourceObjects[0].rendering.radiusSurfaceStatus, "DERIVED_FROM_OBSERVED_RADIUS");
  assert.equal(receipt.sourceObjects[1].rendering.requestedMode, "radius");
  assert.equal(receipt.sourceObjects[1].rendering.actualMode, "skeleton");
  assert.equal(receipt.sourceObjects[1].rendering.radiusUnavailableReason, "official_attributes_report_no_diameter");
  assert.equal(receipt.sourceObjects[1].rendering.membraneClaim, false);
  assert.equal(receipt.sourceObjects[0].viewportScale.effectiveRenderMode, "radius");
  assert.equal(receipt.sourceObjects[1].viewportScale.effectiveRenderMode, "skeleton");
});

test("rejects duplicate, undersized, oversized, or analysis-orphan comparisons", () => {
  assert.throws(() => buildMorphologyComparisonReceipt(records.slice(0, 1), analysis.records, ["skeleton"]), /two to four/);
  assert.throws(() => buildMorphologyComparisonReceipt([...records, records[0]], analysis.records, []), /two to four/);
  assert.throws(() => buildMorphologyComparisonReceipt([records[0], records[0]], analysis.records, []), /unique/);
  assert.throws(() => buildMorphologyComparisonReceipt(records.slice(0, 2), analysis.records.filter((record) => record.neuronId !== 260150), [], undefined, authorityFor(records.slice(0, 2))), /260150 is missing/);
  const missingMembership = [{ ...records[0], comparisonMembership: undefined }, records[1]];
  assert.throws(() => buildMorphologyComparisonReceipt(missingMembership, analysis.records, [], undefined, authorityFor(missingMembership)), /membership 109005 is missing/);
  assert.throws(() => buildMorphologyComparisonReceipt(records.slice(0, 2), analysis.records, [], undefined, { ...authorityFor(records.slice(0, 2)), runtimeGeometryReceipts: [] }), /not checksum verified/);
  const mismatchedAnalysis = analysis.records.map((record) => record.neuronId === records[0].neuronId
    ? { ...record, sourceGeometry: { ...record.sourceGeometry, sha256: "0".repeat(64) } }
    : record);
  assert.throws(() => buildMorphologyComparisonReceipt(records.slice(0, 2), mismatchedAnalysis, [], undefined, authorityFor(records.slice(0, 2))), /does not match the rendered source object/);
});

test("fails source-frame, geometry, scale, and restoration authority mutations closed", () => {
  const selected = records.slice(0, 2);
  const build = (authority) => buildMorphologyComparisonReceipt(selected, analysis.records, ["skeleton", "skeleton"], undefined, authority);

  const missingDisclosure = authorityFor(selected);
  missingDisclosure.sourceFrameDisclosures = missingDisclosure.sourceFrameDisclosures.slice(1);
  assert.throws(() => build(missingDisclosure), /source-frame disclosure 109005 is missing/);

  const wrongContentReceipt = authorityFor(selected);
  wrongContentReceipt.sourceFrameDisclosureAuthority.contentSha256 = "0".repeat(64);
  assert.throws(() => build(wrongContentReceipt), /content receipt drifted/);

  const sharedScale = authorityFor(selected);
  sharedScale.runtimeScaleReceipts[0].sharedAcrossViewports = true;
  assert.throws(() => build(sharedScale), /gained cross-object authority/);

  const disclosureSharedScale = authorityFor(selected);
  disclosureSharedScale.sourceFrameDisclosures[0].sourceCoordinates.sharedScaleAuthority = true;
  assert.throws(() => build(disclosureSharedScale), /gained shared scale/);

  const staleScale = authorityFor(selected);
  staleScale.runtimeScaleReceipts[0].pixelLength += 1;
  assert.throws(() => build(staleScale), /pixelLength is stale or inconsistent/);

  const wrongDisclosureGeometry = authorityFor(selected);
  wrongDisclosureGeometry.sourceFrameDisclosures[0].geometryReceipt.sha256 = "0".repeat(64);
  assert.throws(() => build(wrongDisclosureGeometry), /geometry receipt drifted/);

  const wrongScaleGeometry = authorityFor(selected);
  wrongScaleGeometry.runtimeScaleReceipts[0].geometrySha256 = "0".repeat(64);
  assert.throws(() => build(wrongScaleGeometry), /geometry receipt drifted/);

  const staleButSelfConsistentScale = authorityFor(selected);
  staleButSelfConsistentScale.runtimeScaleReceipts[0].viewportInstanceId = "retired-viewport-instance";
  assert.throws(() => build(staleButSelfConsistentScale), /viewport instance is stale/);

  const staleRevisionScale = authorityFor(selected);
  staleRevisionScale.runtimeScaleReceipts[0].viewportRevision -= 1;
  assert.throws(() => build(staleRevisionScale), /viewport revision is stale/);

  const staleModeScale = authorityFor(selected, { modes: ["radius", "skeleton"] });
  staleModeScale.runtimeScaleReceipts[0].effectiveRenderMode = "skeleton";
  assert.throws(
    () => buildMorphologyComparisonReceipt(selected, analysis.records, ["radius", "skeleton"], undefined, staleModeScale),
    /render mode is stale/,
  );

  const duplicateViewportInstance = authorityFor(selected);
  duplicateViewportInstance.runtimeViewportBindings[1].viewportInstanceId = duplicateViewportInstance.runtimeViewportBindings[0].viewportInstanceId;
  assert.throws(() => build(duplicateViewportInstance), /viewport instances must be unique/);

  const restoredInVivo = authorityFor(selected);
  restoredInVivo.sourceFrameDisclosures[0].preparation.shrinkage.restoredInVivoDimensions = true;
  assert.throws(() => build(restoredInVivo), /restored in-vivo dimensions/);
});

test("requires a truthful straight-on source-plane lock for 2D records", () => {
  const selected = [records[0], twoDimensionalRecord];
  const selectedAnalysis = selected.map((record) => analysis.records.find((candidate) => candidate.neuronId === record.neuronId));
  const valid = buildMorphologyComparisonReceipt(selected, selectedAnalysis, ["skeleton", "skeleton"], undefined, authorityFor(selected));
  assert.equal(valid.sourceObjects[1].dimensionality, "2D");
  assert.equal(valid.sourceObjects[1].viewportScale.sourcePlaneLocked, true);
  assert.deepEqual(
    valid.sourceObjects[1].viewportScale.cameraPositionViewerUnit.slice(0, 2),
    valid.sourceObjects[1].viewportScale.orbitTargetViewerUnit.slice(0, 2),
  );

  const unlocked = authorityFor(selected);
  unlocked.runtimeScaleReceipts[1].sourcePlaneLocked = false;
  assert.throws(
    () => buildMorphologyComparisonReceipt(selected, selectedAnalysis, ["skeleton", "skeleton"], undefined, unlocked),
    /2D source-plane lock drifted/,
  );

  const obliqueButClaimedLocked = authorityFor(selected);
  const obliqueReceipt = obliqueButClaimedLocked.runtimeScaleReceipts[1];
  obliqueReceipt.cameraPositionViewerUnit[0] += 1;
  obliqueReceipt.cameraTargetDistanceViewerUnit = Math.hypot(
    ...obliqueReceipt.cameraPositionViewerUnit.map((value, axis) => value - obliqueReceipt.orbitTargetViewerUnit[axis]),
  );
  recomputeScaleReceipt(obliqueReceipt);
  assert.throws(
    () => buildMorphologyComparisonReceipt(selected, selectedAnalysis, ["skeleton", "skeleton"], undefined, obliqueButClaimedLocked),
    /not locked straight-on to the 2D source XY plane/,
  );
});

test("both deposited 2D records reject radius extrusion while retaining native diameter data", () => {
  for (const neuronId of [194468, 194469]) {
    const planar = { ...census.records.find(record => record.neuronId === neuronId), comparisonMembership: twoDimensionalRecord.comparisonMembership };
    assert.equal(planar.normalizedMetadata.dimensionality, "2D");
    assert.equal(planar.normalizedMetadata.sourceDiameterAvailable, true);
    const selected = [planar, records[0]], modes = ["radius", "radius"];
    const authority = authorityFor(selected, { modes });
    const receipt = buildMorphologyComparisonReceipt(selected, analysis.records, modes, undefined, authority);
    const source = receipt.sourceObjects[0];
    assert.deepEqual(source.rendering, {
      requestedMode: "radius", actualMode: "skeleton", radiusAuthorized: false,
      sourceDiameterAvailable: true, radiusUnavailableReason: "source_labelled_2d_no_depth_or_extrusion",
      radiusSurfaceStatus: "not_rendered", membraneClaim: false,
    });
    assert.equal(source.viewportScale.effectiveRenderMode, "skeleton");
    assert.equal(source.viewportScale.sourcePlaneLocked, true);
    assert.equal(source.sourceFrameDisclosure.sourceCoordinates.extentMicrometre[2], 0);
    assert.equal(source.geometry.sha256, planar.geometry.sha256);
    assert.equal(source.microdetailCoverage.axes.find(axis => axis.id === "diameter_input").status, "OBS");
    assert.equal(source.microdetailCoverage.axes.find(axis => axis.id === "radius_derived_surface").status, "UNAVAILABLE");
    assert.equal(receipt.sourceObjects[1].rendering.actualMode, "radius");
    const [header, ...rows] = parseCsv(morphologyComparisonReceiptCsv(receipt));
    for (const row of rows.filter(row => row[header.indexOf("neuron_id")] === String(neuronId))) {
      assert.equal(row[header.indexOf("actual_mode")], "skeleton");
      assert.equal(row[header.indexOf("radius_authorized")], "false");
    }
    const forbiddenRuntime = authorityFor(selected, { modes });
    forbiddenRuntime.runtimeScaleReceipts[0].effectiveRenderMode = "radius";
    forbiddenRuntime.runtimeViewportBindings[0].effectiveRenderMode = "radius";
    assert.throws(() => buildMorphologyComparisonReceipt(selected, analysis.records, modes, undefined, forbiddenRuntime), /render mode is stale/);
  }
});

test("exports exact metrics with authority and relationship columns", () => {
  const selected = records.slice(0, 2);
  const receipt = buildMorphologyComparisonReceipt(selected, analysis.records, ["skeleton", "skeleton"], "2026-08-30T00:00:00.000Z", authorityFor(selected));
  const csv = morphologyComparisonReceiptCsv(receipt);
  assert.match(csv, /slot,neuron_id,name,collection,census_contribution,supplementary_contribution,route_id,route_contract_path,route_contract_sha256,route_asset_manifest_path,route_asset_manifest_sha256,source_section,shrinkage_normalized_status,shrinkage_normalized_interpretation,shrinkage_reported_raw,shrinkage_corrected_raw,source_extent_micrometre,source_physical_integrity,axon_field,scale_algorithm,scale_measurement_plane,scale_bar_micrometre,scale_bar_css_pixel,micrometre_per_css_pixel,viewport_css_width,viewport_css_height,metric,value,unit,actual_mode,radius_authorized,geometry_sha256,runtime_geometry_verification,analysis_asset_sha256,analysis_source_geometry_sha256,relationship_class,registration_count/);
  assert.equal(csv.trim().split("\n").length, 1 + 2 * MORPHOLOGY_COMPARISON_METRICS.length);
  assert.match(csv, /300 micrometre · parasagittal,not_reported,Not reported by source,Not reported,/);
  assert.match(csv, /camera_target_plane_source_local_scale_v1,camera_target_depth/);
  assert.match(csv, /co_display_only,0/);
  const [header, ...rows] = parseCsv(csv);
  for (const row of rows) {
    assert.equal(row.length, header.length);
    const values = Object.fromEntries(header.map((key, index) => [key, row[index]]));
    const original = receipt.sourceObjects.find(object => String(object.neuronId) === values.neuron_id);
    assert.deepEqual(JSON.parse(values.source_identity_json), original.sourceIdentity);
    assert.equal(values.source_identity_key, original.sourceIdentity.key);
    assert.equal(values.physical_cell_id, ""); assert.equal(values.physical_cell_status, "unknown");
    assert.equal(values.repository_release, "8.6.124");
    assert.deepEqual(JSON.parse(values.pairwise_source_relationships_json), receipt.sourceRelationships);
    assert.deepEqual(JSON.parse(values.geometry_runtime_byte_receipt_json), original.geometry.runtimeByteReceipt);
  }
});

test("scientific comparison export requires the actual private byte-verified payloads", () => {
  const selected = records.slice(0, 2), build = authority => buildMorphologyComparisonReceipt(selected, analysis.records, [], undefined, authority);
  const valid = build(authorityFor(selected));
  assert.equal(valid.sourceObjects[0].geometry.runtimeByteReceipt.sha256, selected[0].geometry.sha256);
  assert.equal(valid.sourceObjects[0].geometry.runtimeByteReceipt.scope, "standardized_geometry_bytes_only_raw_swc_hash_declared");
  for (const mutate of [
    authority => { delete authority.runtimeGeometryPayloads; },
    authority => { authority.runtimeGeometryPayloads[0].geometry = structuredClone(authority.runtimeGeometryPayloads[0].geometry); },
    authority => { authority.runtimeGeometryPayloads[0].geometry = runtimeGeometryById.get(selected[1].neuronId); },
  ]) {
    const authority = authorityFor(selected); mutate(authority);
    assert.throws(() => build(authority), /no runtime byte-verification receipt|current source differs/);
  }
});

test("normalizes shrinkage interpretation without altering raw source capitalization", () => {
  const lowerCaseRaw = sourceFrameDisclosureById.get(109005).preparation.shrinkage;
  const titleCaseRaw = sourceFrameDisclosureById.get(104003).preparation.shrinkage;
  const reportedRaw = sourceFrameDisclosureById.get(45674).preparation.shrinkage;
  assert.equal(morphologyShrinkageInterpretation(lowerCaseRaw), "Not reported by source");
  assert.equal(morphologyShrinkageInterpretation(titleCaseRaw), "Not reported by source");
  assert.equal(morphologyShrinkageInterpretation(reportedRaw), "Reported · not corrected · no numeric correction");
  assert.equal(lowerCaseRaw.reportedRaw, "Not reported");
  assert.equal(titleCaseRaw.reportedRaw, "Not Reported");
  assert.equal(reportedRaw.correctedRaw, "Not Corrected");
  assert.throws(() => morphologyShrinkageInterpretation({ status: "unknown" }), /normalized status is invalid/);
});

test("exports a real mixed census-plus-supplementary receipt without merging denominators", () => {
  const mixed = [records[0], supplementary.records.find((record) => record.neuronId === 45674)];
  const mixedAnalysis = [
    analysis.records.find((record) => record.neuronId === records[0].neuronId),
    supplementaryAnalysis.records.find((record) => record.neuronId === 45674),
  ];
  const receipt = buildMorphologyComparisonReceipt(
    mixed,
    mixedAnalysis,
    ["skeleton", "radius"],
    "2026-08-31T00:00:00.000Z",
    authorityFor(mixed, { includeSupplementary: true, modes: ["skeleton", "radius"] }),
  );
  assert.equal(receipt.denominatorPolicy.selectedCensusRecordCount, 1);
  assert.equal(receipt.denominatorPolicy.selectedSupplementaryRecordCount, 1);
  assert.deepEqual(receipt.sourceObjects.map((record) => record.membership.collection), ["census", "supplementary"]);
  assert.equal(receipt.sourceObjects[1].analysis.asset.sha256, "b2f90156d9e9eb86cc2dfc72f05a140c6942c802a492274472c86a0c7a29d0df");
  assert.equal(receipt.sourceObjects[1].membership.routeId, "mouse.sc.renshaw_l5_lamina_vii.observed.nmo_45674");
  assert.equal(receipt.sourceObjects[1].sourceFrameDisclosure.preparation.shrinkage.reportedRaw, "Reported");
  assert.equal(receipt.sourceObjects[1].sourceFrameDisclosure.preparation.shrinkage.correctedRaw, "Not Corrected");
  const csv = morphologyComparisonReceiptCsv(receipt);
  assert.match(csv, /reported_not_corrected,Reported · not corrected · no numeric correction,Reported,Not Corrected/);
});

test("shows raw shrinkage fields and invalidates runtime viewport authority on mode or selection changes", () => {
  assert.match(comparisonPanelSource, /<MorphologyRecordDisclosure/);
  assert.match(recordDisclosureSource, /<b>Normalized status<\/b>\{morphologyShrinkageInterpretation/);
  assert.match(recordDisclosureSource, /<b>reportedRaw<\/b>\{rawSourceText\(disclosure\.preparation\.shrinkage\.reportedRaw\)\}/);
  assert.match(recordDisclosureSource, /<b>correctedRaw<\/b>\{rawSourceText\(disclosure\.preparation\.shrinkage\.correctedRaw\)\}/);
  assert.match(comparisonPanelSource, /const updateMode[\s\S]*invalidateViewportRuntime\(\[neuronId\]\);[\s\S]*const next = modes/);
  assert.match(comparisonPanelSource, /const updateRecord[\s\S]*invalidateViewportRuntime\(\[comparisonIds\[index\]\]\);[\s\S]*onComparisonChange\(next\)/);
  assert.match(comparisonPanelSource, /runtimeViewportBindings: selectedRecords\.map/);
});
