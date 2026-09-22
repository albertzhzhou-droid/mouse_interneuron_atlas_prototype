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
const MANIFEST_PATH = path.join(
  PROJECT_ROOT,
  "data/research-iteration-manifest-2.31.json",
);
const SCHEMA_PATH = path.join(
  PROJECT_ROOT,
  "schemas/research-iteration-manifest-2.31.schema.json",
);
const PARENT_PATH = path.join(
  PROJECT_ROOT,
  "data/research-iteration-manifest-2.30.json",
);

const EXPECTED_FILE_BYTES = 87120;
const EXPECTED_FILE_SHA256 =
  "49ef49fdaaf8e72976d01e7a6d3053d40735215c39bf890100ab464d7ac67996";
const EXPECTED_CONTENT_SHA256 =
  "c714ba7ac7f306987b0344899c20381eda6a568d57b222773746839c687a0fd4";
const EXPECTED_PARENT = Object.freeze({
  path: "data/research-iteration-manifest-2.30.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.30.0",
  bytes: 81964,
  fileSha256: "c8796b7732d2f36998976698f1991f5d70e95fae96b33c20301d4b21d80e5858",
  contentSha256: "c80407736016bf95e0b4dc9d937126e8955628cef4c2485384df835639c3538f",
});
const EXPECTED_ADDED_INPUTS = Object.freeze([
  Object.freeze({
    id: "researchExplorerAssetManifest",
    path: "public/data/research_explorer_index_v1/asset-manifest.json",
    bytes: 4290,
    sha256: "8753a0d579f0b3b0b47227d5d43bce230d5f1338f730a9204626ef77e33a8b33",
  }),
  Object.freeze({
    id: "researchExplorerSearchIndex",
    path: "public/data/research_explorer_index_v1/search-index.json",
    bytes: 5293046,
    sha256: "5954c2911a196fc14dc033142f3a028c3cc612f5dbce8514e2b8316f42510c54",
  }),
  Object.freeze({
    id: "researchVisualTargetResolver",
    path: "app/research-visual-target.js",
    bytes: 4588,
    sha256: "21d20d86a7c687098f8f909c8b4b9b7737267163a9e4e84aacf15b74b48930a3",
  }),
  Object.freeze({
    id: "morphologyRecordDisclosureComponent",
    path: "app/MorphologyRecordDisclosure.tsx",
    bytes: 4846,
    sha256: "87e0e8f1c041feb1ab77aa681e0428daa2c757ff7872c79ee576700540b5e789",
  }),
]);
const MUTABLE_LIVE_INPUT_IDS = new Set([
  "researchSourceRegistry",
  "researchModelUpgradeRegistry",
  "rightsLedger",
  "packageLock",
  // Iteration 2.35 extends the live Explorer index with the Crozat PKD2L1
  // source profile while this manifest retains the exact 2.31 receipts.
  "researchExplorerAssetManifest",
  "researchExplorerSearchIndex",
  // The 2.31 manifest keeps the exact historical receipt below; iteration 2.32
  // deliberately supersedes the shared live resolver and pins its new receipt.
  "researchVisualTargetResolver",
]);
const EXPECTED_FOCUS_KIND_COUNTS = Object.freeze({
  anatomy_label: 73,
  molecular_profile: 161,
  morphology_record: 149,
  sci_entity: 7,
  sci_population: 17,
  source_lane: 6,
});
const EXPECTED_MAIN_SCENE_NEURON_IDS = Object.freeze([
  45674,
  45718,
  50394,
  50408,
  50424,
  104003,
  108974,
  109005,
  109021,
  170035,
  242822,
  249676,
  260150,
]);
const ZERO_REFERENCE_FIELDS = Object.freeze([
  "gapInferenceAllowedCount",
  "invalidMissingnessCount",
  "fallbackGeometryCount",
  "substituteGeometryCount",
  "sameSpecimenInternalStructureCount",
  "renderedInternalPrimitiveCount",
  "crossSourceIdentityCount",
  "atlasTransformCount",
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

function without(object, key) {
  const copy = structuredClone(object);
  delete copy[key];
  return copy;
}

async function checkImmutableInputFiles(manifest, errors) {
  const roots = {
    project: path.resolve(
      PROJECT_ROOT,
      manifest.inputRoots?.project?.locator ?? ".",
    ),
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

export async function validateResearchIterationManifest231Snapshot(
  manifestOverride = null,
) {
  const [manifestBytes, schema, parentBytes] = await Promise.all([
    readFile(MANIFEST_PATH),
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    readFile(PARENT_PATH),
  ]);
  const manifest =
    manifestOverride ?? JSON.parse(manifestBytes.toString("utf8"));
  const parent = JSON.parse(parentBytes.toString("utf8"));
  const errors = [];

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validateSchema = ajv.compile(schema);
  if (!validateSchema(manifest)) {
    errors.push(
      ...(validateSchema.errors ?? []).map(
        (error) =>
          `schema ${error.instancePath || "/"}: ${error.message ?? "violation"}`,
      ),
    );
  }

  if (manifestOverride === null) {
    check(
      manifestBytes.byteLength === EXPECTED_FILE_BYTES,
      "immutable 2.31 manifest byte count drifted",
      errors,
    );
    check(
      sha256(manifestBytes) === EXPECTED_FILE_SHA256,
      "immutable 2.31 manifest file SHA-256 drifted",
      errors,
    );
  }
  check(
    manifest.manifestContentSha256 === EXPECTED_CONTENT_SHA256,
    "immutable 2.31 manifest content receipt drifted",
    errors,
  );
  check(
    computeManifestContentSha256(manifest) === EXPECTED_CONTENT_SHA256,
    "immutable 2.31 manifest canonical content hash is invalid",
    errors,
  );
  check(
    manifest.manifestSchemaVersion === "2.31.0" &&
      manifest.releaseId ===
        "ohri-mouse-interneuron-research-iteration-2.31.0" &&
      manifest.releaseDate === "2026-08-31" &&
      manifest.releaseStatus === "localhost_research_iteration" &&
      manifest.application?.name ===
        "ohri-mouse-interneuron-atlas-prototype" &&
      manifest.application?.version === "2.31.0-research.1",
    "immutable 2.31 release identity changed",
    errors,
  );

  check(
    manifest.integrity?.inputCount === 46 &&
      manifest.authoritativeInputs?.length === 46,
    "immutable 2.31 input denominator changed",
    errors,
  );
  check(
    new Set(manifest.authoritativeInputs?.map((input) => input.id)).size === 46,
    "immutable 2.31 input ids are not unique",
    errors,
  );
  check(
    new Set(manifest.authoritativeInputs?.map((input) => input.path)).size === 46,
    "immutable 2.31 input paths are not unique",
    errors,
  );
  check(
    same(
      manifest.authoritativeInputs?.map((input) => input.id),
      [
        ...parent.authoritativeInputs.map((input) => input.id),
        ...EXPECTED_ADDED_INPUTS.map((input) => input.id),
      ],
    ),
    "immutable 2.31 authoritative-input roster or order changed",
    errors,
  );
  parent.authoritativeInputs.forEach((parentInput, index) => {
    const input = manifest.authoritativeInputs?.[index];
    check(
      input?.id === parentInput.id &&
        input?.scope === parentInput.scope &&
        input?.path === parentInput.path &&
        input?.purpose === parentInput.purpose,
      `immutable 2.31 inherited input ${parentInput.id} changed identity`,
      errors,
    );
    if (!MUTABLE_LIVE_INPUT_IDS.has(parentInput.id)) {
      check(
        input?.bytes === parentInput.bytes &&
          input?.sha256 === parentInput.sha256,
        `immutable 2.31 inherited input ${parentInput.id} changed receipt`,
        errors,
      );
    }
  });

  const inputs = new Map(
    manifest.authoritativeInputs?.map((input) => [input.id, input]) ?? [],
  );
  for (const expected of EXPECTED_ADDED_INPUTS) {
    const input = inputs.get(expected.id);
    check(
      input?.scope === "project" &&
        input?.path === expected.path &&
        input?.bytes === expected.bytes &&
        input?.sha256 === expected.sha256,
      `immutable 2.31 ${expected.id} receipt drifted`,
      errors,
    );
  }

  check(
    same(manifest.parentIterationManifest, EXPECTED_PARENT),
    "immutable 2.31 parent receipt drifted",
    errors,
  );
  check(
    parentBytes.byteLength === EXPECTED_PARENT.bytes &&
      sha256(parentBytes) === EXPECTED_PARENT.fileSha256 &&
      parent.releaseId === EXPECTED_PARENT.releaseId &&
      parent.manifestContentSha256 === EXPECTED_PARENT.contentSha256 &&
      computeManifestContentSha256(parent) === EXPECTED_PARENT.contentSha256,
    "immutable 2.31 parent file or content drifted",
    errors,
  );

  check(
    same(
      without(manifest.exactReferences, "researchExplorerVisualIntegrity"),
      parent.exactReferences,
    ),
    "immutable 2.31 inherited exact references changed",
    errors,
  );
  check(
    same(
      without(
        manifest.scientificBoundaries,
        "researchExplorerVisualIntegrity",
      ),
      parent.scientificBoundaries,
    ),
    "immutable 2.31 inherited scientific boundaries changed",
    errors,
  );

  const reference = manifest.exactReferences?.researchExplorerVisualIntegrity;
  check(
    same(
      reference,
      schema.$defs?.researchExplorerVisualIntegrityReference?.const,
    ),
    "immutable 2.31 Research Explorer reference drifted",
    errors,
  );
  check(
    reference?.indexSchemaVersion === "1.8.0" &&
      reference?.assetSetId === "ohri:research-explorer-index:1.8.0" &&
      reference?.sourceFileCount === 16 &&
      reference?.recordCount === 413 &&
      same(reference?.byFocusKind, EXPECTED_FOCUS_KIND_COUNTS),
    "immutable 2.31 Research Explorer source or record denominator changed",
    errors,
  );
  check(
    reference?.frozenCensusRecordCount === 142 &&
      reference?.supplementaryRecordCount === 7 &&
      reference?.viewableMorphologyRecordCount === 149 &&
      reference?.combinedCensusClaim === false,
    "immutable 2.31 morphology must remain 142 census + 7 supplementary = 149 viewable, never a combined census",
    errors,
  );
  check(
    same(
      reference?.admittedMainSceneNeuronIds,
      EXPECTED_MAIN_SCENE_NEURON_IDS,
    ) &&
      reference?.admittedMainSceneExactTargetCount === 13 &&
      reference?.sourceSpecificViewerOnlyCount === 136 &&
      reference?.nonMorphologyClearCount === 264,
    "immutable 2.31 visual-target dispositions changed",
    errors,
  );
  check(
    reference?.gapCount === 3634 &&
      reference?.recordsWithGapCount === 413 &&
      reference?.requiredGapFields?.length === 9 &&
      reference?.missingnessReasonCodes?.length === 11 &&
      same(reference?.missingnessScopes, [
        "record_specific",
        "shared_dataset_limit",
        "shared_project_limit",
      ]),
    "immutable 2.31 controlled missingness denominator changed",
    errors,
  );
  check(
    ZERO_REFERENCE_FIELDS.every((field) => reference?.[field] === 0),
    "immutable 2.31 unsupported geometry, internal, identity, transform, registration or copy zero-claim changed",
    errors,
  );

  const registry = manifest.registrySummary;
  check(
    registry?.researchUpgradeCount === 144,
    "immutable 2.31 embedded upgrade denominator changed",
    errors,
  );
  check(
    same(registry?.sourceRegistryReceipt, inputs.get("researchSourceRegistry")) &&
      same(
        registry?.upgradeRegistryReceipt,
        inputs.get("researchModelUpgradeRegistry"),
      ),
    "immutable 2.31 embedded registry receipts disagree with its authoritative inputs",
    errors,
  );
  check(
    registry?.crossSourceIdentityCount === 0 &&
      registry?.registrationCount === 0 &&
      registry?.renderedInternalPrimitiveCount === 0 &&
      manifest.registrations?.count === 0 &&
      manifest.registrations?.records?.length === 0,
    "immutable 2.31 registry, internal, identity or registration zero-claim changed",
    errors,
  );

  const boundary =
    manifest.scientificBoundaries?.researchExplorerVisualIntegrity ?? "";
  check(
    /413 independently admitted source records/.test(boundary) &&
      /142 frozen census records plus seven supplementary/.test(boundary) &&
      /13 exact focus identities/.test(boundary) &&
      /136 exact morphology records/.test(boundary) &&
      /264 non-morphology focuses clear stale morphology/.test(boundary) &&
      /inferenceAllowed=false/.test(boundary) &&
      /project copies and package copies remain zero/.test(boundary),
    "immutable 2.31 Research Explorer scientific boundary is incomplete",
    errors,
  );

  if (manifestOverride === null) {
    await checkImmutableInputFiles(manifest, errors);
  }
  if (errors.length > 0) {
    throw new Error(
      `Immutable research iteration 2.31 snapshot validation failed:\n- ${errors.join("\n- ")}`,
    );
  }
  return {
    releaseId: manifest.releaseId,
    fileBytes: manifestBytes.byteLength,
    fileSha256: sha256(manifestBytes),
    contentSha256: manifest.manifestContentSha256,
    inputCount: manifest.integrity.inputCount,
    researchExplorerRecordCount: reference.recordCount,
    sourceFileCount: reference.sourceFileCount,
    frozenCensusRecordCount: reference.frozenCensusRecordCount,
    supplementaryRecordCount: reference.supplementaryRecordCount,
    viewableMorphologyRecordCount: reference.viewableMorphologyRecordCount,
    admittedMainSceneExactTargetCount:
      reference.admittedMainSceneExactTargetCount,
    sourceSpecificViewerOnlyCount: reference.sourceSpecificViewerOnlyCount,
    nonMorphologyClearCount: reference.nonMorphologyClearCount,
    gapCount: reference.gapCount,
    fallbackGeometryCount: reference.fallbackGeometryCount,
    substituteGeometryCount: reference.substituteGeometryCount,
    researchUpgradeCount: registry.researchUpgradeCount,
  };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  validateResearchIterationManifest231Snapshot()
    .then((summary) =>
      process.stdout.write(
        `Immutable 2.31 snapshot valid: ${summary.fileBytes} bytes, ${summary.inputCount} historical inputs, ${summary.researchExplorerRecordCount} indexed records, ${summary.frozenCensusRecordCount} census + ${summary.supplementaryRecordCount} supplementary = ${summary.viewableMorphologyRecordCount} viewable morphologies, ${summary.researchUpgradeCount} upgrades.\n`,
      ),
    )
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
