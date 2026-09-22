import { validateResearchRecordPresentation } from "./research-record-presentation.js";

export const RESEARCH_EXPLORER_BASE = "/data/research_explorer_index_v1/";
export const RESEARCH_EXPLORER_MANIFEST_URL = `${RESEARCH_EXPLORER_BASE}asset-manifest.json`;
export const RESEARCH_EXPLORER_INDEX_URL = `${RESEARCH_EXPLORER_BASE}search-index.json`;

export const RESEARCH_FOCUS_KINDS = Object.freeze([
  "sci_entity",
  "molecular_profile",
  "morphology_record",
  "anatomy_label",
  "sci_population",
  "source_lane",
]);

export const RESEARCH_LABS = Object.freeze(["overview", "types", "sci", "atlas", "morphology", "coverage"]);
export const DEFAULT_RESEARCH_FOCUS = Object.freeze({
  focusKind: "sci_entity",
  focusId: "mouse.sc.vsx2_hoxa10",
});

/**
 * @param {any} record
 * @param {{ sathyamurthyTaxonomy?: any, alkaslasiTaxonomy?: any }} [options]
 */
export function resolveMolecularRecordLifeStage(record, {
  sathyamurthyTaxonomy = null,
  alkaslasiTaxonomy = null,
} = {}) {
  const evidence = Array.isArray(record?.evidence) ? record.evidence : [];
  const evidenceValue = (label) => evidence.find((row) => row?.label === label)?.value ?? null;
  const recordEvidence = evidenceValue("Life-stage scope");
  if (typeof recordEvidence === "string" && recordEvidence.trim()) return recordEvidence;
  const functionalProfileEvidence = evidenceValue("Life-stage and preparation");
  if (typeof functionalProfileEvidence === "string" && functionalProfileEvidence.trim()) return functionalProfileEvidence;

  if (
    record?.namespace === "sathyamurthy-2018"
    && Array.isArray(sathyamurthyTaxonomy?.profiles)
    && sathyamurthyTaxonomy.profiles.some((profile) => profile?.id === record.focusId)
    && typeof sathyamurthyTaxonomy?.scope?.lifeStage === "string"
    && sathyamurthyTaxonomy.scope.lifeStage.trim()
  ) {
    return sathyamurthyTaxonomy.scope.lifeStage;
  }

  if (record?.namespace === "alkaslasi-2021:GSE167597" && Array.isArray(alkaslasiTaxonomy?.profiles)) {
    const sourceProfile = alkaslasiTaxonomy.profiles.find((profile) => profile?.id === record.focusId);
    if (typeof sourceProfile?.lifeStage === "string" && sourceProfile.lifeStage.trim()) {
      return sourceProfile.lifeStage;
    }
  }

  const subtitleLifeStage = typeof record?.subtitle === "string"
    ? record.subtitle.match(/\b(?:adult|P\d+(?:[–-]P?\d+)?)\b/i)?.[0] ?? null
    : null;
  if (subtitleLifeStage) return subtitleLifeStage;

  const matrixAge = evidenceValue("Matrix age cell-column summary");
  return typeof matrixAge === "string" && matrixAge.trim()
    ? matrixAge
    : "Life stage not retained in this exact record";
}

export const RESEARCH_EXPLORER_EXPECTED_COUNTS = Object.freeze({
  anatomy_label: 73,
  molecular_profile: 387,
  morphology_record: 149,
  sci_entity: 7,
  sci_population: 17,
  source_lane: 8,
});
export const RESEARCH_EXPLORER_EXPECTED_TOTAL = Object.values(RESEARCH_EXPLORER_EXPECTED_COUNTS)
  .reduce((total, count) => total + count, 0);
export const RESEARCH_EXPLORER_EXPECTED_SOURCE_FILE_COUNT = 21;

export const RESEARCH_MISSINGNESS_REASON_CODES = Object.freeze([
  "source_not_reported",
  "source_schema_no_field",
  "repository_object_unavailable",
  "not_measured_by_study",
  "not_ingested",
  "relationship_not_established",
  "no_admitted_transform",
  "qc_quarantined",
  "rights_not_cleared",
  "unresolved_source_conflict",
  "not_applicable",
]);

const RESEARCH_MISSINGNESS_STATUSES = Object.freeze(["unavailable", "not_measured", "not_ingested", "not_established", "quarantined", "unresolved", "not_applicable"]);
const RESEARCH_MISSINGNESS_SCOPES = Object.freeze(["record_specific", "shared_dataset_limit", "shared_project_limit"]);

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyStrings(values) {
  return Array.isArray(values) && values.every((value) => typeof value === "string" && value.length > 0);
}

