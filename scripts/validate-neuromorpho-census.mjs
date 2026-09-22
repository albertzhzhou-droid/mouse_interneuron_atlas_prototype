import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { createResearchMvpValidator, formatSchemaErrors } from "./validate-json-schema.mjs";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RELATIVE_DIRECTORY = "public/data/neuromorpho_release_8_6_124_census_v1";
const EXPECTED_QUERY_URL =
  "https://neuromorpho.org/api/neuron/select?q=species:mouse&fq=brain_region:spinal%20cord&fq=cell_type:interneuron&fq=age_classification:adult&size=500&sort=neuron_id,asc";
const EXPECTED_SUMMARY = Object.freeze({
  queryRecordCount: 142,
  admittedGeometryCount: 142,
  quarantinedGeometryCount: 0,
  geometry2DCount: 2,
  geometry3DCount: 140,
  sourceDiameterAvailableCount: 94,
  sourceDiameterUnavailableCount: 48,
  numericAgeReportedCount: 32,
  numericAgeMissingCount: 110,
  registrationCount: 0,
  type6GeometryCount: 2,
});
const QC_KEYS = Object.freeze([
  "sevenColumns",
  "finite",
  "uniquePositiveNodeIds",
  "singleRoot",
  "parentsPresent",
  "noSelfParent",
  "acyclic",
  "positiveRadius",
  "connected",
  "domainMatchesTypes",
  "type6PreservedUninterpreted",
]);
const NODE_COLUMNS = Object.freeze(["id", "type", "x", "y", "z", "radius", "parent"]);
const SEGMENT_COLUMNS = Object.freeze([
  "x1",
  "y1",
  "z1",
  "r1",
  "x2",
  "y2",
  "z2",
  "r2",
  "sourceType",
  "interpretation",
]);

function check(errors, condition, message) {
  if (!condition) errors.push(message);
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function sha256(path) {
  const digest = createHash("sha256");
  for await (const chunk of createReadStream(path)) digest.update(chunk);
  return digest.digest("hex");
}

function sha256Value(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function canonicalGeometrySha256(nodes) {
  const rows = nodes.map((node) => {
    const encoded = [node.x, node.y, node.z, node.radius].map((value) => {
      const buffer = Buffer.allocUnsafe(8);
      buffer.writeDoubleBE(value);
      return buffer.toString("hex");
    });
    return [node.id, node.type, ...encoded, node.parent].join(",");
  });
  return createHash("sha256").update(`${rows.join("\n")}\n`).digest("hex");
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function listFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) result.push(...(await listFiles(resolve(directory, entry.name), relativePath)));
    else if (entry.isFile()) result.push(relativePath);
  }
  return result.sort();
}

function resolveContained(baseDirectory, relativePath) {
  const base = resolve(baseDirectory);
  const target = resolve(baseDirectory, relativePath);
  if (target !== base && !target.startsWith(`${base}${sep}`)) {
    throw new Error(`path escapes census directory: ${relativePath}`);
  }
  return target;
}

function interpretationForType(type) {
  return (
    {
      0: "uninterpreted_undefined_type_0",
      1: "soma_type_1",
      2: "axon_type_2",
      3: "dendrite_type_3",
      4: "apical_dendrite_type_4",
      5: "uninterpreted_custom_type_5",
      6: "uninterpreted_neurite_type_6",
      7: "glia_process_type_7",
    }[type] ?? `uninterpreted_unknown_type_${type}`
  );
}

