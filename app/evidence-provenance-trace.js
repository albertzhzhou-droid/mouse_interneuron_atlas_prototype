function unique(values) {
  return [...new Set(values)];
}

function byId(records, id) {
  return records.find((record) => record.id === id) ?? null;
}

function node(kind, record, label) {
  return { id: record.id, kind, label, record };
}

export function buildResearchEvidenceTrace({ entityId, researchRelease }) {
  const entity = typeof entityId === "string" && entityId.length > 0
    ? byId(researchRelease.entities, entityId)
    : null;
  if (!entity) return { entity: null, claims: [], conditions: [], statements: [], sources: [], edges: [] };
  const claims = researchRelease.claims.filter((claim) => claim.entityIds.includes(entity.id));
  const conditionIds = unique(claims.flatMap((claim) => claim.conditionIds));
  const conditions = conditionIds.map((id) => byId(researchRelease.conditions, id)).filter(Boolean);
  const statementIds = unique([...claims.flatMap((claim) => claim.statementIds), ...conditions.flatMap((condition) => condition.statementIds)]);
  const statements = statementIds.map((id) => byId(researchRelease.evidenceStatements, id)).filter(Boolean);
  const sourceIds = unique([...claims.flatMap((claim) => claim.sourceIds), ...conditions.map((condition) => condition.sourceId), ...statements.map((statement) => statement.sourceId)]);
  const sources = sourceIds.map((id) => byId(researchRelease.sources, id)).filter(Boolean);
  return {
    entity: node("entity", entity, entity.id),
    claims: claims.map((claim) => node("claim", claim, claim.id)),
    conditions: conditions.map((condition) => node("condition", condition, condition.id)),
    statements: statements.map((statement) => node("statement", statement, statement.id)),
    sources: sources.map((source) => node("source", source, source.id)),
    edges: [
      ...claims.map((claim) => ({ from: entity.id, to: claim.id, relation: "has_declared_claim" })),
      ...claims.flatMap((claim) => claim.conditionIds.map((conditionId) => ({ from: claim.id, to: conditionId, relation: "bounded_by_condition" }))),
      ...claims.flatMap((claim) => claim.sourceIds.map((sourceId) => ({ from: claim.id, to: sourceId, relation: "cites_source" }))),
      ...conditions.flatMap((condition) => condition.statementIds.map((statementId) => ({ from: condition.id, to: statementId, relation: "records_statement" }))),
      ...conditions.map((condition) => ({ from: condition.id, to: condition.sourceId, relation: "reported_in_source" })),
    ],
  };
}

export function normalizeProvenanceAxisIds(axisIds, planner) {
  const known = new Set(planner.axes.map((axis) => axis.id));
  return unique((Array.isArray(axisIds) ? axisIds : []).filter((axisId) => typeof axisId === "string" && known.has(axisId))).slice(0, planner.selectedAxisLimit);
}

export function buildPublicSourceRouteTrace({ axisIds, planner, catalog }) {
  const selectedAxisIds = normalizeProvenanceAxisIds(axisIds, planner);
  const axes = selectedAxisIds.map((id) => byId(planner.axes, id)).filter(Boolean);
  const routes = planner.routes.filter((route) => route.supportedAxisIds.some((axisId) => selectedAxisIds.includes(axisId)));
  const sourceIds = unique(routes.flatMap((route) => route.sourceIds));
  const sources = sourceIds.map((id) => byId(catalog.sources, id)).filter(Boolean);
  const unqualifiedAxisIds = axes.filter((axis) => !routes.some((route) => route.supportedAxisIds.includes(axis.id))).map((axis) => axis.id);
  return {
    axes: axes.map((axis) => node("axis", axis, axis.id)),
    routes: routes.map((route) => node("route", route, route.id)),
    sources: sources.map((source) => node("public_source", source, source.id)),
    unqualifiedAxisIds,
    edges: [
      ...routes.flatMap((route) => route.supportedAxisIds.filter((axisId) => selectedAxisIds.includes(axisId)).map((axisId) => ({ from: axisId, to: route.id, relation: "declared_route" }))),
      ...routes.flatMap((route) => route.sourceIds.map((sourceId) => ({ from: route.id, to: sourceId, relation: "catalogued_public_source" }))),
    ],
  };
}

export function buildProvenanceTraceReceipt({ entityId, axisIds, traceContract, researchRelease, planner, catalog, generatedAt }) {
  const researchTrace = buildResearchEvidenceTrace({ entityId, researchRelease });
  const publicTrace = buildPublicSourceRouteTrace({ axisIds, planner, catalog });
  return {
    traceReleaseId: traceContract.releaseId,
    traceSchemaVersion: traceContract.schemaVersion,
    researchReleaseId: researchRelease.releaseId,
    catalogReleaseId: catalog.releaseId,
    plannerReleaseId: planner.releaseId,
    generatedAt,
    lanes: {
      researchEvidence: {
        entityId: researchTrace.entity?.id ?? null,
        claimIds: researchTrace.claims.map((item) => item.id),
        conditionIds: researchTrace.conditions.map((item) => item.id),
        statementIds: researchTrace.statements.map((item) => item.id),
        sourceIds: researchTrace.sources.map((item) => item.id),
      },
      publicSourceRoutes: {
        axisIds: publicTrace.axes.map((item) => item.id),
        routeIds: publicTrace.routes.map((item) => item.id),
        sourceIds: publicTrace.sources.map((item) => item.id),
        unqualifiedAxisIds: publicTrace.unqualifiedAxisIds,
      },
    },
    crossLanePolicy: traceContract.crossLanePolicy,
    scientificBoundary: traceContract.scientificBoundary,
    sourceObjectsAcquired: false,
    registrationsCreated: 0,
  };
}

export function provenanceTraceReceiptFilename(entityId) {
  return "ohri-provenance-trace-" + (entityId ?? "no-entity").replaceAll(".", "-") + ".json";
}
