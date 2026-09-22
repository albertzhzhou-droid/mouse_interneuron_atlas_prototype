#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BUILDER_PATH = fileURLToPath(import.meta.url);
const CENSUS_PATH = path.join(PROJECT_ROOT, "public/data/neuromorpho_release_8_6_124_census_v1/census-index.json");
const CENSUS_PUBLIC_ROOT = path.dirname(CENSUS_PATH);
const SUPPLEMENTARY_PATH = path.join(PROJECT_ROOT, "data/supplementary-morphology-comparison-adapter-0.1.json");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "data/morphology-source-frame-disclosure-0.1.json");

const EXPECTED_SUPPLEMENTARY_IDS = Object.freeze([45674, 45718, 50394, 50408, 50424, 170035, 249676]);
const SOURCE_UNIT = "micrometre_reported_by_source";
const SCALE_ALGORITHM_ID = "camera_target_plane_source_local_scale_v1";

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  }
  return value;
}

function canonicalContentSha256(document) {
  const copy = structuredClone(document);
  delete copy.contractContentSha256;
  return sha256(Buffer.from(JSON.stringify(stableValue(copy)), "utf8"));
}

function serialize(document) {
  return `${JSON.stringify(document, null, 2)}\n`;
}

function same(left, right) {
  return JSON.stringify(stableValue(left)) === JSON.stringify(stableValue(right));
}

function firstDefined(object, keys) {
  for (const key of keys) {
    if (Object.hasOwn(object, key) && object[key] !== null && object[key] !== undefined) return object[key];
  }
  return null;
}

function textOrNull(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text && text.toLowerCase() !== "not reported" ? text : null;
}

function rawTextOrNull(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
}

function finiteNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeAge(record) {
  const metadata = record.officialMetadata ?? {};
  const explicit = metadata.numericAge ?? record.missingness?.numericAge?.value ?? null;
  if (explicit && typeof explicit === "object") {
    const minimum = finiteNumberOrNull(explicit.minimum);
    const maximum = finiteNumberOrNull(explicit.maximum);
    const scale = textOrNull(explicit.scale);
    if (minimum !== null || maximum !== null) {
      return { status: "reported", minimum, maximum, scale };
    }
  }
  const minimum = finiteNumberOrNull(firstDefined(metadata, ["min_age", "minimumAge"]));
  const maximum = finiteNumberOrNull(firstDefined(metadata, ["max_age", "maximumAge"]));
  if (minimum !== null || maximum !== null) {
    return {
      status: "reported",
      minimum,
      maximum,
      scale: textOrNull(firstDefined(metadata, ["age_scale", "ageScale"])),
    };
  }
  return { status: "unavailable", minimum: null, maximum: null, scale: null };
}

function normalizeShrinkage(metadata) {
  const reportedRaw = rawTextOrNull(firstDefined(metadata, ["shrinkage_reported", "shrinkageReported"]));
  const correctedRaw = rawTextOrNull(firstDefined(metadata, ["shrinkage_corrected", "shrinkageCorrected"]));
  const reportedLower = reportedRaw?.toLowerCase() ?? "";
  const correctedLower = correctedRaw?.toLowerCase() ?? "";
  let status = "not_reported";
  if (reportedLower === "reported" && correctedLower.includes("not corrected")) status = "reported_not_corrected";
  else if (reportedLower === "reported") status = "reported_correction_status_unresolved";
  else if (reportedLower === "not reported" && !correctedRaw) status = "not_reported";
  else if (reportedRaw || correctedRaw) status = "source_text_unresolved";
  return {
    status,
    reportedRaw,
    correctedRaw,
    reportedValue: finiteNumberOrNull(firstDefined(metadata, ["reported_value", "reportedValue"])),
    reportedXY: finiteNumberOrNull(firstDefined(metadata, ["reported_xy", "reportedXY"])),
    reportedZ: finiteNumberOrNull(firstDefined(metadata, ["reported_z", "reportedZ"])),
    correctedValue: finiteNumberOrNull(firstDefined(metadata, ["corrected_value", "correctedValue"])),
    correctedXY: finiteNumberOrNull(firstDefined(metadata, ["corrected_xy", "correctedXY"])),
    correctedZ: finiteNumberOrNull(firstDefined(metadata, ["corrected_z", "correctedZ"])),
    restoredInVivoDimensions: false,
  };
}

