#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gunzipSync } from "node:zlib";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA_PATH = path.join(
  PROJECT_ROOT,
  "schemas/cano-gomez-p56-multiome-interneuron-registry-0.1.schema.json",
);
const DEFAULT_DATA_PATH = path.join(
  PROJECT_ROOT,
  "public/data/cano_gomez_p56_multiome_interneuron_v1/cano-gomez-p56-multiome-interneuron-registry-0.1.json",
);
export const CANO_GOMEZ_IMPORT_MIRROR_PATH = path.join(
  PROJECT_ROOT,
  "data/cano-gomez-p56-multiome-interneuron-registry-0.1.json",
);

const SOURCE_SPECS = Object.freeze([
  Object.freeze({
    objectId: "cholinergic",
    sourceFileName: "GSE318731_P56_cholinergic_multiome.rds",
    sourceRdsBytes: 127862795,
    nucleusCount: 3199,
    sourceScopedGroupCount: 5,
    receiptFileName: "GSE318731_cholinergic_multiome.metadata.receipt.json",
    rawMetadataFileName: "GSE318731_cholinergic_multiome.metadata.csv.gz",
    cleanRoomReceiptFileName: "GSE318731_P56_cholinergic_multiome.audit.json",
    cleanRoomRawMetadataFileName:
      "GSE318731_P56_cholinergic_multiome.metadata.csv.gz",
  }),
  Object.freeze({
    objectId: "gabaergic",
    sourceFileName: "GSE318731_P56_gabaergic_multiome.rds",
    sourceRdsBytes: 1646402816,
    nucleusCount: 73364,
    sourceScopedGroupCount: 24,
    receiptFileName: "GSE318731_gabaergic_multiome.metadata.receipt.json",
    rawMetadataFileName: "GSE318731_gabaergic_multiome.metadata.csv.gz",
    cleanRoomReceiptFileName: "GSE318731_P56_gabaergic_multiome.audit.json",
    cleanRoomRawMetadataFileName:
      "GSE318731_P56_gabaergic_multiome.metadata.csv.gz",
  }),
  Object.freeze({
    objectId: "glutamatergic",
    sourceFileName: "GSE318731_P56_glutamatergic_multiome_UPDATE.rds",
    sourceRdsBytes: 1832005077,
    nucleusCount: 92782,
    sourceScopedGroupCount: 28,
    receiptFileName: "GSE318731_glutamatergic_multiome.metadata.receipt.json",
    rawMetadataFileName: "GSE318731_glutamatergic_multiome.metadata.csv.gz",
    cleanRoomReceiptFileName:
      "GSE318731_P56_glutamatergic_multiome_UPDATE.audit.json",
    cleanRoomRawMetadataFileName:
      "GSE318731_P56_glutamatergic_multiome_UPDATE.metadata.csv.gz",
  }),
]);
const DECISIONS = Object.freeze([
  "CONFIRMED_INTERNEURON",
  "EXCLUDED_MOTOR",
  "EXCLUDED_SENSORY_SCOPE",
  "EXCLUDED_PROJECTION_LOCAL_STATUS_UNRESOLVED",
  "EXCLUDED_AMBIGUOUS_OR_PROJECTION_EXCEPTION_UNRESOLVED",
]);
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
const METADATA_FIELD_AVAILABILITY_ORDER = Object.freeze([
  "groups",
  "neuron_types",
  "source",
  "anatomy",
  "Sex",
]);

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

function jsonEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function decisionMap(sourceObject) {
  return Object.fromEntries(
    (sourceObject?.decisionCounts ?? []).map(({ decision, count }) => [
      decision,
      count,
    ]),
  );
}

function stableProfileId(rawLabel) {
  const digest = createHash("sha256").update(rawLabel, "utf8").digest("hex");
  return `cano.gomez.p56.chol_in.sha256.${digest.slice(0, 24)}`;
}

