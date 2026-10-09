#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_276, validateResearchIterationManifest276Snapshot } from "./validate-research-iteration-manifest-2.76-snapshot.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const SNAPSHOT_277 = Object.freeze({
  path: "data/research-iteration-manifest-2.77.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.77.0",
  version: "2.77.0-research.1",
  bytes: 8228,
  fileSha256: "0f2ae87751fd0cfc07df02d6a6623c4aebdd10b16c34916554dffa0a2b14cebf",
  contentSha256: "7e7800d12b3a0809ecaf298cd3c360a3ca8169247fc40b176d13fc0ed39b4018",
  inputCount: 26,
});

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest277Snapshot(override = null) {
  const manifestBytes = await readFile(path.join(ROOT, SNAPSHOT_277.path));
  if (manifestBytes.byteLength !== SNAPSHOT_277.bytes || sha256(manifestBytes) !== SNAPSHOT_277.fileSha256) throw new Error("Immutable 2.77 manifest file receipt changed");
  const diskManifest = JSON.parse(manifestBytes.toString("utf8"));
  const manifest = override ?? diskManifest;
  if (JSON.stringify(manifest) !== JSON.stringify(diskManifest)) throw new Error("Immutable 2.77 manifest override differs from sealed file");
  const parent = await validateResearchIterationManifest276Snapshot();
  const inputs = manifest.authoritativeInputs;
  const paths = inputs.map((input) => input.path);
  const counts = manifest.registrySummary;
  const reference = manifest.exactReferences.svaraLarvalZebrafishSpinalSbem;
  const layout = manifest.exactReferences.layout;

  if (computeManifestContentSha256(manifest) !== SNAPSHOT_277.contentSha256
    || manifest.manifestSchemaVersion !== "2.77.0"
    || manifest.releaseId !== SNAPSHOT_277.releaseId
    || manifest.application.version !== SNAPSHOT_277.version
    || manifest.integrity.inputCount !== SNAPSHOT_277.inputCount
    || manifest.integrity.inputPathsUnique !== true
    || inputs.length !== SNAPSHOT_277.inputCount
    || new Set(paths).size !== inputs.length
    || inputs.some((input) => typeof input.path !== "string" || path.isAbsolute(input.path) || input.path.split("/").includes("..")
      || !Number.isInteger(input.bytes) || input.bytes < 1 || !/^[a-f0-9]{64}$/.test(input.sha256))) {
    throw new Error("Immutable 2.77 content, identity, or archived input receipts changed");
  }
  if (manifest.parentIterationManifest.path !== SNAPSHOT_276.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_276.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_276.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_276.contentSha256) throw new Error("2.77 parent must remain the immutable 2.76 manifest");
  if (counts.canonicalSourceCount !== 31 || counts.canonicalRecordSetCount !== 41
    || counts.bundledExactCellProfileRosterCount !== 13 || counts.bundledExactSourceObjectSetCount !== 4
    || counts.sourceProfileCount !== 387 || counts.researchUpgradeCount !== 233
    || counts.completedResearchUpgradeCount !== 69 || counts.displayedResearchUpgradeCount !== 42
    || counts.staleCanonicalDenominatorLiteralCount !== 0) throw new Error("Immutable 2.77 registry denominators changed");
  if (reference.auditId !== "svara-larval-zebrafish-spinal-sbem-reference-0.1"
    || reference.species !== "Danio rerio" || reference.specimenCount !== 1
    || reference.reportedMorphologyConsistentCiDs !== 39 || reference.reportedCoBLReconstructions !== 34
    || reference.listedSupplementPackageCount !== 3 || reference.packageUrls.length !== 3
    || reference.inspectedSupplementPackageCount !== 0 || reference.downloadedPayloadBytes !== 0
    || reference.admittedNeuronObjects !== 0 || reference.admittedGeometry !== 0
    || reference.mouseIdentityTransfers !== 0 || reference.atlasRegistrations !== 0
    || manifest.exactReferences.newGeometryCount !== 0 || manifest.exactReferences.mouseIdentityJoins !== 0) {
    throw new Error("Immutable 2.77 Svara source or no-admission boundary changed");
  }
  if (layout.fullProjectCopyCount !== 0 || layout.rollbackParent !== SNAPSHOT_276.path
    || layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_77.md") throw new Error("Immutable 2.77 rollback or no-copy receipt changed");

  return {
    releaseId: manifest.releaseId,
    version: manifest.application.version,
    inputCount: inputs.length,
    parentReleaseId: parent.releaseId,
    sourceCount: counts.canonicalSourceCount,
    recordSetCount: counts.canonicalRecordSetCount,
    packageCount: reference.listedSupplementPackageCount,
    inspectedPackageCount: reference.inspectedSupplementPackageCount,
    downloadedPayloadBytes: reference.downloadedPayloadBytes,
    admittedGeometry: reference.admittedGeometry,
    fullProjectCopyCount: layout.fullProjectCopyCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest277Snapshot()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
