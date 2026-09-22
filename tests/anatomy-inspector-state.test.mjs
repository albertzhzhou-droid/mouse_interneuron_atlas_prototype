import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPlanePresenceNavigation,
  isSelectedStructureVisible,
} from "../app/anatomy-inspector-state.js";

const planes = [
  { presence: "missing" },
  { presence: "present" },
  { presence: "present" },
  { presence: "missing" },
  { presence: "present" },
  { presence: "missing" },
];

test("builds non-wrapping previous and next present-plane navigation", () => {
  assert.deepEqual(buildPlanePresenceNavigation(planes, 3), {
    presentIndices: [1, 2, 4],
    previousPresentIndex: 2,
    nextPresentIndex: 4,
  });
  assert.deepEqual(buildPlanePresenceNavigation(planes, 1), {
    presentIndices: [1, 2, 4],
    previousPresentIndex: null,
    nextPresentIndex: 2,
  });
  assert.deepEqual(buildPlanePresenceNavigation(planes, 4), {
    presentIndices: [1, 2, 4],
    previousPresentIndex: 2,
    nextPresentIndex: null,
  });
});

test("keeps filter visibility separate from the retained anatomy selection", () => {
  const filtered = [{ identifier: 6 }, { identifier: 11 }];
  assert.equal(isSelectedStructureVisible(filtered, 6), true);
  assert.equal(isSelectedStructureVisible(filtered, 1), false);
  assert.equal(isSelectedStructureVisible([], 6), false);
});

test("rejects malformed plane-state input", () => {
  assert.throws(() => buildPlanePresenceNavigation([], 0), /planes are missing/);
  assert.throws(() => buildPlanePresenceNavigation(planes, 6), /index is invalid/);
  assert.throws(
    () => buildPlanePresenceNavigation([{ presence: "unknown" }], 0),
    /presence is invalid/,
  );
});
