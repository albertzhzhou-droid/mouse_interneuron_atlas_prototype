#!/usr/bin/env node

// Fail-closed UPG-204 transformation. The stronger R/Seurat receipt path is
// selected when its combined receipt exists; otherwise the tool requires one
// complete, checksum-pinned set of Python/rdata or base-R-stream
// meta.data-row-only receipts. All three paths produce the same conservative
// assignment registry while preserving their distinct identity authority.

import { createHash } from "node:crypto";
import {
  createReadStream,
  createWriteStream,
  existsSync,
} from "node:fs";
import {
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { once } from "node:events";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { StringDecoder } from "node:string_decoder";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { createGunzip, createGzip, constants as zlibConstants } from "node:zlib";
import { pipeline } from "node:stream/promises";

import {
  CANO_GOMEZ_IMPORT_MIRROR_PATH,
  validateCanoGomezP56MultiomeInterneuronRegistry,
  validateCanoGomezP56MultiomeInterneuronRegistryPackage,
  validateCanoGomezRegistryImportMirror,
} from "../scripts/validate-cano-gomez-p56-multiome-interneuron-registry-0.1.mjs";

export const CANO_GOMEZ_ACCESSION = "GSE318731";
export const CANO_GOMEZ_COMPOUND_KEY_EXPRESSION =
  "GSE318731|exact source filename|row.name";
export const CANO_GOMEZ_RELEASE_DATE = "2026-09-02";
export const CANO_GOMEZ_REPORTED_TYPE_COUNT_NOT_USED_AS_INTERNEURON_DENOMINATOR =
  516;

export const CANO_GOMEZ_SOURCE_SPECS = Object.freeze([
  Object.freeze({
    objectId: "cholinergic",
    sourceFileName: "GSE318731_P56_cholinergic_multiome.rds",
    publicUrl:
      "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE318nnn/GSE318731/suppl/GSE318731_P56_cholinergic_multiome.rds",
    sourceBytes: 127862795,
    nucleusCount: 3199,
    groupCount: 5,
    rawMetadataFileName: "GSE318731_cholinergic_multiome.metadata.csv.gz",
    receiptFileName: "GSE318731_cholinergic_multiome.metadata.receipt.json",
    cleanRoomMetadataFileName:
      "GSE318731_P56_cholinergic_multiome.metadata.csv.gz",
    cleanRoomAuditFileName: "GSE318731_P56_cholinergic_multiome.audit.json",
    transmitterClass: "CHOL",
  }),
  Object.freeze({
    objectId: "gabaergic",
    sourceFileName: "GSE318731_P56_gabaergic_multiome.rds",
    publicUrl:
      "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE318nnn/GSE318731/suppl/GSE318731_P56_gabaergic_multiome.rds",
    sourceBytes: 1646402816,
    nucleusCount: 73364,
    groupCount: 24,
    rawMetadataFileName: "GSE318731_gabaergic_multiome.metadata.csv.gz",
    receiptFileName: "GSE318731_gabaergic_multiome.metadata.receipt.json",
    cleanRoomMetadataFileName: "GSE318731_P56_gabaergic_multiome.metadata.csv.gz",
    cleanRoomAuditFileName: "GSE318731_P56_gabaergic_multiome.audit.json",
    transmitterClass: "GABA",
  }),
  Object.freeze({
    objectId: "glutamatergic",
    sourceFileName: "GSE318731_P56_glutamatergic_multiome_UPDATE.rds",
    publicUrl:
      "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE318nnn/GSE318731/suppl/GSE318731_P56_glutamatergic_multiome_UPDATE.rds",
    sourceBytes: 1832005077,
    nucleusCount: 92782,
    groupCount: 28,
    rawMetadataFileName: "GSE318731_glutamatergic_multiome.metadata.csv.gz",
    receiptFileName: "GSE318731_glutamatergic_multiome.metadata.receipt.json",
    cleanRoomMetadataFileName:
      "GSE318731_P56_glutamatergic_multiome_UPDATE.metadata.csv.gz",
    cleanRoomAuditFileName:
      "GSE318731_P56_glutamatergic_multiome_UPDATE.audit.json",
    transmitterClass: "GLUT",
  }),
]);

export const CANO_GOMEZ_EXPECTED_TOTAL_NUCLEI = CANO_GOMEZ_SOURCE_SPECS.reduce(
  (total, source) => total + source.nucleusCount,
  0,
);
export const CANO_GOMEZ_EXPECTED_TOTAL_SOURCE_SCOPED_GROUPS =
  CANO_GOMEZ_SOURCE_SPECS.reduce(
    (total, source) => total + source.groupCount,
    0,
  );

export const CANO_GOMEZ_MOTOR_GROUPS = Object.freeze([
  "CHOL_aMN_Vipr2",
  "CHOL_vMN_Vwa5b1",
  "CHOL_gMN_Col27a1",
  "CHOL_gsMN_Prkcd",
]);

export const CANO_GOMEZ_DECISIONS = Object.freeze({
  CONFIRMED_INTERNEURON: "CONFIRMED_INTERNEURON",
  EXCLUDED_MOTOR: "EXCLUDED_MOTOR",
  EXCLUDED_SENSORY_SCOPE: "EXCLUDED_SENSORY_SCOPE",
  EXCLUDED_PROJECTION_LOCAL_STATUS_UNRESOLVED:
    "EXCLUDED_PROJECTION_LOCAL_STATUS_UNRESOLVED",
  EXCLUDED_AMBIGUOUS_OR_PROJECTION_EXCEPTION_UNRESOLVED:
    "EXCLUDED_AMBIGUOUS_OR_PROJECTION_EXCEPTION_UNRESOLVED",
});

export const CANO_GOMEZ_DECISION_REASONS = Object.freeze({
  SOURCE_EXPLICIT_CHOL_IN:
    "source_explicit_groups_equals_CHOL_IN",
  SOURCE_EXPLICIT_MOTOR_GROUP:
    "source_explicit_cholinergic_motor_group",
  SOURCE_EXPLICIT_CSF_CN_SENSORY_SCOPE:
    "source_explicit_GABA_CSF-cN_Pkd2l1_sensory_scope",
  GLUT_PROJECTION_LOCAL_STATUS_UNRESOLVED:
    "glutamatergic_projection_or_local_status_not_resolved_per_type",
  GABA_PROJECTION_EXCEPTION_UNRESOLVED:
    "gabaergic_class_not_used_as_categorical_interneuron_flag_and_projection_exceptions_remain",
});

const REQUIRED_ROSTER_PREFIX = Object.freeze([
  "source_accession",
  "source_file_name",
  "compound_nucleus_key",
  "source_nucleus_id",
  "source_active_assay",
  "source_active_ident",
]);
const REQUIRED_RAW_METADATA_COLUMNS = Object.freeze(["groups", "neuron_types"]);
const GLUT_SOURCE_WITHOUT_METADATA_TYPES_SHA256 =
  "ff3784791ccb5d23311b9d0a8e2a4bd09dd251f75d0a2fc4b30e762dcef29c92";
const APPENDED_AUDIT_COLUMNS = Object.freeze([
  "source_object_id",
  "identity_authority_mode",
  "cross_assay_cell_identity_verified",
  "scope_decision",
  "scope_decision_reason",
  "confirmed_interneuron_profile_id",
  "per_nucleus_non_neuronal_status",
  "geometry_object_count",
  "internal_structure_object_count",
  "same_cell_link_count",
]);
const CONTEXT_FIELDS = Object.freeze(["anatomy", "source", "Sex"]);
const CLEAN_ROOM_CONTRACT_RAW_FIELDS = Object.freeze([
  "groups",
  "neuron_types",
  "source",
  "anatomy",
  "Sex",
]);
const PRESERVED_SOURCE_COLUMN_VALUES = "PRESERVED_SOURCE_COLUMN_VALUES";
const ABSENT_SOURCE_COLUMN_TO_SOURCE_NA =
  "SOURCE_COLUMN_ABSENT_EMITTED_AS_SOURCE_NA";
const SOURCE_COLUMN_ABSENCE_REASON = "source_meta_data_column_absent";
const COMBINED_RECEIPT_FILE_NAME =
  "GSE318731_multiome_metadata.combined.receipt.json";
const AUDIT_FILE_NAME = "GSE318731_all_nucleus_assignment_audit.csv.gz";
const CONFIRMED_ROSTER_FILE_NAME =
  "GSE318731_confirmed_interneuron_nucleus_roster.csv.gz";
const REGISTRY_FILE_NAME =
  "cano-gomez-p56-multiome-interneuron-registry-0.1.json";
const NON_NEURONAL_STATUS =
  "SOURCE_LEVEL_PREPROCESSING_ONLY_NO_PER_NUCLEUS_FLAG";
const R_IDENTITY_AUTHORITY = "R_SEURAT_OBJECT_IDENTITY_VERIFIED";
const CLEAN_ROOM_IDENTITY_AUTHORITY = "PYTHON_RDATA_META_DATA_ROW_ONLY";
export const BASE_R_STREAM_IDENTITY_AUTHORITY =
  "BASE_R_STREAM_META_DATA_ROW_ONLY";
const CLEAN_ROOM_INPUT_HEADER = Object.freeze([
  "nucleus_id",
  "transmitter_class",
  "group",
  "neuron_type",
  "source",
  "anatomy",
  "sex",
]);
const CLEAN_ROOM_EXTRACTOR_URL = new URL(
  "./extract_cano_gomez_rds_metadata.py",
  import.meta.url,
);
const BASE_R_STREAM_TRANSPORT_URL = new URL(
  "./extract_cano_gomez_rds_metadata_stream.py",
  import.meta.url,
);
const BASE_R_STREAM_WORKER_URL = new URL(
  "./extract_cano_gomez_rds_metadata_stream.R",
  import.meta.url,
);
const CLEAN_ROOM_PATCHED_RDATA_PARSER_SHA256 =
  "52aa37ef301136240931dd0970f9891da127aa222bd84541239b774b19337aa5";
const CLEAN_ROOM_CANONICAL_HEADER = Object.freeze([
  ...REQUIRED_ROSTER_PREFIX,
  "groups",
  "neuron_types",
  "source",
  "anatomy",
  "Sex",
  "transmitter_class",
]);
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function jsonEqual(left, right) {
  // JSON object-member order carries no meaning. Arrays still preserve the
  // source order. Real Python receipts are emitted with sorted object keys.
  return isDeepStrictEqual(left, right);
}

function assertSha256(value, context) {
  check(
    typeof value === "string" && SHA256_PATTERN.test(value),
    `${context} must be a lowercase SHA-256 receipt`,
  );
}

function compareUtf8(left, right) {
  return Buffer.from(left, "utf8").compare(Buffer.from(right, "utf8"));
}

function sortedUnique(values) {
  return [...new Set(values)].sort(compareUtf8);
}

function increment(map, key, amount = 1) {
  map.set(key, (map.get(key) ?? 0) + amount);
}

function mapToCountRows(map) {
  return [...map.entries()]
    .sort(([left], [right]) => compareUtf8(left, right))
    .map(([value, count]) => ({ value, count }));
}

function countProfileValues(rows, field, sourceColumnPresent = undefined) {
  const counts = new Map();
  let missingCount = 0;
  let emptyCount = 0;
  for (const row of rows) {
    const value = row[field];
    if (value === null || value === undefined) {
      missingCount += 1;
    } else if (value === "") {
      emptyCount += 1;
    } else {
      increment(counts, value);
    }
  }
  return {
    field,
    status:
      sourceColumnPresent === undefined
        ? rows.some((row) => Object.hasOwn(row, field))
          ? "SOURCE_FIELD_PRESENT"
          : "SOURCE_FIELD_UNAVAILABLE"
        : sourceColumnPresent
          ? "SOURCE_FIELD_PRESENT"
          : "SOURCE_FIELD_UNAVAILABLE",
    missingCount,
    emptyCount,
    counts: mapToCountRows(counts),
  };
}

function sha256TextLines(values) {
  const hash = createHash("sha256");
  for (const value of values) hash.update(`${value}\n`, "utf8");
  return hash.digest("hex");
}

async function sha256File(filePath) {
  const hash = createHash("sha256");
  let bytes = 0;
  for await (const chunk of createReadStream(filePath)) {
    hash.update(chunk);
    bytes += chunk.length;
  }
  return { bytes, sha256: hash.digest("hex") };
}

function parseJson(text, context) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${context} is not valid JSON: ${error.message}`);
  }
}

async function readJson(filePath, context) {
  return parseJson(await readFile(filePath, "utf8"), context);
}

class CsvParser {
  constructor() {
    this.field = "";
    this.row = [];
    this.rows = [];
    this.inQuotedField = false;
    this.pendingQuotedQuote = false;
    this.afterClosingQuote = false;
    this.fieldWasQuoted = false;
    this.atFieldStart = true;
    this.pendingCarriageReturn = false;
    this.seenAnyCharacter = false;
  }

  finishField() {
    const value = this.fieldWasQuoted
      ? this.field
      : this.field === "NA"
        ? null
        : this.field;
    this.row.push(value);
    this.field = "";
    this.fieldWasQuoted = false;
    this.atFieldStart = true;
    this.afterClosingQuote = false;
  }

  finishRow() {
    this.finishField();
    this.rows.push(this.row);
    this.row = [];
  }

  processOutsideQuoted(character) {
    if (this.pendingCarriageReturn) {
      check(character === "\n", "CSV contains a bare carriage return");
      this.pendingCarriageReturn = false;
      return;
    }
    if (this.afterClosingQuote) {
      if (character === ",") {
        this.finishField();
        return;
      }
      if (character === "\n") {
        this.finishRow();
        return;
      }
      if (character === "\r") {
        this.finishRow();
        this.pendingCarriageReturn = true;
        return;
      }
      throw new Error("CSV has content after a closing quote");
    }
    if (this.atFieldStart && character === '"') {
      this.inQuotedField = true;
      this.fieldWasQuoted = true;
      this.atFieldStart = false;
      return;
    }
    if (character === ",") {
      this.finishField();
      return;
    }
    if (character === "\n") {
      this.finishRow();
      return;
    }
    if (character === "\r") {
      this.finishRow();
      this.pendingCarriageReturn = true;
      return;
    }
    check(character !== '"', "CSV contains a quote in an unquoted field");
    this.field += character;
    this.atFieldStart = false;
  }

  feed(text) {
    this.rows = [];
    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      this.seenAnyCharacter = true;
      if (this.pendingQuotedQuote) {
        this.pendingQuotedQuote = false;
        if (character === '"') {
          this.field += '"';
          continue;
        }
        this.inQuotedField = false;
        this.afterClosingQuote = true;
        this.processOutsideQuoted(character);
        continue;
      }
      if (this.inQuotedField) {
        if (character === '"') {
          if (index + 1 < text.length) {
            if (text[index + 1] === '"') {
              this.field += '"';
              index += 1;
            } else {
              this.inQuotedField = false;
              this.afterClosingQuote = true;
            }
          } else {
            this.pendingQuotedQuote = true;
          }
        } else {
          this.field += character;
        }
      } else {
        this.processOutsideQuoted(character);
      }
    }
    return this.rows;
  }

  finish() {
    this.rows = [];
    if (this.pendingQuotedQuote) {
      this.pendingQuotedQuote = false;
      this.inQuotedField = false;
      this.afterClosingQuote = true;
    }
    check(!this.inQuotedField, "CSV ends inside a quoted field");
    check(!this.pendingCarriageReturn, "CSV ends after a bare carriage return");
    if (
      this.seenAnyCharacter &&
      (this.row.length > 0 || this.field.length > 0 || this.fieldWasQuoted)
    ) {
      this.finishRow();
    }
    return this.rows;
  }
}

async function processGzipCsv(filePath, onRow) {
  const compressed = await sha256File(filePath);
  const parser = new CsvParser();
  const decoder = new StringDecoder("utf8");
  const hash = createHash("sha256");
  let uncompressedBytes = 0;
  const gunzip = createGunzip();
  createReadStream(filePath).pipe(gunzip);
  for await (const chunk of gunzip) {
    hash.update(chunk);
    uncompressedBytes += chunk.length;
    for (const row of parser.feed(decoder.write(chunk))) await onRow(row);
  }
  const tail = decoder.end();
  if (tail) {
    for (const row of parser.feed(tail)) await onRow(row);
  }
  for (const row of parser.finish()) await onRow(row);
  return {
    compressedBytes: compressed.bytes,
    compressedSha256: compressed.sha256,
    uncompressedBytes,
    uncompressedSha256: hash.digest("hex"),
  };
}

function encodeCsvValue(value) {
  if (value === null || value === undefined) return "NA";
  return `"${String(value).replaceAll('"', '""')}"`;
}

