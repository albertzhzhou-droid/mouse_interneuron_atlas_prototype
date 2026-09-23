#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { buildResearchIterationManifest245 } from "../tools/build_research_iteration_manifest_2_45.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_245_PATH = path.join(ROOT, "data/research-iteration-manifest-2.45.json");

export async function validateResearchIterationManifest245(override = null) {
  const built = await buildResearchIterationManifest245();
  const bytes = await readFile(MANIFEST_245_PATH);
  const manifest = override ?? JSON.parse(bytes);
  if (override === null && !bytes.equals(built.bytes)) throw new Error("2.45 on-disk manifest differs from verified rebuild");
  if (computeManifestContentSha256(manifest) !== manifest.manifestContentSha256) throw new Error("2.45 content hash invalid");
  if (JSON.stringify(manifest) !== JSON.stringify(built.manifest)) throw new Error("2.45 evidence or input receipts differ from verified rebuild");
  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== manifest.integrity.inputCount || paths.size !== ids.size) throw new Error("Duplicate 2.45 input receipt");
  if (manifest.parentIterationManifest.releaseId !== "ohri-mouse-interneuron-research-iteration-2.44.0") throw new Error("2.45 parent must remain the sealed 2.44 release");
  if (manifest.exactReferences.superClemDorsalSynapse1SerialStack245.admittedProjectGeometryCount !== 0 || manifest.exactReferences.superClemDorsalSynapse1SerialStack245.selectedAtlasRecordJoinCount !== 0) throw new Error("2.45 stack receipt gained project geometry or an atlas join");
  return { releaseId: manifest.releaseId, inputCount: ids.size, lastSealedParent: manifest.parentIterationManifest.releaseId };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest245()
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
