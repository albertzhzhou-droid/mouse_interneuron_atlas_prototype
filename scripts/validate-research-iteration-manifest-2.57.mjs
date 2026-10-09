#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_256, validateResearchIterationManifest256Snapshot } from "./validate-research-iteration-manifest-2.56-snapshot.mjs";
import { INPUTS_257, MANIFEST_257_PATH, buildResearchIterationManifest257 } from "../tools/build_research_iteration_manifest_2_57.mjs";

export async function validateResearchIterationManifest257(override = null) {
  const built = await buildResearchIterationManifest257();
  const bytes = await readFile(MANIFEST_257_PATH);
  const manifest = override ?? JSON.parse(bytes);
  if (override === null && !bytes.equals(built.bytes)) throw new Error("2.57 on-disk manifest differs from verified rebuild");
  if (computeManifestContentSha256(manifest) !== manifest.manifestContentSha256) throw new Error("2.57 content hash invalid");
  if (JSON.stringify(manifest) !== JSON.stringify(built.manifest)) throw new Error("2.57 evidence or input receipts differ from verified rebuild");

  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== manifest.integrity.inputCount || paths.size !== ids.size) throw new Error("Duplicate 2.57 input receipt");
  for (const [id, inputPath] of INPUTS_257) {
    if (!manifest.authoritativeInputs.some((input) => input.id === id && input.scope === "project" && input.path === inputPath)) throw new Error(`2.57 exact input receipt missing: ${id}`);
  }

  const parent = await validateResearchIterationManifest256Snapshot();
  if (manifest.parentIterationManifest.path !== SNAPSHOT_256.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_256.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_256.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_256.contentSha256) throw new Error("2.57 parent must remain the sealed 2.56 release");

  const registry = manifest.exactReferences.researchRegistryDenominators257;
  if (registry.canonicalSourcePackageCount !== 28
    || registry.canonicalRecordSetCount !== 37
    || registry.bundledExactCellProfileRosterCount !== 11
    || registry.bundledExactSourceObjectSetCount !== 2
    || registry.sourceProfileCount !== 387
    || registry.upgradeCount !== 213
    || registry.displayedUpgradeCount !== 30
    || registry.denominatorDisplayCount !== 8
    || registry.staleCanonicalDenominatorLiteralCount !== 0) throw new Error("2.57 live research-registry denominators changed");

  const topology = manifest.exactReferences.toddNativeContourTopologyAudit257;
  if (topology.auditId !== "ohri-todd-native-contour-topology-audit-0.1.0"
    || JSON.stringify(topology.auditedNeuronIds) !== JSON.stringify([50424, 50408])
    || topology.sourceContourCount !== 19
    || topology.sourceVertexCount !== 1136
    || topology.selfIntersectingContourCount !== 2
    || topology.zeroLengthSourceEdgeCount !== 1
    || topology.adjacentTransitionCount !== 17
    || topology.transitionsWithinExploratoryScreen !== 9
    || topology.transitionsHeld !== 8
    || topology.nmo50424.contourCount !== 8
    || topology.nmo50424.vertexCount !== 427
    || topology.nmo50424.transitionsWithinExploratoryScreen !== 5
    || topology.nmo50424.transitionsHeld !== 2
    || topology.nmo50408.contourCount !== 11
    || topology.nmo50408.vertexCount !== 709
    || topology.nmo50408.transitionsWithinExploratoryScreen !== 4
    || topology.nmo50408.transitionsHeld !== 6
    || topology.referenceScreenRecord !== "NeuroMorpho:50394"
    || topology.independentlyValidatedBiologicalTolerance !== false
    || topology.contourDerivedSurfaceAdmittedCount !== 0
    || topology.admittedTriangleCount !== 0
    || topology.internalStructureObjectCount !== 0
    || topology.sameCellJoinCount !== 0
    || topology.crossSourceIdentityCount !== 0
    || topology.registrationCount !== 0
    || topology.researchUpgradeId !== "UPG-220") throw new Error("2.57 Todd topology, exploratory-threshold or no-geometry boundary changed");

  if (manifest.exactReferences.iteration257Layout.fullProjectCopyCount !== 0
    || manifest.exactReferences.iteration257Layout.rollbackParent !== SNAPSHOT_256.path
    || manifest.exactReferences.iteration257Layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_57.md"
    || manifest.registrySummary.researchUpgradeCount !== 213
    || manifest.registrySummary.canonicalSourcePackageCount !== 28
    || manifest.registrySummary.canonicalRecordSetCount !== 37
    || manifest.registrySummary.bundledExactRosterCount !== 11
    || manifest.registrySummary.bundledExactObjectSetCount !== 2) throw new Error("2.57 rollback, no-copy or current registry receipt changed");

  return {
    releaseId: manifest.releaseId,
    inputCount: ids.size,
    parentReleaseId: parent.releaseId,
    researchUpgradeCount: registry.upgradeCount,
    sourceCount: registry.canonicalSourcePackageCount,
    recordSetCount: registry.canonicalRecordSetCount,
    toddSourceContourCount: topology.sourceContourCount,
    toddSourceVertexCount: topology.sourceVertexCount,
    toddHeldTransitions: topology.transitionsHeld,
    contourDerivedSurfaceAdmittedCount: topology.contourDerivedSurfaceAdmittedCount,
    fullProjectCopyCount: manifest.exactReferences.iteration257Layout.fullProjectCopyCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest257()
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
