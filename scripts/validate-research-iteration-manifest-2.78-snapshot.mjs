#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_277, validateResearchIterationManifest277Snapshot } from "./validate-research-iteration-manifest-2.77-snapshot.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const SNAPSHOT_278 = Object.freeze({
  path: "data/research-iteration-manifest-2.78.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.78.0",
  version: "2.78.0-research.1",
  bytes: 8139,
  fileSha256: "20056e5757a1b0feda828a49e2303c504a169426a1b517c8262ffb0d8eb5a916",
  contentSha256: "65b983bd8417f96f0155d882197ec9cdd16a75a8c6ee96c62953bc1924de1c6b",
  inputCount: 32,
});

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const MANIFEST_278_PATH = path.join(ROOT, SNAPSHOT_278.path);

export async function validateResearchIterationManifest278Snapshot(override = null) {
  const bytes = await readFile(MANIFEST_278_PATH);
  if (SNAPSHOT_278.bytes && (bytes.byteLength !== SNAPSHOT_278.bytes || sha256(bytes) !== SNAPSHOT_278.fileSha256)) {
    throw new Error("Immutable 2.78 manifest file receipt changed");
  }
  const diskManifest = JSON.parse(bytes.toString("utf8"));
  const manifest = override ?? diskManifest;
  if (JSON.stringify(manifest) !== JSON.stringify(diskManifest)) throw new Error("Immutable 2.78 manifest override differs from sealed file");
  const parent = await validateResearchIterationManifest277Snapshot();
  const inputPaths = manifest.authoritativeInputs?.map((input) => input.path) ?? [];
  const summary = manifest.registrySummary;
  if (computeManifestContentSha256(manifest) !== manifest.manifestContentSha256
    || manifest.manifestContentSha256 !== SNAPSHOT_278.contentSha256
    || manifest.manifestSchemaVersion !== "2.78.0"
    || manifest.releaseId !== SNAPSHOT_278.releaseId
    || manifest.application.version !== SNAPSHOT_278.version
    || manifest.integrity.inputCount !== SNAPSHOT_278.inputCount
    || manifest.integrity.inputPathsUnique !== true
    || manifest.authoritativeInputs.length !== SNAPSHOT_278.inputCount
    || new Set(inputPaths).size !== inputPaths.length
    || manifest.authoritativeInputs.some((input) => typeof input.path !== "string" || path.isAbsolute(input.path)
      || input.path.split("/").includes("..") || !Number.isInteger(input.bytes) || input.bytes < 1
      || !/^[a-f0-9]{64}$/.test(input.sha256))
    || manifest.parentIterationManifest.path !== SNAPSHOT_277.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_277.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_277.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_277.contentSha256
    || summary.canonicalSourceCount !== 31 || summary.canonicalRecordSetCount !== 41
    || summary.bundledExactCellProfileRosterCount !== 13 || summary.bundledExactSourceObjectSetCount !== 4
    || summary.sourceProfileCount !== 387 || summary.researchUpgradeCount !== 235
    || summary.completedResearchUpgradeCount !== 69 || summary.displayedResearchUpgradeCount !== 42
    || summary.staleCanonicalDenominatorLiteralCount !== 0) {
    throw new Error("Immutable 2.78 content, parent, input receipt shape, or registry summary changed");
  }
  const detail = manifest.exactReferences.explorerRecordDetailCoverage;
  const routePack = manifest.exactReferences.supplementalToddRoutes;
  if (detail.explorerRecordCount !== 641 || detail.sourceMorphologyRecordCount !== 149
    || detail.detailSlotCount !== 11 || detail.stalePriorRecordRowCountWhenFocusMismatches !== 0
    || detail.admittedInternalObjectCount !== 0 || detail.fallbackPrimitiveCount !== 0
    || detail.selectedProfileAndMorphologyReceiptsDiffer !== true
    || routePack.routePackCount !== 30 || routePack.separateFromExplorerIndex !== true
    || routePack.internalPrimitiveCount !== 0 || routePack.paperCrosswalkCount !== 0
    || manifest.exactReferences.newGeometryCount !== 0 || manifest.exactReferences.newSameCellJoins !== 0
    || manifest.exactReferences.newRegistrations !== 0 || manifest.exactReferences.fullProjectCopyCount !== 0
    || manifest.exactReferences.historicalParent.inputByteReplayRequired !== false) {
    throw new Error("Immutable 2.78 detail, geometry, or source-identity boundary changed");
  }
  return {
    releaseId: manifest.releaseId,
    version: manifest.application.version,
    inputCount: manifest.integrity.inputCount,
    parentReleaseId: parent.releaseId,
    explorerRecordCount: detail.explorerRecordCount,
    morphologyRecordCount: detail.sourceMorphologyRecordCount,
    detailSlotCount: detail.detailSlotCount,
    routePackCount: routePack.routePackCount,
    newGeometryCount: manifest.exactReferences.newGeometryCount,
    fullProjectCopyCount: manifest.exactReferences.fullProjectCopyCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest278Snapshot()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
