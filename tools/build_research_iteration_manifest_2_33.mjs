#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { buildSourceRecordDelta } from "../app/source-record-delta.js";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.33.json");
const PARENT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.32.json");

const PARENT_RECEIPT = Object.freeze({
  path: "data/research-iteration-manifest-2.32.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.32.0",
  bytes: 98357,
  fileSha256: "eaacd5bb0acae3c704e24ac2c1ffa4ef508bc5491155898bec6f28a825ea5e77",
  contentSha256: "4b0ed4508655553736b656f7a72a6d2e869218e0a4eff886811c7f0f15e113a2",
});

const SUPERSEDED_INPUT_IDS = Object.freeze([
  "researchModelUpgradeRegistry",
  "packageLock",
  "mainSceneTopologyIntegration",
  "atlasFocusSynchronization",
  "typeAtlasFingerprintIntegration",
]);

const ADDITIONAL_INPUTS = Object.freeze([
  ["micronsSourceNativeClippingContract", "data/microns-source-native-clipping-0.1.json", "Exact source-native MICrONS cell-shell clipping contract"],
  ["micronsSourceNativeClippingSchema", "schemas/microns-source-native-clipping-0.1.schema.json", "Fail-closed MICrONS clipping JSON schema"],
  ["micronsSourceNativeClippingRuntime", "app/microns-source-native-clipping.js", "Source-native clipping state, coordinate and receipt runtime"],
  ["micronsSourceNativeClippingValidator", "scripts/validate-microns-source-native-clipping-0.1.mjs", "Clipping receipt and scientific-boundary validator"],
  ["micronsSourceNativeClippingTest", "tests/microns-source-native-clipping.test.mjs", "Exact clipping and zero-claim regression tests"],
  ["internalStructureReferencePanel", "app/InternalStructureReferencePanel.tsx", "MICrONS source-native clipping controls and explicit cross-region limits"],
  ["sourceRecordDeltaRuntime", "app/source-record-delta.js", "Whitelisted exact display-string source-record delta helper"],
  ["sourceRecordDeltaInspector", "app/SourceRecordDeltaInspector.tsx", "Old/current changed rows and once-only exact shared rows"],
  ["sourceRecordDeltaTest", "tests/source-record-delta.test.mjs", "Source-record delta identity and geometry zero-boundary tests"],
  ["micronsImportProvenanceRuntime", "app/microns-import-provenance.js", "MICrONS clipping import/export provenance guard"],
  ["micronsImportProvenanceTest", "tests/microns-import-provenance.test.mjs", "MICrONS provenance import/export regression tests"],
  ["atlasTypeContracts", "app/atlas-types.ts", "Typed MICrONS clipping state and runtime receipt contracts"],
].map(([id, inputPath, purpose]) => Object.freeze({ id, scope: "project", path: inputPath, purpose })));

