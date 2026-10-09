#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  MOLECULAR_COMPLETENESS_SLOT_IDS,
  selectMolecularCompletenessSlots,
} from "../app/research-record-presentation.js";
import { deriveResearchSourceRegistrySummary } from "../app/research-source-registry-summary.js";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import {
  validateCanoGomezP56MultiomeInterneuronRegistryPackage,
} from "../scripts/validate-cano-gomez-p56-multiome-interneuron-registry-0.1.mjs";
import {
  validateResearchSourceRegistry,
  validateResearchSourceUpgradeLinks,
} from "../scripts/validate-research-source-registry-0.1.mjs";
import {
  validateResearchSourceRegistryDenominators,
} from "../scripts/validate-research-source-registry-denominators.mjs";
import {
  buildNeurolucidaNativeContourAdmissionCatalog03,
} from "./build_neurolucida_native_contour_admission_catalog_0_3.mjs";
import {
  buildCanonicalRegistry,
  stableJson as stableUpgradeRegistryJson,
} from "./build_research_upgrade_registry.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.41.json");
const PARENT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.40.json");
const CANO_DATA_DIRECTORY = "public/data/cano_gomez_p56_multiome_interneuron_v1";
const CANO_REGISTRY_PATH = `${CANO_DATA_DIRECTORY}/cano-gomez-p56-multiome-interneuron-registry-0.1.json`;

export const RESEARCH_ITERATION_241_PARENT = Object.freeze({
  path: "data/research-iteration-manifest-2.40.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.40.0",
  bytes: 206354,
  fileSha256: "5552cc8c46c35a26fbefed4090f4a2d0337eda2397639ea5eca807fdf4cf6d30",
  contentSha256: "991885f465d6226ec9d23fe133238e62c32e253276b120ed54fd74a4a632b48f",
});

export const RESEARCH_ITERATION_241_PURPOSE_OVERRIDES = Object.freeze({
  researchSourceRegistry: "Canonical live 27-source, 34-record-set registry with ten exact cell/profile rosters and one exact source-object set",
  researchModelUpgradeRegistry: "Deterministic 186-row research/model upgrade registry with UPG-200 through UPG-204 completed",
  packageLock: "Exact 2.41 JavaScript dependency graph",
  researchExplorerAssetManifest: "Research Explorer 1.13 manifest with 21 checksum-addressed source inputs",
  researchExplorerSearchIndex: "Research Explorer 1.13 index with 641 records, 387 molecular profiles and ten molecular namespaces",
  atlasFocusSynchronization: "Single verified active-record ownership across search, evidence and visualization-authority roles",
  typeAtlasFingerprintIntegration: "Ten-namespace Type Atlas including eleven source-explicit Cano-Gomez CHOL_IN profiles",
  researchExplorerFingerprintIntegration: "Search and dossier consumer of the canonical active-record provider",
  researchExplorerIndexRuntime: "Checksum-verified Research Explorer loader used only by the canonical active-record provider",
  atlasTypeContracts: "Typed 2.41 manifest, registry summaries, Todd 0.3 catalog and Cano-Gomez registry exports",
  applicationPackage: "Application version and deterministic 2.41 validation routes",
  projectReadme: "Current 2.41 evidence scope, exact denominators and zero-authority boundaries",
  researchUpgradeQueue: "Evidence-gated research/model queue with UPG-200 through UPG-204 completed",
  researchDataLab: "Registry-derived source-tab denominator display",
  researchOverview: "Registry-derived overview denominators and source-bounded research summary",
  atlasStylesheet: "Active-record, selection-delta and record-specific evidence presentation styles",
  researchExplorerBuilder: "Deterministic 641-record Explorer 1.13 builder including Cano-Gomez profiles",
  researchExplorerValidator: "Explorer 1.13, 21-source and Cano-Gomez boundary validator",
  researchExplorerTest: "Explorer 1.13 reproducibility, denominator and mutation regressions",
  researchSourceRegistryValidator: "Twenty-seven-source, 34-record-set, ten-exact-roster and one exact-object-set validator",
  researchSourceRegistryTest: "Canonical source-registry regressions including Todd 0.3 and Cano-Gomez profile routing",
  currentResearchTestRunner: "Current-iteration test discovery with immutable snapshot validation through 2.40",
  researchFocusEvidencePanel: "Verified active-record evidence consumer with no independent record lookup",
  researchUpgradeRegistryBuilder: "Deterministic UPG-022-through-UPG-204 registry builder",
  researchUpgradeRegistryValidator: "186-row upgrade-registry validator with UPG-200 through UPG-204 closure",
  researchUpgradeRegistryTest: "UPG-022-through-UPG-204 deterministic and mutation tests",
  applicationLayout: "Current English metadata and 2.41 application label",
  observedMorphologyRuntimeContractTest: "Current 2.41 morphology identity and active-record isolation regressions",
  researchRecordPresentationRuntime: "Fixed eight-slot record presentation consumed by selection-delta receipts",
  researchRecordModelReadout: "Verified active-record visualization-authority consumer",
  researchRecordPresentationTest: "Cross-record fixed-slot, missingness and zero-fallback regressions",
  nativeContourAdmissionRuntime: "Fail-closed five-record Todd-aware catalog and geometry runtime",
  nativeContourRecordViewer: "Identity-gated 48-LineLoop source-native contour viewer",
  observedMorphologyRouteLibrary: "Per-record Todd MBF Cell Body admission and source-flag disclosure",
});