class CsvWriter {
  constructor(filePath, header) {
    this.filePath = filePath;
    this.header = header;
    this.rowCount = 0;
    this.stream = createWriteStream(filePath, { encoding: "utf8" });
    this.stream.write(`${header.map(encodeCsvValue).join(",")}\n`);
  }

  async write(row) {
    check(row.length === this.header.length, "output CSV row/header width mismatch");
    const accepted = this.stream.write(
      `${row.map(encodeCsvValue).join(",")}\n`,
    );
    this.rowCount += 1;
    if (!accepted) await once(this.stream, "drain");
  }

  async close() {
    this.stream.end();
    await once(this.stream, "finish");
  }
}

function exactFieldProfile(values) {
  const counts = new Map();
  let naCount = 0;
  let emptyStringCount = 0;
  let whitespaceOnlyCount = 0;
  for (const value of values) {
    if (value === null) {
      naCount += 1;
    } else {
      increment(counts, value);
      if (value === "") emptyStringCount += 1;
      else if (value.trim() === "") whitespaceOnlyCount += 1;
    }
  }
  return {
    rowCount: values.length,
    observedNonMissingCount: values.length - naCount,
    observedUniqueCount: counts.size,
    naCount,
    emptyStringCount,
    whitespaceOnlyCount,
    observedValueCounts: mapToCountRows(counts),
  };
}

function assertReceiptProfile(receiptProfile, derived, context) {
  check(receiptProfile?.row_count === derived.rowCount, `${context} row count changed`);
  check(
    receiptProfile?.observed_non_missing_count === derived.observedNonMissingCount,
    `${context} non-missing denominator changed`,
  );
  check(
    receiptProfile?.observed_unique_count === derived.observedUniqueCount,
    `${context} unique denominator changed`,
  );
  check(receiptProfile?.na_count === derived.naCount, `${context} NA denominator changed`);
  check(
    receiptProfile?.empty_string_count === derived.emptyStringCount,
    `${context} empty-string denominator changed`,
  );
  check(
    receiptProfile?.whitespace_only_count === derived.whitespaceOnlyCount,
    `${context} whitespace-only denominator changed`,
  );
  check(
    jsonEqual(receiptProfile?.observed_value_counts, derived.observedValueCounts),
    `${context} value-count receipt changed`,
  );
}

export function classifyCanoGomezAssignment({ objectId, groups }) {
  check(typeof groups === "string" && groups.length > 0, "raw groups must be a non-empty string");
  if (objectId === "cholinergic") {
    if (groups === "CHOL_IN") {
      return {
        decision: CANO_GOMEZ_DECISIONS.CONFIRMED_INTERNEURON,
        reason: CANO_GOMEZ_DECISION_REASONS.SOURCE_EXPLICIT_CHOL_IN,
      };
    }
    check(
      CANO_GOMEZ_MOTOR_GROUPS.includes(groups),
      `unrecognized cholinergic group: ${groups}`,
    );
    return {
      decision: CANO_GOMEZ_DECISIONS.EXCLUDED_MOTOR,
      reason: CANO_GOMEZ_DECISION_REASONS.SOURCE_EXPLICIT_MOTOR_GROUP,
    };
  }
  if (objectId === "gabaergic") {
    return groups === "GABA_CSF-cN_Pkd2l1"
      ? {
          decision: CANO_GOMEZ_DECISIONS.EXCLUDED_SENSORY_SCOPE,
          reason:
            CANO_GOMEZ_DECISION_REASONS.SOURCE_EXPLICIT_CSF_CN_SENSORY_SCOPE,
        }
      : {
          decision:
            CANO_GOMEZ_DECISIONS.EXCLUDED_AMBIGUOUS_OR_PROJECTION_EXCEPTION_UNRESOLVED,
          reason:
            CANO_GOMEZ_DECISION_REASONS.GABA_PROJECTION_EXCEPTION_UNRESOLVED,
        };
  }
  if (objectId === "glutamatergic") {
    return {
      decision:
        CANO_GOMEZ_DECISIONS.EXCLUDED_PROJECTION_LOCAL_STATUS_UNRESOLVED,
      reason:
        CANO_GOMEZ_DECISION_REASONS.GLUT_PROJECTION_LOCAL_STATUS_UNRESOLVED,
    };
  }
  throw new Error(`unrecognized source object: ${objectId}`);
}

export function stableCanoGomezProfileId(rawNeuronType) {
  check(
    typeof rawNeuronType === "string" && rawNeuronType.length > 0,
    "confirmed profile requires an exact non-empty raw neuron_types label",
  );
  const digest = createHash("sha256").update(rawNeuronType, "utf8").digest("hex");
  return `cano.gomez.p56.chol_in.sha256.${digest.slice(0, 24)}`;
}

function validateCombinedReceipt(combinedReceipt) {
  check(combinedReceipt?.format_version === "1.0.0", "combined receipt format version changed");
  check(
    combinedReceipt?.receipt_kind ===
      "cano_gomez_multiome_raw_metadata_combined_receipt",
    "combined receipt kind changed",
  );
  check(combinedReceipt?.accession === CANO_GOMEZ_ACCESSION, "combined accession changed");
  check(
    combinedReceipt?.compound_key_expression ===
      CANO_GOMEZ_COMPOUND_KEY_EXPRESSION,
    "compound-key expression changed",
  );
  check(
    combinedReceipt?.asserted_denominators?.total_nucleus_count ===
      CANO_GOMEZ_EXPECTED_TOTAL_NUCLEI,
    "combined nucleus denominator changed",
  );
  check(
    combinedReceipt?.asserted_denominators
      ?.total_source_scoped_group_count ===
      CANO_GOMEZ_EXPECTED_TOTAL_SOURCE_SCOPED_GROUPS,
    "combined source-scoped group denominator changed",
  );
  check(
    jsonEqual(combinedReceipt?.asserted_denominators?.nucleus_counts_by_source, {
      cholinergic: 3199,
      gabaergic: 73364,
      glutamatergic: 92782,
    }),
    "combined per-source nucleus denominators changed",
  );
  check(
    jsonEqual(combinedReceipt?.asserted_denominators?.group_counts_by_source, {
      cholinergic: 5,
      gabaergic: 24,
      glutamatergic: 28,
    }),
    "combined per-source group denominators changed",
  );
  check(
    combinedReceipt?.reported_type_denominator_reconciliation
      ?.reported_expected_unique_type_count ===
      CANO_GOMEZ_REPORTED_TYPE_COUNT_NOT_USED_AS_INTERNEURON_DENOMINATOR,
    "reported 516 reconciliation denominator changed",
  );
  check(
    combinedReceipt?.reported_type_denominator_reconciliation
      ?.hard_assertion_applied === false,
    "reported 516 count must not become a hard assertion",
  );
  check(
    combinedReceipt?.scope_boundaries?.raw_source_extraction_only === true &&
      combinedReceipt?.scope_boundaries?.raw_labels_preserved === true &&
      combinedReceipt?.scope_boundaries?.classification_inference_applied === false &&
      combinedReceipt?.scope_boundaries?.label_normalization_applied === false,
    "combined extraction boundaries changed",
  );
  check(
    Array.isArray(combinedReceipt?.source_objects) &&
      combinedReceipt.source_objects.length === CANO_GOMEZ_SOURCE_SPECS.length,
    "combined receipt must contain the three source objects",
  );
}

