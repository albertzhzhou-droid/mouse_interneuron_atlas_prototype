import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  validateDelileDevelopmentalInterneuronTaxonomy,
  validatePersistedDelileDevelopmentalInterneuronTaxonomy,
} from "../scripts/validate-delile-developmental-interneuron-taxonomy-0.1.mjs";
import {
  DELILE_CARDINAL_COUNTS,
  DELILE_FINE_SUBTYPE_COUNTS,
  DELILE_METADATA_RECEIPT,
  auditDelileAnnotatedMetadata,
  buildDelileDevelopmentalInterneuronTaxonomy,
  parseRTabRow,
  writeDelileDevelopmentalInterneuronTaxonomy,
} from "../tools/build_delile_developmental_interneuron_taxonomy.mjs";

const DATA_URL = new URL("../data/delile-developmental-interneuron-taxonomy-0.1.json", import.meta.url);
const taxonomyText = await readFile(DATA_URL, "utf8");
const taxonomy = JSON.parse(taxonomyText);
const OPTIONAL_SOURCE_PATH = process.env.DELILE_ANNOTATED_METADATA_PATH ?? "/tmp/delile-phenoData_annotated.csv";

test("locks the exact 51-profile Delile roster and every denominator exclusion", async () => {
  const report = await validateDelileDevelopmentalInterneuronTaxonomy(taxonomy);
  assert.deepEqual(report, {
    releaseId: "ohri-delile-developmental-interneuron-taxonomy-0.1.0",
    sourceCellCount: 41025,
    sourceDefinedNeuronCellCount: 18144,
    sourceTypedNonmotorNeuronCellCount: 15394,
    fineSubtypeProfileCount: 51,
    fineSubtypeInterneuronCellCount: 15217,
    cardinalOnlyInterneuronCellCount: 177,
    motorNeuronExcludedCellCount: 1056,
    nullNeuronExcludedCellCount: 1694,
    admittedGeometryCount: 0,
    admittedInternalStructureCount: 0,
    sameCellCrossModalJoinCount: 0,
    projectRegistrationCount: 0,
  });
  assert.deepEqual(taxonomy.profiles.map((profile) => [profile.sourceLocalLabel, profile.cellCount]), Object.entries(DELILE_FINE_SUBTYPE_COUNTS));
  assert.equal(taxonomy.profiles.reduce((sum, profile) => sum + profile.cellCount, 0), 15217);
  assert.deepEqual(
    taxonomy.cardinalClassSummaries.map((row) => [row.sourceLocalLabel, row.sourceTypedCellCount]),
    Object.entries(DELILE_CARDINAL_COUNTS),
  );
  assert.deepEqual(taxonomy.cardinalOnlySummaries.map((row) => [row.sourceLocalLabel, row.cellCount]), [["dl6", 95], ["V2a", 82]]);
  assert.equal(taxonomy.scope.sourceDefinedNeuronCellCount, 15394 + 1056 + 1694);
  assert.equal(taxonomy.scope.sourceTypedNonmotorNeuronCellCount, 15217 + 177);
});

test("locks the pinned source, immutable object receipt, link-only rights boundary and canonical derivative", async () => {
  const object = taxonomy.source.annotatedMetadataObject;
  assert.deepEqual(
    {
      pinnedCommit: taxonomy.source.repository.pinnedCommit,
      bytes: object.bytes,
      md5: object.md5,
      sha256: object.sha256,
      gitBlobSha1: object.gitBlobSha1,
      rowCount: object.rowCount,
    },
    {
      pinnedCommit: DELILE_METADATA_RECEIPT.pinnedCommit,
      bytes: DELILE_METADATA_RECEIPT.bytes,
      md5: DELILE_METADATA_RECEIPT.md5,
      sha256: DELILE_METADATA_RECEIPT.sha256,
      gitBlobSha1: DELILE_METADATA_RECEIPT.gitBlobSha1,
      rowCount: DELILE_METADATA_RECEIPT.rowCount,
    },
  );
  assert.equal(object.sourceFileBundled, false);
  assert.equal(object.accessMode, "link_only");
  assert.equal(object.license, "NOASSERTION");
  assert.equal(taxonomy.source.repository.derivedFactualContractBundled, true);

  const persisted = await validatePersistedDelileDevelopmentalInterneuronTaxonomy();
  assert.equal(persisted.bytes, 122037);
  assert.equal(persisted.sha256, "7a77c8c10f15224188bb542fddf63bc97de57b06dd9289e324bc7b8612219597");
});

test("parses R-style tab rows without turning quoted NA into a missing value", () => {
  assert.deepEqual(parseRTabRow('"NA"\tNA\t"a""b"\t9.5', 7), ["NA", null, 'a"b', "9.5"]);
  assert.throws(() => parseRTabRow('"closed"suffix\tNA', 8), /characters after a closing quote/i);
  assert.throws(() => parseRTabRow('"unterminated\tNA', 9), /unterminated quoted field/i);
});

