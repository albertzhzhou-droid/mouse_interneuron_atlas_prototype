#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmod,
  cp,
  lstat,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  utimes,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { validateAtlasInternalCompartments } from "./validate-atlas-internal-compartments.mjs";

export const DISTRIBUTION_VERSION = "2.8.0-curator.1";
export const PACKAGE_BASENAME = "OHRI-Mouse-Interneuron-Atlas-" + DISTRIBUTION_VERSION;
export const PACKAGE_TIMESTAMP = "2026-08-26T00:00:00.000Z";
export const CJK_CHARACTER = /[\u1100-\u11ff\u2e80-\u2eff\u3000-\u303f\u3040-\u30ff\u3100-\u312f\u3130-\u318f\u31a0-\u31bf\u31f0-\u31ff\u3400-\u4dbf\u4e00-\u9fff\ua960-\ua97f\uac00-\ud7af\uf900-\ufaff\ufe30-\ufe4f\uff66-\uff9f\u{20000}-\u{2fa1f}]/u;
const EXPECTED_COVERAGE_LOCATOR_CORRECTIONS = Object.freeze([
  { laneId: "russ-2021", axisId: "type_taxonomy", sourceLocator: "Results — Overview of harmonized neuronal cell types; Fig. 2; Supplementary Figs. 4–5; Supplementary Table 2" },
  { laneId: "russ-2021", axisId: "region_lamina_context", sourceLocator: "Results — Overview and detailed cluster validation; Fig. 2e; Fig. 4d–f; Table 1; Supplementary Fig. 9" },
  { laneId: "russ-2021", axisId: "life_stage", sourceLocator: "Results — merged postnatal datasets, Fig. 1a; adult L4 validation, Fig. 4d–f and Supplementary Fig. 9" },
  { laneId: "russ-2021", axisId: "spatial_measurement", sourceLocator: "Abstract and Results — adult in situ mapping; Fig. 2e; Fig. 4d–f; Table 1; Supplementary Fig. 9" },
  { laneId: "sathyamurthy-2018", axisId: "type_taxonomy", sourceLocator: "Results — Census of Adult Spinal Cord Neuronal Populations; Figs. 2 and 4; Table S2" },
  { laneId: "sathyamurthy-2018", axisId: "causal_mechanism", sourceLocator: "Results — snRNA-seq Following Behavior Identified Active Neurons; Fig. 5; Fig. S4" },
  { laneId: "tabulae-paralytica-2024", axisId: "causal_mechanism", sourceLocator: "Extended Data Fig. 3j–l — AAV-DTR two weeks before complete crush SCI; diphtheria toxin at eight weeks; thoracic Vsx2ON ablation and locomotor outcome. Supplementary Video 2 — ablation prevents natural recovery of walking. Separate rejuvenative gene-therapy experiment: Fig. 8; Extended Data Fig. 10; Supplementary Video 3" },
]);

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
export const RELEASE_DIR = path.join(PROJECT_ROOT, "release", "curator-review");
export const PACKAGE_ROOT = path.join(RELEASE_DIR, PACKAGE_BASENAME);
export const ZIP_PATH = path.join(RELEASE_DIR, PACKAGE_BASENAME + ".zip");
export const ZIP_SHA_PATH = ZIP_PATH + ".sha256";
const FIXED_DATE = new Date(PACKAGE_TIMESTAMP);

const DOCUMENT_ALLOWLIST = [
  "CURATOR_REVIEW_GUIDE.md",
  "CURATOR_REVIEW_FORM.md",
  "CURATOR_RELEASE_NOTES_2.8.md",
  "ADR-001-TABULAE-LOCAL-SPATIAL-SESSION.md",
  "ADR-002-TABULAE-LOCAL-COMPARISON-BOARD.md",
  "ADR-003-LOCAL-ADMISSION-MANIFEST-COMPOSER.md",
  "ADR-004-DETACHED-RO-CRATE-PROVENANCE.md",
  "ADR-005-PUBLIC-SOURCE-FEASIBILITY-PLANNER.md",
  "ADR-006-TWO-LANE-PROVENANCE-TRACE.md",
  "ADR-007-CROSS-LANE-RELATIONSHIP-ADMISSION.md",
  "ADR-008-PUBLIC-SOURCE-RELEASE-ADMISSION.md",
  "ADR-009-ASSERTION-PROVENANCE-BEFORE-OBJECT-ADMISSION.md",
  "ADR-010-AUTHORIZATION-PLAN-BEFORE-EXECUTION.md",
  "ADR-011-INDEPENDENT-AUTHORIZATION-EVIDENCE-PACKET.md",
  "ADR-012-REFERENCE-ANATOMY-AND-TYPE-LANES.md",
  "CURATOR_DISTRIBUTION_CHECKLIST.md",
  "CURATOR_PACKAGE_VALIDATION_REPORT_2.8.md",
  "RESEARCH_MVP_CHARTER.md",
  "RESEARCH_MVP_GAP_AUDIT.md",
  "RESEARCH_MODEL_UPGRADE_QUEUE.md",
  "SPATIAL_ASSET_PROVENANCE.md",
  "PUBLIC_DATA_ONLY_ROADMAP.md",
  "PUBLIC_DATA_WORKBENCH_ARCHITECTURE_0.4.md",
  "PUBLIC_SOURCE_RESEARCH_WATCH_2026-08-18.md",
  "RIGHTS_LEDGER.csv",
];

const DATA_ALLOWLIST = [
  "research-mvp-release-0.2.json",
  "public-data-catalog-0.4.json",
  "russ-harmonized-taxonomy-crosswalk-0.1.json",
  "russ-reconciliation-dossier-0.1.json",
  "tabulae-condition-catalog-0.1.json",
  "tabulae-spatial-local-session-0.1.json",
  "tabulae-spatial-local-comparison-0.1.json",
  "public-source-intakes/spinalj-processed-metadata-audit-0.4.json",
  "public-source-intake-registry-0.7.json",
  "file-admission-preflight-0.7.json",
  "file-admission-preflight-0.8.json",
  "public-file-admission-composer-0.1.json",
  "public-provenance-crate-0.1.json",
  "evidence-feasibility-planner-0.1.json",
  "evidence-provenance-trace-0.1.json",
  "cross-lane-relationship-admission-0.1.json",
  "public-source-release-admission-service-0.1.json",
  "public-source-assertion-provenance-0.1.json",
  "public-source-authorization-plan-0.1.json",
  "public-source-independent-authorization-evidence-0.1.json",
  "interneuron-knowledge-coverage-0.1.json",
  "curator-feedback-contract-2.8.json",
  "curator-adjudication-contract-2.8.json",
  "release-manifest-0.2.json",
  "release-manifest-2.8.json",
];

const SITE_REQUIRED_ASSET_ALLOWLIST = [
  "data/allen_cord_20um_v3_0/asset-manifest.json",
  "data/allen_cord_20um_v3_0/atlas-contours.json",
  "data/allen_cord_20um_v3_0/atlas-internal-compartments.json",
];

const TEXT_EXTENSIONS = new Set([
  ".css",
  ".csv",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".svg",
  ".swc",
  ".tsv",
  ".txt",
]);

function fail(message) {
  throw new Error(message);
}

export function containsCjk(value) {
  return CJK_CHARACTER.test(value);
}

export function isSafeRelativePath(value) {
  if (typeof value !== "string" || value.length === 0 || value.includes("\0")) return false;
  if (path.posix.isAbsolute(value) || path.win32.isAbsolute(value)) return false;
  const normalized = value.replaceAll("\\", "/");
  if (normalized === "." || normalized === ".." || normalized.startsWith("../")) return false;
  if (normalized.split("/").some((part) => part === "" || part === "." || part === "..")) return false;
  return path.posix.normalize(normalized) === normalized;
}

function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortDeep(value[key])]),
    );
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(sortDeep(value));
}

function sha256Buffer(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function sha256File(filePath) {
  return sha256Buffer(await readFile(filePath));
}

async function assertRegularFile(filePath, label = filePath) {
  const info = await lstat(filePath).catch(() => null);
  if (!info?.isFile()) fail("Required file is missing or not regular: " + label);
  if (info.isSymbolicLink()) fail("Symbolic links are forbidden: " + label);
}

async function listFiles(root) {
  const output = [];
  async function walk(current, prefix) {
    const entries = await readdir(current, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const relative = prefix ? prefix + "/" + entry.name : entry.name;
      if (!isSafeRelativePath(relative)) fail("Unsafe package path: " + relative);
      const absolute = path.join(current, entry.name);
      const info = await lstat(absolute);
      if (info.isSymbolicLink()) fail("Symbol links are forbidden in package input: " + relative);
      if (info.isDirectory()) await walk(absolute, relative);
      else if (info.isFile()) output.push(relative);
      else fail("Unsupported package entry type: " + relative);
    }
  }
  await walk(root, "");
  return output.sort();
}

async function copyTree(source, destination) {
  const info = await lstat(source);
  if (info.isSymbolicLink()) fail("Symbolic input is forbidden: " + source);
  if (info.isFile()) {
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(source, destination, { force: true });
    return;
  }
  if (!info.isDirectory()) fail("Unsupported input type: " + source);
  await mkdir(destination, { recursive: true });
  const entries = await readdir(source, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    await copyTree(path.join(source, entry.name), path.join(destination, entry.name));
  }
}

async function writeText(relativePath, contents, mode = 0o644) {
  if (!isSafeRelativePath(relativePath)) fail("Unsafe generated path: " + relativePath);
  const destination = path.join(PACKAGE_ROOT, relativePath);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, contents, "utf8");
  await chmod(destination, mode);
}

