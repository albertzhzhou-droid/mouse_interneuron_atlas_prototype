#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_281, validateResearchIterationManifest281Snapshot } from "./validate-research-iteration-manifest-2.81-snapshot.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(ROOT, "data/research-iteration-manifest-2.82.json");
export const SNAPSHOT_282 = Object.freeze({
  path: "data/research-iteration-manifest-2.82.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.82.0",
  version: "2.82.0-research.1",
  bytes: 10302,
  fileSha256: "df0e1a088a33fe5cfebcabbbec20207a998b5f106841ad133bf45e313fb44c3f",
  contentSha256: "74c3318fe766f9c679f9cef52942fb06914fe7d72185d200de8030089c327e58",
  inputCount: 37,
});

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest282Snapshot(override = null) {
  const bytes = await readFile(MANIFEST_PATH);
  if (SNAPSHOT_282.bytes && (bytes.byteLength !== SNAPSHOT_282.bytes || sha256(bytes) !== SNAPSHOT_282.fileSha256)) {
    throw new Error("Immutable 2.82 manifest file receipt changed");
  }
  const diskManifest = JSON.parse(bytes.toString("utf8"));
  const manifest = override ?? diskManifest;
  if (JSON.stringify(manifest) !== JSON.stringify(diskManifest)) throw new Error("Immutable 2.82 manifest override differs from sealed file");
  const parent = await validateResearchIterationManifest281Snapshot();
  const inputPaths = manifest.authoritativeInputs?.map((input) => input.path) ?? [];
  const summary = manifest.registrySummary;
  const references = manifest.exactReferences;
  const v1 = references?.trevisanV1SourceAvailability;
  const sample = references?.trevisanV1GeoSampleAudit;
  if (computeManifestContentSha256(manifest) !== manifest.manifestContentSha256
    || manifest.manifestContentSha256 !== SNAPSHOT_282.contentSha256
    || manifest.manifestSchemaVersion !== "2.82.0"
    || manifest.releaseId !== SNAPSHOT_282.releaseId
    || manifest.application.version !== SNAPSHOT_282.version
    || manifest.integrity.inputCount !== SNAPSHOT_282.inputCount
    || manifest.integrity.inputPathsUnique !== true
    || manifest.authoritativeInputs.length !== SNAPSHOT_282.inputCount
    || new Set(inputPaths).size !== inputPaths.length
    || manifest.authoritativeInputs.some((input) => typeof input.path !== "string" || path.isAbsolute(input.path)
      || input.path.split("/").includes("..") || !Number.isInteger(input.bytes) || input.bytes < 1
      || !/^[a-f0-9]{64}$/.test(input.sha256))
    || manifest.parentIterationManifest.path !== SNAPSHOT_281.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_281.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_281.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_281.contentSha256
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
    || sample.auditId !== "trevisan-v1-geo-series-sample-audit-0.1"
    || sample.seriesSampleRecordCount !== 29 || sample.expectedPostnatalTitlePatternMatchCount !== 24
    || sample.parserExceptionCount !== 5
    || sample.exceptionAccessions.join("|") !== "GSM8480601|GSM8480602|GSM8480603|GSM8480604|GSM8480605"
    || sample.representativeSampleMetadataCount !== 3 || sample.supplementaryTarBytes !== 1450055680
    || sample.anyGsmMatrixPayloadDownloadedOrChecksummed !== false || sample.geoFileSpecificReuseTermsVerified !== false
    || sample.perCellBarcodeToMatrixCrosswalkValidated !== false || sample.perCellAgeClusterRegionRowsReproduced !== false
    || sample.canonicalSourceProfileContribution !== 0 || sample.morphologyGeometryObjectCount !== 0
    || sample.internalStructureObjectCount !== 0 || sample.sameCellJoinCount !== 0
    || sample.atlasRegistrationCount !== 0 || sample.measurementCount !== 0
    || references.newGeometryCount !== 0 || references.newSameCellJoins !== 0
    || references.newRegistrations !== 0 || references.fullProjectCopyCount !== 0
    || references.historicalParent.inputByteReplayRequired !== false) {
    throw new Error("Immutable 2.82 provenance, parent, denominator, GEO sample audit, or non-admission boundary changed");
  }
  return {
    releaseId: manifest.releaseId,
    version: manifest.application.version,
    inputCount: manifest.integrity.inputCount,
    parentReleaseId: parent.releaseId,
    sourceCount: summary.canonicalSourceCount,
    sourceProfileCount: summary.sourceProfileCount,
    researchUpgradeCount: summary.researchUpgradeCount,
    geoSampleRecordCount: sample.seriesSampleRecordCount,
    titlePatternMatchCount: sample.expectedPostnatalTitlePatternMatchCount,
    parserExceptionCount: sample.parserExceptionCount,
    matrixPayloadDownloadedOrChecksummed: sample.anyGsmMatrixPayloadDownloadedOrChecksummed,
    geoFileSpecificReuseTermsVerified: sample.geoFileSpecificReuseTermsVerified,
    newGeometryCount: references.newGeometryCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest282Snapshot()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
