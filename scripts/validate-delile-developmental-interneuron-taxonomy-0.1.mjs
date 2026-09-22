#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const DATA_URL = new URL("../data/delile-developmental-interneuron-taxonomy-0.1.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/delile-developmental-interneuron-taxonomy-0.1.schema.json", import.meta.url);

const EXPECTED_RECEIPT = Object.freeze({
  bytes: 3036323,
  md5: "43685445c3bd8a593e6bd7099d1a6eb3",
  sha256: "4f5bd353771ea478928e305df784f3fc868bb89a9ffc5fbce112da70c4a769bf",
  gitBlobSha1: "38945377a551225f0b216b1a818b80585a4b6cae",
  pinnedCommit: "5de98d43bf89a003ea43aeb599136f7a4e1ee055",
});

const EXPECTED_CANONICAL_DATA_RECEIPT = Object.freeze({
  bytes: 122037,
  sha256: "7a77c8c10f15224188bb542fddf63bc97de57b06dd9289e324bc7b8612219597",
});

const EXPECTED_PROFILE_TIMEPOINT_SHA256 = "1aaad337cf9893c2d23ccf51ff05cd6f061ecce8cebfa1903ad6d11b9776dd34";
const EXPECTED_CARDINAL_ONLY_TIMEPOINT_SHA256 = "bd31ba88679e19549e239194c3d89b20b524b92e936c919af85124210c846b65";

const EXPECTED_PROFILES = Object.freeze([
  ["dl1.1", 30], ["dl1.2", 67], ["dl1.3", 255], ["dl1.4", 128], ["dl1.5", 41], ["dl1.6", 238], ["dl1.7", 116],
  ["dl2.1", 446], ["dl2.2", 243], ["dl2.3", 35], ["dl2.4", 157], ["dl2.5", 118],
  ["dl3.1", 90], ["dl3.2", 367], ["dl3.3", 404], ["dl3.4", 418], ["dl3.5", 138], ["dl3.6", 179],
  ["dl4.1", 1089], ["dl4.2", 626], ["dl4.3", 1010], ["dl4.4", 611], ["dl4.5", 333], ["dl4.6", 1700],
  ["dl5.1", 949], ["dl5.2", 857], ["dl5.3", 689], ["dl5.4", 1149], ["dl5.5", 419],
  ["V0.1", 92], ["V0.2", 50], ["V0.3", 46],
  ["V1.1", 151], ["V1.2", 140], ["V1.3", 231], ["V1.4", 82], ["V1.5", 144], ["V1.6", 67], ["V1.7", 54],
  ["V2a.1", 32], ["V2a.2", 190], ["V2a.3", 86], ["V2a.4", 103],
  ["V2b.1", 94], ["V2b.2", 55], ["V2b.3", 26], ["V2b.4", 287],
  ["V3.1", 110], ["V3.2", 119], ["V3.3", 78], ["V3.4", 78],
]);

const EXPECTED_CARDINALS = Object.freeze([
  ["dl1", 875, 875, 0],
  ["dl2", 999, 999, 0],
  ["dl3", 1596, 1596, 0],
  ["dl4", 5369, 5369, 0],
  ["dl5", 4063, 4063, 0],
  ["dl6", 95, 0, 95],
  ["V0", 188, 188, 0],
  ["V1", 869, 869, 0],
  ["V2a", 493, 411, 82],
  ["V2b", 462, 462, 0],
  ["V3", 385, 385, 0],
]);

const EXPECTED_SAMPLES = Object.freeze([
  [9.5, 1, 3541, 88, 23, 23, 0, 44, 21],
  [9.5, 2, 4055, 249, 92, 90, 2, 103, 54],
  [10.5, 1, 3462, 897, 529, 517, 12, 225, 143],
  [10.5, 2, 3362, 1034, 677, 666, 11, 227, 130],
  [11.5, 1, 3962, 2245, 1927, 1895, 32, 144, 174],
  [11.5, 2, 2710, 1562, 1304, 1282, 22, 143, 115],
  [12.5, 1, 3789, 2361, 2117, 2097, 20, 53, 191],
  [12.5, 2, 3085, 1870, 1720, 1699, 21, 42, 108],
  [12.5, 3, 2609, 1181, 1074, 1051, 23, 28, 79],
  [13.5, 1, 4106, 2741, 2466, 2452, 14, 12, 263],
  [13.5, 2, 3311, 2037, 1806, 1795, 11, 22, 209],
  [13.5, 3, 3033, 1879, 1659, 1650, 9, 13, 207],
]);

