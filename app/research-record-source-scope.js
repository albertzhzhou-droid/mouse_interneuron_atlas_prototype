import { deriveResearchMorphologyRenderingPolicy, researchEvidenceDisplayLabel } from "./research-morphology-rendering-policy.js";

const REGISTRY_PATH = "data/research-source-registry-0.1.json";
const MVP_PATH = "data/research-mvp-release-0.2.json";
const INDEX_PATH = "public/data/research_explorer_index_v1/search-index.json";
const TODD_PATH = "data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json";
const nonempty = (value) => typeof value === "string" && value.trim().length > 0;
const check = (value, message) => { if (!value) throw new Error(`Research record scope: ${message}`); };
const clone = (value) => structuredClone(value);
const frozen = (value) => { if (value && typeof value === "object") { Object.values(value).forEach(frozen); Object.freeze(value); } return value; };

function currentRecord(record, collection) {
  check(record && record.key === `${record.focusKind}:${record.focusId}` && nonempty(record.namespace), "canonical record identity is required");
  const found = collection?.filter((item) => item.key === record.key) ?? [];
  check(found.length === 1 && JSON.stringify(found[0]) === JSON.stringify(record), "record is absent, changed or ambiguous in the current verified collection");
  check(Array.isArray(record.evidence) && Array.isArray(record.gaps), "evidence and explicit missingness are required");
  return found[0];
}

function resolveParent(record, registry) {
  check(nonempty(registry?.releaseId) && registry.sourceCount === registry.sources?.length, "current canonical source registry is required");
  check(new Set(registry.sources.map((source) => source.id)).size === registry.sources.length, "canonical source IDs must be unique");
  const exact = (token) => registry.sources.filter((source) => source.id === token || source.aliases.includes(token));
  let matches = [], method = null;
  if (record.recordSemantics?.parentSourceId) {
    matches = exact(record.recordSemantics.parentSourceId); method = "explicit_record_parent";
    const namespaceMatches = exact(record.namespace);
    check(namespaceMatches.every((source) => source.id === record.recordSemantics.parentSourceId), "explicit parent contradicts the exact namespace binding");
  } else if (record.focusKind === "morphology_record" && record.namespace === "neuromorpho:8.6.126:Todd") {
    check(record.morphologyMembership?.collection === "supplementary" && record.morphologyMembership.censusContribution === 0
      && record.morphologyMembership.routeContractPath === TODD_PATH, "Todd release context requires its separate current source-route contract");
    matches = exact("SRC-NEUROMORPHO-8-6-126-TODD-NTS"); method = "exact_source_route_contract";
  } else if (record.focusKind === "morphology_record" && /^neuromorpho:(Bannatyne|Chen_Dai|Hughes|Todd)$/.test(record.namespace)) {
    check(["census", "supplementary"].includes(record.morphologyMembership?.collection)
      && nonempty(record.morphologyMembership.sourceFrameLocator), "frozen morphology membership is required");
    matches = exact("SRC-NEUROMORPHO-8-6-124"); method = "frozen_index_morphology_membership";
  } else if (record.focusKind === "anatomy_label" && /^allen_cord_20um:3\.0:(interneuron-focused_reference|motor-neuron_context|structural_context)$/.test(record.namespace)) {
    matches = exact("allen_cord_20um:3.0"); method = "exact_atlas_release_namespace";
  } else if (record.focusKind === "sci_entity") {
    const paperIds = record.provenance.locators.filter((locator) => /^P\d+$/.test(locator));
    matches = paperIds.flatMap(exact); method = "exact_curated_paper_identifier";
  } else {
    matches = exact(record.namespace);
    if (matches.length === 0 && record.focusKind === "source_lane") matches = exact(record.focusId);
    method = "exact_source_alias";
  }
  check(matches.length <= 1, "source context is ambiguous; no source was selected");
  if (record.recordSemantics?.parentSourceId) check(matches.length === 1, "declared parent is unavailable; no DOI or label substitute is permitted");
  return { source: matches[0] ?? null, method: matches.length ? method : null };
}

