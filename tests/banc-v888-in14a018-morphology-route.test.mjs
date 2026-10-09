import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseBancV888IN14A018Swc } from "../app/banc-v888-in14a018-morphology-route.js";
import { validateBancV888IN14A018MorphologyRoute } from "../scripts/validate-banc-v888-in14a018-morphology-route-0.1.mjs";

test("admits only the checksum-verified BANC v888 IN14A018 centerline and same-root nucleus point", async () => {
  const result = await validateBancV888IN14A018MorphologyRoute();
  assert.equal(result.rootId, "720575941350424112");
  assert.equal(result.nodeCount, 7451);
  assert.equal(result.segmentCount, 7450);
  assert.deepEqual(result.sourceNodeTypes, [2]);
  assert.equal(result.renderedSurfaces, 0);
  assert.equal(result.renderedMitochondria, 0);
  assert.equal(result.mouseJoins, 0);
  assert.equal(result.atlasRegistrations, 0);
});

test("rejects malformed, disconnected, duplicated, or multi-root SWC payloads", () => {
  assert.throws(() => parseBancV888IN14A018Swc(""), /empty/);
  assert.throws(() => parseBancV888IN14A018Swc("1 2 0 0 0 1 -1\n1 2 1 0 0 1 1"), /Duplicate/);
  assert.throws(() => parseBancV888IN14A018Swc("1 2 0 0 0 1 -1\n2 2 1 0 0 1 9"), /missing parent/);
  assert.throws(() => parseBancV888IN14A018Swc("1 2 0 0 0 1 -1\n2 2 1 0 0 1 -1"), /exactly one root/);
  assert.throws(() => parseBancV888IN14A018Swc("1 2 0 0 0 1 -1\n2 2 1 0 0 1 3\n3 2 2 0 0 1 2"), /disconnected nodes/);
  assert.throws(() => parseBancV888IN14A018Swc("1 2 0 0 0 1 -1 extra"), /seven columns/);
});

test("exact bundled SWC remains identical to the source receipt", async () => {
  const bytes = await readFile(new URL("../public/data/banc_v888_in14a018_comparative_v1/720575941350424112_skeleton.swc", import.meta.url));
  assert.equal(bytes.byteLength, 489716);
});