export async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}

let cachedResearchExplorerIndex = null;
let cachedResearchExplorerIndexPromise = null;

function abortError() {
  return new DOMException("The Research Explorer request was aborted", "AbortError");
}

function awaitWithAbort(promise, signal) {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(abortError());
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(abortError());
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
}

async function fetchVerifiedResearchExplorerIndex(fetchImpl, signal) {
  const manifestResponse = await fetchImpl(RESEARCH_EXPLORER_MANIFEST_URL, { signal });
  if (!manifestResponse.ok) throw new Error(`Research index manifest request failed (${manifestResponse.status})`);
  const manifest = validateResearchExplorerManifest(await manifestResponse.json());
  const indexResponse = await fetchImpl(RESEARCH_EXPLORER_INDEX_URL, { signal });
  if (!indexResponse.ok) throw new Error(`Research index request failed (${indexResponse.status})`);
  const bytes = await indexResponse.arrayBuffer();
  const actualSha256 = await sha256Hex(bytes);
  if (actualSha256 !== manifest.index.sha256) throw new Error("Research index checksum does not match the pinned manifest");
  return validateResearchExplorerIndex(JSON.parse(new TextDecoder().decode(bytes)), manifest);
}

export async function loadVerifiedResearchExplorerIndex({
  fetchImpl = globalThis.fetch,
  signal,
} = {}) {
  if (typeof fetchImpl !== "function") throw new Error("Research Explorer fetch is unavailable");
  const useSharedBrowserCache = fetchImpl === globalThis.fetch;
  if (!useSharedBrowserCache) return fetchVerifiedResearchExplorerIndex(fetchImpl, signal);
  if (cachedResearchExplorerIndex) return awaitWithAbort(Promise.resolve(cachedResearchExplorerIndex), signal);
  if (!cachedResearchExplorerIndexPromise) {
    cachedResearchExplorerIndexPromise = fetchVerifiedResearchExplorerIndex(fetchImpl, undefined)
      .then((index) => {
        cachedResearchExplorerIndex = index;
        return index;
      })
      .catch((error) => {
        cachedResearchExplorerIndexPromise = null;
        throw error;
      });
  }
  return awaitWithAbort(cachedResearchExplorerIndexPromise, signal);
}

export function validateResearchExplorerManifest(manifest) {
  if (!isRecord(manifest) || manifest.schemaVersion !== "1.13.0" || manifest.assetSetId !== "ohri:research-explorer-index:1.13.0") {
    throw new Error("Research Explorer manifest identity is invalid");
  }
  if (!isRecord(manifest.index) || manifest.index.path !== "search-index.json" || !/^[a-f0-9]{64}$/.test(manifest.index.sha256)) {
    throw new Error("Research Explorer index declaration is invalid");
  }
  if (manifest.index.recordCount !== RESEARCH_EXPLORER_EXPECTED_TOTAL || manifest.expectedCounts?.total !== RESEARCH_EXPLORER_EXPECTED_TOTAL) {
    throw new Error("Research Explorer record denominator is invalid");
  }
  for (const [kind, count] of Object.entries(RESEARCH_EXPLORER_EXPECTED_COUNTS)) {
    if (manifest.expectedCounts?.byFocusKind?.[kind] !== count) throw new Error(`Research Explorer ${kind} denominator is invalid`);
  }
  if (!Array.isArray(manifest.sourceFiles) || manifest.sourceFiles.length !== RESEARCH_EXPLORER_EXPECTED_SOURCE_FILE_COUNT) {
    throw new Error("Research Explorer source-file inventory is invalid");
  }
  for (const source of manifest.sourceFiles) {
    if (!isRecord(source) || typeof source.path !== "string" || !Number.isInteger(source.bytes) || source.bytes <= 0 || !/^[a-f0-9]{64}$/.test(source.sha256)) {
      throw new Error("Research Explorer source-file identity is invalid");
    }
  }
  return manifest;
}

