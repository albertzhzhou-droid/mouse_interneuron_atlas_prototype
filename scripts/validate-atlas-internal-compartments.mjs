#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_ASSET_PATH = resolve(
  PROJECT_ROOT,
  "public/data/allen_cord_20um_v3_0/atlas-internal-compartments.json",
);
const EXPECTED_Z_INDICES = Object.freeze([
  0, 27, 49, 77, 98, 147, 172, 196, 245, 294, 343, 392, 441, 490, 539, 588, 637,
  686, 735, 784, 811, 833, 882, 931, 980, 1029, 1078, 1106, 1127, 1176, 1225,
  1274, 1323, 1372, 1421, 1470, 1519, 1566,
]);
const EXPECTED_STRUCTURES = Object.freeze([
  { identifier: 90, parentIdentifier: 71, rootIdentifierPath: [250, 71, 90], selectionMode: "inclusive_descendants" },
  { identifier: 100, parentIdentifier: 71, rootIdentifierPath: [250, 71, 100], selectionMode: "inclusive_descendants" },
  { identifier: 110, parentIdentifier: 71, rootIdentifierPath: [250, 71, 110], selectionMode: "inclusive_descendants" },
  { identifier: 16, parentIdentifier: 100, rootIdentifierPath: [250, 71, 100, 16], selectionMode: "exact_identifier" },
  { identifier: 74, parentIdentifier: 130, rootIdentifierPath: [250, 130, 74], selectionMode: "inclusive_descendants" },
  { identifier: 75, parentIdentifier: 130, rootIdentifierPath: [250, 130, 75], selectionMode: "inclusive_descendants" },
  { identifier: 70, parentIdentifier: 130, rootIdentifierPath: [250, 130, 70], selectionMode: "inclusive_descendants" },
]);

const sameJson = (left, right) => JSON.stringify(left) === JSON.stringify(right);

function addCheck(errors, condition, message) {
  if (!condition) errors.push(message);
}

function signedArea(points) {
  return (
    points.slice(0, -1).reduce((total, point, index) => {
      const next = points[index + 1];
      return total + point[0] * next[1] - next[0] * point[1];
    }, 0) / 2
  );
}

function orientation(first, second, third) {
  const cross =
    (second[0] - first[0]) * (third[1] - first[1]) -
    (second[1] - first[1]) * (third[0] - first[0]);
  return Math.sign(cross);
}

function pointOnSegment(first, second, point) {
  return (
    orientation(first, second, point) === 0 &&
    point[0] >= Math.min(first[0], second[0]) &&
    point[0] <= Math.max(first[0], second[0]) &&
    point[1] >= Math.min(first[1], second[1]) &&
    point[1] <= Math.max(first[1], second[1])
  );
}

function segmentsIntersect(firstStart, firstEnd, secondStart, secondEnd) {
  const orientations = [
    orientation(firstStart, firstEnd, secondStart),
    orientation(firstStart, firstEnd, secondEnd),
    orientation(secondStart, secondEnd, firstStart),
    orientation(secondStart, secondEnd, firstEnd),
  ];
  if (orientations[0] !== orientations[1] && orientations[2] !== orientations[3]) return true;
  return (
    (orientations[0] === 0 && pointOnSegment(firstStart, firstEnd, secondStart)) ||
    (orientations[1] === 0 && pointOnSegment(firstStart, firstEnd, secondEnd)) ||
    (orientations[2] === 0 && pointOnSegment(secondStart, secondEnd, firstStart)) ||
    (orientations[3] === 0 && pointOnSegment(secondStart, secondEnd, firstEnd))
  );
}

function hasSelfIntersection(points) {
  const edgeCount = points.length - 1;
  for (let firstIndex = 0; firstIndex < edgeCount; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < edgeCount; secondIndex += 1) {
      const adjacent =
        secondIndex === firstIndex + 1 ||
        (firstIndex === 0 && secondIndex === edgeCount - 1);
      if (adjacent) continue;
      if (
        segmentsIntersect(
          points[firstIndex],
          points[firstIndex + 1],
          points[secondIndex],
          points[secondIndex + 1],
        )
      ) {
        return true;
      }
    }
  }
  return false;
}

