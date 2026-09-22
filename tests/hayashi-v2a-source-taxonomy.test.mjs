import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { validateHayashiV2aSourceTaxonomy } from "../scripts/validate-hayashi-v2a-source-taxonomy-0.1.mjs";
import {
  HAYASHI_SOURCE_MATRIX_RECEIPT,
  auditHayashiSourceGzip,
  buildHayashiV2aTaxonomy,
  writeHayashiV2aTaxonomy,
} from "../tools/build_hayashi_v2a_taxonomy.mjs";

const DATA_URL = new URL("../data/hayashi-v2a-source-taxonomy-0.1.json", import.meta.url);
const taxonomyText = await readFile(DATA_URL, "utf8");
const taxonomy = JSON.parse(taxonomyText);
const OPTIONAL_SOURCE_GZIP = "/private/tmp/gse108788_audit_20260827/GSM2913270_umiGeneCounts.csv.gz";

test("locks the source-local Hayashi V2a taxonomy and every denominator", async () => {
  const report = await validateHayashiV2aSourceTaxonomy(taxonomy);
  assert.deepEqual(report, {
    releaseId: "ohri-hayashi-v2a-source-taxonomy-0.1.0",
    profileCount: 11,
    figureClusterCellCountSum: 949,
    sourceAnimalCount: 2,
    independentLibraryCount: 1,
    geneRowCount: 12986,
    cellBarcodeColumnCount: 949,
    projectConfirmedLocalInterneuronProfileCount: 0,
    projectRegistrationCount: 0,
    exactCrossSourceIdentityCount: 0,
  });
  assert.deepEqual(taxonomy.profiles.map((profile) => profile.samplingCount.value), [144, 130, 121, 117, 112, 86, 59, 52, 51, 48, 29]);
  assert.equal(taxonomy.source.geo.sampleFrame.articleAssignedCervicalCellCount + taxonomy.source.geo.sampleFrame.articleAssignedLumbarCellCount, 949);
  assert.equal(taxonomy.source.geo.sampleFrame.sourceAnimalCount, 2);
  assert.deepEqual(taxonomy.source.geo.sampleFrame.prePoolingFACSCollectedCellCountByRegion, { cervical: 2800, lumbar: 2800 });
  assert.equal(taxonomy.source.geo.sampleFrame.pooledLibraryCount, 1);
  assert.equal(taxonomy.source.geo.sampleFrame.animalResolvedReplicateCount, 0);
});

test("rejects denominator drift and any change to the exact 11-count vector", async () => {
  const wrongAnimalDenominator = structuredClone(taxonomy);
  wrongAnimalDenominator.source.geo.sampleFrame.sourceAnimalCount = 949;
  await assert.rejects(() => validateHayashiV2aSourceTaxonomy(wrongAnimalDenominator), /sourceAnimalCount must remain 2/i);

  const wrongLibraryDenominator = structuredClone(taxonomy);
  wrongLibraryDenominator.source.geo.sampleFrame.independentLibraryCount = 2;
  await assert.rejects(() => validateHayashiV2aSourceTaxonomy(wrongLibraryDenominator), /independentLibraryCount must remain 1/i);

  const collapsedDenominatorStages = structuredClone(taxonomy);
  collapsedDenominatorStages.source.geo.sampleFrame.prePoolingFACSCollectedCellCountByRegion.cervical = 949;
  await assert.rejects(() => validateHayashiV2aSourceTaxonomy(collapsedDenominatorStages), /pre-pooling FACS denominator must remain 2,800 cervical plus 2,800 lumbar/i);

  const wrongMatrixDimensions = structuredClone(taxonomy);
  wrongMatrixDimensions.source.geo.countMatrixAsset.geneRowCount = 12985;
  await assert.rejects(() => validateHayashiV2aSourceTaxonomy(wrongMatrixDimensions), /geneRowCount must remain 12986/i);

  const swappedCounts = structuredClone(taxonomy);
  [swappedCounts.profiles[0].samplingCount.value, swappedCounts.profiles[1].samplingCount.value] = [
    swappedCounts.profiles[1].samplingCount.value,
    swappedCounts.profiles[0].samplingCount.value,
  ];
  await assert.rejects(() => validateHayashiV2aSourceTaxonomy(swappedCounts), /cluster count vector must remain exactly/i);

  const wrongSum = structuredClone(taxonomy);
  wrongSum.profiles[10].samplingCount.value += 1;
  await assert.rejects(() => validateHayashiV2aSourceTaxonomy(wrongSum), /cluster counts must sum to 949/i);
});

