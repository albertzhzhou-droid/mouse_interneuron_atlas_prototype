#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_PATH = path.join(PROJECT_ROOT, "data/alkaslasi-cholinergic-source-taxonomy-0.1.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/alkaslasi-cholinergic-source-taxonomy-0.1.schema.json");

const EXPECTED_PROFILE_COUNTS = Object.freeze({ I1: 1520, I2: 780, I3: 756, I4: 702, I5: 584, I6: 544, I7: 160, I8: 329 });
const EXPECTED_REGION_COUNTS = Object.freeze({
  I1: Object.freeze({ Cervical: 361, Thoracic: 404, Lumbar: 755 }),
  I2: Object.freeze({ Cervical: 220, Thoracic: 208, Lumbar: 352 }),
  I3: Object.freeze({ Cervical: 171, Thoracic: 192, Lumbar: 393 }),
  I4: Object.freeze({ Cervical: 144, Thoracic: 161, Lumbar: 397 }),
  I5: Object.freeze({ Cervical: 199, Thoracic: 208, Lumbar: 177 }),
  I6: Object.freeze({ Cervical: 164, Thoracic: 209, Lumbar: 171 }),
  I7: Object.freeze({ Cervical: 33, Thoracic: 37, Lumbar: 90 }),
  I8: Object.freeze({ Cervical: 100, Thoracic: 70, Lumbar: 159 }),
});
const EXPECTED_SEX_COUNTS = Object.freeze({
  I1: Object.freeze({ M: 409, F: 444, NA: 667 }),
  I2: Object.freeze({ M: 263, F: 221, NA: 296 }),
  I3: Object.freeze({ M: 209, F: 223, NA: 324 }),
  I4: Object.freeze({ M: 183, F: 206, NA: 313 }),
  I5: Object.freeze({ M: 173, F: 178, NA: 233 }),
  I6: Object.freeze({ M: 171, F: 182, NA: 191 }),
  I7: Object.freeze({ M: 44, F: 33, NA: 83 }),
  I8: Object.freeze({ M: 81, F: 72, NA: 176 }),
});
const EXPECTED_MARKER_PANELS = Object.freeze({
  I1: ["Pax2", "Mpped2", "Slc6a1", "Piezo2"],
  I2: ["Pax2", "Mpped2", "Slc6a1"],
  I3: ["Pax2", "Mpped2", "Slc6a1"],
  I4: ["Pax2", "Mpped2", "Slc6a1"],
  I5: ["Pax2", "Mpped2", "Pitx2", "Tox"],
  I6: ["Pax2", "Mpped2", "Pitx2"],
  I7: ["Pax2", "Mpped2", "Piezo2"],
  I8: ["Mpped2", "Piezo2", "Reln", "Chat"],
});
const EXPECTED_FIGURE_5A_PROMINENT_LABELS = Object.freeze({
  I1: Object.freeze(["Igsl3", "Prlr", "Cdh23"]),
  I2: Object.freeze(["Chst9", "Lama2", "Pde5a"]),
  I3: Object.freeze(["Sox6", "Col18a1", "9530026P05Rik"]),
  I4: Object.freeze(["Zfp536", "Col18a1", "Pde11a"]),
  I5: Object.freeze(["Gm13912", "Ror2", "Gm12649"]),
  I6: Object.freeze(["Aldh1a1", "Gm21847", "Fer1l6"]),
  I7: Object.freeze(["Pde5a", "Adamtsl1", "Cpne4"]),
  I8: Object.freeze(["Pde11a", "Nr5a2", "CT010465.1", "Slc30a8"]),
});
const EXPECTED_FIGURE_5A_LABEL_UNION = Object.freeze([
  "Igsl3", "Prlr", "Cdh23", "Chst9", "Pde5a", "Lama2", "Sox6", "Col18a1",
  "9530026P05Rik", "Zfp536", "Pde11a", "Gm13912", "Ror2", "Gm12649", "Aldh1a1",
  "Gm21847", "Fer1l6", "Adamtsl1", "Cpne4", "Nr5a2", "CT010465.1", "Slc30a8",
]);
const EXPECTED_LOCATOR_IDS = Object.freeze([
  "paper-methods-sample-frame",
  "paper-results-source-denominators",
  "paper-main-classification",
  "paper-interneuron-section",
  "paper-figure-5-i5-i6",
  "paper-figure-5-i8",
  "paper-sex-analysis",
  "geo-series-record",
  "geo-annotation-object",
  "geo-rights-boundary",
  "study-missing-axes",
  "article-license",
]);
const EXPECTED_SUFFIX_COUNTS = Object.freeze([
  Object.freeze({ suffix: "thoracic_1", allRows: 3274, interneuronRows: 655 }),
  Object.freeze({ suffix: "thoracic_2", allRows: 2946, interneuronRows: 423 }),
  Object.freeze({ suffix: "thoracic_3", allRows: 3101, interneuronRows: 411 }),
  Object.freeze({ suffix: "cervical_4", allRows: 1620, interneuronRows: 161 }),
  Object.freeze({ suffix: "cervical_5", allRows: 2523, interneuronRows: 462 }),
  Object.freeze({ suffix: "cervical-cervical_6", allRows: 4798, interneuronRows: 769 }),
  Object.freeze({ suffix: "lumbar_7", allRows: 4566, interneuronRows: 717 }),
  Object.freeze({ suffix: "lumbar_8", allRows: 4455, interneuronRows: 674 }),
  Object.freeze({ suffix: "lumbar_9", allRows: 6948, interneuronRows: 1103 }),
]);
const EXPECTED_SOURCE_LOCATORS_SHA256 = "d92efc7a565c064febfc3539609036d689443184a5552dc99fe7c94b09034385";
const EXPECTED_HARD_BOUNDARIES_SHA256 = "719d4ad432f0a4ab3e1c8b476ed02faa724c3a242af0c37d4e4918d6dd9302d4";
const EXPECTED_PROFILE_EVIDENCE_SHA256 = Object.freeze({
  I1: "185c00f5e524f5b0f33a4ee2f5693faa0fcd9a5a4662f7b261386cf23d0d41b6",
  I2: "6db499aff3bc499120d8665dfac848e80369e8f3de8e57aa2c5e0d47b2dbdd54",
  I3: "7e1dac1736468f30d7c1c2ab5a797b04ab6e06bb913eee6087af5b79468f2afb",
  I4: "49f783900fa5e68eb5fb486c16f2525f479d32258e5f42f54709f72b4725583b",
  I5: "fb7e5cc23f60e837a32a5ba2cabb8d603b87620710c587602b18e8e09d0a28ed",
  I6: "f7c3cd8ac307df50a8b4d6f5c2d7e076b16418d57c5d2a6ac8efaf794c5eba0c",
  I7: "16a87ec925e9998b9400e6f58cf81d3f420608aeaba2bcfa96cb4d7373579671",
  I8: "8abc7508b2f76d6c309b2b3d6d6714b14e49708b9f0f635dc99c58201da6efc4",
});
const PROFILE_EVIDENCE_FIELDS = Object.freeze([
  "id",
  "rawSourceLabels",
  "regionClass",
  "transmitterClass",
  "projectUseClass",
  "lifeStage",
  "spinalScope",
  "markerPanel",
  "markerEvidence",
  "articleSpatialContext",
  "rostrocaudalContext",
  "putativeCellTypeLabel",
  "putativeAssignmentStatus",
  "i8ArticleCaution",
  "fieldLocators",
  "missingEvidence",
]);

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

function jsonEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function jsonSha256(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function profileEvidenceReceipt(profile) {
  return jsonSha256(Object.fromEntries(PROFILE_EVIDENCE_FIELDS.map((field) => [field, profile?.[field]])));
}

function sum(record) {
  return Object.values(record ?? {}).reduce((total, value) => total + value, 0);
}

function hasBoundary(boundaries, pattern) {
  return Array.isArray(boundaries) && boundaries.some((boundary) => pattern.test(boundary));
}

function formatSchemaErrors(errors = []) {
  return errors.map((error) => `${error.instancePath || "/"}: ${error.message ?? "schema violation"}`);
}

async function compileSchema() {
  const schema = JSON.parse(await readFile(SCHEMA_PATH, "utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  return ajv.compile(schema);
}

function validateSourceAndScope(taxonomy, errors) {
  const publication = taxonomy.source?.publication;
  const geo = taxonomy.source?.geo;
  const frame = geo?.sampleFrame;
  const asset = geo?.annotationAsset;
  const scope = taxonomy.scope;

  check(publication?.doi === "10.1038/s41467-021-22691-2", "primary DOI must remain exact", errors);
  check(publication?.pmid === "33931636", "authoritative article PMID must remain 33931636", errors);
  check(publication?.citation === "Alkaslasi MR, Piccus ZE, Hareendran S, et al. Single nucleus RNA-sequencing defines unexpected diversity of cholinergic neuron types in the adult mouse spinal cord. Nature Communications 12, 2471 (2021).", "primary citation must remain exact", errors);
  check(publication?.license?.id === "CC-BY-4.0", "article licence must remain CC-BY-4.0", errors);
  check(jsonEqual(publication?.license?.sourceLocatorIds, ["article-license"]), "article licence locator must remain exact", errors);
  check(/distinct GEO-hosted annotation object/i.test(publication?.license?.rightsBoundary ?? ""), "article licence must retain the GEO-object rights boundary", errors);
  check(geo?.accession === "GSE167597" && geo?.sraStudyAccession === "SRP308350" && geo?.bioProjectAccession === "PRJNA705097", "GEO/SRA/BioProject accessions must remain exact", errors);
  check(geo?.displayedCitationPmid === "37559423", "GEO-displayed citation PMID must remain preserved", errors);
  check(/not the Alkaslasi et al\. 2021 article/i.test(geo?.citationLinkBoundary ?? "") && /33931636/.test(geo?.citationLinkBoundary ?? ""), "GEO citation mismatch must retain the authoritative PMID boundary", errors);

  check(frame?.sourceAnimalCount === 12, "source animal denominator must remain 12", errors);
  check(frame?.femaleAnimalCount === 6 && frame?.maleAnimalCount === 6, "source animal sex denominator must remain 6 female plus 6 male", errors);
  check(frame?.ageWeeks === 8, "source age must remain 8 weeks", errors);
  check(frame?.matchingRegionMousePoolSize === 2, "matching-region mouse pool size must remain 2", errors);
  check(frame?.processingReplicateMouseCount === 4, "processing-replicate mouse denominator must remain 4", errors);
  check(frame?.processingReplicateCount === 3, "processing replicate denominator must remain 3", errors);
  check(frame?.geoSampleCount === 9 && frame?.geoSampleAccessions?.length === 9, "GEO sample denominator must remain 9", errors);
  check(jsonEqual(frame?.replicateContexts, ["mixed-sex", "male", "female"]), "replicate contexts must remain mixed-sex, male, and female without row-level imputation", errors);
  check(jsonEqual(frame?.sourceLocatorIds, ["paper-methods-sample-frame", "geo-series-record"]), "sample-frame locators must remain exact", errors);
  check(frame?.articleSexAnalysis?.finding === "no_sex_specific_differences_observed_among_cholinergic_neurons", "study-level sex-analysis negative finding changed", errors);
  check(/not proof of equivalence/i.test(frame?.articleSexAnalysis?.boundary ?? ""), "study-level sex analysis must retain its no-equivalence boundary", errors);
  check(/distinct denominator levels/i.test(frame?.interpretationBoundary ?? ""), "sample frame must keep mice, replicates, GEO samples, and nuclei distinct", errors);

  check(asset?.fileName === "GSE167597_all_AlkaslasiPiccus_annotations.csv.gz", "annotation filename must remain exact", errors);
  check(asset?.compressedBytes === 333655, "annotation compressed byte count must remain 333655", errors);
  check(asset?.compressedSha256 === "6e69c106544a394dd23b6e7b4fc2d159a715aaa8a70adbd61721338e8d29c091", "annotation compressed SHA-256 must remain exact", errors);
  check(asset?.uncompressedBytes === 3372611, "annotation uncompressed byte count must remain 3372611", errors);
  check(asset?.uncompressedSha256 === "d8ca3a504cbbc3a96050e0c98ad7ac04d1a9a0b791b94acbee7ef158840febc2", "annotation uncompressed SHA-256 must remain exact", errors);
  check(asset?.sourceFileBundled === false && asset?.exactNucleusRosterBundled === false, "raw annotation and exact nucleus roster must not be bundled", errors);
  check(asset?.derivedFactualMetadataBundled === true, "derived factual metadata must remain the only bundled Alkaslasi payload", errors);
  check(asset?.reuseStatus === "PUBLIC_ACCESS_REUSE_NOT_ASSUMED", "public GEO access must not become assumed redistribution permission", errors);
  check(jsonEqual(asset?.sourceLocatorIds, ["geo-annotation-object", "geo-rights-boundary"]), "annotation-asset locators must remain exact", errors);
  check(/no separate file-level redistribution licence is inferred/i.test(asset?.rightsBoundary ?? "") && /neither .* bundled|not bundled/i.test(asset?.rightsBoundary ?? ""), "annotation asset must retain its no-redistribution-inference and no-bundling boundary", errors);

  const expectedScope = {
    sourceTotalQcRetainedNucleusCount: 34231,
    sourceCholinergicNucleusCount: 16042,
    sourceInterneuronNucleusCount: 5375,
    displayedProfileCount: 8,
    sourceLabelledCholinergicInterneuronProfileCount: 8,
    articlePax2HighProfileCount: 7,
    articleCautiousI8ProfileCount: 1,
    articleFinerInterneuronSubclassCount: 14,
    depositedFinerSubclassAssignmentsAvailable: false,
    projectCanonicalTypeCount: 0,
    exactCrossSourceIdentityCount: 0,
    projectRegistrationCount: 0,
    generatedGeometryCount: 0,
  };
  for (const [field, expected] of Object.entries(expectedScope)) check(scope?.[field] === expected, `scope ${field} must remain ${expected}`, errors);
  check(scope?.samplingCountInterpretation === "SAMPLING_COUNT_ONLY_NOT_PREVALENCE", "scope must retain the no-prevalence interpretation", errors);
  check(/deposited annotation uses Lumbar/i.test(scope?.spinalRegion ?? ""), "scope must preserve deposited Lumbar separately from article lumbar/sacral context", errors);

  check(taxonomy.articlePipelineStages?.preliminaryQcClusterCount === 38, "preliminary QC cluster denominator must remain 38", errors);
  check(taxonomy.articlePipelineStages?.preliminaryNonCholinergicClusterCount === 22, "preliminary non-cholinergic cluster denominator must remain 22", errors);
  check(taxonomy.articlePipelineStages?.finalCholinergicClassCount === 21, "final cholinergic class denominator must remain 21", errors);
  check(/distinct analysis stages/i.test(taxonomy.articlePipelineStages?.interpretationBoundary ?? ""), "article pipeline stages must not be collapsed arithmetically", errors);
  const figureContext = taxonomy.articleFigure5aMarkerContext;
  check(figureContext?.authority === "article_figure_display_context", "Figure 5a marker labels must retain figure-context authority", errors);
  check(jsonEqual(figureContext?.markerLabelUnion, EXPECTED_FIGURE_5A_LABEL_UNION), "Figure 5a marker-label union changed", errors);
  check(jsonEqual(figureContext?.prominentLabelsByProfile, EXPECTED_FIGURE_5A_PROMINENT_LABELS), "Figure 5a profile-label context changed", errors);
  check(jsonEqual(figureContext?.sourceLocatorIds, ["paper-interneuron-section"]), "Figure 5a marker context locator changed", errors);
  check(/shared labels occur/i.test(figureContext?.boundary ?? "") && /no label is promoted to a uniquely specific canonical marker/i.test(figureContext?.boundary ?? ""), "Figure 5a marker labels must retain non-specific context boundary", errors);
}

function validateObjectAudit(taxonomy, errors) {
  const audit = taxonomy.sourceObjectAudit;
  check(jsonEqual(audit?.exactHeaders, ["", "barcodes", "sex", "expt", "types", "newnames", "cholinergictypes", "skeletaltypes"]), "exact eight-column header changed", errors);
  check(audit?.sourceRowCount === 34231 && audit?.uniqueBarcodeCount === 34231 && audit?.contiguousSourceRowIndex === true, "source row/barcode/index audit changed", errors);
  check(jsonEqual(audit?.typeCounts, { "Excitatory Neurons": 13223, "Inhibitory Neurons": 4966, "Cholinergic Neurons": 16042 }), "broad type partition changed", errors);
  check(jsonEqual(audit?.cholinergicTypeCounts, { "Cholinergic Interneurons": 5375, "Skeletal Motor Neurons": 5054, "Visceral Motor Neurons": 5613 }), "cholinergic type partition changed", errors);
  check(jsonEqual(audit?.skeletalTypeCounts, {
    "Alpha Motor Neurons": 1284,
    "Gamma Motor Neurons": 2243,
    "Type 3 Motor Neurons": 1527,
  }), "skeletal type context partition changed", errors);
  check(jsonEqual(audit?.allDepositedSexFieldCounts, { M: 9460, F: 9924, NA: 14847 }), "all-row deposited sex partition changed", errors);
  check(jsonEqual(audit?.interneuronSampleRegionCounts, { Cervical: 1392, Thoracic: 1489, Lumbar: 2494 }), "interneuron sample-region partition changed", errors);
  check(jsonEqual(audit?.interneuronDepositedSexFieldCounts, { M: 1533, F: 1559, NA: 2283 }), "interneuron deposited sex partition changed", errors);
  check(jsonEqual(audit?.barcodeSampleSuffixCounts, EXPECTED_SUFFIX_COUNTS), "barcode sample-suffix inventory changed", errors);
  check(jsonEqual(audit?.skeletalLabelConflicts?.map(({ sourceRowIndex, barcode, newnames, skeletaltypes }) => ({ sourceRowIndex, barcode, newnames, skeletaltypes })), [
    { sourceRowIndex: 890, barcode: "CAGGCCACAGAGAAAG-1-thoracic_1", newnames: "S1", skeletaltypes: "Alpha Motor Neurons" },
    { sourceRowIndex: 11985, barcode: "CGGGACTCAGTTTCAG-1-cervical_5", newnames: "S2", skeletaltypes: "Type 3 Motor Neurons" },
    { sourceRowIndex: 15851, barcode: "GACGTTATCGATCCCT-1-cervical-cervical_6", newnames: "S1", skeletaltypes: "Gamma Motor Neurons" },
    { sourceRowIndex: 26156, barcode: "TATCCTAAGAATCGAT-1-lumbar_8", newnames: "S2", skeletaltypes: "Gamma Motor Neurons" },
  ]), "skeletal newnames/skeletaltypes conflict roster changed", errors);
  check(audit?.skeletalLabelConflicts?.every((conflict) => conflict.conflictStatus === "PRESERVED_NOT_REPAIRED" && /does not enter the I1-I8 profile denominator/i.test(conflict.boundary ?? "")), "skeletal label conflicts must remain preserved, unrepaired, and outside I1-I8", errors);
  check(audit?.allSourceRowsTupleReceipt?.sha256 === "1e2794fd596d711d873b3394fca98ee98cfc65a13d69148d512f1dafe6e5dee0", "all-source-row tuple SHA-256 changed", errors);
  check(audit?.interneuronSubsetTupleReceipt?.sha256 === "11e9f1dc232d08f26cbe657468b61000b6964be1046e0cab06c718d0c6e77bf9", "I1-I8 source tuple SHA-256 changed", errors);
  check(audit?.profileAggregateTupleReceipt?.sha256 === "3b8b21739460bb35187a07a63bb3e0a52d41a32fc46e88e459ae357ae754d7e9", "I1-I8 aggregate tuple SHA-256 changed", errors);
  const anomaly = audit?.rawSourceAnomalies?.[0];
  check(anomaly?.rawValue === "cervical-cervical_6" && anomaly?.allRowCount === 4798 && anomaly?.interneuronRowCount === 769, "cervical-cervical_6 raw suffix anomaly changed", errors);
  check(/not silently normalized/i.test(anomaly?.boundary ?? ""), "raw suffix anomaly must keep its no-silent-normalization boundary", errors);
}

function validateProfiles(taxonomy, errors) {
  const labels = Object.keys(EXPECTED_PROFILE_COUNTS);
  const profiles = taxonomy.profiles ?? [];
  check(jsonEqual(profiles.map((profile) => profile.sourceLocalLabel), labels), "I1-I8 labels or source order changed", errors);
  check(new Set(profiles.map((profile) => profile.id)).size === 8, "profile IDs must be unique", errors);
  let assignedNuclei = 0;
  let cervical = 0;
  let thoracic = 0;
  let lumbar = 0;
  let male = 0;
  let female = 0;
  let na = 0;

  const locatorById = new Map((taxonomy.sourceLocators ?? []).map((locator) => [locator.id, locator]));
  for (const profile of profiles) {
    const label = profile.sourceLocalLabel;
    check(profile.id === `alkaslasi-2021:GSE167597:${label}`, `${label} profile ID changed`, errors);
    check(jsonEqual(profile.rawSourceLabels, [label]), `${label} raw source label must remain verbatim`, errors);
    check(profile.regionClass === "not_established", `${label} must not acquire a region class`, errors);
    check(profile.transmitterClass === "cholinergic", `${label} transmitter class must remain cholinergic`, errors);
    check(profile.samplingCount?.value === EXPECTED_PROFILE_COUNTS[label], `${label} sampling count changed`, errors);
    check(profile.samplingCount?.interpretation === "CHECKSUM_PINNED_SOURCE_ASSIGNMENT_COUNT_NOT_PREVALENCE", `${label} sampling boundary changed`, errors);
    check(jsonEqual(profile.sampleRegionMembership?.counts, EXPECTED_REGION_COUNTS[label]), `${label} sample-region counts changed`, errors);
    check(jsonEqual(profile.sampleRegionMembership?.depositedLabels, ["Cervical", "Thoracic", "Lumbar"]), `${label} deposited Lumbar label changed`, errors);
    check(/not xyz coordinates/i.test(profile.sampleRegionMembership?.boundary ?? ""), `${label} region membership lacks a no-coordinate boundary`, errors);
    check(jsonEqual(profile.depositedSexFieldMembership?.counts, EXPECTED_SEX_COUNTS[label]), `${label} deposited sex-field counts changed`, errors);
    check(profile.depositedSexFieldMembership?.naInterpretation === "PRESERVED_AS_DEPOSITED_NOT_IMPUTED", `${label} deposited NA was imputed or reinterpreted`, errors);
    check(/NA is not relabelled/i.test(profile.depositedSexFieldMembership?.boundary ?? ""), `${label} lacks an explicit NA non-imputation boundary`, errors);
    check(jsonEqual(profile.markerPanel, EXPECTED_MARKER_PANELS[label]), `${label} article marker panel changed`, errors);
    check(profile.markerEvidence?.every((claim) => /not a deposited per-nucleus expression measurement/i.test(claim.boundary)), `${label} marker evidence lacks a per-nucleus boundary`, errors);
    check(profile.articleSpatialContext?.boundary?.toLowerCase().includes("coordinate") || profile.articleSpatialContext?.boundary?.toLowerCase().includes("xyz"), `${label} article spatial context lacks a no-coordinate boundary`, errors);
    check(profile.missingEvidence?.morphology === "not_measured" && profile.missingEvidence?.cellCoordinates === "not_available", `${label} acquired unsupported morphology or coordinates`, errors);
    check(profile.missingEvidence?.intracellularStructures === "not_measured" && profile.missingEvidence?.organelles === "not_measured", `${label} acquired unsupported internal structures`, errors);
    check(profile.missingEvidence?.atlasRegistration === "not_established", `${label} acquired an atlas registration`, errors);
    check(profile.missingEvidence?.crossSourceSameCellIdentityLink === "not_established" && profile.missingEvidence?.crossSourceSameTypeIdentityLink === "not_established", `${label} acquired a cross-source identity`, errors);
    check(profile.missingEvidence?.biologicalPrevalence === "not_estimable_from_enriched_sample", `${label} acquired a prevalence interpretation`, errors);

    const fieldLocatorIds = Object.values(profile.fieldLocators ?? {}).flat();
    for (const locatorId of fieldLocatorIds) check(locatorById.has(locatorId), `${label} references unknown source locator ${locatorId}`, errors);
    for (const markerClaim of profile.markerEvidence ?? []) {
      for (const locatorId of markerClaim.sourceLocatorIds ?? []) check(locatorById.has(locatorId), `${label} marker claim references unknown source locator ${locatorId}`, errors);
    }

    if (label === "I6") check(profile.markerEvidence.some((claim) => jsonEqual(claim.negativeMarkers, ["Tox"])), "I6 must retain the article's Tox-negative example context", errors);
    if (label === "I8") {
      check(typeof profile.i8ArticleCaution === "string" && /suspected/i.test(profile.i8ArticleCaution) && /ISH support/i.test(profile.i8ArticleCaution), "I8 must retain both the suspected and later ISH-supported article stages", errors);
      check(profile.markerEvidence.some((claim) => claim.positiveMarkers.includes("Piezo2") && claim.positiveMarkers.includes("Reln") && claim.positiveMarkers.includes("Chat")), "I8 must retain Piezo2/Reln/Chat ISH context", errors);
      check(profile.markerEvidence.some((claim) => claim.negativeMarkers.includes("Pax2")), "I8 must retain the article's non-Pax2 main-classification context", errors);
    } else {
      check(profile.i8ArticleCaution === null, `${label} must not inherit the I8-specific caution`, errors);
    }
    check(profileEvidenceReceipt(profile) === EXPECTED_PROFILE_EVIDENCE_SHA256[label], `${label} article evidence, missingness, or field-locator receipt changed`, errors);

    assignedNuclei += profile.samplingCount?.value ?? 0;
    cervical += profile.sampleRegionMembership?.counts?.Cervical ?? 0;
    thoracic += profile.sampleRegionMembership?.counts?.Thoracic ?? 0;
    lumbar += profile.sampleRegionMembership?.counts?.Lumbar ?? 0;
    male += profile.depositedSexFieldMembership?.counts?.M ?? 0;
    female += profile.depositedSexFieldMembership?.counts?.F ?? 0;
    na += profile.depositedSexFieldMembership?.counts?.NA ?? 0;
    check(sum(profile.sampleRegionMembership?.counts) === profile.samplingCount?.value, `${label} region counts do not sum to its sampling denominator`, errors);
    check(sum(profile.depositedSexFieldMembership?.counts) === profile.samplingCount?.value, `${label} sex-field counts do not sum to its sampling denominator`, errors);
  }

  check(assignedNuclei === 5375, "I1-I8 profile counts must sum to 5,375 nuclei", errors);
  check(cervical === 1392 && thoracic === 1489 && lumbar === 2494, "I1-I8 sample-region counts must sum to 1,392 Cervical, 1,489 Thoracic, and 2,494 Lumbar", errors);
  check(male === 1533 && female === 1559 && na === 2283, "I1-I8 deposited sex-field counts must sum to 1,533 M, 1,559 F, and 2,283 NA", errors);
}

function validateLocatorsAndBoundaries(taxonomy, errors) {
  const locators = taxonomy.sourceLocators ?? [];
  const ids = locators.map((locator) => locator.id);
  check(jsonEqual(ids, EXPECTED_LOCATOR_IDS), "source locator identities or order changed", errors);
  check(jsonSha256(locators) === EXPECTED_SOURCE_LOCATORS_SHA256, "source locator text, authority, or field support changed", errors);
  check(new Set(ids).size === EXPECTED_LOCATOR_IDS.length, "source locator IDs must be unique", errors);
  const referenced = new Set([
    ...(taxonomy.source?.publication?.license?.sourceLocatorIds ?? []),
    ...(taxonomy.source?.geo?.sampleFrame?.sourceLocatorIds ?? []),
    ...(taxonomy.source?.geo?.sampleFrame?.articleSexAnalysis?.sourceLocatorIds ?? []),
    ...(taxonomy.source?.geo?.annotationAsset?.sourceLocatorIds ?? []),
    ...(taxonomy.articlePipelineStages?.sourceLocatorIds ?? []),
    ...(taxonomy.sourceObjectAudit?.sourceLocatorIds ?? []),
    ...(taxonomy.profiles ?? []).flatMap((profile) => [
      ...Object.values(profile.fieldLocators ?? {}).flat(),
      ...(profile.markerEvidence ?? []).flatMap((claim) => claim.sourceLocatorIds ?? []),
      ...(profile.articleSpatialContext?.sourceLocatorIds ?? []),
    ]),
  ]);
  for (const id of ids) check(referenced.has(id), `source locator is not referenced: ${id}`, errors);
  check(locators.find((locator) => locator.id === "geo-rights-boundary")?.evidenceStatus === "rights_boundary", "GEO rights locator must remain a rights-boundary record", errors);
  check(locators.find((locator) => locator.id === "paper-sex-analysis")?.evidenceStatus === "study_level_negative_finding", "sex-analysis locator must remain a study-level negative finding", errors);
  check(locators.find((locator) => locator.id === "study-missing-axes")?.evidenceStatus === "not_measured_or_not_linked", "missing-axes locator must remain explicit missingness", errors);

  const boundaries = taxonomy.hardBoundaries;
  check(jsonSha256(boundaries) === EXPECTED_HARD_BOUNDARIES_SHA256, "hard-boundary text or order changed", errors);
  check(hasBoundary(boundaries, /not an unbiased census.*not estimates of biological prevalence/i), "hard boundaries must reject census/prevalence interpretation", errors);
  check(hasBoundary(boundaries, /distinct denominator levels/i), "hard boundaries must separate animals, replicates, samples, and nuclei", errors);
  check(hasBoundary(boundaries, /Reporter history and leaky Cre/i), "hard boundaries must retain reporter-history selection bias", errors);
  check(hasBoundary(boundaries, /sample-membership labels, not xyz coordinates/i), "hard boundaries must reject region-to-coordinate promotion", errors);
  check(hasBoundary(boundaries, /Deposited sex value NA remains NA/i), "hard boundaries must preserve deposited NA", errors);
  check(hasBoundary(boundaries, /14 finer subclasses.*contextual only/i), "hard boundaries must reject invented 14-subclass assignments", errors);
  check(hasBoundary(boundaries, /I8 retains.*suspected.*ISH support/i), "hard boundaries must retain the I8 classification stages", errors);
  check(hasBoundary(boundaries, /No profile contains observed cell morphology/i), "hard boundaries must reject invented structural detail", errors);
  check(hasBoundary(boundaries, /Exact cross-source.*identity count remains zero/i), "hard boundaries must keep cross-source identity at zero", errors);
  check(hasBoundary(boundaries, /registration count and generated geometry count remain zero/i), "hard boundaries must keep registration and geometry at zero", errors);
  check(hasBoundary(boundaries, /Public GEO access is not treated as file-level redistribution permission/i), "hard boundaries must retain the source-object rights gate", errors);
}

function validateExcludedContext(taxonomy, errors) {
  const excluded = taxonomy.excludedSourceContext;
  check(excluded?.displayedNucleusCount === 5375 && excluded?.excludedNucleusCount === 28856, "displayed/excluded nucleus partition changed", errors);
  check((excluded?.displayedNucleusCount ?? 0) + (excluded?.excludedNucleusCount ?? 0) === 34231, "displayed and excluded nuclei must sum to 34,231", errors);
  check(excluded?.excludedCholinergicContext?.skeletalMotorNeuronNuclei === 5054 && excluded?.excludedCholinergicContext?.visceralMotorNeuronNuclei === 5613, "excluded motor-neuron context partition changed", errors);
  check(excluded?.excludedReporterHistoryContext?.excitatoryNeuronNuclei === 13223 && excluded?.excludedReporterHistoryContext?.inhibitoryNeuronNuclei === 4966, "excluded reporter-history context partition changed", errors);
  check(/not evidence.*biologically absent/i.test(excluded?.boundary ?? ""), "display exclusion must not become biological absence", errors);
}

export async function validateAlkaslasiCholinergicSourceTaxonomy(taxonomy = null) {
  const document = taxonomy ?? JSON.parse(await readFile(DATA_PATH, "utf8"));
  const schemaValidator = await compileSchema();
  if (!schemaValidator(document)) {
    throw new Error(`Alkaslasi cholinergic source taxonomy 0.1 schema validation failed:\n${formatSchemaErrors(schemaValidator.errors).map((item) => `- ${item}`).join("\n")}`);
  }

  const errors = [];
  check(document.releaseId === "ohri-alkaslasi-cholinergic-source-taxonomy-0.1.0", "release identity changed", errors);
  check(document.datasetId === "GSE167597", "dataset identity changed", errors);
  check(document.coordinateAuthority === "SOURCE_LOCAL_TYPE_ONLY", "coordinate authority must remain SOURCE_LOCAL_TYPE_ONLY", errors);
  validateSourceAndScope(document, errors);
  validateObjectAudit(document, errors);
  validateProfiles(document, errors);
  validateLocatorsAndBoundaries(document, errors);
  validateExcludedContext(document, errors);

  const serialized = JSON.stringify(document);
  check(!serialized.includes("AAACCCAGTCCCACGA-1-thoracic_1"), "contract must not bundle the exact per-nucleus barcode roster", errors);
  check(!Object.hasOwn(document, "cellXyz") && !Object.hasOwn(document, "geometry"), "contract must not expose top-level geometry", errors);

  if (errors.length) throw new Error(`Alkaslasi cholinergic source taxonomy 0.1 validation failed:\n${errors.map((item) => `- ${item}`).join("\n")}`);
  return {
    releaseId: document.releaseId,
    profileCount: document.profiles.length,
    assignedInterneuronNuclei: document.profiles.reduce((total, profile) => total + profile.samplingCount.value, 0),
    sourceAnimalCount: document.source.geo.sampleFrame.sourceAnimalCount,
    geoSampleCount: document.source.geo.sampleFrame.geoSampleCount,
    sourceTotalQcRetainedNuclei: document.scope.sourceTotalQcRetainedNucleusCount,
    sourceCholinergicNuclei: document.scope.sourceCholinergicNucleusCount,
    exactCrossSourceIdentityCount: document.scope.exactCrossSourceIdentityCount,
    projectRegistrationCount: document.scope.projectRegistrationCount,
    generatedGeometryCount: document.scope.generatedGeometryCount,
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    const report = await validateAlkaslasiCholinergicSourceTaxonomy();
    console.log(`Alkaslasi cholinergic source taxonomy validation passed: ${report.profileCount} profiles; ${report.assignedInterneuronNuclei.toLocaleString()} assigned nuclei; 0 registrations; 0 generated geometry`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
