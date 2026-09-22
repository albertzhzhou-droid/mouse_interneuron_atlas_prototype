import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { validateAlkaslasiCholinergicSourceTaxonomy } from "../scripts/validate-alkaslasi-cholinergic-source-taxonomy-0.1.mjs";
import {
  ALKASLASI_PROFILE_COUNTS,
  ALKASLASI_PROFILE_REGION_COUNTS,
  ALKASLASI_PROFILE_SEX_COUNTS,
  ALKASLASI_SOURCE_RECEIPT,
  auditAlkaslasiSourceGzip,
  buildAlkaslasiCholinergicTaxonomy,
  writeAlkaslasiCholinergicTaxonomy,
} from "../tools/build_alkaslasi_cholinergic_taxonomy.mjs";

const DATA_URL = new URL("../data/alkaslasi-cholinergic-source-taxonomy-0.1.json", import.meta.url);
const taxonomyText = await readFile(DATA_URL, "utf8");
const taxonomy = JSON.parse(taxonomyText);
const SOURCE_GZIP = "/private/tmp/GSE167597_all_AlkaslasiPiccus_annotations.csv.gz";
const SOURCE_AVAILABLE = existsSync(SOURCE_GZIP);

function profile(label, document = taxonomy) {
  return document.profiles.find((item) => item.sourceLocalLabel === label);
}

test("locks the Alkaslasi I1-I8 source-local taxonomy and every denominator level", async () => {
  const report = await validateAlkaslasiCholinergicSourceTaxonomy(taxonomy);
  assert.deepEqual(report, {
    releaseId: "ohri-alkaslasi-cholinergic-source-taxonomy-0.1.0",
    profileCount: 8,
    assignedInterneuronNuclei: 5375,
    sourceAnimalCount: 12,
    geoSampleCount: 9,
    sourceTotalQcRetainedNuclei: 34231,
    sourceCholinergicNuclei: 16042,
    exactCrossSourceIdentityCount: 0,
    projectRegistrationCount: 0,
    generatedGeometryCount: 0,
  });

  assert.deepEqual(taxonomy.profiles.map((item) => item.sourceLocalLabel), Object.keys(ALKASLASI_PROFILE_COUNTS));
  assert.deepEqual(
    Object.fromEntries(taxonomy.profiles.map((item) => [item.sourceLocalLabel, item.samplingCount.value])),
    ALKASLASI_PROFILE_COUNTS,
  );
  assert.equal(taxonomy.source.geo.sampleFrame.sourceAnimalCount, 12);
  assert.equal(taxonomy.source.publication.pmid, "33931636");
  assert.equal(taxonomy.source.geo.displayedCitationPmid, "37559423");
  assert.match(taxonomy.source.geo.citationLinkBoundary, /not the Alkaslasi et al\. 2021 article/i);
  assert.equal(taxonomy.source.geo.sampleFrame.matchingRegionMousePoolSize, 2);
  assert.equal(taxonomy.source.geo.sampleFrame.processingReplicateMouseCount, 4);
  assert.equal(taxonomy.source.geo.sampleFrame.processingReplicateCount, 3);
  assert.equal(taxonomy.source.geo.sampleFrame.geoSampleCount, 9);
  assert.equal(taxonomy.scope.sourceTotalQcRetainedNucleusCount, 34231);
  assert.equal(taxonomy.scope.sourceCholinergicNucleusCount, 16042);
  assert.equal(taxonomy.scope.sourceInterneuronNucleusCount, 5375);
  assert.deepEqual(taxonomy.articlePipelineStages, {
    preliminaryQcClusterCount: 38,
    preliminaryNonCholinergicClusterCount: 22,
    finalCholinergicClassCount: 21,
    interpretationBoundary: taxonomy.articlePipelineStages.interpretationBoundary,
    sourceLocatorIds: ["paper-results-source-denominators"],
  });
  assert.match(taxonomy.articlePipelineStages.interpretationBoundary, /distinct analysis stages/i);
});

