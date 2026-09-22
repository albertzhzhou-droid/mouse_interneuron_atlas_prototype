#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.32.json");
const PARENT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.31.json");
const SOURCE_REGISTRY_PATH = path.join(PROJECT_ROOT, "data/research-source-registry-0.1.json");
const UPGRADE_REGISTRY_PATH = path.join(PROJECT_ROOT, "data/research-model-upgrade-registry-0.1.json");
const RIGHTS_LEDGER_PATH = path.join(PROJECT_ROOT, "docs/RIGHTS_LEDGER.csv");
const PACKAGE_LOCK_PATH = path.join(PROJECT_ROOT, "package-lock.json");
const ALKASLASI_PATH = path.join(PROJECT_ROOT, "data/alkaslasi-cholinergic-source-taxonomy-0.1.json");
const SATHYAMURTHY_PATH = path.join(PROJECT_ROOT, "data/sathyamurthy-source-taxonomy-0.1.json");
const RESEARCH_VISUAL_TARGET_PATH = path.join(PROJECT_ROOT, "app/research-visual-target.js");

const PARENT_RECEIPT = Object.freeze({
  path: "data/research-iteration-manifest-2.31.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.31.0",
  bytes: 87120,
  fileSha256: "49ef49fdaaf8e72976d01e7a6d3053d40735215c39bf890100ab464d7ac67996",
  contentSha256: "c714ba7ac7f306987b0344899c20381eda6a568d57b222773746839c687a0fd4",
});

const ADDITIONAL_INPUTS = Object.freeze([
  ["morphologyTopologyDetailContract", "data/morphology-topology-detail-0.1.json", "Root contract for exact source-type topology and landmark receipts"],
  ["morphologyTopologyDetailRuntime", "public/data/morphology_topology_detail_v1/index.json", "Full 149-record source-type topology runtime index"],
  ["morphologyTopologyDetailSchema", "schemas/morphology-topology-detail-0.1.schema.json", "Fail-closed topology-detail JSON schema"],
  ["morphologyTopologyDetailBuilder", "tools/build_morphology_topology_detail.mjs", "Deterministic topology-detail builder"],
  ["morphologyTopologyDetailValidator", "scripts/validate-morphology-topology-detail-0.1.mjs", "Topology-detail receipt and scientific-boundary validator"],
  ["sourceLocalTopologyRenderer", "app/source-local-morphology-geometry.js", "Exact parent-link landmark extraction and line-cross rendering"],
  ["mainSceneTopologyIntegration", "app/SceneCanvas.tsx", "Main-scene exact morphology topology overlay"],
  ["sourceLocalTopologyViewport", "app/SourceLocalMorphologyViewport.tsx", "Source-local topology controls and exact landmark legend"],
  ["morphologyViewerTopologyIntegration", "app/MorphologyViewer.tsx", "Individual exact-morphology topology detail integration"],
  ["morphologyCompareTopologyIntegration", "app/MorphologyComparePanel.tsx", "Comparison-card topology detail integration"],
  ["morphologyTopologyDetailPanel", "app/MorphologyTopologyDetailPanel.tsx", "Checksum-gated source-type topology detail panel"],
  ["morphologyTopologyDetailRuntimeGuard", "app/morphology-topology-detail-runtime.js", "Browser fail-closed guard for topology membership, source domains and unavailable types"],
  ["researchEvidenceFingerprintComponent", "app/ResearchRecordEvidenceFingerprint.tsx", "Shared humanized source-record evidence fingerprint"],
  ["atlasFocusSynchronization", "app/AtlasPrototype.tsx", "SCI-only active entity binding and non-SCI stale-geometry clearing"],
  ["typeAtlasFingerprintIntegration", "app/InterneuronTypeAtlas.tsx", "Selected molecular-profile fingerprint integration"],
  ["researchExplorerFingerprintIntegration", "app/ResearchExplorer.tsx", "Research Explorer molecular fingerprint integration"],
  ["researchExplorerIndexRuntime", "app/research-explorer-index.js", "Shared fail-closed record lookup and source-taxonomy life-stage resolver"],
].map(([id, inputPath, purpose]) => Object.freeze({
  id,
  scope: "project",
  path: inputPath,
  purpose,
})));

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function receipt(input, bytes) {
  return {
    id: input.id,
    scope: input.scope,
    path: input.path,
    purpose: input.purpose,
    bytes: bytes.byteLength,
    sha256: sha256(bytes),
  };
}

