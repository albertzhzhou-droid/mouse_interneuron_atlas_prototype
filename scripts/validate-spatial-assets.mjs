import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { inflateSync } from "node:zlib";

import { validateAtlasInternalCompartments } from "./validate-atlas-internal-compartments.mjs";
import { validateAtlasFineAnatomyFile } from "./validate-atlas-fine-anatomy.mjs";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ATLAS_RELATIVE_DIR = "public/data/allen_cord_20um_v3_0";
const MORPHOLOGY_RELATIVE_DIR = "public/data/neuromorpho_release_8_6_124";

const EXPECTED_ATLAS = Object.freeze({
  name: "allen_cord_20um",
  version: "3.0",
  apiVersion: "3.0.1",
  shapeZyx: [1567, 253, 322],
  resolutionUmZyx: [20, 10, 10],
  orientation: "asr",
  sourceManifestSha256: "95f305de7b19274908ac5dd24abfa5a0e6544effad1bfdd7d542b177a27cfad1",
  assetManifestSha256: "75aa6dc5cbeb05b52eff2266751a700cced23c9b1ea2f880bede19bd03e225c8",
  assetId: "allen_cord_20um:3.0:ohri-sampled-reference-v4",
  pngWidth: 644,
  pngHeight: 506,
});

const EXPECTED_MORPHOLOGY_IDS = Object.freeze([104003, 108974, 109005, 242822, 260150]);
const EXPECTED_MORPHOLOGY_MANIFEST_SHA256 =
  "4ee24a35b282376ee507c0218806671b9c9f6f18c820d2ffaa298a53162a8647";
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const sameJson = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const sorted = (values) => [...values].sort((left, right) => String(left).localeCompare(String(right)));

function addCheck(errors, condition, message) {
  if (!condition) errors.push(message);
}

async function sha256(path) {
  const digest = createHash("sha256");
  for await (const chunk of createReadStream(path)) digest.update(chunk);
  return digest.digest("hex");
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function listFilesRecursively(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursively(resolve(directory, entry.name), relativePath)));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }
  return sorted(files);
}

function resolveContainedPath(baseDirectory, relativePath) {
  const resolvedBase = resolve(baseDirectory);
  const resolvedPath = resolve(baseDirectory, relativePath);
  if (resolvedPath !== resolvedBase && !resolvedPath.startsWith(`${resolvedBase}${sep}`)) {
    throw new Error(`path escapes asset directory: ${relativePath}`);
  }
  return resolvedPath;
}

function paethPredictor(left, above, upperLeft) {
  const estimate = left + above - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const aboveDistance = Math.abs(estimate - above);
  const upperLeftDistance = Math.abs(estimate - upperLeft);
  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) return left;
  if (aboveDistance <= upperLeftDistance) return above;
  return upperLeft;
}

export function inspectPng(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 33 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error("invalid PNG signature or truncated PNG");
  }

  let offset = 8;
  let width;
  let height;
  let bitDepth;
  let colorType;
  let compressionMethod;
  let filterMethod;
  let interlaceMethod;
  let sawEnd = false;
  const compressedParts = [];

  while (offset < buffer.length) {
    if (offset + 12 > buffer.length) throw new Error("truncated PNG chunk header");
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const chunkEnd = dataEnd + 4;
    if (chunkEnd > buffer.length) throw new Error(`truncated PNG ${type} chunk`);

    if (type === "IHDR") {
      if (length !== 13 || width !== undefined) throw new Error("invalid or duplicate PNG IHDR");
      width = buffer.readUInt32BE(dataStart);
      height = buffer.readUInt32BE(dataStart + 4);
      bitDepth = buffer[dataStart + 8];
      colorType = buffer[dataStart + 9];
      compressionMethod = buffer[dataStart + 10];
      filterMethod = buffer[dataStart + 11];
      interlaceMethod = buffer[dataStart + 12];
    } else if (type === "IDAT") {
      compressedParts.push(buffer.subarray(dataStart, dataEnd));
    } else if (type === "IEND") {
      sawEnd = true;
      break;
    }
    offset = chunkEnd;
  }

  if (!width || !height || !sawEnd || compressedParts.length === 0) {
    throw new Error("PNG is missing IHDR, IDAT, or IEND");
  }
  if (
    bitDepth !== 8 ||
    colorType !== 2 ||
    compressionMethod !== 0 ||
    filterMethod !== 0 ||
    interlaceMethod !== 0
  ) {
    throw new Error("PNG must be non-interlaced 8-bit RGB using standard compression and filtering");
  }

  const bytesPerPixel = 3;
  const rowBytes = width * bytesPerPixel;
  const inflated = inflateSync(Buffer.concat(compressedParts));
  if (inflated.length !== height * (rowBytes + 1)) {
    throw new Error(`unexpected PNG payload length ${inflated.length}`);
  }

  let sourceOffset = 0;
  let previous = Buffer.alloc(rowBytes);
  let minimum = 255;
  let maximum = 0;
  const filterTypes = new Set();
  for (let y = 0; y < height; y += 1) {
    const filterType = inflated[sourceOffset];
    sourceOffset += 1;
    filterTypes.add(filterType);
    if (filterType < 0 || filterType > 4) throw new Error(`unsupported PNG filter ${filterType}`);
    const current = Buffer.allocUnsafe(rowBytes);
    for (let x = 0; x < rowBytes; x += 1) {
      const encoded = inflated[sourceOffset + x];
      const left = x >= bytesPerPixel ? current[x - bytesPerPixel] : 0;
      const above = previous[x];
      const upperLeft = x >= bytesPerPixel ? previous[x - bytesPerPixel] : 0;
      let predictor = 0;
      if (filterType === 1) predictor = left;
      else if (filterType === 2) predictor = above;
      else if (filterType === 3) predictor = Math.floor((left + above) / 2);
      else if (filterType === 4) predictor = paethPredictor(left, above, upperLeft);
      current[x] = (encoded + predictor) & 0xff;
      minimum = Math.min(minimum, current[x]);
      maximum = Math.max(maximum, current[x]);
    }
    sourceOffset += rowBytes;
    previous = current;
  }

  return {
    width,
    height,
    bitDepth,
    colorType,
    idatBytes: compressedParts.reduce((total, part) => total + part.length, 0),
    nonBlank: minimum !== maximum,
    minimum,
    maximum,
    filterTypes: sorted(filterTypes),
  };
}