test("preserves deposited Lumbar and sex NA while retaining exact I1-I8 cross-tabs", () => {
  for (const item of taxonomy.profiles) {
    const label = item.sourceLocalLabel;
    assert.deepEqual(item.sampleRegionMembership.counts, ALKASLASI_PROFILE_REGION_COUNTS[label]);
    assert.deepEqual(item.sampleRegionMembership.depositedLabels, ["Cervical", "Thoracic", "Lumbar"]);
    assert.deepEqual(item.depositedSexFieldMembership.counts, ALKASLASI_PROFILE_SEX_COUNTS[label]);
    assert.deepEqual(item.depositedSexFieldMembership.depositedLabels, ["M", "F", "NA"]);
    assert.equal(item.depositedSexFieldMembership.naInterpretation, "PRESERVED_AS_DEPOSITED_NOT_IMPUTED");
    assert.equal(Object.values(item.sampleRegionMembership.counts).reduce((sum, value) => sum + value, 0), item.samplingCount.value);
    assert.equal(Object.values(item.depositedSexFieldMembership.counts).reduce((sum, value) => sum + value, 0), item.samplingCount.value);
  }

  assert.deepEqual(taxonomy.sourceObjectAudit.interneuronSampleRegionCounts, {
    Cervical: 1392,
    Thoracic: 1489,
    Lumbar: 2494,
  });
  assert.deepEqual(taxonomy.sourceObjectAudit.interneuronDepositedSexFieldCounts, {
    M: 1533,
    F: 1559,
    NA: 2283,
  });
  assert.deepEqual(taxonomy.sourceObjectAudit.rawSourceAnomalies[0], {
    field: "barcodes",
    rawValue: "cervical-cervical_6",
    kind: "DEPOSITED_DUPLICATED_REGION_TOKEN_IN_BARCODE_SUFFIX",
    allRowCount: 4798,
    interneuronRowCount: 769,
    boundary: taxonomy.sourceObjectAudit.rawSourceAnomalies[0].boundary,
  });
  assert.match(taxonomy.sourceObjectAudit.rawSourceAnomalies[0].boundary, /not silently normalized/i);
  assert.deepEqual(
    taxonomy.sourceObjectAudit.skeletalLabelConflicts.map(({ sourceRowIndex, barcode, newnames, skeletaltypes }) => ({ sourceRowIndex, barcode, newnames, skeletaltypes })),
    [
      { sourceRowIndex: 890, barcode: "CAGGCCACAGAGAAAG-1-thoracic_1", newnames: "S1", skeletaltypes: "Alpha Motor Neurons" },
      { sourceRowIndex: 11985, barcode: "CGGGACTCAGTTTCAG-1-cervical_5", newnames: "S2", skeletaltypes: "Type 3 Motor Neurons" },
      { sourceRowIndex: 15851, barcode: "GACGTTATCGATCCCT-1-cervical-cervical_6", newnames: "S1", skeletaltypes: "Gamma Motor Neurons" },
      { sourceRowIndex: 26156, barcode: "TATCCTAAGAATCGAT-1-lumbar_8", newnames: "S2", skeletaltypes: "Gamma Motor Neurons" },
    ],
  );
  assert.ok(taxonomy.sourceObjectAudit.skeletalLabelConflicts.every((conflict) => conflict.conflictStatus === "PRESERVED_NOT_REPAIRED"));
});

