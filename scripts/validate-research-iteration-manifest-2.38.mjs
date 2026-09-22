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
  RESEARCH_ITERATION_238_PARENT,
  RESEARCH_ITERATION_238_PURPOSE_OVERRIDES,
  buildResearchIterationManifest238,
} from "../tools/build_research_iteration_manifest_2_38.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.38.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/research-iteration-manifest-2.38.schema.json");
const PARENT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.37.json");

const ADDED_IDS = Object.freeze([
  "delileTaxonomyBuilder",
  "delileTaxonomyContract",
  "delileTaxonomySchema",
  "delileTaxonomyValidator",
  "delileTaxonomyTest",
  "pkd2l1SbfsemVideoContract",
  "pkd2l1SbfsemVideoCaptions",
  "pkd2l1SbfsemVideoValidator",
  "pkd2l1SbfsemVideoTest",
  "researchRecordPresentationRuntime",
  "researchRecordModelReadout",
  "researchRecordPresentationTest",
  "researchTimeline238",
]);

const ZERO_FIELDS = Object.freeze([
  "admittedGeometryCount",
  "admittedInternalStructureCount",
  "generatedFallbackPrimitiveCount",
  "registrationCount",
  "sameCellCrossModalJoinCount",
  "projectCopyCount",
  "packageCopyCount",
  "completeContentFolderCopyCount",
]);

