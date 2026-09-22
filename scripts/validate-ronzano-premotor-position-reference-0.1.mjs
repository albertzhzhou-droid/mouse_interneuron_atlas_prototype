#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { buildRonzanoPremotorPositionReference } from "../tools/build_ronzano_premotor_position_reference.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_PATH = path.join(PROJECT_ROOT, "data/ronzano-premotor-position-reference-0.1.json");
const ASSET_ROOT = path.join(PROJECT_ROOT, "public/data/ronzano_premotor_positions_v1");
const SOURCE_ROOT = path.join(ASSET_ROOT, "source");
const POSITION_PATH = path.join(ASSET_ROOT, "positions.json");

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

export function validateRonzanoPremotorContractSemantics(contract) {
  check(isRecord(contract), "Ronzano contract must be an object");
  check(contract.schemaVersion === "0.1.0", "Ronzano schemaVersion changed");
  check(contract.releaseId === "ohri-ronzano-premotor-position-reference-0.1.0", "Ronzano releaseId changed");
  check(contract.iteration === "2.22", "Ronzano iteration changed");
  check(contract.assetId === "ronzano-premotor-positions-v1", "Ronzano assetId changed");
  check(contract.source?.doi === "10.7554/eLife.81976", "Ronzano DOI changed");
  check(contract.source?.species?.scientificName === "Mus musculus", "Ronzano species changed");
  check(contract.source?.lifeStage?.injection === "postnatal day P1-P2", "Ronzano injection life stage changed");
  check(contract.source?.lifeStage?.analysisInterval === "8-9 days after injection", "Ronzano analysis interval changed");
  check(contract.source?.lifeStage?.adultTransfer === "not_established", "Ronzano adult-transfer boundary changed");
  check(contract.source?.cohort?.LGExperiments === 11 && contract.source?.cohort?.TAExperiments === 7, "Ronzano experiment denominators changed");
  check(contract.rights?.status === "CC-BY-4.0", "Ronzano rights status changed");
  check(contract.rights?.licenseUrl === "https://creativecommons.org/licenses/by/4.0/", "Ronzano license URL changed");

  const objectContract = contract.sourceObjectContract;
  check(objectContract?.sourceObjectKind === "labelled_cell_coordinate_row", "Ronzano source object kind changed");
  check(objectContract?.rowIdentity === "source_file_id_plus_one_based_excel_row", "Ronzano row identity changed");
  check(JSON.stringify(objectContract?.columnOrder) === JSON.stringify(["x", "y", "z"]), "Ronzano XYZ column order changed");
  check(objectContract?.headerRows === 0 && objectContract?.everyCellNumericFinite === true, "Ronzano workbook row contract changed");
  check(objectContract?.sourceFileCount === 22, "Ronzano source file count changed");
  check(objectContract?.coordinateRowCountAcrossRepresentations === 31878, "Ronzano cross-representation coordinate-row count changed");
  check(objectContract?.representations?.raw?.sourceFileCount === 11, "Ronzano raw source file count changed");
  check(objectContract?.representations?.raw?.coordinateRowCount === 14484, "Ronzano raw coordinate-row count changed");
  check(objectContract?.representations?.raw?.byMuscle?.LG === 6849 && objectContract?.representations?.raw?.byMuscle?.TA === 7635, "Ronzano raw muscle counts changed");
  check(objectContract?.representations?.normalized?.sourceFileCount === 11, "Ronzano normalized source file count changed");
  check(objectContract?.representations?.normalized?.coordinateRowCount === 17394, "Ronzano normalized coordinate-row count changed");
  check(objectContract?.representations?.normalized?.byMuscle?.LG === 9759 && objectContract?.representations?.normalized?.byMuscle?.TA === 7635, "Ronzano normalized muscle counts changed");
  check(objectContract?.sourceBundleTotalBytes === 1046636, "Ronzano source bundle byte count changed");
  check(validSha256(objectContract?.sourceBundleCanonicalReceipt?.sha256), "Ronzano source bundle SHA-256 is invalid");

  check(contract.coordinateFrames?.registrationStatus === "source_local_unregistered", "Ronzano registration status changed");
  check(contract.coordinateFrames?.registrationCount === 0 && contract.coordinateFrames?.atlasJoinCount === 0, "Ronzano coordinates cannot create registration or atlas joins");
  check(contract.coordinateFrames?.raw?.measurementUse === "forbidden" && contract.coordinateFrames?.normalized?.measurementUse === "forbidden", "Ronzano frame measurement gate changed");
  check(/1700 micrometres/.test(contract.coordinateFrames?.normalized?.displayTransform) && /900 micrometres/.test(contract.coordinateFrames?.normalized?.displayTransform), "Ronzano normalized illustrational display transform changed");

  const crossFrameAudit = contract.crossFrameAudit;
  check(crossFrameAudit?.pairCount === 11, "Ronzano cross-frame pair count changed");
  check(crossFrameAudit?.exactRowCountAndZSequencePairs === 6, "Ronzano matching cross-frame pair count changed");
  check(crossFrameAudit?.mismatchedRowCountPairs === 5, "Ronzano mismatched cross-frame pair count changed");
  check(crossFrameAudit?.admittedPointIdentityAcrossFrames === false, "Ronzano cross-frame point identity cannot be admitted");
  check(Array.isArray(crossFrameAudit?.pairs) && crossFrameAudit.pairs.length === 11, "Ronzano cross-frame pair roster changed");
  check(crossFrameAudit.pairs.every((pair) => pair.admittedPointIdentityAcrossFrames === false), "Ronzano pair audit promotes cross-frame identity");
  check(crossFrameAudit.pairs.filter((pair) => !pair.rowCountMatch).every((pair) => pair.muscle === "LG"), "Ronzano row-count mismatch scope changed");

  check(Array.isArray(contract.sourceFiles) && contract.sourceFiles.length === 22, "Ronzano source-file roster changed");
  check(new Set(contract.sourceFiles.map((file) => file.id)).size === 22, "Ronzano source-file IDs are not unique");
  check(new Set(contract.sourceFiles.map((file) => file.sha256)).size === 22, "Ronzano source-file hashes are not unique");
  check(contract.sourceFiles.every((file) => validSha256(file.sha256) && Number.isInteger(file.bytes) && file.bytes > 0 && Number.isInteger(file.rowCount) && file.rowCount > 0), "Ronzano source-file integrity receipt is invalid");
  check(contract.sourceFiles.every((file) => file.firstSourceRow === 1 && file.lastSourceRow === file.rowCount), "Ronzano one-based source-row receipt changed");
  check(contract.sourceFiles.every((file) => file.bundledPath === `public/data/ronzano_premotor_positions_v1/source/${file.fileName}`), "Ronzano bundled source path changed");

  check(contract.derivedAsset?.path === "public/data/ronzano_premotor_positions_v1/positions.json", "Ronzano derived asset path changed");
  check(contract.derivedAsset?.bytes === 1274690 && validSha256(contract.derivedAsset?.sha256), "Ronzano derived asset receipt changed");
  check(/no smoothing, interpolation, imputation, registration, point pairing, deduplication, coordinate rounding, cell generation, or geometry generation/.test(contract.derivedAsset?.derivation), "Ronzano no-generation derivation boundary changed");

  check(contract.relationshipBoundary?.samePhysicalCellAcrossFrames === "not_established", "Ronzano same-cell cross-frame identity changed");
  check(contract.relationshipBoundary?.crossSourceRelationship === "co_display_only", "Ronzano cross-source relationship changed");
  check(contract.relationshipBoundary?.crossSourceJoinCount === 0 && contract.relationshipBoundary?.registrationCount === 0, "Ronzano relationship boundary creates a join or registration");
  const missingFields = new Set(contract.missingness?.map((item) => item.field));
  for (const required of ["soma_surface", "neurite_morphology", "molecular_identity", "same_cell_nucleus_or_organelles", "synapse_roster", "adult_anatomy", "atlas_registration"]) {
    check(missingFields.has(required), `Ronzano missingness field is absent: ${required}`);
  }
  check(/labelled-cell position only/.test(contract.scientificBoundary), "Ronzano scientific point-only boundary changed");
  return contract;
}