test("rejects denominator drift, swapped profiles, and semantic rewrites of deposited fields", async () => {
  const wrongAnimalDenominator = structuredClone(taxonomy);
  wrongAnimalDenominator.source.geo.sampleFrame.sourceAnimalCount = 5375;
  await assert.rejects(() => validateAlkaslasiCholinergicSourceTaxonomy(wrongAnimalDenominator), /schema validation|source animal denominator/i);

  const collapsedPipeline = structuredClone(taxonomy);
  collapsedPipeline.articlePipelineStages.finalCholinergicClassCount = 16;
  await assert.rejects(() => validateAlkaslasiCholinergicSourceTaxonomy(collapsedPipeline), /schema validation|final cholinergic class denominator/i);

  const swappedProfileCounts = structuredClone(taxonomy);
  [swappedProfileCounts.profiles[0].samplingCount.value, swappedProfileCounts.profiles[1].samplingCount.value] = [
    swappedProfileCounts.profiles[1].samplingCount.value,
    swappedProfileCounts.profiles[0].samplingCount.value,
  ];
  await assert.rejects(() => validateAlkaslasiCholinergicSourceTaxonomy(swappedProfileCounts), /I1 sampling count changed|I2 sampling count changed/i);

  const swappedRegions = structuredClone(taxonomy);
  [swappedRegions.profiles[0].sampleRegionMembership.counts.Cervical, swappedRegions.profiles[0].sampleRegionMembership.counts.Thoracic] = [
    swappedRegions.profiles[0].sampleRegionMembership.counts.Thoracic,
    swappedRegions.profiles[0].sampleRegionMembership.counts.Cervical,
  ];
  await assert.rejects(() => validateAlkaslasiCholinergicSourceTaxonomy(swappedRegions), /I1 sample-region counts changed/i);

  const rewrittenLumbar = structuredClone(taxonomy);
  rewrittenLumbar.profiles[0].sampleRegionMembership.depositedLabels[2] = "Lumbar/Sacral";
  await assert.rejects(() => validateAlkaslasiCholinergicSourceTaxonomy(rewrittenLumbar), /schema validation|deposited Lumbar label changed/i);

  const imputedNa = structuredClone(taxonomy);
  imputedNa.profiles[0].depositedSexFieldMembership.naInterpretation = "IMPUTED_AS_MIXED_SEX";
  await assert.rejects(() => validateAlkaslasiCholinergicSourceTaxonomy(imputedNa), /schema validation|deposited NA was imputed/i);

  const changedTupleReceipt = structuredClone(taxonomy);
  changedTupleReceipt.sourceObjectAudit.interneuronSubsetTupleReceipt.sha256 = "0".repeat(64);
  await assert.rejects(() => validateAlkaslasiCholinergicSourceTaxonomy(changedTupleReceipt), /I1-I8 source tuple SHA-256 changed/i);
});

test("locks article-level marker evidence, I6 negative context, and the two-stage I8 caution", async () => {
  assert.deepEqual(taxonomy.profiles.map((item) => item.markerPanel), [
    ["Pax2", "Mpped2", "Slc6a1", "Piezo2"],
    ["Pax2", "Mpped2", "Slc6a1"],
    ["Pax2", "Mpped2", "Slc6a1"],
    ["Pax2", "Mpped2", "Slc6a1"],
    ["Pax2", "Mpped2", "Pitx2", "Tox"],
    ["Pax2", "Mpped2", "Pitx2"],
    ["Pax2", "Mpped2", "Piezo2"],
    ["Mpped2", "Piezo2", "Reln", "Chat"],
  ]);
  assert.equal(profile("I6").markerEvidence.some((claim) => claim.negativeMarkers.includes("Tox") && /not a biological absence claim/i.test(claim.claim)), true);
  assert.equal(profile("I8").markerEvidence.some((claim) => claim.negativeMarkers.includes("Pax2")), true);
  assert.match(profile("I8").i8ArticleCaution, /suspected.*ISH support/i);
  assert.equal(taxonomy.profiles.every((item) => item.markerEvidence.every((claim) => /not a deposited per-nucleus expression measurement/i.test(claim.boundary))), true);
  assert.deepEqual(taxonomy.articleFigure5aMarkerContext.prominentLabelsByProfile.I8, ["Pde11a", "Nr5a2", "CT010465.1", "Slc30a8"]);
  assert.equal(taxonomy.articleFigure5aMarkerContext.markerLabelUnion.length, 22);
  assert.match(taxonomy.articleFigure5aMarkerContext.boundary, /shared labels occur/i);

  const inventedMarkerClaim = structuredClone(taxonomy);
  inventedMarkerClaim.profiles[0].markerEvidence.push({
    evidenceStatus: "article_reported_cluster_context",
    positiveMarkers: ["Calb1"],
    negativeMarkers: [],
    claim: "Invented cluster-specific Calb1 evidence that is not present in the retained article record.",
    sourceLocatorIds: ["paper-interneuron-section"],
    boundary: "Article marker context is not a deposited per-nucleus expression measurement, quantitative threshold, exclusive identity rule, or cross-source mapping.",
  });
  await assert.rejects(() => validateAlkaslasiCholinergicSourceTaxonomy(inventedMarkerClaim), /I1 article evidence.*receipt changed/i);

  const removedI6Negative = structuredClone(taxonomy);
  profile("I6", removedI6Negative).markerEvidence.find((claim) => claim.negativeMarkers.includes("Tox")).negativeMarkers = [];
  await assert.rejects(() => validateAlkaslasiCholinergicSourceTaxonomy(removedI6Negative), /I6 must retain.*Tox-negative/i);

  const removedI8Pax2Context = structuredClone(taxonomy);
  profile("I8", removedI8Pax2Context).markerEvidence.find((claim) => claim.negativeMarkers.includes("Pax2")).negativeMarkers = [];
  await assert.rejects(() => validateAlkaslasiCholinergicSourceTaxonomy(removedI8Pax2Context), /I8 must retain.*non-Pax2/i);

  const promotedI8 = structuredClone(taxonomy);
  promotedI8.profiles[7].i8ArticleCaution = "I8 is a universal canonical interneuron type with no classification uncertainty.";
  await assert.rejects(() => validateAlkaslasiCholinergicSourceTaxonomy(promotedI8), /I8 must retain both the suspected and later ISH-supported/i);

  const promotedFigureLabel = structuredClone(taxonomy);
  promotedFigureLabel.articleFigure5aMarkerContext.boundary = "Every label is a unique canonical marker and exact cross-study identity rule.";
  await assert.rejects(() => validateAlkaslasiCholinergicSourceTaxonomy(promotedFigureLabel), /schema validation|Figure 5a marker labels must retain/i);
});

