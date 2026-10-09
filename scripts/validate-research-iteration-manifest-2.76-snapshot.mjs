#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_275, validateResearchIterationManifest275Snapshot } from "./validate-research-iteration-manifest-2.75-snapshot.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const SNAPSHOT_276 = Object.freeze({
  path: "data/research-iteration-manifest-2.76.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.76.0",
  version: "2.76.0-research.1",
  bytes: 7960,
  fileSha256: "859e3e77b75bf682977e53ce5c82919751b16fe6c4fdec5c470ac2b2a92afc91",
  contentSha256: "70272e05cdff8bf97f0bced4a367b14d9c0cb3d872b0cd07c62f8c42b7026cc4",
  inputCount: 24,
});

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest276Snapshot(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_276.path));
  if (bytes.byteLength !== SNAPSHOT_276.bytes || sha256(bytes) !== SNAPSHOT_276.fileSha256) throw new Error("Immutable 2.76 manifest file receipt changed");
  const diskManifest = JSON.parse(bytes.toString("utf8"));
  const manifest = override ?? diskManifest;
  if (JSON.stringify(manifest) !== JSON.stringify(diskManifest)) throw new Error("Immutable 2.76 manifest override differs from sealed file");
  const parent = await validateResearchIterationManifest275Snapshot();
  const inputs = manifest.authoritativeInputs;
  const paths = inputs.map((input) => input.path);
  const counts = manifest.registrySummary;
  const fibsem = manifest.exactReferences.openMouseSpinalFibsemNearMiss;
  const layout = manifest.exactReferences.layout;
  if (computeManifestContentSha256(manifest) !== SNAPSHOT_276.contentSha256
    || manifest.manifestSchemaVersion !== "2.76.0"
    || manifest.releaseId !== SNAPSHOT_276.releaseId
    || manifest.application.version !== SNAPSHOT_276.version
    || manifest.integrity.inputCount !== SNAPSHOT_276.inputCount
    || manifest.integrity.inputPathsUnique !== true
    || inputs.length !== SNAPSHOT_276.inputCount
    || new Set(paths).size !== inputs.length
    || inputs.some((input) => typeof input.path !== "string" || path.isAbsolute(input.path) || input.path.split("/").includes("..")
      || !Number.isInteger(input.bytes) || input.bytes < 1 || !/^[a-f0-9]{64}$/.test(input.sha256))) throw new Error("Immutable 2.76 content, identity, or input receipts changed");
  if (manifest.parentIterationManifest.path !== SNAPSHOT_275.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_275.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_275.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_275.contentSha256) throw new Error("2.76 parent must remain the immutable 2.75 manifest");
  if (counts.canonicalSourceCount !== 30 || counts.canonicalRecordSetCount !== 39
    || counts.bundledExactCellProfileRosterCount !== 13 || counts.bundledExactSourceObjectSetCount !== 4
    || counts.sourceProfileCount !== 387 || counts.researchUpgradeCount !== 231
    || counts.completedResearchUpgradeCount !== 69 || counts.displayedResearchUpgradeCount !== 40
    || counts.staleCanonicalDenominatorLiteralCount !== 0) throw new Error("Immutable 2.76 registry denominators changed");
  if (fibsem.auditId !== "open-mouse-spinal-fibsem-near-miss-audit-0.1"
    || fibsem.datasetIds.join(",") !== "jrc_mus-sc-zp104a,jrc_mus-sc-zp105a"
    || fibsem.publicAdultMouseSpinalEmVolumes !== 2 || fibsem.eligibleMouseSpinalInterneuronObjectRoutes !== 0
    || fibsem.rawVolumesDownloaded !== 0 || fibsem.segmentationPayloadsDownloaded !== 0
    || fibsem.admittedInterneuronObjects !== 0 || fibsem.admittedOrganelleObjects !== 0
    || fibsem.sameCellJoins !== 0 || fibsem.atlasRegistrations !== 0 || fibsem.measurements !== 0
    || manifest.exactReferences.mouseInterneuronCensusExpansionCount !== 0
    || manifest.exactReferences.mouseIdentityJoins !== 0 || manifest.exactReferences.newGeometryCount !== 0) {
    throw new Error("Immutable 2.76 source identity or no-admission boundary changed");
  }
  if (layout.fullProjectCopyCount !== 0 || layout.rollbackParent !== SNAPSHOT_275.path
    || layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_76.md") throw new Error("Immutable 2.76 rollback or no-copy receipt changed");
  return {
    releaseId: manifest.releaseId,
    version: manifest.application.version,
    inputCount: inputs.length,
    parentReleaseId: parent.releaseId,
    publicMouseSpinalEmVolumes: fibsem.publicAdultMouseSpinalEmVolumes,
    interneuronObjectRoutes: fibsem.eligibleMouseSpinalInterneuronObjectRoutes,
    newGeometryCount: manifest.exactReferences.newGeometryCount,
    fullProjectCopyCount: layout.fullProjectCopyCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest276Snapshot()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
