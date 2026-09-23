#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";

export const SNAPSHOT_247 = Object.freeze({
  path: "data/research-iteration-manifest-2.47.json",
  bytes: 295242,
  fileSha256: "1c118688b14b094e79f2641f268e3a2ce4c2dd10bac360322c4cbf3ea9359c8f",
  contentSha256: "d608b72d70a658c3c667cfc56861d342df47349e1b66d373fc36033c5803008f",
  inputCount: 342,
});

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest247Snapshot(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_247.path));
  const manifest = override ?? JSON.parse(bytes);
  if (bytes.byteLength !== SNAPSHOT_247.bytes || sha256(bytes) !== SNAPSHOT_247.fileSha256) {
    throw new Error("Immutable 2.47 file receipt changed");
  }
  if (manifest.manifestContentSha256 !== SNAPSHOT_247.contentSha256
    || computeManifestContentSha256(manifest) !== SNAPSHOT_247.contentSha256) {
    throw new Error("Immutable 2.47 content receipt changed");
  }
  if (manifest.application.version !== "2.47.0-research.1"
    || manifest.integrity.inputCount !== SNAPSHOT_247.inputCount
    || manifest.authoritativeInputs.length !== SNAPSHOT_247.inputCount) {
    throw new Error("Immutable 2.47 identity or input count changed");
  }
  const parentBytes = await readFile(path.join(ROOT, manifest.parentIterationManifest.path));
  if (sha256(parentBytes) !== manifest.parentIterationManifest.fileSha256) {
    throw new Error("Immutable 2.47 parent file changed");
  }
  if (manifest.parentIterationManifest.releaseId !== "ohri-mouse-interneuron-research-iteration-2.46.0") {
    throw new Error("Immutable 2.47 parent identity changed");
  }
  return { releaseId: manifest.releaseId, inputCount: SNAPSHOT_247.inputCount, manifest };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest247Snapshot()
    .then(({ releaseId, inputCount }) => console.log(JSON.stringify({ releaseId, inputCount })))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
