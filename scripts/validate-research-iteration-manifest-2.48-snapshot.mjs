#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";

export const SNAPSHOT_248 = Object.freeze({
  path: "data/research-iteration-manifest-2.48.json",
  bytes: 300125,
  fileSha256: "74a6d8790408836ceab821598928c10a14699c6e293677b6deb3d24417834c16",
  contentSha256: "f2ea765df560baaf5e74ac0cd0035a2ea0243f34915633abbbc7041ddc33b1e3",
  inputCount: 351,
});

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest248Snapshot(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_248.path));
  const manifest = override ?? JSON.parse(bytes);
  if (bytes.byteLength !== SNAPSHOT_248.bytes || sha256(bytes) !== SNAPSHOT_248.fileSha256) {
    throw new Error("Immutable 2.48 file receipt changed");
  }
  if (manifest.manifestContentSha256 !== SNAPSHOT_248.contentSha256
    || computeManifestContentSha256(manifest) !== SNAPSHOT_248.contentSha256) {
    throw new Error("Immutable 2.48 content receipt changed");
  }
  if (manifest.releaseId !== "ohri-mouse-interneuron-research-iteration-2.48.0"
    || manifest.application.version !== "2.48.0-research.1"
    || manifest.integrity.inputCount !== SNAPSHOT_248.inputCount
    || manifest.authoritativeInputs.length !== SNAPSHOT_248.inputCount) {
    throw new Error("Immutable 2.48 identity or input count changed");
  }
  const parentBytes = await readFile(path.join(ROOT, manifest.parentIterationManifest.path));
  if (sha256(parentBytes) !== manifest.parentIterationManifest.fileSha256) {
    throw new Error("Immutable 2.48 parent file changed");
  }
  if (manifest.parentIterationManifest.releaseId !== "ohri-mouse-interneuron-research-iteration-2.47.0") {
    throw new Error("Immutable 2.48 parent identity changed");
  }
  return { releaseId: manifest.releaseId, inputCount: SNAPSHOT_248.inputCount, manifest };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest248Snapshot()
    .then(({ releaseId, inputCount }) => console.log(JSON.stringify({ releaseId, inputCount })))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
