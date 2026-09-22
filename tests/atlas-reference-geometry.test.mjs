import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  ATLAS_FINE_ANATOMY_STRUCTURE_IDS,
  ATLAS_DIRECT_LEAF_STRUCTURE_IDS,
  ATLAS_MOTOR_CONTEXT_STRUCTURE_IDS,
  ATLAS_STRUCTURAL_CONTEXT_STRUCTURE_IDS,
  ATLAS_INTERNAL_STRUCTURE_IDS,
  ATLAS_LOFT_SAMPLE_COUNT,
  ATLAS_PLANE_COUNT,
  alignResampledContours,
  buildAtlasFineAnatomyGeometry,
  buildAtlasInternalContourGeometry,
  buildAtlasReferenceGeometry,
  buildPlaneLocalContourSegments,
  resampleClosedContour,
  voxelEdgeXYToAtlasDisplay,
  voxelToAtlasDisplay,
} from "../app/atlas-reference-geometry.js";

const payload = JSON.parse(
  await readFile(
    new URL("../public/data/allen_cord_20um_v3_0/atlas-contours.json", import.meta.url),
    "utf8",
  ),
);

const internalPayload = JSON.parse(
  await readFile(
    new URL("../public/data/allen_cord_20um_v3_0/atlas-internal-compartments.json", import.meta.url),
    "utf8",
  ),
);

const fineAnatomyPayload = JSON.parse(
  await readFile(
    new URL("../public/data/allen_cord_20um_v3_0/atlas-fine-anatomy.json", import.meta.url),
    "utf8",
  ),
);

test("uses the pinned AtlasReferenceViewer voxel-to-display transform", () => {
  assert.deepEqual(voxelToAtlasDisplay([160.5, 126], 0), [0, 0, 20]);
  assert.deepEqual(voxelToAtlasDisplay([160.5, 126], 1470), [0, 0, 20 - 1470 * 0.02 * 1.277139]);
  assert.deepEqual(voxelEdgeXYToAtlasDisplay([161, 126.5], 0), [0, 0, 20]);
  const edgeOrigin = voxelEdgeXYToAtlasDisplay([0, 0], 0);
  assert.ok(Math.abs(edgeOrigin[0] + 1.61) < 1e-12);
  assert.ok(Math.abs(edgeOrigin[1] - 1.265) < 1e-12);
  assert.equal(edgeOrigin[2], 20);
});

test("resamples and aligns closed contours without duplicating their seam", () => {
  const square = [[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]];
  const sampled = resampleClosedContour(square, 8);
  assert.equal(sampled.length, 8);
  assert.notDeepEqual(sampled[0], sampled.at(-1));
  const aligned = alignResampledContours([square, [...square].reverse()], 8);
  assert.deepEqual(aligned[0], aligned[1]);
});

test("builds complete INF-only outer and gray-matter side lofts from all 38 planes", () => {
  const geometry = buildAtlasReferenceGeometry(payload);
  const expectedVertices = ATLAS_PLANE_COUNT * ATLAS_LOFT_SAMPLE_COUNT;
  const expectedIndices = (ATLAS_PLANE_COUNT - 1) * ATLAS_LOFT_SAMPLE_COUNT * 6;
  assert.equal(geometry.geometryStatus, "INF");
  assert.equal(geometry.measurementUse, "forbidden");
  assert.deepEqual(geometry.segmentLabels, []);
  assert.equal(geometry.planeCount, 38);
  assert.equal(geometry.outer.positions.length, expectedVertices * 3);
  assert.equal(geometry.grayMatter.positions.length, expectedVertices * 3);
  assert.equal(geometry.outer.indices.length, expectedIndices);
  assert.equal(geometry.grayMatter.indices.length, expectedIndices);
  assert.equal(Math.max(...geometry.outer.indices), expectedVertices - 1);
  assert.equal(Math.max(...geometry.grayMatter.indices), expectedVertices - 1);
});

test("rejects registration-like segment labels and relaxed measurement boundaries", () => {
  const labelled = structuredClone(payload);
  labelled.planes[0].segment.value = "C1";
  assert.throws(() => buildAtlasReferenceGeometry(labelled), /segment labels must remain absent/);
  const measurable = structuredClone(payload);
  measurable.measurementUse = "allowed";
  assert.throws(() => buildAtlasReferenceGeometry(measurable), /measurement boundary is invalid/);
});

