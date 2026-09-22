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
const MANIFEST_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.36.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/research-iteration-manifest-2.36.schema.json");
const PARENT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.35.json");

const EXPECTED = Object.freeze({
  bytes: 148126,
  fileSha256: "93d8a624a5a132a91f3f423cb7b3bc966ef4082f71e18e0e82c0384267588e15",
  contentSha256: "3021dd9d9ce1d515634f0d1ea575d624767972411edc923e9b75621979b0e344",
  parentBytes: 134630,
  parentFileSha256: "71f90cfc2c6ad2c6f74146d1992493fc77229c131764faff83657dcada797dc1",
  parentContentSha256: "0691b27bd2cd46e0d96d9a8862ff8478819572f7cfde225d20b9d9c93aeff828",
});

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

export async function validateResearchIterationManifest236Snapshot(override = null) {
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
    check(manifestBytes.byteLength === EXPECTED.bytes, "immutable 2.36 manifest byte count drifted", errors);
    check(sha256(manifestBytes) === EXPECTED.fileSha256, "immutable 2.36 manifest file SHA-256 drifted", errors);
  }
  check(manifest.manifestContentSha256 === EXPECTED.contentSha256, "immutable 2.36 manifest content receipt drifted", errors);
  check(computeManifestContentSha256(manifest) === EXPECTED.contentSha256, "immutable 2.36 canonical content hash is invalid", errors);
  check(
    manifest.manifestSchemaVersion === "2.36.0"
      && manifest.releaseId === "ohri-mouse-interneuron-research-iteration-2.36.0"
      && manifest.releaseDate === "2026-09-02"
      && manifest.releaseStatus === "localhost_research_iteration"
      && manifest.application?.version === "2.36.0-research.1",
    "immutable 2.36 release identity changed",
    errors,
  );
  check(
    manifest.parentIterationManifest?.releaseId === "ohri-mouse-interneuron-research-iteration-2.35.0"
      && manifest.parentIterationManifest?.bytes === EXPECTED.parentBytes
      && manifest.parentIterationManifest?.fileSha256 === EXPECTED.parentFileSha256
      && manifest.parentIterationManifest?.contentSha256 === EXPECTED.parentContentSha256,
    "immutable 2.36 parent receipt changed",
    errors,
  );
  check(
    parentBytes.byteLength === EXPECTED.parentBytes
      && sha256(parentBytes) === EXPECTED.parentFileSha256
      && parent.manifestContentSha256 === EXPECTED.parentContentSha256
      && computeManifestContentSha256(parent) === EXPECTED.parentContentSha256,
    "immutable 2.35 parent file or content receipt drifted",
    errors,
  );

  check(manifest.integrity?.inputCount === 127 && manifest.authoritativeInputs?.length === 127, "immutable 2.36 input denominator changed", errors);
  check(new Set(manifest.authoritativeInputs?.map((input) => input.id)).size === 127, "immutable 2.36 input ids are not unique", errors);
  check(new Set(manifest.authoritativeInputs?.map((input) => input.path)).size === 127, "immutable 2.36 input paths are not unique", errors);
  const reference = manifest.exactReferences?.dmrt3Di6AndRecordUiIntegrity;
  check(reference?.contractId === "ohri-dmrt3-di6-and-record-ui-integrity-2.36", "immutable 2.36 reference identity changed", errors);
  check(
    reference?.canonicalSourceCount === 26
      && reference?.canonicalRecordSetCount === 30
      && reference?.sourceProfileCount === 168
      && reference?.sourceNamespaceCount === 7
      && reference?.researchExplorerRecordCount === 421
      && reference?.researchExplorerMolecularProfileCount === 168
      && reference?.researchExplorerSourceLaneCount === 7
      && reference?.knowledgeCoverageLaneCount === 7
      && reference?.knowledgeCoverageJudgmentCount === 49
      && reference?.researchUpgradeCount === 162
      && reference?.lastResearchUpgradeId === "UPG-180"
      && reference?.admittedGeometryCount === 0
      && reference?.admittedInternalStructureCount === 0
      && reference?.registrationCount === 0,
    "immutable 2.36 denominator or zero boundary changed",
    errors,
  );
  check(
    manifest.registrySummary?.canonicalSourcePackageCount === 26
      && manifest.registrySummary?.canonicalRecordSetCount === 30
      && manifest.registrySummary?.researchUpgradeCount === 162
      && manifest.registrySummary?.sourceProfileCount === 168
      && manifest.registrySummary?.sourceNamespaceCount === 7
      && manifest.registrySummary?.researchExplorerRecordCount === 421
      && manifest.registrySummary?.crossSourceIdentityCount === 0
      && manifest.registrySummary?.registrationCount === 0
      && manifest.registrySummary?.renderedInternalPrimitiveCount === 0,
    "immutable 2.36 registry denominator or zero boundary changed",
    errors,
  );
  check(manifest.registrations?.count === 0 && manifest.registrations?.records?.length === 0, "immutable 2.36 registration zero-claim changed", errors);
  check(!(manifest.authoritativeInputs ?? []).some((input) => input.path.includes("roome-dil")), "immutable 2.36 roster unexpectedly contains the 2.37 Roome contracts", errors);
  check(!(manifest.authoritativeInputs ?? []).some((input) => input.path.includes("research-focus-workspace-state")), "immutable 2.36 roster unexpectedly contains the 2.37 focus-workspace runtime", errors);

  if (errors.length > 0) throw new Error(`Research iteration 2.36 immutable snapshot validation failed:\n- ${errors.join("\n- ")}`);
  return {
    releaseId: manifest.releaseId,
    fileBytes: EXPECTED.bytes,
    fileSha256: EXPECTED.fileSha256,
    contentSha256: EXPECTED.contentSha256,
    inputCount: 127,
    researchUpgradeCount: 162,
    canonicalSourcePackageCount: 26,
    canonicalRecordSetCount: 30,
    sourceProfileCount: 168,
    researchExplorerRecordCount: 421,
    renderedInternalPrimitiveCount: 0,
    registrationCount: 0,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest236Snapshot()
    .then((result) => process.stdout.write(`Research iteration 2.36 immutable snapshot valid: ${JSON.stringify(result)}\n`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
