#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { parseRoomeDilWorkbooks, ROOME_TABLE_RECEIPTS } from "./parse_roome_dil_workbooks.mjs";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_TAXONOMY_PATH = resolve(PROJECT_ROOT, "data/roome-dil-source-taxonomy-0.1.json");
const DEFAULT_FEATURES_PATH = resolve(PROJECT_ROOT, "data/roome-dil-differential-features-0.1.json");

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function tableReceipt(receipt, role) {
  return {
    ...receipt,
    role,
    sourceFileBundled: false,
    accessMode: "link_only",
    rightsStatus: "licensed",
    license: "CC BY",
    licenseSource: "PMC12879194.1 OA package metadata",
  };
}

function buildFullFeatureEvidence(parsed) {
  return {
    schemaVersion: "0.1.0",
    releaseId: "ohri-roome-dil-differential-features-0.1.0",
    releaseDate: "2026-09-02",
    title: "Roome 2026 source-row differential-feature evidence for refined embryonic dorsal-horn dIL labels",
    sourceTable: tableReceipt(ROOME_TABLE_RECEIPTS.s7, "All deposited differential rows for 159 source-local labels"),
    sourceRowCount: 15900,
    sourceClusterCount: 159,
    exactRefinedTypeCount: 157,
    excludedDevelopmentalLabels: parsed.excludedDevelopmentalLabels,
    retainedTextGeneRowCount: parsed.differentialFeatures.filter((row) => row.gene !== null).length,
    quarantinedGeneCellCount: parsed.quarantinedGeneCells.length,
    rows: parsed.differentialFeatures,
    quarantinedGeneCells: parsed.quarantinedGeneCells,
    hardBoundaries: [
      "Each row remains a source-local differential-feature result; it is not a canonical, defining or universal marker claim.",
      "The source FindAllMarkers output includes positive and negative log2 fold changes; downstream display selection must state and apply its direction and thresholds.",
      "A null gene field marks an Excel-coerced deposited cell retained in quarantine; the apparent date must not be auto-repaired into a gene symbol.",
      "dILA-Immature and dILB-Immature are retained as non-roster developmental labels and are not promoted into the exact 157-type Table S6 roster.",
    ],
  };
}