export const RESEARCH_ITERATION_241_ADDITIONAL_INPUTS = Object.freeze([
  ["researchActiveRecordRuntime", "app/research-active-record.js", "Canonical active-record identity, generation and stale-settlement runtime"],
  ["researchActiveRecordProvider", "app/ResearchActiveRecordProvider.tsx", "Single tree-scoped verified-index and active-record provider"],
  ["researchActiveRecordTest", "tests/research-active-record.test.mjs", "Active-record state-machine and stale-settlement mutation tests"],
  ["researchActiveRecordIntegrationTest", "tests/research-active-record-integration.test.mjs", "Single-loader and shared-consumer integration regressions"],
  ["researchSourceRegistrySummaryRuntime", "app/research-source-registry-summary.js", "Registry-derived four-denominator summary runtime"],
  ["researchSourceRegistryDenominatorValidator", "scripts/validate-research-source-registry-denominators.mjs", "Dynamic-denominator wiring and stale-literal validator"],
  ["researchSourceRegistrySummaryTest", "tests/research-source-registry-summary.test.mjs", "Registry-summary derivation and stale-literal mutation tests"],
  ["researchSourceRegistryComponent", "app/ResearchSourceRegistry.tsx", "Registry-derived source, record-set, roster and object-set displays"],
  ["researchSelectionDeltaRuntime", "app/research-selection-delta.js", "Adjacent verified-selection presentation-delta contract"],
  ["researchSelectionDeltaReceipt", "app/ResearchSelectionDeltaReceipt.tsx", "Evidence-slot, locator and visualization-count delta receipt UI"],
  ["researchSelectionDeltaTest", "tests/research-selection-delta.test.mjs", "Selection-delta sequence, identity and non-biological-boundary tests"],
  ["nativeContourCatalog03Builder", "tools/build_neurolucida_native_contour_admission_catalog_0_3.mjs", "Checksum, MBF-property and pinned-parser Todd LineLoop builder"],
  ["nativeContourAdmissionCatalog03", "data/neurolucida-native-contour-admission-catalog-0.3.json", "Five-record catalog with 48 admitted LineLoops and 2,379 vertices"],
  ["nativeContourCatalog03Schema", "schemas/neurolucida-native-contour-admission-catalog-0.3.schema.json", "Strict Todd-aware native-contour catalog schema"],
  ["nativeContourCatalog03Validator", "scripts/validate-neurolucida-native-contour-admission-catalog-0.3.mjs", "Catalog, three-derivative and zero-authority validator"],
  ["nativeContourCatalog03Test", "tests/neurolucida-native-contour-admission-catalog-0.3.test.mjs", "Todd admission, raw-flag preservation and mutation tests"],
  ["nmo50424MbfCellBodyGeometry", "public/data/functional_class_observed_morphology_route_pack_v1/native-contours/nmo-50424-mbf-cell-body-line-loops.json", "Exact eight-loop, 427-vertex NMO 50424 MBF Cell Body geometry"],
  ["nmo50394MbfCellBodyGeometry", "public/data/prp_dorsal_horn_observed_morphology_route_pack_v1/native-contours/nmo-50394-mbf-cell-body-line-loops.json", "Exact fourteen-loop, 768-vertex NMO 50394 MBF Cell Body geometry"],
  ["nmo50408MbfCellBodyGeometry", "public/data/prp_dorsal_horn_observed_morphology_route_pack_v1/native-contours/nmo-50408-mbf-cell-body-line-loops.json", "Exact eleven-loop, 709-vertex NMO 50408 MBF Cell Body geometry"],
  ["canoGomezRMetadataExtractor", "tools/extract_cano_gomez_multiome_metadata.R", "Strict SeuratObject identity and metadata receipt extractor"],
  ["canoGomezPythonMetadataExtractor", "tools/extract_cano_gomez_rds_metadata.py", "Checksum-pinned meta.data-row-only clean-room extractor"],
  ["canoGomezPythonRuntimeContract", "tools/cano_gomez_python_rdata_runtime-0.1.json", "Pinned Python, rdata and patched-parser runtime receipt"],
  ["canoGomezPythonParserPatch", "tools/patches/rdata-0.11.2-seurat-rds-parser.patch", "Auditable narrow parser patch for supported RDS object tags"],
  ["canoGomezStreamRExtractor", "tools/extract_cano_gomez_rds_metadata_stream.R", "Base-R source-stream metadata-row extraction helper"],
  ["canoGomezStreamOrchestrator", "tools/extract_cano_gomez_rds_metadata_stream.py", "Exact-byte and SHA-verified RDS-to-R streaming orchestrator"],
  ["canoGomezRExtractorTest", "tests/cano-gomez-multiome-metadata-extractor.test.mjs", "Static strict-R extraction contract tests"],
  ["canoGomezPythonExtractorTest", "tests/cano-gomez-python-clean-room-extractor.test.mjs", "Clean-room extractor fixture, receipt and mutation tests"],
  ["canoGomezStreamExtractorTest", "tests/cano-gomez-base-r-stream-extractor.test.mjs", "Base-R streaming protocol, hash and failure-path tests"],
  ["canoGomezRegistryBuilder", "tools/build_cano_gomez_p56_multiome_interneuron_registry.mjs", "Fail-closed 169,345-row classification and deterministic artifact builder"],
  ["canoGomezRegistrySchema", "schemas/cano-gomez-p56-multiome-interneuron-registry-0.1.schema.json", "Strict source-local Cano-Gomez registry schema"],
  ["canoGomezRegistryValidator", "scripts/validate-cano-gomez-p56-multiome-interneuron-registry-0.1.mjs", "Artifact, denominator, identity and exclusion-policy validator"],
  ["canoGomezRegistryTest", "tests/cano-gomez-p56-multiome-interneuron-registry.test.mjs", "Full-denominator fixture, classification and mutation tests"],
  ["canoGomezRegistryFixture", "tests/fixtures/cano-gomez-p56-multiome/fixture-spec.json", "Exact CHOL_IN and exclusion-denominator fixture specification"],
  ["canoGomezAllNucleusAudit", `${CANO_DATA_DIRECTORY}/GSE318731_all_nucleus_assignment_audit.csv.gz`, "Exact 169,345-row all-nucleus scope-decision audit"],
  ["canoGomezConfirmedNucleusRoster", `${CANO_DATA_DIRECTORY}/GSE318731_confirmed_interneuron_nucleus_roster.csv.gz`, "Exact 923-row source-explicit CHOL_IN nucleus roster"],
  ["canoGomezInterneuronRegistry", CANO_REGISTRY_PATH, "Eleven-profile source-local Cano-Gomez interneuron registry"],
  ["researchIteration240SnapshotValidator", "scripts/validate-research-iteration-manifest-2.40-snapshot.mjs", "Immutable 2.40 parent snapshot validator independent of live 2.41 inputs"],
  ["researchIteration240SnapshotTest", "tests/research-iteration-manifest-2.40-snapshot.test.mjs", "Immutable 2.40 parent receipt and mutation tests"],
  ["researchTimeline241", "docs/RESEARCH_TIMELINE_2026-09-02_ITERATION_2_41.md", "Unique in-place 2.41 outcome, validation and file-specific rollback record"],
  ["researchIteration241Builder", "tools/build_research_iteration_manifest_2_41.mjs", "Deterministic immutable-child 2.41 manifest builder"],
  ["researchIteration241Schema", "schemas/research-iteration-manifest-2.41.schema.json", "Strict JSON Schema for the 2.41 iteration manifest"],
  ["researchIteration241Validator", "scripts/validate-research-iteration-manifest-2.41.mjs", "Deterministic receipt and scientific-boundary validator for 2.41"],
  ["researchIteration241Test", "tests/research-iteration-manifest-2.41.test.mjs", "2.41 byte-rebuild, parent, denominator and mutation regressions"],
].map(([id, inputPath, purpose]) => Object.freeze({ id, scope: "project", path: inputPath, purpose })));

