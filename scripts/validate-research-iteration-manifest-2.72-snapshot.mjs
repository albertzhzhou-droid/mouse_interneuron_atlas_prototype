#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_271, validateResearchIterationManifest271Snapshot } from "./validate-research-iteration-manifest-2.71-snapshot.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const SNAPSHOT_272 = Object.freeze({
  path: "data/research-iteration-manifest-2.72.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.72.0",
  version: "2.72.0-research.1",
  bytes: 597871,
  fileSha256: "7ab05ba4f3c84fcf76c005e82d899e7e7a6f1644e6cba41517732c6aaf08e2a2",
  contentSha256: "f048dcb6411be8aa7b71325c032ffe540ef39c0c10b2b972bf4d8d7160fb343f",
  inputCount: 610,
});

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest272Snapshot(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_272.path));
  if (bytes.byteLength !== SNAPSHOT_272.bytes || sha256(bytes) !== SNAPSHOT_272.fileSha256) throw new Error("Immutable 2.72 manifest file receipt changed");
  const diskManifest = JSON.parse(bytes.toString("utf8"));
  const manifest = override ?? diskManifest;
  if (JSON.stringify(manifest) !== JSON.stringify(diskManifest)) throw new Error("Immutable 2.72 manifest override differs from its sealed file");
  const parent = await validateResearchIterationManifest271Snapshot();
  const denominators = manifest.exactReferences.researchRegistryDenominators272;
  const audit = manifest.exactReferences.neuromorphoRelease126ToddStableIdAudit245;
  const layout = manifest.exactReferences.iteration272Layout;
  if (computeManifestContentSha256(manifest) !== SNAPSHOT_272.contentSha256
    || manifest.manifestSchemaVersion !== "2.72.0"
    || manifest.releaseId !== SNAPSHOT_272.releaseId
    || manifest.application.version !== SNAPSHOT_272.version
    || manifest.integrity.inputCount !== SNAPSHOT_272.inputCount
    || manifest.authoritativeInputs.length !== SNAPSHOT_272.inputCount) throw new Error("Immutable 2.72 content or identity receipt changed");
  if (manifest.parentIterationManifest.path !== SNAPSHOT_271.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || denominators.canonicalSourcePackageCount !== 28
    || denominators.canonicalRecordSetCount !== 37
    || denominators.bundledExactCellProfileRosterCount !== 11
    || denominators.bundledExactSourceObjectSetCount !== 2
    || denominators.sourceProfileCount !== 387
    || denominators.upgradeCount !== 228
    || denominators.completedUpgradeCount !== 67
    || audit.researchUpgradeId !== "UPG-245"
    || audit.release !== "8.6.126"
    || audit.candidateStableIdCount !== 30
    || audit.candidateIdsFoundInBaseline !== 0
    || audit.baselineToddQueryRecordCount !== 309
    || audit.observedCurrentQueryHits !== 339
    || audit.completeCurrentStableIdRosterRetrieved !== false
    || audit.newGeometryObjectsAdmitted !== 0
    || layout.fullProjectCopyCount !== 0
    || layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_72.md") throw new Error("Immutable 2.72 parent, source boundary or incremental-layout receipt changed");
  return {
    releaseId: manifest.releaseId,
    version: manifest.application.version,
    inputCount: manifest.integrity.inputCount,
    parentReleaseId: parent.releaseId,
    candidateStableIdCount: audit.candidateStableIdCount,
    baselineToddQueryRecordCount: audit.baselineToddQueryRecordCount,
    currentUiHits: audit.observedCurrentQueryHits,
    currentRosterComplete: audit.completeCurrentStableIdRosterRetrieved,
    newGeometryObjectsAdmitted: audit.newGeometryObjectsAdmitted,
    fullProjectCopyCount: layout.fullProjectCopyCount,
    path: SNAPSHOT_272.path,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest272Snapshot()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
