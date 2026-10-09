#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_264, validateResearchIterationManifest264Snapshot } from "./validate-research-iteration-manifest-2.64-snapshot.mjs";

export const SNAPSHOT_265 = Object.freeze({
  path: "data/research-iteration-manifest-2.65.json",
  bytes: 549009,
  fileSha256: "a4d2e6d8bae8c64f048e32041167cb051e61dd76ecd46e3489c4e48da9e646b3",
  contentSha256: "df038e26533b71492d4ae3f79250903c0f7504d88b646172b3f2ecc4a0fb627f",
  inputCount: 537,
});

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest265Snapshot(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_265.path));
  const manifest = override ?? JSON.parse(bytes);
  if (bytes.byteLength !== SNAPSHOT_265.bytes || sha256(bytes) !== SNAPSHOT_265.fileSha256) throw new Error("Immutable 2.65 file receipt changed");
  if (manifest.manifestContentSha256 !== SNAPSHOT_265.contentSha256 || computeManifestContentSha256(manifest) !== SNAPSHOT_265.contentSha256) throw new Error("Immutable 2.65 content receipt changed");
  if (manifest.manifestSchemaVersion !== "2.65.0"
    || manifest.releaseId !== "ohri-mouse-interneuron-research-iteration-2.65.0"
    || manifest.application.version !== "2.65.0-research.1"
    || manifest.integrity.inputCount !== SNAPSHOT_265.inputCount
    || manifest.authoritativeInputs.length !== SNAPSHOT_265.inputCount) throw new Error("Immutable 2.65 identity or input count changed");

  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== SNAPSHOT_265.inputCount || paths.size !== ids.size) throw new Error("Immutable 2.65 input receipt uniqueness changed");
  for (const [id, inputPath] of [
    ["iteration265Builder", "tools/build_research_iteration_manifest_2_65.mjs"],
    ["iteration265Validator", "scripts/validate-research-iteration-manifest-2.65.mjs"],
    ["iteration265Tests", "tests/research-iteration-manifest-2.65.test.mjs"],
    ["iteration265Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_65.md"],
  ]) {
    if (!manifest.authoritativeInputs.some((input) => input.id === id && input.scope === "project" && input.path === inputPath)) throw new Error(`Immutable 2.65 input receipt missing: ${id}`);
  }

  const parent = await validateResearchIterationManifest264Snapshot();
  if (manifest.parentIterationManifest.path !== SNAPSHOT_264.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_264.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_264.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_264.contentSha256) throw new Error("Immutable 2.65 parent receipt changed");

  const morphology = manifest.exactReferences.morphologyLabelDiscovery265;
  const sbfem = manifest.exactReferences.nakamuraSbfemAvailabilityWatch265;
  const registry = manifest.exactReferences.researchRegistryDenominators265;
  const layout = manifest.exactReferences.iteration265Layout;
  if (morphology.researchUpgradeId !== "UPG-241" || morphology.sharedAcrossExactUniverseAndFrozenSubset !== true
    || morphology.requestClearsPriorGeometry !== true || morphology.defaultRecordFallbackSuppressed !== true
    || morphology.exactObjectSelectionRequiredBeforeRendering !== true || morphology.sourceLabelToSameCellJoinCount !== 0) throw new Error("Immutable 2.65 UPG-241 selection boundary changed");
  if (sbfem.researchUpgradeId !== "UPG-242" || sbfem.doi !== "10.7554/eLife.83108"
    || sbfem.reportedSingleCellTracingCount !== 71 || sbfem.exactPublicEmStackVerified !== false
    || sbfem.stableEmCellObjectCrosswalkVerified !== false || sbfem.downloadedPayloadBytes !== 0
    || sbfem.admittedEmVolumes !== 0 || sbfem.admittedCellOrOrganelleGeometry !== 0 || sbfem.linksOnly !== true) throw new Error("Immutable 2.65 UPG-242 watch boundary changed");
  if (registry.canonicalSourcePackageCount !== 28 || registry.canonicalRecordSetCount !== 37
    || registry.bundledExactCellProfileRosterCount !== 11 || registry.bundledExactSourceObjectSetCount !== 2
    || registry.sourceProfileCount !== 387 || registry.upgradeCount !== 224 || registry.displayedUpgradeCount !== 36
    || registry.staleCanonicalDenominatorLiteralCount !== 0 || manifest.registrySummary.researchUpgradeCount !== 224
    || layout.fullProjectCopyCount !== 0 || layout.rollbackParent !== SNAPSHOT_264.path
    || layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_65.md") throw new Error("Immutable 2.65 registry or layout receipt changed");

  return { releaseId: manifest.releaseId, inputCount: ids.size, parentReleaseId: parent.releaseId, researchUpgradeCount: registry.upgradeCount, displayedUpgradeCount: registry.displayedUpgradeCount, manifest };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest265Snapshot()
    .then(({ releaseId, inputCount, parentReleaseId, researchUpgradeCount, displayedUpgradeCount }) => process.stdout.write(`${JSON.stringify({ releaseId, inputCount, parentReleaseId, researchUpgradeCount, displayedUpgradeCount })}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