test("builds seven exact source-mask structures as plane-local contours only", () => {
  const geometry = buildAtlasInternalContourGeometry(internalPayload);
  assert.deepEqual(geometry.structures.map((structure) => structure.identifier), ATLAS_INTERNAL_STRUCTURE_IDS);
  assert.equal(geometry.planeCount, 38);
  assert.equal(geometry.structureCount, 7);
  assert.equal(geometry.totalComponentCount, 973);
  assert.equal(geometry.totalContourCount, 975);
  assert.equal(geometry.registrationCount, 0);
  assert.equal(geometry.geometryStatus, "INF");
  assert.equal(geometry.measurementUse, "forbidden");
  assert.equal(geometry.crossPlaneCorrespondence, "none");
  assert.equal(geometry.interpolation, "none");
  assert.deepEqual(
    geometry.structures.map((structure) => structure.selectionMode),
    [
      "inclusive_descendants",
      "inclusive_descendants",
      "inclusive_descendants",
      "exact_identifier",
      "inclusive_descendants",
      "inclusive_descendants",
      "inclusive_descendants",
    ],
  );
  assert.deepEqual(geometry.missingPlanes, [
    {
      structureIdentifier: 74,
      structureName: "Dorsal funiculus",
      zIndex: 1470,
      reason: "source_mask_absent_at_sampled_plane",
    },
    {
      structureIdentifier: 74,
      structureName: "Dorsal funiculus",
      zIndex: 1519,
      reason: "source_mask_absent_at_sampled_plane",
    },
    {
      structureIdentifier: 74,
      structureName: "Dorsal funiculus",
      zIndex: 1566,
      reason: "source_mask_absent_at_sampled_plane",
    },
  ]);

  const contours = geometry.structures.flatMap((structure) => structure.contours);
  assert.equal(contours.length, 975);
  for (const contour of contours) {
    assert.equal(contour.planeLocal, true);
    assert.equal(contour.crossPlaneCorrespondence, "none");
    assert.equal("indices" in contour, false);
    assert.equal(contour.positions.length, contour.sourcePointCount * 3);
    const zValues = new Set(contour.positions.filter((_, index) => index % 3 === 2));
    assert.equal(zValues.size, 1, "each exact contour must remain on one sampled plane");
  }

  const firstSourcePoint = internalPayload.structures[0].planes[0].components[0].polygons[0].pointsVoxelEdgeXY[0];
  assert.deepEqual(contours[0].positions.slice(0, 3), voxelEdgeXYToAtlasDisplay(firstSourcePoint, 0));

  const renderedEdges = buildPlaneLocalContourSegments(contours);
  assert.equal(renderedEdges.length % 6, 0);
  for (let edge = 0; edge < renderedEdges.length; edge += 6) {
    assert.equal(renderedEdges[edge + 2], renderedEdges[edge + 5], "a rendered edge must never bridge sampled planes");
  }
});

test("builds 37 browser structures and keeps exact structural and motor context in separate lanes", () => {
  const geometry = buildAtlasFineAnatomyGeometry(fineAnatomyPayload);
  assert.deepEqual(
    geometry.structures.map((structure) => structure.identifier),
    ATLAS_FINE_ANATOMY_STRUCTURE_IDS,
  );
  assert.equal(geometry.planeCount, 38);
  assert.equal(geometry.structureCount, 37);
  assert.deepEqual(geometry.categoryCounts, { lamina: 14, nucleus_or_column: 17, tract: 6 });
  assert.equal(geometry.totalComponentCount, 2431);
  assert.equal(geometry.totalContourCount, 2511);
  assert.equal(geometry.missingPlaneCount, 670);
  assert.equal(geometry.directLeafStructureCount, 73);
  assert.deepEqual(fineAnatomyPayload.sourceInventory.directLeafIdentifiers, ATLAS_DIRECT_LEAF_STRUCTURE_IDS);
  assert.deepEqual(
    geometry.structuralContextStructures.map((structure) => structure.identifier),
    ATLAS_STRUCTURAL_CONTEXT_STRUCTURE_IDS,
  );
  assert.deepEqual(
    geometry.motorContextStructures.map((structure) => structure.identifier),
    ATLAS_MOTOR_CONTEXT_STRUCTURE_IDS,
  );
  assert.equal(geometry.sourceStateCount, 32);
  assert.equal(geometry.fillOverlayCount, 76);
  assert.equal(fineAnatomyPayload.lanePolicy.atlasRegionCountsAreInterneuronCounts, false);
  assert.ok(geometry.fillOverlayLanes.every((lane) => lane.includedInInterneuronCounts === false));
  assert.equal(geometry.fillOverlayLanes.find((lane) => lane.laneId === "motor_context").defaultVisibility, "off");
  assert.deepEqual(geometry.fullyUnsampledStructureIdentifiers, []);
  assert.equal(geometry.registrationCount, 0);
  assert.equal(geometry.measurementUse, "forbidden");
  assert.equal(geometry.interpolation, "none");
  assert.ok(geometry.structures.every((structure) => structure.selectionMode === "exact_identifier"));
  assert.ok(geometry.structures.every((structure) => !structure.rootIdentifierPath.includes(120)));
  assert.ok(geometry.structures.every((structure) => structure.sampledPlaneSummary.presentPlaneCount > 0));

  const contours = geometry.structures.flatMap((structure) => structure.contours);
  assert.equal(contours.length, 2511);
  assert.ok(contours.every((contour) => contour.planeLocal && contour.crossPlaneCorrespondence === "none"));
  assert.equal(buildPlaneLocalContourSegments(contours).length % 6, 0);
});

