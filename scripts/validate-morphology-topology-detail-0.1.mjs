#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  buildMorphologyTopologyDetailArtifacts,
  canonicalContentSha256,
  canonicalJsonBytes,
} from "../tools/build_morphology_topology_detail.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_PATH = path.join(PROJECT_ROOT, "data/morphology-topology-detail-0.1.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/morphology-topology-detail-0.1.schema.json");
const RUNTIME_PATH = path.join(PROJECT_ROOT, "public/data/morphology_topology_detail_v1/index.json");
const EXPECTED_SUPPLEMENTARY_IDS = Object.freeze([45674, 45718, 50394, 50408, 50424, 170035, 249676]);

function digest(bytes) {
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
  return JSON.stringify(stableValue(left)) === JSON.stringify(stableValue(right));
}

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

function isStrictlySortedUniqueIntegers(values) {
  return Array.isArray(values) && values.every((value, index) =>
    Number.isInteger(value) && value > 0 && (index === 0 || value > values[index - 1]));
}

function validateZeroBoundary(boundary, label, errors) {
  check(boundary?.analysisUnit === "NeuroMorpho_record", `${label}.analysisUnit drifted`, errors);
  for (const key of ["combinedCensusClaim", "biologicalZeroInferredFromAbsentSourceType"]) {
    check(boundary?.[key] === false, `${label}.${key} must remain false`, errors);
  }
  for (const key of [
    "somaContourClaimCount",
    "membraneClaimCount",
    "internalStructureClaimCount",
    "atlasPlacementCount",
    "atlasTransformCount",
    "registrationCount",
    "completeBiologicalAxonClaimCount",
    "crossSourceIdentityCount",
    "generatedBiologicalPrimitiveCount",
  ]) check(boundary?.[key] === 0, `${label}.${key} must remain zero`, errors);
}

function validateSholl(profile, label, errors) {
  check(Array.isArray(profile), `${label} must be an array`, errors);
  if (!Array.isArray(profile)) return;
  for (let index = 0; index < profile.length; index += 1) {
    const row = profile[index];
    check(row?.radiusMicrometre === (index + 1) * 10, `${label}[${index}] radius must preserve the 10-micrometre sequence`, errors);
    check(Number.isInteger(row?.intersectionCount) && row.intersectionCount >= 0, `${label}[${index}] intersection count is invalid`, errors);
  }
}

function unavailableHasNumericMorphology(value) {
  const forbidden = new Set([
    "nodeCount",
    "segmentCount",
    "cableLengthMicrometre",
    "terminalNodeCount",
    "bifurcationNodeCount",
    "maximumCentrifugalBranchOrder",
    "maximumRootEuclideanDistanceMicrometre",
    "shollProfile",
  ]);
  return Object.keys(value ?? {}).some((key) => forbidden.has(key));
}

