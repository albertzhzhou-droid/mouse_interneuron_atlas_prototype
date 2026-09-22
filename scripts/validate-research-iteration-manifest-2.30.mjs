#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { buildResearchIterationManifest230 } from "../tools/build_research_iteration_manifest_2_30.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(ROOT, "data/research-iteration-manifest-2.30.json");
const SCHEMA_PATH = path.join(ROOT, "schemas/research-iteration-manifest-2.30.schema.json");
const PARENT_PATH = path.join(ROOT, "data/research-iteration-manifest-2.29.json");
const CONTRACT_PATH = path.join(ROOT, "data/morphology-source-frame-disclosure-0.1.json");
const CONTENT_SHA = "c80407736016bf95e0b4dc9d937126e8955628cef4c2485384df835639c3538f";
const PARENT = Object.freeze({ path: "data/research-iteration-manifest-2.29.json", releaseId: "ohri-mouse-interneuron-research-iteration-2.29.0", bytes: 77136, fileSha256: "8856ad6413fae98f5f6f9d13cbb0627c8b41b8a9dbaa04ebd9a232689edaeba5", contentSha256: "069b1be3a37a8086f89ea4467503235ed0734afcbfd2974538bae528c4995982" });
const ADDED = Object.freeze([
  Object.freeze({ id: "morphologySourceFrameDisclosure", path: "data/morphology-source-frame-disclosure-0.1.json", bytes: 469544, sha256: "e76abace7e59995f4b1849ce87a7e10e0d066a80844959589d5f06fcba0c5230" }),
  Object.freeze({ id: "morphologySourceFrameDisclosureSchema", path: "schemas/morphology-source-frame-disclosure-0.1.schema.json", bytes: 14554, sha256: "382bc051000d96d7142b5176598dad969f36568579e70f563e83606ac6ca8e4b" }),
  Object.freeze({ id: "morphologySourceFrameDisclosureBuilder", path: "tools/build_morphology_source_frame_disclosure.mjs", bytes: 20391, sha256: "dae31dc3d47d203b3374c1cc902c09950e705147386e44a8fe96af8175c72633" }),
  Object.freeze({ id: "morphologyViewportScaleAlgorithm", path: "app/morphology-viewport-scale.js", bytes: 3658, sha256: "f51a96dd5fe21d36ca7455245145b002a232116115e5af992d0f6465542f1aac" }),
]);
const MUTABLE = new Set(["researchSourceRegistry", "researchModelUpgradeRegistry", "rightsLedger", "packageLock"]);

function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function check(ok, message, errors) { if (!ok) errors.push(message); }
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  return value;
}
function contractContentSha(contract) {
  const copy = structuredClone(contract);
  delete copy.contractContentSha256;
  return sha256(Buffer.from(JSON.stringify(stable(copy)), "utf8"));
}
function without(object, key) {
  const copy = structuredClone(object);
  delete copy[key];
  return copy;
}

async function checkInputFiles(manifest, errors) {
  const roots = {
    project: path.resolve(ROOT, manifest.inputRoots.project.locator),
    scientificAuthority: path.resolve(ROOT, manifest.inputRoots.scientificAuthority.locator),
  };
  await Promise.all(manifest.authoritativeInputs.map(async (input) => {
    const root = roots[input.scope];
    if (!root) return errors.push(input.id + " unsupported scope");
    const resolved = path.resolve(root, input.path);
    const relative = path.relative(root, resolved);
    if (relative.startsWith("..") || path.isAbsolute(relative)) return errors.push(input.id + " escapes input root");
    try {
      const bytes = await readFile(resolved);
      check(bytes.byteLength === input.bytes && sha256(bytes) === input.sha256, input.id + " on-disk receipt drifted", errors);
    } catch (error) {
      errors.push(input.id + " cannot be read: " + (error instanceof Error ? error.message : error));
    }
  }));
}

