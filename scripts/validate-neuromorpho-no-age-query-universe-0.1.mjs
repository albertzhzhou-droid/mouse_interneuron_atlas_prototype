#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { parseNeuromorphoSwc } from "../app/neuromorpho-swc-runtime.js";
import { createResearchMvpValidator, formatSchemaErrors } from "./validate-json-schema.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_PATH = path.join(PROJECT_ROOT, "data/neuromorpho-no-age-query-universe-0.1.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/neuromorpho-no-age-query-universe-0.1.schema.json");
const OUTPUT_DIRECTORY = path.join(PROJECT_ROOT, "public/data/neuromorpho_release_8_6_124_no_age_universe_v1");
const CENSUS_INDEX_PATH = path.join(PROJECT_ROOT, "public/data/neuromorpho_release_8_6_124_census_v1/census-index.json");
const SUPPLEMENTARY_ADAPTER_PATH = path.join(PROJECT_ROOT, "data/supplementary-morphology-comparison-adapter-0.1.json");

const EXPECTED = Object.freeze({
  queryRecordCount: 1097,
  admittedSourceObjectCount: 1097,
  quarantinedSourceObjectCount: 0,
  frozenAdultSubsetCount: 142,
  namedRouteCount: 7,
  existingGeometryReferenceCount: 149,
  deltaRawSwcCount: 948,
  sourceLabelled3DCount: 1058,
  sourceLabelled2DCount: 39,
  diameterAuthorizedCount: 955,
  diameterUnavailableCount: 142,
  axonDomainCount: 253,
  completeAxonClaimCount: 0,
  registrationCount: 0,
  sameSpecimenInternalStructureCount: 0,
  paperCount: 12,
  archiveCount: 5,
});

const EXPECTED_DISTRIBUTIONS = Object.freeze({
  byLifeStage: { adult: 142, young: 729, "young adult": 226 },
  byArchive: { Bannatyne: 49, Chen_Dai: 2, Ginty: 650, Hughes: 87, Todd: 309 },
  byAttributes: {
    "Diameter, 2D, Angles": 39,
    "Diameter, 3D, Angles": 916,
    "No Diameter, 3D, Angles": 142,
  },
  byDomain: {
    "Dendrites, Soma, Axon": 253,
    "Dendrites, Soma, No Axon": 842,
    "Neurites, Soma": 2,
  },
  byPhysicalIntegrity: {
    "Dendrites & Axon Moderate": 233,
    "Dendrites Complete": 79,
    "Dendrites Incomplete": 23,
    "Dendrites Moderate": 740,
    "Dendrites Moderate, Axon Incomplete": 20,
    "Neurites Moderate": 2,
  },
});

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function fileDigest(filePath) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function check(errors, condition, message) {
  if (!condition) errors.push(message);
}

function publicPath(publicUrl) {
  if (typeof publicUrl !== "string" || !publicUrl.startsWith("/data/") || publicUrl.includes("..")) {
    throw new Error(`unsafe public data path: ${publicUrl}`);
  }
  const resolved = path.resolve(PROJECT_ROOT, "public", publicUrl.slice(1));
  const publicRoot = path.resolve(PROJECT_ROOT, "public/data");
  if (!resolved.startsWith(`${publicRoot}${path.sep}`)) throw new Error(`public path escaped data root: ${publicUrl}`);
  return resolved;
}

function repositoryPath(relativePath) {
  if (typeof relativePath !== "string" || path.isAbsolute(relativePath) || relativePath.includes("..")) {
    throw new Error(`unsafe repository path: ${relativePath}`);
  }
  const resolved = path.resolve(PROJECT_ROOT, relativePath);
  if (!resolved.startsWith(`${PROJECT_ROOT}${path.sep}`)) throw new Error(`repository path escaped root: ${relativePath}`);
  return resolved;
}

async function readReceipt(receiptPath, expectedBytes, expectedSha256, label, errors) {
  const target = publicPath(receiptPath);
  const bytes = await readFile(target);
  check(errors, bytes.byteLength === expectedBytes, `${label} byte receipt drifted`);
  check(errors, digest(bytes) === expectedSha256, `${label} checksum receipt drifted`);
  return { path: target, bytes, json: JSON.parse(bytes.toString("utf8")) };
}

