#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import {
  RESEARCH_ITERATION_240_ADDITIONAL_INPUTS,
  RESEARCH_ITERATION_240_PARENT,
  RESEARCH_ITERATION_240_PURPOSE_OVERRIDES,
  buildResearchIterationManifest240,
} from "../tools/build_research_iteration_manifest_2_40.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.40.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/research-iteration-manifest-2.40.schema.json");
const PARENT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.39.json");

const ADDED_IDS = Object.freeze(RESEARCH_ITERATION_240_ADDITIONAL_INPUTS.map((input) => input.id));
const RECEIPT_INPUT_IDS = Object.freeze({
  catalogBuilderReceipt: "nativeContourCatalogBuilder",
  catalogReceipt: "nativeContourAdmissionCatalog",
  nmo45674GeometryReceipt: "nmo45674NativeContourGeometry",
  admissionRuntimeReceipt: "nativeContourAdmissionRuntime",
  recordViewerReceipt: "nativeContourRecordViewer",
  catalogValidatorReceipt: "nativeContourCatalogValidator",
  catalogTestReceipt: "nativeContourCatalogTest",
  observedMorphologyRouteLibraryReceipt: "observedMorphologyRouteLibrary",
  sourceRegistryReceipt: "researchSourceRegistry",
  sourceRegistryValidatorReceipt: "researchSourceRegistryValidator",
  sourceRegistryTestReceipt: "researchSourceRegistryTest",
  upgradeQueueReceipt: "researchUpgradeQueue",
  upgradeRegistryReceipt: "researchModelUpgradeRegistry",
  upgradeBuilderReceipt: "researchUpgradeRegistryBuilder",
  upgradeValidatorReceipt: "researchUpgradeRegistryValidator",
  upgradeTestReceipt: "researchUpgradeRegistryTest",
  atlasFocusSynchronizationReceipt: "atlasFocusSynchronization",
  atlasTypeContractsReceipt: "atlasTypeContracts",
  atlasStylesheetReceipt: "atlasStylesheet",
  researchOverviewReceipt: "researchOverview",
  researchFocusEvidencePanelReceipt: "researchFocusEvidencePanel",
  researchRecordModelReadoutReceipt: "researchRecordModelReadout",
  researchRecordPresentationRuntimeReceipt: "researchRecordPresentationRuntime",
  researchRecordPresentationTestReceipt: "researchRecordPresentationTest",
  renderedHtmlTestReceipt: "renderedHtmlTest",
  observedMorphologyRuntimeContractTestReceipt: "observedMorphologyRuntimeContractTest",
  micronsObservedReferenceTestReceipt: "micronsObservedReferenceTest",
  currentResearchTestRunnerReceipt: "currentResearchTestRunner",
  applicationPackageReceipt: "applicationPackage",
  packageLockReceipt: "packageLock",
  projectReadmeReceipt: "projectReadme",
  applicationLayoutReceipt: "applicationLayout",
  parentSnapshotValidatorReceipt: "researchIteration239SnapshotValidator",
  parentSnapshotTestReceipt: "researchIteration239SnapshotTest",
  timelineReceipt: "researchTimeline240",
  iterationBuilderReceipt: "researchIteration240Builder",
  iterationSchemaReceipt: "researchIteration240Schema",
  iterationValidatorReceipt: "researchIteration240Validator",
  iterationTestReceipt: "researchIteration240Test",
});

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

function simpleReceipt(input) {
  if (!input) return null;
  return { path: input.path, bytes: input.bytes, sha256: input.sha256 };
}

async function checkInputFiles(manifest, errors) {
  const roots = Object.fromEntries(Object.entries(manifest.inputRoots ?? {}).map(([scope, value]) => [scope, path.resolve(PROJECT_ROOT, value.locator)]));
  await Promise.all((manifest.authoritativeInputs ?? []).map(async (input) => {
    const root = roots[input.scope];
    if (!root) {
      errors.push(`${input.id} has unsupported input scope ${input.scope}`);
      return;
    }
    const resolved = path.resolve(root, input.path);
    const relative = path.relative(root, resolved);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      errors.push(`${input.id} escapes its declared input root`);
      return;
    }
    try {
      const bytes = await readFile(resolved);
      check(bytes.byteLength === input.bytes && sha256(bytes) === input.sha256, `${input.id} on-disk receipt drifted`, errors);
    } catch (error) {
      errors.push(`${input.id} cannot be read: ${error instanceof Error ? error.message : error}`);
    }
  }));
}

