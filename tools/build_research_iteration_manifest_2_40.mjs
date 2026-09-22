#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { MOLECULAR_COMPLETENESS_SLOT_IDS, selectMolecularCompletenessSlots } from "../app/research-record-presentation.js";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { buildNeurolucidaNativeContourAdmissionCatalog } from "./build_neurolucida_native_contour_admission_catalog.mjs";
import { buildCanonicalRegistry, stableJson as stableUpgradeRegistryJson } from "./build_research_upgrade_registry.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.40.json");
const PARENT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.39.json");

export const RESEARCH_ITERATION_240_PARENT = Object.freeze({
  path: "data/research-iteration-manifest-2.39.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.39.0",
  bytes: 187451,
  fileSha256: "865782ddbc2b827d4fe1359bbd1c250ce24afadcb052990c8c5978bb06ef81b4",
  contentSha256: "4fa9014be79e2d920f6859944da35a676bed2d7e17b3b83c4dcdb9fe419904cc",
});

export const RESEARCH_ITERATION_240_PURPOSE_OVERRIDES = Object.freeze({
  researchSourceRegistry: "Canonical 27-source, 33-record-set registry with nine exact cell/profile rosters and one exact five-DAT source-object set",
  researchModelUpgradeRegistry: "Deterministic 186-row research/model upgrade registry through UPG-204",
  packageLock: "Exact 2.40 JavaScript dependency graph",
  atlasFocusSynchronization: "Selected-record native-contour routing and stale-geometry clearing",
  atlasTypeContracts: "Typed current 2.40 manifest and native-contour catalog exports",
  applicationPackage: "Application version and deterministic 2.40 validation routes",
  projectReadme: "Current 2.40 research scope, exact denominators and zero-authority disclosure",
  researchUpgradeQueue: "Evidence-gated research/model queue through UPG-204",
  researchOverview: "Research overview with record-specific native-detail and evidence-completeness boundaries",
  atlasStylesheet: "Responsive fixed-slot completeness and record-specific native-contour presentation styles",
  renderedHtmlTest: "Server-rendered 2.40 application and evidence-boundary regression tests",
  micronsObservedReferenceTest: "Current 2.40-manifest cross-region reference regression test",
  researchSourceRegistryValidator: "Twenty-seven-source, 33-record-set, nine-exact-roster and one five-DAT exact-object-set validator",
  researchSourceRegistryTest: "Canonical source-registry regressions including the five-DAT native-contour catalog",
  currentResearchTestRunner: "Current-iteration discovery runner using immutable snapshot tests through 2.39",
  researchFocusEvidencePanel: "Source-locked evidence rail with fixed eight-slot molecular completeness",
  researchUpgradeRegistryBuilder: "Deterministic UPG-022-through-UPG-204 registry builder",
  researchUpgradeRegistryValidator: "186-row upgrade-registry and UI-reference validator",
  researchUpgradeRegistryTest: "UPG-022-through-UPG-204 deterministic and mutation tests",
  applicationLayout: "Current English metadata and 2.40 application label",
  observedMorphologyRuntimeContractTest: "Current 2.40-manifest import and morphology-isolation regression test",
  researchRecordPresentationRuntime: "Record-driven evidence partition and fixed eight-slot molecular completeness contract",
  researchRecordModelReadout: "Selected-record visualization-authority readout without repeated dossier content",
  researchRecordPresentationTest: "Cross-record, fixed-slot, collapsed-context and zero-fallback tests",
});

