import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { gunzipSync, gzipSync } from "node:zlib";

import {
  validateCanoGomezP56MultiomeInterneuronRegistry,
  validateCanoGomezP56MultiomeInterneuronRegistryPackage,
} from "../scripts/validate-cano-gomez-p56-multiome-interneuron-registry-0.1.mjs";
import {
  BASE_R_STREAM_IDENTITY_AUTHORITY,
  CANO_GOMEZ_COMPOUND_KEY_EXPRESSION,
  CANO_GOMEZ_DECISIONS,
  CANO_GOMEZ_EXPECTED_TOTAL_NUCLEI,
  CANO_GOMEZ_EXPECTED_TOTAL_SOURCE_SCOPED_GROUPS,
  CANO_GOMEZ_MOTOR_GROUPS,
  CANO_GOMEZ_OUTPUT_FILES,
  CANO_GOMEZ_SOURCE_SPECS,
  buildCanoGomezP56MultiomeInterneuronRegistry,
  classifyCanoGomezAssignment,
  stableCanoGomezProfileId,
} from "../tools/build_cano_gomez_p56_multiome_interneuron_registry.mjs";

const FIXTURE_SPEC = JSON.parse(
  await readFile(
    new URL("./fixtures/cano-gomez-p56-multiome/fixture-spec.json", import.meta.url),
    "utf8",
  ),
);
const HEADER = [
  "source_accession",
  "source_file_name",
  "compound_nucleus_key",
  "source_nucleus_id",
  "source_active_assay",
  "source_active_ident",
  "groups",
  "neuron_types",
  "anatomy",
  "source",
  "Sex",
];

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function sha256Lines(values) {
  return sha256(Buffer.from(`${values.join("\n")}\n`, "utf8"));
}

function compareUtf8(left, right) {
  return Buffer.from(left).compare(Buffer.from(right));
}

function countRows(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts]
    .sort(([left], [right]) => compareUtf8(left, right))
    .map(([value, count]) => ({ value, count }));
}

function profile(values, columnName, columnIndex) {
  return {
    source_column_index: columnIndex,
    column_name: columnName,
    typeof: "character",
    storage_mode: "character",
    class: ["character"],
    is_factor: false,
    is_ordered_factor: false,
    factor_levels: [],
    row_count: values.length,
    observed_non_missing_count: values.length,
    observed_unique_count: new Set(values).size,
    na_count: 0,
    empty_string_count: values.filter((value) => value === "").length,
    whitespace_only_count: values.filter(
      (value) => value !== "" && value.trim() === "",
    ).length,
    zero_count_levels: [],
    observed_value_counts: countRows(values),
  };
}

