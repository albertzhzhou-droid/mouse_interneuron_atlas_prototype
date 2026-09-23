#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RECEIPT_PATH = path.join(ROOT, "data/source-candidates/davis-icr-same-cell-20260922/receipt.json");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateDavisIcrSameCellReference(override = null) {
  const receipt = override ?? JSON.parse(await readFile(RECEIPT_PATH, "utf8"));
  const imagePath = path.join(ROOT, receipt.asset.path);
  const imageBytes = await readFile(imagePath);
  const digest = sha256(imageBytes);
  const relation = receipt.sourceSupportedRelations?.[0];
  const caption = receipt.captionReceipt?.text ?? "";
  const [width, height] = receipt.asset.dimensionsPx ?? [];

  if (receipt.doi !== "10.1038/s41598-023-38605-9" || !receipt.figurePageUrl.endsWith("/figures/1")) {
    throw new Error("Davis iCR figure source identity changed");
  }
  if (receipt.rights?.license !== "CC BY 4.0" || receipt.rights.figureCreditExceptionFound !== false) {
    throw new Error("Davis iCR figure reuse/attribution receipt is incomplete");
  }
  if (imageBytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a" || imageBytes.readUInt32BE(16) !== width || imageBytes.readUInt32BE(20) !== height) {
    throw new Error("Davis iCR figure is not the receipt-pinned PNG asset");
  }
  if (imageBytes.byteLength !== receipt.asset.bytes || digest !== receipt.asset.sha256) {
    throw new Error("Davis iCR figure bytes differ from the publisher-image receipt");
  }
  if (relation?.fromPanel !== "d" || JSON.stringify(relation.toPanels) !== JSON.stringify(["e", "f", "g"]) || relation.relation !== "same_recorded_cell_asserted_by_figure_caption" || relation.notIndependentIdentityValidation !== true) {
    throw new Error("Davis iCR panel-d to panels-e–g relationship is not the caption-bounded assertion");
  }
  if (!caption.includes("cell shown in (d)") || !caption.includes("Scale bars = 100 μm (a–d) and 0.5 μm (e–g)")) {
    throw new Error("Davis iCR figure caption or scale bars changed");
  }
  if (receipt.biologicalScope?.sourceCellClass !== "inhibitory calretinin-expressing islet cell" || receipt.biologicalScope?.targetAnatomy !== "lamina II spinal dorsal horn" || receipt.biologicalScope?.recordedCellCountInExperiment !== 5) {
    throw new Error("Davis iCR figure biological scope drifted");
  }
  if (receipt.geometryAdmissionCount !== 0 || receipt.limits?.some((limit) => /No source segmentation|No source z-coordinates|Raster line drawing is not machine-readable 3D neurite geometry/.test(limit)) !== true) {
    throw new Error("Davis iCR figure must remain an image reference without 3D geometry");
  }

  return {
    contractId: "davis-icr-same-cell-reference-0.1",
    sourceImageBytes: imageBytes.byteLength,
    sourceImageSha256: digest,
    sourceFigureCount: 1,
    captionAssertedSameCellLinkCount: 1,
    admittedProjectGeometryCount: 0,
    activeRecordJoinCount: 0,
    atlasRegistrationCount: 0,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateDavisIcrSameCellReference()
    .then((receipt) => console.log(JSON.stringify(receipt)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