export const RESEARCH_ITERATION_240_ADDITIONAL_INPUTS = Object.freeze([
  ["nativeContourCatalogBuilder", "tools/build_neurolucida_native_contour_admission_catalog.mjs", "Checksum-gated five-DAT audit and deterministic strict-admission builder"],
  ["nativeContourAdmissionCatalog", "data/neurolucida-native-contour-admission-catalog-0.2.json", "Five-DAT audit catalog with two admitted and three held records"],
  ["nmo45674NativeContourGeometry", "public/data/functional_class_observed_morphology_route_pack_v1/native-contours/nmo-45674-source-closed-soma-contours.json", "Exact seven-loop, 200-vertex NMO 45674 source-closed contour geometry"],
  ["nativeContourAdmissionRuntime", "app/neurolucida-native-contour-admission.js", "Fail-closed five-record admission and geometry runtime"],
  ["nativeContourRecordViewer", "app/NativeContourRecordViewer.tsx", "Identity-gated selected-record native-contour LineLoop viewer"],
  ["nativeContourCatalogValidator", "scripts/validate-neurolucida-native-contour-admission-catalog-0.2.mjs", "Catalog, geometry, routing and zero-authority validator"],
  ["nativeContourCatalogTest", "tests/neurolucida-native-contour-admission-catalog.test.mjs", "Five-DAT audit, strict-admission, transform and mutation tests"],
  ["observedMorphologyRouteLibrary", "app/ObservedMorphologyRouteLibrary.tsx", "Per-record native-DAT admission and hold disclosures"],
  ["researchIteration239SnapshotValidator", "scripts/validate-research-iteration-manifest-2.39-snapshot.mjs", "Immutable 2.39 parent snapshot validator independent of live 2.40 inputs"],
  ["researchIteration239SnapshotTest", "tests/research-iteration-manifest-2.39-snapshot.test.mjs", "Immutable 2.39 parent receipt and mutation tests"],
  ["researchTimeline240", "docs/RESEARCH_TIMELINE_2026-09-02_ITERATION_2_40.md", "Unique in-place 2.40 timeline, evidence boundaries and file-specific rollback"],
  ["researchIteration240Builder", "tools/build_research_iteration_manifest_2_40.mjs", "Deterministic 2.40 iteration-manifest builder"],
  ["researchIteration240Schema", "schemas/research-iteration-manifest-2.40.schema.json", "Strict JSON Schema for the 2.40 iteration manifest"],
  ["researchIteration240Validator", "scripts/validate-research-iteration-manifest-2.40.mjs", "Deterministic, receipt and scientific-boundary validator for 2.40"],
  ["researchIteration240Test", "tests/research-iteration-manifest-2.40.test.mjs", "2.40 byte-rebuild, denominator and mutation regression tests"],
].map(([id, inputPath, purpose]) => Object.freeze({ id, scope: "project", path: inputPath, purpose })));

const EXPECTED_PARENT_INPUT_COUNT = 172;
const EXPECTED_UPGRADE_COUNT = 186;
const EXPECTED_LAST_UPGRADE_ID = "UPG-204";

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
  check(input, `2.40 manifest is missing input ${id}`);
  return input;
}

function recordSetById(recordSets, id) {
  const value = recordSets.find((recordSet) => recordSet.recordSetId === id);
  check(value, `source registry is missing ${id}`);
  return value;
}

