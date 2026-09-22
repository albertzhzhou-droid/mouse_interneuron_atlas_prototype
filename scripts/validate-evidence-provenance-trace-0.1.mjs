import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createResearchMvpValidator, formatSchemaErrors } from "./validate-json-schema.mjs";

const TRACE_URL = new URL("../data/evidence-provenance-trace-0.1.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/evidence-provenance-trace-0.1.schema.json", import.meta.url);
const RESEARCH_URL = new URL("../data/research-mvp-release-0.2.json", import.meta.url);
const CATALOG_URL = new URL("../data/public-data-catalog-0.4.json", import.meta.url);
const PLANNER_URL = new URL("../data/evidence-feasibility-planner-0.1.json", import.meta.url);

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

function laneById(trace, id) {
  return trace.lanes?.find((lane) => lane.id === id) ?? null;
}

export async function validateEvidenceProvenanceTrace() {
  const [trace, schema, research, catalog, planner] = await Promise.all([
    readFile(TRACE_URL, "utf8").then(JSON.parse),
    readFile(SCHEMA_URL, "utf8").then(JSON.parse),
    readFile(RESEARCH_URL, "utf8").then(JSON.parse),
    readFile(CATALOG_URL, "utf8").then(JSON.parse),
    readFile(PLANNER_URL, "utf8").then(JSON.parse),
  ]);
  const validate = createResearchMvpValidator(schema);
  const errors = [];
  if (!validate(trace)) errors.push(...formatSchemaErrors(validate.errors));
  check(trace.researchReleaseId === research.releaseId, "trace must lock the Research MVP release", errors);
  check(trace.catalogReleaseId === catalog.releaseId, "trace must lock the public-data catalog release", errors);
  check(trace.plannerReleaseId === planner.releaseId, "trace must lock the feasibility-planner release", errors);

  const researchLane = laneById(trace, "research_evidence");
  check(JSON.stringify(researchLane?.nodeKinds) === JSON.stringify(["entity", "claim", "condition", "statement", "source"]), "research lane must preserve the typed frozen evidence chain", errors);
  check(researchLane?.expectedCounts?.entities === research.entities.length, "research lane entity count must match the frozen release", errors);
  check(researchLane?.expectedCounts?.claims === research.claims.length, "research lane claim count must match the frozen release", errors);
  check(researchLane?.expectedCounts?.conditions === research.conditions.length, "research lane condition count must match the frozen release", errors);
  check(researchLane?.expectedCounts?.statements === research.evidenceStatements.length, "research lane statement count must match the frozen release", errors);
  check(researchLane?.expectedCounts?.sources === research.sources.length, "research lane source count must match the frozen release", errors);
  check(/not turn.*coordinate.*causal.*REG/i.test(researchLane?.boundary ?? ""), "research lane must retain its no-coordinate/no-REG boundary", errors);

  const publicLane = laneById(trace, "public_source_routes");
  check(JSON.stringify(publicLane?.nodeKinds) === JSON.stringify(["axis", "route", "public_source"]), "public lane must expose only axes, routes and public-source metadata", errors);
  check(publicLane?.expectedCounts?.axes === planner.axes.length, "public lane axis count must match the planner", errors);
  check(publicLane?.expectedCounts?.routes === planner.routes.length, "public lane route count must match the planner", errors);
  check(publicLane?.expectedCounts?.publicSources === catalog.sources.length, "public lane source count must match the catalog", errors);
  check(/neither a downloaded source object.*project-registration relation/i.test(publicLane?.boundary ?? ""), "public lane must retain its no-acquisition/no-registration boundary", errors);

  check(/deliberately unjoined/i.test(trace.crossLanePolicy ?? ""), "trace must explicitly preserve its two-lane separation", errors);
  check(/same-cell.*coordinate transform.*REG/i.test(trace.crossLanePolicy ?? ""), "cross-lane policy must prohibit false identity, transform and REG", errors);
  check(trace.localRuntime?.networkRequests === false && trace.localRuntime?.sourceFileDownload === false && trace.localRuntime?.sourceFileUpload === false && trace.localRuntime?.persistentStorage === "none", "trace must remain browser-local with no source-object acquisition", errors);
  check(/does not acquire.*does not infer.*REG/i.test(trace.scientificBoundary ?? ""), "trace scientific boundary must forbid acquisition, inference and REG", errors);

  const queueItem = catalog.upgradeQueue?.find((item) => item.id === "UPG-016");
  check(queueItem?.status === "in_progress", "UPG-016 must disclose the implemented provenance-trace stage", errors);
  check(JSON.stringify(queueItem?.sourceIds) === JSON.stringify(catalog.sources.map((source) => source.id)), "UPG-016 must cover every catalogued public source", errors);
  check(/no cross-lane edge.*source acquisition.*registration/i.test((queueItem?.acceptanceCriteria ?? []).join(" ")), "UPG-016 acceptance criteria must preserve no-join/no-acquisition/no-registration boundaries", errors);
  check(/does not acquire.*cross-study identity.*REG/i.test(queueItem?.scientificBoundary ?? ""), "UPG-016 scientific boundary must forbid acquisition, cross-study identity and REG", errors);
  check((trace.nextQueueItems ?? []).every((item) => catalog.upgradeQueue.some((queueItem) => queueItem.id === item)), "trace next queue IDs must exist in the catalog", errors);

  if (errors.length) throw new Error("Evidence provenance trace validation failed:\n" + errors.map((error) => "- " + error).join("\n"));
  return { releaseId: trace.releaseId, researchNodeCount: researchLane.nodeKinds.length, publicNodeCount: publicLane.nodeKinds.length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL("file://" + process.argv[1]))) {
  const result = await validateEvidenceProvenanceTrace();
  console.log("Evidence provenance trace validation passed: " + result.releaseId + " (" + result.researchNodeCount + " research node kinds; " + result.publicNodeCount + " public-source node kinds)");
}
