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
const MANIFEST_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.34.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/research-iteration-manifest-2.34.schema.json");
const PARENT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.33.json");

const EXPECTED_FILE_BYTES = 125197;
const EXPECTED_FILE_SHA256 = "76ead4e29455c8e9250f294afa4e78b6a72bb76709115d15954564545bb43d1e";
const EXPECTED_CONTENT_SHA256 = "266ee889a591368d30b655ee059659485e746df424f448a85a6819d28e3e920c";
const EXPECTED_PARENT = Object.freeze({
  path: "data/research-iteration-manifest-2.33.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.33.0",
  bytes: 109358,
  fileSha256: "6b2c1571c8dccf5aeced3518435dfe4bf0bff4c605f9a9255524299d72dda081",
  contentSha256: "1b4632ea19ea00b27422408bf96d4dabe39e7e23330d6511fe4b6ccdafa6752f",
});
const EXPECTED_ADDED_IDS = Object.freeze([
  "applicationPackage",
  "projectReadme",
  "researchUpgradeQueue",
  "researchTimeline234",
  "researchDataLab",
  "researchOverview",
  "neuromorphoUniversePanel",
  "atlasStylesheet",
  "morphologyMatrixStateRuntime",
  "neuromorphoUniverseBuilder",
  "neuromorphoUniverseContract",
  "neuromorphoUniverseRoster",
  "neuromorphoUniverseSchema",
  "neuromorphoUniverseValidator",
  "neuromorphoUniverseTest",
  "neuromorphoSwcRuntime",
  "neuromorphoSwcRuntimeTest",
  "researchVisualTargetTest",
  "morphologyMatrixStateTest",
  "renderedHtmlTest",
  "micronsObservedReferenceTest",
  "neuromorphoUniverseIndex",
  "neuromorphoUniverseAssetManifest",
  "neuromorphoUniverseQuarantine",
  "neuromorphoUniverseApiPage0",
  "neuromorphoUniverseApiPage1",
  "neuromorphoUniverseApiPage2",
]);

// Later iterations deliberately replace only these live receipts. The 2.34
// manifest itself remains byte-for-byte immutable and retains the historical
// receipts below.
const SUPERSEDED_LIVE_INPUT_IDS = new Set([
  // Iteration 2.42 hashes these evolving viewers in its current manifest.
  "sourceLocalTopologyViewport",
  "morphologyViewerTopologyIntegration",
  "neuromorphoUniversePanel",
  "researchSourceRegistry",
  "researchModelUpgradeRegistry",
  "rightsLedger",
  "packageLock",
  "researchExplorerAssetManifest",
  "researchExplorerSearchIndex",
  "researchVisualTargetResolver",
  "researchEvidenceFingerprintComponent",
  "internalStructureReferencePanel",
  "atlasFocusSynchronization",
  "typeAtlasFingerprintIntegration",
  "researchExplorerFingerprintIntegration",
  "researchExplorerIndexRuntime",
  "atlasTypeContracts",
  "applicationPackage",
  "projectReadme",
  "researchUpgradeQueue",
  "researchDataLab",
  "researchOverview",
  "atlasStylesheet",
  "researchVisualTargetTest",
  "renderedHtmlTest",
  "micronsObservedReferenceTest",
]);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function without(object, key) {
  const copy = structuredClone(object);
  delete copy[key];
  return copy;
}

