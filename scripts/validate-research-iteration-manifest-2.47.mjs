#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { buildResearchIterationManifest247, MANIFEST_247_PATH } from "../tools/build_research_iteration_manifest_2_47.mjs";

export async function validateResearchIterationManifest247(override = null) {
  const built = await buildResearchIterationManifest247();
  const bytes = await readFile(MANIFEST_247_PATH);
  const manifest = override ?? JSON.parse(bytes);
  if (override === null && !bytes.equals(built.bytes)) throw new Error("2.47 on-disk manifest differs from verified rebuild");
  if (computeManifestContentSha256(manifest) !== manifest.manifestContentSha256) throw new Error("2.47 content hash invalid");
  if (JSON.stringify(manifest) !== JSON.stringify(built.manifest)) throw new Error("2.47 evidence or input receipts differ from verified rebuild");
  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== manifest.integrity.inputCount || paths.size !== ids.size) throw new Error("Duplicate 2.47 input receipt");
  if (manifest.parentIterationManifest.releaseId !== "ohri-mouse-interneuron-research-iteration-2.46.0") throw new Error("2.47 parent must remain the sealed 2.46 release");
  const surface = manifest.exactReferences.nativeContourDerivedSomaSurface247;
  if (surface.neuronId !== 50394 || surface.sourceContourCount !== 14 || surface.sourceVertexCount !== 768
    || surface.rawSourceClosedFlags.falseCount !== 14 || surface.rawSourceClosedFlags.trueCount !== 0
    || surface.derivedVertexCount !== 1792 || surface.derivedTriangleCount !== 3328 || surface.observedSurfaceCount !== 0
    || surface.derivedDisplayOpenShellCount !== 1 || surface.openEndBoundaryLoopCount !== 2 || surface.volumeCount !== 0
    || surface.membraneClaimCount !== 0 || surface.internalStructureObjectCount !== 0 || surface.biologicalMeasurementCount !== 0
    || surface.sameCellJoinCount !== 0 || surface.registrationCount !== 0) {
    throw new Error("2.47 NMO 50394 derived-shell evidence or scope boundary changed");
  }
  if (surface.researchUpgradeId !== "UPG-194" || surface.researchUpgradeStatus !== "completed_for_NMO_50394_only"
    || surface.remainingContourReviewUpgradeId !== "UPG-220") throw new Error("2.47 contour-gate queue boundary changed");
  return {
    releaseId: manifest.releaseId,
    inputCount: ids.size,
    lastSealedParent: manifest.parentIterationManifest.releaseId,
    derivedDisplayOpenShellCount: surface.derivedDisplayOpenShellCount,
    internalStructureObjectCount: surface.internalStructureObjectCount,
    registrationCount: surface.registrationCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest247()
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