export function parseCensusSwc(text, label = "SWC") {
  const nodes = new Map();
  for (const [lineIndex, rawLine] of text.split(/\r?\n/).entries()) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const fields = line.split(/\s+/);
    if (fields.length !== 7) throw new Error(`${label}:${lineIndex + 1}: expected 7 columns`);
    if (![fields[0], fields[1], fields[6]].every((value) => /^-?\d+$/.test(value))) {
      throw new Error(`${label}:${lineIndex + 1}: id, type, and parent must be integers`);
    }
    const id = Number(fields[0]);
    const type = Number(fields[1]);
    const x = Number(fields[2]);
    const y = Number(fields[3]);
    const z = Number(fields[4]);
    const radius = Number(fields[5]);
    const parent = Number(fields[6]);
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error(`${label}:${lineIndex + 1}: invalid node id`);
    if (!Number.isSafeInteger(type) || type < 0) throw new Error(`${label}:${lineIndex + 1}: invalid node type`);
    if (!Number.isSafeInteger(parent) || parent === 0 || parent < -1) {
      throw new Error(`${label}:${lineIndex + 1}: invalid parent id`);
    }
    if (![x, y, z, radius].every(Number.isFinite)) throw new Error(`${label}:${lineIndex + 1}: non-finite value`);
    if (radius <= 0) throw new Error(`${label}:${lineIndex + 1}: non-positive radius`);
    if (nodes.has(id)) throw new Error(`${label}:${lineIndex + 1}: duplicate node id ${id}`);
    nodes.set(id, { id, type, x, y, z, radius, parent });
  }
  if (!nodes.size) throw new Error(`${label}: no data rows`);
  const roots = [...nodes.values()].filter((node) => node.parent === -1);
  if (roots.length !== 1) throw new Error(`${label}: expected one root, found ${roots.length}`);
  const rootId = roots[0].id;
  const completed = new Set();
  for (const node of nodes.values()) {
    if (node.parent === node.id) throw new Error(`${label}: node ${node.id} is its own parent`);
    if (node.parent !== -1 && !nodes.has(node.parent)) {
      throw new Error(`${label}: node ${node.id} has missing parent ${node.parent}`);
    }
    if (completed.has(node.id)) continue;
    const active = new Set();
    const path = [];
    let cursor = node.id;
    while (cursor !== -1 && !completed.has(cursor)) {
      if (active.has(cursor)) throw new Error(`${label}: cycle includes node ${cursor}`);
      active.add(cursor);
      path.push(cursor);
      cursor = nodes.get(cursor).parent;
    }
    if (cursor === -1 && path.at(-1) !== rootId) throw new Error(`${label}: disconnected root path`);
    for (const id of path) completed.add(id);
  }
  const ordered = [...nodes.values()].sort((left, right) => left.id - right.id);
  const nodeRows = ordered.map((node) => [node.id, node.type, node.x, node.y, node.z, node.radius, node.parent]);
  const segmentRows = ordered
    .filter((node) => node.parent !== -1)
    .map((node) => {
      const parent = nodes.get(node.parent);
      return [
        parent.x,
        parent.y,
        parent.z,
        parent.radius,
        node.x,
        node.y,
        node.z,
        node.radius,
        node.type,
        interpretationForType(node.type),
      ];
    });
  const nodeTypeCounts = {};
  for (const node of ordered) nodeTypeCounts[node.type] = (nodeTypeCounts[node.type] ?? 0) + 1;
  const coordinates = ordered.map((node) => [node.x, node.y, node.z]);
  const bounds = {
    min: [0, 1, 2].map((axis) => Math.min(...coordinates.map((point) => point[axis]))),
    max: [0, 1, 2].map((axis) => Math.max(...coordinates.map((point) => point[axis]))),
  };
  let zeroLengthEdges = 0;
  let totalCableLength = 0;
  for (const node of ordered) {
    if (node.parent === -1) continue;
    const parent = nodes.get(node.parent);
    const length = Math.hypot(node.x - parent.x, node.y - parent.y, node.z - parent.z);
    if (length === 0) zeroLengthEdges += 1;
    totalCableLength += length;
  }
  return {
    nodes,
    ordered,
    rootId,
    nodeRows,
    segmentRows,
    nodeTypeCounts,
    bounds,
    extent: bounds.max.map((value, axis) => value - bounds.min[axis]),
    zeroLengthEdges,
    totalCableLength,
    canonicalGeometrySha256: canonicalGeometrySha256(ordered),
    topologySha256: sha256Value(ordered.map((node) => [node.id, node.type, node.parent])),
  };
}

function domainMatchesTypes(domain, nodeTypeCounts) {
  const hasAxon = (nodeTypeCounts[2] ?? 0) > 0;
  if (domain.includes("No Axon")) return !hasAxon;
  if (domain.includes("Axon")) return hasAxon;
  if (domain === "Neurites, Soma") return !hasAxon && (nodeTypeCounts[6] ?? 0) > 0;
  return true;
}

async function verifyDeclaredFile(errors, baseDirectory, declaration) {
  let path;
  try {
    path = resolveContained(baseDirectory, declaration.path);
  } catch (error) {
    errors.push(error.message);
    return;
  }
  try {
    const info = await stat(path);
    check(errors, info.isFile(), `${declaration.path}: not a regular file`);
    check(errors, info.size === declaration.bytes, `${declaration.path}: byte count mismatch`);
    check(errors, (await sha256(path)) === declaration.sha256, `${declaration.path}: SHA-256 mismatch`);
  } catch (error) {
    errors.push(`${declaration.path}: ${error.message}`);
  }
}

