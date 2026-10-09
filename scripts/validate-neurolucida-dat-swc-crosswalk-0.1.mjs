#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  NMO_45718_DAT_SWC_CROSSWALK_RECEIPTS,
  validateNmo45718DatSwcCrosswalk,
} from "../app/neurolucida-dat-swc-crosswalk.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_PATH = path.join(ROOT, "data/neurolucida-dat-swc-crosswalk-0.1.json");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateNeurolucidaDatSwcCrosswalk() {
  const contractBytes = await readFile(CONTRACT_PATH);
  const contract = JSON.parse(contractBytes.toString("utf8"));
  const receipts = await Promise.all(Object.entries(NMO_45718_DAT_SWC_CROSSWALK_RECEIPTS).map(async ([key, expected]) => {
    const bytes = await readFile(path.join(ROOT, expected.path));
    const actual = contract.receipts?.[key];
    if (bytes.byteLength !== expected.bytes || sha256(bytes) !== expected.sha256
      || actual?.bytes !== bytes.byteLength || actual?.sha256 !== sha256(bytes) || actual?.path !== expected.path) {
      throw new Error(`NMO 45718 ${key} source bytes do not match the pinned crosswalk contract`);
    }
    return [key, bytes];
  }));
  const assets = Object.fromEntries(receipts);
  const contourPayload = JSON.parse(assets.nativeContours.toString("utf8"));
  const geometryPayload = JSON.parse(assets.standardizedGeometry.toString("utf8"));
  const crosswalk = validateNmo45718DatSwcCrosswalk(contract, contourPayload, geometryPayload);
  if (contract.modelFamilyDeclaredBeforeFit !== contract.validation.model
    || contract.displayContract?.reversible !== true
    || contract.displayContract?.changesExistingNativeContourViewer !== false
    || contract.displayContract?.surfaces !== false
    || contract.displayContract?.meshes !== false
    || contract.displayContract?.volumes !== false
    || contract.displayContract?.membranes !== false
    || contract.displayContract?.internalStructures !== false
    || contract.displayContract?.sameSpecimenInternalStructureJoin !== false
    || contract.displayContract?.atlasRegistration !== false
    || contract.displayContract?.representativeCellTypeMorphologyClaim !== false
    || contract.displayContract?.otherRecordTransformReuse !== false
    || crosswalk.somaContours.length !== 7 || crosswalk.correspondence.sourceVertexCount !== 252
    || crosswalk.skeletonSegments.length !== 5635 || crosswalk.excludedContourIds[0] !== "source-native-contour-8"
    || crosswalk.boundaries.atlasRegistrationCount !== 0 || crosswalk.boundaries.meshCount !== 0) {
    throw new Error("NMO 45718 crosswalk scope or fail-closed display boundary changed");
  }
  return {
    contractId: contract.contractId,
    recordId: crosswalk.assetId,
    sourceReceiptsChecked: receipts.length,
    mappedSomaContours: crosswalk.somaContours.length,
    mappedContourVertices: crosswalk.correspondence.sourceVertexCount,
    standardizedSwcSegments: crosswalk.skeletonSegments.length,
    primaryHeldOutMaximumMicrometre: crosswalk.validation.primaryFit.heldOut.maximumMicrometre,
    sensitivityHeldOutMaximumMicrometre: crosswalk.validation.alternatingSensitivity.heldOut.maximumMicrometre,
    properRotationHeldOutMaximumMicrometre: crosswalk.validation.properRotationAlternative.heldOut.maximumMicrometre,
    excludedContourIds: crosswalk.excludedContourIds,
    surfaces: 0,
    internalStructureObjects: 0,
    registrationCount: 0,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateNeurolucidaDatSwcCrosswalk()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