function quote(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function csv(rows) {
  const lines = [HEADER.map(quote).join(",")];
  for (const row of rows) lines.push(HEADER.map((field) => quote(row[field])).join(","));
  return Buffer.from(`${lines.join("\n")}\n`, "utf8");
}

function makeRow(spec, sourceNucleusId, groups, neuronTypes, index) {
  return {
    source_accession: "GSE318731",
    source_file_name: spec.sourceFileName,
    compound_nucleus_key: `GSE318731|${spec.sourceFileName}|${sourceNucleusId}`,
    source_nucleus_id: sourceNucleusId,
    source_active_assay: "RNA",
    source_active_ident: groups,
    groups,
    neuron_types: neuronTypes,
    anatomy: index % 2 === 0 ? "cervical" : "lumbar",
    source: index % 3 === 0 ? "female_pool" : "mixed_pool",
    Sex: index % 3 === 0 ? "F" : index % 3 === 1 ? "M" : "NA",
  };
}

function fixtureRowsFor(spec) {
  const rows = [];
  let index = 0;
  const add = (groups, neuronTypes, count) => {
    for (let offset = 0; offset < count; offset += 1) {
      const sourceNucleusId = `${spec.objectId}-${String(index + 1).padStart(6, "0")}`;
      rows.push(makeRow(spec, sourceNucleusId, groups, neuronTypes, index));
      index += 1;
    }
  };

  if (spec.objectId === "cholinergic") {
    for (const item of FIXTURE_SPEC.confirmedProfiles) {
      add("CHOL_IN", item.label, item.count);
    }
    for (const item of FIXTURE_SPEC.motorGroups) {
      add(item.group, `${item.group}_type`, item.count);
    }
  } else if (spec.objectId === "gabaergic") {
    add(
      "GABA_CSF-cN_Pkd2l1",
      "GABA_CSF-cN_Pkd2l1_type",
      FIXTURE_SPEC.gabaSensoryCount,
    );
    const remaining = spec.nucleusCount - FIXTURE_SPEC.gabaSensoryCount;
    for (let offset = 0; offset < remaining; offset += 1) {
      const groupIndex = offset % FIXTURE_SPEC.gabaRemainingGroupCount;
      const group = `GABA_fixture_${String(groupIndex + 1).padStart(2, "0")}`;
      add(group, `${group}_type`, 1);
    }
  } else {
    for (let offset = 0; offset < spec.nucleusCount; offset += 1) {
      const groupIndex = offset % FIXTURE_SPEC.glutGroupCount;
      const group = `GLUT_fixture_${String(groupIndex + 1).padStart(2, "0")}`;
      add(group, `${group}_type`, 1);
    }
  }
  assert.equal(rows.length, spec.nucleusCount);
  return rows;
}

function sourceReceipt(spec, rows, plain, compressed) {
  const nuclei = rows.map((row) => row.source_nucleus_id);
  const keys = rows.map((row) => row.compound_nucleus_key);
  const groups = rows.map((row) => row.groups);
  const types = rows.map((row) => row.neuron_types);
  const observedGroups = [...new Set(groups)].sort(compareUtf8);
  const observedTypes = [...new Set(types)].sort(compareUtf8);
  assert.equal(observedGroups.length, spec.groupCount);
  return {
    format_version: "1.0.0",
    receipt_kind: "cano_gomez_multiome_raw_metadata_source_receipt",
    accession: "GSE318731",
    source: {
      file_name: spec.sourceFileName,
      public_url: spec.publicUrl,
      expected_bytes: spec.sourceBytes,
      observed_bytes: spec.sourceBytes,
      sha256: sha256(Buffer.from(`fixture source ${spec.objectId}`)),
    },
    source_object: {
      object_id: spec.objectId,
      expected_nucleus_count: spec.nucleusCount,
      observed_nucleus_count: spec.nucleusCount,
      meta_data_row_names_nonempty: true,
      meta_data_row_names_unique: true,
      ordered_row_names_sha256: sha256Lines(nuclei),
      cells_match_meta_data_row_names_exactly: true,
      object_colnames_match_meta_data_row_names_exactly: true,
      assays: [
        {
          assay_name: "RNA",
          cell_count: spec.nucleusCount,
          colnames_match_meta_data_row_names_exactly: true,
          ordered_colnames_sha256: sha256Lines(nuclei),
        },
      ],
      active_assay: "RNA",
      active_ident_names_match_meta_data_row_names_exactly: true,
      active_ident_profile: profile(groups, "active_ident", 0),
    },
    raw_label_denominators: {
      group_column: "groups",
      expected_group_count: spec.groupCount,
      observed_group_count: spec.groupCount,
      observed_group_labels: observedGroups,
      neuron_type_column: "neuron_types",
      observed_non_missing_non_empty_type_count: observedTypes.length,
      observed_type_labels: observedTypes,
      groups_profile: profile(groups, "groups", HEADER.indexOf("groups") + 1),
      neuron_types_profile: profile(
        types,
        "neuron_types",
        HEADER.indexOf("neuron_types") + 1,
      ),
    },
    metadata_columns: [],
    roster: {
      file_name: spec.rawMetadataFileName,
      media_type: "text/csv",
      content_encoding: "gzip",
      deterministic_compression: "gzip -n -9 -c",
      row_count: spec.nucleusCount,
      column_count: HEADER.length,
      ordered_column_names: HEADER,
      compound_key_expression: CANO_GOMEZ_COMPOUND_KEY_EXPRESSION,
      ordered_compound_keys_sha256: sha256Lines(keys),
      uncompressed_bytes: plain.length,
      uncompressed_sha256: sha256(plain),
      compressed_bytes: compressed.length,
      compressed_sha256: sha256(compressed),
    },
    scope_boundaries: {
      raw_labels_preserved: true,
      classification_inference_applied: false,
      label_normalization_applied: false,
      reported_516_type_denominator_hard_assertion_applied: false,
    },
  };
}

async function writeFixtureExtraction(directory) {
  const summaries = [];
  const allGroups = [];
  const allTypes = [];
  for (const spec of CANO_GOMEZ_SOURCE_SPECS) {
    const rows = fixtureRowsFor(spec);
    const plain = csv(rows);
    const compressed = gzipSync(plain, { level: 9, mtime: 0 });
    await writeFile(join(directory, spec.rawMetadataFileName), compressed);
    const receipt = sourceReceipt(spec, rows, plain, compressed);
    const receiptBytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
    await writeFile(join(directory, spec.receiptFileName), receiptBytes);
    summaries.push({
      object_id: spec.objectId,
      source_file_name: spec.sourceFileName,
      nucleus_count: spec.nucleusCount,
      group_count: spec.groupCount,
      roster_file_name: spec.rawMetadataFileName,
      roster_sha256: receipt.roster.compressed_sha256,
      receipt_file_name: spec.receiptFileName,
      receipt_sha256: sha256(receiptBytes),
    });
    allGroups.push(...receipt.raw_label_denominators.observed_group_labels.map(
      (group) => `${spec.sourceFileName}|${group}`,
    ));
    allTypes.push(...receipt.raw_label_denominators.observed_type_labels);
  }
  const typeUnion = [...new Set(allTypes)].sort(compareUtf8);
  const scopedGroups = [...new Set(allGroups)].sort(compareUtf8);
  const combined = {
    format_version: "1.0.0",
    receipt_kind: "cano_gomez_multiome_raw_metadata_combined_receipt",
    accession: "GSE318731",
    source_objects: summaries,
    asserted_denominators: {
      nucleus_counts_by_source: {
        cholinergic: 3199,
        gabaergic: 73364,
        glutamatergic: 92782,
      },
      total_nucleus_count: CANO_GOMEZ_EXPECTED_TOTAL_NUCLEI,
      group_counts_by_source: {
        cholinergic: 5,
        gabaergic: 24,
        glutamatergic: 28,
      },
      total_source_scoped_group_count:
        CANO_GOMEZ_EXPECTED_TOTAL_SOURCE_SCOPED_GROUPS,
      observed_source_scoped_group_keys: scopedGroups,
      observed_raw_group_label_union_count: new Set(
        scopedGroups.map((entry) => entry.slice(entry.indexOf("|") + 1)),
      ).size,
      observed_raw_group_label_union: [
        ...new Set(scopedGroups.map((entry) => entry.slice(entry.indexOf("|") + 1))),
      ].sort(compareUtf8),
    },
    reported_type_denominator_reconciliation: {
      reported_expected_unique_type_count: 516,
      observed_unique_non_missing_non_empty_type_count: typeUnion.length,
      observed_type_na_count: 0,
      observed_type_empty_count: 0,
      observed_type_labels: typeUnion,
      matches_reported_denominator_and_has_no_missing_labels:
        typeUnion.length === 516,
      hard_assertion_applied: false,
      interpretation:
        "Fixture raw type labels are recorded for reconciliation and are not an interneuron denominator.",
    },
    compound_key_expression: CANO_GOMEZ_COMPOUND_KEY_EXPRESSION,
    scope_boundaries: {
      raw_source_extraction_only: true,
      raw_labels_preserved: true,
      classification_inference_applied: false,
      label_normalization_applied: false,
    },
  };
  await writeFile(
    join(directory, "GSE318731_multiome_metadata.combined.receipt.json"),
    `${JSON.stringify(combined, null, 2)}\n`,
  );
}

function cleanRoomCsv(rows) {
  const header = [
    "nucleus_id",
    "transmitter_class",
    "group",
    "neuron_type",
    "source",
    "anatomy",
    "sex",
  ];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.source_nucleus_id,
        row.transmitter_class,
        row.groups,
        row.neuron_types,
        row.source,
        row.anatomy,
        row.Sex,
      ]
        .map((value) => (value === null ? "NA" : quote(value)))
        .join(","),
    );
  }
  return Buffer.from(`${lines.join("\n")}\n`, "utf8");
}

