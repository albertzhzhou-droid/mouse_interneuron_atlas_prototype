import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const pythonPath = join(
  projectRoot,
  "tools",
  "extract_cano_gomez_rds_metadata_stream.py",
);
const rWorkerPath = join(
  projectRoot,
  "tools",
  "extract_cano_gomez_rds_metadata_stream.R",
);
const python = process.env.PYTHON ?? "python3";
const canonicalCholSha256 =
  "d4ad07a1e434f2ed4553738f3e1df1b395ce81b154f974c41f3ba6a9d674aed2";
const canonicalCholFile = "GSE318731_P56_cholinergic_multiome.rds";
const canonicalCholUrl =
  "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE318nnn/GSE318731/suppl/GSE318731_P56_cholinergic_multiome.rds";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function presentAuditFieldProfile(sourceColumnIndex, labels, rowCount = 3199) {
  const counts = Object.fromEntries(
    labels.map((label, index) => [
      label,
      index === 0 ? rowCount - labels.length + 1 : 1,
    ]),
  );
  return {
    sourceColumnPresent: true,
    sourceColumnIndex,
    emissionMode: "PRESERVED_SOURCE_COLUMN_VALUES",
    sourceColumnAbsenceReason: null,
    typeof: "character",
    storageMode: "character",
    class: "character",
    isFactor: false,
    isOrderedFactor: false,
    rowCount,
    missingCount: 0,
    sourceMissingCount: 0,
    sourceEmptyStringCount: 0,
    sourceWhitespaceOnlyCount: 0,
    observedNonemptyUniqueCount: labels.length,
    factorLevels: [],
    zeroCountLevels: [],
    counts,
  };
}

