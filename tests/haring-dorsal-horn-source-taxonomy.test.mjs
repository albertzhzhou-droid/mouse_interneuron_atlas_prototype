import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { validateHaringDorsalHornSourceTaxonomy } from "../scripts/validate-haring-dorsal-horn-source-taxonomy-0.1.mjs";
import {
  HARING_CLUSTER_COUNTS,
  HARING_SOURCE_OBJECT_RECEIPTS,
  auditHaringSourceObject,
  buildHaringDorsalHornTaxonomy,
  writeHaringDorsalHornTaxonomy,
} from "../tools/build_haring_dorsal_horn_taxonomy.mjs";

const DATA_URL = new URL("../data/haring-dorsal-horn-source-taxonomy-0.1.json", import.meta.url);
const taxonomyText = await readFile(DATA_URL, "utf8");
const taxonomy = JSON.parse(taxonomyText);
const SOURCE_PATHS = {
  countMatrix: "/private/tmp/GSE103840_molecule_counts.xlsx",
  supplementaryTable4: "/private/tmp/41593_2018_141_MOESM6_ESM.xlsx",
  supplementaryTable5: "/private/tmp/41593_2018_141_MOESM7_ESM.xlsx",
  supplementaryTable8: "/private/tmp/41593_2018_141_MOESM10_ESM.xlsx",
  supplementaryPdf: "/private/tmp/41593_2018_141_MOESM1_ESM.pdf",
};

test("locks the 30-profile Häring source-local dorsal-horn taxonomy", async () => {
  const report = await validateHaringDorsalHornSourceTaxonomy(taxonomy);
  assert.deepEqual(report, {
    releaseId: "ohri-haring-dorsal-horn-source-taxonomy-0.1.0",
    profileCount: 30,
    excitatoryProfileCount: 15,
    inhibitoryProfileCount: 15,
    profileSamplingCountSum: 1545,
    sourceAnimalCount: 28,
    geoCellAccessionCount: 1545,
    exactClusterCellAssignmentAvailable: true,
    projectConfirmedLocalInterneuronProfileCount: 0,
    exactCrossSourceIdentityCount: 0,
    projectRegistrationCount: 0,
  });
  assert.equal(taxonomy.scope.lifeStage, "postnatal P17-P28");
  assert.equal(taxonomy.scope.lifeStageCategory, null);
  assert.equal(taxonomy.source.geo.sampleFrame.sourceAgeText, "3-4 week mice");
  assert.equal(taxonomy.source.geo.sampleFrame.lifeStageCategory, null);
  assert.match(taxonomy.source.geo.sampleFrame.ageNormalization, /conventional normalization.+17-28/i);
  assert.deepEqual(taxonomy.curationFlow, {
    initialPostQcNeuronCount: 1639,
    excludedCellCount: 94,
    finalCellCount: 1545,
    initialBackspinClusterCount: 43,
    finalTypeCount: 30,
    finalGlutCellCount: 767,
    finalGabaCellCount: 778,
    sourceLocatorIds: ["paper-source-local-taxonomy", "supplement-figure-s2-curation-and-conflicts", "supplement-table-4-cluster-counts", "geo-processed-matrix"],
    interpretationBoundary: taxonomy.curationFlow.interpretationBoundary,
  });
  assert.deepEqual(taxonomy.profiles.map((profile) => profile.samplingCount.value), [...HARING_CLUSTER_COUNTS]);
  assert.equal(taxonomy.profiles.reduce((sum, profile) => sum + profile.samplingCount.value, 0), 1545);
});

test("retains curation-stage denominators and four unresolved source discrepancies", async () => {
  assert.deepEqual(taxonomy.sourceDiscrepancies.map((item) => item.id), [
    "glut7-count-conflict",
    "library-platform-conflict",
    "sex-code-comment-conflict",
    "sra-tissue-summary-conflict",
  ]);
  assert.match(taxonomy.sourceDiscrepancies[0].projectDecision, /Use 104.+retain the 105 legend value as a conflict/i);

  const promotedLegendCount = structuredClone(taxonomy);
  promotedLegendCount.profiles.find((profile) => profile.sourceLocalLabel === "Glut7").samplingCount.value = 105;
  await assert.rejects(() => validateHaringDorsalHornSourceTaxonomy(promotedLegendCount), /Table 4 count vector changed|must sum to 1,545/i);

  const hiddenDiscrepancy = structuredClone(taxonomy);
  hiddenDiscrepancy.sourceDiscrepancies.splice(1, 1);
  await assert.rejects(() => validateHaringDorsalHornSourceTaxonomy(hiddenDiscrepancy), /source discrepancy identities|must NOT have fewer than 4 items/i);
});