function recordLocation(record, baseIndex) {
  const index = baseIndex?.records?.findIndex((item) => item.key === record.key) ?? -1;
  if (index >= 0) {
    check(JSON.stringify(baseIndex.records[index]) === JSON.stringify(record), "base-index record changed after verification");
    return { path: INDEX_PATH, pointer: `/records/${index}`, releaseId: baseIndex.assetSetId, status: "indexed_project_derivative_field" };
  }
  if (record.namespace === "neuromorpho:Hughes" && record.morphologyMembership?.routeContractPath === "data/pv-independent-morphology-routes-0.1.json") {
    return { path: "app/pv-independent-research-records.js", pointer: `key=${encodeURIComponent(record.key)}`, releaseId: "ohri-pv-independent-morphology-routes-0.1.0", contractSha256: record.morphologyMembership.routeContractSha256, status: "runtime_materialized_source_route_record", sourceContract: record.morphologyMembership.routeContractPath };
  }
  check(record.namespace === "neuromorpho:8.6.126:Todd" && record.morphologyMembership?.routeContractPath === TODD_PATH,
    "no exact materialization locator is retained for this record");
  return { path: "app/research-supplemental-morphology-records.js", pointer: `buildRoutePackRecords()/key=${encodeURIComponent(record.key)}`,
    releaseId: "ohri-neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.0", contractSha256: record.morphologyMembership.routeContractSha256,
    status: "runtime_materialized_source_route_record", sourceContract: TODD_PATH };
}