async function loadVerifiedReceipts(extractionDirectory) {
  const combinedPath = join(extractionDirectory, COMBINED_RECEIPT_FILE_NAME);
  check(existsSync(combinedPath), `missing combined receipt: ${combinedPath}`);
  const combinedFileReceipt = await sha256File(combinedPath);
  const combinedReceipt = await readJson(combinedPath, "combined source receipt");
  validateCombinedReceipt(combinedReceipt);

  const receipts = [];
  for (let index = 0; index < CANO_GOMEZ_SOURCE_SPECS.length; index += 1) {
    const spec = CANO_GOMEZ_SOURCE_SPECS[index];
    const summary = combinedReceipt.source_objects[index];
    check(summary?.object_id === spec.objectId, `${spec.objectId} combined object id changed`);
    check(
      summary?.source_file_name === spec.sourceFileName,
      `${spec.objectId} combined source filename changed`,
    );
    check(summary?.nucleus_count === spec.nucleusCount, `${spec.objectId} combined nucleus count changed`);
    check(summary?.group_count === spec.groupCount, `${spec.objectId} combined group count changed`);
    check(
      summary?.roster_file_name === spec.rawMetadataFileName,
      `${spec.objectId} combined roster filename changed`,
    );
    check(
      summary?.receipt_file_name === spec.receiptFileName,
      `${spec.objectId} combined receipt filename changed`,
    );
    assertSha256(summary?.roster_sha256, `${spec.objectId} roster`);
    assertSha256(summary?.receipt_sha256, `${spec.objectId} source receipt`);

    const receiptPath = join(extractionDirectory, spec.receiptFileName);
    const rosterPath = join(extractionDirectory, spec.rawMetadataFileName);
    check(existsSync(receiptPath), `missing ${spec.objectId} source receipt`);
    check(existsSync(rosterPath), `missing ${spec.objectId} raw metadata roster`);
    const receiptFile = await sha256File(receiptPath);
    check(
      receiptFile.sha256 === summary.receipt_sha256,
      `${spec.objectId} source receipt checksum mismatch`,
    );
    const receipt = await readJson(receiptPath, `${spec.objectId} source receipt`);
    validateSourceReceipt(spec, receipt, summary);
    receipts.push({ spec, summary, receipt, receiptPath, rosterPath });
  }
  return { combinedPath, combinedFileReceipt, combinedReceipt, receipts };
}

function validateSourceReceipt(spec, receipt, summary) {
  check(receipt?.format_version === "1.0.0", `${spec.objectId} receipt format version changed`);
  check(
    receipt?.receipt_kind === "cano_gomez_multiome_raw_metadata_source_receipt",
    `${spec.objectId} receipt kind changed`,
  );
  check(receipt?.accession === CANO_GOMEZ_ACCESSION, `${spec.objectId} accession changed`);
  check(receipt?.source?.file_name === spec.sourceFileName, `${spec.objectId} source filename changed`);
  check(receipt?.source?.public_url === spec.publicUrl, `${spec.objectId} public source URL changed`);
  check(
    receipt?.source?.expected_bytes === spec.sourceBytes &&
      receipt?.source?.observed_bytes === spec.sourceBytes,
    `${spec.objectId} source byte receipt changed`,
  );
  assertSha256(receipt?.source?.sha256, `${spec.objectId} source RDS`);
  check(receipt?.source_object?.object_id === spec.objectId, `${spec.objectId} source object changed`);
  check(
    receipt?.source_object?.expected_nucleus_count === spec.nucleusCount &&
      receipt?.source_object?.observed_nucleus_count === spec.nucleusCount,
    `${spec.objectId} source-object nucleus denominator changed`,
  );
  check(
    receipt?.source_object?.meta_data_row_names_nonempty === true &&
      receipt?.source_object?.meta_data_row_names_unique === true &&
      receipt?.source_object?.cells_match_meta_data_row_names_exactly === true &&
      receipt?.source_object?.object_colnames_match_meta_data_row_names_exactly === true &&
      receipt?.source_object?.active_ident_names_match_meta_data_row_names_exactly === true,
    `${spec.objectId} source identity/order verification is incomplete`,
  );
  assertSha256(
    receipt?.source_object?.ordered_row_names_sha256,
    `${spec.objectId} ordered row names`,
  );
  check(
    Array.isArray(receipt?.source_object?.assays) &&
      receipt.source_object.assays.length > 0 &&
      receipt.source_object.assays.every(
        (assay) =>
          typeof assay.assay_name === "string" &&
          assay.assay_name.length > 0 &&
          assay.cell_count === spec.nucleusCount &&
          assay.colnames_match_meta_data_row_names_exactly === true &&
          SHA256_PATTERN.test(assay.ordered_colnames_sha256),
      ),
    `${spec.objectId} assay identity receipts are incomplete`,
  );
  check(
    typeof receipt?.source_object?.active_assay === "string" &&
      receipt.source_object.active_assay.length > 0,
    `${spec.objectId} active assay receipt is missing`,
  );
  check(
    receipt?.raw_label_denominators?.group_column === "groups" &&
      receipt?.raw_label_denominators?.neuron_type_column === "neuron_types",
    `${spec.objectId} raw classification columns changed`,
  );
  check(
    receipt?.raw_label_denominators?.expected_group_count === spec.groupCount &&
      receipt?.raw_label_denominators?.observed_group_count === spec.groupCount,
    `${spec.objectId} raw group denominator changed`,
  );
  const groupLabels = receipt?.raw_label_denominators?.observed_group_labels;
  check(
    Array.isArray(groupLabels) &&
      groupLabels.length === spec.groupCount &&
      jsonEqual(groupLabels, sortedUnique(groupLabels)),
    `${spec.objectId} raw group labels are missing, duplicated, or unsorted`,
  );
  const header = receipt?.roster?.ordered_column_names;
  check(Array.isArray(header), `${spec.objectId} roster header receipt is missing`);
  check(
    jsonEqual(header.slice(0, REQUIRED_ROSTER_PREFIX.length), REQUIRED_ROSTER_PREFIX),
    `${spec.objectId} roster reserved prefix changed`,
  );
  for (const required of REQUIRED_RAW_METADATA_COLUMNS) {
    check(header.includes(required), `${spec.objectId} roster lacks required column ${required}`);
  }
  check(new Set(header).size === header.length, `${spec.objectId} roster header contains duplicates`);
  for (const appended of APPENDED_AUDIT_COLUMNS) {
    check(!header.includes(appended), `${spec.objectId} raw roster collides with ${appended}`);
  }
  check(receipt?.roster?.file_name === spec.rawMetadataFileName, `${spec.objectId} roster filename changed`);
  check(receipt?.roster?.row_count === spec.nucleusCount, `${spec.objectId} roster row denominator changed`);
  check(receipt?.roster?.column_count === header.length, `${spec.objectId} roster column denominator changed`);
  check(
    receipt?.roster?.compound_key_expression ===
      CANO_GOMEZ_COMPOUND_KEY_EXPRESSION,
    `${spec.objectId} roster compound-key expression changed`,
  );
  for (const [field, label] of [
    ["ordered_compound_keys_sha256", "ordered compound keys"],
    ["uncompressed_sha256", "uncompressed roster"],
    ["compressed_sha256", "compressed roster"],
  ]) {
    assertSha256(receipt?.roster?.[field], `${spec.objectId} ${label}`);
  }
  check(
    receipt.roster.compressed_sha256 === summary.roster_sha256,
    `${spec.objectId} roster checksum disagrees with combined receipt`,
  );
  check(
    Number.isInteger(receipt?.roster?.compressed_bytes) &&
      receipt.roster.compressed_bytes > 0 &&
      Number.isInteger(receipt?.roster?.uncompressed_bytes) &&
      receipt.roster.uncompressed_bytes > 0,
    `${spec.objectId} roster byte receipts are missing`,
  );
  check(
    receipt?.scope_boundaries?.raw_labels_preserved === true &&
      receipt?.scope_boundaries?.classification_inference_applied === false &&
      receipt?.scope_boundaries?.label_normalization_applied === false &&
      receipt?.scope_boundaries
        ?.reported_516_type_denominator_hard_assertion_applied === false,
    `${spec.objectId} raw extraction boundaries changed`,
  );
}

async function gzipPlainFile(plainPath, gzipPath) {
  await pipeline(
    createReadStream(plainPath),
    createGzip({
      level: 9,
      strategy: zlibConstants.Z_DEFAULT_STRATEGY,
      mtime: 0,
    }),
    createWriteStream(gzipPath),
  );
  const plainReceipt = await sha256File(plainPath);
  const gzipReceipt = await sha256File(gzipPath);
  return {
    uncompressedBytes: plainReceipt.bytes,
    uncompressedSha256: plainReceipt.sha256,
    compressedBytes: gzipReceipt.bytes,
    compressedSha256: gzipReceipt.sha256,
  };
}

function artifactReceipt(kind, fileName, header, rowCount, receipt) {
  return {
    artifactKind: kind,
    fileName,
    mediaType: "text/csv",
    contentEncoding: "gzip",
    deterministicCompression: "gzip_level_9_mtime_0",
    rowCount,
    columnCount: header.length,
    orderedColumnNames: header,
    ...receipt,
  };
}

function profileContextRows(profileRows, metadataFieldAvailability = null) {
  const availabilityByField = new Map(
    (metadataFieldAvailability ?? []).map((receipt) => [receipt.field, receipt]),
  );
  return CONTEXT_FIELDS.map((field) =>
    countProfileValues(
      profileRows,
      field,
      metadataFieldAvailability === null
        ? undefined
        : availabilityByField.get(field)?.sourceColumnPresent,
    ),
  );
}

function buildProfiles(profileRowsByType, metadataFieldAvailability = null) {
  return [...profileRowsByType.entries()]
    .sort(([left], [right]) => compareUtf8(left, right))
    .map(([sourceLocalLabel, rows]) => {
      const profileId = stableCanoGomezProfileId(sourceLocalLabel);
      const keys = rows.map((row) => row.compound_nucleus_key);
      return {
        profileId,
        recordKind: "source_local_exact_nucleus_roster_profile",
        unitOfObservation: "nucleus",
        sourceObjectId: "cholinergic",
        sourceFileName: CANO_GOMEZ_SOURCE_SPECS[0].sourceFileName,
        sourceGroup: "CHOL_IN",
        sourceLocalLabel,
        nucleusCount: rows.length,
        assignmentAuthority: "source_explicit_groups_equals_CHOL_IN",
        stableIdentityField: "compound_nucleus_key",
        orderedCompoundNucleusKeysSha256: sha256TextLines(keys),
        contextFieldCounts: profileContextRows(rows, metadataFieldAvailability),
        markerEvidenceStatus: "NOT_EXTRACTED_NO_LABEL_TOKEN_INFERENCE",
        geometryAuthority: {
          geometryObjectCount: 0,
          internalStructureObjectCount: 0,
          sameCellLinkCount: 0,
          atlasRegistrationCount: 0,
        },
        rosterLink: {
          artifactFileName: CONFIRMED_ROSTER_FILE_NAME,
          idField: "compound_nucleus_key",
          filterField: "confirmed_interneuron_profile_id",
          filterEquals: profileId,
        },
      };
    });
}

function decisionPolicy() {
  return {
    policyId: "CANO_GOMEZ_GSE318731_CONFIRMED_ONLY_0.1",
    confirmedRule: {
      sourceObjectId: "cholinergic",
      rawField: "groups",
      exactValue: "CHOL_IN",
      authority: "source_explicit_group_label",
    },
    motorExclusionRule: {
      sourceObjectId: "cholinergic",
      rawField: "groups",
      exactValues: CANO_GOMEZ_MOTOR_GROUPS,
    },
    sensoryScopeExclusionRule: {
      sourceObjectId: "gabaergic",
      rawField: "groups",
      exactValue: "GABA_CSF-cN_Pkd2l1",
    },
    glutamatergicRule: {
      decision:
        CANO_GOMEZ_DECISIONS.EXCLUDED_PROJECTION_LOCAL_STATUS_UNRESOLVED,
      boundary:
        "Every glutamatergic row remains excluded because this source-local roster does not establish projection-versus-local interneuron status per type.",
    },
    remainingGabaergicRule: {
      decision:
        CANO_GOMEZ_DECISIONS.EXCLUDED_AMBIGUOUS_OR_PROJECTION_EXCEPTION_UNRESOLVED,
      sourceCategoricalInterneuronFlagUsed: false,
      gabaergicClassUsedAsInterneuronFlag: false,
      boundary:
        "GABA identity is not treated as a categorical interneuron flag; inhibitory projection exceptions remain unresolved at the source-type level.",
    },
    nonNeuronalRule: {
      sourceLevelPreprocessingReported: true,
      perNucleusFlagAvailable: false,
      perNucleusExcludedCount: null,
      boundary:
        "Non-neuronal removal is retained only as a source-level preprocessing statement; no per-nucleus non-neuronal flag or fabricated zero is emitted.",
    },
  };
}

