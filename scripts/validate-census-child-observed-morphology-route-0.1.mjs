#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { buildCensusChildObservedMorphologyRoute01 } from "../tools/build_census_child_observed_morphology_route_0_1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_PATH = path.join(ROOT, "data/census-child-observed-morphology-route-0.1.json");
const SCHEMA_PATH = path.join(ROOT, "schemas/census-child-observed-morphology-route-0.1.schema.json");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

function sourcePath(receipt) {
  if (receipt.path.startsWith("/data/")) return path.join(ROOT, "public/data", receipt.path.slice("/data/".length));
  if (path.isAbsolute(receipt.path) || receipt.path.split("/").includes("..")) throw new Error(`Unsafe project source path: ${receipt.path}`);
  return path.join(ROOT, receipt.path);
}

async function verifyReceipt(receipt, label, errors) {
  const bytes = await readFile(sourcePath(receipt));
  check(bytes.byteLength === receipt.bytes, `${label} byte count drifted`, errors);
  check(sha256(bytes) === receipt.sha256, `${label} SHA-256 drifted`, errors);
  return bytes;
}

export async function validateCensusChildObservedMorphologyRoute01(contractOverride = null) {
  const [contractBytes, schema, built] = await Promise.all([
    contractOverride === null ? readFile(CONTRACT_PATH) : null,
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    buildCensusChildObservedMorphologyRoute01(),
  ]);
  const contract = contractOverride ?? JSON.parse(contractBytes.toString("utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(contract)) {
    throw new Error(`NMO 108978 route schema validation failed:\n${(validate.errors ?? []).map((error) => `- ${error.instancePath || "/"}: ${error.message}`).join("\n")}`);
  }

  const errors = [];
  const route = contract.route;
  check(contract.releaseId === "ohri-census-child-observed-morphology-route-0.1.0", "route release identity drifted", errors);
  check(contract.summary.routeCount === 1 && route.routeId === "mouse.sc.tac1_sp_dorsal_horn.observed.nmo_108978", "route identity or count drifted", errors);
  check(route.sourceRecord.neuronId === 108978 && route.sourceRecord.assetId === "NeuroMorpho:108978" && route.sourceRecord.neuronName === "cell-4_16", "exact repository identity drifted", errors);
  check(route.censusMembership === true && route.frozenLensMembership === false, "census membership was conflated with the frozen five-record lens", errors);
  check(contract.runtimeMergePolicy.censusRecordCount === 142 && contract.runtimeMergePolicy.censusContribution === 0 && contract.runtimeMergePolicy.censusExpansionCount === 0, "route expanded the frozen census denominator", errors);
  check(contract.dorsalHornRouteSet.routeCount === 5
    && contract.dorsalHornRouteSet.censusRecordCount === 142
    && contract.dorsalHornRouteSet.censusMemberCount === 3
    && contract.dorsalHornRouteSet.frozenLensOverlapCount === 2
    && contract.dorsalHornRouteSet.supplementaryRecordCount === 2
    && contract.dorsalHornRouteSet.censusExpansionCount === 0, "composed dorsal-horn route roster or non-additive census counts drifted", errors);
  check(route.sourceRecord.numericAge.value === null && route.sourceRecord.numericAge.missingReason === "official_repository_metadata_reports_Not Reported", "unreported numeric age was filled or lost", errors);
  check(route.observedCellFormRecord.phenotype === "Substance P-expressing excitatory interneuron", "route phenotype wording drifted", errors);
  check(route.observedCellFormRecord.segmentCount === 1816 && route.fidelityRecord.geometry.nodeCount === 1817 && route.fidelityRecord.geometry.segmentCount === 1816, "source morphology topology counts drifted", errors);
  check(route.geometryReceipt.nodeTypeCounts["1"] === 12 && route.geometryReceipt.nodeTypeCounts["3"] === 1805 && !("2" in route.geometryReceipt.nodeTypeCounts), "source SWC compartment counts drifted", errors);
  check(route.fidelityRecord.axon.sourceType2NodeCount === 0 && route.fidelityRecord.axon.completeAxon === false, "unreconstructed axon gained authority", errors);
  check(route.fidelityRecord.geometry.sourceDiameterAvailable === true && route.fidelityRecord.modes.radiusSurface.available === true, "source-authorized radius evidence was lost", errors);
  check(route.renderingContract.nativeSomaContours.lineLoopCount === 12 && route.renderingContract.nativeSomaContours.vertexCount === 2614, "native soma trace detail counts drifted", errors);
  check(route.somaContourReceipt.originalContourCount === 12 && route.somaContourReceipt.standardizedSomaPointCount === 12 && route.somaContourReceipt.correspondenceToStandardizedSomaPoints === "not_established", "native contour and SWC soma-count boundary drifted", errors);
  check(route.nativeDatContract.rawSourceClosedFlag === false && route.nativeDatContract.semanticObjectCountAdmitted === 12, "file-specific source contour admission drifted", errors);
  check(route.nativeDatContract.coordinateTransformToStandardizedSwcStatus === "not_established" && route.nativeDatContract.overlayWithStandardizedSwcAllowed === false, "DAT-to-SWC frame boundary drifted", errors);
  check(route.renderingContract.sameSpecimenInternalStructure.available === false && route.renderingContract.sameSpecimenInternalStructure.renderedPrimitiveCount === 0, "missing internal structures gained rendered primitives", errors);
  check(route.identityBoundary.individualMolecularAssayClaim === false && route.identityBoundary.selectedSciEntityRelationship === "none" && route.identityBoundary.molecularProfileRelationship === "none", "source annotations were promoted to molecular identity", errors);
  check(route.identityBoundary.crossSourceIdentityCount === 0 && route.identityBoundary.projectRegistrationCount === 0, "route gained an identity join or registration", errors);
  check(contract.summary.nativeSomaLineLoopCount === 12 && contract.summary.nativeSomaLineLoopVertexCount === 2614 && contract.summary.renderedInternalPrimitiveCount === 0, "release summary drifted", errors);
  check(route.repositoryReportedMorphometry.surface.value === 1733.93 && route.repositoryReportedMorphometry.volume.value === 270.255, "repository-reported metric values drifted", errors);
  check(contract.contractBoundaries.some((boundary) => /surface and volume values remain source-reported summaries; this project derives no mesh or biological measurement/i.test(boundary)), "source-reported morphometry boundary is missing", errors);
  check(route.hardBoundaries.some((boundary) => /cohort-level radial-cell interpretation.*not promoted/i.test(boundary)), "cohort-to-record subtype boundary is missing", errors);

  const receipts = Object.entries(route.sourceObjects);
  await Promise.all(receipts.map(([label, receipt]) => verifyReceipt(receipt, label, errors)));
  const parentRoutePackBytes = await verifyReceipt(contract.dorsalHornRouteSet.parentRoutePack, "dorsal-horn route-pack parent", errors);
  const parentRoutePack = JSON.parse(parentRoutePackBytes.toString("utf8"));
  const expectedRouteMembers = [
    ...parentRoutePack.routes.map((parentRoute) => ({
      routeId: parentRoute.routeId,
      assetId: parentRoute.sourceRecord.assetId,
      censusMembership: parentRoute.censusMembership,
      frozenLensMembership: parentRoute.censusMembership,
    })),
    {
      routeId: route.routeId,
      assetId: route.sourceRecord.assetId,
      censusMembership: true,
      frozenLensMembership: false,
    },
  ];
  check(JSON.stringify(contract.dorsalHornRouteSet.members) === JSON.stringify(expectedRouteMembers), "composed dorsal-horn route member roster drifted", errors);
  check(parentRoutePack.routes.length === 4 && parentRoutePack.releaseId === "ohri-dorsal-horn-observed-morphology-route-pack-0.1.0", "dorsal-horn route-pack parent identity changed", errors);
  const census = JSON.parse((await readFile(sourcePath(route.sourceObjects.censusIndex))).toString("utf8"));
  const frozenLens = JSON.parse((await readFile(path.join(ROOT, "data/observed-cell-form-lens-0.1.json"))).toString("utf8"));
  check(census.summary.queryRecordCount === 142 && census.records.some((record) => record.neuronId === 108978), "route is not a member of the exact 142-record census", errors);
  check(!frozenLens.records.some((record) => record.neuronId === 108978), "new route was inserted into the frozen five-record lens", errors);

  if (contractOverride === null) check(contractBytes.equals(built.bytes), "committed route contract differs from deterministic builder output", errors);
  else check(Buffer.from(`${JSON.stringify(contract, null, 2)}\n`).equals(built.bytes), "route contract differs from deterministic builder output", errors);
  if (errors.length) throw new Error(`NMO 108978 route validation failed:\n- ${errors.join("\n- ")}`);
  return {
    releaseId: contract.releaseId,
    routeId: route.routeId,
    inExistingCensus: true,
    censusRecordCount: census.summary.queryRecordCount,
    mainSceneMorphologyIncrement: contract.summary.routeCount,
    nativeSomaLineLoopCount: contract.summary.nativeSomaLineLoopCount,
    nativeSomaLineLoopVertexCount: contract.summary.nativeSomaLineLoopVertexCount,
    dorsalHornRouteCount: contract.dorsalHornRouteSet.routeCount,
    dorsalHornCensusMemberCount: contract.dorsalHornRouteSet.censusMemberCount,
    internalPrimitiveCount: contract.summary.renderedInternalPrimitiveCount,
    crossSourceIdentityCount: contract.summary.crossSourceIdentityCount,
    projectRegistrationCount: contract.summary.projectRegistrationCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateCensusChildObservedMorphologyRoute01()
    .then((report) => process.stdout.write(`NMO 108978 census-child route valid: ${report.censusRecordCount} census rows unchanged, +${report.mainSceneMorphologyIncrement} active morphology route, ${report.nativeSomaLineLoopCount} native loops / ${report.nativeSomaLineLoopVertexCount} vertices, ${report.internalPrimitiveCount} internal primitives, ${report.crossSourceIdentityCount} cross-source identities, ${report.projectRegistrationCount} REG.\n`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