async function copyApproved(source, relativeDestination) {
  await assertRegularFile(source);
  if (!isSafeRelativePath(relativeDestination)) fail("Unsafe approved destination: " + relativeDestination);
  const destination = path.join(PACKAGE_ROOT, relativeDestination);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination, { force: true });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function loadReleaseIdentity() {
  const researchRelease = JSON.parse(await readFile(path.join(PROJECT_ROOT, "data", "research-mvp-release-0.2.json"), "utf8"));
  const publicCatalog = JSON.parse(await readFile(path.join(PROJECT_ROOT, "data", "public-data-catalog-0.4.json"), "utf8"));
  const russTaxonomyCrosswalk = JSON.parse(await readFile(path.join(PROJECT_ROOT, "data", "russ-harmonized-taxonomy-crosswalk-0.1.json"), "utf8"));
  const russReconciliationDossier = JSON.parse(await readFile(path.join(PROJECT_ROOT, "data", "russ-reconciliation-dossier-0.1.json"), "utf8"));
  const tabulaeConditionCatalog = JSON.parse(await readFile(path.join(PROJECT_ROOT, "data", "tabulae-condition-catalog-0.1.json"), "utf8"));
  const tabulaeSpatialLocalSession = JSON.parse(await readFile(path.join(PROJECT_ROOT, "data", "tabulae-spatial-local-session-0.1.json"), "utf8"));
  const tabulaeSpatialLocalComparison = JSON.parse(await readFile(path.join(PROJECT_ROOT, "data", "tabulae-spatial-local-comparison-0.1.json"), "utf8"));
  const intake = JSON.parse(await readFile(path.join(PROJECT_ROOT, "data", "public-source-intakes", "spinalj-processed-metadata-audit-0.4.json"), "utf8"));
  const registry = JSON.parse(await readFile(path.join(PROJECT_ROOT, "data", "public-source-intake-registry-0.7.json"), "utf8"));
  const filePreflight = JSON.parse(await readFile(path.join(PROJECT_ROOT, "data", "file-admission-preflight-0.7.json"), "utf8"));
  const canoPreflight = JSON.parse(await readFile(path.join(PROJECT_ROOT, "data", "file-admission-preflight-0.8.json"), "utf8"));
  const fileAdmissionComposer = JSON.parse(await readFile(path.join(PROJECT_ROOT, "data", "public-file-admission-composer-0.1.json"), "utf8"));
  const publicProvenanceCrate = JSON.parse(await readFile(path.join(PROJECT_ROOT, "data", "public-provenance-crate-0.1.json"), "utf8"));
  const feasibilityPlanner = JSON.parse(await readFile(path.join(PROJECT_ROOT, "data", "evidence-feasibility-planner-0.1.json"), "utf8"));
  const provenanceTrace = JSON.parse(await readFile(path.join(PROJECT_ROOT, "data", "evidence-provenance-trace-0.1.json"), "utf8"));
  const crossLaneRelationshipAdmission = JSON.parse(await readFile(path.join(PROJECT_ROOT, "data", "cross-lane-relationship-admission-0.1.json"), "utf8"));
  const publicSourceReleaseAdmissionService = JSON.parse(await readFile(path.join(PROJECT_ROOT, "data", "public-source-release-admission-service-0.1.json"), "utf8"));
  const publicSourceAssertionProvenance = JSON.parse(await readFile(path.join(PROJECT_ROOT, "data", "public-source-assertion-provenance-0.1.json"), "utf8"));
  const publicSourceAuthorizationPlan = JSON.parse(await readFile(path.join(PROJECT_ROOT, "data", "public-source-authorization-plan-0.1.json"), "utf8"));
  const publicSourceIndependentAuthorizationEvidence = JSON.parse(await readFile(path.join(PROJECT_ROOT, "data", "public-source-independent-authorization-evidence-0.1.json"), "utf8"));
  const interneuronKnowledgeCoverage = JSON.parse(await readFile(path.join(PROJECT_ROOT, "data", "interneuron-knowledge-coverage-0.1.json"), "utf8"));
  const curatorFeedbackContract = JSON.parse(await readFile(path.join(PROJECT_ROOT, "data", "curator-feedback-contract-2.8.json"), "utf8"));
  const curatorAdjudicationContract = JSON.parse(await readFile(path.join(PROJECT_ROOT, "data", "curator-adjudication-contract-2.8.json"), "utf8"));
  const atlasAssetManifestPath = path.join(PROJECT_ROOT, "public", "data", "allen_cord_20um_v3_0", "asset-manifest.json");
  const atlasInternalCompartmentsPath = path.join(PROJECT_ROOT, "public", "data", "allen_cord_20um_v3_0", "atlas-internal-compartments.json");
  const atlasAssetManifest = JSON.parse(await readFile(atlasAssetManifestPath, "utf8"));
  const atlasInternalCompartments = JSON.parse(await readFile(atlasInternalCompartmentsPath, "utf8"));
  const manifest = JSON.parse(await readFile(path.join(PROJECT_ROOT, "data", "release-manifest-2.8.json"), "utf8"));
  if (researchRelease.registrations?.length !== 0) fail("Curator package requires exactly zero registrations");
  if (publicCatalog.scientificInputPolicy !== "public_sources_only" || publicCatalog.institutionalExperimentalDataUsed !== false) {
    fail("Curator package requires the public-data-only policy");
  }
  const russ = publicCatalog.sources?.find((source) => source.id === "PDS-RUSS-2021");
  if (russ?.admissionStatus !== "metadata_audited" || russTaxonomyCrosswalk.coordinateAuthority !== "TYPE_LEVEL" || russTaxonomyCrosswalk.populations?.length !== 69 || russTaxonomyCrosswalk.scope?.displayedInterneuronCandidateCount !== 65 || russTaxonomyCrosswalk.source?.markerTable?.sourceFileBundled !== false || russTaxonomyCrosswalk.prototypeCrosswalks?.some((mapping) => mapping.mappingStatus === "exact" || mapping.mappingStatus === "registered")) {
    fail("Curator package requires the 69-population type-level Russ taxonomy crosswalk with no exact mapping");
  }
  if (russReconciliationDossier.authority !== "PROVENANCE_RECONCILIATION_ONLY" || russReconciliationDossier.releaseDecision?.currentStatus !== "reconciled_provenance_no_narrow_transfer" || russReconciliationDossier.pinnedMarkerTable?.sourceFileBundled !== false || russReconciliationDossier.pinnedMarkerTable?.tableContentChangeStatedByCorrections !== false || russReconciliationDossier.corrections?.length !== 2 || russReconciliationDossier.pinnedMarkerTable?.sha256 !== russTaxonomyCrosswalk.source?.markerTable?.sha256) {
    fail("Curator package requires the Russ provenance dossier with two corrections and no narrow transfer");
  }
  const starmap = publicCatalog.sources?.find((source) => source.id === "PDS-STARMAP-PLUS-2023");
  const starmapQueue = publicCatalog.upgradeQueue?.find((item) => item.id === "UPG-010");
  if (publicCatalog.sources?.length !== 7 || publicCatalog.upgradeQueue?.length !== 21 || starmap?.admissionStatus !== "ready_for_metadata_audit" || starmap?.content?.coordinateAuthority !== "SOURCE_LOCAL_OBS" || starmapQueue?.status !== "research_watch") {
    fail("Curator package requires the seven-source, twenty-one-gate catalog and source-local STARmap PLUS eligibility boundary");
  }
  const spinalj = publicCatalog.sources?.find((source) => source.id === "PDS-SPINALJ-PROCESSED");
  if (spinalj?.intakeRecordId !== intake.intakeId || intake.acquisition?.bundledAssetCount !== 0 || intake.coordinates?.projectRegistrationCount !== 0) {
    fail("Curator package requires the SpinalJ metadata-only intake with zero assets and registrations");
  }
  if (registry.schemaVersion !== "0.7.0" || registry.records?.length !== 3 || registry.records.some((record) => record.acquisition?.bundledAssetCount !== 0 || record.coordinates?.projectRegistrationCount !== 0)) {
    fail("Curator package requires three metadata-only registry records with zero assets and registrations");
  }
  const canoMethodAudit = registry.records.find((record) => record.sourceId === "PDS-CANOGOMEZ-2026");
  if (canoMethodAudit?.admission?.nextQueueItem !== "UPG-002B" || canoMethodAudit.coordinates?.transformStatus !== "method_reported_transform_artifact_and_error_not_file_verified") {
    fail("Curator package requires the Cano-Gomez source-local method boundary and file-inventory next gate");
  }
  const tabulaeObjectAudit = registry.records.find((record) => record.sourceId === "PDS-TABULAE-PARALYTICA");
  if (tabulaeObjectAudit?.objectInventory?.status !== "one_public_object_header_observed_checksum_and_asset_rights_unresolved" || tabulaeObjectAudit.objectInventory.objects?.length !== 1 || tabulaeObjectAudit.objectInventory.objects[0]?.sourceChecksum !== null || tabulaeObjectAudit.objectInventory.objects[0]?.localSha256 !== null) {
    fail("Curator package requires the non-admitting Tabulae object-header audit");
  }
  const tabulaeConditionAdapter = publicCatalog.upgradeQueue?.find((item) => item.id === "UPG-004");
  const tabulaeAdmissionGate = publicCatalog.upgradeQueue?.find((item) => item.id === "UPG-011");
  const tabulae3dEligibilityGate = publicCatalog.upgradeQueue?.find((item) => item.id === "UPG-012");
  const tabulaeComparisonGate = publicCatalog.upgradeQueue?.find((item) => item.id === "UPG-013");
  if (tabulaeConditionAdapter?.status !== "in_progress" || tabulaeAdmissionGate?.status !== "in_progress" || tabulae3dEligibilityGate?.status !== "research_watch" || tabulaeConditionCatalog.authority !== "SOURCE_METADATA_CONDITION_INDEX_ONLY" || tabulaeConditionCatalog.admissionDecision !== "metadata_only_not_downloaded_not_bundled_not_registered" || tabulaeConditionCatalog.sources?.length !== 2 || tabulaeConditionCatalog.conditions?.length !== 8 || tabulaeConditionCatalog.sources.some((source) => source.bodyBundled || source.processedMetadataBundled || source.localFileHash !== null) || new Set(tabulaeConditionCatalog.conditions.flatMap((condition) => condition.sourceSampleLabels)).size !== 93 || !/Do not download a source body.*create REG/i.test(tabulaeConditionCatalog.releaseDecision?.forbidden ?? "")) {
    fail("Curator package requires the eight-group, metadata-only Tabulae condition index with no acquired body or REG");
  }
  if (tabulaeSpatialLocalSession.authority !== "SOURCE_LOCAL_2D_SESSION_ONLY" || tabulaeSpatialLocalSession.archive?.stableName !== "GSE234774_RAW.tar" || tabulaeSpatialLocalSession.archive?.bytes !== 135208960 || tabulaeSpatialLocalSession.archive?.sourceChecksum !== null || tabulaeSpatialLocalSession.archive?.assetRightsDecision !== "unresolved_not_bundled" || tabulaeSpatialLocalSession.samples?.length !== 24 || tabulaeSpatialLocalSession.localImport?.automaticRemoteAcquisition !== false || tabulaeSpatialLocalSession.localImport?.upload !== false || tabulaeSpatialLocalSession.localImport?.persistence !== "none" || !/Do not fetch from GEO.*individual interneuron.*create REG/i.test(tabulaeSpatialLocalSession.releaseDecision?.forbidden ?? "")) {
    fail("Curator package requires the 24-section Tabulae browser-local session with no acquisition, upload, bundle or REG");
  }
  if (tabulaeComparisonGate?.status !== "research_watch" || tabulaeSpatialLocalComparison.authority !== "MULTI_SESSION_SOURCE_LOCAL_2D_ONLY" || tabulaeSpatialLocalComparison.baseSessionReleaseId !== tabulaeSpatialLocalSession.releaseId || tabulaeSpatialLocalComparison.comparison?.maximumConcurrentSessions !== 4 || tabulaeSpatialLocalComparison.comparison?.crossSectionTransform !== "none" || tabulaeSpatialLocalComparison.comparison?.sectionOrderAuthority !== "not_established_from_section_labels" || tabulaeSpatialLocalComparison.comparison?.interSectionGeometry !== "not_established" || tabulaeSpatialLocalComparison.comparison?.quantitativeComparison !== "not_permitted" || tabulaeSpatialLocalComparison.localRuntime?.automaticRemoteAcquisition !== false || tabulaeSpatialLocalComparison.localRuntime?.upload !== false || tabulaeSpatialLocalComparison.localRuntime?.persistence !== "none" || tabulaeSpatialLocalComparison.localRuntime?.sourceFilesBundled !== false || !/Do not fetch.*overlay, normalize, order, stack or register sections.*REG/i.test(tabulaeSpatialLocalComparison.releaseDecision?.forbidden ?? "")) {
    fail("Curator package requires the four-session Tabulae source-local comparison board with no alignment, source bundle or REG");
  }
  if (filePreflight.status !== "awaiting_object_level_public_manifest" || filePreflight.candidateFilesAccepted !== 0 || filePreflight.automaticDownload !== false || filePreflight.credentialStorage !== false || filePreflight.nextQueueItem !== "UPG-001B") {
    fail("Curator package requires the zero-file, no-download source-checksum-aware admission preflight");
  }
  if (canoPreflight.formatVersion !== "0.8.0" || canoPreflight.sourceId !== "PDS-CANOGOMEZ-2026" || canoPreflight.status !== "awaiting_specimen_aware_object_manifest" || canoPreflight.candidateFilesAccepted !== 0 || canoPreflight.automaticDownload !== false || canoPreflight.credentialStorage !== false || canoPreflight.nextQueueItem !== "UPG-002B") fail("Curator package requires the zero-file specimen-aware Cano-Gomez preflight");
  const provenanceExternalizationGate = publicCatalog.upgradeQueue?.find((item) => item.id === "UPG-014");
  if (fileAdmissionComposer.releaseId !== "ohri-public-file-admission-composer-0.1.0" || fileAdmissionComposer.catalogReleaseId !== publicCatalog.releaseId || JSON.stringify(fileAdmissionComposer.publicSourceIds) !== JSON.stringify(["PDS-SPINALJ-PROCESSED", "PDS-CANOGOMEZ-2026"]) || fileAdmissionComposer.supportedManifestFormats?.length !== 2 || fileAdmissionComposer.supportedManifestFormats?.some((format) => format.fixedAdmissionDecision !== "metadata_only_not_downloaded_not_registered" || format.fixedLocalSha256 !== null) || fileAdmissionComposer.localRuntime?.automaticRemoteAcquisition !== false || fileAdmissionComposer.localRuntime?.sourceFileUpload !== false || fileAdmissionComposer.localRuntime?.persistentStorage !== "none" || fileAdmissionComposer.localRuntime?.localHashCalculation !== false || provenanceExternalizationGate?.status !== "in_progress" || publicProvenanceCrate.roCrateVersion !== "1.3" || publicProvenanceCrate.packagingMode !== "detached_metadata_document" || publicProvenanceCrate.localRuntime?.networkRequests !== false || publicProvenanceCrate.localRuntime?.sourceFileDownload !== false || publicProvenanceCrate.localRuntime?.sourceFileUpload !== false || publicProvenanceCrate.localRuntime?.persistentStorage !== "none") fail("Curator package requires the two-format local metadata-only composer and detached external-reference-only RO-Crate export");
  const plannerGate = publicCatalog.upgradeQueue?.find((item) => item.id === "UPG-015");
  const plannerSourceIds = ["PDS-BRAINGLOBE-ATLAS", "PDS-NEUROMORPHO-SWC", "PDS-SPINALJ-PROCESSED", "PDS-CANOGOMEZ-2026", "PDS-RUSS-2021", "PDS-STARMAP-PLUS-2023", "PDS-TABULAE-PARALYTICA"];
  const highRiskAxisIds = ["same_cell_multimodal_join", "synaptic_connectivity", "project_atlas_registration"];
  if (feasibilityPlanner.releaseId !== "ohri-evidence-feasibility-planner-0.1.0" || feasibilityPlanner.schemaVersion !== "0.1.0" || feasibilityPlanner.catalogReleaseId !== publicCatalog.releaseId || feasibilityPlanner.selectedAxisLimit !== 4 || JSON.stringify(feasibilityPlanner.publicSourceIds) !== JSON.stringify(plannerSourceIds) || feasibilityPlanner.axes?.length !== 11 || feasibilityPlanner.routes?.length !== 7 || highRiskAxisIds.some((axisId) => feasibilityPlanner.routes.some((route) => route.supportedAxisIds?.includes(axisId))) || feasibilityPlanner.localRuntime?.networkRequests !== false || feasibilityPlanner.localRuntime?.sourceFileDownload !== false || feasibilityPlanner.localRuntime?.sourceFileUpload !== false || feasibilityPlanner.localRuntime?.persistentStorage !== "none" || feasibilityPlanner.localRuntime?.output !== "browser_download_of_feasibility_receipt_json" || !/not a biological absence claim/i.test(feasibilityPlanner.unqualifiedAxisDecision ?? "") || !/same-cell.*same-specimen.*coordinate.*causal/i.test(feasibilityPlanner.multiRouteDecision ?? "") || !/does not acquire.*create REG/i.test(feasibilityPlanner.scientificBoundary ?? "") || plannerGate?.status !== "in_progress" || JSON.stringify(plannerGate?.sourceIds) !== JSON.stringify(plannerSourceIds) || !/same-cell.*create REG/i.test(plannerGate?.scientificBoundary ?? "") || !/biological absence/i.test(plannerGate?.rejectIf ?? "")) {
    fail("Curator package requires the public-source feasibility planner with no acquisition, false join, biological-absence claim or REG");
  }
  const provenanceTraceGate = publicCatalog.upgradeQueue?.find((item) => item.id === "UPG-016");
  if (provenanceTrace.releaseId !== "ohri-evidence-provenance-trace-0.1.0" || provenanceTrace.schemaVersion !== "0.1.0" || provenanceTrace.researchReleaseId !== researchRelease.releaseId || provenanceTrace.catalogReleaseId !== publicCatalog.releaseId || provenanceTrace.plannerReleaseId !== feasibilityPlanner.releaseId || JSON.stringify(provenanceTrace.lanes?.map((lane) => lane.id)) !== JSON.stringify(["research_evidence", "public_source_routes"]) || provenanceTrace.localRuntime?.networkRequests !== false || provenanceTrace.localRuntime?.sourceFileDownload !== false || provenanceTrace.localRuntime?.sourceFileUpload !== false || provenanceTrace.localRuntime?.persistentStorage !== "none" || provenanceTrace.localRuntime?.output !== "browser_download_of_provenance_trace_receipt_json" || !/deliberately unjoined.*same-cell.*coordinate transform.*REG/i.test(provenanceTrace.crossLanePolicy ?? "") || !/does not acquire.*does not infer.*REG/i.test(provenanceTrace.scientificBoundary ?? "") || provenanceTraceGate?.status !== "in_progress" || JSON.stringify(provenanceTraceGate?.sourceIds) !== JSON.stringify(plannerSourceIds) || !/does not acquire.*cross-study identity.*REG/i.test(provenanceTraceGate?.scientificBoundary ?? "")) {
    fail("Curator package requires the two-lane provenance trace with no cross-lane identity, source acquisition or REG");
  }
  const crossLaneAdmissionGate = publicCatalog.upgradeQueue?.find((item) => item.id === "UPG-017");
  if (crossLaneAdmissionGate?.status !== "in_progress" || JSON.stringify(crossLaneAdmissionGate?.sourceIds) !== JSON.stringify(plannerSourceIds) || !/does not acquire.*cross-study relation.*create REG/i.test(crossLaneAdmissionGate?.scientificBoundary ?? "") || crossLaneRelationshipAdmission.releaseId !== "ohri-cross-lane-relationship-admission-0.1.0" || crossLaneRelationshipAdmission.researchReleaseId !== researchRelease.releaseId || crossLaneRelationshipAdmission.catalogReleaseId !== publicCatalog.releaseId || crossLaneRelationshipAdmission.provenanceTraceReleaseId !== provenanceTrace.releaseId || crossLaneRelationshipAdmission.admissionStatus !== "proposal_only_not_admitted" || JSON.stringify(crossLaneRelationshipAdmission.relationshipKinds?.map((kind) => kind.id)) !== JSON.stringify(["molecular_label_correspondence", "source_object_derivation", "same_specimen_relation", "coordinate_transform", "same_cell_identity"]) || crossLaneRelationshipAdmission.localRuntime?.networkRequests !== false || crossLaneRelationshipAdmission.localRuntime?.sourceObjectAcquisition !== false || crossLaneRelationshipAdmission.localRuntime?.sourceFileUpload !== false || crossLaneRelationshipAdmission.localRuntime?.persistentStorage !== "none" || !/cannot add a cross-lane edge.*create REG/i.test(crossLaneRelationshipAdmission.nonPromotionPolicy ?? "")) {
    fail("Curator package requires the non-promoting, not-admitted cross-lane relationship proposal composer");
  }
  const sourceAdmissionGate = publicCatalog.upgradeQueue?.find((item) => item.id === "UPG-006");
  const sourceAssertionGate = publicCatalog.upgradeQueue?.find((item) => item.id === "UPG-018");
  const assetAuthorizationGate = publicCatalog.upgradeQueue?.find((item) => item.id === "UPG-019");
  if (sourceAdmissionGate?.status !== "in_progress" || sourceAssertionGate?.status !== "in_progress" || assetAuthorizationGate?.status !== "in_progress" || JSON.stringify(sourceAssertionGate?.sourceIds) !== JSON.stringify(plannerSourceIds) || JSON.stringify(assetAuthorizationGate?.sourceIds) !== JSON.stringify(plannerSourceIds) || publicSourceReleaseAdmissionService.releaseId !== "ohri-public-source-release-admission-service-0.1.0" || publicSourceReleaseAdmissionService.catalogReleaseId !== publicCatalog.releaseId || publicSourceReleaseAdmissionService.manifestComposerReleaseId !== fileAdmissionComposer.releaseId || publicSourceReleaseAdmissionService.queueItemId !== "UPG-006" || publicSourceReleaseAdmissionService.admissionDecision !== "not_admitted_pending_curator_object_and_rights_review" || JSON.stringify(publicSourceReleaseAdmissionService.supportedManifestFormats?.map((format) => [format.formatVersion, format.sourceId])) !== JSON.stringify([["0.7.0", "PDS-SPINALJ-PROCESSED"], ["0.8.0", "PDS-CANOGOMEZ-2026"]]) || publicSourceReleaseAdmissionService.localRuntime?.networkRequests !== false || publicSourceReleaseAdmissionService.localRuntime?.sourceFileDownload !== false || publicSourceReleaseAdmissionService.localRuntime?.sourceFileUpload !== false || publicSourceReleaseAdmissionService.localRuntime?.persistentStorage !== "none" || !/does not authenticate.*acquire or inspect.*create REG/i.test(publicSourceReleaseAdmissionService.scientificBoundary ?? "") || publicSourceAssertionProvenance.releaseId !== "ohri-public-source-assertion-provenance-0.1.0" || publicSourceAssertionProvenance.catalogReleaseId !== publicCatalog.releaseId || publicSourceAssertionProvenance.admissionServiceReleaseId !== publicSourceReleaseAdmissionService.releaseId || publicSourceAssertionProvenance.queueItemId !== "UPG-018" || JSON.stringify(publicSourceAssertionProvenance.assertionSourceStates) !== JSON.stringify(["publisher_asserted", "curator_transcribed", "unresolved"]) || publicSourceAssertionProvenance.nonPromotion?.verificationStatus !== "not_locally_verified" || publicSourceAssertionProvenance.nonPromotion?.admissionDecision !== publicSourceReleaseAdmissionService.admissionDecision || publicSourceAssertionProvenance.localRuntime?.networkRequests !== false || publicSourceAssertionProvenance.localRuntime?.sourceFileDownload !== false || publicSourceAssertionProvenance.localRuntime?.sourceFileUpload !== false || publicSourceAssertionProvenance.localRuntime?.persistentStorage !== "none" || !/does not authenticate.*acquire.*calculate a local checksum.*create REG/i.test(publicSourceAssertionProvenance.scientificBoundary ?? "")) {
    fail("Curator package requires the metadata-only admission service, the unverified assertion-provenance composer, and the implemented UPG-019 authorization plan");
  }
  const authorizationEvidenceGate = publicCatalog.upgradeQueue?.find((item) => item.id === "UPG-020");
  const executionGate = publicCatalog.upgradeQueue?.find((item) => item.id === "UPG-021");
  if (authorizationEvidenceGate?.status !== "in_progress" || executionGate?.status !== "research_watch" || JSON.stringify(authorizationEvidenceGate?.sourceIds) !== JSON.stringify(plannerSourceIds) || JSON.stringify(executionGate?.sourceIds) !== JSON.stringify(plannerSourceIds) || publicSourceAuthorizationPlan.releaseId !== "ohri-public-source-authorization-plan-0.1.0" || publicSourceAuthorizationPlan.catalogReleaseId !== publicCatalog.releaseId || publicSourceAuthorizationPlan.admissionServiceReleaseId !== publicSourceReleaseAdmissionService.releaseId || publicSourceAuthorizationPlan.assertionProvenanceReleaseId !== publicSourceAssertionProvenance.releaseId || publicSourceAuthorizationPlan.queueItemId !== "UPG-019" || JSON.stringify(publicSourceAuthorizationPlan.supportedManifestFormats?.map((format) => [format.formatVersion, format.sourceId])) !== JSON.stringify([["0.7.0", "PDS-SPINALJ-PROCESSED"], ["0.8.0", "PDS-CANOGOMEZ-2026"]]) || publicSourceAuthorizationPlan.supportedManifestFormats?.some((format) => JSON.stringify(format.requiredPlanStepIds) !== JSON.stringify(["object_identity_confirmation", "object_specific_rights_review", "authorized_acquisition_record", "local_checksum_verification", "content_scope_validation"])) || publicSourceAuthorizationPlan.nonPromotion?.planStatus !== "authorization_and_verification_plan_only" || publicSourceAuthorizationPlan.nonPromotion?.authorizationStatus !== "not_authorized_by_this_plan" || publicSourceAuthorizationPlan.nonPromotion?.verificationStatus !== "not_locally_verified" || publicSourceAuthorizationPlan.localRuntime?.networkRequests !== false || publicSourceAuthorizationPlan.localRuntime?.sourceFileDownload !== false || publicSourceAuthorizationPlan.localRuntime?.sourceFileUpload !== false || publicSourceAuthorizationPlan.localRuntime?.persistentStorage !== "none" || !/does not authenticate.*authorize.*acquire.*hash.*create REG/i.test(publicSourceAuthorizationPlan.scientificBoundary ?? "") || publicSourceIndependentAuthorizationEvidence.releaseId !== "ohri-public-source-independent-authorization-evidence-0.1.0" || publicSourceIndependentAuthorizationEvidence.catalogReleaseId !== publicCatalog.releaseId || publicSourceIndependentAuthorizationEvidence.admissionServiceReleaseId !== publicSourceReleaseAdmissionService.releaseId || publicSourceIndependentAuthorizationEvidence.assertionProvenanceReleaseId !== publicSourceAssertionProvenance.releaseId || publicSourceIndependentAuthorizationEvidence.authorizationPlanReleaseId !== publicSourceAuthorizationPlan.releaseId || publicSourceIndependentAuthorizationEvidence.queueItemId !== "UPG-020" || JSON.stringify(publicSourceIndependentAuthorizationEvidence.supportedManifestFormats?.map((format) => [format.formatVersion, format.sourceId])) !== JSON.stringify([["0.7.0", "PDS-SPINALJ-PROCESSED"], ["0.8.0", "PDS-CANOGOMEZ-2026"]]) || publicSourceIndependentAuthorizationEvidence.supportedManifestFormats?.some((format) => JSON.stringify(format.requiredReviewStageIds) !== JSON.stringify(["authority_identity_confirmation", "object_specific_terms_scope_review", "authorized_retrieval_conditions", "local_integrity_comparison", "content_scope_retention_review"])) || publicSourceIndependentAuthorizationEvidence.nonPromotion?.packetStatus !== "independent_authorization_evidence_packet_draft_only" || publicSourceIndependentAuthorizationEvidence.nonPromotion?.authorityStatus !== "not_authenticated_by_this_packet" || publicSourceIndependentAuthorizationEvidence.nonPromotion?.executionStatus !== "not_executed_pending_independent_authorization" || publicSourceIndependentAuthorizationEvidence.nonPromotion?.verificationStatus !== "not_locally_verified" || publicSourceIndependentAuthorizationEvidence.localRuntime?.networkRequests !== false || publicSourceIndependentAuthorizationEvidence.localRuntime?.sourceFileDownload !== false || publicSourceIndependentAuthorizationEvidence.localRuntime?.sourceFileUpload !== false || publicSourceIndependentAuthorizationEvidence.localRuntime?.persistentStorage !== "none" || !/does not authenticate.*authorize.*acquire.*retain.*create REG/i.test(publicSourceIndependentAuthorizationEvidence.scientificBoundary ?? "")) {
    fail("Curator package requires the non-authorizing UPG-019 plan, non-authenticating UPG-020 independent-evidence composer, and UPG-021 execution research watch");
  }
  const expectedCoverageAxes = ["type_taxonomy", "region_lamina_context", "life_stage", "injury_state", "spatial_measurement", "causal_mechanism", "morphology"];
  const expectedCoverageLanes = ["russ-2021", "haring-2018", "sathyamurthy-2018", "delile-2019", "tabulae-paralytica-2024"];
  if (interneuronKnowledgeCoverage.releaseId !== "ohri-interneuron-knowledge-coverage-0.1.0" || interneuronKnowledgeCoverage.coordinateAuthority !== "SOURCE_LOCAL_METADATA_ONLY" || interneuronKnowledgeCoverage.projectRegistrationCount !== 0 || JSON.stringify(interneuronKnowledgeCoverage.axes?.map((axis) => axis.id)) !== JSON.stringify(expectedCoverageAxes) || JSON.stringify(interneuronKnowledgeCoverage.lanes?.map((lane) => lane.id)) !== JSON.stringify(expectedCoverageLanes) || interneuronKnowledgeCoverage.lanes?.some((lane) => lane.crossStudyMappingStatus !== "not_established" || lane.coordinateAuthority !== "SOURCE_LOCAL_ONLY" || lane.projectRegistrationCount !== 0 || lane.assetAccess?.sourceObjectsBundled !== false || lane.assetAccess?.assetLevelReuseStatus !== "not_assumed" || lane.coverage?.find((entry) => entry.axisId === "morphology")?.status !== "not_measured")) {
    fail("Curator package requires the five-source by seven-axis metadata-only coverage matrix with no cross-study identity, morphology promotion or REG");
  }
  const coverageJudgments = interneuronKnowledgeCoverage.lanes.flatMap((lane) =>
    lane.coverage.map((entry) => ({ laneId: lane.id, ...entry })),
  );
  if (coverageJudgments.length !== 35 || coverageJudgments.some((entry) => typeof entry.sourceLocator !== "string" || entry.sourceLocator.trim().length < 20)) {
    fail("Curator package requires publication locators for all 35 source-by-axis coverage judgments");
  }
  for (const expected of EXPECTED_COVERAGE_LOCATOR_CORRECTIONS) {
    const actual = coverageJudgments.find((entry) => entry.laneId === expected.laneId && entry.axisId === expected.axisId);
    if (actual?.sourceLocator !== expected.sourceLocator) {
      fail("Curator package audited source locator drifted for " + expected.laneId + ":" + expected.axisId);
    }
  }
  const directCausalLanes = interneuronKnowledgeCoverage.lanes.filter((lane) => lane.coverage?.find((entry) => entry.axisId === "causal_mechanism")?.status === "direct");
  const tabulaeDirectCausalCoverage = directCausalLanes[0]?.coverage.find((entry) => entry.axisId === "causal_mechanism");
  if (JSON.stringify(directCausalLanes.map((lane) => lane.id)) !== JSON.stringify(["tabulae-paralytica-2024"]) || !/AAV-DTR.*two weeks before complete crush SCI.*diphtheria toxin.*at eight weeks.*ablate thoracic Vsx2ON neurons.*prevented natural walking recovery/i.test(tabulaeDirectCausalCoverage?.evidence ?? "") || !/Extended Data Fig\. 3j.?l.*AAV-DTR two weeks before complete crush SCI.*diphtheria toxin at eight weeks.*Supplementary Video 2.*prevents natural recovery of walking/i.test(tabulaeDirectCausalCoverage?.sourceLocator ?? "") || !/specific to its Vsx2ON definition.*vector and toxin timing.*does not establish causality for every source label.*Russ population.*project entity/i.test(tabulaeDirectCausalCoverage?.displayBoundary ?? "")) {
    fail("Curator package requires only the source-bounded, non-transferable Tabulae Vsx2ON ablation result to retain direct causal status");
  }
  const internalCompartmentReport = validateAtlasInternalCompartments(atlasInternalCompartments);
  const internalCompartmentFile = atlasAssetManifest.files?.find((file) => file.path === "atlas-internal-compartments.json");
  const missingInternalPlanes = atlasInternalCompartments.structures.flatMap((structure) =>
    structure.planes
      .filter((plane) => plane.presence === "missing")
      .map((plane) => [structure.identifier, plane.zIndex, plane.missingReason]),
  );
  const researchAtlas = researchRelease.assets?.find((asset) => asset.assetType === "reference_atlas");
  if (atlasAssetManifest.assetId !== "allen_cord_20um:3.0:ohri-sampled-reference-v2" || researchAtlas?.checksum !== await sha256File(atlasAssetManifestPath) || atlasInternalCompartments.assetId !== "allen_cord_20um:3.0:internal-compartments-v1" || atlasInternalCompartments.sourceAtlasAssetId !== atlasAssetManifest.assetId || JSON.stringify(internalCompartmentReport.structureIdentifiers) !== JSON.stringify([90, 100, 110, 16, 74, 75, 70]) || internalCompartmentReport.sampledPlaneCount !== 15 || internalCompartmentReport.totalComponents !== 408 || internalCompartmentReport.totalPolygons !== 408 || internalCompartmentReport.missingPlaneCount !== 1 || JSON.stringify(missingInternalPlanes) !== JSON.stringify([[74, 1470, "source_mask_absent_at_sampled_plane"]]) || atlasInternalCompartments.geometryStatus !== "INF" || atlasInternalCompartments.measurementUse !== "forbidden" || atlasInternalCompartments.registrationCount !== 0 || atlasInternalCompartments.componentPolicy?.connectivity !== 4 || atlasInternalCompartments.componentPolicy?.disconnectedComponents !== "preserved_never_bridged" || atlasInternalCompartments.componentPolicy?.componentIndexScope !== "plane_local_no_cross_plane_correspondence" || atlasInternalCompartments.polygonPolicy?.interpolation !== "none" || atlasInternalCompartments.polygonPolicy?.manualGeometry !== "none" || internalCompartmentFile?.sha256 !== await sha256File(atlasInternalCompartmentsPath) || internalCompartmentFile?.bytes !== (await stat(atlasInternalCompartmentsPath)).size) {
    fail("Curator package requires the exact seven-structure, 15-plane, 408-component/polygon INF internal-compartment derivative with one explicit missing plane, no bridging, measurement forbidden and 0 REG");
  }
  if (manifest.application?.version !== "2.8.0" || manifest.releaseDate !== "2026-08-26" || manifest.integrity?.inputCount !== 57 || manifest.spatialAssets?.atlas?.geometryStatus !== "INF" || manifest.spatialAssets?.atlas?.sampledPlaneCount !== 15 || manifest.spatialAssets?.atlas?.measurementAllowed !== false || manifest.spatialAssets?.atlas?.projectRegistrationCount !== 0 || manifest.spatialAssets?.atlas?.internalCompartments?.assetId !== atlasInternalCompartments.assetId || manifest.spatialAssets?.atlas?.internalCompartments?.sourceIdMajorStructureCount !== 7 || manifest.spatialAssets?.atlas?.internalCompartments?.componentCount !== 408 || manifest.spatialAssets?.atlas?.internalCompartments?.polygonCount !== 408 || canonicalJson(manifest.spatialAssets?.atlas?.internalCompartments?.missingPlanes) !== canonicalJson([{ structureIdentifier: 74, structureName: "Dorsal funiculus", zIndex: 1470, missingReason: "source_mask_absent_at_sampled_plane" }]) || manifest.spatialAssets?.atlas?.internalCompartments?.renderingMode !== "plane_local_line_segments_only" || manifest.spatialAssets?.atlas?.internalCompartments?.displayColorKey !== "preserved_source_identifier" || manifest.spatialAssets?.atlas?.internalCompartments?.displayColorAuthority !== "none_project_display_only_palette" || manifest.spatialAssets?.atlas?.internalCompartments?.projectDisplayPaletteSize !== 7 || manifest.spatialAssets?.atlas?.internalCompartments?.sourceColorRetention !== "exact_source_color_retained_in_user_data" || manifest.spatialAssets?.atlas?.internalCompartments?.lofting !== "forbidden" || manifest.spatialAssets?.atlas?.internalCompartments?.filling !== "none" || manifest.spatialAssets?.atlas?.internalCompartments?.joining !== "none" || manifest.spatialAssets?.atlas?.internalCompartments?.measurementAllowed !== false || manifest.spatialAssets?.atlas?.internalCompartments?.projectRegistrationCount !== 0 || manifest.publicDataWorkbench?.interneuronKnowledgeCoverage?.laneCount !== 5 || manifest.publicDataWorkbench?.interneuronKnowledgeCoverage?.axisCount !== 7 || JSON.stringify(manifest.publicDataWorkbench?.interneuronKnowledgeCoverage?.crossStudyMappingStatuses) !== JSON.stringify(["not_established"]) || JSON.stringify(manifest.publicDataWorkbench?.interneuronKnowledgeCoverage?.morphologyStatuses) !== JSON.stringify(["not_measured"]) || JSON.stringify(manifest.publicDataWorkbench?.interneuronKnowledgeCoverage?.directCausalLaneIds) !== JSON.stringify(["tabulae-paralytica-2024"]) || !/specific to its Vsx2ON definition.*does not establish causality for every source label.*Russ population.*project entity/i.test(manifest.publicDataWorkbench?.interneuronKnowledgeCoverage?.directCausalBoundary ?? "") || manifest.researchModel?.referenceBackedUpgrade?.molecularTypeLandscape?.interneuronCandidateCount !== 65 || manifest.researchModel?.referenceBackedUpgrade?.molecularTypeLandscape?.candidateScope !== "non_motoneuron_interneuron_or_projection_neuron_candidates" || manifest.researchModel?.referenceBackedUpgrade?.molecularTypeLandscape?.confirmedInterneuronCount !== null || manifest.researchModel?.referenceBackedUpgrade?.molecularTypeLandscape?.placementStatus !== "unplaced" || manifest.researchModel?.referenceBackedUpgrade?.laneJoinPolicy !== "none_without_separate_versioned_evidence_and_review") {
    fail("Curator package requires the 15-plane INF reference and seven internal source-ID structures, 65 unplaced non-motoneuron candidate populations, lane separation, measurement forbidden and 0 REG");
  }
  if (manifest.publicDataWorkbench?.interneuronKnowledgeCoverage?.sourceLocatorCount !== 35 || manifest.publicDataWorkbench?.interneuronKnowledgeCoverage?.auditedLocatorCorrectionCount !== EXPECTED_COVERAGE_LOCATOR_CORRECTIONS.length || canonicalJson(manifest.publicDataWorkbench?.interneuronKnowledgeCoverage?.auditedLocatorCorrections) !== canonicalJson(EXPECTED_COVERAGE_LOCATOR_CORRECTIONS)) {
    fail("Curator package release manifest must lock all 35 coverage locators and the seven audited locator corrections");
  }
  if (!/^[a-f0-9]{64}$/.test(manifest.manifestContentSha256 ?? "")) {
    fail("Public-data workbench manifest content hash is invalid");
  }
  if (curatorFeedbackContract.schemaVersion !== "2.8.0" || curatorFeedbackContract.feedbackSchemaVersion !== "2.8.0" || curatorFeedbackContract.distributionVersion !== DISTRIBUTION_VERSION || curatorFeedbackContract.workbenchReleaseId !== manifest.releaseId) {
    fail("Curator feedback contract does not match the current package identity");
  }
  if (curatorFeedbackContract.privacy !== "Created locally; not uploaded." || curatorFeedbackContract.maximumFileBytes !== 2097152 || curatorFeedbackContract.maximumFeedbackRecords !== 10 || curatorFeedbackContract.minimumIndependentCuratorsForComparison !== 2) {
    fail("Curator feedback contract local-only limits are invalid");
  }
  const feedbackKeys = [...curatorFeedbackContract.requiredResponseKeys ?? [], ...curatorFeedbackContract.optionalResponseKeys ?? []];
  if (new Set(feedbackKeys).size !== feedbackKeys.length || !["curator_id", "zip_verified", "zip_sha256", "overall_verdict", "attestation"].every((key) => curatorFeedbackContract.requiredResponseKeys?.includes(key))) {
    fail("Curator feedback response contract is invalid");
  }
  if (curatorAdjudicationContract.schemaVersion !== "2.8.0" || curatorAdjudicationContract.adjudicationSchemaVersion !== "1.0.0" || curatorAdjudicationContract.feedbackSchemaVersion !== curatorFeedbackContract.feedbackSchemaVersion || curatorAdjudicationContract.distributionVersion !== DISTRIBUTION_VERSION || curatorAdjudicationContract.workbenchReleaseId !== manifest.releaseId || curatorAdjudicationContract.minimumIndependentCurators !== curatorFeedbackContract.minimumIndependentCuratorsForComparison) {
    fail("Curator adjudication contract does not match the current package identity");
  }
  if (JSON.stringify(curatorAdjudicationContract.permittedDispositions) !== JSON.stringify(["defer_pending_evidence", "return_for_revision", "recommend_next_private_review"]) || !/cannot change evidence.*authenticate an authorization decision.*authorize data access.*retain data.*align reference anatomy.*molecular type.*morphology.*SCI evidence lanes.*cross-study identity or morphology join.*external provenance package.*create a registration/i.test(curatorAdjudicationContract.boundary ?? "")) {
    fail("Curator adjudication contract must retain its non-promoting boundary");
  }
  if (curatorAdjudicationContract.maximumPacketBytes !== 2097152 || curatorAdjudicationContract.readOnlyPacketImport !== true) {
    fail("Curator adjudication contract must retain bounded read-only packet verification");
  }
  return {
    releaseId: manifest.releaseId,
    schemaVersion: manifest.manifestSchemaVersion,
    sourceCatalogReleaseId: publicCatalog.releaseId,
    russTaxonomyCrosswalkReleaseId: russTaxonomyCrosswalk.releaseId,
    russTaxonomyPopulationCount: russTaxonomyCrosswalk.populations.length,
    russReconciliationDossierReleaseId: russReconciliationDossier.releaseId,
    russCorrectionCount: russReconciliationDossier.corrections.length,
    tabulaeConditionCatalogReleaseId: tabulaeConditionCatalog.releaseId,
    tabulaeConditionGroupCount: tabulaeConditionCatalog.conditions.length,
    tabulaeConditionSourceLabelCount: new Set(tabulaeConditionCatalog.conditions.flatMap((condition) => condition.sourceSampleLabels)).size,
    tabulaeLocalSessionReleaseId: tabulaeSpatialLocalSession.releaseId,
    tabulaeLocalSessionSampleCount: tabulaeSpatialLocalSession.samples.length,
    tabulaeLocalComparisonReleaseId: tabulaeSpatialLocalComparison.releaseId,
    tabulaeLocalComparisonMaximumSessions: tabulaeSpatialLocalComparison.comparison.maximumConcurrentSessions,
    researchEvidenceReleaseId: researchRelease.releaseId,
    researchEvidenceSchemaVersion: researchRelease.schemaVersion,
    releaseManifestContentSha256: manifest.manifestContentSha256,
    registrationCount: researchRelease.registrations.length,
    spinaljMetadataIntakeId: intake.intakeId,
    publicSourceIntakeRegistryReleaseId: registry.releaseId,
    fileAdmissionPreflightId: filePreflight.preflightId,
    fileAdmissionComposerReleaseId: fileAdmissionComposer.releaseId,
    fileAdmissionComposerFormatCount: fileAdmissionComposer.supportedManifestFormats.length,
    evidenceFeasibilityPlannerReleaseId: feasibilityPlanner.releaseId,
    evidenceFeasibilityPlannerAxisCount: feasibilityPlanner.axes.length,
    evidenceFeasibilityPlannerRouteCount: feasibilityPlanner.routes.length,
    evidenceProvenanceTraceReleaseId: provenanceTrace.releaseId,
    evidenceProvenanceTraceLaneCount: provenanceTrace.lanes.length,
    publicSourceAssertionProvenanceReleaseId: publicSourceAssertionProvenance.releaseId,
    publicSourceAssertionProvenanceClaimScopeCount: publicSourceAssertionProvenance.claimScopes.length,
    publicSourceAssertionProvenanceVerificationStatus: publicSourceAssertionProvenance.nonPromotion.verificationStatus,
    publicSourceAuthorizationPlanReleaseId: publicSourceAuthorizationPlan.releaseId,
    publicSourceAuthorizationPlanStageCount: publicSourceAuthorizationPlan.supportedManifestFormats[0].requiredPlanStepIds.length,
    publicSourceAuthorizationPlanAuthorizationStatus: publicSourceAuthorizationPlan.nonPromotion.authorizationStatus,
    publicSourceIndependentAuthorizationEvidenceReleaseId: publicSourceIndependentAuthorizationEvidence.releaseId,
    publicSourceIndependentAuthorizationEvidenceStageCount: publicSourceIndependentAuthorizationEvidence.supportedManifestFormats[0].requiredReviewStageIds.length,
    publicSourceIndependentAuthorizationEvidenceAuthorityStatus: publicSourceIndependentAuthorizationEvidence.nonPromotion.authorityStatus,
    interneuronKnowledgeCoverageReleaseId: interneuronKnowledgeCoverage.releaseId,
    interneuronKnowledgeCoverageLaneCount: interneuronKnowledgeCoverage.lanes.length,
    interneuronKnowledgeCoverageAxisCount: interneuronKnowledgeCoverage.axes.length,
    referenceAnatomyPlaneCount: manifest.spatialAssets.atlas.sampledPlaneCount,
    referenceInternalStructureCount: internalCompartmentReport.structureIdentifiers.length,
    referenceInternalComponentCount: internalCompartmentReport.totalComponents,
    referenceInternalPolygonCount: internalCompartmentReport.totalPolygons,
    referenceInternalMissingPlaneCount: internalCompartmentReport.missingPlaneCount,
    russInterneuronCandidateCount: russTaxonomyCrosswalk.scope.displayedInterneuronCandidateCount,
    curatorFeedbackSchemaVersion: curatorFeedbackContract.feedbackSchemaVersion,
    curatorFeedbackContractSchemaVersion: curatorFeedbackContract.schemaVersion,
    curatorFeedbackRequiredResponseKeyCount: curatorFeedbackContract.requiredResponseKeys.length,
    curatorFeedbackOptionalResponseKeyCount: curatorFeedbackContract.optionalResponseKeys.length,
    curatorAdjudicationSchemaVersion: curatorAdjudicationContract.adjudicationSchemaVersion,
    curatorAdjudicationContractSchemaVersion: curatorAdjudicationContract.schemaVersion,
    curatorAdjudicationMinimumIndependentCurators: curatorAdjudicationContract.minimumIndependentCurators,
  };
}