function makeRegistry({
  identityAuthorityMode,
  crossAssayCellIdentityVerified,
  inputReceipts,
  metadataFieldCoverage,
  observedTypeCount,
  paperReportedTypeCountMatchesObservedRawUnion,
  sourceSummaries,
  auditArtifact,
  confirmedArtifact,
  decisionCounts,
  profiles,
}) {
  return {
    releaseId: "ohri-cano-gomez-p56-multiome-interneuron-registry-0.1.0",
    schemaVersion: "0.1.0",
    releaseDate: CANO_GOMEZ_RELEASE_DATE,
    datasetId: CANO_GOMEZ_ACCESSION,
    lifeStage: "P56",
    coordinateAuthority: "SOURCE_LOCAL_ASSIGNMENT_ONLY",
    compoundNucleusKeyExpression: CANO_GOMEZ_COMPOUND_KEY_EXPRESSION,
    identityAuthority: {
      mode: identityAuthorityMode,
      stableKeyBasis: "exact_source_filename_plus_meta_data_row_name",
      metaDataRowNamesUniqueNonemptyVerified: true,
      crossAssayCellIdentityVerified,
      sameCellAssertionAdmitted: false,
      boundary: crossAssayCellIdentityVerified
        ? "The R/SeuratObject receipt verifies meta.data row names against object Cells, object colnames, assay colnames, and active-ident names in exact order; this still creates no cross-source same-cell linkage."
        : identityAuthorityMode === BASE_R_STREAM_IDENTITY_AUTHORITY
          ? "The base-R streaming receipt verifies only unique non-empty meta.data row names and same-row raw assignments after full readRDS materialization; object Cells and assay colname identity were not resolved, so no cross-assay or same-cell claim is admitted."
          : "The Python/rdata clean-room receipt verifies only unique non-empty meta.data row names and same-row raw assignments; object Cells and assay colname identity were not resolved, so no cross-assay or same-cell claim is admitted.",
    },
    metadataFieldCoverage,
    sourceReferences: {
      dataRepository: {
        accession: CANO_GOMEZ_ACCESSION,
        url: "https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE318731",
      },
      publication: {
        doi: "10.64898/2026.06.11.731752",
        articleUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC13308138/",
        articleLicense: "CC-BY-NC-4.0",
        rightsBoundary:
          "The article licence is not generalized into a separate redistribution licence for the GEO-hosted RDS objects; the registry records derived factual assignments and does not bundle the source RDS files.",
      },
    },
    inputReceipts,
    decisionPolicy: decisionPolicy(),
    denominatorReconciliation: {
      sourceTotalNucleusCount: CANO_GOMEZ_EXPECTED_TOTAL_NUCLEI,
      sourceObjectCount: CANO_GOMEZ_SOURCE_SPECS.length,
      sourceScopedGroupCount: CANO_GOMEZ_EXPECTED_TOTAL_SOURCE_SCOPED_GROUPS,
      paperReportedNeuronTypeCount:
        CANO_GOMEZ_REPORTED_TYPE_COUNT_NOT_USED_AS_INTERNEURON_DENOMINATOR,
      observedRawNonMissingNonEmptyTypeLabelUnionCount: observedTypeCount,
      paperReportedTypeCountMatchesObservedRawUnion:
        paperReportedTypeCountMatchesObservedRawUnion,
      paperReportedTypeCountUsedAsInterneuronDenominator: false,
      confirmedInterneuronNucleusCount:
        decisionCounts[CANO_GOMEZ_DECISIONS.CONFIRMED_INTERNEURON] ?? 0,
      confirmedInterneuronProfileCount: profiles.length,
      excludedMotorNucleusCount:
        decisionCounts[CANO_GOMEZ_DECISIONS.EXCLUDED_MOTOR] ?? 0,
      excludedSensoryScopeNucleusCount:
        decisionCounts[CANO_GOMEZ_DECISIONS.EXCLUDED_SENSORY_SCOPE] ?? 0,
      excludedProjectionLocalStatusUnresolvedNucleusCount:
        decisionCounts[
          CANO_GOMEZ_DECISIONS.EXCLUDED_PROJECTION_LOCAL_STATUS_UNRESOLVED
        ] ?? 0,
      excludedAmbiguousOrProjectionExceptionUnresolvedNucleusCount:
        decisionCounts[
          CANO_GOMEZ_DECISIONS
            .EXCLUDED_AMBIGUOUS_OR_PROJECTION_EXCEPTION_UNRESOLVED
        ] ?? 0,
      perNucleusNonNeuronalExcludedCount: null,
      generatedGeometryCount: 0,
      internalStructureObjectCount: 0,
      sameCellLinkCount: 0,
      atlasRegistrationCount: 0,
    },
    sourceObjects: sourceSummaries,
    artifacts: [auditArtifact, confirmedArtifact],
    profiles,
    hardBoundaries: [
      "Only rows whose exact source `groups` value is `CHOL_IN` are admitted as confirmed interneurons in this registry.",
      "GABA identity is not an interneuron flag: GABA_CSF-cN_Pkd2l1 is excluded as sensory scope and every remaining GABA row stays ambiguous or projection-exception unresolved.",
      "Every glutamatergic row stays excluded because source-local projection-versus-local interneuron status is unresolved per type.",
      "The paper-reported 516 neuronal-type denominator is recorded for reconciliation and is never asserted as an interneuron denominator.",
      "The checksum-pinned GLUT UPDATE object lacks meta.data neuron_types; every absent value remains source NA under SOURCE_ABSENT_ASSIGNMENT. Its separate active.ident slot is not copied into this metadata-only contract, and the missing column is not biological absence.",
      "Raw group and neuron-type strings, plus source, anatomy and sex strings when those source columns are present, are preserved exactly and are not trimmed, repaired, or converted into marker claims; an absent optional context column remains source NA and is never inferred, silently defaulted, or interpreted as biological absence.",
      "Non-neuronal removal is a source-level preprocessing statement only; no per-nucleus non-neuronal flag or zero-valued exclusion denominator is fabricated.",
      "The registry admits no morphology, generated geometry, intracellular structure, atlas registration, projection target, synaptic edge, or same-cell linkage.",
      "All profile identifiers are source-local hashes of exact raw neuron_types labels and do not establish cross-source canonical identity.",
    ],
  };
}

