import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  assessResearchQuestion,
  buildResearchFeasibilityReceipt,
  feasibilityReceiptFilename,
  normalizeFeasibilityAxisIds,
  validateFeasibilitySelection,
} from "../app/evidence-feasibility-planner.js";
import { validateEvidenceFeasibilityPlanner } from "../scripts/validate-evidence-feasibility-planner-0.1.mjs";

const [planner, catalog, component] = await Promise.all([
  readFile(new URL("../data/evidence-feasibility-planner-0.1.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/public-data-catalog-0.4.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../app/EvidenceFeasibilityPlanner.tsx", import.meta.url), "utf8"),
]);

test("validates the public-source feasibility planner contract", async () => {
  const report = await validateEvidenceFeasibilityPlanner();
  assert.equal(report.axisCount, 11);
  assert.equal(report.routeCount, 7);
  assert.equal(planner.localRuntime.networkRequests, false);
});

test("recognizes a single source-specific molecular route without claiming registration", () => {
  const assessment = assessResearchQuestion({ axisIds: ["molecular_taxonomy", "adult_lumbar_marker_context"], planner });
  assert.equal(assessment.decisionKind, "source_specific_route_available");
  assert.deepEqual(assessment.directRoutes.map((route) => route.id), ["ROUTE-RUSS-TAXONOMY"]);
  assert.deepEqual(assessment.supportingSourceIds, ["PDS-RUSS-2021"]);
  assert.doesNotMatch(JSON.stringify(assessment), /REG|registered/i);
});

test("keeps separately supported axes separate instead of inventing a same-cell join", () => {
  const assessment = assessResearchQuestion({ axisIds: ["molecular_taxonomy", "morphology"], planner });
  assert.equal(assessment.decisionKind, "partitioned_routes_no_join");
  assert.equal(assessment.directRoutes.length, 0);
  assert.match(assessment.decision, /same-cell.*same-specimen.*coordinate.*causal relationship/i);
});

test("reports unsupported connectivity as a package-coverage gap, not biological absence", () => {
  const assessment = assessResearchQuestion({ axisIds: ["synaptic_connectivity"], planner });
  assert.equal(assessment.decisionKind, "blocked_missing_qualified_route");
  assert.deepEqual(assessment.unqualifiedAxisIds, ["synaptic_connectivity"]);
  assert.match(assessment.decision, /not a biological absence claim/i);
});

test("bounds selection and exports a zero-registration local planning receipt", () => {
  const normalized = normalizeFeasibilityAxisIds(["morphology", "morphology", "unknown", "reference_anatomy"], planner);
  assert.deepEqual(normalized, ["morphology", "reference_anatomy"]);
  assert.equal(validateFeasibilitySelection(normalized, planner), true);
  assert.equal(validateFeasibilitySelection(["unknown"], planner), false);
  const receipt = buildResearchFeasibilityReceipt({ axisIds: normalized, planner, catalog, generatedAt: "2026-08-18T00:00:00.000Z" });
  assert.equal(receipt.sourceObjectsAcquired, false);
  assert.equal(receipt.registrationsCreated, 0);
  assert.equal(feasibilityReceiptFilename(normalized), "ohri-research-feasibility-morphology-reference_anatomy.json");
});

test("renders a local checkbox planner and receipt export without source fetching", () => {
  assert.match(component, /PUBLIC-SOURCE FEASIBILITY PLANNER/);
  assert.match(component, /type="checkbox"/);
  assert.match(component, /Export feasibility receipt/);
  assert.match(component, /planning metadata only; no source object acquired or registered/);
  assert.doesNotMatch(component, /fetch\(/);
});
