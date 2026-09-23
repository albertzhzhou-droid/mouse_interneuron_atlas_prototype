#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parsePngImageInfo, parseTiffImageInfo } from "./validate-super-clem-synapse-reference-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_PATH = path.join(ROOT, "data/super-clem-dorsal-synapse1-serial-stack-0.1.json");
const FIGSHARE_API_PATH = path.join(ROOT, "data/source-candidates/superclem-palm-localization-20260922/figshare-17816747-v1.api.json");
const EXPECTED_FILE_IDS = [32606585, 32606588, 32606555, 32606558, 32606561, 32606567, 32606570, 32606573, 32606576, 32606579, 32606582];
const EXPECTED_MISSINGNESS = ["parent_cell_identity", "manual_contours_or_segmentation", "cross_section_alignment", "absolute_z_coordinates"];

const digest = (algorithm, bytes) => createHash(algorithm).update(bytes).digest("hex");
const isHash = (value, length = 64) => typeof value === "string" && new RegExp(`^[a-f0-9]{${length}}$`).test(value);
const check = (condition, message, errors) => { if (!condition) errors.push(message); };

function localAssetUrl(receiptPath) {
  if (typeof receiptPath !== "string" || !receiptPath.startsWith("/data/") || receiptPath.split("/").includes("..")) {
    throw new Error(`Invalid public-data path: ${receiptPath}`);
  }
  return path.join(ROOT, "public", receiptPath.slice(1));
}

export function collectSuperClemSerialStackSemanticErrors(contract) {
  const errors = [];
  check(contract?.schemaVersion === "0.1.0", "serial stack schema version must remain 0.1.0", errors);
  check(contract?.releaseId === "ohri-super-clem-dorsal-synapse1-serial-stack-0.1.0", "serial stack release id changed", errors);
  check(contract?.queueItemId === "UPG-099", "serial stack must remain scoped to UPG-099", errors);
  check(contract?.sourceDataset?.articleId === 17816747 && contract?.sourceDataset?.version === 1, "Super-CLEM source article/version changed", errors);
  check(contract?.sourceDataset?.license === "CC BY 4.0", "dataset reuse license must remain CC BY 4.0", errors);
  check(contract?.sourceObject?.sourceObjectId === "FigshareSynapse:D2-GB-E9:synapse-1", "source synapse object identity changed", errors);
  check(contract?.sourceObject?.parentCellResolved === false && contract?.sourceObject?.parentCellId === null, "parent-cell identity must remain unresolved", errors);
  check(contract?.sourceObject?.sectionThicknessNanometre === 70, "publication section thickness must remain 70 nm", errors);
  check(contract?.sequencePolicy?.sectionCount === 11, "sequence denominator must remain 11 images", errors);
  check(contract?.sequencePolicy?.absoluteZCoordinatesAvailable === false, "absolute z coordinates were not supplied", errors);
  check(contract?.sequencePolicy?.crossSectionRegistrationAvailable === false && contract?.sequencePolicy?.stackVolumeAdmitted === false, "unregistered slices cannot be admitted as a volume", errors);

  const entries = contract?.entries ?? [];
  check(entries.length === EXPECTED_FILE_IDS.length, "exactly eleven source sections must be admitted", errors);
  check(JSON.stringify(entries.map((entry) => entry.figshareFileId)) === JSON.stringify(EXPECTED_FILE_IDS), "source files must remain unique and in filename-section order", errors);
  check(new Set(entries.map((entry) => entry.localOriginal?.path)).size === entries.length, "duplicate local TIFF path in source sequence", errors);
  check(new Set(entries.map((entry) => entry.browserDerivative?.path)).size === entries.length, "duplicate PNG path in source sequence", errors);

  for (const [index, entry] of entries.entries()) {
    const expectedLabel = String(20140 + index);
    check(entry.ordinal === index + 1, `entry ${index + 1} ordinal drifted`, errors);
    check(entry.sourceSectionLabel === expectedLabel, `entry ${index + 1} source section label drifted`, errors);
    check(entry.filename?.endsWith(`-${expectedLabel}.tif`), `entry ${index + 1} filename and section label disagree`, errors);
    check(entry.sourceUrl === `https://ndownloader.figshare.com/files/${EXPECTED_FILE_IDS[index]}`, `entry ${index + 1} Figshare source URL drifted`, errors);
    check(entry.remoteReceipt?.bytes === 2405817, `entry ${index + 1} Figshare size receipt drifted`, errors);
    check(isHash(entry.remoteReceipt?.md5, 32), `entry ${index + 1} Figshare MD5 receipt is invalid`, errors);
    check(isHash(entry.localOriginal?.sha256), `entry ${index + 1} local TIFF SHA-256 receipt is invalid`, errors);
    check(isHash(entry.browserDerivative?.sha256), `entry ${index + 1} PNG SHA-256 receipt is invalid`, errors);
    check(isHash(entry.browserDerivative?.decodedRgbSha256), `entry ${index + 1} decoded-pixel SHA-256 receipt is invalid`, errors);
  }

  const permissions = contract?.claimPermissions ?? {};
  check(permissions.serialSourceImageDisplay === true && permissions.browserPngDisplay === true, "only deposited slices and browser PNGs may be displayed", errors);
  for (const field of ["absoluteZCoordinate", "crossSectionRegistration", "segmentation", "mesh", "threeDimensionalReconstruction", "cellIdentity", "namedInterneuronIdentity", "selectedAtlasRecordJoin"]) {
    check(permissions[field] === false, `${field} must remain unauthorized`, errors);
  }
  const relations = contract?.relationshipPolicy ?? {};
  for (const field of ["parentCellResolved", "namedInterneuronResolved"]) check(relations[field] === false, `${field} must remain unresolved`, errors);
  for (const field of ["selectedAtlasRecordJoinCount", "morphologyJoinCount", "typeJoinCount", "atlasJoinCount", "registrationCount"]) check(relations[field] === 0, `${field} must remain zero`, errors);
  check(JSON.stringify((contract?.missingness ?? []).map((item) => item.field)) === JSON.stringify(EXPECTED_MISSINGNESS), "missingness axes must remain complete, ordered and unique", errors);
  check((contract?.missingness ?? []).every((item) => item.status === "UNAVAILABLE"), "missing data must not be converted to biological absence", errors);
  check(contract?.conversion?.tool === "Pillow" && contract?.conversion?.version === "12.3.0", "browser conversion provenance changed", errors);
  check(contract?.conversion?.operation === "TIFF palette decode and direct PNG save", "PNG derivative must remain a format-only conversion", errors);
  check(contract?.conversion?.perEntryDecodedRgbSha256Matches === true, "per-section decoded-pixel equivalence receipt is missing", errors);
  const decodedSourceHashes = contract?.conversion?.sourceDecodedRgbSha256ByOrdinal ?? [];
  check(decodedSourceHashes.length === entries.length, "per-section source pixel hash count must match the stack", errors);
  check(decodedSourceHashes.every((hash, index) => isHash(hash) && hash === entries[index]?.browserDerivative?.decodedRgbSha256), "decoded TIFF and PNG pixel hashes must match section by section", errors);
  for (const field of ["cropCount", "resampleCount", "intensityTransformCount", "segmentationCount", "annotationCount"]) {
    check(contract?.conversion?.[field] === 0, `${field} must remain zero`, errors);
  }
  check((contract?.hardBoundaries ?? []).some((item) => /not a registered volume, segmentation, mesh or three-dimensional reconstruction/i.test(item)), "missing unregistered-volume boundary", errors);
  check((contract?.hardBoundaries ?? []).some((item) => /parent cell.*named interneuron.*unresolved/i.test(item)), "missing unresolved-cell identity boundary", errors);
  return errors;
}