function validatePolygon(errors, polygon, label) {
  const points = polygon?.pointsVoxelEdgeXY;
  addCheck(errors, polygon?.role === "exterior" || polygon?.role === "hole", `${label}: invalid ring role`);
  addCheck(errors, Array.isArray(points) && points.length >= 5, `${label}: polygon needs at least four closed edges`);
  if (!Array.isArray(points) || points.length < 2) return;
  addCheck(errors, sameJson(points[0], points.at(-1)), `${label}: polygon is not closed`);
  const openPoints = points.slice(0, -1);
  addCheck(
    errors,
    new Set(openPoints.map((point) => JSON.stringify(point))).size === openPoints.length,
    `${label}: polygon repeats a non-closing vertex`,
  );
  for (const point of points) {
    addCheck(
      errors,
      Array.isArray(point) &&
        point.length === 2 &&
        point.every(Number.isInteger) &&
        point[0] >= 0 &&
        point[0] <= 322 &&
        point[1] >= 0 &&
        point[1] <= 253,
      `${label}: invalid native voxel-edge point`,
    );
  }
  const area = signedArea(points);
  addCheck(errors, Number.isFinite(area) && area !== 0, `${label}: polygon has zero or invalid area`);
  addCheck(errors, polygon.signedAreaVoxel2 === area, `${label}: recorded signed area does not match vertices`);
  addCheck(errors, polygon.role === (area > 0 ? "exterior" : "hole"), `${label}: role and winding disagree`);
  addCheck(errors, !hasSelfIntersection(points), `${label}: polygon self-intersects`);
}

