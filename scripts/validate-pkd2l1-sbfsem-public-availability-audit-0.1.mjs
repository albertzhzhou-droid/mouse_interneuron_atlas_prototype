#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_PATH = path.join(ROOT, "data/pkd2l1-sbfsem-public-availability-audit-0.1.json");

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function validatePkd2l1SbfsemPublicAvailabilityAudit(value) {
  check(value && typeof value === "object" && !Array.isArray(value), "PKD2L1 public-availability audit must be an object");
  check(value.schemaVersion === "0.1.0" && value.auditId === "ohri-pkd2l1-sbfsem-public-availability-audit-0.1.0"
    && value.researchUpgradeId === "UPG-242" && value.auditDate === "2026-09-23", "UPG-242 public-availability audit identity is invalid");
  check(value.scope.boundary === "official_article_article_api_figures_page_and_elife_site_terms"
    && value.scope.notAUniversalAbsenceClaim === true
    && value.scope.articleApiReceipt.url === "https://api.elifesciences.org/articles/83108"
    && value.scope.articleApiReceipt.bytes === 247909
    && value.scope.articleApiReceipt.sha256 === "854963b39bbb091f4cf3a03c470e3a644a69444741b59aa6287b31ed10f97944"
    && value.scope.articleApiReceipt.articleVersion === 2
    && value.scope.sourcesReviewed.length === 4, "UPG-242 source scope or pinned article-API receipt changed");
  check(value.source.doi === "10.7554/eLife.83108" && value.source.species === "Mus musculus"
    && value.source.articleLicense === "CC-BY-4.0" && value.source.attributionRequired === true
    && /no separate Video 5 exception was found/i.test(value.source.siteTermsDisposition), "UPG-242 primary-source identity or bounded rights reading changed");
  check(value.articleDataAvailability.singleCellLightMicroscopyTracingPopulationCount === 71
    && value.articleDataAvailability.countIsSbfsemCellCensus === false
    && sameJson(value.articleDataAvailability.formalStatementNumericalSourceDataFigures, [2, 7])
    && sameJson(value.articleDataAvailability.articleApiSourceDataFigureNumbers, [2, 3, 7])
    && value.articleDataAvailability.apiFigure3SourceDataIsSbfsemVolumeOrSegmentation === false
    && value.articleDataAvailability.officialFiguresPageCounts.figures === 7
    && value.articleDataAvailability.officialFiguresPageCounts.videos === 7
    && value.articleDataAvailability.officialFiguresPageCounts.additionalFiles === 1, "UPG-242 article/figures-page availability denominators changed");
  check(value.figure4.figureNumber === 4 && value.figure4.publicationReconstructionPanel === "J"
    && sameJson(value.figure4.representativeSbfsemSerialImagePanels, ["C", "D", "E", "F", "G", "H", "I"])
    && value.figure4.rawVoxelStackProvidedInReviewedScope === false
    && value.figure4.segmentationFilesProvidedInReviewedScope === false
    && value.figure4.stableEmCellObjectIdsProvidedInReviewedScope === false, "UPG-242 Figure 4 evidence boundary changed");
  const formats = value.video5.renditions.map((rendition) => rendition.format).toSorted();
  check(value.video5.articleApiObjectId === "video5" && value.video5.widthPixels === 872 && value.video5.heightPixels === 1080
    && sameJson(formats, ["mp4", "ogv", "webm"])
    && value.video5.delivery === "remote_media_renditions_not_a_source_voxel_stack", "UPG-242 Video 5 rendition receipt changed");
  const mp4 = value.video5.renditions.find((rendition) => rendition.format === "mp4");
  check(mp4?.bytes === 46541650 && mp4.etag === "492326b245e768ffe6fdf7923880b8f6"
    && value.video5.renditions.every((rendition) => /^https:\/\//.test(rendition.url)), "UPG-242 Video 5 MP4 receipt or remote-delivery state changed");
  check(value.acquisitionMetadata.reportedPixelSizeNanometre === 5 && value.acquisitionMetadata.reportedSectionStepNanometre === 50
    && sameJson(value.acquisitionMetadata.reportedImageWidthMicrometreRange, [20, 60])
    && sameJson(value.acquisitionMetadata.reportedImageHeightMicrometreRange, [40, 60])
    && value.acquisitionMetadata.completeStackArrayDimensions === null
    && value.acquisitionMetadata.volumeAxisOrder === null, "UPG-242 reported acquisition metadata or unknown stack dimensions changed");
  const readiness = value.objectAndRightsReadiness;
  for (const field of ["rawVoxelStackAvailableInReviewedScope", "cellSegmentationLabelsAvailableInReviewedScope", "organelleSegmentationLabelsAvailableInReviewedScope", "reconstructionMeshAvailableInReviewedScope", "skeletonAvailableInReviewedScope", "stableEmObjectCrosswalkAvailableInReviewedScope", "exactVideoToCellObjectIdentityAvailable", "volumeVoxelAxesAndFullDimensionsAvailable", "videoDownloadedByThisAudit", "videoBundledByProject"]) {
    check(readiness[field] === false, `UPG-242 ${field} must remain false`);
  }
  for (const field of ["rawVolumePayloadBytesDownloaded", "admittedEmVolumes", "admittedCellOrOrganelleGeometry", "admittedInternalObjects", "sameCellJoins", "registrations"]) {
    check(readiness[field] === 0, `UPG-242 ${field} must remain zero`);
  }
  check(readiness.measurementUse === "forbidden" && value.interpretationBoundary.length >= 5
    && value.interpretationBoundary.some((text) => /does not establish that no additional data exist elsewhere/i.test(text)), "UPG-242 no-measurement or bounded-absence statement changed");
  return value;
}

export async function validatePkd2l1SbfsemPublicAvailabilityAuditFile() {
  return validatePkd2l1SbfsemPublicAvailabilityAudit(JSON.parse(await readFile(DATA_PATH, "utf8")));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validatePkd2l1SbfsemPublicAvailabilityAuditFile()
    .then((value) => process.stdout.write(`UPG-242 public availability audit passed: ${value.video5.articleApiObjectId}; ${value.objectAndRightsReadiness.admittedInternalObjects} internal objects; ${value.objectAndRightsReadiness.rawVolumePayloadBytesDownloaded} payload bytes downloaded\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
