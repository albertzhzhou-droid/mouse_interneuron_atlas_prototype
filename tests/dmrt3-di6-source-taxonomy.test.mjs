import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  DMRT3_DI6_SOURCE_RECEIPTS,
  auditDmrt3Notebook,
  auditDmrt3SourceGzip,
  auditDmrt3SourceLoom,
  buildDmrt3Di6SourceTaxonomy,
  writeDmrt3Di6SourceTaxonomy,
} from "../tools/build_dmrt3_di6_source_taxonomy.mjs";
import {
  validateDmrt3Di6SourceTaxonomy,
  validatePersistedDmrt3Di6SourceTaxonomy,
} from "../scripts/validate-dmrt3-di6-source-taxonomy-0.1.mjs";

const DATA_URL = new URL("../data/dmrt3-di6-source-taxonomy-0.1.json", import.meta.url);
const taxonomyText = await readFile(DATA_URL, "utf8");
const taxonomy = JSON.parse(taxonomyText);
const OPTIONAL_SOURCE_GZIP = process.env.DMRT3_SOURCE_GZIP ?? "";
const OPTIONAL_SOURCE_LOOM = process.env.DMRT3_SOURCE_LOOM ?? "";
const OPTIONAL_NOTEBOOK = process.env.DMRT3_NOTEBOOK ?? "";

test("locks the pooled Dmrt3/dI6 source lineage and all six study-local groups", async () => {
  const report = await validateDmrt3Di6SourceTaxonomy(taxonomy);
  assert.deepEqual(report, {
    releaseId: "ohri-dmrt3-di6-source-taxonomy-0.1.0",
    profileCount: 6,
    depositedMouseWellCount: 384,
    qcRetainedCellCount: 354,
    di6LineageRetainedCellCount: 274,
    sourceEmbryoCount: 3,
    independentLibraryCount: 1,
    perWellMGroupRosterCount: 0,
    projectRegistrationCount: 0,
    admittedGeometryCount: 0,
    admittedInternalStructureCount: 0,
    exactCrossSourceIdentityCount: 0,
  });
  assert.deepEqual(taxonomy.analysisLineage.stageCounts.map(({ stage, count }) => [stage, count]), [
    ["deposited_mouse_wells", 384],
    ["executed_notebook_QC_retained", 354],
    ["retained_dI6_lineage_subset", 274],
    ["M1_to_M6_partition", 274],
  ]);
  assert.equal(taxonomy.scope.sourceEmbryoCount, 3);
  assert.equal(taxonomy.scope.poolCount, 1);
  assert.equal(taxonomy.scope.independentLibraryCount, 1);
  assert.equal(taxonomy.scope.animalResolvedReplicateCount, 0);
});

test("preserves exact M1–M6 counts, markers and article temporal context", async () => {
  assert.deepEqual(taxonomy.profiles.map((profile) => profile.sourceLocalLabel), ["M1", "M2", "M3", "M4", "M5", "M6"]);
  assert.deepEqual(taxonomy.profiles.map((profile) => profile.samplingCount), [84, 34, 33, 45, 54, 24]);
  assert.equal(taxonomy.profiles.reduce((sum, profile) => sum + profile.samplingCount, 0), 274);
  assert.deepEqual(taxonomy.profiles.map((profile) => profile.markerPanel), [
    ["Zfhx3", "Meis2", "Zfhx4"],
    ["Irx4", "Tshz3", "Ldb2"],
    ["Pid1", "Sst", "Slit2"],
    ["Hoxb8", "Hoxb7", "Hoxb9"],
    ["Sall3", "Npy", "Nxph1"],
    ["Neurod6", "Neurod2", "Zeb2"],
  ]);
  assert.deepEqual(taxonomy.profiles.map((profile) => [profile.articleTemporalPhase, profile.articleTemporalAnchorGenes]), [
    ["early", ["Onecut2"]],
    ["middle", ["Zfhx3", "Zfhx4"]],
    ["middle", ["Zfhx3", "Zfhx4"]],
    ["late", ["Neurod6"]],
    ["late", ["Neurod6"]],
    ["late", ["Neurod6"]],
  ]);
  assert.ok(taxonomy.profiles.every((profile) => profile.putativeAssignmentStatus === "study_local_group_not_adult_canonical_type"));
  assert.ok(taxonomy.profiles.every((profile) => /not_per_cell_or_group_quantification$/.test(profile.populationTransmitterContext)));
});