async function buildFromRReceiptsIntoStaging(
  extractionDirectory,
  stagingDirectory,
) {
  const verified = await loadVerifiedReceipts(extractionDirectory);
  const allRawColumns = [];
  for (const entry of verified.receipts) {
    for (const column of entry.receipt.roster.ordered_column_names) {
      if (!allRawColumns.includes(column)) allRawColumns.push(column);
    }
  }
  const outputHeader = [...allRawColumns, ...APPENDED_AUDIT_COLUMNS];
  check(
    new Set(outputHeader).size === outputHeader.length,
    "output header contains a raw/appended column collision",
  );

  const auditPlainPath = join(stagingDirectory, `${AUDIT_FILE_NAME}.plain.csv`);
  const confirmedPlainPath = join(
    stagingDirectory,
    `${CONFIRMED_ROSTER_FILE_NAME}.plain.csv`,
  );
  const auditWriter = new CsvWriter(auditPlainPath, outputHeader);
  const confirmedWriter = new CsvWriter(confirmedPlainPath, outputHeader);
  const globalCompoundKeys = new Set();
  const decisionCounts = Object.fromEntries(
    Object.values(CANO_GOMEZ_DECISIONS).map((decision) => [decision, 0]),
  );
  const profileRowsByType = new Map();
  const sourceSummaries = [];
  const receiptEntries = [];
  const observedAllTypes = new Set();
  const observedSourceScopedGroups = new Set();

  for (const entry of verified.receipts) {
    const { spec, receipt, rosterPath } = entry;
    const expectedHeader = receipt.roster.ordered_column_names;
    let header = null;
    let sourceRowCount = 0;
    const sourceNucleusIds = [];
    const compoundKeys = [];
    const groupValues = [];
    const neuronTypeValues = [];
    const perSourceDecisionCounts = Object.fromEntries(
      Object.values(CANO_GOMEZ_DECISIONS).map((decision) => [decision, 0]),
    );

    const csvReceipt = await processGzipCsv(rosterPath, async (fields) => {
      if (header === null) {
        check(
          fields.every((field) => typeof field === "string" && field.length > 0),
          `${spec.objectId} header contains an empty or NA column`,
        );
        check(jsonEqual(fields, expectedHeader), `${spec.objectId} roster header changed`);
        header = fields;
        return;
      }
      check(fields.length === header.length, `${spec.objectId} CSV row width changed`);
      const row = Object.fromEntries(header.map((field, index) => [field, fields[index]]));
      sourceRowCount += 1;
      check(row.source_accession === CANO_GOMEZ_ACCESSION, `${spec.objectId} row accession changed`);
      check(row.source_file_name === spec.sourceFileName, `${spec.objectId} row source filename changed`);
      check(
        typeof row.source_nucleus_id === "string" &&
          row.source_nucleus_id.length > 0 &&
          !row.source_nucleus_id.includes("|"),
        `${spec.objectId} has an invalid source nucleus id`,
      );
      const expectedCompoundKey = `${CANO_GOMEZ_ACCESSION}|${spec.sourceFileName}|${row.source_nucleus_id}`;
      check(
        row.compound_nucleus_key === expectedCompoundKey,
        `${spec.objectId} compound nucleus key changed`,
      );
      check(
        !globalCompoundKeys.has(row.compound_nucleus_key),
        `duplicate compound nucleus key: ${row.compound_nucleus_key}`,
      );
      globalCompoundKeys.add(row.compound_nucleus_key);
      sourceNucleusIds.push(row.source_nucleus_id);
      compoundKeys.push(row.compound_nucleus_key);
      groupValues.push(row.groups);
      neuronTypeValues.push(row.neuron_types);
      check(typeof row.groups === "string" && row.groups.length > 0, `${spec.objectId} has missing groups`);
      if (typeof row.neuron_types === "string" && row.neuron_types.length > 0) {
        observedAllTypes.add(row.neuron_types);
      }
      observedSourceScopedGroups.add(`${spec.sourceFileName}|${row.groups}`);

      const classification = classifyCanoGomezAssignment({
        objectId: spec.objectId,
        groups: row.groups,
      });
      decisionCounts[classification.decision] += 1;
      perSourceDecisionCounts[classification.decision] += 1;
      let profileId = null;
      if (classification.decision === CANO_GOMEZ_DECISIONS.CONFIRMED_INTERNEURON) {
        check(
          typeof row.neuron_types === "string" && row.neuron_types.length > 0,
          "a confirmed CHOL_IN row has missing or empty neuron_types",
        );
        profileId = stableCanoGomezProfileId(row.neuron_types);
        if (!profileRowsByType.has(row.neuron_types)) profileRowsByType.set(row.neuron_types, []);
        profileRowsByType.get(row.neuron_types).push(row);
      }
      const augmented = {
        ...Object.fromEntries(allRawColumns.map((column) => [column, row[column] ?? null])),
        source_object_id: spec.objectId,
        identity_authority_mode: R_IDENTITY_AUTHORITY,
        cross_assay_cell_identity_verified: "true",
        scope_decision: classification.decision,
        scope_decision_reason: classification.reason,
        confirmed_interneuron_profile_id: profileId,
        per_nucleus_non_neuronal_status: NON_NEURONAL_STATUS,
        geometry_object_count: "0",
        internal_structure_object_count: "0",
        same_cell_link_count: "0",
      };
      const outputRow = outputHeader.map((column) => augmented[column]);
      await auditWriter.write(outputRow);
      if (profileId !== null) await confirmedWriter.write(outputRow);
    });

    check(header !== null, `${spec.objectId} roster is empty`);
    check(sourceRowCount === spec.nucleusCount, `${spec.objectId} row denominator changed`);
    check(
      csvReceipt.compressedBytes === receipt.roster.compressed_bytes &&
        csvReceipt.compressedSha256 === receipt.roster.compressed_sha256 &&
        csvReceipt.uncompressedBytes === receipt.roster.uncompressed_bytes &&
        csvReceipt.uncompressedSha256 === receipt.roster.uncompressed_sha256,
      `${spec.objectId} roster byte/checksum receipt mismatch`,
    );
    check(
      sha256TextLines(sourceNucleusIds) === receipt.source_object.ordered_row_names_sha256,
      `${spec.objectId} ordered source nucleus ids changed`,
    );
    check(
      sha256TextLines(compoundKeys) === receipt.roster.ordered_compound_keys_sha256,
      `${spec.objectId} ordered compound nucleus keys changed`,
    );
    const groupProfile = exactFieldProfile(groupValues);
    const typeProfile = exactFieldProfile(neuronTypeValues);
    assertReceiptProfile(
      receipt.raw_label_denominators.groups_profile,
      groupProfile,
      `${spec.objectId} groups`,
    );
    assertReceiptProfile(
      receipt.raw_label_denominators.neuron_types_profile,
      typeProfile,
      `${spec.objectId} neuron_types`,
    );
    const observedGroups = groupProfile.observedValueCounts.map(({ value }) => value);
    check(
      jsonEqual(observedGroups, receipt.raw_label_denominators.observed_group_labels),
      `${spec.objectId} observed group labels changed`,
    );
    const observedTypes = typeProfile.observedValueCounts
      .map(({ value }) => value)
      .filter((value) => value !== "");
    check(
      jsonEqual(observedTypes, receipt.raw_label_denominators.observed_type_labels),
      `${spec.objectId} observed neuron type labels changed`,
    );
    sourceSummaries.push({
      objectId: spec.objectId,
      sourceFileName: spec.sourceFileName,
      sourceRdsBytes: spec.sourceBytes,
      sourceRdsSha256: receipt.source.sha256,
      nucleusCount: spec.nucleusCount,
      sourceScopedGroupCount: spec.groupCount,
      rawNonMissingNonEmptyNeuronTypeLabelCount: observedTypes.length,
      identityAuthorityMode: R_IDENTITY_AUTHORITY,
      crossAssayCellIdentityVerified: true,
      decisionCounts: Object.entries(perSourceDecisionCounts).map(
        ([decision, count]) => ({ decision, count }),
      ),
    });
    receiptEntries.push({
      objectId: spec.objectId,
      receiptKind: "r_seurat_object_identity_receipt",
      receiptFileName: spec.receiptFileName,
      receiptSha256: entry.summary.receipt_sha256,
      rawMetadataFileName: spec.rawMetadataFileName,
      rawMetadataCompressedSha256: receipt.roster.compressed_sha256,
      rawMetadataUncompressedSha256: receipt.roster.uncompressed_sha256,
      orderedSourceNucleusIdsSha256:
        receipt.source_object.ordered_row_names_sha256,
    });
  }

  await auditWriter.close();
  await confirmedWriter.close();
  check(
    auditWriter.rowCount === CANO_GOMEZ_EXPECTED_TOTAL_NUCLEI,
    "all-nucleus audit row denominator changed",
  );
  check(
    confirmedWriter.rowCount ===
      decisionCounts[CANO_GOMEZ_DECISIONS.CONFIRMED_INTERNEURON],
    "confirmed roster row count does not match confirmed decision count",
  );
  check(
    observedSourceScopedGroups.size ===
      CANO_GOMEZ_EXPECTED_TOTAL_SOURCE_SCOPED_GROUPS,
    "derived source-scoped group denominator changed",
  );
  check(
    jsonEqual(
      sortedUnique([...observedSourceScopedGroups]),
      verified.combinedReceipt.asserted_denominators
        .observed_source_scoped_group_keys,
    ),
    "derived source-scoped group keys changed",
  );
  const observedRawGroups = sortedUnique(
    [...observedSourceScopedGroups].map((value) =>
      value.slice(value.indexOf("|") + 1),
    ),
  );
  check(
    observedRawGroups.length ===
      verified.combinedReceipt.asserted_denominators
        .observed_raw_group_label_union_count &&
      jsonEqual(
        observedRawGroups,
        verified.combinedReceipt.asserted_denominators
          .observed_raw_group_label_union,
      ),
    "derived raw group-label union changed",
  );

  const reconciled =
    verified.combinedReceipt.reported_type_denominator_reconciliation;
  check(
    observedAllTypes.size ===
      reconciled.observed_unique_non_missing_non_empty_type_count,
    "derived raw neuron_types union denominator changed",
  );
  check(
    jsonEqual(sortedUnique([...observedAllTypes]), reconciled.observed_type_labels),
    "derived raw neuron_types union labels changed",
  );

  const auditGzipPath = join(stagingDirectory, AUDIT_FILE_NAME);
  const confirmedGzipPath = join(stagingDirectory, CONFIRMED_ROSTER_FILE_NAME);
  const auditReceipt = await gzipPlainFile(auditPlainPath, auditGzipPath);
  const confirmedReceipt = await gzipPlainFile(
    confirmedPlainPath,
    confirmedGzipPath,
  );
  await rm(auditPlainPath);
  await rm(confirmedPlainPath);
  const auditArtifact = artifactReceipt(
    "all_nucleus_assignment_audit",
    AUDIT_FILE_NAME,
    outputHeader,
    auditWriter.rowCount,
    auditReceipt,
  );
  const confirmedArtifact = artifactReceipt(
    "confirmed_interneuron_nucleus_roster",
    CONFIRMED_ROSTER_FILE_NAME,
    outputHeader,
    confirmedWriter.rowCount,
    confirmedReceipt,
  );
  const profiles = buildProfiles(profileRowsByType);
  const registry = makeRegistry({
    identityAuthorityMode: R_IDENTITY_AUTHORITY,
    crossAssayCellIdentityVerified: true,
    inputReceipts: {
      authorityMode: R_IDENTITY_AUTHORITY,
      combinedReceiptFileName: COMBINED_RECEIPT_FILE_NAME,
      combinedReceiptSha256: verified.combinedFileReceipt.sha256,
      sourceObjects: receiptEntries,
    },
    metadataFieldCoverage: {
      mode: "ALL_SUPPORTED_META_DATA_COLUMNS_FROM_STRICT_R_EXTRACTOR",
      preservedContractedColumns: allRawColumns,
      boundary:
        "The strict R extractor carries every supported meta.data column into its verified raw roster; the assignment audit preserves their exact serialized values and appends only explicit project decision fields.",
    },
    observedTypeCount:
      reconciled.observed_unique_non_missing_non_empty_type_count,
    paperReportedTypeCountMatchesObservedRawUnion:
      reconciled.matches_reported_denominator_and_has_no_missing_labels,
    sourceSummaries,
    auditArtifact,
    confirmedArtifact,
    decisionCounts,
    profiles,
  });
  await validateCanoGomezP56MultiomeInterneuronRegistry(registry);
  await writeFile(
    join(stagingDirectory, REGISTRY_FILE_NAME),
    `${JSON.stringify(registry, null, 2)}\n`,
    "utf8",
  );
  return registry;
}

function sortedCountObject(value) {
  check(
    value !== null && typeof value === "object" && !Array.isArray(value),
    "clean-room metadata count receipt must be an object",
  );
  return Object.fromEntries(
    Object.entries(value).sort(([left], [right]) => compareUtf8(left, right)),
  );
}

function validateBaseRMetadataFieldContract(spec, audit) {
  const columns = audit?.metadataColumns;
  check(
    Array.isArray(columns) &&
      columns.every((field) => typeof field === "string" && field.length > 0) &&
      new Set(columns).size === columns.length,
    `${spec.objectId} base-R metadata column inventory is invalid`,
  );
  const sourceAbsentAssignmentFields = spec.objectId === "glutamatergic" &&
    !columns.includes("neuron_types") &&
    audit.sourceSha256 === GLUT_SOURCE_WITHOUT_METADATA_TYPES_SHA256
      ? ["neuron_types"] : [];
  const requiredAssignments = REQUIRED_RAW_METADATA_COLUMNS.filter(
    (field) => !sourceAbsentAssignmentFields.includes(field),
  );
  check(
    requiredAssignments.every((field) => columns.includes(field)),
    `${spec.objectId} base-R audit lacks a required assignment column`,
  );
  const presentOptionalContextFields = CLEAN_ROOM_CONTRACT_RAW_FIELDS.filter(
    (field) => !REQUIRED_RAW_METADATA_COLUMNS.includes(field) && columns.includes(field),
  );
  const absentOptionalContextFields = CLEAN_ROOM_CONTRACT_RAW_FIELDS.filter(
    (field) => !REQUIRED_RAW_METADATA_COLUMNS.includes(field) && !columns.includes(field),
  );
  check(
    jsonEqual(audit?.metadataFieldContract, {
      requiredAssignmentFields: [...requiredAssignments],
      ...(sourceAbsentAssignmentFields.length ? { sourceAbsentAssignmentFields } : {}),
      optionalContextFields: ["source", "anatomy", "Sex"],
      presentOptionalContextFields,
      absentOptionalContextFields,
      absentOptionalContextEmissionMode: ABSENT_SOURCE_COLUMN_TO_SOURCE_NA,
      allContractFieldsHaveExplicitPresenceReceipts: true,
    }),
    `${spec.objectId} base-R metadata field contract changed`,
  );
  const profiles = audit?.metadataFields;
  check(
    profiles !== null &&
      typeof profiles === "object" &&
      !Array.isArray(profiles) &&
      jsonEqual(Object.keys(profiles).sort(compareUtf8), [...CLEAN_ROOM_CONTRACT_RAW_FIELDS].sort(compareUtf8)),
    `${spec.objectId} base-R metadata profile set changed`,
  );

  return CLEAN_ROOM_CONTRACT_RAW_FIELDS.map((field) => {
    const profile = profiles[field];
    const sourceColumnPresent = columns.includes(field);
    const expectedIndex = sourceColumnPresent ? columns.indexOf(field) + 1 : null;
    check(
      profile?.sourceColumnPresent === sourceColumnPresent &&
        profile?.sourceColumnIndex === expectedIndex,
      `${spec.objectId} ${field} source-column presence/index changed`,
    );
    check(
      profile?.emissionMode ===
          (sourceColumnPresent
            ? PRESERVED_SOURCE_COLUMN_VALUES
            : ABSENT_SOURCE_COLUMN_TO_SOURCE_NA) &&
        profile?.sourceColumnAbsenceReason ===
          (sourceColumnPresent ? null : SOURCE_COLUMN_ABSENCE_REASON),
      `${spec.objectId} ${field} source-column emission receipt changed`,
    );
    check(
      profile?.rowCount === spec.nucleusCount &&
        Number.isInteger(profile?.missingCount) &&
        profile.missingCount >= 0 &&
        Number.isInteger(profile?.sourceMissingCount) &&
        profile.sourceMissingCount >= 0 &&
        Number.isInteger(profile?.sourceEmptyStringCount) &&
        profile.sourceEmptyStringCount >= 0 &&
        Number.isInteger(profile?.sourceWhitespaceOnlyCount) &&
        profile.sourceWhitespaceOnlyCount >= 0 &&
        Number.isInteger(profile?.observedNonemptyUniqueCount) &&
        profile.observedNonemptyUniqueCount >= 0 &&
        profile.missingCount ===
          profile.sourceMissingCount + profile.sourceEmptyStringCount,
      `${spec.objectId} ${field} exact source missingness receipt changed`,
    );
    const counts = sortedCountObject(profile?.counts);
    check(
      Object.values(counts).every((count) => Number.isInteger(count) && count > 0) &&
        Object.values(counts).reduce((total, count) => total + count, 0) ===
          spec.nucleusCount &&
        (counts[""] ?? 0) === profile.missingCount &&
        Object.keys(counts).filter((value) => value !== "").length ===
          profile.observedNonemptyUniqueCount,
      `${spec.objectId} ${field} value-count receipt changed`,
    );
    check(
      Array.isArray(profile?.factorLevels) && Array.isArray(profile?.zeroCountLevels),
      `${spec.objectId} ${field} factor receipt changed`,
    );
    if (sourceColumnPresent) {
      check(
        [profile.typeof, profile.storageMode, profile.class].every(
          (value) => typeof value === "string" && value.length > 0,
        ) &&
          typeof profile.isFactor === "boolean" &&
          typeof profile.isOrderedFactor === "boolean",
        `${spec.objectId} ${field} source type receipt is absent`,
      );
    } else {
      check(
        (!REQUIRED_RAW_METADATA_COLUMNS.includes(field) || sourceAbsentAssignmentFields.includes(field)) &&
          [
            profile.typeof,
            profile.storageMode,
            profile.class,
            profile.isFactor,
            profile.isOrderedFactor,
          ].every((value) => value === null) &&
          profile.sourceMissingCount === spec.nucleusCount &&
          profile.sourceEmptyStringCount === 0 &&
          profile.sourceWhitespaceOnlyCount === 0 &&
          profile.observedNonemptyUniqueCount === 0 &&
          jsonEqual(counts, { "": spec.nucleusCount }) &&
          profile.factorLevels.length === 0 &&
          profile.zeroCountLevels.length === 0,
        `${spec.objectId} ${field} absent source column gained a silent default`,
      );
    }
    return {
      field,
      requirement: sourceAbsentAssignmentFields.includes(field)
        ? "SOURCE_ABSENT_ASSIGNMENT"
        : REQUIRED_RAW_METADATA_COLUMNS.includes(field)
        ? "REQUIRED_ASSIGNMENT"
        : "OPTIONAL_CONTEXT",
      sourceColumnPresent,
      sourceColumnIndex: expectedIndex,
      emissionMode: profile.emissionMode,
      sourceColumnAbsenceReason: profile.sourceColumnAbsenceReason,
      rowCount: profile.rowCount,
      sourceMissingCount: profile.sourceMissingCount,
      sourceEmptyStringCount: profile.sourceEmptyStringCount,
      sourceWhitespaceOnlyCount: profile.sourceWhitespaceOnlyCount,
      observedNonemptyUniqueCount: profile.observedNonemptyUniqueCount,
    };
  });
}

