import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const DATA_URL = new URL("../data/hayashi-v2a-source-taxonomy-0.1.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/hayashi-v2a-source-taxonomy-0.1.schema.json", import.meta.url);

const EXPECTED_CLUSTER_COUNTS = Object.freeze([144, 130, 121, 117, 112, 86, 59, 52, 51, 48, 29]);
const EXPECTED_LOCATOR_IDS = Object.freeze([
  "geo-series-design",
  "geo-matrix-object",
  "geo-sample-processing",
  "matrix-reanalysis-marker-discrepancy",
  "paper-summary-p3-p9",
  "paper-results-p27-p28",
  "paper-results-p29",
  "paper-figure-6",
  "paper-results-p30",
  "paper-figure-7-p31",
  "paper-results-p32",
  "paper-methods-p62-p67",
  "geo-rights-boundary",
  "study-missing-axes",
]);

const EXPECTED_PROFILE_CONTEXTS = Object.freeze([
  {
    markers: ["Zfhx3", "Zfhx4", "Nefl", "Shox2"],
    spatial: "lateral",
    rostrocaudal: "lumbar_enriched",
    chx10Low: "mixture_not_quantified_in_contract",
    locators: ["paper-figure-6", "paper-results-p30", "paper-figure-7-p31", "paper-results-p32", "study-missing-axes"],
  },
  {
    markers: ["Zfhx3", "Zfhx4", "Nefl", "Shox2"],
    spatial: "lateral",
    rostrocaudal: "lumbar_enriched",
    chx10Low: "mixture_not_quantified_in_contract",
    locators: ["paper-figure-6", "paper-results-p30", "paper-figure-7-p31", "paper-results-p32", "study-missing-axes"],
  },
  {
    markers: ["Nfib", "Tcf4", "NeuroD2", "Sp8"],
    spatial: "medial",
    rostrocaudal: "mixed_cervical_lumbar",
    chx10Low: "mixture_not_quantified_in_contract",
    locators: ["paper-figure-6", "paper-results-p30", "paper-figure-7-p31", "paper-results-p32", "study-missing-axes"],
  },
  {
    markers: ["Nfib", "Tcf4", "NeuroD2", "Sp8"],
    spatial: "medial",
    rostrocaudal: "mixed_cervical_lumbar",
    chx10Low: "mixture_not_quantified_in_contract",
    locators: ["paper-figure-6", "paper-results-p30", "paper-figure-7-p31", "paper-results-p32", "study-missing-axes"],
  },
  {
    markers: ["Nfib", "Tcf4", "NeuroD2", "Sp8"],
    spatial: "medial",
    rostrocaudal: "mixed_cervical_lumbar",
    chx10Low: "mixture_not_quantified_in_contract",
    locators: ["paper-figure-6", "paper-results-p30", "paper-figure-7-p31", "paper-results-p32", "study-missing-axes"],
  },
  {
    markers: ["Zfhx3", "Zfhx4", "Nefl", "Shox2"],
    spatial: "lateral",
    rostrocaudal: "mostly_cervical",
    chx10Low: "highest_fraction_group",
    locators: ["paper-figure-6", "paper-results-p30", "paper-figure-7-p31", "paper-results-p32", "study-missing-axes"],
  },
  {
    markers: ["Zfhx3", "Zfhx4", "Nefl", "Shox2"],
    spatial: "lateral",
    rostrocaudal: "not_established",
    chx10Low: "highest_fraction_group",
    locators: ["paper-figure-6", "paper-results-p30", "paper-figure-7-p31", "study-missing-axes"],
  },
  {
    markers: ["Zfhx3", "Zfhx4", "Nefl", "Shox2"],
    spatial: "lateral",
    rostrocaudal: "mostly_cervical",
    chx10Low: "highest_fraction_group",
    locators: ["paper-figure-6", "paper-results-p30", "paper-figure-7-p31", "paper-results-p32", "study-missing-axes"],
  },
  {
    markers: [],
    spatial: "not_established",
    rostrocaudal: "not_established",
    chx10Low: "mixture_not_quantified_in_contract",
    locators: ["paper-figure-6", "paper-figure-7-p31", "study-missing-axes"],
  },
  {
    markers: ["Zfhx3", "Zfhx4", "Nefl", "Shox2"],
    spatial: "lateral",
    rostrocaudal: "lumbar_enriched",
    chx10Low: "mixture_not_quantified_in_contract",
    locators: ["paper-figure-6", "paper-results-p30", "paper-figure-7-p31", "paper-results-p32", "study-missing-axes"],
  },
  {
    markers: [],
    spatial: "not_established",
    rostrocaudal: "not_established",
    chx10Low: "mixture_not_quantified_in_contract",
    locators: ["paper-figure-6", "paper-figure-7-p31", "study-missing-axes"],
  },
]);

