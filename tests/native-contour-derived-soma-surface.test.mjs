import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildNativeContourDerivedSomaSurface,
  NATIVE_CONTOUR_DERIVED_SURFACE_AUTHORITY,
  validateNativeContourDerivedSomaSurface,
} from "../app/native-contour-derived-soma-surface.js";
import {
  buildNativeContourDerivedSomaSurfaceArtifact,
  SURFACE_ARTIFACT_PATH,
  SURFACE_RECEIPT_PATH,
} from "../tools/build_native_contour_derived_soma_surface_0_1.mjs";
import { validateNativeContourDerivedSomaSurfaceRelease } from "../scripts/validate-native-contour-derived-soma-surface-0.1.mjs";

const readJson = async (path) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), "utf8"));
const source = await readJson("public/data/prp_dorsal_horn_observed_morphology_route_pack_v1/native-contours/nmo-50394-mbf-cell-body-line-loops.json");
const sourceReceipts = {
  originalDat: { bytes: 191975, sha256: "eceb6bc0cd2247e2ef2c51c6063b97db64d194d8483ef6d7427c715d9054a109" },
  nativeContourGeometry: {
    path: "/data/prp_dorsal_horn_observed_morphology_route_pack_v1/native-contours/nmo-50394-mbf-cell-body-line-loops.json",
    bytes: 123254,
    sha256: "61fddbab3764e761600c2519e478eec4cee7918a581b2fde29ac2d8880c90a92",
  },
};

test("NMO 50394 gets one deterministic open interpolation shell from 14 contiguous OBS sections", () => {
  const built = buildNativeContourDerivedSomaSurface(source, sourceReceipts);
  assert.equal(built.authority, NATIVE_CONTOUR_DERIVED_SURFACE_AUTHORITY);
  assert.equal(built.sourceReceipts.sourceContourCount, 14);
  assert.equal(built.sourceReceipts.sourceVertexCount, 768);
  assert.deepEqual(built.geometry.rings.map((ring) => ring.zMicrometre), Array.from({ length: 14 }, (_, index) => index - 58));
  assert.equal(built.geometry.rings.length, 14);
  assert.ok(built.geometry.rings.every((ring) => ring.pointsMicrometre.length === 128));
  assert.equal(built.geometry.triangleIndices.length / 3, 3328);
  assert.deepEqual(built.geometry.rings.map((ring) => ring.sourceVertexCount).reduce((sum, count) => sum + count, 0), 768);
  assert.deepEqual(built.qualityAssurance, {
    selfIntersectingInputContourCount: 0,
    uniquePlaneCount: 14,
    adjacentPlaneGapMicrometre: 1,
    maximumAdjacentCentroidShiftMicrometre: 0.6728537362507743,
    maximumAdjacentContourAreaRatio: 1.4565264548261843,
    maximumAdjacentAlignedRmsMicrometre: 1.3035538556235107,
    capCount: 0,
    ringCount: 14,
    vertexCount: 1792,
    triangleCount: 3328,
    openEndBoundaryLoopCount: 2,
    observedSurfaceCount: 0,
    derivedDisplayOpenShellCount: 1,
    volumeCount: 0,
    membraneClaimCount: 0,
    internalStructureObjectCount: 0,
    biologicalMeasurementCount: 0,
    sameCellJoinCount: 0,
    registrationCount: 0,
  });
  assert.ok(source.contours.every((contour) => contour.sourceClosedFlag === false));
  assert.deepEqual(source.contours.map((contour) => contour.zValuesMicrometre[0]), [-51, -52, -53, -54, -55, -56, -57, -58, -50, -49, -48, -47, -46, -45]);
});

test("surface eligibility fails closed on identity drift, contour self-intersection and non-contiguous planes", () => {
  const wrongCell = structuredClone(source);
  wrongCell.assetId = "NeuroMorpho:50424";
  assert.throws(() => buildNativeContourDerivedSomaSurface(wrongCell, sourceReceipts), /exact NMO 50394/);

  const selfIntersecting = structuredClone(source);
  const crossed = selfIntersecting.contours[0];
  const z = crossed.zValuesMicrometre[0];
  crossed.points = [[0, 0, z, 0], [1, 1, z, 0], [0, 1, z, 0], [1, 0, z, 0]];
  crossed.vertexCount = crossed.points.length;
  assert.throws(() => buildNativeContourDerivedSomaSurface(selfIntersecting, sourceReceipts), /self-intersection|degenerate planar area/);

  const planeGap = structuredClone(source);
  planeGap.contours[0].zValuesMicrometre[0] += 0.25;
  planeGap.contours[0].points.forEach((point) => { point[2] += 0.25; });
  assert.throws(() => buildNativeContourDerivedSomaSurface(planeGap, sourceReceipts), /contiguous 1 micrometre plane/);
});

test("release artifact and receipt remain byte-deterministic and source-bounded", async () => {
  const built = await buildNativeContourDerivedSomaSurfaceArtifact();
  assert.deepEqual(await readFile(new URL(`../${SURFACE_ARTIFACT_PATH}`, import.meta.url)), built.artifactBytes);
  assert.deepEqual(await readFile(new URL(`../${SURFACE_RECEIPT_PATH}`, import.meta.url)), built.receiptBytes);
  const artifact = JSON.parse(built.artifactBytes.toString("utf8"));
  validateNativeContourDerivedSomaSurface(artifact, source, {
    originalDat: built.receipt.sourceOriginalDat,
    nativeContourGeometry: built.receipt.sourceNativeContourGeometry,
  });
  const digest = createHash("sha256").update(JSON.stringify(Object.fromEntries(Object.entries(artifact).filter(([key]) => key !== "payloadSha256")))).digest("hex");
  assert.equal(artifact.payloadSha256, digest);
  assert.deepEqual(await validateNativeContourDerivedSomaSurfaceRelease(), {
    releaseId: "ohri-native-contour-derived-soma-surface-0.1.0",
    neuronId: 50394,
    artifactBytes: built.artifactBytes.byteLength,
    artifactSha256: built.receipt.artifact.sha256,
    sourceContourCount: 14,
    sourceVertexCount: 768,
    derivedVertexCount: 1792,
    triangleCount: 3328,
    observedSurfaceCount: 0,
    derivedDisplayOpenShellCount: 1,
    volumeCount: 0,
    internalStructureObjectCount: 0,
    registrationCount: 0,
  });

  artifact.qualityAssurance.volumeCount = 1;
  assert.throws(() => validateNativeContourDerivedSomaSurface(artifact, source, {
    originalDat: built.receipt.sourceOriginalDat,
    nativeContourGeometry: built.receipt.sourceNativeContourGeometry,
  }), /differs from deterministic eligibility-gated rebuild/);
});
