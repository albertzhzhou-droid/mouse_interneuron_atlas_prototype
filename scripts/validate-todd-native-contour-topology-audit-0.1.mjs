#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { fileURLToPath } from "node:url";
import { buildToddNativeContourTopologyAudit, stableJson } from "../tools/audit_todd_native_contour_topology_0_1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const AUDIT_PATH = "data/todd-native-contour-topology-audit-0.1.json";
export const SCHEMA_PATH = "schemas/todd-native-contour-topology-audit-0.1.schema.json";

function check(condition, message) {
  if (!condition) throw new Error(message);
}

export function validateToddNativeContourTopologyAudit(audit, schema, expected) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  check(validate(audit), `Todd contour-topology schema violation: ${validate.errors?.map((item) => `${item.instancePath || "/"} ${item.message}`).join("; ")}`);
  check(stableJson(audit) === stableJson(expected), "Todd contour-topology audit differs from checksum-gated source recomputation");
  check(audit.referenceScreen.independentlyValidatedAsBiologicalTolerances === false
    && audit.method.sourcePolylineModification === false
    && audit.method.sourcePointRepair === false
    && audit.method.smoothing === false
    && audit.method.interpolationGeometryGenerated === false, "Exploratory transition screen must not be presented as a biological tolerance or generated surface");
  const nmo50424 = audit.records.find((record) => record.neuronId === 50424);
  const nmo50408 = audit.records.find((record) => record.neuronId === 50408);
  check(nmo50424?.summary.contourCount === 8
    && nmo50424.summary.vertexCount === 427
    && nmo50424.summary.adjacentTransitionCount === 7
    && nmo50424.summary.adjacentTransitionsWithinReferenceScreen === 5
    && nmo50424.summary.adjacentTransitionsHeld === 2
    && nmo50424.summary.selfIntersectionCount === 0, "NMO 50424 source order, contour denominator, or transition result changed");
  check(nmo50408?.summary.contourCount === 11
    && nmo50408.summary.vertexCount === 709
    && nmo50408.summary.selfIntersectionCount === 2
    && nmo50408.summary.zeroLengthEdgeCount === 1
    && nmo50408.summary.adjacentTransitionsWithinReferenceScreen === 4
    && nmo50408.summary.adjacentTransitionsHeld === 6, "NMO 50408 source topology or transition result changed");
  check(audit.summary.sourceContourCount === 19
    && audit.summary.sourceVertexCount === 1136
    && audit.summary.selfIntersectionCount === 2
    && audit.summary.zeroLengthEdgeCount === 1
    && audit.summary.adjacentTransitionCount === 17
    && audit.summary.adjacentTransitionsHeld === 8
    && audit.summary.contourDerivedSurfaceAdmittedCount === 0
    && audit.summary.admittedTriangleCount === 0
    && audit.summary.internalStructureObjectCount === 0
    && audit.summary.sameCellJoinCount === 0
    && audit.summary.crossSourceIdentityCount === 0
    && audit.summary.registrationCount === 0, "Todd audit scope or zero-render admission boundary changed");
  return {
    releaseId: audit.releaseId,
    auditedRecordCount: audit.summary.auditedRecordCount,
    contourCount: audit.summary.sourceContourCount,
    vertexCount: audit.summary.sourceVertexCount,
    selfIntersectionCount: audit.summary.selfIntersectionCount,
    zeroLengthEdgeCount: audit.summary.zeroLengthEdgeCount,
    adjacentTransitionCount: audit.summary.adjacentTransitionCount,
    transitionsWithinExploratoryScreen: audit.summary.adjacentTransitionsWithinReferenceScreen,
    transitionsHeld: audit.summary.adjacentTransitionsHeld,
    contourDerivedSurfaceAdmittedCount: audit.summary.contourDerivedSurfaceAdmittedCount,
  };
}

export async function loadAndValidateToddNativeContourTopologyAudit() {
  const [audit, schema, expected] = await Promise.all([
    readFile(path.join(ROOT, AUDIT_PATH), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, SCHEMA_PATH), "utf8").then(JSON.parse),
    buildToddNativeContourTopologyAudit(),
  ]);
  const summary = validateToddNativeContourTopologyAudit(audit, schema, expected);
  check(await readFile(path.join(ROOT, AUDIT_PATH), "utf8") === stableJson(expected), `${AUDIT_PATH} is stale; run its builder with --write`);
  return { audit, summary };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  loadAndValidateToddNativeContourTopologyAudit()
    .then(({ summary }) => process.stdout.write(`${JSON.stringify(summary)}\n`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