test("rejects morphology, internal detail, coordinates, registration, identity, prevalence, or finer-subclass promotion", async () => {
  const morphology = structuredClone(taxonomy);
  morphology.profiles[0].missingEvidence.morphology = "observed";
  await assert.rejects(() => validateAlkaslasiCholinergicSourceTaxonomy(morphology), /schema validation|unsupported morphology/i);

  const internalStructures = structuredClone(taxonomy);
  internalStructures.profiles[0].missingEvidence.intracellularStructures = "reconstructed";
  await assert.rejects(() => validateAlkaslasiCholinergicSourceTaxonomy(internalStructures), /schema validation|unsupported internal structures/i);

  const coordinates = structuredClone(taxonomy);
  coordinates.profiles[0].cellXyz = [1, 2, 3];
  await assert.rejects(() => validateAlkaslasiCholinergicSourceTaxonomy(coordinates), /schema validation|additional properties/i);

  const promotedSpatialNarrative = structuredClone(taxonomy);
  promotedSpatialNarrative.profiles[0].articleSpatialContext.value = "Exact atlas coordinates and lamina assignment reconstructed for every deposited I1 nucleus";
  await assert.rejects(() => validateAlkaslasiCholinergicSourceTaxonomy(promotedSpatialNarrative), /I1 article evidence.*receipt changed/i);

  const crossSourceIdentity = structuredClone(taxonomy);
  crossSourceIdentity.scope.exactCrossSourceIdentityCount = 1;
  await assert.rejects(() => validateAlkaslasiCholinergicSourceTaxonomy(crossSourceIdentity), /schema validation|cross-source identity/i);

  const registration = structuredClone(taxonomy);
  registration.scope.projectRegistrationCount = 8;
  await assert.rejects(() => validateAlkaslasiCholinergicSourceTaxonomy(registration), /schema validation|registration/i);

  const geometry = structuredClone(taxonomy);
  geometry.scope.generatedGeometryCount = 8;
  await assert.rejects(() => validateAlkaslasiCholinergicSourceTaxonomy(geometry), /schema validation|generatedGeometryCount/i);

  const prevalence = structuredClone(taxonomy);
  prevalence.profiles[0].missingEvidence.biologicalPrevalence = "estimated_from_nucleus_fraction";
  await assert.rejects(() => validateAlkaslasiCholinergicSourceTaxonomy(prevalence), /schema validation|prevalence/i);

  const finerSubclassAssignments = structuredClone(taxonomy);
  finerSubclassAssignments.scope.depositedFinerSubclassAssignmentsAvailable = true;
  await assert.rejects(() => validateAlkaslasiCholinergicSourceTaxonomy(finerSubclassAssignments), /schema validation|depositedFinerSubclassAssignmentsAvailable/i);
});