test("rejects invented fine anatomy, descendant expansion, and geometry in missing planes", () => {
  const wrongId = structuredClone(fineAnatomyPayload);
  wrongId.structures[0].identifier = 999;
  assert.throws(() => buildAtlasFineAnatomyGeometry(wrongId), /identifiers or ordering/);

  const expanded = structuredClone(fineAnatomyPayload);
  expanded.targetPolicy.descendantExpansion = "inclusive";
  assert.throws(() => buildAtlasFineAnatomyGeometry(expanded), /target policy changed/);

  const motorPool = structuredClone(fineAnatomyPayload);
  motorPool.structures[0].rootIdentifierPath = [250, 71, 110, 120, 28];
  assert.throws(() => buildAtlasFineAnatomyGeometry(motorPool), /metadata changed/);

  const filledMissing = structuredClone(fineAnatomyPayload);
  const structure = filledMissing.structures.find((candidate) => candidate.identifier === 25);
  const missing = structure.planes.find((plane) => plane.presence === "missing");
  missing.components.push(structuredClone(structure.planes.find((plane) => plane.presence === "present").components[0]));
  assert.throws(() => buildAtlasFineAnatomyGeometry(filledMissing), /geometry in a missing plane/);
});

test("rejects any internal registration, interpolation, segment label, or filled missing plane", () => {
  const wrongAsset = structuredClone(internalPayload);
  wrongAsset.assetId = "lookalike-atlas";
  assert.throws(() => buildAtlasInternalContourGeometry(wrongAsset), /source identity is not the pinned derivative/);

  const registered = structuredClone(internalPayload);
  registered.registrationCount = 1;
  assert.throws(() => buildAtlasInternalContourGeometry(registered), /registration boundary is invalid/);

  const inventedConfidence = structuredClone(internalPayload);
  inventedConfidence.confidence = { value: 1, missingReason: null };
  assert.throws(() => buildAtlasInternalContourGeometry(inventedConfidence), /registration boundary is invalid/);

  const interpolated = structuredClone(internalPayload);
  interpolated.polygonPolicy.interpolation = "linear";
  assert.throws(() => buildAtlasInternalContourGeometry(interpolated), /uninterpolated source-mask edges/);

  const wrongSourceMask = structuredClone(internalPayload);
  wrongSourceMask.structures[0].planes[0].components[0].sourceIdentifiers[0] = 99999;
  assert.throws(() => buildAtlasInternalContourGeometry(wrongSourceMask), /invalid plane-local component/);

  const labelled = structuredClone(internalPayload);
  labelled.structures[0].planes[0].segment.value = "C1";
  assert.throws(() => buildAtlasInternalContourGeometry(labelled), /invalid segment or component record/);

  const filledMissingPlane = structuredClone(internalPayload);
  const missingPlane = filledMissingPlane.structures[4].planes.at(-1);
  missingPlane.components.push(structuredClone(filledMissingPlane.structures[4].planes.at(-2).components[0]));
  assert.throws(() => buildAtlasInternalContourGeometry(filledMissingPlane), /geometry in a missing plane/);
});

test("rejects broken internal contour closure and cross-plane component policies", () => {
  const openContour = structuredClone(internalPayload);
  openContour.structures[0].planes[0].components[0].polygons[0].pointsVoxelEdgeXY.at(-1)[0] += 1;
  assert.throws(() => buildAtlasInternalContourGeometry(openContour), /explicitly closed/);

  const crossPlane = structuredClone(internalPayload);
  crossPlane.componentPolicy.componentIndexScope = "cross_plane_matched";
  assert.throws(() => buildAtlasInternalContourGeometry(crossPlane), /plane-local/);

  const geometry = buildAtlasInternalContourGeometry(internalPayload);
  const forgedBridge = structuredClone(geometry.structures[0].contours[0]);
  forgedBridge.positions[5] += 1;
  assert.throws(() => buildPlaneLocalContourSegments([forgedBridge]), /leave its sampled source plane/);
});
