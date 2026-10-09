import { canonicalResearchFocusKey } from "./research-active-record.js";
import {
  MOLECULAR_COMPLETENESS_SLOT_IDS,
  selectMolecularCompletenessSlots,
  selectResearchNativeContourVisualization,
  selectResearchRecordScopedEvidenceReceipts,
} from "./research-record-presentation.js";

export const RESEARCH_SELECTION_DELTA_CONTRACT_ID = "research-selection-delta-0.1";

export const RESEARCH_SELECTION_DELTA_DISCLAIMER = "Presentation audit only; not evidence of a developmental or biological transition, abundance change, molecular equivalence, morphology causation, or same-cell evidence.";

export const RESEARCH_SELECTION_DELTA_BOUNDARY = Object.freeze({
  authority: "PRESENTATION_AUDIT_ONLY",
  developmentalOrBiologicalTransition: false,
  abundanceChange: false,
  molecularEquivalence: false,
  morphologyCausation: false,
  sameCellEvidence: false,
  relationshipAdmissionCount: 0,
});

const VISUALIZATION_COUNT_DEFINITIONS = Object.freeze([
  Object.freeze({ id: "admitted_cell_geometry", label: "Admitted cell-geometry objects", field: "admittedCellGeometryObjectCount" }),
  Object.freeze({ id: "source_native_line_loop", label: "Admitted source-native LineLoops", field: "admittedSourceNativeLineLoopCount", nativeContourReceipt: true }),
  Object.freeze({ id: "source_native_line_loop_vertex", label: "Admitted source-native LineLoop vertices", field: "admittedSourceNativeLineLoopVertexCount", nativeContourReceipt: true }),
  Object.freeze({ id: "admitted_internal", label: "Admitted internal objects", field: "admittedInternalObjectCount" }),
  Object.freeze({ id: "generated_fallback", label: "Generated fallback primitives", field: "generatedFallbackPrimitiveCount" }),
  Object.freeze({ id: "registration", label: "Registrations", field: "registrationCount" }),
  Object.freeze({ id: "same_cell_join", label: "Same-cell joins", field: "sameCellJoinCount" }),
]);

const SLOT_COMPARISON_FIELDS = Object.freeze([
  "status",
  "rowLabel",
  "value",
  "authority",
  "sourceLocator",
  "reasonCode",
  "detail",
]);

const RECORD_SCOPED_EVIDENCE_COMPARISON_FIELDS = Object.freeze([
  "value",
  "authority",
  "sourceLocator",
]);

function frozen(value) {
  return Object.freeze(value);
}

function canonicalRecordIdentity(record, label) {
  const key = canonicalResearchFocusKey(record);
  if (!key || record?.key !== key) {
    throw new TypeError(`${label} must have one canonical research focus key`);
  }
  if (typeof record.namespace !== "string" || !record.namespace.length) {
    throw new TypeError(`${label}.namespace must be a non-empty string`);
  }
  return frozen({
    key,
    focusKind: record.focusKind,
    focusId: record.focusId,
    namespace: record.namespace,
  });
}

function canonicalSlotReceipt(slot, label) {
  const sourceLocator = slot.status === "available" ? slot.locator : slot.sourceLocator;
  const commonIsValid = MOLECULAR_COMPLETENESS_SLOT_IDS.includes(slot.slotId)
    && typeof slot.label === "string" && slot.label.length > 0
    && ["available", "missing"].includes(slot.status)
    && typeof slot.authority === "string" && slot.authority.length > 0
    && typeof sourceLocator === "string" && sourceLocator.length > 0;
  const availableIsValid = slot.status !== "available" || (
    Number.isSafeInteger(slot.evidenceIndex) && slot.evidenceIndex >= 0
    && typeof slot.rowLabel === "string" && slot.rowLabel.length > 0
    && typeof slot.value === "string" && slot.value.length > 0
  );
  const missingIsValid = slot.status !== "missing"
    || (typeof slot.reasonCode === "string" && slot.reasonCode.length > 0);
  if (!commonIsValid || !availableIsValid || !missingIsValid) {
    throw new TypeError(`${label} fixed-slot receipt is invalid`);
  }
  return frozen({
    slotId: slot.slotId,
    label: slot.label,
    status: slot.status,
    evidenceIndex: slot.evidenceIndex,
    rowLabel: slot.rowLabel,
    value: slot.value,
    authority: slot.authority,
    sourceLocator,
    reasonCode: slot.reasonCode,
    detail: slot.detail,
  });
}