test("rejects animal/cell denominator drift and any alteration of the exact Table 4 count vector", async () => {
  const wrongAnimals = structuredClone(taxonomy);
  wrongAnimals.source.geo.sampleFrame.sourceAnimalCount = 1545;
  await assert.rejects(() => validateHaringDorsalHornSourceTaxonomy(wrongAnimals), /sourceAnimalCount must remain 28/i);

  const wrongCohort = structuredClone(taxonomy);
  wrongCohort.source.geo.sampleFrame.selectionCohorts[1].animalCount = 6;
  await assert.rejects(() => validateHaringDorsalHornSourceTaxonomy(wrongCohort), /must remain exactly 3, 5, and 20|must sum to 28/i);

  const swappedCounts = structuredClone(taxonomy);
  [swappedCounts.profiles[0].samplingCount.value, swappedCounts.profiles[1].samplingCount.value] = [
    swappedCounts.profiles[1].samplingCount.value,
    swappedCounts.profiles[0].samplingCount.value,
  ];
  await assert.rejects(() => validateHaringDorsalHornSourceTaxonomy(swappedCounts), /exact 30-profile Table 4 count vector changed/i);

  const wrongSum = structuredClone(taxonomy);
  wrongSum.profiles[29].samplingCount.value += 1;
  await assert.rejects(() => validateHaringDorsalHornSourceTaxonomy(wrongSum), /profile cell counts must sum to 1,545|count vector changed/i);
});

test("locks active-matrix dimensions, metadata rows, assignments, and cell-column denominator boundaries", async () => {
  const matrix = taxonomy.source.geo.countMatrixAsset;
  assert.deepEqual(
    {
      dimension: matrix.ooxmlDimension,
      rows: matrix.worksheetRowCountIncludingHeader,
      metadataRows: matrix.metadataRowCount,
      geneRows: matrix.geneRowCount,
      cellColumns: matrix.cellColumnCount,
      uniqueCellIds: matrix.uniqueCellIdCount,
      rawAssignment: matrix.exactRawClusterCellAssignmentAvailable,
      standardAssignment: matrix.exactStandardNameCellAssignmentAvailable,
    },
    {
      dimension: "A1:BGL24385",
      rows: 24385,
      metadataRows: 6,
      geneRows: 24378,
      cellColumns: 1545,
      uniqueCellIds: 1545,
      rawAssignment: true,
      standardAssignment: true,
    },
  );
  assert.deepEqual(matrix.sexCodeCellCounts, { code0: 1490, code1: 55, codeMeaning: "female=1", denominatorUnit: "cell_columns" });
  assert.deepEqual(matrix.strainCellCounts, { C57bl6: 637, vGatCreTdTomato: 537, vGlut2EGfp: 371, denominatorUnit: "cell_columns" });

  const erasedMetadata = structuredClone(taxonomy);
  erasedMetadata.source.geo.countMatrixAsset.exactStandardNameCellAssignmentAvailable = false;
  await assert.rejects(() => validateHaringDorsalHornSourceTaxonomy(erasedMetadata), /standard-name assignments must remain available/i);

  const wrongGeneRows = structuredClone(taxonomy);
  wrongGeneRows.source.geo.countMatrixAsset.geneRowCount = 24384;
  await assert.rejects(() => validateHaringDorsalHornSourceTaxonomy(wrongGeneRows), /geneRowCount must remain 24378/i);

  const animalSexInference = structuredClone(taxonomy);
  animalSexInference.source.geo.countMatrixAsset.sexCodeCellCounts.denominatorUnit = "source_animals";
  await assert.rejects(() => validateHaringDorsalHornSourceTaxonomy(animalSexInference), /cell_columns|sex-code counts/i);
});

