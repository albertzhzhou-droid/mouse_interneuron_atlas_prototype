#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const DATA_URL = new URL("../data/dmrt3-di6-source-taxonomy-0.1.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/dmrt3-di6-source-taxonomy-0.1.schema.json", import.meta.url);

const EXPECTED_LABELS = Object.freeze(["M1", "M2", "M3", "M4", "M5", "M6"]);
const EXPECTED_COUNTS = Object.freeze([84, 34, 33, 45, 54, 24]);
const EXPECTED_MARKERS = Object.freeze([
  Object.freeze(["Zfhx3", "Meis2", "Zfhx4"]),
  Object.freeze(["Irx4", "Tshz3", "Ldb2"]),
  Object.freeze(["Pid1", "Sst", "Slit2"]),
  Object.freeze(["Hoxb8", "Hoxb7", "Hoxb9"]),
  Object.freeze(["Sall3", "Npy", "Nxph1"]),
  Object.freeze(["Neurod6", "Neurod2", "Zeb2"]),
]);
const EXPECTED_TEMPORAL_CONTEXT = Object.freeze([
  Object.freeze({ phase: "early", anchors: Object.freeze(["Onecut2"]) }),
  Object.freeze({ phase: "middle", anchors: Object.freeze(["Zfhx3", "Zfhx4"]) }),
  Object.freeze({ phase: "middle", anchors: Object.freeze(["Zfhx3", "Zfhx4"]) }),
  Object.freeze({ phase: "late", anchors: Object.freeze(["Neurod6"]) }),
  Object.freeze({ phase: "late", anchors: Object.freeze(["Neurod6"]) }),
  Object.freeze({ phase: "late", anchors: Object.freeze(["Neurod6"]) }),
]);
const EXPECTED_STAGE_COUNTS = Object.freeze([
  Object.freeze({ stage: "deposited_mouse_wells", count: 384, unit: "wells" }),
  Object.freeze({ stage: "executed_notebook_QC_retained", count: 354, unit: "cells" }),
  Object.freeze({ stage: "retained_dI6_lineage_subset", count: 274, unit: "cells" }),
  Object.freeze({ stage: "M1_to_M6_partition", count: 274, unit: "cells" }),
]);
const EXPECTED_LOCATOR_IDS = Object.freeze([
  "primary-article-sample-context",
  "primary-article-temporal-context",
  "geo-series",
  "pinned-commit",
  "notebook-cell-14-exec-13",
  "notebook-cell-26-exec-24",
  "notebook-cell-28-exec-26",
  "notebook-cell-74-exec-65",
  "notebook-cell-76-exec-66",
  "notebook-cell-80-exec-195",
  "notebook-cell-83-exec-71",
  "notebook-cell-84-exec-72",
  "methods-qc-description",
  "study-missing-axes",
]);

const EXACT_RECEIPTS = Object.freeze({
  gzip: Object.freeze({
    compressedBytes: 47641669,
    compressedMd5: "1b2a877ffd70afbc75efc21ed2de8303",
    compressedSha256: "f31abb7678ed88af3e140ca488dfdce867809569784bc1881777462fdc87b23c",
    uncompressedBytes: 56090164,
    uncompressedMd5: "8f5fa6d548f8f776e02a7777678e34f9",
    uncompressedSha256: "ccf345c05ceb27f9075a5add155cf70c162a0f8a70a9b6860bfb7b45bc03997f",
  }),
  repository: Object.freeze({
    pinnedCommit: "4096425edc4a8c008f6069e08ef4583120e550ae",
    commitTree: "5dc914d53212e68104de30a84735c8ad21b5c4e7",
    loomGitBlobSha1: "05263c67a113ad14ba178f1385d4e548ab9fce0e",
    notebookBytes: 21627568,
    notebookMd5: "b57f43d03fc4f4a2db4f21ea78aabb26",
    notebookSha256: "c51fa89ea3ce7f55a361ffe8b94f48b73bd9669c4260aeb3ee482208f23a9008",
    notebookGitBlobSha1: "bf219e6dc49c18e67acd96573e01e8cce5cc3ff8",
    licenseBytes: 1070,
    licenseSha256: "2d3fdfcc73a76dd7f7a4b2c759703ab6ca3ff1b7b057a207abce373769989e49",
    licenseGitBlobSha1: "bf3b72c16957c8cb5fd9c47e1adbc4d99d2ad89b",
  }),
});

