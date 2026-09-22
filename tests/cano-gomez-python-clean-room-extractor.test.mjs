import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { gunzipSync } from "node:zlib";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const extractorPath = join(
  projectRoot,
  "tools",
  "extract_cano_gomez_rds_metadata.py",
);
const patchPath = join(
  projectRoot,
  "tools",
  "patches",
  "rdata-0.11.2-seurat-rds-parser.patch",
);
const runtimeReceiptPath = join(
  projectRoot,
  "tools",
  "cano_gomez_python_rdata_runtime-0.1.json",
);
const python = process.env.PYTHON ?? "python3";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

test("Python clean-room extractor compiles without importing rdata", () => {
  execFileSync(
    python,
    [
      "-c",
      "from pathlib import Path; p=Path(__import__('sys').argv[1]); compile(p.read_text(encoding='utf-8'), str(p), 'exec'); print('ok')",
      extractorPath,
    ],
    { encoding: "utf8" },
  );
});

test("extractor pins canonical sources, exact runtime, and checksum-gated input", async () => {
  const source = await readFile(extractorPath, "utf8");

  for (const literal of [
    'AUTHORITY_MODE = "PYTHON_RDATA_META_DATA_ROW_ONLY"',
    '"GSE318731_P56_cholinergic_multiome.rds"',
    '"GSE318731_P56_gabaergic_multiome.rds"',
    '"GSE318731_P56_glutamatergic_multiome_UPDATE.rds"',
    "expected_bytes=127_862_795",
    "expected_bytes=1_646_402_816",
    "expected_bytes=1_832_005_077",
    '"numpy": "2.0.2"',
    '"pandas": "2.3.3"',
    '"rdata": "0.11.2"',
    "PATCHED_PARSER_SHA256",
    '"--expected-source-sha256"',
    "sourceSha256MatchesExpected",
  ]) {
    assert.ok(source.includes(literal), `missing pinned contract literal: ${literal}`);
  }

  assert.doesNotMatch(source, /\/private\/tmp|ohri-rdata-env/);
});