function validateCleanRoomAudit(spec, audit, extractorReceipts) {
  const isPythonCleanRoom =
    audit?.authorityMode === CLEAN_ROOM_IDENTITY_AUTHORITY;
  const isBaseRStream =
    audit?.authorityMode === BASE_R_STREAM_IDENTITY_AUTHORITY;
  check(
    isPythonCleanRoom || isBaseRStream,
    `${spec.objectId} row-only authority mode changed`,
  );
  check(audit?.formatVersion === "0.1.0", `${spec.objectId} clean-room audit format changed`);
  check(
    audit?.receiptKind ===
      (isPythonCleanRoom
        ? "cano_gomez_python_rdata_meta_data_row_only_audit"
        : "cano_gomez_base_r_stream_meta_data_row_only_audit"),
    `${spec.objectId} clean-room receipt kind changed`,
  );
  check(
    audit?.crossAssayCellIdentityVerified === false,
    `${spec.objectId} clean-room authority mode changed`,
  );
  check(audit?.sourceFile === spec.sourceFileName, `${spec.objectId} clean-room source filename changed`);
  check(
    audit?.sourceBytes === spec.sourceBytes &&
      audit?.sourceExpectedBytes === spec.sourceBytes &&
      audit?.sourceBytesMatchesExpected === true,
    `${spec.objectId} clean-room source byte receipt changed`,
  );
  assertSha256(audit?.sourceSha256, `${spec.objectId} clean-room source RDS`);
  assertSha256(
    audit?.sourceExpectedSha256,
    `${spec.objectId} expected clean-room source RDS`,
  );
  check(
    audit?.sourceExpectedSha256 === audit?.sourceSha256 &&
      audit?.sourceSha256MatchesExpected === true,
    `${spec.objectId} clean-room source checksum was not independently pinned and matched`,
  );
  check(
    audit?.sourcePublicUrl === spec.publicUrl,
    `${spec.objectId} clean-room public source URL changed`,
  );
  check(
    audit?.transmitterClass === spec.transmitterClass,
    `${spec.objectId} clean-room transmitter class changed`,
  );
  check(
    audit?.rowCount === spec.nucleusCount &&
      audit?.uniqueRowNameCount === spec.nucleusCount,
    `${spec.objectId} clean-room row-name denominator changed`,
  );
  const metadataFieldAvailability = isBaseRStream
    ? validateBaseRMetadataFieldContract(spec, audit)
    : null;
  if (isPythonCleanRoom) {
    check(
      Array.isArray(audit?.metadataColumns) &&
        CLEAN_ROOM_CONTRACT_RAW_FIELDS.every((field) =>
          audit.metadataColumns.includes(field),
        ),
      `${spec.objectId} Python clean-room audit lacks required raw metadata columns`,
    );
  }
  for (const field of CLEAN_ROOM_CONTRACT_RAW_FIELDS) {
    const profile = audit?.metadataFields?.[field];
    check(profile?.rowCount === spec.nucleusCount, `${spec.objectId} ${field} audit row count changed`);
    check(
      Number.isInteger(profile?.missingCount) && profile.missingCount >= 0,
      `${spec.objectId} ${field} clean-room missingness receipt is absent`,
    );
    check(
      Number.isInteger(profile?.sourceMissingCount) &&
        profile.sourceMissingCount >= 0 &&
        Number.isInteger(profile?.sourceEmptyStringCount) &&
        profile.sourceEmptyStringCount >= 0 &&
        Number.isInteger(profile?.sourceWhitespaceOnlyCount) &&
        profile.sourceWhitespaceOnlyCount >= 0 &&
        profile.missingCount ===
          profile.sourceMissingCount + profile.sourceEmptyStringCount,
      `${spec.objectId} ${field} clean-room exact missing/empty receipt is absent`,
    );
    check(
      Number.isInteger(profile?.observedNonemptyUniqueCount) &&
        profile.observedNonemptyUniqueCount >= 0,
      `${spec.objectId} ${field} clean-room unique denominator is absent`,
    );
    sortedCountObject(profile?.counts);
  }
  check(
    audit?.metadataFields?.groups?.observedNonemptyUniqueCount ===
      spec.groupCount,
    `${spec.objectId} clean-room group denominator changed`,
  );
  check(
    audit?.identityChecks?.authorityMode === audit.authorityMode &&
      audit?.identityChecks?.stableIdSource === "meta.data row.names" &&
      audit?.identityChecks?.stableCompoundKeyExpression ===
        CANO_GOMEZ_COMPOUND_KEY_EXPRESSION &&
      audit?.identityChecks?.metadataRowNamesUniqueNonempty === true &&
      audit?.identityChecks?.sameRowRawMetadataAssignmentVerified === true,
    `${spec.objectId} clean-room row-name identity was not verified`,
  );
  assertSha256(
    audit?.identityChecks?.orderedMetadataRowNamesSha256,
    `${spec.objectId} ordered clean-room row names`,
  );
  assertSha256(
    audit?.identityChecks?.orderedCompoundNucleusKeysSha256,
    `${spec.objectId} ordered clean-room compound keys`,
  );
  check(
    audit?.identityChecks?.objectCellsExactOrder ===
      (isPythonCleanRoom
        ? "not_yet_resolved_by_python_clean_room_parser"
        : "not_resolved_by_base_r_meta_data_row_only_stream") &&
      audit?.identityChecks?.assayColnamesExactOrder ===
        (isPythonCleanRoom
          ? "not_yet_resolved_by_python_clean_room_parser"
          : "not_resolved_by_base_r_meta_data_row_only_stream") &&
      audit?.identityChecks?.activeIdentNamesExactOrder ===
        (isPythonCleanRoom
          ? "not_yet_resolved_by_python_clean_room_parser"
          : "not_resolved_by_base_r_meta_data_row_only_stream") &&
      audit?.identityChecks?.crossAssayCellIdentityVerified === false &&
      audit?.identityChecks?.sameCellClaimAuthorized === false,
    `${spec.objectId} clean-room cross-assay identity boundary changed`,
  );
  check(
    audit?.denominators?.expectedRowCount === spec.nucleusCount &&
      audit?.denominators?.observedRowCount === spec.nucleusCount &&
      audit?.denominators?.expectedGroupCount === spec.groupCount &&
      audit?.denominators?.observedNonemptyGroupCount === spec.groupCount &&
      audit?.denominators?.observedNonemptyNeuronTypeCount ===
        audit?.metadataFields?.neuron_types?.observedNonemptyUniqueCount,
    `${spec.objectId} clean-room denominator receipt changed`,
  );
  if (isPythonCleanRoom) {
    check(
      audit?.runtime?.rdataParserFileSha256 ===
        CLEAN_ROOM_PATCHED_RDATA_PARSER_SHA256 &&
        audit?.runtime?.expectedPatchedParserFileSha256 ===
          CLEAN_ROOM_PATCHED_RDATA_PARSER_SHA256 &&
        jsonEqual(audit?.runtime?.corePackageVersions, {
          numpy: "2.0.2",
          pandas: "2.3.3",
          rdata: "0.11.2",
        }),
      `${spec.objectId} clean-room parser receipt changed`,
    );
    check(
      audit?.extractor?.fileName === "extract_cano_gomez_rds_metadata.py" &&
        audit?.extractor?.sha256 === extractorReceipts.pythonExtractorSha256,
      `${spec.objectId} clean-room extractor checksum changed`,
    );
  } else {
    check(
      audit?.runtime?.baseROnly === true &&
        audit?.runtime?.seuratObjectNamespaceLoaded === false &&
        typeof audit?.runtime?.rVersion === "string" &&
        audit.runtime.rVersion.length > 0,
      `${spec.objectId} base-R runtime boundary changed`,
    );
    check(
      audit?.extractors?.transport?.fileName ===
        "extract_cano_gomez_rds_metadata_stream.py" &&
        audit?.extractors?.transport?.sha256 ===
          extractorReceipts.baseRTransportSha256 &&
        audit?.extractors?.baseRWorker?.fileName ===
          "extract_cano_gomez_rds_metadata_stream.R" &&
        audit?.extractors?.baseRWorker?.sha256 ===
          extractorReceipts.baseRWorkerSha256,
      `${spec.objectId} base-R stream extractor checksum changed`,
    );
    check(
      audit?.transport?.sourceBytesStreamedDirectlyToRStdin === true &&
        audit?.transport?.sameRawBytesCountedAndHashedBeforeRStdinWrite ===
          true &&
        audit?.transport?.boundedChunkTransport === true &&
        typeof audit?.transport?.sourcePersistedToDisk === "boolean" &&
        (audit.transport.sourcePersistedToDisk
          ? audit?.transport?.mode === "LOCAL_FILE_TO_R_STDIN" &&
            audit?.transport?.localSourceBasename === spec.sourceFileName
          : audit?.transport?.mode ===
              "HTTP_RANGE_RESUMABLE_TO_R_STDIN" &&
            audit?.transport?.localSourceBasename === null &&
            audit?.transport?.finalUrl === spec.publicUrl),
      `${spec.objectId} base-R source transport receipt changed`,
    );
    check(
      audit?.memoryBoundary?.readRDSMaterializesCompleteObject === true &&
        audit?.memoryBoundary?.CHOLMemoryProbeRequiredBeforeLargerClasses ===
          true &&
        audit?.memoryBoundary?.CHOLProbeDoesNotAuthorizeGabaOrGlutRun === true,
      `${spec.objectId} base-R full-object memory boundary changed`,
    );
  }
  const output = audit?.output?.metadataCsvGzip;
  check(
    output?.fileName === spec.cleanRoomMetadataFileName &&
      output?.mediaType === "text/csv" &&
      output?.contentEncoding === "gzip" &&
      output?.rowCount === spec.nucleusCount &&
      output?.columnCount === CLEAN_ROOM_INPUT_HEADER.length &&
      jsonEqual(output?.orderedColumnNames, CLEAN_ROOM_INPUT_HEADER),
    `${spec.objectId} clean-room output roster contract changed`,
  );
  check(
    typeof output?.deterministicCompression === "string" &&
      /compresslevel=9/.test(output.deterministicCompression) &&
      /mtime=0/.test(output.deterministicCompression),
    `${spec.objectId} clean-room compression receipt changed`,
  );
  if (isBaseRStream) {
    check(
      output?.sourceNaEncoding === "unquoted NA" &&
        output?.nonmissingValueEncoding ===
          "always quoted with doubled quotes",
      `${spec.objectId} base-R lossless CSV encoding receipt changed`,
    );
  }
  for (const [field, label] of [
    ["uncompressedSha256", "uncompressed clean-room roster"],
    ["compressedSha256", "compressed clean-room roster"],
  ]) {
    assertSha256(output?.[field], `${spec.objectId} ${label}`);
  }
  check(
    Number.isInteger(output?.uncompressedBytes) &&
      output.uncompressedBytes > 0 &&
      Number.isInteger(output?.compressedBytes) &&
      output.compressedBytes > 0,
    `${spec.objectId} clean-room output byte receipts are missing`,
  );
  check(
    audit?.scopeBoundaries?.rawLabelsPreserved === true &&
      audit?.scopeBoundaries?.sameMetaDataRowAssignmentsOnly === true &&
      audit?.scopeBoundaries?.labelNormalizationApplied === false &&
      audit?.scopeBoundaries?.classificationInferenceApplied === false &&
      audit?.scopeBoundaries
        ?.reported516TypeDenominatorHardAssertionApplied === false &&
      audit?.scopeBoundaries?.crossAssayCellIdentityVerified === false &&
      audit?.scopeBoundaries?.sameCellLinkageAuthorized === false &&
      audit?.scopeBoundaries?.geometryClaimAuthorized === false &&
      audit?.scopeBoundaries?.internalStructureClaimAuthorized === false &&
      audit?.scopeBoundaries?.atlasRegistrationClaimAuthorized === false,
    `${spec.objectId} clean-room scope boundary changed`,
  );
  if (isBaseRStream) {
    check(
      audit?.scopeBoundaries?.sourceNaAndExactEmptyStringDistinguished === true &&
        audit?.scopeBoundaries?.absentContextSourceColumnsEmittedOnlyAsSourceNa ===
          true &&
        audit?.scopeBoundaries?.optionalContextInferenceApplied === false &&
        audit?.scopeBoundaries
          ?.sourceColumnAbsenceInterpretedAsBiologicalAbsence === false,
      `${spec.objectId} base-R NA/empty-string boundary changed`,
    );
  }
  return metadataFieldAvailability;
}

