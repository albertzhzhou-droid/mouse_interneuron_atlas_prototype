#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gunzipSync } from "node:zlib";
import { validateDmrt3Di6SourceTaxonomy } from "../scripts/validate-dmrt3-di6-source-taxonomy-0.1.mjs";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CANONICAL_DATA_PATH = resolve(PROJECT_ROOT, "data/dmrt3-di6-source-taxonomy-0.1.json");
const DEFAULT_OUTPUT_PATH = CANONICAL_DATA_PATH;

const CANONICAL_DATA_SHA256 = "e5d7b26df781033a971282b697684cf6f71daa2fe711883475723186c2d92468";

export const DMRT3_DI6_SOURCE_RECEIPTS = Object.freeze({
  geoGzip: Object.freeze({
    fileName: "GSE185731_mmusculus.loom.gz",
    bytes: 47641669,
    md5: "1b2a877ffd70afbc75efc21ed2de8303",
    sha256: "f31abb7678ed88af3e140ca488dfdce867809569784bc1881777462fdc87b23c",
  }),
  loom: Object.freeze({
    fileName: "GSE185731_mmusculus.loom",
    repositoryPath: "Analysis_pipeline/data/mmusculus.loom",
    bytes: 56090164,
    md5: "8f5fa6d548f8f776e02a7777678e34f9",
    sha256: "ccf345c05ceb27f9075a5add155cf70c162a0f8a70a9b6860bfb7b45bc03997f",
    gitBlobSha1: "05263c67a113ad14ba178f1385d4e548ab9fce0e",
  }),
  notebook: Object.freeze({
    fileName: "210909_Final_run.ipynb",
    repositoryPath: "Analysis_pipeline/210909_Final_run.ipynb",
    bytes: 21627568,
    md5: "b57f43d03fc4f4a2db4f21ea78aabb26",
    sha256: "c51fa89ea3ce7f55a361ffe8b94f48b73bd9669c4260aeb3ee482208f23a9008",
    gitBlobSha1: "bf219e6dc49c18e67acd96573e01e8cce5cc3ff8",
    nbformat: 4,
    nbformatMinor: 4,
    cellCount: 207,
  }),
});

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function digest(algorithm, bytes) {
  return createHash(algorithm).update(bytes).digest("hex");
}

function gitBlobSha1(bytes) {
  return createHash("sha1")
    .update(Buffer.from(`blob ${bytes.byteLength}\0`, "utf8"))
    .update(bytes)
    .digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function verifyReceipt(bytes, receipt, label, { verifyGitBlob = false } = {}) {
  check(bytes.byteLength === receipt.bytes, `${label} byte count changed: expected ${receipt.bytes}, received ${bytes.byteLength}`);
  const observedMd5 = digest("md5", bytes);
  check(observedMd5 === receipt.md5, `${label} MD5 changed: expected ${receipt.md5}, received ${observedMd5}`);
  const observedSha256 = digest("sha256", bytes);
  check(observedSha256 === receipt.sha256, `${label} SHA-256 changed: expected ${receipt.sha256}, received ${observedSha256}`);
  const observedGitBlobSha1 = verifyGitBlob ? gitBlobSha1(bytes) : null;
  if (verifyGitBlob) {
    check(
      observedGitBlobSha1 === receipt.gitBlobSha1,
      `${label} Git blob SHA-1 changed: expected ${receipt.gitBlobSha1}, received ${observedGitBlobSha1}`,
    );
  }
  return { bytes: bytes.byteLength, md5: observedMd5, sha256: observedSha256, gitBlobSha1: observedGitBlobSha1 };
}

function inspectLoomBytes(bytes, label = "loom") {
  const expectedHdf5Signature = Buffer.from([0x89, 0x48, 0x44, 0x46, 0x0d, 0x0a, 0x1a, 0x0a]);
  check(bytes.subarray(0, 8).equals(expectedHdf5Signature), `${label} does not have the HDF5 signature required for a loom object`);
  return verifyReceipt(bytes, DMRT3_DI6_SOURCE_RECEIPTS.loom, label, { verifyGitBlob: true });
}

export async function auditDmrt3SourceGzip(sourceGzipPath) {
  check(typeof sourceGzipPath === "string" && sourceGzipPath.length > 0, "--source-gzip requires a path");
  const resolvedPath = resolve(sourceGzipPath);
  const compressed = await readFile(resolvedPath);
  const compressedReceipt = verifyReceipt(compressed, DMRT3_DI6_SOURCE_RECEIPTS.geoGzip, "GEO gzip");
  let uncompressed;
  try {
    uncompressed = gunzipSync(compressed);
  } catch (error) {
    throw new Error(`GEO gzip could not be decompressed: ${error instanceof Error ? error.message : error}`);
  }
  const loomReceipt = inspectLoomBytes(uncompressed, "decompressed loom");
  return {
    sourcePath: resolvedPath,
    fileName: basename(resolvedPath),
    compressed: compressedReceipt,
    decompressedLoom: loomReceipt,
  };
}

export async function auditDmrt3SourceLoom(sourceLoomPath) {
  check(typeof sourceLoomPath === "string" && sourceLoomPath.length > 0, "--source-loom requires a path");
  const resolvedPath = resolve(sourceLoomPath);
  const bytes = await readFile(resolvedPath);
  return {
    sourcePath: resolvedPath,
    fileName: basename(resolvedPath),
    ...inspectLoomBytes(bytes, "source loom"),
  };
}

export async function auditDmrt3Notebook(notebookPath) {
  check(typeof notebookPath === "string" && notebookPath.length > 0, "--notebook requires a path");
  const resolvedPath = resolve(notebookPath);
  const bytes = await readFile(resolvedPath);
  const receipt = verifyReceipt(bytes, DMRT3_DI6_SOURCE_RECEIPTS.notebook, "pinned notebook", { verifyGitBlob: true });
  let notebook;
  try {
    notebook = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`pinned notebook is not valid JSON: ${error instanceof Error ? error.message : error}`);
  }
  check(notebook.nbformat === DMRT3_DI6_SOURCE_RECEIPTS.notebook.nbformat, "pinned notebook nbformat changed");
  check(notebook.nbformat_minor === DMRT3_DI6_SOURCE_RECEIPTS.notebook.nbformatMinor, "pinned notebook nbformat_minor changed");
  check(Array.isArray(notebook.cells) && notebook.cells.length === DMRT3_DI6_SOURCE_RECEIPTS.notebook.cellCount, "pinned notebook cell count changed");
  return {
    sourcePath: resolvedPath,
    fileName: basename(resolvedPath),
    ...receipt,
    nbformat: notebook.nbformat,
    nbformatMinor: notebook.nbformat_minor,
    cellCount: notebook.cells.length,
  };
}

