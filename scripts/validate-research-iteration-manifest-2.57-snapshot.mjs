#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_256, validateResearchIterationManifest256Snapshot } from "./validate-research-iteration-manifest-2.56-snapshot.mjs";

export const SNAPSHOT_257 = Object.freeze({
  path: "data/research-iteration-manifest-2.57.json",
  bytes: 366609,
  fileSha256: "1389886d52b748bf4b4abe970151a120b47a6175f999705ded98708855df2a4d",
  contentSha256: "3d783781ea4d60bc6379d7159afd1f7036dd1d122db438acc473c9b4be9a729f",
  inputCount: 458,
});

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest257Snapshot(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_257.path));
  const manifest = override ?? JSON.parse(bytes);
  if (bytes.byteLength !== SNAPSHOT_257.bytes || sha256(bytes) !== SNAPSHOT_257.fileSha256) throw new Error("Immutable 2.57 file receipt changed");
  if (manifest.manifestContentSha256 !== SNAPSHOT_257.contentSha256 || computeManifestContentSha256(manifest) !== SNAPSHOT_257.contentSha256) throw new Error("Immutable 2.57 content receipt changed");
  if (manifest.manifestSchemaVersion !== "2.57.0"
    || manifest.releaseId !== "ohri-mouse-interneuron-research-iteration-2.57.0"
    || manifest.application.version !== "2.57.0-research.1"
    || manifest.integrity.inputCount !== SNAPSHOT_257.inputCount
    || manifest.authoritativeInputs.length !== SNAPSHOT_257.inputCount) throw new Error("Immutable 2.57 identity or input count changed");

  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== SNAPSHOT_257.inputCount || paths.size !== ids.size) throw new Error("Immutable 2.57 input receipt uniqueness changed");
  for (const [id, inputPath] of [
    ["toddNativeContourTopologyAudit", "data/todd-native-contour-topology-audit-0.1.json"],
    ["iteration257Builder", "tools/build_research_iteration_manifest_2_57.mjs"],
    ["iteration257Validator", "scripts/validate-research-iteration-manifest-2.57.mjs"],
    ["iteration257Tests", "tests/research-iteration-manifest-2.57.test.mjs"],
    ["iteration257Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_57.md"],
  ]) {
    if (!manifest.authoritativeInputs.some((input) => input.id === id && input.scope === "project" && input.path === inputPath)) throw new Error(`Immutable 2.57 input receipt missing: ${id}`);
  }

  const parent = await validateResearchIterationManifest256Snapshot();
  const parentBytes = await readFile(path.join(ROOT, SNAPSHOT_256.path));
  if (manifest.parentIterationManifest.path !== SNAPSHOT_256.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_256.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_256.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_256.contentSha256
    || sha256(parentBytes) !== SNAPSHOT_256.fileSha256) throw new Error("Immutable 2.57 parent receipt changed");

  const registry = manifest.exactReferences.researchRegistryDenominators257;
  if (registry.canonicalSourcePackageCount !== 28
    || registry.canonicalRecordSetCount !== 37
    || registry.bundledExactCellProfileRosterCount !== 11
    || registry.bundledExactSourceObjectSetCount !== 2
    || registry.sourceProfileCount !== 387
    || registry.upgradeCount !== 213
    || registry.displayedUpgradeCount !== 30
    || registry.denominatorDisplayCount !== 8
    || registry.staleCanonicalDenominatorLiteralCount !== 0) throw new Error("Immutable 2.57 historical registry denominators changed");

  const topology = manifest.exactReferences.toddNativeContourTopologyAudit257;
  if (topology.auditId !== "ohri-todd-native-contour-topology-audit-0.1.0"
    || topology.sourceContourCount !== 19
    || topology.sourceVertexCount !== 1136
    || topology.transitionsHeld !== 8
    || topology.independentlyValidatedBiologicalTolerance !== false
    || topology.contourDerivedSurfaceAdmittedCount !== 0
    || topology.internalStructureObjectCount !== 0
    || topology.sameCellJoinCount !== 0
    || topology.crossSourceIdentityCount !== 0
    || topology.registrationCount !== 0) throw new Error("Immutable 2.57 Todd topology or no-geometry boundary changed");

  if (manifest.exactReferences.iteration257Layout.fullProjectCopyCount !== 0
    || manifest.exactReferences.iteration257Layout.rollbackParent !== SNAPSHOT_256.path
    || manifest.exactReferences.iteration257Layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_57.md"
    || manifest.registrySummary.researchUpgradeCount !== 213
    || manifest.registrySummary.canonicalSourcePackageCount !== 28
    || manifest.registrySummary.canonicalRecordSetCount !== 37
    || manifest.registrySummary.bundledExactRosterCount !== 11
    || manifest.registrySummary.bundledExactObjectSetCount !== 2) throw new Error("Immutable 2.57 rollback, no-copy or registry receipt changed");

  return {
    releaseId: manifest.releaseId,
    inputCount: SNAPSHOT_257.inputCount,
    parentReleaseId: parent.releaseId,
    researchUpgradeCount: registry.upgradeCount,
    sourceCount: registry.canonicalSourcePackageCount,
    recordSetCount: registry.canonicalRecordSetCount,
    toddSourceContourCount: topology.sourceContourCount,
    toddSourceVertexCount: topology.sourceVertexCount,
    toddHeldTransitions: topology.transitionsHeld,
    fullProjectCopyCount: manifest.exactReferences.iteration257Layout.fullProjectCopyCount,
    manifest,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest257Snapshot()
    .then(({ releaseId, inputCount, parentReleaseId, researchUpgradeCount }) => console.log(JSON.stringify({ releaseId, inputCount, parentReleaseId, researchUpgradeCount })))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