function buildTaxonomy(parsed, fullFeatureEvidence) {
  const featureBytes = Buffer.from(stableJson(fullFeatureEvidence), "utf8");
  const profileMissingEvidence = {
    morphology: "not_measured_by_study",
    wholeCellGeometry: "not_measured_by_study",
    axonDendriteTopology: "not_measured_by_study",
    electrophysiology: "not_measured_by_study",
    projectionTarget: "not_measured_by_study",
    synapticConnectivity: "not_measured_by_study",
    internalStructure: "not_measured_by_study",
    atlasRegistration: "no_admitted_transform",
    sameCellScrnaXeniumJoin: "relationship_not_established",
    crossSourceSameCellIdentity: "relationship_not_established",
    sciContext: "not_measured_by_study",
  };
  return {
    schemaVersion: "0.1.0",
    releaseId: "ohri-roome-dil-source-taxonomy-0.1.0",
    releaseDate: "2026-09-02",
    title: "Exact source-local Roome 2026 embryonic mouse dorsal-horn dIL refined-type taxonomy",
    source: {
      publication: {
        citation: "Roome et al. Ontogeny of the spinal cord dorsal horn. Science (2026).",
        doi: "10.1126/science.adx5781",
        pmcid: "PMC12879194",
        pmid: "41505538",
        articleUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12879194/",
        studyContext: "Embryonic mouse spinal-cord single-cell RNA sequencing and E16.5 Xenium spatial profiling across dorsal-horn developmental populations.",
      },
      geo: {
        superSeries: "GSE291462",
        scrnaSeries: "GSE291459",
        xeniumSeries: "GSE291460",
        seriesUrl: "https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE291462",
        rightsStatus: "public_repository_no_explicit_submitter_license",
        license: "NOASSERTION",
        packagePolicy: "Source objects remain link-only; compact factual derivatives are bundled with attribution.",
      },
      code: {
        repositoryUrl: "https://github.com/ArielLevineLabNINDS/Dorsal_Horn",
        pinnedCommit: "138d321e2c3490189efcf7a10cf9b248b506bee4",
        rightsStatus: "public_unlicensed",
        license: "NOASSERTION",
        packagePolicy: "Pinned citation and link only; repository code is not copied into the distributable package.",
      },
      tables: [
        tableReceipt(ROOME_TABLE_RECEIPTS.s6, "Exact 157-label roster, captured-cell counts, composition and cluster QC"),
        tableReceipt(ROOME_TABLE_RECEIPTS.s7, "One hundred deposited differential-feature rows per 159 source-local labels"),
      ],
    },
    scope: {
      species: "Mus musculus",
      taxonId: "NCBITaxon:10090",
      lifeStages: ["embryonic day 14.5", "embryonic day 16.5"],
      sampledRegions: ["cervical spinal cord", "thoracic spinal cord", "lumbosacral spinal cord"],
      biologicalLitterPoolCount: 15,
      embryosPerPoolMinimum: 3,
      embryosPerPoolMaximum: 10,
      attemptedChromiumReactionCount: 30,
      excludedChromiumReactionCount: 1,
      retainedTechnicalOutputCount: 29,
      preFilterCellCount: 337422,
      postFilterCellCount: 195146,
      neuronCount: 94048,
      refinedDilCellCount: 61444,
      familyCount: 12,
      refinedTypeCount: 157,
      displayedProfileCount: 157,
      nonRosterDevelopmentalLabelCount: 2,
      admittedGeometryCount: 0,
      admittedInternalStructureCount: 0,
      sameCellCrossModalJoinCount: 0,
      projectRegistrationCount: 0,
    },
    denominatorBoundary: "The 29 retained GEO technical outputs derive from 15 biological litter pools and must not be reported as 29 biological replicates. Type frequency is a captured-cell count within the 61,444 refined dIL cells, not population prevalence.",
    signatureMethod: {
      label: "positive differential features meeting display thresholds",
      sourceRowsPerLabel: 100,
      sourceClusterCount: 159,
      exactRosterClusterCount: 157,
      adjustedPValueMaximum: 0.05,
      avgLog2FcDirection: "greater_than_zero",
      pct1Minimum: 0.25,
      prevalenceDeltaMinimum: 0.1,
      excludeQuarantinedGeneCells: true,
      deterministicSort: ["pct.1_minus_pct.2_desc", "avg_log2FC_desc", "gene_asc"],
      displayedFeatureCountPerProfile: 6,
      interpretationBoundary: "Displayed genes are a deterministic view over deposited differential rows. They are not canonical, defining, exclusive or universal markers.",
    },
    derivation: {
      fullFeatureEvidenceReleaseId: fullFeatureEvidence.releaseId,
      fullFeatureEvidencePath: "data/roome-dil-differential-features-0.1.json",
      fullFeatureEvidenceBytes: featureBytes.byteLength,
      fullFeatureEvidenceSha256: sha256(featureBytes),
      sourceRowCount: 15900,
      retainedTextGeneRowCount: fullFeatureEvidence.retainedTextGeneRowCount,
      quarantinedGeneCellCount: 26,
      compactDisplayFeatureCount: parsed.profiles.length * 6,
      sourceObjectsBundled: false,
      derivedFactualContractsBundled: true,
    },
    familySummaries: parsed.familyCounts,
    excludedDevelopmentalLabels: parsed.excludedDevelopmentalLabels.map((label) => ({
      label,
      status: "developmental_state_outside_exact_s6_roster",
      sourceRowCount: 100,
      displayBoundary: "Retained in the full differential-feature evidence but not counted among the 157 Table S6 refined types.",
    })),
    profiles: parsed.profiles.map((profile) => ({
      ...profile,
      displayFeatureLabel: "positive differential features meeting display thresholds",
      sourceLocators: [
        `Table S6 · Sheet1!${profile.sourceRange}`,
        ...profile.displayFeatures.map((feature) => `Table S7 · neuron_refined_markers!${feature.sourceRange}`),
      ],
      missingEvidence: profileMissingEvidence,
    })),
    anomalies: {
      excelCoercedGeneCellCount: parsed.quarantinedGeneCells.length,
      excelCoercedGeneCells: parsed.quarantinedGeneCells,
      interpretationBoundary: "Apparent date tokens are retained exactly as spreadsheet displays and are not reconstructed into gene names without independent source-object reconciliation.",
    },
    globalMissingEvidence: profileMissingEvidence,
    joinPolicy: {
      scrnaToXeniumSameCellJoin: "forbidden_no_same_cell_relationship",
      crossSourceTypeIdentity: "not_established",
      typeToMorphologyJoin: "not_established",
      typeToInternalStructureJoin: "not_established",
      xeniumCoordinateAuthority: "source_local_2d_predicted_label_only",
      projectAtlasTransform: null,
    },
    hardBoundaries: [
      "All 157 labels, counts, composition values and QC metrics remain source-local to Roome 2026 Table S6.",
      "Frequency and percent composition describe captured refined dIL cells in this study; they are not biological prevalence or independent-animal estimates.",
      "Positive differential features meeting display thresholds are selected from Table S7 for navigation; they are not canonical or defining marker claims.",
      "scRNA-seq cells and Xenium cells are different cells; RCTD label transfer is not a same-cell join or direct molecular identity measurement.",
      "The admitted taxonomy supplies zero dendrites, axons, synapses, electrophysiology, organelles, whole-cell geometry or internal structures.",
      "No type-specific 3D form, pseudo-depth, atlas placement, cross-source identity or internal primitive may be inferred from a refined label, family, count, QC metric or differential feature.",
      "The source spreadsheets remain link-only in this release even though PMC package metadata marks the manuscript supplements CC BY; the bundled objects are derived factual contracts.",
    ],
  };
}

