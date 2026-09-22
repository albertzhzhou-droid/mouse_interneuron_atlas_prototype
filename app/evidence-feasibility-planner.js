function byId(items, id) {
  return items.find((item) => item.id === id) ?? null;
}

function unique(values) {
  return [...new Set(values)];
}

export function normalizeFeasibilityAxisIds(axisIds, planner) {
  const known = new Set(planner.axes.map((axis) => axis.id));
  const values = Array.isArray(axisIds) ? axisIds : [];
  return unique(values.filter((axisId) => typeof axisId === "string" && known.has(axisId))).slice(0, planner.selectedAxisLimit);
}

export function validateFeasibilitySelection(axisIds, planner) {
  if (!Array.isArray(axisIds) || axisIds.length > planner.selectedAxisLimit) return false;
  const normalized = normalizeFeasibilityAxisIds(axisIds, planner);
  return normalized.length === axisIds.length;
}

export function assessResearchQuestion({ axisIds, planner }) {
  const selectedAxisIds = normalizeFeasibilityAxisIds(axisIds, planner);
  const selectedAxes = selectedAxisIds.map((axisId) => byId(planner.axes, axisId)).filter(Boolean);
  const routeAssessments = selectedAxes.map((axis) => ({
    axis,
    routes: planner.routes.filter((route) => route.supportedAxisIds.includes(axis.id)),
  }));
  const unqualifiedAxisIds = routeAssessments.filter((assessment) => assessment.routes.length === 0).map((assessment) => assessment.axis.id);
  const directRoutes = selectedAxisIds.length === 0
    ? []
    : planner.routes.filter((route) => selectedAxisIds.every((axisId) => route.supportedAxisIds.includes(axisId)));
  const supportingRoutes = unique(routeAssessments.flatMap((assessment) => assessment.routes));
  const supportingSourceIds = unique(supportingRoutes.flatMap((route) => route.sourceIds));

  let decisionKind = "select_axes";
  let decision = "Select one to four evidence axes to assess the current package coverage for a research question.";
  if (selectedAxisIds.length && unqualifiedAxisIds.length) {
    decisionKind = "blocked_missing_qualified_route";
    decision = planner.unqualifiedAxisDecision;
  } else if (directRoutes.length) {
    decisionKind = "source_specific_route_available";
    decision = "A single declared source-specific route supports every selected axis. Its source and boundary still limit the permissible study claim.";
  } else if (selectedAxisIds.length) {
    decisionKind = "partitioned_routes_no_join";
    decision = planner.multiRouteDecision;
  }

  return {
    selectedAxisIds,
    selectedAxes,
    routeAssessments,
    directRoutes,
    supportingRoutes,
    supportingSourceIds,
    unqualifiedAxisIds,
    decisionKind,
    decision,
  };
}

export function feasibilityReceiptFilename(axisIds) {
  const suffix = axisIds.length ? axisIds.join("-") : "no-axes";
  return "ohri-research-feasibility-" + suffix + ".json";
}

export function buildResearchFeasibilityReceipt({ axisIds, planner, catalog, generatedAt }) {
  const assessment = assessResearchQuestion({ axisIds, planner });
  return {
    plannerReleaseId: planner.releaseId,
    plannerSchemaVersion: planner.schemaVersion,
    catalogReleaseId: catalog.releaseId,
    generatedAt,
    scientificInputPolicy: catalog.scientificInputPolicy,
    institutionalExperimentalDataUsed: catalog.institutionalExperimentalDataUsed,
    requestedAxes: assessment.selectedAxes.map((axis) => ({ id: axis.id, label: axis.label })),
    decision: { kind: assessment.decisionKind, statement: assessment.decision },
    unqualifiedAxisIds: assessment.unqualifiedAxisIds,
    directRouteIds: assessment.directRoutes.map((route) => route.id),
    supportingRoutes: assessment.supportingRoutes.map((route) => ({
      id: route.id,
      sourceIds: route.sourceIds,
      supportedAxisIds: route.supportedAxisIds,
      readiness: route.readiness,
      boundary: route.boundary,
    })),
    scientificBoundary: planner.scientificBoundary,
    sourceObjectsAcquired: false,
    registrationsCreated: 0,
  };
}
