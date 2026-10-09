#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { buildNeuromorphoCensusMainSceneIndex01 } from "../tools/build_neuromorpho_census_main_scene_index_0_1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_PATH = path.join(ROOT, "data/neuromorpho-census-main-scene-index-0.1.json");
const SCHEMA_PATH = path.join(ROOT, "schemas/neuromorpho-census-main-scene-index-0.1.schema.json");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateNeuromorphoCensusMainSceneIndex01(override = null) {
  const [built, schema, bytes] = await Promise.all([
    buildNeuromorphoCensusMainSceneIndex01(),
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    override === null ? readFile(CONTRACT_PATH) : null,
  ]);
  const contract = override ?? JSON.parse(bytes.toString("utf8"));
  const validator = new Ajv2020({ allErrors: true, strict: true });
  addFormats(validator);
  const validate = validator.compile(schema);
  if (!validate(contract)) {
    throw new Error(`Main-scene census index schema failed:\n${(validate.errors ?? []).map((error) => `- ${error.instancePath || "/"}: ${error.message}`).join("\n")}`);
  }
  if (JSON.stringify(contract) !== JSON.stringify(built)) throw new Error("Main-scene census index differs from the checksum-pinned source rebuild");
  const expectedBytes = Buffer.from(`${JSON.stringify(built, null, 2)}\n`);
  if (override === null && !bytes.equals(expectedBytes)) throw new Error("Main-scene census index formatting or bytes differ from deterministic build");
  const records = contract.records;
  const ids = records.map((record) => record.neuronId);
  if (new Set(ids).size !== 142 || records.some((record) => record.assetId !== `NeuroMorpho:${record.neuronId}`)) {
    throw new Error("Main-scene census index has duplicate or mismatched stable object identifiers");
  }
  const dimensions = records.reduce((counts, record) => {
    counts[record.geometry.dimensionality] = (counts[record.geometry.dimensionality] ?? 0) + 1;
    return counts;
  }, {});
  if (dimensions["3D"] !== 140 || dimensions["2D"] !== 2
    || contract.summary.sameSpecimenInternalStructureCount !== 0
    || contract.summary.renderedInternalPrimitiveCount !== 0
    || contract.summary.crossSourceIdentityCount !== 0
    || contract.summary.registrationCount !== 0
    || contract.summary.censusExpansionCount !== 0) {
    throw new Error("Main-scene census index dimensionality or scientific boundary changed");
  }
  const secondary = records.reduce((counts, record) => {
    const label = record.sourceMetadata.cellTypeLabels[1] ?? "Not Reported";
    counts[label] = (counts[label] ?? 0) + 1;
    return counts;
  }, {});
  if (secondary.Excitatory !== 125 || secondary.Inhibitory !== 15 || secondary["Not Reported"] !== 2) {
    throw new Error("Main-scene source-label denominators changed");
  }
  return {
    contractId: contract.contractId,
    censusRecordCount: records.length,
    sourceLabelledThreeDimensionalCount: dimensions["3D"],
    sourceLabelledPlanarCount: dimensions["2D"],
    sourceLabelledSecondaryClassCounts: secondary,
    fileBytes: expectedBytes.byteLength,
    fileSha256: sha256(expectedBytes),
    registrationCount: contract.summary.registrationCount,
    internalPrimitiveCount: contract.summary.renderedInternalPrimitiveCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateNeuromorphoCensusMainSceneIndex01()
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
