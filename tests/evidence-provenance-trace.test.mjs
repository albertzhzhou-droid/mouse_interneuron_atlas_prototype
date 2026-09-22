import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildProvenanceTraceReceipt,
  buildPublicSourceRouteTrace,
  buildResearchEvidenceTrace,
  normalizeProvenanceAxisIds,
  provenanceTraceReceiptFilename,
} from "../app/evidence-provenance-trace.js";
import { validateEvidenceProvenanceTrace } from "../scripts/validate-evidence-provenance-trace-0.1.mjs";

const [trace, research, planner, catalog, component] = await Promise.all([
  readFile(new URL("../data/evidence-provenance-trace-0.1.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/research-mvp-release-0.2.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/evidence-feasibility-planner-0.1.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/public-data-catalog-0.4.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../app/EvidenceProvenanceTrace.tsx", import.meta.url), "utf8"),
]);

test("validates the two-lane provenance-trace contract", async () => {
  const report = await validateEvidenceProvenanceTrace();
  assert.equal(report.researchNodeCount, 5);
  assert.equal(report.publicNodeCount, 3);
  assert.equal(trace.localRuntime.networkRequests, false);
});

test("derives a research trace from only the selected frozen evidence entity", () => {
  const result = buildResearchEvidenceTrace({ entityId: "mouse.sc.vsx2_hoxa10", researchRelease: research });
  assert.equal(result.entity.id, "mouse.sc.vsx2_hoxa10");
  assert.ok(result.claims.length > 0);
  assert.ok(result.conditions.length > 0);
  assert.ok(result.sources.length > 0);
  assert.ok(result.edges.every((edge) => ["has_declared_claim", "bounded_by_condition", "cites_source", "records_statement", "reported_in_source"].includes(edge.relation)));
  assert.doesNotMatch(JSON.stringify(result), /public_source|declared_route|catalogued_public_source/);
});

test("fails closed when the requested research entity is missing or unknown", () => {
  const emptyTrace = {
    entity: null,
    claims: [],
    conditions: [],
    statements: [],
    sources: [],
    edges: [],
  };

  assert.deepEqual(buildResearchEvidenceTrace({ entityId: null, researchRelease: research }), emptyTrace);
  assert.deepEqual(buildResearchEvidenceTrace({ entityId: "mouse.sc.not-a-real-entity", researchRelease: research }), emptyTrace);
});

test("keeps public-source planner routes separate from research evidence", () => {
  const axisIds = normalizeProvenanceAxisIds(["molecular_taxonomy", "morphology", "morphology", "unknown"], planner);
  assert.deepEqual(axisIds, ["molecular_taxonomy", "morphology"]);
  const result = buildPublicSourceRouteTrace({ axisIds, planner, catalog });
  assert.deepEqual(result.routes.map((route) => route.id), ["ROUTE-NEUROMORPHO-MORPHOLOGY", "ROUTE-RUSS-TAXONOMY"]);
  assert.deepEqual(result.sources.map((source) => source.id), ["PDS-NEUROMORPHO-SWC", "PDS-RUSS-2021"]);
  assert.ok(result.edges.every((edge) => ["declared_route", "catalogued_public_source"].includes(edge.relation)));
  assert.ok(result.edges.every((edge) => !edge.relation.includes("claim") && !edge.relation.includes("condition")));
  assert.ok(result.edges.every((edge) => !edge.from.startsWith("mouse.sc.")));
});

test("exports a receipt that records a no-acquisition, zero-registration boundary", () => {
  const receipt = buildProvenanceTraceReceipt({
    entityId: "mouse.sc.vsx2_hoxa10",
    axisIds: ["molecular_taxonomy"],
    traceContract: trace,
    researchRelease: research,
    planner,
    catalog,
    generatedAt: "2026-08-20T00:00:00.000Z",
  });
  assert.equal(receipt.sourceObjectsAcquired, false);
  assert.equal(receipt.registrationsCreated, 0);
  assert.match(receipt.crossLanePolicy, /deliberately unjoined/i);
  assert.equal(provenanceTraceReceiptFilename(receipt.lanes.researchEvidence.entityId), "ohri-provenance-trace-mouse-sc-vsx2_hoxa10.json");
});

test("does not substitute the first research entity into an unknown-entity receipt", () => {
  const receipt = buildProvenanceTraceReceipt({
    entityId: "mouse.sc.not-a-real-entity",
    axisIds: [],
    traceContract: trace,
    researchRelease: research,
    planner,
    catalog,
    generatedAt: "2026-08-20T00:00:00.000Z",
  });

  assert.deepEqual(receipt.lanes.researchEvidence, {
    entityId: null,
    claimIds: [],
    conditionIds: [],
    statementIds: [],
    sourceIds: [],
  });
});

test("renders an explicit no-cross-lane-edge policy without source fetching", () => {
  assert.match(component, /TWO-LANE PROVENANCE TRACE/);
  assert.match(component, /Trace evidence without inventing a join/);
  assert.match(component, /NO CROSS-LANE EDGE/);
  assert.match(component, /Export provenance trace receipt/);
  assert.doesNotMatch(component, /fetch\(/);
});
