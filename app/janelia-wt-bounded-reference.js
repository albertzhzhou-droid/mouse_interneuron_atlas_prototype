const RAW_HASH = "1a473947d5093925e09e0b7d830de4a38734f512d90232905bc72ed60d915c05";
const NUCLEUS_HASH = "39130ba800eaf10d89c6974959c51f322308105f8af77b48e62ca6beb298face";

function assert(condition, message) {
  if (!condition) throw new Error(`Janelia WT reference: ${message}`);
}

function same(actual, expected) { return JSON.stringify(actual) === JSON.stringify(expected); }

/** @param {typeof import("../data/janelia-wt-bounded-reference-0.1.json")} reference */
export function validateJaneliaWtReference(reference) {
  assert(reference?.schemaVersion === "0.1.0" && reference.contractId === "janelia-wt-bounded-raw-nucleus-reference-0.1", "unsupported contract");
  assert(reference.datasetId === "jrc_mus-sc-zp104a" && reference.disposition === "co_display_only" && reference.sourceFrame === "jrc_mus-sc-zp104a/recon-1/source_local_ZYX_nanometer", "source identity or frame changed");
  assert(reference.sourceRecords.length === 2 && reference.sourceRecords[0].id === 20134574 && reference.sourceRecords[1].id === 26513224, "raw and manual annotation records must remain paired");
  for (const record of reference.sourceRecords) assert(record.version === 1 && record.license.name === "CC BY 4.0" && record.license.url === "https://creativecommons.org/licenses/by/4.0/", "exact source rights changed");
  for (const [volume, shape, scale, translation, origin, hash, url] of [
    [reference.raw, [128, 128, 128], [6, 6, 6], [0, 0, 0], [10496, 2816, 2176], RAW_HASH, "/data/janelia_wt_reference_v1/raw.u8"],
    [reference.nucleus, [64, 64, 64], [96, 96, 96], [45, 45, 45], [640, 128, 128], NUCLEUS_HASH, "/data/janelia_wt_reference_v1/nucleus.u8"],
  ]) {
    assert(same(volume.axes, ["z", "y", "x"]) && volume.unit === "nanometer", "source axis or unit changed");
    assert(same(volume.chunkShapeZYX, shape) && same(volume.scaleNanometreZYX, scale) && same(volume.translationNanometreZYX, translation) && same(volume.firstGlobalIndexZYX, origin), "source calibration or chunk changed");
    assert(volume.payload.encoding === "uint8_C_order_ZYX_uncompressed" && volume.payload.bytes === shape.reduce((a, b) => a * b, 1) && volume.payload.sha256 === hash && volume.payload.url === url, "lossless payload descriptor changed");
  }
  assert(reference.nucleus.instanceValue === 2 && same(reference.nucleus.labelValues, [0, 2]) && reference.nucleus.instanceVoxelCountInChunk === 69867, "manual annotation inventory changed");
  assert(reference.nucleus.annotation.absentValue === 0 && reference.nucleus.annotation.unknownValue === 255 && reference.nucleus.annotation.type === "instance_segmentation", "manual annotation semantics changed");
  assert(reference.nucleus.stableBiologicalCellId === null && reference.nucleus.partialObjectOnly === true && reference.nucleus.completeNucleusEstablished === false, "partial annotation cannot establish a complete cell or nucleus");
  assert(reference.overlap.relationship === "same_source_volume_spatial_overlap_only" && reference.overlap.rawToNucleusGridRatio === 16 && same(reference.overlap.nucleusLocalBoundsHalfOpenZYX, { minimum: [16, 48, 8], maximumExclusive: [24, 56, 16] }) && reference.overlap.sourceNucleusVoxelsCovered === 512 && reference.overlap.uniformInstanceValue === 2, "source overlap changed");
  assert(reference.claims.cellClass === "unknown" && Object.entries(reference.claims).every(([key, value]) => key === "cellClass" || value === 0), "unestablished biological joins or measurements");
  assert(reference.sourceExtentDifference.status === "unresolved_nominal_description_versus_live_array" && reference.sourceExtentDifference.biologicalMeasurementAuthorized === false, "unresolved source extent cannot authorize measurements");
  return { sourceFiles: reference.sourceReceipts.length, rawBytes: 128 ** 3, nucleusBytes: 64 ** 3, selectedCellJoins: 0 };
}

