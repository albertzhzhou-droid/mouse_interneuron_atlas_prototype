import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { zstdDecompressSync } from "node:zlib";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = resolve(root, "data/source-candidates/janelia-wt-reference-20260930");
const output = resolve(root, "public/data/janelia_wt_reference_v1");
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const json = async (name) => JSON.parse(await readFile(resolve(source, name), "utf8"));
const receipt = await json("receipt.json");
for (const file of receipt.files) {
  const bytes = await readFile(resolve(root, file.path));
  if (bytes.length !== file.bytes || sha(bytes) !== file.sha256) throw new Error("Source receipt mismatch: " + file.path);
}
const rawRecord = await json("raw-figshare.json");
const nucleusRecord = await json("nucleus-figshare.json");
for (const record of [rawRecord, nucleusRecord]) if (record.version !== 1 || record.license.name !== "CC BY 4.0" || !record.description.includes("jrc_mus-sc-zp104a")) throw new Error("Exact source version, parent or license changed");
const rawArray = await json("raw_s0_zarray.json");
const nucleusArray = await json("manual_nucleus_s0_zarray.json");
const rawAttributes = await json("raw_group_zattrs.json");
const nucleusAttributes = await json("manual_nucleus_group_zattrs.json");
const descriptor = (array, attributes, expectedChunks) => {
  if (array.dtype !== "|u1" || array.order !== "C" || array.compressor.id !== "zstd" || array.dimension_separator !== "/" || JSON.stringify(array.chunks) !== JSON.stringify(expectedChunks)) throw new Error("Unsupported source array encoding");
  const multiscale = attributes.multiscales[0];
  if (multiscale.axes.map((axis) => axis.name).join(",") !== "z,y,x" || multiscale.axes.some((axis) => axis.unit !== "nanometer")) throw new Error("Source frame changed");
  const level = multiscale.datasets.find((item) => item.path === "s0");
  return { axes: ["z", "y", "x"], unit: "nanometer", shapeZYX: array.shape, chunkShapeZYX: array.chunks,
    scaleNanometreZYX: level.coordinateTransformations.find((item) => item.type === "scale").scale,
    translationNanometreZYX: level.coordinateTransformations.find((item) => item.type === "translation").translation };
};
const rawFrame = descriptor(rawArray, rawAttributes, [128, 128, 128]);
const nucleusFrame = descriptor(nucleusArray, nucleusAttributes, [64, 64, 64]);
if (rawFrame.scaleNanometreZYX.some((value) => value !== 6) || rawFrame.translationNanometreZYX.some((value) => value !== 0) || nucleusFrame.scaleNanometreZYX.some((value) => value !== 96) || nucleusFrame.translationNanometreZYX.some((value) => value !== 45)) throw new Error("Exact source calibration changed");
const raw = zstdDecompressSync(await readFile(resolve(source, "raw-82-22-17.zstd")));
const nucleus = zstdDecompressSync(await readFile(resolve(source, "nucleus-10-2-2.zstd")));
if (raw.length !== 128 ** 3 || nucleus.length !== 64 ** 3) throw new Error("Decoded chunk shape mismatch");
const labelValues = [...new Set(nucleus)].sort((a, b) => a - b);
const instanceVoxelCount = nucleus.reduce((sum, value) => sum + Number(value === 2), 0);
if (instanceVoxelCount !== 69867) throw new Error("Manual instance-2 inventory changed");
for (let z = 16; z < 24; z += 1) for (let y = 48; y < 56; y += 1) for (let x = 8; x < 16; x += 1) if (nucleus[(z * 64 + y) * 64 + x] !== 2) throw new Error("Source raw ROI is not uniformly covered by manual label 2");
await mkdir(output, { recursive: true });
await writeFile(resolve(output, "raw.u8"), raw);
await writeFile(resolve(output, "nucleus.u8"), nucleus);
const payload = (fileName, bytes) => ({ url: `/data/janelia_wt_reference_v1/${fileName}`, bytes: bytes.length, sha256: sha(bytes), encoding: "uint8_C_order_ZYX_uncompressed" });
const contract = {
  schemaVersion: "0.1.0", contractId: "janelia-wt-bounded-raw-nucleus-reference-0.1", checkedDate: "2026-09-30", upgradeIds: ["UPG-179", "UPG-195", "UPG-196"],
  datasetId: "jrc_mus-sc-zp104a", disposition: "co_display_only", sourceFrame: "jrc_mus-sc-zp104a/recon-1/source_local_ZYX_nanometer",
  sourceRecords: [rawRecord, nucleusRecord].map((record) => ({ id: record.id, doi: record.doi, version: record.version, title: record.title, url: record.url_public_html, citation: record.citation, license: record.license })),
  sourceReceiptPath: "data/source-candidates/janelia-wt-reference-20260930/receipt.json", sourceReceipts: receipt.files,
  raw: { ...rawFrame, chunkIndexZYX: [82, 22, 17], firstGlobalIndexZYX: [10496, 2816, 2176], payload: payload("raw.u8", raw), interpretation: "source raw EM intensity, no per-structure labeling" },
  nucleus: { ...nucleusFrame, chunkIndexZYX: [10, 2, 2], firstGlobalIndexZYX: [640, 128, 128], payload: payload("nucleus.u8", nucleus),
    instanceValue: 2, labelValues, instanceVoxelCountInChunk: instanceVoxelCount, annotation: { method: "manual dense segmentation", software: "Amira 3D 2021.1", className: "nuc", type: "instance_segmentation", absentValue: 0, unknownValue: 255 },
    objectLabel: "manual nucleus instance 2; cell class unknown", stableBiologicalCellId: null, partialObjectOnly: true, completeNucleusEstablished: false },
  overlap: { relationship: "same_source_volume_spatial_overlap_only", rawToNucleusGridRatio: 16,
    nucleusLocalBoundsHalfOpenZYX: { minimum: [16, 48, 8], maximumExclusive: [24, 56, 16] }, sourceNucleusVoxelsCovered: 512,
    uniformInstanceValue: 2, alignmentEvidence: "source_affine_coordinates_align_to_raw_block_mean_sample_positions", interpolation: "none; native label-plane samples and a source-coordinate ROI rectangle" },
  sourceExtentDifference: { nominalFigshareXYZMicrometre: [40, 30, 75], rawArrayZYXMicrometre: [76.188, 42, 54], status: "unresolved_nominal_description_versus_live_array", biologicalMeasurementAuthorized: false },
  rendering: { rawAxis: "z", rawSliceCount: 128, rawWidth: 128, rawHeight: 128, labelWidth: 64, labelHeight: 64, grayscale: "native_uint8_0_to_255_no_intensity_adjustment", displaySampling: "nearest_native_pixel" },
  claims: { cellClass: "unknown", selectedCellJoinCount: 0, interneuronGeometryCount: 0, sameCellInternalChainCount: 0, organelleObjects: 0, atlasRegistrations: 0, biologicalMeasurements: 0 },
  derivativeNotice: "Two source Zstd chunks were decompressed losslessly to uint8 buffers. The viewer selects native Z planes and colors source instance labels; it adds no segmentation, interpolation, 3D surface or biological identity.",
};
await writeFile(resolve(root, "data/janelia-wt-bounded-reference-0.1.json"), JSON.stringify(contract, null, 2) + "\n");
console.log(JSON.stringify({ sourceFiles: receipt.files.length, sourceBytes: receipt.totalBytes, rawBytes: raw.length, nucleusBytes: nucleus.length, labelValues, instance2Voxels: instanceVoxelCount, overlapLabelVoxels: 512 }));
