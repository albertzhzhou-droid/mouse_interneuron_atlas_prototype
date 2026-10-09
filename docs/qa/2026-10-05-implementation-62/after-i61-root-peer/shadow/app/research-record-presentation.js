import nativeContourCatalogJson from "../data/neurolucida-native-contour-admission-catalog-0.3.json" with { type: "json" };
import { validateNativeContourAdmissionCatalog } from "./neurolucida-native-contour-admission.js";

export const RESEARCH_RECORD_PRESENTATION_CONTRACT_ID = "research-record-presentation-0.1";

export const RESEARCH_RECORD_PRESENTATION_SECTIONS = Object.freeze([
  "record_identity",
  "record_specific_evidence",
  "shared_source_context",
]);

const RECORD_IDENTITY_LABEL = /(?:source[- ]local label|standardized source label|raw (?:source )?label|putative cell type|canonical transmitter|marker|captured.*count|sampled.*count|figure-reported cell count|percent of captured|geometry receipt|observed swc mode|diameter authority|source identifier|abbreviation|source subclass|project-use class)/i;

const MODELING_AXIS_IDS = Object.freeze([
  "source_record",
  "cell_geometry",
  "internal_structure",
  "atlas_registration",
  "cross_source_same_cell",
]);

const validatedNativeContourCatalog = validateNativeContourAdmissionCatalog(nativeContourCatalogJson);
const NATIVE_CONTOUR_PRESENTATION_BY_ASSET_ID = new Map(
  validatedNativeContourCatalog.records.flatMap((record) => {
    if (!("derivedObject" in record) || !record.derivedObject) return [];
    return [[record.assetId, Object.freeze({
      lineLoopCount: record.admission.admittedContourObjectCount,
      vertexCount: record.admission.admittedVertexCount,
      authority: record.derivedObject.authority,
      sourceLocator: record.derivedObject.path,
    })]];
  }),
);

export const MOLECULAR_COMPLETENESS_SLOT_IDS = Object.freeze([
  "sampling",
  "markers",
  "region",
  "life_stage",
  "transmitter",
  "cell_geometry",
  "internal_structure",
  "provenance",
]);

const MOLECULAR_COMPLETENESS_DEFINITIONS = Object.freeze([
  {
    slotId: "sampling",
    label: "Sampling",
    evidenceLabels: [
      "Exact sampled-nucleus count",
      "Exact sampled-cell count",
      "Exact captured-cell/nucleus count",
      "Exact captured-cell count",
      "Sampled nuclei",
      "Figure-reported cell count",
      "Firing-pattern total",
    ],
    gapAxisIds: ["profile_specific_sampling_denominator"],
  },
  {
    slotId: "markers",
    label: "Markers",
    evidenceLabels: [
      "Source markers",
      "Primary markers",
      "Figure/source markers",
      "Narrative marker panel",
      "Table 8 marker summary",
      "Article marker context",
      "Positive differential features meeting display thresholds",
    ],
    gapAxisIds: [],
  },
  {
    slotId: "region",
    label: "Region",
    evidenceLabels: [
      "Deposited sample-region membership",
      "Spinal and anatomy context",
      "Spatial source context",
      "Spatial-domain context",
      "Region class",
      "DV field coverage",
      "Article spatial context",
    ],
    gapAxisIds: [],
  },
  {
    slotId: "life_stage",
    label: "Life stage",
    evidenceLabels: [
      "Life-stage and preparation",
      "Life-stage scope",
      "Sequencing-cohort age boundary",
    ],
    gapAxisIds: [],
  },
  {
    slotId: "transmitter",
    label: "Transmitter",
    evidenceLabels: ["Canonical transmitter"],
    gapAxisIds: [],
  },
  {
    slotId: "cell_geometry",
    label: "Cell geometry",
    evidenceLabels: [],
    gapAxisIds: ["single_cell_morphology", "morphology", "whole_cell_geometry"],
  },
  {
    slotId: "internal_structure",
    label: "Internal structure",
    evidenceLabels: [],
    gapAxisIds: ["internal_structure"],
  },
  {
    slotId: "provenance",
    label: "Provenance",
    evidenceLabels: ["Canonical parent source"],
    gapAxisIds: [],
  },
]);

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstEvidenceMatch(record, labels) {
  for (const label of labels) {
    const evidenceIndex = record.evidence.findIndex((row) => row.label === label);
    if (evidenceIndex >= 0) return { evidenceIndex, row: record.evidence[evidenceIndex] };
  }
  return null;
}

