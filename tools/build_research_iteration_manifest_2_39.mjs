#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { validateNativeSomaContourPayload } from "../app/neurolucida-native-soma-contours.js";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { buildNeurolucidaSourceNativeSomaContours } from "./build_neurolucida_source_native_soma_contours.mjs";
import { buildCanonicalRegistry, stableJson as stableUpgradeRegistryJson } from "./build_research_upgrade_registry.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.39.json");
const PARENT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.38.json");

export const RESEARCH_ITERATION_239_PARENT = Object.freeze({
  path: "data/research-iteration-manifest-2.38.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.38.0",
  bytes: 173397,
  fileSha256: "97ef72ab7e7c2da802af7c4cca6d5a280162e61a08b4a2258bb58f1ee0107595",
  contentSha256: "8af86d1167213865712c5da915193c13b629d31a1e0452f08d2d4f4f9d9f3b19",
});

export const RESEARCH_ITERATION_239_PURPOSE_OVERRIDES = Object.freeze({
  researchUpgradeQueue: "Evidence-gated research/model queue through UPG-196",
  researchSourceRegistryValidator: "Twenty-seven-source, 33-record-set, nine-exact-roster, one-exact-source-object-set and 376-source-profile validator",
  researchSourceRegistryTest: "Canonical source registry regression tests including the exact NMO 45718 native-contour source-object-set chain",
  researchUpgradeRegistryBuilder: "Deterministic UPG-022-through-UPG-196 registry builder",
  researchUpgradeRegistryValidator: "178-row upgrade registry and UI reference validator",
  researchUpgradeRegistryTest: "UPG-022-through-UPG-196 deterministic and mutation tests",
  applicationLayout: "Current English metadata and 2.39 application label",
});

export const RESEARCH_ITERATION_239_ADDITIONAL_INPUTS = Object.freeze([
  ["nativeSomaContourBuilder", "tools/build_neurolucida_source_native_soma_contours.mjs", "Checksum-gated clean-room Neurolucida V3 DAT contour extractor and deterministic builder"],
  ["nativeSomaContourContract", "data/neurolucida-source-native-soma-contour-trace-0.1.json", "Exact NMO 45718 source-native contour-trace evidence and rendering contract"],
  ["nativeSomaContourGeometry", "public/data/premotor_comparison_observed_morphology_route_pack_v1/native-contours/nmo-45718-soma-contours.json", "Exact eight-contour, 275-vertex source-native browser geometry"],
  ["nativeSomaContourRuntime", "app/neurolucida-native-soma-contours.js", "Fail-closed native-contour payload validator and reversible display transform"],
  ["nativeSomaContourViewer", "app/NativeSomaContourViewer.tsx", "NMO 45718-only Three.js LineLoop viewer with source-boundary disclosure"],
  ["nativeSomaContourValidator", "scripts/validate-neurolucida-source-native-soma-contour-trace-0.1.mjs", "Native DAT receipt, deterministic rebuild, identity and zero-surface validator"],
  ["nativeSomaContourTest", "tests/neurolucida-source-native-soma-contour-trace.test.mjs", "Native-contour exact-denominator, transform and mutation tests"],
  ["researchIteration238SnapshotValidator", "scripts/validate-research-iteration-manifest-2.38-snapshot.mjs", "Immutable 2.38 parent snapshot validator independent of live 2.39 inputs"],
  ["researchIteration238SnapshotTest", "tests/research-iteration-manifest-2.38-snapshot.test.mjs", "Immutable 2.38 parent receipt and mutation tests"],
  ["openSourceModelingAvailabilityAudit", "data/open-source-modeling-availability-audit-0.1.json", "Three-candidate open-source modeling availability audit with queue-only admission decisions"],
  ["openSourceModelingAvailabilityValidator", "scripts/validate-open-source-modeling-availability-audit-0.1.mjs", "Availability receipt, identity, rights and zero-admission validator"],
  ["openSourceModelingAvailabilityTest", "tests/open-source-modeling-availability-audit.test.mjs", "Availability-audit deterministic and fail-closed mutation tests"],
  ["researchTimeline239", "docs/RESEARCH_TIMELINE_2026-09-02_ITERATION_2_39.md", "Unique in-place 2.39 timeline, exact contour scope, availability findings and rollback record"],
].map(([id, inputPath, purpose]) => Object.freeze({ id, scope: "project", path: inputPath, purpose })));

