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
const MANIFEST_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.30.json");
const SCHEMA_PATH = path.join(
  PROJECT_ROOT,
  "schemas/research-iteration-manifest-2.30.schema.json",
);
const PARENT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.29.json");

const EXPECTED_FILE_BYTES = 81964;
const EXPECTED_FILE_SHA256 =
  "c8796b7732d2f36998976698f1991f5d70e95fae96b33c20301d4b21d80e5858";
const EXPECTED_CONTENT_SHA256 =
  "c80407736016bf95e0b4dc9d937126e8955628cef4c2485384df835639c3538f";
const EXPECTED_PARENT = Object.freeze({
  path: "data/research-iteration-manifest-2.29.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.29.0",
  bytes: 77136,
  fileSha256: "8856ad6413fae98f5f6f9d13cbb0627c8b41b8a9dbaa04ebd9a232689edaeba5",
  contentSha256: "069b1be3a37a8086f89ea4467503235ed0734afcbfd2974538bae528c4995982",
});
const EXPECTED_SUPPLEMENTARY_NEURON_IDS = Object.freeze([
  45674,
  45718,
  50394,
  50408,
  50424,
  170035,
  249676,
]);
const EXPECTED_SOURCE_FRAME_INPUTS = Object.freeze([
  Object.freeze({
    id: "morphologySourceFrameDisclosure",
    path: "data/morphology-source-frame-disclosure-0.1.json",
    bytes: 469544,
    sha256: "e76abace7e59995f4b1849ce87a7e10e0d066a80844959589d5f06fcba0c5230",
  }),
  Object.freeze({
    id: "morphologySourceFrameDisclosureSchema",
    path: "schemas/morphology-source-frame-disclosure-0.1.schema.json",
    bytes: 14554,
    sha256: "382bc051000d96d7142b5176598dad969f36568579e70f563e83606ac6ca8e4b",
  }),
  Object.freeze({
    id: "morphologySourceFrameDisclosureBuilder",
    path: "tools/build_morphology_source_frame_disclosure.mjs",
    bytes: 20391,
    sha256: "dae31dc3d47d203b3374c1cc902c09950e705147386e44a8fe96af8175c72633",
  }),
  Object.freeze({
    id: "morphologyViewportScaleAlgorithm",
    path: "app/morphology-viewport-scale.js",
    bytes: 3658,
    sha256: "f51a96dd5fe21d36ca7455245145b002a232116115e5af992d0f6465542f1aac",
  }),
]);
const MUTABLE_LIVE_INPUT_IDS = new Set([
  "researchSourceRegistry",
  "researchModelUpgradeRegistry",
  "rightsLedger",
  "packageLock",
]);
const ZERO_SOURCE_FRAME_FIELDS = Object.freeze([
  "commonScaleAdmissionCount",
  "sharedCoordinateFrameAdmissionCount",
  "inferredMissingCoordinateCount",
  "repairedCutNeuriteCount",
  "restoredInVivoDimensionCount",
  "completeBiologicalAxonClaimCount",
  "sameSpecimenInternalStructureCount",
  "renderedInternalPrimitiveCount",
  "crossSourceIdentityCount",
  "registrationCount",
  "projectCopyCount",
  "packageCopyCount",
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

async function checkImmutableInputFiles(manifest, errors) {
  const roots = {
    project: path.resolve(PROJECT_ROOT, manifest.inputRoots?.project?.locator ?? "."),
    scientificAuthority: path.resolve(
      PROJECT_ROOT,
      manifest.inputRoots?.scientificAuthority?.locator ?? "../interneuron_sci_review",
    ),
  };
  await Promise.all(
    (manifest.authoritativeInputs ?? [])
      .filter((input) => !MUTABLE_LIVE_INPUT_IDS.has(input.id))
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
          errors.push(
            `${input.id} cannot be read: ${error instanceof Error ? error.message : error}`,
          );
        }
      }),
  );
}

