#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gunzipSync } from "node:zlib";
import { validateHayashiV2aSourceTaxonomy } from "../scripts/validate-hayashi-v2a-source-taxonomy-0.1.mjs";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CANONICAL_DATA_PATH = resolve(PROJECT_ROOT, "data/hayashi-v2a-source-taxonomy-0.1.json");
const DEFAULT_OUTPUT_PATH = CANONICAL_DATA_PATH;
const CANONICAL_DATA_SHA256 = "eaaa49ea63c300d1a719eb9119a3c2735674d3f0d5113567dcb583489674f882";

export const HAYASHI_SOURCE_MATRIX_RECEIPT = Object.freeze({
  fileName: "GSM2913270_umiGeneCounts.csv.gz",
  compressedBytes: 3597244,
  compressedSha256: "d6d55f8780c7102fd71fe66e037dac6f48638c97ce2124b331c498e3fb73f8de",
  uncompressedBytes: 24981295,
  uncompressedSha256: "a0d97a23ac28700e621ca90a6725b6bfb38f645094affa8289ed922ce33f9753",
  geneRowCount: 12986,
  cellBarcodeColumnCount: 949,
  metadataColumns: ["gene_name"],
  geneInclusionMinimumPositiveCellCount: 2,
  v2aMarkerPanel: ["Vsx2", "Sox14", "Shox2", "Lhx3", "Lhx4"],
  v2aMarkerPositiveBarcodeCount: 942,
  v2aMarkerPositivePercentage: 99.262,
  slc17a6PositiveBarcodeCount: 862,
  slc17a6PositivePercentage: 90.832,
});

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function roundedPercentage(numerator, denominator) {
  return Number(((numerator / denominator) * 100).toFixed(3));
}

function isNonnegativeIntegerToken(value) {
  if (value.length === 0) return false;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 48 || code > 57) return false;
  }
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0;
}

