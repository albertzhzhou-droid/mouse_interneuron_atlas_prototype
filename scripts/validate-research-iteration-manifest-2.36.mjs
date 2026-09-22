#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { buildResearchIterationManifest236 } from "../tools/build_research_iteration_manifest_2_36.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.36.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/research-iteration-manifest-2.36.schema.json");
const PARENT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.35.json");

const PARENT = Object.freeze({
  path: "data/research-iteration-manifest-2.35.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.35.0",
  bytes: 134630,
  fileSha256: "71f90cfc2c6ad2c6f74146d1992493fc77229c131764faff83657dcada797dc1",
  contentSha256: "0691b27bd2cd46e0d96d9a8862ff8478819572f7cfde225d20b9d9c93aeff828",
});

const REPLACED_IDS = new Set([
  "researchSourceRegistry",
  "researchModelUpgradeRegistry",
  "rightsLedger",
  "packageLock",
  "researchExplorerAssetManifest",
  "researchExplorerSearchIndex",
  "researchEvidenceFingerprintComponent",
  "atlasFocusSynchronization",
  "typeAtlasFingerprintIntegration",
  "researchExplorerFingerprintIntegration",
  "researchExplorerIndexRuntime",
  "internalStructureReferencePanel",
  "atlasTypeContracts",
  "applicationPackage",
  "projectReadme",
  "researchUpgradeQueue",
  "researchDataLab",
  "researchOverview",
  "atlasStylesheet",
  "renderedHtmlTest",
  "micronsObservedReferenceTest",
  "researchSourceRegistryValidator",
  "researchSourceRegistryTest",
  "researchExplorerBuilder",
  "researchExplorerValidator",
  "researchExplorerTest",
]);

const ADDED_IDS = Object.freeze([
  "dmrt3Di6Builder",
  "dmrt3Di6Contract",
  "dmrt3Di6Schema",
  "dmrt3Di6Validator",
  "dmrt3Di6Test",
  "knowledgeCoverageContract",
  "knowledgeCoverageSchema",
  "knowledgeCoverageValidator",
  "knowledgeCoverageTest",
  "manifestHashRuntime",
  "researchIteration235SnapshotValidator",
  "researchIteration235SnapshotTest",
  "currentResearchTestRunner",
  "researchTimeline236",
]);

const ZERO_FIELDS = Object.freeze([
  "animalResolvedReplicateCount",
  "perWellMGroupRosterCount",
  "admittedGeometryCount",
  "admittedInternalStructureCount",
  "registrationCount",
  "sameCellCrossModalJoinCount",
  "sameRecordInternalPrimitiveCount",
  "projectCopyCount",
  "packageCopyCount",
  "completeContentFolderCopyCount",
]);

