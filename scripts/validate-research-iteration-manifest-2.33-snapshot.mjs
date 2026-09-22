#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { computeManifestContentSha256 } from "./build-release-manifest.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.33.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/research-iteration-manifest-2.33.schema.json");
const PARENT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.32.json");

const EXPECTED_FILE_BYTES = 109358;
const EXPECTED_FILE_SHA256 = "6b2c1571c8dccf5aeced3518435dfe4bf0bff4c605f9a9255524299d72dda081";
const EXPECTED_CONTENT_SHA256 = "1b4632ea19ea00b27422408bf96d4dabe39e7e23330d6511fe4b6ccdafa6752f";
const EXPECTED_PARENT = Object.freeze({
  path: "data/research-iteration-manifest-2.32.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.32.0",
  bytes: 98357,
  fileSha256: "eaacd5bb0acae3c704e24ac2c1ffa4ef508bc5491155898bec6f28a825ea5e77",
  contentSha256: "4b0ed4508655553736b656f7a72a6d2e869218e0a4eff886811c7f0f15e113a2",
});
const EXPECTED_ADDED_IDS = Object.freeze([
  "micronsSourceNativeClippingContract",
  "micronsSourceNativeClippingSchema",
  "micronsSourceNativeClippingRuntime",
  "micronsSourceNativeClippingValidator",
  "micronsSourceNativeClippingTest",
  "internalStructureReferencePanel",
  "sourceRecordDeltaRuntime",
  "sourceRecordDeltaInspector",
  "sourceRecordDeltaTest",
  "micronsImportProvenanceRuntime",
  "micronsImportProvenanceTest",
  "atlasTypeContracts",
]);

// Later iterations deliberately replace these live receipts. Historical 2.33
// remains immutable, so compare every other input while retaining these exact
// receipts only inside the locked manifest.
const SUPERSEDED_LIVE_INPUT_IDS = new Set([
  "researchSourceRegistry",
  "researchModelUpgradeRegistry",
  "rightsLedger",
  "packageLock",
  "researchExplorerAssetManifest",
  "researchExplorerSearchIndex",
  "researchVisualTargetResolver",
  "sourceLocalTopologyViewport",
  "morphologyViewerTopologyIntegration",
  "atlasFocusSynchronization",
  "atlasTypeContracts",
  "researchEvidenceFingerprintComponent",
  "internalStructureReferencePanel",
  "typeAtlasFingerprintIntegration",
  "researchExplorerFingerprintIntegration",
  "researchExplorerIndexRuntime",
]);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

function without(object, key) {
  const copy = structuredClone(object);
  delete copy[key];
  return copy;
}

async function checkImmutableInputFiles(manifest, errors) {
  const roots = Object.fromEntries(Object.entries(manifest.inputRoots ?? {}).map(([scope, value]) => [
    scope,
    path.resolve(PROJECT_ROOT, value.locator),
  ]));
  await Promise.all((manifest.authoritativeInputs ?? [])
    .filter((input) => !SUPERSEDED_LIVE_INPUT_IDS.has(input.id))
    .map(async (input) => {
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
        check(
          bytes.byteLength === input.bytes && sha256(bytes) === input.sha256,
          `${input.id} immutable on-disk receipt drifted`,
          errors,
        );
      } catch (error) {
        errors.push(`${input.id} cannot be read: ${error instanceof Error ? error.message : error}`);
      }
    }));
}