export async function renderStaticIndex() {
  const workerPath = path.join(PROJECT_ROOT, "dist", "server", "index.js");
  await assertRegularFile(workerPath, "dist/server/index.js; run npm run build first");
  const workerUrl = pathToFileURL(workerPath);
  workerUrl.searchParams.set("curatorPackage", String(Date.now()));
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request("http://localhost/workspace", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  if (response.status !== 200) fail("Static render returned HTTP " + response.status);
  const html = await response.text();
  if (!/<html lang="en">/.test(html)) fail("Static render is not declared as English");
  if (containsCjk(html)) fail("Static render contains non-English CJK text");
  if (!/aria-label="Atlas research workspace"/.test(html) || !/id="sci-evidence-workspace"/.test(html)) fail("Static render does not contain the public-data workbench");
  return html;
}

function startHereHtml(identity) {
  const releaseId = escapeHtml(identity.releaseId);
  const manifestHash = escapeHtml(identity.releaseManifestContentSha256);
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    "<title>START HERE — OHRI Mouse Spinal Interneuron Atlas</title>",
    "<style>",
    ":root{font-family:Arial,sans-serif;color:#15231f;background:#edf2ef}body{margin:0}main{max-width:980px;margin:32px auto;padding:0 24px 64px}.hero,.card{background:#fff;border:1px solid #c7d3ce;border-radius:18px;padding:24px;margin:16px 0}.hero{background:#16362e;color:#f7fbf8}.tag{display:inline-block;padding:6px 10px;border-radius:999px;background:#f1c675;color:#2b2416;font-weight:700}h1{font-size:32px;margin:16px 0 8px}h2{margin-top:0}.warning{border-left:5px solid #c0792b;padding-left:14px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}.status{padding:14px;border-radius:12px;background:#f4f7f5}.status b{display:block;font-size:20px}code{overflow-wrap:anywhere}a.button{display:inline-block;background:#0e7c66;color:#fff;text-decoration:none;padding:12px 16px;border-radius:10px;font-weight:700;margin:4px 8px 4px 0}li{margin:8px 0}.small{color:#52615c;font-size:14px}</style>",
    "</head>",
    "<body><main>",
    '<section class="hero">',
    '<span class="tag">PRIVATE CURATOR REVIEW · ' + escapeHtml(DISTRIBUTION_VERSION) + "</span>",
    "<h1>OHRI Mouse Spinal Interneuron Atlas</h1>",
    "<p>English-only localhost public-data workbench candidate. It retains a frozen evidence payload and adds no unreviewed biological asset. This package is not a research-validated atlas and is not authorized for public hosting.</p>",
    "</section>",
    '<section class="card warning">',
    "<h2>Verify before opening</h2>",
    "<p>Compare the SHA-256 of the ZIP with the companion digest supplied by the sender. Extract the ZIP completely; do not run it from inside the archive.</p>",
    "<p><b>Scientific release:</b> <code>" + releaseId + "</code><br><b>Release-manifest content SHA-256:</b> <code>" + manifestHash + "</code><br><b>Registered objects:</b> 0</p>",
    "<p><b>Reference-backed research model:</b> the main anatomy is an INF display derivative from 15 checksum-locked native planes and is measurement-forbidden. Its older gray-matter side surface is only a coarse row-envelope, not a full gray boundary. Seven atlas-source-ID major structures retain 408 separate 4-connected exact mask-edge components and 408 polygons; dorsal funiculus ID 74 at z1470 is explicitly missing. Internal anatomy renders only as plane-local line segments using a seven-color project display-only palette keyed to preserved source IDs. Display colors carry no source/anatomical authority; each exact source color is retained in userData. Internal components are never lofted, filled, joined, manually bridged or cross-plane corresponded. The 65 Russ non-motoneuron interneuron/projection-neuron candidates remain TYPE_LEVEL and unplaced; they are not 65 confirmed interneurons. A five-source by seven-axis matrix reports source-bounded coverage. Tabulae alone retains a direct causal entry for its Vsx2ON ablation experiment; that status is non-transferable beyond the source definition, model, timing and outcome. No cross-study identity, morphology, coordinate or causal join; no OHRI internal experimental data; zero registrations.</p>",
    "<p><b>Public-data policy:</b> seven cataloged public-source leads and twenty-one versioned upgrade gates; a browser-local feasibility planner and a two-lane provenance trace that keeps frozen evidence references separate from declared source routes; a relationship-admission gate that cannot promote a cross-lane edge; deterministic metadata-only source-admission review; assertion-provenance, authorization-plan, and independent authorization-evidence composers; a three-record metadata-only intake registry; a two-format browser-local file-manifest composer; a provenance-only Russ correction dossier; an eight-group, 93-label Tabulae condition index with no source-file body; and a browser-local Tabulae board that never fetches, uploads, bundles, persists, aligns, orders, stacks or quantifies source content.</p>",
    "</section>",
    '<section class="card">',
    "<h2>Launch the atlas</h2>",
    "<ol>",
    "<li><b>macOS:</b> double-click <code>START_MACOS.command</code>. If macOS blocks it, right-click and choose Open, or run it from Terminal.</li>",
    "<li><b>Windows:</b> double-click <code>START_WINDOWS.cmd</code>.</li>",
    "<li><b>Linux:</b> run <code>./START_LINUX.sh</code>.</li>",
    "<li>Keep the terminal window open. The server binds only to <code>127.0.0.1</code>. Stop it with <code>Ctrl+C</code>.</li>",
    "</ol>",
    "<p>The launcher prefers Node.js and can fall back to Python 3. It does not run npm, install dependencies, upload files, or automatically fetch external research data.</p>",
    "</section>",
    '<section class="card">',
    "<h2>Scientific status legend</h2>",
    '<div class="grid">',
    '<div class="status"><b>OBS</b>Observed geometry only in the stated source-local frame.</div>',
    '<div class="status"><b>INF</b>Derived or interpolated reference representation.</div>',
    '<div class="status"><b>SCH</b>Literature-supported schematic pathway.</div>',
    '<div class="status"><b>SYN</b>Project-authored prototype geometry.</div>',
    '<div class="status"><b>REG</b>Validated atlas registration. This release contains none.</div>',
    "</div>",
    "<p class=\"warning\">The INF anatomy is a sampled display derivative, not a full-resolution segmentation and not valid for measurement. Plane-local components and polygons do not establish a cross-plane object. The five NeuroMorpho SWCs are unregistered, non-representative exemplars. They are not mapped to the 65 non-motoneuron candidate populations or seven SCI evidence entities. Co-display is not registration.</p>",
    "</section>",
    '<section class="card">',
    "<h2>Complete the independent review</h2>",
    '<a class="button" href="CURATOR_FEEDBACK_FORM.html">Open feedback form</a>',
    '<a class="button" href="docs/CURATOR_REVIEW_GUIDE.md">Review guide</a>',
    '<a class="button" href="ATTRIBUTIONS.html">Attributions</a>',
    "<p>Review all guide tasks independently. Enter the ZIP SHA-256 from the sender's companion digest into the feedback form, then return the downloaded feedback JSON to the project lead. Do not coordinate responses with the second curator before both forms are submitted.</p>",
    "</section>",
    '<section class="card">',
    "<h2>Distribution boundary</h2>",
    "<p>This package may be shared privately with named curators only while all attribution and source records remain intact. Do not forward, publicly host, or broadly redistribute it. Public deployment and broader redistribution remain subject to institutional review.</p>",
    '<p class="small">Opening an external source link is a deliberate user action. For a strictly offline review, leave the network disconnected and do not follow external links.</p>',
    "</section>",
    "</main></body></html>",
    "",
  ].join("\n");
}