function buildFixedSlotDelta(previousRecord, currentRecord) {
  if (previousRecord.focusKind !== "molecular_profile" || currentRecord.focusKind !== "molecular_profile") {
    return frozen({
      status: "not_applicable",
      reasonCode: "fixed_slots_defined_for_molecular_profiles_only",
      comparedSlotCount: 0,
      changedSlotCount: 0,
      unchangedSlotCount: 0,
      slots: frozen([]),
      changedSlots: frozen([]),
      unchangedSlots: frozen([]),
    });
  }

  const previousSlots = new Map(selectMolecularCompletenessSlots(previousRecord)
    .map((slot) => [slot.slotId, canonicalSlotReceipt(slot, "previousRecord")]));
  const currentSlots = new Map(selectMolecularCompletenessSlots(currentRecord)
    .map((slot) => [slot.slotId, canonicalSlotReceipt(slot, "currentRecord")]));
  const slots = MOLECULAR_COMPLETENESS_SLOT_IDS.map((slotId) => {
    const previous = previousSlots.get(slotId);
    const current = currentSlots.get(slotId);
    if (!previous || !current) throw new Error(`Fixed-slot comparison is missing ${slotId}`);
    const changedFields = SLOT_COMPARISON_FIELDS.filter((field) => previous[field] !== current[field]);
    return frozen({
      slotId,
      label: current.label,
      changed: changedFields.length > 0,
      statusChanged: previous.status !== current.status,
      changedFields: frozen(changedFields),
      previous,
      current,
    });
  });
  const changedSlots = slots.filter((slot) => slot.changed);
  const unchangedSlots = slots.filter((slot) => !slot.changed);
  return frozen({
    status: "compared",
    reasonCode: null,
    comparedSlotCount: slots.length,
    changedSlotCount: changedSlots.length,
    unchangedSlotCount: unchangedSlots.length,
    slots: frozen(slots),
    changedSlots: frozen(changedSlots),
    unchangedSlots: frozen(unchangedSlots),
  });
}

function evidenceRowsWithOccurrence(record) {
  const occurrences = new Map();
  return selectResearchRecordScopedEvidenceReceipts(record).map((row) => {
    const occurrence = occurrences.get(row.label) ?? 0;
    occurrences.set(row.label, occurrence + 1);
    return frozen({
      key: `${row.label}\u0000${occurrence}`,
      occurrence,
      row,
    });
  });
}

function buildRecordScopedEvidenceDelta(previousRecord, currentRecord) {
  if (previousRecord.focusKind !== "morphology_record" || currentRecord.focusKind !== "morphology_record") {
    return frozen({
      status: "not_applicable",
      reasonCode: "record_scoped_evidence_delta_defined_for_morphology_pairs",
      comparedRowCount: 0,
      changedRowCount: 0,
      unchangedRowCount: 0,
      changedRows: frozen([]),
    });
  }

  const previousRows = evidenceRowsWithOccurrence(previousRecord);
  const currentRows = evidenceRowsWithOccurrence(currentRecord);
  const previousByKey = new Map(previousRows.map((item) => [item.key, item]));
  const currentByKey = new Map(currentRows.map((item) => [item.key, item]));
  const keys = [...previousRows.map((item) => item.key)];
  for (const item of currentRows) {
    if (!previousByKey.has(item.key)) keys.push(item.key);
  }
  const rows = keys.map((key) => {
    const previous = previousByKey.get(key)?.row ?? null;
    const current = currentByKey.get(key)?.row ?? null;
    const changedFields = previous && current
      ? RECORD_SCOPED_EVIDENCE_COMPARISON_FIELDS.filter((field) => previous[field] !== current[field])
      : ["presence"];
    return frozen({
      label: current?.label ?? previous?.label,
      occurrence: currentByKey.get(key)?.occurrence ?? previousByKey.get(key)?.occurrence ?? 0,
      changed: changedFields.length > 0,
      changedFields: frozen(changedFields),
      previous,
      current,
    });
  });
  const changedRows = rows.filter((row) => row.changed);
  return frozen({
    status: "compared_morphology_records",
    reasonCode: null,
    comparedRowCount: rows.length,
    changedRowCount: changedRows.length,
    unchangedRowCount: rows.length - changedRows.length,
    changedRows: frozen(changedRows),
  });
}

function exactEvidenceReceipt(row) {
  if (![row?.label, row?.value, row?.authority, row?.locator]
    .every((value) => typeof value === "string" && value.length > 0)) {
    throw new TypeError("Shared source context requires exact labeled evidence with an authority and locator");
  }
  return JSON.stringify([row.label, row.value, row.authority, row.locator]);
}

function sharedEvidenceRows(record) {
  const indices = record.presentation?.evidencePartition?.sharedEvidenceIndices;
  if (!Array.isArray(indices) || !Array.isArray(record.evidence)) {
    throw new TypeError("Research selection delta requires the indexed evidence presentation partition");
  }
  return indices.map((index) => record.evidence[index]);
}