function upstreamLocatorStatus(locator) {
  if (/^[a-f0-9]{64}$/i.test(locator)) return "integrity_reference_only";
  if (/^(?:https?:\/\/|10\.\d{4,9}\/|P\d+$|UPG-\d+$|\d{4}-\d{2}-\d{2}$)/.test(locator)) return "source_or_project_level_reference";
  if (/^NeuroMorpho:\d+$/.test(locator)) return "source_object_reference_without_field";
  if (/(?:![A-Z]+\d|#.+|\b(?:Fig\.?|Figure|Table|Sheet|row|column|Methods|Results|Dataset)\b)/i.test(locator)) return "retained_field_or_section_locator";
  return "retained_locator_requires_source_resolution";
}

const DISPLAY_UNITS = {
  molecular_profile: "source_profile_aggregate", morphology_record: "source_reconstruction_record",
  anatomy_label: "source_annotation_label", sci_entity: "source_bounded_evidence_entity",
  sci_population: "source_defined_population", source_lane: "source_dataset_coverage_record",
};

/** Canonical study context is kept separate from exact record values and physical identity. */
export function deriveResearchRecordSourceScope({ record, collection, baseIndex, registry, mvp }) {
  record = currentRecord(record, collection);
  const location = recordLocation(record, baseIndex), { source, method } = resolveParent(record, registry);
  check(DISPLAY_UNITS[record.focusKind], "unsupported display record unit");
  const sourceIndex = source ? registry.sources.indexOf(source) : -1;
  const sourcePointer = source ? `${REGISTRY_PATH}#/sources/${sourceIndex}` : null;
  const scopes = (name, valueField) => source ? source[name].map((item, index) => ({
    value: item[valueField] ?? null, status: item[valueField] == null ? "not_retained" : "source_context_only",
    context: item.context, authority: item.authority, missingReason: item.missingReason ?? null,
    locator: `${sourcePointer}/${name}/${index}/${valueField}`,
  })) : [];
  const experimentalUnits = source ? source.experimentalUnits.map((item, index) => ({
    ...clone(item), status: item.count === null ? "not_retained" : "source_context_only",
    locator: `${sourcePointer}/experimentalUnits/${index}`, pooledWithOtherUnits: false,
  })) : [];
  for (const unit of experimentalUnits) check(unit.count === null ? nonempty(unit.missingReason) : Number.isSafeInteger(unit.count) && unit.count >= 0,
    "a source denominator must be an explicit integer or null with a reason");
  const conditions = [];
  if (record.focusKind === "sci_entity") {
    check(source && Array.isArray(mvp?.conditions), "exact SCI source and condition contract are required");
    for (const id of record.provenance.locators.filter((locator) => locator.startsWith("CND-"))) {
      const found = mvp.conditions.filter((condition) => condition.id === id);
      check(found.length === 1 && source.aliases.includes(found[0].sourceId), "SCI condition is unavailable or belongs to another source");
      const condition = found[0], index = mvp.conditions.indexOf(condition);
      conditions.push({ ...clone(condition), locator: `${MVP_PATH}#/conditions/${index}`, authority: "project_evidence_extraction",
        canonicalParentSourceId: source.id, denominatorPoolingAllowed: false,
        fieldLocators: Object.fromEntries(Object.keys(condition).map((key) => [key, `${MVP_PATH}#/conditions/${index}/${key}`])) });
    }
  }
  const fieldLocators = record.evidence.map((row, index) => {
    check([row.label, row.value, row.authority, row.locator].every(nonempty), "evidence field or locator is invalid");
    return { index, ...clone(row), projectFieldLocator: `${location.path}#${location.pointer}/evidence/${index}`,
      materializationStatus: location.status, upstreamLocatorStatus: upstreamLocatorStatus(row.locator),
      biologicalTruthVerifiedByHash: false };
  });
  return frozen({ documentType: "research_record_source_scope", schemaVersion: "0.2.0",
    recordKey: record.key, namespace: record.namespace, focusKind: record.focusKind, focusId: record.focusId,
    recordLocation: location, displayUnit: DISPLAY_UNITS[record.focusKind], underlyingObservationUnit: record.recordSemantics?.unitOfObservation ?? null,
    registryReleaseId: registry.releaseId, sourceId: source?.id ?? null, sourceResolution: source ? method : "not_established",
    sourceLocator: sourcePointer, sourceMissingReason: source ? null : "No exact parent or source alias is retained; labels and DOI are not used to select a substitute.",
    species: scopes("speciesScopes", "scientificName"), lifeStages: scopes("lifeStageScopes", "value"), regions: scopes("regionScopes", "value"),
    experimentalUnits, conditions, fieldLocators, gaps: clone(record.gaps),
    renderingPolicy: deriveResearchMorphologyRenderingPolicy(record),
    physicalSpecimenIdentity: { status: "not_established", id: null, reason: "Study, profile and reconstruction identifiers do not supply a physical specimen identity." },
    relationship: { type: "co_display_only", samePhysicalObject: false, sourcePopulationJoinGranted: false, grantsGeometryTransfer: false },
    scientificBoundary: "Source context is not an individual-cell measurement. Denominators and conditions remain separate. Missing evidence is not biological absence. Exact upstream field resolution is distinguished from the indexed project field; a hash verifies bytes only.",
  });
}

export function exportResearchRecordDossier(input, { applicationVersion, selectionGeneration, requestedKey } = {}) {
  check(nonempty(applicationVersion) && Number.isSafeInteger(selectionGeneration) && selectionGeneration > 0
    && requestedKey === input.record?.key, "export must bind the current ready selection generation and application version");
  const scope = deriveResearchRecordSourceScope(input);
  return frozen({ documentType: "research_record_scientific_dossier", schemaVersion: "0.2.0", applicationVersion,
    selection: { key: scope.recordKey, generation: selectionGeneration, namespace: scope.namespace, status: "current_verified_record" },
    sourceScope: scope, record: clone(input.record),
    view: { status: "not_included", camera: null, clipping: null, renderedRevision: null,
      reason: "This export contains source-record evidence and context. The current rendered scene requires its independent actual-view receipt." } });
}

function csvCell(value) {
  let text = value === null || value === undefined ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/^[\t\r\n ]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

/** Safe spreadsheet export; raw values remain exact in the JSON dossier. */
export function researchRecordDossierCsv(dossier) {
  check(dossier?.documentType === "research_record_scientific_dossier" && dossier.selection.key === dossier.sourceScope?.recordKey,
    "CSV requires the same current dossier record and scope");
  const scope = dossier.sourceScope;
  check(dossier.schemaVersion === "0.2.0" && scope.schemaVersion === "0.2.0" && dossier.record?.key === scope.recordKey,
    "CSV requires the current dossier schema and retained record");
  const policy = deriveResearchMorphologyRenderingPolicy(dossier.record);
  check(JSON.stringify(policy) === JSON.stringify(scope.renderingPolicy), "CSV rendering policy differs from the current exact source declaration");
  check(scope.fieldLocators.length === dossier.record.evidence.length && scope.fieldLocators.every((field, index) =>
    field.index === index && ["label", "value", "authority", "locator"].every(key => field[key] === dossier.record.evidence[index][key])),
  "CSV retained fields differ from the exact dossier record");
  const columns = ["record_key", "namespace", "source_id", "registry_release", "group", "field", "value", "status", "authority", "source_locator", "project_field_locator", "upstream_locator_status"];
  const rows = [];
  const append = (group, field, value, status, authority, locator, projectLocator = null, upstreamStatus = null) => rows.push([
    scope.recordKey, scope.namespace, scope.sourceId, scope.registryReleaseId, group, field, value, status, authority, locator, projectLocator, upstreamStatus,
  ]);
  append("record_scope", "display_unit", scope.displayUnit, "project_record_unit", "research_record_source_scope", scope.recordLocation.path);
  append("record_scope", "underlying_observation_unit", scope.underlyingObservationUnit, scope.underlyingObservationUnit ? "source_record_semantics" : "not_retained", "indexed_record_semantics", scope.recordLocation.path);
  append("record_scope", "scientific_boundary", scope.scientificBoundary, "scope_only", "project_policy", null);
  append("record_scope", "rendered_view", dossier.view.reason, "not_included", "export_contract", null);
  if (!scope.sourceId) append("source_context", "parent_source", null, "not_established", "source_registry", scope.sourceMissingReason);
  for (const [group, items] of [["species", scope.species], ["life_stage", scope.lifeStages], ["region", scope.regions]]) for (const item of items) {
    append(group, "value", item.value, item.status, item.authority, item.locator);
    append(group, "context", item.context, "source_context_only", item.authority, item.locator);
    if (item.missingReason) append(group, "missing_reason", item.missingReason, "not_retained", item.authority, item.locator);
  }
  for (const unit of scope.experimentalUnits) append("source_denominator", unit.unit, { count: unit.count, scope: unit.scope, missingReason: unit.missingReason }, unit.status, unit.authority, unit.locator);
  for (const condition of scope.conditions) for (const [field, locator] of Object.entries(condition.fieldLocators)) {
    append(`condition:${condition.id}`, field, condition[field], "condition_specific", condition.authority, locator);
  }
  if (policy) {
    for (const [field, value] of Object.entries(policy.declaredSource)) append("morphology_declared_source", field, value, "declared_metadata_only", "canonical_source_contract", policy.declaredSource.contractLocator);
    for (const [field, value] of Object.entries(policy.radiusSurface)) append("current_morphology_rendering_policy", field, value, "project_policy_not_actual_view", "source_dimension_and_diameter_gate", policy.declaredSource.contractLocator);
    append("current_morphology_rendering_policy", "actual_geometry_verification", policy.actualGeometryVerification, "not_included", "dossier_scope", null);
    append("current_morphology_rendering_policy", "actual_rendered_view", policy.actualRenderedView, "not_included", "dossier_scope", null);
    for (const archived of policy.archivedSurfaceDeclarations) append("archived_surface_interpretation", "retained_original_field", archived,
      "archived_project_rendering_declaration_not_current_permission", "retained_project_field", archived.originalLocator,
      scope.fieldLocators[archived.evidenceIndex].projectFieldLocator);
  }
  for (const row of scope.fieldLocators) {
    const archived = policy?.archivedSurfaceDeclarations.some(field => field.evidenceIndex === row.index);
    append(archived ? "archived_project_render_declaration" : "evidence", researchEvidenceDisplayLabel(dossier.record, row), row.value,
      archived ? "retained_archived_declaration_not_current_permission" : row.materializationStatus, row.authority, row.locator, row.projectFieldLocator, row.upstreamLocatorStatus);
  }
  for (const gap of scope.gaps) append(`missingness:${gap.scope}`, gap.label, { rawValue: gap.rawValue, reasonCode: gap.reasonCode, detail: gap.detail, inferenceAllowed: gap.inferenceAllowed }, gap.status, gap.authority, gap.sourceLocator);
  return [columns, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
