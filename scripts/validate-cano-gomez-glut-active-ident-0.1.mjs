#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { gunzipSync } from "node:zlib";
import Ajv2020 from "ajv/dist/2020.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const CANO_GLUT_DATA_PATH = "data/cano-gomez-glut-active-ident-labels-0.1.json";
const SCHEMA_PATH = "schemas/cano-gomez-glut-active-ident-labels-0.1.schema.json";
const INPUTS = [
  "data/source-extractions/cano-gomez-p56/GSE318731_P56_glutamatergic_multiome_UPDATE.active-ident-observation.json",
  "data/source-extractions/cano-gomez-p56/GSE318731_P56_glutamatergic_multiome_UPDATE.audit.json",
  "data/source-extractions/cano-gomez-p56/GSE318731_P56_glutamatergic_multiome_UPDATE.metadata.csv.gz",
];
export const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const hashValues = (values) => sha256(JSON.stringify(values));
const compare = (a, b) => a === null ? b === null ? 0 : -1 : b === null ? 1 : Buffer.from(a).compare(Buffer.from(b));
const check = (condition, message) => { if (!condition) throw new Error(`Cano GLUT source-label validation: ${message}`); };
const equal = (observed, expected, message) => check(isDeepStrictEqual(observed, expected), message);
const labelId = (label) => `cano.glut.active-ident.sha256.${sha256(label).slice(0, 24)}`;
function counts(values) {
  const countMap = new Map();
  for (const value of values) countMap.set(value, (countMap.get(value) ?? 0) + 1);
  return [...countMap].sort(([a], [b]) => compare(a, b)).map(([value, count]) => ({ value, count }));
}

// Preserve quoted literal "NA", empty strings and unquoted source NA distinctly.
function metadataRows(text) {
  const rows = [];
  let row = [], field = "", quoted = false, inQuotes = false, closed = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (char === '"') { inQuotes = false; closed = true; }
      else field += char;
    } else if (char === "," || char === "\n") {
      check(quoted ? closed : field === "NA", "invalid lossless metadata field");
      row.push(quoted ? field : null);
      field = ""; quoted = false; closed = false;
      if (char === "\n") { rows.push(row); row = []; }
    } else if (char === '"' && field === "" && !closed) {
      quoted = true; inQuotes = true;
    } else {
      check(!closed && !quoted, "unexpected bytes after quoted metadata field");
      field += char;
    }
  }
  check(!field && !row.length && !inQuotes && text.endsWith("\n"), "incomplete metadata CSV");
  equal(rows.shift(), ["nucleus_id", "transmitter_class", "group", "neuron_type", "source", "anatomy", "sex"], "retained metadata header changed");
  return rows;
}

