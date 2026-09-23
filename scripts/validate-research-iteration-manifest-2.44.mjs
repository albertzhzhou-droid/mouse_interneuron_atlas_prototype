#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { buildResearchIterationManifest244, MANIFEST_244_PATH } from "../tools/build_research_iteration_manifest_2_44.mjs";

export async function validateResearchIterationManifest244(override = null) {
  const built = await buildResearchIterationManifest244();
  const bytes = await readFile(MANIFEST_244_PATH);
  const manifest = override ?? JSON.parse(bytes);
  if (override === null && !bytes.equals(built.bytes)) throw new Error("2.44 on-disk manifest differs from verified rebuild");
  if (computeManifestContentSha256(manifest) !== manifest.manifestContentSha256) throw new Error("2.44 content hash invalid");
  if (JSON.stringify(manifest) !== JSON.stringify(built.manifest)) throw new Error("2.44 evidence or input receipts differ from verified rebuild");
  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== manifest.integrity.inputCount || paths.size !== ids.size) throw new Error("Duplicate 2.44 input receipt");
  return { releaseId: manifest.releaseId, inputCount: ids.size, lastSealedParent: manifest.parentIterationManifest.releaseId };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest244()
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