async function validateCurrentInputs(sources) {
  const registry = JSON.parse(sources.get("researchSourceRegistry").toString("utf8"));
  const upgrades = JSON.parse(sources.get("researchModelUpgradeRegistry").toString("utf8"));
  const catalog = JSON.parse(sources.get("nativeContourAdmissionCatalog").toString("utf8"));
  const geometry45674 = JSON.parse(sources.get("nmo45674NativeContourGeometry").toString("utf8"));
  const explorer = JSON.parse(sources.get("researchExplorerSearchIndex").toString("utf8"));
  const applicationPackage = JSON.parse(sources.get("applicationPackage").toString("utf8"));
  const packageLock = JSON.parse(sources.get("packageLock").toString("utf8"));

  const recordSets = registry.sources.flatMap((source) => source.recordSets ?? []);
  const exactRosters = recordSets.filter((recordSet) => recordSet.childRosterRef?.status === "bundled_exact");
  const exactObjectSets = recordSets.filter((recordSet) => recordSet.sourceObjectSetRef?.status === "bundled_exact");
  const catalogRecordSet = recordSetById(recordSets, "RS-NEUROMORPHO-NATIVE-CONTOUR-ADMISSION-CATALOG");
  check(registry.sourceCount === 27 && registry.sources.length === 27, "canonical source count drifted");
  check(recordSets.length === 33 && new Set(recordSets.map((recordSet) => recordSet.recordSetId)).size === 33, "canonical record-set count drifted");
  check(exactRosters.length === 9 && exactObjectSets.length === 1, "exact roster/object-set denominator drifted");
  check(catalogRecordSet.includedRecordCount?.value === 5 && catalogRecordSet.includedRecordCount?.unit === "audited_DAT_files", "native-contour catalog record-set denominator drifted");
  check(catalogRecordSet.childRosterRef?.status === "not_applicable_source_object_set" && catalogRecordSet.sourceObjectSetRef?.status === "bundled_exact", "native-contour catalog must remain a source-object set rather than a cell roster");
  check(catalogRecordSet.sourceObjectSetRef?.path === "data/neurolucida-native-contour-admission-catalog-0.2.json", "native-contour catalog source-object path drifted");

  const rebuiltUpgradeRegistry = await buildCanonicalRegistry();
  const rebuiltUpgradeBytes = Buffer.from(stableUpgradeRegistryJson(rebuiltUpgradeRegistry), "utf8");
  check(rebuiltUpgradeBytes.equals(sources.get("researchModelUpgradeRegistry")), "research upgrade registry is not byte-reproducible from the queue");
  check(upgrades.summary?.upgradeCount === EXPECTED_UPGRADE_COUNT && upgrades.upgrades?.length === EXPECTED_UPGRADE_COUNT, "research upgrade count drifted");
  check(upgrades.upgrades.at(-1)?.id === EXPECTED_LAST_UPGRADE_ID, "last research upgrade drifted");
  for (const id of ["UPG-197", "UPG-198", "UPG-199"]) check(upgrades.upgrades.find((item) => item.id === id)?.status === "completed", `${id} must be completed`);
  for (const id of ["UPG-200", "UPG-201", "UPG-202", "UPG-203", "UPG-204"]) check(/^planned/.test(upgrades.upgrades.find((item) => item.id === id)?.status ?? ""), `${id} must remain planned`);

  const rebuiltCatalog = await buildNeurolucidaNativeContourAdmissionCatalog();
  check(rebuiltCatalog.catalogBytes.equals(sources.get("nativeContourAdmissionCatalog")), "native-contour catalog is not byte-reproducible");
  check(rebuiltCatalog.geometryBytes.equals(sources.get("nmo45674NativeContourGeometry")), "NMO 45674 native-contour geometry is not byte-reproducible");
  const records = catalog.records ?? [];
  check(catalog.contractId === "neurolucida-native-contour-admission-catalog-0.2" && catalog.releaseId === "ohri-neurolucida-native-contour-admission-catalog-0.2.0", "native-contour catalog identity drifted");
  check(JSON.stringify(records.map((record) => record.neuronId)) === JSON.stringify([45718, 45674, 50424, 50394, 50408]), "native-contour audited record identity/order drifted");
  check(catalog.summary?.auditedDatFileCount === 5 && catalog.summary?.admittedRecordCount === 2 && catalog.summary?.heldRecordCount === 3, "native-contour audit/admission denominator drifted");
  check(catalog.summary?.admittedContourObjectCount === 15 && catalog.summary?.admittedVertexCount === 475 && catalog.summary?.admittedRenderedPrimitiveCount === 15, "native-contour object/vertex denominator drifted");
  for (const field of ["admittedSurfaceCount", "admittedVolumeCount", "admittedInternalStructureObjectCount", "standardizedSwcOverlayCount", "sameCellCrossModalJoinCount", "registrationCount"]) check(catalog.summary?.[field] === 0, `native-contour ${field} must remain zero`);
  const nmo45718 = records.find((record) => record.neuronId === 45718);
  const nmo45674 = records.find((record) => record.neuronId === 45674);
  check(nmo45718?.admissionStatus === "admitted_prior_exact_contract" && nmo45718.admission?.admittedContourObjectCount === 8 && nmo45718.admission?.admittedVertexCount === 275, "NMO 45718 admission drifted");
  check(nmo45674?.admissionStatus === "admitted_source_closed_subset" && nmo45674.admission?.admittedContourObjectCount === 7 && nmo45674.admission?.admittedVertexCount === 200, "NMO 45674 strict admission drifted");
  check(nmo45674.source?.bytes === 353251 && nmo45674.source?.sha256 === "9d5a8670fdb97656c18eb8819b3c4723f438fb8929e66ea8dc6103c6bb547d87", "NMO 45674 DAT receipt drifted");
  check(nmo45674.audit?.somaNamedContourObjectCount === 8 && nmo45674.audit?.somaNamedVertexCount === 227 && nmo45674.audit?.sourceClosedSomaNamedContourCount === 7 && nmo45674.audit?.sourceOpenSomaNamedContourCount === 1, "NMO 45674 audited/admitted partition drifted");
  check(nmo45674.derivedObject?.bytes === 35842 && nmo45674.derivedObject?.sha256 === "1e41538a6443dcf7893386c180d3d22ddf81cc72a4d96f66a16193c97747cec3", "NMO 45674 geometry receipt drifted");
  check(geometry45674.summary?.vertexCount === 200 && geometry45674.summary?.pointPayloadSha256 === "b163a222ae560d3467a94f3438985c868548695205d56efaaeed454b67977208", "NMO 45674 geometry payload drifted");
  for (const neuronId of [50424, 50394, 50408]) {
    const record = records.find((candidate) => candidate.neuronId === neuronId);
    check(record?.admissionStatus === "held_source_closed_flag_false" && record.admission?.admittedContourObjectCount === 0 && !record.derivedObject, `NMO ${neuronId} must remain held with no derivative`);
  }

  const molecularProfiles = (explorer.records ?? []).filter((record) => record.focusKind === "molecular_profile");
  const namespaces = new Set(molecularProfiles.map((record) => record.namespace));
  check(explorer.records?.length === 630 && molecularProfiles.length === 376 && namespaces.size === 9, "Explorer/profile/namespace denominator drifted");
  check(JSON.stringify(MOLECULAR_COMPLETENESS_SLOT_IDS) === JSON.stringify(["sampling", "markers", "region", "life_stage", "transmitter", "cell_geometry", "internal_structure", "provenance"]), "molecular completeness slot identity/order drifted");
  for (const record of molecularProfiles) {
    const slots = selectMolecularCompletenessSlots(record);
    check(slots.length === 8 && JSON.stringify(slots.map((slot) => slot.slotId)) === JSON.stringify(MOLECULAR_COMPLETENESS_SLOT_IDS), `${record.focusId} completeness slots drifted`);
    check(slots.every((slot) => slot.status === "available" ? Number.isInteger(slot.evidenceIndex) && typeof slot.locator === "string" : typeof slot.reasonCode === "string" && typeof slot.sourceLocator === "string"), `${record.focusId} completeness evidence/missingness is incomplete`);
  }

  check(applicationPackage.version === "2.40.0-research.1" && packageLock.version === applicationPackage.version && packageLock.packages?.[""]?.version === applicationPackage.version, "package and lockfile versions must agree on 2.40.0-research.1");
  assertText(sources.get("atlasTypeContracts"), ["research-iteration-manifest-2.40.json", "neurolucidaNativeContourAdmissionCatalogJson"], "atlas type contracts");
  assertText(sources.get("atlasFocusSynchronization"), ["NativeContourRecordViewer", "key={observedCellForm.neuronId}"], "atlas focus synchronization");
  assertText(sources.get("nativeContourRecordViewer"), ["new THREE.LineLoop", "state.neuronId === neuronId", "data-surface-count"], "native contour record viewer");
  assertText(sources.get("observedMorphologyRouteLibrary"), ["nativeContourRecord.admission.reason", "No DAT↔SWC transform is established"], "observed morphology route library");
  assertText(sources.get("researchFocusEvidencePanel"), ["Fixed-slot record completeness", "availableMolecularSlots"], "research focus evidence panel");
  assertText(sources.get("researchRecordModelReadout"), ["Visualization authority", "modeling.admittedCellGeometryObjectCount"], "research record model readout");
  assertText(sources.get("researchRecordPresentationRuntime"), ["MOLECULAR_COMPLETENESS_SLOT_IDS", "selectMolecularCompletenessSlots"], "record presentation runtime");
  assertText(sources.get("projectReadme"), ["2.40.0-research.1", "15 admitted contours / 475 vertices", "186-entry upgrade registry"], "README");
  assertText(sources.get("applicationLayout"), ["Research Iteration 2.40"], "application layout");
  assertText(sources.get("researchIteration239SnapshotValidator"), [RESEARCH_ITERATION_240_PARENT.fileSha256, RESEARCH_ITERATION_240_PARENT.contentSha256], "2.39 snapshot validator");
  assertText(sources.get("researchTimeline240"), ["Five locally bundled Neurolucida DAT files", "15 exact source-native line loops / 475 vertices", "UPG-204"], "2.40 timeline");

  return {
    registry,
    upgrades,
    catalog,
    nmo45718,
    nmo45674,
    applicationVersion: applicationPackage.version,
    recordSetCount: recordSets.length,
    exactRosterCount: exactRosters.length,
    exactObjectSetCount: exactObjectSets.length,
    explorerRecordCount: explorer.records.length,
    molecularProfileCount: molecularProfiles.length,
    sourceNamespaceCount: namespaces.size,
  };
}

