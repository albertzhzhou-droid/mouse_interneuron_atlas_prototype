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
const MANIFEST_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.37.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/research-iteration-manifest-2.37.schema.json");
const PARENT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.36.json");

const EXPECTED = Object.freeze({
  bytes: 161281,
  fileSha256: "2ddc5b4cce26cbe5db492234446a52f3c0f182c0ff0ed896104ec6a9c4fb3b08",
  contentSha256: "04b6f7a09968489afa420edb527a159e04f4dc07bab4ce402e394808256ca765",
  parentBytes: 148126,
  parentFileSha256: "93d8a624a5a132a91f3f423cb7b3bc966ef4082f71e18e0e82c0384267588e15",
  parentContentSha256: "3021dd9d9ce1d515634f0d1ea575d624767972411edc923e9b75621979b0e344",
});

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

export async function validateResearchIterationManifest237Snapshot(override = null) {
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
    errors.push(...(validateSchema.errors ?? []).map((error) => `schema ${error.instancePath || "/"}: ${error.message ?? "violation"}`));
  }

  if (override === null) {
    check(manifestBytes.byteLength === EXPECTED.bytes, "immutable 2.37 manifest byte count drifted", errors);
    check(sha256(manifestBytes) === EXPECTED.fileSha256, "immutable 2.37 manifest file SHA-256 drifted", errors);
  }
  check(manifest.manifestContentSha256 === EXPECTED.contentSha256, "immutable 2.37 manifest content receipt drifted", errors);
  check(computeManifestContentSha256(manifest) === EXPECTED.contentSha256, "immutable 2.37 canonical content hash is invalid", errors);
  check(
    manifest.manifestSchemaVersion === "2.37.0"
      && manifest.releaseId === "ohri-mouse-interneuron-research-iteration-2.37.0"
      && manifest.releaseDate === "2026-09-02"
      && manifest.releaseStatus === "localhost_research_iteration"
      && manifest.application?.version === "2.37.0-research.1",
    "immutable 2.37 release identity changed",
    errors,
  );
  check(
    manifest.parentIterationManifest?.releaseId === "ohri-mouse-interneuron-research-iteration-2.36.0"
      && manifest.parentIterationManifest?.bytes === EXPECTED.parentBytes
      && manifest.parentIterationManifest?.fileSha256 === EXPECTED.parentFileSha256
      && manifest.parentIterationManifest?.contentSha256 === EXPECTED.parentContentSha256,
    "immutable 2.37 parent receipt changed",
    errors,
  );
  check(
    parentBytes.byteLength === EXPECTED.parentBytes
      && sha256(parentBytes) === EXPECTED.parentFileSha256
      && parent.manifestContentSha256 === EXPECTED.parentContentSha256
      && computeManifestContentSha256(parent) === EXPECTED.parentContentSha256,
    "immutable 2.36 parent file or content receipt drifted",
    errors,
  );

  check(manifest.integrity?.inputCount === 146 && manifest.authoritativeInputs?.length === 146, "immutable 2.37 input denominator changed", errors);
  check(new Set(manifest.authoritativeInputs?.map((input) => input.id)).size === 146, "immutable 2.37 input ids are not unique", errors);
  check(new Set(manifest.authoritativeInputs?.map((input) => input.path)).size === 146, "immutable 2.37 input paths are not unique", errors);

  const reference = manifest.exactReferences?.roomeDilAndRecordWorkspaceIntegrity;
  check(reference?.contractId === "ohri-roome-dil-and-record-workspace-integrity-2.37", "immutable 2.37 reference identity changed", errors);
  check(
    reference?.canonicalSourceCount === 27
      && reference?.canonicalRecordSetCount === 31
      && reference?.bundledExactRosterCount === 8
      && reference?.sourceProfileCount === 325
      && reference?.sourceNamespaceCount === 8
      && reference?.researchExplorerRecordCount === 579
      && reference?.researchExplorerMolecularProfileCount === 325
      && reference?.researchExplorerSourceLaneCount === 8
      && reference?.knowledgeCoverageLaneCount === 8
      && reference?.knowledgeCoverageJudgmentCount === 56
      && reference?.refinedTypeCount === 157
      && reference?.refinedDilCellCount === 61444
      && reference?.sourceFeatureRowCount === 15900
      && reference?.retainedTextGeneRowCount === 15874
      && reference?.quarantinedGeneCellCount === 26
      && reference?.researchUpgradeCount === 164
      && reference?.lastResearchUpgradeId === "UPG-182"
      && reference?.admittedGeometryCount === 0
      && reference?.admittedInternalStructureCount === 0
      && reference?.registrationCount === 0
      && reference?.sameCellCrossModalJoinCount === 0,
    "immutable 2.37 denominator or zero boundary changed",
    errors,
  );
  check(
    manifest.registrySummary?.canonicalSourcePackageCount === 27
      && manifest.registrySummary?.canonicalRecordSetCount === 31
      && manifest.registrySummary?.bundledExactRosterCount === 8
      && manifest.registrySummary?.researchUpgradeCount === 164
      && manifest.registrySummary?.sourceProfileCount === 325
      && manifest.registrySummary?.sourceNamespaceCount === 8
      && manifest.registrySummary?.researchExplorerRecordCount === 579
      && manifest.registrySummary?.crossSourceIdentityCount === 0
      && manifest.registrySummary?.registrationCount === 0
      && manifest.registrySummary?.renderedInternalPrimitiveCount === 0,
    "immutable 2.37 registry denominator or zero boundary changed",
    errors,
  );
  check(manifest.registrations?.count === 0 && manifest.registrations?.records?.length === 0, "immutable 2.37 registration zero-claim changed", errors);
  check((manifest.authoritativeInputs ?? []).some((input) => input.path === "data/roome-dil-source-taxonomy-0.1.json"), "immutable 2.37 roster lost the Roome taxonomy contract", errors);
  check((manifest.authoritativeInputs ?? []).some((input) => input.path === "data/roome-dil-differential-features-0.1.json"), "immutable 2.37 roster lost the Roome feature contract", errors);
  check((manifest.authoritativeInputs ?? []).some((input) => input.path === "app/research-focus-workspace-state.js"), "immutable 2.37 roster lost the focus-workspace runtime", errors);

  if (errors.length > 0) throw new Error(`Research iteration 2.37 immutable snapshot validation failed:\n- ${errors.join("\n- ")}`);
  return {
    releaseId: manifest.releaseId,
    fileBytes: EXPECTED.bytes,
    fileSha256: EXPECTED.fileSha256,
    contentSha256: EXPECTED.contentSha256,
    inputCount: 146,
    researchUpgradeCount: 164,
    canonicalSourcePackageCount: 27,
    canonicalRecordSetCount: 31,
    bundledExactRosterCount: 8,
    sourceProfileCount: 325,
    sourceNamespaceCount: 8,
    researchExplorerRecordCount: 579,
    renderedInternalPrimitiveCount: 0,
    registrationCount: 0,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest237Snapshot()
    .then((result) => process.stdout.write(`Research iteration 2.37 immutable snapshot valid: ${JSON.stringify(result)}\n`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