function preparationDisclosure(record) {
  const metadata = record.officialMetadata ?? {};
  const direction = textOrNull(firstDefined(metadata, [
    "repositorySlicingDirection",
    "slicingDirection",
    "slicing_direction",
  ]));
  const thickness = finiteNumberOrNull(firstDefined(metadata, [
    "repositorySlicingThicknessMicrometre",
    "slicingThicknessMicrometre",
    "slicing_thickness",
  ]));
  const paperContext = textOrNull(metadata.paperPreparationContext);
  const contextJoinStatus = textOrNull(metadata.preparationJoinStatus) ?? "repository_record_only";
  const sourceWording = direction || thickness !== null
    ? [thickness !== null ? `${thickness} micrometre` : null, direction].filter(Boolean).join(" · ")
    : "Not reported by the source record";
  return {
    species: record.normalizedMetadata.species,
    lifeStage: record.normalizedMetadata.lifeStage,
    numericAge: normalizeAge(record),
    regionLabels: record.normalizedMetadata.brainRegion,
    dimensionality: record.normalizedMetadata.dimensionality,
    protocol: textOrNull(metadata.protocol),
    slicingDirectionRaw: direction,
    slicingThicknessMicrometre: thickness,
    sourceSectionWording: sourceWording,
    shrinkage: normalizeShrinkage(metadata),
    paperPreparationContext: paperContext,
    preparationContextJoinStatus: contextJoinStatus,
    unresolvedPreparationConflict: paperContext && contextJoinStatus !== "exact_object_stage_equivalence"
      ? "paper context and repository fields remain distinct; no stage equivalence or object-level crosswalk is inferred"
      : null,
  };
}

function truncationDisclosure(record) {
  const integrity = record.normalizedMetadata.physicalIntegrity;
  const domain = record.normalizedMetadata.domain;
  const domainLower = domain.toLowerCase();
  const integrityLower = integrity.toLowerCase();
  const axonReconstructed = domainLower.includes("axon") && !domainLower.includes("no axon");
  return {
    sourceDomainVerbatim: domain,
    sourcePhysicalIntegrityVerbatim: integrity,
    axonField: axonReconstructed ? "reconstructed_source_field" : "not_reconstructed",
    moderateOrIncompleteSourceLabel: /moderate|incomplete/.test(integrityLower),
    completeNamedDomainSourceLabel: /complete/.test(integrityLower),
    wholeBiologicalAxonClaim: false,
    cutNeuriteRepairApplied: false,
    missingCoordinateInferenceApplied: false,
    biologicalAbsenceInferredFromMissingReconstruction: false,
  };
}

function geometryRepositoryPath(record) {
  const geometryPath = record.geometry?.path;
  check(typeof geometryPath === "string" && geometryPath.length > 0, `NMO ${record.neuronId} geometry path is unavailable`);
  if (geometryPath.startsWith("/data/")) {
    return path.join(PROJECT_ROOT, "public/data", geometryPath.slice("/data/".length));
  }
  return path.join(CENSUS_PUBLIC_ROOT, geometryPath);
}