const FORBIDDEN_KEYS = new Set([
  "wellMGroupRoster",
  "perWellAssignments",
  "wellToClusterMap",
  "pseudotimeByWell",
  "pseudotimeScalarByCell",
  "morphologyId",
  "swcPath",
  "cellXyz",
  "atlasTransform",
  "registeredCoordinates",
  "synapticEdges",
  "internalMesh",
  "internalObjects",
  "adultCanonicalType",
  "crossSourceIdentityMap",
  "sourceFileBody",
  "loomBody",
  "notebookBody",
]);

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

function jsonEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function formatSchemaErrors(errors = []) {
  return errors.map((error) => `${error.instancePath || "/"}: ${error.message ?? "schema violation"}`);
}

function collectForbiddenKeys(value, path = "$") {
  const findings = [];
  if (Array.isArray(value)) {
    value.forEach((item, index) => findings.push(...collectForbiddenKeys(item, `${path}[${index}]`)));
    return findings;
  }
  if (!value || typeof value !== "object") return findings;
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (FORBIDDEN_KEYS.has(key)) findings.push(childPath);
    findings.push(...collectForbiddenKeys(child, childPath));
  }
  return findings;
}

async function schemaValidator() {
  const schema = JSON.parse(await readFile(SCHEMA_URL, "utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  return ajv.compile(schema);
}

function validateReceipts(taxonomy, errors) {
  const processed = taxonomy.source?.geo?.processedObject ?? {};
  for (const [field, expected] of Object.entries(EXACT_RECEIPTS.gzip)) {
    check(processed[field] === expected, `processed loom receipt ${field} must remain ${expected}`, errors);
  }
  check(processed.mGroupAssignmentsPresent === false, "the source loom must not acquire M1–M6 assignments", errors);
  check(processed.pseudotimeScalarPresent === false, "the source loom must not acquire a pseudotime scalar", errors);
  check(processed.sourceFileBundled === false && processed.accessMode === "link_only", "the GEO source object must remain link-only and non-bundled", errors);

  const repository = taxonomy.source?.repository ?? {};
  check(repository.pinnedCommit === EXACT_RECEIPTS.repository.pinnedCommit, "pinned repository commit changed", errors);
  check(repository.commitTree === EXACT_RECEIPTS.repository.commitTree, "pinned repository tree changed", errors);
  check(repository.sourceFilesBundled === false, "repository source files must remain non-bundled", errors);
  check(repository.derivedFactualContractBundled === true, "the compact factual derivative must remain the only bundled object", errors);
  check(repository.license?.bytes === EXACT_RECEIPTS.repository.licenseBytes, "repository LICENSE byte count changed", errors);
  check(repository.license?.sha256 === EXACT_RECEIPTS.repository.licenseSha256, "repository LICENSE SHA-256 changed", errors);
  check(repository.license?.gitBlobSha1 === EXACT_RECEIPTS.repository.licenseGitBlobSha1, "repository LICENSE Git blob changed", errors);

  const sourceFiles = repository.sourceFiles ?? [];
  check(sourceFiles.length === 2, "repository source-file receipt list must contain exactly loom and notebook", errors);
  const loom = sourceFiles.find((file) => file.id === "authors-loom") ?? {};
  check(loom.path === "Analysis_pipeline/data/mmusculus.loom", "authors' loom path changed", errors);
  check(loom.bytes === EXACT_RECEIPTS.gzip.uncompressedBytes, "authors' loom byte count changed", errors);
  check(loom.md5 === EXACT_RECEIPTS.gzip.uncompressedMd5, "authors' loom MD5 changed", errors);
  check(loom.sha256 === EXACT_RECEIPTS.gzip.uncompressedSha256, "authors' loom SHA-256 changed", errors);
  check(loom.gitBlobSha1 === EXACT_RECEIPTS.repository.loomGitBlobSha1, "authors' loom Git blob changed", errors);
  const notebook = sourceFiles.find((file) => file.id === "executed-notebook") ?? {};
  check(notebook.path === "Analysis_pipeline/210909_Final_run.ipynb", "executed notebook path changed", errors);
  check(notebook.bytes === EXACT_RECEIPTS.repository.notebookBytes, "executed notebook byte count changed", errors);
  check(notebook.md5 === EXACT_RECEIPTS.repository.notebookMd5, "executed notebook MD5 changed", errors);
  check(notebook.sha256 === EXACT_RECEIPTS.repository.notebookSha256, "executed notebook SHA-256 changed", errors);
  check(notebook.gitBlobSha1 === EXACT_RECEIPTS.repository.notebookGitBlobSha1, "executed notebook Git blob changed", errors);
  check(sourceFiles.every((file) => file.bundled === false && file.accessMode === "link_only"), "loom and notebook must both remain link-only and non-bundled", errors);
}

function validateLineage(taxonomy, errors) {
  const scope = taxonomy.scope ?? {};
  check(scope.sourceEmbryoCount === 3, "source embryo denominator must remain 3", errors);
  check(scope.poolCount === 1 && scope.independentLibraryCount === 1, "three embryos must remain one pool and one library", errors);
  check(scope.animalResolvedReplicateCount === 0, "animal-resolved replicate count must remain zero", errors);
  check(scope.depositedMouseWellCount === 384, "deposited mouse-well denominator must remain 384", errors);
  check(scope.qcRetainedCellCount === 354, "QC-retained cell denominator must remain 354", errors);
  check(scope.di6LineageRetainedCellCount === 274, "retained dI6-lineage denominator must remain 274", errors);
  check(scope.displayedProfileCount === 6, "displayed profile count must remain 6", errors);
  check(scope.perWellMGroupRosterBundled === false, "a per-well M-group roster must not be bundled", errors);
  check(scope.projectRegistrationCount === 0 && scope.admittedGeometryCount === 0 && scope.admittedInternalStructureCount === 0, "registration, geometry and internal-structure counts must remain zero", errors);
  check(scope.exactCrossSourceIdentityCount === 0, "exact cross-source identity count must remain zero", errors);

  const observedStages = (taxonomy.analysisLineage?.stageCounts ?? []).map(({ stage, count, unit }) => ({ stage, count, unit }));
  check(jsonEqual(observedStages, EXPECTED_STAGE_COUNTS), "analysis lineage must remain exactly 384 wells → 354 QC cells → 274 dI6 cells → 274 grouped cells", errors);
  const authority = taxonomy.analysisLineage?.transformationAuthority ?? {};
  check(authority.repositoryCommit === EXACT_RECEIPTS.repository.pinnedCommit, "analysis-lineage commit changed", errors);
  check(authority.notebookGitBlobSha1 === EXACT_RECEIPTS.repository.notebookGitBlobSha1, "analysis-lineage notebook blob changed", errors);
  check(authority.executedNotebookIsDerivationAuthority === true, "executed notebook must remain the derivation authority", errors);
  check(authority.sourceLoomContainsM1ToM6Assignments === false, "loom must remain free of M1–M6 assignments", errors);
  check(authority.sourceLoomContainsPseudotimeScalar === false, "loom must remain free of pseudotime scalars", errors);
  check(authority.perWellM1ToM6RosterExported === false, "per-well M1–M6 roster must remain not exported", errors);
  check(authority.compactDerivativeContainsGroupSummariesOnly === true, "compact derivative must remain group-summary only", errors);
}

function validateProfiles(taxonomy, errors) {
  const profiles = taxonomy.profiles ?? [];
  check(profiles.length === 6, "exactly six study-local profiles are required", errors);
  check(jsonEqual(profiles.map((profile) => profile.sourceLocalLabel), EXPECTED_LABELS), "source-local profile labels must remain M1 through M6 in order", errors);
  check(jsonEqual(profiles.map((profile) => profile.samplingCount), EXPECTED_COUNTS), "M1–M6 count vector must remain exactly 84,34,33,45,54,24", errors);
  check(profiles.reduce((sum, profile) => sum + profile.samplingCount, 0) === 274, "M1–M6 sampling counts must sum to 274", errors);
  check(jsonEqual(profiles.map((profile) => profile.markerPanel), EXPECTED_MARKERS), "M1–M6 marker panels drifted from the pinned notebook summary", errors);
  profiles.forEach((profile, index) => {
    const temporal = EXPECTED_TEMPORAL_CONTEXT[index];
    check(profile.articleTemporalPhase === temporal.phase, `${EXPECTED_LABELS[index]} article temporal phase must remain ${temporal.phase}`, errors);
    check(jsonEqual(profile.articleTemporalAnchorGenes, temporal.anchors), `${EXPECTED_LABELS[index]} temporal anchor genes drifted`, errors);
    check(profile.recordKind === "source_local_embryonic_transcriptomic_group", `${EXPECTED_LABELS[index]} must remain a study-local embryonic group`, errors);
    check(profile.putativeAssignmentStatus === "study_local_group_not_adult_canonical_type", `${EXPECTED_LABELS[index]} must not become an adult canonical type`, errors);
    check(profile.populationTransmitterContext === "inhibitory_dual_GABAergic_glycinergic_context_not_per_cell_or_group_quantification", `${EXPECTED_LABELS[index]} transmitter context must remain population-level and non-quantified`, errors);
  });
}

function validateQcConflict(taxonomy, errors) {
  const methods = taxonomy.qualityControl?.methodsDescription ?? {};
  const executed = taxonomy.qualityControl?.executedNotebook ?? {};
  check(jsonEqual(
    {
      minimumLog1pTotalCountsExclusive: methods.minimumLog1pTotalCountsExclusive,
      maximumPercentCountsInTop50GenesExclusive: methods.maximumPercentCountsInTop50GenesExclusive,
      minimumDetectedGenesExclusive: methods.minimumDetectedGenesExclusive,
      normalization: methods.normalization,
      highlyVariableGeneCount: methods.highlyVariableGeneCount,
    },
    {
      minimumLog1pTotalCountsExclusive: 10,
      maximumPercentCountsInTop50GenesExclusive: 40,
      minimumDetectedGenesExclusive: 3000,
      normalization: "normalize_total",
      highlyVariableGeneCount: 2000,
    },
  ), "article Methods QC/HVG description drifted", errors);
  check(jsonEqual(
    {
      minimumLog1pTotalCountsExclusive: executed.minimumLog1pTotalCountsExclusive,
      maximumPercentCountsInTop50GenesExclusive: executed.maximumPercentCountsInTop50GenesExclusive,
      minimumDetectedGenesExclusive: executed.minimumDetectedGenesExclusive,
      normalization: executed.normalization,
      highlyVariableGeneCount: executed.highlyVariableGeneCount,
      authorityStatus: executed.authorityStatus,
    },
    {
      minimumLog1pTotalCountsExclusive: 12.3,
      maximumPercentCountsInTop50GenesExclusive: 35,
      minimumDetectedGenesExclusive: 3700,
      normalization: "normalize_total_skipped_because_input_treated_as_RPKM",
      highlyVariableGeneCount: 5000,
      authorityStatus: "derivation_authority",
    },
  ), "executed-notebook QC/HVG derivation settings drifted", errors);
  check(taxonomy.qualityControl?.reconciliationStatus === "methods_vs_executed_notebook_conflict_quarantined", "Methods-versus-notebook discrepancy must remain quarantined", errors);
  const conflicts = taxonomy.quarantinedConflicts ?? [];
  check(conflicts.length === 1, "exactly one QC/HVG conflict must remain quarantined", errors);
  check(conflicts[0]?.id === "methods-vs-executed-notebook-qc-hvg" && conflicts[0]?.status === "quarantined", "QC/HVG conflict identity or status changed", errors);
  check(conflicts[0]?.resolution === "executed_notebook_is_derivation_authority_methods_discrepancy_remains_visible", "QC/HVG conflict must retain executed-notebook authority without harmonization", errors);
}

function validateLocatorsAndMissingness(taxonomy, errors) {
  const locatorIds = (taxonomy.sourceLocators ?? []).map((locator) => locator.id);
  check(jsonEqual(locatorIds, EXPECTED_LOCATOR_IDS), "source locator identities or order drifted", errors);
  check(new Set(locatorIds).size === locatorIds.length, "source locator IDs must be unique", errors);
  const validIds = new Set(locatorIds);
  const referencedIds = [
    ...(taxonomy.analysisLineage?.stageCounts ?? []).flatMap((stage) => stage.locatorIds ?? []),
    ...(taxonomy.qualityControl?.methodsDescription?.locatorIds ?? []),
    ...(taxonomy.qualityControl?.executedNotebook?.locatorIds ?? []),
    ...(taxonomy.profiles ?? []).flatMap((profile) => profile.locatorIds ?? []),
  ];
  check(referencedIds.every((id) => validIds.has(id)), "one or more evidence fields reference an unknown source locator", errors);
  const missing = taxonomy.globalMissingEvidence ?? {};
  check(missing.perWellM1ToM6Roster === "not_exported_by_source", "per-well M1–M6 roster missingness must remain explicit", errors);
  check(missing.pseudotimeScalar === "not_exported_by_source", "pseudotime-scalar missingness must remain explicit", errors);
  check(missing.morphology === "not_measured_or_deposited", "morphology must remain missing", errors);
  check(missing.cellCoordinates === "not_measured_or_deposited", "cell coordinates must remain missing", errors);
  check(missing.atlasRegistration === "no_admitted_transform", "atlas registration must remain missing", errors);
  check(missing.internalStructure === "no_raw_volume_segmentation_mesh_or_internal_object", "internal structure must remain missing", errors);
  check(missing.adultIdentity === "not_established", "adult identity must remain not established", errors);
  check(missing.crossSourceSameCellIdentity === "not_established", "cross-source same-cell identity must remain not established", errors);
  const join = taxonomy.joinPolicy ?? {};
  check(join.perWellM1ToM6RosterAvailable === false && join.perWellM1ToM6RosterReconstructionAllowed === false, "per-well group roster must remain unavailable and reconstruction-forbidden", errors);
  check(join.crossSourceJoinAllowed === false, "cross-source join must remain forbidden", errors);
  check(join.morphologyTranscriptomicsJoinCount === 0 && join.physiologyTranscriptomicsJoinCount === 0 && join.internalStructureTranscriptomicsJoinCount === 0, "cross-modal join counts must remain zero", errors);
  check(join.exactCrossSourceIdentityCount === 0, "exact cross-source identity count must remain zero", errors);
  const forbiddenKeys = collectForbiddenKeys(taxonomy);
  check(forbiddenKeys.length === 0, `forbidden per-well, geometry, internal-object or source-body keys found: ${forbiddenKeys.join(", ")}`, errors);
}

export async function validateDmrt3Di6SourceTaxonomy(taxonomy) {
  const errors = [];
  const validateSchema = await schemaValidator();
  check(validateSchema(taxonomy), formatSchemaErrors(validateSchema.errors ?? []).join("; "), errors);
  validateReceipts(taxonomy, errors);
  validateLineage(taxonomy, errors);
  validateProfiles(taxonomy, errors);
  validateQcConflict(taxonomy, errors);
  validateLocatorsAndMissingness(taxonomy, errors);
  if (errors.length > 0) throw new Error(`Dmrt3/dI6 source taxonomy validation failed:\n- ${errors.join("\n- ")}`);
  return {
    releaseId: taxonomy.releaseId,
    profileCount: taxonomy.profiles.length,
    depositedMouseWellCount: taxonomy.scope.depositedMouseWellCount,
    qcRetainedCellCount: taxonomy.scope.qcRetainedCellCount,
    di6LineageRetainedCellCount: taxonomy.scope.di6LineageRetainedCellCount,
    sourceEmbryoCount: taxonomy.scope.sourceEmbryoCount,
    independentLibraryCount: taxonomy.scope.independentLibraryCount,
    perWellMGroupRosterCount: 0,
    projectRegistrationCount: taxonomy.scope.projectRegistrationCount,
    admittedGeometryCount: taxonomy.scope.admittedGeometryCount,
    admittedInternalStructureCount: taxonomy.scope.admittedInternalStructureCount,
    exactCrossSourceIdentityCount: taxonomy.scope.exactCrossSourceIdentityCount,
  };
}

export async function validatePersistedDmrt3Di6SourceTaxonomy() {
  const bytes = await readFile(DATA_URL);
  const taxonomy = JSON.parse(bytes.toString("utf8"));
  const report = await validateDmrt3Di6SourceTaxonomy(taxonomy);
  const stable = `${JSON.stringify(taxonomy, null, 2)}\n`;
  if (bytes.toString("utf8") !== stable) throw new Error("persisted Dmrt3/dI6 taxonomy is not deterministic two-space JSON");
  return { taxonomy, report, bytes: bytes.byteLength, sha256: createHash("sha256").update(bytes).digest("hex") };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { report, bytes, sha256 } = await validatePersistedDmrt3Di6SourceTaxonomy();
  process.stdout.write(`Dmrt3/dI6 taxonomy valid: ${report.profileCount} profiles; 384 → 354 → 274 cells; ${bytes} bytes; SHA-256 ${sha256}; zero geometry/internal objects/cross-source identities\n`);
}