test("locks every per-profile age, deposited sex-code, strain, and raw-cluster aggregate", async () => {
  const gaba1 = taxonomy.profiles.find((profile) => profile.sourceLocalLabel === "Gaba1");
  assert.equal(gaba1.barcodeMetadataSummary.rawClusterName, "Glut_Gal");
  assert.match(gaba1.barcodeMetadataSummary.rawClusterNameContext, /retained without correction/i);
  assert.equal(taxonomy.profiles.flatMap((profile) => profile.barcodeMetadataSummary.ageDays.countsByAge).reduce((sum, item) => sum + item.count, 0), 1545);
  assert.deepEqual(
    taxonomy.profiles.reduce(
      (totals, profile) => {
        totals[0] += profile.barcodeMetadataSummary.sexCodeCounts["0"];
        totals[1] += profile.barcodeMetadataSummary.sexCodeCounts["1"];
        return totals;
      },
      [0, 0],
    ),
    [1490, 55],
  );

  const wrongAge = structuredClone(taxonomy);
  wrongAge.profiles[0].barcodeMetadataSummary.ageDays.countsByAge[0].count += 1;
  await assert.rejects(() => validateHaringDorsalHornSourceTaxonomy(wrongAge), /barcode metadata aggregates drifted|age cell counts must sum/i);

  const wrongStrain = structuredClone(taxonomy);
  wrongStrain.profiles[15].barcodeMetadataSummary.strainCellCounts.C57bl6 -= 1;
  wrongStrain.profiles[15].barcodeMetadataSummary.strainCellCounts["vGat-Cre-tdTomato"] += 1;
  await assert.rejects(() => validateHaringDorsalHornSourceTaxonomy(wrongStrain), /barcode metadata aggregates drifted/i);

  const correctedAnomaly = structuredClone(taxonomy);
  correctedAnomaly.profiles[15].barcodeMetadataSummary.rawClusterName = "GABA_Gal";
  await assert.rejects(() => validateHaringDorsalHornSourceTaxonomy(correctedAnomaly), /Gaba1 deposited raw cluster name changed|Glut_Gal raw-cluster anomaly/i);
});

test("retains signed Table 5 rules and fine B/C/D cell locators", async () => {
  const row10 = taxonomy.identificationRules.find((rule) => rule.id === "haring-2018:table5-row-10");
  assert.deepEqual(row10.targetProfileIds, ["haring-2018:GSE103840:Glut6", "haring-2018:GSE103840:Glut7"]);
  assert.equal(row10.rawCombination.value, "+Nmu,+Sst,+Tac2");
  assert.deepEqual(row10.components.map((item) => item.polarity), ["positive", "positive", "positive"]);

  const lostNegative = structuredClone(taxonomy);
  lostNegative.identificationRules[0].components[2].polarity = "positive";
  await assert.rejects(() => validateHaringDorsalHornSourceTaxonomy(lostNegative), /signed Table 5 identification rules|positive\/negative marker signs/i);

  const coarseLocator = structuredClone(taxonomy);
  coarseLocator.identificationRules[0].rawCombination.locator.cell = "C6";
  await assert.rejects(() => validateHaringDorsalHornSourceTaxonomy(coarseLocator), /fine B\/C\/D cell locators|Table 5 row 5/i);

  const falseExactSplit = structuredClone(taxonomy);
  falseExactSplit.identificationRules.find((rule) => rule.id === "haring-2018:table5-row-10").targetProfileIds = ["haring-2018:GSE103840:Glut6"];
  await assert.rejects(() => validateHaringDorsalHornSourceTaxonomy(falseExactSplit), /signed Table 5 identification rules|identification-rule reference is not reciprocal/i);
});

test("retains Table 8 marker qualifiers, blank slots, and exact C/D/E/F cell locators", async () => {
  const glut5 = taxonomy.profiles.find((profile) => profile.sourceLocalLabel === "Glut5");
  assert.deepEqual(
    {
      labelCell: glut5.specificMarkerSummary.sourceTableLabel.locator.cell,
      main: glut5.specificMarkerSummary.mainMarker,
      co1: glut5.specificMarkerSummary.coMarker1,
      co2: glut5.specificMarkerSummary.coMarker2,
    },
    {
      labelCell: "C8",
      main: glut5.specificMarkerSummary.mainMarker,
      co1: null,
      co2: glut5.specificMarkerSummary.coMarker2,
    },
  );
  assert.equal(glut5.specificMarkerSummary.mainMarker.raw, "Tac2 (high)");
  assert.equal(glut5.specificMarkerSummary.mainMarker.qualifier, "high");
  assert.equal(glut5.specificMarkerSummary.coMarker2.locator.cell, "F8");

  const removedQualifier = structuredClone(taxonomy);
  removedQualifier.profiles[4].specificMarkerSummary.mainMarker.qualifier = null;
  await assert.rejects(() => validateHaringDorsalHornSourceTaxonomy(removedQualifier), /marker summaries|raw text and qualifier disagree/i);

  const filledBlank = structuredClone(taxonomy);
  filledBlank.profiles[1].specificMarkerSummary.coMarker1 = structuredClone(taxonomy.profiles[0].specificMarkerSummary.coMarker1);
  await assert.rejects(() => validateHaringDorsalHornSourceTaxonomy(filledBlank), /marker summaries|co-marker 1/i);

  const shiftedCell = structuredClone(taxonomy);
  shiftedCell.profiles[29].specificMarkerSummary.coMarker2.locator.cell = "F34";
  await assert.rejects(() => validateHaringDorsalHornSourceTaxonomy(shiftedCell), /marker summaries|exact F-cell locator/i);
});

