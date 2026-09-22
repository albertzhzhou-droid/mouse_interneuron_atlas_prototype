#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_PATH = path.join(ROOT, "data/pkd2l1-sbfsem-video-reference-0.1.json");

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function exactKeys(value, keys, label) {
  check(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  check(JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort()), `${label} fields are invalid`);
}

export function validatePkd2l1SbfsemVideoReference(value) {
  exactKeys(value, ["schemaVersion", "contractId", "releaseDate", "authority", "source", "biologicalScope", "acquisition", "video", "observedClaims", "objectReadiness", "availabilityAudit", "hardBoundaries"], "PKD2L1 video reference");
  check(value.schemaVersion === "0.1.0" && value.contractId === "ohri-pkd2l1-sbfsem-video-reference-0.1.0", "PKD2L1 video reference identity is invalid");
  check(value.authority === "OBS_PUBLICATION_VIDEO_REFERENCE", "PKD2L1 video reference authority is invalid");
  check(value.source.doi === "10.7554/eLife.83108" && value.source.license === "CC-BY-4.0" && value.source.articleVersion === 2, "PKD2L1 primary-source receipt is invalid");
  check(value.source.apiReceipt.bytes === 247909
    && value.source.apiReceipt.sha256 === "854963b39bbb091f4cf3a03c470e3a644a69444741b59aa6287b31ed10f97944"
    && value.source.apiReceipt.bundled === false, "PKD2L1 article-API receipt is invalid");
  check(value.biologicalScope.species === "Mus musculus"
    && /Pkd2l1-Cre/.test(value.biologicalScope.population)
    && /Cervical spinal cord/.test(value.biologicalScope.spinalContext), "PKD2L1 biological scope is invalid");
  check(value.biologicalScope.relationshipToAtlasRecords === "independent_publication_reference_only"
    && value.biologicalScope.sameSpecimenJoinCount === 0
    && value.biologicalScope.sameCellJoinCount === 0
    && value.biologicalScope.registrationCount === 0, "PKD2L1 relationship boundary is invalid");
  check(value.acquisition.modality === "serial block-face scanning electron microscopy"
    && value.acquisition.pixelSizeNanometre === 5
    && value.acquisition.sectionStepNanometre === 50
    && value.acquisition.reportedDepth === ">25 µm", "PKD2L1 acquisition receipt is invalid");
  check(value.video.id === "video5" && value.video.label === "Video 5" && value.video.width === 872 && value.video.height === 1080, "PKD2L1 video identity is invalid");
  check(value.video.delivery === "remote_stream_only_not_bundled" && value.video.sources.length === 3, "PKD2L1 video delivery declaration is invalid");
  const formats = new Set(value.video.sources.map((source) => source.format));
  check(formats.size === 3 && ["mp4", "webm", "ogv"].every((format) => formats.has(format)), "PKD2L1 video rendition set is invalid");
  check(value.video.sources.every((source) => /^https:\/\//.test(source.url) && source.url.includes("elife-83108-video5")), "PKD2L1 video source URLs are invalid");
  const mp4 = value.video.sources.find((source) => source.format === "mp4");
  check(mp4?.bytes === 46541650 && mp4.etag === "492326b245e768ffe6fdf7923880b8f6", "PKD2L1 MP4 receipt is invalid");
  check(Array.isArray(value.observedClaims) && value.observedClaims.length === 3, "PKD2L1 observed-claim set is invalid");
  const readiness = value.objectReadiness;
  check(readiness.observedImageFrames === true
    && readiness.publicationRenderedReconstruction === true
    && readiness.rawVoxelStackExposedByArticleApi === false
    && readiness.segmentationLabelsExposedByArticleApi === false
    && readiness.reconstructionMeshExposedByArticleApi === false
    && readiness.skeletonExposedByArticleApi === false
    && readiness.stableObjectIdsExposedByArticleApi === false
    && readiness.coordinateBearingObjectAdmitted === false
    && readiness.eligibleForThreeDimensionalReconstruction === false
    && readiness.admittedGeometryPrimitiveCount === 0
    && readiness.admittedInternalObjectCount === 0
    && readiness.measurementUse === "forbidden", "PKD2L1 object-readiness gate is invalid");
  check(value.availabilityAudit.scope === "official_article_and_article_api_only"
    && value.availabilityAudit.notAUniversalAbsenceClaim === true
    && /Neither the official article availability statement nor the article API/.test(value.availabilityAudit.finding), "PKD2L1 availability-audit scope is invalid");
  check(Array.isArray(value.hardBoundaries)
    && value.hardBoundaries.length === 5
    && /zero fallback primitives/.test(value.hardBoundaries.at(-1)), "PKD2L1 hard boundaries are invalid");
  return value;
}

export async function validatePkd2l1SbfsemVideoReferenceFile() {
  return validatePkd2l1SbfsemVideoReference(JSON.parse(await readFile(DATA_PATH, "utf8")));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validatePkd2l1SbfsemVideoReferenceFile()
    .then((value) => console.log(`PKD2L1 SBF-SEM video reference validation passed: ${value.video.label}; ${value.objectReadiness.admittedGeometryPrimitiveCount} geometry primitives`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