export function serializeResearchIterationManifest240(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export async function buildResearchIterationManifest240() {
  const parentBytes = await readFile(PARENT_PATH);
  const parent = JSON.parse(parentBytes.toString("utf8"));
  check(parent.releaseId === RESEARCH_ITERATION_240_PARENT.releaseId, "immutable 2.39 parent release identity drifted");
  check(parentBytes.byteLength === RESEARCH_ITERATION_240_PARENT.bytes && sha256(parentBytes) === RESEARCH_ITERATION_240_PARENT.fileSha256, "immutable 2.39 parent file receipt drifted");
  check(parent.manifestContentSha256 === RESEARCH_ITERATION_240_PARENT.contentSha256 && computeManifestContentSha256(parent) === RESEARCH_ITERATION_240_PARENT.contentSha256, "immutable 2.39 parent content receipt drifted");
  check(parent.authoritativeInputs?.length === EXPECTED_PARENT_INPUT_COUNT, "immutable 2.39 parent input denominator drifted");

  const inheritedBytes = await Promise.all(parent.authoritativeInputs.map((input) => readFile(sourcePath(parent, input))));
  const additionalBytes = await Promise.all(RESEARCH_ITERATION_240_ADDITIONAL_INPUTS.map((input) => readFile(path.join(PROJECT_ROOT, input.path))));
  const manifest = structuredClone(parent);
  manifest.authoritativeInputs = parent.authoritativeInputs.map((input, index) => receipt({
    ...input,
    purpose: RESEARCH_ITERATION_240_PURPOSE_OVERRIDES[input.id] ?? input.purpose,
  }, inheritedBytes[index]));
  manifest.authoritativeInputs.push(...RESEARCH_ITERATION_240_ADDITIONAL_INPUTS.map((input, index) => receipt(input, additionalBytes[index])));
  const expectedInputCount = parent.authoritativeInputs.length + RESEARCH_ITERATION_240_ADDITIONAL_INPUTS.length;
  check(manifest.authoritativeInputs.length === expectedInputCount, "2.40 authoritative input count drifted");
  check(new Set(manifest.authoritativeInputs.map((input) => input.id)).size === expectedInputCount, "2.40 authoritative input IDs are not unique");
  check(new Set(manifest.authoritativeInputs.map((input) => input.path)).size === expectedInputCount, "2.40 authoritative input paths are not unique");

  const sources = new Map();
  manifest.authoritativeInputs.forEach((input, index) => {
    const bytes = index < inheritedBytes.length ? inheritedBytes[index] : additionalBytes[index - inheritedBytes.length];
    sources.set(input.id, bytes);
  });
  const current = await validateCurrentInputs(sources);

  manifest.manifestSchemaVersion = "2.40.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.40.0";
  manifest.releaseDate = "2026-09-02";
  manifest.application.version = current.applicationVersion;
  manifest.parentIterationManifest = { ...RESEARCH_ITERATION_240_PARENT };
  manifest.baseResearchRelease.note = "Iteration 2.40 makes evidence display record-specific without inventing missing biology. All 376 molecular profiles across nine exact namespaces expose eight fixed evidence-completeness slots. A checksum-pinned audit covers five local Neurolucida DAT files: NMO 45718 retains 8 admitted loops / 275 vertices, NMO 45674 adds 7 explicitly source-closed loops / 200 vertices, and NMO 50424, 50394 and 50408 remain held. The two admitted records total 15 source-native line loops / 475 vertices with zero fill, surface, volume, internal object, standardized-SWC overlay, same-cell join or registration. The registry remains 27 sources, 33 record sets, nine exact cell/profile rosters and one exact source-object set. The upgrade queue contains 186 entries through UPG-204. No full-project copy or distributable package is created.";
  manifest.integrity.inputCount = manifest.authoritativeInputs.length;

  const inputReceipt = (id) => simpleReceipt(getInput(manifest, id));
  const catalog = current.catalog;
  const nmo45674 = current.nmo45674;
  manifest.exactReferences.recordCompletenessAndNativeContourCatalogIntegrity = {
    contractId: "ohri-record-completeness-and-native-contour-catalog-integrity-2.40",
    catalogReleaseId: catalog.releaseId,
    auditedDatFileCount: catalog.summary.auditedDatFileCount,
    auditedNeuronIds: catalog.records.map((record) => record.neuronId),
    admittedRecordCount: catalog.summary.admittedRecordCount,
    admittedNeuronIds: catalog.records.filter((record) => record.admission.admittedContourObjectCount > 0).map((record) => record.neuronId),
    heldRecordCount: catalog.summary.heldRecordCount,
    heldNeuronIds: catalog.records.filter((record) => record.admission.admittedContourObjectCount === 0).map((record) => record.neuronId),
    admittedContourObjectCount: catalog.summary.admittedContourObjectCount,
    admittedVertexCount: catalog.summary.admittedVertexCount,
    admittedRenderedPrimitiveCount: catalog.summary.admittedRenderedPrimitiveCount,
    nmo45718ContourObjectCount: current.nmo45718.admission.admittedContourObjectCount,
    nmo45718VertexCount: current.nmo45718.admission.admittedVertexCount,
    nmo45674SourceDatBytes: nmo45674.source.bytes,
    nmo45674SourceDatSha256: nmo45674.source.sha256,
    nmo45674AuditedSomaContourObjectCount: nmo45674.audit.somaNamedContourObjectCount,
    nmo45674AuditedSomaVertexCount: nmo45674.audit.somaNamedVertexCount,
    nmo45674SourceClosedSomaContourCount: nmo45674.audit.sourceClosedSomaNamedContourCount,
    nmo45674SourceOpenSomaContourCount: nmo45674.audit.sourceOpenSomaNamedContourCount,
    nmo45674AdmittedContourObjectCount: nmo45674.admission.admittedContourObjectCount,
    nmo45674AdmittedVertexCount: nmo45674.admission.admittedVertexCount,
    nmo45674GeometryBytes: nmo45674.derivedObject.bytes,
    nmo45674GeometrySha256: nmo45674.derivedObject.sha256,
    nmo45674AllSomaPointPayloadSha256: nmo45674.audit.somaNamedPointPayloadSha256,
    nmo45674AdmittedPointPayloadSha256: "b163a222ae560d3467a94f3438985c868548695205d56efaaeed454b67977208",
    heldToddSomaContourObjectCount: 33,
    heldToddSomaVertexCount: 1904,
    canonicalSourceCount: current.registry.sourceCount,
    canonicalRecordSetCount: current.recordSetCount,
    bundledExactRosterCount: current.exactRosterCount,
    bundledExactObjectSetCount: current.exactObjectSetCount,
    researchExplorerRecordCount: current.explorerRecordCount,
    molecularProfileCount: current.molecularProfileCount,
    sourceNamespaceCount: current.sourceNamespaceCount,
    completenessSlotCount: MOLECULAR_COMPLETENESS_SLOT_IDS.length,
    completenessProfileCount: current.molecularProfileCount,
    researchUpgradeCount: current.upgrades.summary.upgradeCount,
    lastResearchUpgradeId: current.upgrades.upgrades.at(-1).id,
    admittedSurfaceCount: 0,
    admittedVolumeCount: 0,
    admittedInternalStructureCount: 0,
    generatedFallbackPrimitiveCount: 0,
    filledPolygonCount: 0,
    triangleCount: 0,
    standardizedSwcOverlayCount: 0,
    sameCellCrossModalJoinCount: 0,
    crossSourceIdentityCount: 0,
    registrationCount: 0,
    atlasRegistrationCount: 0,
    catalogBuilderReceipt: inputReceipt("nativeContourCatalogBuilder"),
    catalogReceipt: inputReceipt("nativeContourAdmissionCatalog"),
    nmo45674GeometryReceipt: inputReceipt("nmo45674NativeContourGeometry"),
    admissionRuntimeReceipt: inputReceipt("nativeContourAdmissionRuntime"),
    recordViewerReceipt: inputReceipt("nativeContourRecordViewer"),
    catalogValidatorReceipt: inputReceipt("nativeContourCatalogValidator"),
    catalogTestReceipt: inputReceipt("nativeContourCatalogTest"),
    observedMorphologyRouteLibraryReceipt: inputReceipt("observedMorphologyRouteLibrary"),
    sourceRegistryReceipt: inputReceipt("researchSourceRegistry"),
    sourceRegistryValidatorReceipt: inputReceipt("researchSourceRegistryValidator"),
    sourceRegistryTestReceipt: inputReceipt("researchSourceRegistryTest"),
    upgradeQueueReceipt: inputReceipt("researchUpgradeQueue"),
    upgradeRegistryReceipt: inputReceipt("researchModelUpgradeRegistry"),
    upgradeBuilderReceipt: inputReceipt("researchUpgradeRegistryBuilder"),
    upgradeValidatorReceipt: inputReceipt("researchUpgradeRegistryValidator"),
    upgradeTestReceipt: inputReceipt("researchUpgradeRegistryTest"),
    atlasFocusSynchronizationReceipt: inputReceipt("atlasFocusSynchronization"),
    atlasTypeContractsReceipt: inputReceipt("atlasTypeContracts"),
    atlasStylesheetReceipt: inputReceipt("atlasStylesheet"),
    researchOverviewReceipt: inputReceipt("researchOverview"),
    researchFocusEvidencePanelReceipt: inputReceipt("researchFocusEvidencePanel"),
    researchRecordModelReadoutReceipt: inputReceipt("researchRecordModelReadout"),
    researchRecordPresentationRuntimeReceipt: inputReceipt("researchRecordPresentationRuntime"),
    researchRecordPresentationTestReceipt: inputReceipt("researchRecordPresentationTest"),
    renderedHtmlTestReceipt: inputReceipt("renderedHtmlTest"),
    observedMorphologyRuntimeContractTestReceipt: inputReceipt("observedMorphologyRuntimeContractTest"),
    micronsObservedReferenceTestReceipt: inputReceipt("micronsObservedReferenceTest"),
    currentResearchTestRunnerReceipt: inputReceipt("currentResearchTestRunner"),
    applicationPackageReceipt: inputReceipt("applicationPackage"),
    packageLockReceipt: inputReceipt("packageLock"),
    projectReadmeReceipt: inputReceipt("projectReadme"),
    applicationLayoutReceipt: inputReceipt("applicationLayout"),
    parentSnapshotValidatorReceipt: inputReceipt("researchIteration239SnapshotValidator"),
    parentSnapshotTestReceipt: inputReceipt("researchIteration239SnapshotTest"),
    timelineReceipt: inputReceipt("researchTimeline240"),
    iterationBuilderReceipt: inputReceipt("researchIteration240Builder"),
    iterationSchemaReceipt: inputReceipt("researchIteration240Schema"),
    iterationValidatorReceipt: inputReceipt("researchIteration240Validator"),
    iterationTestReceipt: inputReceipt("researchIteration240Test"),
    fixedCompletenessSlotsForEveryMolecularProfile: true,
    lineLoopsOnly: true,
    selectedRecordIdentityGated: true,
    priorRecordGeometryCleared: true,
    sourceCoordinatesPreserved: true,
    viewerTransformReversible: true,
    traceRadiusRenderingForbidden: true,
    datToSwcOverlayForbidden: true,
    heldRecordsRenderZeroPrimitives: true,
    contourObjectsAreNotCellsOrTypes: true,
    noGenericGeometrySubstitution: true,
  };

  manifest.registrySummary = {
    ...parent.registrySummary,
    canonicalSourcePackageCount: current.registry.sourceCount,
    canonicalRecordSetCount: current.recordSetCount,
    bundledExactRosterCount: current.exactRosterCount,
    bundledExactObjectSetCount: current.exactObjectSetCount,
    researchUpgradeCount: current.upgrades.summary.upgradeCount,
    sourceProfileCount: current.molecularProfileCount,
    sourceNamespaceCount: current.sourceNamespaceCount,
    researchExplorerRecordCount: current.explorerRecordCount,
    sourceRegistryReceipt: getInput(manifest, "researchSourceRegistry"),
    upgradeRegistryReceipt: getInput(manifest, "researchModelUpgradeRegistry"),
  };
  manifest.scientificBoundaries.recordCompletenessAndNativeContourCatalogIntegrity = "Iteration 2.40 applies the same eight evidence-completeness slots to all 376 checksum-indexed molecular profiles across nine exact source namespaces. Each slot points to one indexed evidence row with its authority and locator or remains explicitly missing with a reason and source locator; missing is never converted into biological absence, a zero-valued measurement or content inherited from another profile. Visualization authority is separated from the full evidence dossier. The five-file source-native DAT audit covers exactly NMO 45718, 45674, 50424, 50394 and 50408. It admits only 15 ordered closed line loops / 475 vertices across two exact records: the immutable NMO 45718 admission contributes 8 loops / 275 vertices, and NMO 45674 contributes 7 CellBody loops / 200 vertices whose source closed flags are explicitly true. NMO 45674's one false-flag spaced Cell Body object and two Unknown1 traces remain excluded. All soma-named contours in NMO 50424, 50394 and 50408 retain false closure flags, so those three records remain held and render zero native primitives. Independent point-array agreement establishes parsing, not closure semantics. The admitted contour objects are neither cells nor interneuron types. No line is filled, triangulated or lofted, and no surface, membrane, volume, nucleus, organelle, receptor, bouton, synapse or other internal object is admitted. Same NeuroMorpho identity does not establish a DAT-to-standardized-SWC coordinate transform or vertex correspondence; overlay remains forbidden. There is no same-cell molecular or cross-modal join, cross-source biological identity, atlas registration or project registration. The catalog is one exact source-object set, distinct from the registry's nine exact cell/profile rosters. The registry remains 27 sources and 33 record sets, and the research queue contains 186 upgrades through UPG-204. Future Todd closure interpretation and Cano-Gomez reconciliation remain planned gates and add zero current objects.";
  manifest.registrations = { count: 0, records: [] };
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(serializeResearchIterationManifest240(manifest), "utf8") };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  for (const arg of args) check(arg === "--write" || arg === "--check", `unknown argument: ${arg}`);
  check(!(args.has("--write") && args.has("--check")), "--write and --check are mutually exclusive");
  const built = await buildResearchIterationManifest240();
  if (args.has("--write")) await writeFile(OUTPUT_PATH, built.bytes);
  if (args.has("--check")) {
    const committed = await readFile(OUTPUT_PATH);
    check(committed.equals(built.bytes), "research iteration manifest 2.40 is stale; run builder with --write");
  }
  const exact = built.manifest.exactReferences.recordCompletenessAndNativeContourCatalogIntegrity;
  process.stdout.write(`${JSON.stringify({
    releaseId: built.manifest.releaseId,
    applicationVersion: built.manifest.application.version,
    inputCount: built.manifest.integrity.inputCount,
    researchUpgradeCount: built.manifest.registrySummary.researchUpgradeCount,
    canonicalSourceCount: built.manifest.registrySummary.canonicalSourcePackageCount,
    canonicalRecordSetCount: built.manifest.registrySummary.canonicalRecordSetCount,
    bundledExactRosterCount: built.manifest.registrySummary.bundledExactRosterCount,
    bundledExactObjectSetCount: built.manifest.registrySummary.bundledExactObjectSetCount,
    auditedDatFileCount: exact.auditedDatFileCount,
    admittedRecordCount: exact.admittedRecordCount,
    heldRecordCount: exact.heldRecordCount,
    admittedContourObjectCount: exact.admittedContourObjectCount,
    admittedVertexCount: exact.admittedVertexCount,
    molecularProfileCount: exact.molecularProfileCount,
    completenessSlotCount: exact.completenessSlotCount,
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
