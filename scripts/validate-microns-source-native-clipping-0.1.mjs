#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_PATH = path.join(PROJECT_ROOT, "data/microns-source-native-clipping-0.1.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/microns-source-native-clipping-0.1.schema.json");
const SOURCE_CONTRACT_PATH = path.join(PROJECT_ROOT, "data/microns-observed-cell-nucleus-reference-0.1.json");
const ASSET_MANIFEST_PATH = path.join(PROJECT_ROOT, "public/data/microns_phase1_v185_4_root_648518346349516051_v1/asset-manifest.json");

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

function projectAssetPath(publicPath) {
  if (typeof publicPath !== "string" || !publicPath.startsWith("/data/")) {
    throw new Error(`asset path must start with /data/: ${String(publicPath)}`);
  }
  return path.join(PROJECT_ROOT, "public", publicPath);
}

function float32Bounds(bytes) {
  if (bytes.byteLength % 12 !== 0) throw new Error("position byte stream is not float32 xyz triplets");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const minimum = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
  const maximum = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
  for (let offset = 0; offset < bytes.byteLength; offset += 12) {
    for (let axis = 0; axis < 3; axis += 1) {
      const value = view.getFloat32(offset + axis * 4, true);
      if (!Number.isFinite(value)) throw new Error("position byte stream contains a non-finite coordinate");
      minimum[axis] = Math.min(minimum[axis], value);
      maximum[axis] = Math.max(maximum[axis], value);
    }
  }
  return { minimum, maximum, vertexCount: bytes.byteLength / 12 };
}