function buildSharedContext(previousRecord, currentRecord) {
  if (previousRecord.namespace !== currentRecord.namespace) {
    return frozen({
      status: "not_compared_different_namespace",
      reasonCode: "source_namespaces_differ",
      unchangedRowCount: 0,
      unchangedRows: frozen([]),
    });
  }
  const previousReceipts = new Set(sharedEvidenceRows(previousRecord).map(exactEvidenceReceipt));
  const unchangedRows = sharedEvidenceRows(currentRecord)
    .filter((row) => previousReceipts.has(exactEvidenceReceipt(row)))
    .map((row) => frozen({
      label: row.label,
      value: row.value,
      authority: row.authority,
      sourceLocator: row.locator,
    }));
  return frozen({
    status: "compared_same_namespace",
    reasonCode: null,
    unchangedRowCount: unchangedRows.length,
    unchangedRows: frozen(unchangedRows),
  });
}

function modelingCounts(record, label) {
  const modeling = record.presentation?.modeling;
  if (!modeling || typeof modeling !== "object") {
    throw new TypeError(`${label} requires visualization-authority counts`);
  }
  const nativeContour = selectResearchNativeContourVisualization(record);
  const countValues = {
    ...modeling,
    admittedSourceNativeLineLoopCount: nativeContour.lineLoopCount,
    admittedSourceNativeLineLoopVertexCount: nativeContour.vertexCount,
  };
  const counts = Object.fromEntries(VISUALIZATION_COUNT_DEFINITIONS.map(({ field }) => {
    const count = countValues[field];
    if (!Number.isSafeInteger(count) || count < 0) {
      throw new TypeError(`${label}.${field} must be a non-negative safe integer`);
    }
    return [field, count];
  }));
  return { counts, nativeContour };
}

function buildVisualizationCounts(previousRecord, currentRecord) {
  const previous = modelingCounts(previousRecord, "previousRecord");
  const current = modelingCounts(currentRecord, "currentRecord");
  const counts = VISUALIZATION_COUNT_DEFINITIONS.map(({ id, label, field, nativeContourReceipt = false }) => frozen({
    id,
    label,
    previousCount: previous.counts[field],
    currentCount: current.counts[field],
    difference: current.counts[field] - previous.counts[field],
    changed: previous.counts[field] !== current.counts[field],
    previousAuthority: nativeContourReceipt ? previous.nativeContour.authority : null,
    currentAuthority: nativeContourReceipt ? current.nativeContour.authority : null,
    previousSourceLocator: nativeContourReceipt ? previous.nativeContour.sourceLocator : null,
    currentSourceLocator: nativeContourReceipt ? current.nativeContour.sourceLocator : null,
  }));
  return frozen({
    counts: frozen(counts),
    changedCount: counts.filter((item) => item.changed).length,
  });
}