test("identity authority is restricted to meta.data row names and same-row fields", async () => {
  const source = await readFile(extractorPath, "utf8");

  for (const literal of [
    'return getattr(root, "meta.data", None)',
    '"stableIdSource": "meta.data row.names"',
    '"sameRowRawMetadataAssignmentVerified": True',
    '"crossAssayCellIdentityVerified": False',
    '"sameCellClaimAuthorized": False',
    '"geometryClaimAuthorized": False',
    '"internalStructureClaimAuthorized": False',
  ]) {
    assert.ok(source.includes(literal), `missing scope boundary: ${literal}`);
  }

  assert.doesNotMatch(source, /getattr\(root,\s*["']assays["']/);
  assert.doesNotMatch(source, /SeuratObject::Cells|colnames\(object|sameCellClaimAuthorized": True/);
});

test("rdata 0.11.2 patch artifact and runtime receipt carry exact checksums", async () => {
  const [patchBytes, receiptBytes] = await Promise.all([
    readFile(patchPath),
    readFile(runtimeReceiptPath),
  ]);
  const patchSource = patchBytes.toString("utf8");
  const receipt = JSON.parse(receiptBytes.toString("utf8"));

  assert.equal(
    sha256(patchBytes),
    "3be9fc99c76e35c729f6d63905f67b0e920d39fd40d9cf91a6b9c9b03ed511f6",
  );
  assert.equal(receipt.parserPatch.artifactSha256, sha256(patchBytes));
  assert.equal(
    receipt.parserPatch.stockParserFileSha256,
    "fd420b1655113a7f48526f2e32c6e833f1fd3846c683e066bd565117c2292530",
  );
  assert.equal(
    receipt.parserPatch.patchedParserFileSha256,
    "52aa37ef301136240931dd0970f9891da127aa222bd84541239b774b19337aa5",
  );
  assert.equal(receipt.authorityMode, "PYTHON_RDATA_META_DATA_ROW_ONLY");
  assert.equal(receipt.scopeBoundaries.crossAssayCellIdentityVerified, false);

  for (const literal of [
    "RObjectType.WEAKREF",
    "RObjectType.RAW",
    "RObjectType.PERSIST",
    "RObjectType.PACKAGE",
    "RObjectType.NAMESPACE",
    "RObjectType.BASENAMESPACE",
    "RObjectType.UNBOUNDVALUE",
  ]) {
    assert.ok(patchSource.includes(literal), `patch lacks ${literal}`);
  }
});

test("pure fixture path proves deterministic bytes and preserves exact raw labels", async () => {
  const temporaryRoot = await mkdtemp(join(tmpdir(), "cano-clean-room-test-"));
  try {
    const pythonProgram = String.raw`
import sys
from pathlib import Path
sys.path.insert(0, sys.argv[1])
import extract_cano_gomez_rds_metadata as extractor

source_sha = "a" * 64
snapshot = extractor.MetadataSnapshot(
    source_file_name="GSE318731_P56_cholinergic_multiome.rds",
    source_bytes=123,
    source_expected_bytes=123,
    source_sha256=source_sha,
    source_expected_sha256=source_sha,
    transmitter_class="CHOL",
    expected_rows=3,
    expected_groups=2,
    row_names=("AAAC-1", "AAAC-2", "AAAC-3"),
    metadata_columns=("groups", "neuron_types", "anatomy", "source", "Sex", "nCount_RNA"),
    values={
        "groups": ("CHOL_IN", "CHOL_IN", "CHOL_aMN_Vipr2"),
        "neuron_types": ("CHOL_IN_Pitx2_ Srpx2", "Unicode_β", None),
        "anatomy": ("Lumbar", "", " "),
        "source": ("NA", "P56", "P56"),
        "Sex": ("M", "F", "F"),
    },
    storage_classes={
        "groups": "category", "neuron_types": "category", "anatomy": "category",
        "source": "category", "Sex": "category",
    },
    factor_levels={
        "groups": ("CHOL_IN", "CHOL_aMN_Vipr2", "UNUSED_LEVEL"),
        "neuron_types": ("CHOL_IN_Pitx2_ Srpx2", "Unicode_β"),
        "anatomy": ("", " ", "Lumbar"),
        "source": ("NA", "P56"),
        "Sex": ("F", "M"),
    },
)
runtime = extractor.RuntimeReceipt(
    python_implementation="CPython",
    python_version="fixture",
    package_versions={"numpy": "2.0.2", "pandas": "2.3.3", "rdata": "0.11.2"},
    parser_sha256=extractor.PATCHED_PARSER_SHA256,
)
for output in (Path(sys.argv[2]), Path(sys.argv[3])):
    extractor.write_artifacts(snapshot, runtime, output, extractor_sha256="b" * 64)
try:
    extractor.write_artifacts(snapshot, runtime, Path(sys.argv[2]), extractor_sha256="b" * 64)
except FileExistsError:
    pass
else:
    raise AssertionError("write_artifacts did not fail closed on existing output")
`;
    const first = join(temporaryRoot, "first");
    const second = join(temporaryRoot, "second");
    execFileSync(
      python,
      [
        "-c",
        pythonProgram,
        join(projectRoot, "tools"),
        first,
        second,
      ],
      { stdio: "pipe" },
    );

    const stem = "GSE318731_P56_cholinergic_multiome";
    const [firstGzip, secondGzip, firstAudit, secondAudit] = await Promise.all([
      readFile(join(first, `${stem}.metadata.csv.gz`)),
      readFile(join(second, `${stem}.metadata.csv.gz`)),
      readFile(join(first, `${stem}.audit.json`)),
      readFile(join(second, `${stem}.audit.json`)),
    ]);
    assert.deepEqual(firstGzip, secondGzip);
    assert.deepEqual(firstAudit, secondAudit);
    assert.deepEqual([...firstGzip.subarray(4, 8)], [0, 0, 0, 0]);

    const csvText = gunzipSync(firstGzip).toString("utf8");
    assert.ok(
      csvText.startsWith(
        "nucleus_id,transmitter_class,group,neuron_type,source,anatomy,sex\n",
      ),
    );
    assert.ok(csvText.includes("CHOL_IN_Pitx2_ Srpx2"));
    assert.ok(csvText.includes("Unicode_β"));
    const csvLines = csvText.trimEnd().split("\n");
    assert.equal(
      csvLines[1],
      '"AAAC-1","CHOL","CHOL_IN","CHOL_IN_Pitx2_ Srpx2","NA","Lumbar","M"',
    );
    assert.equal(
      csvLines[2],
      '"AAAC-2","CHOL","CHOL_IN","Unicode_β","P56","","F"',
    );
    assert.equal(
      csvLines[3],
      '"AAAC-3","CHOL","CHOL_aMN_Vipr2",NA,"P56"," ","F"',
    );

    const audit = JSON.parse(firstAudit.toString("utf8"));
    assert.equal(audit.authorityMode, "PYTHON_RDATA_META_DATA_ROW_ONLY");
    assert.equal(audit.sourceExpectedSha256, "a".repeat(64));
    assert.equal(audit.sourceSha256MatchesExpected, true);
    assert.equal(audit.identityChecks.metadataRowNamesUniqueNonempty, true);
    assert.equal(audit.identityChecks.crossAssayCellIdentityVerified, false);
    assert.equal(audit.identityChecks.sameCellClaimAuthorized, false);
    assert.equal(audit.metadataFields.groups.counts.CHOL_IN, 2);
    assert.deepEqual(audit.metadataFields.groups.zeroCountLevels, ["UNUSED_LEVEL"]);
    assert.equal(audit.metadataFields.neuron_types.sourceMissingCount, 1);
    assert.equal(audit.metadataFields.neuron_types.counts[""], 1);
    assert.equal(audit.metadataFields.anatomy.sourceEmptyStringCount, 1);
    assert.equal(audit.metadataFields.anatomy.sourceWhitespaceOnlyCount, 1);
    assert.equal(audit.metadataFields.source.counts.NA, 1);
    assert.equal(audit.output.metadataCsvGzip.compressedSha256, sha256(firstGzip));
    assert.equal(
      audit.identityChecks.stableCompoundKeyExpression,
      "GSE318731|exact source filename|row.name",
    );
    assert.match(audit.identityChecks.orderedMetadataRowNamesSha256, /^[0-9a-f]{64}$/);
    assert.match(
      audit.identityChecks.orderedCompoundNucleusKeysSha256,
      /^[0-9a-f]{64}$/,
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