function cleanRoomProfileMatchesAudit(profile, auditProfile, context) {
  const counts = Object.fromEntries(
    profile.observedValueCounts.map(({ value, count }) => [value, count]),
  );
  if (profile.naCount > 0) {
    counts[""] = (counts[""] ?? 0) + profile.naCount;
  }
  check(
    profile.rowCount === auditProfile.rowCount,
    `${context} clean-room row count disagrees with source audit`,
  );
  check(
    profile.naCount + profile.emptyStringCount === auditProfile.missingCount &&
      profile.naCount === auditProfile.sourceMissingCount &&
      profile.emptyStringCount === auditProfile.sourceEmptyStringCount &&
      profile.whitespaceOnlyCount === auditProfile.sourceWhitespaceOnlyCount,
    `${context} clean-room missingness disagrees with source audit`,
  );
  check(
    profile.observedValueCounts.filter(({ value }) => value !== "").length ===
      auditProfile.observedNonemptyUniqueCount,
    `${context} clean-room unique denominator disagrees with source audit`,
  );
  check(
    jsonEqual(sortedCountObject(counts), sortedCountObject(auditProfile.counts)),
    `${context} clean-room value counts disagree with source audit`,
  );
}

async function loadCleanRoomEntries(extractionDirectory) {
  const entries = [];
  const [pythonExtractor, baseRTransport, baseRWorker] = await Promise.all([
    sha256File(CLEAN_ROOM_EXTRACTOR_URL),
    sha256File(BASE_R_STREAM_TRANSPORT_URL),
    sha256File(BASE_R_STREAM_WORKER_URL),
  ]);
  const extractorReceipts = {
    pythonExtractorSha256: pythonExtractor.sha256,
    baseRTransportSha256: baseRTransport.sha256,
    baseRWorkerSha256: baseRWorker.sha256,
  };
  let authorityMode = null;
  for (const spec of CANO_GOMEZ_SOURCE_SPECS) {
    const auditPath = join(extractionDirectory, spec.cleanRoomAuditFileName);
    const rosterPath = join(extractionDirectory, spec.cleanRoomMetadataFileName);
    check(existsSync(auditPath), `missing ${spec.objectId} clean-room source audit`);
    check(existsSync(rosterPath), `missing ${spec.objectId} clean-room metadata roster`);
    const auditFileReceipt = await sha256File(auditPath);
    const audit = await readJson(auditPath, `${spec.objectId} clean-room source audit`);
    const metadataFieldAvailability = validateCleanRoomAudit(
      spec,
      audit,
      extractorReceipts,
    );
    if (authorityMode === null) authorityMode = audit.authorityMode;
    check(
      audit.authorityMode === authorityMode,
      "row-only source receipts mix identity-authority modes",
    );
    entries.push({
      spec,
      audit,
      auditPath,
      auditFileReceipt,
      rosterPath,
      ...(metadataFieldAvailability === null
        ? {}
        : { metadataFieldAvailability }),
    });
  }
  check(authorityMode !== null, "row-only source receipts are empty");
  return { entries, authorityMode };
}