function firstGapMatch(record, axisIds) {
  for (const axisId of axisIds) {
    const gap = record.gaps.find((item) => item.axisId === axisId);
    if (gap) return gap;
  }
  return null;
}

function fallbackMolecularSlotLocator(record) {
  const locator = record.provenance?.locators?.find((value) => typeof value === "string" && value.length > 0);
  if (locator) return locator;
  const parentSource = record.evidence.find((row) => row.label === "Canonical parent source");
  if (typeof parentSource?.locator === "string" && parentSource.locator.length > 0) return parentSource.locator;
  return `research-record:${record.focusId}`;
}

function rowDeclaresMissing(row) {
  return /^\s*(?:not established|not retained|unavailable|unknown|no exact)\b/i.test(row.value);
}

/**
 * Return the same eight evidence-completeness slots for every molecular record.
 * A slot is never dropped: it points to one exact indexed evidence row, or to an
 * explicit source/project missingness locator with a machine-readable reason.
 */
export function selectMolecularCompletenessSlots(record) {
  if (!isRecord(record)
    || record.focusKind !== "molecular_profile"
    || !Array.isArray(record.evidence)
    || !Array.isArray(record.gaps)) {
    throw new TypeError("Molecular completeness requires one indexed molecular profile");
  }

  return MOLECULAR_COMPLETENESS_DEFINITIONS.map((definition) => {
    const match = firstEvidenceMatch(record, definition.evidenceLabels);
    if (match && !rowDeclaresMissing(match.row)) {
      return {
        slotId: definition.slotId,
        label: definition.label,
        status: "available",
        evidenceIndex: match.evidenceIndex,
        rowLabel: match.row.label,
        value: match.row.value,
        authority: match.row.authority,
        locator: match.row.locator,
        reasonCode: null,
        sourceLocator: null,
        detail: null,
      };
    }

    if (match) {
      return {
        slotId: definition.slotId,
        label: definition.label,
        status: "missing",
        evidenceIndex: match.evidenceIndex,
        rowLabel: match.row.label,
        value: match.row.value,
        authority: match.row.authority,
        locator: null,
        reasonCode: "evidence_row_explicitly_not_established",
        sourceLocator: match.row.locator,
        detail: match.row.value,
      };
    }

    const gap = firstGapMatch(record, definition.gapAxisIds);
    if (gap) {
      return {
        slotId: definition.slotId,
        label: definition.label,
        status: "missing",
        evidenceIndex: null,
        rowLabel: null,
        value: null,
        authority: gap.authority,
        locator: null,
        reasonCode: gap.reasonCode,
        sourceLocator: gap.sourceLocator,
        detail: gap.detail,
      };
    }

    return {
      slotId: definition.slotId,
      label: definition.label,
      status: "missing",
      evidenceIndex: null,
      rowLabel: null,
      value: null,
      authority: "research_record_index",
      locator: null,
      reasonCode: "exact_record_field_not_retained",
      sourceLocator: fallbackMolecularSlotLocator(record),
      detail: `No exact ${definition.label.toLowerCase()} evidence row is retained for this source record; missing is not a biological zero.`,
    };
  });
}

/**
 * Select exact per-record evidence rows while excluding rows that the indexed
 * presentation contract proved byte-for-byte shared inside a source namespace.
 * Identity rows remain included because their locators bind the selected source
 * object (for example the checksum-pinned morphology geometry receipt).
 */
export function selectResearchRecordScopedEvidenceReceipts(record) {
  if (!isRecord(record) || !Array.isArray(record.evidence)) {
    throw new TypeError("Record-scoped evidence requires one indexed research record");
  }
  const partition = record.presentation?.evidencePartition;
  if (!isRecord(partition)
    || !Array.isArray(partition.identityEvidenceIndices)
    || !Array.isArray(partition.recordSpecificEvidenceIndices)) {
    throw new TypeError("Record-scoped evidence requires the indexed evidence presentation partition");
  }
  const indices = [
    ...partition.identityEvidenceIndices,
    ...partition.recordSpecificEvidenceIndices,
  ].sort((left, right) => left - right);
  if (new Set(indices).size !== indices.length
    || indices.some((index) => !Number.isSafeInteger(index) || index < 0 || index >= record.evidence.length)) {
    throw new TypeError("Record-scoped evidence indices are invalid");
  }
  return Object.freeze(indices.map((evidenceIndex) => {
    const row = record.evidence[evidenceIndex];
    if (![row?.label, row?.value, row?.authority, row?.locator]
      .every((value) => typeof value === "string" && value.length > 0)) {
      throw new TypeError("Record-scoped evidence requires exact labeled rows with authority and locator");
    }
    return Object.freeze({
      evidenceIndex,
      label: row.label,
      value: row.value,
      authority: row.authority,
      sourceLocator: row.locator,
    });
  }));
}

