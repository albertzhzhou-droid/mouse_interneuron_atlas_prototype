#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const SNAPSHOT_267 = Object.freeze({
  path: "data/research-iteration-manifest-2.67.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.67.0",
  version: "2.67.0-research.1",
  bytes: 562869,
  fileSha256: "b5cbc7623c1f8baff23898ade0a821c2030541518942157cd725e20ca2ec6ff9",
  contentSha256: "fb52ea1112f40af435223f2c7730882a7cf4ae2b87cdebfe7275602c722b39ae",
  inputCount: 554,
});

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest267Snapshot(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_267.path));
  if (bytes.byteLength !== SNAPSHOT_267.bytes || sha256(bytes) !== SNAPSHOT_267.fileSha256) {
    throw new Error("Immutable 2.67 manifest file receipt changed");
  }
  const diskManifest = JSON.parse(bytes.toString("utf8"));
  const manifest = override ?? diskManifest;
  if (JSON.stringify(manifest) !== JSON.stringify(diskManifest)) throw new Error("Immutable 2.67 manifest override differs from its sealed file");
  if (computeManifestContentSha256(manifest) !== SNAPSHOT_267.contentSha256
    || manifest.manifestSchemaVersion !== "2.67.0"
    || manifest.releaseId !== SNAPSHOT_267.releaseId
    || manifest.application.version !== SNAPSHOT_267.version
    || manifest.integrity.inputCount !== SNAPSHOT_267.inputCount
    || manifest.authoritativeInputs.length !== SNAPSHOT_267.inputCount) {
    throw new Error("Immutable 2.67 content or identity receipt changed");
  }
  const queue = manifest.exactReferences.openMouseSpinalEmSearch243;
  const layout = manifest.exactReferences.iteration267Layout;
  if (queue.researchUpgradeId !== "UPG-243" || queue.candidateVolumesAdmitted !== 0
    || queue.segmentationObjectsAdmitted !== 0 || queue.exactInterneuronObjectCrosswalksAdmitted !== 0
    || queue.registrations !== 0 || queue.measurements !== 0
    || layout.fullProjectCopyCount !== 0
    || layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_67.md") {
    throw new Error("Immutable 2.67 source and no-copy boundary changed");
  }
  return {
    releaseId: manifest.releaseId,
    version: manifest.application.version,
    inputCount: manifest.integrity.inputCount,
    fileSha256: SNAPSHOT_267.fileSha256,
    contentSha256: SNAPSHOT_267.contentSha256,
    openEmAdmissions: queue.candidateVolumesAdmitted + queue.segmentationObjectsAdmitted,
    fullProjectCopyCount: layout.fullProjectCopyCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest267Snapshot()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