export function validateAtlasInternalCompartments(data) {
  const errors = [];
  addCheck(errors, data?.schemaVersion === "0.1.0", "schemaVersion must be 0.1.0");
  addCheck(
    errors,
    data?.assetId === "allen_cord_20um:3.0:internal-compartments-v3" &&
      data?.sourceAtlasAssetId === "allen_cord_20um:3.0:ohri-sampled-reference-v4",
    "internal-compartment derivative identity changed",
  );
  addCheck(errors, data?.atlas === "allen_cord_20um" && data?.atlasVersion === "3.0", "atlas identity must remain allen_cord_20um 3.0");
  addCheck(
    errors,
    data?.coordinateSpaceId === "allen_spinal_cord-adult-mouse-space:2021",
    "coordinate space must remain the pinned adult mouse spinal-cord space",
  );
  addCheck(
    errors,
    data?.sourceAnnotation === "allen_spinal_cord-adult-mouse-annotation:2021",
    "source annotation identity changed",
  );
  addCheck(errors, data?.geometryStatus === "INF", "internal compartments must remain INF");
  addCheck(errors, data?.measurementUse === "forbidden", "measurement use must remain forbidden");
  addCheck(
    errors,
    data?.confidence?.value === null && data?.confidence?.missingReason === "not_measured",
    "confidence must remain explicit null / not_measured",
  );
  addCheck(errors, data?.registrationCount === 0, "registration count must remain zero");
  addCheck(errors, data?.registrationStatus === "not_a_registration", "asset must not claim registration");
  addCheck(
    errors,
    data?.segmentLabelStatus === "not_available_pending_curation",
    "segment labels must remain explicitly unavailable",
  );
  addCheck(errors, sameJson(data?.sampledZIndices, EXPECTED_Z_INDICES), "sampled z planes or ordering changed");
  addCheck(errors, data?.componentPolicy?.connectivity === 4, "component connectivity must remain 4");
  addCheck(
    errors,
    data?.componentPolicy?.disconnectedComponents === "preserved_never_bridged",
    "disconnected components must remain unbridged",
  );
  addCheck(errors, data?.polygonPolicy?.interpolation === "none", "polygon interpolation must remain disabled");
  addCheck(errors, data?.polygonPolicy?.manualGeometry === "none", "manual polygon geometry must remain disabled");

  const structures = data?.structures;
  addCheck(errors, Array.isArray(structures) && structures.length === 7, "exactly seven internal structures are required");
  if (!Array.isArray(structures)) throw new Error(errors.join("\n"));
  addCheck(
    errors,
    sameJson(structures.map((structure) => structure.identifier), EXPECTED_STRUCTURES.map((structure) => structure.identifier)),
    "target structure identifiers or ordering changed",
  );

  let totalComponents = 0;
  let totalPolygons = 0;
  let missingPlaneCount = 0;
  structures.forEach((structure, structureIndex) => {
    const expected = EXPECTED_STRUCTURES[structureIndex];
    if (!expected) return;
    const label = `structure ${expected.identifier}`;
    addCheck(errors, structure.identifier === expected.identifier, `${label}: source identifier mismatch`);
    addCheck(errors, structure.annotationValue === expected.identifier, `${label}: root annotation value mismatch`);
    addCheck(errors, structure.parentIdentifier === expected.parentIdentifier, `${label}: parent identifier mismatch`);
    addCheck(errors, sameJson(structure.rootIdentifierPath, expected.rootIdentifierPath), `${label}: root path mismatch`);
    addCheck(errors, structure.selectionMode === expected.selectionMode, `${label}: selection mode mismatch`);
    addCheck(errors, /^#[0-9A-F]{6}$/.test(structure.colorHexTriplet ?? ""), `${label}: source color is invalid`);
    addCheck(errors, typeof structure.name === "string" && structure.name.length > 0, `${label}: source name is missing`);
    addCheck(errors, typeof structure.abbreviation === "string" && structure.abbreviation.length > 0, `${label}: source abbreviation is missing`);

    const includedLabels = structure.includedSourceLabels;
    addCheck(errors, Array.isArray(includedLabels) && includedLabels.length > 0, `${label}: included source labels are missing`);
    const includedAnnotationValues = new Set();
    const includedIdentifiers = new Set();
    for (const sourceLabel of includedLabels ?? []) {
      const sourceLabelName = `${label} included label ${sourceLabel.identifier}`;
      addCheck(errors, Number.isInteger(sourceLabel.identifier), `${sourceLabelName}: identifier is invalid`);
      addCheck(errors, Number.isInteger(sourceLabel.annotationValue), `${sourceLabelName}: annotation value is invalid`);
      addCheck(errors, /^#[0-9A-F]{6}$/.test(sourceLabel.colorHexTriplet ?? ""), `${sourceLabelName}: color is invalid`);
      addCheck(errors, Array.isArray(sourceLabel.rootIdentifierPath), `${sourceLabelName}: root path is missing`);
      if (expected.selectionMode === "exact_identifier") {
        addCheck(errors, sourceLabel.identifier === expected.identifier, `${sourceLabelName}: exact selection admitted another identifier`);
      } else {
        addCheck(errors, sourceLabel.rootIdentifierPath?.includes(expected.identifier), `${sourceLabelName}: label is not a target descendant`);
      }
      addCheck(errors, !includedAnnotationValues.has(sourceLabel.annotationValue), `${sourceLabelName}: duplicate annotation value`);
      addCheck(errors, !includedIdentifiers.has(sourceLabel.identifier), `${sourceLabelName}: duplicate identifier`);
      includedAnnotationValues.add(sourceLabel.annotationValue);
      includedIdentifiers.add(sourceLabel.identifier);
    }
    addCheck(errors, includedIdentifiers.has(expected.identifier), `${label}: root identifier is absent from its source-mask definition`);
    if (expected.selectionMode === "exact_identifier") {
      addCheck(errors, includedIdentifiers.size === 1, `${label}: exact source mask must contain one identifier`);
    }

    const planes = structure.planes;
    addCheck(errors, Array.isArray(planes) && planes.length === 38, `${label}: exactly 38 plane records are required`);
    addCheck(errors, sameJson(planes?.map((plane) => plane.zIndex), EXPECTED_Z_INDICES), `${label}: plane ordering changed`);
    for (const plane of planes ?? []) {
      const planeLabel = `${label} z=${plane.zIndex}`;
      addCheck(errors, plane.anteriorPosteriorMm === Number((plane.zIndex * 0.02).toFixed(3)), `${planeLabel}: AP coordinate mismatch`);
      addCheck(
        errors,
        plane.segment?.value === null && plane.segment?.missingReason === "pending_curation",
        `${planeLabel}: segment label must remain explicit null / pending_curation`,
      );
      addCheck(errors, Number.isInteger(plane.voxelCount) && plane.voxelCount >= 0, `${planeLabel}: voxel count is invalid`);
      addCheck(errors, Array.isArray(plane.components), `${planeLabel}: components must be an array`);
      const components = plane.components ?? [];
      if (plane.presence === "missing") {
        missingPlaneCount += 1;
        addCheck(errors, plane.missingReason === "source_mask_absent_at_sampled_plane", `${planeLabel}: missing reason is absent or invalid`);
        addCheck(errors, plane.voxelCount === 0 && components.length === 0, `${planeLabel}: missing plane contains geometry`);
      } else {
        addCheck(errors, plane.presence === "present", `${planeLabel}: presence must be present or missing`);
        addCheck(errors, plane.voxelCount > 0 && components.length > 0, `${planeLabel}: present plane lacks source-mask geometry`);
        addCheck(errors, !("missingReason" in plane), `${planeLabel}: present plane must not declare missingReason`);
      }

      let componentVoxelTotal = 0;
      components.forEach((component, componentIndex) => {
        const componentLabel = `${planeLabel} component ${componentIndex + 1}`;
        totalComponents += 1;
        addCheck(errors, component.componentIndex === componentIndex + 1, `${componentLabel}: component indices are not deterministic/sequential`);
        addCheck(errors, component.connectivity === 4, `${componentLabel}: connectivity must remain 4`);
        addCheck(errors, Number.isInteger(component.voxelCount) && component.voxelCount > 0, `${componentLabel}: voxel count is invalid`);
        componentVoxelTotal += component.voxelCount ?? 0;
        addCheck(
          errors,
          Array.isArray(component.sourceAnnotationValues) &&
            component.sourceAnnotationValues.length > 0 &&
            component.sourceAnnotationValues.every((value) => includedAnnotationValues.has(value)),
          `${componentLabel}: component uses an annotation value outside its declared source mask`,
        );
        addCheck(
          errors,
          Array.isArray(component.sourceIdentifiers) &&
            component.sourceIdentifiers.length === component.sourceAnnotationValues?.length &&
            component.sourceIdentifiers.every((value) => includedIdentifiers.has(value)),
          `${componentLabel}: source identifiers are missing or outside the declared hierarchy`,
        );
        addCheck(errors, Array.isArray(component.polygons) && component.polygons.length > 0, `${componentLabel}: polygons are missing`);
        let polygonAreaTotal = 0;
        for (const [polygonIndex, polygon] of (component.polygons ?? []).entries()) {
          totalPolygons += 1;
          validatePolygon(errors, polygon, `${componentLabel} polygon ${polygonIndex + 1}`);
          polygonAreaTotal += polygon.signedAreaVoxel2 ?? 0;
        }
        addCheck(errors, polygonAreaTotal === component.voxelCount, `${componentLabel}: polygon area does not reproduce the source-mask voxel count`);
      });
      addCheck(errors, componentVoxelTotal === plane.voxelCount, `${planeLabel}: component voxel counts do not reproduce the plane source mask`);
    }
  });

  if (errors.length) {
    throw new Error(`Internal-compartment validation failed:\n- ${errors.join("\n- ")}`);
  }
  return {
    structureIdentifiers: structures.map((structure) => structure.identifier),
    sampledPlaneCount: EXPECTED_Z_INDICES.length,
    totalComponents,
    totalPolygons,
    missingPlaneCount,
    geometryStatus: data.geometryStatus,
    measurementUse: data.measurementUse,
    registrationCount: data.registrationCount,
  };
}

export async function validateAtlasInternalCompartmentsFile(path = DEFAULT_ASSET_PATH) {
  const data = JSON.parse(await readFile(path, "utf8"));
  return validateAtlasInternalCompartments(data);
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const path = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_ASSET_PATH;
  validateAtlasInternalCompartmentsFile(path)
    .then((report) => {
      process.stdout.write(
        `Atlas internal-compartment validation passed: ${report.structureIdentifiers.join(", ")}; ` +
          `${report.sampledPlaneCount} ordered planes per structure; ${report.totalComponents} unbridged components; ` +
          `${report.totalPolygons} valid source-mask polygons; ${report.missingPlaneCount} explicit missing planes; ` +
          `${report.geometryStatus}; measurement ${report.measurementUse}; ${report.registrationCount} REG.\n`,
      );
    })
    .catch((error) => {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
    });
}
