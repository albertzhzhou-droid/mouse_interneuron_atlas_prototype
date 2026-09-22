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
const MANIFEST_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.32.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/research-iteration-manifest-2.32.schema.json");
const PARENT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.31.json");

const EXPECTED_FILE_BYTES = 98357;
const EXPECTED_FILE_SHA256 = "eaacd5bb0acae3c704e24ac2c1ffa4ef508bc5491155898bec6f28a825ea5e77";
const EXPECTED_CONTENT_SHA256 = "4b0ed4508655553736b656f7a72a6d2e869218e0a4eff886811c7f0f15e113a2";
const EXPECTED_PARENT = Object.freeze({
  path: "data/research-iteration-manifest-2.31.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.31.0",
  bytes: 87120,
  fileSha256: "49ef49fdaaf8e72976d01e7a6d3053d40735215c39bf890100ab464d7ac67996",
  contentSha256: "c714ba7ac7f306987b0344899c20381eda6a568d57b222773746839c687a0fd4",
});
const EXPECTED_ADDED_IDS = Object.freeze([
  "morphologyTopologyDetailContract",
  "morphologyTopologyDetailRuntime",
  "morphologyTopologyDetailSchema",
  "morphologyTopologyDetailBuilder",
  "morphologyTopologyDetailValidator",
  "sourceLocalTopologyRenderer",
  "mainSceneTopologyIntegration",
  "sourceLocalTopologyViewport",
  "morphologyViewerTopologyIntegration",
  "morphologyCompareTopologyIntegration",
  "morphologyTopologyDetailPanel",
  "morphologyTopologyDetailRuntimeGuard",
  "researchEvidenceFingerprintComponent",
  "atlasFocusSynchronization",
  "typeAtlasFingerprintIntegration",
  "researchExplorerFingerprintIntegration",
  "researchExplorerIndexRuntime",
]);

// These live inputs are intentionally superseded by iterations 2.33–2.34. The
// historical receipt remains authoritative here; snapshot validation therefore
// does not compare them with the newer working-tree bytes.
const SUPERSEDED_LIVE_INPUT_IDS = new Set([
  "researchSourceRegistry",
  "researchModelUpgradeRegistry",
  "rightsLedger",
  "packageLock",
  "researchExplorerAssetManifest",
  "researchExplorerSearchIndex",
  "mainSceneTopologyIntegration",
  "researchVisualTargetResolver",
  "sourceLocalTopologyViewport",
  "morphologyViewerTopologyIntegration",
  "researchEvidenceFingerprintComponent",
  "atlasFocusSynchronization",
  "typeAtlasFingerprintIntegration",
  "researchExplorerFingerprintIntegration",
  "researchExplorerIndexRuntime",
]);

const TOPOLOGY_SUMMARY = Object.freeze({
  frozenCensusRecordCount: 142,
  supplementaryRecordCount: 7,
  viewableSourceObjectCount: 149,
  verifiedGeometryCount: 149,
  sourceType1RecordCount: 149,
  sourceType2RecordCount: 51,
  sourceType3RecordCount: 147,
  sourceType4RecordCount: 0,
  otherSourceTypeRecordCount: 2,
  landmarkReceiptCount: 149,
  totalNodeCount: 566511,
  totalSegmentCount: 566362,
  totalNeuriteSegmentCount: 565423,
  totalTerminalLandmarkCount: 6957,
  totalBifurcationLandmarkCount: 6223,
});

const ZERO_TOPOLOGY_FIELDS = Object.freeze([
  "somaContourClaimCount",
  "membraneClaimCount",
  "internalStructureModelCount",
  "boutonClaimCount",
  "synapseClaimCount",
  "crossSourceIdentityCount",
  "registrationCount",
  "generatedBiologicalPrimitiveCount",
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
  const roots = Object.fromEntries(
    Object.entries(manifest.inputRoots ?? {}).map(([scope, value]) => [
      scope,
      path.resolve(PROJECT_ROOT, value.locator),
    ]),
  );

  await Promise.all(
    (manifest.authoritativeInputs ?? [])
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
      }),
  );
}