test("locks source locators, negative gates, selection bias, and source-object rights", async () => {
  const alteredLocator = structuredClone(taxonomy);
  alteredLocator.sourceLocators.find((locator) => locator.id === "paper-interneuron-section").locator += " Invented exact subclass assignments.";
  await assert.rejects(() => validateAlkaslasiCholinergicSourceTaxonomy(alteredLocator), /source locator text, authority, or field support changed/i);

  const alteredBoundary = structuredClone(taxonomy);
  alteredBoundary.hardBoundaries[10] = "Article marker claims are treated as exact per-nucleus expression measurements and universal classification rules for every retained nucleus.";
  await assert.rejects(() => validateAlkaslasiCholinergicSourceTaxonomy(alteredBoundary), /hard-boundary text or order changed/i);

  const unknownAssetLocator = structuredClone(taxonomy);
  unknownAssetLocator.source.geo.annotationAsset.sourceLocatorIds.push("invented-rights-clearance");
  await assert.rejects(() => validateAlkaslasiCholinergicSourceTaxonomy(unknownAssetLocator), /annotation-asset locators must remain exact/i);

  const bundled = structuredClone(taxonomy);
  bundled.source.geo.annotationAsset.sourceFileBundled = true;
  await assert.rejects(() => validateAlkaslasiCholinergicSourceTaxonomy(bundled), /schema validation|must not be bundled/i);

  const rosterBundled = structuredClone(taxonomy);
  rosterBundled.source.geo.annotationAsset.exactNucleusRosterBundled = true;
  await assert.rejects(() => validateAlkaslasiCholinergicSourceTaxonomy(rosterBundled), /schema validation|exact nucleus roster must not be bundled/i);

  const assumedReuse = structuredClone(taxonomy);
  assumedReuse.source.geo.annotationAsset.reuseStatus = "REDISTRIBUTION_PERMITTED";
  await assert.rejects(() => validateAlkaslasiCholinergicSourceTaxonomy(assumedReuse), /schema validation|assumed redistribution permission/i);

  const erasedSelectionBias = structuredClone(taxonomy);
  erasedSelectionBias.hardBoundaries[2] = "The source sample is an unbiased adult cholinergic census with perfect reporter specificity and no enrichment boundary.";
  await assert.rejects(() => validateAlkaslasiCholinergicSourceTaxonomy(erasedSelectionBias), /hard-boundary text or order changed|reporter-history selection bias/i);
});

test("locks exact headers, partitions, suffix anomaly, and tuple receipts", () => {
  assert.deepEqual(taxonomy.sourceObjectAudit.exactHeaders, ALKASLASI_SOURCE_RECEIPT.exactHeaders);
  assert.deepEqual(taxonomy.sourceObjectAudit.typeCounts, {
    "Excitatory Neurons": 13223,
    "Inhibitory Neurons": 4966,
    "Cholinergic Neurons": 16042,
  });
  assert.deepEqual(taxonomy.sourceObjectAudit.cholinergicTypeCounts, {
    "Cholinergic Interneurons": 5375,
    "Skeletal Motor Neurons": 5054,
    "Visceral Motor Neurons": 5613,
  });
  assert.deepEqual(taxonomy.sourceObjectAudit.skeletalTypeCounts, {
    "Alpha Motor Neurons": 1284,
    "Gamma Motor Neurons": 2243,
    "Type 3 Motor Neurons": 1527,
  });
  assert.equal(taxonomy.sourceObjectAudit.allSourceRowsTupleReceipt.sha256, "1e2794fd596d711d873b3394fca98ee98cfc65a13d69148d512f1dafe6e5dee0");
  assert.equal(taxonomy.sourceObjectAudit.interneuronSubsetTupleReceipt.sha256, ALKASLASI_SOURCE_RECEIPT.interneuronSubsetTupleSha256);
  assert.equal(taxonomy.sourceObjectAudit.profileAggregateTupleReceipt.sha256, "3b8b21739460bb35187a07a63bb3e0a52d41a32fc46e88e459ae357ae754d7e9");
  assert.equal(taxonomyText.includes("AAACCCAGTCCCACGA-1-thoracic_1"), false);
});

