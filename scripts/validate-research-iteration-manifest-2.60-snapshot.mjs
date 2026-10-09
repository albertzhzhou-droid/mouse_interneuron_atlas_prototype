#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_259, validateResearchIterationManifest259Snapshot } from "./validate-research-iteration-manifest-2.59-snapshot.mjs";

export const SNAPSHOT_260 = Object.freeze({
  path: "data/research-iteration-manifest-2.60.json",
  bytes: 394280,
  fileSha256: "2f63bb6898871daad8c7090ab6c8fa3aa36fc746bfcac32bbfb3b4d1597ba56b",
  contentSha256: "e99a9cf8bd3dd55acc28d26577506cfaf343f043e5d2cd47f7cb3dc7cbca22fb",
  inputCount: 494,
});

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest260Snapshot(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_260.path));
  const manifest = override ?? JSON.parse(bytes);
  if (bytes.byteLength !== SNAPSHOT_260.bytes || sha256(bytes) !== SNAPSHOT_260.fileSha256) throw new Error("Immutable 2.60 file receipt changed");
  if (manifest.manifestContentSha256 !== SNAPSHOT_260.contentSha256 || computeManifestContentSha256(manifest) !== SNAPSHOT_260.contentSha256) throw new Error("Immutable 2.60 content receipt changed");
  if (manifest.manifestSchemaVersion !== "2.60.0"
    || manifest.releaseId !== "ohri-mouse-interneuron-research-iteration-2.60.0"
    || manifest.application.version !== "2.60.0-research.1"
    || manifest.integrity.inputCount !== SNAPSHOT_260.inputCount
    || manifest.authoritativeInputs.length !== SNAPSHOT_260.inputCount) throw new Error("Immutable 2.60 identity or input count changed");

  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== SNAPSHOT_260.inputCount || paths.size !== ids.size) throw new Error("Immutable 2.60 input receipt uniqueness changed");
  for (const [id, inputPath] of [
    ["pkd2l1PopulationContextData", "data/pkd2l1-independent-population-context-0.1.json"],
    ["pkd2l1PopulationContextComponent", "app/Pkd2l1IndependentPopulationContext.tsx"],
    ["iteration260Builder", "tools/build_research_iteration_manifest_2_60.mjs"],
    ["iteration260Validator", "scripts/validate-research-iteration-manifest-2.60.mjs"],
    ["iteration260Tests", "tests/research-iteration-manifest-2.60.test.mjs"],
    ["iteration260Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_60.md"],
  ]) {
    if (!manifest.authoritativeInputs.some((input) => input.id === id && input.scope === "project" && input.path === inputPath)) throw new Error(`Immutable 2.60 input receipt missing: ${id}`);
  }

  const parent = await validateResearchIterationManifest259Snapshot();
  if (manifest.parentIterationManifest.path !== SNAPSHOT_259.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_259.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_259.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_259.contentSha256) throw new Error("Immutable 2.60 parent receipt changed");

  const context = manifest.exactReferences.pkd2l1IndependentPopulationContext260;
  const registry = manifest.exactReferences.researchRegistryDenominators260;
  const layout = manifest.exactReferences.iteration260Layout;
  if (context.mouseCount !== 18 || context.sectionCount !== 811 || context.tableFiveSummaryCount !== 8
    || context.publicRawDataDepositVerified !== false || context.rawImageFilesBundled !== false
    || context.geometryPrimitivesAdmitted !== 0 || context.sameCellJoinToCrozat !== false
    || context.atlasRegistrationCount !== 0 || context.includedInInterneuronTypeCounts !== false
    || registry.canonicalSourcePackageCount !== 28 || registry.canonicalRecordSetCount !== 37
    || registry.sourceProfileCount !== 387 || registry.upgradeCount !== 217
    || registry.staleCanonicalDenominatorLiteralCount !== 0
    || layout.fullProjectCopyCount !== 0 || layout.rollbackParent !== SNAPSHOT_259.path
    || layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_60.md") throw new Error("Immutable 2.60 source-context, registry, or no-copy receipt changed");

  return { releaseId: manifest.releaseId, inputCount: ids.size, parentReleaseId: parent.releaseId, researchUpgradeCount: registry.upgradeCount, fullProjectCopyCount: layout.fullProjectCopyCount, manifest };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest260Snapshot()
    .then(({ releaseId, inputCount, parentReleaseId, researchUpgradeCount }) => process.stdout.write(`${JSON.stringify({ releaseId, inputCount, parentReleaseId, researchUpgradeCount })}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
