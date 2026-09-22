import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const CONTRACT_URL = new URL("../data/super-clem-synapse-reference-0.1.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/super-clem-synapse-reference-0.1.schema.json", import.meta.url);
const PUBLIC_DATA_ROOT = new URL("../public/data/", import.meta.url);

const EXPECTED_LANES = ["neuromorpho_morphology", "interneuron_type", "atlas_entity"];
const EXPECTED_MISSINGNESS = [
  "parent_cell_identity",
  "segmentation_or_mesh",
  "organelle_annotation",
  "receptor_overlay",
  "atlas_placement",
];
const FORBIDDEN_CLAIMS = [
  "threeDimensionalReconstruction",
  "segmentation",
  "mesh",
  "organelleAnnotation",
  "receptorOverlay",
  "namedInterneuronIdentity",
  "dendriteIdentity",
  "presynapticCellIdentity",
  "fileLevelPalmCrosswalk",
  "neuroMorphoJoin",
  "interneuronTypeJoin",
  "atlasJoin",
];

function digest(algorithm, bytes) {
  return createHash(algorithm).update(bytes).digest("hex");
}

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

function formatSchemaErrors(errors = []) {
  return errors.map((error) => `${error.instancePath || "/"}: ${error.message ?? "schema violation"}`);
}

function localDataUrl(path, publicDataRoot = PUBLIC_DATA_ROOT) {
  if (typeof path !== "string" || !path.startsWith("/data/")) {
    throw new Error(`local asset path must start with /data/: ${String(path)}`);
  }
  return new URL(path.slice("/data/".length), publicDataRoot);
}

function readUint16(bytes, offset, littleEndian) {
  if (offset < 0 || offset + 2 > bytes.length) throw new Error("TIFF SHORT value is out of bounds");
  return littleEndian ? bytes.readUInt16LE(offset) : bytes.readUInt16BE(offset);
}

function readUint32(bytes, offset, littleEndian) {
  if (offset < 0 || offset + 4 > bytes.length) throw new Error("TIFF LONG value is out of bounds");
  return littleEndian ? bytes.readUInt32LE(offset) : bytes.readUInt32BE(offset);
}

function readTiffValues(bytes, entryOffset, littleEndian, type, count) {
  const byteWidth = type === 1 ? 1 : type === 3 ? 2 : type === 4 ? 4 : 0;
  if (!byteWidth) throw new Error(`unsupported TIFF field type ${type}`);
  const byteLength = byteWidth * count;
  const valueOffset = byteLength <= 4 ? entryOffset + 8 : readUint32(bytes, entryOffset + 8, littleEndian);
  if (valueOffset < 0 || valueOffset + byteLength > bytes.length) throw new Error("TIFF value payload is out of bounds");
  return Array.from({ length: count }, (_, index) => {
    const offset = valueOffset + index * byteWidth;
    if (type === 1) return bytes[offset];
    if (type === 3) return readUint16(bytes, offset, littleEndian);
    return readUint32(bytes, offset, littleEndian);
  });
}

