#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { buildResearchIterationManifest235 } from "../tools/build_research_iteration_manifest_2_35.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.35.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/research-iteration-manifest-2.35.schema.json");
const PARENT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.34.json");

const PARENT = Object.freeze({
  path: "data/research-iteration-manifest-2.34.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.34.0",
  bytes: 125197,
  fileSha256: "76ead4e29455c8e9250f294afa4e78b6a72bb76709115d15954564545bb43d1e",
  contentSha256: "266ee889a591368d30b655ee059659485e746df424f448a85a6819d28e3e920c",
});

const REPLACED_IDS = new Set([
  "researchSourceRegistry",
  "researchModelUpgradeRegistry",
  "rightsLedger",
  "packageLock",
  "researchExplorerAssetManifest",
  "researchExplorerSearchIndex",
  "researchVisualTargetResolver",
  "researchEvidenceFingerprintComponent",
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

const ADDED_IDS = Object.freeze([
  "crozatPkd2l1Builder",
  "crozatPkd2l1Contract",
  "crozatPkd2l1Schema",
  "crozatPkd2l1Validator",
  "crozatPkd2l1Test",
  "researchSourceRegistryValidator",
  "researchSourceRegistryTest",
  "researchExplorerBuilder",
  "researchExplorerValidator",
  "researchExplorerTest",
  "researchTimeline235",
]);

const ZERO_CROZAT_FIELDS = Object.freeze([
  "globalStableCellRosterCount",
  "rawElectrophysiologyTraceCount",
  "rawMicroscopyObjectCount",
  "admittedGeometryCount",
  "atlasTransformCount",
  "registrationCount",
  "sameCellCrossModalJoinCount",
  "linkToSeparatePkd2l1SbfSemStudyCount",
  "sameSpecimenInternalStructureCount",
  "projectCopyCount",
  "packageCopyCount",
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

export async function validateResearchIterationManifest235(override = null) {
  const [manifestBytes, schema, parentBytes, expected] = await Promise.all([
    readFile(MANIFEST_PATH),
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    readFile(PARENT_PATH),
    buildResearchIterationManifest235(),
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

  if (override === null) check(manifestBytes.equals(expected.bytes), "2.35 manifest differs from deterministic rebuild", errors);
  check(manifest.manifestContentSha256 === expected.manifest.manifestContentSha256, "2.35 manifest content receipt differs from deterministic rebuild", errors);
  check(computeManifestContentSha256(manifest) === manifest.manifestContentSha256, "2.35 manifest content SHA-256 drifted", errors);
  check(
    manifest.manifestSchemaVersion === "2.35.0"
      && manifest.releaseId === "ohri-mouse-interneuron-research-iteration-2.35.0"
      && manifest.releaseDate === "2026-09-01"
      && manifest.application?.version === "2.35.0-research.1",
    "2.35 release identity drifted",
    errors,
  );
  check(same(manifest.parentIterationManifest, PARENT), "immutable 2.34 parent receipt drifted", errors);
  check(
    parentBytes.byteLength === PARENT.bytes
      && sha256(parentBytes) === PARENT.fileSha256
      && parent.manifestContentSha256 === PARENT.contentSha256
      && computeManifestContentSha256(parent) === PARENT.contentSha256,
    "immutable 2.34 parent file or content drifted",
    errors,
  );

  check(manifest.integrity?.inputCount === 113 && manifest.authoritativeInputs?.length === 113, "2.35 authoritative-input denominator drifted", errors);
  check(new Set(manifest.authoritativeInputs?.map((input) => input.id)).size === 113, "2.35 authoritative input IDs are not unique", errors);
  check(new Set(manifest.authoritativeInputs?.map((input) => input.path)).size === 113, "2.35 authoritative input paths are not unique", errors);
  check(same(manifest.authoritativeInputs?.slice(0, 102).map((input) => input.id), parent.authoritativeInputs.map((input) => input.id)), "2.35 inherited authoritative-input order drifted", errors);
  check(same(manifest.authoritativeInputs?.slice(102).map((input) => input.id), ADDED_IDS), "2.35 added authoritative-input roster or order drifted", errors);
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

  check(same(without(manifest.exactReferences, "crozatPkd2l1FunctionalProfileIntegrity"), parent.exactReferences), "an inherited 2.34 exact reference changed", errors);
  check(same(without(manifest.scientificBoundaries, "crozatPkd2l1FunctionalProfileIntegrity"), parent.scientificBoundaries), "an inherited 2.34 scientific boundary changed", errors);
  const reference = manifest.exactReferences?.crozatPkd2l1FunctionalProfileIntegrity;
  check(same(reference, expected.manifest.exactReferences.crozatPkd2l1FunctionalProfileIntegrity), "2.35 Crozat exact reference drifted", errors);
  check(
    reference?.canonicalSourceCount === 25
      && reference?.canonicalRecordSetCount === 29
      && reference?.sourceProfileCount === 162
      && reference?.sourceNamespaceCount === 6
      && reference?.researchExplorerRecordCount === 414
      && reference?.researchExplorerMolecularProfileCount === 162
      && reference?.figshareFileCount === 92
      && reference?.figshareTotalBytes === 1848613
      && reference?.keyFileReceiptCount === 7
      && reference?.quarantinedConflictCount === 4
      && reference?.firingPatternCellCount === 65
      && reference?.tonicCount === 38
      && reference?.singleSpikeCount === 27
      && reference?.passiveArticleAnimalCount === 191
      && reference?.passiveArticleCellCount === 659
      && reference?.passiveDepositedRowCount === 654
      && reference?.rmpAnimalCount === 25
      && reference?.rmpObservationCount === 125
      && reference?.canonicalTransmitterProfileCount === 162
      && reference?.internalStructureGapProfileCount === 162,
    "2.35 Crozat or cross-index denominator drifted",
    errors,
  );
  check(
    same(reference?.quarantinedConflictIds, [
      "firing-inference-p-value",
      "firing-location-coverage",
      "passive-property-denominator",
      "thoracic-6-week-distance-denominator",
    ]),
    "2.35 Crozat quarantine identities drifted",
    errors,
  );
  for (const field of ZERO_CROZAT_FIELDS) check(reference?.[field] === 0, `2.35 Crozat ${field} must remain zero`, errors);
  for (const field of [
    "observedElectrophysiologyAxis",
    "sourceConflictQuarantineRequired",
    "staleGeometryClearedForMissingRecordGeometry",
    "specializedViewsExitOnNonMorphologyFocus",
    "exactFocusZeroGeometryReadout",
    "selectedGroupForcedVisible",
    "sourceWideEvidenceCollapseDisplayOnly",
    "expandedMissingnessFingerprintAxes",
  ]) check(reference?.[field] === true, `2.35 Crozat ${field} must remain true`, errors);
  check(
    manifest.registrySummary?.canonicalSourcePackageCount === 25
      && manifest.registrySummary?.canonicalRecordSetCount === 29
      && manifest.registrySummary?.sourceProfileCount === 162
      && manifest.registrySummary?.sourceNamespaceCount === 6
      && manifest.registrySummary?.researchExplorerRecordCount === 414
      && manifest.registrySummary?.researchUpgradeCount === 158
      && manifest.registrySummary?.crossSourceIdentityCount === 0
      && manifest.registrySummary?.registrationCount === 0
      && manifest.registrySummary?.renderedInternalPrimitiveCount === 0,
    "2.35 registry denominator or zero boundary drifted",
    errors,
  );
  check(manifest.registrations?.count === 0 && manifest.registrations?.records?.length === 0, "2.35 creates a registration", errors);
  const boundary = manifest.scientificBoundaries?.crozatPkd2l1FunctionalProfileIntegrity ?? "";
  check(/not tonic, single-spike/.test(boundary) && /Four source conflicts remain quarantined/.test(boundary) && /no stable global cell ID/.test(boundary) && /remain unavailable rather than borrowed/.test(boundary), "2.35 Crozat scientific boundary is incomplete", errors);

  if (errors.length > 0) throw new Error(`Research iteration 2.35 manifest validation failed:\n- ${errors.join("\n- ")}`);
  return {
    releaseId: manifest.releaseId,
    fileBytes: manifestBytes.byteLength,
    fileSha256: sha256(manifestBytes),
    manifestContentSha256: manifest.manifestContentSha256,
    inputCount: 113,
    researchUpgradeCount: 158,
    canonicalSourceCount: 25,
    canonicalRecordSetCount: 29,
    sourceProfileCount: 162,
    sourceNamespaceCount: 6,
    researchExplorerRecordCount: 414,
    quarantinedConflictCount: 4,
    admittedGeometryCount: 0,
    registrationCount: 0,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest235()
    .then((result) => process.stdout.write(`Research iteration manifest valid: ${JSON.stringify(result)}\n`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
