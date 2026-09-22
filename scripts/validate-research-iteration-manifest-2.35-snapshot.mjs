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
const MANIFEST_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.35.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/research-iteration-manifest-2.35.schema.json");
const PARENT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.34.json");

const EXPECTED = Object.freeze({
  bytes: 134630,
  fileSha256: "71f90cfc2c6ad2c6f74146d1992493fc77229c131764faff83657dcada797dc1",
  contentSha256: "0691b27bd2cd46e0d96d9a8862ff8478819572f7cfde225d20b9d9c93aeff828",
  parentBytes: 125197,
  parentFileSha256: "76ead4e29455c8e9250f294afa4e78b6a72bb76709115d15954564545bb43d1e",
  parentContentSha256: "266ee889a591368d30b655ee059659485e746df424f448a85a6819d28e3e920c",
});

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

export async function validateResearchIterationManifest235Snapshot(override = null) {
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
    check(manifestBytes.byteLength === EXPECTED.bytes, "immutable 2.35 manifest byte count drifted", errors);
    check(sha256(manifestBytes) === EXPECTED.fileSha256, "immutable 2.35 manifest file SHA-256 drifted", errors);
  }
  check(manifest.manifestContentSha256 === EXPECTED.contentSha256, "immutable 2.35 manifest content receipt drifted", errors);
  check(computeManifestContentSha256(manifest) === EXPECTED.contentSha256, "immutable 2.35 canonical content hash is invalid", errors);
  check(
    manifest.manifestSchemaVersion === "2.35.0"
      && manifest.releaseId === "ohri-mouse-interneuron-research-iteration-2.35.0"
      && manifest.releaseDate === "2026-09-01"
      && manifest.releaseStatus === "localhost_research_iteration"
      && manifest.application?.name === "ohri-mouse-interneuron-atlas-prototype"
      && manifest.application?.version === "2.35.0-research.1",
    "immutable 2.35 release identity changed",
    errors,
  );

  check(
    manifest.parentIterationManifest?.releaseId === "ohri-mouse-interneuron-research-iteration-2.34.0"
      && manifest.parentIterationManifest?.bytes === EXPECTED.parentBytes
      && manifest.parentIterationManifest?.fileSha256 === EXPECTED.parentFileSha256
      && manifest.parentIterationManifest?.contentSha256 === EXPECTED.parentContentSha256,
    "immutable 2.35 parent receipt changed",
    errors,
  );
  check(
    parentBytes.byteLength === EXPECTED.parentBytes
      && sha256(parentBytes) === EXPECTED.parentFileSha256
      && parent.manifestContentSha256 === EXPECTED.parentContentSha256
      && computeManifestContentSha256(parent) === EXPECTED.parentContentSha256,
    "immutable 2.34 parent file or content receipt drifted",
    errors,
  );

  check(manifest.integrity?.inputCount === 113 && manifest.authoritativeInputs?.length === 113, "immutable 2.35 input denominator changed", errors);
  check(new Set(manifest.authoritativeInputs?.map((input) => input.id)).size === 113, "immutable 2.35 input ids are not unique", errors);
  check(new Set(manifest.authoritativeInputs?.map((input) => input.path)).size === 113, "immutable 2.35 input paths are not unique", errors);

  const reference = manifest.exactReferences?.crozatPkd2l1FunctionalProfileIntegrity;
  check(reference?.contractId === "ohri-crozat-pkd2l1-functional-profile-integrity-2.35", "immutable 2.35 Crozat contract identity changed", errors);
  check(
    reference?.canonicalSourceCount === 25
      && reference?.canonicalRecordSetCount === 29
      && reference?.sourceProfileCount === 162
      && reference?.sourceNamespaceCount === 6
      && reference?.researchExplorerRecordCount === 414
      && reference?.researchExplorerMolecularProfileCount === 162
      && reference?.quarantinedConflictCount === 4
      && reference?.admittedGeometryCount === 0
      && reference?.sameCellCrossModalJoinCount === 0
      && reference?.sameSpecimenInternalStructureCount === 0
      && reference?.projectCopyCount === 0
      && reference?.packageCopyCount === 0,
    "immutable 2.35 Crozat denominator or zero boundary changed",
    errors,
  );
  check(
    manifest.registrySummary?.canonicalSourcePackageCount === 25
      && manifest.registrySummary?.canonicalRecordSetCount === 29
      && manifest.registrySummary?.researchUpgradeCount === 158
      && manifest.registrySummary?.sourceProfileCount === 162
      && manifest.registrySummary?.sourceNamespaceCount === 6
      && manifest.registrySummary?.researchExplorerRecordCount === 414
      && manifest.registrySummary?.crossSourceIdentityCount === 0
      && manifest.registrySummary?.registrationCount === 0
      && manifest.registrySummary?.renderedInternalPrimitiveCount === 0,
    "immutable 2.35 registry denominator or zero boundary changed",
    errors,
  );
  check(manifest.registrations?.count === 0 && manifest.registrations?.records?.length === 0, "immutable 2.35 registration zero-claim changed", errors);
  check(
    !(manifest.authoritativeInputs ?? []).some((input) => input.path.includes("dmrt3-di6")),
    "immutable 2.35 roster unexpectedly contains the 2.36 Dmrt3 contract",
    errors,
  );

  if (errors.length > 0) {
    throw new Error(`Research iteration 2.35 immutable snapshot validation failed:\n- ${errors.join("\n- ")}`);
  }
  return {
    releaseId: manifest.releaseId,
    fileBytes: EXPECTED.bytes,
    fileSha256: EXPECTED.fileSha256,
    contentSha256: EXPECTED.contentSha256,
    inputCount: 113,
    researchUpgradeCount: 158,
    canonicalSourcePackageCount: 25,
    canonicalRecordSetCount: 29,
    sourceProfileCount: 162,
    researchExplorerRecordCount: 414,
    renderedInternalPrimitiveCount: 0,
    registrationCount: 0,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest235Snapshot()
    .then((result) => process.stdout.write(`Research iteration 2.35 immutable snapshot valid: ${JSON.stringify(result)}\n`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
