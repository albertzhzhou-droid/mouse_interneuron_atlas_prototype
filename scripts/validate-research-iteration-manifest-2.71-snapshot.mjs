#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_270, validateResearchIterationManifest270Snapshot } from "./validate-research-iteration-manifest-2.70-snapshot.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const SNAPSHOT_271 = Object.freeze({
  path: "data/research-iteration-manifest-2.71.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.71.0",
  version: "2.71.0-research.1",
  bytes: 590569,
  fileSha256: "345b889e3d0080f24757295456516d9d3c0da24b04eea343e76e36169840d404",
  contentSha256: "33e9553d84604f1aaf7a410bd95c8d47bc4d196939be4289d262c0c458514899",
  inputCount: 600,
});

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest271Snapshot(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_271.path));
  if (bytes.byteLength !== SNAPSHOT_271.bytes || sha256(bytes) !== SNAPSHOT_271.fileSha256) throw new Error("Immutable 2.71 manifest file receipt changed");
  const diskManifest = JSON.parse(bytes.toString("utf8"));
  const manifest = override ?? diskManifest;
  if (JSON.stringify(manifest) !== JSON.stringify(diskManifest)) throw new Error("Immutable 2.71 manifest override differs from its sealed file");
  const parent = await validateResearchIterationManifest270Snapshot();
  const coverage = manifest.exactReferences.neuromorphoTypeSourceDoiOverlap246;
  const denominators = manifest.exactReferences.researchRegistryDenominators271;
  const layout = manifest.exactReferences.iteration271Layout;
  if (computeManifestContentSha256(manifest) !== SNAPSHOT_271.contentSha256
    || manifest.manifestSchemaVersion !== "2.71.0"
    || manifest.releaseId !== SNAPSHOT_271.releaseId
    || manifest.application.version !== SNAPSHOT_271.version
    || manifest.integrity.inputCount !== SNAPSHOT_271.inputCount
    || manifest.authoritativeInputs.length !== SNAPSHOT_271.inputCount) throw new Error("Immutable 2.71 content or identity receipt changed");
  if (manifest.parentIterationManifest.path !== SNAPSHOT_270.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || denominators.canonicalSourcePackageCount !== 28
    || denominators.canonicalRecordSetCount !== 37
    || denominators.sourceProfileCount !== 387
    || denominators.upgradeCount !== 228
    || denominators.completedUpgradeCount !== 67
    || coverage.researchUpgradeId !== "UPG-246"
    || coverage.morphologyRelease !== "8.6.124"
    || coverage.morphologyQueryRecordCount !== 1097
    || coverage.taxonomySourceCount !== 10
    || coverage.sourceProfileCount !== 387
    || coverage.exactDoiMatchedRecordCount !== 0
    || coverage.identityJoins !== 0
    || coverage.geometryObjectsAdmitted !== 0
    || layout.fullProjectCopyCount !== 0
    || layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_71.md") throw new Error("Immutable 2.71 parent, source denominators, DOI audit or incremental-layout boundary changed");
  return {
    releaseId: manifest.releaseId,
    version: manifest.application.version,
    inputCount: manifest.integrity.inputCount,
    parentReleaseId: parent.releaseId,
    auditId: coverage.auditId,
    morphologyQueryRecordCount: coverage.morphologyQueryRecordCount,
    taxonomySourceCount: coverage.taxonomySourceCount,
    sourceProfileCount: coverage.sourceProfileCount,
    exactDoiMatchedRecords: coverage.exactDoiMatchedRecordCount,
    fullProjectCopyCount: layout.fullProjectCopyCount,
    path: SNAPSHOT_271.path,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest271Snapshot()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