export async function deriveRoomeDilContracts({ s6Path, s7Path }) {
  check(s6Path && s7Path, "derivation requires --s6 and --s7 source paths");
  const [s6Bytes, s7Bytes] = await Promise.all([readFile(resolve(s6Path)), readFile(resolve(s7Path))]);
  const parsed = parseRoomeDilWorkbooks(s6Bytes, s7Bytes);
  const differentialFeatures = buildFullFeatureEvidence(parsed);
  const taxonomy = buildTaxonomy(parsed, differentialFeatures);
  return { taxonomy, differentialFeatures };
}

export async function readCanonicalRoomeDilContracts() {
  const [taxonomyText, differentialText] = await Promise.all([
    readFile(DEFAULT_TAXONOMY_PATH, "utf8"),
    readFile(DEFAULT_FEATURES_PATH, "utf8"),
  ]);
  return {
    taxonomy: JSON.parse(taxonomyText),
    differentialFeatures: JSON.parse(differentialText),
    taxonomyText,
    differentialText,
  };
}

export async function writeRoomeDilContracts({ s6Path, s7Path, taxonomyPath = DEFAULT_TAXONOMY_PATH, featuresPath = DEFAULT_FEATURES_PATH }) {
  const contracts = await deriveRoomeDilContracts({ s6Path, s7Path });
  const taxonomyText = stableJson(contracts.taxonomy);
  const differentialText = stableJson(contracts.differentialFeatures);
  const resolvedTaxonomyPath = resolve(taxonomyPath);
  const resolvedFeaturesPath = resolve(featuresPath);
  await Promise.all([mkdir(dirname(resolvedTaxonomyPath), { recursive: true }), mkdir(dirname(resolvedFeaturesPath), { recursive: true })]);
  await Promise.all([writeFile(resolvedTaxonomyPath, taxonomyText, "utf8"), writeFile(resolvedFeaturesPath, differentialText, "utf8")]);
  return {
    ...contracts,
    taxonomyPath: resolvedTaxonomyPath,
    featuresPath: resolvedFeaturesPath,
    taxonomyBytes: Buffer.byteLength(taxonomyText),
    taxonomySha256: sha256(Buffer.from(taxonomyText, "utf8")),
    featureBytes: Buffer.byteLength(differentialText),
    featureSha256: sha256(Buffer.from(differentialText, "utf8")),
  };
}

function argumentValue(argv, option) {
  const exactIndex = argv.indexOf(option);
  if (exactIndex >= 0) return argv[exactIndex + 1];
  const assigned = argv.find((item) => item.startsWith(`${option}=`));
  return assigned ? assigned.slice(option.length + 1) : null;
}

const invokedAsMain = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href === import.meta.url : false;
if (invokedAsMain) {
  try {
    if (process.argv.includes("--help") || process.argv.includes("-h")) {
      console.log("Usage: node tools/build_roome_dil_source_taxonomy.mjs --s6 PATH --s7 PATH [--taxonomy-output PATH] [--features-output PATH]");
    } else {
      const result = await writeRoomeDilContracts({
        s6Path: argumentValue(process.argv, "--s6"),
        s7Path: argumentValue(process.argv, "--s7"),
        taxonomyPath: argumentValue(process.argv, "--taxonomy-output") ?? DEFAULT_TAXONOMY_PATH,
        featuresPath: argumentValue(process.argv, "--features-output") ?? DEFAULT_FEATURES_PATH,
      });
      console.log(`Built ${result.taxonomyPath} (${result.taxonomyBytes} bytes; SHA-256 ${result.taxonomySha256})`);
      console.log(`Built ${result.featuresPath} (${result.featureBytes} bytes; SHA-256 ${result.featureSha256})`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