export function collectMorphologyTopologyDetailErrors(contract, runtimeIndex) {
  const errors = [];
  check(contract?.documentType === "morphology_topology_detail_contract", "Root topology contract identity drifted", errors);
  check(contract?.contractId === "morphology-topology-detail-0.1", "Root topology contract ID drifted", errors);
  check(runtimeIndex?.documentType === "morphology_topology_detail_index", "Runtime topology index identity drifted", errors);
  check(runtimeIndex?.schemaVersion === "0.1.0" && runtimeIndex?.releaseId === contract?.releaseId, "Root/runtime topology release identity disagrees", errors);
  check(contract?.runtimeAsset?.path === "public/data/morphology_topology_detail_v1/index.json", "Runtime repository path drifted", errors);
  check(contract?.runtimeAsset?.fetchPath === "/data/morphology_topology_detail_v1/index.json", "Runtime browser fetch path drifted", errors);
  check(contract?.runtimeAsset?.recordCount === 149, "Runtime receipt record count must equal 149", errors);
  check(contract?.contractContentSha256 === canonicalContentSha256(contract), "Root topology contract content receipt drifted", errors);
  check(same(contract?.analysisPolicy, runtimeIndex?.analysisPolicy), "Root/runtime topology policy disagrees", errors);
  check(same(contract?.sourceTypeSemantics, runtimeIndex?.sourceTypeSemantics), "Root/runtime source-type semantics disagree", errors);
  check(same(contract?.summary, runtimeIndex?.summary), "Root/runtime topology summary disagrees", errors);
  check(same(contract?.scientificBoundary, runtimeIndex?.scientificBoundary), "Root/runtime scientific boundary disagrees", errors);
  validateZeroBoundary(contract?.scientificBoundary, "contract.scientificBoundary", errors);
  validateZeroBoundary(runtimeIndex?.scientificBoundary, "runtimeIndex.scientificBoundary", errors);
  check(contract?.analysisPolicy?.sourceTypeAbsence === "UNAVAILABLE_not_biological_zero", "Absent source types gained a zero-value policy", errors);
  check(contract?.analysisPolicy?.somaType1 === "standardized_soma_samples_never_contour_surface_membrane_or_internal_structure", "Source type 1 gained contour or structure semantics", errors);
  check(contract?.analysisPolicy?.sholl?.radiusStepMicrometre === 10, "Sholl step drifted", errors);
  check(contract?.analysisPolicy?.sholl?.endpointInterval === "half_open_t_in_(0,1]", "Sholl endpoint interval drifted", errors);

  const records = runtimeIndex?.records;
  check(Array.isArray(records) && records.length === 149, "Runtime topology index must contain exactly 149 records", errors);
  if (!Array.isArray(records)) return errors;
  const ids = records.map((record) => record?.neuronId);
  check(ids.every((id, index) => Number.isInteger(id) && (index === 0 || id > ids[index - 1])), "Runtime neuron IDs must be unique and numerically sorted", errors);
  const frozenRecords = records.filter((record) => record?.membership?.collection === "frozen_census");
  const supplementaryRecords = records.filter((record) => record?.membership?.collection === "supplementary");
  check(frozenRecords.length === 142, "Frozen-census topology membership must remain 142", errors);
  check(supplementaryRecords.length === 7, "Supplementary topology membership must remain seven", errors);
  check(same(supplementaryRecords.map((record) => record.neuronId), EXPECTED_SUPPLEMENTARY_IDS), "Supplementary topology IDs drifted", errors);

  let totalNodes = 0;
  let totalSegments = 0;
  let totalNeuriteSegments = 0;
  let totalTerminals = 0;
  let totalBifurcations = 0;
  const geometryPaths = new Set();
  for (const record of records) {
    const label = `NMO ${record?.neuronId}`;
    const membership = record?.membership;
    if (membership?.collection === "frozen_census") {
      check(membership.frozenCensusContribution === 1 && membership.supplementaryContribution === 0 && membership.frozenCensusMembership === true, `${label} frozen membership arithmetic drifted`, errors);
    } else if (membership?.collection === "supplementary") {
      check(membership.frozenCensusContribution === 0 && membership.supplementaryContribution === 1 && membership.frozenCensusMembership === false, `${label} supplementary membership arithmetic drifted`, errors);
      check(typeof membership.routeId === "string" && membership.routeId.length > 0, `${label} supplementary route membership is missing`, errors);
    }
    check(membership?.combinedCensusClaim === false, `${label} became a combined-census claim`, errors);
    check(record?.assetId === `NeuroMorpho:${record?.neuronId}`, `${label} asset identity drifted`, errors);
    const geometry = record?.geometryReceipt;
    check(typeof geometry?.path === "string" && geometry.path.startsWith("public/data/"), `${label} geometry repository path is invalid`, errors);
    check(typeof geometry?.fetchPath === "string" && geometry.fetchPath.startsWith("/data/"), `${label} geometry fetch path is invalid`, errors);
    check(Number.isInteger(geometry?.bytes) && geometry.bytes > 0 && /^[0-9a-f]{64}$/.test(geometry?.sha256 ?? ""), `${label} geometry receipt is invalid`, errors);
    check(!geometryPaths.has(geometry?.path), `${label} duplicates a source geometry path`, errors);
    geometryPaths.add(geometry?.path);
    check(geometry?.sourceFrame === "NeuroMorpho_CNG_standardized_local_frame" && geometry?.units === "micrometre_reported_by_source", `${label} source frame or unit drifted`, errors);
    check(geometry?.registrationCount === 0, `${label} gained a registration claim`, errors);

    const topology = record?.topology;
    check(Number.isInteger(topology?.nodeCount) && topology.nodeCount > 1, `${label} node count is invalid`, errors);
    check(topology?.segmentCount === topology?.nodeCount - 1, `${label} segment count must equal node count minus one`, errors);
    check(Number.isInteger(topology?.neuriteSegmentCount) && topology.neuriteSegmentCount > 0 && topology.neuriteSegmentCount <= topology.segmentCount, `${label} neurite segment count is invalid`, errors);
    check(topology?.rootNodeId === topology?.rootLandmark?.nodeId && topology?.rootLandmark?.sourceType === 1, `${label} exact root landmark drifted`, errors);
    check(topology?.rootLandmark?.semanticStatus === "standardized_soma_sample_not_contour", `${label} root was promoted to a soma contour`, errors);
    const landmarks = topology?.landmarks;
    check(isStrictlySortedUniqueIntegers(landmarks?.rootNodeIds) && landmarks.rootNodeIds.length === 1 && landmarks.rootNodeIds[0] === topology.rootNodeId, `${label} root landmark IDs are invalid`, errors);
    check(isStrictlySortedUniqueIntegers(landmarks?.terminalNodeIds), `${label} terminal landmark IDs are invalid`, errors);
    check(isStrictlySortedUniqueIntegers(landmarks?.bifurcationNodeIds), `${label} bifurcation landmark IDs are invalid`, errors);
    const exactLandmarkIds = {
      rootNodeIds: landmarks?.rootNodeIds,
      bifurcationNodeIds: landmarks?.bifurcationNodeIds,
      terminalNodeIds: landmarks?.terminalNodeIds,
    };
    check(landmarks?.landmarkReceiptSha256 === digest(Buffer.from(JSON.stringify(stableValue(exactLandmarkIds)), "utf8")), `${label} landmark receipt hash drifted`, errors);
    check(topology?.neuriteSummary?.terminalNodeCount === landmarks?.terminalNodeIds?.length, `${label} terminal landmark count disagrees`, errors);
    check(topology?.neuriteSummary?.bifurcationNodeCount === landmarks?.bifurcationNodeIds?.length, `${label} bifurcation landmark count disagrees`, errors);
    validateSholl(topology?.neuriteSummary?.shollProfile, `${label}.topology.neuriteSummary.shollProfile`, errors);

    const domains = topology?.sourceTypeDomains;
    check(Array.isArray(domains) && domains.length >= 2, `${label} source-type domains are missing`, errors);
    if (Array.isArray(domains)) {
      check(domains.every((domain, index) => Number.isInteger(domain.sourceType) && (index === 0 || domain.sourceType > domains[index - 1].sourceType)), `${label} source-type domains must be unique and sorted`, errors);
      const soma = domains.find((domain) => domain.sourceType === 1);
      check(soma?.semanticStatus === "standardized_soma_samples_not_contour", `${label} source type 1 was promoted to a contour`, errors);
      check(soma?.nodeCount === soma?.standardizedSomaSampleNodeIds?.length && soma?.nodeCount >= 1, `${label} soma sample node membership drifted`, errors);
      check(soma?.neuriteMetrics?.status === "UNAVAILABLE" && soma?.neuriteMetrics?.biologicalAbsenceClaim === false, `${label} type-1 neurite metrics must remain unavailable`, errors);
      check(!("cableLengthMicrometre" in (soma ?? {})) && !("shollProfile" in (soma ?? {})), `${label} type-1 samples gained contour-like cable or Sholl metrics`, errors);
      for (const domain of domains.filter((candidate) => candidate.sourceType !== 1)) {
        check(domain.semanticStatus === (domain.sourceType >= 2 && domain.sourceType <= 4 ? "standardized_swc_source_type" : "source_defined_uninterpreted"), `${label} source type ${domain.sourceType} semantic status drifted`, errors);
        for (const key of ["nodeCount", "segmentCount", "terminalNodeCount", "bifurcationNodeCount", "maximumCentrifugalBranchOrder", "zeroLengthSegmentCount"]) {
          check(Number.isInteger(domain[key]) && domain[key] >= 0, `${label} source type ${domain.sourceType} ${key} is invalid`, errors);
        }
        check(Number.isFinite(domain.cableLengthMicrometre) && domain.cableLengthMicrometre >= 0, `${label} source type ${domain.sourceType} cable length is invalid`, errors);
        check(domain.terminalNodeCount === domain.landmarkNodeIds?.terminalNodeIds?.length, `${label} source type ${domain.sourceType} terminal landmarks disagree`, errors);
        check(domain.bifurcationNodeCount === domain.landmarkNodeIds?.bifurcationNodeIds?.length, `${label} source type ${domain.sourceType} bifurcation landmarks disagree`, errors);
        validateSholl(domain.shollProfile, `${label}.sourceType${domain.sourceType}.shollProfile`, errors);
      }
    }

    const availability = topology?.canonicalNeuriteTypeAvailability;
    check(Array.isArray(availability) && same(availability.map((row) => row.sourceType), [2, 3, 4]), `${label} canonical source-type availability must cover exactly 2, 3 and 4`, errors);
    for (const row of availability ?? []) {
      const domainIndex = domains?.findIndex((domain) => domain.sourceType === row.sourceType) ?? -1;
      if (domainIndex >= 0) {
        check(row.status === "PRESENT" && row.sourceTypeDomainIndex === domainIndex, `${label} source type ${row.sourceType} present-domain pointer drifted`, errors);
      } else {
        check(row.status === "UNAVAILABLE", `${label} absent source type ${row.sourceType} must be unavailable`, errors);
        check(row.reasonCode === "source_type_not_present_in_deposited_geometry" && row.biologicalAbsenceClaim === false, `${label} absent source type ${row.sourceType} gained a biological-zero claim`, errors);
        check(!unavailableHasNumericMorphology(row), `${label} unavailable source type ${row.sourceType} was padded with morphology zeros`, errors);
      }
    }
    totalNodes += topology?.nodeCount ?? 0;
    totalSegments += topology?.segmentCount ?? 0;
    totalNeuriteSegments += topology?.neuriteSegmentCount ?? 0;
    totalTerminals += landmarks?.terminalNodeIds?.length ?? 0;
    totalBifurcations += landmarks?.bifurcationNodeIds?.length ?? 0;
  }
  check(geometryPaths.size === 149, "Source geometry membership is not one-to-one", errors);
  check(runtimeIndex?.summary?.totalNodeCount === totalNodes, "Aggregate node count drifted", errors);
  check(runtimeIndex?.summary?.totalSegmentCount === totalSegments, "Aggregate segment count drifted", errors);
  check(runtimeIndex?.summary?.totalNeuriteSegmentCount === totalNeuriteSegments, "Aggregate neurite segment count drifted", errors);
  check(runtimeIndex?.summary?.totalTerminalLandmarkCount === totalTerminals, "Aggregate terminal count drifted", errors);
  check(runtimeIndex?.summary?.totalBifurcationLandmarkCount === totalBifurcations, "Aggregate bifurcation count drifted", errors);
  return errors;
}