function attributionsHtml() {
  return [
    "<!doctype html>",
    '<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
    "<title>Attributions and source notices</title>",
    "<style>body{font:16px/1.55 Arial,sans-serif;max-width:900px;margin:40px auto;padding:0 24px;color:#172520}section{border-top:1px solid #ccd6d2;padding:18px 0}code{overflow-wrap:anywhere}</style></head><body>",
    "<h1>Attributions and source notices</h1>",
    "<p>These notices must remain with every private curator copy. They are not public-deployment authorization.</p>",
    "<section><h2>BrainGlobe and adult mouse spinal-cord reference</h2>",
    '<p>BrainGlobe Atlases, accessed 2026-08-17 from <a href="https://registry.opendata.aws/brainglobe/">the Registry of Open Data on AWS</a> (CC0 1.0). Cite Claudi et al. 2020, BrainGlobe Atlas API, JOSS 5(54):2668, DOI 10.21105/joss.02668.</p>',
    '<p>Original dataset: Felix Fiederling and Luke Hammond, <i>SC_atlas_P56</i>, Mendeley Data version 1, CC BY 4.0, DOI <a href="https://doi.org/10.17632/4rrggzv5d5.1">10.17632/4rrggzv5d5.1</a>. Associated paper: Fiederling et al. 2021, DOI <a href="https://doi.org/10.1016/j.crmeth.2021.100074">10.1016/j.crmeth.2021.100074</a>.</p></section>',
    "<section><h2>NeuroMorpho.Org morphology exemplars</h2>",
    '<p>NeuroMorpho.Org (RRID:SCR_002145), CC BY 4.0 plus repository terms. Cite Tecuatl C, Ljungquist B, Ascoli GA (2024), FASEB BioAdvances 6(7):207-221, DOI <a href="https://doi.org/10.1096/fba.2024-00048">10.1096/fba.2024-00048</a>, and the original paper for every reconstruction.</p>',
    "<ul><li>NMO 104003 — DOI 10.1038/s41593-018-0119-z</li><li>NMO 108974 and 109005 — DOI 10.1097/j.pain.0000000000001406</li><li>NMO 242822 — DOI 10.1016/j.neuroscience.2020.06.038</li><li>NMO 260150 — DOI 10.1038/s41598-023-32720-3</li></ul>",
    '<p>Terms: <a href="https://neuromorpho.org/useterm.jsp">https://neuromorpho.org/useterm.jsp</a>.</p></section>',
    "<section><h2>Scientific boundary</h2><p>No article figure or article text is copied. The outer-cord and coarse gray-matter row-envelope side surfaces are an INF display loft from 15 native contour planes; the row-envelope is not a full gray boundary. Seven source-ID internal structures render only as plane-local line segments using project display colors keyed to preserved source IDs. Display colors carry no source/anatomical authority; each exact source color is retained in userData. The lines preserve exact mask-edge components/polygons and are never lofted, filled, joined, manually bridged or cross-plane corresponded. Measurement is forbidden. SWCs remain OBS only in source-local frames. Molecular candidates remain TYPE_LEVEL and unplaced. No object is REG.</p></section>",
    "</body></html>",
    "",
  ].join("\n");
}

