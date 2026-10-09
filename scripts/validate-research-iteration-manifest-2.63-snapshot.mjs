#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_262, validateResearchIterationManifest262Snapshot } from "./validate-research-iteration-manifest-2.62-snapshot.mjs";

export const SNAPSHOT_263 = Object.freeze({
  path: "data/research-iteration-manifest-2.63.json",
  bytes: 532687,
  fileSha256: "54a71daf3f4bac4e99c77c2358aad5cb6c2fc320d81d5f6f41aa2324f23a9834",
  contentSha256: "bf5d09a59e762e50123b6333e96d5b2394516cbe72ee7b0257ad8073538680f7",
  inputCount: 519,
});

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest263Snapshot(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_263.path));
  const manifest = override ?? JSON.parse(bytes);
  if (bytes.byteLength !== SNAPSHOT_263.bytes || sha256(bytes) !== SNAPSHOT_263.fileSha256) throw new Error("Immutable 2.63 file receipt changed");
  if (manifest.manifestContentSha256 !== SNAPSHOT_263.contentSha256 || computeManifestContentSha256(manifest) !== SNAPSHOT_263.contentSha256) throw new Error("Immutable 2.63 content receipt changed");
  if (manifest.manifestSchemaVersion !== "2.63.0"
    || manifest.releaseId !== "ohri-mouse-interneuron-research-iteration-2.63.0"
    || manifest.application.version !== "2.63.0-research.1"
    || manifest.integrity.inputCount !== SNAPSHOT_263.inputCount
    || manifest.authoritativeInputs.length !== SNAPSHOT_263.inputCount) throw new Error("Immutable 2.63 identity or input count changed");

  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== SNAPSHOT_263.inputCount || paths.size !== ids.size) throw new Error("Immutable 2.63 input receipt uniqueness changed");
  for (const [id, inputPath] of [
    ["iteration263Builder", "tools/build_research_iteration_manifest_2_63.mjs"],
    ["iteration263Validator", "scripts/validate-research-iteration-manifest-2.63.mjs"],
    ["iteration263Tests", "tests/research-iteration-manifest-2.63.test.mjs"],
    ["iteration263Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_63.md"],
  ]) {
    if (!manifest.authoritativeInputs.some((input) => input.id === id && input.scope === "project" && input.path === inputPath)) throw new Error(`Immutable 2.63 input receipt missing: ${id}`);
  }

  const parent = await validateResearchIterationManifest262Snapshot();
  if (manifest.parentIterationManifest.path !== SNAPSHOT_262.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_262.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_262.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_262.contentSha256) throw new Error("Immutable 2.63 parent receipt changed");

  const reference = manifest.exactReferences.microStructFormerUltrastructureReference263;
  const registry = manifest.exactReferences.researchRegistryDenominators263;
  const layout = manifest.exactReferences.iteration263Layout;
  if (reference.researchUpgradeId !== "UPG-239" || reference.rowCount !== 540
    || reference.datasetRevisionSha !== "92a2ca0f9d1387fcf7eaca0c67f5467cb3a5ad1f"
    || reference.downloadedPayloadBytes !== 0 || reference.admittedInternalGeometryCount !== 0
    || registry.canonicalSourcePackageCount !== 28 || registry.canonicalRecordSetCount !== 37
    || registry.upgradeCount !== 222 || registry.displayedUpgradeCount !== 34
    || registry.staleCanonicalDenominatorLiteralCount !== 0
    || layout.fullProjectCopyCount !== 0 || layout.rollbackParent !== SNAPSHOT_262.path
    || layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_63.md") throw new Error("Immutable 2.63 research, registry, or no-copy receipt changed");

  return { releaseId: manifest.releaseId, inputCount: ids.size, parentReleaseId: parent.releaseId, researchUpgradeCount: registry.upgradeCount, fullProjectCopyCount: layout.fullProjectCopyCount, manifest };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest263Snapshot()
    .then(({ releaseId, inputCount, parentReleaseId, researchUpgradeCount }) => process.stdout.write(`${JSON.stringify({ releaseId, inputCount, parentReleaseId, researchUpgradeCount })}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
