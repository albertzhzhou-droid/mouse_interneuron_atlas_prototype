#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.38.json");
const PARENT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.37.json");

export const RESEARCH_ITERATION_238_PARENT = Object.freeze({
  path: "data/research-iteration-manifest-2.37.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.37.0",
  bytes: 161281,
  fileSha256: "2ddc5b4cce26cbe5db492234446a52f3c0f182c0ff0ed896104ec6a9c4fb3b08",
  contentSha256: "04b6f7a09968489afa420edb527a159e04f4dc07bab4ce402e394808256ca765",
});

export const RESEARCH_ITERATION_238_PURPOSE_OVERRIDES = Object.freeze({
  researchExplorerAssetManifest: "Research Explorer 1.12.0 20-source-file roster and exact 630-record search-index receipt",
  researchExplorerSearchIndex: "Full 630-record Research Explorer 1.12.0 discovery index",
  researchUpgradeQueue: "Evidence-gated research/model queue through UPG-189",
  researchSourceRegistryValidator: "Twenty-seven-source, 32-record-set and 376-source-profile validator",
  researchExplorerBuilder: "Research Explorer 630-record deterministic index builder",
  knowledgeCoverageContract: "Eight-source by seven-axis evidence-coverage matrix",
  researchUpgradeRegistryBuilder: "Deterministic UPG-022-through-UPG-189 registry builder",
  applicationLayout: "Current English metadata and 2.38 application label",
});

const ADDITIONAL_INPUTS = Object.freeze([
  ["delileTaxonomyBuilder", "tools/build_delile_developmental_interneuron_taxonomy.mjs", "Deterministic Delile source-annotation parser and compact taxonomy builder"],
  ["delileTaxonomyContract", "data/delile-developmental-interneuron-taxonomy-0.1.json", "Exact 51-profile Delile developmental interneuron taxonomy"],
  ["delileTaxonomySchema", "schemas/delile-developmental-interneuron-taxonomy-0.1.schema.json", "Delile compact taxonomy JSON schema"],
  ["delileTaxonomyValidator", "scripts/validate-delile-developmental-interneuron-taxonomy-0.1.mjs", "Delile receipt, denominator, spelling and zero-object validator"],
  ["delileTaxonomyTest", "tests/delile-developmental-interneuron-taxonomy.test.mjs", "Delile deterministic, denominator and mutation tests"],
  ["pkd2l1SbfsemVideoContract", "data/pkd2l1-sbfsem-video-reference-0.1.json", "eLife 83108 Video 5 qualitative-only PKD2L1 SBF-SEM reference"],
  ["pkd2l1SbfsemVideoCaptions", "public/data/pkd2l1_sbfsem_video5_captions.vtt", "Local accessibility caption stating the publication-video evidence boundary"],
  ["pkd2l1SbfsemVideoValidator", "scripts/validate-pkd2l1-sbfsem-video-reference-0.1.mjs", "PKD2L1 video receipt and zero-object readiness validator"],
  ["pkd2l1SbfsemVideoTest", "tests/pkd2l1-sbfsem-video-reference.test.mjs", "PKD2L1 publication-video rendering and non-reconstruction tests"],
  ["researchRecordPresentationRuntime", "app/research-record-presentation.js", "Record-driven evidence partition and five-axis modeling-readiness contract"],
  ["researchRecordModelReadout", "app/ResearchRecordModelReadout.tsx", "Selected source-record model readout that is explicitly not a cell shape"],
  ["researchRecordPresentationTest", "tests/research-record-presentation.test.mjs", "Cross-record switching, collapsed-context and zero-fallback tests"],
  ["researchTimeline238", "docs/RESEARCH_TIMELINE_2026-09-02_ITERATION_2_38.md", "Unique in-place 2.38 timeline, evidence limits and file-specific rollback record"],
].map(([id, inputPath, purpose]) => Object.freeze({ id, scope: "project", path: inputPath, purpose })));