const TRUE_FIELDS = Object.freeze([
  "exactDelileFineSubtypeRosterAdmitted",
  "sourceDlSpellingPreserved",
  "stageReplicateLabelsNotPromotedToAnimals",
  "delileSourceObjectLinkOnlyNoassertion",
  "recordDrivenModelPresentation",
  "recordSpecificEvidencePartitioned",
  "exactSharedSourceContextCollapsed",
  "sharedMissingnessCollapsed",
  "fiveAxisModelingReadinessDisplayed",
  "molecularSwitchClearsPriorGeometry",
  "evidenceReadoutIsNotCellShape",
  "pkd2l1VideoQualitativeOnly",
  "pkd2l1AvailabilityFindingScopedToArticleAndApi",
  "noGenericGeometrySubstitution",
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

export async function validateResearchIterationManifest238(override = null) {
  const [manifestBytes, schema, parentBytes, expected] = await Promise.all([
    readFile(MANIFEST_PATH),
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    readFile(PARENT_PATH),
    buildResearchIterationManifest238(),
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

  if (override === null) check(manifestBytes.equals(expected.bytes), "2.38 manifest differs from deterministic rebuild", errors);
  check(manifest.manifestContentSha256 === expected.manifest.manifestContentSha256, "2.38 manifest content receipt differs from deterministic rebuild", errors);
  check(computeManifestContentSha256(manifest) === manifest.manifestContentSha256, "2.38 manifest content SHA-256 drifted", errors);
  check(
    manifest.manifestSchemaVersion === "2.38.0"
      && manifest.releaseId === "ohri-mouse-interneuron-research-iteration-2.38.0"
      && manifest.releaseDate === "2026-09-02"
      && manifest.application?.version === "2.38.0-research.1",
    "2.38 release identity drifted",
    errors,
  );
  check(same(manifest.parentIterationManifest, RESEARCH_ITERATION_238_PARENT), "immutable 2.37 parent receipt drifted", errors);
  check(
    parentBytes.byteLength === RESEARCH_ITERATION_238_PARENT.bytes
      && sha256(parentBytes) === RESEARCH_ITERATION_238_PARENT.fileSha256
      && parent.manifestContentSha256 === RESEARCH_ITERATION_238_PARENT.contentSha256
      && computeManifestContentSha256(parent) === RESEARCH_ITERATION_238_PARENT.contentSha256,
    "immutable 2.37 parent file or content receipt drifted",
    errors,
  );

  const inputs = manifest.authoritativeInputs ?? [];
  check(inputs.length === 159 && manifest.integrity?.inputCount === 159, "2.38 authoritative input count drifted", errors);
  check(new Set(inputs.map((input) => input.id)).size === 159, "2.38 authoritative input IDs are not unique", errors);
  check(new Set(inputs.map((input) => input.path)).size === 159, "2.38 authoritative input paths are not unique", errors);
  check(same(inputs.slice(0, 146).map(({ id, scope, path: inputPath }) => ({ id, scope, path: inputPath })), parent.authoritativeInputs.map(({ id, scope, path: inputPath }) => ({ id, scope, path: inputPath }))), "2.38 inherited input identity or order drifted", errors);
  for (const [id, purpose] of Object.entries(RESEARCH_ITERATION_238_PURPOSE_OVERRIDES)) {
    check(inputs.find((input) => input.id === id)?.purpose === purpose, `${id} current-purpose description drifted`, errors);
  }
  for (const parentInput of parent.authoritativeInputs.filter((input) => !(input.id in RESEARCH_ITERATION_238_PURPOSE_OVERRIDES))) {
    check(inputs.find((input) => input.id === parentInput.id)?.purpose === parentInput.purpose, `${parentInput.id} inherited-purpose description drifted`, errors);
  }
  check(same(inputs.slice(146).map((input) => input.id), ADDED_IDS), "2.38 added input roster or order drifted", errors);

  const exact = manifest.exactReferences?.delilePresentationAndPkd2l1Integrity ?? {};
  check(
    exact.canonicalSourceCount === 27
      && exact.canonicalRecordSetCount === 32
      && exact.bundledExactRosterCount === 9
      && exact.sourceProfileCount === 376
      && exact.sourceNamespaceCount === 9,
    "2.38 source registry denominators drifted",
    errors,
  );
  check(
    exact.researchExplorerRecordCount === 630
      && exact.researchExplorerMolecularProfileCount === 376
      && exact.researchExplorerSourceLaneCount === 8
      && exact.researchExplorerSourceFileCount === 20,
    "2.38 Explorer denominators drifted",
    errors,
  );
  check(
    exact.delileFineSubtypeCount === 51
      && exact.delileFineSubtypeCellCount === 15217
      && exact.delileTotalMetadataCellCount === 41025
      && exact.delileSourceDefinedNeuronCellCount === 18144
      && exact.delileTypedNonmotorNeuronCellCount === 15394
      && exact.delileCardinalOnlyCellCount === 177
      && exact.delileMotorNeuronExcludedCellCount === 1056
      && exact.delileNullNeuronExcludedCellCount === 1694
      && exact.delileLifeStageCount === 5
      && exact.delileStageReplicateLabelCount === 12,
    "Delile roster or denominator flow drifted",
    errors,
  );
  check(
    exact.pkd2l1ArticleApiVersion === 2
      && exact.pkd2l1ArticleApiBytes === 247909
      && exact.pkd2l1VideoWidth === 872
      && exact.pkd2l1VideoHeight === 1080
      && exact.pkd2l1Mp4Bytes === 46541650
      && exact.pkd2l1PixelSizeNanometre === 5
      && exact.pkd2l1SectionStepNanometre === 50,
    "PKD2L1 article, video or acquisition receipt drifted",
    errors,
  );
  check(exact.researchUpgradeCount === 171 && exact.lastResearchUpgradeId === "UPG-189", "research upgrade range drifted", errors);
  for (const field of ZERO_FIELDS) check(exact[field] === 0, `${field} must remain zero`, errors);
  for (const field of TRUE_FIELDS) check(exact[field] === true, `${field} must remain true`, errors);

  check(
    manifest.registrySummary?.canonicalSourcePackageCount === 27
      && manifest.registrySummary?.canonicalRecordSetCount === 32
      && manifest.registrySummary?.bundledExactRosterCount === 9
      && manifest.registrySummary?.researchUpgradeCount === 171
      && manifest.registrySummary?.sourceProfileCount === 376
      && manifest.registrySummary?.sourceNamespaceCount === 9
      && manifest.registrySummary?.researchExplorerRecordCount === 630,
    "2.38 registry summary drifted",
    errors,
  );
  const sourceInput = inputs.find((input) => input.id === "researchSourceRegistry");
  const upgradeInput = inputs.find((input) => input.id === "researchModelUpgradeRegistry");
  check(same(manifest.registrySummary?.sourceRegistryReceipt, sourceInput), "source registry summary receipt drifted", errors);
  check(same(manifest.registrySummary?.upgradeRegistryReceipt, upgradeInput), "upgrade registry summary receipt drifted", errors);
  check(manifest.registrations?.count === 0 && manifest.registrations?.records?.length === 0, "project registrations must remain zero", errors);
  const boundary = manifest.scientificBoundaries?.delilePresentationAndPkd2l1Integrity ?? "";
  check(/A molecular evidence model is explicitly not a cell shape and clears prior geometry/.test(boundary), "record-driven model boundary text drifted", errors);
  check(/not a universal absence claim/.test(boundary) && /Zero new cell geometry, fallback primitives, internal objects/.test(boundary), "PKD2L1 or zero-object boundary text drifted", errors);

  if (override === null) await checkInputFiles(manifest, errors);
  if (errors.length) throw new Error(`Research iteration 2.38 manifest validation failed:\n- ${errors.join("\n- ")}`);

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
    researchExplorerSourceFileCount: exact.researchExplorerSourceFileCount,
    delileFineSubtypeCount: exact.delileFineSubtypeCount,
    delileFineSubtypeCellCount: exact.delileFineSubtypeCellCount,
    admittedGeometryCount: exact.admittedGeometryCount,
    admittedInternalStructureCount: exact.admittedInternalStructureCount,
    registrationCount: exact.registrationCount,
  };
}

async function main() {
  const report = await validateResearchIterationManifest238();
  process.stdout.write(`Research iteration manifest 2.38 validation passed: ${report.fileBytes} bytes; ${report.inputCount} inputs; ${report.researchExplorerRecordCount} Explorer records; ${report.sourceProfileCount} profiles; ${report.delileFineSubtypeCount} Delile types; 0 geometry; 0 internal objects; 0 REG\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