export function parseSwcText(text, label = "SWC") {
  const nodes = new Map();
  let dataLineCount = 0;
  for (const [zeroBasedLineNumber, rawLine] of text.split(/\r?\n/).entries()) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    dataLineCount += 1;
    const fields = line.split(/\s+/);
    if (fields.length !== 7) {
      throw new Error(`${label}:${zeroBasedLineNumber + 1}: expected 7 columns, found ${fields.length}`);
    }
    const [idText, typeText, xText, yText, zText, radiusText, parentText] = fields;
    if (![idText, typeText, parentText].every((value) => /^-?\d+$/.test(value))) {
      throw new Error(`${label}:${zeroBasedLineNumber + 1}: id, type, and parent must be integers`);
    }
    const id = Number(idText);
    const type = Number(typeText);
    const parent = Number(parentText);
    const coordinatesAndRadius = [xText, yText, zText, radiusText].map(Number);
    if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(type) || type <= 0) {
      throw new Error(`${label}:${zeroBasedLineNumber + 1}: invalid node id or type`);
    }
    if (!Number.isSafeInteger(parent) || parent === 0 || parent < -1) {
      throw new Error(`${label}:${zeroBasedLineNumber + 1}: invalid parent id`);
    }
    if (!coordinatesAndRadius.every(Number.isFinite)) {
      throw new Error(`${label}:${zeroBasedLineNumber + 1}: non-finite coordinate or radius`);
    }
    if (coordinatesAndRadius[3] <= 0) {
      throw new Error(`${label}:${zeroBasedLineNumber + 1}: radius must be positive`);
    }
    if (nodes.has(id)) throw new Error(`${label}:${zeroBasedLineNumber + 1}: duplicate node id ${id}`);
    const [x, y, z, radius] = coordinatesAndRadius;
    nodes.set(id, { id, type, x, y, z, radius, parent });
  }

  if (nodes.size === 0) throw new Error(`${label}: no SWC data rows`);
  const roots = [...nodes.values()].filter((node) => node.parent === -1);
  if (roots.length !== 1) throw new Error(`${label}: expected one root, found ${roots.length}`);

  for (const node of nodes.values()) {
    if (node.parent === node.id) throw new Error(`${label}: node ${node.id} is its own parent`);
    if (node.parent !== -1 && !nodes.has(node.parent)) {
      throw new Error(`${label}: node ${node.id} has missing parent ${node.parent}`);
    }
  }

  const completed = new Set();
  for (const startingNode of nodes.values()) {
    if (completed.has(startingNode.id)) continue;
    const active = new Set();
    const path = [];
    let cursor = startingNode.id;
    while (cursor !== -1 && !completed.has(cursor)) {
      if (active.has(cursor)) throw new Error(`${label}: cycle includes node ${cursor}`);
      active.add(cursor);
      path.push(cursor);
      cursor = nodes.get(cursor).parent;
    }
    for (const id of path) completed.add(id);
  }

  const coordinates = [...nodes.values()];
  const bounds = {
    min: [
      Math.min(...coordinates.map((node) => node.x)),
      Math.min(...coordinates.map((node) => node.y)),
      Math.min(...coordinates.map((node) => node.z)),
    ],
    max: [
      Math.max(...coordinates.map((node) => node.x)),
      Math.max(...coordinates.map((node) => node.y)),
      Math.max(...coordinates.map((node) => node.z)),
    ],
  };
  let zeroLengthEdges = 0;
  for (const node of nodes.values()) {
    if (node.parent === -1) continue;
    const parent = nodes.get(node.parent);
    if (node.x === parent.x && node.y === parent.y && node.z === parent.z) zeroLengthEdges += 1;
  }

  return {
    dataLineCount,
    nodeCount: nodes.size,
    rootNodeId: roots[0].id,
    nodeTypes: sorted(new Set([...nodes.values()].map((node) => node.type))),
    bounds,
    zeroLengthEdges,
    nodes,
  };
}

