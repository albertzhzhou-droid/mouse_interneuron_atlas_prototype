#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_289, validateResearchIterationManifest289Snapshot } from "./validate-research-iteration-manifest-2.89-snapshot.mjs";
import { validateNeurolucidaDatSwcCrosswalk } from "./validate-neurolucida-dat-swc-crosswalk-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(ROOT, "data/research-iteration-manifest-2.90.json");
export const SNAPSHOT_290 = Object.freeze({
  path: "data/research-iteration-manifest-2.90.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.90.0",
  version: "2.90.0-research.1",
  bytes: 7954,
  fileSha256: "8bca8205ed5671241e083b1f36bec1d566fc591a93b44cc75ae1d1d8c13c2480",
  contentSha256: "fb47cef8645f86442a3408b18941adac6d89b7c0f2d69d8e9f86096868e53c28",
  inputCount: 31,
});

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest290Snapshot() {
  const bytes = await readFile(MANIFEST_PATH);
  if (SNAPSHOT_290.bytes && (bytes.byteLength !== SNAPSHOT_290.bytes || sha256(bytes) !== SNAPSHOT_290.fileSha256)) {
    throw new Error("Immutable 2.90 manifest file receipt changed");
  }
  const manifest = JSON.parse(bytes.toString("utf8"));
  const parent = await validateResearchIterationManifest289Snapshot();
  // Historical source geometry remains replayed, while the frozen release receipt
  // preserves its original application/queue hashes. Current inputs are checked
  // by the current iteration validator rather than forced back to a past version.
  const crosswalk = await validateNeurolucidaDatSwcCrosswalk();
  const inputPaths = manifest.authoritativeInputs?.map((input) => input.path) ?? [];
  const inputPathSet = new Set(inputPaths);
  const summary = manifest.registrySummary;
  const receipt = manifest.exactReferences?.nmo45718DatSwcCrosswalk;
  if (computeManifestContentSha256(manifest) !== manifest.manifestContentSha256
    || (SNAPSHOT_290.contentSha256 && manifest.manifestContentSha256 !== SNAPSHOT_290.contentSha256)
    || manifest.manifestSchemaVersion !== "2.90.0"
    || manifest.releaseId !== SNAPSHOT_290.releaseId
    || manifest.application.version !== SNAPSHOT_290.version
    || manifest.integrity.inputCount !== SNAPSHOT_290.inputCount
    || manifest.integrity.inputPathsUnique !== true
    || manifest.authoritativeInputs.length !== manifest.integrity.inputCount
    || inputPathSet.size !== inputPaths.length
    || manifest.parentIterationManifest.path !== SNAPSHOT_289.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_289.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_289.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_289.contentSha256
    || summary.canonicalSourceCount !== 31 || summary.canonicalRecordSetCount !== 41
    || summary.bundledExactCellProfileRosterCount !== 13 || summary.bundledExactSourceObjectSetCount !== 4
    || summary.sourceProfileCount !== 387 || summary.researchUpgradeCount !== 243
    || summary.completedResearchUpgradeCount !== 73 || summary.displayedResearchUpgradeCount !== 45
    || summary.staleCanonicalDenominatorLiteralCount !== 0
    || receipt.researchUpgradeId !== "UPG-192" || receipt.recordId !== crosswalk.recordId
    || receipt.contractPath !== "data/neurolucida-dat-swc-crosswalk-0.1.json"
    || receipt.sourceReceiptsChecked !== crosswalk.sourceReceiptsChecked
    || receipt.mappedSomaContours !== 7 || receipt.mappedContourVertices !== 252
    || receipt.standardizedSwcSegments !== 5635
    || receipt.primaryHeldOutMaximumMicrometre !== crosswalk.primaryHeldOutMaximumMicrometre
    || receipt.sensitivityHeldOutMaximumMicrometre !== crosswalk.sensitivityHeldOutMaximumMicrometre
    || receipt.properRotationHeldOutMaximumMicrometre !== crosswalk.properRotationHeldOutMaximumMicrometre
    || JSON.stringify(receipt.excludedContourIds) !== JSON.stringify(["source-native-contour-8"])
    || receipt.surfaces !== 0 || receipt.internalStructureObjects !== 0 || receipt.registrationCount !== 0
    || manifest.exactReferences.fullProjectCopyCount !== 0
    || manifest.exactReferences.historicalParent.inputByteReplayRequired !== false) {
    throw new Error("Immutable 2.89 parent, NMO 45718 crosswalk, registry denominators or no-invention boundary changed");
  }

  for (const input of manifest.authoritativeInputs) {
    if (typeof input.path !== "string" || path.isAbsolute(input.path) || input.path.split("/").includes("..")
      || !Number.isInteger(input.bytes) || input.bytes < 1 || !/^[a-f0-9]{64}$/.test(input.sha256)) {
      throw new Error("2.90 manifest contains an invalid authoritative input receipt");
    }
    const immutableScientificInput = input.path.startsWith("public/data/")
      || input.path === "data/neurolucida-dat-swc-crosswalk-0.1.json"
      || input.path === "data/neurolucida-native-contour-admission-catalog-0.3.json";
    if (immutableScientificInput) {
      const inputBytes = await readFile(path.join(ROOT, input.path));
      if (inputBytes.byteLength !== input.bytes || sha256(inputBytes) !== input.sha256) {
        throw new Error(`2.90 immutable scientific input receipt changed: ${input.path}`);
      }
    }
  }
  for (const requiredPath of [
    "data/research-iteration-manifest-2.89.json",
    "data/neurolucida-dat-swc-crosswalk-0.1.json",
    "app/neurolucida-dat-swc-crosswalk.js",
    "app/Nmo45718DatSwcCrosswalkViewer.tsx",
    "app/NeuroMorphoUniversePanel.tsx",
    "docs/RESEARCH_MODEL_UPGRADE_QUEUE.md",
    "docs/RESEARCH_TIMELINE_2026-09-24_ITERATION_2_90.md",
    "package.json",
    "package-lock.json",
  ]) {
    if (!inputPathSet.has(requiredPath)) throw new Error(`2.90 manifest is missing its required input: ${requiredPath}`);
  }
  return {
    releaseId: manifest.releaseId,
    version: manifest.application.version,
    inputCount: manifest.integrity.inputCount,
    parentReleaseId: parent.releaseId,
    sourceCount: summary.canonicalSourceCount,
    sourceProfileCount: summary.sourceProfileCount,
    researchUpgradeCount: summary.researchUpgradeCount,
    completedUpgradeCount: summary.completedResearchUpgradeCount,
    recordId: receipt.recordId,
    mappedSomaContours: receipt.mappedSomaContours,
    mappedContourVertices: receipt.mappedContourVertices,
    standardizedSwcSegments: receipt.standardizedSwcSegments,
    primaryHeldOutMaximumMicrometre: receipt.primaryHeldOutMaximumMicrometre,
    sensitivityHeldOutMaximumMicrometre: receipt.sensitivityHeldOutMaximumMicrometre,
    surfaces: receipt.surfaces,
    registrationCount: receipt.registrationCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest290Snapshot()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