function feedbackFormHtml(identity) {
  const storyRows = ["US-01 Locate/status", "US-02 Identity axes", "US-03 Causal evidence", "US-04 Model comparison", "US-05 Trace/export/restore", "US-06 Explicit gaps"]
    .map((label, index) => {
      const id = "us0" + (index + 1);
      return '<fieldset><legend>' + escapeHtml(label) + '</legend><label><input type="radio" name="' + id + '" value="accept" required> Accept</label><label><input type="radio" name="' + id + '" value="revise"> Revise</label><label><input type="radio" name="' + id + '" value="unable_to_assess"> Unable to assess</label><textarea name="' + id + '_notes" placeholder="Evidence, stable IDs, uncertainty, or exact correction"></textarea></fieldset>';
    })
    .join("\n");
  return [
    "<!doctype html>",
    '<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
    "<title>Independent curator feedback</title>",
    "<style>body{font:16px/1.45 Arial,sans-serif;background:#eef3f0;color:#172520;margin:0}main{max-width:900px;margin:28px auto;padding:0 20px 60px}section,fieldset{background:#fff;border:1px solid #c8d4cf;border-radius:14px;padding:18px;margin:14px 0}fieldset label{display:inline-block;margin:6px 18px 6px 0}label.block{display:block;margin:12px 0}input[type=text],input[type=date],textarea,select{box-sizing:border-box;width:100%;padding:10px;border:1px solid #9eaea7;border-radius:8px}textarea{min-height:90px}button{background:#0e7c66;color:#fff;border:0;border-radius:9px;padding:13px 18px;font-weight:700}.notice{border-left:5px solid #c17a2c;padding-left:14px}code{overflow-wrap:anywhere}</style></head><body><main>",
    "<h1>Independent curator feedback</h1>",
    '<p class="notice"><b>Local-only form:</b> nothing is uploaded or stored remotely. Your entries remain in this browser page until you download the JSON file. The matching workbench Review tab can import only this exact version and manifest hash.</p>',
    '<form id="review-form">',
    '<section><h2>Release identity</h2><p><b>Distribution:</b> ' + escapeHtml(DISTRIBUTION_VERSION) + '<br><b>Scientific release:</b> <code>' + escapeHtml(identity.releaseId) + '</code><br><b>Manifest:</b> <code>' + escapeHtml(identity.releaseManifestContentSha256) + '</code><br><b>REG count:</b> 0</p>',
    '<label class="block">Curator name or stable reviewer ID<input type="text" name="curator_id" required></label>',
    '<label class="block">Relevant expertise<input type="text" name="expertise" required></label>',
    '<label class="block">Review date<input type="date" name="review_date" required></label>',
    '<label class="block">ZIP SHA-256 verified?<select name="zip_verified" required><option value="">Choose</option><option value="yes">Yes</option><option value="no">No</option></select></label>',
    '<label class="block">ZIP SHA-256 reported by the sender<input type="text" name="zip_sha256" pattern="[A-Fa-f0-9]{64}" maxlength="64" placeholder="64 hexadecimal characters" required></label>',
    "</section>",
    "<section><h2>Six review tasks</h2>" + storyRows + "</section>",
    '<section><h2>Scientific interpretation</h2>',
    '<label class="block">Does the interface keep OBS, INF, SCH, SYN, and REG distinct?<select name="status_interpretation" required><option value="">Choose</option><option>Accept</option><option>Revise</option><option>Unable to assess</option></select></label>',
    '<label class="block">Could any object be mistaken for atlas-registered or measurement-valid?<textarea name="registration_concern" required></textarea></label>',
    '<label class="block">Could the five SWCs be mistaken for a representative sample or census?<textarea name="representativeness_concern" required></textarea></label>',
    "</section>",
    '<section><h2>Claim, evidence, wording, and rights issues</h2>',
    '<label class="block">Stable entity/claim/condition/source IDs and issue<textarea name="evidence_issues"></textarea></label>',
    '<label class="block">Exact replacement wording and its evidence boundary<textarea name="wording_corrections"></textarea></label>',
    '<label class="block">Registration, provenance, or rights concern<textarea name="rights_registration_issues"></textarea></label>',
    "</section>",
    '<section><h2>Overall verdict</h2><label><input type="radio" name="overall_verdict" value="accept" required> Accept engineering candidate</label><label><input type="radio" name="overall_verdict" value="revise"> Revise before further review</label><label><input type="radio" name="overall_verdict" value="unable_to_assess"> Unable to assess</label>',
    '<label class="block">Release blockers, uncertainties, and minimum corrections<textarea name="overall_notes" required></textarea></label>',
    '<label><input type="checkbox" name="attestation" value="confirmed" required> I reported uncertainty rather than inferring missing evidence, and I did not treat co-display as registration.</label>',
    "</section>",
    '<button type="submit">Download completed feedback JSON</button>',
    "</form>",
    '<p id="status" role="status" aria-live="polite"></p>',
    "<script>",
    'document.getElementById("review-form").addEventListener("submit",function(event){event.preventDefault();const form=new FormData(event.currentTarget);const responses={};for(const pair of form.entries())responses[pair[0]]=pair[1];responses.zip_sha256=String(responses.zip_sha256||"").trim().toLowerCase();if(!/^[a-f0-9]{64}$/.test(responses.zip_sha256)){document.getElementById("status").textContent="Enter the 64-character ZIP SHA-256 from the sender’s digest.";return}const payload={feedbackSchemaVersion:"' + identity.curatorFeedbackSchemaVersion + '",distributionVersion:"' + DISTRIBUTION_VERSION + '",releaseId:"' + identity.releaseId + '",releaseManifestContentSha256:"' + identity.releaseManifestContentSha256 + '",registrationCount:0,exportedAt:new Date().toISOString(),responses:responses,privacy:"Created locally; not uploaded."};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download="OHRI-curator-feedback-"+(responses.curator_id||"reviewer")+".json";document.body.appendChild(link);link.click();link.remove();setTimeout(function(){URL.revokeObjectURL(url)},0);document.getElementById("status").textContent="Feedback JSON downloaded. Send that file to the project lead through the approved private channel.";});',
    "</script>",
    "</main></body></html>",
    "",
  ].join("\n");
}

