#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { buildResearchIterationManifest234 } from "../tools/build_research_iteration_manifest_2_34.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.34.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/research-iteration-manifest-2.34.schema.json");
const PARENT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.33.json");

const PARENT = Object.freeze({
  path: "data/research-iteration-manifest-2.33.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.33.0",
  bytes: 109358,
  fileSha256: "6b2c1571c8dccf5aeced3518435dfe4bf0bff4c605f9a9255524299d72dda081",
  contentSha256: "1b4632ea19ea00b27422408bf96d4dabe39e7e23330d6511fe4b6ccdafa6752f",
});

const REPLACED_IDS = new Set([
  "researchModelUpgradeRegistry",
  "packageLock",
  "researchVisualTargetResolver",
  "sourceLocalTopologyViewport",
  "morphologyViewerTopologyIntegration",
  "atlasFocusSynchronization",
  "atlasTypeContracts",
  "researchExplorerFingerprintIntegration",
]);

const ADDED_IDS = Object.freeze([
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

export async function validateResearchIterationManifest234(override = null) {
  const [manifestBytes, schema, parentBytes, expected] = await Promise.all([
    readFile(MANIFEST_PATH),
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    readFile(PARENT_PATH),
    buildResearchIterationManifest234(),
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

  if (override === null) check(manifestBytes.equals(expected.bytes), "2.34 manifest differs from deterministic rebuild", errors);
  check(manifest.manifestContentSha256 === expected.manifest.manifestContentSha256, "2.34 manifest content receipt differs from deterministic rebuild", errors);
  check(computeManifestContentSha256(manifest) === manifest.manifestContentSha256, "2.34 manifest content SHA-256 drifted", errors);
  check(
    manifest.manifestSchemaVersion === "2.34.0"
      && manifest.releaseId === "ohri-mouse-interneuron-research-iteration-2.34.0"
      && manifest.releaseDate === "2026-09-01"
      && manifest.application?.version === "2.34.0-research.1",
    "2.34 release identity drifted",
    errors,
  );
  check(same(manifest.parentIterationManifest, PARENT), "immutable 2.33 parent receipt drifted", errors);
  check(
    parentBytes.byteLength === PARENT.bytes
      && sha256(parentBytes) === PARENT.fileSha256
      && parent.manifestContentSha256 === PARENT.contentSha256
      && computeManifestContentSha256(parent) === PARENT.contentSha256,
    "immutable 2.33 parent file or content drifted",
    errors,
  );

  check(manifest.integrity?.inputCount === 102 && manifest.authoritativeInputs?.length === 102, "2.34 authoritative-input denominator drifted", errors);
  check(new Set(manifest.authoritativeInputs?.map((input) => input.id)).size === 102, "2.34 authoritative input IDs are not unique", errors);
  check(new Set(manifest.authoritativeInputs?.map((input) => input.path)).size === 102, "2.34 authoritative input paths are not unique", errors);
  check(same(manifest.authoritativeInputs?.slice(0, 75).map((input) => input.id), parent.authoritativeInputs.map((input) => input.id)), "2.34 inherited authoritative-input order drifted", errors);
  check(same(manifest.authoritativeInputs?.slice(75).map((input) => input.id), ADDED_IDS), "2.34 added authoritative-input roster or order drifted", errors);
  parent.authoritativeInputs.forEach((parentInput, index) => {
    const current = manifest.authoritativeInputs?.[index];
    check(
      current?.id === parentInput.id
        && current?.scope === parentInput.scope
        && current?.path === parentInput.path
        && current?.purpose === parentInput.purpose,
      `${parentInput.id} inherited identity drifted`,
      errors,
    );
    if (!REPLACED_IDS.has(parentInput.id)) {
      check(current?.bytes === parentInput.bytes && current?.sha256 === parentInput.sha256, `${parentInput.id} immutable inherited receipt drifted`, errors);
    }
  });
  await checkInputFiles(manifest, errors);

  check(same(without(manifest.exactReferences, "neuromorphoNoAgeQueryUniverseIntegrity"), parent.exactReferences), "an inherited 2.33 exact reference changed", errors);
  check(same(without(manifest.scientificBoundaries, "neuromorphoNoAgeQueryUniverseIntegrity"), parent.scientificBoundaries), "an inherited 2.33 scientific boundary changed", errors);
  const reference = manifest.exactReferences?.neuromorphoNoAgeQueryUniverseIntegrity;
  check(same(reference, expected.manifest.exactReferences.neuromorphoNoAgeQueryUniverseIntegrity), "2.34 universe exact reference drifted", errors);
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
    "2.34 universe denominator or pagination receipt drifted",
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
  ]) check(reference?.[field] === 0, `2.34 universe ${field} must remain zero`, errors);
  for (const field of [
    "adultAndNoDiameterSameCountButIndependentSets",
    "oldGeometryClearedBeforeLoad",
    "unknownFocusFailsClosed",
    "sourceZPreservedWithoutInferredExtrusion",
    "sourceDiameterGateRetained",
  ]) check(reference?.[field] === true, `2.34 universe ${field} must remain true`, errors);
  check(
    manifest.registrySummary?.researchUpgradeCount === 155
      && manifest.registrySummary?.crossSourceIdentityCount === 0
      && manifest.registrySummary?.registrationCount === 0
      && manifest.registrySummary?.renderedInternalPrimitiveCount === 0,
    "2.34 registry denominator or zero boundary drifted",
    errors,
  );
  check(manifest.registrations?.count === 0 && manifest.registrations?.records?.length === 0, "2.34 creates a registration", errors);
  const boundary = manifest.scientificBoundaries?.neuromorphoNoAgeQueryUniverseIntegrity ?? "";
  check(/not 1,097 biological types/.test(boundary) && /142 no-diameter records/.test(boundary) && /without inferred or extruded depth/.test(boundary) && /remain unavailable rather than synthesized/.test(boundary), "2.34 scientific boundary is incomplete", errors);

  if (errors.length > 0) throw new Error(`Research iteration 2.34 manifest validation failed:\n- ${errors.join("\n- ")}`);
  return {
    releaseId: manifest.releaseId,
    fileBytes: manifestBytes.byteLength,
    fileSha256: sha256(manifestBytes),
    manifestContentSha256: manifest.manifestContentSha256,
    inputCount: 102,
    researchUpgradeCount: 155,
    admittedSourceObjectCount: 1097,
    existingGeometryReferenceCount: 149,
    deltaRawSwcCount: 948,
    sourceLabelled2DCount: 39,
    generatedGeometryCopyCount: 0,
    registrationCount: 0,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest234()
    .then((result) => process.stdout.write(`Research iteration manifest valid: ${JSON.stringify(result)}\n`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
