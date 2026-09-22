import test from "node:test";
import assert from "node:assert/strict";

import {
  RESEARCH_FOCUS_PANEL,
  isResearchFocus,
  researchFocusWorkspaceMatches,
  resolveResearchFocusWorkspaceState,
} from "../app/research-focus-workspace-state.js";

const CANONICAL_LABS = new Map([
  ["sci_entity", "overview"],
  ["molecular_profile", "types"],
  ["morphology_record", "morphology"],
  ["anatomy_label", "atlas"],
  ["sci_population", "sci"],
  ["source_lane", "coverage"],
]);

test("every research focus resolves atomically to its canonical lab and evidence panel", () => {
  for (const [focusKind, lab] of CANONICAL_LABS) {
    const focus = { focusKind, focusId: `${focusKind}:record-1` };
    const resolved = resolveResearchFocusWorkspaceState(focus);
    assert.deepEqual(resolved, {
      status: "ready",
      reason: null,
      focus,
      lab,
      panel: RESEARCH_FOCUS_PANEL,
    });
    assert.notEqual(resolved.focus, focus);
    assert.equal(researchFocusWorkspaceMatches({ focus, lab, panel: "evidence" }), true);
    assert.equal(researchFocusWorkspaceMatches({ focus, lab: "overview", panel: "structure" }), false);
  }
});

test("invalid or absent focus fails closed without retaining a stale record", () => {
  for (const focus of [
    null,
    {},
    [],
    { focusKind: "molecular_profile", focusId: "" },
    { focusKind: "molecular_profile", focusId: " record-1 " },
    { focusKind: "unknown", focusId: "record-1" },
  ]) {
    assert.equal(isResearchFocus(focus), false);
    assert.deepEqual(resolveResearchFocusWorkspaceState(focus), {
      status: "unavailable",
      reason: "invalid_research_focus",
      focus: null,
      lab: "overview",
      panel: "evidence",
    });
  }
});

test("an optional current-index gate rejects a syntactically valid but unknown focus", () => {
  const focus = { focusKind: "morphology_record", focusId: "NeuroMorpho:999999" };
  const rejected = resolveResearchFocusWorkspaceState(focus, { recordExists: () => false });
  assert.deepEqual(rejected, {
    status: "unavailable",
    reason: "research_focus_not_found",
    focus: null,
    lab: "overview",
    panel: "evidence",
  });
  assert.equal(resolveResearchFocusWorkspaceState(focus, { recordExists: () => true }).status, "ready");
});