export function parseTiffImageInfo(input) {
  const bytes = Buffer.isBuffer(input) ? input : Buffer.from(input);
  if (bytes.length < 8) throw new Error("TIFF file is too short");
  const byteOrder = bytes.subarray(0, 2).toString("ascii");
  if (byteOrder !== "II" && byteOrder !== "MM") throw new Error("TIFF byte order marker is invalid");
  const littleEndian = byteOrder === "II";
  if (readUint16(bytes, 2, littleEndian) !== 42) throw new Error("unsupported TIFF magic number");
  const ifdOffset = readUint32(bytes, 4, littleEndian);
  const entryCount = readUint16(bytes, ifdOffset, littleEndian);
  const tags = new Map();
  for (let index = 0; index < entryCount; index += 1) {
    const entryOffset = ifdOffset + 2 + index * 12;
    if (entryOffset + 12 > bytes.length) throw new Error("TIFF IFD entry is out of bounds");
    const tag = readUint16(bytes, entryOffset, littleEndian);
    const type = readUint16(bytes, entryOffset + 2, littleEndian);
    const count = readUint32(bytes, entryOffset + 4, littleEndian);
    if ([256, 257, 258, 262, 277].includes(tag)) {
      tags.set(tag, readTiffValues(bytes, entryOffset, littleEndian, type, count));
    }
  }
  const widthPixels = tags.get(256)?.[0];
  const heightPixels = tags.get(257)?.[0];
  const bitsPerSample = tags.get(258) ?? [];
  const photometricInterpretation = tags.get(262)?.[0];
  const samplesPerPixel = tags.get(277)?.[0] ?? 1;
  if (!Number.isInteger(widthPixels) || !Number.isInteger(heightPixels)) throw new Error("TIFF dimensions are missing");
  return {
    widthPixels,
    heightPixels,
    bitsPerSample,
    samplesPerPixel,
    photometricInterpretation,
    storageEncoding: photometricInterpretation === 3 && samplesPerPixel === 1
      ? "indexed_rgb_palette"
      : photometricInterpretation === 2 && samplesPerPixel === 3
        ? "direct_rgb"
        : "unsupported",
    colorMode: (photometricInterpretation === 2 && samplesPerPixel === 3) || (photometricInterpretation === 3 && samplesPerPixel === 1) ? "RGB" : "UNSUPPORTED",
  };
}

export function parsePngImageInfo(input) {
  const bytes = Buffer.isBuffer(input) ? input : Buffer.from(input);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (bytes.length < 33 || !bytes.subarray(0, 8).equals(signature)) throw new Error("PNG signature is invalid");
  if (bytes.readUInt32BE(8) !== 13 || bytes.subarray(12, 16).toString("ascii") !== "IHDR") throw new Error("PNG IHDR is invalid");
  const colorType = bytes[25];
  return {
    widthPixels: bytes.readUInt32BE(16),
    heightPixels: bytes.readUInt32BE(20),
    bitDepth: bytes[24],
    colorType,
    storageEncoding: colorType === 3 ? "indexed_rgb_palette" : colorType === 2 ? "direct_rgb" : colorType === 6 ? "direct_rgba" : "unsupported",
    colorMode: colorType === 2 || colorType === 3 ? "RGB" : colorType === 6 ? "RGBA" : "UNSUPPORTED",
  };
}