function check(condition, message, errors) {
  if (!condition) errors.push(message);
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

export async function validateResearchIterationManifest234Snapshot(override = null) {
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
    check(manifestBytes.byteLength === EXPECTED_FILE_BYTES, "immutable 2.34 manifest byte count drifted", errors);
    check(sha256(manifestBytes) === EXPECTED_FILE_SHA256, "immutable 2.34 manifest file SHA-256 drifted", errors);
  }
  check(manifest.manifestContentSha256 === EXPECTED_CONTENT_SHA256, "immutable 2.34 manifest content receipt drifted", errors);
  check(computeManifestContentSha256(manifest) === EXPECTED_CONTENT_SHA256, "immutable 2.34 canonical content hash is invalid", errors);
  check(
    manifest.manifestSchemaVersion === "2.34.0"
      && manifest.releaseId === "ohri-mouse-interneuron-research-iteration-2.34.0"
      && manifest.releaseDate === "2026-09-01"
      && manifest.releaseStatus === "localhost_research_iteration"
      && manifest.application?.name === "ohri-mouse-interneuron-atlas-prototype"
      && manifest.application?.version === "2.34.0-research.1",
    "immutable 2.34 release identity changed",
    errors,
  );
  check(same(manifest.parentIterationManifest, EXPECTED_PARENT), "immutable 2.34 parent receipt changed", errors);
  check(
    parentBytes.byteLength === EXPECTED_PARENT.bytes
      && sha256(parentBytes) === EXPECTED_PARENT.fileSha256
      && parent.manifestContentSha256 === EXPECTED_PARENT.contentSha256
      && computeManifestContentSha256(parent) === EXPECTED_PARENT.contentSha256,
    "immutable 2.33 parent file or content receipt drifted",
    errors,
  );

  check(manifest.integrity?.inputCount === 102 && manifest.authoritativeInputs?.length === 102, "immutable 2.34 input denominator changed", errors);
  check(new Set(manifest.authoritativeInputs?.map((input) => input.id)).size === 102, "immutable 2.34 input ids are not unique", errors);
  check(new Set(manifest.authoritativeInputs?.map((input) => input.path)).size === 102, "immutable 2.34 input paths are not unique", errors);
  check(
    same(
      manifest.authoritativeInputs?.map((input) => input.id),
      [...parent.authoritativeInputs.map((input) => input.id), ...EXPECTED_ADDED_IDS],
    ),
    "immutable 2.34 authoritative-input roster or order changed",
    errors,
  );
  parent.authoritativeInputs.forEach((parentInput, index) => {
    const input = manifest.authoritativeInputs?.[index];
    check(
      input?.id === parentInput.id
        && input?.scope === parentInput.scope
        && input?.path === parentInput.path
        && input?.purpose === parentInput.purpose,
      `${parentInput.id} inherited identity changed in immutable 2.34`,
      errors,
    );
  });
  await checkImmutableInputFiles(manifest, errors);

  check(same(without(manifest.exactReferences, "neuromorphoNoAgeQueryUniverseIntegrity"), parent.exactReferences), "an inherited 2.33 exact reference changed in immutable 2.34", errors);
  check(same(without(manifest.scientificBoundaries, "neuromorphoNoAgeQueryUniverseIntegrity"), parent.scientificBoundaries), "an inherited 2.33 scientific boundary changed in immutable 2.34", errors);
  const reference = manifest.exactReferences?.neuromorphoNoAgeQueryUniverseIntegrity;
  check(reference?.contractId === "ohri-neuromorpho-no-age-query-universe-integrity-2.34", "immutable 2.34 exact-reference identity changed", errors);
  check(
    reference?.queryRecordCount === 1097
      && reference?.uniqueNeuronIdCount === 1097
      && reference?.admittedSourceObjectCount === 1097
      && reference?.existingGeometryReferenceCount === 149
      && reference?.deltaRawSwcCount === 948
      && reference?.sourceLabelled3DCount === 1058
      && reference?.sourceLabelled2DCount === 39
      && reference?.diameterAuthorizedCount === 955
      && reference?.diameterUnavailableCount === 142
      && reference?.axonDomainCount === 253
      && same(reference?.officialApiPageRecordCounts, [500, 500, 97]),
    "immutable 2.34 universe denominator or page distribution changed",
    errors,
  );
  for (const field of [
    "quarantinedSourceObjectCount",
    "geometryCopyCount",
    "completeAxonClaimCount",
    "registrationCount",
    "sameSpecimenInternalStructureCount",
    "duplicateRawSwcGroupCount",
    "duplicateCanonicalGeometryGroupCount",
    "atlasRegistrationCount",
    "crossSourceIdentityCount",
    "generatedGeometryCopyCount",
    "projectCopyCount",
    "packageCopyCount",
  ]) check(reference?.[field] === 0, `immutable 2.34 universe ${field} must remain zero`, errors);
  check(
    manifest.registrySummary?.researchUpgradeCount === 155
      && manifest.registrySummary?.canonicalSourcePackageCount === 24
      && manifest.registrySummary?.canonicalRecordSetCount === 28
      && manifest.registrySummary?.crossSourceIdentityCount === 0
      && manifest.registrySummary?.registrationCount === 0
      && manifest.registrySummary?.renderedInternalPrimitiveCount === 0,
    "immutable 2.34 registry denominator or zero boundary changed",
    errors,
  );
  check(manifest.registrations?.count === 0 && manifest.registrations?.records?.length === 0, "immutable 2.34 registration zero-claim changed", errors);

  if (errors.length > 0) {
    throw new Error(`Research iteration 2.34 immutable snapshot validation failed:\n- ${errors.join("\n- ")}`);
  }
  return {
    releaseId: manifest.releaseId,
    fileBytes: EXPECTED_FILE_BYTES,
    fileSha256: EXPECTED_FILE_SHA256,
    contentSha256: EXPECTED_CONTENT_SHA256,
    inputCount: 102,
    researchUpgradeCount: 155,
    canonicalSourcePackageCount: 24,
    canonicalRecordSetCount: 28,
    admittedSourceObjectCount: 1097,
    existingGeometryReferenceCount: 149,
    deltaRawSwcCount: 948,
    generatedGeometryCopyCount: 0,
    registrationCount: 0,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest234Snapshot()
    .then((result) => process.stdout.write(`Research iteration 2.34 immutable snapshot valid: ${JSON.stringify(result)}\n`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
