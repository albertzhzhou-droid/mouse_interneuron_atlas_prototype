import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  nativeSomaContourBounds,
  nativeSomaContourDisplayTransform,
  transformNativeSomaContourPoint,
  validateNativeSomaContourPayload,
} from "../app/neurolucida-native-soma-contours.js";
import { resolveResearchVisualTarget } from "../app/research-visual-target.js";
import { validateNeurolucidaSourceNativeSomaContourTrace } from "../scripts/validate-neurolucida-source-native-soma-contour-trace-0.1.mjs";

const contract = JSON.parse(await readFile(
  new URL("../data/neurolucida-source-native-soma-contour-trace-0.1.json", import.meta.url),
  "utf8",
));
const payload = JSON.parse(await readFile(
  new URL("../public/data/premotor_comparison_observed_morphology_route_pack_v1/native-contours/nmo-45718-soma-contours.json", import.meta.url),
  "utf8",
));

test("validates the independently audited NMO 45718 source-native contour trace", async () => {
  const report = await validateNeurolucidaSourceNativeSomaContourTrace();
  assert.deepEqual(report, {
    releaseId: "ohri-neurolucida-source-native-soma-contour-trace-0.1.0",
    geometryBytes: 45606,
    geometrySha256: "a0aa80ce0f12b08cfe61b2862f1b3a29f67a1105a722b0dceda2fd3b25e898e8",
    contourCount: 8,
    vertexCount: 275,
    semanticClosedSegmentCount: 275,
    admittedSurfaceCount: 0,
    admittedInternalStructureObjectCount: 0,
    registrationCount: 0,
  });
});

test("keeps seven source-closed Soma 1 planes separate from the legacy Cell Body trace", () => {
  const verified = validateNativeSomaContourPayload(payload, contract);
  const soma1 = verified.contours.filter((contour) => contour.sourceName === "Soma 1");
  const cellBody = verified.contours.filter((contour) => contour.sourceName === "Cell Body");
  assert.deepEqual(soma1.map((contour) => contour.zValuesMicrometre), [[-29], [-31], [-33], [-35], [-37], [-39], [-41]]);
  assert.equal(soma1.reduce((sum, contour) => sum + contour.vertexCount, 0), 252);
  assert.equal(cellBody.length, 1);
  assert.equal(cellBody[0].sourceClosedFlag, false);
  assert.equal(cellBody[0].interpretedClosed, true);
  assert.deepEqual(cellBody[0].zValuesMicrometre, [13, 15]);
  assert.equal(verified.summary.surfaceCount, 0);
  assert.equal(verified.summary.internalStructureObjectCount, 0);
});

test("uses only a reversible viewer transform while retaining exact source coordinates", () => {
  const bounds = nativeSomaContourBounds(payload.contours);
  const transform = nativeSomaContourDisplayTransform(payload.contours, 8);
  assert.deepEqual(bounds.min, [357.5344543457031, 246.0596923828125, -41]);
  assert.deepEqual(bounds.max, [373.1641540527344, 266.392578125, 15]);
  assert.deepEqual(bounds.extent, [15.62969970703125, 20.3328857421875, 56]);
  assert.equal(transform.scaleViewerUnitPerMicrometre, 1 / 7);
  const source = payload.contours[0].points[0];
  const displayed = transformNativeSomaContourPoint(source, transform);
  const recovered = displayed.map((value, axis) => value / transform.scaleViewerUnitPerMicrometre + transform.originMicrometre[axis]);
  assert.deepEqual(recovered, source.slice(0, 3));
});

test("rejects invented surfaces, changed identity, merged legacy semantics and malformed points", () => {
  const mutations = [
    (value) => { value.assetId = "NeuroMorpho:109005"; },
    (value) => { value.summary.surfaceCount = 1; },
    (value) => { value.contours[7].sourceClosedFlag = true; },
    (value) => { value.contours[0].points[0][0] = null; },
  ];
  for (const mutate of mutations) {
    const value = structuredClone(payload);
    mutate(value);
    assert.throws(() => validateNativeSomaContourPayload(value, contract), /identity|surfaceCount|legacy|invalid source point/i);
  }
});

test("replaces the exact 45718 target on morphology switch and clears it on molecular switch", () => {
  const options = {
    admittedMainSceneNeuronIds: [45718, 109005],
    admittedSourceViewerNeuronIds: [45718, 109005],
    sourceDiameterNeuronIds: [45718, 109005],
    requestedFidelityMode: "observed_swc",
    currentView: "cell_detail",
  };
  const nativeContourTarget = resolveResearchVisualTarget({
    ...options,
    focus: { focusKind: "morphology_record", focusId: "NeuroMorpho:45718" },
  });
  const otherMorphologyTarget = resolveResearchVisualTarget({
    ...options,
    focus: { focusKind: "morphology_record", focusId: "NeuroMorpho:109005" },
  });
  const molecularTarget = resolveResearchVisualTarget({
    ...options,
    focus: { focusKind: "molecular_profile", focusId: "sathyamurthy-2018:DE-1" },
  });

  assert.equal(nativeContourTarget.neuronId, 45718);
  assert.equal(otherMorphologyTarget.neuronId, 109005);
  assert.notEqual(otherMorphologyTarget.neuronId, nativeContourTarget.neuronId);
  assert.equal(molecularTarget.neuronId, null);
  assert.equal(molecularTarget.showObservedCellForm, false);
  assert.equal(molecularTarget.nextView, "home");
});