function simpleReceipt(input, bytes) {
  return { path: input.path, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

function replaceInputReceipt(manifest, id, bytes) {
  const index = manifest.authoritativeInputs.findIndex((input) => input.id === id);
  check(index >= 0, `missing inherited authoritative input ${id}`);
  manifest.authoritativeInputs[index] = receipt(manifest.authoritativeInputs[index], bytes);
  return manifest.authoritativeInputs[index];
}

function countRecordSets(registry) {
  return registry.sources.reduce((total, source) => total + source.recordSets.length, 0);
}

function countBundledExactRosters(registry) {
  return registry.sources
    .flatMap((source) => source.recordSets)
    .filter((recordSet) => recordSet.childRosterRef.status === "bundled_exact").length;
}

function validateTopologyContract(contract, runtime, runtimeBytes) {
  check(contract.contractId === "morphology-topology-detail-0.1", "topology contract ID drifted");
  check(contract.schemaVersion === "0.1.0" && contract.releaseId === "ohri-morphology-topology-detail-0.1.0", "topology release identity drifted");
  check(contract.runtimeAsset.path === "public/data/morphology_topology_detail_v1/index.json" && contract.runtimeAsset.fetchPath === "/data/morphology_topology_detail_v1/index.json", "topology runtime path drifted");
  check(contract.runtimeAsset.bytes === runtimeBytes.byteLength && contract.runtimeAsset.sha256 === sha256(runtimeBytes), "topology runtime receipt drifted");
  check(contract.runtimeAsset.recordCount === 149 && runtime.records.length === 149, "topology record denominator drifted");
  check(same(contract.summary, runtime.summary), "root/runtime topology summaries disagree");
  const expectedSummary = {
    frozenCensusRecordCount: 142,
    supplementaryRecordCount: 7,
    viewableSourceObjectCount: 149,
    verifiedGeometryCount: 149,
    sourceType1RecordCount: 149,
    sourceType2RecordCount: 51,
    sourceType3RecordCount: 147,
    sourceType4RecordCount: 0,
    otherSourceTypeRecordCount: 2,
    landmarkReceiptCount: 149,
    totalNodeCount: 566511,
    totalSegmentCount: 566362,
    totalNeuriteSegmentCount: 565423,
    totalTerminalLandmarkCount: 6957,
    totalBifurcationLandmarkCount: 6223,
  };
  for (const [field, value] of Object.entries(expectedSummary)) {
    check(contract.summary[field] === value, `topology summary ${field} drifted`);
  }
  check(contract.summary.combinedCensusClaim === false && contract.summary.internalStructureModelCount === 0 && contract.summary.membraneModelCount === 0 && contract.summary.registrationCount === 0, "topology contract crossed a scientific zero boundary");
  const ids = runtime.records.map((record) => record.neuronId);
  check(new Set(ids).size === 149, "topology runtime identities are not unique");
  const census = runtime.records.filter((record) => record.membership.collection === "frozen_census");
  const supplementary = runtime.records.filter((record) => record.membership.collection === "supplementary");
  check(census.length === 142 && supplementary.length === 7, "topology membership is not 142 + 7");
  for (const record of runtime.records) {
    check(record.geometryReceipt.registrationCount === 0, `NMO ${record.neuronId} topology creates a registration`);
    check(record.topology.segmentCount === record.topology.nodeCount - 1, `NMO ${record.neuronId} topology is not single-root connected`);
    check(record.topology.landmarks.rootNodeIds.length === 1 && record.topology.landmarks.rootNodeIds[0] === record.topology.rootNodeId, `NMO ${record.neuronId} exact root landmark drifted`);
    check(/^[a-f0-9]{64}$/.test(record.topology.landmarks.landmarkReceiptSha256), `NMO ${record.neuronId} landmark receipt is invalid`);
    const type1 = record.topology.sourceTypeDomains.find((domain) => domain.sourceType === 1);
    check(type1?.semanticStatus === "standardized_soma_samples_not_contour" && type1?.neuriteMetrics?.status === "UNAVAILABLE" && type1?.neuriteMetrics?.biologicalAbsenceClaim === false, `NMO ${record.neuronId} type 1 was promoted to a contour or numeric neurite domain`);
    check(same(record.topology.canonicalNeuriteTypeAvailability.map((item) => item.sourceType), [2, 3, 4]), `NMO ${record.neuronId} canonical type availability drifted`);
    for (const item of record.topology.canonicalNeuriteTypeAvailability) {
      if (item.status === "PRESENT") {
        check(record.topology.sourceTypeDomains.some((domain) => domain.sourceType === item.sourceType), `NMO ${record.neuronId} marks an absent source type present`);
      } else {
        check(item.status === "UNAVAILABLE" && item.biologicalAbsenceClaim === false, `NMO ${record.neuronId} converts unavailable source type ${item.sourceType} to biological zero`);
      }
    }
  }
  return expectedSummary;
}

function validateImplementation(sources, alkaslasi, sathyamurthy) {
  const source = (id) => sources.get(id).toString("utf8");
  const atlas = source("atlasFocusSynchronization");
  for (const snippet of [
    "const { retainedSelectedId, activeSelectedId, rovingPopulationId } = resolveSciSelectionState",
    "selectedId={activeSelectedId}",
    "entityId={activeSelectedId}",
    "aria-pressed={entity.id === activeSelectedId}",
    "tabIndex={entity.id === rovingPopulationId ? 0 : -1}",
    "selectedId: retainedSelectedId",
  ]) check(atlas.includes(snippet), `focus synchronization is missing ${snippet}`);

  const selectionResolver = source("researchVisualTargetResolver");
  for (const snippet of ["resolveSciSelectionState", "rovingPopulationId", "activeSelectedId ?? storedSelectedId"]) {
    check(selectionResolver.includes(snippet), `SCI selection-state resolver is missing ${snippet}`);
  }

  const fingerprint = source("researchEvidenceFingerprintComponent");
  for (const snippet of [
    "SELECTED SOURCE-RECORD FINGERPRINT",
    "0 admitted cell-geometry primitives",
    "Identity and geometry limits · collapsed",
    "data-geometry-status=\"no-admitted-cell-geometry\"",
    "humanizeEvidenceToken",
  ]) check(fingerprint.includes(snippet), `evidence fingerprint is missing ${snippet}`);
  check(source("typeAtlasFingerprintIntegration").includes("<ResearchRecordEvidenceFingerprint"), "Type Atlas does not use the shared fingerprint");
  check(source("researchExplorerFingerprintIntegration").includes("<ResearchRecordEvidenceFingerprint"), "Research Explorer does not use the shared fingerprint");
  const explorerIndex = source("researchExplorerIndexRuntime");
  for (const snippet of ["resolveMolecularRecordLifeStage", "sathyamurthyTaxonomy.scope.lifeStage", "sourceProfile?.lifeStage", "not retained in this exact record"]) {
    check(explorerIndex.includes(snippet), `Research Explorer source-life-stage resolver is missing ${snippet}`);
  }

  const i1 = alkaslasi.profiles.find((profile) => profile.id === "alkaslasi-2021:GSE167597:I1");
  const i2 = alkaslasi.profiles.find((profile) => profile.id === "alkaslasi-2021:GSE167597:I2");
  check(i1?.samplingCount?.value === 1520 && i2?.samplingCount?.value === 780, "I1/I2 exact sampling counts drifted");
  check(!same(i1.markerPanel, i2.markerPanel) && !same(i1.sampleRegionMembership.counts, i2.sampleRegionMembership.counts), "I1/I2 fingerprints are not source-distinct");
  for (const profile of [i1, i2]) {
    check(profile.missingEvidence.morphology === "not_measured" && profile.missingEvidence.intracellularStructures === "not_measured" && profile.missingEvidence.atlasRegistration === "not_established", `${profile.id} gained unsupported geometry, internals or registration`);
  }

  const geometry = source("sourceLocalTopologyRenderer");
  for (const snippet of [
    "exact_swc_parent_link_landmarks_v1",
    "standardized_soma_samples_not_contour",
    "topological_terminal_not_bouton_or_synapse",
    "generatedBiologicalGeometryCount: 0",
    "sameSpecimenInternalStructureClaim: false",
  ]) check(geometry.includes(snippet), `topology renderer is missing ${snippet}`);
  check(!geometry.includes("SphereGeometry"), "topology landmarks use sphere-like surrogate geometry");
  for (const id of ["mainSceneTopologyIntegration", "sourceLocalTopologyViewport", "morphologyViewerTopologyIntegration"]) {
    check(source(id).includes("createObservedTopologyLandmarks") || source(id).includes("MorphologyTopologyDetailPanel"), `${id} does not integrate exact topology detail`);
  }
  check(source("morphologyCompareTopologyIntegration").includes("MorphologyTopologyDetailPanel"), "morphology comparator does not expose topology detail");
  const panel = source("morphologyTopologyDetailPanel");
  for (const snippet of ["Unavailable—not biological zero", "Type 1 means standardized soma samples, not a soma contour", "No metric or geometry is substituted"]) {
    check(panel.includes(snippet), `topology detail panel is missing ${snippet}`);
  }
  const topologyRuntimeGuard = source("morphologyTopologyDetailRuntimeGuard");
  for (const snippet of ["validateMorphologyTopologyPayload", "unknown membership collection", "biologicalAbsenceClaim === false", "source types 2, 3 and 4"]) {
    check(topologyRuntimeGuard.includes(snippet), `topology runtime guard is missing ${snippet}`);
  }

  return {
    i1: {
      focusId: i1.id,
      sampledNucleusCount: i1.samplingCount.value,
      markers: i1.markerPanel,
      sourceRegionMembership: i1.sampleRegionMembership.counts,
    },
    i2: {
      focusId: i2.id,
      sampledNucleusCount: i2.samplingCount.value,
      markers: i2.markerPanel,
      sourceRegionMembership: i2.sampleRegionMembership.counts,
    },
    lifeStageAuthority: {
      sathyamurthy: sathyamurthy.scope.lifeStage,
      alkaslasi: [...new Set(alkaslasi.profiles.map((profile) => profile.lifeStage))][0],
      unknownRecordPolicy: "not_retained_in_exact_record",
    },
  };
}

export function serializeResearchIterationManifest232(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export async function buildResearchIterationManifest232() {
  const additionalPaths = ADDITIONAL_INPUTS.map((input) => path.join(PROJECT_ROOT, input.path));
  const [
    parentBytes,
    sourceRegistryBytes,
    upgradeRegistryBytes,
    rightsLedgerBytes,
    packageLockBytes,
    alkaslasiBytes,
    sathyamurthyBytes,
    researchVisualTargetBytes,
    ...additionalBytes
  ] = await Promise.all([
    readFile(PARENT_PATH),
    readFile(SOURCE_REGISTRY_PATH),
    readFile(UPGRADE_REGISTRY_PATH),
    readFile(RIGHTS_LEDGER_PATH),
    readFile(PACKAGE_LOCK_PATH),
    readFile(ALKASLASI_PATH),
    readFile(SATHYAMURTHY_PATH),
    readFile(RESEARCH_VISUAL_TARGET_PATH),
    ...additionalPaths.map((inputPath) => readFile(inputPath)),
  ]);
  const parent = JSON.parse(parentBytes.toString("utf8"));
  const sourceRegistry = JSON.parse(sourceRegistryBytes.toString("utf8"));
  const upgradeRegistry = JSON.parse(upgradeRegistryBytes.toString("utf8"));
  const packageLock = JSON.parse(packageLockBytes.toString("utf8"));
  const alkaslasi = JSON.parse(alkaslasiBytes.toString("utf8"));
  const sathyamurthy = JSON.parse(sathyamurthyBytes.toString("utf8"));
  const sources = new Map(ADDITIONAL_INPUTS.map((input, index) => [input.id, additionalBytes[index]]));
  sources.set("researchVisualTargetResolver", researchVisualTargetBytes);
  const inputById = new Map(ADDITIONAL_INPUTS.map((input) => [input.id, input]));

  check(parent.releaseId === PARENT_RECEIPT.releaseId, "immutable 2.31 parent release identity drifted");
  check(parentBytes.byteLength === PARENT_RECEIPT.bytes && sha256(parentBytes) === PARENT_RECEIPT.fileSha256, "immutable 2.31 parent file receipt drifted");
  check(parent.manifestContentSha256 === PARENT_RECEIPT.contentSha256 && computeManifestContentSha256(parent) === PARENT_RECEIPT.contentSha256, "immutable 2.31 parent content receipt drifted");
  check(sourceRegistry.sourceCount === 24 && sourceRegistry.sources.length === 24 && countRecordSets(sourceRegistry) === 28 && countBundledExactRosters(sourceRegistry) === 7, "source-registry denominators drifted");
  check(upgradeRegistry.summary.upgradeCount === 148 && upgradeRegistry.upgrades.length === 148 && upgradeRegistry.upgrades.at(-1)?.id === "UPG-166", "upgrade-registry denominator or range drifted");
  check(upgradeRegistry.upgrades.find((item) => item.id === "UPG-150")?.status === "completed", "UPG-150 is not complete");
  check(packageLock.version === "2.32.0-research.1" && packageLock.packages?.[""]?.version === "2.32.0-research.1", "package-lock application version drifted");

  const topologyContractBytes = sources.get("morphologyTopologyDetailContract");
  const topologyRuntimeBytes = sources.get("morphologyTopologyDetailRuntime");
  const topologyContract = JSON.parse(topologyContractBytes.toString("utf8"));
  const topologyRuntime = JSON.parse(topologyRuntimeBytes.toString("utf8"));
  const topologySummary = validateTopologyContract(topologyContract, topologyRuntime, topologyRuntimeBytes);
  const fingerprints = validateImplementation(sources, alkaslasi, sathyamurthy);

  const manifest = structuredClone(parent);
  manifest.manifestSchemaVersion = "2.32.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.32.0";
  manifest.releaseDate = "2026-08-31";
  manifest.application.version = "2.32.0-research.1";
  manifest.parentIterationManifest = { ...PARENT_RECEIPT };
  manifest.baseResearchRelease.note = "Iteration 2.32 closes the selected-record UI/model gap without inventing a representative cell. Non-SCI focus clears the active SCI entity and any stale morphology while preserving only a dormant URL-restoration selection. I1 and I2 expose distinct source counts, markers and region membership through one humanized evidence fingerprint with zero admitted cell geometry. Exactly 149 morphology objects retain exact parent-link landmarks and source-type-domain topology as 142 frozen census plus seven supplementary records. Missing source types remain unavailable rather than biological zero; membrane, organelle, synapse, internal structure, cross-source identity and registration claims remain zero.";

  const sourceRegistryReceipt = replaceInputReceipt(manifest, "researchSourceRegistry", sourceRegistryBytes);
  const upgradeRegistryReceipt = replaceInputReceipt(manifest, "researchModelUpgradeRegistry", upgradeRegistryBytes);
  replaceInputReceipt(manifest, "rightsLedger", rightsLedgerBytes);
  replaceInputReceipt(manifest, "packageLock", packageLockBytes);
  replaceInputReceipt(manifest, "researchVisualTargetResolver", researchVisualTargetBytes);
  manifest.authoritativeInputs.push(...ADDITIONAL_INPUTS.map((input, index) => receipt(input, additionalBytes[index])));
  check(manifest.authoritativeInputs.length === 63, "research iteration 2.32 must contain exactly 63 authoritative inputs");
  check(new Set(manifest.authoritativeInputs.map((input) => input.id)).size === 63 && new Set(manifest.authoritativeInputs.map((input) => input.path)).size === 63, "2.32 authoritative input IDs or paths are not unique");
  manifest.integrity.inputCount = 63;

  manifest.exactReferences.uiKnowledgeAndTopologyIntegrity = {
    contractId: "ohri-ui-knowledge-topology-integrity-2.32",
    focusSynchronization: {
      activeSciEntityPolicy: "active_only_when_focusKind_is_sci_entity",
      dormantSciSelectionPersistence: true,
      keyboardRovingTabStopCountWhenNonSci: 1,
      nullSelectionRoundTripPreserved: true,
      sciFocusCanonicalizesPersistedSelection: true,
      nonSciActiveEntityCount: 0,
      molecularMainSceneGeometryCount: 0,
      fallbackGeometryCount: 0,
      substituteGeometryCount: 0,
      atlasPrototypeReceipt: simpleReceipt(inputById.get("atlasFocusSynchronization"), sources.get("atlasFocusSynchronization")),
    },
    molecularEvidenceFingerprint: {
      indexedMolecularProfileCount: parent.exactReferences.researchExplorerVisualIntegrity.byFocusKind.molecular_profile,
      exactDemonstrationRecords: { i1: fingerprints.i1, i2: fingerprints.i2 },
      lifeStageAuthority: fingerprints.lifeStageAuthority,
      fingerprintComponentReceipt: simpleReceipt(inputById.get("researchEvidenceFingerprintComponent"), sources.get("researchEvidenceFingerprintComponent")),
      typeAtlasIntegrationReceipt: simpleReceipt(inputById.get("typeAtlasFingerprintIntegration"), sources.get("typeAtlasFingerprintIntegration")),
      researchExplorerIntegrationReceipt: simpleReceipt(inputById.get("researchExplorerFingerprintIntegration"), sources.get("researchExplorerFingerprintIntegration")),
      researchExplorerIndexReceipt: simpleReceipt(inputById.get("researchExplorerIndexRuntime"), sources.get("researchExplorerIndexRuntime")),
      admittedCellGeometryPrimitiveCount: 0,
      sharedLimitBlockCountPerFingerprint: 1,
      rawMachineTokenPrimaryLabelCount: 0,
    },
    morphologyTopologyDetail: {
      contractId: topologyContract.contractId,
      releaseId: topologyContract.releaseId,
      contractReceipt: simpleReceipt(inputById.get("morphologyTopologyDetailContract"), topologyContractBytes),
      runtimeReceipt: simpleReceipt(inputById.get("morphologyTopologyDetailRuntime"), topologyRuntimeBytes),
      runtimeGuardReceipt: simpleReceipt(inputById.get("morphologyTopologyDetailRuntimeGuard"), sources.get("morphologyTopologyDetailRuntimeGuard")),
      ...topologySummary,
      combinedCensusClaim: false,
      sourceTypeAbsenceMeansBiologicalZero: false,
      somaContourClaimCount: 0,
      membraneClaimCount: 0,
      internalStructureModelCount: 0,
      boutonClaimCount: 0,
      synapseClaimCount: 0,
      crossSourceIdentityCount: 0,
      registrationCount: 0,
      generatedBiologicalPrimitiveCount: 0,
    },
    projectCopyCount: 0,
    packageCopyCount: 0,
  };
  manifest.registrySummary = {
    canonicalSourcePackageCount: 24,
    canonicalRecordSetCount: 28,
    bundledExactRosterCount: 7,
    researchUpgradeCount: 148,
    sourceRegistryReceipt,
    upgradeRegistryReceipt,
    crossSourceIdentityCount: 0,
    registrationCount: 0,
    renderedInternalPrimitiveCount: 0,
  };
  manifest.scientificBoundaries.uiKnowledgeAndTopologyIntegrity = "Iteration 2.32 binds visible knowledge to the exact selected source record. A non-SCI focus has no active SCI entity and no borrowed morphology; molecular fingerprints change only source-local facts and expose zero admitted cell geometry. The 149 topology records remain 142 frozen census plus seven supplementary objects in independent source frames. Root, type-1, branchpoint and terminal crosses are deterministic data overlays; type 1 is not a soma contour, terminals are not boutons or synapses, and an absent SWC source type is unavailable rather than biological zero. The topology contract does not create membrane, organelle, internal structure, whole-cell completeness, connectivity, cross-source identity, atlas placement or registration. Project and package copies remain zero.";
  manifest.registrations = { count: 0, records: [] };
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(serializeResearchIterationManifest232(manifest), "utf8") };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  for (const arg of args) check(arg === "--write" || arg === "--check", `unknown argument: ${arg}`);
  check(!(args.has("--write") && args.has("--check")), "--write and --check are mutually exclusive");
  const built = await buildResearchIterationManifest232();
  if (args.has("--write")) await writeFile(OUTPUT_PATH, built.bytes);
  if (args.has("--check")) {
    const committed = await readFile(OUTPUT_PATH);
    check(committed.equals(built.bytes), "research iteration manifest 2.32 is stale; run builder with --write");
  }
  process.stdout.write(`${JSON.stringify({
    releaseId: built.manifest.releaseId,
    inputCount: built.manifest.integrity.inputCount,
    researchUpgradeCount: built.manifest.registrySummary.researchUpgradeCount,
    molecularProfileCount: built.manifest.exactReferences.uiKnowledgeAndTopologyIntegrity.molecularEvidenceFingerprint.indexedMolecularProfileCount,
    morphologyTopologyRecordCount: built.manifest.exactReferences.uiKnowledgeAndTopologyIntegrity.morphologyTopologyDetail.viewableSourceObjectCount,
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
