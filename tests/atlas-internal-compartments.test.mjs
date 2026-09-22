import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateAtlasInternalCompartments } from "../scripts/validate-atlas-internal-compartments.mjs";

const internalCompartments = JSON.parse(
  await readFile(
    new URL("../public/data/allen_cord_20um_v3_0/atlas-internal-compartments.json", import.meta.url),
    "utf8",
  ),
);

const clone = () => structuredClone(internalCompartments);

test("validates the seven source-derived internal structures across 38 planes without bridging", () => {
  const report = validateAtlasInternalCompartments(internalCompartments);
  assert.deepEqual(report.structureIdentifiers, [90, 100, 110, 16, 74, 75, 70]);
  assert.equal(report.sampledPlaneCount, 38);
  assert.equal(report.totalComponents, 973);
  assert.equal(report.totalPolygons, 975);
  assert.equal(report.missingPlaneCount, 3);
  assert.equal(report.geometryStatus, "INF");
  assert.equal(report.measurementUse, "forbidden");
  assert.equal(report.registrationCount, 0);
});

test("rejects changed source IDs, plane order, registration, and missingness", () => {
  const changedId = clone();
  changedId.structures[0].identifier = 91;
  assert.throws(() => validateAtlasInternalCompartments(changedId), /target structure identifiers|source identifier/);

  const changedPlaneOrder = clone();
  changedPlaneOrder.structures[0].planes.reverse();
  assert.throws(() => validateAtlasInternalCompartments(changedPlaneOrder), /plane ordering/);

  const inventedRegistration = clone();
  inventedRegistration.registrationCount = 1;
  assert.throws(() => validateAtlasInternalCompartments(inventedRegistration), /registration count must remain zero/);

  const erasedMissingness = clone();
  const missingPlane = erasedMissingness.structures
    .flatMap((structure) => structure.planes)
    .find((plane) => plane.presence === "missing");
  delete missingPlane.missingReason;
  assert.throws(() => validateAtlasInternalCompartments(erasedMissingness), /missing reason/);
});

test("rejects invalid polygon closure and source-mask area", () => {
  const invalidPolygon = clone();
  const component = invalidPolygon.structures[0].planes[0].components[0];
  component.polygons[0].pointsVoxelEdgeXY.at(-1)[0] += 1;
  assert.throws(
    () => validateAtlasInternalCompartments(invalidPolygon),
    /polygon is not closed|recorded signed area|polygon area/,
  );

  const bridgedArea = clone();
  bridgedArea.structures[0].planes[0].components[0].voxelCount += 1;
  assert.throws(
    () => validateAtlasInternalCompartments(bridgedArea),
    /polygon area does not reproduce|component voxel counts/,
  );
});