const EXPECTED_INPUT_COUNT = 172;
const EXPECTED_UPGRADE_COUNT = 178;
const EXPECTED_LAST_UPGRADE_ID = "UPG-196";

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
  check(input, `2.39 manifest is missing input ${id}`);
  return input;
}

function candidateAdmission(candidate) {
  return candidate?.admissionStatus ?? candidate?.decision?.status ?? candidate?.status;
}

function readAuditCount(audit, ...keys) {
  for (const key of keys) {
    if (Number.isInteger(audit.releaseDisposition?.[key])) return audit.releaseDisposition[key];
    if (Number.isInteger(audit.summary?.[key])) return audit.summary[key];
    if (Number.isInteger(audit.objectReadiness?.[key])) return audit.objectReadiness[key];
    if (Number.isInteger(audit.admissionSummary?.[key])) return audit.admissionSummary[key];
  }
  return undefined;
}

async function validateCurrentInputs(sources) {
  const registry = JSON.parse(sources.get("researchSourceRegistry").toString("utf8"));
  const upgrades = JSON.parse(sources.get("researchModelUpgradeRegistry").toString("utf8"));
  const nmoContract = JSON.parse(sources.get("nativeSomaContourContract").toString("utf8"));
  const nmoGeometry = JSON.parse(sources.get("nativeSomaContourGeometry").toString("utf8"));
  const availabilityAudit = JSON.parse(sources.get("openSourceModelingAvailabilityAudit").toString("utf8"));
  const applicationPackage = JSON.parse(sources.get("applicationPackage").toString("utf8"));
  const packageLock = JSON.parse(sources.get("packageLock").toString("utf8"));

  const recordSets = registry.sources.flatMap((source) => source.recordSets ?? []);
  const exactRosters = recordSets.filter((recordSet) => recordSet.childRosterRef?.status === "bundled_exact");
  const exactObjectSets = recordSets.filter((recordSet) => recordSet.sourceObjectSetRef?.status === "bundled_exact");
  const nativeRecordSet = recordSets.find((recordSet) => recordSet.recordSetId === "RS-NEUROMORPHO-45718-NATIVE-SOMA-CONTOURS");
  check(registry.sourceCount === 27 && registry.sources.length === 27, "canonical source count drifted");
  check(recordSets.length === 33 && new Set(recordSets.map((recordSet) => recordSet.recordSetId)).size === 33, "canonical record-set count drifted");
  check(exactRosters.length === 9, "bundled exact-roster count drifted");
  check(exactObjectSets.length === 1, "bundled exact source-object-set count drifted");
  check(nativeRecordSet?.includedRecordCount?.value === 8 && nativeRecordSet?.includedRecordCount?.unit === "source_contour_objects", "native-contour source-registry denominator drifted");
  check(nativeRecordSet?.childRosterRef?.status === "not_applicable_source_object_set" && nativeRecordSet?.childRosterRef?.path === null, "native contours must not be represented as a cell roster");
  check(nativeRecordSet?.sourceObjectSetRef?.status === "bundled_exact" && nativeRecordSet?.sourceObjectSetRef?.path === "public/data/premotor_comparison_observed_morphology_route_pack_v1/native-contours/nmo-45718-soma-contours.json", "native-contour source-registry object-set chain drifted");

  const rebuiltUpgradeRegistry = await buildCanonicalRegistry();
  const rebuiltUpgradeBytes = Buffer.from(stableUpgradeRegistryJson(rebuiltUpgradeRegistry), "utf8");
  check(rebuiltUpgradeBytes.equals(sources.get("researchModelUpgradeRegistry")), "research upgrade registry is not byte-reproducible from the queue");
  check(upgrades.summary?.upgradeCount === EXPECTED_UPGRADE_COUNT && upgrades.upgrades?.length === EXPECTED_UPGRADE_COUNT, "research upgrade count drifted");
  check(upgrades.upgrades.at(-1)?.id === EXPECTED_LAST_UPGRADE_ID, "last research upgrade drifted");
  check(upgrades.upgrades.find((item) => item.id === "UPG-186")?.status === "completed", "UPG-186 must be completed");
  for (const id of ["UPG-190", "UPG-191", "UPG-192", "UPG-193", "UPG-194", "UPG-195", "UPG-196"]) {
    check(/^planned/.test(upgrades.upgrades.find((item) => item.id === id)?.status ?? ""), `${id} must remain planned`);
  }

  const rebuiltNmo = await buildNeurolucidaSourceNativeSomaContours();
  check(sources.get("nativeSomaContourContract").equals(rebuiltNmo.contractBytes), "native soma-contour contract is not byte-reproducible");
  check(sources.get("nativeSomaContourGeometry").equals(rebuiltNmo.geometryBytes), "native soma-contour geometry is not byte-reproducible");
  validateNativeSomaContourPayload(nmoGeometry, nmoContract);
  check(nmoContract.releaseId === "ohri-neurolucida-source-native-soma-contour-trace-0.1.0", "native soma-contour release identity drifted");
  check(nmoContract.sourceObject?.bytes === 343774 && nmoContract.sourceObject?.sha256 === "ae5f3122dfcebfa06f3e69351670ab6428ed61d4a2bc24f099edc98e62f69415", "source DAT receipt drifted");
  check(nmoContract.derivedObject?.bytes === 45606 && nmoContract.derivedObject?.sha256 === "a0aa80ce0f12b08cfe61b2862f1b3a29f67a1105a722b0dceda2fd3b25e898e8", "native contour geometry receipt drifted");
  check(nmoContract.independentAudit?.commit === "e07fd2d53c03945f011c335c7b643765f2d85a09", "independent DAT parser commit drifted");
  check(nmoContract.independentAudit?.parserSha256 === "2714ab12fc330a7880262b0d5f0aa5321ddf5813ab86215f2121b78c08efaec2", "independent DAT parser receipt drifted");
  check(nmoContract.summary?.sourceSomaContourObjectCount === 8 && nmoContract.summary?.vertexCount === 275 && nmoContract.summary?.semanticClosedSegmentCount === 275, "native contour denominator drifted");
  check(nmoContract.summary?.pointPayloadSha256 === "a478e6263e7d00c1f17bc64143014a3519c39f771b6809a28b057db07c724ab4", "native contour point-payload receipt drifted");
  for (const field of ["filledPolygonCount", "triangleCount", "surfaceCount", "volumeCount", "internalStructureObjectCount", "registrationCount", "crossSourceJoinCount"]) {
    check(nmoContract.summary?.[field] === 0, `native contour ${field} must remain zero`);
  }
  check(nmoContract.relationshipBoundary?.overlayWithStandardizedSwcAllowed === false, "DAT/SWC overlay was incorrectly enabled");
  check(nmoContract.displayContract?.keepCellBodySeparateFromSoma1Stack === true && nmoContract.displayContract?.traceRadiusRenderingUse === "forbidden", "native contour legacy-separation or trace-radius boundary drifted");

  check(availabilityAudit.contractId === "ohri-open-source-modeling-availability-audit-0.1.0", "availability-audit identity drifted");
  check(availabilityAudit.releaseTarget === "2.39", "availability-audit release target drifted");
  check(Array.isArray(availabilityAudit.candidates) && availabilityAudit.candidates.length === 3, "availability-audit candidate denominator drifted");
  check(availabilityAudit.candidates.every((candidate) => candidateAdmission(candidate) === "queue_only"), "availability-audit candidates must remain queue-only");
  const candidateText = JSON.stringify(availabilityAudit.candidates).toLowerCase();
  for (const token of ["janelia", "fish1", "pkd2l1"]) check(candidateText.includes(token), `availability audit is missing ${token}`);
  const janelia = availabilityAudit.candidates.find((candidate) => JSON.stringify(candidate).toLowerCase().includes("janelia"));
  check(JSON.stringify(janelia).includes("unknown"), "Janelia cell class must remain unknown");
  check(/discrep|unresolved/i.test(JSON.stringify(janelia)), "Janelia calibration discrepancy must remain unresolved");
  check(readAuditCount(availabilityAudit, "boundedPairAvailabilityReceiptCount", "boundedPairAvailabilityCount") === 1, "bounded-pair availability receipt count drifted");
  for (const keys of [
    ["sourceObjectBundleAdmissionCount", "sourceObjectAdmissionCount"],
    ["selectedCellJoinCount"],
    ["sameCellInternalChainCount", "sameCellInternalStructureChainCount"],
    ["registrationCount"],
    ["atlasRegistrationCount"],
    ["admittedGeometryObjectCount", "admittedGeometryCount"],
    ["admittedInternalObjectCount", "admittedInternalStructureCount"],
    ["renderedObjectCount"],
    ["currentUiSurfaceCount", "uiSurfaceCount"],
  ]) check(readAuditCount(availabilityAudit, ...keys) === 0, `availability-audit ${keys[0]} must remain zero`);

  check(applicationPackage.version === "2.39.0-research.1", "application version must be 2.39.0-research.1");
  check(applicationPackage.version === packageLock.version && packageLock.packages?.[""]?.version === applicationPackage.version, "package and lockfile versions disagree");
  assertText(sources.get("nativeSomaContourViewer"), ["new THREE.LineLoop", "traceRadiusRenderingUse: \"forbidden\"", "20 µm"], "native soma-contour viewer");
  assertText(sources.get("nativeSomaContourValidator"), ["contract.derivedObject.sha256 === sha256(geometryBytes)", "overlayWithStandardizedSwcAllowed === false"], "native soma-contour validator");
  assertText(sources.get("nativeSomaContourTest"), ["seven source-closed Soma 1 planes", "rejects invented surfaces"], "native soma-contour tests");
  assertText(sources.get("researchSourceRegistryValidator"), ["record-set denominator must remain 33", "RS-NEUROMORPHO-45718-NATIVE-SOMA-CONTOURS"], "source-registry validator");
  assertText(sources.get("researchIteration238SnapshotValidator"), ["173397", RESEARCH_ITERATION_239_PARENT.fileSha256, RESEARCH_ITERATION_239_PARENT.contentSha256], "2.38 snapshot validator");
  assertText(sources.get("researchTimeline239"), ["eight source-labelled soma contour objects", "275 semantic last-to-first line-loop segments", "cell class is unknown"], "2.39 timeline");

  return {
    registry,
    upgrades,
    nmoContract,
    nmoGeometry,
    availabilityAudit,
    applicationVersion: applicationPackage.version,
    recordSetCount: recordSets.length,
    exactRosterCount: exactRosters.length,
    exactObjectSetCount: exactObjectSets.length,
  };
}