function cleanRoomLevelReceipt(values) {
  const serialized = values.map((value) => (value === null ? "" : value));
  return {
    storageClass: "category",
    rowCount: values.length,
    missingCount: serialized.filter((value) => value === "").length,
    sourceMissingCount: values.filter((value) => value === null).length,
    sourceEmptyStringCount: values.filter((value) => value === "").length,
    sourceWhitespaceOnlyCount: values.filter(
      (value) => value !== null && value !== "" && value.trim() === "",
    ).length,
    observedNonemptyUniqueCount: new Set(serialized.filter(Boolean)).size,
    factorLevels: [...new Set(serialized.filter(Boolean))].sort(compareUtf8),
    zeroCountLevels: [],
    counts: Object.fromEntries(
      countRows(serialized).map(({ value, count }) => [value, count]),
    ),
  };
}

async function writeCleanRoomFixtureExtraction(directory) {
  const extractorSha256 = sha256(
    await readFile(
      new URL("../tools/extract_cano_gomez_rds_metadata.py", import.meta.url),
    ),
  );
  for (const spec of CANO_GOMEZ_SOURCE_SPECS) {
    const rows = fixtureRowsFor(spec).map((row) => ({
      ...row,
      transmitter_class: spec.transmitterClass,
    }));
    if (spec.objectId === "cholinergic") {
      rows[0].source = null;
      rows[1].source = "";
      rows[2].source = " ";
      rows[3].source = "NA";
    }
    const plainRoster = cleanRoomCsv(rows);
    const rosterBytes = gzipSync(plainRoster, { level: 9, mtime: 0 });
    await writeFile(join(directory, spec.cleanRoomMetadataFileName), rosterBytes);
    const fields = {
      groups: cleanRoomLevelReceipt(rows.map((row) => row.groups)),
      neuron_types: cleanRoomLevelReceipt(rows.map((row) => row.neuron_types)),
      anatomy: cleanRoomLevelReceipt(rows.map((row) => row.anatomy)),
      source: cleanRoomLevelReceipt(rows.map((row) => row.source)),
      Sex: cleanRoomLevelReceipt(rows.map((row) => row.Sex)),
    };
    const sourceSha256 = sha256(
      Buffer.from(`clean-room fixture ${spec.objectId}`),
    );
    const audit = {
      formatVersion: "0.1.0",
      receiptKind: "cano_gomez_python_rdata_meta_data_row_only_audit",
      authorityMode: "PYTHON_RDATA_META_DATA_ROW_ONLY",
      crossAssayCellIdentityVerified: false,
      sourceFile: spec.sourceFileName,
      sourceBytes: spec.sourceBytes,
      sourceExpectedBytes: spec.sourceBytes,
      sourceBytesMatchesExpected: true,
      sourceSha256,
      sourceExpectedSha256: sourceSha256,
      sourceSha256MatchesExpected: true,
      sourcePublicUrl: spec.publicUrl,
      transmitterClass: spec.transmitterClass,
      rowCount: spec.nucleusCount,
      uniqueRowNameCount: spec.nucleusCount,
      metadataColumns: ["groups", "neuron_types", "anatomy", "source", "Sex"],
      metadataFields: fields,
      rootAttributes: ["meta.data"],
      assayContainerType: "SimpleNamespace",
      assayKeys: [],
      activeAssay: "RNA",
      activeIdentType: "Categorical",
      identityChecks: {
        authorityMode: "PYTHON_RDATA_META_DATA_ROW_ONLY",
        stableIdSource: "meta.data row.names",
        stableCompoundKeyExpression: CANO_GOMEZ_COMPOUND_KEY_EXPRESSION,
        metadataRowNamesUniqueNonempty: true,
        orderedMetadataRowNamesSha256: sha256Lines(
          rows.map((row) => row.source_nucleus_id),
        ),
        orderedCompoundNucleusKeysSha256: sha256Lines(
          rows.map((row) => row.compound_nucleus_key),
        ),
        sameRowRawMetadataAssignmentVerified: true,
        objectCellsExactOrder: "not_yet_resolved_by_python_clean_room_parser",
        assayColnamesExactOrder: "not_yet_resolved_by_python_clean_room_parser",
        activeIdentNamesExactOrder:
          "not_yet_resolved_by_python_clean_room_parser",
        crossAssayCellIdentityVerified: false,
        sameCellClaimAuthorized: false,
      },
      denominators: {
        expectedRowCount: spec.nucleusCount,
        observedRowCount: spec.nucleusCount,
        expectedGroupCount: spec.groupCount,
        observedNonemptyGroupCount:
          fields.groups.observedNonemptyUniqueCount,
        observedNonemptyNeuronTypeCount:
          fields.neuron_types.observedNonemptyUniqueCount,
      },
      runtime: {
        pythonImplementation: "CPython",
        pythonVersion: "3.11.0",
        corePackageVersions: {
          numpy: "2.0.2",
          pandas: "2.3.3",
          rdata: "0.11.2",
        },
        rdataParserFileSha256:
          "52aa37ef301136240931dd0970f9891da127aa222bd84541239b774b19337aa5",
        expectedPatchedParserFileSha256:
          "52aa37ef301136240931dd0970f9891da127aa222bd84541239b774b19337aa5",
        parserPatchArtifact:
          "tools/patches/rdata-0.11.2-seurat-rds-parser.patch",
      },
      extractor: {
        fileName: "extract_cano_gomez_rds_metadata.py",
        sha256: extractorSha256,
      },
      output: {
        metadataCsvGzip: {
          fileName: spec.cleanRoomMetadataFileName,
          mediaType: "text/csv",
          contentEncoding: "gzip",
          deterministicCompression:
            "Python gzip.GzipFile compresslevel=9 filename-empty mtime=0",
          rowCount: spec.nucleusCount,
          columnCount: 7,
          orderedColumnNames: [
            "nucleus_id",
            "transmitter_class",
            "group",
            "neuron_type",
            "source",
            "anatomy",
            "sex",
          ],
          uncompressedBytes: plainRoster.length,
          uncompressedSha256: sha256(plainRoster),
          compressedBytes: rosterBytes.length,
          compressedSha256: sha256(rosterBytes),
        },
      },
      scopeBoundaries: {
        rawLabelsPreserved: true,
        sameMetaDataRowAssignmentsOnly: true,
        labelNormalizationApplied: false,
        classificationInferenceApplied: false,
        reported516TypeDenominatorHardAssertionApplied: false,
        crossAssayCellIdentityVerified: false,
        sameCellLinkageAuthorized: false,
        geometryClaimAuthorized: false,
        internalStructureClaimAuthorized: false,
        atlasRegistrationClaimAuthorized: false,
      },
    };
    await writeFile(
      join(directory, spec.cleanRoomAuditFileName),
      `${JSON.stringify(audit, null, 2)}\n`,
    );
  }
}

