import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  MORPHOLOGY_MICRODETAIL_AXIS_ORDER,
  MORPHOLOGY_MICRODETAIL_INTERNAL_AXIS_IDS,
  buildMorphologyMicrodetailCoverage,
} from "../app/morphology-microdetail.js";

const CONTRACT_URL = new URL("../data/morphology-matrix-contract-0.1.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/morphology-matrix-contract-0.1.schema.json", import.meta.url);
const PUBLIC_DATA_ROOT = new URL("../public/data/", import.meta.url);

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function sourcePathUrl(path) {
  return new URL(path.replace(/^\/data\//, ""), PUBLIC_DATA_ROOT);
}

function failIf(condition, message, errors) {
  if (condition) errors.push(message);
}

export async function validateMorphologyMatrixContract(contractOverride = null) {
  const [contract, schema] = await Promise.all([
    contractOverride ?? readFile(CONTRACT_URL, "utf8").then(JSON.parse),
    readFile(SCHEMA_URL, "utf8").then(JSON.parse),
  ]);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(contract)) {
    throw new Error(`Morphology matrix schema validation failed:\n${(validate.errors ?? []).map((error) => `- ${error.instancePath || "/"}: ${error.message}`).join("\n")}`);
  }
  const errors = [];
  const [censusBytes, analysisBytes] = await Promise.all([
    readFile(sourcePathUrl(contract.sourceObjects.censusIndex.path)),
    readFile(sourcePathUrl(contract.sourceObjects.analysisIndex.path)),
  ]);
  failIf(censusBytes.byteLength !== contract.sourceObjects.censusIndex.bytes, "census byte count drifted", errors);
  failIf(digest(censusBytes) !== contract.sourceObjects.censusIndex.sha256, "census hash drifted", errors);
  failIf(analysisBytes.byteLength !== contract.sourceObjects.analysisIndex.bytes, "analysis byte count drifted", errors);
  failIf(digest(analysisBytes) !== contract.sourceObjects.analysisIndex.sha256, "analysis hash drifted", errors);
  const census = JSON.parse(censusBytes);
  const analysis = JSON.parse(analysisBytes);
  const records = census.records;
  const sourceType2NodeCount = records.reduce((sum, record) => sum + Number(record.morphometrics.computed.nodeTypeCounts?.["2"] ?? 0), 0);
  const computed = {
    queryRecordCount: records.length,
    admittedGeometryCount: records.filter((record) => record.geometry.available).length,
    threeDimensionalCount: records.filter((record) => record.normalizedMetadata.dimensionality === "3D").length,
    twoDimensionalCount: records.filter((record) => record.normalizedMetadata.dimensionality === "2D").length,
    sourceDiameterAvailableCount: records.filter((record) => record.normalizedMetadata.sourceDiameterAvailable).length,
    sourceDiameterUnavailableCount: records.filter((record) => !record.normalizedMetadata.sourceDiameterAvailable).length,
    axonFieldPresentCount: records.filter((record) => Number(record.morphometrics.computed.nodeTypeCounts?.["2"] ?? 0) > 0).length,
    sourceType2NodeCount,
    completeAxonCount: records.filter((record) => /complete axon/i.test(record.normalizedMetadata.physicalIntegrity)).length,
    sameSpecimenInternalStructureCount: 0,
    registrationCount: records.filter((record) => record.normalizedMetadata.registrationStatus !== "unregistered").length,
    sourcePaperCount: new Set(records.flatMap((record) => record.sourcePaper.dois)).size,
    archiveCount: new Set(records.map((record) => record.normalizedMetadata.archive)).size,
    analysisCohortCount: analysis.cohorts.length,
  };
  for (const [key, value] of Object.entries(computed)) failIf(contract.denominators[key] !== value, `${key} drifted`, errors);
  failIf(analysis.records.length !== records.length, "analysis does not cover every selectable record", errors);
  failIf(new Set(analysis.records.map((record) => record.neuronId)).size !== records.length, "analysis record IDs are incomplete or duplicated", errors);
  failIf(contract.matrix.selectableRecordCount !== records.length, "matrix does not expose every admitted record", errors);
  failIf(contract.comparator.minimumSelections !== 2 || contract.comparator.maximumSelections !== 4, "comparison selection boundary drifted", errors);
  failIf(contract.radiusGate.noDiameterSurfacePrimitiveCount !== 0 || contract.radiusGate.membraneClaim !== false, "No Diameter or membrane boundary drifted", errors);
  failIf(contract.internalDetailGate.renderedPrimitiveCount !== 0 || contract.internalDetailGate.sameSpecimenStatus !== "UNAVAILABLE", "same-specimen internal detail was invented", errors);
  const microdetailCoverage = records.map(buildMorphologyMicrodetailCoverage);
  failIf(contract.microdetailCoverage.recordCoverageCount !== microdetailCoverage.length, "micro-detail record coverage drifted", errors);
  failIf(contract.microdetailCoverage.axisOrder.join("|") !== MORPHOLOGY_MICRODETAIL_AXIS_ORDER.join("|"), "micro-detail axis order drifted", errors);
  failIf(contract.microdetailCoverage.sameSpecimenInternalAxes.join("|") !== MORPHOLOGY_MICRODETAIL_INTERNAL_AXIS_IDS.join("|"), "same-specimen internal axis order drifted", errors);
  failIf(microdetailCoverage.some((item) => item.axes.length !== MORPHOLOGY_MICRODETAIL_AXIS_ORDER.length), "a record has incomplete micro-detail coverage", errors);
  failIf(microdetailCoverage.some((item) => item.coverageStatus !== "verified" || item.admissionConflicts.length !== 0), "a source receipt contains a fail-closed micro-detail conflict", errors);
  failIf(microdetailCoverage.some((item) => !item.sourceRecordLocators.geometryPath || !item.sourceRecordLocators.rawSwcPath || item.sourceRecordLocators.dois.length === 0 || item.sourceRecordLocators.pmids.length === 0), "a micro-detail receipt lacks source-object or publication locators", errors);
  failIf(microdetailCoverage.some((item) => item.registrationCount !== 0 || item.sameSpecimenInternalPrimitiveCount !== 0), "micro-detail coverage invented registration or internal primitives", errors);
  failIf(microdetailCoverage.some((item) => MORPHOLOGY_MICRODETAIL_INTERNAL_AXIS_IDS.some((axisId) => item.axes.find((axis) => axis.id === axisId)?.status !== "UNAVAILABLE")), "micro-detail coverage promoted unavailable same-specimen anatomy", errors);
  const radiusDerivedCount = microdetailCoverage.filter((item) => item.axes.find((axis) => axis.id === "radius_derived_surface")?.status === "DERIVED").length;
  const observedTopologyCount = microdetailCoverage.filter((item) => item.axes.find((axis) => axis.id === "centerline_topology")?.status === "OBS").length;
  const observedDiameterInputCount = microdetailCoverage.filter((item) => item.axes.find((axis) => axis.id === "diameter_input")?.status === "OBS").length;
  const surfaceUnavailableCount = microdetailCoverage.filter((item) => item.axes.find((axis) => axis.id === "radius_derived_surface")?.status === "UNAVAILABLE").length;
  // The historical contract's diameter count describes deposited input data.
  // Current display authorization separately requires source-labelled 3D.
  const source3DRadiusEligibleCount = records.filter(record => record.normalizedMetadata.dimensionality === "3D" && record.normalizedMetadata.sourceDiameterAvailable === true).length;
  const dimensionalityBlockedRadiusCount = computed.sourceDiameterAvailableCount - source3DRadiusEligibleCount;
  const observedAxonFieldCount = microdetailCoverage.filter((item) => item.axes.find((axis) => axis.id === "axon_field")?.status === "OBS").length;
  const unavailableSomaContourCount = microdetailCoverage.filter((item) => item.axes.find((axis) => axis.id === "soma_contour")?.status === "UNAVAILABLE").length;
  failIf(observedTopologyCount !== records.length, "micro-detail topology receipt count drifted", errors);
  failIf(observedDiameterInputCount !== computed.sourceDiameterAvailableCount, "micro-detail diameter-input count drifted", errors);
  failIf(radiusDerivedCount !== source3DRadiusEligibleCount || surfaceUnavailableCount !== records.length - source3DRadiusEligibleCount, "micro-detail radius authority counts drifted", errors);
  failIf(records.some((record, index) => record.normalizedMetadata.dimensionality === "2D" && microdetailCoverage[index].axes.find(axis => axis.id === "radius_derived_surface")?.status !== "UNAVAILABLE"), "planar source gained a three-dimensional surface", errors);
  failIf(observedAxonFieldCount !== computed.axonFieldPresentCount, "micro-detail axon-field count drifted", errors);
  failIf(unavailableSomaContourCount !== records.length, "standardized soma samples were promoted into contours", errors);
  failIf(contract.microdetailCoverage.conflictPolicy !== "fail_closed_to_unavailable" || !contract.microdetailCoverage.unavailableInterpretation.includes("not_biological_absence"), "micro-detail conflict or unavailable interpretation drifted", errors);
  failIf(!contract.hardBoundaries.some((boundary) => /No source object is assigned/i.test(boundary)), "cross-lane identity boundary is missing", errors);
  failIf(!contract.hardBoundaries.some((boundary) => /not a biological census/i.test(boundary)), "repository denominator boundary is missing", errors);
  if (errors.length) throw new Error(`Morphology matrix contract validation failed:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  return {
    releaseId: contract.releaseId,
    recordCount: records.length,
    radiusAuthorizedCount: source3DRadiusEligibleCount,
    sourceDiameterInputCount: observedDiameterInputCount,
    dimensionalityBlockedRadiusCount,
    noDiameterCount: computed.sourceDiameterUnavailableCount,
    comparisonMaximum: contract.comparator.maximumSelections,
    registrationCount: computed.registrationCount,
    internalStructureCount: computed.sameSpecimenInternalStructureCount,
    microdetailAxisCount: MORPHOLOGY_MICRODETAIL_AXIS_ORDER.length,
    microdetailRecordCount: microdetailCoverage.length,
    microdetailTopologyCount: observedTopologyCount,
    microdetailSomaContourCount: records.length - unavailableSomaContourCount,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file://${process.argv[1]}`))) {
  try {
    const result = await validateMorphologyMatrixContract();
    console.log(`Morphology matrix validation passed: ${result.recordCount} records; ${result.sourceDiameterInputCount} deposited diameter inputs; ${result.radiusAuthorizedCount} 3D radius-authorized; ${result.dimensionalityBlockedRadiusCount} diameter-bearing planar records blocked; ${result.noDiameterCount} No Diameter; ${result.microdetailAxisCount} micro-detail axes × ${result.microdetailRecordCount} records; up to ${result.comparisonMaximum} independent viewports; ${result.registrationCount} registrations; ${result.internalStructureCount} internal models.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
