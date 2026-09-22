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
const MANIFEST_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.29.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/research-iteration-manifest-2.29.schema.json");
const PARENT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.28.json");

const EXPECTED_FILE_BYTES = 77136;
const EXPECTED_FILE_SHA256 = "8856ad6413fae98f5f6f9d13cbb0627c8b41b8a9dbaa04ebd9a232689edaeba5";
const EXPECTED_CONTENT_SHA256 = "069b1be3a37a8086f89ea4467503235ed0734afcbfd2974538bae528c4995982";
const EXPECTED_PARENT = Object.freeze({
  path: "data/research-iteration-manifest-2.28.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.28.0",
  bytes: 69092,
  fileSha256: "f599acbd6969ba082014b258c098e648014116dc736535265bc7d5c154110b8e",
  contentSha256: "af376ba79d00132582448ab7217ca03c2e4af18efc5f0ca9720acef231f9b173",
});
const EXPECTED_SUPPLEMENTARY_NEURON_IDS = Object.freeze([45674, 45718, 50394, 50408, 50424, 170035, 249676]);
const MUTABLE_LIVE_INPUT_IDS = new Set([
  "researchSourceRegistry",
  "researchModelUpgradeRegistry",
  "rightsLedger",
  "packageLock",
]);
const ZERO_COMPARISON_FIELDS = Object.freeze([
  "geometryCopyCount",
  "swcCopyCount",
  "paddingRecordCount",
  "commonScaleAdmissionCount",
  "commonOrientationAdmissionCount",
  "atlasPlacementCount",
  "atlasTransformCount",
  "completeAxonClaimCount",
  "sameSpecimenInternalStructureCount",
  "renderedInternalPrimitiveCount",
  "crossSourceIdentityCount",
  "registrationCount",
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
          errors.push(`${input.id} cannot be read: ${error instanceof Error ? error.message : error}`);
        }
      }),
  );
}

