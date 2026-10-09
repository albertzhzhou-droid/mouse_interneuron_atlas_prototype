import { evaluateSameCellInternalSource } from "./same-cell-internal-source-contract.js";

const INTERNAL_DETAIL_SLOTS = Object.freeze([
  { id: "cell_geometry", label: "Source-local cell morphology" },
  { id: "radius_surface", label: "Radius-derived neurite surface" },
  { id: "soma_trace", label: "Soma trace / outline" },
  { id: "cell_boundary", label: "Cell boundary / membrane" },
  { id: "nucleus", label: "Nucleus" },
  { id: "organelles", label: "Organelles" },
  { id: "synaptic_structures", label: "Synaptic structures / boutons" },
  { id: "receptor_distribution", label: "Receptor distribution" },
  { id: "source_frame", label: "Source coordinates / frame" },
  { id: "reconstruction_completeness", label: "Reconstruction domain / completeness" },
  { id: "relationships", label: "Atlas placement / same-cell link" },
]);

const STATUS_LABELS = Object.freeze({
  observed_source_object: "OBS · EXACT SOURCE OBJECT",
  derived_display: "DER · DISPLAY ONLY",
  source_reported: "SOURCE-REPORTED",
  source_level_only: "SOURCE-LEVEL ONLY",
  not_measured: "NOT MEASURED",
  unavailable: "UNAVAILABLE",
  not_assessed: "NOT ASSESSED",
  not_established: "NOT ESTABLISHED",
  source_reported_absent: "SOURCE-REPORTED ABSENT",
  rights_held: "RIGHTS-HELD",
});

const INTERNAL_GAP_AXES = Object.freeze([
  "same_specimen_internal_structure",
  "internal_structure",
]);

function axis(record, axisId) {
  return record?.presentation?.modeling?.axes?.find((item) => item?.axisId === axisId) ?? null;
}

function evidence(record, predicate, { includeNegative = false } = {}) {
  return record?.evidence?.find((item) => {
    const text = `${item?.label ?? ""} ${item?.value ?? ""}`;
    if (!includeNegative && (item?.authority === "UNAVAILABLE" || /\b(?:unavailable|not measured|not available|not admitted|no (?:linked|same[- ]specimen|exact[- ]record|generic substitute)|no .{0,30} may be inferred)\b/i.test(text))) return false;
    return predicate(text);
  }) ?? null;
}

function gap(record, axisIds) {
  return record?.gaps?.find((item) => axisIds.includes(item?.axisId)) ?? null;
}

function fallbackLocator(record) {
  return record?.provenance?.locators?.find((item) => typeof item === "string" && item.length > 0)
    ?? `research-record:${record?.focusId ?? "unresolved"}`;
}

function statusFromGap(item) {
  if (!item) return null;
  const tokens = `${item.status ?? ""} ${item.reasonCode ?? ""}`.toLowerCase();
  if (tokens.includes("rights") || tokens.includes("license") || tokens.includes("licence")) return "rights_held";
  if (tokens.includes("source_reported_absent") || tokens.includes("source_reports_absence")) return "source_reported_absent";
  if (item.status === "not_measured" || item.reasonCode === "not_measured_by_study") return "not_measured";
  if (item.status === "not_established" || item.reasonCode === "relationship_not_established" || item.reasonCode === "no_admitted_transform") return "not_established";
  if (item.status === "unavailable") return "unavailable";
  return "not_assessed";
}

function row(id, status, detail, authority, locator) {
  const definition = INTERNAL_DETAIL_SLOTS.find((item) => item.id === id);
  return Object.freeze({
    id,
    label: definition.label,
    status,
    statusLabel: STATUS_LABELS[status] ?? "NOT ASSESSED",
    detail,
    authority: authority || "record_missingness_contract",
    locator: locator || "",
  });
}

