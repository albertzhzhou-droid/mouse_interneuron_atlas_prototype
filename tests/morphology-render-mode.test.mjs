import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { canUseRadiusDerivedSurface, resolveMorphologyRenderMode, morphologyRenderModeTransition } from "../app/morphology-render-mode.js";

const eligible3D = { dimensionality: "3D", sourceDiameterAvailable: true };

test("3D records with source diameter default to a radius-derived view", () => {
  assert.equal(canUseRadiusDerivedSurface(eligible3D), true);
  assert.equal(resolveMorphologyRenderMode(eligible3D), "radius");
  assert.equal(resolveMorphologyRenderMode(eligible3D, "radius"), "radius");
});

test("an explicit centerline choice overrides the readable default", () => {
  assert.equal(resolveMorphologyRenderMode(eligible3D, "skeleton"), "skeleton");
});

test("2D records stay planar even when the source provides diameter values", () => {
  const planarWithDiameter = { dimensionality: "2D", sourceDiameterAvailable: true };
  assert.equal(canUseRadiusDerivedSurface(planarWithDiameter), false);
  assert.equal(resolveMorphologyRenderMode(planarWithDiameter), "skeleton");
  assert.equal(resolveMorphologyRenderMode(planarWithDiameter, "radius"), "skeleton");
});

test("records without a 3D source-radius basis remain centerline-only", () => {
  assert.equal(resolveMorphologyRenderMode(null), "skeleton");
  assert.equal(resolveMorphologyRenderMode({ dimensionality: "3D", sourceDiameterAvailable: false }), "skeleton");
  assert.equal(resolveMorphologyRenderMode({ dimensionality: "not reported", sourceDiameterAvailable: true }), "skeleton");
});

test("mode transitions distinguish unchanged rendering from a changed source request", () => {
  const planar = { dimensionality: "2D", sourceDiameterAvailable: true };
  const noDiameter = { dimensionality: "3D", sourceDiameterAvailable: false };
  for (const authority of [eligible3D, planar, noDiameter]) {
    for (const mode of ["radius", "skeleton"]) assert.deepEqual(morphologyRenderModeTransition(authority, mode, mode), { requestedModeChanged: false, effectiveModeChanged: false });
  }
  for (const authority of [planar, noDiameter]) {
    assert.deepEqual(morphologyRenderModeTransition(authority, "radius", "skeleton"), { requestedModeChanged: true, effectiveModeChanged: false });
    assert.deepEqual(morphologyRenderModeTransition(authority, "skeleton", "radius"), { requestedModeChanged: true, effectiveModeChanged: false });
  }
  assert.deepEqual(morphologyRenderModeTransition(eligible3D, "radius", "skeleton"), { requestedModeChanged: true, effectiveModeChanged: true });
  assert.deepEqual(morphologyRenderModeTransition(eligible3D, "skeleton", "radius"), { requestedModeChanged: true, effectiveModeChanged: true });
});

test("morphology viewers and comparison use the shared dimensionality gate", async () => {
  const [universe, individual, comparator, viewport, receipt] = await Promise.all([
    readFile(new URL("../app/NeuroMorphoUniversePanel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/MorphologyViewer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/MorphologyComparePanel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/SourceLocalMorphologyViewport.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/morphology-comparison.js", import.meta.url), "utf8"),
  ]);
  for (const source of [universe, individual]) {
    assert.match(source, /resolveMorphologyRenderMode\(/);
    assert.match(source, /canUseRadiusDerivedSurface\(/);
    assert.match(source, /radiusSurfaceAllowed/);
  }
  assert.match(universe, /Source-labelled 2D keeps a front-facing XY view and its deposited z values/);
  assert.match(individual, /Source-labelled 2D remains planar even if diameter metadata is present/);
  assert.match(comparator, /canUseRadiusDerivedSurface\(record.normalizedMetadata\)/);
  assert.match(comparator, /Source-labelled 2D stays planar/);
  assert.match(viewport, /resolveMorphologyRenderMode\(record.normalizedMetadata, mode\)/);
  assert.match(viewport, /sourceRadiusAvailable = morphologyHasDiameter\(record\)/);
  assert.match(receipt, /canUseRadiusDerivedSurface\(record.normalizedMetadata\)/);
});