async function rewriteCleanRoomFixtureAsBaseRStream(directory) {
  const [transportSha256, workerSha256] = await Promise.all([
    readFile(
      new URL(
        "../tools/extract_cano_gomez_rds_metadata_stream.py",
        import.meta.url,
      ),
    ).then(sha256),
    readFile(
      new URL(
        "../tools/extract_cano_gomez_rds_metadata_stream.R",
        import.meta.url,
      ),
    ).then(sha256),
  ]);
  for (const spec of CANO_GOMEZ_SOURCE_SPECS) {
    const auditPath = join(directory, spec.cleanRoomAuditFileName);
    const audit = JSON.parse(await readFile(auditPath, "utf8"));
    audit.receiptKind =
      "cano_gomez_base_r_stream_meta_data_row_only_audit";
    audit.authorityMode = BASE_R_STREAM_IDENTITY_AUTHORITY;
    audit.crossAssayCellIdentityVerified = false;
    audit.metadataFieldContract = {
      requiredAssignmentFields: ["groups", "neuron_types"],
      optionalContextFields: ["source", "anatomy", "Sex"],
      presentOptionalContextFields: ["source", "anatomy", "Sex"],
      absentOptionalContextFields: [],
      absentOptionalContextEmissionMode:
        "SOURCE_COLUMN_ABSENT_EMITTED_AS_SOURCE_NA",
      allContractFieldsHaveExplicitPresenceReceipts: true,
    };
    for (const field of ["groups", "neuron_types", "source", "anatomy", "Sex"]) {
      Object.assign(audit.metadataFields[field], {
        sourceColumnPresent: true,
        sourceColumnIndex: audit.metadataColumns.indexOf(field) + 1,
        emissionMode: "PRESERVED_SOURCE_COLUMN_VALUES",
        sourceColumnAbsenceReason: null,
        typeof: "character",
        storageMode: "character",
        class: "character",
        isFactor: false,
        isOrderedFactor: false,
      });
    }
    audit.identityChecks.authorityMode = BASE_R_STREAM_IDENTITY_AUTHORITY;
    audit.identityChecks.objectCellsExactOrder =
      "not_resolved_by_base_r_meta_data_row_only_stream";
    audit.identityChecks.assayColnamesExactOrder =
      "not_resolved_by_base_r_meta_data_row_only_stream";
    audit.identityChecks.activeIdentNamesExactOrder =
      "not_resolved_by_base_r_meta_data_row_only_stream";
    audit.runtime = {
      transportPythonImplementation: "CPython",
      transportPythonVersion: "3.11.0",
      rVersion: "4.6.1",
      rPlatform: "fixture",
      baseROnly: true,
      seuratObjectNamespaceLoaded: false,
      rWorkerMaxResidentSetBytesExcludedFromDeterministicAudit: true,
    };
    delete audit.extractor;
    audit.extractors = {
      transport: {
        fileName: "extract_cano_gomez_rds_metadata_stream.py",
        sha256: transportSha256,
      },
      baseRWorker: {
        fileName: "extract_cano_gomez_rds_metadata_stream.R",
        sha256: workerSha256,
      },
    };
    audit.transport = {
      mode: "LOCAL_FILE_TO_R_STDIN",
      sourcePersistedToDisk: true,
      localSourceBasename: spec.sourceFileName,
      sourceBytesStreamedDirectlyToRStdin: true,
      sameRawBytesCountedAndHashedBeforeRStdinWrite: true,
      httpStatus: null,
      responseContentLength: spec.sourceBytes,
      responseContentEncoding: null,
      finalUrl: spec.publicUrl,
      httpReconnectCount: 0,
      boundedChunkTransport: true,
    };
    audit.memoryBoundary = {
      readRDSMaterializesCompleteObject: true,
      metadataRetainedThenCompleteObjectReleasedBeforeWriting: true,
      compressedByteSizeIsNotAReliableMemoryPredictor: true,
      CHOLMemoryProbeRequiredBeforeLargerClasses: true,
      CHOLProbeDoesNotAuthorizeGabaOrGlutRun: true,
    };
    audit.output.metadataCsvGzip.sourceNaEncoding = "unquoted NA";
    audit.output.metadataCsvGzip.nonmissingValueEncoding =
      "always quoted with doubled quotes";
    audit.scopeBoundaries.sourceNaAndExactEmptyStringDistinguished = true;
    audit.scopeBoundaries.absentContextSourceColumnsEmittedOnlyAsSourceNa = true;
    audit.scopeBoundaries.optionalContextInferenceApplied = false;
    audit.scopeBoundaries.sourceColumnAbsenceInterpretedAsBiologicalAbsence =
      false;
    await writeFile(auditPath, `${JSON.stringify(audit, null, 2)}\n`);
  }
}

