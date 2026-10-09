#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  buildNmo45718DatSwcCrosswalkAudit,
  NMO_45718_DAT_SWC_CROSSWALK_RECEIPTS,
} from "../app/neurolucida-dat-swc-crosswalk.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_PATH = path.join(ROOT, "data/neurolucida-dat-swc-crosswalk-0.1.json");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function readReceipt(key) {
  const receipt = NMO_45718_DAT_SWC_CROSSWALK_RECEIPTS[key];
  const bytes = await readFile(path.join(ROOT, receipt.path));
  if (bytes.byteLength !== receipt.bytes || sha256(bytes) !== receipt.sha256) {
    throw new Error(`NMO 45718 pinned ${key} source receipt mismatch`);
  }
  return {
    path: receipt.path,
    bytes: bytes.byteLength,
    sha256: sha256(bytes),
    ...(receipt.canonicalGeometrySha256 ? { canonicalGeometrySha256: receipt.canonicalGeometrySha256 } : {}),
  };
}

async function main() {
  const [receipts, contourBytes, geometryBytes] = await Promise.all([
    Promise.all(Object.keys(NMO_45718_DAT_SWC_CROSSWALK_RECEIPTS).map(async (key) => [key, await readReceipt(key)])),
    readFile(path.join(ROOT, NMO_45718_DAT_SWC_CROSSWALK_RECEIPTS.nativeContours.path)),
    readFile(path.join(ROOT, NMO_45718_DAT_SWC_CROSSWALK_RECEIPTS.standardizedGeometry.path)),
  ]);
  const contourPayload = JSON.parse(contourBytes.toString("utf8"));
  const geometryPayload = JSON.parse(geometryBytes.toString("utf8"));
  const audit = buildNmo45718DatSwcCrosswalkAudit(contourPayload, geometryPayload);
  const contract = {
    schemaVersion: "0.1.0",
    contractId: "neurolucida-dat-swc-coordinate-crosswalk-0.1",
    releaseId: "ohri-neurolucida-dat-swc-crosswalk-0.1.0",
    createdFor: "one-record research visualization; not a general coordinate registration",
    record: {
      repository: "NeuroMorpho.Org",
      repositoryRelease: "8.6.124",
      neuronId: 45718,
      assetId: "NeuroMorpho:45718",
      recordUrl: "https://neuromorpho.org/api/neuron/id/45718",
    },
    sourceFrames: {
      nativeDat: "Neurolucida_DAT_source_native_unregistered",
      standardizedSwc: "NeuroMorpho_CNG_standardized_local_frame",
      relation: "project-derived same-record frame crosswalk; no atlas registration",
    },
    receipts: Object.fromEntries(receipts),
    modelFamilyDeclaredBeforeFit: "2D reflection + rotation + uniform scale + translation; independent z translation",
    correspondence: audit.correspondence,
    transform: audit.transform,
    validation: audit.validation,
    displayContract: {
      authorizedPrimitives: ["exact type-labelled standardized SWC line segments", "seven transformed source-closed Soma 1 line loops"],
      nativeContourIdsDisplayed: audit.correspondence.sourceContourIds,
      excludedNativeContourIds: ["source-native-contour-8"],
      excludedContourReason: "The source-open legacy Cell Body object is not part of the seven-plane Soma 1 correspondence and remains visible only in the separate native-DAT contour view.",
      displayFrame: "NeuroMorpho_CNG_standardized_local_frame",
      reversible: true,
      changesExistingNativeContourViewer: false,
      surfaces: false,
      meshes: false,
      volumes: false,
      membranes: false,
      internalStructures: false,
      biologicalMeasurements: false,
      sameSpecimenInternalStructureJoin: false,
      atlasRegistration: false,
      representativeCellTypeMorphologyClaim: false,
      otherRecordTransformReuse: false,
    },
    references: [
      { label: "NeuroMorpho.Org record", url: "https://neuromorpho.org/api/neuron/id/45718" },
      { label: "Original Neurolucida DAT", url: "https://neuromorpho.org/dableFiles/bannatyne/Source-Version/101026p1-A-In.dat" },
      { label: "Standardized CNG SWC", url: "https://neuromorpho.org/dableFiles/bannatyne/CNG%20version/101026p1-A-In.CNG.swc" },
      { label: "NeuroMorpho Soma Format and contour standardization", url: "https://www.neuromorpho.org/SomaFormat.html" },
      { label: "NeuroMorpho FAQ on SWC coordinate standardization", url: "https://neuromorpho.org/myfaq.jsp" },
    ],
  };
  await writeFile(OUTPUT_PATH, `${JSON.stringify(contract, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ output: path.relative(ROOT, OUTPUT_PATH), recordId: contract.record.assetId, somaContourCount: contract.correspondence.sourceContourIds.length, primaryHeldOutMaxMicrometre: contract.validation.primaryFit.heldOut.maximumMicrometre, sensitivityHeldOutMaxMicrometre: contract.validation.alternatingSensitivity.heldOut.maximumMicrometre })}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
