import { selectMolecularCompletenessSlots } from "./research-record-presentation.js";

const COMPARISON_SLOTS = Object.freeze(["transmitter", "region", "life_stage"]);
function check(condition, message) { if (!condition) throw new Error(message); }
function freeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) freeze(nested);
  return Object.freeze(value);
}

function slotReceipt(slot) {
  return { status: slot.status, rawValue: slot.value, sourceRowLabel: slot.rowLabel, authority: slot.authority,
    locator: slot.locator ?? slot.sourceLocator, reasonCode: slot.reasonCode, detail: slot.detail };
}

/** Parse only declared display delimiters; never infer markers from source labels. */
function markerStrings(slot) {
  if (slot.status !== "available" || typeof slot.value !== "string") return [];
  const raw = slot.rowLabel === "Table 8 marker summary"
    ? slot.value.split("; ").flatMap((part) => {
      const match = /^(?:main|co-marker [12]) (.+)$/.exec(part);
      return match && !/^(?:not populated|not established|not retained)\b/i.test(match[1]) ? [match[1]] : [];
    })
    : slot.value.split(" · ");
  return [...new Set(raw.filter((value) => value.length > 0))];
}

export function molecularConcordanceProfile(record, { sourceScopes = [] } = {}) {
  check(record?.focusKind === "molecular_profile" && record.key === `molecular_profile:${record.focusId}` && typeof record.namespace === "string", "Concordance requires an exact indexed molecular source profile");
  const slots = selectMolecularCompletenessSlots(record);
  const fields = Object.fromEntries(slots.filter((slot) => COMPARISON_SLOTS.includes(slot.slotId)).map((slot) => [slot.slotId, slotReceipt(slot)]));
  const scope = sourceScopes.find((item) => item.namespace === record.namespace && item.profileIds.includes(record.focusId));
  if (fields.life_stage.status === "missing" && scope?.lifeStage) {
    fields.life_stage = { status: "available", rawValue: scope.lifeStage, sourceRowLabel: "Exact source-taxonomy cohort life stage", authority: "source_taxonomy_cohort_scope",
      locator: scope.lifeStageLocator ?? `${scope.path}#scope/lifeStage`, reasonCode: null, detail: "Source-cohort age context; not a new per-cell age measurement.", sourceReleaseId: scope.releaseId };
  }
  const markers = slots.find((slot) => slot.slotId === "markers");
  const conflicts = record.evidence.filter((row) => /conflict|discrepancy/i.test(row.label) || /quarantined|source_discrepancy/.test(row.authority)).map((row) => ({
    label: row.label, rawValue: row.value, authority: row.authority, locator: row.locator,
  }));
  const conflictGaps = record.gaps.filter((gap) => gap.reasonCode === "unresolved_source_conflict" || gap.reasonCode === "qc_quarantined").map((gap) => ({
    label: gap.label, rawValue: gap.rawValue, authority: gap.authority, locator: gap.sourceLocator, reasonCode: gap.reasonCode, detail: gap.detail,
  }));
  return freeze({ key: record.key, focusId: record.focusId, title: record.title, namespace: record.namespace,
    recordKind: record.recordSemantics?.recordKind ?? "not_retained", unitOfObservation: record.recordSemantics?.unitOfObservation ?? "not_retained",
    identity: "not_established", markers: { ...slotReceipt(markers), exactStrings: markerStrings(markers),
      parsingPolicy: "Exact strings separated only by the retained evidence display delimiter; Table 8 uses explicit main/co-marker fields. No case folding, synonym mapping, label-token inference or gene correction." },
    fields, sourceConflicts: [...conflicts, ...conflictGaps], provenance: record.provenance,
  });
}