const EXPECTED_SECTION_SHA256 = Object.freeze({
  source: "047c23b2b57bbbdf95dd55561936f3c5635743cc60e034f24b53c75579da796d",
  scope: "d1686c38c14939950d82ac3928dbe87da2c389b6425c8dce99f4b4640f4adb69",
  majorTypes: "05e0cebba893c6f2b93691b5d5b972bd021bc16bdb8312de0613223352e7f630",
  sourceLocators: "dd882870fd9aa068f7561aaaa9df79b2a1665483fb2b09083d635d1a1892f3eb",
  profiles: "41e198fadac4e1f3117daf30805fa0f23d58bb1254555af02046005243c05240",
  missingEvidence: "243f63a65c8b792f2715c95b9d67dbb55ce2d6b2df8054faf6abda69cbba9c32",
  hardBoundaries: "a06bb0568e5d61fe31895b333f91390f2a2ddaf9ce74481268d9bdbe78e22de7",
});

const FORBIDDEN_EVIDENCE_KEYS = new Set([
  "barcodeMap",
  "clusterBarcodeMap",
  "majorTypeBarcodeMap",
  "spinalRegionBarcodeMap",
  "barcodeAssignments",
  "cellBarcodeAssignments",
  "cellXyz",
  "cellCoordinatesByBarcode",
  "atlasTransform",
  "registeredCoordinate",
  "registeredCoordinates",
  "morphologyId",
  "swcPath",
  "synapticEdges",
  "synapticPartnerId",
  "adultType",
  "adultIdentityAssignment",
  "sciIdentity",
  "crossSourceIdentityMap",
  "sameCellCrossSourceId",
  "sourceFileBody",
  "matrixBody",
  "articleFigureBody",
]);

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

function createSchemaValidator(schema) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  return ajv.compile(schema);
}

