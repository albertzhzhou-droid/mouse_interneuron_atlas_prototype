#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_278, validateResearchIterationManifest278Snapshot } from "./validate-research-iteration-manifest-2.78-snapshot.mjs";

export const SNAPSHOT_279 = Object.freeze({
  path: "data/research-iteration-manifest-2.79.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.79.0",
  version: "2.79.0-research.1",
  bytes: 7143,
  fileSha256: "7722214fdac4693535c2a7042795648fbac5dcd1c66390df8e65622c3a2bdcea",
  contentSha256: "934a241882550cbc383cb163440fcdf5316e5fb6ee9962f0a0e5bc7da72e9b27",
  inputCount: 25,
});

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const MANIFEST_279_PATH = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), SNAPSHOT_279.path);

export async function validateResearchIterationManifest279Snapshot(override = null) {
  const bytes = await readFile(MANIFEST_279_PATH);
  if (SNAPSHOT_279.bytes && (bytes.byteLength !== SNAPSHOT_279.bytes || sha256(bytes) !== SNAPSHOT_279.fileSha256)) {
    throw new Error("Immutable 2.79 manifest file receipt changed");
  }
  const diskManifest = JSON.parse(bytes.toString("utf8"));
  const manifest = override ?? diskManifest;
  if (JSON.stringify(manifest) !== JSON.stringify(diskManifest)) throw new Error("Immutable 2.79 manifest override differs from sealed file");
  const parent = await validateResearchIterationManifest278Snapshot();
  const inputPaths = manifest.authoritativeInputs?.map((input) => input.path) ?? [];
  if (computeManifestContentSha256(manifest) !== manifest.manifestContentSha256
    || manifest.manifestContentSha256 !== SNAPSHOT_279.contentSha256
    || manifest.manifestSchemaVersion !== "2.79.0"
    || manifest.releaseId !== SNAPSHOT_279.releaseId
    || manifest.application.version !== SNAPSHOT_279.version
    || manifest.integrity.inputCount !== SNAPSHOT_279.inputCount
    || manifest.integrity.inputPathsUnique !== true
    || manifest.authoritativeInputs.length !== SNAPSHOT_279.inputCount
    || new Set(inputPaths).size !== inputPaths.length
    || manifest.authoritativeInputs.some((input) => typeof input.path !== "string" || path.isAbsolute(input.path)
      || input.path.split("/").includes("..") || !Number.isInteger(input.bytes) || input.bytes < 1
      || !/^[a-f0-9]{64}$/.test(input.sha256))
    || manifest.parentIterationManifest.path !== SNAPSHOT_278.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_278.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_278.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_278.contentSha256) {
    throw new Error("Immutable 2.79 content, parent, or recorded input receipt shape changed");
  }
  const v1 = manifest.exactReferences.trevisanV1AgeAtlas;
  const counts = manifest.registrySummary;
  if (counts.canonicalSourceCount !== 31 || counts.canonicalRecordSetCount !== 41
    || counts.bundledExactCellProfileRosterCount !== 13 || counts.bundledExactSourceObjectSetCount !== 4
    || counts.sourceProfileCount !== 387 || counts.researchUpgradeCount !== 236
    || counts.completedResearchUpgradeCount !== 69 || counts.displayedResearchUpgradeCount !== 43
    || counts.staleCanonicalDenominatorLiteralCount !== 0
    || v1.sourceDoi !== "10.1038/s41467-026-76522-3" || v1.geoAccession !== "GSE275595"
    || v1.selectedStudyWideNucleusCount !== 89494 || v1.reportedClusterCount !== 14
    || v1.postnatalAges.join("|") !== "P0|P14|P28|P56"
    || v1.exactPerClusterCountsImported !== false || v1.exactBarcodeRosterImported !== false
    || v1.clusterByRegionAssignmentsImported !== false || v1.rawExpressionDataBundled !== false
    || v1.geoPayloadBytesDownloaded !== 0 || v1.articleLicense !== "CC BY 4.0"
    || v1.repositoryFileRightsInheritedFromArticle !== false || v1.canonicalSourceProfileContribution !== 0
    || v1.existingCanonicalProfileDenominator !== 387 || v1.includedInMain3dScene !== false
    || v1.morphologyGeometryObjectCount !== 0 || v1.internalStructureObjectCount !== 0
    || v1.sameCellJoinCount !== 0 || v1.atlasRegistrationCount !== 0 || v1.measurementCount !== 0
    || manifest.exactReferences.newGeometryCount !== 0 || manifest.exactReferences.newSameCellJoins !== 0
    || manifest.exactReferences.newRegistrations !== 0 || manifest.exactReferences.fullProjectCopyCount !== 0) {
    throw new Error("Immutable 2.79 source, denominator, reuse or non-admission boundary changed");
  }
  return {
    releaseId: manifest.releaseId,
    version: manifest.application.version,
    inputCount: manifest.integrity.inputCount,
    parentReleaseId: parent.releaseId,
    sourceCount: counts.canonicalSourceCount,
    recordSetCount: counts.canonicalRecordSetCount,
    sourceProfileCount: counts.sourceProfileCount,
    researchUpgradeCount: counts.researchUpgradeCount,
    reportedV1ClusterCount: v1.reportedClusterCount,
    selectedStudyWideNucleusCount: v1.selectedStudyWideNucleusCount,
    newGeometryCount: manifest.exactReferences.newGeometryCount,
    fullProjectCopyCount: manifest.exactReferences.fullProjectCopyCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest279Snapshot()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