async function verifyDeclaredFile(errors, baseDirectory, declaration, label) {
  let path;
  try {
    path = resolveContainedPath(baseDirectory, declaration.path);
  } catch (error) {
    errors.push(`${label}: ${error.message}`);
    return null;
  }
  try {
    const fileStat = await stat(path);
    addCheck(errors, fileStat.isFile(), `${label}: ${declaration.path} is not a regular file`);
    addCheck(errors, fileStat.size === declaration.bytes, `${label}: ${declaration.path} byte count mismatch`);
    const actualSha = await sha256(path);
    addCheck(errors, actualSha === declaration.sha256, `${label}: ${declaration.path} SHA-256 mismatch`);
    return { path, bytes: fileStat.size, sha256: actualSha };
  } catch (error) {
    errors.push(`${label}: cannot verify ${declaration.path}: ${error.message}`);
    return null;
  }
}

function valuesApproximatelyEqual(left, right, tolerance = 1e-9) {
  return (
    Array.isArray(left) &&
    Array.isArray(right) &&
    left.length === right.length &&
    left.every((value, index) => Math.abs(value - right[index]) <= tolerance)
  );
}

function validateLocalUnregisteredRecord(errors, record, label) {
  addCheck(errors, record.geometryStatus === "OBS", `${label}: raw morphology geometry must be OBS`);
  addCheck(errors, /local_frame/i.test(record.sourceFrame ?? ""), `${label}: source frame must explicitly be local`);
  addCheck(errors, record.registrationStatus === "unregistered", `${label}: morphology must remain unregistered`);
  addCheck(
    errors,
    record.atlasTransform?.value === null && record.atlasTransform?.missingReason === "asset_unavailable",
    `${label}: atlas transform must be explicit null / asset_unavailable`,
  );
  addCheck(
    errors,
    record.atlasPlacement?.value === null && record.atlasPlacement?.missingReason === "out_of_scope",
    `${label}: atlas placement must be explicit null / out_of_scope`,
  );
  addCheck(
    errors,
    record.scientificUse === "morphology_illustration_only_not_spatial_query",
    `${label}: morphology must be restricted to illustration, not spatial query`,
  );
}

