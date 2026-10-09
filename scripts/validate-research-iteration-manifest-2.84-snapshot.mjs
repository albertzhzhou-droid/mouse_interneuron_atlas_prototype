#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_283, validateResearchIterationManifest283Snapshot } from "./validate-research-iteration-manifest-2.83-snapshot.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(ROOT, "data/research-iteration-manifest-2.84.json");
export const SNAPSHOT_284 = Object.freeze({
  path: "data/research-iteration-manifest-2.84.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.84.0",
  version: "2.84.0-research.1",
  bytes: 8986,
  fileSha256: "781ac79db08f2da7aaf28611b142fb01e2550dfddc3e2752e0834ef42e5203d3",
  contentSha256: "fd5bdf62d6bf384c945edd66779358896f10d6802b757805de1e8e38c5ebc81e",
  inputCount: 36,
});

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest284Snapshot() {
  const bytes = await readFile(MANIFEST_PATH);
  if (SNAPSHOT_284.bytes && (bytes.byteLength !== SNAPSHOT_284.bytes || sha256(bytes) !== SNAPSHOT_284.fileSha256)) {
    throw new Error("Immutable 2.84 manifest file receipt changed");
  }
  const manifest = JSON.parse(bytes.toString("utf8"));
  const parent = await validateResearchIterationManifest283Snapshot();
  const inputPaths = manifest.authoritativeInputs?.map((input) => input.path) ?? [];
  const summary = manifest.registrySummary;
  const refs = manifest.exactReferences;
  const presentation = refs?.selectionPresentation;
  const coverage = refs?.independentSourceObjectCoverage;
  const discovery = refs?.neuromorphoApiDiscovery;
  const expectedRegistryIds = ["microns-phase1", "banc-v888", "super-clem-palm", "microstructformer", "todd-native-contours"];
  if (computeManifestContentSha256(manifest) !== manifest.manifestContentSha256
    || manifest.manifestContentSha256 !== SNAPSHOT_284.contentSha256
    || manifest.manifestSchemaVersion !== "2.84.0"
    || manifest.releaseId !== SNAPSHOT_284.releaseId
    || manifest.application.version !== SNAPSHOT_284.version
    || manifest.integrity.inputCount !== SNAPSHOT_284.inputCount
    || manifest.integrity.inputPathsUnique !== true
    || manifest.authoritativeInputs.length !== manifest.integrity.inputCount
    || new Set(inputPaths).size !== inputPaths.length
    || manifest.authoritativeInputs.some((input) => typeof input.path !== "string" || path.isAbsolute(input.path)
      || input.path.split("/").includes("..") || !Number.isInteger(input.bytes) || input.bytes < 1
      || !/^[a-f0-9]{64}$/.test(input.sha256))
    || manifest.parentIterationManifest.path !== SNAPSHOT_283.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_283.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_283.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_283.contentSha256
    || summary.canonicalSourceCount !== 31 || summary.canonicalRecordSetCount !== 41
    || summary.bundledExactCellProfileRosterCount !== 13 || summary.bundledExactSourceObjectSetCount !== 4
    || summary.sourceProfileCount !== 387 || summary.researchUpgradeCount !== 238
    || summary.completedResearchUpgradeCount !== 69 || summary.displayedResearchUpgradeCount !== 44
    || summary.staleCanonicalDenominatorLiteralCount !== 0
    || presentation.activeRecordDetailIsFirst !== true
    || presentation.independentReferenceDisclosureDefaultOpen !== false
    || presentation.sourceCoverageIndexDefaultOpen !== false
    || presentation.independentReferencesCreateSameCellLink !== false
    || JSON.stringify(coverage.registryIds) !== JSON.stringify(expectedRegistryIds)
    || coverage.sourceSpecificCountsPooled !== false
    || coverage.rowsHaveExactIdsOrExplicitMissingness !== true
    || coverage.rowsHaveSourceFrameAndScaleStatement !== true
    || coverage.rowsHaveCompletenessAndRightsBoundary !== true
    || coverage.detailedSourceLinks !== true
    || coverage.newGeometryCount !== 0 || coverage.newSameCellJoins !== 0 || coverage.newRegistrations !== 0
    || discovery.researchUpgradeId !== "UPG-256" || discovery.candidateQueryExecuted !== false
    || discovery.recordsImported !== 0 || discovery.dynamicCountAcceptedAsSnapshotDenominator !== false
    || refs.fullProjectCopyCount !== 0 || refs.historicalParent.inputByteReplayRequired !== false) {
    throw new Error("Immutable 2.84 parent, source-local coverage, queue denominators or no-admission boundary changed");
  }
  return {
    releaseId: manifest.releaseId,
    version: manifest.application.version,
    inputCount: manifest.integrity.inputCount,
    parentReleaseId: parent.releaseId,
    sourceCount: summary.canonicalSourceCount,
    sourceProfileCount: summary.sourceProfileCount,
    researchUpgradeCount: summary.researchUpgradeCount,
    independentSourceRegistryCount: coverage.registryIds.length,
    sourceSpecificCountsPooled: coverage.sourceSpecificCountsPooled,
    neuromorphoCandidateQueryExecuted: discovery.candidateQueryExecuted,
    newGeometryCount: coverage.newGeometryCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest284Snapshot()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