export function serializeResearchIterationManifest239(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export async function buildResearchIterationManifest239() {
  const parentBytes = await readFile(PARENT_PATH);
  const parent = JSON.parse(parentBytes.toString("utf8"));
  check(parent.releaseId === RESEARCH_ITERATION_239_PARENT.releaseId, "immutable 2.38 parent release identity drifted");
  check(parentBytes.byteLength === RESEARCH_ITERATION_239_PARENT.bytes && sha256(parentBytes) === RESEARCH_ITERATION_239_PARENT.fileSha256, "immutable 2.38 parent file receipt drifted");
  check(parent.manifestContentSha256 === RESEARCH_ITERATION_239_PARENT.contentSha256 && computeManifestContentSha256(parent) === RESEARCH_ITERATION_239_PARENT.contentSha256, "immutable 2.38 parent content receipt drifted");

  const inheritedBytes = await Promise.all(parent.authoritativeInputs.map((input) => readFile(sourcePath(parent, input))));
  const additionalBytes = await Promise.all(RESEARCH_ITERATION_239_ADDITIONAL_INPUTS.map((input) => readFile(path.join(PROJECT_ROOT, input.path))));
  const manifest = structuredClone(parent);
  manifest.authoritativeInputs = parent.authoritativeInputs.map((input, index) => receipt({
    ...input,
    purpose: RESEARCH_ITERATION_239_PURPOSE_OVERRIDES[input.id] ?? input.purpose,
  }, inheritedBytes[index]));
  manifest.authoritativeInputs.push(...RESEARCH_ITERATION_239_ADDITIONAL_INPUTS.map((input, index) => receipt(input, additionalBytes[index])));
  check(manifest.authoritativeInputs.length === EXPECTED_INPUT_COUNT, "2.39 authoritative input count drifted");
  check(new Set(manifest.authoritativeInputs.map((input) => input.id)).size === EXPECTED_INPUT_COUNT, "2.39 authoritative input IDs are not unique");
  check(new Set(manifest.authoritativeInputs.map((input) => input.path)).size === EXPECTED_INPUT_COUNT, "2.39 authoritative input paths are not unique");

  const sources = new Map();
  manifest.authoritativeInputs.forEach((input, index) => {
    const bytes = index < inheritedBytes.length ? inheritedBytes[index] : additionalBytes[index - inheritedBytes.length];
    sources.set(input.id, bytes);
  });
  const current = await validateCurrentInputs(sources);

  manifest.manifestSchemaVersion = "2.39.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.39.0";
  manifest.releaseDate = "2026-09-02";
  manifest.application.version = current.applicationVersion;
  manifest.parentIterationManifest = { ...RESEARCH_ITERATION_239_PARENT };
  manifest.baseResearchRelease.note = "Iteration 2.39 admits eight exact NMO 45718 source-native Neurolucida soma contour traces with 275 ordered vertices as separately switchable LineLoop geometry. Seven source-closed Soma 1 planes remain separate from one legacy Cell Body closure exception. It adds no fill, triangle, lofted surface, volume, internal object, DAT-to-SWC overlay, same-cell cross-modal join or registration. The canonical source registry remains 27 sources while increasing to 33 record sets, with nine exact child-roster chains and one separate exact source-object-set chain. The contour objects are not a cell roster. A three-candidate open-source modeling availability audit remains queue-only: its one bounded raw/nucleus availability receipt is not a selected-interneuron or same-cell internal chain. The research queue contains 178 upgrades through UPG-196. No full-project copy or distributable package is created.";
  manifest.integrity.inputCount = manifest.authoritativeInputs.length;

  const inputReceipt = (id) => simpleReceipt(getInput(manifest, id));
  manifest.exactReferences.sourceNativeSomaContoursAndAvailabilityIntegrity = {
    contractId: "ohri-source-native-soma-contours-and-availability-integrity-2.39",
    nativeContourReleaseId: current.nmoContract.releaseId,
    neuronId: 45718,
    sourceDatBytes: current.nmoContract.sourceObject.bytes,
    sourceDatSha256: current.nmoContract.sourceObject.sha256,
    independentParserCommit: current.nmoContract.independentAudit.commit,
    independentParserSha256: current.nmoContract.independentAudit.parserSha256,
    nativeGeometryBytes: current.nmoContract.derivedObject.bytes,
    nativeGeometrySha256: current.nmoContract.derivedObject.sha256,
    pointPayloadSha256: current.nmoContract.summary.pointPayloadSha256,
    sourceSomaContourObjectCount: current.nmoContract.summary.sourceSomaContourObjectCount,
    sourceFlagClosedObjectCount: current.nmoContract.summary.sourceFlagClosedObjectCount,
    legacyCellBodyClosureExceptionCount: current.nmoContract.summary.legacyCellBodyClosureExceptionCount,
    vertexCount: current.nmoContract.summary.vertexCount,
    semanticClosedSegmentCount: current.nmoContract.summary.semanticClosedSegmentCount,
    canonicalSourceCount: current.registry.sourceCount,
    canonicalRecordSetCount: current.recordSetCount,
    bundledExactRosterCount: current.exactRosterCount,
    bundledExactObjectSetCount: current.exactObjectSetCount,
    sourceProfileCount: parent.registrySummary.sourceProfileCount,
    sourceNamespaceCount: parent.registrySummary.sourceNamespaceCount,
    researchExplorerRecordCount: parent.registrySummary.researchExplorerRecordCount,
    researchUpgradeCount: current.upgrades.summary.upgradeCount,
    lastResearchUpgradeId: current.upgrades.upgrades.at(-1).id,
    availabilityCandidateCount: current.availabilityAudit.candidates.length,
    queueOnlyCandidateCount: current.availabilityAudit.candidates.filter((candidate) => candidateAdmission(candidate) === "queue_only").length,
    boundedPairAvailabilityReceiptCount: readAuditCount(current.availabilityAudit, "boundedPairAvailabilityReceiptCount", "boundedPairAvailabilityCount"),
    admittedSourceNativeContourObjectCount: 8,
    admittedSurfaceCount: 0,
    admittedInternalStructureCount: 0,
    generatedFallbackPrimitiveCount: 0,
    filledPolygonCount: 0,
    triangleCount: 0,
    volumeCount: 0,
    registrationCount: 0,
    atlasRegistrationCount: 0,
    sameCellCrossModalJoinCount: 0,
    standardizedSwcOverlayCount: 0,
    availabilitySourceObjectBundleAdmissionCount: 0,
    availabilitySelectedCellJoinCount: 0,
    availabilitySameCellInternalChainCount: 0,
    availabilityAdmittedGeometryObjectCount: 0,
    availabilityAdmittedInternalObjectCount: 0,
    availabilityRenderedObjectCount: 0,
    availabilityCurrentUiSurfaceCount: 0,
    nativeContourBuilderReceipt: inputReceipt("nativeSomaContourBuilder"),
    nativeContourContractReceipt: inputReceipt("nativeSomaContourContract"),
    nativeContourGeometryReceipt: inputReceipt("nativeSomaContourGeometry"),
    nativeContourRuntimeReceipt: inputReceipt("nativeSomaContourRuntime"),
    nativeContourViewerReceipt: inputReceipt("nativeSomaContourViewer"),
    nativeContourValidatorReceipt: inputReceipt("nativeSomaContourValidator"),
    nativeContourTestReceipt: inputReceipt("nativeSomaContourTest"),
    sourceRegistryReceipt: inputReceipt("researchSourceRegistry"),
    sourceRegistryValidatorReceipt: inputReceipt("researchSourceRegistryValidator"),
    sourceRegistryTestReceipt: inputReceipt("researchSourceRegistryTest"),
    upgradeQueueReceipt: inputReceipt("researchUpgradeQueue"),
    upgradeRegistryReceipt: inputReceipt("researchModelUpgradeRegistry"),
    upgradeBuilderReceipt: inputReceipt("researchUpgradeRegistryBuilder"),
    upgradeValidatorReceipt: inputReceipt("researchUpgradeRegistryValidator"),
    upgradeTestReceipt: inputReceipt("researchUpgradeRegistryTest"),
    parentSnapshotValidatorReceipt: inputReceipt("researchIteration238SnapshotValidator"),
    parentSnapshotTestReceipt: inputReceipt("researchIteration238SnapshotTest"),
    availabilityAuditReceipt: inputReceipt("openSourceModelingAvailabilityAudit"),
    availabilityValidatorReceipt: inputReceipt("openSourceModelingAvailabilityValidator"),
    availabilityTestReceipt: inputReceipt("openSourceModelingAvailabilityTest"),
    timelineReceipt: inputReceipt("researchTimeline239"),
    lineLoopsOnly: true,
    sourceCoordinatesPreserved: true,
    viewerTransformReversible: true,
    legacyCellBodyKeptSeparate: true,
    traceRadiusRenderingForbidden: true,
    datToSwcOverlayForbidden: true,
    availabilityCandidatesQueueOnly: true,
    janeliaCellClassUnknown: true,
    noGenericGeometrySubstitution: true,
  };

  manifest.registrySummary = {
    ...parent.registrySummary,
    canonicalSourcePackageCount: current.registry.sourceCount,
    canonicalRecordSetCount: current.recordSetCount,
    bundledExactRosterCount: current.exactRosterCount,
    bundledExactObjectSetCount: current.exactObjectSetCount,
    researchUpgradeCount: current.upgrades.summary.upgradeCount,
    sourceRegistryReceipt: getInput(manifest, "researchSourceRegistry"),
    upgradeRegistryReceipt: getInput(manifest, "researchModelUpgradeRegistry"),
  };
  manifest.scientificBoundaries.premotorComparisonObservedMorphologyRoutePack = "NMO 45718 remains one independent source-local, moderate-integrity reconstruction carrying repository labels that are not independently verified as an individual calbindin assay, definitive premotor identity, Renshaw exclusion or same-cell physiology. The original route-pack contract admitted only standardized SWC geometry and treated the DAT as provenance. Iteration 2.39 separately admits exactly eight checksum-gated source-native soma contour objects containing 275 ordered vertices as line traces in an unregistered viewer. This new admission does not authorize DAT-to-SWC overlay, polygon fill, surface, membrane, nucleus, volume, other native annotations, complete axon, same-specimen internal structure, cross-source identity or registration. The repository slicing fields, paper preparation stages and reported-but-uncorrected shrinkage remain distinct and unresolved.";
  manifest.scientificBoundaries.sourceNativeSomaContoursAndAvailabilityIntegrity = "Iteration 2.39 admits exactly eight source-native NMO 45718 Neurolucida soma contour objects containing 275 ordered vertices and 275 semantic last-to-first line-loop segments. Seven source-closed Soma 1 traces at z -29 through -41 micrometres remain separate from the 23-vertex legacy Cell Body trace at z 13/15 micrometres. The Cell Body source flag remains false and its interpreted closure is disclosed under the MBF legacy exception. The viewer may apply only a reversible recentering and uniform scale while retaining exact source coordinates. It admits no polygon fill, triangle, lofted surface, membrane, biological volume, nucleus, organelle, internal object or trace-radius thickness. The native DAT and standardized SWC share a NeuroMorpho record but have no established coordinate transform; vertex overlay remains forbidden. The registry has 27 canonical sources and 33 record sets. Its nine bundled exact child-roster chains enumerate cells or profiles, while the one separate bundled exact source-object-set chain enumerates contour objects; the eight NMO contours are not a cell roster. These counts do not change the 376 molecular profiles, nine profile namespaces, 630 Explorer records or frozen 142-record census. The three-candidate open-source availability audit is queue-only. Its bounded Janelia raw-EM/manual-nucleus pair has unknown cell class and an unresolved nominal-versus-Zarr calibration discrepancy; Fish1 and PKD2L1 remain blocked. Availability does not create a source-object bundle admission, selected-cell join, same-cell internal chain, geometry object, internal object, rendered object, current UI surface or registration. UPG-195 and UPG-196 remain future gates rather than implemented model detail.";
  manifest.registrations = { count: 0, records: [] };
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(serializeResearchIterationManifest239(manifest), "utf8") };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  for (const arg of args) check(arg === "--write" || arg === "--check", `unknown argument: ${arg}`);
  check(!(args.has("--write") && args.has("--check")), "--write and --check are mutually exclusive");
  const built = await buildResearchIterationManifest239();
  if (args.has("--write")) await writeFile(OUTPUT_PATH, built.bytes);
  if (args.has("--check")) {
    const committed = await readFile(OUTPUT_PATH);
    check(committed.equals(built.bytes), "research iteration manifest 2.39 is stale; run builder with --write");
  }
  const exact = built.manifest.exactReferences.sourceNativeSomaContoursAndAvailabilityIntegrity;
  process.stdout.write(`${JSON.stringify({
    releaseId: built.manifest.releaseId,
    applicationVersion: built.manifest.application.version,
    inputCount: built.manifest.integrity.inputCount,
    researchUpgradeCount: built.manifest.registrySummary.researchUpgradeCount,
    canonicalSourceCount: built.manifest.registrySummary.canonicalSourcePackageCount,
    canonicalRecordSetCount: built.manifest.registrySummary.canonicalRecordSetCount,
    bundledExactRosterCount: built.manifest.registrySummary.bundledExactRosterCount,
    bundledExactObjectSetCount: built.manifest.registrySummary.bundledExactObjectSetCount,
    contourCount: exact.sourceSomaContourObjectCount,
    vertexCount: exact.vertexCount,
    availabilityCandidateCount: exact.availabilityCandidateCount,
    admittedSurfaceCount: exact.admittedSurfaceCount,
    admittedInternalStructureCount: exact.admittedInternalStructureCount,
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