function nodeVerifierSource() {
  return [
    '#!/usr/bin/env node',
    'import { createHash } from "node:crypto";',
    'import { lstat, readFile, readdir, stat } from "node:fs/promises";',
    'import path from "node:path";',
    'import { fileURLToPath } from "node:url";',
    'const root=path.dirname(fileURLToPath(import.meta.url));',
    'const safe=(v)=>typeof v==="string"&&v.length>0&&!v.includes("\\0")&&!path.posix.isAbsolute(v)&&!path.win32.isAbsolute(v)&&!v.replaceAll("\\\\","/").split("/").some((p)=>p===""||p==="."||p==="..");',
    'const sortDeep=(v)=>Array.isArray(v)?v.map(sortDeep):v&&typeof v==="object"?Object.fromEntries(Object.keys(v).sort().map((k)=>[k,sortDeep(v[k])])):v;',
    'const hash=(b)=>createHash("sha256").update(b).digest("hex");',
    'async function list(dir,prefix=""){const out=[];const entries=await readdir(dir,{withFileTypes:true});entries.sort((a,b)=>a.name.localeCompare(b.name));for(const e of entries){const rel=prefix?prefix+"/"+e.name:e.name;const abs=path.join(dir,e.name);const info=await lstat(abs);if(info.isSymbolicLink())throw new Error("Symbolic link forbidden: "+rel);if(info.isDirectory())out.push(...await list(abs,rel));else if(info.isFile())out.push(rel);else throw new Error("Unsupported entry: "+rel)}return out.sort()}',
    'const manifest=JSON.parse(await readFile(path.join(root,"PACKAGE_MANIFEST.json"),"utf8"));',
    'const declaredHash=manifest.manifestContentSha256;delete manifest.manifestContentSha256;',
    'if(hash(Buffer.from(JSON.stringify(sortDeep(manifest))))!==declaredHash)throw new Error("Package manifest self-hash mismatch");',
    'const actual=(await list(root)).filter((p)=>p!=="PACKAGE_MANIFEST.json");',
    'const expected=manifest.files.map((f)=>f.path).sort();',
    'if(JSON.stringify(actual)!==JSON.stringify(expected))throw new Error("Package file set mismatch");',
    'for(const entry of manifest.files){if(!safe(entry.path))throw new Error("Unsafe manifest path: "+entry.path);const abs=path.resolve(root,entry.path);if(!abs.startsWith(root+path.sep))throw new Error("Path escape: "+entry.path);const info=await stat(abs);const bytes=await readFile(abs);if(info.size!==entry.bytes)throw new Error("Byte-count mismatch: "+entry.path);if(hash(bytes)!==entry.sha256)throw new Error("SHA-256 mismatch: "+entry.path)}',
    'console.log("Package verification passed: "+manifest.files.length+" files; 0 REG; "+manifest.distributionVersion);',
    "",
  ].join("\n");
}