test("rejects denominator drift, false animal replication and altered group partitions", async () => {
  const promotedReplicates = structuredClone(taxonomy);
  promotedReplicates.scope.animalResolvedReplicateCount = 3;
  await assert.rejects(() => validateDmrt3Di6SourceTaxonomy(promotedReplicates), /animalResolvedReplicateCount|animal-resolved replicate count/i);

  const changedQcCount = structuredClone(taxonomy);
  changedQcCount.scope.qcRetainedCellCount = 353;
  await assert.rejects(() => validateDmrt3Di6SourceTaxonomy(changedQcCount), /qcRetainedCellCount|QC-retained cell denominator/i);

  const swappedGroups = structuredClone(taxonomy);
  [swappedGroups.profiles[0].samplingCount, swappedGroups.profiles[1].samplingCount] = [
    swappedGroups.profiles[1].samplingCount,
    swappedGroups.profiles[0].samplingCount,
  ];
  await assert.rejects(() => validateDmrt3Di6SourceTaxonomy(swappedGroups), /count vector must remain exactly/i);

  const inflatedGroup = structuredClone(taxonomy);
  inflatedGroup.profiles[5].samplingCount += 1;
  await assert.rejects(() => validateDmrt3Di6SourceTaxonomy(inflatedGroup), /count vector|must sum to 274/i);
});

test("rejects per-well reconstruction, geometry, internal objects and adult-type promotion", async () => {
  const roster = structuredClone(taxonomy);
  roster.joinPolicy.perWellM1ToM6RosterAvailable = true;
  await assert.rejects(() => validateDmrt3Di6SourceTaxonomy(roster), /perWellM1ToM6RosterAvailable|per-well group roster/i);

  const rosterBody = structuredClone(taxonomy);
  rosterBody.analysisLineage.wellMGroupRoster = [{ well: "GSM", group: "M1" }];
  await assert.rejects(() => validateDmrt3Di6SourceTaxonomy(rosterBody), /additional properties|forbidden per-well/i);

  const geometry = structuredClone(taxonomy);
  geometry.scope.admittedGeometryCount = 1;
  await assert.rejects(() => validateDmrt3Di6SourceTaxonomy(geometry), /admittedGeometryCount|geometry.*remain zero/i);

  const internalObjects = structuredClone(taxonomy);
  internalObjects.profiles[0].internalObjects = [{ kind: "mitochondrion" }];
  await assert.rejects(() => validateDmrt3Di6SourceTaxonomy(internalObjects), /additional properties|internal-object/i);

  const adultType = structuredClone(taxonomy);
  adultType.profiles[0].putativeAssignmentStatus = "adult_canonical_type";
  await assert.rejects(() => validateDmrt3Di6SourceTaxonomy(adultType), /putativeAssignmentStatus|adult canonical type/i);
});

