#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_PATH = path.join(ROOT, "data/trevisan-v1-source-data-availability-audit-0.1.json");
const SCHEMA_PATH = path.join(ROOT, "schemas/trevisan-v1-source-data-availability-audit-0.1.schema.json");

export async function validateTrevisanV1SourceDataAvailabilityAudit01(override = null) {
  const [diskAudit, schema] = await Promise.all([
    readFile(DATA_PATH, "utf8").then(JSON.parse),
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
  ]);
  const audit = override ?? diskAudit;
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(audit)) throw new Error(`Trevisan V1 source-availability audit schema failure: ${JSON.stringify(validate.errors)}`);
  if (audit.verifiedUpstreamAvailability.articleReportsGeoRawSequencingCountsAndAssociatedMetadata !== true
    || audit.verifiedUpstreamAvailability.articleReportsUniqueFinalFigureCellBarcodesInSupplementaryData3 !== true
    || audit.verifiedUpstreamAvailability.selectedStudyWideNucleusCount !== 89494
    || audit.verifiedUpstreamAvailability.interactiveAnnotationFieldsObserved.join("|") !== "age|replicate|seurat_clusters"
    || audit.verifiedUpstreamAvailability.interactiveSubsetFieldsObserved.join("|") !== "replicate|seurat_clusters"
    || audit.verifiedUpstreamAvailability.publishedScriptCellMetadataFields.join("|") !== "age|replicate|region|seurat_clusters"
    || audit.verifiedUpstreamAvailability.analysisRepositoryCodeLicense !== "MIT"
    || audit.verifiedUpstreamAvailability.matrixLoadingFunctionDiscoversDirectorySuffix !== "*_cellranger"
    || audit.verifiedUpstreamAvailability.matrixLoadingFunctionDefaultPathSuffix !== "/outs/filtered_feature_bc_matrix"
    || audit.verifiedUpstreamAvailability.matrixLoadingFunctionReadMethod !== "Read10X"
    || audit.verifiedUpstreamAvailability.matrixLoadingFunctionDefaultMinCells !== 10
    || audit.verifiedUpstreamAvailability.matrixLoadingFunctionDefaultMinFeatures !== 1000
    || audit.verifiedUpstreamAvailability.sampleIdentifierDerivedFromDirectoryBasenameBeforeUnderscore !== true
    || audit.verifiedUpstreamAvailability.metadataFunctionDerivesAgeFromFirstNumericSubstring !== true
    || audit.verifiedUpstreamAvailability.metadataFunctionDerivesRegionFromThirdCharacterFromEnd !== true
    || audit.verifiedUpstreamAvailability.metadataFunctionDerivesReplicateFromLastCharacter !== true
    || audit.notYetVerifiedOrImported.barcodeToCountMatrixRowCrosswalkValidated !== false
    || audit.notYetVerifiedOrImported.perNucleusAgeClusterRegionRowsValidated !== false
    || audit.notYetVerifiedOrImported.geoFileSpecificReuseTermsVerified !== false
    || audit.notYetVerifiedOrImported.sampleIdentifierParsingValidatedAgainstAllGeoRecords !== false
    || audit.notYetVerifiedOrImported.perCellMetadataDerivationReproduced !== false
    || audit.interpretationBoundary.sourceCodeFieldsAreNotValidatedPerNucleusAssignments !== true
    || audit.interpretationBoundary.articleLicenseDoesNotAutomaticallyEstablishGeoFileLicense !== true
    || audit.interpretationBoundary.sampleNameParsingRulesAreNotValidatedAgainstGeoRecords !== true
    || audit.admissionBoundary.canonicalSourceProfileContribution !== 0
    || audit.admissionBoundary.includedInExisting387ProfileDenominator !== false
    || audit.admissionBoundary.includedInMain3dScene !== false
    || audit.admissionBoundary.morphologyGeometryObjectCount !== 0
    || audit.admissionBoundary.internalStructureObjectCount !== 0
    || audit.admissionBoundary.sameCellJoinCount !== 0
    || audit.admissionBoundary.atlasRegistrationCount !== 0
    || audit.admissionBoundary.measurementCount !== 0) {
    throw new Error("Trevisan V1 source availability, unresolved mapping, rights, or non-admission boundary changed");
  }
  return {
    auditId: audit.auditId,
    geoAccession: audit.source.geoAccession,
    selectedStudyWideNucleusCount: audit.verifiedUpstreamAvailability.selectedStudyWideNucleusCount,
    observedInteractiveAnnotationFields: audit.verifiedUpstreamAvailability.interactiveAnnotationFieldsObserved.length,
    publishedScriptCellMetadataFields: audit.verifiedUpstreamAvailability.publishedScriptCellMetadataFields.length,
    defaultMatrixInputPathSuffix: audit.verifiedUpstreamAvailability.matrixLoadingFunctionDefaultPathSuffix,
    sampleIdentifierParsingValidatedAgainstAllGeoRecords: audit.notYetVerifiedOrImported.sampleIdentifierParsingValidatedAgainstAllGeoRecords,
    barcodeToCountMatrixRowCrosswalkValidated: audit.notYetVerifiedOrImported.barcodeToCountMatrixRowCrosswalkValidated,
    geoFileSpecificReuseTermsVerified: audit.notYetVerifiedOrImported.geoFileSpecificReuseTermsVerified,
    canonicalSourceProfileContribution: audit.admissionBoundary.canonicalSourceProfileContribution,
    morphologyGeometryObjectCount: audit.admissionBoundary.morphologyGeometryObjectCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateTrevisanV1SourceDataAvailabilityAudit01()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
