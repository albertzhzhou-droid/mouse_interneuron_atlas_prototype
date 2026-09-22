#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { resolveResearchVisualTarget } from "../app/research-visual-target.js";
import { buildResearchIterationManifest231 } from "../tools/build_research_iteration_manifest_2_31.mjs";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(ROOT, "data/research-iteration-manifest-2.31.json");
const SCHEMA_PATH = path.join(ROOT, "schemas/research-iteration-manifest-2.31.schema.json");
const PARENT_PATH = path.join(ROOT, "data/research-iteration-manifest-2.30.json");
const ASSET_MANIFEST_PATH = path.join(ROOT, "public/data/research_explorer_index_v1/asset-manifest.json");
const SEARCH_INDEX_PATH = path.join(ROOT, "public/data/research_explorer_index_v1/search-index.json");

const FILE_BYTES = 87120;
const FILE_SHA256 = "49ef49fdaaf8e72976d01e7a6d3053d40735215c39bf890100ab464d7ac67996";
const CONTENT_SHA256 = "c714ba7ac7f306987b0344899c20381eda6a568d57b222773746839c687a0fd4";
const PARENT = Object.freeze({
  path: "data/research-iteration-manifest-2.30.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.30.0",
  bytes: 81964,
  fileSha256: "c8796b7732d2f36998976698f1991f5d70e95fae96b33c20301d4b21d80e5858",
  contentSha256: "c80407736016bf95e0b4dc9d937126e8955628cef4c2485384df835639c3538f",
});
const ADDED = Object.freeze([
  Object.freeze({ id: "researchExplorerAssetManifest", path: "public/data/research_explorer_index_v1/asset-manifest.json", bytes: 4290, sha256: "8753a0d579f0b3b0b47227d5d43bce230d5f1338f730a9204626ef77e33a8b33" }),
  Object.freeze({ id: "researchExplorerSearchIndex", path: "public/data/research_explorer_index_v1/search-index.json", bytes: 5293046, sha256: "5954c2911a196fc14dc033142f3a028c3cc612f5dbce8514e2b8316f42510c54" }),
  Object.freeze({ id: "researchVisualTargetResolver", path: "app/research-visual-target.js", bytes: 4588, sha256: "21d20d86a7c687098f8f909c8b4b9b7737267163a9e4e84aacf15b74b48930a3" }),
  Object.freeze({ id: "morphologyRecordDisclosureComponent", path: "app/MorphologyRecordDisclosure.tsx", bytes: 4846, sha256: "87e0e8f1c041feb1ab77aa681e0428daa2c757ff7872c79ee576700540b5e789" }),
]);
const MUTABLE = new Set(["researchSourceRegistry", "researchModelUpgradeRegistry", "rightsLedger", "packageLock"]);
const ADMITTED_MAIN_SCENE_NEURON_IDS = Object.freeze([
  45674, 45718, 50394, 50408, 50424, 104003, 108974,
  109005, 109021, 170035, 242822, 249676, 260150,
]);
const SOURCE_DIAMETER_NEURON_IDS = Object.freeze([
  45674, 45718, 50394, 50408, 50424, 104003, 108974, 109005, 109021,
]);
const REQUIRED_GAP_FIELDS = Object.freeze([
  "axisId", "status", "reasonCode", "scope", "authority",
  "sourceLocator", "rawValue", "detail", "inferenceAllowed",
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

async function checkInputFiles(manifest, errors) {
  const roots = {
    project: path.resolve(ROOT, manifest.inputRoots?.project?.locator ?? "."),
    scientificAuthority: path.resolve(ROOT, manifest.inputRoots?.scientificAuthority?.locator ?? "../interneuron_sci_review"),
  };
  await Promise.all((manifest.authoritativeInputs ?? []).map(async (input) => {
    const inputRoot = roots[input.scope];
    if (!inputRoot) return errors.push(`${input.id} has unsupported scope ${input.scope}`);
    const resolved = path.resolve(inputRoot, input.path);
    const relative = path.relative(inputRoot, resolved);
    if (relative.startsWith("..") || path.isAbsolute(relative)) return errors.push(`${input.id} escapes its input root`);
    try {
      const bytes = await readFile(resolved);
      check(bytes.byteLength === input.bytes && sha256(bytes) === input.sha256, `${input.id} on-disk receipt drifted`, errors);
    } catch (error) {
      errors.push(`${input.id} cannot be read: ${error instanceof Error ? error.message : error}`);
    }
  }));
}

function validateIndex(index, assetManifest, reference, errors) {
  const searchIndexReceipt = reference?.searchIndexReceipt ?? {};
  check(index.schemaVersion === "1.8.0" && assetManifest.schemaVersion === "1.8.0", "Research Explorer 1.8.0 identity drifted", errors);
  check(index.assetSetId === "ohri:research-explorer-index:1.8.0" && assetManifest.assetSetId === index.assetSetId, "Research Explorer asset-set identity drifted", errors);
  check(index.records?.length === 413 && index.counts?.total === 413 && assetManifest.expectedCounts?.total === 413, "Research Explorer 413-record denominator drifted", errors);
  check(assetManifest.sourceFiles?.length === 16, "Research Explorer 16-source-file denominator drifted", errors);
  check(assetManifest.index?.bytes === searchIndexReceipt.bytes && assetManifest.index?.sha256 === searchIndexReceipt.sha256 && assetManifest.index?.recordCount === 413, "asset manifest does not pin the full search index", errors);

  const morphology = index.records.filter((record) => record.focusKind === "morphology_record");
  const census = morphology.filter((record) => record.morphologyMembership?.collection === "census");
  const supplementary = morphology.filter((record) => record.morphologyMembership?.collection === "supplementary");
  check(morphology.length === 149 && census.length === 142 && supplementary.length === 7, "morphology must remain 142 census + 7 supplementary = 149 viewable", errors);
  check(census.every((record) => record.morphologyMembership.censusContribution === 1 && record.morphologyMembership.supplementaryContribution === 0), "a census record has invalid collection contributions", errors);
  check(supplementary.every((record) => record.morphologyMembership.censusContribution === 0 && record.morphologyMembership.supplementaryContribution === 1), "a supplementary record expands the frozen census", errors);

  const policy = index.scientificPolicy?.missingnessContract;
  const reasonCodes = new Set(policy?.reasonCodes ?? []);
  const scopes = new Set(["record_specific", ...(policy?.sharedScopes ?? [])]);
  let gapCount = 0;
  let recordsWithGapCount = 0;
  let invalidMissingnessCount = 0;
  let inferenceAllowedCount = 0;
  for (const record of index.records) {
    if (!Array.isArray(record.gaps)) {
      invalidMissingnessCount += 1;
      continue;
    }
    if (record.gaps.length > 0) recordsWithGapCount += 1;
    for (const gap of record.gaps) {
      gapCount += 1;
      if (REQUIRED_GAP_FIELDS.some((field) => !Object.hasOwn(gap, field))) invalidMissingnessCount += 1;
      if (!reasonCodes.has(gap.reasonCode) || !scopes.has(gap.scope)) invalidMissingnessCount += 1;
      if (gap.inferenceAllowed !== false) inferenceAllowedCount += 1;
    }
    if (record.relationshipStatus !== "not_established_outside_this_source_record") invalidMissingnessCount += 1;
    if (record.coordinate?.registrationCount !== 0) invalidMissingnessCount += 1;
  }
  check(policy?.inferenceAllowed === false && same(policy?.reasonCodes, reference.missingnessReasonCodes) && same(["record_specific", ...policy.sharedScopes], reference.missingnessScopes), "controlled missingness policy drifted", errors);
  check(gapCount === 3634 && recordsWithGapCount === 413 && invalidMissingnessCount === 0 && inferenceAllowedCount === 0, "structured missingness rows are incomplete, uncontrolled or inference-enabled", errors);

  const dispositions = { exact_main_scene_morphology: 0, source_specific_viewer_only: 0, cleared: 0 };
  const exactNeuronIds = [];
  let fallbackGeometryCount = 0;
  let substituteGeometryCount = 0;
  for (const record of index.records) {
    const target = resolveResearchVisualTarget({
      focus: record,
      admittedMainSceneNeuronIds: ADMITTED_MAIN_SCENE_NEURON_IDS,
      sourceDiameterNeuronIds: SOURCE_DIAMETER_NEURON_IDS,
      requestedFidelityMode: "radius_surface",
      currentView: "cell_detail",
    });
    if (!Object.hasOwn(dispositions, target.status)) {
      errors.push(`${record.key} resolves to unsupported visual disposition ${target.status}`);
      continue;
    }
    dispositions[target.status] += 1;
    if (target.status === "exact_main_scene_morphology") {
      const requestedNeuronId = Number(record.focusId.replace("NeuroMorpho:", ""));
      exactNeuronIds.push(target.neuronId);
      if (target.neuronId !== requestedNeuronId) substituteGeometryCount += 1;
      if (target.showObservedCellForm !== true || target.nextView !== "cell_detail" || target.focusBinding?.focusId !== record.focusId) substituteGeometryCount += 1;
    } else {
      if (target.neuronId !== null || target.showObservedCellForm !== false || target.nextView === "cell_detail") fallbackGeometryCount += 1;
      if (target.status === "source_specific_viewer_only" && target.sourceSpecificViewer?.focusId !== record.focusId) fallbackGeometryCount += 1;
    }
  }
  exactNeuronIds.sort((left, right) => left - right);
  check(same(exactNeuronIds, ADMITTED_MAIN_SCENE_NEURON_IDS), "13-member main-scene exact-target roster drifted", errors);
  check(dispositions.exact_main_scene_morphology === 13 && dispositions.source_specific_viewer_only === 136 && dispositions.cleared === 264, "visual disposition must remain 13 exact + 136 viewer-only + 264 cleared", errors);
  check(fallbackGeometryCount === 0 && substituteGeometryCount === 0, "visual resolver admits fallback or substitute geometry", errors);
}

export async function validateResearchIterationManifest231(override = null) {
  const [manifestBytes, schema, parentBytes, assetManifestBytes, searchIndexBytes] = await Promise.all([
    readFile(MANIFEST_PATH),
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    readFile(PARENT_PATH),
    readFile(ASSET_MANIFEST_PATH),
    readFile(SEARCH_INDEX_PATH),
  ]);
  const manifest = override ?? JSON.parse(manifestBytes.toString("utf8"));
  const parent = JSON.parse(parentBytes.toString("utf8"));
  const assetManifest = JSON.parse(assetManifestBytes.toString("utf8"));
  const index = JSON.parse(searchIndexBytes.toString("utf8"));
  const errors = [];

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validateSchema = ajv.compile(schema);
  if (!validateSchema(manifest)) {
    errors.push(...(validateSchema.errors ?? []).map((error) => `schema ${error.instancePath || "/"}: ${error.message}`));
  }

  if (override === null) {
    check(manifestBytes.byteLength === FILE_BYTES && sha256(manifestBytes) === FILE_SHA256, "2.31 manifest file receipt drifted", errors);
    try {
      check(manifestBytes.equals((await buildResearchIterationManifest231()).bytes), "2.31 manifest differs from deterministic rebuild", errors);
    } catch (error) {
      errors.push(`deterministic 2.31 rebuild failed: ${error instanceof Error ? error.message : error}`);
    }
  }
  check(manifest.manifestContentSha256 === CONTENT_SHA256 && computeManifestContentSha256(manifest) === CONTENT_SHA256, "2.31 manifest content SHA-256 drifted", errors);
  check(manifest.manifestSchemaVersion === "2.31.0" && manifest.releaseId === "ohri-mouse-interneuron-research-iteration-2.31.0" && manifest.application?.version === "2.31.0-research.1", "2.31 release identity drifted", errors);
  check(same(manifest.parentIterationManifest, PARENT), "immutable 2.30 parent receipt drifted", errors);
  check(parentBytes.byteLength === PARENT.bytes && sha256(parentBytes) === PARENT.fileSha256 && parent.manifestContentSha256 === PARENT.contentSha256 && computeManifestContentSha256(parent) === PARENT.contentSha256, "immutable 2.30 parent file or content drifted", errors);

  check(manifest.integrity?.inputCount === 46 && manifest.authoritativeInputs?.length === 46, "2.31 authoritative-input denominator drifted", errors);
  check(same(manifest.authoritativeInputs?.map((input) => input.id), [...parent.authoritativeInputs.map((input) => input.id), ...ADDED.map((input) => input.id)]), "2.31 authoritative-input roster or order drifted", errors);
  check(new Set(manifest.authoritativeInputs?.map((input) => input.id)).size === 46 && new Set(manifest.authoritativeInputs?.map((input) => input.path)).size === 46, "2.31 authoritative inputs are not unique", errors);
  parent.authoritativeInputs.forEach((input, indexValue) => {
    const current = manifest.authoritativeInputs[indexValue];
    check(current?.id === input.id && current?.scope === input.scope && current?.path === input.path && current?.purpose === input.purpose, `${input.id} inherited identity drifted`, errors);
    if (!MUTABLE.has(input.id)) check(current?.bytes === input.bytes && current?.sha256 === input.sha256, `${input.id} immutable inherited receipt drifted`, errors);
  });
  const inputs = new Map(manifest.authoritativeInputs?.map((input) => [input.id, input]) ?? []);
  for (const expected of ADDED) {
    const input = inputs.get(expected.id);
    check(input?.scope === "project" && input?.path === expected.path && input?.bytes === expected.bytes && input?.sha256 === expected.sha256, `${expected.id} receipt drifted`, errors);
  }
  await checkInputFiles(manifest, errors);

  check(same(without(manifest.exactReferences, "researchExplorerVisualIntegrity"), parent.exactReferences), "an inherited 2.30 exact reference changed", errors);
  check(same(without(manifest.scientificBoundaries, "researchExplorerVisualIntegrity"), parent.scientificBoundaries), "an inherited 2.30 scientific boundary changed", errors);
  const reference = manifest.exactReferences?.researchExplorerVisualIntegrity;
  check(same(reference, schema.$defs.researchExplorerVisualIntegrityReference.const), "Research Explorer visual-integrity reference drifted", errors);
  check(reference?.assetManifestReceipt?.bytes === assetManifestBytes.byteLength && reference?.assetManifestReceipt?.sha256 === sha256(assetManifestBytes), "Research Explorer asset-manifest receipt drifted", errors);
  check(reference?.searchIndexReceipt?.bytes === searchIndexBytes.byteLength && reference?.searchIndexReceipt?.sha256 === sha256(searchIndexBytes), "full Research Explorer index receipt drifted", errors);
  validateIndex(index, assetManifest, reference ?? {}, errors);

  for (const field of [
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
  ]) {
    check(reference?.[field] === 0, `${field} must remain zero`, errors);
  }
  check(manifest.registrySummary?.researchUpgradeCount === 144 && manifest.registrySummary?.crossSourceIdentityCount === 0 && manifest.registrySummary?.registrationCount === 0 && manifest.registrySummary?.renderedInternalPrimitiveCount === 0, "registry denominator or zero-boundary drifted", errors);
  check(same(manifest.registrySummary?.sourceRegistryReceipt, inputs.get("researchSourceRegistry")) && same(manifest.registrySummary?.upgradeRegistryReceipt, inputs.get("researchModelUpgradeRegistry")), "registry receipts disagree with authoritative inputs", errors);
  check(manifest.registrations?.count === 0 && manifest.registrations?.records?.length === 0, "manifest creates a registration", errors);
  const boundary = manifest.scientificBoundaries?.researchExplorerVisualIntegrity ?? "";
  check(/413 independently admitted source records/.test(boundary) && /142 frozen census records plus seven supplementary/.test(boundary) && /13 exact focus identities/.test(boundary) && /136 exact morphology records/.test(boundary) && /264 non-morphology focuses clear stale morphology/.test(boundary) && /inferenceAllowed=false/.test(boundary) && /Fallback geometry, substitute geometry/.test(boundary) && /project copies and package copies remain zero/.test(boundary), "Research Explorer visual-integrity boundary is incomplete", errors);

  if (errors.length > 0) throw new Error(`Research iteration 2.31 manifest validation failed:\n- ${errors.join("\n- ")}`);
  return {
    releaseId: manifest.releaseId,
    fileBytes: FILE_BYTES,
    fileSha256: FILE_SHA256,
    manifestContentSha256: manifest.manifestContentSha256,
    inputCount: 46,
    researchExplorerRecordCount: 413,
    sourceFileCount: 16,
    frozenCensusRecordCount: 142,
    supplementaryRecordCount: 7,
    viewableMorphologyRecordCount: 149,
    admittedMainSceneExactTargetCount: 13,
    sourceSpecificViewerOnlyCount: 136,
    nonMorphologyClearCount: 264,
    gapCount: 3634,
    fallbackGeometryCount: 0,
    substituteGeometryCount: 0,
    researchUpgradeCount: 144,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest231()
    .then((summary) => process.stdout.write(`Research iteration 2.31 manifest valid: ${summary.inputCount} inputs, ${summary.researchExplorerRecordCount} indexed records, ${summary.admittedMainSceneExactTargetCount} main-scene targets, ${summary.sourceSpecificViewerOnlyCount} viewer-only targets and ${summary.nonMorphologyClearCount} cleared targets.\n`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