const EXPECTED_PARENT_INPUT_COUNT = 187;
export const RESEARCH_ITERATION_241_EXPECTED_INPUT_COUNT = 230;
const EXPECTED_UPGRADE_COUNT = 186;
const COMPLETED_UPGRADE_IDS = Object.freeze(["UPG-200", "UPG-201", "UPG-202", "UPG-203", "UPG-204"]);
const RETAINED_COMPLETED_UPGRADE_IDS = Object.freeze(["UPG-197", "UPG-198", "UPG-199", ...COMPLETED_UPGRADE_IDS]);

const INHERITED_RECEIPT_IDS = Object.freeze([
  "researchSourceRegistry", "researchModelUpgradeRegistry", "packageLock",
  "researchExplorerAssetManifest", "researchExplorerSearchIndex",
  "atlasFocusSynchronization", "typeAtlasFingerprintIntegration",
  "researchExplorerFingerprintIntegration", "researchExplorerIndexRuntime",
  "atlasTypeContracts", "applicationPackage", "projectReadme",
  "researchUpgradeQueue", "researchDataLab", "researchOverview",
  "atlasStylesheet", "researchExplorerBuilder", "researchExplorerValidator",
  "researchExplorerTest", "researchSourceRegistryValidator",
  "researchSourceRegistryTest", "currentResearchTestRunner",
  "researchFocusEvidencePanel", "researchUpgradeRegistryBuilder",
  "researchUpgradeRegistryValidator", "researchUpgradeRegistryTest",
  "applicationLayout", "observedMorphologyRuntimeContractTest",
  "researchRecordPresentationRuntime", "researchRecordModelReadout",
  "researchRecordPresentationTest", "nativeContourAdmissionRuntime",
  "nativeContourRecordViewer", "observedMorphologyRouteLibrary",
]);