test("rejects profile, cardinal-only and denominator drift", async () => {
  const changedProfileCount = structuredClone(taxonomy);
  changedProfileCount.profiles[0].cellCount += 1;
  await assert.rejects(() => validateDelileDevelopmentalInterneuronTaxonomy(changedProfileCount), /exact 51-label.*profile roster changed|timepoint counts do not sum/i);

  const promotedDl6Subtype = structuredClone(taxonomy);
  promotedDl6Subtype.profiles[0].sourceLocalLabel = "dl6.1";
  promotedDl6Subtype.profiles[0].id = "delile-2019:E-MTAB-7320:dl6.1";
  await assert.rejects(() => validateDelileDevelopmentalInterneuronTaxonomy(promotedDl6Subtype), /schema validation|51-label/i);

  const changedCardinalOnly = structuredClone(taxonomy);
  changedCardinalOnly.cardinalOnlySummaries[0].cellCount = 94;
  await assert.rejects(() => validateDelileDevelopmentalInterneuronTaxonomy(changedCardinalOnly), /95 dl6 plus 82 V2a|timepoint counts do not sum/i);

  const animalPromotion = structuredClone(taxonomy);
  animalPromotion.scope.biologicalAnimalCount = 12;
  await assert.rejects(() => validateDelileDevelopmentalInterneuronTaxonomy(animalPromotion), /schema validation|animal denominator/i);
});

test("locks each profile's timepoint distribution, not only totals", async () => {
  const offsettingDrift = structuredClone(taxonomy);
  offsettingDrift.profiles[0].timepointCellCounts[2].cellCount -= 1;
  offsettingDrift.profiles[0].timepointCellCounts[3].cellCount += 1;
  offsettingDrift.profiles[1].timepointCellCounts[2].cellCount += 1;
  offsettingDrift.profiles[1].timepointCellCounts[3].cellCount -= 1;
  await assert.rejects(() => validateDelileDevelopmentalInterneuronTaxonomy(offsettingDrift), /exact 51-profile timepoint table changed/i);
});

test("rejects geometry, internal objects, registration and cross-modal joins", async () => {
  const geometry = structuredClone(taxonomy);
  geometry.profiles[0].cellXyz = [1, 2, 3];
  await assert.rejects(() => validateDelileDevelopmentalInterneuronTaxonomy(geometry), /schema validation|forbidden per-cell\/geometry/i);

  const internal = structuredClone(taxonomy);
  internal.profiles[0].internalObjects = [{ kind: "nucleus" }];
  await assert.rejects(() => validateDelileDevelopmentalInterneuronTaxonomy(internal), /schema validation|internal/i);

  const registration = structuredClone(taxonomy);
  registration.scope.projectRegistrationCount = 1;
  await assert.rejects(() => validateDelileDevelopmentalInterneuronTaxonomy(registration), /schema validation|must remain zero/i);

  const morphologyJoin = structuredClone(taxonomy);
  morphologyJoin.joinPolicy.typeToMorphologyJoinAllowed = true;
  await assert.rejects(() => validateDelileDevelopmentalInterneuronTaxonomy(morphologyJoin), /schema validation|joins must remain forbidden/i);
});

test("rejects rights escalation and source-body bundling", async () => {
  const assumedLicense = structuredClone(taxonomy);
  assumedLicense.source.repository.license = "CC0-1.0";
  await assert.rejects(() => validateDelileDevelopmentalInterneuronTaxonomy(assumedLicense), /schema validation|NOASSERTION/i);

  const bundledSource = structuredClone(taxonomy);
  bundledSource.source.annotatedMetadataObject.sourceFileBundled = true;
  await assert.rejects(() => validateDelileDevelopmentalInterneuronTaxonomy(bundledSource), /schema validation|link-only/i);

  const sourceBody = structuredClone(taxonomy);
  sourceBody.source.annotatedMetadataObject.sourceFileBody = "not allowed";
  await assert.rejects(() => validateDelileDevelopmentalInterneuronTaxonomy(sourceBody), /schema validation|source-body/i);
});

test("rejects a non-pinned source object before parsing biological labels", async () => {
  const directory = await mkdtemp(join(tmpdir(), "delile-bad-source-"));
  try {
    const path = join(directory, "phenoData_annotated.csv");
    await writeFile(path, Buffer.from('""\t"timepoint"\n"bad"\t9.5\n', "utf8"));
    await assert.rejects(() => auditDelileAnnotatedMetadata(path), /source byte count changed/i);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("audits the exact local source and deterministically rebuilds the committed derivative", { skip: !existsSync(OPTIONAL_SOURCE_PATH) }, async () => {
  const audit = await auditDelileAnnotatedMetadata(OPTIONAL_SOURCE_PATH);
  assert.deepEqual(audit.sourceReceipt, {
    fileName: "phenoData_annotated.csv",
    bytes: 3036323,
    md5: "43685445c3bd8a593e6bd7099d1a6eb3",
    sha256: "4f5bd353771ea478928e305df784f3fc868bb89a9ffc5fbce112da70c4a769bf",
    gitBlobSha1: "38945377a551225f0b216b1a818b80585a4b6cae",
    rowCount: 41025,
    columnCount: 9,
  });
  const built = await buildDelileDevelopmentalInterneuronTaxonomy({ sourcePath: OPTIONAL_SOURCE_PATH });
  assert.deepEqual(built, taxonomy);

  const directory = await mkdtemp(join(tmpdir(), "delile-taxonomy-"));
  try {
    const firstPath = join(directory, "first.json");
    const secondPath = join(directory, "nested", "second.json");
    const first = await writeDelileDevelopmentalInterneuronTaxonomy({ sourcePath: OPTIONAL_SOURCE_PATH, outputPath: firstPath });
    const second = await writeDelileDevelopmentalInterneuronTaxonomy({ sourcePath: OPTIONAL_SOURCE_PATH, outputPath: secondPath });
    assert.equal(first.outputSha256, "7a77c8c10f15224188bb542fddf63bc97de57b06dd9289e324bc7b8612219597");
    assert.equal(second.outputSha256, first.outputSha256);
    assert.equal(await readFile(firstPath, "utf8"), taxonomyText);
    assert.equal(await readFile(secondPath, "utf8"), taxonomyText);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
