import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildSuperClemPalmNativePoints,
  buildSuperClemPalmNativePointsFromDisk,
  SUPER_CLEM_PALM_SOURCE_PATH,
} from "../tools/build_superclem_palm_native_points_0_1.mjs";
import { validateSuperClemPalmNativePoints } from "../scripts/validate-superclem-palm-native-points-0.1.mjs";

const sourcePath = new URL(`../${SUPER_CLEM_PALM_SOURCE_PATH}`, import.meta.url);

test("MAT decode preserves every PALM detection and source-native XY without physical calibration", async () => {
  const source = await readFile(sourcePath);
  const payload = buildSuperClemPalmNativePoints(source);
  assert.equal(payload.source.figshareFileId, 32526932);
  assert.equal(payload.acquisition.animalId, "AQ848");
  assert.equal(payload.acquisition.region, "dorsal spinal cord");
  assert.deepEqual(payload.matrix.sourceShapeRowsByColumns, [5, 18358]);
  assert.deepEqual(payload.matrix.sourceRowOrder, ["frame", "x", "y", "alpha", "sigma"]);
  assert.deepEqual(payload.matrix.outputColumns, ["frame", "x", "y"]);
  assert.deepEqual(payload.matrix.omittedFromPlotPayload, ["alpha", "sigma"]);
  assert.equal(payload.matrix.detectionCount, 18358);
  assert.equal(payload.matrix.detections.length, 18358);
  assert.deepEqual(payload.matrix.frameRange, { minimum: 1, maximum: 24997 });
  assert.equal(payload.matrix.xRangeNative.minimum, 4.058500700524468);
  assert.equal(payload.matrix.xRangeNative.maximum, 245.9930122551605);
  assert.equal(payload.matrix.yRangeNative.minimum, 4.04587230653999);
  assert.equal(payload.matrix.yRangeNative.maximum, 245.89798103040326);
  assert.match(payload.acquisition.coordinateScope, /physical unit.*not established/i);
  assert.equal(payload.acquisition.recordInterpretation, "localization detections, not unique receptor molecules or segmented structures");
  assert.throws(() => buildSuperClemPalmNativePoints(Buffer.from("not the cited MAT file")), /do not match the verified Figshare file receipt/);
});

test("deterministic point payload and source boundaries validate", async () => {
  const { bytes } = await buildSuperClemPalmNativePointsFromDisk();
  const disk = await readFile(new URL("../public/data/superclem_palm_native_points_0_1.json", import.meta.url));
  assert.deepEqual(disk, bytes);
  const receipt = await validateSuperClemPalmNativePoints();
  assert.equal(receipt.detectionCount, 18358);
  assert.equal(receipt.physicalUnitsEstablished, false);
  assert.equal(receipt.driftCorrectionEstablished, false);
  assert.match(receipt.plotPayloadSha256, /^[a-f0-9]{64}$/);
});

test("rendering input cannot claim physical units or a different acquisition", async () => {
  const { payload } = await buildSuperClemPalmNativePointsFromDisk();
  const changed = structuredClone(payload);
  changed.acquisition.animalId = "BP057";
  await assert.rejects(validateSuperClemPalmNativePoints(changed), /differs from deterministic source decode/);
});
