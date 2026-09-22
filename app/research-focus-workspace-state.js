import {
  RESEARCH_FOCUS_KINDS,
  researchLabForFocus,
} from "./research-explorer-index.js";

export const RESEARCH_FOCUS_PANEL = "evidence";

export function isResearchFocus(value) {
  return Boolean(
    value
    && typeof value === "object"
    && !Array.isArray(value)
    && RESEARCH_FOCUS_KINDS.includes(value.focusKind)
    && typeof value.focusId === "string"
    && value.focusId.length > 0
    && value.focusId === value.focusId.trim(),
  );
}

export function resolveResearchFocusWorkspaceState(focus, {
  recordExists = null,
} = {}) {
  if (!isResearchFocus(focus)) {
    return {
      status: "unavailable",
      reason: "invalid_research_focus",
      focus: null,
      lab: "overview",
      panel: RESEARCH_FOCUS_PANEL,
    };
  }
  if (recordExists !== null && (typeof recordExists !== "function" || !recordExists(focus))) {
    return {
      status: "unavailable",
      reason: "research_focus_not_found",
      focus: null,
      lab: "overview",
      panel: RESEARCH_FOCUS_PANEL,
    };
  }
  return {
    status: "ready",
    reason: null,
    focus: {
      focusKind: focus.focusKind,
      focusId: focus.focusId,
    },
    lab: researchLabForFocus(focus.focusKind),
    panel: RESEARCH_FOCUS_PANEL,
  };
}

export function researchFocusWorkspaceMatches({ focus, lab, panel }) {
  const resolved = resolveResearchFocusWorkspaceState(focus);
  return resolved.status === "ready"
    && resolved.lab === lab
    && resolved.panel === panel;
}
