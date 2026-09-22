import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createResearchMvpValidator, formatSchemaErrors } from "./validate-json-schema.mjs";

const PLANNER_URL = new URL("../data/evidence-feasibility-planner-0.1.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/evidence-feasibility-planner-0.1.schema.json", import.meta.url);
const CATALOG_URL = new URL("../data/public-data-catalog-0.4.json", import.meta.url);

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

export async function validateEvidenceFeasibilityPlanner() {
  const [planner, schema, catalog] = await Promise.all([
    readFile(PLANNER_URL, "utf8").then(JSON.parse),
    readFile(SCHEMA_URL, "utf8").then(JSON.parse),
    readFile(CATALOG_URL, "utf8").then(JSON.parse),
  ]);
  const validate = createResearchMvpValidator(schema);
  const errors = [];
  if (!validate(planner)) errors.push(...formatSchemaErrors(validate.errors));
  check(planner.catalogReleaseId === catalog.releaseId, "planner must lock the current public-data catalog release", errors);
  check(JSON.stringify(planner.publicSourceIds) === JSON.stringify(catalog.sources.map((source) => source.id)), "planner must enumerate all catalog sources in catalog order", errors);
  const knownSourceIds = new Set(catalog.sources.map((source) => source.id));
  const axisIds = new Set();
  for (const axis of planner.axes ?? []) {
    check(!axisIds.has(axis.id), "duplicate feasibility axis " + axis.id, errors);
    axisIds.add(axis.id);
  }
  const routeIds = new Set();
  for (const route of planner.routes ?? []) {
    check(!routeIds.has(route.id), "duplicate feasibility route " + route.id, errors);
    routeIds.add(route.id);
    check(route.sourceIds.every((sourceId) => knownSourceIds.has(sourceId)), route.id + ": unknown public source", errors);
    check(route.supportedAxisIds.every((axisId) => axisIds.has(axisId)), route.id + ": unknown evidence axis", errors);
  }
  for (const axisId of ["same_cell_multimodal_join", "synaptic_connectivity", "project_atlas_registration"]) {
    check(axisIds.has(axisId), "planner must represent the high-risk axis " + axisId, errors);
    check(!(planner.routes ?? []).some((route) => route.supportedAxisIds.includes(axisId)), axisId + " must not have a qualified package route", errors);
  }
  check(/package-coverage result.*not a biological absence claim/i.test(planner.unqualifiedAxisDecision ?? ""), "unqualified axes must not become biological-absence claims", errors);
  check(/same-cell.*coordinate.*causal relationship/i.test(planner.multiRouteDecision ?? ""), "multi-route decision must retain the no-join boundary", errors);
  check(planner.localRuntime?.networkRequests === false && planner.localRuntime?.sourceFileDownload === false && planner.localRuntime?.sourceFileUpload === false && planner.localRuntime?.persistentStorage === "none", "planner must remain browser-local with no source-object acquisition", errors);
  check(/does not acquire.*create REG/i.test(planner.scientificBoundary ?? ""), "planner must forbid acquisition and REG", errors);
  const queueItem = (catalog.upgradeQueue ?? []).find((item) => item.id === "UPG-015");
  check(queueItem?.status === "in_progress", "UPG-015 must disclose its implemented feasibility-planning stage", errors);
  check(JSON.stringify(queueItem?.sourceIds) === JSON.stringify(catalog.sources.map((source) => source.id)), "UPG-015 must cover every catalogued source", errors);
  check(/same-cell relationship.*create REG/i.test(queueItem?.scientificBoundary ?? ""), "UPG-015 must forbid false joins and REG", errors);
  check((planner.nextQueueItems ?? []).every((item) => catalog.upgradeQueue.some((queueItem) => queueItem.id === item)), "planner next queue IDs must exist in the catalog", errors);
  if (errors.length) throw new Error("Evidence feasibility planner validation failed:\n" + errors.map((error) => "- " + error).join("\n"));
  return { releaseId: planner.releaseId, axisCount: planner.axes.length, routeCount: planner.routes.length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL("file://" + process.argv[1]))) {
  const result = await validateEvidenceFeasibilityPlanner();
  console.log("Evidence feasibility planner validation passed: " + result.releaseId + " (" + result.axisCount + " axes; " + result.routeCount + " source-specific routes)");
}