export async function validateResearchIterationManifest233Snapshot(override = null) {
  const [manifestBytes, schema, parentBytes] = await Promise.all([
    readFile(MANIFEST_PATH),
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    readFile(PARENT_PATH),
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

  if (override === null) {
    check(manifestBytes.byteLength === EXPECTED_FILE_BYTES, "immutable 2.33 manifest byte count drifted", errors);
    check(sha256(manifestBytes) === EXPECTED_FILE_SHA256, "immutable 2.33 manifest file SHA-256 drifted", errors);
  }
  check(manifest.manifestContentSha256 === EXPECTED_CONTENT_SHA256, "immutable 2.33 manifest content receipt drifted", errors);
  check(computeManifestContentSha256(manifest) === EXPECTED_CONTENT_SHA256, "immutable 2.33 canonical content hash is invalid", errors);
  check(
    manifest.manifestSchemaVersion === "2.33.0"
      && manifest.releaseId === "ohri-mouse-interneuron-research-iteration-2.33.0"
      && manifest.releaseDate === "2026-09-01"
      && manifest.releaseStatus === "localhost_research_iteration"
      && manifest.application?.name === "ohri-mouse-interneuron-atlas-prototype"
      && manifest.application?.version === "2.33.0-research.1",
    "immutable 2.33 release identity changed",
    errors,
  );
  check(same(manifest.parentIterationManifest, EXPECTED_PARENT), "immutable 2.33 parent receipt changed", errors);
  check(
    parentBytes.byteLength === EXPECTED_PARENT.bytes
      && sha256(parentBytes) === EXPECTED_PARENT.fileSha256
      && parent.manifestContentSha256 === EXPECTED_PARENT.contentSha256
      && computeManifestContentSha256(parent) === EXPECTED_PARENT.contentSha256,
    "immutable 2.32 parent file or content receipt drifted",
    errors,
  );

  check(manifest.integrity?.inputCount === 75 && manifest.authoritativeInputs?.length === 75, "immutable 2.33 input denominator changed", errors);
  check(new Set(manifest.authoritativeInputs?.map((input) => input.id)).size === 75, "immutable 2.33 input ids are not unique", errors);
  check(new Set(manifest.authoritativeInputs?.map((input) => input.path)).size === 75, "immutable 2.33 input paths are not unique", errors);
  check(
    same(
      manifest.authoritativeInputs?.map((input) => input.id),
      [...parent.authoritativeInputs.map((input) => input.id), ...EXPECTED_ADDED_IDS],
    ),
    "immutable 2.33 authoritative-input roster or order changed",
    errors,
  );
  parent.authoritativeInputs.forEach((parentInput, index) => {
    const input = manifest.authoritativeInputs?.[index];
    check(
      input?.id === parentInput.id
        && input?.scope === parentInput.scope
        && input?.path === parentInput.path
        && input?.purpose === parentInput.purpose,
      `${parentInput.id} inherited identity changed in immutable 2.33`,
      errors,
    );
  });
  await checkImmutableInputFiles(manifest, errors);

  check(same(without(manifest.exactReferences, "micronsClippingAndSourceRecordDeltaIntegrity"), parent.exactReferences), "an inherited 2.32 exact reference changed in immutable 2.33", errors);
  check(same(without(manifest.scientificBoundaries, "micronsClippingAndSourceRecordDeltaIntegrity"), parent.scientificBoundaries), "an inherited 2.32 scientific boundary changed in immutable 2.33", errors);
  const reference = manifest.exactReferences?.micronsClippingAndSourceRecordDeltaIntegrity;
  const clipping = reference?.micronsSourceNativeClipping;
  const delta = reference?.sourceRecordDelta;
  check(reference?.contractId === "ohri-microns-clipping-source-record-delta-integrity-2.33", "immutable 2.33 exact-reference identity changed", errors);
  check(
    clipping?.sourceCellRootId === "648518346349516051"
      && clipping?.sourceLinkedNucleusId === "4309"
      && clipping?.nativeFrame === "MICrONS_Phase1_aligned_EM_native"
      && clipping?.regionRelationshipToProject === "cross_region_not_spinal_cord"
      && clipping?.sourceBufferMutation === false,
    "immutable 2.33 clipping identity or source boundary changed",
    errors,
  );
  for (const field of ["nucleusClippingPlaneCount", "capPrimitiveCount", "generatedGeometryCount", "geometryMutationCount", "joinCount", "registrationCount"]) {
    check(clipping?.[field] === 0, `immutable 2.33 clipping ${field} must remain zero`, errors);
  }
  check(
    delta?.uiWhitelistedRowCount === 24
      && delta?.demonstrationWhitelistedRowCount === 8
      && delta?.demonstrationSharedRowCount === 5
      && delta?.demonstrationChangedRowCount === 3,
    "immutable 2.33 source-record delta denominator changed",
    errors,
  );
  for (const field of ["crossSourceSameCellIdentityCount", "crossSourceSameTypeIdentityCount", "admittedGeometryPrimitiveCount", "generatedBiologicalGeometryPrimitiveCount", "joinCount", "registrationCount"]) {
    check(delta?.[field] === 0, `immutable 2.33 source-record delta ${field} must remain zero`, errors);
  }
  check(reference?.projectCopyCount === 0 && reference?.packageCopyCount === 0, "immutable 2.33 project/package copy boundary changed", errors);
  check(
    manifest.registrySummary?.researchUpgradeCount === 151
      && manifest.registrySummary?.crossSourceIdentityCount === 0
      && manifest.registrySummary?.registrationCount === 0
      && manifest.registrySummary?.renderedInternalPrimitiveCount === 0,
    "immutable 2.33 registry denominator or zero boundary changed",
    errors,
  );
  check(manifest.registrations?.count === 0 && manifest.registrations?.records?.length === 0, "immutable 2.33 registration zero-claim changed", errors);

  if (errors.length > 0) {
    throw new Error(`Research iteration 2.33 immutable snapshot validation failed:\n- ${errors.join("\n- ")}`);
  }
  return {
    releaseId: manifest.releaseId,
    fileBytes: EXPECTED_FILE_BYTES,
    fileSha256: EXPECTED_FILE_SHA256,
    contentSha256: EXPECTED_CONTENT_SHA256,
    inputCount: 75,
    researchUpgradeCount: 151,
    clippingCellRootId: clipping.sourceCellRootId,
    clippingLinkedNucleusId: clipping.sourceLinkedNucleusId,
    sourceRecordDeltaUiWhitelistedRowCount: delta.uiWhitelistedRowCount,
    sourceRecordDeltaDemonstrationChangedRowCount: delta.demonstrationChangedRowCount,
    crossSourceSameCellIdentityCount: 0,
    generatedGeometryCount: 0,
    registrationCount: 0,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest233Snapshot()
    .then((result) => process.stdout.write(`Research iteration 2.33 immutable snapshot valid: ${JSON.stringify(result)}\n`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
