#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";

export const SNAPSHOT_246 = Object.freeze({
  path: "data/research-iteration-manifest-2.46.json",
  bytes: 286372,
  fileSha256: "ef34163d98c8d08ca89d29bc0c6e287111e387fa6c39e9db02e0457be6768ef2",
  contentSha256: "781bd12786feda0c4478e53137536123208df7e9edd50ff59723f2e0b710cbc3",
  inputCount: 327,
});

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest246Snapshot(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_246.path));
  const manifest = override ?? JSON.parse(bytes);
  if (bytes.byteLength !== SNAPSHOT_246.bytes || sha256(bytes) !== SNAPSHOT_246.fileSha256) throw new Error("Immutable 2.46 file receipt changed");
  if (manifest.manifestContentSha256 !== SNAPSHOT_246.contentSha256 || computeManifestContentSha256(manifest) !== SNAPSHOT_246.contentSha256) {
    throw new Error("Immutable 2.46 content receipt changed");
  }
  if (manifest.application.version !== "2.46.0-research.1" || manifest.integrity.inputCount !== SNAPSHOT_246.inputCount
    || manifest.authoritativeInputs.length !== SNAPSHOT_246.inputCount) throw new Error("Immutable 2.46 identity or input count changed");
  const parentBytes = await readFile(path.join(ROOT, manifest.parentIterationManifest.path));
  if (sha256(parentBytes) !== manifest.parentIterationManifest.fileSha256) throw new Error("Immutable 2.46 parent file changed");
  return { releaseId: manifest.releaseId, inputCount: SNAPSHOT_246.inputCount, manifest };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest246Snapshot()
    .then(({ releaseId, inputCount }) => console.log(JSON.stringify({ releaseId, inputCount })))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
