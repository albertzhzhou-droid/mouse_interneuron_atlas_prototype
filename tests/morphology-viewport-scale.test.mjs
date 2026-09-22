import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  computeMorphologyViewportScaleBar,
  computePerspectiveSphereFitDistance,
  formatMorphologyScaleLength,
} from "../app/morphology-viewport-scale.js";

const viewportSource = await readFile(new URL("../app/SourceLocalMorphologyViewport.tsx", import.meta.url), "utf8");

const base = {
  cameraTargetDistanceViewerUnit: 10,
  effectiveVerticalFovDegrees: 38,
  viewportHeightCssPixel: 400,
  scaleViewerUnitPerMicrometre: 0.02,
};

test("computes a source-local 1-2-5 scale at the camera target plane", () => {
  const scale = computeMorphologyViewportScaleBar(base);
  assert.equal(scale.algorithmId, "camera_target_plane_source_local_scale_v1");
  assert.equal(scale.measurementPlane, "camera_target_depth");
  assert.equal(scale.sourceCoordinateUnit, "micrometre_reported_by_source");
  assert.ok([1, 2, 5].includes(Number(String(scale.lengthMicrometre).replace(/0+$/, "").at(-1))));
  assert.ok(scale.pixelLength > 40 && scale.pixelLength < 150);
  assert.equal(scale.sourceLocalOnly, true);
  assert.equal(scale.sharedAcrossViewports, false);
  assert.equal(scale.apparentObjectSizeComparable, false);
});

test("updates physical scale on orbit zoom and viewport resize", () => {
  const initial = computeMorphologyViewportScaleBar(base);
  const zoomedOut = computeMorphologyViewportScaleBar({ ...base, cameraTargetDistanceViewerUnit: 20 });
  const tallerViewport = computeMorphologyViewportScaleBar({ ...base, viewportHeightCssPixel: 800 });
  assert.equal(zoomedOut.micrometrePerCssPixel, initial.micrometrePerCssPixel * 2);
  assert.equal(tallerViewport.micrometrePerCssPixel, initial.micrometrePerCssPixel / 2);
  assert.ok(zoomedOut.lengthMicrometre >= initial.lengthMicrometre);
  assert.ok(tallerViewport.lengthMicrometre <= initial.lengthMicrometre);
});

test("does not use drawing-buffer density or a shared comparison scale", () => {
  const scale = computeMorphologyViewportScaleBar(base);
  assert.equal(Object.hasOwn(scale, "devicePixelRatio"), false);
  assert.equal(Object.hasOwn(scale, "comparisonScale"), false);
});

test("fails closed on invalid scale inputs", () => {
  for (const [key, value] of [
    ["cameraTargetDistanceViewerUnit", 0],
    ["effectiveVerticalFovDegrees", 180],
    ["viewportHeightCssPixel", Number.NaN],
    ["scaleViewerUnitPerMicrometre", -1],
  ]) {
    assert.throws(() => computeMorphologyViewportScaleBar({ ...base, [key]: value }), /must be|less than/);
  }
});

test("fits a bounding sphere against the limiting viewport field of view", () => {
  const square = computePerspectiveSphereFitDistance({ radiusViewerUnit: 2, verticalFovDegrees: 38, aspect: 1 });
  const narrow = computePerspectiveSphereFitDistance({ radiusViewerUnit: 2, verticalFovDegrees: 38, aspect: 0.5 });
  assert.ok(square > 2 / Math.sin(19 * Math.PI / 180));
  assert.ok(narrow > square);
});

test("formats micrometre labels without implying restored biological dimensions", () => {
  assert.equal(formatMorphologyScaleLength(50), "50 µm");
  assert.equal(formatMorphologyScaleLength(0.5), "0.5 µm");
});

test("keeps source axes at the transformed origin and labels them for sighted users", () => {
  assert.match(viewportSource, /axes\.position\.set\(0, 0, 0\)/);
  assert.doesNotMatch(viewportSource, /axes\.position\.copy\(boundsSphere\.center\)/);
  assert.match(viewportSource, /SOURCE AXES · NOT ANATOMICAL AXES/);
});

test("keeps the complete geometry inside the far clipping plane across zoom", () => {
  assert.match(viewportSource, /camera\.position\.distanceTo\(boundsSphere\.center\)/);
  assert.match(viewportSource, /distanceToGeometryCenter \+ radius \* 2/);
  assert.match(viewportSource, /camera\.far = nextFar/);
  assert.match(viewportSource, /controls\.maxDistance = Math\.max\(radius \* 64, 100\)/);
  assert.match(viewportSource, /Math\.min\(\s*controls\.maxDistance,[\s\S]*Math\.max\(controls\.minDistance, offset\.length\(\) \* factor\)/);
});

test("invalidates scale before layout revision and binds mode plus viewport identity", () => {
  assert.match(viewportSource, /effectiveRenderMode: effectiveMode/);
  assert.match(viewportSource, /viewportInstanceId/);
  assert.match(viewportSource, /viewportRevision/);
  assert.match(viewportSource, /if \(isLayoutRevision\) \{\s*clearScale\(\);\s*viewportRevision = \+\+viewportRevisionRef\.current;\s*publishBinding\(\);/);
});