async function updateSourceReceiptAndCombined(directory, objectId, mutate) {
  const spec = CANO_GOMEZ_SOURCE_SPECS.find((item) => item.objectId === objectId);
  const receiptPath = join(directory, spec.receiptFileName);
  const receipt = JSON.parse(await readFile(receiptPath, "utf8"));
  mutate(receipt);
  const receiptBytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
  await writeFile(receiptPath, receiptBytes);
  const combinedPath = join(
    directory,
    "GSE318731_multiome_metadata.combined.receipt.json",
  );
  const combined = JSON.parse(await readFile(combinedPath, "utf8"));
  combined.source_objects.find(
    (item) => item.object_id === objectId,
  ).receipt_sha256 = sha256(receiptBytes);
  await writeFile(combinedPath, `${JSON.stringify(combined, null, 2)}\n`);
}

test("strictly classifies only source-explicit CHOL_IN and never infers interneuron status from GABA", () => {
  assert.deepEqual(
    classifyCanoGomezAssignment({ objectId: "cholinergic", groups: "CHOL_IN" }),
    {
      decision: CANO_GOMEZ_DECISIONS.CONFIRMED_INTERNEURON,
      reason: "source_explicit_groups_equals_CHOL_IN",
    },
  );
  for (const group of CANO_GOMEZ_MOTOR_GROUPS) {
    assert.equal(
      classifyCanoGomezAssignment({ objectId: "cholinergic", groups: group })
        .decision,
      CANO_GOMEZ_DECISIONS.EXCLUDED_MOTOR,
    );
  }
  assert.equal(
    classifyCanoGomezAssignment({
      objectId: "gabaergic",
      groups: "GABA_CSF-cN_Pkd2l1",
    }).decision,
    CANO_GOMEZ_DECISIONS.EXCLUDED_SENSORY_SCOPE,
  );
  assert.equal(
    classifyCanoGomezAssignment({ objectId: "gabaergic", groups: "GABA_other" })
      .decision,
    CANO_GOMEZ_DECISIONS.EXCLUDED_AMBIGUOUS_OR_PROJECTION_EXCEPTION_UNRESOLVED,
  );
  assert.equal(
    classifyCanoGomezAssignment({ objectId: "glutamatergic", groups: "GLUT_any" })
      .decision,
    CANO_GOMEZ_DECISIONS.EXCLUDED_PROJECTION_LOCAL_STATUS_UNRESOLVED,
  );
  assert.throws(
    () =>
      classifyCanoGomezAssignment({
        objectId: "cholinergic",
        groups: "CHOL_INFERRED_FROM_LABEL",
      }),
    /unrecognized cholinergic group/i,
  );
});

test("stable profile IDs retain raw-label identity without trimming or label-token marker claims", () => {
  const raw = "CHOL_IN_Pitx2_ Srpx2";
  assert.match(stableCanoGomezProfileId(raw), /^cano\.gomez\.p56\.chol_in\.sha256\.[a-f0-9]{24}$/);
  assert.notEqual(stableCanoGomezProfileId(raw), stableCanoGomezProfileId(` ${raw}`));
  assert.notEqual(
    stableCanoGomezProfileId(raw),
    stableCanoGomezProfileId(raw.replace("_ ", "_")),
  );
});