export const RESEARCH_ITERATION_241_RECEIPT_INPUT_IDS = Object.freeze([
  ...INHERITED_RECEIPT_IDS,
  ...RESEARCH_ITERATION_241_ADDITIONAL_INPUTS.map((input) => input.id),
]);

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function receipt(input, bytes) {
  return { ...input, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

function simpleReceipt(input) {
  return { path: input.path, bytes: input.bytes, sha256: input.sha256 };
}

function getInput(manifest, id) {
  const input = manifest.authoritativeInputs.find((candidate) => candidate.id === id);
  check(input, `2.41 manifest is missing input ${id}`);
  return input;
}

function assertText(bytes, snippets, label) {
  const source = bytes.toString("utf8");
  for (const snippet of snippets) check(source.includes(snippet), `${label} is missing ${snippet}`);
}

function sourcePath(parent, input) {
  const root = parent.inputRoots?.[input.scope];
  check(root?.locator, `parent has no input root for ${input.scope}`);
  const base = path.resolve(PROJECT_ROOT, root.locator);
  const resolved = path.resolve(base, input.path);
  const relative = path.relative(base, resolved);
  check(!relative.startsWith("..") && !path.isAbsolute(relative), `${input.id} escapes its input root`);
  return resolved;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

async function validateCurrentInputs(sources, envelope) {
  const registry = JSON.parse(sources.get("researchSourceRegistry").toString("utf8"));
  const upgrades = JSON.parse(sources.get("researchModelUpgradeRegistry").toString("utf8"));
  const catalog = JSON.parse(sources.get("nativeContourAdmissionCatalog03").toString("utf8"));
  const explorer = JSON.parse(sources.get("researchExplorerSearchIndex").toString("utf8"));
  const explorerManifest = JSON.parse(sources.get("researchExplorerAssetManifest").toString("utf8"));
  const cano = JSON.parse(sources.get("canoGomezInterneuronRegistry").toString("utf8"));
  const applicationPackage = JSON.parse(sources.get("applicationPackage").toString("utf8"));
  const packageLock = JSON.parse(sources.get("packageLock").toString("utf8"));

  validateResearchSourceRegistry(registry);
  validateResearchSourceUpgradeLinks(registry, upgrades);
  const registrySummary = deriveResearchSourceRegistrySummary(registry);
  const denominatorReceipt = await validateResearchSourceRegistryDenominators({ registry });
  check(registrySummary.sourceCount === 27, "canonical source count drifted");
  check(registrySummary.recordSetCount === 34, "canonical record-set count drifted");
  check(registrySummary.bundledExactCellProfileRosterCount === 10, "exact cell/profile roster denominator drifted");
  check(registrySummary.bundledExactSourceObjectSetCount === 1, "exact source-object set denominator drifted");
  check(denominatorReceipt.staleLiteralCount === 0, "stale UI denominator literals remain");

  const recordSets = registry.sources.flatMap((source) => source.recordSets ?? []);
  const canoSource = registry.sources.find((source) => source.id === "SRC-CANOGOMEZ-2026");
  const canoRecordSets = (canoSource?.recordSets ?? []).filter((recordSet) => recordSet.dataPath === CANO_REGISTRY_PATH);
  check(canoRecordSets.length === 1, "Cano-Gomez exact profile record set is missing or duplicated");
  const canoRecordSet = canoRecordSets[0];
  check(canoRecordSet.parentSourceId === "SRC-CANOGOMEZ-2026", "Cano-Gomez record-set parent drifted");
  check(canoRecordSet.includedRecordCount?.value === 11, "Cano-Gomez profile denominator drifted");
  check(canoRecordSet.childRosterRef?.status === "bundled_exact" && canoRecordSet.childRosterRef?.path === CANO_REGISTRY_PATH, "Cano-Gomez profile roster is not bundled exactly");
  check(canoSource.linkedUpgradeIds?.includes("UPG-204"), "Cano-Gomez source is not linked to UPG-204");
  const nativeRecordSet = recordSets.find((recordSet) => recordSet.recordSetId === "RS-NEUROMORPHO-NATIVE-CONTOUR-ADMISSION-CATALOG");
  check(nativeRecordSet?.dataPath === "data/neurolucida-native-contour-admission-catalog-0.3.json", "native-contour registry route did not advance to 0.3");
  check(nativeRecordSet?.sourceObjectSetRef?.status === "bundled_exact" && nativeRecordSet.sourceObjectSetRef.path === nativeRecordSet.dataPath, "native-contour catalog must remain one exact source-object set");

  const rebuiltUpgradeRegistry = await buildCanonicalRegistry();
  check(Buffer.from(stableUpgradeRegistryJson(rebuiltUpgradeRegistry), "utf8").equals(sources.get("researchModelUpgradeRegistry")), "research upgrade registry is not byte-reproducible from the queue");
  check(upgrades.summary?.upgradeCount === envelope.upgradeCount && upgrades.upgrades?.length === envelope.upgradeCount, "research upgrade count drifted");
  check(upgrades.upgrades.at(-1)?.id === envelope.lastUpgradeId, "last research upgrade drifted");
  for (const id of RETAINED_COMPLETED_UPGRADE_IDS) {
    check(/^completed\b/.test(upgrades.upgrades.find((item) => item.id === id)?.status ?? ""), `${id} must be completed`);
  }

  const rebuiltCatalog = await buildNeurolucidaNativeContourAdmissionCatalog03();
  check(rebuiltCatalog.catalogBytes.equals(sources.get("nativeContourAdmissionCatalog03")), "native-contour 0.3 catalog is not byte-reproducible");
  const geometryInputByNeuronId = new Map([
    [50424, "nmo50424MbfCellBodyGeometry"],
    [50394, "nmo50394MbfCellBodyGeometry"],
    [50408, "nmo50408MbfCellBodyGeometry"],
  ]);
  for (const built of rebuiltCatalog.toddGeometries) {
    const inputId = geometryInputByNeuronId.get(built.record.neuronId);
    check(inputId && built.geometryBytes.equals(sources.get(inputId)), `NMO ${built.record.neuronId} Todd geometry is not byte-reproducible`);
  }
  check(catalog.contractId === "neurolucida-native-contour-admission-catalog-0.3" && catalog.releaseId === "ohri-neurolucida-native-contour-admission-catalog-0.3.0", "native-contour 0.3 identity drifted");
  check(catalog.summary?.auditedDatFileCount === 5 && catalog.summary?.admittedRecordCount === 5 && catalog.summary?.heldRecordCount === 0, "native-contour audited/admitted record denominator drifted");
  check(catalog.summary?.admittedContourObjectCount === 48 && catalog.summary?.admittedVertexCount === 2379 && catalog.summary?.admittedRenderedPrimitiveCount === 48, "native-contour object/vertex denominator drifted");
  check(catalog.summary?.toddAdmittedRecordCount === 3 && catalog.summary?.toddAdmittedContourObjectCount === 33 && catalog.summary?.toddAdmittedVertexCount === 1904, "Todd admission denominator drifted");
  check(catalog.summary?.excludedToddUserLineObjectCount === 12, "Todd User Line exclusion denominator drifted");
  const todd = catalog.records.filter((record) => [50424, 50394, 50408].includes(record.neuronId));
  check(todd.length === 3 && todd.every((record) => record.admissionStatus === "admitted_mbf_cell_body_semantic_rule"), "Todd record-specific MBF admission drifted");
  check(sum(todd.map((record) => record.audit.sourceOpenSomaNamedContourCount)) === 33, "Todd raw false/open closure-flag denominator drifted");
  check(sum(todd.map((record) => record.audit.emptyValueCellBodyPresencePropertyCount)) === 33, "Todd empty-value CellBody property denominator drifted");
  check(sum(todd.map((record) => record.audit.independentParserSomaContourCount)) === 33, "Todd pinned-parser somaContour denominator drifted");
  for (const field of ["admittedFilledPolygonCount", "admittedTriangleCount", "admittedLoftCount", "admittedSurfaceCount", "admittedMembraneCount", "admittedVolumeCount", "admittedInternalStructureObjectCount", "biologicalMeasurementCount", "standardizedSwcOverlayCount", "sameCellCrossModalJoinCount", "registrationCount"]) {
    check(catalog.summary?.[field] === 0, `native-contour ${field} must remain zero`);
  }

  const canoReport = await validateCanoGomezP56MultiomeInterneuronRegistryPackage(path.join(PROJECT_ROOT, CANO_REGISTRY_PATH));
  const canoDenominator = cano.denominatorReconciliation;
  check(cano.releaseId === "ohri-cano-gomez-p56-multiome-interneuron-registry-0.1.0", "Cano-Gomez registry identity drifted");
  check(canoReport.sourceNucleusCount === 169345 && canoDenominator.sourceObjectCount === 3 && canoDenominator.sourceScopedGroupCount === 57, "Cano-Gomez source denominator drifted");
  check(canoReport.confirmedInterneuronNucleusCount === 923 && canoReport.confirmedInterneuronProfileCount === 11, "Cano-Gomez CHOL_IN denominator drifted");
  check(canoDenominator.excludedMotorNucleusCount === 2276, "Cano-Gomez motor exclusion denominator drifted");
  check(canoDenominator.paperReportedNeuronTypeCount === 516 && canoDenominator.paperReportedTypeCountUsedAsInterneuronDenominator === false, "Cano-Gomez reported 516-type boundary drifted");
  check(canoDenominator.perNucleusNonNeuronalExcludedCount === null, "Cano-Gomez per-nucleus non-neuronal count must remain unavailable");
  check(cano.identityAuthority?.crossAssayCellIdentityVerified === false && cano.identityAuthority?.sameCellAssertionAdmitted === false, "Cano-Gomez clean-room identity boundary drifted");
  const canoDecisionTotal = sum([
    canoDenominator.confirmedInterneuronNucleusCount,
    canoDenominator.excludedMotorNucleusCount,
    canoDenominator.excludedSensoryScopeNucleusCount,
    canoDenominator.excludedProjectionLocalStatusUnresolvedNucleusCount,
    canoDenominator.excludedAmbiguousOrProjectionExceptionUnresolvedNucleusCount,
  ]);
  check(canoDecisionTotal === 169345, "Cano-Gomez scope decisions do not partition the source nuclei");
  check(cano.sourceObjects?.length === 3 && cano.profiles?.length === 11 && sum(cano.profiles.map((profile) => profile.nucleusCount)) === 923, "Cano-Gomez source/profile roster drifted");
  check(cano.profiles.every((profile) => profile.sourceGroup === "CHOL_IN" && Object.values(profile.geometryAuthority ?? {}).every((value) => value === 0)), "Cano-Gomez profile scope or zero-authority boundary drifted");
  for (const field of ["generatedGeometryCount", "internalStructureObjectCount", "sameCellLinkCount", "atlasRegistrationCount"]) check(canoDenominator[field] === 0, `Cano-Gomez ${field} must remain zero`);
  const canoArtifactInput = {
    all_nucleus_assignment_audit: "canoGomezAllNucleusAudit",
    confirmed_interneuron_nucleus_roster: "canoGomezConfirmedNucleusRoster",
  };
  for (const artifact of cano.artifacts ?? []) {
    const inputId = canoArtifactInput[artifact.artifactKind];
    check(inputId, `unknown Cano-Gomez artifact ${artifact.artifactKind}`);
    const bytes = sources.get(inputId);
    check(artifact.compressedBytes === bytes.byteLength && artifact.compressedSha256 === sha256(bytes), `${artifact.artifactKind} manifest receipt drifted`);
  }

  const molecularProfiles = (explorer.records ?? []).filter((record) => record.focusKind === "molecular_profile");
  const namespaces = new Set(molecularProfiles.map((record) => record.namespace));
  const canoExplorerProfiles = molecularProfiles.filter((record) => record.namespace === "cano-gomez-2026:GSE318731");
  // The reused current-input validator follows the live1.14/22 source identity. Frozen2.41 receipts are validated separately and are not regenerated here.
  check(explorerManifest.assetSetId === "ohri:research-explorer-index:1.14.0" && explorerManifest.sourceFiles?.length === 22, "Explorer 1.14 asset/source-file denominator drifted");
  check(explorer.records?.length === 641 && explorer.counts?.total === 641, "Explorer record denominator drifted");
  check(molecularProfiles.length === 387 && namespaces.size === 10 && canoExplorerProfiles.length === 11, "Explorer molecular profile or namespace denominator drifted");
  check(explorerManifest.sourceFiles.some((source) => source.path === CANO_REGISTRY_PATH), "Explorer manifest does not receipt the Cano-Gomez registry");
  check(JSON.stringify(MOLECULAR_COMPLETENESS_SLOT_IDS) === JSON.stringify(["sampling", "markers", "region", "life_stage", "transmitter", "cell_geometry", "internal_structure", "provenance"]), "molecular completeness slot identity/order drifted");
  for (const record of molecularProfiles) {
    const slots = selectMolecularCompletenessSlots(record);
    check(slots.length === 8 && JSON.stringify(slots.map((slot) => slot.slotId)) === JSON.stringify(MOLECULAR_COMPLETENESS_SLOT_IDS), `${record.focusId} completeness slots drifted`);
  }

  const provider = sources.get("researchActiveRecordProvider").toString("utf8");
  const loaderCalls = (provider.match(/loadVerifiedResearchExplorerIndex\(\{/g) ?? []).length;
  check(loaderCalls === 1, "canonical active-record provider must own exactly one verified-index loader call");
  for (const id of ["researchExplorerFingerprintIntegration", "researchFocusEvidencePanel", "researchRecordModelReadout"]) {
    const source = sources.get(id).toString("utf8");
    check(source.includes("useResearchActiveRecord()"), `${id} is not a shared active-record consumer`);
    check(!source.includes("loadVerifiedResearchExplorerIndex"), `${id} performs an independent active-record lookup`);
  }
  assertText(sources.get("researchActiveRecordRuntime"), ["generation !== previous.generation", "requestKey !== previous.requestKey", "record.key !== requestKey"], "active-record runtime");
  assertText(sources.get("researchSelectionDeltaRuntime"), ["research-selection-delta-0.1", "PRESENTATION_AUDIT_ONLY", "relationshipAdmissionCount: 0"], "selection-delta runtime");
  assertText(sources.get("researchSelectionDeltaReceipt"), ["PRESENTATION AUDIT ONLY", "not biological abundance", "zero relationship admissions"], "selection-delta receipt");

  check(applicationPackage.version === `${envelope.iteration}.0-research.1` && packageLock.version === applicationPackage.version && packageLock.packages?.[""]?.version === applicationPackage.version, "package and lockfile versions must agree on 2.41.0-research.1");
  assertText(sources.get("atlasTypeContracts"), [`research-iteration-manifest-${envelope.iteration}.json`, "canoGomezP56MultiomeInterneuronRegistry"], "atlas type contracts");
  assertText(sources.get("applicationLayout"), [`Research Iteration ${envelope.iteration}`], "application layout");
  assertText(sources.get("projectReadme"), [`${envelope.iteration}.0-research.1`, "641", "387", "48", "2,379", "UPG-204"], "README");
  assertText(sources.get("researchIteration240SnapshotValidator"), [RESEARCH_ITERATION_241_PARENT.fileSha256, RESEARCH_ITERATION_241_PARENT.contentSha256], "2.40 snapshot validator");
  assertText(sources.get("researchTimeline241"), ["UPG-200", "UPG-204", "frozen curator 2.8", "immutable 2.40", "File-specific rollback"], "2.41 timeline");

  return {
    registry,
    registrySummary,
    denominatorReceipt,
    upgrades,
    catalog,
    todd,
    cano,
    canoDenominator,
    explorer,
    explorerManifest,
    applicationVersion: applicationPackage.version,
    molecularProfileCount: molecularProfiles.length,
    sourceNamespaceCount: namespaces.size,
    activeRecordLoaderInvocationCount: loaderCalls,
  };
}

export function serializeResearchIterationManifest241(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export async function buildResearchIterationManifest241(envelope = { iteration: "2.41", upgradeCount: EXPECTED_UPGRADE_COUNT, lastUpgradeId: "UPG-204" }) {
  const parentBytes = await readFile(PARENT_PATH);
  const parent = JSON.parse(parentBytes.toString("utf8"));
  check(parent.releaseId === RESEARCH_ITERATION_241_PARENT.releaseId, "immutable 2.40 parent release identity drifted");
  check(parentBytes.byteLength === RESEARCH_ITERATION_241_PARENT.bytes && sha256(parentBytes) === RESEARCH_ITERATION_241_PARENT.fileSha256, "immutable 2.40 parent file receipt drifted");
  check(parent.manifestContentSha256 === RESEARCH_ITERATION_241_PARENT.contentSha256 && computeManifestContentSha256(parent) === RESEARCH_ITERATION_241_PARENT.contentSha256, "immutable 2.40 parent content receipt drifted");
  check(parent.authoritativeInputs?.length === EXPECTED_PARENT_INPUT_COUNT, "immutable 2.40 parent input denominator drifted");

  const inheritedBytes = await Promise.all(parent.authoritativeInputs.map((input) => readFile(sourcePath(parent, input))));
  const additionalBytes = await Promise.all(RESEARCH_ITERATION_241_ADDITIONAL_INPUTS.map((input) => readFile(path.join(PROJECT_ROOT, input.path))));
  const manifest = structuredClone(parent);
  manifest.authoritativeInputs = parent.authoritativeInputs.map((input, index) => receipt({
    ...input,
    purpose: RESEARCH_ITERATION_241_PURPOSE_OVERRIDES[input.id] ?? input.purpose,
  }, inheritedBytes[index]));
  manifest.authoritativeInputs.push(...RESEARCH_ITERATION_241_ADDITIONAL_INPUTS.map((input, index) => receipt(input, additionalBytes[index])));
  check(manifest.authoritativeInputs.length === RESEARCH_ITERATION_241_EXPECTED_INPUT_COUNT, "2.41 authoritative input count drifted");
  check(new Set(manifest.authoritativeInputs.map((input) => input.id)).size === RESEARCH_ITERATION_241_EXPECTED_INPUT_COUNT, "2.41 authoritative input IDs are not unique");
  check(new Set(manifest.authoritativeInputs.map((input) => input.path)).size === RESEARCH_ITERATION_241_EXPECTED_INPUT_COUNT, "2.41 authoritative input paths are not unique");
  check(RESEARCH_ITERATION_241_RECEIPT_INPUT_IDS.length === 77 && new Set(RESEARCH_ITERATION_241_RECEIPT_INPUT_IDS).size === 77, "2.41 receipt input roster drifted");

  const sources = new Map();
  manifest.authoritativeInputs.forEach((input, index) => {
    sources.set(input.id, index < inheritedBytes.length ? inheritedBytes[index] : additionalBytes[index - inheritedBytes.length]);
  });
  const current = await validateCurrentInputs(sources, envelope);

  manifest.manifestSchemaVersion = "2.41.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.41.0";
  manifest.releaseDate = "2026-09-02";
  manifest.application.version = current.applicationVersion;
  manifest.parentIterationManifest = { ...RESEARCH_ITERATION_241_PARENT };
  manifest.baseResearchRelease.note = "Iteration 2.41 closes UPG-200 through UPG-204 in place. One checksum-verified active record now supplies search, evidence and visualization-authority roles; adjacent verified selections receive a presentation-only delta; source/record-set/roster/object-set UI denominators are registry-derived; three Todd DAT records add only 33 source-native MBF Cell Body LineLoops under an explicit file-specific semantic rule; and Cano-Gomez contributes exactly eleven source-local CHOL_IN profiles / 923 rostered nuclei after a 169,345-row exclusion audit. The live scope is 27 sources, 34 record sets, ten exact cell/profile rosters plus one exact source-object set, 641 Explorer records, 387 molecular profiles and ten molecular namespaces. No new surface, internal object, same-cell join, cross-source identity or registration is admitted. The frozen curator 2.8 package and immutable 2.40 manifest are not rewritten.";
  manifest.integrity.inputCount = manifest.authoritativeInputs.length;

  const inputReceipt = (id) => simpleReceipt(getInput(manifest, id));
  const canoDecision = current.canoDenominator;
  manifest.exactReferences.activeRecordRegistrySelectionDeltaToddAndCanoIntegrity = {
    contractId: "ohri-active-record-registry-selection-delta-todd-cano-integrity-2.41",
    completedUpgradeIds: [...COMPLETED_UPGRADE_IDS],
    researchUpgradeCount: current.upgrades.summary.upgradeCount,
    lastResearchUpgradeId: current.upgrades.upgrades.at(-1).id,
    sharedVerifiedActiveRecord: true,
    activeRecordLoaderInvocationCount: current.activeRecordLoaderInvocationCount,
    activeRecordConsumerRoleCount: 3,
    independentConsumerLookupCount: 0,
    monotonicRequestGeneration: true,
    staleSettlementRejected: true,
    selectionDeltaContractId: "research-selection-delta-0.1",
    selectionDeltaPresentationAuditOnly: true,
    selectionDeltaBiologicalTransitionClaimCount: 0,
    selectionDeltaRelationshipAdmissionCount: 0,
    canonicalSourceCount: current.registrySummary.sourceCount,
    canonicalRecordSetCount: current.registrySummary.recordSetCount,
    bundledExactRosterCount: current.registrySummary.bundledExactCellProfileRosterCount,
    bundledExactObjectSetCount: current.registrySummary.bundledExactSourceObjectSetCount,
    staleDenominatorLiteralCount: current.denominatorReceipt.staleLiteralCount,
    explorerAssetSetId: current.explorerManifest.assetSetId,
    explorerSourceFileCount: current.explorerManifest.sourceFiles.length,
    researchExplorerRecordCount: current.explorer.records.length,
    molecularProfileCount: current.molecularProfileCount,
    sourceNamespaceCount: current.sourceNamespaceCount,
    completenessSlotCount: MOLECULAR_COMPLETENESS_SLOT_IDS.length,
    catalogReleaseId: current.catalog.releaseId,
    auditedDatFileCount: current.catalog.summary.auditedDatFileCount,
    admittedRecordCount: current.catalog.summary.admittedRecordCount,
    heldRecordCount: current.catalog.summary.heldRecordCount,
    admittedContourObjectCount: current.catalog.summary.admittedContourObjectCount,
    admittedVertexCount: current.catalog.summary.admittedVertexCount,
    toddAdmittedRecordCount: current.catalog.summary.toddAdmittedRecordCount,
    toddRawFalseClosureFlagContourCount: sum(current.todd.map((record) => record.audit.sourceOpenSomaNamedContourCount)),
    toddMbfCellBodyPresencePropertyCount: sum(current.todd.map((record) => record.audit.emptyValueCellBodyPresencePropertyCount)),
    toddIndependentParserSomaContourCount: sum(current.todd.map((record) => record.audit.independentParserSomaContourCount)),
    toddAdmittedContourObjectCount: current.catalog.summary.toddAdmittedContourObjectCount,
    toddAdmittedVertexCount: current.catalog.summary.toddAdmittedVertexCount,
    excludedToddUserLineObjectCount: current.catalog.summary.excludedToddUserLineObjectCount,
    sourceClosureFlagUsedAsSoleToddAuthority: false,
    admittedFilledPolygonCount: current.catalog.summary.admittedFilledPolygonCount,
    admittedTriangleCount: current.catalog.summary.admittedTriangleCount,
    admittedSurfaceCount: current.catalog.summary.admittedSurfaceCount,
    admittedInternalStructureCount: current.catalog.summary.admittedInternalStructureObjectCount,
    standardizedSwcOverlayCount: current.catalog.summary.standardizedSwcOverlayCount,
    sameCellCrossModalJoinCount: current.catalog.summary.sameCellCrossModalJoinCount,
    registrationCount: current.catalog.summary.registrationCount,
    canoRegistryReleaseId: current.cano.releaseId,
    canoIdentityAuthorityMode: current.cano.identityAuthority.mode,
    canoSourceObjectCount: canoDecision.sourceObjectCount,
    canoSourceNucleusCount: canoDecision.sourceTotalNucleusCount,
    canoSourceScopedGroupCount: canoDecision.sourceScopedGroupCount,
    canoConfirmedInterneuronNucleusCount: canoDecision.confirmedInterneuronNucleusCount,
    canoConfirmedInterneuronProfileCount: canoDecision.confirmedInterneuronProfileCount,
    canoExcludedMotorNucleusCount: canoDecision.excludedMotorNucleusCount,
    canoExcludedSensoryScopeNucleusCount: canoDecision.excludedSensoryScopeNucleusCount,
    canoExcludedProjectionLocalStatusUnresolvedNucleusCount: canoDecision.excludedProjectionLocalStatusUnresolvedNucleusCount,
    canoExcludedAmbiguousOrProjectionExceptionUnresolvedNucleusCount: canoDecision.excludedAmbiguousOrProjectionExceptionUnresolvedNucleusCount,
    canoObservedRawTypeLabelUnionCount: canoDecision.observedRawNonMissingNonEmptyTypeLabelUnionCount,
    canoPaperReportedNeuronTypeCount: canoDecision.paperReportedNeuronTypeCount,
    canoPaperReportedTypeCountUsedAsInterneuronDenominator: canoDecision.paperReportedTypeCountUsedAsInterneuronDenominator,
    canoPaperReportedTypeCountMatchesObservedRawUnion: canoDecision.paperReportedTypeCountMatchesObservedRawUnion,
    canoPerNucleusNonNeuronalExcludedCount: canoDecision.perNucleusNonNeuronalExcludedCount,
    canoCrossAssayCellIdentityVerified: current.cano.identityAuthority.crossAssayCellIdentityVerified,
    canoSourceRdsBundleCount: 0,
    canoGeneratedGeometryCount: canoDecision.generatedGeometryCount,
    canoInternalStructureObjectCount: canoDecision.internalStructureObjectCount,
    canoSameCellLinkCount: canoDecision.sameCellLinkCount,
    canoAtlasRegistrationCount: canoDecision.atlasRegistrationCount,
    crossSourceIdentityCount: 0,
    renderedInternalPrimitiveCount: 0,
    receipts: Object.fromEntries(RESEARCH_ITERATION_241_RECEIPT_INPUT_IDS.map((id) => [id, inputReceipt(id)])),
  };

  manifest.registrySummary = {
    ...parent.registrySummary,
    canonicalSourcePackageCount: current.registrySummary.sourceCount,
    canonicalRecordSetCount: current.registrySummary.recordSetCount,
    bundledExactRosterCount: current.registrySummary.bundledExactCellProfileRosterCount,
    bundledExactObjectSetCount: current.registrySummary.bundledExactSourceObjectSetCount,
    researchUpgradeCount: current.upgrades.summary.upgradeCount,
    sourceProfileCount: current.molecularProfileCount,
    sourceNamespaceCount: current.sourceNamespaceCount,
    researchExplorerRecordCount: current.explorer.records.length,
    crossSourceIdentityCount: 0,
    registrationCount: 0,
    renderedInternalPrimitiveCount: 0,
    sourceRegistryReceipt: getInput(manifest, "researchSourceRegistry"),
    upgradeRegistryReceipt: getInput(manifest, "researchModelUpgradeRegistry"),
  };
  manifest.scientificBoundaries.activeRecordRegistrySelectionDeltaToddAndCanoIntegrity = "Iteration 2.41 uses one checksum-verified active-record loader for the search result, evidence dossier and visualization-authority panel. A changed selection synchronously clears the old record, request generations increase monotonically, stale success or failure settlements are rejected, and no consumer performs an independent lookup. The selection-delta receipt compares only adjacent verified presentation records: fixed evidence-slot status/value/authority/locator fields, unchanged same-namespace context and admitted visualization counts. It is not evidence of development, biological transition, abundance, equivalence, causation or same-cell identity, and creates zero relationship admissions. Every displayed source, record-set, exact cell/profile-roster and exact source-object-set denominator is derived from the live registry; stale canonical literals are rejected. The registry has 27 sources, 34 record sets, ten exact cell/profile rosters and one exact source-object set. Explorer 1.13 has 641 records, including 387 molecular profiles in ten namespaces, and retains eight fixed completeness slots per molecular profile. The five-DAT 0.3 catalog admits 48 source-native LineLoops / 2,379 vertices. Its Todd subset remains exactly 33 raw false-flag Cell Body contours / 1,904 vertices. Admission requires each exact DAT checksum, an empty-value CellBody presence property and pinned-parser somaContour classification; the raw sourceClosedFlag=false values remain disclosed and are not reinterpreted by a generic false-flag rule. Twelve Todd User Line objects remain excluded. No contour is filled, triangulated or lofted, and no surface, membrane, volume, internal object, biological measurement, standardized-SWC overlay, same-cell join or registration is created. Cano-Gomez is a source-local assignment audit over 169,345 nuclei and 57 source-scoped groups. Only exact groups=CHOL_IN rows are admitted, yielding 923 nuclei in eleven profiles. Exactly 2,276 cholinergic motor nuclei are excluded; GABA_CSF-cN_Pkd2l1 stays outside interneuron scope; remaining GABA assignments remain ambiguous or projection-exception unresolved; and all GLUT assignments remain projection/local-status unresolved. The paper-reported 516 neuronal types are retained only as a reconciliation denominator and never become an interneuron denominator. Non-neuronal removal remains a source-level preprocessing statement because no per-nucleus flag exists; null is preserved instead of fabricating zero. Raw source labels, including anomalies, are not repaired or tokenized into marker claims. The clean-room identity route does not verify cross-assay identity, admit same-cell identity or establish a cross-source canonical type. The source RDS files are not bundled. Cano-Gomez adds no morphology, generated geometry, internal structure, projection assignment, same-cell link or atlas registration. The frozen curator 2.8 package and immutable 2.40 manifest remain byte-preserved and outside this child iteration's rewrite scope.";
  manifest.registrations = { count: 0, records: [] };
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(serializeResearchIterationManifest241(manifest), "utf8") };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  for (const arg of args) check(arg === "--write" || arg === "--check", `unknown argument: ${arg}`);
  check(!(args.has("--write") && args.has("--check")), "--write and --check are mutually exclusive");
  const built = await buildResearchIterationManifest241();
  if (args.has("--write")) await writeFile(OUTPUT_PATH, built.bytes);
  if (args.has("--check")) {
    const committed = await readFile(OUTPUT_PATH);
    check(committed.equals(built.bytes), "research iteration manifest 2.41 is stale; run builder with --write");
  }
  const exact = built.manifest.exactReferences.activeRecordRegistrySelectionDeltaToddAndCanoIntegrity;
  process.stdout.write(`${JSON.stringify({
    releaseId: built.manifest.releaseId,
    applicationVersion: built.manifest.application.version,
    inputCount: built.manifest.integrity.inputCount,
    canonicalSourceCount: exact.canonicalSourceCount,
    canonicalRecordSetCount: exact.canonicalRecordSetCount,
    bundledExactRosterCount: exact.bundledExactRosterCount,
    bundledExactObjectSetCount: exact.bundledExactObjectSetCount,
    researchExplorerRecordCount: exact.researchExplorerRecordCount,
    molecularProfileCount: exact.molecularProfileCount,
    admittedContourObjectCount: exact.admittedContourObjectCount,
    admittedVertexCount: exact.admittedVertexCount,
    canoSourceNucleusCount: exact.canoSourceNucleusCount,
    canoConfirmedInterneuronNucleusCount: exact.canoConfirmedInterneuronNucleusCount,
    canoConfirmedInterneuronProfileCount: exact.canoConfirmedInterneuronProfileCount,
    registrationCount: exact.registrationCount,
    manifestContentSha256: built.manifest.manifestContentSha256,
    wrote: args.has("--write"),
    checked: args.has("--check"),
  }, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
