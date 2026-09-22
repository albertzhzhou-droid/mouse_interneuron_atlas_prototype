import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  RADIUS_SURFACE_ALGORITHM_ID,
  RADIUS_SURFACE_REPRESENTATION,
  SOURCE_LOCAL_SWC_GEOMETRY_STATUS,
} from "../app/source-local-morphology-geometry.js";

const CONTRACT_URL = new URL("../data/morphology-fidelity-contract-0.1.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/morphology-fidelity-contract-0.1.schema.json", import.meta.url);
const PUBLIC_DATA_ROOT = new URL("../public/data/", import.meta.url);

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function failIf(condition, message, errors) {
  if (condition) errors.push(message);
}

function sourcePathUrl(path) {
  return new URL(path.replace(/^\/data\//, ""), PUBLIC_DATA_ROOT);
}

export async function validateMorphologyFidelityContract() {
  const [contract, schema] = await Promise.all([
    readFile(CONTRACT_URL, "utf8").then(JSON.parse),
    readFile(SCHEMA_URL, "utf8").then(JSON.parse),
  ]);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(contract)) {
    throw new Error(`Morphology fidelity schema validation failed:\n${(validate.errors ?? []).map((error) => `- ${error.instancePath || "/"}: ${error.message}`).join("\n")}`);
  }

  const errors = [];
  const indexBytes = await readFile(sourcePathUrl(contract.sourceObjects.censusIndex.path));
  const manifestBytes = await readFile(sourcePathUrl(contract.sourceObjects.assetManifest.path));
  failIf(indexBytes.byteLength !== contract.sourceObjects.censusIndex.bytes, "census index byte count drifted", errors);
  failIf(digest(indexBytes) !== contract.sourceObjects.censusIndex.sha256, "census index SHA-256 drifted", errors);
  failIf(manifestBytes.byteLength !== contract.sourceObjects.assetManifest.bytes, "asset manifest byte count drifted", errors);
  failIf(digest(manifestBytes) !== contract.sourceObjects.assetManifest.sha256, "asset manifest SHA-256 drifted", errors);

  const census = JSON.parse(indexBytes.toString("utf8"));
  const expectedIds = [104003, 108974, 109005, 242822, 260150];
  failIf(JSON.stringify(contract.records.map((record) => record.neuronId)) !== JSON.stringify(expectedIds), "admitted exemplar IDs or order drifted", errors);
  failIf(new Set(contract.records.map((record) => record.neuronId)).size !== contract.records.length, "duplicate morphology record", errors);
  failIf(contract.derivedSurfaceAlgorithm.algorithmId !== RADIUS_SURFACE_ALGORITHM_ID, "renderer algorithm ID does not match the contract", errors);
  failIf(contract.derivedSurfaceAlgorithm.authority !== RADIUS_SURFACE_REPRESENTATION, "renderer authority does not match the contract", errors);
  failIf(contract.derivedSurfaceAlgorithm.inputAuthority !== SOURCE_LOCAL_SWC_GEOMETRY_STATUS, "renderer input authority does not match the contract", errors);

  for (const record of contract.records) {
    const indexed = census.records.find((candidate) => candidate.neuronId === record.neuronId);
    failIf(!indexed, `NeuroMorpho ${record.neuronId} is absent from the pinned census`, errors);
    if (!indexed) continue;
    const expectedGeometryPath = `/data/neuromorpho_release_8_6_124_census_v1/${indexed.geometry.path}`;
    failIf(record.assetId !== indexed.assetId, `${record.neuronId} asset ID drifted`, errors);
    failIf(record.geometry.path !== expectedGeometryPath, `${record.neuronId} geometry path drifted`, errors);
    failIf(record.geometry.bytes !== indexed.geometry.bytes, `${record.neuronId} geometry byte receipt drifted`, errors);
    failIf(record.geometry.sha256 !== indexed.geometry.sha256, `${record.neuronId} geometry hash receipt drifted`, errors);
    failIf(record.geometry.rawSwcSha256 !== indexed.geometry.rawSwcSha256, `${record.neuronId} raw SWC hash receipt drifted`, errors);
    failIf(record.geometry.sourceDiameterAvailable !== indexed.normalizedMetadata.sourceDiameterAvailable, `${record.neuronId} diameter authority drifted`, errors);
    failIf(record.geometry.dimensionality !== indexed.normalizedMetadata.dimensionality, `${record.neuronId} dimensionality drifted`, errors);
    failIf(record.geometry.nodeCount !== indexed.morphometrics.computed.nodeCount, `${record.neuronId} node count drifted`, errors);
    failIf(record.geometry.segmentCount !== indexed.morphometrics.computed.segmentCount, `${record.neuronId} segment count drifted`, errors);
    failIf(record.axon.sourceType2NodeCount !== (indexed.morphometrics.computed.nodeTypeCounts["2"] ?? 0), `${record.neuronId} axon node count drifted`, errors);
    failIf(record.axon.sourceDomain !== indexed.normalizedMetadata.domain, `${record.neuronId} source domain drifted`, errors);
    failIf(record.axon.completeAxon !== false, `${record.neuronId} must not claim a complete axon`, errors);

    const geometryBytes = await readFile(sourcePathUrl(record.geometry.path));
    failIf(geometryBytes.byteLength !== record.geometry.bytes, `${record.neuronId} geometry bytes do not match receipt`, errors);
    failIf(digest(geometryBytes) !== record.geometry.sha256, `${record.neuronId} geometry SHA-256 does not match receipt`, errors);
    const geometry = JSON.parse(geometryBytes.toString("utf8"));
    failIf(geometry.neuronId !== record.neuronId, `${record.neuronId} geometry payload identity mismatch`, errors);
    failIf(geometry.geometryStatus !== SOURCE_LOCAL_SWC_GEOMETRY_STATUS, `${record.neuronId} geometry is not source-local OBS`, errors);
    failIf(geometry.swc.sourceDiameterAvailable !== record.geometry.sourceDiameterAvailable, `${record.neuronId} geometry diameter authority mismatch`, errors);
    failIf(geometry.swc.dimensionality !== "3D", `${record.neuronId} geometry is not 3D`, errors);
    failIf(geometry.segments.length !== record.geometry.segmentCount, `${record.neuronId} geometry segment count mismatch`, errors);
    failIf(geometry.nodes.length !== record.geometry.nodeCount, `${record.neuronId} geometry node count mismatch`, errors);
    failIf(geometry.registration?.status !== "unregistered", `${record.neuronId} unexpectedly gained registration`, errors);

    const radius = indexed.morphometrics.computed.radiusDerived;
    if (record.geometry.sourceDiameterAvailable) {
      failIf(!radius.value, `${record.neuronId} is diameter-authorized but radius summary is missing`, errors);
      failIf(record.modes.radiusSurface.available !== true || record.modes.radiusSurface.authority !== RADIUS_SURFACE_REPRESENTATION, `${record.neuronId} lost its radius-derived mode`, errors);
      if (radius.value) {
        failIf(record.radiusEvidence.minimumMicrometre !== radius.value.minimumMicrometre, `${record.neuronId} minimum radius drifted`, errors);
        failIf(record.radiusEvidence.maximumMicrometre !== radius.value.maximumMicrometre, `${record.neuronId} maximum radius drifted`, errors);
        failIf(record.radiusEvidence.meanMicrometre !== radius.value.meanMicrometre, `${record.neuronId} mean radius drifted`, errors);
      }
    } else {
      failIf(radius.value !== null || radius.missingReason !== "official_attributes_report_no_diameter", `${record.neuronId} no-diameter evidence drifted`, errors);
      failIf(record.modes.radiusSurface.available !== false || record.modes.radiusSurface.authority !== "UNAVAILABLE", `${record.neuronId} must fail closed to SWC centerlines`, errors);
      failIf(record.radiusEvidence.minimumMicrometre !== null || record.radiusEvidence.maximumMicrometre !== null || record.radiusEvidence.meanMicrometre !== null, `${record.neuronId} contains unauthorized radius claims`, errors);
    }
    failIf(record.modes.internalStructure.available !== false || record.modes.internalStructure.authority !== "UNAVAILABLE", `${record.neuronId} gained unsupported internal structure`, errors);
  }

  failIf(contract.records.filter((record) => record.modes.radiusSurface.available).length !== 3, "exactly three records must authorize radius-derived surfaces", errors);
  failIf(contract.records.filter((record) => record.axon.sourceType2NodeCount > 0).map((record) => record.neuronId).join(",") !== "109005", "only NeuroMorpho 109005 may contain source type-2 axon nodes", errors);
  failIf(!contract.hardBoundaries.some((boundary) => /not an observed membrane/i.test(boundary)), "missing derived-surface membrane boundary", errors);
  failIf(!contract.hardBoundaries.some((boundary) => /No radius-derived surface is rendered/i.test(boundary)), "missing no-diameter fail-closed boundary", errors);
  failIf(!contract.hardBoundaries.some((boundary) => /No nucleus, organelle/i.test(boundary)), "missing internal-structure unavailable boundary", errors);

  if (errors.length) throw new Error(`Morphology fidelity contract validation failed:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  return {
    releaseId: contract.releaseId,
    recordCount: contract.records.length,
    radiusSurfaceCount: contract.records.filter((record) => record.modes.radiusSurface.available).length,
    internalStructureCount: contract.records.filter((record) => record.modes.internalStructure.available).length,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file://${process.argv[1]}`))) {
  try {
    const result = await validateMorphologyFidelityContract();
    console.log(`Morphology fidelity validation passed: ${result.recordCount} source-local records; ${result.radiusSurfaceCount} radius-derived surfaces; ${result.internalStructureCount} internal-structure models.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
