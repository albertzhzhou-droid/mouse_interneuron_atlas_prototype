#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildSuperClemPalmNativePointsFromDisk,
  SUPER_CLEM_PALM_OUTPUT_PATH,
  SUPER_CLEM_PALM_SOURCE_PATH,
} from "../tools/build_superclem_palm_native_points_0_1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function validateSuperClemPalmNativePoints(override = null) {
  const built = await buildSuperClemPalmNativePointsFromDisk();
  const onDisk = await readFile(path.join(ROOT, SUPER_CLEM_PALM_OUTPUT_PATH));
  const reference = JSON.parse(await readFile(path.join(ROOT, "data/super-clem-palm-localization-reference-0.1.json"), "utf8"));
  const plotPayloadSha256 = createHash("sha256").update(onDisk).digest("hex");
  const payload = override ?? JSON.parse(onDisk);
  if (!onDisk.equals(built.bytes)) throw new Error("Super-CLEM PALM point asset differs from deterministic source decode");
  if (reference.pointPayloadSha256 !== plotPayloadSha256 || reference.pointDataUrl !== "/data/superclem_palm_native_points_0_1.json") {
    throw new Error("Super-CLEM PALM runtime payload integrity receipt drifted");
  }
  if (JSON.stringify(payload) !== JSON.stringify(built.payload)) throw new Error("Super-CLEM PALM point contract differs from deterministic source decode");

  const { source, acquisition, matrix, limits } = payload;
  if (source.figshareFileId !== 32526932 || source.license !== "CC BY 4.0"
    || acquisition.imageId !== "181130_EosRmov009" || acquisition.animalId !== "AQ848"
    || acquisition.region !== "dorsal spinal cord" || matrix.variableName !== "matrice_results"
    || matrix.sourceShapeRowsByColumns[0] !== 5 || matrix.sourceShapeRowsByColumns[1] !== 18358
    || matrix.detectionCount !== 18358 || matrix.detections.length !== 18358
    || matrix.frameRange.minimum !== 1 || matrix.frameRange.maximum !== 24997
    || matrix.xRangeNative.minimum !== 4.058500700524468 || matrix.xRangeNative.maximum !== 245.9930122551605
    || matrix.yRangeNative.minimum !== 4.04587230653999 || matrix.yRangeNative.maximum !== 245.89798103040326
    || !limits.some((limit) => /No nanometre or micrometre scale/i.test(limit))
    || !limits.some((limit) => /No drift correction/i.test(limit))
    || !limits.some((limit) => /not counted as unique receptor molecules/i.test(limit))
    || !limits.some((limit) => /not the separate BP057 EM acquisition/i.test(limit))) {
    throw new Error("Super-CLEM PALM unit, source identity, count or scientific boundary drifted");
  }
  return {
    sourceFileId: source.figshareFileId,
    sourceSha256: source.fileSha256,
    detectionCount: matrix.detectionCount,
    frameRange: matrix.frameRange,
    xRangeNative: matrix.xRangeNative,
    yRangeNative: matrix.yRangeNative,
    physicalUnitsEstablished: reference.acquisition.physicalScale !== null,
    driftCorrectionEstablished: reference.acquisition.driftCorrection !== "not established for this MAT file",
    plotPayloadSha256,
    outputPath: SUPER_CLEM_PALM_OUTPUT_PATH,
    sourcePath: SUPER_CLEM_PALM_SOURCE_PATH,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateSuperClemPalmNativePoints()
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