test(
  "builds a deterministic full-denominator audit and a CHOL_IN-only exact roster",
  { timeout: 120000 },
  async () => {
    const temporaryDirectory = await mkdtemp(join(tmpdir(), "cano-gomez-registry-"));
    try {
      const extractionDirectory = join(temporaryDirectory, "extraction");
      await mkdir(extractionDirectory);
      await writeFixtureExtraction(extractionDirectory);
      const first = await buildCanoGomezP56MultiomeInterneuronRegistry({
        extractionDirectory,
        outputDirectory: join(temporaryDirectory, "first"),
      });
      const second = await buildCanoGomezP56MultiomeInterneuronRegistry({
        extractionDirectory,
        outputDirectory: join(temporaryDirectory, "second"),
      });
      const registry = first.registry;
      assert.deepEqual(await validateCanoGomezP56MultiomeInterneuronRegistry(registry), {
        releaseId: "ohri-cano-gomez-p56-multiome-interneuron-registry-0.1.0",
        sourceNucleusCount: 169345,
        confirmedInterneuronNucleusCount: 923,
        confirmedInterneuronProfileCount: 11,
        perNucleusNonNeuronalExcludedCount: null,
        generatedGeometryCount: 0,
      });
      assert.equal(registry.denominatorReconciliation.excludedMotorNucleusCount, 2276);
      assert.equal(
        registry.denominatorReconciliation
          .excludedProjectionLocalStatusUnresolvedNucleusCount,
        92782,
      );
      assert.equal(
        registry.denominatorReconciliation
          .excludedAmbiguousOrProjectionExceptionUnresolvedNucleusCount,
        73364 - FIXTURE_SPEC.gabaSensoryCount,
      );
      assert.equal(
        registry.denominatorReconciliation.excludedSensoryScopeNucleusCount,
        FIXTURE_SPEC.gabaSensoryCount,
      );
      const anomaly = registry.profiles.find(
        (profileItem) => profileItem.sourceLocalLabel === "CHOL_IN_Pitx2_ Srpx2",
      );
      assert.ok(anomaly);
      assert.equal(anomaly.nucleusCount, 74);
      assert.equal(anomaly.markerEvidenceStatus, "NOT_EXTRACTED_NO_LABEL_TOKEN_INFERENCE");
      assert.deepEqual(Object.values(anomaly.geometryAuthority), [0, 0, 0, 0]);
      assert.deepEqual(
        registry.artifacts.map(({ compressedSha256 }) => compressedSha256),
        second.registry.artifacts.map(({ compressedSha256 }) => compressedSha256),
      );
      assert.deepEqual(
        registry.artifacts.map(({ uncompressedSha256 }) => uncompressedSha256),
        second.registry.artifacts.map(({ uncompressedSha256 }) => uncompressedSha256),
      );
      const audit = gunzipSync(
        await readFile(join(first.outputDirectory, CANO_GOMEZ_OUTPUT_FILES.audit)),
      ).toString("utf8");
      const confirmed = gunzipSync(
        await readFile(
          join(first.outputDirectory, CANO_GOMEZ_OUTPUT_FILES.confirmedRoster),
        ),
      ).toString("utf8");
      assert.equal(audit.split("\n").length - 2, 169345);
      assert.equal(confirmed.split("\n").length - 2, 923);
      assert.match(confirmed, /"CHOL_IN_Pitx2_ Srpx2"/);
      assert.doesNotMatch(confirmed, /"CHOL_aMN_Vipr2"/);
      assert.match(audit, /"EXCLUDED_PROJECTION_LOCAL_STATUS_UNRESOLVED"/);
      assert.match(
        audit,
        /"SOURCE_LEVEL_PREPROCESSING_ONLY_NO_PER_NUCLEUS_FLAG"/,
      );
    } finally {
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  },
);

test(
  "fails closed on missing receipts, missing checksums, missing required columns, or denominator drift",
  { timeout: 120000 },
  async () => {
    const temporaryDirectory = await mkdtemp(join(tmpdir(), "cano-gomez-fail-closed-"));
    try {
      const original = join(temporaryDirectory, "original");
      await mkdir(original);
      await writeFixtureExtraction(original);

      const missingReceipt = join(temporaryDirectory, "missing-receipt");
      await cp(original, missingReceipt, { recursive: true });
      await unlink(
        join(missingReceipt, CANO_GOMEZ_SOURCE_SPECS[1].receiptFileName),
      );
      await assert.rejects(
        () =>
          buildCanoGomezP56MultiomeInterneuronRegistry({
            extractionDirectory: missingReceipt,
            outputDirectory: join(temporaryDirectory, "out-missing-receipt"),
          }),
        /missing gabaergic source receipt/i,
      );

      const missingChecksum = join(temporaryDirectory, "missing-checksum");
      await cp(original, missingChecksum, { recursive: true });
      await updateSourceReceiptAndCombined(
        missingChecksum,
        "gabaergic",
        (receipt) => {
          receipt.source.sha256 = null;
        },
      );
      await assert.rejects(
        () =>
          buildCanoGomezP56MultiomeInterneuronRegistry({
            extractionDirectory: missingChecksum,
            outputDirectory: join(temporaryDirectory, "out-missing-checksum"),
          }),
        /source RDS must be a lowercase SHA-256 receipt/i,
      );

      const missingColumn = join(temporaryDirectory, "missing-column");
      await cp(original, missingColumn, { recursive: true });
      await updateSourceReceiptAndCombined(
        missingColumn,
        "glutamatergic",
        (receipt) => {
          receipt.roster.ordered_column_names =
            receipt.roster.ordered_column_names.filter(
              (column) => column !== "neuron_types",
            );
          receipt.roster.column_count -= 1;
        },
      );
      await assert.rejects(
        () =>
          buildCanoGomezP56MultiomeInterneuronRegistry({
            extractionDirectory: missingColumn,
            outputDirectory: join(temporaryDirectory, "out-missing-column"),
          }),
        /lacks required column neuron_types/i,
      );

      const denominatorDrift = join(temporaryDirectory, "denominator-drift");
      await cp(original, denominatorDrift, { recursive: true });
      const combinedPath = join(
        denominatorDrift,
        "GSE318731_multiome_metadata.combined.receipt.json",
      );
      const combined = JSON.parse(await readFile(combinedPath, "utf8"));
      combined.asserted_denominators.total_nucleus_count -= 1;
      await writeFile(combinedPath, `${JSON.stringify(combined, null, 2)}\n`);
      await assert.rejects(
        () =>
          buildCanoGomezP56MultiomeInterneuronRegistry({
            extractionDirectory: denominatorDrift,
            outputDirectory: join(temporaryDirectory, "out-denominator-drift"),
          }),
        /combined nucleus denominator changed/i,
      );
    } finally {
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  },
);

test(
  "accepts the checksum-pinned Python/rdata row-only receipt without claiming cross-assay identity",
  { timeout: 120000 },
  async () => {
    const temporaryDirectory = await mkdtemp(
      join(tmpdir(), "cano-gomez-clean-room-"),
    );
    try {
      const extractionDirectory = join(temporaryDirectory, "extraction");
      await mkdir(extractionDirectory);
      await writeCleanRoomFixtureExtraction(extractionDirectory);
      const result = await buildCanoGomezP56MultiomeInterneuronRegistry({
        extractionDirectory,
        outputDirectory: join(temporaryDirectory, "output"),
      });
      const { registry } = result;
      const packageReport =
        await validateCanoGomezP56MultiomeInterneuronRegistryPackage(
          join(result.outputDirectory, CANO_GOMEZ_OUTPUT_FILES.registry),
        );
      assert.equal(packageReport.artifactsVerified, 2);
      assert.equal(
        registry.identityAuthority.mode,
        "PYTHON_RDATA_META_DATA_ROW_ONLY",
      );
      assert.equal(registry.identityAuthority.crossAssayCellIdentityVerified, false);
      assert.equal(registry.identityAuthority.sameCellAssertionAdmitted, false);
      assert.equal(
        registry.metadataFieldCoverage.mode,
        "CONTRACTED_ASSIGNMENT_CONTEXT_COLUMNS_ONLY",
      );
      assert.match(
        registry.metadataFieldCoverage.boundary,
        /not a copy of every original meta\.data column/i,
      );
      assert.equal(registry.inputReceipts.combinedReceiptFileName, null);
      assert.ok(
        registry.sourceObjects.every(
          (source) => source.crossAssayCellIdentityVerified === false,
        ),
      );
      assert.ok(
        registry.inputReceipts.sourceObjects.every(
          (receipt) =>
            receipt.receiptKind ===
            "python_rdata_meta_data_row_only_receipt",
        ),
      );
      assert.equal(
        registry.denominatorReconciliation.confirmedInterneuronNucleusCount,
        923,
      );
      assert.equal(registry.profiles.length, 11);
      const auditText = gunzipSync(
        await readFile(join(result.outputDirectory, CANO_GOMEZ_OUTPUT_FILES.audit)),
      ).toString("utf8");
      assert.match(auditText, /"identity_authority_mode"/);
      assert.match(auditText, /"PYTHON_RDATA_META_DATA_ROW_ONLY"/);
      assert.match(auditText, /"cross_assay_cell_identity_verified"/);
      assert.match(auditText, /"false"/);
      const firstCholinergicRows = auditText.split("\n").slice(1, 5);
      assert.match(firstCholinergicRows[0], /,NA,"cervical","F","CHOL",/);
      assert.match(firstCholinergicRows[1], /,"","lumbar","M","CHOL",/);
      assert.match(firstCholinergicRows[2], /," ","cervical","NA","CHOL",/);
      assert.match(firstCholinergicRows[3], /,"NA","lumbar","F","CHOL",/);
      assert.match(
        auditText,
        new RegExp(
          `"GSE318731\\|${CANO_GOMEZ_SOURCE_SPECS[0].sourceFileName.replaceAll(
            ".",
            "\\.",
          )}\\|cholinergic-000001"`,
        ),
      );
      const promotedIdentity = structuredClone(registry);
      promotedIdentity.identityAuthority.crossAssayCellIdentityVerified = true;
      await assert.rejects(
        () =>
          validateCanoGomezP56MultiomeInterneuronRegistry(promotedIdentity),
        /cross-assay identity receipt does not match its authority mode/i,
      );

      const cholAuditPath = join(
        extractionDirectory,
        CANO_GOMEZ_SOURCE_SPECS[0].cleanRoomAuditFileName,
      );
      const alteredAudit = JSON.parse(await readFile(cholAuditPath, "utf8"));
      alteredAudit.output.metadataCsvGzip.compressedSha256 = "0".repeat(64);
      await writeFile(cholAuditPath, `${JSON.stringify(alteredAudit, null, 2)}\n`);
      await assert.rejects(
        () =>
          buildCanoGomezP56MultiomeInterneuronRegistry({
            extractionDirectory,
            outputDirectory: join(temporaryDirectory, "checksum-mismatch-output"),
          }),
        /clean-room roster byte\/checksum receipt mismatch/i,
      );

      const outputAuditPath = join(
        result.outputDirectory,
        CANO_GOMEZ_OUTPUT_FILES.audit,
      );
      const outputAudit = await readFile(outputAuditPath);
      await writeFile(
        outputAuditPath,
        Buffer.concat([outputAudit, Buffer.from("tampered", "utf8")]),
      );
      await assert.rejects(
        () =>
          validateCanoGomezP56MultiomeInterneuronRegistryPackage(
            join(result.outputDirectory, CANO_GOMEZ_OUTPUT_FILES.registry),
          ),
        /compressed byte\/checksum receipt mismatch/i,
      );
    } finally {
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  },
);

test(
  "accepts the checksum-pinned base-R stream row-only receipt with explicit full-object and no-same-cell boundaries",
  { timeout: 120000 },
  async () => {
    const temporaryDirectory = await mkdtemp(
      join(tmpdir(), "cano-gomez-base-r-stream-registry-"),
    );
    try {
      const extractionDirectory = join(temporaryDirectory, "extraction");
      await mkdir(extractionDirectory);
      await writeCleanRoomFixtureExtraction(extractionDirectory);
      await rewriteCleanRoomFixtureAsBaseRStream(extractionDirectory);
      const result = await buildCanoGomezP56MultiomeInterneuronRegistry({
        extractionDirectory,
        outputDirectory: join(temporaryDirectory, "output"),
      });
      const { registry } = result;
      const packageReport =
        await validateCanoGomezP56MultiomeInterneuronRegistryPackage(
          join(result.outputDirectory, CANO_GOMEZ_OUTPUT_FILES.registry),
        );
      assert.equal(packageReport.artifactsVerified, 2);
      assert.equal(
        registry.identityAuthority.mode,
        BASE_R_STREAM_IDENTITY_AUTHORITY,
      );
      assert.equal(
        registry.identityAuthority.crossAssayCellIdentityVerified,
        false,
      );
      assert.equal(registry.identityAuthority.sameCellAssertionAdmitted, false);
      assert.match(
        registry.identityAuthority.boundary,
        /base-R streaming.*full readRDS materialization/i,
      );
      assert.match(
        registry.metadataFieldCoverage.boundary,
        /base-R streaming derivative.*complete-object readRDS materialization/i,
      );
      assert.ok(
        registry.sourceObjects.every(
          (source) =>
            source.identityAuthorityMode ===
              BASE_R_STREAM_IDENTITY_AUTHORITY &&
            source.crossAssayCellIdentityVerified === false,
        ),
      );
      assert.ok(
        registry.inputReceipts.sourceObjects.every(
          (receipt) =>
            receipt.receiptKind ===
            "base_r_stream_meta_data_row_only_receipt",
        ),
      );
      const auditText = gunzipSync(
        await readFile(
          join(result.outputDirectory, CANO_GOMEZ_OUTPUT_FILES.audit),
        ),
      ).toString("utf8");
      assert.match(auditText, /"BASE_R_STREAM_META_DATA_ROW_ONLY"/);
      assert.match(auditText, /"cross_assay_cell_identity_verified"/);
      assert.match(auditText, /"false"/);

      const promotedIdentity = structuredClone(registry);
      promotedIdentity.identityAuthority.crossAssayCellIdentityVerified = true;
      await assert.rejects(
        () =>
          validateCanoGomezP56MultiomeInterneuronRegistry(promotedIdentity),
        /cross-assay identity receipt does not match its authority mode/i,
      );

      const forgedPresentContext = structuredClone(registry);
      const cholinergicSource = forgedPresentContext.sourceObjects.find(
        ({ objectId }) => objectId === "cholinergic",
      );
      const sourceAvailability = cholinergicSource.metadataFieldAvailability.find(
        ({ field }) => field === "source",
      );
      Object.assign(sourceAvailability, {
        sourceColumnPresent: false,
        sourceColumnIndex: null,
        emissionMode: "SOURCE_COLUMN_ABSENT_EMITTED_AS_SOURCE_NA",
        sourceColumnAbsenceReason: "source_meta_data_column_absent",
        sourceMissingCount: cholinergicSource.nucleusCount,
        sourceEmptyStringCount: 0,
        sourceWhitespaceOnlyCount: 0,
        observedNonemptyUniqueCount: 0,
      });
      await assert.rejects(
        () =>
          validateCanoGomezP56MultiomeInterneuronRegistry(
            forgedPresentContext,
          ),
        /status disagrees with source-object metadata availability/i,
      );

      for (const countField of [
        "sourceWhitespaceOnlyCount",
        "observedNonemptyUniqueCount",
      ]) {
        const impossibleAvailability = structuredClone(registry);
        const sourceReceipt = impossibleAvailability.sourceObjects
          .find(({ objectId }) => objectId === "cholinergic")
          .metadataFieldAvailability.find(({ field }) => field === "source");
        sourceReceipt[countField] =
          sourceReceipt.rowCount -
          sourceReceipt.sourceMissingCount -
          sourceReceipt.sourceEmptyStringCount +
          1;
        await assert.rejects(
          () =>
            validateCanoGomezP56MultiomeInterneuronRegistry(
              impossibleAvailability,
            ),
          /availability counts changed/i,
        );
      }

      const cholAuditPath = join(
        extractionDirectory,
        CANO_GOMEZ_SOURCE_SPECS[0].cleanRoomAuditFileName,
      );
      const alteredAudit = JSON.parse(await readFile(cholAuditPath, "utf8"));
      alteredAudit.transport.localSourceBasename = "wrong-source.rds";
      await writeFile(cholAuditPath, `${JSON.stringify(alteredAudit, null, 2)}\n`);
      await assert.rejects(
        () =>
          buildCanoGomezP56MultiomeInterneuronRegistry({
            extractionDirectory,
            outputDirectory: join(temporaryDirectory, "tampered-output"),
          }),
        /base-R source transport receipt changed/i,
      );
    } finally {
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  },
);

test("schema/semantic validation rejects GABA promotion, fabricated non-neuronal zero, markers, or geometry", async () => {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "cano-gomez-validation-"));
  try {
    const extractionDirectory = join(temporaryDirectory, "extraction");
    await mkdir(extractionDirectory);
    await writeFixtureExtraction(extractionDirectory);
    const { registry } = await buildCanoGomezP56MultiomeInterneuronRegistry({
      extractionDirectory,
      outputDirectory: join(temporaryDirectory, "output"),
    });

    const promotedGaba = structuredClone(registry);
    const gabaCounts = promotedGaba.sourceObjects[1].decisionCounts;
    gabaCounts.find(({ decision }) => decision === "CONFIRMED_INTERNEURON").count = 1;
    gabaCounts.find(
      ({ decision }) =>
        decision === "EXCLUDED_AMBIGUOUS_OR_PROJECTION_EXCEPTION_UNRESOLVED",
    ).count -= 1;
    await assert.rejects(
      () => validateCanoGomezP56MultiomeInterneuronRegistry(promotedGaba),
      /GABA rows must not be promoted/i,
    );

    const fabricatedNonNeuronal = structuredClone(registry);
    fabricatedNonNeuronal.denominatorReconciliation.perNucleusNonNeuronalExcludedCount =
      0;
    await assert.rejects(
      () =>
        validateCanoGomezP56MultiomeInterneuronRegistry(fabricatedNonNeuronal),
      /must be null|must remain unavailable/i,
    );

    const markerPromotion = structuredClone(registry);
    markerPromotion.profiles[0].markers = ["Pitx2"];
    await assert.rejects(
      () => validateCanoGomezP56MultiomeInterneuronRegistry(markerPromotion),
      /additional properties/i,
    );

    const inventedGeometry = structuredClone(registry);
    inventedGeometry.profiles[0].geometryAuthority.geometryObjectCount = 1;
    await assert.rejects(
      () => validateCanoGomezP56MultiomeInterneuronRegistry(inventedGeometry),
      /must be equal to constant|unsupported model authority/i,
    );
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});
