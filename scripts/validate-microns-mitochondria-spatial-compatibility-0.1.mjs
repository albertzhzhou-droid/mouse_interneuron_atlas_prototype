#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_PATH = path.join(ROOT, "data/microns-mitochondria-spatial-compatibility-0.1.json");
const TARGET_MANIFEST_PATH = path.join(ROOT, "public/data/microns_phase1_v185_4_root_648518346349516051_v1/asset-manifest.json");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

const boxesOverlap = (leftMin, leftMax, rightMin, rightMax) => leftMin.every((value, axis) =>
  value < rightMax[axis] && leftMax[axis] > rightMin[axis]);

export async function validateMicronsMitochondriaSpatialCompatibility(override = null, assetOverride = null) {
  const contract = override ?? JSON.parse(await readFile(CONTRACT_PATH, "utf8"));
  const assetBytes = await readFile(TARGET_MANIFEST_PATH);
  const asset = assetOverride ?? JSON.parse(assetBytes);
  const errors = [];
  const fail = (condition, message) => { if (!condition) errors.push(message); };

  fail(contract.schemaVersion === "0.1.0", "schema version changed");
  fail(contract.auditId === "microns-mitochondria-spatial-compatibility-0.1.0", "audit identity changed");
  fail(contract.targetCell.rootId === "648518346349516051", "target root changed");
  fail(contract.targetCell.segmentationRelease === "v185.4", "target mesh release changed");
  fail(sha256(assetBytes) === contract.targetCell.assetManifestSha256, "target-cell asset manifest checksum changed");
  fail(contract.mitochondriaLayer.metadataUrl.endsWith("/mit_new/info"), "official source metadata route changed");
  fail(contract.mitochondriaLayer.metadataByteLength === 482, "source info byte length changed");
  fail(contract.mitochondriaLayer.metadataSha256 === "e458ae905bab05a30957454eead792279a4611eb307c6c2c79e396f3a5549364", "source info checksum changed");
  fail(contract.mitochondriaLayer.sourceMetadataRetained === false, "unretained source metadata status changed");
  fail(JSON.stringify(contract.mitochondriaLayer.resolutionNanometre) === JSON.stringify([4, 4, 40]), "source voxel resolution changed");
  fail(JSON.stringify(contract.mitochondriaLayer.voxelOffset) === JSON.stringify([19746, 11753, 65]), "source voxel offset changed");
  fail(JSON.stringify(contract.mitochondriaLayer.sizeVoxel) === JSON.stringify([2560, 2560, 100]), "source voxel size changed");

  const component = asset.components.find((entry) => entry.componentName === "cell");
  fail(Boolean(component), "exact target-cell mesh component is absent");
  if (component) {
    fail(asset.rootId === contract.targetCell.rootId, "asset target root changed");
    fail(asset.sourceRelease === contract.targetCell.segmentationRelease, "asset segmentation release changed");
    fail(component.browserGeometry?.coordinateFrame === contract.targetCell.coordinateFrame, "target coordinate frame changed");
    fail(JSON.stringify(component.browserGeometry?.boundsNanometre) === JSON.stringify(contract.targetCell.meshBoundsNanometre), "target mesh bounds changed");
  }

  const { resolutionNanometre: resolution, voxelOffset: offset, sizeVoxel: size } = contract.mitochondriaLayer;
  const layerMin = offset.map((coordinate, axis) => coordinate * resolution[axis]);
  const layerMax = offset.map((coordinate, axis) => (coordinate + size[axis]) * resolution[axis]);
  fail(JSON.stringify(layerMin) === JSON.stringify(contract.nominalBoundsIfDirectlyMappedToTargetFrameNanometre.min), "derived layer lower bounds changed");
  fail(JSON.stringify(layerMax) === JSON.stringify(contract.nominalBoundsIfDirectlyMappedToTargetFrameNanometre.maxExclusive), "derived layer upper bounds changed");

  const targetMin = contract.targetCell.meshBoundsNanometre.min;
  const targetMax = contract.targetCell.meshBoundsNanometre.max;
  const overlaps = boxesOverlap(layerMin, layerMax, targetMin, targetMax);
  const axisOverlap = layerMin.map((value, axis) => value < targetMax[axis] && layerMax[axis] > targetMin[axis]);
  fail(JSON.stringify(axisOverlap) === JSON.stringify([false, false, true]), "axis-wise nominal overlap changed");
  fail(overlaps === false, "identity-mapped source layer overlaps the target-cell mesh");
  fail(contract.coordinateCompatibility.metadataDeclaresTargetRootMembership === false, "target-root membership must remain unverified");
  fail(contract.coordinateCompatibility.metadataDeclaresCrossLayerTransform === false, "cross-layer transform disclosure changed");
  fail(contract.coordinateCompatibility.sharedOriginAndAxisMappingVerified === false, "shared coordinate mapping must remain unverified");
  fail(contract.coordinateCompatibility.spatialOverlapUnderIdentityMapping === false, "nominal spatial no-overlap result changed");
  fail(contract.admission.targetRootMembershipVerified === false, "target-root membership cannot be inferred");
  fail(contract.admission.mitochondriaObjectCount === 0, "mitochondria objects must remain excluded");
  fail(contract.admission.importedGeometryCount === 0, "mitochondria geometry must remain excluded");
  fail(contract.admission.registrationCount === 0, "cross-layer registration must remain absent");
  fail(contract.admission.mouseSpinalIdentityJoinCount === 0, "spinal identity joins must remain absent");
  fail(contract.admission.biologicalAbsenceClaim === false, "spatial no-overlap must not become a biological absence claim");

  assert.equal(errors.length, 0, errors.join("; "));
  return {
    auditId: contract.auditId,
    targetRootId: contract.targetCell.rootId,
    sourceInfoSha256: contract.mitochondriaLayer.metadataSha256,
    nominalLayerBoundsNanometre: { min: layerMin, maxExclusive: layerMax },
    axisOverlap,
    spatialOverlapUnderIdentityMapping: overlaps,
    coordinateMappingVerified: contract.coordinateCompatibility.sharedOriginAndAxisMappingVerified,
    mitochondriaObjectCount: contract.admission.mitochondriaObjectCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateMicronsMitochondriaSpatialCompatibility()
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
