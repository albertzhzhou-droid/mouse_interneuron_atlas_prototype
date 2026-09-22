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
const MANIFEST_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.28.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/research-iteration-manifest-2.28.schema.json");
const PARENT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.27.json");
const ASSET_ROOT = path.join(PROJECT_ROOT, "public/data/premotor_comparison_observed_morphology_route_pack_v1");

const EXPECTED_FILE_BYTES = 69092;
const EXPECTED_FILE_SHA256 = "f599acbd6969ba082014b258c098e648014116dc736535265bc7d5c154110b8e";
const EXPECTED_CONTENT_SHA256 = "af376ba79d00132582448ab7217ca03c2e4af18efc5f0ca9720acef231f9b173";
const MUTABLE_LIVE_INPUT_IDS = new Set(["researchSourceRegistry", "researchModelUpgradeRegistry", "rightsLedger", "packageLock"]);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function checkImmutableInputFiles(manifest, errors) {
  const roots = {
    project: path.resolve(PROJECT_ROOT, manifest.inputRoots?.project?.locator ?? "."),
    scientificAuthority: path.resolve(PROJECT_ROOT, manifest.inputRoots?.scientificAuthority?.locator ?? "../interneuron_sci_review"),
  };
  await Promise.all((manifest.authoritativeInputs ?? [])
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
        check(bytes.byteLength === input.bytes && sha256(bytes) === input.sha256, `${input.id} immutable on-disk receipt drifted`, errors);
      } catch (error) {
        errors.push(`${input.id} cannot be read: ${error instanceof Error ? error.message : error}`);
      }
    }));
}

async function checkRouteAssets(manifest, errors) {
  const files = manifest.exactReferences?.premotorComparisonObservedMorphologyRoutePack?.assetManifestReceipt?.files ?? [];
  await Promise.all(files.map(async (file) => {
    const resolved = path.resolve(ASSET_ROOT, file.path);
    const relative = path.relative(ASSET_ROOT, resolved);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      errors.push(`2.28 route asset ${file.path} escapes its asset root`);
      return;
    }
    try {
      const bytes = await readFile(resolved);
      check(bytes.byteLength === file.bytes && sha256(bytes) === file.sha256, `2.28 route asset ${file.path} drifted`, errors);
    } catch (error) {
      errors.push(`2.28 route asset ${file.path} cannot be read: ${error instanceof Error ? error.message : error}`);
    }
  }));
}

export async function validateResearchIterationManifest228Snapshot(manifestOverride = null) {
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
    errors.push(...(validateSchema.errors ?? []).map((error) => `schema ${error.instancePath || "/"}: ${error.message ?? "violation"}`));
  }

  if (manifestOverride === null) {
    check(manifestBytes.byteLength === EXPECTED_FILE_BYTES, "immutable 2.28 manifest byte count drifted", errors);
    check(sha256(manifestBytes) === EXPECTED_FILE_SHA256, "immutable 2.28 manifest file SHA-256 drifted", errors);
  }
  check(manifest.manifestContentSha256 === EXPECTED_CONTENT_SHA256, "immutable 2.28 manifest content receipt drifted", errors);
  check(computeManifestContentSha256(manifest) === EXPECTED_CONTENT_SHA256, "immutable 2.28 manifest canonical content hash is invalid", errors);
  check(
    manifest.manifestSchemaVersion === "2.28.0" &&
    manifest.releaseId === "ohri-mouse-interneuron-research-iteration-2.28.0" &&
    manifest.application?.version === "2.28.0-research.1",
    "immutable 2.28 release identity changed",
    errors,
  );
  check(manifest.integrity?.inputCount === 34 && manifest.authoritativeInputs?.length === 34, "immutable 2.28 input denominator changed", errors);
  check(new Set(manifest.authoritativeInputs?.map((input) => input.id)).size === 34, "immutable 2.28 input ids are not unique", errors);
  check(new Set(manifest.authoritativeInputs?.map((input) => input.path)).size === 34, "immutable 2.28 input paths are not unique", errors);

  const parentReceipt = manifest.parentIterationManifest;
  check(
    parentReceipt?.path === "data/research-iteration-manifest-2.27.json" &&
    parentReceipt?.bytes === parentBytes.byteLength &&
    parentReceipt?.fileSha256 === sha256(parentBytes) &&
    parentReceipt?.contentSha256 === parent.manifestContentSha256 &&
    computeManifestContentSha256(parent) === parent.manifestContentSha256,
    "immutable 2.28 parent receipt drifted",
    errors,
  );

  const pack = manifest.exactReferences?.premotorComparisonObservedMorphologyRoutePack;
  check(pack?.frozenCensusRecordCount === 142 && pack?.activeUniqueMorphologyCount === 13, "2.28 morphology denominators changed", errors);
  check(pack?.namedRouteCount === 10 && pack?.namedDorsalHornRouteCount === 8 && pack?.namedVentralHornRouteCount === 2, "2.28 route denominators changed", errors);
  check(same(pack?.neuronIds, [45718]) && same(pack?.supplementaryNeuronIds, [45718]), "2.28 NMO 45718 route identity changed", errors);
  check(
    pack?.sourceCompleteAxonCount === 0 &&
    pack?.nativeDatSemanticAdmissionCount === 0 &&
    pack?.sameCellElectrophysiologyJoinCount === 0 &&
    pack?.renderedInternalPrimitiveCount === 0 &&
    pack?.exactCrossSourceIdentityCount === 0 &&
    pack?.projectRegistrationCount === 0,
    "2.28 zero-claim boundary changed",
    errors,
  );
  const representation = manifest.exactReferences?.evidenceAware3dRepresentation;
  check(representation?.representationStateCount === 9 && representation?.routeCount === 16, "2.28 representation denominator changed", errors);
  check(manifest.registrySummary?.researchUpgradeCount === 131, "2.28 embedded upgrade denominator changed", errors);
  check(manifest.registrations?.count === 0 && manifest.registrations?.records?.length === 0, "2.28 registration boundary changed", errors);

  if (manifestOverride === null) {
    await checkImmutableInputFiles(manifest, errors);
    await checkRouteAssets(manifest, errors);
  }
  if (errors.length) throw new Error(`Immutable research iteration 2.28 snapshot validation failed:\n- ${errors.join("\n- ")}`);
  return {
    releaseId: manifest.releaseId,
    fileBytes: manifestBytes.byteLength,
    fileSha256: sha256(manifestBytes),
    contentSha256: manifest.manifestContentSha256,
    inputCount: manifest.integrity.inputCount,
    frozenCensusRecordCount: pack.frozenCensusRecordCount,
    activeUniqueMorphologyCount: pack.activeUniqueMorphologyCount,
    namedRouteCount: pack.namedRouteCount,
    representationRouteCount: representation.routeCount,
    researchUpgradeCount: manifest.registrySummary.researchUpgradeCount,
    registrationCount: manifest.registrations.count,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest228Snapshot()
    .then((summary) => process.stdout.write(`Immutable 2.28 snapshot valid: ${summary.fileBytes} bytes, ${summary.inputCount} historical inputs, ${summary.frozenCensusRecordCount} census records, ${summary.namedRouteCount} routes and ${summary.registrationCount} registrations.\n`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}