export async function validateResearchIterationManifest229Snapshot(manifestOverride = null) {
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
    check(manifestBytes.byteLength === EXPECTED_FILE_BYTES, "immutable 2.29 manifest byte count drifted", errors);
    check(sha256(manifestBytes) === EXPECTED_FILE_SHA256, "immutable 2.29 manifest file SHA-256 drifted", errors);
  }
  check(manifest.manifestContentSha256 === EXPECTED_CONTENT_SHA256, "immutable 2.29 manifest content receipt drifted", errors);
  check(
    computeManifestContentSha256(manifest) === EXPECTED_CONTENT_SHA256,
    "immutable 2.29 manifest canonical content hash is invalid",
    errors,
  );
  check(
    manifest.manifestSchemaVersion === "2.29.0" &&
      manifest.releaseId === "ohri-mouse-interneuron-research-iteration-2.29.0" &&
      manifest.releaseDate === "2026-08-31" &&
      manifest.releaseStatus === "localhost_research_iteration" &&
      manifest.application?.name === "ohri-mouse-interneuron-atlas-prototype" &&
      manifest.application?.version === "2.29.0-research.1",
    "immutable 2.29 release identity changed",
    errors,
  );

  check(
    manifest.integrity?.inputCount === 38 && manifest.authoritativeInputs?.length === 38,
    "immutable 2.29 input denominator changed",
    errors,
  );
  check(
    new Set(manifest.authoritativeInputs?.map((input) => input.id)).size === 38,
    "immutable 2.29 input ids are not unique",
    errors,
  );
  check(
    new Set(manifest.authoritativeInputs?.map((input) => input.path)).size === 38,
    "immutable 2.29 input paths are not unique",
    errors,
  );

  check(same(manifest.parentIterationManifest, EXPECTED_PARENT), "immutable 2.29 parent receipt drifted", errors);
  check(
    parentBytes.byteLength === EXPECTED_PARENT.bytes &&
      sha256(parentBytes) === EXPECTED_PARENT.fileSha256 &&
      parent.releaseId === EXPECTED_PARENT.releaseId &&
      parent.manifestContentSha256 === EXPECTED_PARENT.contentSha256 &&
      computeManifestContentSha256(parent) === EXPECTED_PARENT.contentSha256,
    "immutable 2.29 parent file or content drifted",
    errors,
  );

  const comparison = manifest.exactReferences?.supplementaryMorphologyComparisonAdapter;
  check(
    comparison?.sourceCensus?.immutable === true &&
      comparison?.sourceCensus?.recordCount === 142 &&
      comparison?.frozenCensusRecordCount === 142 &&
      comparison?.supplementaryRecordCount === 7 &&
      comparison?.viewableSourceObjectCount === 149 &&
      comparison?.combinedCensusClaim === false,
    "immutable 2.29 comparison must remain 142 census + 7 supplementary = 149 viewable, never a combined census",
    errors,
  );
  check(
    same(comparison?.supplementaryNeuronIds, EXPECTED_SUPPLEMENTARY_NEURON_IDS),
    "immutable 2.29 supplementary seven-neuron roster changed",
    errors,
  );
  check(
    comparison?.geometryReferenceCount === 7 &&
      ZERO_COMPARISON_FIELDS.every((field) => comparison?.[field] === 0),
    "immutable 2.29 copy, padding, frame, axon, internal, identity or registration zero-claim boundary changed",
    errors,
  );

  const representation = manifest.exactReferences?.evidenceAware3dRepresentation;
  check(
    representation?.nativeDatSemanticAdmissionCount === 0 &&
      representation?.sameCellElectrophysiologyJoinCount === 0 &&
      representation?.sameSpecimenInternalStructureCount === 0 &&
      representation?.renderedInternalPrimitiveCount === 0 &&
      representation?.crossSourceIdentityCount === 0 &&
      representation?.projectRegistrationCount === 0,
    "immutable 2.29 representation zero-claim boundary changed",
    errors,
  );

  const premotor = manifest.exactReferences?.premotorComparisonObservedMorphologyRoutePack;
  check(
    premotor?.censusExpansionCount === 0 &&
      premotor?.sourceCompleteAxonCount === 0 &&
      premotor?.nativeDatSemanticAdmissionCount === 0 &&
      premotor?.sameCellElectrophysiologyJoinCount === 0 &&
      premotor?.sameSpecimenInternalStructureCount === 0 &&
      premotor?.renderedInternalPrimitiveCount === 0 &&
      premotor?.exactCrossSourceIdentityCount === 0 &&
      premotor?.projectRegistrationCount === 0,
    "immutable 2.29 inherited premotor zero-claim boundary changed",
    errors,
  );

  const inputs = new Map(manifest.authoritativeInputs?.map((input) => [input.id, input]) ?? []);
  const registry = manifest.registrySummary;
  check(registry?.researchUpgradeCount === 136, "immutable 2.29 embedded upgrade denominator changed", errors);
  check(
    same(registry?.sourceRegistryReceipt, inputs.get("researchSourceRegistry")) &&
      same(registry?.upgradeRegistryReceipt, inputs.get("researchModelUpgradeRegistry")),
    "immutable 2.29 embedded registry receipts disagree with its authoritative inputs",
    errors,
  );
  check(
    registry?.crossSourceIdentityCount === 0 &&
      registry?.registrationCount === 0 &&
      registry?.renderedInternalPrimitiveCount === 0 &&
      manifest.registrations?.count === 0 &&
      manifest.registrations?.records?.length === 0,
    "immutable 2.29 registry, internal, identity or registration zero-claim boundary changed",
    errors,
  );

  if (manifestOverride === null) await checkImmutableInputFiles(manifest, errors);
  if (errors.length) {
    throw new Error(`Immutable research iteration 2.29 snapshot validation failed:\n- ${errors.join("\n- ")}`);
  }
  return {
    releaseId: manifest.releaseId,
    fileBytes: manifestBytes.byteLength,
    fileSha256: sha256(manifestBytes),
    contentSha256: manifest.manifestContentSha256,
    inputCount: manifest.integrity.inputCount,
    frozenCensusRecordCount: comparison.frozenCensusRecordCount,
    supplementaryRecordCount: comparison.supplementaryRecordCount,
    viewableSourceObjectCount: comparison.viewableSourceObjectCount,
    combinedCensusClaim: comparison.combinedCensusClaim,
    geometryCopyCount: comparison.geometryCopyCount,
    commonScaleAdmissionCount: comparison.commonScaleAdmissionCount,
    renderedInternalPrimitiveCount: registry.renderedInternalPrimitiveCount,
    crossSourceIdentityCount: registry.crossSourceIdentityCount,
    registrationCount: registry.registrationCount,
    researchUpgradeCount: registry.researchUpgradeCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest229Snapshot()
    .then((summary) =>
      process.stdout.write(
        `Immutable 2.29 snapshot valid: ${summary.fileBytes} bytes, ${summary.inputCount} historical inputs, ${summary.frozenCensusRecordCount} census + ${summary.supplementaryRecordCount} supplementary = ${summary.viewableSourceObjectCount} viewable objects, ${summary.researchUpgradeCount} upgrades and ${summary.registrationCount} registrations.\n`,
      ),
    )
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
