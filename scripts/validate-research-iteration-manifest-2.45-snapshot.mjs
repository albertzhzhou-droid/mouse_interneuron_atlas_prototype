#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";

export const SNAPSHOT_245 = Object.freeze({
  path: "data/research-iteration-manifest-2.45.json",
  bytes: 279746,
  fileSha256: "9459ae104b7330295f6fbbcda5210f5615dda7d0e778cdb42bb7e8aeb41e269c",
  contentSha256: "193844378da13817fd6d0914d476716e6fe9f79d68f88d0f91d58ec831795848",
  inputCount: 314,
});

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest245Snapshot(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_245.path));
  const manifest = override ?? JSON.parse(bytes);
  if (bytes.byteLength !== SNAPSHOT_245.bytes || sha256(bytes) !== SNAPSHOT_245.fileSha256) {
    throw new Error("Immutable 2.45 file receipt changed");
  }
  if (manifest.manifestContentSha256 !== SNAPSHOT_245.contentSha256 || computeManifestContentSha256(manifest) !== SNAPSHOT_245.contentSha256) {
    throw new Error("Immutable 2.45 content receipt changed");
  }
  if (manifest.application.version !== "2.45.0-research.1" || manifest.integrity.inputCount !== SNAPSHOT_245.inputCount || manifest.authoritativeInputs.length !== SNAPSHOT_245.inputCount) {
    throw new Error("Immutable 2.45 identity or input count changed");
  }
  const parentBytes = await readFile(path.join(ROOT, manifest.parentIterationManifest.path));
  if (sha256(parentBytes) !== manifest.parentIterationManifest.fileSha256) {
    throw new Error("Immutable 2.45 parent file changed");
  }
  return { releaseId: manifest.releaseId, inputCount: SNAPSHOT_245.inputCount, manifest };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest245Snapshot()
    .then(({ releaseId, inputCount }) => console.log(JSON.stringify({ releaseId, inputCount })))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