export async function validateCanoGlutActiveIdent(document, options = {}) {
  const schema = JSON.parse(await readFile(resolve(ROOT, SCHEMA_PATH), "utf8"));
  const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
  check(validate(document), `schema failed: ${JSON.stringify(validate.errors)}`);
  equal(document.reproduction.inputs.map((input) => input.path), INPUTS, "exact retained input paths changed");
  const inputs = await Promise.all(INPUTS.map((path) => readFile(resolve(ROOT, path))));
  for (let i = 0; i < inputs.length; i += 1) {
    check(inputs[i].length === document.reproduction.inputs[i].bytes && sha256(inputs[i]) === document.reproduction.inputs[i].sha256, `retained input checksum changed: ${INPUTS[i]}`);
  }
  const observation = JSON.parse(inputs[0]);
  const sourceAudit = JSON.parse(inputs[1]);
  check(observation.sourceSha256 === document.source.sha256 && sourceAudit.sourceSha256 === document.source.sha256, "source checksum differs from independent extraction/observation receipts");
  check(observation.observation.slotNamesExactlyEqualMetadataRowNamesInOrder === true && observation.observation.observedDistinctNonmissingLabelCount === 277 && observation.observation.factorLevelCount === 277 && observation.observation.unobservedFactorLevelCount === 0, "source observation does not support named order and exact label denominator");
  check(observation.observation.metadataNeuronTypesColumnPresent === false && sourceAudit.metadataFields.neuron_types.sourceColumnPresent === false, "source metadata neuron_types absence changed");
  check(sha256(inputs[2]) === sourceAudit.output.metadataCsvGzip.compressedSha256, "retained metadata differs from extraction receipt");
  const builder = await readFile(resolve(ROOT, document.reproduction.builderPath));
  check(sha256(builder) === document.reproduction.builderSha256, "builder script differs from extraction receipt");
  const rProgram = builder.toString("utf8").match(/R_PROGRAM = r'''([\s\S]*?)'''/)?.[1];
  check(typeof rProgram === "string" && sha256(rProgram) === document.reproduction.baseRProgramSha256, "base-R program receipt changed");
  const compressed = options.rosterBytes ?? await readFile(resolve(ROOT, document.artifact.path));
  check(compressed.length === document.artifact.compressedBytes && sha256(compressed) === document.artifact.compressedSha256, "assignment roster compressed checksum/size changed");
  const plain = gunzipSync(compressed);
  check(plain.length === document.artifact.uncompressedBytes && sha256(plain) === document.artifact.uncompressedSha256, "assignment roster uncompressed checksum/size changed");
  const text = plain.toString("utf8");
  check(text.endsWith("\n"), "assignment roster lacks final newline");
  const rows = text.trimEnd().split("\n").map((line) => JSON.parse(line));
  const retained = metadataRows(gunzipSync(inputs[2]).toString("utf8"));
  check(rows.length === 92782 && retained.length === rows.length, "assignment row denominator changed");
  const names = new Set();
  const grouped = new Map();
  const rowFields = ["source_nucleus_id", "source_active_ident", "groups", "source", "anatomy", "Sex", "metadata_neuron_types", "source_accession", "source_file_name", "compound_nucleus_key", "source_label_id"].sort();
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i], metadata = retained[i];
    equal(Object.keys(row).sort(), rowFields, `assignment row field contract changed at ${i}`);
    check(typeof row.source_nucleus_id === "string" && row.source_nucleus_id !== "" && !row.source_nucleus_id.includes("|") && !names.has(row.source_nucleus_id), `duplicate/invalid source name at ${i}`);
    names.add(row.source_nucleus_id);
    check(row.source_nucleus_id === metadata[0], `source name/order differs from retained metadata at ${i}`);
    check(row.source_accession === "GSE318731" && row.source_file_name === document.source.fileName && row.compound_nucleus_key === `GSE318731|${document.source.fileName}|${row.source_nucleus_id}`, `source identity namespace changed at ${i}`);
    check(typeof row.source_active_ident === "string" && row.source_active_ident.length > 0 && row.source_label_id === labelId(row.source_active_ident), `raw active.ident label/ID changed at ${i}`);
    check(row.metadata_neuron_types === null && metadata[3] === null, `absent metadata neuron_types was substituted at ${i}`);
    equal([row.groups, row.source, row.anatomy, row.Sex], [metadata[2], metadata[4], metadata[5], metadata[6]], `source groups/context differ from retained metadata at ${i}`);
    if (!grouped.has(row.source_active_ident)) grouped.set(row.source_active_ident, []);
    grouped.get(row.source_active_ident).push(row);
  }
  check(names.size === 92782 && grouped.size === 277, "unique source names/labels changed");
  check(hashValues(rows.map((row) => row.source_nucleus_id)) === document.identity.orderedSourceNucleusNamesSha256, "ordered source-name hash changed");
  check(hashValues(rows.map((row) => row.source_active_ident)) === document.identity.orderedSourceActiveIdentLabelsSha256, "ordered source-label hash changed");
  const groupCounts = counts(rows.map((row) => row.groups));
  equal(document.groupCounts, groupCounts, "global group counts changed");
  check(groupCounts.length === 28, "source group denominator changed");
  const expectedLabels = [...grouped].sort(([a], [b]) => compare(a, b)).map(([rawLabel, labelRows]) => ({
    id: labelId(rawLabel), rawLabel, nucleusCount: labelRows.length,
    groupCounts: counts(labelRows.map((row) => row.groups)),
    contextCounts: Object.fromEntries(["source", "anatomy", "Sex"].map((field) => [field, counts(labelRows.map((row) => row[field]))])),
    orderedCompoundNucleusKeysSha256: hashValues(labelRows.map((row) => row.compound_nucleus_key)),
    metadataNeuronTypesMissingCount: labelRows.length,
  }));
  equal(document.labels, expectedLabels, "label counts/groups/context/exact-key receipts differ from roster");
  for (const field of ["source", "anatomy", "Sex"]) equal(document.contextCounts[field], counts(rows.map((row) => row[field])), `global ${field} context counts changed`);
  check(/277 raw labels.*projection\/local interneuron status remains unresolved/.test(document.boundaries.displayScope) && /11-profile CHOL_IN/.test(document.boundaries.displayScope), "display scope loses source-label/interneuron separation");
  check(/private research repository/.test(document.boundaries.rights) && /RDS remains link-only/.test(document.boundaries.rights), "rights boundary changed");
  return { adapterId: document.adapterId, labels: grouped.size, nuclei: rows.length, sourceGroups: groupCounts.length, confirmedInterneuronProfilesAdded: 0, metadataNeuronTypesMissing: rows.length, artifactsVerified: 1 };
}

export async function validateCanoGlutActiveIdentPackage(path = CANO_GLUT_DATA_PATH) {
  return validateCanoGlutActiveIdent(JSON.parse(await readFile(resolve(ROOT, path), "utf8")));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  validateCanoGlutActiveIdentPackage(process.argv[2]).then((report) => process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)).catch((error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
}
