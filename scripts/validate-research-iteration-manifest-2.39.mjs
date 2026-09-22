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
  RESEARCH_ITERATION_239_ADDITIONAL_INPUTS,
  RESEARCH_ITERATION_239_PARENT,
  RESEARCH_ITERATION_239_PURPOSE_OVERRIDES,
  buildResearchIterationManifest239,
} from "../tools/build_research_iteration_manifest_2_39.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.39.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/research-iteration-manifest-2.39.schema.json");
const PARENT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.38.json");

const ADDED_IDS = Object.freeze(RESEARCH_ITERATION_239_ADDITIONAL_INPUTS.map((input) => input.id));

const ZERO_FIELDS = Object.freeze([
  "admittedSurfaceCount",
  "admittedInternalStructureCount",
  "generatedFallbackPrimitiveCount",
  "filledPolygonCount",
  "triangleCount",
  "volumeCount",
  "registrationCount",
  "atlasRegistrationCount",
  "sameCellCrossModalJoinCount",
  "standardizedSwcOverlayCount",
  "availabilitySourceObjectBundleAdmissionCount",
  "availabilitySelectedCellJoinCount",
  "availabilitySameCellInternalChainCount",
  "availabilityAdmittedGeometryObjectCount",
  "availabilityAdmittedInternalObjectCount",
  "availabilityRenderedObjectCount",
  "availabilityCurrentUiSurfaceCount",
]);

const TRUE_FIELDS = Object.freeze([
  "lineLoopsOnly",
  "sourceCoordinatesPreserved",
  "viewerTransformReversible",
  "legacyCellBodyKeptSeparate",
  "traceRadiusRenderingForbidden",
  "datToSwcOverlayForbidden",
  "availabilityCandidatesQueueOnly",
  "janeliaCellClassUnknown",
  "noGenericGeometrySubstitution",
]);

