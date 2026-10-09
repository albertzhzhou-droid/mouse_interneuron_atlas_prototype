#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_265, validateResearchIterationManifest265Snapshot } from "./validate-research-iteration-manifest-2.65-snapshot.mjs";

export const SNAPSHOT_266 = Object.freeze({
  path: "data/research-iteration-manifest-2.66.json",
  bytes: 557435,
  fileSha256: "c32dce627fad47d3dc26066ad4b73c2ea4da037cddd43408c8469125b618b9ca",
  contentSha256: "522fbfb79161c9cdee1f30251cb93638d554f3c80965b314b557563a333c84f4",
  inputCount: 547,
});

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest266(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_266.path));
  const manifest = override ?? JSON.parse(bytes);
  if (bytes.byteLength !== SNAPSHOT_266.bytes || sha256(bytes) !== SNAPSHOT_266.fileSha256) throw new Error("Immutable 2.66 file receipt changed");
  if (manifest.manifestContentSha256 !== SNAPSHOT_266.contentSha256
    || computeManifestContentSha256(manifest) !== SNAPSHOT_266.contentSha256) throw new Error("Immutable 2.66 content receipt changed");
  if (manifest.manifestSchemaVersion !== "2.66.0"
    || manifest.releaseId !== "ohri-mouse-interneuron-research-iteration-2.66.0"
    || manifest.application.version !== "2.66.0-research.1"
    || manifest.integrity.inputCount !== SNAPSHOT_266.inputCount
    || manifest.authoritativeInputs.length !== SNAPSHOT_266.inputCount) throw new Error("Immutable 2.66 identity or input count changed");

  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== SNAPSHOT_266.inputCount || paths.size !== ids.size) throw new Error("Immutable 2.66 input receipt uniqueness changed");
  for (const [id, inputPath] of [
    ["iteration266Builder", "tools/build_research_iteration_manifest_2_66.mjs"],
    ["iteration266Validator", "scripts/validate-research-iteration-manifest-2.66.mjs"],
    ["iteration266Tests", "tests/research-iteration-manifest-2.66.test.mjs"],
    ["iteration266Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_66.md"],
  ]) {
    if (!manifest.authoritativeInputs.some((input) => input.id === id && input.scope === "project" && input.path === inputPath)) throw new Error(`Immutable 2.66 input receipt missing: ${id}`);
  }

  const parent = await validateResearchIterationManifest265Snapshot();
  if (manifest.parentIterationManifest.path !== SNAPSHOT_265.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_265.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_265.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_265.contentSha256) throw new Error("Immutable 2.66 parent receipt changed");

  const audit = manifest.exactReferences.pkd2l1SbfsemPublicAvailabilityAudit242;
  const registry = manifest.exactReferences.researchRegistryDenominators266;
  const layout = manifest.exactReferences.iteration266Layout;
  if (audit.researchUpgradeId !== "UPG-242" || audit.doi !== "10.7554/eLife.83108"
    || audit.reportedSingleCellTracingCount !== 71 || audit.tracingCountIsSbfsemCensus !== false
    || audit.noRawVolumeInReviewedScope !== true || audit.noSegmentationInReviewedScope !== true
    || audit.stableEmObjectCrosswalkAvailable !== false || audit.independentAssetReuseRightsVerified !== false
    || audit.notAUniversalAbsenceClaim !== true || audit.downloadedPayloadBytes !== 0 || audit.videoBundled !== false
    || audit.admittedEmVolumes !== 0 || audit.admittedInternalGeometry !== 0 || audit.admittedInternalObjects !== 0
    || audit.sameCellJoins !== 0 || audit.registrations !== 0 || audit.measurementUse !== "forbidden"
    || audit.keepsUpg188RawObjectAcquisitionGateOpen !== true) throw new Error("Immutable 2.66 UPG-242 public-availability or no-geometry boundary changed");
  if (registry.canonicalSourcePackageCount !== 28 || registry.canonicalRecordSetCount !== 37
    || registry.bundledExactCellProfileRosterCount !== 11 || registry.bundledExactSourceObjectSetCount !== 2
    || registry.sourceProfileCount !== 387 || registry.upgradeCount !== 224 || registry.completedUpgradeCount !== 65
    || registry.displayedUpgradeCount !== 37 || registry.staleCanonicalDenominatorLiteralCount !== 0
    || manifest.registrySummary.researchUpgradeCount !== 224 || layout.fullProjectCopyCount !== 0
    || layout.rollbackParent !== SNAPSHOT_265.path
    || layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_66.md") throw new Error("Immutable 2.66 registry or no-copy receipt changed");

  return {
    releaseId: manifest.releaseId,
    inputCount: ids.size,
    parentReleaseId: parent.releaseId,
    researchUpgradeCount: registry.upgradeCount,
    displayedUpgradeCount: registry.displayedUpgradeCount,
    completedUpgradeCount: registry.completedUpgradeCount,
    admittedInternalObjects: audit.admittedInternalObjects,
    downloadedPayloadBytes: audit.downloadedPayloadBytes,
    fullProjectCopyCount: layout.fullProjectCopyCount,
    manifest,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest266()
    .then((result) => {
      const summary = { ...result };
      delete summary.manifest;
      process.stdout.write(`${JSON.stringify(summary)}\n`);
    })
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