export async function validateResearchIterationManifest230Snapshot(manifestOverride = null) {
  const [manifestBytes, schema, parentBytes] = await Promise.all([
    readFile(MANIFEST_PATH),
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    readFile(PARENT_PATH),
  ]);
  const manifest = manifestOverride ?? JSON.parse(manifestBytes.toString("utf8"));
  const parent = JSON.parse(parentBytes.toString("utf8"));
  const errors = [];

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validateSchema = ajv.compile(schema);
  if (!validateSchema(manifest)) {
    errors.push(
      ...(validateSchema.errors ?? []).map(
        (error) => `schema ${error.instancePath || "/"}: ${error.message ?? "violation"}`,
      ),
    );
  }

  if (manifestOverride === null) {
    check(
      manifestBytes.byteLength === EXPECTED_FILE_BYTES,
      "immutable 2.30 manifest byte count drifted",
      errors,
    );
    check(
      sha256(manifestBytes) === EXPECTED_FILE_SHA256,
      "immutable 2.30 manifest file SHA-256 drifted",
      errors,
    );
  }
  check(
    manifest.manifestContentSha256 === EXPECTED_CONTENT_SHA256,
    "immutable 2.30 manifest content receipt drifted",
    errors,
  );
  check(
    computeManifestContentSha256(manifest) === EXPECTED_CONTENT_SHA256,
    "immutable 2.30 manifest canonical content hash is invalid",
    errors,
  );
  check(
    manifest.manifestSchemaVersion === "2.30.0" &&
      manifest.releaseId === "ohri-mouse-interneuron-research-iteration-2.30.0" &&
      manifest.releaseDate === "2026-08-31" &&
      manifest.releaseStatus === "localhost_research_iteration" &&
      manifest.application?.name === "ohri-mouse-interneuron-atlas-prototype" &&
      manifest.application?.version === "2.30.0-research.1",
    "immutable 2.30 release identity changed",
    errors,
  );

  check(
    manifest.integrity?.inputCount === 42 && manifest.authoritativeInputs?.length === 42,
    "immutable 2.30 input denominator changed",
    errors,
  );
  check(
    new Set(manifest.authoritativeInputs?.map((input) => input.id)).size === 42,
    "immutable 2.30 input ids are not unique",
    errors,
  );
  check(
    new Set(manifest.authoritativeInputs?.map((input) => input.path)).size === 42,
    "immutable 2.30 input paths are not unique",
    errors,
  );

  check(same(manifest.parentIterationManifest, EXPECTED_PARENT), "immutable 2.30 parent receipt drifted", errors);
  check(
    parentBytes.byteLength === EXPECTED_PARENT.bytes &&
      sha256(parentBytes) === EXPECTED_PARENT.fileSha256 &&
      parent.releaseId === EXPECTED_PARENT.releaseId &&
      parent.manifestContentSha256 === EXPECTED_PARENT.contentSha256 &&
      computeManifestContentSha256(parent) === EXPECTED_PARENT.contentSha256,
    "immutable 2.30 parent file or content drifted",
    errors,
  );

  const inputs = new Map(manifest.authoritativeInputs?.map((input) => [input.id, input]) ?? []);
  for (const expected of EXPECTED_SOURCE_FRAME_INPUTS) {
    const input = inputs.get(expected.id);
    check(
      input?.scope === "project" &&
        input?.path === expected.path &&
        input?.bytes === expected.bytes &&
        input?.sha256 === expected.sha256,
      `immutable 2.30 ${expected.id} receipt drifted`,
      errors,
    );
  }

  const comparison = manifest.exactReferences?.supplementaryMorphologyComparisonAdapter;
  check(
    comparison?.sourceCensus?.immutable === true &&
      comparison?.sourceCensus?.recordCount === 142 &&
      comparison?.frozenCensusRecordCount === 142 &&
      comparison?.supplementaryRecordCount === 7 &&
      comparison?.viewableSourceObjectCount === 149 &&
      comparison?.combinedCensusClaim === false,
    "immutable 2.30 comparison must remain 142 census + 7 supplementary = 149 viewable, never a combined census",
    errors,
  );
  check(
    same(comparison?.supplementaryNeuronIds, EXPECTED_SUPPLEMENTARY_NEURON_IDS),
    "immutable 2.30 supplementary seven-neuron roster changed",
    errors,
  );

  const sourceFrame = manifest.exactReferences?.sourceFrameDisclosure;
  check(
    sourceFrame?.frozenCensusRecordCount === 142 &&
      sourceFrame?.supplementaryRecordCount === 7 &&
      sourceFrame?.viewableSourceObjectCount === 149 &&
      sourceFrame?.geometry3DCount === 147 &&
      sourceFrame?.geometry2DCount === 2 &&
      sourceFrame?.scaleEligibleRecordCount === 149,
    "immutable 2.30 source-frame or dimensional denominator changed",
    errors,
  );
  check(
    sourceFrame?.displayScalePolicy?.sourceLocalOnly === true &&
      sourceFrame?.displayScalePolicy?.sharedAcrossViewports === false &&
      sourceFrame?.displayScalePolicy?.apparentObjectSizeComparable === false &&
      sourceFrame?.displayScalePolicy?.restoresInVivoDimensions === false &&
      sourceFrame?.displayScalePolicy?.infersMissingCoordinates === false &&
      sourceFrame?.displayScalePolicy?.establishesAtlasRegistration === false,
    "immutable 2.30 source-local scale policy changed",
    errors,
  );
  check(
    ZERO_SOURCE_FRAME_FIELDS.every((field) => sourceFrame?.[field] === 0),
    "immutable 2.30 common-scale, reconstruction, internal, identity, registration or copy zero-claim boundary changed",
    errors,
  );

  const representation = manifest.exactReferences?.evidenceAware3dRepresentation;
  check(
    representation?.sameSpecimenInternalStructureCount === 0 &&
      representation?.renderedInternalPrimitiveCount === 0 &&
      representation?.crossSourceIdentityCount === 0 &&
      representation?.projectRegistrationCount === 0,
    "immutable 2.30 inherited representation zero-claim boundary changed",
    errors,
  );

  const registry = manifest.registrySummary;
  check(
    registry?.researchUpgradeCount === 140,
    "immutable 2.30 embedded upgrade denominator changed",
    errors,
  );
  check(
    same(registry?.sourceRegistryReceipt, inputs.get("researchSourceRegistry")) &&
      same(registry?.upgradeRegistryReceipt, inputs.get("researchModelUpgradeRegistry")),
    "immutable 2.30 embedded registry receipts disagree with its authoritative inputs",
    errors,
  );
  check(
    registry?.crossSourceIdentityCount === 0 &&
      registry?.registrationCount === 0 &&
      registry?.renderedInternalPrimitiveCount === 0 &&
      manifest.registrations?.count === 0 &&
      manifest.registrations?.records?.length === 0,
    "immutable 2.30 registry, internal, identity or registration zero-claim boundary changed",
    errors,
  );

  if (manifestOverride === null) await checkImmutableInputFiles(manifest, errors);
  if (errors.length) {
    throw new Error(`Immutable research iteration 2.30 snapshot validation failed:\n- ${errors.join("\n- ")}`);
  }
  return {
    releaseId: manifest.releaseId,
    fileBytes: manifestBytes.byteLength,
    fileSha256: sha256(manifestBytes),
    contentSha256: manifest.manifestContentSha256,
    inputCount: manifest.integrity.inputCount,
    frozenCensusRecordCount: sourceFrame.frozenCensusRecordCount,
    supplementaryRecordCount: sourceFrame.supplementaryRecordCount,
    viewableSourceObjectCount: sourceFrame.viewableSourceObjectCount,
    geometry3DCount: sourceFrame.geometry3DCount,
    geometry2DCount: sourceFrame.geometry2DCount,
    commonScaleAdmissionCount: sourceFrame.commonScaleAdmissionCount,
    inferredMissingCoordinateCount: sourceFrame.inferredMissingCoordinateCount,
    repairedCutNeuriteCount: sourceFrame.repairedCutNeuriteCount,
    restoredInVivoDimensionCount: sourceFrame.restoredInVivoDimensionCount,
    renderedInternalPrimitiveCount: registry.renderedInternalPrimitiveCount,
    crossSourceIdentityCount: registry.crossSourceIdentityCount,
    registrationCount: registry.registrationCount,
    researchUpgradeCount: registry.researchUpgradeCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest230Snapshot()
    .then((summary) =>
      process.stdout.write(
        `Immutable 2.30 snapshot valid: ${summary.fileBytes} bytes, ${summary.inputCount} historical inputs, ${summary.frozenCensusRecordCount} census + ${summary.supplementaryRecordCount} supplementary = ${summary.viewableSourceObjectCount} viewable objects (${summary.geometry3DCount} 3D + ${summary.geometry2DCount} 2D), ${summary.researchUpgradeCount} upgrades and ${summary.registrationCount} registrations.\n`,
      ),
    )
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
