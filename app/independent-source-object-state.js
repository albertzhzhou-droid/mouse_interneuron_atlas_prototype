import { findIndependentSourceObject, parseIndependentSourceObjectKey } from "./independent-source-objects.js";

function identity(key) { return parseIndependentSourceObjectKey(key)?.sourceId ? key : null; }
function frozen(state) { return Object.freeze(state); }

export function createIndependentSourceObjectState(key = null) {
  const requestKey = identity(key);
  return frozen({ generation: 0, requestKey, status: requestKey ? "verifying" : "idle", record: null, payload: null, receipt: null, error: "" });
}

/** Every selection event, including A → B → A, starts a new generation. */
export function beginIndependentSourceObjectRequest(previous, key, generation) {
  if (!Number.isSafeInteger(generation) || generation <= previous.generation) throw new TypeError("Independent object generation must increase monotonically");
  const requestKey = identity(key);
  return frozen({ generation, requestKey, status: requestKey ? "verifying" : "idle", record: null, payload: null, receipt: null, error: "" });
}

export function settleIndependentSourceObjectSuccess(previous, { generation, requestKey, record, payload }) {
  if (previous.generation !== generation || previous.requestKey !== requestKey) return previous;
  if (!requestKey || record?.key !== requestKey || payload?.key !== requestKey || payload?.receipt?.objectKey !== requestKey) {
    throw new Error("Verified independent record, geometry and receipt must all match the exact current object key");
  }
  return frozen({ ...previous, status: "ready", record, payload, receipt: payload.receipt, error: "" });
}

export function settleIndependentSourceObjectFailure(previous, { generation, requestKey, error }) {
  if (previous.generation !== generation || previous.requestKey !== requestKey) return previous;
  return frozen({ ...previous, status: requestKey ? "unavailable" : "idle", record: null, payload: null, receipt: null,
    error: typeof error === "string" && error ? error : "Exact selected source object verification failed." });
}

/** The selection epoch gates rendering before the request effect starts. */
export function deriveIndependentSourceObjectState(stored, { key, generation }) {
  const requestKey = identity(key);
  if (stored.requestKey !== requestKey || stored.generation !== generation) {
    return frozen({ generation, requestKey, status: requestKey ? "verifying" : "idle", record: null, payload: null, receipt: null, error: "" });
  }
  if (stored.status === "ready" && (stored.record?.key !== requestKey || stored.payload?.key !== requestKey || stored.receipt?.objectKey !== requestKey)) {
    return frozen({ ...stored, status: "unavailable", record: null, payload: null, receipt: null, error: "Selected object / payload / receipt identity mismatch." });
  }
  return stored;
}

/** Controller integrates cancellation and monotonically increasing selection. */
export function createIndependentSourceObjectController(index, loader, onChange = () => {}) {
  let state = createIndependentSourceObjectState();
  let pending = null;
  return {
    getState: () => state,
    async select(key) {
      pending?.abort();
      const controller = new AbortController();
      pending = controller;
      state = beginIndependentSourceObjectRequest(state, key, state.generation + 1);
      onChange(state);
      const generation = state.generation;
      const requestKey = state.requestKey;
      if (!requestKey) return state;
      const record = findIndependentSourceObject(index, requestKey);
      if (!record) {
        state = settleIndependentSourceObjectFailure(state, { generation, requestKey, error: "Unknown exact source object; no default replacement is selected." });
        onChange(state);
        return state;
      }
      try {
        const payload = await loader(record, { signal: controller.signal });
        const next = settleIndependentSourceObjectSuccess(state, { generation, requestKey, record, payload });
        if (next !== state) { state = next; onChange(state); }
      } catch (error) {
        if (controller.signal.aborted) return state;
        const next = settleIndependentSourceObjectFailure(state, { generation, requestKey, error: error instanceof Error ? error.message : String(error) });
        if (next !== state) { state = next; onChange(state); }
      }
      return state;
    },
    dispose() {
      pending?.abort();
      state = beginIndependentSourceObjectRequest(state, null, state.generation + 1);
      onChange(state);
    },
  };
}