export async function validateResearchIterationManifest230(override = null) {
  const [manifestBytes, schema, parentBytes, contractBytes] = await Promise.all([
    override === null ? readFile(MANIFEST_PATH) : null,
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    readFile(PARENT_PATH),
    readFile(CONTRACT_PATH),
  ]);
  const manifest = override || JSON.parse(manifestBytes.toString("utf8"));
  const parent = JSON.parse(parentBytes.toString("utf8"));
  const contract = JSON.parse(contractBytes.toString("utf8"));
  const errors = [];
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(manifest)) errors.push(...(validate.errors || []).map((error) => "schema " + (error.instancePath || "/") + ": " + error.message));

  check(manifest.manifestContentSha256 === CONTENT_SHA, "2.30 manifest snapshot content SHA-256 drifted", errors);
  check(manifest.manifestContentSha256 === computeManifestContentSha256(manifest), "manifest content SHA-256 is invalid", errors);
  check(manifest.manifestSchemaVersion === "2.30.0" && manifest.releaseId === "ohri-mouse-interneuron-research-iteration-2.30.0" && manifest.application?.version === "2.30.0-research.1", "2.30 release identity drifted", errors);
  check(same(manifest.parentIterationManifest, PARENT), "immutable 2.29 parent receipt drifted", errors);
  check(parentBytes.byteLength === PARENT.bytes && sha256(parentBytes) === PARENT.fileSha256 && parent.manifestContentSha256 === PARENT.contentSha256 && computeManifestContentSha256(parent) === PARENT.contentSha256, "immutable 2.29 parent file or content drifted", errors);
  if (override === null) {
    try { check(manifestBytes.equals((await buildResearchIterationManifest230()).bytes), "2.30 manifest differs from deterministic rebuild", errors); }
    catch (error) { errors.push("deterministic 2.30 rebuild failed: " + (error instanceof Error ? error.message : error)); }
  }

  check(manifest.integrity?.inputCount === 42 && manifest.authoritativeInputs?.length === 42, "2.30 authoritative-input count changed", errors);
  check(same(manifest.authoritativeInputs.map((input) => input.id), [...parent.authoritativeInputs.map((input) => input.id), ...ADDED.map((input) => input.id)]), "2.30 authoritative-input roster or order changed", errors);
  check(new Set(manifest.authoritativeInputs.map((input) => input.id)).size === 42 && new Set(manifest.authoritativeInputs.map((input) => input.path)).size === 42, "2.30 authoritative inputs are not unique", errors);
  parent.authoritativeInputs.forEach((input, index) => {
    const current = manifest.authoritativeInputs[index];
    check(current.id === input.id && current.scope === input.scope && current.path === input.path && current.purpose === input.purpose, input.id + " inherited identity drifted", errors);
    if (!MUTABLE.has(input.id)) check(current.bytes === input.bytes && current.sha256 === input.sha256, input.id + " immutable inherited receipt drifted", errors);
  });
  const inputs = new Map(manifest.authoritativeInputs.map((input) => [input.id, input]));
  ADDED.forEach((expected) => {
    const input = inputs.get(expected.id);
    check(input?.path === expected.path && input?.bytes === expected.bytes && input?.sha256 === expected.sha256, expected.id + " receipt drifted", errors);
  });
  await checkInputFiles(manifest, errors);
  check(same(without(manifest.exactReferences, "sourceFrameDisclosure"), parent.exactReferences), "an inherited 2.29 exact reference changed", errors);
  check(same(without(manifest.scientificBoundaries, "sourceFrameDisclosure"), parent.scientificBoundaries), "an inherited 2.29 scientific boundary changed", errors);

  check(contract.contractContentSha256 === "cd6b85eb5961e49667bdc126b0230fba35db534fdcc2c8008d5655893978a8ad" && contractContentSha(contract) === contract.contractContentSha256, "source-frame contract content hash drifted", errors);
  const ref = manifest.exactReferences.sourceFrameDisclosure;
  check(ref.contractId === contract.contractId && ref.contractReleaseId === contract.releaseId, "source-frame identity drifted", errors);
  check(ref.contractReceipt?.bytes === contractBytes.byteLength && ref.contractReceipt?.sha256 === sha256(contractBytes) && ref.contractReceipt?.contentSha256 === contract.contractContentSha256, "source-frame contract receipt drifted", errors);
  check(ref.contractSchemaReceipt?.sha256 === ADDED[1].sha256 && ref.builderReceipt?.sha256 === ADDED[2].sha256 && ref.scaleAlgorithmReceipt?.sha256 === ADDED[3].sha256, "source-frame schema, builder or scale receipt drifted", errors);
  check(ref.frozenCensusRecordCount === 142 && ref.supplementaryRecordCount === 7 && ref.viewableSourceObjectCount === 149 && ref.geometry2DCount === 2 && ref.geometry3DCount === 147, "source-frame denominator drifted", errors);
  check(ref.preparationContextConflictCount === 5 && ref.sourceModerateOrIncompleteCount === 70 && ref.scaleEligibleRecordCount === 149, "source-frame preparation, truncation or scale summary drifted", errors);
  const policy = ref.displayScalePolicy;
  check(policy.algorithmId === "camera_target_plane_source_local_scale_v1" && policy.sourceLocalOnly === true && policy.sharedAcrossViewports === false && policy.apparentObjectSizeComparable === false && policy.restoresInVivoDimensions === false && policy.infersMissingCoordinates === false && policy.establishesAnatomicalOrientation === false && policy.establishesAtlasRegistration === false, "scale policy admits shared or biological semantics", errors);
  check(ref.commonScaleAdmissionCount === 0 && ref.sharedCoordinateFrameAdmissionCount === 0 && ref.inferredMissingCoordinateCount === 0 && ref.repairedCutNeuriteCount === 0 && ref.restoredInVivoDimensionCount === 0 && ref.completeBiologicalAxonClaimCount === 0 && ref.sameSpecimenInternalStructureCount === 0 && ref.renderedInternalPrimitiveCount === 0 && ref.crossSourceIdentityCount === 0 && ref.registrationCount === 0, "source-frame reference admits unsupported semantics", errors);
  check(ref.projectCopyCount === 0 && ref.packageCopyCount === 0, "source-frame release creates a project or package copy", errors);
  check(manifest.registrySummary.researchUpgradeCount === 140 && manifest.registrySummary.crossSourceIdentityCount === 0 && manifest.registrySummary.registrationCount === 0 && manifest.registrySummary.renderedInternalPrimitiveCount === 0, "registry denominator or zero boundary drifted", errors);
  check(same(manifest.registrySummary.sourceRegistryReceipt, inputs.get("researchSourceRegistry")) && same(manifest.registrySummary.upgradeRegistryReceipt, inputs.get("researchModelUpgradeRegistry")), "registry receipts disagree with inputs", errors);
  const boundary = manifest.scientificBoundaries.sourceFrameDisclosure;
  check(/142 frozen census records plus seven supplementary/.test(boundary) && /never a combined 149-record census/.test(boundary) && /does not establish common scale/.test(boundary) && /Missing coordinates are not inferred/.test(boundary) && /cut neurites are not repaired/.test(boundary) && /in-vivo dimensions are not restored/.test(boundary) && /project copies and package copies remain zero/.test(boundary), "source-frame boundary is incomplete", errors);

  if (errors.length) throw new Error("Research iteration 2.30 manifest validation failed:\n- " + errors.join("\n- "));
  return { releaseId: manifest.releaseId, inputCount: 42, frozenCensusRecordCount: 142, supplementaryRecordCount: 7, viewableSourceObjectCount: 149, geometry2DCount: 2, geometry3DCount: 147, preparationContextConflictCount: 5, sourceModerateOrIncompleteCount: 70, scaleEligibleRecordCount: 149, commonScaleAdmissionCount: 0, projectCopyCount: 0, packageCopyCount: 0, researchUpgradeCount: 140, manifestContentSha256: manifest.manifestContentSha256 };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest230()
    .then((summary) => process.stdout.write("Research iteration 2.30 manifest valid: " + summary.inputCount + " inputs, " + summary.viewableSourceObjectCount + " viewable source objects and " + summary.scaleEligibleRecordCount + " scale-eligible records.\n"))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}