const EXPECTED_DENOMINATOR_FLOW = Object.freeze([
  ["all_annotated_cells", 41025],
  ["source_Type_step1_Neuron", 18144],
  ["source_typed_nonmotor_neurons", 15394],
  ["fine_subtype_interneurons", 15217],
  ["cardinal_only_interneurons", 177],
  ["excluded_motor_neurons", 1056],
  ["excluded_Null_Neuron", 1694],
]);

const EXPECTED_TIMEPOINTS = Object.freeze([9.5, 10.5, 11.5, 12.5, 13.5]);
const EXPECTED_FINE_BY_TIMEPOINT = Object.freeze([113, 1183, 3177, 4847, 5897]);
const EXPECTED_CARDINAL_ONLY_BY_TIMEPOINT = Object.freeze([2, 23, 54, 64, 34]);

const FORBIDDEN_KEYS = new Set([
  "perCellRoster",
  "cellIds",
  "barcodes",
  "cellXyz",
  "coordinates",
  "registeredCoordinates",
  "atlasTransform",
  "swcPath",
  "vertices",
  "faces",
  "meshes",
  "axonSegments",
  "dendriteSegments",
  "synapses",
  "internalObjects",
  "organelleMeshes",
  "adultCanonicalType",
  "crossSourceIdentityMap",
  "sourceFileBody",
]);

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

function jsonEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function roundedPercentage(numerator, denominator) {
  return Number(((numerator / denominator) * 100).toFixed(6));
}

function formatSchemaErrors(errors = []) {
  return errors.map((error) => `${error.instancePath || "/"}: ${error.message ?? "schema violation"}`);
}

function collectForbiddenKeys(value, path = "$") {
  const findings = [];
  if (Array.isArray(value)) {
    value.forEach((item, index) => findings.push(...collectForbiddenKeys(item, `${path}[${index}]`)));
    return findings;
  }
  if (!value || typeof value !== "object") return findings;
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (FORBIDDEN_KEYS.has(key)) findings.push(childPath);
    findings.push(...collectForbiddenKeys(child, childPath));
  }
  return findings;
}