export async function validateMicronsSourceNativeClipping(contractOverride = null) {
  const [contractBytes, schema, sourceContract, assetManifest] = await Promise.all([
    readFile(CONTRACT_PATH),
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    readFile(SOURCE_CONTRACT_PATH, "utf8").then(JSON.parse),
    readFile(ASSET_MANIFEST_PATH, "utf8").then(JSON.parse),
  ]);
  const contract = contractOverride ?? JSON.parse(contractBytes.toString("utf8"));
  const errors = [];
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validateSchema = ajv.compile(schema);
  if (!validateSchema(contract)) {
    errors.push(...(validateSchema.errors ?? []).map((error) => `schema ${error.instancePath || "/"}: ${error.message}`));
  }

  check(contract.sourceReference?.contractId === sourceContract.contractId, "source contract ID drifted", errors);
  check(contract.sourceReference?.releaseId === sourceContract.releaseId, "source release ID drifted", errors);
  check(contract.sourceReference?.cellRootId === sourceContract.identityChain.cellRootId, "cell root ID drifted", errors);
  check(contract.sourceReference?.linkedNucleusId === sourceContract.identityChain.somaValenceTable.nucleusId, "linked nucleus ID drifted", errors);
  check(contract.sourceReference?.nativeFrame === sourceContract.coordinateContract.nativeFrame, "native frame drifted", errors);
  check(contract.sourceReference?.nativeUnits === sourceContract.coordinateContract.nativeUnits, "native units drifted", errors);
  check(same(contract.clippingOperation?.somaCentreNanometre, sourceContract.identityChain.somaValenceTable.somaCentreNanometre), "soma-centre receipt drifted", errors);
  check(contract.sourceReference?.displayTransformCanonicalJsonSha256 === sourceContract.coordinateContract.displayTransformReceipt.canonicalJsonSha256, "display-transform receipt drifted", errors);

  const sourceManifestReceipt = sourceContract.assetBundle.manifest;
  check(same(contract.sourceReference?.assetManifest, sourceManifestReceipt), "asset-manifest receipt drifted", errors);
  const assetManifestBytes = await readFile(ASSET_MANIFEST_PATH);
  check(assetManifestBytes.byteLength === sourceManifestReceipt.bytes && sha256(assetManifestBytes) === sourceManifestReceipt.sha256, "asset-manifest bytes do not match the source contract", errors);

  const axisNames = ["x", "y", "z"];
  for (const componentName of ["cell", "nucleus"]) {
    const sourceComponent = assetManifest.components.find((component) => component.componentName === componentName);
    const receipt = contract.unchangedGeometryReceipts?.[componentName];
    check(Boolean(sourceComponent), `${componentName} is missing from the source asset manifest`, errors);
    if (!sourceComponent || !receipt) continue;
    check(receipt.objectId === sourceComponent.objectId, `${componentName} object ID drifted`, errors);
    check(receipt.vertexCount === sourceComponent.browserGeometry.vertexCount, `${componentName} vertex count drifted`, errors);
    check(receipt.triangleCount === sourceComponent.browserGeometry.triangleCount, `${componentName} triangle count drifted`, errors);
    check(same(receipt.positions, {
      path: sourceComponent.browserGeometry.positions.path,
      bytes: sourceComponent.browserGeometry.positions.bytes,
      sha256: sourceComponent.browserGeometry.positions.sha256,
    }), `${componentName} position receipt drifted`, errors);
    check(same(receipt.triangles, {
      path: sourceComponent.browserGeometry.triangles.path,
      bytes: sourceComponent.browserGeometry.triangles.bytes,
      sha256: sourceComponent.browserGeometry.triangles.sha256,
    }), `${componentName} triangle receipt drifted`, errors);
    for (const stream of [receipt.positions, receipt.triangles]) {
      const bytes = await readFile(projectAssetPath(stream.path));
      check(bytes.byteLength === stream.bytes && sha256(bytes) === stream.sha256, `${componentName} ${path.basename(stream.path)} byte receipt drifted`, errors);
    }
    if (componentName === "cell") {
      const positionBytes = await readFile(projectAssetPath(receipt.positions.path));
      const derived = float32Bounds(positionBytes);
      check(derived.vertexCount === receipt.vertexCount, "cell position stream vertex count drifted", errors);
      axisNames.forEach((axis, index) => {
        const expected = contract.clippingOperation?.boundsNanometre?.[axis];
        check(expected?.minimum === derived.minimum[index] && expected?.maximum === derived.maximum[index], `${axis}-axis clipping bounds do not match exact source positions`, errors);
        const soma = contract.clippingOperation?.somaCentreNanometre?.[index];
        check(soma >= derived.minimum[index] && soma <= derived.maximum[index], `${axis}-axis soma centre is outside the exact cell bounds`, errors);
      });
    }
  }

  const defaultState = contract.clippingOperation?.defaultState;
  check(defaultState?.enabled === false && defaultState?.axis === "z" && defaultState?.positionNanometre === 80240 && defaultState?.keepSide === "positive", "default source-native clipping state drifted", errors);
  check(contract.clippingOperation?.renderTarget === "cell_segmentation_surface_only", "clipping target must remain cell-only", errors);
  const policy = contract.claimPolicy ?? {};
  check(policy.cellClippingPlaneCountWhenEnabled === 1 && policy.nucleusClippingPlaneCount === 0, "cell-only clipping-plane policy drifted", errors);
  for (const field of ["capPrimitiveCount", "repairCount", "resamplingCount", "generatedGeometryCount", "geometryMutationCount", "joinCount", "registrationCount"]) {
    check(policy[field] === 0, `${field} must remain zero`, errors);
  }
  for (const field of ["measurementClaim", "membraneClaim", "spinalInternalStructureClaim"]) {
    check(policy[field] === false, `${field} must remain false`, errors);
  }

  if (errors.length) throw new Error(`MICrONS source-native clipping validation failed:\n- ${errors.join("\n- ")}`);
  return {
    releaseId: contract.releaseId,
    cellRootId: contract.sourceReference.cellRootId,
    linkedNucleusId: contract.sourceReference.linkedNucleusId,
    axisCount: 3,
    cellVertexCount: contract.unchangedGeometryReceipts.cell.vertexCount,
    nucleusVertexCount: contract.unchangedGeometryReceipts.nucleus.vertexCount,
    cellClippingPlaneCountWhenEnabled: 1,
    nucleusClippingPlaneCount: 0,
    generatedGeometryCount: 0,
    joinCount: 0,
    registrationCount: 0,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateMicronsSourceNativeClipping()
    .then((summary) => console.log(JSON.stringify(summary, null, 2)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