export function collectSuperClemSemanticErrors(contract) {
  const errors = [];
  check(contract.sourceObject?.figshareFileId === 32606555, "Figshare file ID must remain 32606555", errors);
  check(contract.sourceObject?.remoteReceipt?.bytes === 2405817, "remote TIFF byte receipt must remain 2405817", errors);
  check(contract.sourceObject?.remoteReceipt?.md5 === "384e5d12c9d024feed140b0ab46bb688", "remote TIFF MD5 receipt drifted", errors);
  check(contract.sourceObject?.image?.dimensionality === "2D", "source object must remain a two-dimensional slice", errors);
  check(contract.sourceObject?.biologicalScope?.objectRole === "two_dimensional_em_reference_slice", "source object role must remain a 2D EM reference slice", errors);
  check(contract.sourceObject?.biologicalScope?.physicalObjectRelationship === "same_physical_synapse_slice", "physical-object relationship drifted", errors);
  check(contract.sourceObject?.biologicalScope?.parentCellResolved === false && contract.sourceObject?.biologicalScope?.parentCellId === null, "parent cell must remain unresolved", errors);
  check(contract.browserDerivative?.derivedFromPath === contract.sourceObject?.localOriginal?.path, "browser derivative must point to the pinned local TIFF", errors);
  check(contract.browserDerivative?.derivation === "lossless_format_conversion_for_browser_display", "browser derivative must remain format conversion only", errors);
  check(contract.browserDerivative?.conversionTool?.name === "Pillow" && contract.browserDerivative?.conversionTool?.version === "12.3.0" && contract.browserDerivative?.conversionTool?.operation === "direct_palette_mode_tiff_decode_and_png_save" && contract.browserDerivative?.conversionTool?.optimize === false, "browser conversion-tool receipt drifted", errors);
  check(contract.browserDerivative?.decodedRgbEquivalence?.status === "verified" && contract.browserDerivative?.decodedRgbEquivalence?.differenceBoundingBox === null, "browser derivative lost decoded-RGB equivalence", errors);
  check(contract.browserDerivative?.cropped === false && contract.browserDerivative?.resampled === false && contract.browserDerivative?.intensityTransformApplied === false && contract.browserDerivative?.segmentationAdded === false && contract.browserDerivative?.scientificAnnotationAdded === false, "browser derivative gained an unauthorized scientific transformation", errors);

  const relationships = contract.relationshipPolicy?.crossLaneRelationships ?? [];
  check(JSON.stringify(relationships.map((item) => item.targetLane)) === JSON.stringify(EXPECTED_LANES), "cross-lane targets must remain complete, unique and ordered", errors);
  for (const relationship of relationships) {
    check(relationship.relationship === "co_display_only", `${relationship.targetLane ?? "unknown lane"} must remain co-display only`, errors);
    check(Array.isArray(relationship.joinedEntityIds) && relationship.joinedEntityIds.length === 0 && relationship.joinCount === 0, `${relationship.targetLane ?? "unknown lane"} gained a source-to-entity join`, errors);
    check(relationship.registrationCount === 0, `${relationship.targetLane ?? "unknown lane"} gained a registration`, errors);
  }
  check(contract.relationshipPolicy?.parentCellResolved === false, "relationship policy resolved a parent cell", errors);
  check(contract.relationshipPolicy?.namedInterneuronResolved === false, "relationship policy resolved a named interneuron", errors);
  check(contract.relationshipPolicy?.dendriteIdentityResolved === false, "relationship policy resolved a dendrite identity", errors);
  check(contract.relationshipPolicy?.presynapticCellResolved === false, "relationship policy resolved a presynaptic cell", errors);
  check(contract.relationshipPolicy?.fileLevelPalmCrosswalkAvailable === false, "relationship policy invented a file-level PALM crosswalk", errors);
  for (const field of FORBIDDEN_CLAIMS) {
    check(contract.claimPermissions?.[field] === false, `${field} must remain forbidden`, errors);
  }
  check(contract.claimPermissions?.source2dSliceDisplay === true && contract.claimPermissions?.browserPngDisplay === true, "only exact 2D source and browser-derivative display may be admitted", errors);
  check(JSON.stringify((contract.missingness ?? []).map((item) => item.field)) === JSON.stringify(EXPECTED_MISSINGNESS), "missingness axes must remain complete, unique and ordered", errors);
  check((contract.missingness ?? []).every((item) => item.status === "UNAVAILABLE"), "missing evidence must not be converted into biological absence", errors);
  check((contract.hardBoundaries ?? []).some((item) => /not a three-dimensional reconstruction, segmentation or mesh/i.test(item)), "missing 2D-only reconstruction boundary", errors);
  check((contract.hardBoundaries ?? []).some((item) => /8-bit indexed-palette.*not stored three-channel samples/i.test(item)), "missing indexed-palette storage boundary", errors);
  check((contract.hardBoundaries ?? []).some((item) => /parent cell.*unresolved/i.test(item)), "missing unresolved-parent-cell boundary", errors);
  check((contract.hardBoundaries ?? []).some((item) => /co-display only with zero joins and zero registrations/i.test(item)), "missing zero-join boundary", errors);
  check((contract.hardBoundaries ?? []).some((item) => /does not mean the structure is biologically absent/i.test(item)), "missing unavailable-is-not-absent boundary", errors);
  return errors;
}

async function loadJson(url, read = readFile) {
  return read(url, "utf8").then(JSON.parse);
}