function internalSlotRow(record, slotId, label, specificAxisIds, evidenceMatcher, sourceGate) {
  const objectEvidence = evidence(record, evidenceMatcher);
  const internalAxis = axis(record, "internal_structure");
  const specificGap = gap(record, specificAxisIds);
  const sharedGap = gap(record, INTERNAL_GAP_AXES);
  const objectCount = record?.presentation?.modeling?.admittedInternalObjectCount ?? 0;
  const claimsExactObjectAuthority = objectEvidence
    && objectCount > 0
    && (record?.provenance?.objectHashes ?? []).some((receipt) => (
      receipt?.sha256
      && (receipt.label === objectEvidence.locator || objectEvidence.value?.includes(receipt.sha256))
    ));

  const exactInternalHash = record.internalSourceContracts?.[slotId]?.geometryReceipt?.digest;
  const evidenceBindsInternalGeometry = objectEvidence && exactInternalHash && (record?.provenance?.objectHashes ?? []).some((receipt) => receipt.sha256 === exactInternalHash
    && (receipt.label === objectEvidence.locator || objectEvidence.value?.includes(exactInternalHash)));
  if (claimsExactObjectAuthority && sourceGate.eligible && evidenceBindsInternalGeometry) {
    return row(slotId, "observed_source_object", objectEvidence.value, objectEvidence.authority, objectEvidence.locator);
  }
  if (claimsExactObjectAuthority) {
    return row(slotId, "unavailable", `The claimed internal object has not passed its mandatory source contract. Missing or unverified: ${sourceGate.missingRequiredFields.length ? sourceGate.missingRequiredFields.join(", ") : "the evidence row's exact internal-geometry hash binding"}. This does not imply biological absence.`, "UPG-118_REQUIRED_SOURCE_CONTRACT", objectEvidence.locator);
  }
  if (objectEvidence) {
    return row(slotId, "source_reported", `${objectEvidence.value} · source evidence only; no internal geometry is admitted for this record.`, objectEvidence.authority, objectEvidence.locator);
  }

  const missingness = specificGap ?? sharedGap;
  const status = statusFromGap(missingness)
    ?? (internalAxis?.status === "unavailable" ? "unavailable" : "not_assessed");
  const detail = specificGap
    ? specificGap.detail
    : sharedGap
      ? `No separate record-specific ${label.toLowerCase()} assessment or object is attached; see the shared internal-structure boundary above. This does not imply biological absence.`
      : status === "unavailable"
        ? `No exact-record ${label.toLowerCase()} object is admitted; this is not biological absence.`
        : internalAxis?.detail ?? `No exact-record ${label.toLowerCase()} evidence was assessed.`;
  return row(slotId, status, detail, missingness?.authority ?? internalAxis?.authority, missingness?.sourceLocator ?? fallbackLocator(record));
}

function sourceGates(record, verifiedInternalEvidence, internalRuntimeReceipts) {
  return Object.fromEntries([["nucleus", "nucleus"], ["organelles", "organelle"], ["synaptic_structures", "synaptic_structure"], ["receptor_distribution", "receptor_distribution"]].map(([slot, structureKind]) => [slot,
    evaluateSameCellInternalSource({ targetHierarchy: record.sourceIdentityHierarchy ?? null, targetCoordinateFrame: record.internalCoordinateFrame ?? null,
      candidate: record.internalSourceContracts?.[slot] ?? null, requiredStructureKind: structureKind, verifiedEvidence: verifiedInternalEvidence, runtimeReceipts: internalRuntimeReceipts })]));
}

