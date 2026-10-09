const HASH = /^[a-f0-9]{64}$/;
const REQUIRED_GATE_IDS = ["file_rights", "section_identity", "specimen_identity", "cell_schema", "curated_labels", "segmentation_method"];
const REQUIRED_GATE_STATUS = { file_rights: "unresolved_policy_difference", section_identity: "blocked", specimen_identity: "blocked", cell_schema: "not_acquired", curated_labels: "blocked_for_interneuron_lane", segmentation_method: "run_level_verified_parameters_partial" };
const FORBIDDEN_ADMISSION_COUNTS = ["cellBoundaryObjects", "nucleusBoundaryObjects", "interneuronObjects", "threeDimensionalCellObjects", "atlasRegistrations", "sameCellMorphologyJoins"];

function assert(condition, message) {
  if (!condition) throw new Error(`BIL Xenium metadata: ${message}`);
}

/** Validate this metadata-only snapshot without promoting uninspected payloads. */
export function validateBilXeniumMetadata(snapshot) {
  assert(snapshot?.schemaVersion === "0.1.0" && snapshot.adapterId === "bil-xenium-source-metadata-0.1", "unsupported adapter");
  assert(snapshot.collection?.doi === "10.35077/g.1196", "wrong collection");
  assert(snapshot.collection.sourceObjectKind === "run_slide_roi_metadata", "wrong object scope");
  assert(snapshot.collection.outlineLabelsAreVerifiedSections === false, "outline labels cannot establish sections");
  assert(snapshot.admission?.disposition === "metadata_only", "geometry admission is unsupported in this snapshot");
  for (const key of FORBIDDEN_ADMISSION_COUNTS) assert(snapshot.admission[key] === 0, `${key} must remain zero`);
  assert(snapshot.acquisition?.geometryFilesDownloaded === 0, "geometry acquisition claim changed");
  assert(Array.isArray(snapshot.runs) && snapshot.runs.length > 0, "empty or missing run inventory");
  assert(snapshot.runs.length === snapshot.collection.runSlideBundleCount, "run denominator mismatch");
  const objectIds = new Set();
  const roiIds = new Set();
  let rawCells = 0;
  let outlineLabels = 0;
  for (const run of snapshot.runs) {
    assert(run.sourceObjectKey === `BIL:${run.bildid}` && !objectIds.has(run.sourceObjectKey), "duplicate or invalid BIL object key");
    assert(run.manifestIdentity?.roi_uuid && !roiIds.has(run.manifestIdentity.roi_uuid), "duplicate or missing ROI identity");
    objectIds.add(run.sourceObjectKey);
    roiIds.add(run.manifestIdentity.roi_uuid);
    assert(run.cellToSectionJoinVerified === false && run.curatedCellTypeJoinVerified === false, "unverified cell joins promoted");
    assert(run.specimenScope === "API_dataset_record_not_per_cell_or_section", "dataset specimen keys cannot identify each cell");
    assert(Number.isSafeInteger(run.rawSegmentedCellCount) && run.rawSegmentedCellCount > 0, "invalid raw segmentation denominator");
    const counts = run.processing?.methodCounts;
    assert(counts && ["boundary", "interior", "nuc_expansion"].every((key) => Number.isSafeInteger(counts[key]) && counts[key] >= 0), "invalid segmentation method counts");
    assert(counts.boundary + counts.interior + counts.nuc_expansion === run.rawSegmentedCellCount, "method denominator mismatch");
    assert(run.processing.nuclearExpansionDistanceUm === null, "unverified expansion distance");
    assert(Array.isArray(run.namedOutlineLabels) && new Set(run.namedOutlineLabels).size === run.namedOutlineLabels.length && run.namedOutlineLabels.length === run.namedOutlineLabelCount, "outline label denominator mismatch");
    assert(run.rights?.policyDifferenceResolved === false, "source rights difference is unresolved");
    assert(Array.isArray(run.sourceFiles) && run.sourceFiles.length === 3 && run.sourceFiles.every((file) => HASH.test(file.sha256) && file.bytes > 0 && file.url.startsWith("https://")), "missing or invalid exact source receipts");
    rawCells += run.rawSegmentedCellCount;
    outlineLabels += run.namedOutlineLabelCount;
  }
  assert(rawCells === snapshot.collection.rawSegmentedCellCount, "collection raw cell denominator mismatch");
  assert(outlineLabels === snapshot.collection.namedOutlineLabelCount, "collection outline denominator mismatch");
  assert(Array.isArray(snapshot.pilotGates) && snapshot.pilotGates.length === REQUIRED_GATE_IDS.length && REQUIRED_GATE_IDS.every((id) => snapshot.pilotGates.filter((gate) => gate.id === id).length === 1), "incomplete or duplicate pilot gates");
  for (const gate of snapshot.pilotGates) {
    assert(typeof gate.evidence === "string" && gate.evidence && typeof gate.requiredInput === "string" && gate.requiredInput, "pilot gate lacks evidence or restart input");
    assert(gate.status === REQUIRED_GATE_STATUS[gate.id], "pilot dependency status changed without a new source contract");
  }
  return { runSlideBundleCount: snapshot.runs.length, rawSegmentedCellCount: rawCells, namedOutlineLabelCount: outlineLabels, geometryObjects: 0 };
}

/** Fail closed: this adapter provides metadata, never a partial geometry scene. */
export function assessBilXeniumPilotAdmission(snapshot) {
  validateBilXeniumMetadata(snapshot);
  return {
    admitted: false,
    geometry: null,
    disposition: "metadata_only",
    blockers: snapshot.pilotGates.filter((gate) => gate.id !== "segmentation_method"),
    methodEvidence: snapshot.pilotGates.find((gate) => gate.id === "segmentation_method"),
  };
}

/** Unknown selection returns null and cannot reuse the preceding selected run. */
export function buildBilXeniumRunReceipt(snapshot, sourceObjectKey) {
  validateBilXeniumMetadata(snapshot);
  const run = snapshot.runs.find((candidate) => candidate.sourceObjectKey === sourceObjectKey);
  if (!run) return null;
  return {
    receiptType: "bil_xenium_run_metadata",
    checkedDate: snapshot.checkedDate,
    collectionDoi: snapshot.collection.doi,
    sourceObjectKey: run.sourceObjectKey,
    directoryFolder: run.directoryFolder,
    directoryDonorToken: run.directoryDonorToken,
    manifestIdentity: run.manifestIdentity,
    apiSpecimens: run.apiSpecimens,
    specimenScope: run.specimenScope,
    rawSegmentedCellCount: run.rawSegmentedCellCount,
    processing: run.processing,
    rights: run.rights,
    outlineCandidates: run.outlineCandidates,
    sourceFiles: run.sourceFiles,
    pilotAdmission: assessBilXeniumPilotAdmission(snapshot),
    claims: { geometryObjects: 0, interneuronObjects: 0, atlasRegistrations: 0, sameCellMorphologyJoins: 0 },
  };
}