function boundsFromGeometryNodes(geometry, neuronId) {
  check(
    same(geometry.nodeColumns, ["id", "type", "x", "y", "z", "radius", "parent"]),
    `NMO ${neuronId} node-column contract drifted`,
  );
  check(Array.isArray(geometry.nodes) && geometry.nodes.length > 0, `NMO ${neuronId} geometry nodes are unavailable`);
  const minimum = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
  const maximum = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
  for (const node of geometry.nodes) {
    check(Array.isArray(node) && node.length === 7, `NMO ${neuronId} has an invalid geometry node`);
    for (let axis = 0; axis < 3; axis += 1) {
      const coordinate = node[axis + 2];
      check(Number.isFinite(coordinate), `NMO ${neuronId} has a non-finite geometry coordinate`);
      minimum[axis] = Math.min(minimum[axis], coordinate);
      maximum[axis] = Math.max(maximum[axis], coordinate);
    }
  }
  return {
    min: minimum,
    max: maximum,
    extent: maximum.map((value, axis) => value - minimum[axis]),
  };
}

async function buildRecord(record, membership) {
  const geometryPath = geometryRepositoryPath(record);
  const geometryBytes = await readFile(geometryPath);
  check(geometryBytes.byteLength === record.geometry.bytes, `NMO ${record.neuronId} geometry byte count drifted`);
  check(sha256(geometryBytes) === record.geometry.sha256, `NMO ${record.neuronId} geometry SHA-256 drifted`);
  const geometry = JSON.parse(geometryBytes.toString("utf8"));
  check(geometry.neuronId === record.neuronId && geometry.assetId === record.assetId, `NMO ${record.neuronId} geometry identity drifted`);
  check(geometry.units === SOURCE_UNIT, `NMO ${record.neuronId} source coordinate unit drifted`);
  check(geometry.sourceFrame === record.normalizedMetadata.sourceFrame, `NMO ${record.neuronId} source frame drifted`);
  check(geometry.geometryStatus === "OBS_STANDARDIZED_SOURCE_LOCAL", `NMO ${record.neuronId} geometry authority drifted`);
  check(
    geometry.registration?.status === "unregistered" &&
      geometry.registration?.registrationCount === 0 &&
      geometry.registration?.atlasTransform?.value === null &&
      geometry.registration?.atlasPlacement?.value === null,
    `NMO ${record.neuronId} geometry gained registration or atlas placement`,
  );
  const computed = record.morphometrics?.computed;
  const geometryComputed = geometry.morphometrics?.computedFromStandardizedSwc;
  check(computed && geometryComputed, `NMO ${record.neuronId} computed morphology receipt is unavailable`);
  const recomputed = boundsFromGeometryNodes(geometry, record.neuronId);
  check(same(recomputed.min, geometryComputed.boundsMicrometre?.min), `NMO ${record.neuronId} node-derived minimum bounds drifted`);
  check(same(recomputed.max, geometryComputed.boundsMicrometre?.max), `NMO ${record.neuronId} node-derived maximum bounds drifted`);
  check(same(recomputed.extent, geometryComputed.extentMicrometre), `NMO ${record.neuronId} node-derived extent drifted`);
  check(same(computed.boundsMicrometre, geometryComputed.boundsMicrometre), `NMO ${record.neuronId} source bounds drifted`);
  check(same(computed.extentMicrometre, geometryComputed.extentMicrometre), `NMO ${record.neuronId} source extent drifted`);
  check(geometry.segments.length === computed.segmentCount, `NMO ${record.neuronId} segment denominator drifted`);
  if (record.normalizedMetadata.dimensionality === "2D") {
    check(recomputed.extent[2] === 0, `NMO ${record.neuronId} 2D source object gained inferred z depth`);
  } else {
    check(recomputed.extent[2] > 0, `NMO ${record.neuronId} 3D source object lost observed z depth`);
  }
  const transform = geometry.displayTransform;
  check(transform?.kind === "soma_centered_uniform_scale", `NMO ${record.neuronId} display transform kind drifted`);
  check(transform?.use === "viewer_only", `NMO ${record.neuronId} display transform gained scientific authority`);
  check(Number.isFinite(transform?.scaleViewerUnitPerMicrometre) && transform.scaleViewerUnitPerMicrometre > 0, `NMO ${record.neuronId} display scale is invalid`);
  check(Array.isArray(transform?.originMicrometre) && transform.originMicrometre.length === 3, `NMO ${record.neuronId} display origin is invalid`);
  const rootNode = geometry.nodes.find((node) => node[0] === geometryComputed.rootNodeId);
  check(rootNode && same(transform.originMicrometre, rootNode.slice(2, 5)), `NMO ${record.neuronId} display origin no longer equals the source root coordinate`);
  const expectedDisplayScale = 6 / Math.max(...recomputed.extent);
  check(
    Math.abs(transform.scaleViewerUnitPerMicrometre - expectedDisplayScale) <= Math.max(1e-15, expectedDisplayScale * 1e-12),
    `NMO ${record.neuronId} display scale no longer follows the deterministic uniform-fit transform`,
  );
  return {
    neuronId: record.neuronId,
    assetId: record.assetId,
    membership,
    geometryReceipt: {
      path: record.geometry.path,
      bytes: record.geometry.bytes,
      sha256: record.geometry.sha256,
      rawSwcSha256: record.geometry.rawSwcSha256,
      geometryStatus: geometry.geometryStatus,
    },
    sourceCoordinates: {
      unit: SOURCE_UNIT,
      sourceFrame: geometry.sourceFrame,
      boundsMicrometre: computed.boundsMicrometre,
      extentMicrometre: computed.extentMicrometre,
      displayTransform: {
        kind: transform.kind,
        originMicrometre: transform.originMicrometre,
        scaleViewerUnitPerMicrometre: transform.scaleViewerUnitPerMicrometre,
        use: transform.use,
      },
      viewportScaleAuthority: "camera_target_plane_source_local_only",
      sharedScaleAuthority: false,
      anatomicalOrientationAuthority: false,
      atlasRegistrationAuthority: false,
    },
    preparation: preparationDisclosure(record),
    truncation: truncationDisclosure(record),
  };
}