async function readCanonicalTaxonomy() {
  const bytes = await readFile(CANONICAL_DATA_PATH);
  const observedSha256 = digest("sha256", bytes);
  check(
    observedSha256 === CANONICAL_DATA_SHA256,
    `canonical Dmrt3/dI6 taxonomy SHA-256 changed without a builder version update: expected ${CANONICAL_DATA_SHA256}, received ${observedSha256}`,
  );
  const taxonomy = JSON.parse(bytes.toString("utf8"));
  await validateDmrt3Di6SourceTaxonomy(taxonomy);
  check(Buffer.from(stableJson(taxonomy), "utf8").equals(bytes), "canonical Dmrt3/dI6 taxonomy is not deterministic two-space JSON");
  return taxonomy;
}

export async function buildDmrt3Di6SourceTaxonomy({ sourceGzipPath = null, sourceLoomPath = null, notebookPath = null } = {}) {
  const [, taxonomy] = await Promise.all([
    Promise.all([
      sourceGzipPath === null ? null : auditDmrt3SourceGzip(sourceGzipPath),
      sourceLoomPath === null ? null : auditDmrt3SourceLoom(sourceLoomPath),
      notebookPath === null ? null : auditDmrt3Notebook(notebookPath),
    ]),
    readCanonicalTaxonomy(),
  ]);
  return taxonomy;
}

export async function writeDmrt3Di6SourceTaxonomy({
  outputPath = DEFAULT_OUTPUT_PATH,
  sourceGzipPath = null,
  sourceLoomPath = null,
  notebookPath = null,
} = {}) {
  const resolvedOutputPath = resolve(outputPath);
  const [taxonomy, sourceGzipAudit, sourceLoomAudit, notebookAudit] = await Promise.all([
    readCanonicalTaxonomy(),
    sourceGzipPath === null ? null : auditDmrt3SourceGzip(sourceGzipPath),
    sourceLoomPath === null ? null : auditDmrt3SourceLoom(sourceLoomPath),
    notebookPath === null ? null : auditDmrt3Notebook(notebookPath),
  ]);
  const serialized = stableJson(taxonomy);
  await mkdir(dirname(resolvedOutputPath), { recursive: true });
  await writeFile(resolvedOutputPath, serialized, "utf8");
  return {
    taxonomy,
    sourceGzipAudit,
    sourceLoomAudit,
    notebookAudit,
    outputPath: resolvedOutputPath,
    outputBytes: Buffer.byteLength(serialized),
    outputSha256: digest("sha256", Buffer.from(serialized, "utf8")),
  };
}

function readPathArgument(argv, index, optionName) {
  const value = argv[index + 1];
  check(value && !value.startsWith("--"), `${optionName} requires a path`);
  return value;
}

function parseArguments(argv) {
  const options = { outputPath: DEFAULT_OUTPUT_PATH, sourceGzipPath: null, sourceLoomPath: null, notebookPath: null };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const optionMap = [
      ["--output", "outputPath"],
      ["--source-gzip", "sourceGzipPath"],
      ["--source-loom", "sourceLoomPath"],
      ["--notebook", "notebookPath"],
    ];
    const exact = optionMap.find(([name]) => argument === name);
    const assigned = optionMap.find(([name]) => argument.startsWith(`${name}=`));
    if (exact) {
      options[exact[1]] = readPathArgument(argv, index, exact[0]);
      index += 1;
    } else if (assigned) {
      const value = argument.slice(assigned[0].length + 1);
      check(value.length > 0, `${assigned[0]} requires a path`);
      options[assigned[1]] = value;
    } else if (argument === "--help" || argument === "-h") {
      return { ...options, help: true };
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  return { ...options, help: false };
}

const invokedAsMain = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href === import.meta.url : false;

if (invokedAsMain) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      console.log("Usage: node tools/build_dmrt3_di6_source_taxonomy.mjs [--output PATH] [--source-gzip PATH] [--source-loom PATH] [--notebook PATH]");
    } else {
      const result = await writeDmrt3Di6SourceTaxonomy(options);
      console.log(`Built ${result.outputPath} (${result.outputBytes} bytes; SHA-256 ${result.outputSha256})`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
