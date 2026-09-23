#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { buildResearchIterationManifest248, MANIFEST_248_PATH } from "../tools/build_research_iteration_manifest_2_48.mjs";

export async function validateResearchIterationManifest248(override = null) {
  const built = await buildResearchIterationManifest248();
  const bytes = await readFile(MANIFEST_248_PATH);
  const manifest = override ?? JSON.parse(bytes);
  if (override === null && !bytes.equals(built.bytes)) throw new Error("2.48 on-disk manifest differs from verified rebuild");
  if (computeManifestContentSha256(manifest) !== manifest.manifestContentSha256) throw new Error("2.48 content hash invalid");
  if (JSON.stringify(manifest) !== JSON.stringify(built.manifest)) throw new Error("2.48 evidence or input receipts differ from verified rebuild");
  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== manifest.integrity.inputCount || paths.size !== ids.size) throw new Error("Duplicate 2.48 input receipt");
  if (manifest.parentIterationManifest.releaseId !== "ohri-mouse-interneuron-research-iteration-2.47.0") throw new Error("2.48 parent must remain the sealed 2.47 release");
  const reference = manifest.exactReferences.bancV888ComparativeInternalReference248;
  if (reference.materializationId !== "v888" || reference.metadataRowCount !== 188162
    || reference.metadataRowUnit !== "one row per segment; not an interneuron denominator"
    || reference.sourceSpecies !== "Drosophila melanogaster" || reference.specimenCount !== 1
    || reference.selectedVncInterneuronRootId !== null || reference.sourceObjectsImported !== 0
    || reference.cellMeshesAdmitted !== 0 || reference.nucleusObjectsAdmitted !== 0
    || reference.mitochondriaObjectsAdmitted !== 0 || reference.synapseObjectsAdmitted !== 0
    || reference.sameCellJoinCount !== 0 || reference.registrationCount !== 0 || reference.renderedGeometryCount !== 0) {
    throw new Error("2.48 BANC source availability or no-geometry boundary changed");
  }
  if (reference.mitochondriaSourceAvailability !== "source_documentation_conflict"
    || reference.nextExactCellGateUpgradeId !== "UPG-221" || reference.researchUpgradeLastId !== "UPG-221") {
    throw new Error("2.48 BANC release discrepancy or queue boundary changed");
  }
  return {
    releaseId: manifest.releaseId,
    inputCount: ids.size,
    lastSealedParent: manifest.parentIterationManifest.releaseId,
    metadataRowCount: reference.metadataRowCount,
    renderedGeometryCount: reference.renderedGeometryCount,
    sameCellJoinCount: reference.sameCellJoinCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest248()
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
