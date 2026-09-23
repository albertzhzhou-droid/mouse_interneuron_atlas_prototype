#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";

export const SNAPSHOT_243 = Object.freeze({
  path: "data/research-iteration-manifest-2.43.json",
  bytes: 261157,
  fileSha256: "fc021d7f2eb18a51d77a8d8a90732dae700feab66ffd8c12d74246dbcfcdc767",
  contentSha256: "e4f8432f8bc0d8adaa5690c05794a5953f672fa99bdf54852d9ead703fb8a1be",
  inputCount: 271,
});

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest243Snapshot(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_243.path));
  const manifest = override ?? JSON.parse(bytes);
  if (bytes.byteLength !== SNAPSHOT_243.bytes || sha256(bytes) !== SNAPSHOT_243.fileSha256) {
    throw new Error("Immutable 2.43 file receipt changed");
  }
  if (manifest.manifestContentSha256 !== SNAPSHOT_243.contentSha256 || computeManifestContentSha256(manifest) !== SNAPSHOT_243.contentSha256) {
    throw new Error("Immutable 2.43 content receipt changed");
  }
  if (manifest.application.version !== "2.43.0-research.1" || manifest.integrity.inputCount !== SNAPSHOT_243.inputCount || manifest.authoritativeInputs.length !== SNAPSHOT_243.inputCount) {
    throw new Error("Immutable 2.43 identity or input count changed");
  }
  const parentBytes = await readFile(path.join(ROOT, manifest.parentIterationManifest.path));
  if (sha256(parentBytes) !== manifest.parentIterationManifest.fileSha256) {
    throw new Error("Immutable 2.43 parent file changed");
  }
  return { releaseId: manifest.releaseId, inputCount: SNAPSHOT_243.inputCount, manifest };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest243Snapshot()
    .then(({ releaseId, inputCount }) => console.log(JSON.stringify({ releaseId, inputCount })))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