export function validateResearchExplorerIndex(payload, manifest = null) {
  if (!isRecord(payload) || payload.schemaVersion !== "1.13.0" || payload.assetSetId !== "ohri:research-explorer-index:1.13.0") {
    throw new Error("Research Explorer index identity is invalid");
  }
  if (manifest && (manifest.assetSetId !== payload.assetSetId || manifest.index.recordCount !== payload.records?.length)) {
    throw new Error("Research Explorer manifest and index do not match");
  }
  if (!isRecord(payload.scientificPolicy)
    || payload.scientificPolicy.groupingUnit !== "source_record_namespace"
    || payload.scientificPolicy.crossSourceIdentityDefault !== "not_established"
    || payload.scientificPolicy.searchCreatesRelationship !== false
    || payload.scientificPolicy.registrationCount !== 0
    || payload.scientificPolicy.missingIsBiologicalAbsence !== false
    || payload.scientificPolicy.recordDenominatorsAreHarmonized !== false
    || payload.scientificPolicy.morphologyMembership?.frozenCensusRecordCount !== 142
    || payload.scientificPolicy.morphologyMembership?.supplementaryRecordCount !== 7
    || payload.scientificPolicy.morphologyMembership?.viewableMorphologyRecordCount !== 149
    || payload.scientificPolicy.morphologyMembership?.supplementaryIsCensus !== false
    || payload.scientificPolicy.missingnessContract?.schemaVersion !== "1.0.0"
    || payload.scientificPolicy.missingnessContract?.inferenceAllowed !== false
    || JSON.stringify(payload.scientificPolicy.missingnessContract?.reasonCodes) !== JSON.stringify(RESEARCH_MISSINGNESS_REASON_CODES)
    || payload.scientificPolicy.presentationContract?.contractId !== "research-record-presentation-0.1"
    || payload.scientificPolicy.presentationContract?.molecularSwitchEffect !== "clear_prior_cell_geometry_and_replace_source_record_evidence_model"
    || payload.scientificPolicy.presentationContract?.generatedFallbackPrimitiveCount !== 0) {
    throw new Error("Research Explorer scientific policy is invalid");
  }
  if (!Array.isArray(payload.records) || payload.records.length !== RESEARCH_EXPLORER_EXPECTED_TOTAL || payload.counts?.total !== RESEARCH_EXPLORER_EXPECTED_TOTAL) {
    throw new Error("Research Explorer record count is invalid");
  }
  const keys = new Set();
  const counts = Object.fromEntries(RESEARCH_FOCUS_KINDS.map((kind) => [kind, 0]));
  for (const record of payload.records) {
    if (!isRecord(record) || !RESEARCH_FOCUS_KINDS.includes(record.focusKind) || typeof record.focusId !== "string" || !record.focusId) {
      throw new Error("Research Explorer focus identity is invalid");
    }
    if (record.key !== `${record.focusKind}:${record.focusId}` || keys.has(record.key)) {
      throw new Error("Research Explorer focus keys must be unique and canonical");
    }
    keys.add(record.key);
    counts[record.focusKind] += 1;
    if (![record.title, record.subtitle, record.namespace, record.laneLabel, record.summary, record.boundary].every((value) => typeof value === "string" && value.length > 0)) {
      throw new Error(`Research Explorer ${record.key} text contract is invalid`);
    }
    if (!hasOnlyStrings(record.searchTerms) || !record.searchTerms.includes(record.title.trim()) || !record.searchTerms.includes(record.namespace)) {
      throw new Error(`Research Explorer ${record.key} search terms are invalid`);
    }
    if (!Array.isArray(record.evidence) || !Array.isArray(record.gaps) || !isRecord(record.provenance)) {
      throw new Error(`Research Explorer ${record.key} dossier fields are invalid`);
    }
    for (const gap of record.gaps) {
      if (!isRecord(gap)
        || typeof gap.axisId !== "string" || !/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(gap.axisId)
        || typeof gap.label !== "string" || gap.label.length === 0
        || !RESEARCH_MISSINGNESS_STATUSES.includes(gap.status)
        || !RESEARCH_MISSINGNESS_REASON_CODES.includes(gap.reasonCode)
        || !RESEARCH_MISSINGNESS_SCOPES.includes(gap.scope)
        || typeof gap.authority !== "string" || gap.authority.length === 0
        || typeof gap.sourceLocator !== "string" || gap.sourceLocator.length === 0
        || !(typeof gap.rawValue === "string" || gap.rawValue === null)
        || typeof gap.detail !== "string" || gap.detail.length === 0
        || gap.inferenceAllowed !== false) {
        throw new Error(`Research Explorer ${record.key} structured missingness is invalid`);
      }
    }
    if (!isRecord(record.coordinate) || record.coordinate.registrationCount !== 0 || record.relationshipStatus !== "not_established_outside_this_source_record") {
      throw new Error(`Research Explorer ${record.key} relationship boundary is invalid`);
    }
    if (record.focusKind === "molecular_profile") {
      const semantics = record.recordSemantics;
      if (!isRecord(semantics)
        || !/^SRC-[A-Z0-9-]+$/.test(semantics.parentSourceId ?? "")
        || ![semantics.recordKind, semantics.unitOfObservation, semantics.assignmentAuthority, semantics.cellRosterAvailability].every((value) => typeof value === "string" && value.length > 0)
        || semantics.canonicalIdentityStatus !== "not_established") {
        throw new Error(`Research Explorer ${record.key} record granularity is invalid`);
      }
      const transmitterRows = record.evidence.filter((row) => row?.label === "Canonical transmitter");
      if (transmitterRows.length !== 1
        || ![transmitterRows[0].value, transmitterRows[0].authority, transmitterRows[0].locator].every((value) => typeof value === "string" && value.length > 0)) {
        throw new Error(`Research Explorer ${record.key} canonical transmitter evidence is invalid`);
      }
      const internalStructureGaps = record.gaps.filter((gap) => gap?.axisId === "internal_structure" && gap?.label === "Internal structure");
      if (internalStructureGaps.length !== 1 || internalStructureGaps[0].inferenceAllowed !== false) {
        throw new Error(`Research Explorer ${record.key} internal-structure missingness is invalid`);
      }
    }
    if (record.focusKind === "morphology_record") {
      const membership = record.morphologyMembership;
      const isCensus = membership?.collection === "census";
      const isSupplementary = membership?.collection === "supplementary";
      if (!isRecord(membership)
        || (!isCensus && !isSupplementary)
        || membership.censusContribution !== (isCensus ? 1 : 0)
        || membership.supplementaryContribution !== (isSupplementary ? 1 : 0)
        || typeof membership.sourceFrameLocator !== "string"
        || typeof membership.analysisLocator !== "string"
        || typeof membership.geometryPath !== "string"
        || !/^[a-f0-9]{64}$/.test(membership.geometrySha256)
        || (isSupplementary && (![membership.routeId, membership.routeContractPath, membership.routeContractSha256, membership.routeAssetManifestPath, membership.routeAssetManifestSha256].every((value) => typeof value === "string" && value.length > 0)))) {
        throw new Error(`Research Explorer ${record.key} morphology membership is invalid`);
      }
    }
    if (!isRecord(record.navigation) || !RESEARCH_LABS.includes(record.navigation.lab) || !isRecord(record.navigation.params)) {
      throw new Error(`Research Explorer ${record.key} navigation is invalid`);
    }
    if (!Object.values(record.navigation.params).every((value) => typeof value === "string")) {
      throw new Error(`Research Explorer ${record.key} navigation parameters are invalid`);
    }
    try {
      validateResearchRecordPresentation(record);
    } catch (error) {
      throw new Error(`Research Explorer ${record.key} presentation is invalid: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  for (const [kind, expected] of Object.entries(RESEARCH_EXPLORER_EXPECTED_COUNTS)) {
    if (counts[kind] !== expected || payload.counts.byFocusKind?.[kind] !== expected) {
      throw new Error(`Research Explorer ${kind} count is invalid`);
    }
  }
  return payload;
}

export function findResearchRecord(records, focusKind, focusId) {
  if (!RESEARCH_FOCUS_KINDS.includes(focusKind) || typeof focusId !== "string" || !focusId) return null;
  return records.find((record) => record.focusKind === focusKind && record.focusId === focusId) ?? null;
}

const MOLECULAR_EVIDENCE_PREVIEW_LABELS_BY_NAMESPACE = Object.freeze({
  "cano-gomez-2026:GSE318731": Object.freeze([
    "Source-local label",
    "Exact sampled-nucleus count",
    "Source context counts",
    "Profile roster receipt",
  ]),
  "alkaslasi-2021:GSE167597": Object.freeze([
    "Source-local label",
    "Exact sampled-nucleus count",
    "Figure 5a prominent labels",
    "Article marker context",
    "Deposited sample-region membership",
  ]),
  "crozat-2025:figshare-29430869-v2": Object.freeze([
    "Source markers",
    "Electrophysiology evidence",
    "Firing-pattern total",
    "Spinal and anatomy context",
  ]),
  "delile-2019:E-MTAB-7320": Object.freeze([
    "Source-local label",
    "Source cardinal class",
    "Exact sampled-cell count",
    "Fine-subtype timepoint cell counts",
    "Percent of fine-subtype denominator",
    "DV field coverage",
    "Pseudotime field coverage",
  ]),
  "haring-2018:GSE103840": Object.freeze([
    "Standardized source label",
    "Exact sampled-cell count",
    "Table 8 marker summary",
    "Table 5 identification rule",
    "Deposited raw cluster label",
  ]),
  "hayashi-2018:GSE108788": Object.freeze([
    "Source-local label",
    "Figure-reported cell count",
    "Narrative marker panel",
    "Spatial-domain context",
    "Rostrocaudal context",
  ]),
  "iglesias-gonzalez-2021:gse185731:mmusculus": Object.freeze([
    "Source-local label",
    "Exact sampled-cell count",
    "Source markers",
    "Temporal context",
  ]),
  "roome-2026:GSE291462": Object.freeze([
    "Source-local label",
    "Exact captured-cell count",
    "Percent of captured dIL denominator",
    "Positive differential features meeting display thresholds",
    "Mean genes per cell",
    "Mean silhouette score",
    "Mean LISI score",
    "3D and internal model state",
  ]),
  "russ-2021": Object.freeze([
    "Source-local label",
    "Primary markers",
    "Region class",
    "Transmitter class",
  ]),
  "sathyamurthy-2018": Object.freeze([
    "Source-local label",
    "Sampled nuclei",
    "Figure/source markers",
    "Putative cell type",
  ]),
});

const RESEARCH_EVIDENCE_PREVIEW_LABELS = Object.freeze({
  molecular_profile: Object.freeze([
    "Source-local label",
    "Standardized source label",
    "Exact sampled-nucleus count",
    "Exact sampled-cell count",
    "Exact captured-cell count",
    "Sampled nuclei",
    "Figure-reported cell count",
    "Primary markers",
    "Figure/source markers",
    "Source markers",
  ]),
  morphology_record: Object.freeze([
    "Geometry receipt",
    "Observed SWC mode",
    "Diameter authority",
    "Radius-derived surface",
    "Same-specimen internal structure",
  ]),
  anatomy_label: Object.freeze([
    "Source identifier",
    "Semantic lane",
    "Source hierarchy",
    "Sampled planes present",
    "Full-volume source voxels",
  ]),
  sci_population: Object.freeze([
    "Annotation method",
    "Captured neuronal nuclei",
    "Source sample frame",
    "Project-use class",
  ]),
  source_lane: Object.freeze([
    "Source role",
    "Sample frame",
    "Direct axes",
    "Contextual axes",
  ]),
  sci_entity: Object.freeze([]),
});

export function selectResearchEvidencePreviewRows(record, limit = 4) {
  if (!isRecord(record) || !RESEARCH_FOCUS_KINDS.includes(record.focusKind) || !Array.isArray(record.evidence)) return [];
  if (!Number.isInteger(limit) || limit < 1 || limit > 8) throw new Error("Research evidence preview limit must be an integer from 1 to 8");
  const rowsByLabel = new Map(record.evidence.map((row) => [row?.label, row]));
  const labels = record.focusKind === "molecular_profile"
    ? MOLECULAR_EVIDENCE_PREVIEW_LABELS_BY_NAMESPACE[record.namespace] ?? RESEARCH_EVIDENCE_PREVIEW_LABELS.molecular_profile
    : RESEARCH_EVIDENCE_PREVIEW_LABELS[record.focusKind] ?? [];
  const preferred = labels
    .map((label) => rowsByLabel.get(label))
    .filter((row) => isRecord(row));
  const preferredKeys = new Set(preferred.map((row) => `${row.label}\u0000${row.locator}`));
  const fallback = record.evidence.filter((row) => isRecord(row) && !preferredKeys.has(`${row.label}\u0000${row.locator}`));
  const selected = [...preferred, ...fallback];
  return selected.slice(0, limit);
}

export function researchLabForFocus(focusKind) {
  if (focusKind === "molecular_profile") return "types";
  if (focusKind === "sci_population") return "sci";
  if (focusKind === "morphology_record") return "morphology";
  if (focusKind === "anatomy_label") return "atlas";
  if (focusKind === "source_lane") return "coverage";
  return "overview";
}

export function parseResearchFocus(params, records = null) {
  const read = (key) => typeof params?.get === "function" ? params.get(key) : params?.[key] ?? null;
  const canonicalKind = read("focusKind");
  const canonicalId = read("focusId");
  if (canonicalKind !== null || canonicalId !== null) {
    if (!RESEARCH_FOCUS_KINDS.includes(canonicalKind) || typeof canonicalId !== "string" || !canonicalId) return null;
    if (records && !findResearchRecord(records, canonicalKind, canonicalId)) return null;
    return { focusKind: canonicalKind, focusId: canonicalId };
  }

  const typeId = read("type");
  if (typeId) return records && !findResearchRecord(records, "molecular_profile", typeId) ? null : { focusKind: "molecular_profile", focusId: typeId };
  const morphologyId = read("morphologyNeuron");
  if (/^[1-9][0-9]*$/.test(morphologyId ?? "")) {
    const focus = { focusKind: "morphology_record", focusId: `NeuroMorpho:${morphologyId}` };
    return records && !findResearchRecord(records, focus.focusKind, focus.focusId) ? null : focus;
  }
  const anatomyId = read("anatomyStructure");
  if (/^[1-9][0-9]*$/.test(anatomyId ?? "") && records) {
    const matches = records.filter((record) => record.focusKind === "anatomy_label" && record.focusId.endsWith(`:${anatomyId}`));
    return matches.length === 1 ? { focusKind: matches[0].focusKind, focusId: matches[0].focusId } : null;
  }
  const coverageLane = read("coverageLane");
  if (coverageLane) return records && !findResearchRecord(records, "source_lane", coverageLane) ? null : { focusKind: "source_lane", focusId: coverageLane };
  const cellId = read("cell");
  if (cellId) return records && !findResearchRecord(records, "sci_entity", cellId) ? null : { focusKind: "sci_entity", focusId: cellId };
  return null;
}

export function serializeResearchFocus(params, focus) {
  const next = new URLSearchParams(params);
  if (!focus || !RESEARCH_FOCUS_KINDS.includes(focus.focusKind) || !focus.focusId) {
    next.delete("focusKind");
    next.delete("focusId");
    return next;
  }
  next.set("focusKind", focus.focusKind);
  next.set("focusId", focus.focusId);
  return next;
}

function normalizedSearchText(record) {
  return record.searchTerms.join(" ").toLocaleLowerCase("en");
}

export function searchResearchRecords(records, query) {
  const normalized = String(query ?? "").trim().toLocaleLowerCase("en");
  if (!normalized) return records.map((record) => ({ record, score: 0 }));
  const terms = normalized.split(/\s+/).filter(Boolean);
  return records.flatMap((record) => {
    const id = record.focusId.toLocaleLowerCase("en");
    const title = record.title.toLocaleLowerCase("en");
    const namespace = record.namespace.toLocaleLowerCase("en");
    const text = normalizedSearchText(record);
    if (!terms.every((term) => text.includes(term) || id.includes(term))) return [];
    const score = id === normalized
      ? 400
      : title === normalized
        ? 350
        : id.startsWith(normalized)
          ? 300
          : title.startsWith(normalized)
            ? 250
            : namespace.startsWith(normalized)
              ? 180
              : 100;
    return [{ record, score }];
  }).sort((a, b) => b.score - a.score
    || a.record.namespace.localeCompare(b.record.namespace)
    || a.record.title.localeCompare(b.record.title)
    || a.record.focusId.localeCompare(b.record.focusId));
}

export function groupResearchResults(results) {
  const groups = new Map();
  for (const result of results) {
    const key = `${result.record.laneLabel}|||${result.record.namespace}`;
    if (!groups.has(key)) groups.set(key, { laneLabel: result.record.laneLabel, namespace: result.record.namespace, results: [] });
    groups.get(key).results.push(result);
  }
  return [...groups.values()].sort((a, b) => a.laneLabel.localeCompare(b.laneLabel) || a.namespace.localeCompare(b.namespace));
}

export function includeSelectedResearchGroup(groups, selectedRecord, limit = 8) {
  const initial = groups.slice(0, limit);
  if (!selectedRecord) return initial;
  const selectedKey = `${selectedRecord.laneLabel}|||${selectedRecord.namespace}`;
  const groupKey = (group) => `${group.laneLabel}|||${group.namespace}`;
  if (initial.some((group) => groupKey(group) === selectedKey)) return initial;
  const selectedGroup = groups.find((group) => groupKey(group) === selectedKey);
  return selectedGroup ? [...initial, selectedGroup] : initial;
}