export async function validateSuperClemSynapseReference({
  contractUrl = CONTRACT_URL,
  schemaUrl = SCHEMA_URL,
  publicDataRoot = PUBLIC_DATA_ROOT,
  read = readFile,
} = {}) {
  const [contract, schema] = await Promise.all([loadJson(contractUrl, read), loadJson(schemaUrl, read)]);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const errors = [];
  if (!validate(contract)) errors.push(...formatSchemaErrors(validate.errors));
  errors.push(...collectSuperClemSemanticErrors(contract));

  const originalReceipt = contract.sourceObject?.localOriginal;
  if (originalReceipt?.receiptStatus !== "verified_local_copy") {
    errors.push("original TIFF local receipt is not verified; placeholder receipts fail closed");
  } else {
    try {
      const tiffBytes = await read(localDataUrl(originalReceipt.path, publicDataRoot));
      check(tiffBytes.byteLength === originalReceipt.bytes, "local TIFF byte count does not match its receipt", errors);
      check(tiffBytes.byteLength === contract.sourceObject.remoteReceipt.bytes, "local TIFF byte count does not match the Figshare receipt", errors);
      check(digest("md5", tiffBytes) === originalReceipt.md5, "local TIFF MD5 does not match its local receipt", errors);
      check(digest("md5", tiffBytes) === contract.sourceObject.remoteReceipt.md5, "local TIFF MD5 does not match the Figshare receipt", errors);
      check(digest("sha256", tiffBytes) === originalReceipt.sha256, "local TIFF SHA-256 does not match its receipt", errors);
      const image = parseTiffImageInfo(tiffBytes);
      check(image.widthPixels === contract.sourceObject.image.widthPixels && image.heightPixels === contract.sourceObject.image.heightPixels, "local TIFF dimensions drifted", errors);
      check(image.bitsPerSample.every((value) => value === contract.sourceObject.image.bitsPerSample), "local TIFF bit depth drifted", errors);
      check(image.samplesPerPixel === contract.sourceObject.image.samplesPerPixel, "local TIFF sample count drifted", errors);
      check(image.photometricInterpretation === contract.sourceObject.image.photometricInterpretation, "local TIFF photometric interpretation drifted", errors);
      check(image.storageEncoding === contract.sourceObject.image.storageEncoding && image.colorMode === contract.sourceObject.image.decodedColorFamily, "local TIFF palette storage or decoded color family drifted", errors);
    } catch (error) {
      errors.push(`local TIFF could not be verified: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const derivativeReceipt = contract.browserDerivative;
  if (derivativeReceipt?.receiptStatus !== "verified_format_derivative") {
    errors.push("browser PNG local receipt is not verified; placeholder receipts fail closed");
  } else {
    try {
      const pngBytes = await read(localDataUrl(derivativeReceipt.path, publicDataRoot));
      check(pngBytes.byteLength === derivativeReceipt.bytes, "browser PNG byte count does not match its receipt", errors);
      check(digest("sha256", pngBytes) === derivativeReceipt.sha256, "browser PNG SHA-256 does not match its receipt", errors);
      const image = parsePngImageInfo(pngBytes);
      check(image.widthPixels === derivativeReceipt.widthPixels && image.heightPixels === derivativeReceipt.heightPixels, "browser PNG dimensions drifted", errors);
      check(image.bitDepth === derivativeReceipt.bitDepth && image.colorType === derivativeReceipt.pngColorType, "browser PNG bit depth or color type drifted", errors);
      check(image.storageEncoding === derivativeReceipt.storageEncoding && image.colorMode === derivativeReceipt.decodedColorFamily, "browser PNG palette storage or decoded color family drifted", errors);
    } catch (error) {
      errors.push(`browser PNG could not be verified: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (errors.length) {
    throw new Error(`Super-CLEM synapse reference validation failed:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  }
  return {
    releaseId: contract.releaseId,
    sourceObjectId: contract.sourceObject.sourceObjectId,
    sourceSliceCount: 1,
    browserDerivativeCount: 1,
    crossLaneJoinCount: contract.relationshipPolicy.crossLaneRelationships.reduce((sum, item) => sum + item.joinCount, 0),
    registrationCount: contract.relationshipPolicy.crossLaneRelationships.reduce((sum, item) => sum + item.registrationCount, 0),
    threeDimensionalReconstructionCount: contract.claimPermissions.threeDimensionalReconstruction ? 1 : 0,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file://${process.argv[1]}`))) {
  try {
    const result = await validateSuperClemSynapseReference();
    console.log(`Super-CLEM synapse reference validation passed: ${result.sourceObjectId}; ${result.sourceSliceCount} exact 2D source slice; ${result.crossLaneJoinCount} cross-lane joins; ${result.threeDimensionalReconstructionCount} 3D reconstructions.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