const RECEIPT_INPUT_IDS = Object.freeze({
  nativeContourBuilderReceipt: "nativeSomaContourBuilder",
  nativeContourContractReceipt: "nativeSomaContourContract",
  nativeContourGeometryReceipt: "nativeSomaContourGeometry",
  nativeContourRuntimeReceipt: "nativeSomaContourRuntime",
  nativeContourViewerReceipt: "nativeSomaContourViewer",
  nativeContourValidatorReceipt: "nativeSomaContourValidator",
  nativeContourTestReceipt: "nativeSomaContourTest",
  sourceRegistryReceipt: "researchSourceRegistry",
  sourceRegistryValidatorReceipt: "researchSourceRegistryValidator",
  sourceRegistryTestReceipt: "researchSourceRegistryTest",
  upgradeQueueReceipt: "researchUpgradeQueue",
  upgradeRegistryReceipt: "researchModelUpgradeRegistry",
  upgradeBuilderReceipt: "researchUpgradeRegistryBuilder",
  upgradeValidatorReceipt: "researchUpgradeRegistryValidator",
  upgradeTestReceipt: "researchUpgradeRegistryTest",
  parentSnapshotValidatorReceipt: "researchIteration238SnapshotValidator",
  parentSnapshotTestReceipt: "researchIteration238SnapshotTest",
  availabilityAuditReceipt: "openSourceModelingAvailabilityAudit",
  availabilityValidatorReceipt: "openSourceModelingAvailabilityValidator",
  availabilityTestReceipt: "openSourceModelingAvailabilityTest",
  timelineReceipt: "researchTimeline239",
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
  const roots = Object.fromEntries(Object.entries(manifest.inputRoots ?? {}).map(([scope, value]) => [
    scope,
    path.resolve(PROJECT_ROOT, value.locator),
  ]));
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

export async function validateResearchIterationManifest239(override = null) {
  const [manifestBytes, schema, parentBytes, expected] = await Promise.all([
    readFile(MANIFEST_PATH),
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    readFile(PARENT_PATH),
    buildResearchIterationManifest239(),
  ]);
  const manifest = override ?? JSON.parse(manifestBytes.toString("utf8"));
  const parent = JSON.parse(parentBytes.toString("utf8"));
  const errors = [];

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validateSchema = ajv.compile(schema);
  if (!validateSchema(manifest)) {
    errors.push(...(validateSchema.errors ?? []).map(
      (error) => `schema ${error.instancePath || "/"}: ${error.message ?? "violation"}`,
    ));
  }

  if (override === null) check(manifestBytes.equals(expected.bytes), "2.39 manifest differs from deterministic rebuild", errors);
  check(manifest.manifestContentSha256 === expected.manifest.manifestContentSha256, "2.39 manifest content receipt differs from deterministic rebuild", errors);
  check(computeManifestContentSha256(manifest) === manifest.manifestContentSha256, "2.39 manifest content SHA-256 drifted", errors);
  check(
    manifest.manifestSchemaVersion === "2.39.0"
      && manifest.releaseId === "ohri-mouse-interneuron-research-iteration-2.39.0"
      && manifest.releaseDate === "2026-09-02"
      && manifest.releaseStatus === "localhost_research_iteration"
      && manifest.application?.version === "2.39.0-research.1",
    "2.39 release identity drifted",
    errors,
  );

  check(same(manifest.parentIterationManifest, RESEARCH_ITERATION_239_PARENT), "immutable 2.38 parent receipt drifted", errors);
  check(
    parentBytes.byteLength === RESEARCH_ITERATION_239_PARENT.bytes
      && sha256(parentBytes) === RESEARCH_ITERATION_239_PARENT.fileSha256
      && parent.manifestContentSha256 === RESEARCH_ITERATION_239_PARENT.contentSha256
      && computeManifestContentSha256(parent) === RESEARCH_ITERATION_239_PARENT.contentSha256,
    "immutable 2.38 parent file or content receipt drifted",
    errors,
  );

  const inputs = manifest.authoritativeInputs ?? [];
  const inheritedCount = parent.authoritativeInputs?.length ?? 0;
  check(inheritedCount === 159, "immutable 2.38 parent input denominator drifted", errors);
  check(inputs.length === 172 && manifest.integrity?.inputCount === 172, "2.39 authoritative input count drifted", errors);
  check(new Set(inputs.map((input) => input.id)).size === 172, "2.39 authoritative input IDs are not unique", errors);
  check(new Set(inputs.map((input) => input.path)).size === 172, "2.39 authoritative input paths are not unique", errors);
  check(
    same(
      inputs.slice(0, inheritedCount).map(({ id, scope, path: inputPath }) => ({ id, scope, path: inputPath })),
      parent.authoritativeInputs.map(({ id, scope, path: inputPath }) => ({ id, scope, path: inputPath })),
    ),
    "2.39 inherited input identity or order drifted",
    errors,
  );
  for (const [id, purpose] of Object.entries(RESEARCH_ITERATION_239_PURPOSE_OVERRIDES)) {
    check(inputs.find((input) => input.id === id)?.purpose === purpose, `${id} current-purpose description drifted`, errors);
  }
  for (const parentInput of parent.authoritativeInputs.filter((input) => !(input.id in RESEARCH_ITERATION_239_PURPOSE_OVERRIDES))) {
    check(inputs.find((input) => input.id === parentInput.id)?.purpose === parentInput.purpose, `${parentInput.id} inherited-purpose description drifted`, errors);
  }
  check(same(inputs.slice(inheritedCount).map((input) => input.id), ADDED_IDS), "2.39 added input roster or order drifted", errors);

  const exact = manifest.exactReferences?.sourceNativeSomaContoursAndAvailabilityIntegrity ?? {};
  check(
    exact.contractId === "ohri-source-native-soma-contours-and-availability-integrity-2.39"
      && exact.nativeContourReleaseId === "ohri-neurolucida-source-native-soma-contour-trace-0.1.0"
      && exact.neuronId === 45718,
    "native-contour integrity identity drifted",
    errors,
  );
  check(
    exact.sourceDatBytes === 343774
      && exact.sourceDatSha256 === "ae5f3122dfcebfa06f3e69351670ab6428ed61d4a2bc24f099edc98e62f69415"
      && exact.independentParserCommit === "e07fd2d53c03945f011c335c7b643765f2d85a09"
      && exact.independentParserSha256 === "2714ab12fc330a7880262b0d5f0aa5321ddf5813ab86215f2121b78c08efaec2",
    "source DAT or independent-parser receipt drifted",
    errors,
  );
  check(
    exact.nativeGeometryBytes === 45606
      && exact.nativeGeometrySha256 === "a0aa80ce0f12b08cfe61b2862f1b3a29f67a1105a722b0dceda2fd3b25e898e8"
      && exact.pointPayloadSha256 === "a478e6263e7d00c1f17bc64143014a3519c39f771b6809a28b057db07c724ab4",
    "source-native contour geometry receipt drifted",
    errors,
  );
  check(
    exact.sourceSomaContourObjectCount === 8
      && exact.sourceFlagClosedObjectCount === 7
      && exact.legacyCellBodyClosureExceptionCount === 1
      && exact.vertexCount === 275
      && exact.semanticClosedSegmentCount === 275,
    "source-native contour denominator drifted",
    errors,
  );
  check(
    exact.canonicalSourceCount === 27
      && exact.canonicalRecordSetCount === 33
      && exact.bundledExactRosterCount === 9
      && exact.bundledExactObjectSetCount === 1
      && exact.sourceProfileCount === 376
      && exact.sourceNamespaceCount === 9
      && exact.researchExplorerRecordCount === 630,
    "2.39 source-registry or Explorer denominator drifted",
    errors,
  );
  check(exact.researchUpgradeCount === 178 && exact.lastResearchUpgradeId === "UPG-196", "research upgrade range drifted", errors);
  check(
    exact.availabilityCandidateCount === 3
      && exact.queueOnlyCandidateCount === 3
      && exact.boundedPairAvailabilityReceiptCount === 1,
    "open-source availability denominator drifted",
    errors,
  );
  check(exact.admittedSourceNativeContourObjectCount === 8, "admitted source-native contour count drifted", errors);
  for (const field of ZERO_FIELDS) check(exact[field] === 0, `${field} must remain zero`, errors);
  for (const field of TRUE_FIELDS) check(exact[field] === true, `${field} must remain true`, errors);

  for (const [receiptField, inputId] of Object.entries(RECEIPT_INPUT_IDS)) {
    check(
      same(exact[receiptField], simpleReceipt(inputs.find((input) => input.id === inputId))),
      `${receiptField} no longer matches authoritative input ${inputId}`,
      errors,
    );
  }

  check(
    manifest.registrySummary?.canonicalSourcePackageCount === 27
      && manifest.registrySummary?.canonicalRecordSetCount === 33
      && manifest.registrySummary?.bundledExactRosterCount === 9
      && manifest.registrySummary?.bundledExactObjectSetCount === 1
      && manifest.registrySummary?.researchUpgradeCount === 178
      && manifest.registrySummary?.sourceProfileCount === 376
      && manifest.registrySummary?.sourceNamespaceCount === 9
      && manifest.registrySummary?.researchExplorerRecordCount === 630
      && manifest.registrySummary?.crossSourceIdentityCount === 0
      && manifest.registrySummary?.registrationCount === 0
      && manifest.registrySummary?.renderedInternalPrimitiveCount === 0,
    "2.39 registry summary drifted",
    errors,
  );
  check(
    same(manifest.registrySummary?.sourceRegistryReceipt, inputs.find((input) => input.id === "researchSourceRegistry")),
    "source registry summary receipt drifted",
    errors,
  );
  check(
    same(manifest.registrySummary?.upgradeRegistryReceipt, inputs.find((input) => input.id === "researchModelUpgradeRegistry")),
    "upgrade registry summary receipt drifted",
    errors,
  );
  check(manifest.registrations?.count === 0 && manifest.registrations?.records?.length === 0, "project registrations must remain zero", errors);

  const boundary = manifest.scientificBoundaries?.sourceNativeSomaContoursAndAvailabilityIntegrity ?? "";
  check(/exactly eight source-native NMO 45718 Neurolucida soma contour objects/.test(boundary), "native-contour scientific boundary drifted", errors);
  check(/no polygon fill, triangle, lofted surface/.test(boundary) && /vertex overlay remains forbidden/.test(boundary), "surface or DAT-to-SWC boundary drifted", errors);
  check(/unknown cell class/.test(boundary) && /availability audit is queue-only/.test(boundary), "availability-audit scientific boundary drifted", errors);
  check(/nine bundled exact child-roster chains/.test(boundary) && /one separate bundled exact source-object-set chain/.test(boundary) && /not a cell roster/.test(boundary), "roster versus source-object-set boundary drifted", errors);
  check(/does not create a source-object bundle admission, selected-cell join, same-cell internal chain/.test(boundary), "zero-admission scientific boundary drifted", errors);

  if (override === null) await checkInputFiles(manifest, errors);
  if (errors.length) throw new Error(`Research iteration 2.39 manifest validation failed:\n- ${errors.join("\n- ")}`);

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
    sourceProfileCount: manifest.registrySummary.sourceProfileCount,
    sourceNamespaceCount: manifest.registrySummary.sourceNamespaceCount,
    researchExplorerRecordCount: manifest.registrySummary.researchExplorerRecordCount,
    sourceSomaContourObjectCount: exact.sourceSomaContourObjectCount,
    vertexCount: exact.vertexCount,
    availabilityCandidateCount: exact.availabilityCandidateCount,
    admittedSurfaceCount: exact.admittedSurfaceCount,
    admittedInternalStructureCount: exact.admittedInternalStructureCount,
    registrationCount: exact.registrationCount,
  };
}

async function main() {
  const report = await validateResearchIterationManifest239();
  process.stdout.write(`Research iteration manifest 2.39 validation passed: ${report.fileBytes} bytes; ${report.inputCount} inputs; ${report.sourceSomaContourObjectCount} source-native contours; ${report.vertexCount} vertices; ${report.availabilityCandidateCount} availability candidates; 0 surfaces; 0 internal objects; 0 REG\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