export async function validateSuperClemSerialStack({ contractPath = CONTRACT_PATH, apiPath = FIGSHARE_API_PATH } = {}) {
  const contract = JSON.parse(await readFile(contractPath, "utf8"));
  const api = JSON.parse(await readFile(apiPath, "utf8"));
  const errors = collectSuperClemSerialStackSemanticErrors(contract);
  const filesById = new Map(api.files.map((file) => [file.id, file]));

  for (const entry of contract.entries) {
    const remote = filesById.get(entry.figshareFileId);
    check(Boolean(remote), `Figshare API receipt missing file ${entry.figshareFileId}`, errors);
    if (!remote) continue;
    check(remote.name === entry.filename, `Figshare filename mismatch for ${entry.figshareFileId}`, errors);
    check(remote.download_url === entry.sourceUrl, `Figshare download URL mismatch for ${entry.figshareFileId}`, errors);
    check(remote.size === entry.remoteReceipt.bytes, `Figshare byte count mismatch for ${entry.figshareFileId}`, errors);
    check(remote.supplied_md5 === entry.remoteReceipt.md5 && remote.computed_md5 === entry.remoteReceipt.md5, `Figshare MD5 receipt mismatch for ${entry.figshareFileId}`, errors);

    try {
      const sourceBytes = await readFile(localAssetUrl(entry.localOriginal.path));
      check(sourceBytes.byteLength === entry.remoteReceipt.bytes, `local TIFF byte count mismatch for ${entry.figshareFileId}`, errors);
      check(digest("md5", sourceBytes) === entry.remoteReceipt.md5, `local TIFF MD5 mismatch for ${entry.figshareFileId}`, errors);
      check(digest("sha256", sourceBytes) === entry.localOriginal.sha256, `local TIFF SHA-256 mismatch for ${entry.figshareFileId}`, errors);
      const image = parseTiffImageInfo(sourceBytes);
      check(image.widthPixels === 1794 && image.heightPixels === 1332, `TIFF dimensions mismatch for ${entry.figshareFileId}`, errors);
      check(image.bitsPerSample.length === 1 && image.bitsPerSample[0] === 8 && image.samplesPerPixel === 1 && image.photometricInterpretation === 3 && image.storageEncoding === "indexed_rgb_palette", `TIFF storage encoding mismatch for ${entry.figshareFileId}`, errors);

      const pngBytes = await readFile(localAssetUrl(entry.browserDerivative.path));
      check(pngBytes.byteLength === entry.browserDerivative.bytes, `browser PNG byte count mismatch for ${entry.figshareFileId}`, errors);
      check(digest("sha256", pngBytes) === entry.browserDerivative.sha256, `browser PNG SHA-256 mismatch for ${entry.figshareFileId}`, errors);
      const png = parsePngImageInfo(pngBytes);
      check(png.widthPixels === 1794 && png.heightPixels === 1332 && png.bitDepth === 8 && png.colorType === 3, `browser PNG dimensions or palette encoding mismatch for ${entry.figshareFileId}`, errors);
    } catch (error) {
      errors.push(`serial-stack file ${entry.figshareFileId} could not be verified: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (errors.length) throw new Error(errors.join("\n"));
  return {
    releaseId: contract.releaseId,
    sourceObjectId: contract.sourceObject.sourceObjectId,
    sourceSectionCount: contract.entries.length,
    sourceBytes: contract.entries.reduce((sum, entry) => sum + entry.remoteReceipt.bytes, 0),
    browserDerivativeCount: contract.entries.length,
    crossSectionRegistrationCount: 0,
    admittedVolumeCount: 0,
    parentCellResolved: false,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateSuperClemSerialStack()
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