function countBy(records, readValue) {
  const result = {};
  for (const record of records) {
    const value = String(readValue(record));
    result[value] = (result[value] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(result).sort(([left], [right]) => left.localeCompare(right)));
}

function numberClose(left, right, tolerance = 1e-7) {
  return Number.isFinite(left) && Number.isFinite(right)
    && Math.abs(left - right) <= tolerance * Math.max(1, Math.abs(left), Math.abs(right));
}

function verifyParsedRecord(errors, record, body) {
  let geometry;
  try {
    geometry = parseNeuromorphoSwc(body, {
      assetId: record.assetId,
      neuronId: record.neuronId,
      name: record.normalizedMetadata.name,
      sourceFrame: record.normalizedMetadata.sourceFrame,
      dimensionality: record.normalizedMetadata.dimensionality,
      diameterAuthorized: record.normalizedMetadata.sourceDiameterAvailable,
    });
  } catch (error) {
    errors.push(`NeuroMorpho:${record.neuronId} parser rejected admitted SWC: ${error.message}`);
    return;
  }
  const computed = record.morphometrics.computed;
  check(errors, geometry.computed.nodeCount === computed.nodeCount, `NeuroMorpho:${record.neuronId} node count drifted`);
  check(errors, geometry.computed.segmentCount === computed.segmentCount, `NeuroMorpho:${record.neuronId} segment count drifted`);
  check(errors, same(geometry.computed.nodeTypeCounts, computed.nodeTypeCounts), `NeuroMorpho:${record.neuronId} node types drifted`);
  check(errors, same(geometry.computed.boundsMicrometre, computed.boundsMicrometre), `NeuroMorpho:${record.neuronId} bounds drifted`);
  check(errors, same(geometry.computed.extentMicrometre, computed.extentMicrometre), `NeuroMorpho:${record.neuronId} extents drifted`);
  check(errors, geometry.computed.zeroLengthEdgeCount === computed.zeroLengthEdgeCount, `NeuroMorpho:${record.neuronId} zero-length count drifted`);
  check(errors, numberClose(geometry.computed.totalCableLengthMicrometre, computed.totalCableLengthMicrometre), `NeuroMorpho:${record.neuronId} cable length drifted`);
  check(errors, geometry.radiusSurfaceAuthorized === record.normalizedMetadata.sourceDiameterAvailable, `NeuroMorpho:${record.neuronId} radius authority drifted`);
  check(errors, geometry.extrusionApplied === false, `NeuroMorpho:${record.neuronId} gained 2D/3D extrusion`);
  check(errors, geometry.registration.registrationCount === 0, `NeuroMorpho:${record.neuronId} gained registration`);
}

export async function validateNeuromorphoNoAgeQueryUniverse() {
  const [contractBytes, schema, census, supplementary] = await Promise.all([
    readFile(CONTRACT_PATH),
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    readFile(CENSUS_INDEX_PATH, "utf8").then(JSON.parse),
    readFile(SUPPLEMENTARY_ADAPTER_PATH, "utf8").then(JSON.parse),
  ]);
  const contract = JSON.parse(contractBytes.toString("utf8"));
  const validate = createResearchMvpValidator(schema);
  if (!validate(contract)) {
    throw new Error(`NeuroMorpho no-age universe schema failed:\n- ${formatSchemaErrors(validate.errors).join("\n- ")}`);
  }
  const errors = [];
  const [indexReceipt, manifestReceipt, quarantineReceipt] = await Promise.all([
    readReceipt(contract.dataset.indexPath, contract.dataset.indexBytes, contract.dataset.indexSha256, "universe index", errors),
    readReceipt(contract.dataset.assetManifestPath, contract.dataset.assetManifestBytes, contract.dataset.assetManifestSha256, "asset manifest", errors),
    readReceipt(contract.dataset.quarantinePath, contract.dataset.quarantineBytes, contract.dataset.quarantineSha256, "quarantine report", errors),
  ]);
  const rosterBytes = await readFile(repositoryPath(contract.dataset.runtimeRosterPath));
  check(errors, rosterBytes.byteLength === contract.dataset.runtimeRosterBytes, "runtime roster byte receipt drifted");
  check(errors, digest(rosterBytes) === contract.dataset.runtimeRosterSha256, "runtime roster checksum receipt drifted");
  const roster = JSON.parse(rosterBytes.toString("utf8"));
  const index = indexReceipt.json;
  const manifest = manifestReceipt.json;
  const quarantine = quarantineReceipt.json;
  check(errors, index.documentType === "neuromorpho_no_age_query_universe_index", "universe index document type drifted");
  check(errors, index.repositoryRelease === "8.6.124" && index.snapshotDate === "2026-09-01", "repository release/snapshot date drifted");
  for (const [key, value] of Object.entries(EXPECTED)) {
    check(errors, index.summary[key] === value, `index.summary.${key} expected ${value}, got ${index.summary[key]}`);
    check(errors, contract.summary[key] === value, `contract.summary.${key} expected ${value}, got ${contract.summary[key]}`);
  }
  for (const [key, value] of Object.entries(EXPECTED_DISTRIBUTIONS)) {
    check(errors, same(index.summary[key], value), `index.summary.${key} drifted`);
    check(errors, same(contract.summary[key], value), `contract.summary.${key} drifted`);
  }
  check(errors, index.records.length === 1097, "universe index must contain exactly 1,097 records");
  check(errors, new Set(index.records.map((record) => record.neuronId)).size === 1097, "universe neuron IDs are duplicated");
  check(errors, index.records.every((record, indexPosition, items) => indexPosition === 0 || items[indexPosition - 1].neuronId < record.neuronId), "universe records are not numerically sorted");
  check(errors, quarantine.records.length === 0 && quarantine.quarantinedSourceObjectCount === 0, "quarantine is not empty");
  check(errors, manifest.summary.queryRecordCount === 1097 && manifest.summary.deltaRawSwcCount === 948, "manifest denominators drifted");
  check(errors, manifest.summary.existingGeometryReferenceCount === 149 && manifest.summary.geometryCopyCount === 0, "reuse/copy boundary drifted");

  const pageRecords = [];
  for (const receipt of index.query.pageReceipts) {
    const pageBytes = await readFile(publicPath(receipt.path));
    check(errors, pageBytes.byteLength === receipt.bytes && digest(pageBytes) === receipt.sha256, `API page ${receipt.page} receipt drifted`);
    const page = JSON.parse(pageBytes.toString("utf8"));
    check(errors, page.page.number === receipt.page && page.page.totalElements === 1097 && page.page.totalPages === 3, `API page ${receipt.page} pagination drifted`);
    check(errors, page._embedded.neuronResources.length === receipt.recordCount, `API page ${receipt.page} record count drifted`);
    pageRecords.push(...page._embedded.neuronResources);
  }
  check(errors, pageRecords.length === 1097 && new Set(pageRecords.map((record) => record.neuron_id)).size === 1097, "raw API pages are incomplete or overlapping");
  const numericPageRecords = pageRecords.toSorted((left, right) => left.neuron_id - right.neuron_id);
  check(errors, same(numericPageRecords, index.records.map((record) => record.officialMetadata)), "derived index does not preserve every raw official record");
  check(errors, same(countBy(pageRecords, (record) => record.age_classification), EXPECTED_DISTRIBUTIONS.byLifeStage), "raw life-stage distribution drifted");
  check(errors, same(countBy(pageRecords, (record) => record.archive), EXPECTED_DISTRIBUTIONS.byArchive), "raw archive distribution drifted");
  check(errors, same(countBy(pageRecords, (record) => record.attributes), EXPECTED_DISTRIBUTIONS.byAttributes), "raw attributes distribution drifted");
  check(errors, same(countBy(pageRecords, (record) => record.domain), EXPECTED_DISTRIBUTIONS.byDomain), "raw domain distribution drifted");
  check(errors, same(countBy(pageRecords, (record) => record.physical_Integrity), EXPECTED_DISTRIBUTIONS.byPhysicalIntegrity), "raw integrity distribution drifted");
  check(errors, pageRecords.every((record) => record.reference_doi?.length === 1 && record.reference_pmid?.length === 1), "paper identifiers are not exactly one DOI and PMID per record");
  check(errors, !pageRecords.some((record) => String(record.physical_Integrity).includes("Axon Complete")), "a complete-axon label entered the universe");

  const censusIds = new Set(census.records.map((record) => record.neuronId));
  const routeById = new Map(supplementary.records.map((record) => [record.neuronId, record.comparisonMembership.routeId]));
  const admitted = index.records.filter((record) => record.sourceObject.status === "admitted");
  check(errors, admitted.length === 1097, "not every exact source object is admitted");
  check(errors, roster.indexSha256 === contract.dataset.indexSha256, "runtime roster points to another universe index");
  check(errors, same(roster.admittedNeuronIds, admitted.map((record) => record.neuronId)), "runtime admitted-neuron roster drifted");
  check(errors, same(roster.quarantinedNeuronIds, []), "runtime roster contains quarantined IDs");
  check(errors, index.records.filter((record) => record.memberships.frozenAdultSubset).length === 142, "frozen adult membership drifted");
  check(errors, index.records.filter((record) => record.memberships.namedRouteIds.length).length === 7, "named route membership drifted");
  for (const record of index.records) {
    check(errors, record.assetId === `NeuroMorpho:${record.neuronId}`, `NeuroMorpho:${record.neuronId} asset identity drifted`);
    check(errors, record.memberships.frozenAdultSubset === censusIds.has(record.neuronId), `NeuroMorpho:${record.neuronId} adult membership disagrees`);
    check(errors, same(record.memberships.namedRouteIds, routeById.has(record.neuronId) ? [routeById.get(record.neuronId)] : []), `NeuroMorpho:${record.neuronId} named route membership disagrees`);
    check(errors, record.sourceObject.registrationCount === 0 && record.sourceObject.geometryCopyCount === 0, `NeuroMorpho:${record.neuronId} gained registration or geometry copy`);
    check(errors, record.normalizedMetadata.registrationStatus === "unregistered", `NeuroMorpho:${record.neuronId} normalized registration drifted`);
    check(errors, record.missingness.donorId.value === null && record.missingness.specimenId.value === null, `NeuroMorpho:${record.neuronId} invented donor/specimen identity`);
    const swcPath = publicPath(record.sourceObject.rawSwcPath);
    const info = await stat(swcPath);
    check(errors, info.size === record.sourceObject.rawSwcBytes, `NeuroMorpho:${record.neuronId} SWC bytes drifted`);
    const swcHash = await fileDigest(swcPath);
    check(errors, swcHash === record.sourceObject.rawSwcSha256, `NeuroMorpho:${record.neuronId} SWC hash drifted`);
    const body = await readFile(swcPath);
    verifyParsedRecord(errors, record, body);
    if (record.memberships.frozenAdultSubset || record.memberships.namedRouteIds.length) {
      check(errors, record.sourceObject.transport === "existing_generated_geometry", `NeuroMorpho:${record.neuronId} existing asset was not reused`);
      check(errors, !record.sourceObject.rawSwcPath.includes("no_age_universe_v1/swc"), `NeuroMorpho:${record.neuronId} existing SWC was copied into delta`);
    } else {
      check(errors, record.sourceObject.transport === "raw_swc_lazy_parse", `NeuroMorpho:${record.neuronId} delta transport drifted`);
      check(errors, record.sourceObject.rawSwcPath === `/data/neuromorpho_release_8_6_124_no_age_universe_v1/swc/nmo-${record.neuronId}.swc`, `NeuroMorpho:${record.neuronId} delta path drifted`);
      check(errors, record.sourceObject.existingGeometryPath === null, `NeuroMorpho:${record.neuronId} invented generated geometry`);
    }
    if (!record.normalizedMetadata.sourceDiameterAvailable) {
      check(errors, record.morphometrics.computed.radiusDerived.value === null, `NeuroMorpho:${record.neuronId} no-diameter record gained a radius surface`);
    }
  }

  const manifestPaths = new Set();
  for (const declaration of manifest.files) {
    check(errors, !manifestPaths.has(declaration.path), `manifest duplicates ${declaration.path}`);
    manifestPaths.add(declaration.path);
    const target = publicPath(declaration.path);
    const info = await stat(target);
    check(errors, info.size === declaration.bytes, `${declaration.path} manifest byte count drifted`);
    check(errors, await fileDigest(target) === declaration.sha256, `${declaration.path} manifest checksum drifted`);
  }
  check(errors, manifest.files.filter((entry) => entry.kind === "delta_standardized_swc").length === 948, "manifest delta SWC count drifted");
  const outputFiles = await readdir(OUTPUT_DIRECTORY, { recursive: true });
  check(errors, outputFiles.filter((name) => name.endsWith(".json") || name.endsWith(".swc")).length === manifest.files.length + 1, "output directory contains undeclared data files");
  check(errors, contract.admission.everyQueryRecordDisposed === true, "query universe is not fully disposed");
  check(errors, contract.admission.frozenAdultSubsetMutated === false, "frozen adult subset mutation was claimed");
  check(errors, contract.admission.existingGeometryCopyCount === 0 && contract.admission.deltaGeneratedGeometryCount === 0, "generated geometry copies entered the delta");
  check(errors, index.scientificBoundary.forbiddenClaims.some((claim) => claim.includes("membrane")), "internal-structure boundary disappeared");
  check(errors, index.rights.requiredCitations.some((citation) => citation.includes("RRID:SCR_002145")), "NeuroMorpho RRID attribution disappeared");
  check(errors, index.rights.requiredCitations.some((citation) => citation.includes("10.1096/fba.2024-00048")), "repository paper attribution disappeared");

  if (errors.length) throw new Error(`NeuroMorpho no-age query universe validation failed:\n- ${errors.join("\n- ")}`);
  return {
    queryRecordCount: index.summary.queryRecordCount,
    admittedSourceObjectCount: index.summary.admittedSourceObjectCount,
    deltaRawSwcCount: index.summary.deltaRawSwcCount,
    existingGeometryReferenceCount: index.summary.existingGeometryReferenceCount,
    indexSha256: digest(indexReceipt.bytes),
    manifestSha256: digest(manifestReceipt.bytes),
    contractSha256: digest(contractBytes),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateNeuromorphoNoAgeQueryUniverse()
    .then((report) => process.stdout.write(
      `NeuroMorpho no-age universe valid: ${report.queryRecordCount} exact records, ${report.admittedSourceObjectCount} admitted SWCs, ${report.existingGeometryReferenceCount} reused + ${report.deltaRawSwcCount} delta, 0 geometry copies, 0 REG.\n`,
    ))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
