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
  RESEARCH_ITERATION_241_ADDITIONAL_INPUTS,
  RESEARCH_ITERATION_241_EXPECTED_INPUT_COUNT,
  RESEARCH_ITERATION_241_PARENT,
  RESEARCH_ITERATION_241_PURPOSE_OVERRIDES,
  RESEARCH_ITERATION_241_RECEIPT_INPUT_IDS,
  buildResearchIterationManifest241,
} from "../tools/build_research_iteration_manifest_2_41.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.41.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/research-iteration-manifest-2.41.schema.json");
const PARENT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.40.json");
const ADDED_IDS = Object.freeze(RESEARCH_ITERATION_241_ADDITIONAL_INPUTS.map((input) => input.id));

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

export async function validateResearchIterationManifest241(override = null) {
  const [manifestBytes, schema, parentBytes, expected] = await Promise.all([
    readFile(MANIFEST_PATH),
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    readFile(PARENT_PATH),
    buildResearchIterationManifest241(),
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

  if (override === null) check(manifestBytes.equals(expected.bytes), "2.41 manifest differs from deterministic rebuild", errors);
  check(manifest.manifestContentSha256 === expected.manifest.manifestContentSha256, "2.41 manifest content receipt differs from deterministic rebuild", errors);
  check(computeManifestContentSha256(manifest) === manifest.manifestContentSha256, "2.41 manifest content SHA-256 drifted", errors);
  check(
    manifest.manifestSchemaVersion === "2.41.0"
      && manifest.releaseId === "ohri-mouse-interneuron-research-iteration-2.41.0"
      && manifest.releaseDate === "2026-09-02"
      && manifest.releaseStatus === "localhost_research_iteration"
      && manifest.application?.version === "2.41.0-research.1",
    "2.41 release identity drifted",
    errors,
  );

  check(same(manifest.parentIterationManifest, RESEARCH_ITERATION_241_PARENT), "immutable 2.40 parent receipt drifted", errors);
  check(
    parentBytes.byteLength === RESEARCH_ITERATION_241_PARENT.bytes
      && sha256(parentBytes) === RESEARCH_ITERATION_241_PARENT.fileSha256
      && parent.manifestContentSha256 === RESEARCH_ITERATION_241_PARENT.contentSha256
      && computeManifestContentSha256(parent) === RESEARCH_ITERATION_241_PARENT.contentSha256,
    "immutable 2.40 parent file or content receipt drifted",
    errors,
  );

  const inputs = manifest.authoritativeInputs ?? [];
  const inheritedCount = parent.authoritativeInputs?.length ?? 0;
  check(inheritedCount === 187, "immutable 2.40 parent input denominator drifted", errors);
  check(RESEARCH_ITERATION_241_ADDITIONAL_INPUTS.length === 43, "2.41 additional-input roster denominator drifted", errors);
  check(inputs.length === RESEARCH_ITERATION_241_EXPECTED_INPUT_COUNT && manifest.integrity?.inputCount === RESEARCH_ITERATION_241_EXPECTED_INPUT_COUNT, "2.41 authoritative input count drifted", errors);
  check(new Set(inputs.map((input) => input.id)).size === RESEARCH_ITERATION_241_EXPECTED_INPUT_COUNT, "2.41 authoritative input IDs are not unique", errors);
  check(new Set(inputs.map((input) => input.path)).size === RESEARCH_ITERATION_241_EXPECTED_INPUT_COUNT, "2.41 authoritative input paths are not unique", errors);
  check(
    same(
      inputs.slice(0, inheritedCount).map(({ id, scope, path: inputPath }) => ({ id, scope, path: inputPath })),
      parent.authoritativeInputs.map(({ id, scope, path: inputPath }) => ({ id, scope, path: inputPath })),
    ),
    "2.41 inherited input identity or order drifted",
    errors,
  );
  for (const [id, purpose] of Object.entries(RESEARCH_ITERATION_241_PURPOSE_OVERRIDES)) {
    check(inputs.find((input) => input.id === id)?.purpose === purpose, `${id} current-purpose description drifted`, errors);
  }
  for (const parentInput of parent.authoritativeInputs.filter((input) => !(input.id in RESEARCH_ITERATION_241_PURPOSE_OVERRIDES))) {
    check(inputs.find((input) => input.id === parentInput.id)?.purpose === parentInput.purpose, `${parentInput.id} inherited-purpose description drifted`, errors);
  }
  check(same(inputs.slice(inheritedCount).map((input) => input.id), ADDED_IDS), "2.41 added input roster or order drifted", errors);

  const exact = manifest.exactReferences?.activeRecordRegistrySelectionDeltaToddAndCanoIntegrity ?? {};
  check(exact.contractId === "ohri-active-record-registry-selection-delta-todd-cano-integrity-2.41", "2.41 exact-reference identity drifted", errors);
  check(same(exact.completedUpgradeIds, ["UPG-200", "UPG-201", "UPG-202", "UPG-203", "UPG-204"]), "2.41 completed upgrade roster drifted", errors);
  check(exact.researchUpgradeCount === 186 && exact.lastResearchUpgradeId === "UPG-204", "research upgrade range drifted", errors);
  check(
    exact.sharedVerifiedActiveRecord === true
      && exact.activeRecordLoaderInvocationCount === 1
      && exact.activeRecordConsumerRoleCount === 3
      && exact.independentConsumerLookupCount === 0
      && exact.monotonicRequestGeneration === true
      && exact.staleSettlementRejected === true,
    "active-record ownership or stale-settlement boundary drifted",
    errors,
  );
  check(
    exact.selectionDeltaContractId === "research-selection-delta-0.1"
      && exact.selectionDeltaPresentationAuditOnly === true
      && exact.selectionDeltaBiologicalTransitionClaimCount === 0
      && exact.selectionDeltaRelationshipAdmissionCount === 0,
    "selection-delta interpretation boundary drifted",
    errors,
  );
  check(
    exact.canonicalSourceCount === 27
      && exact.canonicalRecordSetCount === 34
      && exact.bundledExactRosterCount === 10
      && exact.bundledExactObjectSetCount === 1
      && exact.staleDenominatorLiteralCount === 0,
    "registry or dynamic-denominator contract drifted",
    errors,
  );
  check(
    exact.explorerAssetSetId === "ohri:research-explorer-index:1.13.0"
      && exact.explorerSourceFileCount === 21
      && exact.researchExplorerRecordCount === 641
      && exact.molecularProfileCount === 387
      && exact.sourceNamespaceCount === 10
      && exact.completenessSlotCount === 8,
    "Explorer/profile/namespace denominator drifted",
    errors,
  );
  check(
    exact.catalogReleaseId === "ohri-neurolucida-native-contour-admission-catalog-0.3.0"
      && exact.auditedDatFileCount === 5
      && exact.admittedRecordCount === 5
      && exact.heldRecordCount === 0
      && exact.admittedContourObjectCount === 48
      && exact.admittedVertexCount === 2379,
    "native-contour 0.3 identity or denominator drifted",
    errors,
  );
  check(
    exact.toddAdmittedRecordCount === 3
      && exact.toddRawFalseClosureFlagContourCount === 33
      && exact.toddMbfCellBodyPresencePropertyCount === 33
      && exact.toddIndependentParserSomaContourCount === 33
      && exact.toddAdmittedContourObjectCount === 33
      && exact.toddAdmittedVertexCount === 1904
      && exact.excludedToddUserLineObjectCount === 12
      && exact.sourceClosureFlagUsedAsSoleToddAuthority === false,
    "Todd file-specific admission boundary drifted",
    errors,
  );
  for (const field of ["admittedFilledPolygonCount", "admittedTriangleCount", "admittedSurfaceCount", "admittedInternalStructureCount", "standardizedSwcOverlayCount", "sameCellCrossModalJoinCount", "registrationCount"]) {
    check(exact[field] === 0, `${field} must remain zero`, errors);
  }
  check(
    exact.canoRegistryReleaseId === "ohri-cano-gomez-p56-multiome-interneuron-registry-0.1.0"
      && exact.canoSourceObjectCount === 3
      && exact.canoSourceNucleusCount === 169345
      && exact.canoSourceScopedGroupCount === 57
      && exact.canoConfirmedInterneuronNucleusCount === 923
      && exact.canoConfirmedInterneuronProfileCount === 11
      && exact.canoExcludedMotorNucleusCount === 2276
      && exact.canoPaperReportedNeuronTypeCount === 516
      && exact.canoPaperReportedTypeCountUsedAsInterneuronDenominator === false
      && exact.canoPerNucleusNonNeuronalExcludedCount === null
      && exact.canoCrossAssayCellIdentityVerified === false
      && exact.canoSourceRdsBundleCount === 0,
    "Cano-Gomez identity, denominator or reported-type boundary drifted",
    errors,
  );
  check(
    exact.canoConfirmedInterneuronNucleusCount
      + exact.canoExcludedMotorNucleusCount
      + exact.canoExcludedSensoryScopeNucleusCount
      + exact.canoExcludedProjectionLocalStatusUnresolvedNucleusCount
      + exact.canoExcludedAmbiguousOrProjectionExceptionUnresolvedNucleusCount === 169345,
    "Cano-Gomez decision categories do not partition 169,345 nuclei",
    errors,
  );
  for (const field of ["canoGeneratedGeometryCount", "canoInternalStructureObjectCount", "canoSameCellLinkCount", "canoAtlasRegistrationCount", "crossSourceIdentityCount", "renderedInternalPrimitiveCount"]) {
    check(exact[field] === 0, `${field} must remain zero`, errors);
  }

  check(same(Object.keys(exact.receipts ?? {}), RESEARCH_ITERATION_241_RECEIPT_INPUT_IDS), "2.41 exact receipt roster or order drifted", errors);
  for (const id of RESEARCH_ITERATION_241_RECEIPT_INPUT_IDS) {
    check(same(exact.receipts?.[id], simpleReceipt(inputs.find((input) => input.id === id))), `${id} exact receipt no longer matches its authoritative input`, errors);
  }

  check(
    manifest.registrySummary?.canonicalSourcePackageCount === 27
      && manifest.registrySummary?.canonicalRecordSetCount === 34
      && manifest.registrySummary?.bundledExactRosterCount === 10
      && manifest.registrySummary?.bundledExactObjectSetCount === 1
      && manifest.registrySummary?.researchUpgradeCount === 186
      && manifest.registrySummary?.sourceProfileCount === 387
      && manifest.registrySummary?.sourceNamespaceCount === 10
      && manifest.registrySummary?.researchExplorerRecordCount === 641
      && manifest.registrySummary?.crossSourceIdentityCount === 0
      && manifest.registrySummary?.registrationCount === 0
      && manifest.registrySummary?.renderedInternalPrimitiveCount === 0,
    "2.41 registry summary drifted",
    errors,
  );
  check(same(manifest.registrySummary?.sourceRegistryReceipt, inputs.find((input) => input.id === "researchSourceRegistry")), "source registry summary receipt drifted", errors);
  check(same(manifest.registrySummary?.upgradeRegistryReceipt, inputs.find((input) => input.id === "researchModelUpgradeRegistry")), "upgrade registry summary receipt drifted", errors);
  check(manifest.registrations?.count === 0 && manifest.registrations?.records?.length === 0, "project registrations must remain zero", errors);

  const boundary = manifest.scientificBoundaries?.activeRecordRegistrySelectionDeltaToddAndCanoIntegrity ?? "";
  check(/one checksum-verified active-record loader/.test(boundary) && /stale success or failure settlements are rejected/.test(boundary), "active-record scientific boundary drifted", errors);
  check(/not evidence of development, biological transition/.test(boundary) && /zero relationship admissions/.test(boundary), "selection-delta scientific boundary drifted", errors);
  check(/33 raw false-flag Cell Body contours \/ 1,904 vertices/.test(boundary) && /not reinterpreted by a generic false-flag rule/.test(boundary), "Todd scientific boundary drifted", errors);
  check(/Only exact groups=CHOL_IN rows are admitted/.test(boundary) && /516 neuronal types.*never become an interneuron denominator/.test(boundary), "Cano-Gomez scientific boundary drifted", errors);
  check(/frozen curator 2.8 package and immutable 2.40 manifest remain byte-preserved/.test(boundary), "frozen-release preservation boundary drifted", errors);

  if (override === null) await checkInputFiles(manifest, errors);
  if (errors.length) throw new Error(`Research iteration 2.41 manifest validation failed:\n- ${errors.join("\n- ")}`);

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
    researchExplorerRecordCount: exact.researchExplorerRecordCount,
    molecularProfileCount: exact.molecularProfileCount,
    sourceNamespaceCount: exact.sourceNamespaceCount,
    admittedContourObjectCount: exact.admittedContourObjectCount,
    admittedVertexCount: exact.admittedVertexCount,
    canoSourceNucleusCount: exact.canoSourceNucleusCount,
    canoConfirmedInterneuronNucleusCount: exact.canoConfirmedInterneuronNucleusCount,
    canoConfirmedInterneuronProfileCount: exact.canoConfirmedInterneuronProfileCount,
    admittedSurfaceCount: exact.admittedSurfaceCount,
    admittedInternalStructureCount: exact.admittedInternalStructureCount,
    registrationCount: exact.registrationCount,
  };
}

async function main() {
  const report = await validateResearchIterationManifest241();
  process.stdout.write(`Research iteration manifest 2.41 validation passed: ${report.fileBytes} bytes; ${report.inputCount} inputs; ${report.researchExplorerRecordCount} Explorer records; ${report.admittedContourObjectCount} loops; ${report.admittedVertexCount} vertices; ${report.canoConfirmedInterneuronProfileCount} Cano-Gomez profiles; 0 surfaces; 0 internal objects; 0 REG\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
