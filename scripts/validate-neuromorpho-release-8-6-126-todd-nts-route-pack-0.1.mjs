#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const ROUTE_PACK_PATH = "data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json";
export const SCHEMA_PATH = "schemas/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.schema.json";
export const AUDIT_PATH = "data/neuromorpho-release-8-6-126-todd-stable-id-audit-0.1.json";
export const CURRENT_QUERY_PATH = "data/source-candidates/neuromorpho-release-8-6-126-todd-nts-v1/official-current-query-response.json";
export const BASELINE_PATH = "public/data/neuromorpho_release_8_6_124_no_age_universe_v1/universe-index.json";
export const ASSET_MANIFEST_PATH = "public/data/neuromorpho_release_8_6_126_todd_nts_v1/asset-manifest.json";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const check = (condition, message) => { if (!condition) throw new Error(message); };

async function projectBytes(relativePath) {
  if (path.isAbsolute(relativePath) || relativePath.split("/").includes("..")) throw new Error(`Unsafe project receipt path: ${relativePath}`);
  return readFile(path.join(ROOT, relativePath));
}

function publicAssetPath(urlPath) {
  check(urlPath.startsWith("/data/") && !urlPath.split("/").includes(".."), `Unsupported public geometry path: ${urlPath}`);
  return `public${urlPath}`;
}

function parseSwc(bytes, label) {
  const nodes = new Map();
  for (const [index, raw] of bytes.toString("utf8").split(/\r?\n/).entries()) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const fields = line.split(/\s+/);
    check(fields.length === 7, `${label}:${index + 1} must have seven SWC columns`);
    const [idText, typeText, xText, yText, zText, radiusText, parentText] = fields;
    const id = Number(idText), type = Number(typeText), x = Number(xText), y = Number(yText), z = Number(zText), radius = Number(radiusText), parent = Number(parentText);
    check(Number.isInteger(id) && id > 0 && Number.isInteger(type) && type >= 0, `${label}:${index + 1} has invalid id/type`);
    check([x, y, z, radius].every(Number.isFinite) && radius > 0, `${label}:${index + 1} has invalid coordinates or radius`);
    check(Number.isInteger(parent) && parent !== 0 && parent >= -1, `${label}:${index + 1} has invalid parent`);
    check(!nodes.has(id), `${label} has duplicate node id ${id}`);
    nodes.set(id, { id, type, x, y, z, radius, parent });
  }
  const roots = [...nodes.values()].filter((node) => node.parent === -1);
  check(roots.length === 1, `${label} must have exactly one root`);
  const root = roots[0];
  for (const node of nodes.values()) {
    if (node.id === root.id) continue;
    check(nodes.has(node.parent) && node.parent !== node.id, `${label} has missing/self parent ${node.id}`);
  }
  const state = new Map();
  function visit(id) {
    const status = state.get(id) ?? 0;
    check(status !== 1, `${label} contains a parent cycle at ${id}`);
    if (status === 2) return;
    state.set(id, 1);
    const node = nodes.get(id);
    if (node.parent !== -1) visit(node.parent);
    state.set(id, 2);
  }
  for (const id of nodes.keys()) visit(id);
  check(state.size === nodes.size && [...nodes.values()].every((node) => node.parent === -1 || state.get(node.parent) === 2), `${label} is disconnected`);
  const zValues = [...nodes.values()].map((node) => node.z);
  return { nodes, rootId: root.id, nodeCount: nodes.size, segmentCount: nodes.size - 1, zExtent: Math.max(...zValues) - Math.min(...zValues) };
}

function compareCommonMetadata(currentRecords, baselineRecords) {
  const baseline = new Map(baselineRecords
    .filter((record) => record.officialMetadata?.archive === "Todd")
    .map((record) => [record.officialMetadata.neuron_id, record.officialMetadata]));
  const current = new Map(currentRecords.map((record) => [record.neuron_id, record]));
  const common = [...baseline.keys()].filter((id) => current.has(id));
  const fields = ["neuron_name", "archive", "species", "brain_region", "cell_type", "age_classification", "domain", "attributes", "physical_Integrity", "reference_doi", "reference_pmid"];
  const changes = [];
  for (const id of common) {
    const before = baseline.get(id);
    const after = current.get(id);
    const changedFields = fields.filter((field) => JSON.stringify(before[field] ?? null) !== JSON.stringify(after[field] ?? null));
    if (changedFields.length) changes.push({ neuronId: id, changedFields });
  }
  return { baselineToddIds: new Set(baseline.keys()), currentIds: new Set(current.keys()), commonCount: common.length, changes };
}

