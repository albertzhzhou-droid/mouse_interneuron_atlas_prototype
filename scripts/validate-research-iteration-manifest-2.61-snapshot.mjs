#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_260, validateResearchIterationManifest260Snapshot } from "./validate-research-iteration-manifest-2.60-snapshot.mjs";

export const SNAPSHOT_261 = Object.freeze({
  path: "data/research-iteration-manifest-2.61.json",
  bytes: 403521,
  fileSha256: "1f12b57cc7ce6c7139bf83fb3cbae4f7c420547f0b460a2a833638384afa6218",
  contentSha256: "b0ea719bade1bf2348088fea4f2b39add4d59e5e9e6de115b8cfc655edc8a01e",
  inputCount: 501,
});

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest261Snapshot(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_261.path));
  const manifest = override ?? JSON.parse(bytes);
  if (bytes.byteLength !== SNAPSHOT_261.bytes || sha256(bytes) !== SNAPSHOT_261.fileSha256) throw new Error("Immutable 2.61 file receipt changed");
  if (manifest.manifestContentSha256 !== SNAPSHOT_261.contentSha256 || computeManifestContentSha256(manifest) !== SNAPSHOT_261.contentSha256) throw new Error("Immutable 2.61 content receipt changed");
  if (manifest.manifestSchemaVersion !== "2.61.0"
    || manifest.releaseId !== "ohri-mouse-interneuron-research-iteration-2.61.0"
    || manifest.application.version !== "2.61.0-research.1"
    || manifest.integrity.inputCount !== SNAPSHOT_261.inputCount
    || manifest.authoritativeInputs.length !== SNAPSHOT_261.inputCount) throw new Error("Immutable 2.61 identity or input count changed");

  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== SNAPSHOT_261.inputCount || paths.size !== ids.size) throw new Error("Immutable 2.61 input receipt uniqueness changed");
  for (const [id, inputPath] of [
    ["sourceCellTypeFacetTests", "tests/neuromorpho-universe-source-cell-type-facets.test.mjs"],
    ["iteration261Builder", "tools/build_research_iteration_manifest_2_61.mjs"],
    ["iteration261Validator", "scripts/validate-research-iteration-manifest-2.61.mjs"],
    ["iteration261Tests", "tests/research-iteration-manifest-2.61.test.mjs"],
    ["iteration261Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_61.md"],
  ]) {
    if (!manifest.authoritativeInputs.some((input) => input.id === id && input.scope === "project" && input.path === inputPath)) throw new Error(`Immutable 2.61 input receipt missing: ${id}`);
  }

  const parent = await validateResearchIterationManifest260Snapshot();
  if (manifest.parentIterationManifest.path !== SNAPSHOT_260.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_260.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_260.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_260.contentSha256) throw new Error("Immutable 2.61 parent receipt changed");

  const facet = manifest.exactReferences.neuromorphoSourceCellTypeFacet261;
  const registry = manifest.exactReferences.researchRegistryDenominators261;
  const layout = manifest.exactReferences.iteration261Layout;
  if (facet.repositoryRelease !== "8.6.124" || facet.queryRecordCount !== 1_097
    || facet.rawCellTypeLabelCount !== 27 || facet.recordLabelMembershipCount !== 2_735
    || facet.multiLabelRecordCount !== 1_095 || facet.missingCellTypeRecordCount !== 0
    || facet.newGeometryObjectCount !== 0 || facet.sameCellJoinCount !== 0
    || facet.internalPrimitiveCount !== 0 || facet.atlasRegistrationCount !== 0
    || facet.researchUpgradeId !== "UPG-236"
    || registry.canonicalSourcePackageCount !== 28 || registry.canonicalRecordSetCount !== 37
    || registry.sourceProfileCount !== 387 || registry.upgradeCount !== 219
    || registry.displayedUpgradeCount !== 32 || registry.staleCanonicalDenominatorLiteralCount !== 0
    || layout.fullProjectCopyCount !== 0 || layout.rollbackParent !== SNAPSHOT_260.path
    || layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_61.md") throw new Error("Immutable 2.61 source, registry, or no-copy receipt changed");

  return {
    releaseId: manifest.releaseId,
    inputCount: ids.size,
    parentReleaseId: parent.releaseId,
    researchUpgradeCount: registry.upgradeCount,
    rawCellTypeLabelCount: facet.rawCellTypeLabelCount,
    recordLabelMembershipCount: facet.recordLabelMembershipCount,
    multiLabelRecordCount: facet.multiLabelRecordCount,
    fullProjectCopyCount: layout.fullProjectCopyCount,
    manifest,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest261Snapshot()
    .then(({ releaseId, inputCount, parentReleaseId, researchUpgradeCount }) => process.stdout.write(`${JSON.stringify({ releaseId, inputCount, parentReleaseId, researchUpgradeCount })}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
