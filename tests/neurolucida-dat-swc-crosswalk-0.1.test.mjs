import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildNmo45718DatSwcCrosswalkAudit,
  validateNmo45718DatSwcCrosswalk,
} from "../app/neurolucida-dat-swc-crosswalk.js";
import { validateNeurolucidaDatSwcCrosswalk } from "../scripts/validate-neurolucida-dat-swc-crosswalk-0.1.mjs";

const ROOT = new URL("../", import.meta.url);
const ROUTE_PACK = "public/data/premotor_comparison_observed_morphology_route_pack_v1/";

async function fixtures() {
  const [contract, contours, geometry] = await Promise.all([
    readFile(new URL("data/neurolucida-dat-swc-crosswalk-0.1.json", ROOT), "utf8").then(JSON.parse),
    readFile(new URL(`${ROUTE_PACK}native-contours/nmo-45718-soma-contours.json`, ROOT), "utf8").then(JSON.parse),
    readFile(new URL(`${ROUTE_PACK}geometry/nmo-45718.json`, ROOT), "utf8").then(JSON.parse),
  ]);
  return { contract, contours, geometry };
}

test("NMO 45718 DAT↔SWC crosswalk reproduces with disjoint held-out checks and no invented surface", async () => {
  const result = await validateNeurolucidaDatSwcCrosswalk();
  assert.equal(result.recordId, "NeuroMorpho:45718");
  assert.equal(result.sourceReceiptsChecked, 4);
  assert.equal(result.mappedSomaContours, 7);
  assert.equal(result.mappedContourVertices, 252);
  assert.equal(result.standardizedSwcSegments, 5635);
  assert.ok(result.primaryHeldOutMaximumMicrometre < 0.006);
  assert.ok(result.sensitivityHeldOutMaximumMicrometre < 0.01);
  assert.ok(result.properRotationHeldOutMaximumMicrometre > 2.4);
  assert.deepEqual(result.excludedContourIds, ["source-native-contour-8"]);
  assert.equal(result.surfaces, 0);
  assert.equal(result.internalStructureObjects, 0);
  assert.equal(result.registrationCount, 0);
});

test("same-record fit maps only the seven source-closed Soma 1 traces into the CNG local frame", async () => {
  const { contract, contours, geometry } = await fixtures();
  const result = validateNmo45718DatSwcCrosswalk(contract, contours, geometry);
  assert.deepEqual(result.correspondence.sourceNodeIds, [2, 3, 4, 5, 6, 7, 8]);
  assert.equal(result.somaContours.reduce((sum, contour) => sum + contour.points.length, 0), 252);
  assert.equal(result.somaContours[0].points[0][2], 0);
  assert.equal(result.somaContours.at(-1).points[0][2], -12);
  assert.equal(result.excludedContourIds.length, 1);
  assert.equal(result.boundaries.cellBodyContourJoined, false);
  assert.equal(result.boundaries.sameCellInternalStructureClaim, false);
});

test("transform is object-specific and fails closed when correspondence evidence changes", async () => {
  const { contract, contours, geometry } = await fixtures();
  const wrongRecord = structuredClone(geometry);
  wrongRecord.neuronId = 999;
  assert.throws(() => buildNmo45718DatSwcCrosswalkAudit(contours, wrongRecord), /identity, frame, units or registration/);

  const changedHeldOutLandmark = structuredClone(geometry);
  changedHeldOutLandmark.nodes.find((node) => node[0] === 8)[2] += 0.1;
  assert.throws(() => validateNmo45718DatSwcCrosswalk(contract, contours, changedHeldOutLandmark), /display-consistency screen|fit no longer matches/);

  const differentCoefficients = structuredClone(contract);
  differentCoefficients.transform.a += 0.01;
  assert.throws(() => validateNmo45718DatSwcCrosswalk(differentCoefficients, contours, geometry), /transform receipt does not reproduce/);
});

test("the crosswalk component is gated to the exact selected record and remains a separate viewer", async () => {
  const source = await readFile(new URL("app/NeuroMorphoUniversePanel.tsx", ROOT), "utf8");
  assert.match(source, /selected\?\.neuronId === 45718 && <Nmo45718DatSwcCrosswalkViewer/);
  assert.match(source, /selected && <NativeContourRecordViewer/);
  assert.ok(source.indexOf("NativeContourRecordViewer") < source.indexOf("Nmo45718DatSwcCrosswalkViewer"));
});