test("rejects geometry, local-interneuron promotion, cross-source identity, SCI, and registration invention", async () => {
  const geometry = structuredClone(taxonomy);
  geometry.profiles[0].cellXyz = [1, 2, 3];
  await assert.rejects(() => validateHaringDorsalHornSourceTaxonomy(geometry), /additional properties|cellXyz/i);

  const localPromotion = structuredClone(taxonomy);
  localPromotion.profiles[0].interneuronIdentityStatus = "confirmed_local_interneuron";
  await assert.rejects(() => validateHaringDorsalHornSourceTaxonomy(localPromotion), /must not be promoted|must be equal to constant/i);

  const crossSource = structuredClone(taxonomy);
  crossSource.scope.exactCrossSourceIdentityCount = 1;
  await assert.rejects(() => validateHaringDorsalHornSourceTaxonomy(crossSource), /exact cross-source identity count must remain zero/i);

  const registration = structuredClone(taxonomy);
  registration.scope.projectRegistrationCount = 1;
  await assert.rejects(() => validateHaringDorsalHornSourceTaxonomy(registration), /project registration count must remain zero/i);

  const sci = structuredClone(taxonomy);
  sci.profiles[0].missingEvidence.sciContext = "measured";
  await assert.rejects(() => validateHaringDorsalHornSourceTaxonomy(sci), /fine missing-evidence axis|must retain every fine missing-evidence/i);
});

test("keeps public access separate from reuse and every source object unbundled", async () => {
  const bundledMatrix = structuredClone(taxonomy);
  bundledMatrix.source.geo.countMatrixAsset.sourceFileBundled = true;
  await assert.rejects(() => validateHaringDorsalHornSourceTaxonomy(bundledMatrix), /processed matrix source file must not be bundled/i);

  const bundledSupplement = structuredClone(taxonomy);
  bundledSupplement.source.supplementaryObjects[0].sourceFileBundled = true;
  await assert.rejects(() => validateHaringDorsalHornSourceTaxonomy(bundledSupplement), /must not be bundled/i);

  const assumedReuse = structuredClone(taxonomy);
  assumedReuse.source.publication.reuseStatus = "CC0";
  await assert.rejects(() => validateHaringDorsalHornSourceTaxonomy(assumedReuse), /public access must not become assumed reuse permission/i);
});

test("deterministically rebuilds the exact committed JSON", async () => {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "haring-dorsal-horn-taxonomy-"));
  try {
    const firstPath = join(temporaryDirectory, "first.json");
    const secondPath = join(temporaryDirectory, "nested", "second.json");
    assert.deepEqual(await buildHaringDorsalHornTaxonomy(), taxonomy);
    const first = await writeHaringDorsalHornTaxonomy({ outputPath: firstPath });
    const second = await writeHaringDorsalHornTaxonomy({ outputPath: secondPath });
    assert.equal(first.outputSha256, "23d6cda3af6c4205926e8d994fea0cbc11d5cd02c2287e72f7c6a17c89c98549");
    assert.equal(second.outputSha256, first.outputSha256);
    assert.equal(await readFile(firstPath, "utf8"), taxonomyText);
    assert.equal(await readFile(secondPath, "utf8"), taxonomyText);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});

test("rejects an unpinned source object before using it", async () => {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "haring-bad-source-"));
  try {
    const badPath = join(temporaryDirectory, "bad.xlsx");
    await writeFile(badPath, Buffer.from("not the pinned source object", "utf8"));
    await assert.rejects(() => auditHaringSourceObject(badPath, "supplementaryTable4"), /byte count changed/i);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});

const allPinnedSourcesAvailable = Object.values(SOURCE_PATHS).every(existsSync);
test("optionally audits every exact matrix/supplement source object", { skip: !allPinnedSourcesAvailable }, async () => {
  const audits = await Promise.all(Object.entries(SOURCE_PATHS).map(([key, sourcePath]) => auditHaringSourceObject(sourcePath, key)));
  assert.equal(audits.length, Object.keys(HARING_SOURCE_OBJECT_RECEIPTS).length);
  for (const audit of audits) {
    const receipt = HARING_SOURCE_OBJECT_RECEIPTS[audit.receiptKey];
    assert.equal(audit.objectId, receipt.objectId);
    assert.equal(audit.bytes, receipt.bytes);
    assert.equal(audit.sha256, receipt.sha256);
  }
});