function distribution(values) {
  const counts = new Map();
  for (const value of values) {
    const key = JSON.stringify(value);
    const current = counts.get(key) ?? { value, count: 0 };
    current.count += 1;
    counts.set(key, current);
  }
  return [...counts.values()].sort((left, right) => right.count - left.count || String(left.value).localeCompare(String(right.value)));
}

function compareNumber(errors, actual, expected, message, tolerance = 1e-8) {
  check(errors, Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), message);
}

export async function validateNeuromorphoCensus({ projectRoot = PROJECT_ROOT } = {}) {
  const errors = [];
  const directory = resolve(projectRoot, RELATIVE_DIRECTORY);
  const schema = await readJson(resolve(projectRoot, "schemas/neuromorpho-census-v1.schema.json"));
  const validateSchema = createResearchMvpValidator(schema);
  const [index, manifest, snapshot, quarantine] = await Promise.all([
    readJson(resolve(directory, "census-index.json")),
    readJson(resolve(directory, "asset-manifest.json")),
    readJson(resolve(directory, "official-query-snapshot.json")),
    readJson(resolve(directory, "quarantine-report.json")),
  ]);
  if (!validateSchema(index)) errors.push(...formatSchemaErrors(validateSchema.errors).map((item) => `index schema ${item}`));

  check(errors, index.snapshot.queryUrl === EXPECTED_QUERY_URL, "official query URL changed");
  check(errors, index.snapshot.queryTotal === 142, "snapshot query total must be 142");
  check(errors, index.snapshot.sha256 === (await sha256(resolve(directory, index.snapshot.path))), "snapshot hash mismatch");
  check(errors, index.snapshot.bytes === (await stat(resolve(directory, index.snapshot.path))).size, "snapshot bytes mismatch");
  check(errors, snapshot.page?.totalElements === 142, "official snapshot totalElements must be 142");
  check(errors, snapshot.page?.number === 0 && snapshot.page?.totalPages === 1, "official snapshot must be a complete single page");
  const officialRecords = snapshot._embedded?.neuronResources ?? [];
  check(errors, officialRecords.length === 142, "official snapshot must contain 142 records");
  check(errors, index.records.length === 142, "census index must contain 142 records");

  for (const [key, expected] of Object.entries(EXPECTED_SUMMARY)) {
    check(errors, index.summary[key] === expected, `summary.${key} must equal ${expected}`);
  }
  check(errors, index.scientificBoundary.registrationCount === 0, "census registration count must remain zero");
  check(errors, index.scientificBoundary.geometry === "OBS_STANDARDIZED_SOURCE_LOCAL", "geometry authority changed");
  check(errors, /CC BY 4\.0/.test(index.rights.license), "CC BY 4.0 rights statement is missing");
  check(errors, index.rights.requiredCitations.some((item) => item.includes("RRID:SCR_002145")), "NeuroMorpho RRID citation missing");
  check(errors, index.rights.requiredCitations.some((item) => item.includes("10.1096/fba.2024-00048")), "Tecuatl 2024 citation missing");
  check(errors, /no JSP scraping/i.test(index.rights.programmaticAccess), "programmatic-access boundary missing");

  const ids = new Set();
  const names = new Set();
  const archiveNameKeys = new Set();
  const rawHashGroups = new Map();
  const canonicalHashGroups = new Map();
  let twoDimensionalCount = 0;
  let threeDimensionalCount = 0;
  let diameterAvailableCount = 0;
  let numericAgeCount = 0;
  let type6Count = 0;
  let admittedCount = 0;

  for (const [recordIndex, record] of index.records.entries()) {
    const label = `NeuroMorpho:${record.neuronId}`;
    const official = officialRecords[recordIndex];
    check(errors, sameJson(record.officialMetadata, official), `${label}: official metadata differs from pinned snapshot`);
    check(errors, record.neuronId === official?.neuron_id, `${label}: neuron ID/order differs from snapshot`);
    check(errors, record.assetId === `NeuroMorpho:${record.neuronId}`, `${label}: assetId mismatch`);
    check(errors, !ids.has(record.neuronId), `${label}: duplicate neuron ID`);
    check(errors, !names.has(record.normalizedMetadata.name), `${label}: duplicate neuron name`);
    const archiveNameKey = `${record.normalizedMetadata.archive}/${record.normalizedMetadata.name}`;
    check(errors, !archiveNameKeys.has(archiveNameKey), `${label}: duplicate archive/name key`);
    ids.add(record.neuronId);
    names.add(record.normalizedMetadata.name);
    archiveNameKeys.add(archiveNameKey);

    check(errors, record.normalizedMetadata.name === official.neuron_name, `${label}: normalized name mismatch`);
    check(errors, record.normalizedMetadata.archive === official.archive, `${label}: normalized archive mismatch`);
    check(errors, sameJson(record.normalizedMetadata.brainRegion, official.brain_region), `${label}: brain-region normalization changed official values`);
    check(errors, sameJson(record.normalizedMetadata.cellType, official.cell_type), `${label}: cell-type normalization changed official values`);
    check(errors, record.normalizedMetadata.physicalIntegrity === official.physical_Integrity, `${label}: physical-integrity normalization mismatch`);
    check(errors, record.normalizedMetadata.registrationStatus === "unregistered", `${label}: record must remain unregistered`);
    check(errors, record.missingness.donorId.value === null && record.missingness.specimenId.value === null, `${label}: absent donor/specimen IDs must remain explicit null`);
    check(errors, record.missingness.atlasTransform.value === null && record.missingness.atlasPlacement.value === null, `${label}: atlas transform/placement must remain explicit null`);
    check(errors, sameJson(record.sourcePaper.pmids, official.reference_pmid), `${label}: PMID mismatch`);
    check(errors, sameJson(record.sourcePaper.dois, official.reference_doi), `${label}: DOI mismatch`);

    if (record.normalizedMetadata.dimensionality === "2D") twoDimensionalCount += 1;
    if (record.normalizedMetadata.dimensionality === "3D") threeDimensionalCount += 1;
    if (record.normalizedMetadata.sourceDiameterAvailable) diameterAvailableCount += 1;
    if (record.missingness.numericAge.value !== null) numericAgeCount += 1;

    if (!record.geometry.available) {
      check(errors, record.qc.status === "quarantined" && record.qc.errors.length > 0, `${label}: unavailable geometry requires quarantine errors`);
      continue;
    }
    admittedCount += 1;
    check(errors, record.geometry.path === `geometry/nmo-${record.neuronId}.json`, `${label}: lazy geometry path mismatch`);
    check(errors, record.geometry.rawSwcPath === `swc/nmo-${record.neuronId}.swc`, `${label}: raw SWC path mismatch`);
    for (const key of QC_KEYS) check(errors, record.qc[key] === true, `${label}: index QC ${key} must pass`);
    check(errors, record.qc.status === "passed" && record.qc.errors.length === 0, `${label}: index QC status/errors mismatch`);

    const geometryPath = resolveContained(directory, record.geometry.path);
    const swcPath = resolveContained(directory, record.geometry.rawSwcPath);
    const [geometry, swcText, geometryInfo, swcInfo, geometryHash, swcHash] = await Promise.all([
      readJson(geometryPath),
      readFile(swcPath, "utf8"),
      stat(geometryPath),
      stat(swcPath),
      sha256(geometryPath),
      sha256(swcPath),
    ]);
    if (!validateSchema(geometry)) {
      errors.push(...formatSchemaErrors(validateSchema.errors).map((item) => `${label}: geometry schema ${item}`));
    }
    check(errors, geometryInfo.size === record.geometry.bytes, `${label}: geometry byte count mismatch`);
    check(errors, geometryHash === record.geometry.sha256, `${label}: geometry hash mismatch`);
    check(errors, swcHash === record.geometry.rawSwcSha256, `${label}: raw SWC hash mismatch`);
    check(errors, swcInfo.size === geometry.swc.bytes, `${label}: raw SWC byte count mismatch`);
    check(errors, geometry.swc.sha256 === swcHash, `${label}: geometry SWC hash mismatch`);
    check(errors, geometry.neuronId === record.neuronId && geometry.name === record.normalizedMetadata.name, `${label}: geometry identity mismatch`);
    check(errors, geometry.geometryStatus === "OBS_STANDARDIZED_SOURCE_LOCAL", `${label}: geometry status changed`);
    check(errors, geometry.sourceFrame === "NeuroMorpho_CNG_standardized_local_frame", `${label}: source frame changed`);
    check(errors, geometry.registration.status === "unregistered" && geometry.registration.registrationCount === 0, `${label}: geometry registration must remain zero/unregistered`);
    check(errors, geometry.registration.atlasTransform.value === null && geometry.registration.atlasPlacement.value === null, `${label}: geometry atlas fields must remain explicit null`);
    check(errors, sameJson(geometry.nodeColumns, NODE_COLUMNS), `${label}: node columns changed`);
    check(errors, sameJson(geometry.segmentColumns, SEGMENT_COLUMNS), `${label}: segment columns changed`);
    check(errors, geometry.segmentEndpointMeaning.endpoint1 === "parent" && geometry.segmentEndpointMeaning.endpoint2 === "child", `${label}: segment endpoint meaning changed`);

    let parsed;
    try {
      parsed = parseCensusSwc(swcText, label);
    } catch (error) {
      errors.push(error.message);
      continue;
    }
    check(errors, sameJson(geometry.nodes, parsed.nodeRows), `${label}: geometry nodes differ from raw SWC`);
    check(errors, sameJson(geometry.segments, parsed.segmentRows), `${label}: geometry segments differ from raw SWC`);
    check(errors, geometry.swc.nodeCount === parsed.nodes.size, `${label}: node count mismatch`);
    check(errors, geometry.swc.rootNodeId === parsed.rootId, `${label}: root ID mismatch`);
    check(errors, sameJson(geometry.swc.nodeTypeCounts, parsed.nodeTypeCounts), `${label}: node-type counts mismatch`);
    check(errors, domainMatchesTypes(official.domain, parsed.nodeTypeCounts), `${label}: official domain does not match node types`);
    check(errors, geometry.morphometrics.computedFromStandardizedSwc.rawSwcSha256 === swcHash, `${label}: computed raw hash mismatch`);
    check(errors, geometry.morphometrics.computedFromStandardizedSwc.canonicalGeometrySha256 === parsed.canonicalGeometrySha256, `${label}: canonical geometry hash mismatch`);
    check(errors, geometry.morphometrics.computedFromStandardizedSwc.topologySha256 === parsed.topologySha256, `${label}: topology hash mismatch`);
    check(errors, sameJson(geometry.morphometrics.computedFromStandardizedSwc.boundsMicrometre, parsed.bounds), `${label}: bounds mismatch`);
    check(errors, sameJson(geometry.morphometrics.computedFromStandardizedSwc.extentMicrometre, parsed.extent), `${label}: extent mismatch`);
    compareNumber(errors, geometry.morphometrics.computedFromStandardizedSwc.totalCableLengthMicrometre, parsed.totalCableLength, `${label}: total cable length mismatch`);
    check(errors, geometry.morphometrics.computedFromStandardizedSwc.zeroLengthEdgeCount === parsed.zeroLengthEdges, `${label}: zero-length edge count mismatch`);
    check(errors, geometry.displayTransform.use === "viewer_only", `${label}: display transform must remain viewer-only`);
    check(errors, sameJson(geometry.displayTransform.originMicrometre, [parsed.nodes.get(parsed.rootId).x, parsed.nodes.get(parsed.rootId).y, parsed.nodes.get(parsed.rootId).z]), `${label}: display origin must equal root coordinates`);

    const hasType6 = (parsed.nodeTypeCounts[6] ?? 0) > 0;
    if (hasType6) type6Count += 1;
    check(
      errors,
      parsed.segmentRows
        .filter((segment) => segment[8] === 6)
        .every((segment) => segment[9] === "uninterpreted_neurite_type_6"),
      `${label}: type 6 was interpreted as a biological compartment`,
    );
    check(errors, geometry.swc.type6Policy === "preserve_uninterpreted_never_infer_axon_or_dendrite", `${label}: type 6 policy changed`);
    if (!record.normalizedMetadata.sourceDiameterAvailable) {
      check(errors, geometry.morphometrics.computedFromStandardizedSwc.radiusDerived.value === null, `${label}: radius-derived values must be null when source reports no diameter`);
      check(errors, geometry.morphometrics.computedFromStandardizedSwc.radiusDerived.missingReason === "official_attributes_report_no_diameter", `${label}: no-diameter missing reason changed`);
    }

    const rawGroup = rawHashGroups.get(swcHash) ?? [];
    rawGroup.push(record.neuronId);
    rawHashGroups.set(swcHash, rawGroup);
    const canonicalHash = parsed.canonicalGeometrySha256;
    const canonicalGroup = canonicalHashGroups.get(canonicalHash) ?? [];
    canonicalGroup.push(record.neuronId);
    canonicalHashGroups.set(canonicalHash, canonicalGroup);
  }

  check(errors, admittedCount === index.summary.admittedGeometryCount, "admitted geometry denominator mismatch");
  check(errors, twoDimensionalCount === 2 && threeDimensionalCount === 140, "2D/3D denominator mismatch");
  check(errors, diameterAvailableCount === 94, "source-diameter denominator mismatch");
  check(errors, numericAgeCount === 32, "numeric-age denominator mismatch");
  check(errors, type6Count === 2, "type-6 geometry denominator mismatch");
  check(errors, [...rawHashGroups.values()].every((group) => group.length === 1), "duplicate raw SWC hash detected");
  check(errors, [...canonicalHashGroups.values()].every((group) => group.length === 1), "duplicate canonical geometry hash detected");
  check(errors, index.summary.duplicateRawSwcGroups.length === 0, "duplicate raw hash summary must be empty");
  check(errors, index.summary.duplicateCanonicalGeometryGroups.length === 0, "duplicate canonical geometry summary must be empty");
  check(errors, sameJson(index.summary.byArchive, distribution(index.records.map((record) => record.normalizedMetadata.archive))), "archive distribution mismatch");
  check(errors, index.summary.bySourcePaper.reduce((total, item) => total + item.count, 0) === 142, "paper distribution denominator mismatch");
  check(errors, index.summary.bySourcePaper.length === 5, "paper distribution must retain five cohorts");

  check(errors, manifest.assetSetId === index.assetSetId, "asset manifest set ID mismatch");
  check(errors, manifest.queryRecordCount === 142 && manifest.admittedGeometryCount === 142 && manifest.quarantinedGeometryCount === 0, "asset manifest denominators mismatch");
  const declarations = new Map(manifest.files.map((item) => [item.path, item]));
  check(errors, declarations.size === manifest.files.length, "asset manifest contains duplicate paths");
  for (const declaration of manifest.files) await verifyDeclaredFile(errors, directory, declaration);
  const actualFiles = await listFiles(directory);
  const expectedFiles = [...declarations.keys(), "asset-manifest.json"].sort();
  check(errors, sameJson(actualFiles, expectedFiles), "census directory contains undeclared or missing files");
  check(errors, declarations.get("census-index.json")?.sha256 === (await sha256(resolve(directory, "census-index.json"))), "manifest census-index hash mismatch");
  check(errors, declarations.get("official-query-snapshot.json")?.sha256 === index.snapshot.sha256, "manifest snapshot hash mismatch");
  check(errors, manifest.files.filter((item) => item.kind === "standardized_swc").length === 142, "manifest must declare 142 SWCs");
  check(errors, manifest.files.filter((item) => item.kind === "lazy_geometry").length === 142, "manifest must declare 142 lazy geometries");
  check(errors, quarantine.queryRecordCount === 142 && quarantine.admittedGeometryCount === 142 && quarantine.quarantinedGeometryCount === 0, "quarantine report denominators mismatch");
  check(errors, quarantine.records.length === 0, "quarantine report must be empty after 142/142 admission");

  if (errors.length) {
    throw new Error(`NeuroMorpho census validation failed:\n${errors.map((item) => `- ${item}`).join("\n")}`);
  }
  return {
    assetSetId: index.assetSetId,
    queryRecordCount: 142,
    admittedGeometryCount: 142,
    quarantinedGeometryCount: 0,
    geometry2DCount: 2,
    geometry3DCount: 140,
    manifestSha256: await sha256(resolve(directory, "asset-manifest.json")),
    indexSha256: await sha256(resolve(directory, "census-index.json")),
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file://${process.argv[1]}`))) {
  try {
    const result = await validateNeuromorphoCensus();
    console.log(
      `NeuroMorpho census validation passed: ${result.queryRecordCount} indexed; ` +
        `${result.admittedGeometryCount} admitted (${result.geometry3DCount} 3D + ${result.geometry2DCount} 2D); ` +
        `${result.quarantinedGeometryCount} quarantined; 0 registrations`,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