const EXPECTED_DELILE_PROFILE_COUNTS = Object.freeze([
  ["dl1.1", 30], ["dl1.2", 67], ["dl1.3", 255], ["dl1.4", 128], ["dl1.5", 41], ["dl1.6", 238], ["dl1.7", 116],
  ["dl2.1", 446], ["dl2.2", 243], ["dl2.3", 35], ["dl2.4", 157], ["dl2.5", 118],
  ["dl3.1", 90], ["dl3.2", 367], ["dl3.3", 404], ["dl3.4", 418], ["dl3.5", 138], ["dl3.6", 179],
  ["dl4.1", 1089], ["dl4.2", 626], ["dl4.3", 1010], ["dl4.4", 611], ["dl4.5", 333], ["dl4.6", 1700],
  ["dl5.1", 949], ["dl5.2", 857], ["dl5.3", 689], ["dl5.4", 1149], ["dl5.5", 419],
  ["V0.1", 92], ["V0.2", 50], ["V0.3", 46],
  ["V1.1", 151], ["V1.2", 140], ["V1.3", 231], ["V1.4", 82], ["V1.5", 144], ["V1.6", 67], ["V1.7", 54],
  ["V2a.1", 32], ["V2a.2", 190], ["V2a.3", 86], ["V2a.4", 103],
  ["V2b.1", 94], ["V2b.2", 55], ["V2b.3", 26], ["V2b.4", 287],
  ["V3.1", 110], ["V3.2", 119], ["V3.3", 78], ["V3.4", 78],
]);

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
  return { ...input, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

function simpleReceipt(input) {
  return { path: input.path, bytes: input.bytes, sha256: input.sha256 };
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

function getInput(manifest, id) {
  const input = manifest.authoritativeInputs.find((candidate) => candidate.id === id);
  check(input, `2.38 manifest is missing input ${id}`);
  return input;
}

function evidenceValue(record, label) {
  return record.evidence?.find((row) => row.label === label)?.value;
}

function validatePresentation(record) {
  const presentation = record.presentation;
  check(presentation?.contractId === "research-record-presentation-0.1", `${record.key} presentation identity drifted`);
  const evidenceIndices = [
    ...(presentation.evidencePartition?.identityEvidenceIndices ?? []),
    ...(presentation.evidencePartition?.recordSpecificEvidenceIndices ?? []),
    ...(presentation.evidencePartition?.sharedEvidenceIndices ?? []),
  ];
  const gapIndices = [
    ...(presentation.missingnessPartition?.recordSpecificGapIndices ?? []),
    ...(presentation.missingnessPartition?.sharedGapIndices ?? []),
  ];
  check(evidenceIndices.length === record.evidence.length && new Set(evidenceIndices).size === record.evidence.length, `${record.key} evidence partition drifted`);
  check(gapIndices.length === record.gaps.length && new Set(gapIndices).size === record.gaps.length, `${record.key} missingness partition drifted`);
  const exactMorphology = record.focusKind === "morphology_record";
  check(presentation.modeling?.admittedCellGeometryObjectCount === (exactMorphology ? 1 : 0), `${record.key} selected-object geometry count drifted`);
  check(presentation.modeling?.admittedInternalObjectCount === 0, `${record.key} creates an internal object`);
  check(presentation.modeling?.generatedFallbackPrimitiveCount === 0, `${record.key} creates fallback geometry`);
  check(presentation.modeling?.registrationCount === 0 && presentation.modeling?.sameCellJoinCount === 0, `${record.key} creates a registration or same-cell join`);
  check(presentation.modeling?.noFallbackPrimitive === true, `${record.key} fallback policy drifted`);
  check(same(presentation.modeling?.axes?.map((axis) => axis.axisId), ["source_record", "cell_geometry", "internal_structure", "atlas_registration", "cross_source_same_cell"]), `${record.key} readiness axes drifted`);
}

function validateCurrentInputs(sources) {
  const registry = JSON.parse(sources.get("researchSourceRegistry").toString("utf8"));
  const upgrades = JSON.parse(sources.get("researchModelUpgradeRegistry").toString("utf8"));
  const delile = JSON.parse(sources.get("delileTaxonomyContract").toString("utf8"));
  const video = JSON.parse(sources.get("pkd2l1SbfsemVideoContract").toString("utf8"));
  const explorerManifest = JSON.parse(sources.get("researchExplorerAssetManifest").toString("utf8"));
  const explorerIndex = JSON.parse(sources.get("researchExplorerSearchIndex").toString("utf8"));
  const applicationPackage = JSON.parse(sources.get("applicationPackage").toString("utf8"));
  const packageLock = JSON.parse(sources.get("packageLock").toString("utf8"));

  const recordSets = registry.sources.flatMap((source) => source.recordSets ?? []);
  const exactRosters = recordSets.filter((recordSet) => recordSet.childRosterRef?.status === "bundled_exact");
  const delileSource = registry.sources.find((source) => source.id === "SRC-DELILE-2019");
  const delileRecordSet = recordSets.find((recordSet) => recordSet.recordSetId === "RS-DELILE-FINE-SUBTYPES");
  check(registry.sourceCount === 27 && registry.sources.length === 27, "canonical source count drifted");
  check(recordSets.length === 32 && new Set(recordSets.map((recordSet) => recordSet.recordSetId)).size === 32, "canonical record-set count drifted");
  check(exactRosters.length === 9, "bundled exact-roster count drifted");
  check(delileSource?.citation?.doi === "10.1242/dev.173807", "Delile source registry DOI drifted");
  check(delileRecordSet?.includedRecordCount?.value === 51 && delileRecordSet?.childRosterRef?.status === "bundled_exact", "Delile source registry roster drifted");

  check(upgrades.summary?.upgradeCount === 171 && upgrades.upgrades?.length === 171, "research upgrade count drifted");
  check(upgrades.upgrades.at(-1)?.id === "UPG-189", "last research upgrade drifted");
  for (const id of ["UPG-183", "UPG-184", "UPG-185"]) check(upgrades.upgrades.find((item) => item.id === id)?.status === "completed", `${id} must be completed`);
  for (const id of ["UPG-186", "UPG-187", "UPG-188", "UPG-189"]) check(/^planned/.test(upgrades.upgrades.find((item) => item.id === id)?.status ?? ""), `${id} must remain planned`);

  check(delile.releaseId === "ohri-delile-developmental-interneuron-taxonomy-0.1.0", "Delile taxonomy identity drifted");
  check(delile.source?.publication?.doi === "10.1242/dev.173807" && delile.source?.biostudies?.accession === "E-MTAB-7320", "Delile source identity drifted");
  check(delile.source?.repository?.pinnedCommit === "5de98d43bf89a003ea43aeb599136f7a4e1ee055", "Delile repository commit drifted");
  check(delile.source?.annotatedMetadataObject?.bytes === 3036323 && delile.source?.annotatedMetadataObject?.sha256 === "4f5bd353771ea478928e305df784f3fc868bb89a9ffc5fbce112da70c4a769bf", "Delile annotation receipt drifted");
  check(delile.source?.annotatedMetadataObject?.sourceFileBundled === false && delile.source?.repository?.license === "NOASSERTION", "Delile source must remain link-only / NOASSERTION");
  check(delile.profiles?.length === 51 && delile.scope?.fineSubtypeProfileCount === 51, "Delile fine-subtype count drifted");
  check(same(delile.profiles.map((profile) => [profile.sourceLocalLabel, profile.cellCount]), EXPECTED_DELILE_PROFILE_COUNTS), "Delile exact profile roster drifted");
  check(delile.profiles.every((profile) => profile.id === `delile-2019:E-MTAB-7320:${profile.sourceLocalLabel}` && !profile.sourceLocalLabel.includes("dI")), "Delile IDs or source dl spelling drifted");
  check(delile.profiles.reduce((sum, profile) => sum + profile.cellCount, 0) === 15217, "Delile profile counts do not sum to 15,217");
  check(delile.scope?.totalMetadataCellCount === 41025 && delile.scope?.sourceDefinedNeuronCellCount === 18144 && delile.scope?.sourceTypedNonmotorNeuronCellCount === 15394, "Delile upstream denominator flow drifted");
  check(delile.scope?.cardinalOnlyInterneuronCellCount === 177 && delile.scope?.motorNeuronExcludedCellCount === 1056 && delile.scope?.nullNeuronExcludedCellCount === 1694, "Delile retained exclusions drifted");
  check(delile.scope?.sourceStageReplicateLabelCount === 12 && delile.scope?.biologicalAnimalCount === null, "Delile replicate-label / animal boundary drifted");
  for (const field of ["admittedGeometryCount", "admittedInternalStructureCount", "sameCellMorphologyTranscriptomicsJoinCount", "sameCellPhysiologyTranscriptomicsJoinCount", "sameCellInternalStructureTranscriptomicsJoinCount", "projectRegistrationCount", "exactCrossSourceIdentityCount"]) check(delile.scope?.[field] === 0, `Delile ${field} must remain zero`);
  check(sources.get("delileTaxonomyContract").byteLength === 122037 && sha256(sources.get("delileTaxonomyContract")) === "7a77c8c10f15224188bb542fddf63bc97de57b06dd9289e324bc7b8612219597", "Delile compact contract receipt drifted");

  check(video.contractId === "ohri-pkd2l1-sbfsem-video-reference-0.1.0" && video.authority === "OBS_PUBLICATION_VIDEO_REFERENCE", "PKD2L1 video contract identity drifted");
  check(video.source?.doi === "10.7554/eLife.83108" && video.source?.articleVersion === 2, "PKD2L1 article identity drifted");
  check(video.source?.apiReceipt?.bytes === 247909 && video.source?.apiReceipt?.sha256 === "854963b39bbb091f4cf3a03c470e3a644a69444741b59aa6287b31ed10f97944", "PKD2L1 article API receipt drifted");
  check(video.video?.id === "video5" && video.video?.width === 872 && video.video?.height === 1080, "PKD2L1 Video 5 identity drifted");
  check(video.video?.sources?.find((item) => item.format === "mp4")?.bytes === 46541650, "PKD2L1 MP4 receipt drifted");
  check(video.acquisition?.pixelSizeNanometre === 5 && video.acquisition?.sectionStepNanometre === 50 && video.acquisition?.reportedDepth === ">25 µm", "PKD2L1 acquisition context drifted");
  check(video.availabilityAudit?.scope === "official_article_and_article_api_only" && video.availabilityAudit?.notAUniversalAbsenceClaim === true, "PKD2L1 availability-audit scope drifted");
  check(video.objectReadiness?.coordinateBearingObjectAdmitted === false && video.objectReadiness?.eligibleForThreeDimensionalReconstruction === false, "PKD2L1 video was promoted to reconstruction evidence");
  check(video.objectReadiness?.admittedGeometryPrimitiveCount === 0 && video.objectReadiness?.admittedInternalObjectCount === 0 && video.objectReadiness?.measurementUse === "forbidden", "PKD2L1 object-readiness zero boundary drifted");

  check(explorerManifest.schemaVersion === "1.12.0" && explorerManifest.index?.recordCount === 630, "Explorer manifest identity or record count drifted");
  check(explorerManifest.sourceFiles?.length === 20, "Explorer source-file denominator drifted");
  check(explorerManifest.expectedCounts?.byFocusKind?.molecular_profile === 376 && explorerManifest.expectedCounts?.byFocusKind?.source_lane === 8, "Explorer molecular or source-lane count drifted");
  check(explorerIndex.schemaVersion === "1.12.0" && explorerIndex.records?.length === 630, "Explorer index identity or count drifted");
  const molecularRecords = explorerIndex.records.filter((record) => record.focusKind === "molecular_profile");
  const delileRecords = molecularRecords.filter((record) => record.namespace === "delile-2019:E-MTAB-7320");
  check(molecularRecords.length === 376 && new Set(molecularRecords.map((record) => record.namespace)).size === 9, "Explorer source-profile denominator drifted");
  check(delileRecords.length === 51, "Explorer Delile record count drifted");
  check(delileRecords.every((record) => record.coordinate?.geometryStatus === "TYPE_LEVEL" && record.coordinate?.registrationCount === 0 && record.coordinate?.measurementUse === "forbidden"), "Explorer Delile geometry boundary drifted");
  for (const record of explorerIndex.records) validatePresentation(record);
  for (const profile of delile.profiles) {
    const record = delileRecords.find((candidate) => candidate.focusId === profile.id);
    check(record, `Explorer is missing Delile ${profile.sourceLocalLabel}`);
    check(evidenceValue(record, "Source-local label") === profile.sourceLocalLabel, `Explorer ${profile.sourceLocalLabel} source label drifted`);
    check(evidenceValue(record, "Exact sampled-cell count") === `${profile.cellCount} source-annotated fine-subtype cells`, `Explorer ${profile.sourceLocalLabel} count drifted`);
    check(record.presentation.evidencePartition.sharedEvidenceIndices.length > 0, `Explorer ${profile.sourceLocalLabel} does not collapse shared source context`);
    check(record.presentation.modeling.route === "source_record_evidence_only", `Explorer ${profile.sourceLocalLabel} modeling route drifted`);
  }
  check(evidenceValue(delileRecords[0], "Exact sampled-cell count") !== evidenceValue(delileRecords.at(-1), "Exact sampled-cell count"), "Delile record switching does not change count evidence");
  check(evidenceValue(delileRecords[0], "Fine-subtype timepoint cell counts") !== evidenceValue(delileRecords.at(-1), "Fine-subtype timepoint cell counts"), "Delile record switching does not change timepoint evidence");

  check(applicationPackage.version === packageLock.version && packageLock.packages?.[""]?.version === applicationPackage.version, "package and lockfile versions disagree");
  assertText(sources.get("researchExplorerIndexRuntime"), ["manifest.schemaVersion !== \"1.12.0\"", "molecular_profile: 376", "validateResearchRecordPresentation"], "Research Explorer runtime");
  assertText(sources.get("researchExplorerBuilder"), ["delileDevelopmental", "attachResearchRecordPresentations", "total: 630"], "Research Explorer builder");
  assertText(sources.get("researchRecordPresentationRuntime"), ["record_specific_evidence", "shared_source_context", "clear_prior_cell_geometry_and_replace_source_record_evidence_model"], "record-presentation runtime");
  assertText(sources.get("researchRecordModelReadout"), ["SELECTED SOURCE-RECORD MODEL · NOT A CELL SHAPE", "Exact 3D modeling readiness", "0 fallback cell shapes"], "record-model readout");
  assertText(sources.get("researchRecordPresentationTest"), ["collapsing exact source context", "without inventing shapes", "exact-source geometry route"], "record-presentation tests");
  assertText(sources.get("researchFocusEvidencePanel"), ["Record-specific receipt", "exact shared source-context fields · shown once", "Exact modeling readiness"], "focus evidence panel");
  assertText(sources.get("internalStructureReferencePanel"), ["OBS PUBLICATION VIDEO · MOUSE SPINAL", "VIDEO / 0 ADMITTED 3D OBJECTS", "not a universal absence claim"], "internal-reference panel");

  return {
    registry,
    upgrades,
    delile,
    video,
    explorerManifest,
    applicationVersion: applicationPackage.version,
    recordSetCount: recordSets.length,
    exactRosterCount: exactRosters.length,
    sourceProfileCount: molecularRecords.length,
    sourceNamespaceCount: new Set(molecularRecords.map((record) => record.namespace)).size,
  };
}

export function serializeResearchIterationManifest238(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export async function buildResearchIterationManifest238() {
  const parentBytes = await readFile(PARENT_PATH);
  const parent = JSON.parse(parentBytes.toString("utf8"));
  check(parent.releaseId === RESEARCH_ITERATION_238_PARENT.releaseId, "immutable 2.37 parent release identity drifted");
  check(parentBytes.byteLength === RESEARCH_ITERATION_238_PARENT.bytes && sha256(parentBytes) === RESEARCH_ITERATION_238_PARENT.fileSha256, "immutable 2.37 parent file receipt drifted");
  check(parent.manifestContentSha256 === RESEARCH_ITERATION_238_PARENT.contentSha256 && computeManifestContentSha256(parent) === RESEARCH_ITERATION_238_PARENT.contentSha256, "immutable 2.37 parent content receipt drifted");

  const inheritedBytes = await Promise.all(parent.authoritativeInputs.map((input) => readFile(sourcePath(parent, input))));
  const additionalBytes = await Promise.all(ADDITIONAL_INPUTS.map((input) => readFile(path.join(PROJECT_ROOT, input.path))));
  const manifest = structuredClone(parent);
  manifest.authoritativeInputs = parent.authoritativeInputs.map((input, index) => receipt({
    ...input,
    purpose: RESEARCH_ITERATION_238_PURPOSE_OVERRIDES[input.id] ?? input.purpose,
  }, inheritedBytes[index]));
  manifest.authoritativeInputs.push(...ADDITIONAL_INPUTS.map((input, index) => receipt(input, additionalBytes[index])));
  check(new Set(manifest.authoritativeInputs.map((input) => input.id)).size === manifest.authoritativeInputs.length, "2.38 authoritative input IDs are not unique");
  check(new Set(manifest.authoritativeInputs.map((input) => input.path)).size === manifest.authoritativeInputs.length, "2.38 authoritative input paths are not unique");

  const sources = new Map();
  manifest.authoritativeInputs.forEach((input, index) => {
    const bytes = index < inheritedBytes.length ? inheritedBytes[index] : additionalBytes[index - inheritedBytes.length];
    sources.set(input.id, bytes);
  });
  const current = validateCurrentInputs(sources);

  manifest.manifestSchemaVersion = "2.38.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.38.0";
  manifest.releaseDate = "2026-09-02";
  manifest.application.version = current.applicationVersion;
  manifest.parentIterationManifest = { ...RESEARCH_ITERATION_238_PARENT };
  manifest.baseResearchRelease.note = "Iteration 2.38 makes the knowledge base itself drive the selected-record model, evidence sections and five-axis modeling-readiness display. Exact record-specific fields remain visible while byte-identical source context and shared gaps collapse once. It adds 51 checksum-derived, source-local Delile embryonic fine-subtype aggregates, increasing Explorer discovery to 630 records and 376 molecular profiles. eLife 83108 Video 5 is admitted only as a remote qualitative PKD2L1 SBF-SEM publication reference; it is not a coordinate-bearing object. Molecular selection clears prior geometry. No fallback shape, internal object, same-cell join, registration, project copy or package copy is added.";
  manifest.integrity.inputCount = manifest.authoritativeInputs.length;

  const inputReceipt = (id) => simpleReceipt(getInput(manifest, id));
  manifest.exactReferences.delilePresentationAndPkd2l1Integrity = {
    contractId: "ohri-delile-presentation-pkd2l1-integrity-2.38",
    delileReleaseId: current.delile.releaseId,
    delileDoi: current.delile.source.publication.doi,
    delileAccession: current.delile.source.biostudies.accession,
    delileNamespace: "delile-2019:E-MTAB-7320",
    pkd2l1VideoContractId: current.video.contractId,
    pkd2l1VideoDoi: current.video.source.doi,
    canonicalSourceCount: current.registry.sourceCount,
    canonicalRecordSetCount: current.recordSetCount,
    bundledExactRosterCount: current.exactRosterCount,
    sourceProfileCount: current.sourceProfileCount,
    sourceNamespaceCount: current.sourceNamespaceCount,
    researchExplorerRecordCount: current.explorerManifest.index.recordCount,
    researchExplorerMolecularProfileCount: current.explorerManifest.expectedCounts.byFocusKind.molecular_profile,
    researchExplorerSourceLaneCount: current.explorerManifest.expectedCounts.byFocusKind.source_lane,
    researchExplorerSourceFileCount: current.explorerManifest.sourceFiles.length,
    delileFineSubtypeCount: current.delile.scope.fineSubtypeProfileCount,
    delileFineSubtypeCellCount: current.delile.scope.fineSubtypeInterneuronCellCount,
    delileTotalMetadataCellCount: current.delile.scope.totalMetadataCellCount,
    delileSourceDefinedNeuronCellCount: current.delile.scope.sourceDefinedNeuronCellCount,
    delileTypedNonmotorNeuronCellCount: current.delile.scope.sourceTypedNonmotorNeuronCellCount,
    delileCardinalOnlyCellCount: current.delile.scope.cardinalOnlyInterneuronCellCount,
    delileMotorNeuronExcludedCellCount: current.delile.scope.motorNeuronExcludedCellCount,
    delileNullNeuronExcludedCellCount: current.delile.scope.nullNeuronExcludedCellCount,
    delileLifeStageCount: current.delile.scope.lifeStages.length,
    delileStageReplicateLabelCount: current.delile.scope.sourceStageReplicateLabelCount,
    pkd2l1ArticleApiVersion: current.video.source.articleVersion,
    pkd2l1ArticleApiBytes: current.video.source.apiReceipt.bytes,
    pkd2l1VideoWidth: current.video.video.width,
    pkd2l1VideoHeight: current.video.video.height,
    pkd2l1Mp4Bytes: current.video.video.sources.find((item) => item.format === "mp4").bytes,
    pkd2l1PixelSizeNanometre: current.video.acquisition.pixelSizeNanometre,
    pkd2l1SectionStepNanometre: current.video.acquisition.sectionStepNanometre,
    researchUpgradeCount: current.upgrades.summary.upgradeCount,
    lastResearchUpgradeId: current.upgrades.upgrades.at(-1).id,
    admittedGeometryCount: 0,
    admittedInternalStructureCount: 0,
    generatedFallbackPrimitiveCount: 0,
    registrationCount: 0,
    sameCellCrossModalJoinCount: 0,
    projectCopyCount: 0,
    packageCopyCount: 0,
    completeContentFolderCopyCount: 0,
    delileTaxonomyReceipt: inputReceipt("delileTaxonomyContract"),
    delileBuilderReceipt: inputReceipt("delileTaxonomyBuilder"),
    delileSchemaReceipt: inputReceipt("delileTaxonomySchema"),
    delileValidatorReceipt: inputReceipt("delileTaxonomyValidator"),
    delileTestReceipt: inputReceipt("delileTaxonomyTest"),
    pkd2l1VideoReceipt: inputReceipt("pkd2l1SbfsemVideoContract"),
    pkd2l1CaptionReceipt: inputReceipt("pkd2l1SbfsemVideoCaptions"),
    pkd2l1ValidatorReceipt: inputReceipt("pkd2l1SbfsemVideoValidator"),
    pkd2l1TestReceipt: inputReceipt("pkd2l1SbfsemVideoTest"),
    presentationRuntimeReceipt: inputReceipt("researchRecordPresentationRuntime"),
    modelReadoutReceipt: inputReceipt("researchRecordModelReadout"),
    presentationTestReceipt: inputReceipt("researchRecordPresentationTest"),
    explorerAssetManifestReceipt: inputReceipt("researchExplorerAssetManifest"),
    explorerSearchIndexReceipt: inputReceipt("researchExplorerSearchIndex"),
    sourceRegistryReceipt: inputReceipt("researchSourceRegistry"),
    upgradeRegistryReceipt: inputReceipt("researchModelUpgradeRegistry"),
    timelineReceipt: inputReceipt("researchTimeline238"),
    exactDelileFineSubtypeRosterAdmitted: true,
    sourceDlSpellingPreserved: true,
    stageReplicateLabelsNotPromotedToAnimals: true,
    delileSourceObjectLinkOnlyNoassertion: true,
    recordDrivenModelPresentation: true,
    recordSpecificEvidencePartitioned: true,
    exactSharedSourceContextCollapsed: true,
    sharedMissingnessCollapsed: true,
    fiveAxisModelingReadinessDisplayed: true,
    molecularSwitchClearsPriorGeometry: true,
    evidenceReadoutIsNotCellShape: true,
    pkd2l1VideoQualitativeOnly: true,
    pkd2l1AvailabilityFindingScopedToArticleAndApi: true,
    noGenericGeometrySubstitution: true,
  };

  manifest.registrySummary = {
    ...parent.registrySummary,
    canonicalSourcePackageCount: current.registry.sourceCount,
    canonicalRecordSetCount: current.recordSetCount,
    bundledExactRosterCount: current.exactRosterCount,
    researchUpgradeCount: current.upgrades.summary.upgradeCount,
    sourceProfileCount: current.sourceProfileCount,
    sourceNamespaceCount: current.sourceNamespaceCount,
    researchExplorerRecordCount: current.explorerManifest.index.recordCount,
    sourceRegistryReceipt: getInput(manifest, "researchSourceRegistry"),
    upgradeRegistryReceipt: getInput(manifest, "researchModelUpgradeRegistry"),
  };
  manifest.scientificBoundaries.delilePresentationAndPkd2l1Integrity = "Iteration 2.38 admits 51 source-local Delile embryonic fine-subtype aggregates covering 15,217 captured cells, not 51 adult canonical types or individual cells. The denominator chain preserves 41,025 metadata cells, 18,144 source-defined neurons, 15,394 typed non-motor neurons, 177 cardinal-only cells, 1,056 excluded MN cells and 1,694 excluded Null_Neuron cells. Five stages and 12 stage-replicate labels do not establish 12 animals; source spelling dl is preserved. The source annotation table remains link-only under NOASSERTION. The selected-record presentation separates identity and record-specific evidence from byte-identical shared source context, collapses shared gaps once, and exposes five readiness axes. A molecular evidence model is explicitly not a cell shape and clears prior geometry. eLife 83108 Video 5 remains remote qualitative publication imagery: the official article/API audit exposes no admitted raw coordinate-bearing stack, segmentation, mesh or skeleton, and this scoped finding is not a universal absence claim. The video cannot be traced, measured, reconstructed, registered or same-cell joined. Zero new cell geometry, fallback primitives, internal objects, same-cell joins, registrations, project copies, package copies or complete-content folder copies are added.";
  manifest.registrations = { count: 0, records: [] };
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(serializeResearchIterationManifest238(manifest), "utf8") };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  for (const arg of args) check(arg === "--write" || arg === "--check", `unknown argument: ${arg}`);
  check(!(args.has("--write") && args.has("--check")), "--write and --check are mutually exclusive");
  const built = await buildResearchIterationManifest238();
  if (args.has("--write")) await writeFile(OUTPUT_PATH, built.bytes);
  if (args.has("--check")) {
    const committed = await readFile(OUTPUT_PATH);
    check(committed.equals(built.bytes), "research iteration manifest 2.38 is stale; run builder with --write");
  }
  const exact = built.manifest.exactReferences.delilePresentationAndPkd2l1Integrity;
  process.stdout.write(`${JSON.stringify({
    releaseId: built.manifest.releaseId,
    applicationVersion: built.manifest.application.version,
    inputCount: built.manifest.integrity.inputCount,
    researchUpgradeCount: built.manifest.registrySummary.researchUpgradeCount,
    canonicalSourceCount: built.manifest.registrySummary.canonicalSourcePackageCount,
    canonicalRecordSetCount: built.manifest.registrySummary.canonicalRecordSetCount,
    sourceProfileCount: built.manifest.registrySummary.sourceProfileCount,
    sourceNamespaceCount: built.manifest.registrySummary.sourceNamespaceCount,
    researchExplorerRecordCount: built.manifest.registrySummary.researchExplorerRecordCount,
    researchExplorerSourceFileCount: exact.researchExplorerSourceFileCount,
    delileFineSubtypeCount: exact.delileFineSubtypeCount,
    admittedGeometryCount: exact.admittedGeometryCount,
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