function pythonVerifierSource() {
  return [
    "#!/usr/bin/env python3",
    "import hashlib, json, os, pathlib, sys",
    "root = pathlib.Path(__file__).resolve().parent",
    "manifest_path = root / 'PACKAGE_MANIFEST.json'",
    "manifest = json.loads(manifest_path.read_text(encoding='utf-8'))",
    "declared = manifest.pop('manifestContentSha256')",
    "canonical = json.dumps(manifest, sort_keys=True, separators=(',', ':'), ensure_ascii=True).encode('utf-8')",
    "if hashlib.sha256(canonical).hexdigest() != declared: raise SystemExit('Package manifest self-hash mismatch')",
    "expected = sorted(item['path'] for item in manifest['files'])",
    "actual = []",
    "for current, dirs, files in os.walk(root, followlinks=False):",
    "    for name in dirs + files:",
    "        candidate = pathlib.Path(current) / name",
    "        if candidate.is_symlink(): raise SystemExit('Symbolic link forbidden: ' + str(candidate))",
    "    for name in files:",
    "        rel = (pathlib.Path(current) / name).relative_to(root).as_posix()",
    "        if rel != 'PACKAGE_MANIFEST.json': actual.append(rel)",
    "if sorted(actual) != expected: raise SystemExit('Package file set mismatch')",
    "for item in manifest['files']:",
    "    rel = pathlib.PurePosixPath(item['path'])",
    "    if rel.is_absolute() or '..' in rel.parts: raise SystemExit('Unsafe manifest path: ' + item['path'])",
    "    data = (root / pathlib.Path(*rel.parts)).read_bytes()",
    "    if len(data) != item['bytes']: raise SystemExit('Byte-count mismatch: ' + item['path'])",
    "    if hashlib.sha256(data).hexdigest() != item['sha256']: raise SystemExit('SHA-256 mismatch: ' + item['path'])",
    "print('Package verification passed: %d files; 0 REG; %s' % (len(expected), manifest['distributionVersion']))",
    "",
  ].join("\n");
}

function nodeServerSource() {
  return [
    "#!/usr/bin/env node",
    'import { spawn } from "node:child_process";',
    'import { createReadStream } from "node:fs";',
    'import { lstat } from "node:fs/promises";',
    'import http from "node:http";',
    'import path from "node:path";',
    'import { fileURLToPath } from "node:url";',
    'const packageRoot=path.dirname(fileURLToPath(import.meta.url));',
    'const root=path.join(packageRoot,"site");',
    'const requested=Number(process.argv.find((v)=>v.startsWith("--port="))?.split("=")[1]||4173);',
    'if(!Number.isInteger(requested)||requested<1024||requested>65535)throw new Error("Port must be 1024-65535");',
    'const mime={".css":"text/css; charset=utf-8",".csv":"text/csv; charset=utf-8",".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8",".mjs":"text/javascript; charset=utf-8",".png":"image/png",".svg":"image/svg+xml",".swc":"text/plain; charset=utf-8",".txt":"text/plain; charset=utf-8",".woff2":"font/woff2"};',
    'function headers(type){return{"Content-Type":type||"application/octet-stream","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","Cache-Control":"no-store","Content-Security-Policy":"default-src \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: blob:; font-src \'self\' data:; connect-src \'self\'; worker-src \'self\' blob:; object-src \'none\'; base-uri \'none\'; frame-ancestors \'none\'"}}',
    'const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url||"/","http://127.0.0.1");let decoded;try{decoded=decodeURIComponent(url.pathname)}catch{res.writeHead(400,headers("text/plain; charset=utf-8"));res.end("Bad request");return}const rel=decoded==="/"? "index.html":decoded.replace(/^\\/+/, "");const candidate=path.resolve(root,rel);if(candidate!==root&&!candidate.startsWith(root+path.sep)){res.writeHead(403,headers("text/plain; charset=utf-8"));res.end("Forbidden");return}const info=await lstat(candidate).catch(()=>null);if(!info?.isFile()||info.isSymbolicLink()){res.writeHead(404,headers("text/plain; charset=utf-8"));res.end("Not found");return}res.writeHead(200,headers(mime[path.extname(candidate).toLowerCase()]));if(req.method==="HEAD"){res.end();return}createReadStream(candidate).pipe(res)}catch(error){res.writeHead(500,headers("text/plain; charset=utf-8"));res.end("Local server error");console.error(error)}});',
    'function openUrl(url){let command,args;if(process.platform==="darwin"){command="open";args=[url]}else if(process.platform==="win32"){command="cmd";args=["/c","start","",url]}else{command="xdg-open";args=[url]}const child=spawn(command,args,{detached:true,stdio:"ignore"});child.on("error",()=>{});child.unref()}',
    'let port=requested;const listen=()=>server.listen(port,"127.0.0.1",()=>{const url="http://127.0.0.1:"+port+"/";console.log("Curator review site: "+url);console.log("Press Ctrl+C to stop.");if(process.argv.includes("--open"))openUrl(url)});',
    'server.on("error",(error)=>{if(error?.code==="EADDRINUSE"&&port<4199){port+=1;console.log("Port in use; trying 127.0.0.1:"+port);setTimeout(listen,50);return}console.error("Local server could not start: "+error.message);process.exitCode=1});listen();',
    'process.on("SIGINT",()=>server.close(()=>process.exit(0)));',
    "",
  ].join("\n");
}

function macLauncher() {
  return [
    "#!/bin/sh",
    "set -eu",
    'SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"',
    'cd "$SCRIPT_DIR"',
    'if command -v node >/dev/null 2>&1; then node VERIFY_PACKAGE.mjs; exec node LOCAL_SERVER.mjs --open; fi',
    'if command -v python3 >/dev/null 2>&1; then python3 VERIFY_PACKAGE.py; (sleep 1; open http://127.0.0.1:4173/) >/dev/null 2>&1 & cd site; exec python3 -m http.server 4173 --bind 127.0.0.1; fi',
    'echo "Node.js or Python 3 is required. See START_HERE.html."',
    "read -r _",
    "exit 1",
    "",
  ].join("\n");
}

function linuxLauncher() {
  return [
    "#!/bin/sh",
    "set -eu",
    'SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"',
    'cd "$SCRIPT_DIR"',
    'if command -v node >/dev/null 2>&1; then node VERIFY_PACKAGE.mjs; exec node LOCAL_SERVER.mjs --open; fi',
    'if command -v python3 >/dev/null 2>&1; then python3 VERIFY_PACKAGE.py; (sleep 1; command -v xdg-open >/dev/null 2>&1 && xdg-open http://127.0.0.1:4173/) >/dev/null 2>&1 & cd site; exec python3 -m http.server 4173 --bind 127.0.0.1; fi',
    'echo "Node.js or Python 3 is required. See START_HERE.html."',
    "exit 1",
    "",
  ].join("\n");
}

function windowsLauncher() {
  return [
    "@echo off",
    "setlocal",
    'cd /d "%~dp0"',
    "where node >nul 2>nul",
    "if %errorlevel%==0 (",
    "  node VERIFY_PACKAGE.mjs || goto :error",
    "  node LOCAL_SERVER.mjs --open",
    "  goto :eof",
    ")",
    "where py >nul 2>nul",
    "if %errorlevel%==0 (",
    "  py -3 VERIFY_PACKAGE.py || goto :error",
    '  start "" http://127.0.0.1:4173/',
    "  cd site",
    "  py -3 -m http.server 4173 --bind 127.0.0.1",
    "  goto :eof",
    ")",
    "echo Node.js or Python 3 is required. See START_HERE.html.",
    ":error",
    "echo.",
    "echo The curator package did not start.",
    "pause",
    "exit /b 1",
    "",
  ].join("\r\n");
}

function readmeText(identity) {
  return [
    "OHRI MOUSE SPINAL INTERNEURON ATLAS",
    "PRIVATE CURATOR REVIEW PACKAGE " + DISTRIBUTION_VERSION,
    "",
    "Open START_HERE.html first.",
    "",
    "Scientific release: " + identity.releaseId,
    "Schema version: " + identity.schemaVersion,
    "Release-manifest content SHA-256: " + identity.releaseManifestContentSha256,
    "Registered objects: 0",
    "",
    "This is an English-only localhost public-data workbench candidate with a frozen evidence payload.",
    "It is not a complete cell census, connectome, clinical tool, or treatment recommendation.",
    "Reference anatomy: " + identity.referenceAnatomyPlaneCount + " checksum-locked native planes; INF display derivative; coarse gray-matter row-envelope is not a full gray boundary; measurement forbidden; 0 REG.",
    "Internal anatomy: " + identity.referenceInternalStructureCount + " atlas-source-ID major structures; " + identity.referenceInternalComponentCount + " separate 4-connected exact mask-edge components and " + identity.referenceInternalPolygonCount + " polygons; " + identity.referenceInternalMissingPlaneCount + " explicit missing plane; plane-local line segments using project display colors keyed to preserved source IDs; display colors carry no source/anatomical authority and exact source colors remain in userData; never lofted, filled, joined, manually bridged or cross-plane corresponded.",
    "Molecular type landscape: " + identity.russInterneuronCandidateCount + " Russ non-motoneuron interneuron/projection-neuron candidates, not confirmed interneurons; TYPE_LEVEL, unplaced, no exact cross-study identity or morphology join.",
    "Knowledge coverage: " + identity.interneuronKnowledgeCoverageReleaseId + "; " + identity.interneuronKnowledgeCoverageLaneCount + " source lanes by " + identity.interneuronKnowledgeCoverageAxisCount + " precision axes; all mappings remain not_established; Tabulae alone retains source-bounded direct causal status for its Vsx2ON ablation experiment, without cross-source transfer.",
    "The five SWCs are unregistered, non-representative source-local exemplars.",
    "Feasibility planner: " + identity.evidenceFeasibilityPlannerReleaseId + "; " + identity.evidenceFeasibilityPlannerAxisCount + " evidence axes and " + identity.evidenceFeasibilityPlannerRouteCount + " declared source-specific routes; browser receipt only, no external source access or REG.",
    "File-manifest preflight: " + identity.fileAdmissionPreflightId + "; zero candidate files accepted; no data are downloaded or registered.",
    "Local metadata composer: " + identity.fileAdmissionComposerReleaseId + "; " + identity.fileAdmissionComposerFormatCount + " locked manifest formats; browser export only, no source-file upload, download, local hash or registration.",
    "",
    "Private named-curator review is permitted with attribution intact.",
    "Do not forward, publicly host, or broadly redistribute this package.",
    "",
  ].join("\n");
}

async function scanEnglishText(root) {
  const files = await listFiles(root);
  for (const relative of files) {
    if (!TEXT_EXTENSIONS.has(path.extname(relative).toLowerCase())) continue;
    const text = await readFile(path.join(root, relative), "utf8");
    if (containsCjk(text)) fail("Non-English CJK text found in package file: " + relative);
  }
}

async function buildEntries(root) {
  const files = (await listFiles(root)).filter((relative) => relative !== "PACKAGE_MANIFEST.json");
  return Promise.all(
    files.map(async (relative) => {
      const absolute = path.join(root, relative);
      const info = await stat(absolute);
      return { path: relative, bytes: info.size, sha256: await sha256File(absolute) };
    }),
  );
}

async function writePackageManifest(identity) {
  const body = {
    packageManifestVersion: "1.0.0",
    distributionVersion: DISTRIBUTION_VERSION,
    packageTimestamp: PACKAGE_TIMESTAMP,
    scientificRelease: identity,
    distributionScope: "private_named_curator_review_only",
    publicDeploymentAuthorized: false,
    automaticExternalRequests: false,
    requiredRuntime: "Node.js or Python 3 standard library; no npm install",
    files: await buildEntries(PACKAGE_ROOT),
  };
  const manifest = { ...body, manifestContentSha256: sha256Buffer(Buffer.from(canonicalJson(body))) };
  await writeText("PACKAGE_MANIFEST.json", JSON.stringify(manifest, null, 2) + "\n");
  return manifest;
}

