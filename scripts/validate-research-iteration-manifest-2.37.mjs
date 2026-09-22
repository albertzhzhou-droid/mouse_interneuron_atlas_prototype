#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import {
  RESEARCH_ITERATION_237_PARENT,
  buildResearchIterationManifest237,
} from "../tools/build_research_iteration_manifest_2_37.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.37.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/research-iteration-manifest-2.37.schema.json");
const PARENT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.36.json");

const ADDED_IDS = Object.freeze([
  "roomeWorkbookParser",
  "roomeTaxonomyBuilder",
  "roomeTaxonomyContract",
  "roomeDifferentialFeaturesContract",
  "roomeTaxonomySchema",
  "roomeDifferentialFeaturesSchema",
  "roomeTaxonomyValidator",
  "roomeTaxonomyTest",
  "researchFocusWorkspaceState",
  "researchFocusEvidencePanel",
  "researchFocusWorkspaceTest",
  "researchIteration236SnapshotValidator",
  "researchIteration236SnapshotTest",
  "researchTimeline237",
  "researchUpgradeRegistryBuilder",
  "researchUpgradeRegistryValidator",
  "researchUpgradeRegistryTest",
  "applicationLayout",
  "observedMorphologyRuntimeContractTest",
]);

const ZERO_FIELDS = Object.freeze([
  "multiRecordNamespacePreviewCollisionCount",
  "admittedGeometryCount",
  "admittedInternalStructureCount",
  "registrationCount",
  "sameCellCrossModalJoinCount",
  "projectCopyCount",
  "packageCopyCount",
  "completeContentFolderCopyCount",
]);

