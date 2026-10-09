const COMMIT = ['e46d4cbcb807818cb2ac676a7a7ea73739e5667c', '530f6546fd6cc7b344b26d850fa87ee7baab60fb'];
const PREFIX = 'data/source-candidates/published-xenium-registration-20261002/';
const HASH = /^[a-f0-9]{64}$/;
function assert(value, reason) { if (!value) throw new Error(`Published Xenium workflow audit: ${reason}`); }

/** A software inspection is never an exact biological mapping or transform. */
export function validateBilPublishedWorkflowAudit(audit) {
  assert(audit?.schemaVersion === '0.1.0' && audit.auditId === 'bil-xenium-published-workflow-audit-0.1' && audit.scope === 'pinned_public_software_inventory_not_exact_run_mapping' && audit.collectionDoi === '10.35077/g.1196', 'source scope changed');
  assert(audit.repositories.length === 2 && audit.repositories.every((r, i) => r.commit === COMMIT[i] && r.treeTruncated === false) && audit.repositories[0].licence === 'MIT_software_notice_present' && audit.repositories[1].licence === 'no_licence_file_in_pinned_tree', 'software inventory or licence changed');
  assert(audit.sourceInputs.length === 23 && new Set(audit.sourceInputs.map(f => f.path)).size === 23 && audit.sourceInputs.every(f => f.path.startsWith(PREFIX) && !f.path.split('/').includes('..') && Number.isSafeInteger(f.bytes) && f.bytes > 0 && HASH.test(f.sha256)), 'input receipts changed');
  const a = audit.availability;
  assert(a.completeGitTreeInventories === 2 && a.listedBlobs === 18 && a.acquiredTextBlobs === 17 && a.sourceRCodeExecuted === false && a.specimenDataAcquired === false && a.exampleTargetAnchorRows === 24 && a.exampleAnchorSchema.join(',') === 'x,y' && a.findingScope === 'these_two_complete_pinned_git_trees_only_not_all_public_or_private_data', 'example or inventory promoted');
  const identity = audit.identity;
  assert(['originalCellIdMapPresent', 'biologicalSectionMapPresent', 'specimenMapPresent', 'curatedCellTypeMapPresent'].every(k => identity[k] === false) && ['exactRunSourceObjectKey', 'exactRunAnalysisUuid', 'exactRunRoiUuid'].every(k => identity[k] === null), 'unverified biological identity');
  const coordinate = audit.coordinate;
  assert(['exactOutlineToCellTransform', 'physicalCalibrationOfTargetImage'].every(k => coordinate[k] === null) && ['sourceRunAnchorPairsPresent', 'savedSourceRotationPresent', 'sourcePolygonSelectionPresent'].every(k => coordinate[k] === false) && coordinate.defaultTypeColumn === 'RNA_snn_res.14', 'unverified coordinates or curated types');
  assert(Object.values(audit.rights).every(v => v === false) && Object.keys(audit.rights).length === 4, 'software licence promoted to dataset rights');
  assert(audit.admission.geometryViewerAdmission === false && audit.admission.fullGoalComplete === false && ['sectionLinkedCellNucleusGeometryCount', 'interneuronObjects', 'atlasRegistrations', 'sameCellMorphologyJoins'].every(k => audit.admission[k] === 0), 'unverified scientific admission');
  return { listedBlobs: 18, acquiredTextBlobs: 17, verifiedInputCount: 23, geometryObjects: 0 };
}

export function buildBilPublishedWorkflowContext(audit, selectedSourceObjectKey) {
  validateBilPublishedWorkflowAudit(audit);
  return { selectedSourceObjectKey, relationshipToSelectedRun: 'independent_software_inspection_only', exactRunEvidence: false, audit: structuredClone(audit) };
}