test("requires exact source locators and preserves source-local spatial context", async () => {
  const alteredLocator = structuredClone(taxonomy);
  alteredLocator.sourceLocators.find((locator) => locator.id === "matrix-reanalysis-marker-discrepancy").locator += " Harmonized.";
  await assert.rejects(() => validateHayashiV2aSourceTaxonomy(alteredLocator), /source locator text, authority, or field support drifted/i);

  const unknownLocator = structuredClone(taxonomy);
  unknownLocator.profiles[0].fieldLocatorIds[0] = "invented-locator";
  await assert.rejects(() => validateHayashiV2aSourceTaxonomy(unknownLocator), /references unknown source locator|field locators drifted/i);

  const inventedSpatialContext = structuredClone(taxonomy);
  inventedSpatialContext.profiles[8].spatialDomainContext = "lateral";
  await assert.rejects(() => validateHayashiV2aSourceTaxonomy(inventedSpatialContext), /Cluster 9 spatial-domain context drifted/i);

  const inventedRegionContext = structuredClone(taxonomy);
  inventedRegionContext.profiles[6].rostrocaudalContext = "mostly_cervical";
  await assert.rejects(() => validateHayashiV2aSourceTaxonomy(inventedRegionContext), /Cluster 7 rostrocaudal context drifted/i);
});

test("keeps every cluster mixed and Type II outside confirmed local-interneuron counts", async () => {
  assert.equal(taxonomy.profiles.every((profile) => profile.majorTypeMembership === "mixed_type_i_and_type_ii"), true);
  assert.equal(
    taxonomy.sourceReportedMajorTypes.find((majorType) => majorType.label === "Type II")?.projectUseClass,
    "projection_neuron_context_excluded_from_local_interneuron_count",
  );

  const pureCluster = structuredClone(taxonomy);
  pureCluster.profiles[0].majorTypeMembership = "type_i";
  await assert.rejects(() => validateHayashiV2aSourceTaxonomy(pureCluster), /must remain mixed Type I and Type II/i);

  const typeIIPromoted = structuredClone(taxonomy);
  typeIIPromoted.sourceReportedMajorTypes[1].projectUseClass = "local_interneuron_context";
  await assert.rejects(() => validateHayashiV2aSourceTaxonomy(typeIIPromoted), /Type II must remain projection-neuron context excluded/i);

  const confirmedLocalProfiles = structuredClone(taxonomy);
  confirmedLocalProfiles.scope.projectConfirmedLocalInterneuronProfileCount = 11;
  await assert.rejects(() => validateHayashiV2aSourceTaxonomy(confirmedLocalProfiles), /projectConfirmedLocalInterneuronProfileCount must remain 0/i);

  const barcodeLinkedProjection = structuredClone(taxonomy);
  barcodeLinkedProjection.sourceReportedMajorTypes[1].sameCellProjectionTraceAvailable = true;
  await assert.rejects(() => validateHayashiV2aSourceTaxonomy(barcodeLinkedProjection), /must not acquire a same-cell projection trace/i);
});