test("quarantines rather than harmonizes the Methods-versus-notebook QC and HVG conflict", async () => {
  assert.deepEqual(
    {
      methods: taxonomy.qualityControl.methodsDescription,
      executed: taxonomy.qualityControl.executedNotebook,
      status: taxonomy.qualityControl.reconciliationStatus,
    },
    {
      methods: {
        minimumLog1pTotalCountsExclusive: 10,
        maximumPercentCountsInTop50GenesExclusive: 40,
        minimumDetectedGenesExclusive: 3000,
        normalization: "normalize_total",
        highlyVariableGeneCount: 2000,
        locatorIds: ["methods-qc-description"],
      },
      executed: {
        minimumLog1pTotalCountsExclusive: 12.3,
        maximumPercentCountsInTop50GenesExclusive: 35,
        minimumDetectedGenesExclusive: 3700,
        normalization: "normalize_total_skipped_because_input_treated_as_RPKM",
        highlyVariableGeneCount: 5000,
        authorityStatus: "derivation_authority",
        locatorIds: ["notebook-cell-14-exec-13", "pinned-commit"],
      },
      status: "methods_vs_executed_notebook_conflict_quarantined",
    },
  );

  const harmonized = structuredClone(taxonomy);
  harmonized.qualityControl.executedNotebook.minimumLog1pTotalCountsExclusive = 10;
  harmonized.qualityControl.executedNotebook.maximumPercentCountsInTop50GenesExclusive = 40;
  harmonized.qualityControl.executedNotebook.minimumDetectedGenesExclusive = 3000;
  harmonized.qualityControl.executedNotebook.normalization = "normalize_total";
  harmonized.qualityControl.executedNotebook.highlyVariableGeneCount = 2000;
  harmonized.qualityControl.reconciliationStatus = "reconciled";
  await assert.rejects(() => validateDmrt3Di6SourceTaxonomy(harmonized), /executed-notebook QC\/HVG|reconciliationStatus|must remain quarantined/i);
});

test("locks source bytes, hashes, Git blobs and link-only bundling boundaries", async () => {
  const processed = taxonomy.source.geo.processedObject;
  assert.deepEqual(
    {
      compressedBytes: processed.compressedBytes,
      compressedMd5: processed.compressedMd5,
      compressedSha256: processed.compressedSha256,
      uncompressedBytes: processed.uncompressedBytes,
      uncompressedMd5: processed.uncompressedMd5,
      uncompressedSha256: processed.uncompressedSha256,
    },
    {
      compressedBytes: DMRT3_DI6_SOURCE_RECEIPTS.geoGzip.bytes,
      compressedMd5: DMRT3_DI6_SOURCE_RECEIPTS.geoGzip.md5,
      compressedSha256: DMRT3_DI6_SOURCE_RECEIPTS.geoGzip.sha256,
      uncompressedBytes: DMRT3_DI6_SOURCE_RECEIPTS.loom.bytes,
      uncompressedMd5: DMRT3_DI6_SOURCE_RECEIPTS.loom.md5,
      uncompressedSha256: DMRT3_DI6_SOURCE_RECEIPTS.loom.sha256,
    },
  );
  assert.equal(taxonomy.source.repository.pinnedCommit, "4096425edc4a8c008f6069e08ef4583120e550ae");
  assert.equal(taxonomy.source.repository.commitTree, "5dc914d53212e68104de30a84735c8ad21b5c4e7");
  assert.deepEqual(taxonomy.source.repository.sourceFiles.map((file) => [file.id, file.gitBlobSha1, file.bundled, file.accessMode]), [
    ["authors-loom", "05263c67a113ad14ba178f1385d4e548ab9fce0e", false, "link_only"],
    ["executed-notebook", "bf219e6dc49c18e67acd96573e01e8cce5cc3ff8", false, "link_only"],
  ]);

  const bundledNotebook = structuredClone(taxonomy);
  bundledNotebook.source.repository.sourceFiles[1].bundled = true;
  await assert.rejects(() => validateDmrt3Di6SourceTaxonomy(bundledNotebook), /bundled|link-only/i);

  const changedHash = structuredClone(taxonomy);
  changedHash.source.repository.sourceFiles[0].gitBlobSha1 = "0".repeat(40);
  await assert.rejects(() => validateDmrt3Di6SourceTaxonomy(changedHash), /loom Git blob changed/i);
});