export async function validateRonzanoPremotorPositionReference({
  contractPath = CONTRACT_PATH,
  sourceRoot = SOURCE_ROOT,
  positionPath = POSITION_PATH,
} = {}) {
  const contract = JSON.parse(await readFile(contractPath, "utf8"));
  validateRonzanoPremotorContractSemantics(contract);
  const rebuilt = await buildRonzanoPremotorPositionReference({ sourceDir: sourceRoot });
  check(JSON.stringify(contract) === JSON.stringify(rebuilt.contract), "Ronzano contract does not exactly reproduce from the bundled workbooks");
  const persistedPositionBytes = await readFile(positionPath);
  check(Buffer.compare(persistedPositionBytes, rebuilt.positionBytes) === 0, "Ronzano positions.json does not exactly reproduce from the bundled workbooks");
  return {
    releaseId: contract.releaseId,
    sourceFileCount: contract.sourceObjectContract.sourceFileCount,
    sourceBundleBytes: contract.sourceObjectContract.sourceBundleTotalBytes,
    sourceBundleSha256: contract.sourceObjectContract.sourceBundleCanonicalReceipt.sha256,
    rawCoordinateRows: contract.sourceObjectContract.representations.raw.coordinateRowCount,
    normalizedCoordinateRows: contract.sourceObjectContract.representations.normalized.coordinateRowCount,
    coordinateRowsAcrossRepresentations: contract.sourceObjectContract.coordinateRowCountAcrossRepresentations,
    derivedBytes: contract.derivedAsset.bytes,
    derivedSha256: contract.derivedAsset.sha256,
    crossFrameMismatchedPairs: contract.crossFrameAudit.mismatchedRowCountPairs,
    crossFramePointIdentityCount: 0,
    generatedCellGeometryCount: 0,
    registrationCount: contract.relationshipBoundary.registrationCount,
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const summary = await validateRonzanoPremotorPositionReference();
  process.stdout.write(`Ronzano premotor position reference valid: ${summary.sourceFileCount} source workbooks, ${summary.rawCoordinateRows} raw rows, ${summary.normalizedCoordinateRows} normalized rows, ${summary.crossFrameMismatchedPairs} unpaired frame pairs, ${summary.generatedCellGeometryCount} generated cell geometries, ${summary.registrationCount} registrations.\n`);
}
