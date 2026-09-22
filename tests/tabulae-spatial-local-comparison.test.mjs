import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateTabulaeSpatialLocalComparison } from "../scripts/validate-tabulae-spatial-local-comparison-0.1.mjs";

const comparison = await readFile(new URL("../data/tabulae-spatial-local-comparison-0.1.json", import.meta.url), "utf8").then(JSON.parse);

test("validates the bounded four-section Tabulae local comparison contract", async () => {
  const report = await validateTabulaeSpatialLocalComparison(comparison);
  assert.equal(report.releaseId, "ohri-tabulae-paralytica-spatial-local-comparison-0.1.0");
  assert.equal(report.maximumConcurrentSessions, 4);
  assert.equal(comparison.comparison.crossSectionTransform, "none");
  assert.equal(comparison.comparison.interSectionGeometry, "not_established");
  assert.equal(comparison.comparison.quantitativeComparison, "not_permitted");
  assert.equal(comparison.localRuntime.sourceFilesBundled, false);
});

test("rejects a comparison that implies an ordered or registered 3D stack", async () => {
  const ordered = structuredClone(comparison);
  ordered.comparison.sectionOrderAuthority = "section_labels_define_order";
  await assert.rejects(() => validateTabulaeSpatialLocalComparison(ordered), /order/);
  const transformed = structuredClone(comparison);
  transformed.comparison.crossSectionTransform = "affine";
  await assert.rejects(() => validateTabulaeSpatialLocalComparison(transformed), /transform/);
});

test("implements a session-bounded comparison board with no remote fetch", async () => {
  const board = await readFile(new URL("../app/TabulaeSpatialComparisonBoard.tsx", import.meta.url), "utf8");
  assert.match(board, /maximumConcurrentSessions/);
  assert.match(board, /A session is not section-to-section alignment/);
  assert.match(board, /Export comparison receipt/);
  assert.match(board, /Remove session/);
  assert.match(board, /projectRegistrationCount: 0/);
  assert.doesNotMatch(board, /\bfetch\s*\(/);
});