function activeRecordRows(record, gates) {
  const geometryAxis = axis(record, "cell_geometry");
  const morphologyEvidence = evidence(record, (text) => /^(?:observed swc mode|geometry receipt)\b/i.test(text));
  const geometryLocator = record.morphologyMembership?.geometryPath
    ?? morphologyEvidence?.locator
    ?? fallbackLocator(record);
  const exactGeometry = geometryAxis?.status === "available_exact_source_local"
    && (record.morphologyMembership?.geometrySha256 || morphologyEvidence?.locator);
  const morphologyGap = gap(record, ["single_cell_morphology", "morphology", "whole_cell_geometry"]);
  const geometryStatus = exactGeometry
    ? "observed_source_object"
    : statusFromGap(morphologyGap)
      ?? (geometryAxis?.status === "not_established" ? "not_established" : geometryAxis?.status === "unavailable" ? "unavailable" : "not_assessed");
  const morphologyDetail = exactGeometry
    ? `${geometryAxis.detail} Source-local neurite reconstruction; not an intracellular or membrane segmentation.`
    : morphologyGap?.detail ?? geometryAxis?.detail ?? "No exact-record morphology evidence was assessed.";

  const radiusEvidence = evidence(record, (text) => /radius-derived surface/i.test(text), { includeNegative: true });
  const radiusUnavailable = radiusEvidence && /unavailable|no diameter/i.test(radiusEvidence.value);
  const diameterAuthority = evidence(record, (text) => /^diameter authority\b/i.test(text));
  const radiusRow = radiusEvidence
    ? row("radius_surface", radiusUnavailable ? "unavailable" : "derived_display",
      [diameterAuthority?.value, radiusEvidence.value].filter(Boolean).join(" · "), radiusEvidence.authority, radiusEvidence.locator)
    : row("radius_surface", "not_assessed", "No exact-record radius-surface determination is recorded.", "record_evidence_index", fallbackLocator(record));

  const somaDomain = record.evidence?.find((item) => item.label === "Reconstruction domain" && /\bsoma\b/i.test(item.value));
  const somaContour = evidence(record, (text) => /soma.{0,24}(contour|outline|loop)|(?:contour|outline|loop).{0,24}soma/i.test(text));
  const somaRow = somaContour
    ? row("soma_trace", "observed_source_object", `${somaContour.value} · source-local contour only; no closed volume is implied.`, somaContour.authority, somaContour.locator)
    : somaDomain
      ? row("soma_trace", "source_reported", `${somaDomain.value} · a traced soma domain/node does not define a soma boundary or volume.`, somaDomain.authority, somaDomain.locator)
      : row("soma_trace", "not_assessed", "No source-local soma contour or soma-trace statement is attached to this exact record.", "record_evidence_index", fallbackLocator(record));

  const boundaryGap = gap(record, ["observed_membrane", "cell_boundary", "cell_envelope"]);
  const internalAxis = axis(record, "internal_structure");
  const membraneRow = boundaryGap
    ? row("cell_boundary", statusFromGap(boundaryGap), boundaryGap.detail, boundaryGap.authority, boundaryGap.sourceLocator)
    : row("cell_boundary", internalAxis?.status === "unavailable" ? "unavailable" : "not_assessed",
      internalAxis?.status === "unavailable" ? "No exact-record cell boundary or membrane object is admitted; radius tubes are not membranes." : "No exact-record boundary assessment is recorded.",
      internalAxis?.authority, fallbackLocator(record));

  const sourceFrameGap = gap(record, ["cell_coordinates", "source_coordinate_frame"]);
  let frameRow;
  if (record.coordinate?.geometryStatus === "OBS_STANDARDIZED_SOURCE_LOCAL" && record.coordinate?.frame) {
    const extent = record.evidence?.find((item) => item.label === "Source-coordinate extent");
    frameRow = row("source_frame", "observed_source_object", `Source-local frame: ${record.coordinate.frame}${extent ? ` · extent ${extent.value}` : ""}; no atlas registration.`, record.coordinate.geometryStatus, extent?.locator ?? geometryLocator);
  } else if (record.coordinate?.geometryStatus === "TYPE_LEVEL") {
    frameRow = row("source_frame", "source_level_only", `Frame ${record.coordinate.frame}; this is type/source context, not an individual-cell coordinate.`, record.coordinate.geometryStatus, fallbackLocator(record));
  } else {
    frameRow = row("source_frame", statusFromGap(sourceFrameGap) ?? "not_established",
      sourceFrameGap?.detail ?? "No source-local individual-cell frame is established for this record.",
      sourceFrameGap?.authority ?? record.coordinate?.geometryStatus, sourceFrameGap?.sourceLocator ?? fallbackLocator(record));
  }

  const integrity = record.evidence?.find((item) => item.label === "Physical integrity");
  const domain = record.evidence?.find((item) => item.label === "Reconstruction domain");
  const completenessGap = gap(record, ["complete_axon", "reconstruction_completeness"]);
  const completenessRow = integrity || domain
    ? row("reconstruction_completeness", "source_reported",
      [domain?.value, integrity?.value].filter(Boolean).join(" · "),
      integrity?.authority ?? domain?.authority, integrity?.locator ?? domain?.locator)
    : row("reconstruction_completeness", statusFromGap(completenessGap) ?? "not_assessed",
      completenessGap?.detail ?? "No record-specific reconstruction-completeness statement is attached.",
      completenessGap?.authority ?? "record_evidence_index", completenessGap?.sourceLocator ?? fallbackLocator(record));

  const registration = axis(record, "atlas_registration");
  const identity = axis(record, "cross_source_same_cell");
  const relationStatus = registration?.status === "not_established" || identity?.status === "not_established"
    ? "not_established"
    : "not_assessed";
  const relationshipRow = row("relationships", relationStatus,
    [registration?.detail, identity?.detail].filter(Boolean).join(" ") || "No cross-source or atlas relationship has been assessed.",
    registration?.authority ?? identity?.authority, fallbackLocator(record));

  const internalSlots = [
    internalSlotRow(record, "nucleus", "nucleus", ["nucleus", "nucleus_boundary", "nucleus_segmentation"], (text) => /nucleus\s+(?:annotation|segmentation|surface|boundary|mesh|object|id)\b/i.test(text), gates.nucleus),
    internalSlotRow(record, "organelles", "organelle", ["organelles", "mitochondria", "organelle_geometry"], (text) => /mitochondria|organelle/i.test(text), gates.organelles),
    internalSlotRow(record, "synaptic_structures", "synaptic structure", ["synapse", "synapses", "synaptic_geometry", "boutons"], (text) => /(?:synap|bouton).{0,36}(?:annotation|count|segmentation|surface|boundary|mesh|object|position|coordinate|geometry)/i.test(text), gates.synaptic_structures),
    internalSlotRow(record, "receptor_distribution", "receptor distribution", ["receptor_distribution", "receptors"], (text) => /receptor.{0,36}(?:annotation|map|distribution|segmentation|position|coordinate|geometry)/i.test(text), gates.receptor_distribution),
  ];

  return Object.freeze([
    row("cell_geometry", geometryStatus, morphologyDetail, exactGeometry ? geometryAxis.authority : morphologyGap?.authority ?? geometryAxis?.authority, geometryLocator),
    radiusRow,
    somaRow,
    membraneRow,
    ...internalSlots,
    frameRow,
    completenessRow,
    relationshipRow,
  ]);
}

