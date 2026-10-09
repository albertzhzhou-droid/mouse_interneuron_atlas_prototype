#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_269, validateResearchIterationManifest269Snapshot } from "./validate-research-iteration-manifest-2.69-snapshot.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const SNAPSHOT_270 = Object.freeze({
  path: "data/research-iteration-manifest-2.70.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.70.0",
  version: "2.70.0-research.1",
  bytes: 582328,
  fileSha256: "042391e18ef9c9c346f22b7216551c62842a8ea2b0f3ab680d8ef30571204cf0",
  contentSha256: "d36c20560d8cb23958c4369c2448e3b26eda5e197386396a16277df2ee43ef43",
  inputCount: 585,
});

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest270Snapshot(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_270.path));
  if (bytes.byteLength !== SNAPSHOT_270.bytes || sha256(bytes) !== SNAPSHOT_270.fileSha256) throw new Error("Immutable 2.70 manifest file receipt changed");
  const diskManifest = JSON.parse(bytes.toString("utf8"));
  const manifest = override ?? diskManifest;
  if (JSON.stringify(manifest) !== JSON.stringify(diskManifest)) throw new Error("Immutable 2.70 manifest override differs from its sealed file");
  const parent = await validateResearchIterationManifest269Snapshot();
  const audit = manifest.exactReferences.neuromorphoRelease126UiQuery245;
  const layout = manifest.exactReferences.iteration270Layout;
  const denominators = manifest.exactReferences.researchRegistryDenominators270;
  if (computeManifestContentSha256(manifest) !== SNAPSHOT_270.contentSha256
    || manifest.manifestSchemaVersion !== "2.70.0"
    || manifest.releaseId !== SNAPSHOT_270.releaseId
    || manifest.application.version !== SNAPSHOT_270.version
    || manifest.integrity.inputCount !== SNAPSHOT_270.inputCount
    || manifest.authoritativeInputs.length !== SNAPSHOT_270.inputCount) throw new Error("Immutable 2.70 content or identity receipt changed");
  if (manifest.parentIterationManifest.path !== SNAPSHOT_269.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || denominators.upgradeCount !== 227 || denominators.completedUpgradeCount !== 66
    || denominators.sourceProfileCount !== 387
    || audit.researchUpgradeId !== "UPG-245" || audit.stableNeuronIdsRetrieved !== false
    || audit.newGeometryObjectsAdmitted !== 0 || audit.newIdentityJoins !== 0
    || layout.fullProjectCopyCount !== 0
    || layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_70.md") throw new Error("Immutable 2.70 parent, DOI-count boundary, or incremental-layout receipt changed");
  return {
    releaseId: manifest.releaseId,
    version: manifest.application.version,
    inputCount: manifest.integrity.inputCount,
    parentReleaseId: parent.releaseId,
    auditId: audit.auditId,
    stableIdsRetrieved: audit.stableNeuronIdsRetrieved,
    fullProjectCopyCount: layout.fullProjectCopyCount,
    path: SNAPSHOT_270.path,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest270Snapshot()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