function receipt(repositoryPath, bytes) {
  return { path: repositoryPath, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildMorphologySourceFrameDisclosure() {
  const [censusBytes, supplementaryBytes, builderBytes] = await Promise.all([
    readFile(CENSUS_PATH),
    readFile(SUPPLEMENTARY_PATH),
    readFile(BUILDER_PATH),
  ]);
  const census = JSON.parse(censusBytes.toString("utf8"));
  const supplementary = JSON.parse(supplementaryBytes.toString("utf8"));
  check(census.records?.length === 142, "Frozen census denominator drifted");
  check(supplementary.records?.length === 7, "Supplementary denominator drifted");
  check(same(supplementary.records.map((record) => record.neuronId), EXPECTED_SUPPLEMENTARY_IDS), "Supplementary roster drifted");
  check(supplementary.summary?.frozenCensusRecordCount === 142 && supplementary.summary?.viewableSourceObjectCount === 149, "142 + 7 denominator boundary drifted");

  const censusRecords = census.records.map((record) => ({
    record,
    membership: { collection: "census", censusContribution: 1, supplementaryContribution: 0 },
  }));
  const supplementaryRecords = supplementary.records.map((record) => ({
    record,
    membership: { collection: "supplementary", censusContribution: 0, supplementaryContribution: 1 },
  }));
  const combined = [...censusRecords, ...supplementaryRecords].sort((left, right) => left.record.neuronId - right.record.neuronId);
  check(combined.length === 149 && new Set(combined.map(({ record }) => record.neuronId)).size === 149, "Combined source-object roster is not exactly 149 unique records");
  const records = await Promise.all(combined.map(({ record, membership }) => buildRecord(record, membership)));
  const summary = {
    frozenCensusRecordCount: records.filter((record) => record.membership.collection === "census").length,
    supplementaryRecordCount: records.filter((record) => record.membership.collection === "supplementary").length,
    viewableSourceObjectCount: records.length,
    geometry2DCount: records.filter((record) => record.preparation.dimensionality === "2D").length,
    geometry3DCount: records.filter((record) => record.preparation.dimensionality === "3D").length,
    slicingDirectionReportedCount: records.filter((record) => record.preparation.slicingDirectionRaw !== null).length,
    slicingThicknessReportedCount: records.filter((record) => record.preparation.slicingThicknessMicrometre !== null).length,
    numericAgeReportedCount: records.filter((record) => record.preparation.numericAge.status === "reported").length,
    preparationContextConflictCount: records.filter((record) => record.preparation.unresolvedPreparationConflict !== null).length,
    sourceModerateOrIncompleteCount: records.filter((record) => record.truncation.moderateOrIncompleteSourceLabel).length,
    scaleEligibleRecordCount: records.filter((record) => record.sourceCoordinates.unit === SOURCE_UNIT).length,
    commonScaleAdmissionCount: 0,
    inferredMissingCoordinateCount: 0,
    repairedCutNeuriteCount: 0,
    restoredInVivoDimensionCount: 0,
    registrationCount: 0,
  };
  check(summary.frozenCensusRecordCount === 142 && summary.supplementaryRecordCount === 7, "Collection denominator drifted");
  check(summary.geometry2DCount === 2 && summary.geometry3DCount === 147, "Dimensionality denominator drifted");
  check(summary.scaleEligibleRecordCount === 149, "Not every source object has source-local micrometre scale authority");

  const document = {
    documentType: "morphology_source_frame_and_preparation_disclosure_contract",
    schemaVersion: "0.1.0",
    contractId: "morphology-source-frame-disclosure-0.1",
    releaseId: "ohri-morphology-source-frame-disclosure-0.1.0",
    releasedAt: "2026-08-31",
    upgradeId: "UPG-151",
    purpose: "Expose camera-local micrometre scale plus source preparation and truncation limits for every checksum-gated comparison object without creating shared scale, restored dimensions, repaired morphology or registration.",
    sourceInputs: {
      frozenCensus: receipt("public/data/neuromorpho_release_8_6_124_census_v1/census-index.json", censusBytes),
      supplementaryAdapter: receipt("data/supplementary-morphology-comparison-adapter-0.1.json", supplementaryBytes),
      builder: receipt("tools/build_morphology_source_frame_disclosure.mjs", builderBytes),
    },
    displayScalePolicy: {
      algorithmId: SCALE_ALGORITHM_ID,
      sourceCoordinateUnit: SOURCE_UNIT,
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
    },
    summary,
    scientificBoundary: {
      combinedCensusClaim: false,
      commonScaleClaim: false,
      commonOrientationClaim: false,
      sharedCoordinateFrameClaim: false,
      atlasPlacementCount: 0,
      atlasTransformCount: 0,
      completeBiologicalAxonClaimCount: 0,
      cutNeuriteRepairCount: 0,
      inferredMissingCoordinateCount: 0,
      restoredInVivoDimensionCount: 0,
      crossSourceIdentityCount: 0,
      sameSpecimenInternalStructureCount: 0,
      renderedInternalPrimitiveCount: 0,
      registrationCount: 0,
    },
    records,
  };
  document.contractContentSha256 = canonicalContentSha256(document);
  return document;
}

async function main() {
  const mode = process.argv.includes("--write") ? "write" : process.argv.includes("--check") ? "check" : null;
  check(mode, "Usage: node tools/build_morphology_source_frame_disclosure.mjs --write|--check");
  const document = await buildMorphologySourceFrameDisclosure();
  const output = serialize(document);
  if (mode === "write") {
    await writeFile(OUTPUT_PATH, output);
    process.stdout.write(`Wrote ${path.relative(PROJECT_ROOT, OUTPUT_PATH)} (${Buffer.byteLength(output)} bytes; ${document.records.length} records).\n`);
    return;
  }
  const current = await readFile(OUTPUT_PATH, "utf8");
  check(current === output, "Morphology source-frame disclosure is not byte-deterministic; rebuild with --write");
  process.stdout.write(`Morphology source-frame disclosure is current (${document.records.length} records; ${document.contractContentSha256}).\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === BUILDER_PATH) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
