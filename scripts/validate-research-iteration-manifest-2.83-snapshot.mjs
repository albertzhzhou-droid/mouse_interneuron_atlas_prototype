#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_282, validateResearchIterationManifest282Snapshot } from "./validate-research-iteration-manifest-2.82-snapshot.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(ROOT, "data/research-iteration-manifest-2.83.json");
export const SNAPSHOT_283 = Object.freeze({
  path: "data/research-iteration-manifest-2.83.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.83.0",
  version: "2.83.0-research.1",
  bytes: 7365,
  fileSha256: "8d05351c5e5ead62898878a04c44d34034683f20dba5a5e1899060002643f5d3",
  contentSha256: "904a4fa3a042c812b4f9c7d2c627cdf97103e56de6a0a034783714b3c196cefc",
  inputCount: 29,
});

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest283Snapshot(override = null) {
  const bytes = await readFile(MANIFEST_PATH);
  if (SNAPSHOT_283.bytes && (bytes.byteLength !== SNAPSHOT_283.bytes || sha256(bytes) !== SNAPSHOT_283.fileSha256)) {
    throw new Error("Immutable 2.83 manifest file receipt changed");
  }
  const diskManifest = JSON.parse(bytes.toString("utf8"));
  const manifest = override ?? diskManifest;
  if (JSON.stringify(manifest) !== JSON.stringify(diskManifest)) throw new Error("Immutable 2.83 manifest override differs from sealed file");
  const parent = await validateResearchIterationManifest282Snapshot();
  const inputPaths = manifest.authoritativeInputs?.map((input) => input.path) ?? [];
  const summary = manifest.registrySummary;
  const refs = manifest.exactReferences;
  const presentation = refs?.selectionPresentation;
  const bil = refs?.bilXeniumSpinal;
  if (computeManifestContentSha256(manifest) !== manifest.manifestContentSha256
    || manifest.manifestContentSha256 !== SNAPSHOT_283.contentSha256
    || manifest.manifestSchemaVersion !== "2.83.0"
    || manifest.releaseId !== SNAPSHOT_283.releaseId
    || manifest.application.version !== SNAPSHOT_283.version
    || manifest.integrity.inputCount !== SNAPSHOT_283.inputCount
    || manifest.integrity.inputPathsUnique !== true
    || manifest.authoritativeInputs.length !== SNAPSHOT_283.inputCount
    || new Set(inputPaths).size !== inputPaths.length
    || manifest.authoritativeInputs.some((input) => typeof input.path !== "string" || path.isAbsolute(input.path)
      || input.path.split("/").includes("..") || !Number.isInteger(input.bytes) || input.bytes < 1
      || !/^[a-f0-9]{64}$/.test(input.sha256))
    || manifest.parentIterationManifest.path !== SNAPSHOT_282.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_282.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_282.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_282.contentSha256
    || summary.canonicalSourceCount !== 31 || summary.canonicalRecordSetCount !== 41
    || summary.bundledExactCellProfileRosterCount !== 13 || summary.bundledExactSourceObjectSetCount !== 4
    || summary.sourceProfileCount !== 387 || summary.researchUpgradeCount !== 237
    || summary.completedResearchUpgradeCount !== 69 || summary.displayedResearchUpgradeCount !== 43
    || summary.staleCanonicalDenominatorLiteralCount !== 0
    || presentation.activeRecordDetailIsFirst !== true
    || presentation.independentReferenceDisclosureDefaultOpen !== false
    || presentation.independentReferencesCreateSameCellLink !== false
    || bil.auditId !== "bil-xenium-mouse-spinal-availability-audit-0.1.0"
    || bil.researchUpgradeId !== "UPG-244" || bil.plannedViewerUpgradeId !== "UPG-255"
    || bil.datasetSpecificRightsVerified !== false || bil.payloadBytesDownloaded !== 0
    || bil.exactInterneuronRosterRows !== 0 || bil.sectionLocalBoundaryObjects !== 0
    || bil.threeDimensionalCellObjects !== 0 || bil.sourceLocal2dViewerImplemented !== false
    || refs.newGeometryCount !== 0 || refs.newSameCellJoins !== 0 || refs.newRegistrations !== 0
    || refs.fullProjectCopyCount !== 0 || refs.historicalParent.inputByteReplayRequired !== false) {
    throw new Error("Immutable 2.83 provenance, parent, registry denominators, selection boundary, or BIL no-admission gate changed");
  }
  return {
    releaseId: manifest.releaseId,
    version: manifest.application.version,
    inputCount: manifest.integrity.inputCount,
    parentReleaseId: parent.releaseId,
    sourceCount: summary.canonicalSourceCount,
    sourceProfileCount: summary.sourceProfileCount,
    researchUpgradeCount: summary.researchUpgradeCount,
    activeRecordDetailIsFirst: presentation.activeRecordDetailIsFirst,
    independentReferenceDisclosureDefaultOpen: presentation.independentReferenceDisclosureDefaultOpen,
    bilPayloadBytesDownloaded: bil.payloadBytesDownloaded,
    bilInterneuronRosterRows: bil.exactInterneuronRosterRows,
    newGeometryCount: refs.newGeometryCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest283Snapshot()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
