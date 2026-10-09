#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_268, validateResearchIterationManifest268Snapshot } from "./validate-research-iteration-manifest-2.68-snapshot.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const SNAPSHOT_269 = Object.freeze({
  path: "data/research-iteration-manifest-2.69.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.69.0",
  version: "2.69.0-research.1",
  bytes: 575543,
  fileSha256: "91212f180df8aef6df51e5514612b90bf1d34bc944af222e37117f5b8bd098b0",
  contentSha256: "8c4abf605b3b68eacc6db082508d0b37882b8d0791d339780b7962a1b8245e4d",
  inputCount: 575,
});

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest269Snapshot(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_269.path));
  if (bytes.byteLength !== SNAPSHOT_269.bytes || sha256(bytes) !== SNAPSHOT_269.fileSha256) throw new Error("Immutable 2.69 manifest file receipt changed");
  const diskManifest = JSON.parse(bytes.toString("utf8"));
  const manifest = override ?? diskManifest;
  if (JSON.stringify(manifest) !== JSON.stringify(diskManifest)) throw new Error("Immutable 2.69 manifest override differs from its sealed file");
  const parent = await validateResearchIterationManifest268Snapshot();
  const audit = manifest.exactReferences.boundedMouseSpinalEmRepositorySearch243;
  const layout = manifest.exactReferences.iteration269Layout;
  if (computeManifestContentSha256(manifest) !== SNAPSHOT_269.contentSha256
    || manifest.manifestSchemaVersion !== "2.69.0"
    || manifest.releaseId !== SNAPSHOT_269.releaseId
    || manifest.application.version !== SNAPSHOT_269.version
    || manifest.integrity.inputCount !== SNAPSHOT_269.inputCount
    || manifest.authoritativeInputs.length !== SNAPSHOT_269.inputCount) throw new Error("Immutable 2.69 content or identity receipt changed");
  if (manifest.parentIterationManifest.path !== SNAPSHOT_268.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || audit.researchUpgradeId !== "UPG-243"
    || audit.downloadedPayloadBytes !== 0
    || audit.admittedVoxelVolumes !== 0
    || layout.fullProjectCopyCount !== 0
    || layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_69.md") throw new Error("Immutable 2.69 parent, no-admission or incremental-layout boundary changed");
  return {
    releaseId: manifest.releaseId,
    version: manifest.application.version,
    inputCount: manifest.integrity.inputCount,
    parentReleaseId: parent.releaseId,
    fileSha256: SNAPSHOT_269.fileSha256,
    contentSha256: SNAPSHOT_269.contentSha256,
    auditId: audit.auditId,
    fullProjectCopyCount: layout.fullProjectCopyCount,
    path: SNAPSHOT_269.path,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest269Snapshot()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
