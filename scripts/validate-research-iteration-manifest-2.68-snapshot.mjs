#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_267, validateResearchIterationManifest267Snapshot } from "./validate-research-iteration-manifest-2.67-snapshot.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const SNAPSHOT_268 = Object.freeze({
  path: "data/research-iteration-manifest-2.68.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.68.0",
  version: "2.68.0-research.1",
  bytes: 568898,
  fileSha256: "2f633f70a2d51f2735341929671e63b19425f5baa3d4bf43c974c59800e099d6",
  contentSha256: "5a111c661ba953adbc0e69ba447dc328d844ea96639ab3a53874fb9d7daaf66b",
  inputCount: 564,
});

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest268Snapshot(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_268.path));
  if (bytes.byteLength !== SNAPSHOT_268.bytes || sha256(bytes) !== SNAPSHOT_268.fileSha256) throw new Error("Immutable 2.68 manifest file receipt changed");
  const diskManifest = JSON.parse(bytes.toString("utf8"));
  const manifest = override ?? diskManifest;
  if (JSON.stringify(manifest) !== JSON.stringify(diskManifest)) throw new Error("Immutable 2.68 manifest override differs from its sealed file");
  const parent = await validateResearchIterationManifest267Snapshot();
  const audit = manifest.exactReferences.bilXeniumSpatialAudit244;
  const layout = manifest.exactReferences.iteration268Layout;
  if (computeManifestContentSha256(manifest) !== SNAPSHOT_268.contentSha256
    || manifest.manifestSchemaVersion !== "2.68.0"
    || manifest.releaseId !== SNAPSHOT_268.releaseId
    || manifest.application.version !== SNAPSHOT_268.version
    || manifest.integrity.inputCount !== SNAPSHOT_268.inputCount
    || manifest.authoritativeInputs.length !== SNAPSHOT_268.inputCount) throw new Error("Immutable 2.68 content or identity receipt changed");
  if (manifest.parentIterationManifest.path !== SNAPSHOT_267.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || audit.researchUpgradeId !== "UPG-244"
    || audit.payloadBytesDownloaded !== 0
    || audit.admittedThreeDimensionalCellObjects !== 0
    || layout.fullProjectCopyCount !== 0
    || layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_68.md") throw new Error("Immutable 2.68 parent, Xenium no-admission or incremental-layout boundary changed");
  return {
    releaseId: manifest.releaseId,
    version: manifest.application.version,
    inputCount: manifest.integrity.inputCount,
    parentReleaseId: parent.releaseId,
    fileSha256: SNAPSHOT_268.fileSha256,
    contentSha256: SNAPSHOT_268.contentSha256,
    xeniumAudit: audit.researchUpgradeId,
    admitted3DCellObjects: audit.admittedThreeDimensionalCellObjects,
    fullProjectCopyCount: layout.fullProjectCopyCount,
    path: SNAPSHOT_268.path,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest268Snapshot()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
