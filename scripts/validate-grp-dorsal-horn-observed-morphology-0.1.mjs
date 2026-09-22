#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const CONTRACT_URL = new URL("../data/grp-dorsal-horn-observed-morphology-0.1.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/grp-dorsal-horn-observed-morphology-0.1.schema.json", import.meta.url);
const PUBLIC_DATA_ROOT = new URL("../public/data/", import.meta.url);

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function sourceUrl(path) {
  return new URL(path.replace(/^\/data\//, ""), PUBLIC_DATA_ROOT);
}

export async function validateGrpDorsalHornObservedMorphology(contractOverride = null) {
  const [contract, schema] = await Promise.all([
    contractOverride ?? readFile(CONTRACT_URL, "utf8").then(JSON.parse),
    readFile(SCHEMA_URL, "utf8").then(JSON.parse),
  ]);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(contract)) {
    throw new Error(`GRP morphology schema validation failed:\n${(validate.errors ?? []).map((error) => `- ${error.instancePath || "/"}: ${error.message}`).join("\n")}`);
  }

  const errors = [];
  const receipts = Object.values(contract.sourceObjects);
  const sourceBytes = await Promise.all(receipts.map((receipt) => readFile(sourceUrl(receipt.path))));
  receipts.forEach((receipt, index) => {
    check(sourceBytes[index].byteLength === receipt.bytes, `${receipt.path} byte count drifted`, errors);
    check(digest(sourceBytes[index]) === receipt.sha256, `${receipt.path} SHA-256 drifted`, errors);
  });

  const census = JSON.parse(sourceBytes[0].toString("utf8"));
  const analysis = JSON.parse(sourceBytes[1].toString("utf8"));
  const geometry = JSON.parse(sourceBytes[2].toString("utf8"));
  const indexed = census.records.find((record) => record.neuronId === 109021);
  const analyzed = analysis.records.find((record) => record.neuronId === 109021);
  check(Boolean(indexed), "NeuroMorpho 109021 is absent from the pinned census", errors);
  check(Boolean(analyzed), "NeuroMorpho 109021 is absent from the pinned analysis", errors);
  if (indexed && analyzed) {
    check(indexed.geometry.sha256 === contract.sourceObjects.geometry.sha256, "census geometry receipt drifted", errors);
    check(indexed.geometry.rawSwcSha256 === contract.sourceObjects.swc.sha256, "census SWC receipt drifted", errors);
    check(indexed.morphometrics.computed.canonicalGeometrySha256 === contract.sourceObjects.geometry.canonicalGeometrySha256, "canonical geometry receipt drifted", errors);
    check(indexed.morphometrics.computed.topologySha256 === contract.sourceObjects.geometry.topologySha256, "topology receipt drifted", errors);
    check(indexed.normalizedMetadata.physicalIntegrity === contract.sourceRecord.physicalIntegrity, "physical-integrity metadata drifted", errors);
    check(indexed.officialMetadata.slicing_thickness === String(contract.sourceRecord.slicingThicknessMicrometre), "slice thickness drifted", errors);
    check(indexed.morphometrics.computed.nodeCount === contract.geometryReceipt.nodeCount, "node count drifted", errors);
    check(indexed.morphometrics.computed.segmentCount === contract.geometryReceipt.segmentCount, "segment count drifted", errors);
    check(JSON.stringify(indexed.morphometrics.computed.nodeTypeCounts) === JSON.stringify(contract.geometryReceipt.nodeTypeCounts), "node type counts drifted", errors);
    check(analyzed.metrics.neuriteCableLengthMicrometre === contract.sourceLocalMorphometrics.neuriteCableLengthMicrometre, "neurite cable length drifted", errors);
    check(analyzed.metrics.bifurcationNodeCount === contract.sourceLocalMorphometrics.bifurcationNodeCount, "bifurcation count drifted", errors);
    check(analyzed.metrics.terminalNodeCount === contract.sourceLocalMorphometrics.terminalNodeCount, "terminal count drifted", errors);
  }
  check(geometry.neuronId === 109021, "geometry payload identity drifted", errors);
  check(geometry.nodes.length === 2790 && geometry.segments.length === 2789, "geometry payload counts drifted", errors);
  check(geometry.registration?.status === "unregistered", "geometry unexpectedly gained a registration", errors);
  check(contract.renderingContract.sameSpecimenInternalStructure.renderedPrimitiveCount === 0, "missing internal structure must produce zero primitives", errors);
  check(contract.identityBoundary.crossSourceIdentityCount === 0, "route unexpectedly creates a cross-source identity", errors);
  check(contract.identityBoundary.projectRegistrationCount === 0, "route unexpectedly creates a project registration", errors);
  check(contract.hardBoundaries.some((boundary) => /12 original soma contours.*averaged into 12 standardized source-type-1 soma points.*not original contour vertices/i.test(boundary)), "soma-node boundary is missing", errors);
  check(contract.hardBoundaries.some((boundary) => /300 micrometre.*truncation-aware/i.test(boundary)), "slice-truncation boundary is missing", errors);

  if (errors.length) throw new Error(`GRP dorsal-horn observed morphology validation failed:\n- ${errors.join("\n- ")}`);
  return {
    releaseId: contract.releaseId,
    routeId: contract.routeId,
    neuronId: contract.sourceRecord.neuronId,
    nodeCount: contract.geometryReceipt.nodeCount,
    segmentCount: contract.geometryReceipt.segmentCount,
    internalPrimitiveCount: contract.renderingContract.sameSpecimenInternalStructure.renderedPrimitiveCount,
    crossSourceIdentityCount: contract.identityBoundary.crossSourceIdentityCount,
    projectRegistrationCount: contract.identityBoundary.projectRegistrationCount,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file://${process.argv[1]}`))) {
  validateGrpDorsalHornObservedMorphology()
    .then((report) => {
      process.stdout.write(`GRP dorsal-horn morphology valid: NMO ${report.neuronId}, ${report.nodeCount} nodes, ${report.segmentCount} edges, ${report.internalPrimitiveCount} internal primitives, ${report.projectRegistrationCount} REG.\n`);
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