async function validCholProbeAudit() {
  const [transportSha256, workerSha256] = await Promise.all([
    readFile(pythonPath).then(sha256),
    readFile(rWorkerPath).then(sha256),
  ]);
  const metadataColumns = ["groups", "neuron_types", "source", "anatomy", "Sex"];
  return {
    formatVersion: "0.1.0",
    receiptKind: "cano_gomez_base_r_stream_meta_data_row_only_audit",
    authorityMode: "BASE_R_STREAM_META_DATA_ROW_ONLY",
    crossAssayCellIdentityVerified: false,
    sourceAccession: "GSE318731",
    sourceFile: canonicalCholFile,
    sourcePublicUrl: canonicalCholUrl,
    sourceBytes: 127862795,
    sourceExpectedBytes: 127862795,
    sourceBytesMatchesExpected: true,
    sourceSha256: canonicalCholSha256,
    sourceExpectedSha256: canonicalCholSha256,
    sourceSha256MatchesExpected: true,
    transmitterClass: "CHOL",
    rowCount: 3199,
    uniqueRowNameCount: 3199,
    metadataColumns,
    metadataFieldContract: {
      requiredAssignmentFields: ["groups", "neuron_types"],
      optionalContextFields: ["source", "anatomy", "Sex"],
      presentOptionalContextFields: ["source", "anatomy", "Sex"],
      absentOptionalContextFields: [],
      absentOptionalContextEmissionMode:
        "SOURCE_COLUMN_ABSENT_EMITTED_AS_SOURCE_NA",
      allContractFieldsHaveExplicitPresenceReceipts: true,
    },
    metadataFields: {
      groups: presentAuditFieldProfile(
        1,
        Array.from({ length: 5 }, (_, index) => `G${index + 1}`),
      ),
      neuron_types: presentAuditFieldProfile(
        2,
        Array.from({ length: 38 }, (_, index) => `T${index + 1}`),
      ),
      source: presentAuditFieldProfile(3, ["P56"]),
      anatomy: presentAuditFieldProfile(4, ["spinal cord"]),
      Sex: presentAuditFieldProfile(5, ["Female", "Male"]),
    },
    identityChecks: {
      authorityMode: "BASE_R_STREAM_META_DATA_ROW_ONLY",
      stableIdSource: "meta.data row.names",
      stableCompoundKeyExpression:
        "GSE318731|exact source filename|row.name",
      metadataRowNamesUniqueNonempty: true,
      orderedMetadataRowNamesSha256: "1".repeat(64),
      orderedCompoundNucleusKeysSha256: "2".repeat(64),
      sameRowRawMetadataAssignmentVerified: true,
      objectCellsExactOrder: "not_resolved_by_base_r_meta_data_row_only_stream",
      assayColnamesExactOrder: "not_resolved_by_base_r_meta_data_row_only_stream",
      activeIdentNamesExactOrder:
        "not_resolved_by_base_r_meta_data_row_only_stream",
      crossAssayCellIdentityVerified: false,
      sameCellClaimAuthorized: false,
    },
    denominators: {
      expectedRowCount: 3199,
      observedRowCount: 3199,
      expectedGroupCount: 5,
      observedNonemptyGroupCount: 5,
      observedNonemptyNeuronTypeCount: 38,
    },
    transport: {
      mode: "HTTP_RANGE_RESUMABLE_TO_R_STDIN",
      sourcePersistedToDisk: false,
      localSourceBasename: null,
      sourceBytesStreamedDirectlyToRStdin: true,
      sameRawBytesCountedAndHashedBeforeRStdinWrite: true,
      finalUrl: canonicalCholUrl,
      boundedChunkTransport: true,
    },
    runtime: {
      transportPythonImplementation: "CPython",
      transportPythonVersion: "3.11.0",
      rVersion: "R version 4.6.1",
      rPlatform: "fixture",
      baseROnly: true,
      seuratObjectNamespaceLoaded: false,
      rWorkerMaxResidentSetBytesExcludedFromDeterministicAudit: true,
    },
    extractors: {
      transport: {
        fileName: "extract_cano_gomez_rds_metadata_stream.py",
        sha256: transportSha256,
      },
      baseRWorker: {
        fileName: "extract_cano_gomez_rds_metadata_stream.R",
        sha256: workerSha256,
      },
    },
    memoryBoundary: {
      readRDSMaterializesCompleteObject: true,
      metadataRetainedThenCompleteObjectReleasedBeforeWriting: true,
      compressedByteSizeIsNotAReliableMemoryPredictor: true,
      CHOLMemoryProbeRequiredBeforeLargerClasses: true,
      CHOLProbeDoesNotAuthorizeGabaOrGlutRun: true,
      cholProbeGate: {
        requiredForThisClass: false,
        verifiedBeforeSourceTransport: false,
        probeAuditSha256: null,
        probeSourceSha256: null,
        probeTransportExtractorSha256: null,
        probeBaseRWorkerSha256: null,
        largerClassMemorySafetyEstablished: false,
        scientificOrClassificationAuthorityAdded: false,
      },
    },
    output: {
      metadataCsvGzip: {
        fileName: "GSE318731_P56_cholinergic_multiome.metadata.csv.gz",
        mediaType: "text/csv",
        contentEncoding: "gzip",
        rowCount: 3199,
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
        uncompressedBytes: 306262,
        uncompressedSha256: "3".repeat(64),
        compressedBytes: 31145,
        compressedSha256: "4".repeat(64),
      },
    },
    scopeBoundaries: {
      rawLabelsPreserved: true,
      sourceNaAndExactEmptyStringDistinguished: true,
      absentContextSourceColumnsEmittedOnlyAsSourceNa: true,
      optionalContextInferenceApplied: false,
      sourceColumnAbsenceInterpretedAsBiologicalAbsence: false,
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
}

const assertBalancedRDelimiters = (source) => {
  const opening = new Map([
    ["(", ")"],
    ["[", "]"],
    ["{", "}"],
  ]);
  const closing = new Set(opening.values());
  const stack = [];
  let quote = null;
  let escaped = false;
  let comment = false;
  for (const character of source) {
    if (comment) {
      if (character === "\n") comment = false;
    } else if (quote !== null) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = null;
    } else if (character === "#") {
      comment = true;
    } else if (character === '"' || character === "'" || character === "`") {
      quote = character;
    } else if (opening.has(character)) {
      stack.push(character);
    } else if (closing.has(character)) {
      const last = stack.pop();
      assert.ok(last);
      assert.equal(opening.get(last), character);
    }
  }
  assert.equal(quote, null);
  assert.deepEqual(stack, []);
};

test("base-R stream worker and transport compile structurally", async () => {
  const [rSource, pythonSource] = await Promise.all([
    readFile(rWorkerPath, "utf8"),
    readFile(pythonPath, "utf8"),
  ]);
  assertBalancedRDelimiters(rSource);
  execFileSync(
    python,
    [
      "-c",
      "from pathlib import Path; p=Path(__import__('sys').argv[1]); compile(p.read_text(encoding='utf-8'), str(p), 'exec'); print('ok')",
      pythonPath,
    ],
    { encoding: "utf8" },
  );
  assert.ok(pythonSource.includes("BASE_R_STREAM_META_DATA_ROW_ONLY"));
});

test("transport pins canonical sources and never persists an RDS", async () => {
  const source = await readFile(pythonPath, "utf8");
  for (const literal of [
    "GSE318731_P56_cholinergic_multiome.rds",
    "GSE318731_P56_gabaergic_multiome.rds",
    "GSE318731_P56_glutamatergic_multiome_UPDATE.rds",
    "127_862_795",
    "1_646_402_816",
    "1_832_005_077",
    "process.stdin.write(block)",
    "digest.update(block)",
    '"--source-file"',
    '"sourcePersistedToDisk": transport.source_persisted_to_disk',
    '"localSourceBasename": transport.source_file_basename',
    'headers["Range"] = f"bytes={offset}-"',
    '"crossAssayCellIdentityVerified": False',
    '"geometryClaimAuthorized": False',
  ]) {
    assert.ok(source.includes(literal), "missing contract literal: " + literal);
  }
  assert.doesNotMatch(source, /open\([^)]*\.rds[^)]*["']wb/);
  assert.doesNotMatch(source, /\/private\/tmp|ohri-portable-r/);
});

test("GABA and GLUT require an exact current CHOL probe before transport", async () => {
  const temporaryRoot = await mkdtemp(join(tmpdir(), "cano-chol-gate-"));
  try {
    const auditPath = join(temporaryRoot, "chol.audit.json");
    const audit = await validCholProbeAudit();
    await writeFile(auditPath, `${JSON.stringify(audit)}\n`, "utf8");
    const commonArguments = (className) => [
      pythonPath,
      "--class-name",
      className,
      "--expected-source-sha256",
      "a".repeat(64),
      "--rscript",
      join(temporaryRoot, "missing-Rscript"),
      "--output-directory",
      join(temporaryRoot, `output-${className}`),
    ];

    for (const className of ["GABA", "GLUT"]) {
      const missing = spawnSync(python, commonArguments(className), {
        encoding: "utf8",
      });
      assert.equal(missing.status, 2);
      assert.match(missing.stderr, /--chol-probe-audit is required before/);

      const admitted = spawnSync(
        python,
        [...commonArguments(className), "--chol-probe-audit", auditPath],
        { encoding: "utf8" },
      );
      assert.equal(admitted.status, 2);
      assert.match(admitted.stderr, /Rscript is not a regular file/);
      assert.doesNotMatch(admitted.stderr, /CHOL probe audit .*changed/);
    }

    const inappropriate = spawnSync(
      python,
      [...commonArguments("CHOL"), "--chol-probe-audit", auditPath],
      { encoding: "utf8" },
    );
    assert.equal(inappropriate.status, 2);
    assert.match(
      inappropriate.stderr,
      /--chol-probe-audit is only valid for GABA or GLUT/,
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("CHOL gate rejects canonical, denominator, memory, and extractor drift", async () => {
  const temporaryRoot = await mkdtemp(join(tmpdir(), "cano-chol-drift-"));
  try {
    const baseAudit = await validCholProbeAudit();
    const program = [
      "import importlib.util,pathlib,sys",
      "p=pathlib.Path(sys.argv[1]).resolve()",
      "s=importlib.util.spec_from_file_location('stream',p)",
      "m=importlib.util.module_from_spec(s)",
      "sys.modules[s.name]=m",
      "s.loader.exec_module(m)",
      "m.validate_chol_probe_audit(pathlib.Path(sys.argv[2]),p,p.with_suffix('.R'))",
      "print('ok')",
    ].join("; ");
    const validate = (auditPath) =>
      spawnSync(python, ["-c", program, pythonPath, auditPath], {
        encoding: "utf8",
      });

    const validPath = join(temporaryRoot, "valid.json");
    await writeFile(validPath, `${JSON.stringify(baseAudit)}\n`, "utf8");
    const valid = validate(validPath);
    assert.equal(valid.status, 0, valid.stderr);
    assert.equal(valid.stdout.trim(), "ok");

    const mutations = [
      ["source-sha", (audit) => (audit.sourceSha256 = "0".repeat(64)), /source SHA-256 changed/],
      ["row-count", (audit) => (audit.rowCount = 3198), /row count changed/],
      [
        "group-count",
        (audit) => (audit.denominators.observedNonemptyGroupCount = 4),
        /observedNonemptyGroupCount changed/,
      ],
      [
        "memory-boundary",
        (audit) =>
          (audit.memoryBoundary.readRDSMaterializesCompleteObject = false),
        /readRDSMaterializesCompleteObject changed/,
      ],
      [
        "worker-hash",
        (audit) => (audit.extractors.baseRWorker.sha256 = "f".repeat(64)),
        /extractors\.baseRWorker\.sha256 changed/,
      ],
    ];
    for (const [name, mutate, message] of mutations) {
      const audit = structuredClone(baseAudit);
      mutate(audit);
      const auditPath = join(temporaryRoot, `${name}.json`);
      await writeFile(auditPath, `${JSON.stringify(audit)}\n`, "utf8");
      const result = validate(auditPath);
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, message);
    }
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("base-R worker is slot-narrow and states the full-object memory boundary", async () => {
  const source = await readFile(rWorkerPath, "utf8");
  for (const literal of [
    "gzcon(raw_stdin, allowNonCompressed = FALSE, text = FALSE)",
    "readRDS(compressed_stdin)",
    'attr(object, "meta.data", exact = TRUE)',
    "rm(object)",
    "invisible(gc(verbose = FALSE))",
    'complete_object_materialized_by_read_rds = "true"',
    'cross_assay_cell_identity_verified = "false"',
  ]) {
    assert.ok(source.includes(literal), "missing base-R boundary: " + literal);
  }
  assert.doesNotMatch(source, /SeuratObject::|library\(|requireNamespace\(/);
  const executableSource = source
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("#"))
    .join("\n");
  assert.doesNotMatch(executableSource, /jsonlite|digest::/);
});

test("lossless parser distinguishes source NA, empty, whitespace, and literal NA", async () => {
  const temporaryRoot = await mkdtemp(join(tmpdir(), "cano-r-lossless-"));
  try {
    const csvPath = join(temporaryRoot, "values.csv");
    await writeFile(
      csvPath,
      ['"field"', "NA", '""', '" "', '"NA"', '"quote""inside"', ""].join("\n"),
      "utf8",
    );
    const program = [
      "import importlib.util,pathlib,sys",
      "p=pathlib.Path(sys.argv[1]).resolve()",
      "s=importlib.util.spec_from_file_location('stream',p)",
      "m=importlib.util.module_from_spec(s)",
      "sys.modules[s.name]=m",
      "s.loader.exec_module(m)",
      "h,r=m._lossless_table(pathlib.Path(sys.argv[2]))",
      "assert h==('field',)",
      "assert [x[0] for x in r]==[None,'',' ','NA','quote\"inside']",
      "print('ok')",
    ].join("; ");
    assert.equal(
      execFileSync(python, ["-c", program, pythonPath, csvPath], {
        encoding: "utf8",
      }).trim(),
      "ok",
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

const fixtureFiles = () => ({
  "metadata.csv": [
    '"nucleus_id","transmitter_class","group","neuron_type","source","anatomy","sex"',
    '"AAAC-1","CHOL","G1","T1","P56","Lumbar","M"',
    '"AAAC-2","CHOL","G1",NA,"P56","Lumbar ","F"',
    '"AAAC-3","CHOL","G2","","P56","Sacral","F"',
    '"AAAC-4","CHOL","G2","NA","P56","Tab\tHere","M"',
    "",
  ].join("\n"),
  "columns.csv": [
    '"source_column_index","column_name","typeof","storage_mode","class","is_factor","is_ordered_factor"',
    '"1","groups","integer","integer","factor","true","false"',
    '"2","neuron_types","integer","integer","factor","true","false"',
    '"3","anatomy","character","character","character","false","false"',
    '"4","source","character","character","character","false","false"',
    '"5","Sex","character","character","character","false","false"',
    "",
  ].join("\n"),
  "required_profiles.csv": [
    '"source_column_present","source_column_index","column_name","emission_mode","source_column_absence_reason","typeof","storage_mode","class","is_factor","is_ordered_factor","row_count","source_na_count","source_empty_string_count","source_whitespace_only_count","observed_nonempty_unique_count"',
    '"true","1","groups","PRESERVED_SOURCE_COLUMN_VALUES",NA,"integer","integer","factor","true","false","4","0","0","0","2"',
    '"true","2","neuron_types","PRESERVED_SOURCE_COLUMN_VALUES",NA,"integer","integer","factor","true","false","4","1","1","0","2"',
    '"true","3","anatomy","PRESERVED_SOURCE_COLUMN_VALUES",NA,"character","character","character","false","false","4","0","0","0","4"',
    '"true","4","source","PRESERVED_SOURCE_COLUMN_VALUES",NA,"character","character","character","false","false","4","0","0","0","1"',
    '"true","5","Sex","PRESERVED_SOURCE_COLUMN_VALUES",NA,"character","character","character","false","false","4","0","0","0","2"',
    "",
  ].join("\n"),
  "factor_levels.csv": [
    '"column_name","level_index","level","observed_count"',
    '"groups","1","G1","2"',
    '"groups","2","G2","2"',
    '"groups","3","UNUSED","0"',
    '"neuron_types","1","","1"',
    '"neuron_types","2","NA","1"',
    '"neuron_types","3","T1","1"',
    '"neuron_types","4",NA,"1"',
    "",
  ].join("\n"),
  "worker_receipt.csv": [
    '"contract_version","r_version","r_platform","object_class","object_is_s4","metadata_access","metadata_rows","metadata_columns","required_assignment_columns","optional_context_columns","present_optional_context_columns","absent_optional_context_columns","absent_optional_context_emitted_as_source_na","observed_groups","observed_nonempty_neuron_types","base_r_only","complete_object_materialized_by_read_rds","seurat_object_namespace_loaded","cross_assay_cell_identity_verified","same_cell_claim_authorized","geometry_claim_authorized","internal_structure_claim_authorized"',
    '"0.1.0","fixture","fixture","Seurat","true","attr(object, meta.data, exact=TRUE)","4","5","groups|neuron_types","source|anatomy|Sex","source|anatomy|Sex","","true","2","2","true","true","false","false","false","false","false"',
    "",
  ].join("\n"),
});

test("fixture packaging is deterministic and keeps all claim boundaries false", async () => {
  const temporaryRoot = await mkdtemp(join(tmpdir(), "cano-r-package-"));
  try {
    for (const name of ["first", "second"]) {
      const artifacts = join(temporaryRoot, name + "-run", "artifacts");
      await mkdir(artifacts, { recursive: true });
      for (const [fileName, payload] of Object.entries(fixtureFiles())) {
        await writeFile(join(artifacts, fileName), payload, "utf8");
      }
    }
    const program = [
      "import importlib.util,pathlib,sys",
      "p=pathlib.Path(sys.argv[1]).resolve(); root=pathlib.Path(sys.argv[2])",
      "s=importlib.util.spec_from_file_location('stream',p); m=importlib.util.module_from_spec(s); sys.modules[s.name]=m; s.loader.exec_module(m)",
      "spec=m.SourceSpec('CHOL','fixture.rds',335,4,2,'https://example.invalid/fixture.rds')",
      "t=m.TransportReceipt(335,'a'*64,200,335,'x-gzip','',spec.public_url,123456)",
      "[(m.validate_and_package_worker_artifacts(spec,'a'*64,t,root/(n+'-run'),root/n,p.with_suffix('.R'),p)) for n in ('first','second')]",
      "assert (root/'first'/'fixture.metadata.csv.gz').read_bytes()==(root/'second'/'fixture.metadata.csv.gz').read_bytes()",
      "assert (root/'first'/'fixture.audit.json').read_bytes()==(root/'second'/'fixture.audit.json').read_bytes()",
      "a=__import__('json').loads((root/'first'/'fixture.audit.json').read_text())",
      "assert a['metadataFields']['neuron_types']['sourceMissingCount']==1",
      "assert a['metadataFields']['neuron_types']['sourceEmptyStringCount']==1",
      "assert a['metadataFields']['neuron_types']['counts']['NA']==1",
      "assert a['crossAssayCellIdentityVerified'] is False",
      "assert a['identityChecks']['crossAssayCellIdentityVerified'] is False",
      "assert a['scopeBoundaries']['geometryClaimAuthorized'] is False",
      "print('ok')",
    ].join("; ");
    assert.equal(
      execFileSync(python, ["-c", program, pythonPath, temporaryRoot], {
        encoding: "utf8",
      }).trim(),
      "ok",
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test(
  "portable R reads unknown Seurat S4 metadata without SeuratObject",
  { skip: !process.env.CANO_BASE_R_RSCRIPT },
  async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "cano-r-worker-"));
    try {
      const rdsPath = join(temporaryRoot, "fixture.rds");
      const outputPath = join(temporaryRoot, "output");
      await mkdir(outputPath);
      const creator = [
        'setClass("Seurat", slots=c("meta.data"="data.frame"))',
        'm <- data.frame(groups=factor(c("G1","G1","G2","G2"), levels=c("G1","G2","UNUSED")), neuron_types=factor(c("T1", NA, "", "NA"), exclude=NULL), anatomy=c("Lumbar","Lumbar ","Sacral","Tab\\tHere"), source=rep("P56",4), Sex=c("M","F","F","M"), check.names=FALSE)',
        'rownames(m) <- c("AAAC-1","AAAC-2","AAAC-3","AAAC-4")',
        'saveRDS(new("Seurat", meta.data=m), commandArgs(TRUE)[1], compress="gzip", version=3)',
      ].join("; ");
      execFileSync(process.env.CANO_BASE_R_RSCRIPT, ["-e", creator, rdsPath]);
      execFileSync(
        process.env.CANO_BASE_R_RSCRIPT,
        [rWorkerPath, "CHOL", "4", "2", outputPath],
        { input: await readFile(rdsPath) },
      );
      const metadata = await readFile(join(outputPath, "metadata.csv"), "utf8");
      assert.ok(metadata.includes('"AAAC-2","CHOL","G1",NA'));
      assert.ok(metadata.includes('"AAAC-3","CHOL","G2",""'));
      assert.ok(metadata.includes('"AAAC-4","CHOL","G2","NA"'));
      const receipt = await readFile(join(outputPath, "worker_receipt.csv"), "utf8");
      assert.ok(receipt.includes('"Seurat","true"'));

      const localRun = join(temporaryRoot, "local-run");
      await mkdir(localRun);
      const localProgram = [
        "import hashlib,importlib.util,pathlib,sys",
        "p=pathlib.Path(sys.argv[1]).resolve(); rds=pathlib.Path(sys.argv[2]).resolve(); root=pathlib.Path(sys.argv[3]); rscript=pathlib.Path(sys.argv[4]).resolve()",
        "s=importlib.util.spec_from_file_location('stream',p); m=importlib.util.module_from_spec(s); sys.modules[s.name]=m; s.loader.exec_module(m)",
        "sha=hashlib.sha256(rds.read_bytes()).hexdigest()",
        "spec=m.SourceSpec('CHOL',rds.name,rds.stat().st_size,4,2,'https://example.invalid/fixture.rds')",
        "t=m.stream_source_to_r_worker(spec,sha,rscript,p.with_suffix('.R'),root/'local-run',60,65536,source_file=rds)",
        "assert t.source_persisted_to_disk is True and t.source_file_basename=='fixture.rds'",
        "m.validate_and_package_worker_artifacts(spec,sha,t,root/'local-run',root/'local-output',p.with_suffix('.R'),p)",
        "a=__import__('json').loads((root/'local-output'/'fixture.audit.json').read_text())",
        "assert a['transport']['sourcePersistedToDisk'] is True",
        "assert a['transport']['localSourceBasename']=='fixture.rds'",
        "assert str(rds) not in (root/'local-output'/'fixture.audit.json').read_text()",
        "print('ok')",
      ].join("; ");
      assert.equal(
        execFileSync(
          python,
          [
            "-c",
            localProgram,
            pythonPath,
            rdsPath,
            temporaryRoot,
            process.env.CANO_BASE_R_RSCRIPT,
          ],
          { encoding: "utf8" },
        ).trim(),
        "ok",
      );
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  },
);

test(
  "portable R receipts source-absent optional context as source NA and rejects silent defaults",
  { skip: !process.env.CANO_BASE_R_RSCRIPT },
  async () => {
    const temporaryRoot = await mkdtemp(
      join(tmpdir(), "cano-r-worker-absent-context-"),
    );
    try {
      const rdsPath = join(temporaryRoot, "fixture-absent-context.rds");
      const workerArtifacts = join(temporaryRoot, "worker-artifacts");
      await mkdir(workerArtifacts);
      const creator = [
        'setClass("Seurat", slots=c("meta.data"="data.frame"))',
        'm <- data.frame(groups=factor(c("G1","G1","G2","G2")), neuron_types=factor(c("T1","T1","T2","T2")), anatomy=c("Lumbar","Lumbar","Sacral","Sacral"), check.names=FALSE)',
        'rownames(m) <- c("AAAC-1","AAAC-2","AAAC-3","AAAC-4")',
        'saveRDS(new("Seurat", meta.data=m), commandArgs(TRUE)[1], compress="gzip", version=3)',
      ].join("; ");
      execFileSync(process.env.CANO_BASE_R_RSCRIPT, ["-e", creator, rdsPath]);
      execFileSync(
        process.env.CANO_BASE_R_RSCRIPT,
        [rWorkerPath, "CHOL", "4", "2", workerArtifacts],
        { input: await readFile(rdsPath) },
      );

      const metadata = await readFile(
        join(workerArtifacts, "metadata.csv"),
        "utf8",
      );
      assert.deepEqual(metadata.trimEnd().split("\n").slice(1), [
        '"AAAC-1","CHOL","G1","T1",NA,"Lumbar",NA',
        '"AAAC-2","CHOL","G1","T1",NA,"Lumbar",NA',
        '"AAAC-3","CHOL","G2","T2",NA,"Sacral",NA',
        '"AAAC-4","CHOL","G2","T2",NA,"Sacral",NA',
      ]);

      const profiles = await readFile(
        join(workerArtifacts, "required_profiles.csv"),
        "utf8",
      );
      const absentProfile = (field) =>
        `"false",NA,"${field}","SOURCE_COLUMN_ABSENT_EMITTED_AS_SOURCE_NA","source_meta_data_column_absent",NA,NA,NA,NA,NA,"4","4","0","0","0"`;
      assert.ok(profiles.includes(absentProfile("source")));
      assert.ok(profiles.includes(absentProfile("Sex")));
      assert.match(
        profiles,
        /"true","3","anatomy","PRESERVED_SOURCE_COLUMN_VALUES",NA/,
      );

      const workerReceipt = await readFile(
        join(workerArtifacts, "worker_receipt.csv"),
        "utf8",
      );
      assert.ok(
        workerReceipt.includes(
          ',"source|anatomy|Sex","anatomy","source|Sex","true",',
        ),
      );

      const validRun = join(temporaryRoot, "valid-run");
      await mkdir(validRun);
      await cp(workerArtifacts, join(validRun, "artifacts"), {
        recursive: true,
      });
      const packageProgram = [
        "import importlib.util,pathlib,sys",
        "p=pathlib.Path(sys.argv[1]).resolve(); rds=pathlib.Path(sys.argv[2]).resolve(); run=pathlib.Path(sys.argv[3]); out=pathlib.Path(sys.argv[4])",
        "s=importlib.util.spec_from_file_location('stream',p); m=importlib.util.module_from_spec(s); sys.modules[s.name]=m; s.loader.exec_module(m)",
        "sha=m.sha256_file(rds); size=rds.stat().st_size; url='https://example.invalid/fixture-absent-context.rds'",
        "spec=m.SourceSpec('CHOL',rds.name,size,4,2,url)",
        "t=m.TransportReceipt(source_bytes=size,source_sha256=sha,http_status=200,response_content_length=size,response_content_encoding='',response_last_modified='',final_url=url,r_worker_max_resident_set_bytes=0,source_persisted_to_disk=True,source_file_basename=rds.name)",
        "m.validate_and_package_worker_artifacts(spec,sha,t,run,out,p.with_suffix('.R'),p)",
        "print('ok')",
      ].join("; ");
      const packagedOutput = join(temporaryRoot, "packaged-output");
      assert.equal(
        execFileSync(
          python,
          [
            "-c",
            packageProgram,
            pythonPath,
            rdsPath,
            validRun,
            packagedOutput,
          ],
          { encoding: "utf8" },
        ).trim(),
        "ok",
      );
      const audit = JSON.parse(
        await readFile(
          join(packagedOutput, "fixture-absent-context.audit.json"),
          "utf8",
        ),
      );
      assert.deepEqual(audit.metadataFieldContract.presentOptionalContextFields, [
        "anatomy",
      ]);
      assert.deepEqual(audit.metadataFieldContract.absentOptionalContextFields, [
        "source",
        "Sex",
      ]);
      for (const field of ["source", "Sex"]) {
        assert.deepEqual(
          {
            sourceColumnPresent: audit.metadataFields[field].sourceColumnPresent,
            sourceColumnIndex: audit.metadataFields[field].sourceColumnIndex,
            emissionMode: audit.metadataFields[field].emissionMode,
            sourceColumnAbsenceReason:
              audit.metadataFields[field].sourceColumnAbsenceReason,
            sourceMissingCount: audit.metadataFields[field].sourceMissingCount,
            sourceEmptyStringCount:
              audit.metadataFields[field].sourceEmptyStringCount,
            observedNonemptyUniqueCount:
              audit.metadataFields[field].observedNonemptyUniqueCount,
            counts: audit.metadataFields[field].counts,
          },
          {
            sourceColumnPresent: false,
            sourceColumnIndex: null,
            emissionMode: "SOURCE_COLUMN_ABSENT_EMITTED_AS_SOURCE_NA",
            sourceColumnAbsenceReason: "source_meta_data_column_absent",
            sourceMissingCount: 4,
            sourceEmptyStringCount: 0,
            observedNonemptyUniqueCount: 0,
            counts: { "": 4 },
          },
        );
      }
      assert.equal(audit.scopeBoundaries.optionalContextInferenceApplied, false);
      assert.equal(
        audit.scopeBoundaries.sourceColumnAbsenceInterpretedAsBiologicalAbsence,
        false,
      );

      const validateProgram = [
        "import importlib.util,pathlib,sys",
        "p=pathlib.Path(sys.argv[1]).resolve(); rds=pathlib.Path(sys.argv[2]).resolve(); artifacts=pathlib.Path(sys.argv[3])",
        "s=importlib.util.spec_from_file_location('stream',p); m=importlib.util.module_from_spec(s); sys.modules[s.name]=m; s.loader.exec_module(m)",
        "spec=m.SourceSpec('CHOL',rds.name,rds.stat().st_size,4,2,'https://example.invalid/fixture-absent-context.rds')",
        "m.validate_worker_artifacts(spec,artifacts)",
      ].join("; ");
      const validateArtifacts = (artifacts) =>
        spawnSync(
          python,
          ["-c", validateProgram, pythonPath, rdsPath, artifacts],
          { encoding: "utf8" },
        );

      const silentDefaultArtifacts = join(
        temporaryRoot,
        "silent-default-artifacts",
      );
      await cp(workerArtifacts, silentDefaultArtifacts, { recursive: true });
      const silentDefaultPath = join(
        silentDefaultArtifacts,
        "metadata.csv",
      );
      const silentDefaultSource = await readFile(silentDefaultPath, "utf8");
      const silentlyDefaulted = silentDefaultSource.replace(
        '"AAAC-1","CHOL","G1","T1",NA,"Lumbar",NA',
        '"AAAC-1","CHOL","G1","T1","P56","Lumbar",NA',
      );
      assert.notEqual(silentlyDefaulted, silentDefaultSource);
      await writeFile(silentDefaultPath, silentlyDefaulted, "utf8");
      const silentDefaultResult = validateArtifacts(silentDefaultArtifacts);
      assert.notEqual(silentDefaultResult.status, 0);
      assert.match(
        silentDefaultResult.stderr,
        /absent source column was not emitted entirely as source NA/i,
      );

      const presenceMismatchArtifacts = join(
        temporaryRoot,
        "presence-mismatch-artifacts",
      );
      await cp(workerArtifacts, presenceMismatchArtifacts, { recursive: true });
      const presenceMismatchPath = join(
        presenceMismatchArtifacts,
        "required_profiles.csv",
      );
      const presenceSource = await readFile(presenceMismatchPath, "utf8");
      const presenceMismatch = presenceSource.replace(
        '"false",NA,"source"',
        '"true",NA,"source"',
      );
      assert.notEqual(presenceMismatch, presenceSource);
      await writeFile(presenceMismatchPath, presenceMismatch, "utf8");
      const presenceMismatchResult = validateArtifacts(
        presenceMismatchArtifacts,
      );
      assert.notEqual(presenceMismatchResult.status, 0);
      assert.match(
        presenceMismatchResult.stderr,
        /source-column presence disagrees with inventory/i,
      );
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  },
);
