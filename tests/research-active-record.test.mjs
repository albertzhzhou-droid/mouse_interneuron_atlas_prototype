import assert from "node:assert/strict";
import test from "node:test";

import {
  beginResearchActiveRecordRequest,
  canonicalResearchFocusKey,
  createResearchActiveRecordState,
  deriveResearchActiveRecordState,
  isResearchActiveRecordReadyForFocus,
  resolveResearchActiveRecord,
  settleResearchActiveRecordFailure,
  settleResearchActiveRecordSuccess,
} from "../app/research-active-record.js";

const focusA = { focusKind: "molecular_profile", focusId: "source:a" };
const focusB = { focusKind: "morphology_record", focusId: "NeuroMorpho:2" };
const recordA = { ...focusA, key: "molecular_profile:source:a", title: "A" };
const recordB = { ...focusB, key: "morphology_record:NeuroMorpho:2", title: "B" };
const index = { records: [recordA, recordB] };

test("builds only canonical supported focus keys", () => {
  assert.equal(canonicalResearchFocusKey(focusA), recordA.key);
  assert.equal(canonicalResearchFocusKey(null), null);
  assert.equal(canonicalResearchFocusKey({ focusKind: "not_a_lane", focusId: "a" }), null);
  assert.equal(canonicalResearchFocusKey({ focusKind: "molecular_profile", focusId: "" }), null);
});

test("publishes the exact record object from one verified index", () => {
  assert.equal(resolveResearchActiveRecord(index, focusA), recordA);
  assert.equal(resolveResearchActiveRecord(index, { ...focusA, focusId: "absent" }), null);
  assert.throws(
    () => resolveResearchActiveRecord({ records: [{ ...recordA, key: "wrong:key" }] }, focusA),
    /canonical focus key/,
  );
});

test("focus changes clear a ready prior record synchronously before an effect starts", () => {
  let state = createResearchActiveRecordState(focusA);
  state = beginResearchActiveRecordRequest(state, focusA, 1);
  state = settleResearchActiveRecordSuccess(state, {
    generation: 1,
    requestKey: recordA.key,
    record: recordA,
  });
  assert.equal(state.status, "ready");
  const visibleForB = deriveResearchActiveRecordState(state, focusB);
  assert.equal(visibleForB.status, "verifying");
  assert.equal(visibleForB.record, null);
  assert.equal(JSON.stringify(visibleForB).includes("source:a"), false);
});

test("a slower prior request cannot overwrite the current generation", () => {
  let state = createResearchActiveRecordState(focusA);
  state = beginResearchActiveRecordRequest(state, focusA, 1);
  state = beginResearchActiveRecordRequest(state, focusB, 2);
  const stale = settleResearchActiveRecordSuccess(state, {
    generation: 1,
    requestKey: recordA.key,
    record: recordA,
  });
  assert.equal(stale, state);
  assert.equal(stale.status, "verifying");
  assert.equal(stale.record, null);

  const current = settleResearchActiveRecordSuccess(stale, {
    generation: 2,
    requestKey: recordB.key,
    record: recordB,
  });
  assert.equal(current.status, "ready");
  assert.equal(current.record, recordB);
  assert.equal(isResearchActiveRecordReadyForFocus(current, focusB), true);
  assert.equal(isResearchActiveRecordReadyForFocus(current, focusA), false);
});

test("a ready record is deeply immutable while retaining the verified object identity", () => {
  const nestedRecord = {
    ...recordA,
    evidence: [{
      label: "Exact row",
      value: "retained",
      authority: "checksum_pinned_fixture",
      locator: "fixture:row:1",
    }],
    presentation: {
      modeling: {
        admittedCellGeometryObjectCount: 0,
      },
    },
  };
  Object.freeze(nestedRecord);
  assert.equal(Object.isFrozen(nestedRecord.evidence), false, "fixture starts only shallow-frozen");
  let state = beginResearchActiveRecordRequest(
    createResearchActiveRecordState(),
    focusA,
    1,
  );
  state = settleResearchActiveRecordSuccess(state, {
    generation: 1,
    requestKey: recordA.key,
    record: nestedRecord,
  });

  assert.equal(state.record, nestedRecord);
  assert.equal(Object.isFrozen(state), true);
  assert.equal(Object.isFrozen(state.record), true);
  assert.equal(Object.isFrozen(state.record.evidence), true);
  assert.equal(Object.isFrozen(state.record.evidence[0]), true);
  assert.equal(Object.isFrozen(state.record.presentation.modeling), true);
  assert.throws(() => {
    state.record.evidence[0].locator = "mutated:locator";
  }, TypeError);
  assert.equal(state.record.evidence[0].locator, "fixture:row:1");
});

test("absent or failed current identity stays unavailable with no old fallback", () => {
  let state = createResearchActiveRecordState(focusB);
  state = beginResearchActiveRecordRequest(state, focusB, 1);
  state = settleResearchActiveRecordFailure(state, {
    generation: 1,
    requestKey: recordB.key,
    error: "Exact record absent",
  });
  assert.equal(state.status, "unavailable");
  assert.equal(state.record, null);
  assert.equal(state.error, "Exact record absent");
  assert.equal(Object.isFrozen(state), true);
});

test("ready settlement rejects a record from another canonical identity", () => {
  const state = beginResearchActiveRecordRequest(createResearchActiveRecordState(), focusB, 1);
  assert.throws(() => settleResearchActiveRecordSuccess(state, {
    generation: 1,
    requestKey: recordB.key,
    record: recordA,
  }), /exactly match/);
});
