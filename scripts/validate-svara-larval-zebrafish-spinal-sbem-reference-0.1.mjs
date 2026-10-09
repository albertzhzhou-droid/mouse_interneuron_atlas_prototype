#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_PATH = path.join(ROOT, "data/svara-larval-zebrafish-spinal-sbem-reference-0.1.json");
const EXPECTED_PACKAGES = [
  ["file_3055230", "1-s2.0-S2211124718307563-mmc6.zip", "https://pure.mpg.de/pubman/item/item_3055210_7/component/file_3055230/1-s2.0-S2211124718307563-mmc6.zip"],
  ["file_3055231", "1-s2.0-S2211124718307563-mmc7.zip", "https://pure.mpg.de/pubman/item/item_3055210_7/component/file_3055231/1-s2.0-S2211124718307563-mmc7.zip"],
  ["file_3055232", "1-s2.0-S2211124718307563-mmc8.zip", "https://pure.mpg.de/pubman/item/item_3055210_7/component/file_3055232/1-s2.0-S2211124718307563-mmc8.zip"],
];

function check(condition, message) {
  if (!condition) throw new Error(message);
}

export async function validateSvaraLarvalZebrafishSpinalSbemReference(override = null) {
  const contract = override ?? JSON.parse(await readFile(CONTRACT_PATH, "utf8"));
  check(contract.schemaVersion === "0.1.0" && contract.contractId === "svara-larval-zebrafish-spinal-sbem-reference-0.1"
    && contract.auditDate === "2026-09-23" && contract.source.doi === "10.1016/j.celrep.2018.05.023", "Svara source identity changed");
  check(contract.biologicalScope.species === "Danio rerio" && contract.biologicalScope.lifeStage === "6 dpf larval zebrafish"
    && contract.biologicalScope.specimenCount === 1 && contract.biologicalScope.specimenUnit === "larva", "Svara species, stage, or specimen denominator changed");
  check(contract.acquisition.modality === "serial block-face electron microscopy (SBEM)"
    && JSON.stringify(contract.acquisition.reportedVolumeLengthMicrometre) === JSON.stringify([74, 74, 207])
    && JSON.stringify(contract.acquisition.reportedVoxelPitchNanometre) === JSON.stringify([9, 9, 21])
    && contract.acquisition.axisOrderNamed === false, "Svara acquisition receipt or unnamed axes changed");
  const coverage = contract.acquisition.segmentCoverage;
  check(coverage.fullyContainedSegments === 2 && JSON.stringify(coverage.adjacentSegmentCoveragePercent) === JSON.stringify([
    { position: "rostral", coveragePercent: 51 }, { position: "caudal", coveragePercent: 71 },
  ]) && JSON.stringify(coverage.fullSegmentSomata) === JSON.stringify([671, 652]) && coverage.somataInVolume === 2177, "Svara source-volume denominators changed");
  const reconstructions = contract.publishedReconstructions;
  check(reconstructions.motoneurons.count === 139 && reconstructions.motoneurons.leftHemisegment === 68 && reconstructions.motoneurons.rightHemisegment === 71
    && reconstructions.morphologyConsistentCiDs.count === 39 && reconstructions.morphologyConsistentCiDs.completelyTracedCellContext === 170
    && reconstructions.morphologyConsistentCiDs.geneticV2aAssignmentAvailable === false && reconstructions.CoBLs.count === 34, "Svara source-reported reconstruction counts or taxonomy boundary changed");
  const packages = contract.supplementPackages;
  check(packages.reportedPackageCount === EXPECTED_PACKAGES.length && packages.packages.length === EXPECTED_PACKAGES.length
    && packages.packages.every((pkg, index) => pkg.repositoryComponentId === EXPECTED_PACKAGES[index][0]
      && pkg.filename === EXPECTED_PACKAGES[index][1] && pkg.sourceUrl === EXPECTED_PACKAGES[index][2] && pkg.listed === true), "Officially listed Svara supplement package identity or URL changed");
  check(packages.packageContentInspection === "not performed" && packages.fileSizesBytes === null && packages.checksums === null
    && packages.memberFileFormats === "unknown" && packages.stableNeuronObjectIdCrosswalk === "unknown"
    && packages.perPackageReuseTerms === "not verified", "Uninspected Svara supplement metadata must remain unknown");
  check(contract.source.articleLicense.includes("CC BY 4.0") && contract.source.articleLicense.includes("not treated as a separately verified licence")
    && packages.assetDecision.startsWith("Expose direct official repository links only"), "Svara article and supplement asset-rights scopes were conflated");
  const boundary = contract.identityAndGeometryBoundary;
  check(boundary.appAdmittedNeuronObjects === 0 && boundary.appAdmittedSkeletons === 0 && boundary.appAdmittedMeshes === 0
    && boundary.appAdmittedSynapseEdges === 0 && boundary.sameCellJoinCount === 0
    && boundary.mouseIdentityTransferAllowed === false && boundary.crossSpeciesCoordinateTransferAllowed === false
    && boundary.createInterpolatedGeometry === false, "Svara comparative reference cannot admit geometry or transfer zebrafish evidence to mouse");
  check(contract.sources.length === 7 && contract.sources.every((source) => /^https:\/\//.test(source.url))
    && contract.sources.some((source) => source.url === "https://pure.mpg.de/pubman/item/item_3055210_7/component/file_3055224/1-s2.0-S2211124718307563-main.pdf")
    && contract.sources.some((source) => source.url === packages.sourceListingUrl)
    && EXPECTED_PACKAGES.every(([, , url]) => contract.sources.some((source) => source.url === url))
    && contract.sources.some((source) => source.url === "https://freidok.uni-freiburg.de/data/145135"), "Svara primary source and unresolved archive routes are incomplete");
  check(!("geometry" in contract) && !("skeletonPayload" in contract) && !("meshPayload" in contract), "Link-only Svara source cannot embed reconstruction payloads");

  return {
    contractId: contract.contractId,
    species: contract.biologicalScope.species,
    specimenCount: contract.biologicalScope.specimenCount,
    reportedCiDCount: reconstructions.morphologyConsistentCiDs.count,
    reportedCoBLCount: reconstructions.CoBLs.count,
    listedSupplementPackageCount: packages.packages.length,
    packageLinks: packages.packages.map((pkg) => pkg.sourceUrl),
    inspectedSupplementPackageCount: 0,
    admittedNeuronObjectCount: boundary.appAdmittedNeuronObjects,
    admittedGeometryCount: boundary.appAdmittedSkeletons + boundary.appAdmittedMeshes,
    downloadedPayloadBytes: 0,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateSvaraLarvalZebrafishSpinalSbemReference()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