function formatSchemaErrors(errors = []) {
  return (errors ?? []).map((error) => `${error.instancePath || "/"}: ${error.message ?? "schema violation"}`);
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function sha256Json(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function jsonEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function hasBoundary(boundaries, pattern) {
  return (boundaries ?? []).some((boundary) => pattern.test(boundary));
}

function collectForbiddenEvidenceKeys(value, path = "$") {
  const findings = [];
  if (Array.isArray(value)) {
    value.forEach((item, index) => findings.push(...collectForbiddenEvidenceKeys(item, `${path}[${index}]`)));
    return findings;
  }
  if (!value || typeof value !== "object") return findings;
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (FORBIDDEN_EVIDENCE_KEYS.has(key)) findings.push(childPath);
    findings.push(...collectForbiddenEvidenceKeys(child, childPath));
  }
  return findings;
}

function validateDenominators(taxonomy, errors) {
  const frame = taxonomy.source?.geo?.sampleFrame ?? {};
  const expectedFrame = {
    sourceAnimalCount: 2,
    pooledLibraryCount: 1,
    independentLibraryCount: 1,
    animalResolvedReplicateCount: 0,
    cellsProcessedApproximate: 3000,
    qcRetainedCellCount: 949,
    articleAssignedCervicalCellCount: 455,
    articleAssignedLumbarCellCount: 494,
  };
  for (const [field, expected] of Object.entries(expectedFrame)) {
    check(frame[field] === expected, `sample-frame denominator ${field} must remain ${expected}`, errors);
  }
  check(
    frame.articleAssignedCervicalCellCount + frame.articleAssignedLumbarCellCount === 949,
    "article cervical/lumbar assignments must partition the 949 retained cells",
    errors,
  );
  check(
    jsonEqual(frame.sampledSpinalRegions, ["cervical", "lumbar"]),
    "sampled spinal-region frame must remain cervical plus lumbar",
    errors,
  );
  check(
    jsonEqual(frame.prePoolingFACSCollectedCellCountByRegion, { cervical: 2800, lumbar: 2800 }),
    "pre-pooling FACS denominator must remain 2,800 cervical plus 2,800 lumbar cells",
    errors,
  );
  check(
    frame.prePoolingFACSCollectedCellCountByRegion?.cervical + frame.prePoolingFACSCollectedCellCountByRegion?.lumbar === 5600,
    "pre-pooling regional FACS counts must sum to 5,600 collected cells",
    errors,
  );
  check(frame.tenXChemistry === "Chromium Single Cell 3 prime v2", "10x chemistry must remain Chromium Single Cell 3 prime v2", errors);
  check(frame.cellRegionAssignmentAvailableInGeoMatrix === false, "the GEO matrix must not acquire barcode-level region assignments", errors);
  check(/pooled into one 10x library/i.test(frame.interpretationBoundary ?? ""), "sample frame must retain the one-pooled-library boundary", errors);
  check(/sampling units, not specimens/i.test(frame.interpretationBoundary ?? ""), "cells must remain sampling units rather than specimens", errors);

  const asset = taxonomy.source?.geo?.countMatrixAsset ?? {};
  const expectedAsset = {
    archiveBytes: 3604480,
    archiveSha256: "7bf234f91c12ff09b5d132cb84a91c7bdafd96158f93a5c7083b5062f5c8fd97",
    compressedBytes: 3597244,
    compressedSha256: "d6d55f8780c7102fd71fe66e037dac6f48638c97ce2124b331c498e3fb73f8de",
    uncompressedBytes: 24981295,
    uncompressedSha256: "a0d97a23ac28700e621ca90a6725b6bfb38f645094affa8289ed922ce33f9753",
    geneRowCount: 12986,
    cellBarcodeColumnCount: 949,
  };
  for (const [field, expected] of Object.entries(expectedAsset)) {
    check(asset[field] === expected, `count-matrix denominator/receipt ${field} must remain ${expected}`, errors);
  }
  check(jsonEqual(asset.metadataColumns, ["gene_name"]), "the count matrix must retain exactly one gene_name metadata column", errors);
  check(/genes detected in at least two cells/i.test(asset.geneInclusionRule ?? ""), "matrix gene-inclusion rule must remain detection in at least two cells", errors);

  const reanalysis = asset.matrixReanalysis ?? {};
  check(/raw UMI count is greater than zero/i.test(reanalysis.countingRule ?? ""), "matrix reanalysis must retain the raw-UMI-greater-than-zero counting rule", errors);
  check(jsonEqual(reanalysis.v2aMarkerPanel, ["Vsx2", "Sox14", "Shox2", "Lhx3", "Lhx4"]), "matrix reanalysis V2a marker panel changed", errors);
  check(reanalysis.v2aMarkerPositiveBarcodeCount === 942, "matrix reanalysis must retain 942 V2a-marker-positive barcodes", errors);
  check(reanalysis.v2aMarkerPositivePercentage === 99.262, "matrix reanalysis must retain 99.262% V2a-marker-positive barcodes", errors);
  check(reanalysis.articleReportedV2aMarkerPositivePercentage === 99.5, "article P29 V2a-marker percentage must remain 99.5%", errors);
  check(reanalysis.slc17a6PositiveBarcodeCount === 862, "matrix reanalysis must retain 862 Slc17a6-positive barcodes", errors);
  check(reanalysis.slc17a6PositivePercentage === 90.832, "matrix reanalysis must retain 90.832% Slc17a6-positive barcodes", errors);
  check(reanalysis.articleReportedSlc17a6PositivePercentage === 92.7, "article P29 Slc17a6 percentage must remain 92.7%", errors);
  check(
    reanalysis.v2aMarkerPositivePercentage === Number(((reanalysis.v2aMarkerPositiveBarcodeCount / 949) * 100).toFixed(3))
      && reanalysis.slc17a6PositivePercentage === Number(((reanalysis.slc17a6PositiveBarcodeCount / 949) * 100).toFixed(3)),
    "matrix reanalysis percentages must be deterministically calculated from the 949-barcode denominator",
    errors,
  );
  check(
    reanalysis.reproducibilityStatus === "unresolved_difference_from_article_report",
    "matrix/article marker-percentage difference must remain unresolved rather than harmonized",
    errors,
  );
  check(/without harmonization/i.test(reanalysis.interpretationBoundary ?? ""), "matrix/article discrepancy must retain its no-harmonization boundary", errors);

  const scope = taxonomy.scope ?? {};
  const expectedScope = {
    reportedClusterCount: 11,
    displayedProfileCount: 11,
    reportedQcRetainedCellCount: 949,
    figureClusterCellCountSum: 949,
    exactCrossSourceIdentityCount: 0,
    projectRegistrationCount: 0,
    projectConfirmedLocalInterneuronProfileCount: 0,
    projectMixedLocalProjectionContextProfileCount: 11,
  };
  for (const [field, expected] of Object.entries(expectedScope)) {
    check(scope[field] === expected, `scope denominator ${field} must remain ${expected}`, errors);
  }
}

function validateLocators(taxonomy, errors) {
  const locators = taxonomy.sourceLocators ?? [];
  const locatorIds = locators.map((locator) => locator.id);
  check(jsonEqual(locatorIds, EXPECTED_LOCATOR_IDS), "the 14 source locator identities or order changed", errors);
  check(new Set(locatorIds).size === 14, "source locator IDs must be unique", errors);
  check(sha256Json(locators) === EXPECTED_SECTION_SHA256.sourceLocators, "source locator text, authority, or field support drifted", errors);

  const locatorById = new Map(locators.map((locator) => [locator.id, locator]));
  for (const majorType of taxonomy.sourceReportedMajorTypes ?? []) {
    let hasMajorTypeLocator = false;
    for (const locatorId of majorType.sourceLocatorIds ?? []) {
      const locator = locatorById.get(locatorId);
      check(Boolean(locator), `${majorType.label} references unknown source locator ${locatorId}`, errors);
      const relevantSupports = ["majorType", "networkContext", "projectionContext", "sameCellBoundary"];
      check(
        relevantSupports.some((field) => locator?.supportsFields?.includes(field)),
        `${locatorId} does not support any retained major-type field`,
        errors,
      );
      if (locator?.supportsFields?.includes("majorType")) hasMajorTypeLocator = true;
    }
    check(hasMajorTypeLocator, `${majorType.label} lacks a locator that directly supports major-type evidence`, errors);
  }
  for (const profile of taxonomy.profiles ?? []) {
    for (const locatorId of profile.fieldLocatorIds ?? []) {
      check(locatorById.has(locatorId), `${profile.sourceLocalLabel} references unknown source locator ${locatorId}`, errors);
    }
    check(profile.fieldLocatorIds?.includes("paper-figure-6"), `${profile.sourceLocalLabel} must cite Figure 6 for label/count`, errors);
    check(profile.fieldLocatorIds?.includes("paper-figure-7-p31"), `${profile.sourceLocalLabel} must cite Figure 7 for mixed Type I/II membership`, errors);
    check(profile.fieldLocatorIds?.includes("study-missing-axes"), `${profile.sourceLocalLabel} must cite the missing-evidence locator`, errors);
    check(
      profile.fieldLocatorIds?.includes("paper-results-p30") === (profile.spatialDomainContext !== "not_established"),
      `${profile.sourceLocalLabel} marker/spatial locator does not match its established status`,
      errors,
    );
    check(
      profile.fieldLocatorIds?.includes("paper-results-p32") === (profile.rostrocaudalContext !== "not_established"),
      `${profile.sourceLocalLabel} rostrocaudal locator does not match its established status`,
      errors,
    );
  }
  const rightsLocator = locatorById.get("geo-rights-boundary");
  check(rightsLocator?.evidenceStatus === "rights_boundary", "GEO rights locator must remain a rights-boundary locator", errors);
  check(rightsLocator?.supportsFields?.includes("rightsBoundary"), "GEO rights locator must support the rights boundary", errors);
  const missingLocator = locatorById.get("study-missing-axes");
  check(missingLocator?.evidenceStatus === "not_measured", "study missing-axes locator must remain not measured", errors);
  const matrixReanalysisLocator = locatorById.get("matrix-reanalysis-marker-discrepancy");
  check(matrixReanalysisLocator?.evidenceStatus === "derived", "matrix reanalysis locator must remain derived evidence", errors);
  check(matrixReanalysisLocator?.supportsFields?.includes("matrixReanalysis"), "matrix reanalysis locator must support the unresolved discrepancy record", errors);
  const sampleProcessingLocator = locatorById.get("geo-sample-processing");
  check(sampleProcessingLocator?.evidenceStatus === "direct", "GEO sample-processing locator must remain direct evidence", errors);
  check(
    sampleProcessingLocator?.supportsFields?.includes("sampleFrame") && sampleProcessingLocator?.supportsFields?.includes("matrixReceipt"),
    "GEO sample-processing locator must support sample-frame and matrix-receipt facts",
    errors,
  );
}

function validateProfiles(taxonomy, errors) {
  const profiles = taxonomy.profiles ?? [];
  const profileIds = new Set();
  const profileLabels = new Set();
  check(profiles.length === 11, "taxonomy must contain exactly 11 source-local profiles", errors);
  check(
    jsonEqual(profiles.map((profile) => profile.samplingCount?.value), EXPECTED_CLUSTER_COUNTS),
    "Figure 6 cluster count vector must remain exactly 144,130,121,117,112,86,59,52,51,48,29",
    errors,
  );
  check(sum(profiles.map((profile) => profile.samplingCount?.value ?? 0)) === 949, "the 11 Figure 6 cluster counts must sum to 949", errors);

  profiles.forEach((profile, index) => {
    const clusterNumber = index + 1;
    const expected = EXPECTED_PROFILE_CONTEXTS[index];
    check(!profileIds.has(profile.id), `duplicate profile ID ${profile.id}`, errors);
    check(!profileLabels.has(profile.sourceLocalLabel), `duplicate source-local label ${profile.sourceLocalLabel}`, errors);
    profileIds.add(profile.id);
    profileLabels.add(profile.sourceLocalLabel);
    check(profile.id === `hayashi-2018:GSE108788:cluster-${clusterNumber}`, `cluster ${clusterNumber} profile ID changed`, errors);
    check(profile.sourceLocalLabel === `Cluster ${clusterNumber}`, `cluster ${clusterNumber} source-local label changed`, errors);
    check(jsonEqual(profile.markerPanel, expected.markers), `${profile.sourceLocalLabel} marker panel drifted`, errors);
    check(profile.spatialDomainContext === expected.spatial, `${profile.sourceLocalLabel} spatial-domain context drifted`, errors);
    check(profile.rostrocaudalContext === expected.rostrocaudal, `${profile.sourceLocalLabel} rostrocaudal context drifted`, errors);
    check(profile.chx10LowContext === expected.chx10Low, `${profile.sourceLocalLabel} Chx10-low context drifted`, errors);
    check(jsonEqual(profile.fieldLocatorIds, expected.locators), `${profile.sourceLocalLabel} field locators drifted`, errors);
    check(profile.majorTypeMembership === "mixed_type_i_and_type_ii", `${profile.sourceLocalLabel} must remain mixed Type I and Type II`, errors);
    check(
      profile.projectUseClass === "v2a_cluster_mixed_local_and_supraspinal_projection_context",
      `${profile.sourceLocalLabel} must remain mixed local/supraspinal projection context`,
      errors,
    );
  });
  check(profileIds.size === 11 && profileLabels.size === 11, "all 11 profile identities and labels must be unique", errors);
  check(sha256Json(profiles) === EXPECTED_SECTION_SHA256.profiles, "profile facts drifted from the exact source transcription", errors);
}

function validateMajorTypeBoundaries(taxonomy, errors) {
  const majorTypes = taxonomy.sourceReportedMajorTypes ?? [];
  check(jsonEqual(majorTypes.map((type) => type.id), ["hayashi-2018:type-i", "hayashi-2018:type-ii"]), "major types must remain Type I then Type II", errors);
  check(new Set(majorTypes.map((type) => type.id)).size === 2, "major-type IDs must be unique", errors);

  const typeI = majorTypes.find((type) => type.id === "hayashi-2018:type-i");
  const typeII = majorTypes.find((type) => type.id === "hayashi-2018:type-ii");
  check(typeI?.label === "Type I" && typeI?.chx10Context === "high_or_maintained", "Type I Chx10 boundary changed", errors);
  check(typeI?.projectUseClass === "local_interneuron_context", "Type I must remain local-interneuron context only", errors);
  check(typeII?.label === "Type II" && typeII?.chx10Context === "downregulated_or_low", "Type II Chx10 boundary changed", errors);
  check(
    typeII?.projectUseClass === "projection_neuron_context_excluded_from_local_interneuron_count",
    "Type II must remain projection-neuron context excluded from local-interneuron counts",
    errors,
  );
  check(/supraspinal|brainstem/i.test(`${typeII?.networkContext ?? ""} ${typeII?.projectionContext ?? ""}`), "Type II must retain its supraspinal/brainstem projection context", errors);
  for (const majorType of majorTypes) {
    check(majorType.authority === "source_reported_population_level", `${majorType.label} authority must remain population-level`, errors);
    check(majorType.exactBarcodeAssignmentAvailable === false, `${majorType.label} must not acquire an exact barcode assignment`, errors);
    check(majorType.sameCellProjectionTraceAvailable === false, `${majorType.label} must not acquire a same-cell projection trace`, errors);
  }
  check(sha256Json(majorTypes) === EXPECTED_SECTION_SHA256.majorTypes, "major-type facts or boundaries drifted", errors);
}

function validateMissingEvidenceAndRights(taxonomy, errors) {
  const scope = taxonomy.scope ?? {};
  const asset = taxonomy.source?.geo?.countMatrixAsset ?? {};
  const publication = taxonomy.source?.publication ?? {};
  const missing = taxonomy.globalMissingEvidence ?? {};

  check(scope.exactClusterBarcodeMappingAvailable === false, "exact cluster-barcode maps must remain unavailable", errors);
  check(scope.exactMajorTypeBarcodeMappingAvailable === false, "exact major-type barcode maps must remain unavailable", errors);
  check(asset.clusterAnnotationColumnAvailable === false, "the GEO matrix must not acquire a cluster annotation column", errors);
  check(asset.majorTypeAnnotationColumnAvailable === false, "the GEO matrix must not acquire a Type I/II annotation column", errors);
  check(asset.spinalRegionAnnotationColumnAvailable === false, "the GEO matrix must not acquire a spinal-region annotation column", errors);
  check(missing.barcodeLevelClusterAssignment === "not_available_in_public_geo_object", "barcode-level cluster assignment must remain unavailable", errors);
  check(missing.barcodeLevelMajorTypeAssignment === "not_available_in_public_geo_object", "barcode-level major-type assignment must remain unavailable", errors);
  check(missing.barcodeLevelSpinalRegionAssignment === "not_available_in_public_geo_object", "barcode-level spinal-region assignment must remain unavailable", errors);

  check(taxonomy.coordinateAuthority === "SOURCE_LOCAL_TYPE_ONLY", "coordinate authority must remain source-local type only", errors);
  check(scope.projectRegistrationCount === 0 && missing.atlasRegistration === "not_established", "atlas registration and geometry must remain unavailable", errors);
  check(missing.cellCoordinates === "not_available" && missing.singleCellMorphology === "not_measured", "cell geometry and morphology must remain unavailable", errors);
  check(missing.sameCellProjectionTracing === "not_available", "same-cell projection tracing must remain unavailable", errors);
  check(missing.synapticConnectivity === "not_available_as_edge_list", "synaptic connectivity must remain unavailable as an edge list", errors);
  check(scope.lifeStage === "P0 neonatal" && missing.adultIdentity === "not_established", "P0 profiles must not acquire adult identity", errors);
  check(scope.condition === "developmental_uninjured" && missing.sciContext === "not_measured", "developmental profiles must not acquire SCI identity", errors);
  check(scope.exactCrossSourceIdentityCount === 0 && missing.exactCrossSourceIdentity === "not_established", "exact cross-source identity must remain zero and not established", errors);
  check(missing.animalResolvedReplication === "not_available_after_pooling", "animal-resolved replication must remain unavailable after pooling", errors);
  check(sha256Json(missing) === EXPECTED_SECTION_SHA256.missingEvidence, "global missing-evidence statuses drifted", errors);

  check(publication.reuseStatus === "PUBLIC_ACCESS_REUSE_NOT_ASSUMED", "article public access must not become assumed reuse permission", errors);
  check(/No article image is bundled/i.test(publication.rightsBoundary ?? ""), "article-image non-bundling boundary is required", errors);
  check(asset.sourceFileBundled === false, "the GEO TAR and matrix gzip must not be bundled", errors);
  check(asset.derivedFactualMetadataBundled === true, "only derived factual metadata may be bundled", errors);
  check(asset.reuseStatus === "PUBLIC_ACCESS_REUSE_NOT_ASSUMED", "GEO public access must not become assumed redistribution permission", errors);
  check(/not bundled/i.test(asset.rightsBoundary ?? ""), "source-object non-bundling boundary is required", errors);

  const boundaries = taxonomy.hardBoundaries ?? [];
  check(hasBoundary(boundaries, /not eleven canonical or adult spinal interneuron types/i), "no-canonical/adult-type boundary is required", errors);
  check(hasBoundary(boundaries, /exact barcode mappings are unavailable/i), "no-barcode-map boundary is required", errors);
  check(hasBoundary(boundaries, /both putative Type I and putative Type II/i), "mixed-major-type boundary is required", errors);
  check(hasBoundary(boundaries, /Type II.*excluded from confirmed local-interneuron counts/i), "Type II local-interneuron exclusion boundary is required", errors);
  check(hasBoundary(boundaries, /2,800 cervical plus 2,800 lumbar.*approximately 3,000.*949 QC-retained.*distinct denominator stages/i), "FACS/processed/QC denominator-stage boundary is required", errors);
  check(hasBoundary(boundaries, /942 of 949.*862 of 949.*does not reproduce.*99\.5%.*92\.7%.*unresolved rather than harmonized/i), "matrix/article marker-percentage discrepancy boundary is required", errors);
  check(hasBoundary(boundaries, /P0 developmental identities cannot be promoted to adult or spinal-cord-injury identities/i), "no adult/SCI promotion boundary is required", errors);
  check(hasBoundary(boundaries, /No cell coordinates.*atlas transform.*synaptic edge list.*exact cross-source identity/i), "no geometry/synapse/cross-source-identity boundary is required", errors);
  check(hasBoundary(boundaries, /Public download access is not treated as an asset-level redistribution license/i), "public-access/non-redistribution boundary is required", errors);
  check(sha256Json(boundaries) === EXPECTED_SECTION_SHA256.hardBoundaries, "hard-boundary text or order drifted", errors);

  const forbiddenKeys = collectForbiddenEvidenceKeys(taxonomy);
  check(forbiddenKeys.length === 0, `forbidden barcode/geometry/adult/SCI/cross-source/source-body fields found: ${forbiddenKeys.join(", ")}`, errors);
}

export async function validateHayashiV2aSourceTaxonomy(value) {
  const [taxonomy, schema] = await Promise.all([
    value === undefined ? readFile(DATA_URL, "utf8").then(JSON.parse) : Promise.resolve(value),
    readFile(SCHEMA_URL, "utf8").then(JSON.parse),
  ]);
  const validateSchema = createSchemaValidator(schema);
  const errors = [];
  if (!validateSchema(taxonomy)) errors.push(...formatSchemaErrors(validateSchema.errors));

  check(taxonomy.releaseId === "ohri-hayashi-v2a-source-taxonomy-0.1.0", "release ID changed", errors);
  check(taxonomy.schemaVersion === "0.1.0", "schema version changed", errors);
  check(taxonomy.releaseDate === "2026-08-27", "release date must remain 2026-08-27 for contract 0.1", errors);
  check(taxonomy.datasetId === "GSE108788", "dataset ID must remain GSE108788", errors);
  check(taxonomy.source?.geo?.sampleAccession === "GSM2913270", "sample accession must remain GSM2913270", errors);
  check(taxonomy.source?.geo?.superSeriesAccession === "GSE108790", "SuperSeries accession must remain GSE108790", errors);
  check(taxonomy.source?.geo?.sraStudyAccession === "SRP128071", "SRA study accession must remain SRP128071", errors);
  check(taxonomy.source?.geo?.bioProjectAccession === "PRJNA428534", "BioProject accession must remain PRJNA428534", errors);

  validateDenominators(taxonomy, errors);
  validateLocators(taxonomy, errors);
  validateProfiles(taxonomy, errors);
  validateMajorTypeBoundaries(taxonomy, errors);
  validateMissingEvidenceAndRights(taxonomy, errors);

  check(sha256Json(taxonomy.source) === EXPECTED_SECTION_SHA256.source, "source provenance, denominator, or rights block drifted", errors);
  check(sha256Json(taxonomy.scope) === EXPECTED_SECTION_SHA256.scope, "scope block drifted from the strict 0.1 contract", errors);

  if (errors.length) {
    throw new Error(`Hayashi V2a source taxonomy 0.1 validation failed:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  }

  return {
    releaseId: taxonomy.releaseId,
    profileCount: taxonomy.profiles.length,
    figureClusterCellCountSum: sum(taxonomy.profiles.map((profile) => profile.samplingCount.value)),
    sourceAnimalCount: taxonomy.source.geo.sampleFrame.sourceAnimalCount,
    independentLibraryCount: taxonomy.source.geo.sampleFrame.independentLibraryCount,
    geneRowCount: taxonomy.source.geo.countMatrixAsset.geneRowCount,
    cellBarcodeColumnCount: taxonomy.source.geo.countMatrixAsset.cellBarcodeColumnCount,
    projectConfirmedLocalInterneuronProfileCount: taxonomy.scope.projectConfirmedLocalInterneuronProfileCount,
    projectRegistrationCount: taxonomy.scope.projectRegistrationCount,
    exactCrossSourceIdentityCount: taxonomy.scope.exactCrossSourceIdentityCount,
  };
}

const invokedAsMain = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href === import.meta.url
  : false;

if (invokedAsMain) {
  try {
    const report = await validateHayashiV2aSourceTaxonomy();
    console.log(
      `Hayashi V2a source taxonomy 0.1 validation passed: ${report.releaseId} `
      + `(${report.profileCount} profiles; ${report.figureClusterCellCountSum} cells; `
      + `${report.geneRowCount} genes x ${report.cellBarcodeColumnCount} barcodes; `
      + `0 confirmed local-interneuron profiles; 0 registrations; 0 exact cross-source identities)`,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