function admittedInternalComponentKeys(record, verifiedInternalEvidence, internalRuntimeReceipts) {
  if ((record.presentation?.modeling?.admittedInternalObjectCount ?? 0) <= 0) return [];
  const gates = sourceGates(record, verifiedInternalEvidence, internalRuntimeReceipts);
  return activeRecordRows(record, gates).filter((row) => gates[row.id]?.eligible && row.status === "observed_source_object").map((row) => gates[row.id].componentKey);
}

function summarizeVerifiedIndex(indexState, verifiedInternalEvidence, internalRuntimeReceipts) {
  if (indexState?.status !== "ready" || !Array.isArray(indexState.records)) {
    return Object.freeze({ status: indexState?.status ?? "unavailable", exactRecordCount: 0, supplementalRecordCount: 0, sourceMorphologyRecordCount: 0, supplementalMorphologyRecordCount: 0, admittedInternalObjectCount: 0, fallbackPrimitiveCount: 0 });
  }
  const records = indexState.records;
  const exactIndexRecords = Array.isArray(indexState.index?.records) ? indexState.index.records : records;
  const exactIndexKeys = new Set(exactIndexRecords.map((record) => record.key));
  const supplementalRecords = records.filter((record) => !exactIndexKeys.has(record.key));
  return Object.freeze({
    status: "ready",
    exactRecordCount: exactIndexRecords.length,
    supplementalRecordCount: supplementalRecords.length,
    sourceMorphologyRecordCount: exactIndexRecords.filter((record) => axis(record, "cell_geometry")?.status === "available_exact_source_local").length,
    supplementalMorphologyRecordCount: supplementalRecords.filter((record) => axis(record, "cell_geometry")?.status === "available_exact_source_local").length,
    admittedInternalObjectCount: new Set(records.flatMap((record) => admittedInternalComponentKeys(record, verifiedInternalEvidence, internalRuntimeReceipts))).size,
    fallbackPrimitiveCount: records.reduce((count, record) => count + (record.presentation?.modeling?.generatedFallbackPrimitiveCount ?? 0), 0),
  });
}

export function buildExactRecordDetailCoverage({ indexState, activeRecordState, focus, verifiedInternalEvidence = [], internalRuntimeReceipts = [] }) {
  const indexSummary = summarizeVerifiedIndex(indexState, verifiedInternalEvidence, internalRuntimeReceipts);
  const focusKey = focus?.focusKind && focus?.focusId ? `${focus.focusKind}:${focus.focusId}` : null;
  if (!focusKey) return Object.freeze({ status: "idle", indexSummary, record: null, rows: Object.freeze([]) });
  if (activeRecordState?.status !== "ready" || activeRecordState.requestKey !== focusKey
    || activeRecordState.focusKind !== focus.focusKind || activeRecordState.focusId !== focus.focusId
    || activeRecordState.record?.key !== focusKey || activeRecordState.record?.focusKind !== focus.focusKind
    || activeRecordState.record?.focusId !== focus.focusId) {
    const status = activeRecordState?.status === "verifying" ? "verifying" : "unavailable";
    return Object.freeze({ status, indexSummary, record: null, rows: Object.freeze([]) });
  }
  const record = activeRecordState.record;
  const sharedInternalBoundary = record.gaps?.find((item) => INTERNAL_GAP_AXES.includes(item?.axisId)) ?? null;
  const internalSourceGates = sourceGates(record, verifiedInternalEvidence, internalRuntimeReceipts);
  return Object.freeze({ status: "ready", indexSummary, record, rows: activeRecordRows(record, internalSourceGates), sharedInternalBoundary, internalSourceGates });
}

export { INTERNAL_DETAIL_SLOTS, STATUS_LABELS as INTERNAL_DETAIL_STATUS_LABELS };