/**
 * Native contours are a separate display-object quantity from the one admitted
 * standardized SWC morphology object. They remain source-native LineLoops only;
 * vertex counts are geometry payload quantities, not cells or abundance.
 */
export function selectResearchNativeContourVisualization(record) {
  const unavailable = Object.freeze({
    lineLoopCount: 0,
    vertexCount: 0,
    authority: null,
    sourceLocator: null,
  });
  if (!isRecord(record) || record.focusKind !== "morphology_record") return unavailable;
  const receipt = NATIVE_CONTOUR_PRESENTATION_BY_ASSET_ID.get(record.focusId);
  if (!receipt) return unavailable;
  if (!Number.isSafeInteger(receipt.lineLoopCount) || receipt.lineLoopCount <= 0
    || !Number.isSafeInteger(receipt.vertexCount) || receipt.vertexCount <= 0
    || typeof receipt.authority !== "string" || receipt.authority.length === 0
    || typeof receipt.sourceLocator !== "string" || receipt.sourceLocator.length === 0) {
    throw new TypeError("Native-contour visualization receipt is invalid");
  }
  return receipt;
}

function rowReceipt(row) {
  return JSON.stringify([row?.label ?? null, row?.value ?? null, row?.authority ?? null, row?.locator ?? null]);
}

function siblingRowsByLabel(siblings, label) {
  return siblings.map((sibling) => sibling.evidence.filter((row) => row.label === label));
}

function isExactSharedEvidenceRow(row, siblings) {
  const receipt = rowReceipt(row);
  return siblingRowsByLabel(siblings, row.label)
    .every((rows) => rows.length === 1 && rowReceipt(rows[0]) === receipt);
}

function modelingRoute(record) {
  if (record.focusKind === "morphology_record") return "exact_source_morphology";
  if (record.focusKind === "molecular_profile") return "source_record_evidence_only";
  if (record.focusKind === "sci_entity") return "synthetic_evidence_glyph_not_cell";
  if (record.focusKind === "anatomy_label") return "reference_anatomy_not_cell";
  if (record.focusKind === "sci_population") return "source_population_metadata_only";
  return "coverage_metadata_only";
}

function modelingAxes(record) {
  const hasExactMorphology = record.focusKind === "morphology_record";
  return [
    {
      axisId: "source_record",
      status: "available",
      authority: "checksum_verified_research_index",
      detail: "The selected source-record identity and its attributed evidence are available.",
    },
    {
      axisId: "cell_geometry",
      status: hasExactMorphology ? "available_exact_source_local" : "unavailable",
      authority: hasExactMorphology ? record.coordinate.geometryStatus : "record_missingness_contract",
      detail: hasExactMorphology
        ? "One checksum-gated source-local morphology object is admitted for this exact morphology record."
        : "No same-record cell geometry object is admitted; switching this record must clear prior cell geometry.",
    },
    {
      axisId: "internal_structure",
      status: "unavailable",
      authority: "record_missingness_contract",
      detail: "No same-record nucleus, organelle, membrane, receptor, bouton or synapse geometry is admitted.",
    },
    {
      axisId: "atlas_registration",
      status: "not_established",
      authority: "project_relationship_policy",
      detail: "The selected source record has zero admitted registrations to project anatomy.",
    },
    {
      axisId: "cross_source_same_cell",
      status: "not_established",
      authority: "project_relationship_policy",
      detail: "No co-displayed record is asserted to be the same biological cell.",
    },
  ];
}