const TRUE_FIELDS = Object.freeze([
  "groupSummaryOnly",
  "perWellMGroupRosterUnavailable",
  "methodsNotebookConflictQuarantined",
  "sciSyntheticAnchorExactFocusGate",
  "nonSciFocusHidesSciSyntheticAnchors",
  "exactCurrentRecordZeroInternalPrimitiveReadout",
  "recordSwitchUpdatesEvidenceFingerprint",
  "sameRecordInternalSceneRemainsEmptyWithoutObject",
  "missingAxisDisclosureConsolidated",
  "allMissingAxesRetainedInDisclosure",
  "recordSpecificResultSnippets",
  "immutableParentSnapshotValidationSeparatedFromLiveInputs",
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

export async function validateResearchIterationManifest236(override = null) {
  const [manifestBytes, schema, parentBytes, expected] = await Promise.all([
    readFile(MANIFEST_PATH),
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    readFile(PARENT_PATH),
    buildResearchIterationManifest236(),
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

  if (override === null) check(manifestBytes.equals(expected.bytes), "2.36 manifest differs from deterministic rebuild", errors);
  check(manifest.manifestContentSha256 === expected.manifest.manifestContentSha256, "2.36 manifest content receipt differs from deterministic rebuild", errors);
  check(computeManifestContentSha256(manifest) === manifest.manifestContentSha256, "2.36 manifest content SHA-256 drifted", errors);
  check(
    manifest.manifestSchemaVersion === "2.36.0"
      && manifest.releaseId === "ohri-mouse-interneuron-research-iteration-2.36.0"
      && manifest.releaseDate === "2026-09-02"
      && manifest.application?.version === "2.36.0-research.1",
    "2.36 release identity drifted",
    errors,
  );
  check(same(manifest.parentIterationManifest, PARENT), "immutable 2.35 parent receipt drifted", errors);
  check(
    parentBytes.byteLength === PARENT.bytes
      && sha256(parentBytes) === PARENT.fileSha256
      && parent.manifestContentSha256 === PARENT.contentSha256
      && computeManifestContentSha256(parent) === PARENT.contentSha256,
    "immutable 2.35 parent file or content drifted",
    errors,
  );

  check(manifest.integrity?.inputCount === 127 && manifest.authoritativeInputs?.length === 127, "2.36 authoritative-input denominator drifted", errors);
  check(new Set(manifest.authoritativeInputs?.map((input) => input.id)).size === 127, "2.36 authoritative input IDs are not unique", errors);
  check(new Set(manifest.authoritativeInputs?.map((input) => input.path)).size === 127, "2.36 authoritative input paths are not unique", errors);
  check(same(manifest.authoritativeInputs?.slice(0, 113).map((input) => input.id), parent.authoritativeInputs.map((input) => input.id)), "2.36 inherited authoritative-input order drifted", errors);
  check(same(manifest.authoritativeInputs?.slice(113).map((input) => input.id), ADDED_IDS), "2.36 added authoritative-input roster or order drifted", errors);
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

  check(same(without(manifest.exactReferences, "dmrt3Di6AndRecordUiIntegrity"), parent.exactReferences), "an inherited 2.35 exact reference changed", errors);
  check(same(without(manifest.scientificBoundaries, "dmrt3Di6AndRecordUiIntegrity"), parent.scientificBoundaries), "an inherited 2.35 scientific boundary changed", errors);
  const reference = manifest.exactReferences?.dmrt3Di6AndRecordUiIntegrity;
  check(same(reference, expected.manifest.exactReferences.dmrt3Di6AndRecordUiIntegrity), "2.36 Dmrt3/UI exact reference drifted", errors);
  check(
    reference?.canonicalSourceCount === 26
      && reference?.canonicalRecordSetCount === 30
      && reference?.sourceProfileCount === 168
      && reference?.sourceNamespaceCount === 7
      && reference?.researchExplorerRecordCount === 421
      && reference?.researchExplorerMolecularProfileCount === 168
      && reference?.researchExplorerSourceLaneCount === 7
      && reference?.knowledgeCoverageLaneCount === 7
      && reference?.knowledgeCoverageAxisCount === 7
      && reference?.knowledgeCoverageJudgmentCount === 49
      && reference?.displayedGroupCount === 6
      && reference?.retainedGroupCountSum === 274
      && reference?.sourceEmbryoCount === 3
      && reference?.poolCount === 1
      && reference?.tubeCount === 1
      && reference?.independentLibraryCount === 1
      && reference?.depositedMouseWellCount === 384
      && reference?.qcRetainedCellCount === 354
      && reference?.di6LineageRetainedCellCount === 274
      && reference?.quarantinedConflictCount === 1
      && reference?.researchUpgradeCount === 162
      && reference?.lastResearchUpgradeId === "UPG-180",
    "2.36 Dmrt3, Explorer, source or upgrade denominator drifted",
    errors,
  );
  check(same(reference?.groupLabels, ["M1", "M2", "M3", "M4", "M5", "M6"]), "2.36 Dmrt3 group labels drifted", errors);
  check(same(reference?.groupCountVector, [84, 34, 33, 45, 54, 24]), "2.36 Dmrt3 group counts drifted", errors);
  check(same(reference?.quarantinedConflictIds, ["methods-vs-executed-notebook-qc-hvg"]), "2.36 Dmrt3 quarantine identity drifted", errors);
  for (const field of ZERO_FIELDS) check(reference?.[field] === 0, `2.36 ${field} must remain zero`, errors);
  for (const field of TRUE_FIELDS) check(reference?.[field] === true, `2.36 ${field} must remain true`, errors);

  check(
    manifest.registrySummary?.canonicalSourcePackageCount === 26
      && manifest.registrySummary?.canonicalRecordSetCount === 30
      && manifest.registrySummary?.sourceProfileCount === 168
      && manifest.registrySummary?.sourceNamespaceCount === 7
      && manifest.registrySummary?.researchExplorerRecordCount === 421
      && manifest.registrySummary?.researchUpgradeCount === 162
      && manifest.registrySummary?.crossSourceIdentityCount === 0
      && manifest.registrySummary?.registrationCount === 0
      && manifest.registrySummary?.renderedInternalPrimitiveCount === 0,
    "2.36 registry denominator or zero boundary drifted",
    errors,
  );
  check(manifest.registrations?.count === 0 && manifest.registrations?.records?.length === 0, "2.36 creates a registration", errors);
  const boundary = manifest.scientificBoundaries?.dmrt3Di6AndRecordUiIntegrity ?? "";
  check(
    /three embryos were pooled into one tube and one library/i.test(boundary)
      && /does not export a per-well M-group roster/i.test(boundary)
      && /Methods and pinned executed-notebook QC\/HVG workflows remain visibly quarantined/i.test(boundary)
      && /SCI synthetic anchors are hidden unless the exact selected focus is an SCI entity/i.test(boundary)
      && /No morphology, internal structure, atlas transform, registration, same-cell cross-modal join, project copy, package copy or complete-content folder copy is added/i.test(boundary),
    "2.36 scientific or copy boundary is incomplete",
    errors,
  );

  if (errors.length > 0) throw new Error(`Research iteration 2.36 manifest validation failed:\n- ${errors.join("\n- ")}`);
  return {
    releaseId: manifest.releaseId,
    fileBytes: manifestBytes.byteLength,
    fileSha256: sha256(manifestBytes),
    manifestContentSha256: manifest.manifestContentSha256,
    inputCount: 127,
    researchUpgradeCount: 162,
    canonicalSourceCount: 26,
    canonicalRecordSetCount: 30,
    sourceProfileCount: 168,
    sourceNamespaceCount: 7,
    researchExplorerRecordCount: 421,
    researchExplorerSourceLaneCount: 7,
    dmrt3GroupCount: 6,
    quarantinedConflictCount: 1,
    admittedGeometryCount: 0,
    registrationCount: 0,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest236()
    .then((result) => process.stdout.write(`Research iteration manifest valid: ${JSON.stringify(result)}\n`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