export async function validateSpatialAssets({ projectRoot = PROJECT_ROOT } = {}) {
  const errors = [];
  const atlasDirectory = resolve(projectRoot, ATLAS_RELATIVE_DIR);
  const morphologyDirectory = resolve(projectRoot, MORPHOLOGY_RELATIVE_DIR);
  const atlasManifestPath = resolve(atlasDirectory, "asset-manifest.json");
  const morphologyManifestPath = resolve(morphologyDirectory, "asset-manifest.json");

  const [atlasManifest, sourceAtlasManifest, contours, internalCompartments, morphologyManifest, morphologyLines] = await Promise.all([
    readJson(atlasManifestPath),
    readJson(resolve(atlasDirectory, "source-atlas-manifest.json")),
    readJson(resolve(atlasDirectory, "atlas-contours.json")),
    readJson(resolve(atlasDirectory, "atlas-internal-compartments.json")),
    readJson(morphologyManifestPath),
    readJson(resolve(morphologyDirectory, "morphology-lines.json")),
  ]);
  const [atlasAssetManifestSha, morphologyAssetManifestSha] = await Promise.all([
    sha256(atlasManifestPath),
    sha256(morphologyManifestPath),
  ]);
  addCheck(
    errors,
    atlasAssetManifestSha === EXPECTED_ATLAS.assetManifestSha256,
    "atlas asset-manifest.json SHA-256 changed",
  );
  addCheck(
    errors,
    morphologyAssetManifestSha === EXPECTED_MORPHOLOGY_MANIFEST_SHA256,
    "NeuroMorpho asset-manifest.json SHA-256 changed",
  );

  addCheck(errors, atlasManifest.atlas === EXPECTED_ATLAS.name, "atlas name must be allen_cord_20um");
  addCheck(errors, atlasManifest.assetId === EXPECTED_ATLAS.assetId, "atlas derivative asset id must remain v4");
  addCheck(errors, atlasManifest.atlasVersion === EXPECTED_ATLAS.version, "atlas version must be 3.0");
  addCheck(errors, atlasManifest.atlasApiVersion === EXPECTED_ATLAS.apiVersion, "atlas API version must be 3.0.1");
  addCheck(errors, sameJson(atlasManifest.shapeZyx, EXPECTED_ATLAS.shapeZyx), "atlas shape must be [1567,253,322]");
  addCheck(
    errors,
    sameJson(atlasManifest.resolutionUmZyx, EXPECTED_ATLAS.resolutionUmZyx),
    "atlas resolution must be [20,10,10] micrometres in z,y,x order",
  );
  addCheck(errors, atlasManifest.orientation === EXPECTED_ATLAS.orientation, "atlas orientation must be asr");
  addCheck(errors, atlasManifest.geometryStatus === "INF", "derived atlas geometry must remain INF");
  addCheck(errors, atlasManifest.species === "Mus musculus" && atlasManifest.lifeStage === "adult", "atlas must remain adult mouse");
  addCheck(
    errors,
    sameJson(atlasManifest.axes, [
      { arrayAxis: "z", direction: "anterior_to_posterior" },
      { arrayAxis: "y", direction: "superior_to_inferior" },
      { arrayAxis: "x", direction: "right_to_left" },
    ]),
    "atlas axes or anatomical directions changed",
  );
  addCheck(
    errors,
    atlasManifest.sourceManifestSha256 === EXPECTED_ATLAS.sourceManifestSha256,
    "atlas source manifest pinned SHA-256 changed",
  );
  addCheck(
    errors,
    atlasManifest.displayTransformUse === "visualization_only_not_cell_registration",
    "atlas display transform must not be described as cell registration",
  );
  addCheck(
    errors,
    atlasManifest.registrationError?.value === null && atlasManifest.registrationError?.missingReason === "not_applicable",
    "atlas derivative must not invent a registration error",
  );

  addCheck(errors, sourceAtlasManifest.version === EXPECTED_ATLAS.version, "source atlas manifest version must be 3.0");
  addCheck(errors, sameJson(sourceAtlasManifest.shape, EXPECTED_ATLAS.shapeZyx), "source atlas shape mismatch");
  addCheck(
    errors,
    sameJson(sourceAtlasManifest.resolution, EXPECTED_ATLAS.resolutionUmZyx),
    "source atlas resolution mismatch",
  );
  addCheck(errors, sourceAtlasManifest.orientation === EXPECTED_ATLAS.orientation, "source atlas orientation mismatch");
  const sourceManifestActualSha = await sha256(resolve(atlasDirectory, "source-atlas-manifest.json"));
  addCheck(
    errors,
    sourceManifestActualSha === EXPECTED_ATLAS.sourceManifestSha256,
    "source-atlas-manifest.json does not match the pinned BrainGlobe manifest",
  );

  const expectedContourInputs = [
    "allen_spinal_cord-adult-mouse-annotation:2021",
    "allen_spinal_cord-adult-mouse-nissl-template:2021",
  ];
  addCheck(errors, contours.geometryStatus === "INF", "atlas contours must remain INF");
  addCheck(errors, sameJson(contours.inputs, expectedContourInputs), "atlas contour inputs changed or are incomplete");
  addCheck(errors, typeof contours.method === "string" && contours.method.length > 40, "atlas contour method is missing");
  addCheck(
    errors,
    /sampled native transverse planes/i.test(contours.method) &&
      /annotation>0/i.test(contours.method) &&
      /4-voxel stride/i.test(contours.method),
    "atlas contour method must record plane sampling, annotation mask, and stride",
  );
  addCheck(
    errors,
    contours.confidence?.value === null && contours.confidence?.missingReason === "not_measured",
    "atlas contour confidence must remain explicit null / not_measured",
  );
  addCheck(errors, contours.measurementUse === "forbidden", "atlas contours must forbid measurement use");

  let internalCompartmentReport = null;
  try {
    internalCompartmentReport = validateAtlasInternalCompartments(internalCompartments);
  } catch (error) {
    errors.push(error.message);
  }
  let fineAnatomyReport = null;
  try {
    fineAnatomyReport = await validateAtlasFineAnatomyFile(resolve(atlasDirectory, "atlas-fine-anatomy.json"));
  } catch (error) {
    errors.push(error.message);
  }
  addCheck(
    errors,
    sameJson(atlasManifest.derivedInternalCompartments, {
      path: "atlas-internal-compartments.json",
      geometryStatus: "INF",
      measurementUse: "forbidden",
      registrationCount: 0,
      targetStructureIdentifiers: [90, 100, 110, 16, 74, 75, 70],
      componentConnectivity: 4,
      disconnectedComponents: "preserved_never_bridged",
    }),
    "atlas manifest internal-compartment declaration changed",
  );
  addCheck(
    errors,
    sameJson(atlasManifest.derivedFineAnatomy, {
      path: "atlas-fine-anatomy.json",
      assetId: "allen_cord_20um:3.0:fine-anatomy-v2",
      geometryStatus: "INF",
      measurementUse: "forbidden",
      registrationCount: 0,
      structureCount: 37,
      structuralContextStructureCount: 3,
      motorContextStructureCount: 33,
      allDirectStructureCount: 73,
      categoryCounts: { lamina: 14, nucleus_or_column: 17, tract: 6 },
      selectionMode: "exact_identifier_only",
      componentConnectivity: 4,
      disconnectedComponents: "preserved_never_bridged",
      nativeFillOverlayCount: 76,
      motorContextDefaultVisibility: "off",
      motorContextIncludedInInterneuronCounts: false,
    }),
    "atlas manifest fine-anatomy declaration changed",
  );

  const atlasDeclaredPaths = atlasManifest.files.map((file) => file.path);
  addCheck(errors, new Set(atlasDeclaredPaths).size === atlasDeclaredPaths.length, "atlas manifest has duplicate file paths");
  const actualAtlasFiles = await listFilesRecursively(atlasDirectory);
  addCheck(
    errors,
    sameJson(actualAtlasFiles, sorted(["asset-manifest.json", ...atlasDeclaredPaths])),
    "atlas directory contains missing or undeclared files",
  );

  const pngReports = [];
  const fillOverlayDeclarations = [];
  for (const declaration of atlasManifest.files) {
    const verified = await verifyDeclaredFile(errors, atlasDirectory, declaration, "atlas assets");
    if (!verified || !declaration.path.endsWith(".png")) continue;
    if (declaration.assetRole === "fine_anatomy_fill_overlay") {
      addCheck(
        errors,
        /^fine-anatomy-overlays\/(fine-context|motor-context)-z\d{4}\.png$/.test(declaration.path),
        `atlas assets: ${declaration.path} has an invalid fine-anatomy overlay path`,
      );
      addCheck(errors, Number.isInteger(declaration.zIndex), `atlas assets: ${declaration.path} lacks zIndex`);
      addCheck(
        errors,
        atlasManifest.sampledZIndices.includes(declaration.zIndex),
        `atlas assets: ${declaration.path} has a zIndex outside the sampled plane set`,
      );
      fillOverlayDeclarations.push(declaration);
      continue;
    }
    addCheck(
      errors,
      declaration.assetRole === "reference_slice",
      `atlas assets: ${declaration.path} must declare reference_slice or fine_anatomy_fill_overlay`,
    );
    try {
      const png = inspectPng(await readFile(verified.path));
      addCheck(
        errors,
        png.width === EXPECTED_ATLAS.pngWidth && png.height === EXPECTED_ATLAS.pngHeight,
        `atlas assets: ${declaration.path} must be 644x506`,
      );
      addCheck(errors, png.nonBlank && png.idatBytes > 0, `atlas assets: ${declaration.path} is blank`);
      addCheck(errors, Number.isInteger(declaration.zIndex), `atlas assets: ${declaration.path} lacks zIndex`);
      addCheck(
        errors,
        declaration.anteriorPosteriorMm === Number((declaration.zIndex * 0.02).toFixed(3)),
        `atlas assets: ${declaration.path} AP coordinate does not match z resolution`,
      );
      addCheck(
        errors,
        declaration.path === `slice-z${String(declaration.zIndex).padStart(4, "0")}.png`,
        `atlas assets: ${declaration.path} filename/zIndex mismatch`,
      );
      pngReports.push({ path: declaration.path, ...png });
    } catch (error) {
      errors.push(`atlas assets: ${declaration.path}: ${error.message}`);
    }
  }
  addCheck(errors, pngReports.length === atlasManifest.sampledZIndices.length, "each sampled z index must have one PNG");
  addCheck(errors, pngReports.length === 38, "atlas asset set must contain 38 sampled PNG planes");
  addCheck(errors, fillOverlayDeclarations.length === 76, "atlas asset set must contain 76 exact native fill overlays");
  addCheck(
    errors,
    fineAnatomyReport?.verifiedOverlayCount === fillOverlayDeclarations.length,
    "fine-anatomy overlay file count must reconcile between the fine asset and global manifest",
  );

  const contourZIndices = contours.planes.map((plane) => plane.zIndex);
  addCheck(
    errors,
    sameJson(contourZIndices, atlasManifest.sampledZIndices),
    "contour planes must exactly match sampled atlas z indices",
  );
  for (const plane of contours.planes) {
    const label = `atlas contours z=${plane.zIndex}`;
    addCheck(
      errors,
      plane.anteriorPosteriorMm === Number((plane.zIndex * 0.02).toFixed(3)),
      `${label}: AP coordinate mismatch`,
    );
    addCheck(
      errors,
      plane.segment?.value === null && plane.segment?.missingReason === "pending_curation",
      `${label}: spinal segment must remain pending curation`,
    );
    for (const [contourName, points] of [
      ["outer", plane.outerContourVoxelXY],
      ["gray matter", plane.grayMatterContourVoxelXY],
    ]) {
      addCheck(errors, Array.isArray(points) && points.length >= 4, `${label}: ${contourName} contour is empty`);
      for (const point of points ?? []) {
        addCheck(
          errors,
          Array.isArray(point) &&
            point.length === 2 &&
            point.every(Number.isFinite) &&
            point[0] >= 0 &&
            point[0] < EXPECTED_ATLAS.shapeZyx[2] &&
            point[1] >= 0 &&
            point[1] < EXPECTED_ATLAS.shapeZyx[1],
          `${label}: ${contourName} has an invalid native voxel point`,
        );
      }
    }
  }

  addCheck(errors, morphologyManifest.release === "8.6.124", "NeuroMorpho release must be 8.6.124");
  addCheck(errors, morphologyManifest.queryTotalAtSnapshot === 142, "NeuroMorpho API snapshot total must remain 142");
  addCheck(
    errors,
    /five phenotype-stratified examples/i.test(morphologyManifest.selection ?? "") &&
      /not a representative sample/i.test(morphologyManifest.selection ?? ""),
    "NeuroMorpho selection must be described as five non-representative exemplars",
  );
  addCheck(errors, morphologyManifest.records.length === 5, "NeuroMorpho asset set must contain exactly five records");
  addCheck(
    errors,
    sameJson(
      morphologyManifest.records.map((record) => record.neuronId),
      EXPECTED_MORPHOLOGY_IDS,
    ),
    "NeuroMorpho exemplar ids changed",
  );
  addCheck(
    errors,
    /not a representative census/i.test(morphologyLines.warning ?? "") &&
      /not registered to allen_cord_20um/i.test(morphologyLines.warning ?? ""),
    "derived morphology warning must prohibit representative and registered interpretations",
  );
  addCheck(errors, morphologyLines.release === "8.6.124", "derived morphology release mismatch");
  addCheck(errors, morphologyLines.morphologies.length === 5, "derived morphology file must contain five exemplars");

  const morphologyDeclaredPaths = [
    ...morphologyManifest.records.map((record) => record.localPath),
    morphologyManifest.derivedLines.path,
  ];
  addCheck(
    errors,
    new Set(morphologyDeclaredPaths).size === morphologyDeclaredPaths.length,
    "NeuroMorpho manifest has duplicate local paths",
  );
  const actualMorphologyFiles = await listFilesRecursively(morphologyDirectory);
  addCheck(
    errors,
    sameJson(actualMorphologyFiles, sorted(["asset-manifest.json", ...morphologyDeclaredPaths])),
    "NeuroMorpho directory contains missing or undeclared files",
  );
  await verifyDeclaredFile(errors, morphologyDirectory, morphologyManifest.derivedLines, "NeuroMorpho assets");

  const derivedMorphologies = new Map(
    morphologyLines.morphologies.map((morphology) => [morphology.neuronId, morphology]),
  );
  const swcReports = [];
  for (const record of morphologyManifest.records) {
    const label = `NeuroMorpho ${record.neuronId}`;
    validateLocalUnregisteredRecord(errors, record, label);
    addCheck(errors, record.species === "Mus musculus" && record.lifeStage === "adult", `${label}: species/life stage mismatch`);
    addCheck(errors, record.brainRegion?.includes("spinal cord"), `${label}: spinal-cord region is missing`);
    addCheck(errors, /^https:\/\/neuromorpho\.org\/api\/neuron\/id\//.test(record.sourceUrl ?? ""), `${label}: invalid API source URL`);
    addCheck(errors, /^https:\/\/neuromorpho\.org\/dableFiles\//.test(record.swcUrl ?? ""), `${label}: invalid direct SWC URL`);

    const verified = await verifyDeclaredFile(
      errors,
      morphologyDirectory,
      { path: record.localPath, sha256: record.sha256, bytes: record.bytes },
      "NeuroMorpho assets",
    );
    if (!verified) continue;
    try {
      const parsed = parseSwcText(await readFile(verified.path, "utf8"), label);
      addCheck(errors, parsed.dataLineCount === parsed.nodeCount, `${label}: one-parent-per-row invariant failed`);
      addCheck(errors, parsed.nodeCount === record.nodeCount, `${label}: node count mismatch`);
      addCheck(errors, parsed.rootNodeId === record.rootNodeId, `${label}: root node id mismatch`);
      addCheck(errors, valuesApproximatelyEqual(parsed.bounds.min, record.boundsMicrometre.min), `${label}: minimum bounds mismatch`);
      addCheck(errors, valuesApproximatelyEqual(parsed.bounds.max, record.boundsMicrometre.max), `${label}: maximum bounds mismatch`);
      addCheck(errors, parsed.zeroLengthEdges === record.qc.zeroLengthEdges, `${label}: zero-length edge count mismatch`);
      addCheck(
        errors,
        ["sevenColumns", "finite", "uniqueNodeIds", "singleRoot", "parentsPresent", "acyclic", "positiveRadius"].every(
          (field) => record.qc?.[field] === true,
        ),
        `${label}: manifest QC flags are incomplete`,
      );
      const hasAxon = parsed.nodeTypes.includes(2);
      const domainRequiresAxon = /\bAxon\b/.test(record.domain) && !/No Axon/.test(record.domain);
      const domainForbidsAxon = /No Axon/.test(record.domain);
      addCheck(errors, parsed.nodeTypes.includes(1), `${label}: Soma domain has no type-1 node`);
      addCheck(errors, parsed.nodeTypes.includes(3), `${label}: Dendrites domain has no type-3 node`);
      addCheck(errors, !domainRequiresAxon || hasAxon, `${label}: domain reports axon but SWC lacks type 2`);
      addCheck(errors, !domainForbidsAxon || !hasAxon, `${label}: domain reports no axon but SWC contains type 2`);
      addCheck(errors, record.qc.domainMatchesTypes === true, `${label}: domain/type QC flag must be true`);

      const derived = derivedMorphologies.get(record.neuronId);
      addCheck(errors, Boolean(derived), `${label}: missing derived morphology record`);
      if (derived) {
        validateLocalUnregisteredRecord(errors, derived, `${label} derived lines`);
        addCheck(errors, derived.sha256 === record.sha256, `${label}: derived/raw checksum link mismatch`);
        addCheck(errors, derived.nodeCount === record.nodeCount, `${label}: derived/raw node count mismatch`);
        addCheck(errors, derived.displayTransform?.use === "viewer_only", `${label}: display transform must be viewer-only`);
        addCheck(errors, derived.segments?.length === parsed.nodeCount - 1, `${label}: derived line count mismatch`);
      }
      swcReports.push({
        neuronId: record.neuronId,
        nodeCount: parsed.nodeCount,
        sha256: verified.sha256,
        nodeTypes: parsed.nodeTypes,
        geometryStatus: record.geometryStatus,
        registrationStatus: record.registrationStatus,
      });
    } catch (error) {
      errors.push(`${label}: ${error.message}`);
    }
  }
  addCheck(errors, swcReports.length === 5, "all five SWCs must parse and validate");
  addCheck(
    errors,
    sameJson(sorted(derivedMorphologies.keys()), sorted(EXPECTED_MORPHOLOGY_IDS)),
    "derived morphology ids must match the five manifest exemplars",
  );

  const serializedMorphologyAssets = JSON.stringify({ morphologyManifest, morphologyLines });
  addCheck(errors, !serializedMorphologyAssets.includes('"registrationStatus":"registered"'), "a morphology claims registered status");
  addCheck(errors, !serializedMorphologyAssets.includes('"geometryStatus":"REG"'), "a morphology claims REG geometry");

  const [provenanceDocument, rightsLedger] = await Promise.all([
    readFile(resolve(projectRoot, "docs/SPATIAL_ASSET_PROVENANCE.md"), "utf8"),
    readFile(resolve(projectRoot, "docs/RIGHTS_LEDGER.csv"), "utf8"),
  ]);
  for (const [pattern, message] of [
    [/Snapshot date: 2026-08-26/, "provenance document lacks its snapshot date"],
    [/BrainGlobe atlas version \| `3\.0`/, "provenance document lacks atlas version 3.0"],
    [/Native shape, z-y-x \| `\[1567, 253, 322\]`/, "provenance document lacks atlas shape"],
    [/Native resolution, z-y-x \| `\[20, 10, 10\]`/, "provenance document lacks atlas resolution"],
    [/Geometry status \| `INF`/, "provenance document lacks the atlas INF status"],
    [/Confidence is .*not_measured/, "provenance document lacks the unmeasured-confidence boundary"],
    [/Repository release: `8\.6\.124`/, "provenance document lacks the NeuroMorpho release"],
    [/exemplars, not a representative sample/i, "provenance document lacks the non-representative boundary"],
    [/registrationStatus` is `unregistered`/, "provenance document lacks unregistered status"],
    [/atlasTransform\.value` is `null`/, "provenance document lacks the null-transform boundary"],
    [/tools\/build_atlas_reference\.py/, "provenance document lacks the atlas generation command"],
    [/tools\/build_morphology_assets\.py/, "provenance document lacks the morphology generation command"],
    [/node scripts\/validate-spatial-assets\.mjs/, "provenance document lacks the validator command"],
    [/## 4\. Scientific limitations/, "provenance document lacks a scientific-limitations section"],
  ]) {
    addCheck(errors, pattern.test(provenanceDocument), message);
  }
  addCheck(
    errors,
    rightsLedger.includes("BrainGlobe allen_cord_20um assets,atlas 3.0 with 2021 components,yes"),
    "rights ledger does not mark the bundled BrainGlobe-derived assets",
  );
  addCheck(
    errors,
    rightsLedger.includes("NeuroMorpho.Org SWC exemplars,release 8.6.124 snapshot 2026-08-17,yes"),
    "rights ledger does not mark the bundled NeuroMorpho SWCs",
  );
  addCheck(errors, rightsLedger.includes("CC BY-NC-ND 4.0,not copied into bundle"), "rights ledger omits the article-figure restriction");

  if (errors.length) {
    throw new Error(`Spatial asset validation failed with ${errors.length} error(s):\n${errors.map((error) => `- ${error}`).join("\n")}`);
  }

  return {
    atlas: {
      atlas: atlasManifest.atlas,
      version: atlasManifest.atlasVersion,
      manifestSha256: atlasAssetManifestSha,
      sourceManifestSha256: sourceManifestActualSha,
      declaredFileCount: atlasManifest.files.length,
      pngCount: pngReports.length,
      pngs: pngReports,
      fillOverlayCount: fillOverlayDeclarations.length,
      geometryStatus: atlasManifest.geometryStatus,
      internalCompartments: internalCompartmentReport,
      fineAnatomy: fineAnatomyReport,
    },
    neuromorpho: {
      release: morphologyManifest.release,
      manifestSha256: morphologyAssetManifestSha,
      derivedLinesSha256: await sha256(resolve(morphologyDirectory, morphologyManifest.derivedLines.path)),
      recordCount: swcReports.length,
      records: swcReports,
      selection: morphologyManifest.selection,
    },
    documentation: {
      provenance: "docs/SPATIAL_ASSET_PROVENANCE.md",
      rightsLedger: "docs/RIGHTS_LEDGER.csv",
      validated: true,
    },
  };
}

async function runCli() {
  try {
    const report = await validateSpatialAssets();
    console.log("Spatial asset validation passed.");
    console.log(
      `Atlas ${report.atlas.atlas} ${report.atlas.version}: ${report.atlas.declaredFileCount} declared files, ` +
        `${report.atlas.pngCount} non-blank 644x506 reference PNG planes and ` +
        `${report.atlas.fillOverlayCount} exact 322x253 RGBA fill overlays, geometry ${report.atlas.geometryStatus}.`,
    );
    console.log(`Atlas asset-manifest SHA-256: ${report.atlas.manifestSha256}`);
    console.log(
      `Internal compartments: ${report.atlas.internalCompartments.structureIdentifiers.length} source structures, ` +
        `${report.atlas.internalCompartments.sampledPlaneCount} ordered planes each, ` +
        `${report.atlas.internalCompartments.totalComponents} unbridged components, ` +
        `${report.atlas.internalCompartments.missingPlaneCount} explicit missing plane records, INF / measurement forbidden / 0 REG.`,
    );
    console.log(
      `Fine anatomy: ${report.atlas.fineAnatomy.structureCount} browser IDs + ` +
        `${report.atlas.fineAnatomy.structuralContextStructureCount} structural-context IDs + ` +
        `${report.atlas.fineAnatomy.motorContextStructureCount} off-by-default motor-context IDs, ` +
        `${report.atlas.fineAnatomy.totalContourCount} plane-local rings, ` +
        `${report.atlas.fineAnatomy.missingPlaneCount} explicit missing plane records, all targets sampled, 0 REG.`,
    );
    console.log(
      `NeuroMorpho ${report.neuromorpho.release}: ${report.neuromorpho.recordCount} checksum-verified OBS local exemplars; ` +
        "all unregistered with null atlas transforms.",
    );
    console.log(`NeuroMorpho asset-manifest SHA-256: ${report.neuromorpho.manifestSha256}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (invokedPath === import.meta.url) await runCli();