export function buildResearchRecordPresentation(records, record) {
  if (!Array.isArray(records) || !isRecord(record) || !Array.isArray(record.evidence) || !Array.isArray(record.gaps)) {
    throw new TypeError("Research record presentation requires an indexed record and its record collection");
  }
  const siblings = records.filter((candidate) => candidate.focusKind === record.focusKind && candidate.namespace === record.namespace);
  if (!siblings.some((candidate) => candidate.key === record.key)) {
    throw new TypeError("Research record presentation target is not present in its record collection");
  }

  const identityEvidenceIndices = [];
  const recordSpecificEvidenceIndices = [];
  const sharedEvidenceIndices = [];
  record.evidence.forEach((row, index) => {
    if (RECORD_IDENTITY_LABEL.test(row.label)) {
      identityEvidenceIndices.push(index);
    } else if (siblings.length > 1 && isExactSharedEvidenceRow(row, siblings)) {
      sharedEvidenceIndices.push(index);
    } else {
      recordSpecificEvidenceIndices.push(index);
    }
  });

  const recordSpecificGapIndices = [];
  const sharedGapIndices = [];
  record.gaps.forEach((item, index) => {
    if (item.scope === "record_specific") recordSpecificGapIndices.push(index);
    else sharedGapIndices.push(index);
  });

  const hasExactMorphology = record.focusKind === "morphology_record";
  return {
    contractId: RESEARCH_RECORD_PRESENTATION_CONTRACT_ID,
    sourceSiblingCount: siblings.length,
    evidencePartition: {
      identityEvidenceIndices,
      recordSpecificEvidenceIndices,
      sharedEvidenceIndices,
    },
    missingnessPartition: {
      recordSpecificGapIndices,
      sharedGapIndices,
    },
    modeling: {
      route: modelingRoute(record),
      admittedCellGeometryObjectCount: hasExactMorphology ? 1 : 0,
      admittedInternalObjectCount: 0,
      generatedFallbackPrimitiveCount: 0,
      registrationCount: 0,
      sameCellJoinCount: 0,
      switchEffect: hasExactMorphology
        ? "replace_with_exact_selected_source_geometry"
        : "clear_prior_cell_geometry_and_replace_source_record_evidence_model",
      noFallbackPrimitive: true,
      axes: modelingAxes(record),
    },
  };
}

export function attachResearchRecordPresentations(records) {
  if (!Array.isArray(records)) throw new TypeError("Research record collection must be an array");
  return records.map((record) => ({
    ...record,
    presentation: buildResearchRecordPresentation(records, record),
  }));
}

function validIndexPartition(partition, length) {
  const flattened = partition.flat();
  return flattened.length === length
    && new Set(flattened).size === length
    && flattened.every((index) => Number.isInteger(index) && index >= 0 && index < length);
}

export function validateResearchRecordPresentation(record) {
  const presentation = record?.presentation;
  if (!isRecord(presentation)
    || presentation.contractId !== RESEARCH_RECORD_PRESENTATION_CONTRACT_ID
    || !Number.isInteger(presentation.sourceSiblingCount)
    || presentation.sourceSiblingCount < 1) {
    throw new Error("Research record presentation identity is invalid");
  }
  const evidencePartition = presentation.evidencePartition;
  const missingnessPartition = presentation.missingnessPartition;
  if (!isRecord(evidencePartition)
    || !validIndexPartition([
      evidencePartition.identityEvidenceIndices,
      evidencePartition.recordSpecificEvidenceIndices,
      evidencePartition.sharedEvidenceIndices,
    ], record.evidence.length)) {
    throw new Error("Research record evidence presentation partition is invalid");
  }
  if (!isRecord(missingnessPartition)
    || !validIndexPartition([
      missingnessPartition.recordSpecificGapIndices,
      missingnessPartition.sharedGapIndices,
    ], record.gaps.length)) {
    throw new Error("Research record missingness presentation partition is invalid");
  }
  const modeling = presentation.modeling;
  const expectedGeometryCount = record.focusKind === "morphology_record" ? 1 : 0;
  if (!isRecord(modeling)
    || modeling.admittedCellGeometryObjectCount !== expectedGeometryCount
    || modeling.admittedInternalObjectCount !== 0
    || modeling.generatedFallbackPrimitiveCount !== 0
    || modeling.registrationCount !== 0
    || modeling.sameCellJoinCount !== 0
    || modeling.noFallbackPrimitive !== true
    || !Array.isArray(modeling.axes)
    || JSON.stringify(modeling.axes.map((axis) => axis.axisId)) !== JSON.stringify(MODELING_AXIS_IDS)
    || modeling.axes.some((axis) => ![axis.status, axis.authority, axis.detail].every((value) => typeof value === "string" && value.length > 0))) {
    throw new Error("Research record modeling presentation is invalid");
  }
  return presentation;
}

export function rowsForPresentationIndices(record, indices) {
  if (!Array.isArray(record?.evidence) || !Array.isArray(indices)) return [];
  return indices.map((index) => record.evidence[index]).filter(Boolean);
}