export async function validateResearchIterationManifest240(override = null) {
  const [manifestBytes, schema, parentBytes, expected] = await Promise.all([
    readFile(MANIFEST_PATH),
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    readFile(PARENT_PATH),
    buildResearchIterationManifest240(),
  ]);
  const manifest = override ?? JSON.parse(manifestBytes.toString("utf8"));
  const parent = JSON.parse(parentBytes.toString("utf8"));
  const errors = [];

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validateSchema = ajv.compile(schema);
  if (!validateSchema(manifest)) {
    errors.push(...(validateSchema.errors ?? []).map((error) => `schema ${error.instancePath || "/"}: ${error.message ?? "violation"}`));
  }

  if (override === null) check(manifestBytes.equals(expected.bytes), "2.40 manifest differs from deterministic rebuild", errors);
  check(manifest.manifestContentSha256 === expected.manifest.manifestContentSha256, "2.40 manifest content receipt differs from deterministic rebuild", errors);
  check(computeManifestContentSha256(manifest) === manifest.manifestContentSha256, "2.40 manifest content SHA-256 drifted", errors);
  check(
    manifest.manifestSchemaVersion === "2.40.0"
      && manifest.releaseId === "ohri-mouse-interneuron-research-iteration-2.40.0"
      && manifest.releaseDate === "2026-09-02"
      && manifest.releaseStatus === "localhost_research_iteration"
      && manifest.application?.version === "2.40.0-research.1",
    "2.40 release identity drifted",
    errors,
  );

  check(same(manifest.parentIterationManifest, RESEARCH_ITERATION_240_PARENT), "immutable 2.39 parent receipt drifted", errors);
  check(
    parentBytes.byteLength === RESEARCH_ITERATION_240_PARENT.bytes
      && sha256(parentBytes) === RESEARCH_ITERATION_240_PARENT.fileSha256
      && parent.manifestContentSha256 === RESEARCH_ITERATION_240_PARENT.contentSha256
      && computeManifestContentSha256(parent) === RESEARCH_ITERATION_240_PARENT.contentSha256,
    "immutable 2.39 parent file or content receipt drifted",
    errors,
  );

  const inputs = manifest.authoritativeInputs ?? [];
  const inheritedCount = parent.authoritativeInputs?.length ?? 0;
  const expectedInputCount = inheritedCount + RESEARCH_ITERATION_240_ADDITIONAL_INPUTS.length;
  check(inheritedCount === 172, "immutable 2.39 parent input denominator drifted", errors);
  check(inputs.length === expectedInputCount && manifest.integrity?.inputCount === expectedInputCount, "2.40 authoritative input count drifted", errors);
  check(new Set(inputs.map((input) => input.id)).size === expectedInputCount, "2.40 authoritative input IDs are not unique", errors);
  check(new Set(inputs.map((input) => input.path)).size === expectedInputCount, "2.40 authoritative input paths are not unique", errors);
  check(
    same(
      inputs.slice(0, inheritedCount).map(({ id, scope, path: inputPath }) => ({ id, scope, path: inputPath })),
      parent.authoritativeInputs.map(({ id, scope, path: inputPath }) => ({ id, scope, path: inputPath })),
    ),
    "2.40 inherited input identity or order drifted",
    errors,
  );
  for (const [id, purpose] of Object.entries(RESEARCH_ITERATION_240_PURPOSE_OVERRIDES)) check(inputs.find((input) => input.id === id)?.purpose === purpose, `${id} current-purpose description drifted`, errors);
  for (const parentInput of parent.authoritativeInputs.filter((input) => !(input.id in RESEARCH_ITERATION_240_PURPOSE_OVERRIDES))) check(inputs.find((input) => input.id === parentInput.id)?.purpose === parentInput.purpose, `${parentInput.id} inherited-purpose description drifted`, errors);
  check(same(inputs.slice(inheritedCount).map((input) => input.id), ADDED_IDS), "2.40 added input roster or order drifted", errors);

  const exact = manifest.exactReferences?.recordCompletenessAndNativeContourCatalogIntegrity ?? {};
  check(exact.contractId === "ohri-record-completeness-and-native-contour-catalog-integrity-2.40" && exact.catalogReleaseId === "ohri-neurolucida-native-contour-admission-catalog-0.2.0", "2.40 integrity identity drifted", errors);
  check(same(exact.auditedNeuronIds, [45718, 45674, 50424, 50394, 50408]) && same(exact.admittedNeuronIds, [45718, 45674]) && same(exact.heldNeuronIds, [50424, 50394, 50408]), "native-contour record identities drifted", errors);
  check(exact.auditedDatFileCount === 5 && exact.admittedRecordCount === 2 && exact.heldRecordCount === 3, "native-contour audit/admission denominator drifted", errors);
  check(exact.admittedContourObjectCount === 15 && exact.admittedVertexCount === 475 && exact.admittedRenderedPrimitiveCount === 15, "native-contour object/vertex denominator drifted", errors);
  check(exact.nmo45718ContourObjectCount === 8 && exact.nmo45718VertexCount === 275, "NMO 45718 contour admission drifted", errors);
  check(
    exact.nmo45674SourceDatBytes === 353251
      && exact.nmo45674SourceDatSha256 === "9d5a8670fdb97656c18eb8819b3c4723f438fb8929e66ea8dc6103c6bb547d87"
      && exact.nmo45674AuditedSomaContourObjectCount === 8
      && exact.nmo45674AuditedSomaVertexCount === 227
      && exact.nmo45674SourceClosedSomaContourCount === 7
      && exact.nmo45674SourceOpenSomaContourCount === 1
      && exact.nmo45674AdmittedContourObjectCount === 7
      && exact.nmo45674AdmittedVertexCount === 200
      && exact.nmo45674GeometryBytes === 35842
      && exact.nmo45674GeometrySha256 === "1e41538a6443dcf7893386c180d3d22ddf81cc72a4d96f66a16193c97747cec3",
    "NMO 45674 audit, admission or receipt drifted",
    errors,
  );
  check(exact.heldToddSomaContourObjectCount === 33 && exact.heldToddSomaVertexCount === 1904, "held Todd denominator drifted", errors);
  check(
    exact.canonicalSourceCount === 27
      && exact.canonicalRecordSetCount === 33
      && exact.bundledExactRosterCount === 9
      && exact.bundledExactObjectSetCount === 1
      && exact.researchExplorerRecordCount === 630
      && exact.molecularProfileCount === 376
      && exact.sourceNamespaceCount === 9
      && exact.completenessSlotCount === 8
      && exact.completenessProfileCount === 376,
    "registry, Explorer or completeness denominator drifted",
    errors,
  );
  check(exact.researchUpgradeCount === 186 && exact.lastResearchUpgradeId === "UPG-204", "research upgrade range drifted", errors);
  for (const field of ["admittedSurfaceCount", "admittedVolumeCount", "admittedInternalStructureCount", "generatedFallbackPrimitiveCount", "filledPolygonCount", "triangleCount", "standardizedSwcOverlayCount", "sameCellCrossModalJoinCount", "crossSourceIdentityCount", "registrationCount", "atlasRegistrationCount"]) check(exact[field] === 0, `${field} must remain zero`, errors);
  for (const field of ["fixedCompletenessSlotsForEveryMolecularProfile", "lineLoopsOnly", "selectedRecordIdentityGated", "priorRecordGeometryCleared", "sourceCoordinatesPreserved", "viewerTransformReversible", "traceRadiusRenderingForbidden", "datToSwcOverlayForbidden", "heldRecordsRenderZeroPrimitives", "contourObjectsAreNotCellsOrTypes", "noGenericGeometrySubstitution"]) check(exact[field] === true, `${field} must remain true`, errors);
  for (const [receiptField, inputId] of Object.entries(RECEIPT_INPUT_IDS)) check(same(exact[receiptField], simpleReceipt(inputs.find((input) => input.id === inputId))), `${receiptField} no longer matches authoritative input ${inputId}`, errors);

  check(
    manifest.registrySummary?.canonicalSourcePackageCount === 27
      && manifest.registrySummary?.canonicalRecordSetCount === 33
      && manifest.registrySummary?.bundledExactRosterCount === 9
      && manifest.registrySummary?.bundledExactObjectSetCount === 1
      && manifest.registrySummary?.researchUpgradeCount === 186
      && manifest.registrySummary?.sourceProfileCount === 376
      && manifest.registrySummary?.sourceNamespaceCount === 9
      && manifest.registrySummary?.researchExplorerRecordCount === 630
      && manifest.registrySummary?.crossSourceIdentityCount === 0
      && manifest.registrySummary?.registrationCount === 0
      && manifest.registrySummary?.renderedInternalPrimitiveCount === 0,
    "2.40 registry summary drifted",
    errors,
  );
  check(same(manifest.registrySummary?.sourceRegistryReceipt, inputs.find((input) => input.id === "researchSourceRegistry")), "source registry summary receipt drifted", errors);
  check(same(manifest.registrySummary?.upgradeRegistryReceipt, inputs.find((input) => input.id === "researchModelUpgradeRegistry")), "upgrade registry summary receipt drifted", errors);
  check(manifest.registrations?.count === 0 && manifest.registrations?.records?.length === 0, "project registrations must remain zero", errors);

  const boundary = manifest.scientificBoundaries?.recordCompletenessAndNativeContourCatalogIntegrity ?? "";
  check(/same eight evidence-completeness slots to all 376/.test(boundary) && /nine exact source namespaces/.test(boundary), "fixed-slot scientific boundary drifted", errors);
  check(/15 ordered closed line loops \/ 475 vertices/.test(boundary) && /NMO 45674 contributes 7 CellBody loops \/ 200 vertices/.test(boundary), "native-contour scientific boundary drifted", errors);
  check(/remain held and render zero native primitives/.test(boundary) && /neither cells nor interneuron types/.test(boundary), "held-record or contour-unit boundary drifted", errors);
  check(/no same-cell molecular or cross-modal join/.test(boundary) && /overlay remains forbidden/.test(boundary), "join, overlay or registration boundary drifted", errors);

  if (override === null) await checkInputFiles(manifest, errors);
  if (errors.length) throw new Error(`Research iteration 2.40 manifest validation failed:\n- ${errors.join("\n- ")}`);

  return {
    releaseId: manifest.releaseId,
    fileBytes: manifestBytes.byteLength,
    fileSha256: sha256(manifestBytes),
    manifestContentSha256: manifest.manifestContentSha256,
    inputCount: manifest.integrity.inputCount,
    researchUpgradeCount: manifest.registrySummary.researchUpgradeCount,
    lastResearchUpgradeId: exact.lastResearchUpgradeId,
    canonicalSourceCount: manifest.registrySummary.canonicalSourcePackageCount,
    canonicalRecordSetCount: manifest.registrySummary.canonicalRecordSetCount,
    bundledExactRosterCount: manifest.registrySummary.bundledExactRosterCount,
    bundledExactObjectSetCount: manifest.registrySummary.bundledExactObjectSetCount,
    molecularProfileCount: exact.molecularProfileCount,
    sourceNamespaceCount: exact.sourceNamespaceCount,
    completenessSlotCount: exact.completenessSlotCount,
    auditedDatFileCount: exact.auditedDatFileCount,
    admittedRecordCount: exact.admittedRecordCount,
    heldRecordCount: exact.heldRecordCount,
    admittedContourObjectCount: exact.admittedContourObjectCount,
    admittedVertexCount: exact.admittedVertexCount,
    admittedSurfaceCount: exact.admittedSurfaceCount,
    admittedInternalStructureCount: exact.admittedInternalStructureCount,
    registrationCount: exact.registrationCount,
  };
}

async function main() {
  const report = await validateResearchIterationManifest240();
  process.stdout.write(`Research iteration manifest 2.40 validation passed: ${report.fileBytes} bytes; ${report.inputCount} inputs; ${report.auditedDatFileCount} DATs; ${report.admittedContourObjectCount} loops; ${report.admittedVertexCount} vertices; ${report.completenessSlotCount} completeness slots; 0 surfaces; 0 internal objects; 0 REG\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