export function buildMolecularConcordance(records, { anchorKey, selectedKeys, sourceScopes = [] }) {
  check(Array.isArray(records) && Array.isArray(selectedKeys), "Concordance requires source records and explicit selected keys");
  check(selectedKeys.length >= 2 && selectedKeys.length <= 4 && new Set(selectedKeys).size === selectedKeys.length, "Select 2–4 distinct source profiles");
  check(selectedKeys.includes(anchorKey), "The anchor must be one of the selected exact source profiles");
  const molecular = records.filter((record) => record.focusKind === "molecular_profile");
  check(new Set(molecular.map((record) => record.key)).size === molecular.length, "Molecular source profile keys must remain unique");
  const profiles = selectedKeys.map((key) => {
    const record = molecular.find((item) => item.key === key);
    check(record, `Unknown molecular source profile: ${key}; no default replacement`);
    return molecularConcordanceProfile(record, { sourceScopes });
  });
  const anchor = profiles.find((profile) => profile.key === anchorKey);
  const comparisons = profiles.filter((profile) => profile.key !== anchorKey).map((profile) => {
    const markersKnown = anchor.markers.status === "available" && profile.markers.status === "available"
      && anchor.markers.exactStrings.length > 0 && profile.markers.exactStrings.length > 0;
    const sharedExactStrings = markersKnown ? anchor.markers.exactStrings.filter((value) => profile.markers.exactStrings.includes(value)) : [];
    return {
      anchorKey, comparisonKey: profile.key, relation: "inspection_candidate", identity: "not_established",
      markers: { status: markersKnown ? "exact_string_comparison" : "unknown", sharedExactStrings,
        anchorOnlyStrings: markersKnown ? anchor.markers.exactStrings.filter((value) => !profile.markers.exactStrings.includes(value)) : [],
        comparisonOnlyStrings: markersKnown ? profile.markers.exactStrings.filter((value) => !anchor.markers.exactStrings.includes(value)) : [],
        anchorEvidence: anchor.markers, comparisonEvidence: profile.markers,
        boundary: "Shared displayed strings are source assertions; zero overlap is not absence and overlap does not establish same type, same cell or a diagnostic panel." },
      fields: Object.fromEntries(COMPARISON_SLOTS.map((slot) => [slot, {
        status: anchor.fields[slot].status !== "available" || profile.fields[slot].status !== "available"
          ? "unknown" : anchor.fields[slot].rawValue === profile.fields[slot].rawValue ? "exact_agreement" : "different_source_assertions",
        anchorEvidence: anchor.fields[slot], comparisonEvidence: profile.fields[slot],
        boundary: "Raw source strings are compared without ontology normalization; differing assertions can reflect cohort or vocabulary scope and are not automatically biological contradictions.",
      }])),
      sourceConflicts: { anchor: anchor.sourceConflicts, comparison: profile.sourceConflicts },
    };
  });
  const namespaceCounts = Object.fromEntries([...new Set(molecular.map((record) => record.namespace))].sort().map((namespace) => [namespace, molecular.filter((record) => record.namespace === namespace).length]));
  return freeze({ documentType: "molecular_source_concordance", schemaVersion: "1.0.0", anchorKey, selectedKeys: [...selectedKeys],
    sourceDenominator: { value: molecular.length, unit: "source_profiles", namespaceCounts, deduplicationCount: 0 },
    profiles, comparisons, identity: "not_established", sameCellJoinCount: 0, sameTypeJoinCount: 0, generatedGeometryCount: 0,
    boundary: "One anchor to one or more source-record comparisons; no scalar similarity score, cross-study identity, deduplicated type count, representative morphology or inferred marker evidence.",
  });
}

/** JSON strings inside CSV cells preserve raw text and avoid formula interpretation. */
export function molecularConcordanceCsv(report) {
  check(report?.documentType === "molecular_source_concordance", "CSV export requires a concordance receipt");
  const rows = [["anchor_key", "comparison_key", "dimension", "comparison_status", "anchor_raw_json", "comparison_raw_json", "shared_exact_strings_json", "anchor_evidence_json", "comparison_evidence_json", "identity"]];
  for (const comparison of report.comparisons) {
    rows.push([comparison.anchorKey, comparison.comparisonKey, "marker_strings", comparison.markers.status,
      JSON.stringify(comparison.markers.anchorEvidence.exactStrings), JSON.stringify(comparison.markers.comparisonEvidence.exactStrings), JSON.stringify(comparison.markers.sharedExactStrings),
      JSON.stringify(comparison.markers.anchorEvidence), JSON.stringify(comparison.markers.comparisonEvidence), "not_established"]);
    for (const slot of COMPARISON_SLOTS) {
      const field = comparison.fields[slot];
      rows.push([comparison.anchorKey, comparison.comparisonKey, slot, field.status, JSON.stringify(field.anchorEvidence.rawValue), JSON.stringify(field.comparisonEvidence.rawValue), "[]",
        JSON.stringify(field.anchorEvidence), JSON.stringify(field.comparisonEvidence), "not_established"]);
    }
    rows.push([comparison.anchorKey, comparison.comparisonKey, "source_conflicts", "source_conflicts_preserved", JSON.stringify(comparison.sourceConflicts.anchor), JSON.stringify(comparison.sourceConflicts.comparison), "[]", "{}", "{}", "not_established"]);
  }
  return rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n") + "\r\n";
}