async function buildFromCleanRoomReceiptsIntoStaging(
  extractionDirectory,
  stagingDirectory,
) {
  const { entries, authorityMode } =
    await loadCleanRoomEntries(extractionDirectory);
  const inputReceiptKind =
    authorityMode === BASE_R_STREAM_IDENTITY_AUTHORITY
      ? "base_r_stream_meta_data_row_only_receipt"
      : "python_rdata_meta_data_row_only_receipt";
  const outputHeader = [
    ...CLEAN_ROOM_CANONICAL_HEADER,
    ...APPENDED_AUDIT_COLUMNS,
  ];
  const auditPlainPath = join(stagingDirectory, `${AUDIT_FILE_NAME}.plain.csv`);
  const confirmedPlainPath = join(
    stagingDirectory,
    `${CONFIRMED_ROSTER_FILE_NAME}.plain.csv`,
  );
  const auditWriter = new CsvWriter(auditPlainPath, outputHeader);
  const confirmedWriter = new CsvWriter(confirmedPlainPath, outputHeader);
  const globalCompoundKeys = new Set();
  const decisionCounts = Object.fromEntries(
    Object.values(CANO_GOMEZ_DECISIONS).map((decision) => [decision, 0]),
  );
  const profileRowsByType = new Map();
  const sourceSummaries = [];
  const receiptEntries = [];
  const observedAllTypes = new Set();
  const observedSourceScopedGroups = new Set();
  let missingOrEmptyTypeCount = 0;

  for (const entry of entries) {
    const { spec, audit, rosterPath, metadataFieldAvailability } = entry;
    let header = null;
    let sourceRowCount = 0;
    const sourceNucleusIds = [];
    const groupValues = [];
    const neuronTypeValues = [];
    const sourceValues = [];
    const anatomyValues = [];
    const sexValues = [];
    const perSourceDecisionCounts = Object.fromEntries(
      Object.values(CANO_GOMEZ_DECISIONS).map((decision) => [decision, 0]),
    );

    const csvReceipt = await processGzipCsv(rosterPath, async (fields) => {
      if (header === null) {
        check(
          jsonEqual(fields, CLEAN_ROOM_INPUT_HEADER),
          `${spec.objectId} clean-room roster header changed`,
        );
        header = fields;
        return;
      }
      check(
        fields.length === CLEAN_ROOM_INPUT_HEADER.length,
        `${spec.objectId} clean-room CSV row width changed`,
      );
      const input = Object.fromEntries(
        CLEAN_ROOM_INPUT_HEADER.map((field, index) => [field, fields[index]]),
      );
      sourceRowCount += 1;
      check(
        typeof input.nucleus_id === "string" &&
          input.nucleus_id.length > 0 &&
          !input.nucleus_id.includes("|"),
        `${spec.objectId} clean-room roster has an invalid meta.data row name`,
      );
      check(
        input.transmitter_class === spec.transmitterClass,
        `${spec.objectId} clean-room transmitter class changed`,
      );
      check(
        typeof input.group === "string" && input.group.length > 0,
        `${spec.objectId} clean-room roster has missing group assignment`,
      );
      const compoundKey = `${CANO_GOMEZ_ACCESSION}|${spec.sourceFileName}|${input.nucleus_id}`;
      check(
        !globalCompoundKeys.has(compoundKey),
        `duplicate compound nucleus key: ${compoundKey}`,
      );
      globalCompoundKeys.add(compoundKey);
      sourceNucleusIds.push(input.nucleus_id);
      groupValues.push(input.group);
      neuronTypeValues.push(input.neuron_type);
      sourceValues.push(input.source);
      anatomyValues.push(input.anatomy);
      sexValues.push(input.sex);
      observedSourceScopedGroups.add(`${spec.sourceFileName}|${input.group}`);
      if (typeof input.neuron_type === "string" && input.neuron_type.length > 0) {
        observedAllTypes.add(input.neuron_type);
      } else {
        missingOrEmptyTypeCount += 1;
      }
      const row = {
        source_accession: CANO_GOMEZ_ACCESSION,
        source_file_name: spec.sourceFileName,
        compound_nucleus_key: compoundKey,
        source_nucleus_id: input.nucleus_id,
        source_active_assay: null,
        source_active_ident: null,
        groups: input.group,
        neuron_types: input.neuron_type,
        source: input.source,
        anatomy: input.anatomy,
        Sex: input.sex,
        transmitter_class: input.transmitter_class,
      };
      const classification = classifyCanoGomezAssignment({
        objectId: spec.objectId,
        groups: row.groups,
      });
      decisionCounts[classification.decision] += 1;
      perSourceDecisionCounts[classification.decision] += 1;
      let profileId = null;
      if (
        classification.decision ===
        CANO_GOMEZ_DECISIONS.CONFIRMED_INTERNEURON
      ) {
        check(
          typeof row.neuron_types === "string" && row.neuron_types.length > 0,
          "a confirmed CHOL_IN row has missing or empty neuron_type",
        );
        profileId = stableCanoGomezProfileId(row.neuron_types);
        if (!profileRowsByType.has(row.neuron_types)) {
          profileRowsByType.set(row.neuron_types, []);
        }
        profileRowsByType.get(row.neuron_types).push(row);
      }
      const augmented = {
        ...row,
        source_object_id: spec.objectId,
        identity_authority_mode: authorityMode,
        cross_assay_cell_identity_verified: "false",
        scope_decision: classification.decision,
        scope_decision_reason: classification.reason,
        confirmed_interneuron_profile_id: profileId,
        per_nucleus_non_neuronal_status: NON_NEURONAL_STATUS,
        geometry_object_count: "0",
        internal_structure_object_count: "0",
        same_cell_link_count: "0",
      };
      const outputRow = outputHeader.map((column) => augmented[column]);
      await auditWriter.write(outputRow);
      if (profileId !== null) await confirmedWriter.write(outputRow);
    });

    check(header !== null, `${spec.objectId} clean-room roster is empty`);
    check(
      sourceRowCount === spec.nucleusCount,
      `${spec.objectId} clean-room row denominator changed`,
    );
    const outputReceipt = audit.output.metadataCsvGzip;
    check(
      csvReceipt.compressedBytes === outputReceipt.compressedBytes &&
        csvReceipt.compressedSha256 === outputReceipt.compressedSha256 &&
        csvReceipt.uncompressedBytes === outputReceipt.uncompressedBytes &&
        csvReceipt.uncompressedSha256 === outputReceipt.uncompressedSha256,
      `${spec.objectId} clean-room roster byte/checksum receipt mismatch`,
    );
    check(
      sha256TextLines(sourceNucleusIds) ===
        audit.identityChecks.orderedMetadataRowNamesSha256,
      `${spec.objectId} ordered clean-room row names changed`,
    );
    check(
      sha256TextLines(
        sourceNucleusIds.map(
          (sourceNucleusId) =>
            `${CANO_GOMEZ_ACCESSION}|${spec.sourceFileName}|${sourceNucleusId}`,
        ),
      ) === audit.identityChecks.orderedCompoundNucleusKeysSha256,
      `${spec.objectId} ordered clean-room compound keys changed`,
    );
    const groupProfile = exactFieldProfile(groupValues);
    const typeProfile = exactFieldProfile(neuronTypeValues);
    cleanRoomProfileMatchesAudit(
      groupProfile,
      audit.metadataFields.groups,
      `${spec.objectId} groups`,
    );
    cleanRoomProfileMatchesAudit(
      typeProfile,
      audit.metadataFields.neuron_types,
      `${spec.objectId} neuron_types`,
    );
    for (const [field, values, auditField] of [
      ["source", sourceValues, "source"],
      ["anatomy", anatomyValues, "anatomy"],
      ["sex", sexValues, "Sex"],
    ]) {
      cleanRoomProfileMatchesAudit(
        exactFieldProfile(values),
        audit.metadataFields[auditField],
        `${spec.objectId} ${field}`,
      );
    }
    check(
      groupProfile.observedValueCounts.filter(({ value }) => value !== "")
        .length === spec.groupCount,
      `${spec.objectId} clean-room derived group denominator changed`,
    );
    const observedTypes = typeProfile.observedValueCounts
      .map(({ value }) => value)
      .filter((value) => value !== "");
    sourceSummaries.push({
      objectId: spec.objectId,
      sourceFileName: spec.sourceFileName,
      sourceRdsBytes: spec.sourceBytes,
      sourceRdsSha256: audit.sourceSha256,
      nucleusCount: spec.nucleusCount,
      sourceScopedGroupCount: spec.groupCount,
      rawNonMissingNonEmptyNeuronTypeLabelCount: observedTypes.length,
      identityAuthorityMode: authorityMode,
      crossAssayCellIdentityVerified: false,
      ...(Array.isArray(metadataFieldAvailability)
        ? { metadataFieldAvailability }
        : {}),
      decisionCounts: Object.entries(perSourceDecisionCounts).map(
        ([decision, count]) => ({ decision, count }),
      ),
    });
    receiptEntries.push({
      objectId: spec.objectId,
      receiptKind: inputReceiptKind,
      receiptFileName: spec.cleanRoomAuditFileName,
      receiptSha256: entry.auditFileReceipt.sha256,
      rawMetadataFileName: spec.cleanRoomMetadataFileName,
      rawMetadataCompressedSha256: outputReceipt.compressedSha256,
      rawMetadataUncompressedSha256: outputReceipt.uncompressedSha256,
      orderedSourceNucleusIdsSha256: sha256TextLines(sourceNucleusIds),
    });
  }

  await auditWriter.close();
  await confirmedWriter.close();
  check(
    auditWriter.rowCount === CANO_GOMEZ_EXPECTED_TOTAL_NUCLEI,
    "clean-room all-nucleus audit row denominator changed",
  );
  check(
    confirmedWriter.rowCount ===
      decisionCounts[CANO_GOMEZ_DECISIONS.CONFIRMED_INTERNEURON],
    "clean-room confirmed roster row count changed",
  );
  check(
    observedSourceScopedGroups.size ===
      CANO_GOMEZ_EXPECTED_TOTAL_SOURCE_SCOPED_GROUPS,
    "clean-room source-scoped group denominator changed",
  );

  const auditGzipPath = join(stagingDirectory, AUDIT_FILE_NAME);
  const confirmedGzipPath = join(stagingDirectory, CONFIRMED_ROSTER_FILE_NAME);
  const auditReceipt = await gzipPlainFile(auditPlainPath, auditGzipPath);
  const confirmedReceipt = await gzipPlainFile(
    confirmedPlainPath,
    confirmedGzipPath,
  );
  await rm(auditPlainPath);
  await rm(confirmedPlainPath);
  const auditArtifact = artifactReceipt(
    "all_nucleus_assignment_audit",
    AUDIT_FILE_NAME,
    outputHeader,
    auditWriter.rowCount,
    auditReceipt,
  );
  const confirmedArtifact = artifactReceipt(
    "confirmed_interneuron_nucleus_roster",
    CONFIRMED_ROSTER_FILE_NAME,
    outputHeader,
    confirmedWriter.rowCount,
    confirmedReceipt,
  );
  const cholinergicAvailability = entries.find(
    ({ spec }) => spec.objectId === "cholinergic",
  )?.metadataFieldAvailability;
  if (authorityMode === BASE_R_STREAM_IDENTITY_AUTHORITY) {
    check(
      Array.isArray(cholinergicAvailability),
      "cholinergic base-R metadata field-availability receipt is absent",
    );
  }
  const profiles = buildProfiles(
    profileRowsByType,
    authorityMode === BASE_R_STREAM_IDENTITY_AUTHORITY
      ? cholinergicAvailability
      : null,
  );
  const registry = makeRegistry({
    identityAuthorityMode: authorityMode,
    crossAssayCellIdentityVerified: false,
    inputReceipts: {
      authorityMode,
      combinedReceiptFileName: null,
      combinedReceiptSha256: null,
      sourceObjects: receiptEntries,
    },
    metadataFieldCoverage: {
      mode: "CONTRACTED_ASSIGNMENT_CONTEXT_COLUMNS_ONLY",
      preservedContractedColumns: [
        "nucleus_id",
        "transmitter_class",
        "group",
        "neuron_type",
        "source",
        "anatomy",
        "sex",
      ],
      boundary:
        authorityMode === BASE_R_STREAM_IDENTITY_AUTHORITY
          ? "The base-R streaming derivative deliberately emits only seven contracted identity, assignment, and context columns after complete-object readRDS materialization. Required assignment columns must be source-present, except the SHA-256-pinned GLUT UPDATE neuron_types absence recorded as SOURCE_ABSENT_ASSIGNMENT; its values remain source NA without substituting active.ident. Optional context values are preserved only when their source column is present, while a source-absent context column is emitted entirely as source NA under an explicit per-object availability receipt. This is a complete row assignment audit, not a copy of every original meta.data column."
          : "The Python/rdata clean-room derivative deliberately preserves only the seven contracted identity, assignment, and context columns; this is a complete row assignment audit, not a copy of every original meta.data column.",
    },
    observedTypeCount: observedAllTypes.size,
    paperReportedTypeCountMatchesObservedRawUnion:
      observedAllTypes.size ===
        CANO_GOMEZ_REPORTED_TYPE_COUNT_NOT_USED_AS_INTERNEURON_DENOMINATOR &&
      missingOrEmptyTypeCount === 0,
    sourceSummaries,
    auditArtifact,
    confirmedArtifact,
    decisionCounts,
    profiles,
  });
  await validateCanoGomezP56MultiomeInterneuronRegistry(registry);
  await writeFile(
    join(stagingDirectory, REGISTRY_FILE_NAME),
    `${JSON.stringify(registry, null, 2)}\n`,
    "utf8",
  );
  return registry;
}

export async function buildCanoGomezP56MultiomeInterneuronRegistry({
  extractionDirectory,
  outputDirectory,
}) {
  check(typeof extractionDirectory === "string", "extractionDirectory is required");
  check(typeof outputDirectory === "string", "outputDirectory is required");
  const sourceDirectory = resolve(extractionDirectory);
  const finalDirectory = resolve(outputDirectory);
  check(existsSync(sourceDirectory), `extraction directory does not exist: ${sourceDirectory}`);
  check(!existsSync(finalDirectory), `output path already exists: ${finalDirectory}`);
  await mkdir(dirname(finalDirectory), { recursive: true });
  const stagingDirectory = await mkdtemp(
    join(dirname(finalDirectory), `.${finalDirectory.split("/").at(-1)}.staging-`),
  );
  try {
    const registry = existsSync(
      join(sourceDirectory, COMBINED_RECEIPT_FILE_NAME),
    )
      ? await buildFromRReceiptsIntoStaging(
          sourceDirectory,
          stagingDirectory,
        )
      : await buildFromCleanRoomReceiptsIntoStaging(
          sourceDirectory,
          stagingDirectory,
        );
    await rename(stagingDirectory, finalDirectory);
    if (finalDirectory === CANONICAL_REGISTRY_DIRECTORY) {
      await syncCanoGomezRegistryImportMirror();
    }
    return {
      outputDirectory: finalDirectory,
      registryPath: join(finalDirectory, REGISTRY_FILE_NAME),
      registry,
    };
  } catch (error) {
    await rm(stagingDirectory, { recursive: true, force: true });
    throw error;
  }
}

const CANONICAL_REGISTRY_DIRECTORY = fileURLToPath(
  new URL("../public/data/cano_gomez_p56_multiome_interneuron_v1/", import.meta.url),
).replace(/\/$/, "");

export async function syncCanoGomezRegistryImportMirror() {
  const registryPath = join(CANONICAL_REGISTRY_DIRECTORY, REGISTRY_FILE_NAME);
  // Validate the full canonical package before writing this one small module
  // import mirror. The mirror itself may not exist yet during generation.
  await validateCanoGomezP56MultiomeInterneuronRegistryPackage(registryPath, { importMirrorPath: null });
  const bytes = await readFile(registryPath);
  const staging = await mkdtemp(join(dirname(CANO_GOMEZ_IMPORT_MIRROR_PATH), ".cano-import-mirror-"));
  try {
    const stagedPath = join(staging, REGISTRY_FILE_NAME);
    await writeFile(stagedPath, bytes);
    await rename(stagedPath, CANO_GOMEZ_IMPORT_MIRROR_PATH);
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
  const receipt = await validateCanoGomezRegistryImportMirror(registryPath);
  return { importMirrorPath: CANO_GOMEZ_IMPORT_MIRROR_PATH, ...receipt };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === "--sync-import-mirror") {
    process.stdout.write(`${JSON.stringify(await syncCanoGomezRegistryImportMirror(), null, 2)}\n`);
    return;
  }
  if (args.length !== 2) {
    throw new Error(
      "Usage: node tools/build_cano_gomez_p56_multiome_interneuron_registry.mjs <verified-extraction-directory> <new-output-directory> | --sync-import-mirror",
    );
  }
  const result = await buildCanoGomezP56MultiomeInterneuronRegistry({
    extractionDirectory: args[0],
    outputDirectory: args[1],
  });
  process.stdout.write(
    `${JSON.stringify(
      {
        registryPath: result.registryPath,
        identityAuthorityMode: result.registry.identityAuthority.mode,
        crossAssayCellIdentityVerified:
          result.registry.identityAuthority.crossAssayCellIdentityVerified,
        totalNuclei:
          result.registry.denominatorReconciliation.sourceTotalNucleusCount,
        confirmedNuclei:
          result.registry.denominatorReconciliation
            .confirmedInterneuronNucleusCount,
        confirmedProfiles:
          result.registry.denominatorReconciliation
            .confirmedInterneuronProfileCount,
      },
      null,
      2,
    )}\n`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    process.stderr.write(`Cano-Gomez registry build failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}

export const CANO_GOMEZ_OUTPUT_FILES = Object.freeze({
  audit: AUDIT_FILE_NAME,
  confirmedRoster: CONFIRMED_ROSTER_FILE_NAME,
  registry: REGISTRY_FILE_NAME,
});
