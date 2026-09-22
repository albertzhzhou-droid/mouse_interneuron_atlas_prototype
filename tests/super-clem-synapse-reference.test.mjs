import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import {
  collectSuperClemSemanticErrors,
  parsePngImageInfo,
  parseTiffImageInfo,
  validateSuperClemSynapseReference,
} from "../scripts/validate-super-clem-synapse-reference-0.1.mjs";

const CONTRACT_URL = new URL("../data/super-clem-synapse-reference-0.1.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/super-clem-synapse-reference-0.1.schema.json", import.meta.url);
const MEMORY_CONTRACT_URL = new URL("memory:super-clem-contract");
const MEMORY_SCHEMA_URL = new URL("memory:super-clem-schema");

const [contract, schema] = await Promise.all([
  readFile(CONTRACT_URL, "utf8").then(JSON.parse),
  readFile(SCHEMA_URL, "utf8").then(JSON.parse),
]);

function compileSchema() {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  return ajv.compile(schema);
}

async function validateAlteredContract(altered) {
  return validateSuperClemSynapseReference({
    contractUrl: MEMORY_CONTRACT_URL,
    schemaUrl: MEMORY_SCHEMA_URL,
    read: async (url, encoding) => {
      if (String(url) === String(MEMORY_CONTRACT_URL)) return JSON.stringify(altered);
      if (String(url) === String(MEMORY_SCHEMA_URL)) return JSON.stringify(schema);
      return readFile(url, encoding);
    },
  });
}

test("validates one exact Super-CLEM 2D slice with zero joins and zero 3D reconstructions", async () => {
  const report = await validateSuperClemSynapseReference();
  assert.deepEqual(report, {
    releaseId: "ohri-super-clem-synapse-reference-0.1.0",
    sourceObjectId: "FigshareFile:32606555",
    sourceSliceCount: 1,
    browserDerivativeCount: 1,
    crossLaneJoinCount: 0,
    registrationCount: 0,
    threeDimensionalReconstructionCount: 0,
  });
});

test("reads the pinned TIFF and PNG as exact 1794 by 1332 indexed-palette images", async () => {
  const tiffUrl = new URL(`../public${contract.sourceObject.localOriginal.path}`, import.meta.url);
  const pngUrl = new URL(`../public${contract.browserDerivative.path}`, import.meta.url);
  const [tiff, png] = await Promise.all([readFile(tiffUrl), readFile(pngUrl)]);
  assert.deepEqual(parseTiffImageInfo(tiff), {
    widthPixels: 1794,
    heightPixels: 1332,
    bitsPerSample: [8],
    samplesPerPixel: 1,
    photometricInterpretation: 3,
    storageEncoding: "indexed_rgb_palette",
    colorMode: "RGB",
  });
  assert.deepEqual(parsePngImageInfo(png), {
    widthPixels: 1794,
    heightPixels: 1332,
    bitDepth: 8,
    colorType: 3,
    storageEncoding: "indexed_rgb_palette",
    colorMode: "RGB",
  });
  assert.equal(contract.browserDerivative.decodedRgbEquivalence.status, "verified");
  assert.equal(contract.browserDerivative.decodedRgbEquivalence.differenceBoundingBox, null);
});

test("schema rejects a morphology join or an invented segmentation claim", () => {
  const altered = structuredClone(contract);
  altered.relationshipPolicy.crossLaneRelationships[0].joinedEntityIds = ["NeuroMorpho:104003"];
  altered.relationshipPolicy.crossLaneRelationships[0].joinCount = 1;
  altered.claimPermissions.segmentation = true;
  const validate = compileSchema();
  assert.equal(validate(altered), false);
  const diagnostics = (validate.errors ?? []).map((error) => `${error.instancePath} ${error.message}`).join("\n");
  assert.match(diagnostics, /joinedEntityIds/);
  assert.match(diagnostics, /joinCount/);
  assert.match(diagnostics, /segmentation/);
});

test("semantic gate rejects a duplicated lane even when no positive join is declared", () => {
  const altered = structuredClone(contract);
  altered.relationshipPolicy.crossLaneRelationships[1].targetLane = "neuromorpho_morphology";
  assert.match(collectSuperClemSemanticErrors(altered).join("\n"), /complete, unique and ordered/);
});

test("unacquired receipt placeholders are schema-valid records but fail closed at admission", async () => {
  const altered = structuredClone(contract);
  altered.sourceObject.localOriginal = {
    ...altered.sourceObject.localOriginal,
    receiptStatus: "not_acquired",
    bytes: null,
    md5: null,
    sha256: null,
  };
  const validate = compileSchema();
  assert.equal(validate(altered), true, JSON.stringify(validate.errors));
  await assert.rejects(validateAlteredContract(altered), /placeholder receipts fail closed/);
});

test("a syntactically valid but incorrect local hash fails closed against the binary", async () => {
  const altered = structuredClone(contract);
  altered.sourceObject.localOriginal.sha256 = "a".repeat(64);
  const validate = compileSchema();
  assert.equal(validate(altered), true, JSON.stringify(validate.errors));
  await assert.rejects(validateAlteredContract(altered), /local TIFF SHA-256 does not match its receipt/);
});

