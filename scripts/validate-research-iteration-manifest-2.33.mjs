#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { buildResearchIterationManifest233 } from "../tools/build_research_iteration_manifest_2_33.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.33.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/research-iteration-manifest-2.33.schema.json");
const PARENT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.32.json");

const FILE_BYTES = 109358;
const FILE_SHA256 = "6b2c1571c8dccf5aeced3518435dfe4bf0bff4c605f9a9255524299d72dda081";
const CONTENT_SHA256 = "1b4632ea19ea00b27422408bf96d4dabe39e7e23330d6511fe4b6ccdafa6752f";
const PARENT = Object.freeze({
  path: "data/research-iteration-manifest-2.32.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.32.0",
  bytes: 98357,
  fileSha256: "eaacd5bb0acae3c704e24ac2c1ffa4ef508bc5491155898bec6f28a825ea5e77",
  contentSha256: "4b0ed4508655553736b656f7a72a6d2e869218e0a4eff886811c7f0f15e113a2",
});
const SUPERSEDED_IDS = new Set([
  "researchModelUpgradeRegistry",
  "packageLock",
  "mainSceneTopologyIntegration",
  "atlasFocusSynchronization",
  "typeAtlasFingerprintIntegration",
]);
const ADDED_IDS = Object.freeze([
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

export async function validateResearchIterationManifest233(override = null) {
  const [manifestBytes, schema, parentBytes, expected] = await Promise.all([
    readFile(MANIFEST_PATH),
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    readFile(PARENT_PATH),
    buildResearchIterationManifest233(),
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

  if (override === null) {
    check(manifestBytes.byteLength === FILE_BYTES && sha256(manifestBytes) === FILE_SHA256, "2.33 manifest file receipt drifted", errors);
    check(manifestBytes.equals(expected.bytes), "2.33 manifest differs from deterministic rebuild", errors);
  }
  check(manifest.manifestContentSha256 === CONTENT_SHA256 && computeManifestContentSha256(manifest) === CONTENT_SHA256, "2.33 manifest content SHA-256 drifted", errors);
  check(
    manifest.manifestSchemaVersion === "2.33.0"
      && manifest.releaseId === "ohri-mouse-interneuron-research-iteration-2.33.0"
      && manifest.releaseDate === "2026-09-01"
      && manifest.application?.version === "2.33.0-research.1",
    "2.33 release identity drifted",
    errors,
  );
  check(same(manifest.parentIterationManifest, PARENT), "immutable 2.32 parent receipt drifted", errors);
  check(
    parentBytes.byteLength === PARENT.bytes
      && sha256(parentBytes) === PARENT.fileSha256
      && parent.manifestContentSha256 === PARENT.contentSha256
      && computeManifestContentSha256(parent) === PARENT.contentSha256,
    "immutable 2.32 parent file or content drifted",
    errors,
  );

  check(manifest.integrity?.inputCount === 75 && manifest.authoritativeInputs?.length === 75, "2.33 authoritative-input denominator drifted", errors);
  check(new Set(manifest.authoritativeInputs?.map((input) => input.id)).size === 75 && new Set(manifest.authoritativeInputs?.map((input) => input.path)).size === 75, "2.33 authoritative inputs are not unique", errors);
  check(same(manifest.authoritativeInputs?.slice(0, 63).map((input) => input.id), parent.authoritativeInputs.map((input) => input.id)), "2.33 inherited authoritative-input order drifted", errors);
  check(same(manifest.authoritativeInputs?.slice(63).map((input) => input.id), ADDED_IDS), "2.33 added authoritative-input roster or order drifted", errors);
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
    if (!SUPERSEDED_IDS.has(parentInput.id)) {
      check(current?.bytes === parentInput.bytes && current?.sha256 === parentInput.sha256, `${parentInput.id} immutable inherited receipt drifted`, errors);
    }
  });
  await checkInputFiles(manifest, errors);

  check(same(without(manifest.exactReferences, "micronsClippingAndSourceRecordDeltaIntegrity"), parent.exactReferences), "an inherited 2.32 exact reference changed", errors);
  check(same(without(manifest.scientificBoundaries, "micronsClippingAndSourceRecordDeltaIntegrity"), parent.scientificBoundaries), "an inherited 2.32 scientific boundary changed", errors);
  const reference = manifest.exactReferences?.micronsClippingAndSourceRecordDeltaIntegrity;
  check(same(reference, expected.manifest.exactReferences.micronsClippingAndSourceRecordDeltaIntegrity), "2.33 clipping/delta exact reference drifted", errors);
  const clipping = reference?.micronsSourceNativeClipping;
  check(
    clipping?.sourceCellRootId === "648518346349516051"
      && clipping?.sourceLinkedNucleusId === "4309"
      && clipping?.nativeFrame === "MICrONS_Phase1_aligned_EM_native"
      && clipping?.regionRelationshipToProject === "cross_region_not_spinal_cord"
      && clipping?.axisCount === 3
      && same(clipping?.defaultState, { enabled: false, axis: "z", positionNanometre: 80240, keepSide: "positive" }),
    "MICrONS clipping identity, frame or default state drifted",
    errors,
  );
  for (const field of ["nucleusClippingPlaneCount", "capPrimitiveCount", "repairCount", "resamplingCount", "generatedGeometryCount", "geometryMutationCount", "joinCount", "registrationCount"]) {
    check(clipping?.[field] === 0, `MICrONS clipping ${field} must remain zero`, errors);
  }
  check(clipping?.sourceBufferMutation === false && clipping?.measurementClaim === false && clipping?.membraneClaim === false && clipping?.spinalInternalStructureClaim === false, "MICrONS clipping crossed a mutation or claim boundary", errors);
  const delta = reference?.sourceRecordDelta;
  check(
    delta?.uiWhitelistedRowCount === 24
      && delta?.uiWhitelistedRowIds?.length === 24
      && delta?.demonstrationWhitelistedRowCount === 8
      && delta?.demonstrationSharedRowCount === 5
      && delta?.demonstrationChangedRowCount === 3
      && delta?.unlistedFieldCountInspected === 0
      && same(delta?.changedRowIds, ["sampling-count", "markers", "region-membership"]),
    "source-record delta denominator or changed-row roster drifted",
    errors,
  );
  for (const field of ["crossSourceSameCellIdentityCount", "crossSourceSameTypeIdentityCount", "admittedGeometryPrimitiveCount", "generatedBiologicalGeometryPrimitiveCount", "joinCount", "registrationCount"]) {
    check(delta?.[field] === 0, `source-record delta ${field} must remain zero`, errors);
  }
  check(reference?.projectCopyCount === 0 && reference?.packageCopyCount === 0, "2.33 created a project or package copy", errors);
  check(
    manifest.registrySummary?.researchUpgradeCount === expected.manifest.registrySummary.researchUpgradeCount
      && manifest.registrySummary?.researchUpgradeCount > 148
      && manifest.registrySummary?.crossSourceIdentityCount === 0
      && manifest.registrySummary?.registrationCount === 0
      && manifest.registrySummary?.renderedInternalPrimitiveCount === 0,
    "2.33 registry denominator or zero boundary drifted",
    errors,
  );
  check(manifest.registrations?.count === 0 && manifest.registrations?.records?.length === 0, "2.33 creates a registration", errors);
  const boundary = manifest.scientificBoundaries?.micronsClippingAndSourceRecordDeltaIntegrity ?? "";
  check(/unchanged source-native visual-cortex frame/.test(boundary) && /never clips the linked nucleus/.test(boundary) && /strict string equality/.test(boundary) && /neither same-cell nor same-type identity/.test(boundary) && /Project and package copies remain zero/.test(boundary), "2.33 scientific boundary is incomplete", errors);

  if (errors.length > 0) throw new Error(`Research iteration 2.33 manifest validation failed:\n- ${errors.join("\n- ")}`);
  return {
    releaseId: manifest.releaseId,
    fileBytes: FILE_BYTES,
    fileSha256: FILE_SHA256,
    manifestContentSha256: manifest.manifestContentSha256,
    inputCount: 75,
    researchUpgradeCount: manifest.registrySummary.researchUpgradeCount,
    clippingCellRootId: clipping.sourceCellRootId,
    clippingLinkedNucleusId: clipping.sourceLinkedNucleusId,
    clippingAxisCount: clipping.axisCount,
    sourceRecordDeltaUiWhitelistedRowCount: delta.uiWhitelistedRowCount,
    sourceRecordDeltaDemonstrationWhitelistedRowCount: delta.demonstrationWhitelistedRowCount,
    sourceRecordDeltaDemonstrationSharedRowCount: delta.demonstrationSharedRowCount,
    sourceRecordDeltaDemonstrationChangedRowCount: delta.demonstrationChangedRowCount,
    crossSourceSameCellIdentityCount: 0,
    generatedGeometryCount: 0,
    registrationCount: 0,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest233()
    .then((result) => process.stdout.write(`Research iteration manifest valid: ${JSON.stringify(result)}\n`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