async function schemaValidator() {
  const schema = JSON.parse(await readFile(SCHEMA_URL, "utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  return ajv.compile(schema);
}

function validateReceiptAndRights(taxonomy, errors) {
  const repository = taxonomy.source?.repository ?? {};
  const object = taxonomy.source?.annotatedMetadataObject ?? {};
  check(repository.pinnedCommit === EXPECTED_RECEIPT.pinnedCommit, "Delile repository commit changed", errors);
  check(repository.rightsStatus === "public_repository_no_explicit_license" && repository.license === "NOASSERTION", "repository rights must remain no-explicit-license / NOASSERTION", errors);
  check(repository.sourceFilesBundled === false && repository.derivedFactualContractBundled === true, "only the compact factual derivative may be bundled", errors);
  for (const field of ["bytes", "md5", "sha256", "gitBlobSha1"]) {
    check(object[field] === EXPECTED_RECEIPT[field], `annotated metadata receipt ${field} changed`, errors);
  }
  check(object.rowCount === 41025 && object.columnCount === 9, "annotated metadata dimensions must remain 41,025 rows by nine columns", errors);
  check(object.sourceFileBundled === false && object.accessMode === "link_only", "source TSV must remain link-only and non-bundled", errors);
  check(object.rightsStatus === "public_repository_no_explicit_license" && object.license === "NOASSERTION", "source TSV rights must remain NOASSERTION", errors);
  check(taxonomy.source?.biostudies?.accession === "E-MTAB-7320", "BioStudies accession must remain E-MTAB-7320", errors);
}

function validateDenominators(taxonomy, errors) {
  const scope = taxonomy.scope ?? {};
  const exactScope = {
    totalMetadataCellCount: 41025,
    sourceDefinedNeuronCellCount: 18144,
    sourceTypedNonmotorNeuronCellCount: 15394,
    fineSubtypeInterneuronCellCount: 15217,
    cardinalOnlyInterneuronCellCount: 177,
    motorNeuronExcludedCellCount: 1056,
    nullNeuronExcludedCellCount: 1694,
    cardinalClassCount: 11,
    fineSubtypeProfileCount: 51,
    sourceStageReplicateLabelCount: 12,
  };
  for (const [field, expected] of Object.entries(exactScope)) {
    check(scope[field] === expected, `scope.${field} must remain ${expected}`, errors);
  }
  check(scope.biologicalAnimalCount === null, "animal denominator must remain explicitly unresolved", errors);
  check(scope.perCellRosterBundled === false, "per-cell roster must remain non-bundled", errors);
  const observedFlow = (taxonomy.denominatorFlow ?? []).map((row) => [row.stage, row.count]);
  check(jsonEqual(observedFlow, EXPECTED_DENOMINATOR_FLOW), "denominator flow or exclusions changed", errors);
  check(scope.sourceDefinedNeuronCellCount === scope.sourceTypedNonmotorNeuronCellCount + scope.motorNeuronExcludedCellCount + scope.nullNeuronExcludedCellCount, "Neuron denominator must partition into typed non-motor, MN and Null_Neuron cells", errors);
  check(scope.sourceTypedNonmotorNeuronCellCount === scope.fineSubtypeInterneuronCellCount + scope.cardinalOnlyInterneuronCellCount, "typed non-motor denominator must partition into fine-subtype and cardinal-only cells", errors);
}

function sampleTuple(sample) {
  return [
    sample.sourceTimepoint,
    sample.sourceReplicateId,
    sample.totalMetadataCellCount,
    sample.sourceDefinedNeuronCellCount,
    sample.sourceTypedNonmotorNeuronCellCount,
    sample.fineSubtypeInterneuronCellCount,
    sample.cardinalOnlyInterneuronCellCount,
    sample.motorNeuronExcludedCellCount,
    sample.nullNeuronExcludedCellCount,
  ];
}

function validateSamples(taxonomy, errors) {
  const samples = taxonomy.sampleRecords ?? [];
  check(jsonEqual(samples.map(sampleTuple), EXPECTED_SAMPLES), "stage-replicate sample count table changed", errors);
  for (const sample of samples) {
    check(sample.lifeStage === `E${sample.sourceTimepoint}`, `sample ${sample.sourceTimepoint}|${sample.sourceReplicateId} life-stage label changed`, errors);
    check(sample.sourceDefinedNeuronCellCount === sample.sourceTypedNonmotorNeuronCellCount + sample.motorNeuronExcludedCellCount + sample.nullNeuronExcludedCellCount, `sample ${sample.sourceTimepoint}|${sample.sourceReplicateId} Neuron partition is inconsistent`, errors);
    check(sample.sourceTypedNonmotorNeuronCellCount === sample.fineSubtypeInterneuronCellCount + sample.cardinalOnlyInterneuronCellCount, `sample ${sample.sourceTimepoint}|${sample.sourceReplicateId} non-motor partition is inconsistent`, errors);
  }
}

function validateCardinals(taxonomy, errors) {
  const observed = (taxonomy.cardinalClassSummaries ?? []).map((row) => [row.sourceLocalLabel, row.sourceTypedCellCount, row.fineSubtypeCellCount, row.cardinalOnlyCellCount]);
  check(jsonEqual(observed, EXPECTED_CARDINALS), "exact cardinal-class count table changed", errors);
  const cardinalOnly = taxonomy.cardinalOnlySummaries ?? [];
  check(jsonEqual(cardinalOnly.map((row) => [row.sourceLocalLabel, row.cellCount]), [["dl6", 95], ["V2a", 82]]), "cardinal-only cells must remain exactly 95 dl6 plus 82 V2a", errors);
  for (const row of cardinalOnly) {
    check(jsonEqual(row.timepointCellCounts.map((item) => item.sourceTimepoint), EXPECTED_TIMEPOINTS), `${row.sourceLocalLabel} cardinal-only timepoint order changed`, errors);
    check(row.timepointCellCounts.reduce((sum, item) => sum + item.cellCount, 0) === row.cellCount, `${row.sourceLocalLabel} cardinal-only timepoint counts do not sum to its denominator`, errors);
  }
  const cardinalOnlyByTimepoint = EXPECTED_TIMEPOINTS.map((_, index) => cardinalOnly.reduce((sum, row) => sum + row.timepointCellCounts[index].cellCount, 0));
  check(jsonEqual(cardinalOnlyByTimepoint, EXPECTED_CARDINAL_ONLY_BY_TIMEPOINT), "cardinal-only timepoint totals changed", errors);
  const timepointReceipt = cardinalOnly.map((row) => [row.sourceLocalLabel, ...row.timepointCellCounts.map((item) => item.cellCount)]);
  check(sha256(Buffer.from(JSON.stringify(timepointReceipt), "utf8")) === EXPECTED_CARDINAL_ONLY_TIMEPOINT_SHA256, "exact cardinal-only timepoint table changed", errors);
}

function validateProfiles(taxonomy, errors) {
  const profiles = taxonomy.profiles ?? [];
  check(jsonEqual(profiles.map((profile) => [profile.sourceLocalLabel, profile.cellCount]), EXPECTED_PROFILES), "exact 51-label / 15,217-cell profile roster changed", errors);
  check(profiles.reduce((sum, profile) => sum + profile.cellCount, 0) === 15217, "profile cell counts must sum to 15,217", errors);
  const ids = new Set();
  for (const profile of profiles) {
    check(!profile.sourceLocalLabel.includes("dI"), `${profile.sourceLocalLabel} silently normalizes source dl spelling`, errors);
    check(profile.id === `delile-2019:E-MTAB-7320:${profile.sourceLocalLabel}`, `${profile.sourceLocalLabel} profile ID changed`, errors);
    check(!ids.has(profile.id), `duplicate profile ID ${profile.id}`, errors);
    ids.add(profile.id);
    check(profile.cardinalClass === profile.sourceLocalLabel.slice(0, profile.sourceLocalLabel.indexOf(".")), `${profile.sourceLocalLabel} cardinal class changed`, errors);
    check(profile.percentOfFineSubtypeInterneuronCells === roundedPercentage(profile.cellCount, 15217), `${profile.sourceLocalLabel} percentage changed`, errors);
    check(jsonEqual(profile.timepointCellCounts.map((item) => item.sourceTimepoint), EXPECTED_TIMEPOINTS), `${profile.sourceLocalLabel} timepoint order changed`, errors);
    check(profile.timepointCellCounts.every((item) => item.lifeStage === `E${item.sourceTimepoint}`), `${profile.sourceLocalLabel} life-stage label changed`, errors);
    check(profile.timepointCellCounts.reduce((sum, item) => sum + item.cellCount, 0) === profile.cellCount, `${profile.sourceLocalLabel} timepoint counts do not sum to its denominator`, errors);
    check(profile.dvObservedCellCount === profile.cellCount, `${profile.sourceLocalLabel} source DV availability changed`, errors);
    check(profile.pseudotimeObservedCellCount === profile.cellCount, `${profile.sourceLocalLabel} source pseudotime availability changed`, errors);
    check(jsonEqual(profile.missingEvidence, taxonomy.globalMissingEvidence), `${profile.sourceLocalLabel} missing-evidence contract drifted`, errors);
    check(profile.sourceLocators?.[0]?.includes(`Neuron_subtypes=${profile.sourceLocalLabel}`), `${profile.sourceLocalLabel} source locator changed`, errors);
  }
  const fineByTimepoint = EXPECTED_TIMEPOINTS.map((_, index) => profiles.reduce((sum, profile) => sum + profile.timepointCellCounts[index].cellCount, 0));
  check(jsonEqual(fineByTimepoint, EXPECTED_FINE_BY_TIMEPOINT), "fine-subtype timepoint totals changed", errors);
  const timepointReceipt = profiles.map((profile) => [profile.sourceLocalLabel, ...profile.timepointCellCounts.map((item) => item.cellCount)]);
  check(sha256(Buffer.from(JSON.stringify(timepointReceipt), "utf8")) === EXPECTED_PROFILE_TIMEPOINT_SHA256, "exact 51-profile timepoint table changed", errors);
}

function validateEvidenceBoundaries(taxonomy, errors) {
  const scope = taxonomy.scope ?? {};
  for (const field of [
    "admittedGeometryCount",
    "admittedInternalStructureCount",
    "sameCellMorphologyTranscriptomicsJoinCount",
    "sameCellPhysiologyTranscriptomicsJoinCount",
    "sameCellInternalStructureTranscriptomicsJoinCount",
    "projectRegistrationCount",
    "exactCrossSourceIdentityCount",
  ]) {
    check(scope[field] === 0, `scope.${field} must remain zero`, errors);
  }
  const join = taxonomy.joinPolicy ?? {};
  check(join.perCellRosterBundled === false, "join policy must keep per-cell roster non-bundled", errors);
  check(join.crossSourceJoinAllowed === false, "cross-source joins must remain forbidden", errors);
  check(join.typeToMorphologyJoinAllowed === false && join.typeToPhysiologyJoinAllowed === false && join.typeToInternalStructureJoinAllowed === false, "morphology, physiology and internal joins must remain forbidden", errors);
  check(join.sourcePseudotimeIsPhysicalCoordinate === false && join.sourceDvClassIsAtlasRegistration === false, "source pseudotime/DV must not become physical geometry or registration", errors);
  check(join.projectAtlasTransform === null, "project atlas transform must remain null", errors);
  const forbidden = collectForbiddenKeys(taxonomy);
  check(forbidden.length === 0, `forbidden per-cell/geometry/internal/cross-source fields found: ${forbidden.join(", ")}`, errors);
}

export async function validateDelileDevelopmentalInterneuronTaxonomy(taxonomy) {
  const validateSchema = await schemaValidator();
  if (!validateSchema(taxonomy)) {
    throw new Error(`Delile developmental interneuron taxonomy schema validation failed:\n${formatSchemaErrors(validateSchema.errors).map((item) => `- ${item}`).join("\n")}`);
  }

  const errors = [];
  validateReceiptAndRights(taxonomy, errors);
  validateDenominators(taxonomy, errors);
  validateSamples(taxonomy, errors);
  validateCardinals(taxonomy, errors);
  validateProfiles(taxonomy, errors);
  validateEvidenceBoundaries(taxonomy, errors);
  if (errors.length > 0) throw new Error(`Delile developmental interneuron taxonomy validation failed:\n${errors.map((item) => `- ${item}`).join("\n")}`);
  return {
    releaseId: taxonomy.releaseId,
    sourceCellCount: taxonomy.scope.totalMetadataCellCount,
    sourceDefinedNeuronCellCount: taxonomy.scope.sourceDefinedNeuronCellCount,
    sourceTypedNonmotorNeuronCellCount: taxonomy.scope.sourceTypedNonmotorNeuronCellCount,
    fineSubtypeProfileCount: taxonomy.profiles.length,
    fineSubtypeInterneuronCellCount: taxonomy.scope.fineSubtypeInterneuronCellCount,
    cardinalOnlyInterneuronCellCount: taxonomy.scope.cardinalOnlyInterneuronCellCount,
    motorNeuronExcludedCellCount: taxonomy.scope.motorNeuronExcludedCellCount,
    nullNeuronExcludedCellCount: taxonomy.scope.nullNeuronExcludedCellCount,
    admittedGeometryCount: taxonomy.scope.admittedGeometryCount,
    admittedInternalStructureCount: taxonomy.scope.admittedInternalStructureCount,
    sameCellCrossModalJoinCount:
      taxonomy.scope.sameCellMorphologyTranscriptomicsJoinCount +
      taxonomy.scope.sameCellPhysiologyTranscriptomicsJoinCount +
      taxonomy.scope.sameCellInternalStructureTranscriptomicsJoinCount,
    projectRegistrationCount: taxonomy.scope.projectRegistrationCount,
  };
}

export async function validatePersistedDelileDevelopmentalInterneuronTaxonomy() {
  const bytes = await readFile(DATA_URL);
  if (bytes.byteLength !== EXPECTED_CANONICAL_DATA_RECEIPT.bytes) {
    throw new Error(`persisted Delile taxonomy byte count changed: expected ${EXPECTED_CANONICAL_DATA_RECEIPT.bytes}, received ${bytes.byteLength}`);
  }
  const observedSha256 = sha256(bytes);
  if (observedSha256 !== EXPECTED_CANONICAL_DATA_RECEIPT.sha256) {
    throw new Error(`persisted Delile taxonomy SHA-256 changed: expected ${EXPECTED_CANONICAL_DATA_RECEIPT.sha256}, received ${observedSha256}`);
  }
  const taxonomy = JSON.parse(bytes.toString("utf8"));
  const report = await validateDelileDevelopmentalInterneuronTaxonomy(taxonomy);
  if (!Buffer.from(stableJson(taxonomy), "utf8").equals(bytes)) {
    throw new Error("persisted Delile taxonomy is not deterministic two-space JSON with a terminal newline");
  }
  return { ...report, bytes: bytes.byteLength, sha256: observedSha256 };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file://${process.argv[1]}`))) {
  try {
    const report = await validatePersistedDelileDevelopmentalInterneuronTaxonomy();
    console.log(`Delile developmental interneuron taxonomy validation passed: ${report.fineSubtypeProfileCount} profiles / ${report.fineSubtypeInterneuronCellCount} cells (${report.sha256})`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
