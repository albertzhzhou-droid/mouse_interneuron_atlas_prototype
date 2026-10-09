#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_280, validateResearchIterationManifest280Snapshot } from "./validate-research-iteration-manifest-2.80-snapshot.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(ROOT, "data/research-iteration-manifest-2.81.json");
export const SNAPSHOT_281 = Object.freeze({
  path: "data/research-iteration-manifest-2.81.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.81.0",
  version: "2.81.0-research.1",
  bytes: 8746,
  fileSha256: "39d75ecaac2af425f52624bc063d369146407ffb24199392d6e9b572df047d75",
  contentSha256: "e8b3aef055515023d501fd4ae8a08aa7fbcc78af912ca588e68dc36c8f122c5c",
  inputCount: 32,
});

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest281Snapshot(override = null) {
  const bytes = await readFile(MANIFEST_PATH);
  if (SNAPSHOT_281.bytes && (bytes.byteLength !== SNAPSHOT_281.bytes || sha256(bytes) !== SNAPSHOT_281.fileSha256)) {
    throw new Error("Immutable 2.81 manifest file receipt changed");
  }
  const diskManifest = JSON.parse(bytes.toString("utf8"));
  const manifest = override ?? diskManifest;
  if (JSON.stringify(manifest) !== JSON.stringify(diskManifest)) throw new Error("Immutable 2.81 manifest override differs from sealed file");
  const parent = await validateResearchIterationManifest280Snapshot();
  const inputs = manifest.authoritativeInputs?.map((input) => input.path) ?? [];
  const summary = manifest.registrySummary;
  const v1 = manifest.exactReferences?.trevisanV1SourceAvailability;
  if (computeManifestContentSha256(manifest) !== manifest.manifestContentSha256
    || manifest.manifestContentSha256 !== SNAPSHOT_281.contentSha256
    || manifest.manifestSchemaVersion !== "2.81.0"
    || manifest.releaseId !== SNAPSHOT_281.releaseId
    || manifest.application.version !== SNAPSHOT_281.version
    || manifest.integrity.inputCount !== SNAPSHOT_281.inputCount
    || manifest.integrity.inputPathsUnique !== true
    || manifest.authoritativeInputs.length !== SNAPSHOT_281.inputCount
    || new Set(inputs).size !== inputs.length
    || manifest.authoritativeInputs.some((input) => typeof input.path !== "string" || path.isAbsolute(input.path)
      || input.path.split("/").includes("..") || !Number.isInteger(input.bytes) || input.bytes < 1
      || !/^[a-f0-9]{64}$/.test(input.sha256))
    || manifest.parentIterationManifest.path !== SNAPSHOT_280.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_280.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_280.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_280.contentSha256
    || summary.canonicalSourceCount !== 31 || summary.canonicalRecordSetCount !== 41
    || summary.bundledExactCellProfileRosterCount !== 13 || summary.bundledExactSourceObjectSetCount !== 4
    || summary.sourceProfileCount !== 387 || summary.researchUpgradeCount !== 236
    || summary.completedResearchUpgradeCount !== 69 || summary.displayedResearchUpgradeCount !== 43
    || summary.staleCanonicalDenominatorLiteralCount !== 0
    || v1.auditId !== "trevisan-v1-source-data-availability-audit-0.1"
    || v1.doi !== "10.1038/s41467-026-76522-3" || v1.geoAccession !== "GSE275595"
    || v1.selectedStudyWideNucleusCount !== 89494 || v1.sourceCodeLicense !== "MIT"
    || v1.matrixInputPathSuffix !== "/outs/filtered_feature_bc_matrix" || v1.matrixReadMethod !== "Read10X"
    || v1.defaultMinCellsPerFeature !== 10 || v1.defaultMinFeaturesPerCell !== 1000
    || v1.sampleIdentifierParsingValidatedAgainstAllGeoRecords !== false
    || v1.perCellMetadataDerivationReproduced !== false || v1.supplementaryWorkbookInspected !== false
    || v1.barcodeToCountMatrixRowCrosswalkValidated !== false || v1.perNucleusAgeClusterRegionRowsValidated !== false
    || v1.geoFileSpecificReuseTermsVerified !== false || v1.canonicalSourceProfileContribution !== 0
    || v1.includedInExisting387ProfileDenominator !== false || v1.includedInMain3dScene !== false
    || v1.morphologyGeometryObjectCount !== 0 || v1.internalStructureObjectCount !== 0
    || v1.sameCellJoinCount !== 0 || v1.atlasRegistrationCount !== 0 || v1.measurementCount !== 0
    || manifest.exactReferences.newGeometryCount !== 0 || manifest.exactReferences.newSameCellJoins !== 0
    || manifest.exactReferences.newRegistrations !== 0 || manifest.exactReferences.fullProjectCopyCount !== 0
    || manifest.exactReferences.historicalParent.inputByteReplayRequired !== false) {
    throw new Error("Immutable 2.81 provenance, parent, denominator, or non-admission boundary changed");
  }
  return {
    releaseId: manifest.releaseId,
    version: manifest.application.version,
    inputCount: manifest.integrity.inputCount,
    parentReleaseId: parent.releaseId,
    sourceCount: summary.canonicalSourceCount,
    sourceProfileCount: summary.sourceProfileCount,
    researchUpgradeCount: summary.researchUpgradeCount,
    matrixInputPathSuffix: v1.matrixInputPathSuffix,
    sampleIdentifierParsingValidatedAgainstAllGeoRecords: v1.sampleIdentifierParsingValidatedAgainstAllGeoRecords,
    geoFileSpecificReuseTermsVerified: v1.geoFileSpecificReuseTermsVerified,
    newGeometryCount: manifest.exactReferences.newGeometryCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest281Snapshot()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
