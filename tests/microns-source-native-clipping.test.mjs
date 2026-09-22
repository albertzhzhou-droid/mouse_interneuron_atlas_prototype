import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildMicronsClipRuntimeReceipt,
  buildMicronsWorldClippingPlane,
  defaultMicronsClipState,
  parseMicronsClipUrlState,
  validateMicronsClipState,
} from "../app/microns-source-native-clipping.js";
import { validateMicronsSourceNativeClipping } from "../scripts/validate-microns-source-native-clipping-0.1.mjs";

const contract = JSON.parse(await readFile(new URL("../data/microns-source-native-clipping-0.1.json", import.meta.url), "utf8"));
const sourceContract = JSON.parse(await readFile(new URL("../data/microns-observed-cell-nucleus-reference-0.1.json", import.meta.url), "utf8"));
const scene = await readFile(new URL("../app/SceneCanvas.tsx", import.meta.url), "utf8");
const panel = await readFile(new URL("../app/InternalStructureReferencePanel.tsx", import.meta.url), "utf8");
const prototype = await readFile(new URL("../app/AtlasPrototype.tsx", import.meta.url), "utf8");

test("pins exact source geometry and a cell-only, zero-generation clipping policy", async () => {
  assert.deepEqual(await validateMicronsSourceNativeClipping(), {
    releaseId: "ohri-microns-source-native-clipping-0.1.0",
    cellRootId: "648518346349516051",
    linkedNucleusId: "4309",
    axisCount: 3,
    cellVertexCount: 372382,
    nucleusVertexCount: 12682,
    cellClippingPlaneCountWhenEnabled: 1,
    nucleusClippingPlaneCount: 0,
    generatedGeometryCount: 0,
    joinCount: 0,
    registrationCount: 0,
  });
});

test("maps every source-native axis and retained side into the exact world plane", () => {
  const display = sourceContract.coordinateContract.displayTransformReceipt.canonical;
  for (const [axis, index] of [["x", 0], ["y", 1], ["z", 2]]) {
    for (const keepSide of ["positive", "negative"]) {
      const positionNanometre = contract.clippingOperation.somaCentreNanometre[index];
      const plane = buildMicronsWorldClippingPlane({ enabled: true, axis, positionNanometre, keepSide }, contract, display);
      assert.equal(plane.positionViewerUnit, 0);
      assert.equal(plane.worldConstant, 0);
      assert.equal(plane.worldNormal[index], keepSide === "positive" ? 1 : -1);
      assert.equal(plane.worldNormal.filter((value) => value !== 0).length, 1);
      assert.equal(plane.clippedComponent, "cell");
      assert.equal(plane.nucleusClipped, false);
      assert.equal(plane.capPrimitiveCount, 0);
      assert.equal(plane.geometryMutationCount, 0);
    }
  }
  const shifted = buildMicronsWorldClippingPlane({ enabled: true, axis: "x", positionNanometre: 256864, keepSide: "positive" }, contract, display);
  assert.equal(shifted.positionViewerUnit, 10000 * display.scaleViewerUnitPerNanometre);
  assert.equal(shifted.worldConstant, -shifted.positionViewerUnit);
});

test("rejects malformed and out-of-bounds clipping state while URL parsing fails closed", () => {
  assert.deepEqual(defaultMicronsClipState(contract), { enabled: false, axis: "z", positionNanometre: 80240, keepSide: "positive" });
  assert.throws(() => validateMicronsClipState({ enabled: true, axis: "q", positionNanometre: 80240, keepSide: "positive" }, contract), /axis/i);
  assert.throws(() => validateMicronsClipState({ enabled: true, axis: "z", positionNanometre: 90000, keepSide: "positive" }, contract), /outside/i);
  const invalid = new Map([["micronsClip", "1"], ["micronsClipAxis", "z"], ["micronsClipNm", "90000"], ["micronsClipSide", "positive"]]);
  assert.deepEqual(parseMicronsClipUrlState((key) => invalid.get(key) ?? null, contract), defaultMicronsClipState(contract));
});

test("runtime receipt exposes the reversible display operation and all zero boundaries", () => {
  const receipt = buildMicronsClipRuntimeReceipt(
    { enabled: true, axis: "z", positionNanometre: 80240, keepSide: "negative" },
    contract,
    sourceContract.coordinateContract.displayTransformReceipt.canonical,
  );
  assert.equal(receipt.renderTarget, "cell_segmentation_surface_only");
  assert.equal(receipt.cellClippingPlaneCount, 1);
  assert.equal(receipt.nucleusClippingPlaneCount, 0);
  assert.equal(receipt.nucleusIntact, true);
  for (const field of ["capPrimitiveCount", "geometryMutationCount", "generatedGeometryCount", "joinCount", "registrationCount"]) assert.equal(receipt[field], 0);
  assert.equal(receipt.measurementClaim, false);
});

test("viewer, controls, URL, import and export integration remain explicit", () => {
  assert.match(scene, /renderer\.localClippingEnabled = true/);
  assert.match(scene, /material\.clippingPlanes/);
  assert.match(scene, /componentName === "cell"/);
  assert.match(scene, /nucleusClippingPlaneCount: 0/);
  assert.match(panel, /Source-native shell clipping/);
  assert.match(panel, /Uncapped shader cut/);
  assert.match(panel, /Nucleus remains intact/);
  assert.match(prototype, /micronsClipAxis/);
  assert.match(prototype, /micronsClipNm/);
  assert.match(prototype, /micronsClipping/);
});
