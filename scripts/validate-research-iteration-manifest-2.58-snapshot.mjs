#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_257, validateResearchIterationManifest257Snapshot } from "./validate-research-iteration-manifest-2.57-snapshot.mjs";

export const SNAPSHOT_258 = Object.freeze({
  path: "data/research-iteration-manifest-2.58.json",
  bytes: 374795,
  fileSha256: "6be72adb0b4223666d95eb5e1191e7be38124d0e781a13bf415088b63fd228be",
  contentSha256: "35b97b96e3ac70f5688c7618f82e65a14cadec6b20dc1bae91585d6f3d41bc07",
  inputCount: 469,
});

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest258Snapshot(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_258.path));
  const manifest = override ?? JSON.parse(bytes);
  if (bytes.byteLength !== SNAPSHOT_258.bytes || sha256(bytes) !== SNAPSHOT_258.fileSha256) throw new Error("Immutable 2.58 file receipt changed");
  if (manifest.manifestContentSha256 !== SNAPSHOT_258.contentSha256 || computeManifestContentSha256(manifest) !== SNAPSHOT_258.contentSha256) throw new Error("Immutable 2.58 content receipt changed");
  if (manifest.manifestSchemaVersion !== "2.58.0"
    || manifest.releaseId !== "ohri-mouse-interneuron-research-iteration-2.58.0"
    || manifest.application.version !== "2.58.0-research.1"
    || manifest.integrity.inputCount !== SNAPSHOT_258.inputCount
    || manifest.authoritativeInputs.length !== SNAPSHOT_258.inputCount) throw new Error("Immutable 2.58 identity or input count changed");

  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== SNAPSHOT_258.inputCount || paths.size !== ids.size) throw new Error("Immutable 2.58 input receipt uniqueness changed");
  for (const [id, inputPath] of [
    ["bancV888MitochondriaRouteAudit", "data/banc-v888-mitochondria-route-audit-0.1.json"],
    ["iteration258Builder", "tools/build_research_iteration_manifest_2_58.mjs"],
    ["iteration258Validator", "scripts/validate-research-iteration-manifest-2.58.mjs"],
    ["iteration258Tests", "tests/research-iteration-manifest-2.58.test.mjs"],
    ["iteration258Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_58.md"],
  ]) {
    if (!manifest.authoritativeInputs.some((input) => input.id === id && input.scope === "project" && input.path === inputPath)) throw new Error(`Immutable 2.58 input receipt missing: ${id}`);
  }

  const parent = await validateResearchIterationManifest257Snapshot();
  if (manifest.parentIterationManifest.path !== SNAPSHOT_257.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_257.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_257.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_257.contentSha256) throw new Error("Immutable 2.58 parent receipt changed");

  const registry = manifest.exactReferences.researchRegistryDenominators258;
  if (registry.canonicalSourcePackageCount !== 28 || registry.canonicalRecordSetCount !== 37
    || registry.bundledExactCellProfileRosterCount !== 11 || registry.bundledExactSourceObjectSetCount !== 2
    || registry.sourceProfileCount !== 387 || registry.upgradeCount !== 214
    || registry.displayedUpgradeCount !== 30 || registry.denominatorDisplayCount !== 8
    || registry.staleCanonicalDenominatorLiteralCount !== 0) throw new Error("Immutable 2.58 historical registry denominators changed");

  const mito = manifest.exactReferences.bancV888MitochondriaRouteAudit258;
  if (mito.candidate.rootId !== "720575941350424112" || mito.candidate.materializationId !== "v888"
    || mito.candidate.species !== "Drosophila melanogaster" || mito.metadataMitochondriaCount !== 31
    || mito.perMitochondrionAnnotationRowsRetrieved !== false || mito.positionsVerified !== false
    || mito.admittedMitochondrionRows !== 0 || mito.admittedPointMarkers !== 0
    || mito.admittedMitochondriaSurfaces !== 0 || mito.mouseCellJoinCount !== 0 || mito.registrationCount !== 0) {
    throw new Error("Immutable 2.58 BANC candidate count-only or species boundary changed");
  }
  if (manifest.exactReferences.iteration258Layout.fullProjectCopyCount !== 0
    || manifest.exactReferences.iteration258Layout.rollbackParent !== SNAPSHOT_257.path
    || manifest.exactReferences.iteration258Layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_58.md"
    || manifest.registrySummary.researchUpgradeCount !== 214) throw new Error("Immutable 2.58 rollback, no-copy or registry receipt changed");

  return { releaseId: manifest.releaseId, inputCount: ids.size, parentReleaseId: parent.releaseId, researchUpgradeCount: registry.upgradeCount, fullProjectCopyCount: manifest.exactReferences.iteration258Layout.fullProjectCopyCount, manifest };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest258Snapshot()
    .then(({ releaseId, inputCount, parentReleaseId, researchUpgradeCount }) => console.log(JSON.stringify({ releaseId, inputCount, parentReleaseId, researchUpgradeCount })))
    .catch((error) => { console.error(error.message); process.exitCode = 1; });
}