async function compileSchema() {
  const schema = JSON.parse(await readFile(SCHEMA_PATH, "utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  return ajv.compile(schema);
}

function formatSchemaErrors(errors = []) {
  return errors.map(
    (error) => `${error.instancePath || "/"}: ${error.message ?? "schema violation"}`,
  );
}

function csvShape(uncompressedBytes, context) {
  const text = new TextDecoder("utf-8", { fatal: true }).decode(
    uncompressedBytes,
  );
  let field = "";
  let row = [];
  let header = null;
  let rowCount = 0;
  let inQuotedField = false;
  let afterClosingQuote = false;
  let atFieldStart = true;

  const finishField = () => {
    row.push(field);
    field = "";
    atFieldStart = true;
    afterClosingQuote = false;
  };
  const finishRow = () => {
    finishField();
    if (header === null) {
      header = row;
    } else {
      if (row.length !== header.length) {
        throw new Error(`${context} has a row/header width mismatch`);
      }
      rowCount += 1;
    }
    row = [];
  };

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (inQuotedField) {
      if (character !== '"') {
        field += character;
      } else if (text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotedField = false;
        afterClosingQuote = true;
      }
      continue;
    }
    if (afterClosingQuote) {
      if (character === ",") {
        finishField();
      } else if (character === "\n") {
        finishRow();
      } else {
        throw new Error(`${context} has content after a closing quote`);
      }
      continue;
    }
    if (atFieldStart && character === '"') {
      inQuotedField = true;
      atFieldStart = false;
    } else if (character === ",") {
      finishField();
    } else if (character === "\n") {
      finishRow();
    } else if (character === "\r") {
      throw new Error(`${context} uses an unexpected carriage return`);
    } else if (character === '"') {
      throw new Error(`${context} has a quote in an unquoted field`);
    } else {
      field += character;
      atFieldStart = false;
    }
  }
  if (inQuotedField) throw new Error(`${context} ends inside a quoted field`);
  if (row.length > 0 || field.length > 0 || afterClosingQuote) finishRow();
  if (header === null) throw new Error(`${context} has no header row`);
  return { header, rowCount };
}

async function validateArtifactFile(artifact, directory) {
  const filePath = path.join(directory, artifact.fileName);
  const compressed = await readFile(filePath);
  const compressedSha256 = createHash("sha256")
    .update(compressed)
    .digest("hex");
  if (
    compressed.length !== artifact.compressedBytes ||
    compressedSha256 !== artifact.compressedSha256
  ) {
    throw new Error(
      `${artifact.fileName} compressed byte/checksum receipt mismatch`,
    );
  }
  let uncompressed;
  try {
    uncompressed = gunzipSync(compressed);
  } catch (error) {
    throw new Error(`${artifact.fileName} is not valid gzip: ${error.message}`);
  }
  const uncompressedSha256 = createHash("sha256")
    .update(uncompressed)
    .digest("hex");
  if (
    uncompressed.length !== artifact.uncompressedBytes ||
    uncompressedSha256 !== artifact.uncompressedSha256
  ) {
    throw new Error(
      `${artifact.fileName} uncompressed byte/checksum receipt mismatch`,
    );
  }
  const shape = csvShape(uncompressed, artifact.fileName);
  if (
    shape.rowCount !== artifact.rowCount ||
    shape.header.length !== artifact.columnCount ||
    !jsonEqual(shape.header, artifact.orderedColumnNames)
  ) {
    throw new Error(`${artifact.fileName} CSV header/row receipt mismatch`);
  }
}

function validateSources(registry, errors) {
  const identityMode = registry.identityAuthority?.mode;
  const isRIdentityMode = identityMode === "R_SEURAT_OBJECT_IDENTITY_VERIFIED";
  const isPythonCleanRoomMode =
    identityMode === "PYTHON_RDATA_META_DATA_ROW_ONLY";
  const isBaseRStreamMode =
    identityMode === "BASE_R_STREAM_META_DATA_ROW_ONLY";
  const isRowOnlyMode = isPythonCleanRoomMode || isBaseRStreamMode;
  check(
    isRIdentityMode || isRowOnlyMode,
    "identity authority mode changed",
    errors,
  );
  check(
    registry.inputReceipts?.authorityMode === identityMode,
    "input receipt authority does not match the registry identity authority",
    errors,
  );
  check(
    registry.identityAuthority?.metaDataRowNamesUniqueNonemptyVerified === true &&
      registry.identityAuthority?.sameCellAssertionAdmitted === false,
    "stable row-name or same-cell authority boundary changed",
    errors,
  );
  check(
    registry.identityAuthority?.crossAssayCellIdentityVerified ===
      isRIdentityMode,
    "cross-assay identity receipt does not match its authority mode",
    errors,
  );
  check(
    isRIdentityMode
      ? registry.inputReceipts?.combinedReceiptFileName ===
          "GSE318731_multiome_metadata.combined.receipt.json" &&
          typeof registry.inputReceipts?.combinedReceiptSha256 === "string"
      : registry.inputReceipts?.combinedReceiptFileName === null &&
          registry.inputReceipts?.combinedReceiptSha256 === null,
    "combined receipt availability does not match its authority mode",
    errors,
  );
  check(
    isRIdentityMode
      ? /object Cells.*assay colnames/i.test(
          registry.identityAuthority?.boundary ?? "",
        )
      : /only unique non-empty meta\.data row names/i.test(
          registry.identityAuthority?.boundary ?? "",
        ) && /no cross-assay or same-cell claim/i.test(
          registry.identityAuthority?.boundary ?? "",
        ),
    "identity-authority boundary text changed",
    errors,
  );
  if (isRIdentityMode) {
    check(
      registry.metadataFieldCoverage?.mode ===
        "ALL_SUPPORTED_META_DATA_COLUMNS_FROM_STRICT_R_EXTRACTOR" &&
        ["compound_nucleus_key", "source_nucleus_id", "groups", "neuron_types"].every(
          (field) =>
            registry.metadataFieldCoverage?.preservedContractedColumns?.includes(
              field,
            ),
        ),
      "strict R metadata-field coverage changed",
      errors,
    );
  } else {
    check(
      registry.metadataFieldCoverage?.mode ===
        "CONTRACTED_ASSIGNMENT_CONTEXT_COLUMNS_ONLY" &&
        jsonEqual(registry.metadataFieldCoverage?.preservedContractedColumns, [
          "nucleus_id",
          "transmitter_class",
          "group",
          "neuron_type",
          "source",
          "anatomy",
          "sex",
        ]) &&
        /complete row assignment audit, not a copy of every original meta\.data column/i.test(
          registry.metadataFieldCoverage?.boundary ?? "",
        ),
      "clean-room contracted metadata-field coverage changed",
      errors,
    );
  }
  check(
    registry.sourceReferences?.dataRepository?.accession === "GSE318731" &&
      registry.sourceReferences?.dataRepository?.url ===
        "https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE318731",
    "GEO source reference changed",
    errors,
  );
  check(
    registry.sourceReferences?.publication?.doi ===
      "10.64898/2026.06.11.731752" &&
      registry.sourceReferences?.publication?.articleUrl ===
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC13308138/" &&
      registry.sourceReferences?.publication?.articleLicense ===
        "CC-BY-NC-4.0",
    "publication source reference changed",
    errors,
  );
  check(
    /not generalized.*redistribution licence/i.test(
      registry.sourceReferences?.publication?.rightsBoundary ?? "",
    ) && /does not bundle the source RDS files/i.test(
      registry.sourceReferences?.publication?.rightsBoundary ?? "",
    ),
    "article licence must retain the separate GEO-RDS rights boundary",
    errors,
  );
  check(
    registry.sourceObjects?.length === SOURCE_SPECS.length,
    "source-object denominator must remain three",
    errors,
  );
  check(
    registry.inputReceipts?.sourceObjects?.length === SOURCE_SPECS.length,
    "source-receipt denominator must remain three",
    errors,
  );
  for (let index = 0; index < SOURCE_SPECS.length; index += 1) {
    const expected = SOURCE_SPECS[index];
    const source = registry.sourceObjects?.[index];
    const receipt = registry.inputReceipts?.sourceObjects?.[index];
    check(source?.objectId === expected.objectId, `${expected.objectId} source order/id changed`, errors);
    check(
      source?.sourceFileName === expected.sourceFileName,
      `${expected.objectId} source filename changed`,
      errors,
    );
    check(
      source?.sourceRdsBytes === expected.sourceRdsBytes,
      `${expected.objectId} source byte receipt changed`,
      errors,
    );
    check(
      source?.nucleusCount === expected.nucleusCount,
      `${expected.objectId} nucleus denominator changed`,
      errors,
    );
    check(
      source?.sourceScopedGroupCount === expected.sourceScopedGroupCount,
      `${expected.objectId} group denominator changed`,
      errors,
    );
    check(
      receipt?.objectId === expected.objectId,
      `${expected.objectId} input receipt locator changed`,
      errors,
    );
    if (isRIdentityMode) {
      check(
        receipt?.receiptKind === "r_seurat_object_identity_receipt" &&
          receipt?.receiptFileName === expected.receiptFileName &&
          receipt?.rawMetadataFileName === expected.rawMetadataFileName,
        `${expected.objectId} R/Seurat receipt locator changed`,
        errors,
      );
    } else if (isPythonCleanRoomMode) {
      check(
        receipt?.receiptKind ===
          "python_rdata_meta_data_row_only_receipt" &&
          receipt?.receiptFileName === expected.cleanRoomReceiptFileName &&
          receipt?.rawMetadataFileName ===
            expected.cleanRoomRawMetadataFileName,
        `${expected.objectId} Python/rdata clean-room receipt locator changed`,
        errors,
      );
    } else {
      check(
        receipt?.receiptKind ===
          "base_r_stream_meta_data_row_only_receipt" &&
          receipt?.receiptFileName === expected.cleanRoomReceiptFileName &&
          receipt?.rawMetadataFileName ===
            expected.cleanRoomRawMetadataFileName,
        `${expected.objectId} base-R stream receipt locator changed`,
        errors,
      );
    }
    check(
      source?.identityAuthorityMode === identityMode &&
        source?.crossAssayCellIdentityVerified === isRIdentityMode,
      `${expected.objectId} identity authority changed`,
      errors,
    );
    const counts = decisionMap(source);
    check(
      Object.keys(counts).length === DECISIONS.length &&
        DECISIONS.every((decision) => Object.hasOwn(counts, decision)),
      `${expected.objectId} must report every decision exactly once`,
      errors,
    );
    check(
      sum(Object.values(counts)) === expected.nucleusCount,
      `${expected.objectId} decision counts do not partition its nuclei`,
      errors,
    );
    if (expected.objectId === "cholinergic") {
      check(counts.CONFIRMED_INTERNEURON > 0, "CHOL_IN confirmed denominator must be positive", errors);
      check(counts.EXCLUDED_MOTOR > 0, "cholinergic motor exclusion denominator must be positive", errors);
      check(
        counts.EXCLUDED_SENSORY_SCOPE === 0 &&
          counts.EXCLUDED_PROJECTION_LOCAL_STATUS_UNRESOLVED === 0 &&
          counts.EXCLUDED_AMBIGUOUS_OR_PROJECTION_EXCEPTION_UNRESOLVED === 0,
        "cholinergic rows may only be CHOL_IN-confirmed or exact motor exclusions",
        errors,
      );
    } else if (expected.objectId === "gabaergic") {
      check(counts.EXCLUDED_SENSORY_SCOPE > 0, "Pkd2l1 sensory exclusion denominator must be positive", errors);
      check(
        counts.EXCLUDED_AMBIGUOUS_OR_PROJECTION_EXCEPTION_UNRESOLVED > 0,
        "remaining GABA denominator must stay unresolved",
        errors,
      );
      check(
        counts.CONFIRMED_INTERNEURON === 0 &&
          counts.EXCLUDED_MOTOR === 0 &&
          counts.EXCLUDED_PROJECTION_LOCAL_STATUS_UNRESOLVED === 0,
        "GABA rows must not be promoted from transmitter identity",
        errors,
      );
    } else {
      check(
        counts.EXCLUDED_PROJECTION_LOCAL_STATUS_UNRESOLVED ===
          expected.nucleusCount &&
          DECISIONS.filter(
            (decision) =>
              decision !== "EXCLUDED_PROJECTION_LOCAL_STATUS_UNRESOLVED",
          ).every((decision) => counts[decision] === 0),
        "every GLUT row must remain projection/local-status unresolved",
        errors,
      );
    }
  }
}

function validateArtifacts(registry, errors) {
  const [audit, confirmed] = registry.artifacts ?? [];
  check(
    audit?.artifactKind === "all_nucleus_assignment_audit" &&
      audit?.fileName === "GSE318731_all_nucleus_assignment_audit.csv.gz",
    "all-nucleus audit artifact changed",
    errors,
  );
  check(
    confirmed?.artifactKind === "confirmed_interneuron_nucleus_roster" &&
      confirmed?.fileName ===
        "GSE318731_confirmed_interneuron_nucleus_roster.csv.gz",
    "confirmed-roster artifact changed",
    errors,
  );
  check(
    audit?.rowCount === registry.denominatorReconciliation?.sourceTotalNucleusCount,
    "all-nucleus audit does not cover the full denominator",
    errors,
  );
  check(
    confirmed?.rowCount ===
      registry.denominatorReconciliation?.confirmedInterneuronNucleusCount,
    "confirmed-roster row count changed",
    errors,
  );
  check(
    jsonEqual(audit?.orderedColumnNames, confirmed?.orderedColumnNames),
    "audit and confirmed roster headers must remain identical",
    errors,
  );
  check(
    jsonEqual(
      audit?.orderedColumnNames?.slice(-APPENDED_AUDIT_COLUMNS.length),
      APPENDED_AUDIT_COLUMNS,
    ),
    "classification/audit column suffix changed",
    errors,
  );
  for (const required of [
    "source_accession",
    "source_file_name",
    "compound_nucleus_key",
    "source_nucleus_id",
    "groups",
    "neuron_types",
  ]) {
    check(
      audit?.orderedColumnNames?.includes(required),
      `artifact header lacks ${required}`,
      errors,
    );
  }
}

function validateProfiles(registry, errors) {
  const profiles = registry.profiles ?? [];
  const availabilityBySourceObjectId = new Map(
    (registry.sourceObjects ?? []).map((source) => [
      source.objectId,
      new Map(
        (source.metadataFieldAvailability ?? []).map((receipt) => [
          receipt.field,
          receipt,
        ]),
      ),
    ]),
  );
  check(
    new Set(profiles.map((profile) => profile.profileId)).size === profiles.length,
    "profile identifiers must be unique",
    errors,
  );
  check(
    new Set(profiles.map((profile) => profile.sourceLocalLabel)).size ===
      profiles.length,
    "raw profile labels must be unique",
    errors,
  );
  check(
    sum(profiles.map((profile) => profile.nucleusCount)) ===
      registry.denominatorReconciliation?.confirmedInterneuronNucleusCount,
    "profile denominators do not sum to confirmed nuclei",
    errors,
  );
  for (const profile of profiles) {
    check(
      profile.profileId === stableProfileId(profile.sourceLocalLabel),
      `${profile.sourceLocalLabel} stable profile id changed`,
      errors,
    );
    check(
      profile.rosterLink?.filterEquals === profile.profileId,
      `${profile.sourceLocalLabel} roster filter no longer resolves its profile id`,
      errors,
    );
    check(
      jsonEqual(
        profile.contextFieldCounts?.map(({ field }) => field),
        ["anatomy", "source", "Sex"],
      ),
      `${profile.sourceLocalLabel} context field order changed`,
      errors,
    );
    for (const context of profile.contextFieldCounts ?? []) {
      const availability = availabilityBySourceObjectId
        .get(profile.sourceObjectId)
        ?.get(context.field);
      if (availability !== undefined) {
        const expectedStatus = availability.sourceColumnPresent
          ? "SOURCE_FIELD_PRESENT"
          : "SOURCE_FIELD_UNAVAILABLE";
        check(
          context.status === expectedStatus,
          `${profile.sourceLocalLabel} ${context.field} status disagrees with source-object metadata availability`,
          errors,
        );
      }
      const represented =
        context.missingCount +
        context.emptyCount +
        sum((context.counts ?? []).map(({ count }) => count));
      check(
        represented === profile.nucleusCount,
        `${profile.sourceLocalLabel} ${context.field} counts do not partition nuclei`,
        errors,
      );
      if (context.status === "SOURCE_FIELD_UNAVAILABLE") {
        check(
          context.missingCount === profile.nucleusCount &&
            context.emptyCount === 0 &&
            context.counts.length === 0,
          `${profile.sourceLocalLabel} unavailable ${context.field} must remain wholly missing`,
          errors,
        );
      }
    }
    check(
      Object.values(profile.geometryAuthority ?? {}).every((value) => value === 0),
      `${profile.sourceLocalLabel} gained unsupported model authority`,
      errors,
    );
  }
}

function validateDenominators(registry, errors) {
  const denominator = registry.denominatorReconciliation;
  const sources = registry.sourceObjects ?? [];
  const totalDecisionCounts = Object.fromEntries(
    DECISIONS.map((decision) => [
      decision,
      sum(sources.map((source) => decisionMap(source)[decision] ?? 0)),
    ]),
  );
  check(
    sum(sources.map((source) => source.nucleusCount)) ===
      denominator?.sourceTotalNucleusCount,
    "source-object nuclei do not sum to the total denominator",
    errors,
  );
  check(
    sum(sources.map((source) => source.sourceScopedGroupCount)) ===
      denominator?.sourceScopedGroupCount,
    "source-object groups do not sum to the source-scoped denominator",
    errors,
  );
  const fieldByDecision = {
    CONFIRMED_INTERNEURON: "confirmedInterneuronNucleusCount",
    EXCLUDED_MOTOR: "excludedMotorNucleusCount",
    EXCLUDED_SENSORY_SCOPE: "excludedSensoryScopeNucleusCount",
    EXCLUDED_PROJECTION_LOCAL_STATUS_UNRESOLVED:
      "excludedProjectionLocalStatusUnresolvedNucleusCount",
    EXCLUDED_AMBIGUOUS_OR_PROJECTION_EXCEPTION_UNRESOLVED:
      "excludedAmbiguousOrProjectionExceptionUnresolvedNucleusCount",
  };
  for (const [decision, field] of Object.entries(fieldByDecision)) {
    check(
      denominator?.[field] === totalDecisionCounts[decision],
      `${field} does not match derived decision counts`,
      errors,
    );
  }
  check(
    denominator?.confirmedInterneuronProfileCount === registry.profiles?.length,
    "confirmed profile denominator changed",
    errors,
  );
  check(
    denominator?.paperReportedNeuronTypeCount === 516 &&
      denominator?.paperReportedTypeCountUsedAsInterneuronDenominator === false,
    "reported 516 types must remain reconciliation-only",
    errors,
  );
  check(
    denominator?.perNucleusNonNeuronalExcludedCount === null,
    "per-nucleus non-neuronal count must remain unavailable, not zero",
    errors,
  );
  for (const field of [
    "generatedGeometryCount",
    "internalStructureObjectCount",
    "sameCellLinkCount",
    "atlasRegistrationCount",
  ]) {
    check(denominator?.[field] === 0, `${field} must remain zero`, errors);
  }
}

function validateMetadataFieldAvailability(registry, errors) {
  const baseRMode =
    registry.identityAuthority?.mode === "BASE_R_STREAM_META_DATA_ROW_ONLY";
  for (const source of registry.sourceObjects ?? []) {
    const availability = source.metadataFieldAvailability;
    if (!baseRMode && availability === undefined) continue;
    check(
      jsonEqual(
        availability?.map(({ field }) => field),
        METADATA_FIELD_AVAILABILITY_ORDER,
      ),
      `${source.objectId} metadata field-availability order changed`,
      errors,
    );
    const presentIndexes = [];
    for (const receipt of availability ?? []) {
      const required = ["groups", "neuron_types"].includes(receipt.field);
      const knownAbsentAssignment = baseRMode && source.objectId === "glutamatergic" &&
        source.sourceRdsSha256 === "ff3784791ccb5d23311b9d0a8e2a4bd09dd251f75d0a2fc4b30e762dcef29c92" &&
        receipt.field === "neuron_types" && receipt.sourceColumnPresent === false;
      check(
        receipt.requirement ===
          (knownAbsentAssignment ? "SOURCE_ABSENT_ASSIGNMENT" : required ? "REQUIRED_ASSIGNMENT" : "OPTIONAL_CONTEXT") &&
          receipt.rowCount === source.nucleusCount &&
          Number.isInteger(receipt.sourceMissingCount) &&
          receipt.sourceMissingCount >= 0 &&
          Number.isInteger(receipt.sourceEmptyStringCount) &&
          receipt.sourceEmptyStringCount >= 0 &&
          Number.isInteger(receipt.sourceWhitespaceOnlyCount) &&
          receipt.sourceWhitespaceOnlyCount >= 0 &&
          Number.isInteger(receipt.observedNonemptyUniqueCount) &&
          receipt.observedNonemptyUniqueCount >= 0 &&
          receipt.sourceMissingCount + receipt.sourceEmptyStringCount <=
            source.nucleusCount &&
          receipt.sourceWhitespaceOnlyCount <=
            source.nucleusCount -
              receipt.sourceMissingCount -
              receipt.sourceEmptyStringCount &&
          receipt.observedNonemptyUniqueCount <=
            source.nucleusCount -
              receipt.sourceMissingCount -
              receipt.sourceEmptyStringCount,
        `${source.objectId} ${receipt.field} availability counts changed`,
        errors,
      );
      if (receipt.sourceColumnPresent) {
        presentIndexes.push(receipt.sourceColumnIndex);
        check(
          Number.isInteger(receipt.sourceColumnIndex) &&
            receipt.sourceColumnIndex >= 1 &&
            receipt.emissionMode === "PRESERVED_SOURCE_COLUMN_VALUES" &&
            receipt.sourceColumnAbsenceReason === null,
          `${source.objectId} ${receipt.field} present-source receipt changed`,
          errors,
        );
      } else {
        check(
          (!required || knownAbsentAssignment) &&
            receipt.sourceColumnIndex === null &&
            receipt.emissionMode ===
              "SOURCE_COLUMN_ABSENT_EMITTED_AS_SOURCE_NA" &&
            receipt.sourceColumnAbsenceReason ===
              "source_meta_data_column_absent" &&
            receipt.sourceMissingCount === source.nucleusCount &&
            receipt.sourceEmptyStringCount === 0 &&
            receipt.sourceWhitespaceOnlyCount === 0 &&
            receipt.observedNonemptyUniqueCount === 0,
          `${source.objectId} ${receipt.field} absent-source receipt gained a silent default`,
          errors,
        );
      }
    }
    check(
      new Set(presentIndexes).size === presentIndexes.length,
      `${source.objectId} source-column indexes are not unique`,
      errors,
    );
  }
}

function validateBoundaries(registry, errors) {
  const text = (registry.hardBoundaries ?? []).join("\n");
  for (const [pattern, label] of [
    [/Only rows whose exact source `groups` value is `CHOL_IN`/i, "CHOL_IN-only admission"],
    [/GABA identity is not an interneuron flag/i, "no-GABA-inference"],
    [/projection-versus-local interneuron status is unresolved/i, "GLUT unresolved"],
    [/516 neuronal-type denominator.*never asserted as an interneuron denominator/i, "516 reconciliation"],
    [/not trimmed, repaired, or converted into marker claims/i, "raw-label preservation"],
    [/absent optional context column remains source NA.*never inferred.*biological absence/i, "optional-context absence"],
    [/no per-nucleus non-neuronal flag or zero-valued exclusion denominator/i, "non-neuronal missingness"],
    [/no morphology, generated geometry, intracellular structure/i, "model-authority boundary"],
    [/do not establish cross-source canonical identity/i, "source-local identity"],
  ]) {
    check(pattern.test(text), `missing ${label} boundary`, errors);
  }
}

export async function validateCanoGomezP56MultiomeInterneuronRegistry(registry) {
  const errors = [];
  const validateSchema = await compileSchema();
  if (!validateSchema(registry)) errors.push(...formatSchemaErrors(validateSchema.errors));
  validateSources(registry, errors);
  validateArtifacts(registry, errors);
  validateProfiles(registry, errors);
  validateDenominators(registry, errors);
  validateMetadataFieldAvailability(registry, errors);
  validateBoundaries(registry, errors);
  if (errors.length > 0) {
    throw new Error(`Cano-Gomez registry validation failed:\n- ${errors.join("\n- ")}`);
  }
  return {
    releaseId: registry.releaseId,
    sourceNucleusCount: registry.denominatorReconciliation.sourceTotalNucleusCount,
    confirmedInterneuronNucleusCount:
      registry.denominatorReconciliation.confirmedInterneuronNucleusCount,
    confirmedInterneuronProfileCount:
      registry.denominatorReconciliation.confirmedInterneuronProfileCount,
    perNucleusNonNeuronalExcludedCount:
      registry.denominatorReconciliation.perNucleusNonNeuronalExcludedCount,
    generatedGeometryCount:
      registry.denominatorReconciliation.generatedGeometryCount,
  };
}

export async function validateCanoGomezRegistryImportMirror(
  registryPath = DEFAULT_DATA_PATH,
  mirrorPath = CANO_GOMEZ_IMPORT_MIRROR_PATH,
) {
  const [canonicalBytes, mirrorBytes] = await Promise.all([
    readFile(registryPath),
    readFile(mirrorPath),
  ]);
  if (!canonicalBytes.equals(mirrorBytes)) {
    throw new Error("Cano-Gomez import mirror differs from canonical registry bytes; regenerate with the Cano builder --sync-import-mirror");
  }
  return { bytes: mirrorBytes.length, sha256: createHash("sha256").update(mirrorBytes).digest("hex") };
}

export async function validateCanoGomezP56MultiomeInterneuronRegistryPackage(
  registryPath,
  options = {},
) {
  const resolvedRegistryPath = path.resolve(registryPath);
  const registry = JSON.parse(await readFile(resolvedRegistryPath, "utf8"));
  const report = await validateCanoGomezP56MultiomeInterneuronRegistry(registry);
  const directory = path.dirname(resolvedRegistryPath);
  for (const artifact of registry.artifacts) {
    await validateArtifactFile(artifact, directory);
  }
  const importMirrorPath = Object.hasOwn(options, "importMirrorPath")
    ? options.importMirrorPath
    : resolvedRegistryPath === DEFAULT_DATA_PATH ? CANO_GOMEZ_IMPORT_MIRROR_PATH : null;
  if (importMirrorPath !== null) {
    await validateCanoGomezRegistryImportMirror(resolvedRegistryPath, importMirrorPath);
  }
  return { ...report, artifactsVerified: registry.artifacts.length };
}

async function main() {
  const dataPath = path.resolve(process.argv[2] ?? DEFAULT_DATA_PATH);
  const report =
    await validateCanoGomezP56MultiomeInterneuronRegistryPackage(dataPath);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