test("rejects barcode maps, geometry, adult or SCI promotion, and cross-source identity", async () => {
  const barcodeMap = structuredClone(taxonomy);
  barcodeMap.profiles[0].clusterBarcodeMap = { "AAAC": "Cluster 1" };
  await assert.rejects(() => validateHayashiV2aSourceTaxonomy(barcodeMap), /barcode-map|barcode\/geometry|additional properties/i);

  const matrixBarcodeMap = structuredClone(taxonomy);
  matrixBarcodeMap.scope.exactClusterBarcodeMappingAvailable = true;
  await assert.rejects(() => validateHayashiV2aSourceTaxonomy(matrixBarcodeMap), /exact cluster-barcode maps must remain unavailable/i);

  const geometry = structuredClone(taxonomy);
  geometry.profiles[0].cellXyz = [1, 2, 3];
  await assert.rejects(() => validateHayashiV2aSourceTaxonomy(geometry), /barcode\/geometry|additional properties/i);

  const registration = structuredClone(taxonomy);
  registration.scope.projectRegistrationCount = 1;
  await assert.rejects(() => validateHayashiV2aSourceTaxonomy(registration), /registration count must remain 0|atlas registration/i);

  const adult = structuredClone(taxonomy);
  adult.globalMissingEvidence.adultIdentity = "established";
  await assert.rejects(() => validateHayashiV2aSourceTaxonomy(adult), /must not acquire adult identity/i);

  const sci = structuredClone(taxonomy);
  sci.globalMissingEvidence.sciContext = "measured";
  await assert.rejects(() => validateHayashiV2aSourceTaxonomy(sci), /must not acquire SCI identity/i);

  const crossSource = structuredClone(taxonomy);
  crossSource.scope.exactCrossSourceIdentityCount = 1;
  await assert.rejects(() => validateHayashiV2aSourceTaxonomy(crossSource), /exact cross-source identity must remain zero/i);
});

test("preserves matrix/article marker disagreement without harmonization", async () => {
  const reanalysis = taxonomy.source.geo.countMatrixAsset.matrixReanalysis;
  assert.deepEqual(reanalysis.v2aMarkerPanel, ["Vsx2", "Sox14", "Shox2", "Lhx3", "Lhx4"]);
  assert.deepEqual(
    {
      matrixV2a: [reanalysis.v2aMarkerPositiveBarcodeCount, reanalysis.v2aMarkerPositivePercentage],
      articleV2aPercentage: reanalysis.articleReportedV2aMarkerPositivePercentage,
      matrixSlc17a6: [reanalysis.slc17a6PositiveBarcodeCount, reanalysis.slc17a6PositivePercentage],
      articleSlc17a6Percentage: reanalysis.articleReportedSlc17a6PositivePercentage,
      status: reanalysis.reproducibilityStatus,
    },
    {
      matrixV2a: [942, 99.262],
      articleV2aPercentage: 99.5,
      matrixSlc17a6: [862, 90.832],
      articleSlc17a6Percentage: 92.7,
      status: "unresolved_difference_from_article_report",
    },
  );

  const harmonized = structuredClone(taxonomy);
  harmonized.source.geo.countMatrixAsset.matrixReanalysis.v2aMarkerPositivePercentage = 99.5;
  harmonized.source.geo.countMatrixAsset.matrixReanalysis.slc17a6PositivePercentage = 92.7;
  harmonized.source.geo.countMatrixAsset.matrixReanalysis.reproducibilityStatus = "reproduced";
  await assert.rejects(() => validateHayashiV2aSourceTaxonomy(harmonized), /99\.262|90\.832|unresolved rather than harmonized/i);

  const changedRule = structuredClone(taxonomy);
  changedRule.source.geo.countMatrixAsset.matrixReanalysis.countingRule = "Use article percentages as truth and adjust raw counts until they agree.";
  await assert.rejects(() => validateHayashiV2aSourceTaxonomy(changedRule), /raw-UMI-greater-than-zero counting rule/i);
});

test("keeps public access distinct from reuse and source objects non-bundled", async () => {
  const bundledMatrix = structuredClone(taxonomy);
  bundledMatrix.source.geo.countMatrixAsset.sourceFileBundled = true;
  await assert.rejects(() => validateHayashiV2aSourceTaxonomy(bundledMatrix), /must not be bundled/i);

  const assumedGeoReuse = structuredClone(taxonomy);
  assumedGeoReuse.source.geo.countMatrixAsset.reuseStatus = "REDISTRIBUTION_PERMITTED";
  await assert.rejects(() => validateHayashiV2aSourceTaxonomy(assumedGeoReuse), /must not become assumed redistribution permission/i);

  const assumedArticleReuse = structuredClone(taxonomy);
  assumedArticleReuse.source.publication.reuseStatus = "CC0";
  await assert.rejects(() => validateHayashiV2aSourceTaxonomy(assumedArticleReuse), /must not become assumed reuse permission/i);

  const sourceBody = structuredClone(taxonomy);
  sourceBody.source.geo.countMatrixAsset.matrixBody = "invented bundled payload";
  await assert.rejects(() => validateHayashiV2aSourceTaxonomy(sourceBody), /source-body fields|additional properties/i);
});