export async function validateResearchIterationManifest232Snapshot(override = null) {
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
    check(manifestBytes.byteLength === EXPECTED_FILE_BYTES, "immutable 2.32 manifest byte count drifted", errors);
    check(sha256(manifestBytes) === EXPECTED_FILE_SHA256, "immutable 2.32 manifest file SHA-256 drifted", errors);
  }
  check(manifest.manifestContentSha256 === EXPECTED_CONTENT_SHA256, "immutable 2.32 manifest content receipt drifted", errors);
  check(computeManifestContentSha256(manifest) === EXPECTED_CONTENT_SHA256, "immutable 2.32 manifest canonical content hash is invalid", errors);
  check(
    manifest.manifestSchemaVersion === "2.32.0"
      && manifest.releaseId === "ohri-mouse-interneuron-research-iteration-2.32.0"
      && manifest.releaseDate === "2026-08-31"
      && manifest.releaseStatus === "localhost_research_iteration"
      && manifest.application?.name === "ohri-mouse-interneuron-atlas-prototype"
      && manifest.application?.version === "2.32.0-research.1",
    "immutable 2.32 release identity changed",
    errors,
  );
  check(same(manifest.parentIterationManifest, EXPECTED_PARENT), "immutable 2.32 parent receipt changed", errors);
  check(
    parentBytes.byteLength === EXPECTED_PARENT.bytes
      && sha256(parentBytes) === EXPECTED_PARENT.fileSha256
      && parent.manifestContentSha256 === EXPECTED_PARENT.contentSha256
      && computeManifestContentSha256(parent) === EXPECTED_PARENT.contentSha256,
    "immutable 2.31 parent file or content receipt drifted",
    errors,
  );

  check(manifest.integrity?.inputCount === 63 && manifest.authoritativeInputs?.length === 63, "immutable 2.32 input denominator changed", errors);
  check(new Set(manifest.authoritativeInputs?.map((input) => input.id)).size === 63, "immutable 2.32 input ids are not unique", errors);
  check(new Set(manifest.authoritativeInputs?.map((input) => input.path)).size === 63, "immutable 2.32 input paths are not unique", errors);
  check(
    same(
      manifest.authoritativeInputs?.map((input) => input.id),
      [...parent.authoritativeInputs.map((input) => input.id), ...EXPECTED_ADDED_IDS],
    ),
    "immutable 2.32 authoritative-input roster or order changed",
    errors,
  );
  parent.authoritativeInputs.forEach((parentInput, index) => {
    const input = manifest.authoritativeInputs?.[index];
    check(
      input?.id === parentInput.id
        && input?.scope === parentInput.scope
        && input?.path === parentInput.path
        && input?.purpose === parentInput.purpose,
      `${parentInput.id} inherited identity changed in immutable 2.32`,
      errors,
    );
  });
  await checkImmutableInputFiles(manifest, errors);

  check(same(without(manifest.exactReferences, "uiKnowledgeAndTopologyIntegrity"), parent.exactReferences), "an inherited 2.31 exact reference changed in immutable 2.32", errors);
  check(same(without(manifest.scientificBoundaries, "uiKnowledgeAndTopologyIntegrity"), parent.scientificBoundaries), "an inherited 2.31 scientific boundary changed in immutable 2.32", errors);
  const reference = manifest.exactReferences?.uiKnowledgeAndTopologyIntegrity;
  check(reference?.contractId === "ohri-ui-knowledge-topology-integrity-2.32", "immutable 2.32 exact-reference identity changed", errors);
  check(
    reference?.focusSynchronization?.nonSciActiveEntityCount === 0
      && reference?.focusSynchronization?.molecularMainSceneGeometryCount === 0
      && reference?.focusSynchronization?.fallbackGeometryCount === 0
      && reference?.focusSynchronization?.substituteGeometryCount === 0
      && reference?.focusSynchronization?.keyboardRovingTabStopCountWhenNonSci === 1,
    "immutable 2.32 focus-synchronization boundary changed",
    errors,
  );
  const fingerprint = reference?.molecularEvidenceFingerprint;
  check(
    fingerprint?.indexedMolecularProfileCount === 161
      && fingerprint?.exactDemonstrationRecords?.i1?.sampledNucleusCount === 1520
      && fingerprint?.exactDemonstrationRecords?.i2?.sampledNucleusCount === 780
      && fingerprint?.admittedCellGeometryPrimitiveCount === 0
      && fingerprint?.sharedLimitBlockCountPerFingerprint === 1
      && fingerprint?.rawMachineTokenPrimaryLabelCount === 0,
    "immutable 2.32 molecular evidence fingerprint changed",
    errors,
  );
  const topology = reference?.morphologyTopologyDetail;
  for (const [field, value] of Object.entries(TOPOLOGY_SUMMARY)) {
    check(topology?.[field] === value, `immutable 2.32 topology ${field} changed`, errors);
  }
  check(topology?.combinedCensusClaim === false && topology?.sourceTypeAbsenceMeansBiologicalZero === false, "immutable 2.32 topology census or missingness boundary changed", errors);
  for (const field of ZERO_TOPOLOGY_FIELDS) check(topology?.[field] === 0, `immutable 2.32 topology ${field} must remain zero`, errors);
  check(reference?.projectCopyCount === 0 && reference?.packageCopyCount === 0, "immutable 2.32 project/package copy count changed", errors);
  check(
    manifest.registrySummary?.canonicalSourcePackageCount === 24
      && manifest.registrySummary?.canonicalRecordSetCount === 28
      && manifest.registrySummary?.bundledExactRosterCount === 7
      && manifest.registrySummary?.researchUpgradeCount === 148
      && manifest.registrySummary?.crossSourceIdentityCount === 0
      && manifest.registrySummary?.registrationCount === 0
      && manifest.registrySummary?.renderedInternalPrimitiveCount === 0,
    "immutable 2.32 registry denominator or zero boundary changed",
    errors,
  );
  check(manifest.registrations?.count === 0 && manifest.registrations?.records?.length === 0, "immutable 2.32 registration zero-claim changed", errors);

  if (errors.length > 0) {
    throw new Error(`Research iteration 2.32 immutable snapshot validation failed:\n- ${errors.join("\n- ")}`);
  }
  return {
    releaseId: manifest.releaseId,
    fileBytes: EXPECTED_FILE_BYTES,
    fileSha256: EXPECTED_FILE_SHA256,
    contentSha256: EXPECTED_CONTENT_SHA256,
    inputCount: 63,
    researchUpgradeCount: 148,
    indexedMolecularProfileCount: 161,
    frozenCensusRecordCount: 142,
    supplementaryRecordCount: 7,
    morphologyTopologyRecordCount: 149,
    totalNodeCount: 566511,
    totalTerminalLandmarkCount: 6957,
    totalBifurcationLandmarkCount: 6223,
    nonSciActiveEntityCount: 0,
    admittedMolecularGeometryPrimitiveCount: 0,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest232Snapshot()
    .then((result) => process.stdout.write(`Research iteration 2.32 immutable snapshot valid: ${JSON.stringify(result)}\n`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