export function parseCsvRow(line, rowNumber = "unknown") {
  const fields = [];
  let field = "";
  let quoted = false;
  let quoteClosed = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (quoted) {
      if (character === '"') {
        if (line[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
          quoteClosed = true;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === ",") {
      fields.push(field);
      field = "";
      quoteClosed = false;
    } else if (character === '"') {
      check(field.length === 0 && !quoteClosed, `CSV row ${rowNumber} has a quote in an unquoted field`);
      quoted = true;
    } else {
      check(!quoteClosed, `CSV row ${rowNumber} has characters after a closing quote`);
      field += character;
    }
  }

  check(!quoted, `CSV row ${rowNumber} has an unterminated quoted field`);
  fields.push(field);
  return fields;
}

export function parseHayashiCountMatrixCsv(uncompressedBytes) {
  check(Buffer.isBuffer(uncompressedBytes) || uncompressedBytes instanceof Uint8Array, "uncompressed matrix must be bytes");
  const bytes = Buffer.from(uncompressedBytes);
  check(
    bytes.byteLength === HAYASHI_SOURCE_MATRIX_RECEIPT.uncompressedBytes,
    `uncompressed matrix byte count changed: expected ${HAYASHI_SOURCE_MATRIX_RECEIPT.uncompressedBytes}, received ${bytes.byteLength}`,
  );

  const text = bytes.toString("utf8");
  check(Buffer.from(text, "utf8").equals(bytes), "uncompressed matrix is not valid UTF-8");
  const lines = text.split(/\r?\n/);
  if (lines.at(-1) === "") lines.pop();
  check(!lines.some((line) => line.length === 0), "count matrix contains an empty CSV row");
  check(
    lines.length === HAYASHI_SOURCE_MATRIX_RECEIPT.geneRowCount + 1,
    `count matrix row count changed: expected ${HAYASHI_SOURCE_MATRIX_RECEIPT.geneRowCount + 1} including header, received ${lines.length}`,
  );

  const header = parseCsvRow(lines[0], 1);
  const expectedWidth = HAYASHI_SOURCE_MATRIX_RECEIPT.cellBarcodeColumnCount + 1;
  check(header.length === expectedWidth, `CSV header width changed: expected ${expectedWidth}, received ${header.length}`);
  check(header[0] === "gene_name", "CSV metadata header must remain gene_name");
  const barcodes = header.slice(1);
  check(barcodes.every((barcode) => barcode.length > 0), "cell barcode columns must be non-empty");
  check(new Set(barcodes).size === HAYASHI_SOURCE_MATRIX_RECEIPT.cellBarcodeColumnCount, "cell barcode columns must contain exactly 949 unique barcodes");

  const geneNames = new Set();
  const v2aMarkerNames = new Set(HAYASHI_SOURCE_MATRIX_RECEIPT.v2aMarkerPanel);
  const requiredReanalysisGenes = new Set([...v2aMarkerNames, "Slc17a6"]);
  const observedReanalysisGenes = new Set();
  const v2aPositiveBarcodes = new Uint8Array(HAYASHI_SOURCE_MATRIX_RECEIPT.cellBarcodeColumnCount);
  const slc17a6PositiveBarcodes = new Uint8Array(HAYASHI_SOURCE_MATRIX_RECEIPT.cellBarcodeColumnCount);
  let countValueCount = 0;

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const rowNumber = lineIndex + 1;
    const row = parseCsvRow(lines[lineIndex], rowNumber);
    check(row.length === expectedWidth, `CSV row ${rowNumber} width changed: expected ${expectedWidth}, received ${row.length}`);
    const geneName = row[0];
    check(geneName.length > 0, `CSV row ${rowNumber} has an empty gene name`);
    check(!geneNames.has(geneName), `count matrix gene names must be unique; duplicate ${geneName}`);
    geneNames.add(geneName);

    const isV2aMarker = v2aMarkerNames.has(geneName);
    const isSlc17a6 = geneName === "Slc17a6";
    if (isV2aMarker || isSlc17a6) observedReanalysisGenes.add(geneName);
    let positiveCellCount = 0;

    for (let columnIndex = 1; columnIndex < row.length; columnIndex += 1) {
      const countToken = row[columnIndex];
      check(
        isNonnegativeIntegerToken(countToken),
        `CSV row ${rowNumber}, column ${columnIndex + 1} is not a nonnegative integer count`,
      );
      const count = Number(countToken);
      if (count > 0) {
        positiveCellCount += 1;
        if (isV2aMarker) v2aPositiveBarcodes[columnIndex - 1] = 1;
        if (isSlc17a6) slc17a6PositiveBarcodes[columnIndex - 1] = 1;
      }
      countValueCount += 1;
    }
    check(
      positiveCellCount >= HAYASHI_SOURCE_MATRIX_RECEIPT.geneInclusionMinimumPositiveCellCount,
      `${geneName} violates the source gene-inclusion rule of detection in at least two cells`,
    );
  }

  check(geneNames.size === HAYASHI_SOURCE_MATRIX_RECEIPT.geneRowCount, "count matrix must contain exactly 12,986 unique genes");
  check(
    [...requiredReanalysisGenes].every((gene) => observedReanalysisGenes.has(gene)),
    "count matrix is missing one or more required V2a/Slc17a6 reanalysis genes",
  );

  const v2aMarkerPositiveBarcodeCount = v2aPositiveBarcodes.reduce((total, value) => total + value, 0);
  const slc17a6PositiveBarcodeCount = slc17a6PositiveBarcodes.reduce((total, value) => total + value, 0);
  const v2aMarkerPositivePercentage = roundedPercentage(v2aMarkerPositiveBarcodeCount, barcodes.length);
  const slc17a6PositivePercentage = roundedPercentage(slc17a6PositiveBarcodeCount, barcodes.length);

  check(
    v2aMarkerPositiveBarcodeCount === HAYASHI_SOURCE_MATRIX_RECEIPT.v2aMarkerPositiveBarcodeCount,
    `raw matrix V2a-marker-positive count changed: expected 942, received ${v2aMarkerPositiveBarcodeCount}`,
  );
  check(
    v2aMarkerPositivePercentage === HAYASHI_SOURCE_MATRIX_RECEIPT.v2aMarkerPositivePercentage,
    `raw matrix V2a-marker-positive percentage changed: expected 99.262, received ${v2aMarkerPositivePercentage}`,
  );
  check(
    slc17a6PositiveBarcodeCount === HAYASHI_SOURCE_MATRIX_RECEIPT.slc17a6PositiveBarcodeCount,
    `raw matrix Slc17a6-positive count changed: expected 862, received ${slc17a6PositiveBarcodeCount}`,
  );
  check(
    slc17a6PositivePercentage === HAYASHI_SOURCE_MATRIX_RECEIPT.slc17a6PositivePercentage,
    `raw matrix Slc17a6-positive percentage changed: expected 90.832, received ${slc17a6PositivePercentage}`,
  );

  return {
    uncompressedBytes: bytes.byteLength,
    csvRowWidth: expectedWidth,
    metadataColumnCount: 1,
    geneRowCount: geneNames.size,
    cellBarcodeColumnCount: barcodes.length,
    countValueCount,
    minimumPositiveCellCountPerRetainedGene: HAYASHI_SOURCE_MATRIX_RECEIPT.geneInclusionMinimumPositiveCellCount,
    v2aMarkerPositiveBarcodeCount,
    v2aMarkerPositivePercentage,
    slc17a6PositiveBarcodeCount,
    slc17a6PositivePercentage,
  };
}

export async function auditHayashiSourceGzip(sourceGzipPath) {
  check(typeof sourceGzipPath === "string" && sourceGzipPath.length > 0, "--source-gzip requires a path");
  const resolvedPath = resolve(sourceGzipPath);
  const compressed = await readFile(resolvedPath);
  check(
    compressed.byteLength === HAYASHI_SOURCE_MATRIX_RECEIPT.compressedBytes,
    `compressed source byte count changed: expected ${HAYASHI_SOURCE_MATRIX_RECEIPT.compressedBytes}, received ${compressed.byteLength}`,
  );
  const compressedSha256 = sha256(compressed);
  check(
    compressedSha256 === HAYASHI_SOURCE_MATRIX_RECEIPT.compressedSha256,
    `compressed source SHA-256 changed: expected ${HAYASHI_SOURCE_MATRIX_RECEIPT.compressedSha256}, received ${compressedSha256}`,
  );

  let uncompressed;
  try {
    uncompressed = gunzipSync(compressed);
  } catch (error) {
    throw new Error(`source gzip could not be decompressed: ${error instanceof Error ? error.message : error}`);
  }
  const uncompressedSha256 = sha256(uncompressed);
  check(
    uncompressedSha256 === HAYASHI_SOURCE_MATRIX_RECEIPT.uncompressedSha256,
    `uncompressed source SHA-256 changed: expected ${HAYASHI_SOURCE_MATRIX_RECEIPT.uncompressedSha256}, received ${uncompressedSha256}`,
  );
  const matrix = parseHayashiCountMatrixCsv(uncompressed);
  return {
    fileName: basename(resolvedPath),
    sourcePath: resolvedPath,
    compressedBytes: compressed.byteLength,
    compressedSha256,
    uncompressedSha256,
    ...matrix,
  };
}

async function readCanonicalTaxonomy() {
  const bytes = await readFile(CANONICAL_DATA_PATH);
  const observedSha256 = sha256(bytes);
  check(
    observedSha256 === CANONICAL_DATA_SHA256,
    `canonical Hayashi taxonomy SHA-256 changed without a builder version update: expected ${CANONICAL_DATA_SHA256}, received ${observedSha256}`,
  );
  const taxonomy = JSON.parse(bytes.toString("utf8"));
  await validateHayashiV2aSourceTaxonomy(taxonomy);
  check(Buffer.from(stableJson(taxonomy), "utf8").equals(bytes), "canonical taxonomy is not in deterministic two-space JSON form");
  return taxonomy;
}

export async function buildHayashiV2aTaxonomy({ sourceGzipPath = null } = {}) {
  if (sourceGzipPath !== null) await auditHayashiSourceGzip(sourceGzipPath);
  return readCanonicalTaxonomy();
}

export async function writeHayashiV2aTaxonomy({ outputPath = DEFAULT_OUTPUT_PATH, sourceGzipPath = null } = {}) {
  const resolvedOutputPath = resolve(outputPath);
  const [taxonomy, sourceAudit] = await Promise.all([
    readCanonicalTaxonomy(),
    sourceGzipPath === null ? Promise.resolve(null) : auditHayashiSourceGzip(sourceGzipPath),
  ]);
  const serialized = stableJson(taxonomy);
  await mkdir(dirname(resolvedOutputPath), { recursive: true });
  await writeFile(resolvedOutputPath, serialized, "utf8");
  return {
    taxonomy,
    sourceAudit,
    outputPath: resolvedOutputPath,
    outputBytes: Buffer.byteLength(serialized),
    outputSha256: sha256(Buffer.from(serialized, "utf8")),
  };
}

function readPathArgument(argv, index, name) {
  const value = argv[index + 1];
  check(value && !value.startsWith("--"), `${name} requires a path`);
  return value;
}

function parseArguments(argv) {
  let outputPath = DEFAULT_OUTPUT_PATH;
  let sourceGzipPath = null;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--output") {
      outputPath = readPathArgument(argv, index, "--output");
      index += 1;
    } else if (argument.startsWith("--output=")) {
      outputPath = argument.slice("--output=".length);
      check(outputPath.length > 0, "--output requires a path");
    } else if (argument === "--source-gzip") {
      sourceGzipPath = readPathArgument(argv, index, "--source-gzip");
      index += 1;
    } else if (argument.startsWith("--source-gzip=")) {
      sourceGzipPath = argument.slice("--source-gzip=".length);
      check(sourceGzipPath.length > 0, "--source-gzip requires a path");
    } else if (argument === "--help" || argument === "-h") {
      return { help: true, outputPath, sourceGzipPath };
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  return { help: false, outputPath, sourceGzipPath };
}

const invokedAsMain = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href === import.meta.url
  : false;

if (invokedAsMain) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      console.log("Usage: node tools/build_hayashi_v2a_taxonomy.mjs [--output PATH] [--source-gzip PATH]");
    } else {
      const result = await writeHayashiV2aTaxonomy(options);
      const auditSummary = result.sourceAudit
        ? `; audited ${result.sourceAudit.geneRowCount} genes x ${result.sourceAudit.cellBarcodeColumnCount} unique barcodes, `
          + `${result.sourceAudit.v2aMarkerPositiveBarcodeCount}/949 V2a-marker positive and `
          + `${result.sourceAudit.slc17a6PositiveBarcodeCount}/949 Slc17a6 positive`
        : "";
      console.log(
        `Built ${result.outputPath} (${result.outputBytes} bytes; SHA-256 ${result.outputSha256}${auditSummary})`,
      );
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
