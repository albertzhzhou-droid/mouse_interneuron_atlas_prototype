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
const MANIFEST_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.38.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/research-iteration-manifest-2.38.schema.json");
const PARENT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.37.json");

const EXPECTED = Object.freeze({
  bytes: 173397,
  fileSha256: "97ef72ab7e7c2da802af7c4cca6d5a280162e61a08b4a2258bb58f1ee0107595",
  contentSha256: "8af86d1167213865712c5da915193c13b629d31a1e0452f08d2d4f4f9d9f3b19",
  parentBytes: 161281,
  parentFileSha256: "2ddc5b4cce26cbe5db492234446a52f3c0f182c0ff0ed896104ec6a9c4fb3b08",
  parentContentSha256: "04b6f7a09968489afa420edb527a159e04f4dc07bab4ce402e394808256ca765",
});

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

export async function validateResearchIterationManifest238Snapshot(override = null) {
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
    check(manifestBytes.byteLength === EXPECTED.bytes, "immutable 2.38 manifest byte count drifted", errors);
    check(sha256(manifestBytes) === EXPECTED.fileSha256, "immutable 2.38 manifest file SHA-256 drifted", errors);
  }
  check(manifest.manifestContentSha256 === EXPECTED.contentSha256, "immutable 2.38 manifest content receipt drifted", errors);
  check(computeManifestContentSha256(manifest) === EXPECTED.contentSha256, "immutable 2.38 canonical content hash is invalid", errors);
  check(
    manifest.manifestSchemaVersion === "2.38.0"
      && manifest.releaseId === "ohri-mouse-interneuron-research-iteration-2.38.0"
      && manifest.releaseDate === "2026-09-02"
      && manifest.releaseStatus === "localhost_research_iteration"
      && manifest.application?.version === "2.38.0-research.1",
    "immutable 2.38 release identity changed",
    errors,
  );
  check(
    manifest.parentIterationManifest?.releaseId === "ohri-mouse-interneuron-research-iteration-2.37.0"
      && manifest.parentIterationManifest?.bytes === EXPECTED.parentBytes
      && manifest.parentIterationManifest?.fileSha256 === EXPECTED.parentFileSha256
      && manifest.parentIterationManifest?.contentSha256 === EXPECTED.parentContentSha256,
    "immutable 2.38 parent receipt changed",
    errors,
  );
  check(
    parentBytes.byteLength === EXPECTED.parentBytes
      && sha256(parentBytes) === EXPECTED.parentFileSha256
      && parent.manifestContentSha256 === EXPECTED.parentContentSha256
      && computeManifestContentSha256(parent) === EXPECTED.parentContentSha256,
    "immutable 2.37 parent file or content receipt drifted",
    errors,
  );

  check(manifest.integrity?.inputCount === 159 && manifest.authoritativeInputs?.length === 159, "immutable 2.38 input denominator changed", errors);
  check(new Set(manifest.authoritativeInputs?.map((input) => input.id)).size === 159, "immutable 2.38 input ids are not unique", errors);
  check(new Set(manifest.authoritativeInputs?.map((input) => input.path)).size === 159, "immutable 2.38 input paths are not unique", errors);

  const reference = manifest.exactReferences?.delilePresentationAndPkd2l1Integrity;
  check(reference?.contractId === "ohri-delile-presentation-pkd2l1-integrity-2.38", "immutable 2.38 reference identity changed", errors);
  check(
    reference?.canonicalSourceCount === 27
      && reference?.canonicalRecordSetCount === 32
      && reference?.bundledExactRosterCount === 9
      && reference?.sourceProfileCount === 376
      && reference?.sourceNamespaceCount === 9
      && reference?.researchExplorerRecordCount === 630
      && reference?.researchExplorerMolecularProfileCount === 376
      && reference?.researchExplorerSourceLaneCount === 8
      && reference?.researchExplorerSourceFileCount === 20
      && reference?.delileFineSubtypeCount === 51
      && reference?.delileFineSubtypeCellCount === 15217
      && reference?.researchUpgradeCount === 171
      && reference?.lastResearchUpgradeId === "UPG-189"
      && reference?.admittedGeometryCount === 0
      && reference?.admittedInternalStructureCount === 0
      && reference?.generatedFallbackPrimitiveCount === 0
      && reference?.registrationCount === 0
      && reference?.sameCellCrossModalJoinCount === 0,
    "immutable 2.38 denominator or zero boundary changed",
    errors,
  );
  check(
    manifest.registrySummary?.canonicalSourcePackageCount === 27
      && manifest.registrySummary?.canonicalRecordSetCount === 32
      && manifest.registrySummary?.bundledExactRosterCount === 9
      && manifest.registrySummary?.researchUpgradeCount === 171
      && manifest.registrySummary?.sourceProfileCount === 376
      && manifest.registrySummary?.sourceNamespaceCount === 9
      && manifest.registrySummary?.researchExplorerRecordCount === 630
      && manifest.registrySummary?.crossSourceIdentityCount === 0
      && manifest.registrySummary?.registrationCount === 0
      && manifest.registrySummary?.renderedInternalPrimitiveCount === 0,
    "immutable 2.38 registry denominator or zero boundary changed",
    errors,
  );
  check(manifest.registrations?.count === 0 && manifest.registrations?.records?.length === 0, "immutable 2.38 registration zero-claim changed", errors);
  check((manifest.authoritativeInputs ?? []).some((input) => input.path === "data/delile-developmental-interneuron-taxonomy-0.1.json"), "immutable 2.38 roster lost the Delile taxonomy contract", errors);
  check((manifest.authoritativeInputs ?? []).some((input) => input.path === "data/pkd2l1-sbfsem-video-reference-0.1.json"), "immutable 2.38 roster lost the PKD2L1 video contract", errors);
  check((manifest.authoritativeInputs ?? []).some((input) => input.path === "app/research-record-presentation.js"), "immutable 2.38 roster lost the record-presentation runtime", errors);

  if (errors.length > 0) throw new Error(`Research iteration 2.38 immutable snapshot validation failed:\n- ${errors.join("\n- ")}`);
  return {
    releaseId: manifest.releaseId,
    fileBytes: EXPECTED.bytes,
    fileSha256: EXPECTED.fileSha256,
    contentSha256: EXPECTED.contentSha256,
    inputCount: 159,
    researchUpgradeCount: 171,
    canonicalSourcePackageCount: 27,
    canonicalRecordSetCount: 32,
    bundledExactRosterCount: 9,
    sourceProfileCount: 376,
    sourceNamespaceCount: 9,
    researchExplorerRecordCount: 630,
    admittedGeometryCount: 0,
    admittedInternalStructureCount: 0,
    renderedInternalPrimitiveCount: 0,
    registrationCount: 0,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest238Snapshot()
    .then((result) => process.stdout.write(`Research iteration 2.38 immutable snapshot valid: ${JSON.stringify(result)}\n`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
