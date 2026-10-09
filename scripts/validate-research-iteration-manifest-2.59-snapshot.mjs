#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_258, validateResearchIterationManifest258Snapshot } from "./validate-research-iteration-manifest-2.58-snapshot.mjs";

export const SNAPSHOT_259 = Object.freeze({
  path: "data/research-iteration-manifest-2.59.json",
  bytes: 385525,
  fileSha256: "43723cd3a02c398a6e1c009c15919df969b4a48d5f14612840665fb1ed5cff63",
  contentSha256: "4bfec6af50db2b7fbb76b9ac2909289322f1327569984dc95ad7170b21fc0bdc",
  inputCount: 482,
});

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest259Snapshot(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_259.path));
  const manifest = override ?? JSON.parse(bytes);
  if (bytes.byteLength !== SNAPSHOT_259.bytes || sha256(bytes) !== SNAPSHOT_259.fileSha256) throw new Error("Immutable 2.59 file receipt changed");
  if (manifest.manifestContentSha256 !== SNAPSHOT_259.contentSha256 || computeManifestContentSha256(manifest) !== SNAPSHOT_259.contentSha256) throw new Error("Immutable 2.59 content receipt changed");
  if (manifest.manifestSchemaVersion !== "2.59.0"
    || manifest.releaseId !== "ohri-mouse-interneuron-research-iteration-2.59.0"
    || manifest.application.version !== "2.59.0-research.1"
    || manifest.integrity.inputCount !== SNAPSHOT_259.inputCount
    || manifest.authoritativeInputs.length !== SNAPSHOT_259.inputCount) throw new Error("Immutable 2.59 identity or input count changed");

  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== SNAPSHOT_259.inputCount || paths.size !== ids.size) throw new Error("Immutable 2.59 input receipt uniqueness changed");
  for (const [id, inputPath] of [
    ["gintyStrainFacetAudit", "data/ginty-neuromorpho-strain-facet-audit-0.1.json"],
    ["sourceStrainFacetRuntime", "app/neuromorpho-universe-facets.js"],
    ["iteration259Builder", "tools/build_research_iteration_manifest_2_59.mjs"],
    ["iteration259Validator", "scripts/validate-research-iteration-manifest-2.59.mjs"],
    ["iteration259Tests", "tests/research-iteration-manifest-2.59.test.mjs"],
    ["iteration259Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_59.md"],
  ]) {
    if (!manifest.authoritativeInputs.some((input) => input.id === id && input.scope === "project" && input.path === inputPath)) throw new Error(`Immutable 2.59 input receipt missing: ${id}`);
  }

  const parent = await validateResearchIterationManifest258Snapshot();
  if (manifest.parentIterationManifest.path !== SNAPSHOT_258.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_258.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_258.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_258.contentSha256) throw new Error("Immutable 2.59 parent receipt changed");

  const registry = manifest.exactReferences.researchRegistryDenominators259;
  const ginty = manifest.exactReferences.gintyNeuroMorphoStrainFacetAudit259;
  if (registry.canonicalSourcePackageCount !== 28 || registry.canonicalRecordSetCount !== 37
    || registry.sourceProfileCount !== 387 || registry.upgradeCount !== 215
    || registry.staleCanonicalDenominatorLiteralCount !== 0
    || ginty.paperLinkedRepositoryRecordCount !== 650 || ginty.rawSourceStrainLabelCount !== 12
    || ginty.paperMembershipReconciled !== false || ginty.sameCellJoinCount !== 0
    || ginty.internalStructurePrimitiveCount !== 0) throw new Error("Immutable 2.59 source-strain or historical registry receipt changed");
  if (manifest.exactReferences.iteration259Layout.fullProjectCopyCount !== 0
    || manifest.exactReferences.iteration259Layout.rollbackParent !== SNAPSHOT_258.path
    || manifest.exactReferences.iteration259Layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_59.md") throw new Error("Immutable 2.59 rollback or no-copy receipt changed");

  return { releaseId: manifest.releaseId, inputCount: ids.size, parentReleaseId: parent.releaseId, researchUpgradeCount: registry.upgradeCount, fullProjectCopyCount: manifest.exactReferences.iteration259Layout.fullProjectCopyCount, manifest };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest259Snapshot()
    .then(({ releaseId, inputCount, parentReleaseId, researchUpgradeCount }) => console.log(JSON.stringify({ releaseId, inputCount, parentReleaseId, researchUpgradeCount })))
    .catch((error) => { console.error(error.message); process.exitCode = 1; });
}