export async function validateNeuromorphoRelease126ToddNtsRoutePack01(contractOverride = null) {
  const [packBytes, schema, audit, currentBytes, baseline, assetManifestBytes] = await Promise.all([
    contractOverride === null ? projectBytes(ROUTE_PACK_PATH) : null,
    projectBytes(SCHEMA_PATH).then((bytes) => JSON.parse(bytes.toString("utf8"))),
    projectBytes(AUDIT_PATH).then((bytes) => JSON.parse(bytes.toString("utf8"))),
    projectBytes(CURRENT_QUERY_PATH),
    projectBytes(BASELINE_PATH).then((bytes) => JSON.parse(bytes.toString("utf8"))),
    projectBytes(ASSET_MANIFEST_PATH),
  ]);
  const pack = contractOverride ?? JSON.parse(packBytes.toString("utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  check(validate(pack), `NeuroMorpho 8.6.126 route-pack schema violation: ${validate.errors?.map((item) => `${item.instancePath || "/"} ${item.message}`).join("; ")}`);
  check(pack.licenseAndAttribution.license === "CC BY 4.0" && pack.licenseAndAttribution.repositoryRrid === "RRID:SCR_002145", "Repository license/attribution receipt changed");
  check(pack.licenseAndAttribution.originalPaperCitationStatus === "unresolved_for_all_30_records_from_current_repository_api_fields", "Missing per-record source-paper citation must remain visible");
  check(pack.runtimeMergePolicy.frozenNoAgeQueryRecordCount === 1097 && pack.runtimeMergePolicy.supplementaryRouteCount === 30 && pack.runtimeMergePolicy.censusExpansionCount === 0 && pack.runtimeMergePolicy.crossSourceIdentityCount === 0 && pack.runtimeMergePolicy.projectRegistrationCount === 0, "Supplementary route pack changed the frozen census or relationship boundary");
  check(pack.sourceQuery.completeResponse === true && pack.sourceQuery.responseRecordCount === 339 && pack.baselineComparison.baselineRelease === "8.6.124", "Exact current API roster or pinned baseline receipt changed");

  const apiReceipt = pack.sourceQuery.responseReceipt;
  check(apiReceipt.path === CURRENT_QUERY_PATH && apiReceipt.bytes === currentBytes.byteLength && apiReceipt.sha256 === sha256(currentBytes), "Complete official API query snapshot receipt mismatch");
  const currentPayload = JSON.parse(currentBytes.toString("utf8"));
  const currentRecords = currentPayload._embedded?.neuronResources ?? [];
  check(currentPayload.page?.totalElements === 339 && currentPayload.page?.totalPages === 1 && currentRecords.length === 339, "The captured current API response is not a complete 339-record query roster");
  check(new Set(currentRecords.map((record) => record.neuron_id)).size === 339, "Current query roster has duplicate stable IDs");
  const candidateIds = audit.releaseSetReview.candidateRecords.map((record) => record.neuronId);
  const candidateNames = new Map(audit.releaseSetReview.candidateRecords.map((record) => [record.neuronId, record.neuronName]));
  const { baselineToddIds, currentIds, commonCount, changes } = compareCommonMetadata(currentRecords, baseline.records);
  check(baseline.summary?.queryRecordCount === 1097 && baselineToddIds.size === 309, "Frozen 8.6.124 baseline or Todd filter denominator changed");
  check(candidateIds.length === 30 && new Set(candidateIds).size === 30 && candidateIds.every((id) => !baselineToddIds.has(id)), "Audited novel IDs are not unique or are present in baseline");
  check(currentIds.size === 339 && [...candidateIds].every((id) => currentIds.has(id)), "The exact audited 30 candidates are not in the current complete query");
  check([...currentIds].filter((id) => !candidateIds.includes(id)).every((id) => baselineToddIds.has(id)), "Current query includes unexplained IDs beyond the pinned 309 Todd baseline plus 30 candidates");
  check(commonCount === 309 && changes.length === 0, "Shared current and baseline IDs or common metadata changes require re-review");
  check(pack.baselineComparison.commonStableIdCount === 309 && pack.baselineComparison.newStableIdCount === 30 && pack.baselineComparison.removedStableIdCount === 0 && pack.baselineComparison.commonMetadataChangeCount === 0, "Current-query delta summary does not reconcile");

  const assetManifest = JSON.parse(assetManifestBytes.toString("utf8"));
  check(pack.assetManifest.path === ASSET_MANIFEST_PATH && pack.assetManifest.bytes === assetManifestBytes.byteLength && pack.assetManifest.sha256 === sha256(assetManifestBytes), "Exact asset-manifest receipt mismatch");
  check(assetManifest.recordCount === 30 && assetManifest.objectFiles.length === 61, "Exact asset inventory must contain one API query response, 30 SWCs and 30 geometry payloads");
  const assetsByPath = new Map(assetManifest.objectFiles.map((item) => [item.path, item]));
  let totalNodes = 0;
  let totalSegments = 0;
  let withDiameter = 0;
  let withoutDiameter = 0;
  const seenIds = new Set();
  for (const route of pack.routes) {
    const id = route.sourceRecord.neuronId;
    check(!seenIds.has(id), `Duplicate route for NMO ${id}`);
    seenIds.add(id);
    const api = currentRecords.find((record) => record.neuron_id === id);
    check(Boolean(api), `NMO ${id} is absent from exact current query roster`);
    check(candidateNames.get(id) === route.sourceRecord.neuronName && api.neuron_name === route.sourceRecord.neuronName, `NMO ${id} exact stable ID/name mapping changed`);
    check(route.sourceRecord.archive === "Todd" && route.sourceRecord.species === "mouse" && api.archive === "Todd" && api.species === "mouse", `NMO ${id} archive/species changed`);
    check(api.brain_region?.some((label) => label.toLowerCase() === "spinal cord") && api.cell_type?.includes("interneuron") && api.cell_type?.includes("Neurotensin-expressing*"), `NMO ${id} exact source labels do not match the query scope`);
    check(route.sourceRecord.regionLabels.join("\u001f") === api.brain_region.join("\u001f") && route.sourceRecord.cellTypeLabels.join("\u001f") === api.cell_type.join("\u001f"), `NMO ${id} raw classification labels drifted from API snapshot`);
    check(route.censusMembership === false && route.frozenLensMembership === false && route.identityBoundary.crossSourceIdentity === "not_established" && route.identityBoundary.registration === "none", `NMO ${id} became a census member, identity join, or registered object`);
    check(route.sourceRecord.sourcePaperDoi === "" && route.sourceRecord.repositoryReferenceFieldsRaw.reference_doi.includes("") && route.sourceRecord.repositoryReferenceFieldsRaw.reference_pmid.includes("2017") && route.sourceLinks.primaryPaper === null, `NMO ${id} unresolved paper mapping was replaced with an asserted citation`);
    check(route.sourceRecord.sourceAttributes === "No Diameter, 3D, Angles" || route.sourceRecord.sourceAttributes === "Diameter, 3D, Angles", `NMO ${id} is not source-labelled 3D morphology`);
    const noDiameter = route.sourceRecord.sourceAttributes.startsWith("No Diameter");
    check(route.fidelityRecord.geometry.sourceDiameterAvailable === !noDiameter && route.fidelityRecord.geometry.dimensionality === "3D", `NMO ${id} source dimensionality or diameter authority drifted`);
    check(route.fidelityRecord.modes.radiusSurface.available === !noDiameter && route.fidelityRecord.modes.internalStructure.available === false, `NMO ${id} radius or internal-structure authorization drifted`);
    check(route.fidelityRecord.axon.sourceType2NodeCount === 0 && route.sourceRecord.domain === "Dendrites, Soma, No Axon", `NMO ${id} contains or claims an unsupported axon`);

    const swcUrlPath = route.sourceObjects.swc.path;
    const geometryUrlPath = route.sourceObjects.geometry.path;
    const swcBytes = await projectBytes(publicAssetPath(swcUrlPath));
    const geometryBytes = await projectBytes(publicAssetPath(geometryUrlPath));
    const swcRelative = publicAssetPath(swcUrlPath);
    const geometryRelative = publicAssetPath(geometryUrlPath);
    const swcAsset = assetsByPath.get(swcRelative);
    const geometryAsset = assetsByPath.get(geometryRelative);
    check(swcBytes.byteLength === route.sourceObjects.swc.bytes && sha256(swcBytes) === route.sourceObjects.swc.sha256 && swcAsset?.sha256 === sha256(swcBytes) && swcAsset?.neuronId === id, `NMO ${id} SWC bytes/hash/source-object receipt mismatch`);
    check(geometryBytes.byteLength === route.sourceObjects.geometry.bytes && sha256(geometryBytes) === route.sourceObjects.geometry.sha256 && geometryAsset?.sha256 === sha256(geometryBytes) && geometryAsset?.neuronId === id, `NMO ${id} geometry bytes/hash/source-object receipt mismatch`);
    check(route.sourceObjects.swc.sha256 === route.sourceObjects.geometry.rawSwcSha256 && route.fidelityRecord.geometry.rawSwcSha256 === route.sourceObjects.swc.sha256, `NMO ${id} raw SWC hashes do not join within the exact source record`);
    const parsed = parseSwc(swcBytes, `NeuroMorpho:${id}`);
    const geometry = JSON.parse(geometryBytes.toString("utf8"));
    check(parsed.zExtent > 0 && geometry.swc.dimensionality === "3D" && geometry.qc.status === "passed" && geometry.qc.connected === true, `NMO ${id} parsed geometry fails its source 3D/topology receipt`);
    check(geometry.assetId === `NeuroMorpho:${id}` && geometry.neuronId === id && geometry.swc.nodeCount === parsed.nodeCount && geometry.morphometrics.computedFromStandardizedSwc.segmentCount === parsed.segmentCount, `NMO ${id} geometry payload stable identity or counts drifted`);
    const expectedRows = [...parsed.nodes.values()].sort((a, b) => a.id - b.id).map((node) => [node.id, node.type, node.x, node.y, node.z, node.radius, node.parent]);
    check(JSON.stringify(geometry.nodes) === JSON.stringify(expectedRows), `NMO ${id} geometry nodes do not exactly match parsed standardized SWC rows`);
    if (noDiameter) {
      withoutDiameter += 1;
      check(geometry.morphometrics.computedFromStandardizedSwc.radiusDerived.value === null && route.fidelityRecord.radiusEvidence.status === "UNAVAILABLE", `NMO ${id} no-diameter radii were promoted`);
    } else {
      withDiameter += 1;
      check(geometry.morphometrics.computedFromStandardizedSwc.radiusDerived.value !== null && route.fidelityRecord.radiusEvidence.status === "OBSERVED_SOURCE_RADIUS", `NMO ${id} source-reported diameters were lost`);
    }
    totalNodes += parsed.nodeCount;
    totalSegments += parsed.segmentCount;
  }
  check(seenIds.size === 30 && totalNodes === 24209 && totalSegments === 24179 && withDiameter === 10 && withoutDiameter === 20, "Exact route, topology or source-diameter denominators changed");
  check(pack.summary.routeCount === 30 && pack.summary.observedSwcNodeCount === totalNodes && pack.summary.observedSwcSegmentCount === totalSegments && pack.summary.paperRecordCrosswalkCount === 0 && pack.summary.biologicalCompletenessIndependentlyEstablishedCount === 0 && pack.summary.originalNeurolucidaFileCount === 0 && pack.summary.sameSpecimenInternalStructureCount === 0 && pack.summary.renderedInternalPrimitiveCount === 0, "Summary overclaims biology, original files, paper joins or internal detail");
  check(pack.candidateStudyContext.relationStatus === "candidate_context_only_record_level_crosswalk_unverified", "Cohort-level article context was promoted to a per-cell identity");
  return {
    releaseId: pack.releaseId,
    routeCount: pack.routes.length,
    completeCurrentRosterCount: currentRecords.length,
    baselineToddRecordCount: baselineToddIds.size,
    sharedStableIdCount: commonCount,
    addedStableIdCount: candidateIds.length,
    removedStableIdCount: baselineToddIds.size - commonCount,
    metadataChangeCount: changes.length,
    parsedNodeCount: totalNodes,
    parsedSegmentCount: totalSegments,
    sourceDiameterReportedCount: withDiameter,
    sourceDiameterNotReportedCount: withoutDiameter,
    internalPrimitiveCount: pack.summary.renderedInternalPrimitiveCount,
    paperCrosswalkCount: pack.summary.paperRecordCrosswalkCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateNeuromorphoRelease126ToddNtsRoutePack01()
    .then((report) => process.stdout.write(`${JSON.stringify(report)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
