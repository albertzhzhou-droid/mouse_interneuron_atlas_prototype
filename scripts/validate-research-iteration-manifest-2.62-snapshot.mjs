#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_261, validateResearchIterationManifest261Snapshot } from "./validate-research-iteration-manifest-2.61-snapshot.mjs";

export const SNAPSHOT_262 = Object.freeze({
  path: "data/research-iteration-manifest-2.62.json",
  bytes: 524598,
  fileSha256: "b2406e0c04f5a2d66058975051c9113496ce4036e3d52b316317bbd31f0f6618",
  contentSha256: "07813a9e96c22a59624d27f4c6483f4563b4c978190b841e16d7323528054078",
  inputCount: 508,
});

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest262Snapshot(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_262.path));
  const manifest = override ?? JSON.parse(bytes);
  if (bytes.byteLength !== SNAPSHOT_262.bytes || sha256(bytes) !== SNAPSHOT_262.fileSha256) throw new Error("Immutable 2.62 file receipt changed");
  if (manifest.manifestContentSha256 !== SNAPSHOT_262.contentSha256 || computeManifestContentSha256(manifest) !== SNAPSHOT_262.contentSha256) throw new Error("Immutable 2.62 content receipt changed");
  if (manifest.manifestSchemaVersion !== "2.62.0"
    || manifest.releaseId !== "ohri-mouse-interneuron-research-iteration-2.62.0"
    || manifest.application.version !== "2.62.0-research.1"
    || manifest.integrity.inputCount !== SNAPSHOT_262.inputCount
    || manifest.authoritativeInputs.length !== SNAPSHOT_262.inputCount) throw new Error("Immutable 2.62 identity or input count changed");

  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== SNAPSHOT_262.inputCount || paths.size !== ids.size) throw new Error("Immutable 2.62 input receipt uniqueness changed");
  for (const [id, inputPath] of [
    ["sealedIteration261SnapshotValidator", "scripts/validate-research-iteration-manifest-2.61-snapshot.mjs"],
    ["iteration262Builder", "tools/build_research_iteration_manifest_2_62.mjs"],
    ["iteration262Validator", "scripts/validate-research-iteration-manifest-2.62.mjs"],
    ["iteration262Tests", "tests/research-iteration-manifest-2.62.test.mjs"],
    ["iteration262Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_62.md"],
  ]) {
    if (!manifest.authoritativeInputs.some((input) => input.id === id && input.scope === "project" && input.path === inputPath)) throw new Error(`Immutable 2.62 input receipt missing: ${id}`);
  }

  const parent = await validateResearchIterationManifest261Snapshot();
  if (manifest.parentIterationManifest.path !== SNAPSHOT_261.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_261.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_261.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_261.contentSha256) throw new Error("Immutable 2.62 parent receipt changed");

  const crossTab = manifest.exactReferences.neuromorphoPaperCellTypeCrossTab262;
  const registry = manifest.exactReferences.researchRegistryDenominators262;
  const layout = manifest.exactReferences.iteration262Layout;
  if (crossTab.repositoryRelease !== "8.6.124" || crossTab.recordCount !== 1_097
    || crossTab.doiCount !== 12 || crossTab.doiLabelMembershipCount !== 2_735
    || crossTab.multiLabelRecordCount !== 1_095 || crossTab.figureMembershipUnassessableRecordCount !== 1_097
    || crossTab.newGeometryObjectCount !== 0 || crossTab.sameCellJoinCount !== 0
    || registry.canonicalSourcePackageCount !== 28 || registry.canonicalRecordSetCount !== 37
    || registry.upgradeCount !== 222 || registry.displayedUpgradeCount !== 33
    || registry.staleCanonicalDenominatorLiteralCount !== 0
    || layout.fullProjectCopyCount !== 0 || layout.rollbackParent !== SNAPSHOT_261.path
    || layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_62.md") throw new Error("Immutable 2.62 research, registry, or no-copy receipt changed");

  return {
    releaseId: manifest.releaseId,
    inputCount: ids.size,
    parentReleaseId: parent.releaseId,
    researchUpgradeCount: registry.upgradeCount,
    displayedUpgradeCount: registry.displayedUpgradeCount,
    doiLabelMembershipCount: crossTab.doiLabelMembershipCount,
    fullProjectCopyCount: layout.fullProjectCopyCount,
    manifest,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest262Snapshot()
    .then(({ releaseId, inputCount, parentReleaseId, researchUpgradeCount }) => process.stdout.write(`${JSON.stringify({ releaseId, inputCount, parentReleaseId, researchUpgradeCount })}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
