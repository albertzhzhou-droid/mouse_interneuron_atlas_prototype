#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";

export const SNAPSHOT_244 = Object.freeze({
  path: "data/research-iteration-manifest-2.44.json",
  bytes: 265128,
  fileSha256: "3eef31158a23d435af72b6e9791c337bc4c9109fb106510c8372229d56a7e853",
  contentSha256: "877265507c025af8e268fd668c42d0c1473f37502e3e48a2b031f78bd345d139",
  inputCount: 280,
});

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest244Snapshot(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_244.path));
  const manifest = override ?? JSON.parse(bytes);
  if (bytes.byteLength !== SNAPSHOT_244.bytes || sha256(bytes) !== SNAPSHOT_244.fileSha256) {
    throw new Error("Immutable 2.44 file receipt changed");
  }
  if (manifest.manifestContentSha256 !== SNAPSHOT_244.contentSha256 || computeManifestContentSha256(manifest) !== SNAPSHOT_244.contentSha256) {
    throw new Error("Immutable 2.44 content receipt changed");
  }
  if (manifest.application.version !== "2.44.0-research.1" || manifest.integrity.inputCount !== SNAPSHOT_244.inputCount || manifest.authoritativeInputs.length !== SNAPSHOT_244.inputCount) {
    throw new Error("Immutable 2.44 identity or input count changed");
  }
  const parentBytes = await readFile(path.join(ROOT, manifest.parentIterationManifest.path));
  if (sha256(parentBytes) !== manifest.parentIterationManifest.fileSha256) {
    throw new Error("Immutable 2.44 parent file changed");
  }
  return { releaseId: manifest.releaseId, inputCount: SNAPSHOT_244.inputCount, manifest };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest244Snapshot()
    .then(({ releaseId, inputCount }) => console.log(JSON.stringify({ releaseId, inputCount })))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
