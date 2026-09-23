#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildNativeContourDerivedSomaSurfaceArtifact,
  SURFACE_ARTIFACT_PATH,
  SURFACE_RECEIPT_PATH,
} from "../tools/build_native_contour_derived_soma_surface_0_1.mjs";
import { validateNativeContourDerivedSomaSurface } from "../app/native-contour-derived-soma-surface.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateNativeContourDerivedSomaSurfaceRelease() {
  const built = await buildNativeContourDerivedSomaSurfaceArtifact();
  const [artifactBytes, receiptBytes, sourceGeometryBytes] = await Promise.all([
    readFile(path.join(ROOT, SURFACE_ARTIFACT_PATH)),
    readFile(path.join(ROOT, SURFACE_RECEIPT_PATH)),
    readFile(path.join(ROOT, "public", built.receipt.sourceNativeContourGeometry.path)),
  ]);
  if (!artifactBytes.equals(built.artifactBytes)) throw new Error("Derived open-shell artifact differs from deterministic rebuild");
  if (!receiptBytes.equals(built.receiptBytes)) throw new Error("Derived open-shell receipt differs from deterministic rebuild");
  if (sha256(artifactBytes) !== built.receipt.artifact.sha256 || artifactBytes.byteLength !== built.receipt.artifact.bytes) {
    throw new Error("Derived open-shell artifact byte receipt mismatch");
  }
  if (sha256(sourceGeometryBytes) !== built.receipt.sourceNativeContourGeometry.sha256) {
    throw new Error("Derived open-shell source contour file receipt mismatch");
  }
  const payload = JSON.parse(artifactBytes.toString("utf8"));
  const expectedPayloadSha256 = sha256(Buffer.from(JSON.stringify(Object.fromEntries(Object.entries(payload).filter(([key]) => key !== "payloadSha256")))));
  if (payload.payloadSha256 !== expectedPayloadSha256 || payload.payloadSha256 !== built.receipt.artifact.payloadSha256) {
    throw new Error("Derived open-shell canonical payload checksum mismatch");
  }
  const sourcePayload = JSON.parse(sourceGeometryBytes.toString("utf8"));
  validateNativeContourDerivedSomaSurface(payload, sourcePayload, {
    originalDat: built.receipt.sourceOriginalDat,
    nativeContourGeometry: built.receipt.sourceNativeContourGeometry,
  });
  if (built.receipt.geometryCounts.derivedDisplayOpenShellCount !== 1 || built.receipt.geometryCounts.observedSurfaceCount !== 0
    || built.receipt.geometryCounts.volumeCount !== 0 || built.receipt.geometryCounts.internalStructureObjectCount !== 0
    || built.receipt.geometryCounts.registrationCount !== 0) {
    throw new Error("Derived open-shell scope boundary changed");
  }
  return {
    releaseId: built.receipt.releaseId,
    neuronId: built.receipt.neuronId,
    artifactBytes: artifactBytes.byteLength,
    artifactSha256: sha256(artifactBytes),
    sourceContourCount: payload.sourceReceipts.sourceContourCount,
    sourceVertexCount: payload.sourceReceipts.sourceVertexCount,
    derivedVertexCount: payload.qualityAssurance.vertexCount,
    triangleCount: payload.qualityAssurance.triangleCount,
    observedSurfaceCount: payload.qualityAssurance.observedSurfaceCount,
    derivedDisplayOpenShellCount: payload.qualityAssurance.derivedDisplayOpenShellCount,
    volumeCount: payload.qualityAssurance.volumeCount,
    internalStructureObjectCount: payload.qualityAssurance.internalStructureObjectCount,
    registrationCount: payload.qualityAssurance.registrationCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateNativeContourDerivedSomaSurfaceRelease()
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