test("deterministically rebuilds the exact committed JSON", async () => {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "hayashi-v2a-taxonomy-"));
  try {
    const firstPath = join(temporaryDirectory, "first.json");
    const secondPath = join(temporaryDirectory, "nested", "second.json");
    const built = await buildHayashiV2aTaxonomy();
    assert.deepEqual(built, taxonomy);

    const first = await writeHayashiV2aTaxonomy({ outputPath: firstPath });
    const second = await writeHayashiV2aTaxonomy({ outputPath: secondPath });
    assert.equal(first.outputSha256, "eaaa49ea63c300d1a719eb9119a3c2735674d3f0d5113567dcb583489674f882");
    assert.equal(second.outputSha256, first.outputSha256);
    assert.equal(await readFile(firstPath, "utf8"), taxonomyText);
    assert.equal(await readFile(secondPath, "utf8"), taxonomyText);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});

test("rejects a non-pinned gzip before parsing its contents", async () => {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "hayashi-v2a-bad-gzip-"));
  try {
    const badPath = join(temporaryDirectory, "GSM2913270_umiGeneCounts.csv.gz");
    await writeFile(badPath, Buffer.from("not the pinned source object", "utf8"));
    await assert.rejects(() => auditHayashiSourceGzip(badPath), /compressed source byte count changed/i);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});

test("optionally parses and audits the exact source gzip", { skip: !existsSync(OPTIONAL_SOURCE_GZIP) }, async () => {
  const audit = await auditHayashiSourceGzip(OPTIONAL_SOURCE_GZIP);
  assert.deepEqual(
    {
      compressedBytes: audit.compressedBytes,
      compressedSha256: audit.compressedSha256,
      uncompressedBytes: audit.uncompressedBytes,
      uncompressedSha256: audit.uncompressedSha256,
      csvRowWidth: audit.csvRowWidth,
      metadataColumnCount: audit.metadataColumnCount,
      geneRowCount: audit.geneRowCount,
      cellBarcodeColumnCount: audit.cellBarcodeColumnCount,
      countValueCount: audit.countValueCount,
      minimumPositiveCellCountPerRetainedGene: audit.minimumPositiveCellCountPerRetainedGene,
      v2aMarkerPositiveBarcodeCount: audit.v2aMarkerPositiveBarcodeCount,
      v2aMarkerPositivePercentage: audit.v2aMarkerPositivePercentage,
      slc17a6PositiveBarcodeCount: audit.slc17a6PositiveBarcodeCount,
      slc17a6PositivePercentage: audit.slc17a6PositivePercentage,
    },
    {
      compressedBytes: HAYASHI_SOURCE_MATRIX_RECEIPT.compressedBytes,
      compressedSha256: HAYASHI_SOURCE_MATRIX_RECEIPT.compressedSha256,
      uncompressedBytes: HAYASHI_SOURCE_MATRIX_RECEIPT.uncompressedBytes,
      uncompressedSha256: HAYASHI_SOURCE_MATRIX_RECEIPT.uncompressedSha256,
      csvRowWidth: 950,
      metadataColumnCount: 1,
      geneRowCount: 12986,
      cellBarcodeColumnCount: 949,
      countValueCount: 12323714,
      minimumPositiveCellCountPerRetainedGene: 2,
      v2aMarkerPositiveBarcodeCount: 942,
      v2aMarkerPositivePercentage: 99.262,
      slc17a6PositiveBarcodeCount: 862,
      slc17a6PositivePercentage: 90.832,
    },
  );
});
