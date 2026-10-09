#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUDIT_PATH = path.join(ROOT, "data/banc-v888-internal-object-source-audit-0.1.json");

export async function validateBancV888InternalObjectSourceAudit() {
  const [audit, previousCandidate, panel, queue] = await Promise.all([
    readFile(AUDIT_PATH, "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "data/banc-v888-candidate-audit-0.1.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "app/InternalStructureReferencePanel.tsx"), "utf8"),
    readFile(path.join(ROOT, "docs/RESEARCH_MODEL_UPGRADE_QUEUE.md"), "utf8"),
  ]);
  const candidate = audit.candidate;
  const nucleus = audit.sources.nucleusBoundary;
  const mito = audit.sources.mitochondriaAnnotations;
  const mitoMesh = audit.sources.mitochondriaSegmentation;
  const synapses = audit.sources.synapses;

  if (audit.auditId !== "banc-v888-internal-object-source-audit-0.1.0"
    || audit.authority !== "OPEN_SOURCE_ROUTE_AND_ADMISSION_AUDIT"
    || audit.relationshipToMouseAtlas !== "comparative_reference_only"
    || candidate.rootId !== previousCandidate.candidate.rootId
    || candidate.nucleusId !== previousCandidate.candidate.nucleusId
    || candidate.sourceRootAndNucleusJoinVerified !== true) {
    throw new Error("BANC candidate identity or audit authority changed");
  }
  if (nucleus.publicAccessRouteDocumented !== true
    || nucleus.function !== "banc_read_nuclei_mesh"
    || !nucleus.cloudVolumePrefix.endsWith("/nuclei/seg_v1")
    || nucleus.candidateNucleusId !== candidate.nucleusId
    || nucleus.exactMeshPayloadFetched !== false
    || nucleus.payloadBytes !== null
    || nucleus.payloadSha256 !== null
    || nucleus.materializationV888BindingVerified !== false
    || nucleus.objectReuseTermsVerified !== false
    || nucleus.admitted !== false) throw new Error("Nucleus mesh must remain a documented but unverified candidate route");
  if (mito.publicDataverseFile.fileId !== previousCandidate.objectReceipts.mitochondria.sourceFileId
    || mito.publicDataverseFile.bytes !== previousCandidate.objectReceipts.mitochondria.bytes
    || mito.publicDataverseFile.md5 !== previousCandidate.objectReceipts.mitochondria.md5
    || mito.publicDataverseFile.releaseLicense !== "CC BY 4.0"
    || mito.publicDataverseFile.candidateRowsRetrieved !== false
    || mito.rootFilteredQueryDocumented !== true
    || mito.rootFilterField !== "pt_root_id"
    || mito.configuredCaveClientRequiresRegisteredToken !== true
    || mito.credentialsInspectedOrUsed !== false
    || mito.queryExecuted !== false
    || mito.separateSegmentationProductSourceMapStatus !== "MISSING"
    || mito.admittedPoints !== 0
    || mito.admittedSurfaces !== 0) throw new Error("Mitochondria source/query boundary changed");
  if (mitoMesh.publicRouteDocumentedInClient !== true
    || mitoMesh.routeVersionLinkedToBancV888 !== false
    || mitoMesh.candidateObjectIdsVerified !== false
    || mitoMesh.exactPayloadFetched !== false
    || mitoMesh.objectReuseTermsVerified !== false
    || mitoMesh.admittedSurfaces !== 0) throw new Error("Mitochondria mesh candidate must remain unadmitted");
  if (synapses.publicRawVersionsListed.join(",") !== "v2,v3"
    || synapses.paperVersion !== "v2"
    || synapses.v3Status !== "in_testing"
    || synapses.v2File.bytes !== previousCandidate.objectReceipts.synapses.bytes
    || synapses.v2File.md5 !== previousCandidate.objectReceipts.synapses.md5
    || synapses.v2File.coordinateUnits !== "nanometres"
    || synapses.v3CoordinateFrame.voxelResolutionNanometres.join(",") !== "16,16,45"
    || synapses.sourceRowsCarryPreAndPostRootIds !== true
    || synapses.boundedCandidateQueryRoutePinned !== false
    || synapses.candidateRowsRetrieved !== false
    || synapses.payloadDownloaded !== false
    || synapses.stableObjectIdsAndCoordinatesVerified !== false
    || synapses.admittedSynapseObjects !== 0) throw new Error("Synapse release/coordinate/admission boundary changed");
  if (Object.values(audit.actions).some((value) => value !== false)
    || Object.values(audit.admission).some((value) => value !== 0)) throw new Error("Audit must remain read-only with zero new geometry, joins, registration, and measurement");
  if (!queue.includes("UPG-249 | P0 | partially completed — public data products and exact-object access routes verified")) {
    throw new Error("UPG-249 queue state must reflect route discovery without implying object admission");
  }
  if (!panel.includes("bancV888InternalObjectSourceAudit")
    || !panel.includes("public source routes found; no new internal objects admitted")
    || !panel.includes("no token was inspected or used")) throw new Error("BANC availability panel is not sourced from the route audit or omits its boundary");

  return {
    auditId: audit.auditId,
    candidateRootId: candidate.rootId,
    candidateNucleusId: candidate.nucleusId,
    nucleusRouteDocumented: nucleus.publicAccessRouteDocumented,
    nucleusMeshAdmitted: nucleus.admitted,
    mitochondriaArchiveBytes: mito.publicDataverseFile.bytes,
    mitochondriaRowsRetrieved: mito.publicDataverseFile.candidateRowsRetrieved,
    synapseVersions: synapses.publicRawVersionsListed,
    synapseObjectsAdmitted: synapses.admittedSynapseObjects,
    privateCredentialsInspected: audit.actions.privateCredentialsInspected,
    admittedGeometryCount: Object.values(audit.admission).reduce((sum, count) => sum + count, 0),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateBancV888InternalObjectSourceAudit()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