/** Verify byte length and SHA256 before any source plane is displayed.
 * @param {Uint8Array} bytes
 * @param {typeof import("../data/janelia-wt-bounded-reference-0.1.json").raw.payload} descriptor
 */
export async function verifyJaneliaWtPayload(bytes, descriptor) {
  assert(bytes instanceof Uint8Array && bytes.length === descriptor.bytes, "payload length mismatch");
  const owned = new Uint8Array(bytes);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", owned.buffer);
  const hash = Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
  assert(hash === descriptor.sha256, "payload checksum mismatch");
  return owned;
}

/** Native manual samples align with means of sixteen raw samples, not each raw plane.
 * @param {typeof import("../data/janelia-wt-bounded-reference-0.1.json")} reference
 * @param {number} rawSlice
 */
export function getJaneliaWtSliceMapping(reference, rawSlice) {
  validateJaneliaWtReference(reference);
  assert(Number.isInteger(rawSlice) && rawSlice >= 0 && rawSlice < 128, "raw slice is outside this chunk");
  const labelSlice = 16 + Math.floor(rawSlice / 16);
  return {
    rawSlice, labelSlice,
    rawGlobalZIndex: 10496 + rawSlice,
    rawSampleZNanometre: (10496 + rawSlice) * 6,
    labelGlobalZIndex: 640 + labelSlice,
    labelSampleZNanometre: (640 + labelSlice) * 96 + 45,
    rawGroupMinimumSlice: Math.floor(rawSlice / 16) * 16,
    rawGroupMaximumExclusiveSlice: (Math.floor(rawSlice / 16) + 1) * 16,
    roiXY: { x: 8, y: 48, width: 8, height: 8 },
    relationship: "same_source_volume_spatial_overlap_only",
  };
}

/** @param {Uint8Array} raw @param {Uint8Array} nucleus @param {number} rawSlice */
export function getJaneliaWtNativePlanes(raw, nucleus, rawSlice) {
  assert(raw.length === 128 ** 3 && nucleus.length === 64 ** 3, "chunk length mismatch");
  assert(Number.isInteger(rawSlice) && rawSlice >= 0 && rawSlice < 128, "raw slice is outside this chunk");
  const labelSlice = 16 + Math.floor(rawSlice / 16);
  return { raw: raw.subarray(rawSlice * 128 ** 2, (rawSlice + 1) * 128 ** 2), nucleus: nucleus.subarray(labelSlice * 64 ** 2, (labelSlice + 1) * 64 ** 2) };
}

/** Unknown source labels retain unknown semantics; they never become this instance.
 * @param {number} value
 */
export function interpretJaneliaWtLabel(value) {
  assert(Number.isInteger(value) && value >= 0 && value <= 255, "invalid uint8 annotation value");
  if (value === 0) return "annotation_absent";
  if (value === 2) return "manual_nucleus_instance_2_cell_class_unknown";
  if (value === 255) return "annotation_unknown";
  return "uninspected_instance_value";
}

/** @param {typeof import("../data/janelia-wt-bounded-reference-0.1.json")} reference @param {number} rawSlice */
export function buildJaneliaWtPlaneReceipt(reference, rawSlice) {
  return { receiptType: "source_local_native_2d_reference", checkedDate: reference.checkedDate, datasetId: reference.datasetId, sourceFrame: reference.sourceFrame, sourceRecords: reference.sourceRecords,
    sourceReceipts: reference.sourceReceipts, rawPayload: reference.raw.payload, nucleusPayload: reference.nucleus.payload, plane: getJaneliaWtSliceMapping(reference, rawSlice),
    nucleusObject: reference.nucleus.objectLabel, sourceExtentDifference: reference.sourceExtentDifference, claims: reference.claims, derivativeNotice: reference.derivativeNotice };
}
