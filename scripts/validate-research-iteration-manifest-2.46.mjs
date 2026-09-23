#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { buildResearchIterationManifest246, MANIFEST_246_PATH } from "../tools/build_research_iteration_manifest_2_46.mjs";

export async function validateResearchIterationManifest246(override = null) {
  const built = await buildResearchIterationManifest246();
  const bytes = await readFile(MANIFEST_246_PATH);
  const manifest = override ?? JSON.parse(bytes);
  if (override === null && !bytes.equals(built.bytes)) throw new Error("2.46 on-disk manifest differs from verified rebuild");
  if (computeManifestContentSha256(manifest) !== manifest.manifestContentSha256) throw new Error("2.46 content hash invalid");
  if (JSON.stringify(manifest) !== JSON.stringify(built.manifest)) throw new Error("2.46 evidence or input receipts differ from verified rebuild");
  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== manifest.integrity.inputCount || paths.size !== ids.size) throw new Error("Duplicate 2.46 input receipt");
  if (manifest.parentIterationManifest.releaseId !== "ohri-mouse-interneuron-research-iteration-2.45.0") throw new Error("2.46 parent must remain the sealed 2.45 release");
  const reference = manifest.exactReferences.davisIcrSameCellFigure246;
  if (reference.admittedProjectGeometryCount !== 0 || reference.sourceStackCount !== 0 || reference.activeRecordJoinCount !== 0 || reference.atlasRegistrationCount !== 0) {
    throw new Error("2.46 Davis figure reference gained geometry, source stack or atlas join");
  }
  if (reference.captionAssertedSameCellRelation.fromPanel !== "d" || JSON.stringify(reference.captionAssertedSameCellRelation.toPanels) !== JSON.stringify(["e", "f", "g"]) || reference.captionAssertedSameCellRelation.independentIdentityValidation !== false) {
    throw new Error("2.46 Davis same-cell relation exceeds the figure-caption assertion");
  }
  return { releaseId: manifest.releaseId, inputCount: ids.size, lastSealedParent: manifest.parentIterationManifest.releaseId };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest246()
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
