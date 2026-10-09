import {
  RESEARCH_FOCUS_KINDS,
  findResearchRecord,
} from "./research-explorer-index.js";

const FOCUS_KIND_SET = new Set(RESEARCH_FOCUS_KINDS);

function deepFreeze(value, seen = new WeakSet()) {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return value;
  seen.add(value);
  for (const nested of Object.values(value)) deepFreeze(nested, seen);
  return Object.isFrozen(value) ? value : Object.freeze(value);
}

function immutableState(value) {
  return deepFreeze(value);
}

export function canonicalResearchFocusKey(focus) {
  if (
    !focus
    || typeof focus !== "object"
    || !FOCUS_KIND_SET.has(focus.focusKind)
    || typeof focus.focusId !== "string"
    || focus.focusId.length === 0
  ) return null;
  return `${focus.focusKind}:${focus.focusId}`;
}

function focusIdentity(focus) {
  const requestKey = canonicalResearchFocusKey(focus);
  return requestKey
    ? { requestKey, focusKind: focus.focusKind, focusId: focus.focusId }
    : { requestKey: null, focusKind: null, focusId: null };
}

export function createResearchActiveRecordState(focus = null) {
  const identity = focusIdentity(focus);
  return immutableState({
    generation: 0,
    ...identity,
    status: identity.requestKey ? "verifying" : "idle",
    record: null,
    error: "",
  });
}

export function beginResearchActiveRecordRequest(previous, focus, generation) {
  if (!Number.isSafeInteger(generation) || generation <= previous.generation) {
    throw new TypeError("The active-record request generation must increase monotonically");
  }
  const identity = focusIdentity(focus);
  return immutableState({
    generation,
    ...identity,
    status: identity.requestKey ? "verifying" : "idle",
    record: null,
    error: "",
  });
}

export function resolveResearchActiveRecord(index, focus) {
  const requestKey = canonicalResearchFocusKey(focus);
  if (!requestKey || !Array.isArray(index?.records)) return null;
  const record = findResearchRecord(index.records, focus.focusKind, focus.focusId);
  if (!record) return null;
  if (record.key !== requestKey) {
    throw new Error("The active record does not match its canonical focus key");
  }
  return record;
}

export function settleResearchActiveRecordSuccess(previous, {
  generation,
  requestKey,
  record,
}) {
  if (generation !== previous.generation || requestKey !== previous.requestKey) return previous;
  if (!requestKey || !record || record.key !== requestKey) {
    throw new Error("A ready active record must exactly match the current canonical focus key");
  }
  return immutableState({
    ...previous,
    status: "ready",
    record,
    error: "",
  });
}

export function settleResearchActiveRecordFailure(previous, {
  generation,
  requestKey,
  error,
}) {
  if (generation !== previous.generation || requestKey !== previous.requestKey) return previous;
  if (!requestKey) return previous;
  return immutableState({
    ...previous,
    status: "unavailable",
    record: null,
    error: typeof error === "string" && error.length > 0
      ? error
      : "The exact source record could not be verified.",
  });
}

/**
 * React effects run after render. This selector therefore clears a settled old
 * record synchronously whenever the requested focus key changes, before a new
 * request effect has had a chance to start.
 */
export function deriveResearchActiveRecordState(storedState, focus) {
  const identity = focusIdentity(focus);
  if (!identity.requestKey) return createResearchActiveRecordState(null);
  if (storedState.requestKey !== identity.requestKey) {
    return immutableState({
      generation: storedState.generation,
      ...identity,
      status: "verifying",
      record: null,
      error: "",
    });
  }
  if (storedState.status === "ready" && (
    !storedState.record
    || storedState.record.key !== identity.requestKey
    || storedState.record.focusKind !== identity.focusKind
    || storedState.record.focusId !== identity.focusId
  )) {
    return immutableState({
      ...storedState,
      status: "unavailable",
      record: null,
      error: "The verified record identity does not match the requested focus.",
    });
  }
  return storedState;
}

export function isResearchActiveRecordReadyForFocus(state, focus) {
  const visible = deriveResearchActiveRecordState(state, focus);
  return visible.status === "ready"
    && visible.record !== null
    && visible.record.key === canonicalResearchFocusKey(focus);
}
