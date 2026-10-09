#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_263, validateResearchIterationManifest263Snapshot } from "./validate-research-iteration-manifest-2.63-snapshot.mjs";

export const SNAPSHOT_264 = Object.freeze({
  path: "data/research-iteration-manifest-2.64.json",
  bytes: 542060,
  fileSha256: "2a644041bde50181466c73d4d751be8b340eec8c13198cb8dc71e4ee7dd0de73",
  contentSha256: "6f87e0a14631ff166895ed7f89b0f10e612db17d3c106f588079faf44b4b5ec3",
  inputCount: 530,
});

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest264Snapshot(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_264.path));
  const manifest = override ?? JSON.parse(bytes);
  if (bytes.byteLength !== SNAPSHOT_264.bytes || sha256(bytes) !== SNAPSHOT_264.fileSha256) throw new Error("Immutable 2.64 file receipt changed");
  if (manifest.manifestContentSha256 !== SNAPSHOT_264.contentSha256 || computeManifestContentSha256(manifest) !== SNAPSHOT_264.contentSha256) throw new Error("Immutable 2.64 content receipt changed");
  if (manifest.manifestSchemaVersion !== "2.64.0"
    || manifest.releaseId !== "ohri-mouse-interneuron-research-iteration-2.64.0"
    || manifest.application.version !== "2.64.0-research.1"
    || manifest.integrity.inputCount !== SNAPSHOT_264.inputCount
    || manifest.authoritativeInputs.length !== SNAPSHOT_264.inputCount) throw new Error("Immutable 2.64 identity or input count changed");

  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== SNAPSHOT_264.inputCount || paths.size !== ids.size) throw new Error("Immutable 2.64 input receipt uniqueness changed");
  for (const [id, inputPath] of [
    ["iteration264Builder", "tools/build_research_iteration_manifest_2_64.mjs"],
    ["iteration264Validator", "scripts/validate-research-iteration-manifest-2.64.mjs"],
    ["iteration264Tests", "tests/research-iteration-manifest-2.64.test.mjs"],
    ["iteration264Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_64.md"],
  ]) {
    if (!manifest.authoritativeInputs.some((input) => input.id === id && input.scope === "project" && input.path === inputPath)) throw new Error(`Immutable 2.64 input receipt missing: ${id}`);
  }

  const parent = await validateResearchIterationManifest263Snapshot();
  if (manifest.parentIterationManifest.path !== SNAPSHOT_263.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_263.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_263.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_263.contentSha256) throw new Error("Immutable 2.64 parent receipt changed");

  const reference = manifest.exactReferences.svaraLarvalZebrafishSpinalSbemReference264;
  const registry = manifest.exactReferences.researchRegistryDenominators264;
  const layout = manifest.exactReferences.iteration264Layout;
  if (reference.researchUpgradeId !== "UPG-240" || reference.doi !== "10.1016/j.celrep.2018.05.023"
    || reference.species !== "Danio rerio" || reference.lifeStage !== "6 dpf larval zebrafish" || reference.specimenCount !== 1
    || reference.inspectedSupplementPackageCount !== 0 || reference.admittedNeuronObjects !== 0
    || reference.admittedSkeletons !== 0 || reference.admittedMeshes !== 0 || reference.downloadedPayloadBytes !== 0
    || reference.articleLicense !== "CC BY 4.0" || reference.supplementLicenseEstablishedFromArticleLicense !== false) throw new Error("Immutable 2.64 Svara evidence boundary changed");
  if (registry.canonicalSourcePackageCount !== 28 || registry.canonicalRecordSetCount !== 37
    || registry.bundledExactCellProfileRosterCount !== 11 || registry.bundledExactSourceObjectSetCount !== 2
    || registry.sourceProfileCount !== 387 || registry.upgradeCount !== 222 || registry.displayedUpgradeCount !== 35
    || registry.staleCanonicalDenominatorLiteralCount !== 0 || manifest.registrySummary.researchUpgradeCount !== 222
    || layout.fullProjectCopyCount !== 0 || layout.rollbackParent !== SNAPSHOT_263.path
    || layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_64.md") throw new Error("Immutable 2.64 registry, rollback or no-copy receipt changed");

  return { releaseId: manifest.releaseId, inputCount: ids.size, parentReleaseId: parent.releaseId, researchUpgradeCount: registry.upgradeCount, fullProjectCopyCount: layout.fullProjectCopyCount, manifest };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest264Snapshot()
    .then(({ releaseId, inputCount, parentReleaseId, researchUpgradeCount }) => process.stdout.write(`${JSON.stringify({ releaseId, inputCount, parentReleaseId, researchUpgradeCount })}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