test("deterministically rebuilds the exact committed JSON from the pinned gzip", { skip: !SOURCE_AVAILABLE }, async () => {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "alkaslasi-taxonomy-"));
  try {
    const firstPath = join(temporaryDirectory, "first.json");
    const secondPath = join(temporaryDirectory, "nested", "second.json");
    const built = await buildAlkaslasiCholinergicTaxonomy({ sourceGzipPath: SOURCE_GZIP });
    assert.deepEqual(built, taxonomy);

    const first = await writeAlkaslasiCholinergicTaxonomy({ sourceGzipPath: SOURCE_GZIP, outputPath: firstPath });
    const second = await writeAlkaslasiCholinergicTaxonomy({ sourceGzipPath: SOURCE_GZIP, outputPath: secondPath });
    assert.equal(first.outputSha256, "e87729a1ef5f0d521fb583a2a34173e0f1b169799c60b6017a3a8cfeca1bec7e");
    assert.equal(second.outputSha256, first.outputSha256);
    assert.equal(await readFile(firstPath, "utf8"), taxonomyText);
    assert.equal(await readFile(secondPath, "utf8"), taxonomyText);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});

test("audits the exact deposited gzip filename, byte receipts, headers, counts, and hashes", { skip: !SOURCE_AVAILABLE }, async () => {
  const audit = await auditAlkaslasiSourceGzip(SOURCE_GZIP);
  assert.deepEqual(
    {
      fileName: audit.fileName,
      compressedBytes: audit.compressedBytes,
      compressedSha256: audit.compressedSha256,
      uncompressedBytes: audit.uncompressedBytes,
      uncompressedSha256: audit.uncompressedSha256,
      exactHeaders: audit.exactHeaders,
      sourceRowCount: audit.sourceRowCount,
      uniqueBarcodeCount: audit.uniqueBarcodeCount,
      profileCounts: audit.profileCounts,
      profileRegionCounts: audit.profileRegionCounts,
      profileSexCounts: audit.profileSexCounts,
      allSourceRowsTupleSha256: audit.allSourceRowsTupleSha256,
      interneuronSubsetTupleSha256: audit.interneuronSubsetTupleSha256,
      profileAggregateTupleSha256: audit.profileAggregateTupleSha256,
    },
    {
      fileName: ALKASLASI_SOURCE_RECEIPT.fileName,
      compressedBytes: 333655,
      compressedSha256: "6e69c106544a394dd23b6e7b4fc2d159a715aaa8a70adbd61721338e8d29c091",
      uncompressedBytes: 3372611,
      uncompressedSha256: "d8ca3a504cbbc3a96050e0c98ad7ac04d1a9a0b791b94acbee7ef158840febc2",
      exactHeaders: ["", "barcodes", "sex", "expt", "types", "newnames", "cholinergictypes", "skeletaltypes"],
      sourceRowCount: 34231,
      uniqueBarcodeCount: 34231,
      profileCounts: ALKASLASI_PROFILE_COUNTS,
      profileRegionCounts: ALKASLASI_PROFILE_REGION_COUNTS,
      profileSexCounts: ALKASLASI_PROFILE_SEX_COUNTS,
      allSourceRowsTupleSha256: "1e2794fd596d711d873b3394fca98ee98cfc65a13d69148d512f1dafe6e5dee0",
      interneuronSubsetTupleSha256: "11e9f1dc232d08f26cbe657468b61000b6964be1046e0cab06c718d0c6e77bf9",
      profileAggregateTupleSha256: "3b8b21739460bb35187a07a63bb3e0a52d41a32fc46e88e459ae357ae754d7e9",
    },
  );
});

test("rejects a renamed, byte-truncated, or same-size checksum-altered source object", { skip: !SOURCE_AVAILABLE }, async () => {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "alkaslasi-bad-source-"));
  try {
    const sourceBytes = await readFile(SOURCE_GZIP);

    const renamedPath = join(temporaryDirectory, "renamed-annotations.csv.gz");
    await writeFile(renamedPath, sourceBytes);
    await assert.rejects(() => auditAlkaslasiSourceGzip(renamedPath), /source filename changed/i);

    const exactNamePath = join(temporaryDirectory, ALKASLASI_SOURCE_RECEIPT.fileName);
    await writeFile(exactNamePath, sourceBytes.subarray(0, sourceBytes.length - 1));
    await assert.rejects(() => auditAlkaslasiSourceGzip(exactNamePath), /compressed source byte count changed/i);

    const alteredBytes = Buffer.from(sourceBytes);
    alteredBytes[100] ^= 1;
    await writeFile(exactNamePath, alteredBytes);
    await assert.rejects(() => auditAlkaslasiSourceGzip(exactNamePath), /compressed source SHA-256 changed/i);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});
