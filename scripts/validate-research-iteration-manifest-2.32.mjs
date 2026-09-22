#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { buildResearchIterationManifest232 } from "../tools/build_research_iteration_manifest_2_32.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.32.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/research-iteration-manifest-2.32.schema.json");
const PARENT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.31.json");
const TOPOLOGY_CONTRACT_PATH = path.join(PROJECT_ROOT, "data/morphology-topology-detail-0.1.json");
const TOPOLOGY_RUNTIME_PATH = path.join(PROJECT_ROOT, "public/data/morphology_topology_detail_v1/index.json");

const FILE_BYTES = 98357;
const FILE_SHA256 = "eaacd5bb0acae3c704e24ac2c1ffa4ef508bc5491155898bec6f28a825ea5e77";
const CONTENT_SHA256 = "4b0ed4508655553736b656f7a72a6d2e869218e0a4eff886811c7f0f15e113a2";
const PARENT = Object.freeze({
  path: "data/research-iteration-manifest-2.31.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.31.0",
  bytes: 87120,
  fileSha256: "49ef49fdaaf8e72976d01e7a6d3053d40735215c39bf890100ab464d7ac67996",
  contentSha256: "c714ba7ac7f306987b0344899c20381eda6a568d57b222773746839c687a0fd4",
});
const MUTABLE_PARENT_INPUTS = new Set([
  "researchSourceRegistry",
  "researchModelUpgradeRegistry",
  "rightsLedger",
  "packageLock",
  "researchVisualTargetResolver",
]);
const ADDED_IDS = Object.freeze([
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

function validateTopologyRuntime(contract, runtime, runtimeBytes, reference, errors) {
  check(contract.runtimeAsset.bytes === runtimeBytes.byteLength && contract.runtimeAsset.sha256 === sha256(runtimeBytes), "topology contract runtime receipt drifted", errors);
  check(reference.runtimeReceipt.bytes === runtimeBytes.byteLength && reference.runtimeReceipt.sha256 === sha256(runtimeBytes), "2.32 topology runtime receipt drifted", errors);
  check(runtime.records?.length === 149 && new Set(runtime.records.map((record) => record.neuronId)).size === 149, "topology runtime membership drifted", errors);
  check(runtime.records.filter((record) => record.membership.collection === "frozen_census").length === 142 && runtime.records.filter((record) => record.membership.collection === "supplementary").length === 7, "topology runtime is not 142 frozen + 7 supplementary", errors);
  const summaryFields = [
    "frozenCensusRecordCount",
    "supplementaryRecordCount",
    "viewableSourceObjectCount",
    "verifiedGeometryCount",
    "sourceType1RecordCount",
    "sourceType2RecordCount",
    "sourceType3RecordCount",
    "sourceType4RecordCount",
    "otherSourceTypeRecordCount",
    "landmarkReceiptCount",
    "totalNodeCount",
    "totalSegmentCount",
    "totalNeuriteSegmentCount",
    "totalTerminalLandmarkCount",
    "totalBifurcationLandmarkCount",
  ];
  for (const field of summaryFields) check(reference[field] === runtime.summary[field], `2.32 topology ${field} disagrees with runtime`, errors);
  let invalidAvailabilityCount = 0;
  let invalidLandmarkCount = 0;
  for (const record of runtime.records ?? []) {
    if (record.geometryReceipt?.registrationCount !== 0 || record.topology?.landmarks?.rootNodeIds?.length !== 1 || record.topology.landmarks.rootNodeIds[0] !== record.topology.rootNodeId) invalidLandmarkCount += 1;
    const type1 = record.topology?.sourceTypeDomains?.find((domain) => domain.sourceType === 1);
    if (type1?.semanticStatus !== "standardized_soma_samples_not_contour" || type1?.neuriteMetrics?.status !== "UNAVAILABLE") invalidAvailabilityCount += 1;
    for (const item of record.topology?.canonicalNeuriteTypeAvailability ?? []) {
      if (item.status === "UNAVAILABLE" && item.biologicalAbsenceClaim !== false) invalidAvailabilityCount += 1;
    }
  }
  check(invalidAvailabilityCount === 0 && invalidLandmarkCount === 0, "topology runtime promotes unavailable types, type-1 contours, registrations or invalid landmarks", errors);
}

export async function validateResearchIterationManifest232(override = null) {
  const [manifestBytes, schema, parentBytes, topologyContractBytes, topologyRuntimeBytes, expected] = await Promise.all([
    readFile(MANIFEST_PATH),
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    readFile(PARENT_PATH),
    readFile(TOPOLOGY_CONTRACT_PATH),
    readFile(TOPOLOGY_RUNTIME_PATH),
    buildResearchIterationManifest232(),
  ]);
  const manifest = override ?? JSON.parse(manifestBytes.toString("utf8"));
  const parent = JSON.parse(parentBytes.toString("utf8"));
  const topologyContract = JSON.parse(topologyContractBytes.toString("utf8"));
  const topologyRuntime = JSON.parse(topologyRuntimeBytes.toString("utf8"));
  const errors = [];

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validateSchema = ajv.compile(schema);
  if (!validateSchema(manifest)) {
    errors.push(...(validateSchema.errors ?? []).map((error) => `schema ${error.instancePath || "/"}: ${error.message}`));
  }

  if (override === null) {
    check(manifestBytes.byteLength === FILE_BYTES && sha256(manifestBytes) === FILE_SHA256, "2.32 manifest file receipt drifted", errors);
    check(manifestBytes.equals(expected.bytes), "2.32 manifest differs from deterministic rebuild", errors);
  }
  check(manifest.manifestContentSha256 === CONTENT_SHA256 && computeManifestContentSha256(manifest) === CONTENT_SHA256, "2.32 manifest content SHA-256 drifted", errors);
  check(manifest.manifestSchemaVersion === "2.32.0" && manifest.releaseId === "ohri-mouse-interneuron-research-iteration-2.32.0" && manifest.application?.version === "2.32.0-research.1", "2.32 release identity drifted", errors);
  check(same(manifest.parentIterationManifest, PARENT), "immutable 2.31 parent receipt drifted", errors);
  check(parentBytes.byteLength === PARENT.bytes && sha256(parentBytes) === PARENT.fileSha256 && parent.manifestContentSha256 === PARENT.contentSha256 && computeManifestContentSha256(parent) === PARENT.contentSha256, "immutable 2.31 parent file or content drifted", errors);

  check(manifest.integrity?.inputCount === 63 && manifest.authoritativeInputs?.length === 63, "2.32 authoritative-input denominator drifted", errors);
  check(new Set(manifest.authoritativeInputs?.map((input) => input.id)).size === 63 && new Set(manifest.authoritativeInputs?.map((input) => input.path)).size === 63, "2.32 authoritative inputs are not unique", errors);
  check(same(manifest.authoritativeInputs?.slice(0, 46).map((input) => input.id), parent.authoritativeInputs.map((input) => input.id)), "2.32 inherited authoritative-input order drifted", errors);
  check(same(manifest.authoritativeInputs?.slice(46).map((input) => input.id), ADDED_IDS), "2.32 added authoritative-input roster or order drifted", errors);
  parent.authoritativeInputs.forEach((parentInput, index) => {
    const current = manifest.authoritativeInputs?.[index];
    check(current?.id === parentInput.id && current?.scope === parentInput.scope && current?.path === parentInput.path && current?.purpose === parentInput.purpose, `${parentInput.id} inherited identity drifted`, errors);
    if (!MUTABLE_PARENT_INPUTS.has(parentInput.id)) check(current?.bytes === parentInput.bytes && current?.sha256 === parentInput.sha256, `${parentInput.id} immutable inherited receipt drifted`, errors);
  });
  await checkInputFiles(manifest, errors);

  check(same(without(manifest.exactReferences, "uiKnowledgeAndTopologyIntegrity"), parent.exactReferences), "an inherited 2.31 exact reference changed", errors);
  check(same(without(manifest.scientificBoundaries, "uiKnowledgeAndTopologyIntegrity"), parent.scientificBoundaries), "an inherited 2.31 scientific boundary changed", errors);
  const reference = manifest.exactReferences?.uiKnowledgeAndTopologyIntegrity;
  check(same(reference, expected.manifest.exactReferences.uiKnowledgeAndTopologyIntegrity), "2.32 UI/knowledge/topology exact reference drifted", errors);
  check(reference?.focusSynchronization?.nonSciActiveEntityCount === 0 && reference?.focusSynchronization?.molecularMainSceneGeometryCount === 0 && reference?.focusSynchronization?.fallbackGeometryCount === 0 && reference?.focusSynchronization?.substituteGeometryCount === 0, "focus synchronization admits stale or surrogate geometry", errors);
  check(reference?.focusSynchronization?.keyboardRovingTabStopCountWhenNonSci === 1 && reference?.focusSynchronization?.nullSelectionRoundTripPreserved === true && reference?.focusSynchronization?.sciFocusCanonicalizesPersistedSelection === true, "focus synchronization lost keyboard access or state round-trip guarantees", errors);
  const i1 = reference?.molecularEvidenceFingerprint?.exactDemonstrationRecords?.i1;
  const i2 = reference?.molecularEvidenceFingerprint?.exactDemonstrationRecords?.i2;
  check(i1?.sampledNucleusCount === 1520 && i2?.sampledNucleusCount === 780 && !same(i1?.markers, i2?.markers) && !same(i1?.sourceRegionMembership, i2?.sourceRegionMembership), "I1/I2 evidence fingerprints are not exact and visibly distinct", errors);
  check(reference?.molecularEvidenceFingerprint?.admittedCellGeometryPrimitiveCount === 0 && reference?.molecularEvidenceFingerprint?.rawMachineTokenPrimaryLabelCount === 0 && reference?.molecularEvidenceFingerprint?.sharedLimitBlockCountPerFingerprint === 1, "molecular fingerprint geometry, label or repetition boundary drifted", errors);
  check(same(reference?.molecularEvidenceFingerprint?.lifeStageAuthority, { sathyamurthy: "adult", alkaslasi: "adult; source mice aged 8 weeks", unknownRecordPolicy: "not_retained_in_exact_record" }), "molecular fingerprint life-stage authority drifted", errors);
  validateTopologyRuntime(topologyContract, topologyRuntime, topologyRuntimeBytes, reference?.morphologyTopologyDetail ?? {}, errors);
  for (const field of ["somaContourClaimCount", "membraneClaimCount", "internalStructureModelCount", "boutonClaimCount", "synapseClaimCount", "crossSourceIdentityCount", "registrationCount", "generatedBiologicalPrimitiveCount"]) {
    check(reference?.morphologyTopologyDetail?.[field] === 0, `topology ${field} must remain zero`, errors);
  }
  check(reference?.projectCopyCount === 0 && reference?.packageCopyCount === 0, "2.32 created a project or package copy", errors);
  check(manifest.registrySummary?.researchUpgradeCount === 148 && manifest.registrySummary?.crossSourceIdentityCount === 0 && manifest.registrySummary?.registrationCount === 0 && manifest.registrySummary?.renderedInternalPrimitiveCount === 0, "registry denominator or zero-boundary drifted", errors);
  check(manifest.registrations?.count === 0 && manifest.registrations?.records?.length === 0, "2.32 creates a registration", errors);
  const boundary = manifest.scientificBoundaries?.uiKnowledgeAndTopologyIntegrity ?? "";
  check(/non-SCI focus has no active SCI entity/.test(boundary) && /142 frozen census plus seven supplementary/.test(boundary) && /type 1 is not a soma contour/.test(boundary) && /unavailable rather than biological zero/.test(boundary) && /Project and package copies remain zero/.test(boundary), "2.32 scientific boundary is incomplete", errors);

  if (errors.length > 0) throw new Error(`Research iteration 2.32 manifest validation failed:\n- ${errors.join("\n- ")}`);
  return {
    releaseId: manifest.releaseId,
    fileBytes: FILE_BYTES,
    fileSha256: FILE_SHA256,
    manifestContentSha256: manifest.manifestContentSha256,
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
  validateResearchIterationManifest232()
    .then((result) => process.stdout.write(`Research iteration manifest valid: ${JSON.stringify(result)}\n`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
