#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUDIT_PATH = path.join(ROOT, "data/banc-v888-candidate-audit-0.1.json");

export async function validateBancV888CandidateAudit() {
  const audit = JSON.parse(await readFile(AUDIT_PATH, "utf8"));
  const [atlasTypes, panel, scene, queue] = await Promise.all([
    readFile(path.join(ROOT, "app/atlas-types.ts"), "utf8"),
    readFile(path.join(ROOT, "app/InternalStructureReferencePanel.tsx"), "utf8"),
    readFile(path.join(ROOT, "app/SceneCanvas.tsx"), "utf8"),
    readFile(path.join(ROOT, "docs/RESEARCH_MODEL_UPGRADE_QUEUE.md"), "utf8"),
  ]);

  assert.equal(audit.schemaVersion, "0.1.0");
  assert.equal(audit.auditId, "banc-v888-candidate-audit-0.1.0");
  assert.equal(audit.source.dataverseVersion.versionNumber, 3);
  assert.equal(audit.source.dataverseVersion.state, "RELEASED");
  assert.equal(audit.source.dataverseLicense, "CC BY 4.0");
  assert.equal(audit.scope.materializationId, "v888");
  assert.equal(audit.scope.species, "Drosophila melanogaster");
  assert.equal(audit.scope.specimenCount, 1);

  const metadata = audit.metadataSnapshot;
  assert.equal(metadata.file.fileId, 14033740);
  assert.equal(metadata.file.rows, 188508);
  assert.equal(metadata.file.columns, 81);
  assert.equal(metadata.file.uniqueRootIds, metadata.file.rows);
  assert.equal(metadata.documentationDiscrepancy.documentedRows, 188162);
  assert.equal(metadata.documentationDiscrepancy.documentedColumns, 79);
  assert.equal(metadata.documentationDiscrepancy.archivedFileRows, metadata.file.rows);
  assert.equal(metadata.screenCounts.regionVentralNerveCordAndFlowIntrinsicRows, 19623);
  assert.equal(metadata.screenCounts.superClassCountsWithinThatCoarseFilter.ventral_nerve_cord_intrinsic, 12866);
  assert.equal(metadata.screenCounts.strictlyProofreadWithNucleusPositionSubclassAndType, 12571);
  assert.equal(metadata.screenCounts.isDatasetInterneuronDenominator, false);
  assert.match(metadata.selectionRule, /audit sentinel, not a representative/);

  const candidate = audit.candidate;
  assert.equal(candidate.rootId, "720575941350424112");
  assert.equal(candidate.cellType, "IN14A018");
  assert.equal(candidate.superClass, "ventral_nerve_cord_intrinsic");
  assert.equal(candidate.cellSubClass, "ventral_nerve_cord_contralateral_restricted");
  assert.equal(candidate.proofread, true);
  assert.equal(candidate.rootIdCrosswalk.allEqual, true);
  assert.ok(Object.values(candidate.rootIdCrosswalk).filter((value) => typeof value === "string").every((value) => value === candidate.rootId));
  assert.equal(candidate.cellClass, null);
  assert.equal(candidate.cellClassMissingnessPreserved, true);

  const nucleus = audit.objectReceipts.nucleusAnnotationRow;
  assert.equal(nucleus.nucleusId, candidate.nucleusId);
  assert.equal(nucleus.ptRootId, candidate.rootId);
  assert.equal(nucleus.matchedRowsByNucleusId, 1);
  assert.equal(nucleus.exactRootJoinVerified, true);
  assert.equal(nucleus.surfaceOrVolumeGeometryAvailableInThisTable, false);

  const skeleton = audit.objectReceipts.fullResolutionSkeletonMember;
  assert.equal(skeleton.memberName, `${candidate.rootId}_skeleton.swc`);
  assert.equal(skeleton.memberBytes, 489716);
  assert.equal(skeleton.swcNodeCount, 7451);
  assert.equal(skeleton.nucleusPointWithinSwcBounds, true);
  assert.equal(skeleton.geometryAdmittedToApplication, false);

  const mesh = audit.objectReceipts.neuronMeshCandidateObjects;
  assert.equal(mesh.versionLinkedToDataverseV888, false);
  assert.equal(mesh.objectLevelReuseTermsVerified, false);
  assert.equal(mesh.admitted, false);
  assert.equal(audit.objectReceipts.mitochondria.candidateMetadataMetricCount, 31);
  assert.equal(audit.objectReceipts.mitochondria.candidateSpecificAnnotationRowsFiltered, false);
  assert.equal(audit.objectReceipts.synapses.candidateSpecificRowsFiltered, false);

  const admission = audit.admission;
  assert.equal(admission.candidateAuditCompleteForMetadataNucleusAndSkeletonReceipts, true);
  assert.equal(admission.sameCellObjectChainComplete, false);
  for (const key of [
    "sourceObjectsImported",
    "cellMeshesAdmitted",
    "nucleusSurfacesAdmitted",
    "mitochondriaObjectsAdmitted",
    "synapseObjectsAdmitted",
    "sameCellJoinCount",
    "registrationCount",
    "renderedGeometryCount",
  ]) assert.equal(admission[key], 0, `${key} must remain zero until the full object chain passes`);
  assert.equal(admission.nextGateUpgradeId, "UPG-221");

  assert.equal(atlasTypes.includes("banc-v888-candidate-audit-0.1.json"), true);
  assert.match(atlasTypes, /export const bancV888CandidateAudit\s*=/);
  assert.match(panel, /bancV888CandidateAudit\.candidate\.rootId/);
  assert.match(panel, /metadataSnapshot\.documentationDiscrepancy/);
  assert.doesNotMatch(scene, /bancV888CandidateAudit|banc-v888-candidate-audit/, "an incomplete comparative audit must not become model geometry");
  assert.match(queue, /UPG-221[^\n]*partially completed/);
  assert.match(queue, /720575941350424112/);

  return {
    auditId: audit.auditId,
    archiveVersion: audit.source.dataverseVersion.versionNumber,
    metadataRows: metadata.file.rows,
    documentedMetadataRows: metadata.documentationDiscrepancy.documentedRows,
    strictCandidateScreenRows: metadata.screenCounts.strictlyProofreadWithNucleusPositionSubclassAndType,
    candidateRootId: candidate.rootId,
    candidateType: candidate.cellType,
    verifiedNucleusRootJoin: nucleus.exactRootJoinVerified,
    verifiedSkeletonNodes: skeleton.swcNodeCount,
    sameCellObjectChainComplete: admission.sameCellObjectChainComplete,
    renderedGeometryCount: admission.renderedGeometryCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateBancV888CandidateAudit()
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
