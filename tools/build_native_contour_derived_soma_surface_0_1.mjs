#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildNativeContourDerivedSomaSurface,
  NATIVE_CONTOUR_DERIVED_SURFACE_ALGORITHM,
  NATIVE_CONTOUR_DERIVED_SURFACE_AUTHORITY,
} from "../app/native-contour-derived-soma-surface.js";
import {
  nativeContourAdmissionRecord,
  validateNativeContourAdmissionCatalog,
  validateNativeContourGeometry,
} from "../app/neurolucida-native-contour-admission.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const SURFACE_ARTIFACT_PATH = "public/data/native_contour_derived_soma_surface_v1/nmo-50394-cell-body-interpolated-open-shell-0.1.json";
export const SURFACE_RECEIPT_PATH = "data/native-contour-derived-soma-surface-0.1.json";
const BASE_CATALOG_PATH = "data/neurolucida-native-contour-admission-catalog-0.3.json";
const CATALOG_DELTA_PATH = "data/neurolucida-native-contour-admission-catalog-0.4.json";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const parseJson = async (filePath) => JSON.parse(await readFile(path.join(ROOT, filePath), "utf8"));

async function readVerifiedSource() {
  const baseCatalog = await parseJson(BASE_CATALOG_PATH);
  const delta = await parseJson(CATALOG_DELTA_PATH);
  const catalog = { ...delta, baseCatalogSnapshot: baseCatalog, records: [...baseCatalog.records, ...delta.addedRecords] };
  validateNativeContourAdmissionCatalog(catalog);
  const admission = nativeContourAdmissionRecord(catalog, 50394);
  if (!admission || admission.admissionStatus !== "admitted_mbf_cell_body_semantic_rule"
    || admission.admission?.admittedContourObjectCount !== 14 || admission.admission?.admittedVertexCount !== 768) {
    throw new Error("NMO 50394 source-native admission no longer matches the exact contour record");
  }
  const sourcePath = `public${admission.source.path}`;
  const geometryPath = `public${admission.derivedObject.path}`;
  const [sourceBytes, geometryBytes] = await Promise.all([
    readFile(path.join(ROOT, sourcePath)),
    readFile(path.join(ROOT, geometryPath)),
  ]);
  if (sourceBytes.byteLength !== admission.source.bytes || sha256(sourceBytes) !== admission.source.sha256) {
    throw new Error("NMO 50394 original DAT source receipt mismatch");
  }
  if (geometryBytes.byteLength !== admission.derivedObject.bytes || sha256(geometryBytes) !== admission.derivedObject.sha256) {
    throw new Error("NMO 50394 source-native contour geometry receipt mismatch");
  }
  const geometry = JSON.parse(geometryBytes.toString("utf8"));
  validateNativeContourGeometry(geometry, admission);
  return {
    admission,
    geometry,
    originalDat: { path: admission.source.path, bytes: sourceBytes.byteLength, sha256: sha256(sourceBytes) },
    nativeContourGeometry: { path: admission.derivedObject.path, bytes: geometryBytes.byteLength, sha256: sha256(geometryBytes) },
  };
}

export async function buildNativeContourDerivedSomaSurfaceArtifact() {
  const source = await readVerifiedSource();
  const payload = buildNativeContourDerivedSomaSurface(source.geometry, {
    originalDat: source.originalDat,
    nativeContourGeometry: source.nativeContourGeometry,
  });
  payload.payloadSha256 = sha256(Buffer.from(JSON.stringify(payload)));
  const artifactBytes = Buffer.from(`${JSON.stringify(payload, null, 2)}\n`);
  const receipt = {
    documentType: "source_contour_derived_display_open_shell_receipt",
    schemaVersion: "0.1.0",
    releaseId: "ohri-native-contour-derived-soma-surface-0.1.0",
    neuronId: 50394,
    authority: NATIVE_CONTOUR_DERIVED_SURFACE_AUTHORITY,
    algorithmId: NATIVE_CONTOUR_DERIVED_SURFACE_ALGORITHM,
    sourceOriginalDat: source.originalDat,
    sourceNativeContourGeometry: source.nativeContourGeometry,
    artifact: {
      path: SURFACE_ARTIFACT_PATH,
      publicPath: `/${SURFACE_ARTIFACT_PATH.replace(/^public\//, "")}`,
      bytes: artifactBytes.byteLength,
      sha256: sha256(artifactBytes),
      payloadSha256: payload.payloadSha256,
      documentType: payload.documentType,
    },
    gates: {
      sourceNativeAdmissionStatus: source.admission.admissionStatus,
      sourceContourObjectCount: payload.sourceReceipts.sourceContourCount,
      sourceVertexCount: payload.sourceReceipts.sourceVertexCount,
      independentParserClassification: "somaContour",
      mbfCellBodyClosureSemantics: true,
      uniqueContiguousPlaneCount: payload.qualityAssurance.uniquePlaneCount,
      selfIntersectingInputContourCount: payload.qualityAssurance.selfIntersectingInputContourCount,
      maximumAdjacentCentroidShiftMicrometre: payload.qualityAssurance.maximumAdjacentCentroidShiftMicrometre,
      maximumAdjacentContourAreaRatio: payload.qualityAssurance.maximumAdjacentContourAreaRatio,
      maximumAdjacentAlignedRmsMicrometre: payload.qualityAssurance.maximumAdjacentAlignedRmsMicrometre,
    },
    geometryCounts: payload.qualityAssurance,
    scopeBoundary: "One NMO 50394 interpolation display derivative only. Original line loops remain OBS and unchanged. The separate DER shell has uncapped ends and does not claim an observed membrane, volume, nucleus, organelle, measurement, same-cell internal structure, cross-source identity or atlas registration.",
  };
  const receiptBytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
  return { artifactBytes, receiptBytes, payload, receipt };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [flag] = process.argv.slice(2);
    if (process.argv.length !== 3 || !["--write", "--check"].includes(flag)) throw new Error("Use --write or --check");
    const built = await buildNativeContourDerivedSomaSurfaceArtifact();
    const artifactPath = path.join(ROOT, SURFACE_ARTIFACT_PATH);
    const receiptPath = path.join(ROOT, SURFACE_RECEIPT_PATH);
    if (flag === "--write") {
      await mkdir(path.dirname(artifactPath), { recursive: true });
      await writeFile(artifactPath, built.artifactBytes);
      await writeFile(receiptPath, built.receiptBytes);
    } else {
      const [artifactBytes, receiptBytes] = await Promise.all([readFile(artifactPath), readFile(receiptPath)]);
      if (!artifactBytes.equals(built.artifactBytes) || !receiptBytes.equals(built.receiptBytes)) throw new Error("NMO 50394 derived surface artifact or receipt is stale");
    }
    console.log(JSON.stringify({ releaseId: built.receipt.releaseId, artifactBytes: built.artifactBytes.byteLength, ...built.payload.qualityAssurance }));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