const TRUE_FIELDS = Object.freeze([
  "exactTypeRosterAdmitted",
  "allDifferentialRowsRetained",
  "apparentDateGeneCellsQuarantined",
  "differentialFeaturesAreNotCanonicalMarkers",
  "biologicalAndTechnicalReplicatesSeparated",
  "atomicFocusWorkspaceRouting",
  "recordSpecificPreviewCollisionGate",
  "sharedMissingnessConsolidated",
  "verifiedExplorerIndexMemoized",
  "molecularFocusClearsPriorGeometry",
  "unsupportedGeometryFailsClosed",
  "immutableParentSnapshotValidationSeparatedFromLiveInputs",
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

export async function validateResearchIterationManifest237(override = null) {
  const [manifestBytes, schema, parentBytes, expected] = await Promise.all([
    readFile(MANIFEST_PATH),
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    readFile(PARENT_PATH),
    buildResearchIterationManifest237(),
  ]);
  const manifest = override ?? JSON.parse(manifestBytes.toString("utf8"));
  const errors = [];

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validateSchema = ajv.compile(schema);
  if (!validateSchema(manifest)) {
    errors.push(...(validateSchema.errors ?? []).map(
      (error) => `schema ${error.instancePath || "/"}: ${error.message ?? "violation"}`,
    ));
  }

  if (override === null) check(manifestBytes.equals(expected.bytes), "2.37 manifest differs from deterministic rebuild", errors);
  check(manifest.manifestContentSha256 === expected.manifest.manifestContentSha256, "2.37 manifest content receipt differs from deterministic rebuild", errors);
  check(computeManifestContentSha256(manifest) === manifest.manifestContentSha256, "2.37 manifest content SHA-256 drifted", errors);
  check(
    manifest.manifestSchemaVersion === "2.37.0"
      && manifest.releaseId === "ohri-mouse-interneuron-research-iteration-2.37.0"
      && manifest.releaseDate === "2026-09-02"
      && manifest.application?.version === "2.37.0-research.1",
    "2.37 release identity drifted",
    errors,
  );
  check(same(manifest.parentIterationManifest, RESEARCH_ITERATION_237_PARENT), "immutable 2.36 parent receipt drifted", errors);
  check(
    parentBytes.byteLength === RESEARCH_ITERATION_237_PARENT.bytes
      && sha256(parentBytes) === RESEARCH_ITERATION_237_PARENT.fileSha256
      && JSON.parse(parentBytes.toString("utf8")).manifestContentSha256 === RESEARCH_ITERATION_237_PARENT.contentSha256,
    "immutable 2.36 parent file or content receipt drifted",
    errors,
  );

  const inputs = manifest.authoritativeInputs ?? [];
  check(inputs.length === 146 && manifest.integrity?.inputCount === 146, "2.37 authoritative input count drifted", errors);
  check(new Set(inputs.map((input) => input.id)).size === 146, "2.37 authoritative input IDs are not unique", errors);
  check(new Set(inputs.map((input) => input.path)).size === 146, "2.37 authoritative input paths are not unique", errors);
  for (const id of ADDED_IDS) check(inputs.some((input) => input.id === id), `2.37 added input ${id} is missing`, errors);

  const exact = manifest.exactReferences?.roomeDilAndRecordWorkspaceIntegrity ?? {};
  check(
    exact.canonicalSourceCount === 27
      && exact.canonicalRecordSetCount === 31
      && exact.bundledExactRosterCount === 8
      && exact.sourceProfileCount === 325
      && exact.sourceNamespaceCount === 8,
    "2.37 source registry denominators drifted",
    errors,
  );
  check(
    exact.researchExplorerRecordCount === 579
      && exact.researchExplorerMolecularProfileCount === 325
      && exact.researchExplorerSourceLaneCount === 8,
    "2.37 Explorer denominators drifted",
    errors,
  );
  check(
    exact.knowledgeCoverageLaneCount === 8
      && exact.knowledgeCoverageAxisCount === 7
      && exact.knowledgeCoverageJudgmentCount === 56,
    "2.37 knowledge-coverage denominators drifted",
    errors,
  );
  check(
    exact.refinedTypeCount === 157
      && exact.familyCount === 12
      && exact.refinedDilCellCount === 61444
      && exact.biologicalLitterPoolCount === 15
      && exact.retainedTechnicalOutputCount === 29,
    "Roome roster or experimental-unit denominators drifted",
    errors,
  );
  check(
    exact.sourceFeatureRowCount === 15900
      && exact.retainedTextGeneRowCount === 15874
      && exact.quarantinedGeneCellCount === 26
      && exact.nonRosterDevelopmentalLabelCount === 2
      && exact.positiveDisplayFeaturesPerType === 6,
    "Roome feature or quarantine denominators drifted",
    errors,
  );
  check(exact.currentRecordPreviewRowCount === 4, "record-specific preview-row count drifted", errors);
  check(exact.researchUpgradeCount === 164 && exact.lastResearchUpgradeId === "UPG-182", "research upgrade range drifted", errors);
  for (const field of ZERO_FIELDS) check(exact[field] === 0, `${field} must remain zero`, errors);
  for (const field of TRUE_FIELDS) check(exact[field] === true, `${field} must remain true`, errors);

  check(
    manifest.registrySummary?.canonicalSourcePackageCount === 27
      && manifest.registrySummary?.canonicalRecordSetCount === 31
      && manifest.registrySummary?.bundledExactRosterCount === 8
      && manifest.registrySummary?.researchUpgradeCount === 164
      && manifest.registrySummary?.sourceProfileCount === 325
      && manifest.registrySummary?.sourceNamespaceCount === 8
      && manifest.registrySummary?.researchExplorerRecordCount === 579,
    "2.37 registry summary drifted",
    errors,
  );
  const sourceInput = inputs.find((input) => input.id === "researchSourceRegistry");
  const upgradeInput = inputs.find((input) => input.id === "researchModelUpgradeRegistry");
  check(same(manifest.registrySummary?.sourceRegistryReceipt, sourceInput), "source registry summary receipt drifted", errors);
  check(same(manifest.registrySummary?.upgradeRegistryReceipt, upgradeInput), "upgrade registry summary receipt drifted", errors);
  check(manifest.registrations?.count === 0 && manifest.registrations?.records?.length === 0, "project registrations must remain zero", errors);
  check(/Molecular switching changes record-specific evidence while the 3D scene remains correctly empty/.test(manifest.scientificBoundaries?.roomeDilAndRecordWorkspaceIntegrity ?? ""), "Roome geometry boundary text drifted", errors);

  if (override === null) await checkInputFiles(manifest, errors);
  if (errors.length) throw new Error(errors.join("\n"));

  return {
    releaseId: manifest.releaseId,
    fileBytes: manifestBytes.byteLength,
    fileSha256: sha256(manifestBytes),
    manifestContentSha256: manifest.manifestContentSha256,
    inputCount: manifest.integrity.inputCount,
    researchUpgradeCount: manifest.registrySummary.researchUpgradeCount,
    canonicalSourceCount: manifest.registrySummary.canonicalSourcePackageCount,
    canonicalRecordSetCount: manifest.registrySummary.canonicalRecordSetCount,
    sourceProfileCount: manifest.registrySummary.sourceProfileCount,
    sourceNamespaceCount: manifest.registrySummary.sourceNamespaceCount,
    researchExplorerRecordCount: manifest.registrySummary.researchExplorerRecordCount,
    researchExplorerSourceLaneCount: exact.researchExplorerSourceLaneCount,
    refinedTypeCount: exact.refinedTypeCount,
    sourceFeatureRowCount: exact.sourceFeatureRowCount,
    quarantinedGeneCellCount: exact.quarantinedGeneCellCount,
    previewCollisionCount: exact.multiRecordNamespacePreviewCollisionCount,
    admittedGeometryCount: exact.admittedGeometryCount,
    registrationCount: exact.registrationCount,
  };
}

async function main() {
  const report = await validateResearchIterationManifest237();
  process.stdout.write(`Research iteration manifest 2.37 validation passed: ${report.fileBytes} bytes; ${report.inputCount} inputs; ${report.researchExplorerRecordCount} Explorer records; ${report.sourceProfileCount} profiles; ${report.refinedTypeCount} Roome types; 0 preview collisions; 0 geometry; 0 REG\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