function validGeneration(value, label) {
  if (value === null) return null;
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${label} must be a non-negative safe integer or null`);
  }
  return value;
}

export function buildResearchSelectionDeltaReceipt(previousRecord, currentRecord, {
  previousGeneration = null,
  currentGeneration = null,
} = {}) {
  const previous = canonicalRecordIdentity(previousRecord, "previousRecord");
  const current = canonicalRecordIdentity(currentRecord, "currentRecord");
  if (previous.key === current.key) return null;

  const fixedSlots = buildFixedSlotDelta(previousRecord, currentRecord);
  const recordScopedEvidence = buildRecordScopedEvidenceDelta(previousRecord, currentRecord);
  const visualizationAuthority = buildVisualizationCounts(previousRecord, currentRecord);
  const sharedContext = buildSharedContext(previousRecord, currentRecord);
  const namespace = frozen({
    previous: previous.namespace,
    current: current.namespace,
    changed: previous.namespace !== current.namespace,
  });
  return frozen({
    contractId: RESEARCH_SELECTION_DELTA_CONTRACT_ID,
    mode: "ADJACENT_VERIFIED_SELECTION_PRESENTATION_AUDIT",
    previous,
    current,
    selectionGeneration: frozen({
      previous: validGeneration(previousGeneration, "previousGeneration"),
      current: validGeneration(currentGeneration, "currentGeneration"),
    }),
    namespace,
    fixedSlots,
    recordScopedEvidence,
    visualizationAuthority,
    sharedContext,
    summary: frozen({
      changedFixedSlotCount: fixedSlots.changedSlotCount,
      unchangedFixedSlotCount: fixedSlots.unchangedSlotCount,
      changedRecordScopedEvidenceRowCount: recordScopedEvidence.changedRowCount,
      changedVisualizationAuthorityCount: visualizationAuthority.changedCount,
      unchangedSharedContextRowCount: sharedContext.unchangedRowCount,
    }),
    boundary: RESEARCH_SELECTION_DELTA_BOUNDARY,
    disclaimer: RESEARCH_SELECTION_DELTA_DISCLAIMER,
  });
}

export function createResearchSelectionDeltaStreamState() {
  return frozen({
    attemptStatus: "idle",
    attemptKey: null,
    attemptGeneration: null,
    readyRecord: null,
    readyGeneration: null,
    previousReadyRecord: null,
    previousReadyGeneration: null,
    receipt: null,
  });
}

function activeRecordSnapshot(activeRecord) {
  if (!activeRecord || typeof activeRecord !== "object"
    || !["idle", "verifying", "ready", "unavailable"].includes(activeRecord.status)) {
    throw new TypeError("Research selection delta requires an active-record stream snapshot");
  }
  const generation = activeRecord.generation;
  if (!Number.isSafeInteger(generation) || generation < 0) {
    throw new TypeError("Active-record generation must be a non-negative safe integer");
  }
  if (activeRecord.status === "idle") {
    return { status: "idle", generation, requestKey: null, record: null };
  }
  if (typeof activeRecord.requestKey !== "string" || !activeRecord.requestKey.length) {
    throw new TypeError("A non-idle active record must retain its canonical request key");
  }
  if (activeRecord.status === "ready") {
    const recordKey = canonicalResearchFocusKey(activeRecord.record);
    if (!recordKey || activeRecord.record?.key !== recordKey || recordKey !== activeRecord.requestKey) {
      throw new TypeError("A ready active record must exactly match its canonical request key");
    }
  }
  return {
    status: activeRecord.status,
    generation,
    requestKey: activeRecord.requestKey,
    record: activeRecord.status === "ready" ? activeRecord.record : null,
  };
}

export function advanceResearchSelectionDeltaStream(previousState, activeRecord) {
  const active = activeRecordSnapshot(activeRecord);
  if (active.status === "idle") return createResearchSelectionDeltaStreamState();

  if (active.status === "unavailable") {
    return frozen({
      attemptStatus: "unavailable",
      attemptKey: active.requestKey,
      attemptGeneration: active.generation,
      readyRecord: null,
      readyGeneration: null,
      previousReadyRecord: null,
      previousReadyGeneration: null,
      receipt: null,
    });
  }

  if (active.status === "verifying") {
    const previousAttemptWasReady = previousState.attemptStatus === "ready";
    const previousAttemptWasVerifying = previousState.attemptStatus === "verifying";
    return frozen({
      attemptStatus: "verifying",
      attemptKey: active.requestKey,
      attemptGeneration: active.generation,
      readyRecord: null,
      readyGeneration: null,
      previousReadyRecord: previousAttemptWasReady
        ? previousState.readyRecord
        : previousAttemptWasVerifying ? previousState.previousReadyRecord : null,
      previousReadyGeneration: previousAttemptWasReady
        ? previousState.readyGeneration
        : previousAttemptWasVerifying ? previousState.previousReadyGeneration : null,
      receipt: null,
    });
  }

  const sameReadyObservation = previousState.attemptStatus === "ready"
    && previousState.attemptKey === active.requestKey
    && previousState.readyGeneration === active.generation
    && previousState.readyRecord === active.record;
  if (sameReadyObservation) return previousState;

  let previousReadyRecord = null;
  let previousReadyGeneration = null;
  if (previousState.attemptKey === active.requestKey) {
    if (previousState.attemptStatus === "verifying") {
      previousReadyRecord = previousState.previousReadyRecord;
      previousReadyGeneration = previousState.previousReadyGeneration;
    }
  } else if (previousState.attemptStatus === "ready") {
    previousReadyRecord = previousState.readyRecord;
    previousReadyGeneration = previousState.readyGeneration;
  }

  const receipt = previousReadyRecord && previousReadyRecord.key !== active.record.key
    ? buildResearchSelectionDeltaReceipt(previousReadyRecord, active.record, {
      previousGeneration: previousReadyGeneration,
      currentGeneration: active.generation,
    })
    : null;
  return frozen({
    attemptStatus: "ready",
    attemptKey: active.requestKey,
    attemptGeneration: active.generation,
    readyRecord: active.record,
    readyGeneration: active.generation,
    previousReadyRecord,
    previousReadyGeneration,
    receipt,
  });
}

export function visibleResearchSelectionDeltaReceipt(streamState, activeRecord) {
  const active = activeRecordSnapshot(activeRecord);
  const receipt = streamState?.receipt ?? null;
  if (active.status !== "ready" || !receipt) return null;
  return streamState.attemptStatus === "ready"
    && streamState.attemptKey === active.requestKey
    && streamState.attemptGeneration === active.generation
    && receipt.current.key === active.requestKey
    && receipt.selectionGeneration.current === active.generation
    ? receipt
    : null;
}