function schemaErrorText(validate) {
  return (validate.errors ?? []).map((error) => `${error.instancePath || "/"}: ${error.message}`).join("\n");
}

export async function validateMorphologyTopologyDetail(contractOverride = null, runtimeOverride = null) {
  const [contractBytes, runtimeBytes, schemaText] = await Promise.all([
    readFile(CONTRACT_PATH),
    readFile(RUNTIME_PATH),
    readFile(SCHEMA_PATH, "utf8"),
  ]);
  const contract = contractOverride ?? JSON.parse(contractBytes.toString("utf8"));
  const runtimeIndex = runtimeOverride ?? JSON.parse(runtimeBytes.toString("utf8"));
  const schema = JSON.parse(schemaText);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const schemaValidate = ajv.compile(schema);
  if (!schemaValidate(contract)) throw new Error(`Morphology topology root schema validation failed:\n${schemaErrorText(schemaValidate)}`);

  const errors = collectMorphologyTopologyDetailErrors(contract, runtimeIndex);
  const runtimeCandidateBytes = canonicalJsonBytes(runtimeIndex);
  check(contract.runtimeAsset.bytes === runtimeCandidateBytes.byteLength, "Runtime topology byte receipt drifted", errors);
  check(contract.runtimeAsset.sha256 === digest(runtimeCandidateBytes), "Runtime topology SHA-256 receipt drifted", errors);
  const expected = await buildMorphologyTopologyDetailArtifacts();
  check(canonicalJsonBytes(contract).equals(expected.contractBytes), "Root topology contract is not the deterministic builder output", errors);
  check(runtimeCandidateBytes.equals(expected.runtimeBytes), "Runtime topology index is not the deterministic builder output", errors);
  if (errors.length > 0) throw new Error(`Morphology topology detail validation failed:\n- ${errors.join("\n- ")}`);
  return { contract, runtimeIndex, summary: contract.summary };
}

async function main() {
  const result = await validateMorphologyTopologyDetail();
  console.log(
    `morphology topology detail valid: ${result.summary.frozenCensusRecordCount} + ` +
    `${result.summary.supplementaryRecordCount} records, ${result.summary.totalNodeCount} nodes, ` +
    `${result.summary.totalTerminalLandmarkCount} terminal and ` +
    `${result.summary.totalBifurcationLandmarkCount} bifurcation landmarks`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  });
}