export async function verifyPackageDirectory(root = PACKAGE_ROOT) {
  const manifestPath = path.join(root, "PACKAGE_MANIFEST.json");
  await assertRegularFile(manifestPath);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const declared = manifest.manifestContentSha256;
  const body = { ...manifest };
  delete body.manifestContentSha256;
  if (sha256Buffer(Buffer.from(canonicalJson(body))) !== declared) fail("Package manifest self-hash mismatch");
  if (manifest.scientificRelease?.registrationCount !== 0) fail("Package manifest registration count must be zero");
  if (manifest.publicDeploymentAuthorized !== false) fail("Package must not authorize public deployment");
  if (!Array.isArray(manifest.files) || manifest.files.length === 0) fail("Package manifest has no files");
  const expected = manifest.files.map((entry) => entry.path).sort();
  if (new Set(expected).size !== expected.length) fail("Package manifest contains duplicate paths");
  for (const relative of expected) if (!isSafeRelativePath(relative)) fail("Unsafe package-manifest path: " + relative);
  const actual = (await listFiles(root)).filter((relative) => relative !== "PACKAGE_MANIFEST.json").sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) fail("Package file set differs from manifest");
  for (const entry of manifest.files) {
    const absolute = path.resolve(root, entry.path);
    if (!absolute.startsWith(root + path.sep)) fail("Package-manifest path escape: " + entry.path);
    const info = await stat(absolute);
    if (info.size !== entry.bytes) fail("Package byte-count mismatch: " + entry.path);
    if (await sha256File(absolute) !== entry.sha256) fail("Package SHA-256 mismatch: " + entry.path);
  }
  await scanEnglishText(root);
  return manifest;
}

async function normalizeTimesAndModes(root) {
  const files = await listFiles(root);
  for (const relative of files) {
    const absolute = path.join(root, relative);
    const executable = ["START_MACOS.command", "START_LINUX.sh", "LOCAL_SERVER.mjs", "VERIFY_PACKAGE.mjs", "VERIFY_PACKAGE.py"].includes(relative);
    await chmod(absolute, executable ? 0o755 : 0o644);
    await utimes(absolute, FIXED_DATE, FIXED_DATE);
  }
  const directories = [];
  async function walk(current) {
    directories.push(current);
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) if (entry.isDirectory()) await walk(path.join(current, entry.name));
  }
  await walk(root);
  for (const directory of directories.reverse()) {
    await chmod(directory, 0o755);
    await utimes(directory, FIXED_DATE, FIXED_DATE);
  }
}

async function createZip() {
  await rm(ZIP_PATH, { force: true });
  await rm(ZIP_SHA_PATH, { force: true });
  const files = await listFiles(PACKAGE_ROOT);
  const archiveEntries = files.map((relative) => PACKAGE_BASENAME + "/" + relative);
  execFileSync("/usr/bin/zip", ["-X", "-q", ZIP_PATH, ...archiveEntries], {
    cwd: RELEASE_DIR,
    stdio: "inherit",
  });
  execFileSync("/usr/bin/unzip", ["-tqq", ZIP_PATH], { stdio: "inherit" });
  const digest = await sha256File(ZIP_PATH);
  await writeFile(ZIP_SHA_PATH, digest + "  " + path.basename(ZIP_PATH) + "\n", "utf8");
  return digest;
}

async function verifyZip(root = PACKAGE_ROOT) {
  await assertRegularFile(ZIP_PATH);
  await assertRegularFile(ZIP_SHA_PATH);
  const line = (await readFile(ZIP_SHA_PATH, "utf8")).trim();
  const expected = line.match(/^([a-f0-9]{64}) {2}(.+\.zip)$/);
  if (!expected || expected[2] !== path.basename(ZIP_PATH)) fail("ZIP checksum sidecar is invalid");
  if (await sha256File(ZIP_PATH) !== expected[1]) fail("ZIP SHA-256 does not match sidecar");
  execFileSync("/usr/bin/unzip", ["-tqq", ZIP_PATH], { stdio: "inherit" });
  const archiveFiles = execFileSync("/usr/bin/unzip", ["-Z1", ZIP_PATH], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .sort();
  const expectedFiles = (await listFiles(root)).map((relative) => PACKAGE_BASENAME + "/" + relative).sort();
  if (JSON.stringify(archiveFiles) !== JSON.stringify(expectedFiles)) fail("ZIP file set differs from extracted package");
  return expected[1];
}

export async function writeCuratorPackage() {
  const distClient = path.join(PROJECT_ROOT, "dist", "client");
  const distInfo = await lstat(distClient).catch(() => null);
  if (!distInfo?.isDirectory()) fail("dist/client is missing; run npm run build first");
  const identity = await loadReleaseIdentity();
  await rm(PACKAGE_ROOT, { recursive: true, force: true });
  await mkdir(PACKAGE_ROOT, { recursive: true });
  await copyTree(distClient, path.join(PACKAGE_ROOT, "site"));
  await writeText("site/index.html", await renderStaticIndex());
  for (const name of SITE_REQUIRED_ASSET_ALLOWLIST) {
    await assertRegularFile(path.join(PACKAGE_ROOT, "site", name), "approved built-site asset " + name);
  }
  for (const name of DOCUMENT_ALLOWLIST) {
    await copyApproved(path.join(PROJECT_ROOT, "docs", name), "docs/" + name);
  }
  for (const name of DATA_ALLOWLIST) {
    await copyApproved(path.join(PROJECT_ROOT, "data", name), "data/" + name);
  }
  await copyApproved(
    path.join(PROJECT_ROOT, "schemas", "research-mvp-release.schema.json"),
    "schemas/research-mvp-release.schema.json",
  );
  await copyApproved(
    path.join(PROJECT_ROOT, "schemas", "public-data-catalog-0.4.schema.json"),
    "schemas/public-data-catalog-0.4.schema.json",
  );
  await copyApproved(
    path.join(PROJECT_ROOT, "schemas", "russ-harmonized-taxonomy-crosswalk-0.1.schema.json"),
    "schemas/russ-harmonized-taxonomy-crosswalk-0.1.schema.json",
  );
  await copyApproved(
    path.join(PROJECT_ROOT, "schemas", "russ-reconciliation-dossier-0.1.schema.json"),
    "schemas/russ-reconciliation-dossier-0.1.schema.json",
  );
  await copyApproved(
    path.join(PROJECT_ROOT, "schemas", "tabulae-condition-catalog-0.1.schema.json"),
    "schemas/tabulae-condition-catalog-0.1.schema.json",
  );
  await copyApproved(
    path.join(PROJECT_ROOT, "schemas", "tabulae-spatial-local-session-0.1.schema.json"),
    "schemas/tabulae-spatial-local-session-0.1.schema.json",
  );
  await copyApproved(
    path.join(PROJECT_ROOT, "schemas", "tabulae-spatial-local-comparison-0.1.schema.json"),
    "schemas/tabulae-spatial-local-comparison-0.1.schema.json",
  );
  await copyApproved(
    path.join(PROJECT_ROOT, "schemas", "public-source-intake.schema.json"),
    "schemas/public-source-intake.schema.json",
  );
  await copyApproved(
    path.join(PROJECT_ROOT, "schemas", "public-source-intake-registry-0.7.schema.json"),
    "schemas/public-source-intake-registry-0.7.schema.json",
  );
  await copyApproved(
    path.join(PROJECT_ROOT, "schemas", "public-file-admission-manifest-0.7.schema.json"),
    "schemas/public-file-admission-manifest-0.7.schema.json",
  );
  await copyApproved(
    path.join(PROJECT_ROOT, "schemas", "public-file-admission-preflight-0.7.schema.json"),
    "schemas/public-file-admission-preflight-0.7.schema.json",
  );
  await copyApproved(path.join(PROJECT_ROOT, "schemas", "public-file-admission-manifest-0.8.schema.json"), "schemas/public-file-admission-manifest-0.8.schema.json");
  await copyApproved(path.join(PROJECT_ROOT, "schemas", "public-file-admission-preflight-0.8.schema.json"), "schemas/public-file-admission-preflight-0.8.schema.json");
  await copyApproved(path.join(PROJECT_ROOT, "schemas", "public-file-admission-composer-0.1.schema.json"), "schemas/public-file-admission-composer-0.1.schema.json");
  await copyApproved(path.join(PROJECT_ROOT, "schemas", "public-provenance-crate-0.1.schema.json"), "schemas/public-provenance-crate-0.1.schema.json");
  await copyApproved(path.join(PROJECT_ROOT, "schemas", "evidence-feasibility-planner-0.1.schema.json"), "schemas/evidence-feasibility-planner-0.1.schema.json");
  await copyApproved(path.join(PROJECT_ROOT, "schemas", "evidence-provenance-trace-0.1.schema.json"), "schemas/evidence-provenance-trace-0.1.schema.json");
  await copyApproved(path.join(PROJECT_ROOT, "schemas", "cross-lane-relationship-admission-0.1.schema.json"), "schemas/cross-lane-relationship-admission-0.1.schema.json");
  await copyApproved(path.join(PROJECT_ROOT, "schemas", "public-source-release-admission-service-0.1.schema.json"), "schemas/public-source-release-admission-service-0.1.schema.json");
  await copyApproved(path.join(PROJECT_ROOT, "schemas", "public-source-assertion-provenance-0.1.schema.json"), "schemas/public-source-assertion-provenance-0.1.schema.json");
  await copyApproved(path.join(PROJECT_ROOT, "schemas", "public-source-authorization-plan-0.1.schema.json"), "schemas/public-source-authorization-plan-0.1.schema.json");
  await copyApproved(path.join(PROJECT_ROOT, "schemas", "public-source-independent-authorization-evidence-0.1.schema.json"), "schemas/public-source-independent-authorization-evidence-0.1.schema.json");
  await copyApproved(path.join(PROJECT_ROOT, "schemas", "interneuron-knowledge-coverage-0.1.schema.json"), "schemas/interneuron-knowledge-coverage-0.1.schema.json");
  await copyApproved(
    path.join(PROJECT_ROOT, "schemas", "curator-feedback-contract-2.8.schema.json"),
    "schemas/curator-feedback-contract-2.8.schema.json",
  );
  await copyApproved(
    path.join(PROJECT_ROOT, "schemas", "curator-adjudication-contract-2.8.schema.json"),
    "schemas/curator-adjudication-contract-2.8.schema.json",
  );
  await copyApproved(
    path.resolve(PROJECT_ROOT, "..", "interneuron_sci_review", "02_EVIDENCE", "EVIDENCE_LEDGER.md"),
    "evidence/EVIDENCE_LEDGER.md",
  );
  await copyApproved(
    path.resolve(PROJECT_ROOT, "..", "interneuron_sci_review", "01_LITERATURE", "SOURCE_MANIFEST.tsv"),
    "evidence/SOURCE_MANIFEST.tsv",
  );
  await writeText("START_HERE.html", startHereHtml(identity));
  await writeText("ATTRIBUTIONS.html", attributionsHtml());
  await writeText("CURATOR_FEEDBACK_FORM.html", feedbackFormHtml(identity));
  await writeText("README.txt", readmeText(identity));
  await writeText("VERIFY_PACKAGE.mjs", nodeVerifierSource(), 0o755);
  await writeText("VERIFY_PACKAGE.py", pythonVerifierSource(), 0o755);
  await writeText("LOCAL_SERVER.mjs", nodeServerSource(), 0o755);
  await writeText("START_MACOS.command", macLauncher(), 0o755);
  await writeText("START_LINUX.sh", linuxLauncher(), 0o755);
  await writeText("START_WINDOWS.cmd", windowsLauncher());
  await scanEnglishText(PACKAGE_ROOT);
  const manifest = await writePackageManifest(identity);
  await normalizeTimesAndModes(PACKAGE_ROOT);
  await verifyPackageDirectory(PACKAGE_ROOT);
  const zipSha256 = await createZip();
  await verifyZip(PACKAGE_ROOT);
  return { manifest, zipPath: ZIP_PATH, zipSha256, checksumPath: ZIP_SHA_PATH };
}

export async function checkCuratorPackage() {
  const manifest = await verifyPackageDirectory(PACKAGE_ROOT);
  const zipSha256 = await verifyZip(PACKAGE_ROOT);
  return { manifest, zipPath: ZIP_PATH, zipSha256, checksumPath: ZIP_SHA_PATH };
}

async function main() {
  const argument = process.argv[2] ?? "--check";
  if (!["--check", "--write"].includes(argument) || process.argv.length > 3) {
    fail("Usage: node scripts/package-curator-review.mjs [--check|--write]");
  }
  const result = argument === "--write" ? await writeCuratorPackage() : await checkCuratorPackage();
  console.log(
    (argument === "--write" ? "Curator package written and verified: " : "Curator package verification passed: ")
      + result.manifest.files.length
      + " files; 0 REG; ZIP SHA-256 "
      + result.zipSha256,
  );
  console.log(result.zipPath);
  console.log(result.checksumPath);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    console.error("Curator package failed: " + (error instanceof Error ? error.message : String(error)));
    process.exitCode = 1;
  });
}