test("deterministically rebuilds the exact committed compact derivative", async () => {
  const persisted = await validatePersistedDmrt3Di6SourceTaxonomy();
  assert.equal(persisted.bytes, 22490);
  assert.equal(persisted.sha256, "e5d7b26df781033a971282b697684cf6f71daa2fe711883475723186c2d92468");
  assert.deepEqual(await buildDmrt3Di6SourceTaxonomy(), taxonomy);

  const directory = await mkdtemp(join(tmpdir(), "dmrt3-di6-taxonomy-"));
  try {
    const firstPath = join(directory, "first.json");
    const secondPath = join(directory, "nested", "second.json");
    const first = await writeDmrt3Di6SourceTaxonomy({ outputPath: firstPath });
    const second = await writeDmrt3Di6SourceTaxonomy({ outputPath: secondPath });
    assert.equal(first.outputSha256, "e5d7b26df781033a971282b697684cf6f71daa2fe711883475723186c2d92468");
    assert.equal(second.outputSha256, first.outputSha256);
    assert.equal(await readFile(firstPath, "utf8"), taxonomyText);
    assert.equal(await readFile(secondPath, "utf8"), taxonomyText);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("rejects a non-pinned source gzip before attempting biological interpretation", async () => {
  const directory = await mkdtemp(join(tmpdir(), "dmrt3-bad-gzip-"));
  try {
    const path = join(directory, "GSE185731_mmusculus.loom.gz");
    await writeFile(path, Buffer.from("not the pinned GEO object", "utf8"));
    await assert.rejects(() => auditDmrt3SourceGzip(path), /GEO gzip byte count changed/i);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("optionally audits the exact GEO gzip and decompressed loom", { skip: !OPTIONAL_SOURCE_GZIP || !existsSync(OPTIONAL_SOURCE_GZIP) }, async () => {
  const audit = await auditDmrt3SourceGzip(OPTIONAL_SOURCE_GZIP);
  assert.equal(audit.compressed.bytes, 47641669);
  assert.equal(audit.compressed.sha256, "f31abb7678ed88af3e140ca488dfdce867809569784bc1881777462fdc87b23c");
  assert.equal(audit.decompressedLoom.bytes, 56090164);
  assert.equal(audit.decompressedLoom.sha256, "ccf345c05ceb27f9075a5add155cf70c162a0f8a70a9b6860bfb7b45bc03997f");
  assert.equal(audit.decompressedLoom.gitBlobSha1, "05263c67a113ad14ba178f1385d4e548ab9fce0e");
});

test("optionally audits the exact uncompressed loom Git object", { skip: !OPTIONAL_SOURCE_LOOM || !existsSync(OPTIONAL_SOURCE_LOOM) }, async () => {
  const audit = await auditDmrt3SourceLoom(OPTIONAL_SOURCE_LOOM);
  assert.equal(audit.bytes, 56090164);
  assert.equal(audit.sha256, "ccf345c05ceb27f9075a5add155cf70c162a0f8a70a9b6860bfb7b45bc03997f");
  assert.equal(audit.gitBlobSha1, "05263c67a113ad14ba178f1385d4e548ab9fce0e");
});

test("optionally audits the exact executed notebook Git object", { skip: !OPTIONAL_NOTEBOOK || !existsSync(OPTIONAL_NOTEBOOK) }, async () => {
  const audit = await auditDmrt3Notebook(OPTIONAL_NOTEBOOK);
  assert.equal(audit.bytes, 21627568);
  assert.equal(audit.sha256, "c51fa89ea3ce7f55a361ffe8b94f48b73bd9669c4260aeb3ee482208f23a9008");
  assert.equal(audit.gitBlobSha1, "bf219e6dc49c18e67acd96573e01e8cce5cc3ff8");
  assert.equal(audit.nbformat, 4);
  assert.equal(audit.nbformatMinor, 4);
  assert.equal(audit.cellCount, 207);
});
