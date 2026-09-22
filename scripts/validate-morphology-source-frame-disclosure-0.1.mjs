#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const execFileAsync = promisify(execFile);
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_PATH = path.join(PROJECT_ROOT, "data/morphology-source-frame-disclosure-0.1.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/morphology-source-frame-disclosure-0.1.schema.json");
const CENSUS_PATH = path.join(PROJECT_ROOT, "public/data/neuromorpho_release_8_6_124_census_v1/census-index.json");
const SUPPLEMENTARY_PATH = path.join(PROJECT_ROOT, "data/supplementary-morphology-comparison-adapter-0.1.json");
const BUILDER_PATH = path.join(PROJECT_ROOT, "tools/build_morphology_source_frame_disclosure.mjs");
const CENSUS_PUBLIC_ROOT = path.dirname(CENSUS_PATH);
const EXPECTED_SUPPLEMENTARY_IDS = Object.freeze([45674, 45718, 50394, 50408, 50424, 170035, 249676]);
const SOURCE_UNIT = "micrometre_reported_by_source";
const SOURCE_FRAME = "NeuroMorpho_CNG_standardized_local_frame";

function check(condition, message, errors) {
  if (!condition) errors.push(message);
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

function same(left, right) {
  try {
    assert.deepEqual(left, right);
    return true;
  } catch {
    return false;
  }
}

export function canonicalMorphologySourceFrameDisclosureSha256(document) {
  const copy = structuredClone(document);
  delete copy.contractContentSha256;
  return sha256(Buffer.from(JSON.stringify(stableValue(copy)), "utf8"));
}

function schemaErrors(validate) {
  return (validate.errors ?? [])
    .map((error) => `- ${error.instancePath || "/"}: ${error.message}`)
    .join("\n");
}

function repositoryPath(relativePath) {
  const resolved = path.resolve(PROJECT_ROOT, relativePath);
  if (!(resolved === PROJECT_ROOT || resolved.startsWith(`${PROJECT_ROOT}${path.sep}`))) {
    throw new Error(`Repository path escapes project root: ${relativePath}`);
  }
  return resolved;
}

function geometryRepositoryPath(sourceRecord, membership) {
  const geometryPath = sourceRecord.geometry?.path;
  if (typeof geometryPath !== "string" || geometryPath.length === 0) {
    throw new Error(`NeuroMorpho:${sourceRecord.neuronId} geometry path is unavailable`);
  }
  if (membership.collection === "supplementary") {
    if (!geometryPath.startsWith("/data/")) {
      throw new Error(`NeuroMorpho:${sourceRecord.neuronId} supplementary geometry path is not public-data rooted`);
    }
    return repositoryPath(path.join("public/data", geometryPath.slice("/data/".length)));
  }
  return path.resolve(CENSUS_PUBLIC_ROOT, geometryPath);
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

function expectedNumericAge(sourceRecord) {
  const metadata = sourceRecord.officialMetadata ?? {};
  const explicit = metadata.numericAge ?? sourceRecord.missingness?.numericAge?.value ?? null;
  if (explicit && typeof explicit === "object") {
    const minimum = finiteNumberOrNull(explicit.minimum);
    const maximum = finiteNumberOrNull(explicit.maximum);
    const scale = textOrNull(explicit.scale);
    if (minimum !== null || maximum !== null) return { status: "reported", minimum, maximum, scale };
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

function expectedShrinkage(metadata) {
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

function expectedPreparation(sourceRecord) {
  const metadata = sourceRecord.officialMetadata ?? {};
  const slicingDirectionRaw = textOrNull(firstDefined(metadata, [
    "repositorySlicingDirection",
    "slicingDirection",
    "slicing_direction",
  ]));
  const slicingThicknessMicrometre = finiteNumberOrNull(firstDefined(metadata, [
    "repositorySlicingThicknessMicrometre",
    "slicingThicknessMicrometre",
    "slicing_thickness",
  ]));
  const paperPreparationContext = textOrNull(metadata.paperPreparationContext);
  const preparationContextJoinStatus = textOrNull(metadata.preparationJoinStatus) ?? "repository_record_only";
  const sourceSectionWording = slicingDirectionRaw || slicingThicknessMicrometre !== null
    ? [slicingThicknessMicrometre !== null ? `${slicingThicknessMicrometre} micrometre` : null, slicingDirectionRaw]
      .filter(Boolean)
      .join(" · ")
    : "Not reported by the source record";
  return {
    species: sourceRecord.normalizedMetadata.species,
    lifeStage: sourceRecord.normalizedMetadata.lifeStage,
    numericAge: expectedNumericAge(sourceRecord),
    regionLabels: sourceRecord.normalizedMetadata.brainRegion,
    dimensionality: sourceRecord.normalizedMetadata.dimensionality,
    protocol: textOrNull(metadata.protocol),
    slicingDirectionRaw,
    slicingThicknessMicrometre,
    sourceSectionWording,
    shrinkage: expectedShrinkage(metadata),
    paperPreparationContext,
    preparationContextJoinStatus,
    unresolvedPreparationConflict: paperPreparationContext && preparationContextJoinStatus !== "exact_object_stage_equivalence"
      ? "paper context and repository fields remain distinct; no stage equivalence or object-level crosswalk is inferred"
      : null,
  };
}

function expectedTruncation(sourceRecord) {
  const sourceDomainVerbatim = sourceRecord.normalizedMetadata.domain;
  const sourcePhysicalIntegrityVerbatim = sourceRecord.normalizedMetadata.physicalIntegrity;
  const domainLower = sourceDomainVerbatim.toLowerCase();
  const integrityLower = sourcePhysicalIntegrityVerbatim.toLowerCase();
  return {
    sourceDomainVerbatim,
    sourcePhysicalIntegrityVerbatim,
    axonField: domainLower.includes("axon") && !domainLower.includes("no axon")
      ? "reconstructed_source_field"
      : "not_reconstructed",
    moderateOrIncompleteSourceLabel: /moderate|incomplete/.test(integrityLower),
    completeNamedDomainSourceLabel: /complete/.test(integrityLower),
    wholeBiologicalAxonClaim: false,
    cutNeuriteRepairApplied: false,
    missingCoordinateInferenceApplied: false,
    biologicalAbsenceInferredFromMissingReconstruction: false,
  };
}

function recomputeNodeBounds(geometry, neuronId, errors) {
  check(same(geometry.nodeColumns, ["id", "type", "x", "y", "z", "radius", "parent"]), `NeuroMorpho:${neuronId} node columns drifted`, errors);
  const nodes = geometry.nodes;
  check(Array.isArray(nodes) && nodes.length > 0, `NeuroMorpho:${neuronId} has no geometry nodes`, errors);
  if (!Array.isArray(nodes) || nodes.length === 0) return null;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (!Array.isArray(node) || node.length < 5) {
      errors.push(`NeuroMorpho:${neuronId} node ${index} is malformed`);
      continue;
    }
    for (let axis = 0; axis < 3; axis += 1) {
      const coordinate = node[axis + 2];
      if (!Number.isFinite(coordinate)) {
        errors.push(`NeuroMorpho:${neuronId} node ${index} has a non-finite source coordinate`);
        continue;
      }
      min[axis] = Math.min(min[axis], coordinate);
      max[axis] = Math.max(max[axis], coordinate);
    }
  }
  if (![...min, ...max].every(Number.isFinite)) return null;
  return {
    boundsMicrometre: { min, max },
    extentMicrometre: max.map((value, axis) => value - min[axis]),
  };
}

function exactReceipt(pathValue, bytes) {
  return { path: pathValue, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

let groundTruthPromise;

async function loadGroundTruth() {
  if (groundTruthPromise) return groundTruthPromise;
  groundTruthPromise = (async () => {
    const [schema, censusBytes, supplementaryBytes, builderBytes] = await Promise.all([
      readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
      readFile(CENSUS_PATH),
      readFile(SUPPLEMENTARY_PATH),
      readFile(BUILDER_PATH),
    ]);
    const census = JSON.parse(censusBytes.toString("utf8"));
    const supplementary = JSON.parse(supplementaryBytes.toString("utf8"));
    const errors = [];

    check(census.records?.length === 142, "frozen census must contain exactly 142 records", errors);
    check(census.summary?.queryRecordCount === 142, "frozen census summary denominator drifted", errors);
    check(supplementary.records?.length === 7, "supplementary adapter must contain exactly 7 records", errors);
    check(same(supplementary.records?.map((record) => record.neuronId), EXPECTED_SUPPLEMENTARY_IDS), "supplementary roster or order drifted", errors);
    check(supplementary.summary?.frozenCensusRecordCount === 142, "supplementary adapter census denominator drifted", errors);
    check(supplementary.summary?.supplementaryRecordCount === 7, "supplementary adapter supplementary denominator drifted", errors);
    check(supplementary.summary?.viewableSourceObjectCount === 149, "supplementary adapter viewable-object denominator drifted", errors);
    check(supplementary.summary?.combinedCensusClaim === false, "supplementary adapter promoted 149 viewable objects to a census", errors);

    const censusIds = new Set(census.records?.map((record) => record.neuronId));
    check(!EXPECTED_SUPPLEMENTARY_IDS.some((id) => censusIds.has(id)), "supplementary roster overlaps the frozen census", errors);
    const sourceEntries = [
      ...census.records.map((sourceRecord) => ({
        sourceRecord,
        membership: { collection: "census", censusContribution: 1, supplementaryContribution: 0 },
      })),
      ...supplementary.records.map((sourceRecord) => ({
        sourceRecord,
        membership: { collection: "supplementary", censusContribution: 0, supplementaryContribution: 1 },
      })),
    ].sort((left, right) => left.sourceRecord.neuronId - right.sourceRecord.neuronId);
    check(sourceEntries.length === 149, "source-object roster must contain 142 + 7 = 149 records", errors);
    check(new Set(sourceEntries.map(({ sourceRecord }) => sourceRecord.neuronId)).size === 149, "source-object roster has duplicate neuron IDs", errors);
    if (errors.length) throw new Error(`Morphology source-frame ground truth invalid:\n- ${errors.join("\n- ")}`);

    const byNeuronId = new Map();
    for (const { sourceRecord, membership } of sourceEntries) {
      const neuronId = sourceRecord.neuronId;
      const geometryPath = geometryRepositoryPath(sourceRecord, membership);
      const geometryBytes = await readFile(geometryPath);
      const geometry = JSON.parse(geometryBytes.toString("utf8"));
      const geometryErrors = [];
      check(geometryBytes.byteLength === sourceRecord.geometry.bytes, `NeuroMorpho:${neuronId} geometry byte count drifted`, geometryErrors);
      check(sha256(geometryBytes) === sourceRecord.geometry.sha256, `NeuroMorpho:${neuronId} geometry SHA-256 drifted`, geometryErrors);
      check(geometry.neuronId === neuronId && geometry.assetId === sourceRecord.assetId, `NeuroMorpho:${neuronId} geometry identity drifted`, geometryErrors);
      check(geometry.units === SOURCE_UNIT, `NeuroMorpho:${neuronId} geometry unit drifted`, geometryErrors);
      check(geometry.sourceFrame === SOURCE_FRAME, `NeuroMorpho:${neuronId} source frame drifted`, geometryErrors);
      check(geometry.geometryStatus === "OBS_STANDARDIZED_SOURCE_LOCAL", `NeuroMorpho:${neuronId} geometry status drifted`, geometryErrors);
      check(geometry.scientificUse === "source_local_morphology_visualization_and_qc_only", `NeuroMorpho:${neuronId} geometry gained broader scientific authority`, geometryErrors);
      check(geometry.registration?.status === "unregistered", `NeuroMorpho:${neuronId} geometry gained registration`, geometryErrors);
      check(geometry.registration?.registrationCount === 0, `NeuroMorpho:${neuronId} geometry registration count must remain zero`, geometryErrors);
      check(geometry.registration?.atlasTransform?.value === null, `NeuroMorpho:${neuronId} geometry gained an atlas transform`, geometryErrors);
      check(geometry.registration?.atlasPlacement?.value === null, `NeuroMorpho:${neuronId} geometry gained atlas placement`, geometryErrors);
      check(sourceRecord.normalizedMetadata?.registrationStatus === "unregistered", `NeuroMorpho:${neuronId} source record gained registration`, geometryErrors);
      check(sourceRecord.missingness?.atlasTransform?.value === null, `NeuroMorpho:${neuronId} source record gained an atlas transform`, geometryErrors);
      check(sourceRecord.missingness?.atlasPlacement?.value === null, `NeuroMorpho:${neuronId} source record gained atlas placement`, geometryErrors);
      check(geometry.swc?.sha256 === sourceRecord.geometry.rawSwcSha256, `NeuroMorpho:${neuronId} raw SWC receipt drifted`, geometryErrors);
      check(geometry.morphometrics?.computedFromStandardizedSwc?.rawSwcSha256 === sourceRecord.geometry.rawSwcSha256, `NeuroMorpho:${neuronId} computed raw SWC receipt drifted`, geometryErrors);
      check(geometry.nodes?.length === sourceRecord.morphometrics?.computed?.nodeCount, `NeuroMorpho:${neuronId} node denominator drifted`, geometryErrors);
      check(geometry.segments?.length === sourceRecord.morphometrics?.computed?.segmentCount, `NeuroMorpho:${neuronId} segment denominator drifted`, geometryErrors);

      const recomputed = recomputeNodeBounds(geometry, neuronId, geometryErrors);
      const geometryComputed = geometry.morphometrics?.computedFromStandardizedSwc;
      const sourceComputed = sourceRecord.morphometrics?.computed;
      check(Boolean(recomputed) && same(recomputed.boundsMicrometre, geometryComputed?.boundsMicrometre), `NeuroMorpho:${neuronId} geometry bounds do not match node-recomputed bounds`, geometryErrors);
      check(Boolean(recomputed) && same(recomputed.extentMicrometre, geometryComputed?.extentMicrometre), `NeuroMorpho:${neuronId} geometry extents do not match node-recomputed extents`, geometryErrors);
      check(same(sourceComputed?.boundsMicrometre, recomputed?.boundsMicrometre), `NeuroMorpho:${neuronId} source-index bounds do not match node-recomputed bounds`, geometryErrors);
      check(same(sourceComputed?.extentMicrometre, recomputed?.extentMicrometre), `NeuroMorpho:${neuronId} source-index extents do not match node-recomputed extents`, geometryErrors);

      const dimensionality = sourceRecord.normalizedMetadata?.dimensionality;
      check(geometry.swc?.dimensionality === dimensionality, `NeuroMorpho:${neuronId} geometry/source dimensionality drifted`, geometryErrors);
      if (dimensionality === "2D") {
        check(recomputed?.extentMicrometre[2] === 0, `NeuroMorpho:${neuronId} 2D geometry must have zero z extent`, geometryErrors);
        check(recomputed?.boundsMicrometre.min[2] === recomputed?.boundsMicrometre.max[2], `NeuroMorpho:${neuronId} 2D geometry must occupy one z plane`, geometryErrors);
      } else if (dimensionality === "3D") {
        check(recomputed?.extentMicrometre[2] > 0, `NeuroMorpho:${neuronId} 3D geometry must have positive z extent`, geometryErrors);
      } else {
        geometryErrors.push(`NeuroMorpho:${neuronId} has unsupported dimensionality ${dimensionality}`);
      }

      const transform = geometry.displayTransform;
      check(transform?.kind === "soma_centered_uniform_scale", `NeuroMorpho:${neuronId} display-transform kind drifted`, geometryErrors);
      check(Array.isArray(transform?.originMicrometre) && transform.originMicrometre.length === 3 && transform.originMicrometre.every(Number.isFinite), `NeuroMorpho:${neuronId} display-transform origin is invalid`, geometryErrors);
      check(Number.isFinite(transform?.scaleViewerUnitPerMicrometre) && transform.scaleViewerUnitPerMicrometre > 0, `NeuroMorpho:${neuronId} display-transform scale is invalid`, geometryErrors);
      check(transform?.use === "viewer_only", `NeuroMorpho:${neuronId} display transform gained scientific authority`, geometryErrors);
      if (geometryErrors.length) throw new Error(`Morphology source-frame geometry validation failed:\n- ${geometryErrors.join("\n- ")}`);

      byNeuronId.set(neuronId, {
        sourceRecord,
        membership,
        preparation: expectedPreparation(sourceRecord),
        truncation: expectedTruncation(sourceRecord),
        geometry: {
          receipt: {
            path: sourceRecord.geometry.path,
            bytes: sourceRecord.geometry.bytes,
            sha256: sourceRecord.geometry.sha256,
            rawSwcSha256: sourceRecord.geometry.rawSwcSha256,
            geometryStatus: geometry.geometryStatus,
          },
          sourceCoordinates: {
            unit: geometry.units,
            sourceFrame: geometry.sourceFrame,
            boundsMicrometre: recomputed.boundsMicrometre,
            extentMicrometre: recomputed.extentMicrometre,
            displayTransform: transform,
            viewportScaleAuthority: "camera_target_plane_source_local_only",
            sharedScaleAuthority: false,
            anatomicalOrientationAuthority: false,
            atlasRegistrationAuthority: false,
          },
        },
      });
    }

    return {
      schema,
      censusBytes,
      supplementaryBytes,
      builderBytes,
      sourceEntries,
      byNeuronId,
    };
  })();
  return groundTruthPromise;
}

function expectedSummary(sourceEntries, byNeuronId) {
  const expectedRecords = sourceEntries.map(({ sourceRecord }) => byNeuronId.get(sourceRecord.neuronId));
  return {
    frozenCensusRecordCount: expectedRecords.filter((entry) => entry.membership.collection === "census").length,
    supplementaryRecordCount: expectedRecords.filter((entry) => entry.membership.collection === "supplementary").length,
    viewableSourceObjectCount: expectedRecords.length,
    geometry2DCount: expectedRecords.filter((entry) => entry.preparation.dimensionality === "2D").length,
    geometry3DCount: expectedRecords.filter((entry) => entry.preparation.dimensionality === "3D").length,
    slicingDirectionReportedCount: expectedRecords.filter((entry) => entry.preparation.slicingDirectionRaw !== null).length,
    slicingThicknessReportedCount: expectedRecords.filter((entry) => entry.preparation.slicingThicknessMicrometre !== null).length,
    numericAgeReportedCount: expectedRecords.filter((entry) => entry.preparation.numericAge.status === "reported").length,
    preparationContextConflictCount: expectedRecords.filter((entry) => entry.preparation.unresolvedPreparationConflict !== null).length,
    sourceModerateOrIncompleteCount: expectedRecords.filter((entry) => entry.truncation.moderateOrIncompleteSourceLabel).length,
    scaleEligibleRecordCount: expectedRecords.length,
    commonScaleAdmissionCount: 0,
    inferredMissingCoordinateCount: 0,
    repairedCutNeuriteCount: 0,
    restoredInVivoDimensionCount: 0,
    registrationCount: 0,
  };
}

function validateZeroBoundaries(contract, errors) {
  const policy = contract.displayScalePolicy;
  check(policy?.sourceLocalOnly === true, "display scale must remain source-local", errors);
  check(policy?.sharedAcrossViewports === false, "shared scale across viewports is forbidden", errors);
  check(policy?.apparentObjectSizeComparable === false, "apparent object size must not become cross-view comparable", errors);
  check(policy?.restoresInVivoDimensions === false, "display scale must not restore in-vivo dimensions", errors);
  check(policy?.infersMissingCoordinates === false, "display scale must not infer missing coordinates", errors);
  check(policy?.establishesAnatomicalOrientation === false, "display scale must not establish anatomical orientation", errors);
  check(policy?.establishesAtlasRegistration === false, "display scale must not establish atlas registration", errors);

  const falseBoundaryKeys = [
    "combinedCensusClaim",
    "commonScaleClaim",
    "commonOrientationClaim",
    "sharedCoordinateFrameClaim",
  ];
  for (const key of falseBoundaryKeys) check(contract.scientificBoundary?.[key] === false, `scientificBoundary.${key} must remain false`, errors);
  const zeroBoundaryKeys = [
    "atlasPlacementCount",
    "atlasTransformCount",
    "completeBiologicalAxonClaimCount",
    "cutNeuriteRepairCount",
    "inferredMissingCoordinateCount",
    "restoredInVivoDimensionCount",
    "crossSourceIdentityCount",
    "sameSpecimenInternalStructureCount",
    "renderedInternalPrimitiveCount",
    "registrationCount",
  ];
  for (const key of zeroBoundaryKeys) check(contract.scientificBoundary?.[key] === 0, `scientificBoundary.${key} must remain zero`, errors);
}

export async function validateMorphologySourceFrameDisclosure(contractOverride = null) {
  const [groundTruth, contractBytes] = await Promise.all([
    loadGroundTruth(),
    contractOverride === null ? readFile(CONTRACT_PATH) : Promise.resolve(null),
  ]);
  const contract = contractOverride ?? JSON.parse(contractBytes.toString("utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(groundTruth.schema);
  if (!validate(contract)) {
    throw new Error(`Morphology source-frame disclosure schema validation failed:\n${schemaErrors(validate)}`);
  }
  const canonicalSha256 = canonicalMorphologySourceFrameDisclosureSha256(contract);
  if (contract.contractContentSha256 !== canonicalSha256) {
    throw new Error(`Morphology source-frame disclosure canonical content SHA-256 drifted: expected ${canonicalSha256}`);
  }

  const errors = [];
  const expectedInputReceipts = {
    frozenCensus: exactReceipt("public/data/neuromorpho_release_8_6_124_census_v1/census-index.json", groundTruth.censusBytes),
    supplementaryAdapter: exactReceipt("data/supplementary-morphology-comparison-adapter-0.1.json", groundTruth.supplementaryBytes),
    builder: exactReceipt("tools/build_morphology_source_frame_disclosure.mjs", groundTruth.builderBytes),
  };
  check(same(contract.sourceInputs, expectedInputReceipts), "source-input path, byte, or SHA-256 receipt drifted", errors);
  validateZeroBoundaries(contract, errors);

  const expectedIds = groundTruth.sourceEntries.map(({ sourceRecord }) => sourceRecord.neuronId);
  const actualIds = contract.records.map((record) => record.neuronId);
  check(same(actualIds, expectedIds), "149-record source-object roster is missing, duplicated, padded, or unsorted", errors);
  check(new Set(actualIds).size === 149, "149-record source-object roster contains duplicate neuron IDs", errors);
  check(contract.records.filter((record) => record.membership.collection === "census").length === 142, "census membership denominator drifted from 142", errors);
  check(contract.records.filter((record) => record.membership.collection === "supplementary").length === 7, "supplementary membership denominator drifted from 7", errors);
  check(same(
    contract.records.filter((record) => record.membership.collection === "supplementary").map((record) => record.neuronId),
    EXPECTED_SUPPLEMENTARY_IDS,
  ), "supplementary membership roster drifted", errors);

  for (const record of contract.records) {
    const expected = groundTruth.byNeuronId.get(record.neuronId);
    if (!expected) {
      errors.push(`NeuroMorpho:${record.neuronId} is not in either authorized source roster`);
      continue;
    }
    const sourceRecord = expected.sourceRecord;
    check(record.assetId === sourceRecord.assetId && record.assetId === `NeuroMorpho:${record.neuronId}`, `NeuroMorpho:${record.neuronId} asset identity drifted`, errors);
    check(same(record.membership, expected.membership), `NeuroMorpho:${record.neuronId} membership drifted`, errors);
    check(same(record.geometryReceipt, expected.geometry.receipt), `NeuroMorpho:${record.neuronId} geometry receipt drifted`, errors);
    check(same(record.sourceCoordinates, expected.geometry.sourceCoordinates), `NeuroMorpho:${record.neuronId} source bounds, extents, frame, registration, or display transform drifted`, errors);
    check(same(record.preparation, expected.preparation), `NeuroMorpho:${record.neuronId} preparation, age, section, shrinkage, or unresolved conflict disclosure drifted`, errors);
    check(same(record.truncation, expected.truncation), `NeuroMorpho:${record.neuronId} integrity, truncation, inferred-coordinate, or repair disclosure drifted`, errors);
    check(record.sourceCoordinates.sharedScaleAuthority === false, `NeuroMorpho:${record.neuronId} gained shared scale authority`, errors);
    check(record.sourceCoordinates.atlasRegistrationAuthority === false, `NeuroMorpho:${record.neuronId} gained registration authority`, errors);
    check(record.preparation.shrinkage.restoredInVivoDimensions === false, `NeuroMorpho:${record.neuronId} gained restored in-vivo dimensions`, errors);
    check(record.truncation.wholeBiologicalAxonClaim === false, `NeuroMorpho:${record.neuronId} gained a complete biological axon claim`, errors);
    check(record.truncation.cutNeuriteRepairApplied === false, `NeuroMorpho:${record.neuronId} gained repaired neurites`, errors);
    check(record.truncation.missingCoordinateInferenceApplied === false, `NeuroMorpho:${record.neuronId} gained inferred coordinates`, errors);
    check(record.truncation.biologicalAbsenceInferredFromMissingReconstruction === false, `NeuroMorpho:${record.neuronId} inferred biological absence from missing reconstruction`, errors);
    if (record.preparation.dimensionality === "2D") {
      check(record.sourceCoordinates.extentMicrometre[2] === 0, `NeuroMorpho:${record.neuronId} 2D contract must retain zero z extent`, errors);
      check(record.sourceCoordinates.boundsMicrometre.min[2] === record.sourceCoordinates.boundsMicrometre.max[2], `NeuroMorpho:${record.neuronId} 2D contract must retain one z plane`, errors);
    } else {
      check(record.sourceCoordinates.extentMicrometre[2] > 0, `NeuroMorpho:${record.neuronId} 3D contract must retain positive z extent`, errors);
    }
  }

  const summary = expectedSummary(groundTruth.sourceEntries, groundTruth.byNeuronId);
  check(same(contract.summary, summary), "summary does not recompute exactly from the 142 census + 7 supplementary source objects", errors);
  check(summary.geometry2DCount === 2 && summary.geometry3DCount === 147, "source dimensionality denominator drifted from 2 2D + 147 3D", errors);
  check(summary.preparationContextConflictCount === 5, "unresolved preparation-context conflict denominator drifted from 5", errors);
  check(summary.scaleEligibleRecordCount === 149, "not every source object retains source-local micrometre scale eligibility", errors);
  if (errors.length) throw new Error(`Morphology source-frame disclosure validation failed:\n- ${errors.join("\n- ")}`);

  if (contractOverride === null) {
    await execFileAsync(process.execPath, [BUILDER_PATH, "--check"], {
      cwd: PROJECT_ROOT,
      maxBuffer: 1024 * 1024,
    });
  }

  return {
    releaseId: contract.releaseId,
    frozenCensusRecordCount: summary.frozenCensusRecordCount,
    supplementaryRecordCount: summary.supplementaryRecordCount,
    viewableSourceObjectCount: summary.viewableSourceObjectCount,
    geometry2DCount: summary.geometry2DCount,
    geometry3DCount: summary.geometry3DCount,
    preparationContextConflictCount: summary.preparationContextConflictCount,
    scaleEligibleRecordCount: summary.scaleEligibleRecordCount,
    sharedScaleAdmissionCount: summary.commonScaleAdmissionCount,
    restoredInVivoDimensionCount: summary.restoredInVivoDimensionCount,
    inferredMissingCoordinateCount: summary.inferredMissingCoordinateCount,
    repairedCutNeuriteCount: summary.repairedCutNeuriteCount,
    registrationCount: summary.registrationCount,
    contractContentSha256: canonicalSha256,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateMorphologySourceFrameDisclosure()
    .then((report) => process.stdout.write(
      `Morphology source-frame disclosure valid: ${report.frozenCensusRecordCount} census + ${report.supplementaryRecordCount} supplementary = ${report.viewableSourceObjectCount} source-local objects; ${report.geometry2DCount} 2D + ${report.geometry3DCount} 3D; ${report.sharedScaleAdmissionCount} shared-scale admissions; ${report.registrationCount} REG.\n`,
    ))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