const ALKASLASI_PATH = path.join(PROJECT_ROOT, "data/alkaslasi-cholinergic-source-taxonomy-0.1.json");
const TYPE_ATLAS_DELTA_ROW_IDS = Object.freeze([
  "parent-source",
  "namespace",
  "record-kind",
  "observation-unit",
  "assignment-authority",
  "cell-roster",
  "source-label",
  "region",
  "transmitter",
  "markers",
  "life-stage",
  "spinal-scope",
  "major-type",
  "sampling-count",
  "putative-assignment",
  "morphology",
  "cell-coordinates",
  "sci-context",
  "atlas-registration",
  "electrophysiology",
  "projection-target",
  "synaptic-connectivity",
  "internal-structure",
  "same-cell-link",
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

function simpleReceipt(input, bytes) {
  return { path: input.path, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

function replaceInputReceipt(manifest, id, bytes) {
  const index = manifest.authoritativeInputs.findIndex((input) => input.id === id);
  check(index >= 0, `missing inherited authoritative input ${id}`);
  manifest.authoritativeInputs[index] = receipt(manifest.authoritativeInputs[index], bytes);
  return manifest.authoritativeInputs[index];
}

function getDeltaDemonstration(taxonomy) {
  const i1 = taxonomy.profiles.find((profile) => profile.id === "alkaslasi-2021:GSE167597:I1");
  const i2 = taxonomy.profiles.find((profile) => profile.id === "alkaslasi-2021:GSE167597:I2");
  check(i1 && i2, "I1/I2 exact source records are missing");
  const rows = [
    { id: "sampling-count", label: "Dataset sampling count", read: (profile) => `${profile.samplingCount.value.toLocaleString("en-US")} ${profile.samplingCount.unit}` },
    { id: "markers", label: "Source marker panel", read: (profile) => profile.markerPanel.join(" · ") },
    { id: "region-membership", label: "Source-region membership", read: (profile) => Object.entries(profile.sampleRegionMembership.counts).map(([region, count]) => `${region} ${count}`).join(" · ") },
    { id: "life-stage", label: "Life stage", read: (profile) => profile.lifeStage },
    { id: "transmitter", label: "Transmitter class", read: (profile) => profile.transmitterClass },
    { id: "morphology", label: "Morphology", read: (profile) => profile.missingEvidence.morphology },
    { id: "internal-structure", label: "Internal structure", read: (profile) => profile.missingEvidence.intracellularStructures },
    { id: "same-cell-link", label: "Cross-source same-cell link", read: (profile) => profile.missingEvidence.crossSourceSameCellIdentityLink },
  ];
  const describe = (profile) => ({
    id: profile.id,
    label: profile.sourceLocalLabel,
    namespace: "alkaslasi-2021:GSE167597",
    value: profile,
  });
  return buildSourceRecordDelta({ oldRecord: describe(i1), currentRecord: describe(i2), rows });
}

function validateClippingContract(contract) {
  check(contract.contractId === "microns-source-native-clipping-0.1" && contract.releaseId === "ohri-microns-source-native-clipping-0.1.0", "MICrONS clipping contract identity drifted");
  check(contract.upgradeId === "UPG-166" && contract.sourceReference.cellRootId === "648518346349516051" && contract.sourceReference.linkedNucleusId === "4309", "MICrONS clipping source identity drifted");
  check(contract.sourceReference.nativeFrame === "MICrONS_Phase1_aligned_EM_native" && contract.sourceReference.nativeUnits === "nanometre" && contract.sourceReference.regionRelationshipToProject === "cross_region_not_spinal_cord", "MICrONS clipping source frame or region boundary drifted");
  check(same(contract.clippingOperation.axisOrder, ["x", "y", "z"]), "MICrONS clipping axis order drifted");
  check(same(contract.clippingOperation.somaCentreNanometre, [246864, 164668, 80240]), "MICrONS clipping soma-centre receipt drifted");
  check(same(contract.clippingOperation.defaultState, { enabled: false, axis: "z", positionNanometre: 80240, keepSide: "positive" }), "MICrONS clipping default state drifted");
  check(contract.unchangedGeometryReceipts.cell.vertexCount === 372382 && contract.unchangedGeometryReceipts.cell.triangleCount === 704444, "MICrONS cell geometry denominators drifted");
  check(contract.unchangedGeometryReceipts.nucleus.vertexCount === 12682 && contract.unchangedGeometryReceipts.nucleus.triangleCount === 23344, "MICrONS nucleus geometry denominators drifted");
  const claims = contract.claimPolicy;
  check(claims.cellClippingPlaneCountWhenEnabled === 1 && claims.nucleusClippingPlaneCount === 0, "MICrONS clipping-plane boundary drifted");
  for (const field of ["capPrimitiveCount", "repairCount", "resamplingCount", "generatedGeometryCount", "geometryMutationCount", "joinCount", "registrationCount"]) check(claims[field] === 0, `MICrONS clipping ${field} must remain zero`);
  for (const field of ["measurementClaim", "membraneClaim", "spinalInternalStructureClaim"]) check(claims[field] === false, `MICrONS clipping ${field} must remain false`);
}

function validateImplementation(sources) {
  const source = (id) => sources.get(id).toString("utf8");
  for (const snippet of ["validateMicronsClipState", "buildMicronsWorldClippingPlane", "nucleusClippingPlaneCount: 0", "generatedGeometryCount: 0"]) check(source("micronsSourceNativeClippingRuntime").includes(snippet), `clipping runtime is missing ${snippet}`);
  for (const snippet of ["renderer.localClippingEnabled = true", "applyMicronsSourceNativeClipping", "componentName === \"cell\""]) check(source("mainSceneTopologyIntegration").includes(snippet), `scene clipping integration is missing ${snippet}`);
  for (const snippet of ["micronsClipAxis", "micronsClipNm", "micronsClipSide", "micronsClipping"]) check(source("atlasFocusSynchronization").includes(snippet), `atlas clipping state is missing ${snippet}`);
  for (const snippet of ["Source-native shell clipping", "Nucleus remains intact", "Uncapped shader cut"]) check(source("internalStructureReferencePanel").includes(snippet), `clipping panel is missing ${snippet}`);
  const typeAtlasSource = source("typeAtlasFingerprintIntegration");
  for (const snippet of ["SourceRecordDeltaInspector", "oldRecord=", "currentRecord="]) check(typeAtlasSource.includes(snippet), `type-atlas delta integration is missing ${snippet}`);
  const rowBlockStart = typeAtlasSource.indexOf("const SOURCE_RECORD_DELTA_ROWS");
  const rowBlockEnd = typeAtlasSource.indexOf("\n];", rowBlockStart);
  check(rowBlockStart >= 0 && rowBlockEnd > rowBlockStart, "type-atlas delta whitelist block is missing");
  const uiWhitelistedRowIds = [...typeAtlasSource.slice(rowBlockStart, rowBlockEnd).matchAll(/\{ id: "([^"]+)"/g)].map((match) => match[1]);
  check(same(uiWhitelistedRowIds, TYPE_ATLAS_DELTA_ROW_IDS), "type-atlas delta whitelist roster or order drifted");
  for (const snippet of ["SOURCE-RECORD DELTA · DISPLAY ONLY", "0 same-cell identities", "0 geometry primitives"]) check(source("sourceRecordDeltaInspector").includes(snippet), `source-record delta inspector is missing ${snippet}`);
  for (const snippet of ["crossSourceSameCellIdentityCount: 0", "admittedGeometryPrimitiveCount: 0", "registrationCount: 0"]) check(source("sourceRecordDeltaRuntime").includes(snippet), `source-record delta boundary is missing ${snippet}`);
  for (const snippet of ["requestedClipping", "clippingContract", "runtimeReceiptTrusted: false"]) check(source("micronsImportProvenanceRuntime").includes(snippet), `MICrONS provenance runtime is missing ${snippet}`);
  for (const snippet of ["research-iteration-manifest-2.33.json", "micronsSourceNativeClippingJson", "export const micronsSourceNativeClipping"]) check(source("atlasTypeContracts").includes(snippet), `atlas type contract is missing ${snippet}`);
  return { uiWhitelistedRowIds };
}

export function serializeResearchIterationManifest233(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export async function buildResearchIterationManifest233() {
  const inheritedInputs = JSON.parse((await readFile(PARENT_PATH)).toString("utf8")).authoritativeInputs;
  const inheritedById = new Map(inheritedInputs.map((input) => [input.id, input]));
  const supersededPaths = SUPERSEDED_INPUT_IDS.map((id) => {
    const input = inheritedById.get(id);
    check(input, `2.32 parent is missing ${id}`);
    return path.join(PROJECT_ROOT, input.path);
  });
  const additionalPaths = ADDITIONAL_INPUTS.map((input) => path.join(PROJECT_ROOT, input.path));
  const [parentBytes, taxonomyBytes, ...liveBytes] = await Promise.all([
    readFile(PARENT_PATH),
    readFile(ALKASLASI_PATH),
    ...supersededPaths.map((inputPath) => readFile(inputPath)),
    ...additionalPaths.map((inputPath) => readFile(inputPath)),
  ]);
  const parent = JSON.parse(parentBytes.toString("utf8"));
  const taxonomy = JSON.parse(taxonomyBytes.toString("utf8"));
  const supersededBytes = liveBytes.slice(0, SUPERSEDED_INPUT_IDS.length);
  const additionalBytes = liveBytes.slice(SUPERSEDED_INPUT_IDS.length);
  const sources = new Map();
  SUPERSEDED_INPUT_IDS.forEach((id, index) => sources.set(id, supersededBytes[index]));
  ADDITIONAL_INPUTS.forEach((input, index) => sources.set(input.id, additionalBytes[index]));
  const inputById = new Map(ADDITIONAL_INPUTS.map((input) => [input.id, input]));

  check(parent.releaseId === PARENT_RECEIPT.releaseId, "immutable 2.32 parent release identity drifted");
  check(parentBytes.byteLength === PARENT_RECEIPT.bytes && sha256(parentBytes) === PARENT_RECEIPT.fileSha256, "immutable 2.32 parent file receipt drifted");
  check(parent.manifestContentSha256 === PARENT_RECEIPT.contentSha256 && computeManifestContentSha256(parent) === PARENT_RECEIPT.contentSha256, "immutable 2.32 parent content receipt drifted");
  const upgradeRegistry = JSON.parse(sources.get("researchModelUpgradeRegistry").toString("utf8"));
  const packageLock = JSON.parse(sources.get("packageLock").toString("utf8"));
  check(upgradeRegistry.summary.upgradeCount === upgradeRegistry.upgrades.length && upgradeRegistry.summary.upgradeCount > 148 && upgradeRegistry.upgrades.at(-1)?.id === "UPG-169", "2.33 upgrade-registry denominator or range drifted");
  check(upgradeRegistry.upgrades.find((item) => item.id === "UPG-166")?.status === "completed", "UPG-166 is not complete");
  check(upgradeRegistry.upgrades.find((item) => item.id === "UPG-167")?.status === "completed", "UPG-167 is not complete");
  check(packageLock.version === "2.33.0-research.1" && packageLock.packages?.[""]?.version === "2.33.0-research.1", "package-lock application version drifted");
  const clipping = JSON.parse(sources.get("micronsSourceNativeClippingContract").toString("utf8"));
  validateClippingContract(clipping);
  const implementation = validateImplementation(sources);
  const delta = getDeltaDemonstration(taxonomy);
  check(same(delta.summary, { whitelistedRowCount: 8, sharedRowCount: 5, changedRowCount: 3, unlistedFieldCountInspected: 0 }), "I1/I2 source-record delta denominator drifted");
  check(same(delta.changedRows.map((row) => row.id), ["sampling-count", "markers", "region-membership"]), "I1/I2 changed-row roster drifted");

  const manifest = structuredClone(parent);
  manifest.manifestSchemaVersion = "2.33.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.33.0";
  manifest.releaseDate = "2026-09-01";
  manifest.application.version = "2.33.0-research.1";
  manifest.parentIterationManifest = { ...PARENT_RECEIPT };
  manifest.baseResearchRelease.note = "Iteration 2.33 adds an exact, reversible MICrONS source-native shader clipping plane for the already admitted visual-cortex cell shell while its source-linked nucleus remains intact. It also adds a whitelisted display-string delta for two exact source records so changed values appear old/current and exact shared rows appear once. Neither display operation establishes spinal anatomy, same-cell or same-type identity, geometry transfer, internal structure, measurement, cross-source joins or registration.";

  const replacements = new Map();
  SUPERSEDED_INPUT_IDS.forEach((id, index) => replacements.set(id, replaceInputReceipt(manifest, id, supersededBytes[index])));
  manifest.authoritativeInputs.push(...ADDITIONAL_INPUTS.map((input, index) => receipt(input, additionalBytes[index])));
  check(manifest.authoritativeInputs.length === 75, "research iteration 2.33 must contain exactly 75 authoritative inputs");
  check(new Set(manifest.authoritativeInputs.map((input) => input.id)).size === 75 && new Set(manifest.authoritativeInputs.map((input) => input.path)).size === 75, "2.33 authoritative input IDs or paths are not unique");
  manifest.integrity.inputCount = 75;

  const clipReceipt = (id) => simpleReceipt(inputById.get(id), sources.get(id));
  const inheritedReceipt = (id) => {
    const input = manifest.authoritativeInputs.find((item) => item.id === id);
    return { path: input.path, bytes: input.bytes, sha256: input.sha256 };
  };
  manifest.exactReferences.micronsClippingAndSourceRecordDeltaIntegrity = {
    contractId: "ohri-microns-clipping-source-record-delta-integrity-2.33",
    micronsSourceNativeClipping: {
      contractId: clipping.contractId,
      releaseId: clipping.releaseId,
      upgradeId: clipping.upgradeId,
      authority: clipping.authority,
      sourceCellRootId: clipping.sourceReference.cellRootId,
      sourceLinkedNucleusId: clipping.sourceReference.linkedNucleusId,
      nativeFrame: clipping.sourceReference.nativeFrame,
      nativeUnits: clipping.sourceReference.nativeUnits,
      region: clipping.sourceReference.region,
      regionRelationshipToProject: clipping.sourceReference.regionRelationshipToProject,
      axisCount: clipping.clippingOperation.axisOrder.length,
      defaultState: clipping.clippingOperation.defaultState,
      cellVertexCount: clipping.unchangedGeometryReceipts.cell.vertexCount,
      cellTriangleCount: clipping.unchangedGeometryReceipts.cell.triangleCount,
      nucleusVertexCount: clipping.unchangedGeometryReceipts.nucleus.vertexCount,
      nucleusTriangleCount: clipping.unchangedGeometryReceipts.nucleus.triangleCount,
      contractReceipt: clipReceipt("micronsSourceNativeClippingContract"),
      schemaReceipt: clipReceipt("micronsSourceNativeClippingSchema"),
      runtimeReceipt: clipReceipt("micronsSourceNativeClippingRuntime"),
      validatorReceipt: clipReceipt("micronsSourceNativeClippingValidator"),
      testReceipt: clipReceipt("micronsSourceNativeClippingTest"),
      panelReceipt: clipReceipt("internalStructureReferencePanel"),
      sceneIntegrationReceipt: inheritedReceipt("mainSceneTopologyIntegration"),
      atlasStateIntegrationReceipt: inheritedReceipt("atlasFocusSynchronization"),
      importProvenanceReceipt: clipReceipt("micronsImportProvenanceRuntime"),
      importProvenanceTestReceipt: clipReceipt("micronsImportProvenanceTest"),
      atlasTypesReceipt: clipReceipt("atlasTypeContracts"),
      sourceBufferMutation: false,
      cellClippingPlaneCountWhenEnabled: 1,
      nucleusClippingPlaneCount: 0,
      capPrimitiveCount: 0,
      repairCount: 0,
      resamplingCount: 0,
      generatedGeometryCount: 0,
      geometryMutationCount: 0,
      joinCount: 0,
      registrationCount: 0,
      measurementClaim: false,
      membraneClaim: false,
      spinalInternalStructureClaim: false,
    },
    sourceRecordDelta: {
      contractId: delta.contractId,
      upgradeId: "UPG-167",
      mode: delta.mode,
      authority: delta.boundary.authority,
      relationshipStatus: delta.boundary.relationshipStatus,
      oldRecordId: delta.oldRecord.id,
      currentRecordId: delta.currentRecord.id,
      uiWhitelistedRowCount: implementation.uiWhitelistedRowIds.length,
      uiWhitelistedRowIds: implementation.uiWhitelistedRowIds,
      demonstrationWhitelistedRowCount: delta.summary.whitelistedRowCount,
      demonstrationSharedRowCount: delta.summary.sharedRowCount,
      demonstrationChangedRowCount: delta.summary.changedRowCount,
      unlistedFieldCountInspected: delta.summary.unlistedFieldCountInspected,
      changedRowIds: delta.changedRows.map((row) => row.id),
      sharedRowIds: delta.sharedRows.map((row) => row.id),
      runtimeReceipt: clipReceipt("sourceRecordDeltaRuntime"),
      inspectorReceipt: clipReceipt("sourceRecordDeltaInspector"),
      testReceipt: clipReceipt("sourceRecordDeltaTest"),
      typeAtlasIntegrationReceipt: inheritedReceipt("typeAtlasFingerprintIntegration"),
      crossSourceSameCellIdentityCount: 0,
      crossSourceSameTypeIdentityCount: 0,
      admittedGeometryPrimitiveCount: 0,
      generatedBiologicalGeometryPrimitiveCount: 0,
      joinCount: 0,
      registrationCount: 0,
      measurementUse: "forbidden",
    },
    projectCopyCount: 0,
    packageCopyCount: 0,
  };
  manifest.registrySummary = {
    ...parent.registrySummary,
    researchUpgradeCount: upgradeRegistry.summary.upgradeCount,
    upgradeRegistryReceipt: replacements.get("researchModelUpgradeRegistry"),
  };
  manifest.scientificBoundaries.micronsClippingAndSourceRecordDeltaIntegrity = "Iteration 2.33 adds two display-only operations. The MICrONS plane discards cell-shell fragments only in the shader in the unchanged source-native visual-cortex frame; it never clips the linked nucleus, edits source buffers, generates a cap, repairs or resamples a mesh, or creates measurement, membrane, spinal internal-structure, join or registration claims. The Type Atlas compares exactly 24 explicit display rows with strict string equality; the eight-row I1/I2 receipt is a pinned demonstration subset, not the complete UI whitelist. Exact shared or changed text establishes neither same-cell nor same-type identity and admits no geometry. Project and package copies remain zero.";
  manifest.registrations = { count: 0, records: [] };
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(serializeResearchIterationManifest233(manifest), "utf8") };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  for (const arg of args) check(arg === "--write" || arg === "--check", `unknown argument: ${arg}`);
  check(!(args.has("--write") && args.has("--check")), "--write and --check are mutually exclusive");
  const built = await buildResearchIterationManifest233();
  if (args.has("--write")) await writeFile(OUTPUT_PATH, built.bytes);
  if (args.has("--check")) {
    const committed = await readFile(OUTPUT_PATH);
    check(committed.equals(built.bytes), "research iteration manifest 2.33 is stale; run builder with --write");
  }
  process.stdout.write(`${JSON.stringify({
    releaseId: built.manifest.releaseId,
    inputCount: built.manifest.integrity.inputCount,
    researchUpgradeCount: built.manifest.registrySummary.researchUpgradeCount,
    clippingCellRootId: built.manifest.exactReferences.micronsClippingAndSourceRecordDeltaIntegrity.micronsSourceNativeClipping.sourceCellRootId,
    sourceRecordDeltaUiWhitelistedRowCount: built.manifest.exactReferences.micronsClippingAndSourceRecordDeltaIntegrity.sourceRecordDelta.uiWhitelistedRowCount,
    sourceRecordDeltaDemonstrationChangedRowCount: built.manifest.exactReferences.micronsClippingAndSourceRecordDeltaIntegrity.sourceRecordDelta.demonstrationChangedRowCount,
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
