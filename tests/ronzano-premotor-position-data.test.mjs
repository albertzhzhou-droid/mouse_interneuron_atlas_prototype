import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  displayCoordinate,
  pointReceipt,
  positionGroupsFor,
  validateRonzanoPositionPayload,
} from "../app/ronzano-premotor-position-data.js";

const [contract, payload] = await Promise.all([
  readFile(new URL("../data/ronzano-premotor-position-reference-0.1.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../public/data/ronzano_premotor_positions_v1/positions.json", import.meta.url), "utf8").then(JSON.parse),
]);

test("validates the runtime point payload without creating identities or registrations", () => {
  assert.equal(validateRonzanoPositionPayload(payload, contract), payload);
  assert.deepEqual(payload.totals, {
    sourceFileCount: 22,
    coordinateRowCountAcrossRepresentations: 31878,
    byFrame: { raw: 14484, normalized: 17394 },
  });
  assert.deepEqual(payload.identityPolicy, {
    rowIdentity: "source_file_id_plus_one_based_excel_row",
    crossFramePointIdentity: "not_established",
    crossSourceIdentity: "not_established",
    registrationCount: 0,
  });
});

test("filters exact groups without pooling or duplicating source rows", () => {
  const rawTaL4 = positionGroupsFor(payload, { frame: "raw", muscle: "TA", segment: "L4" });
  assert.equal(rawTaL4.length, 1);
  assert.equal(rawTaL4[0].sourceFileId, "RONZANO-81976-RAW-TA-L4");
  assert.equal(rawTaL4[0].points.length, 1923);
  assert.equal(positionGroupsFor(payload, { frame: "raw", muscle: "LG", segment: "L1" }).length, 0);
  assert.equal(positionGroupsFor(payload, { frame: "normalized", muscle: "TA", segment: "all" }).reduce((sum, group) => sum + group.points.length, 0), 7635);
  assert.equal(positionGroupsFor(payload, { frame: "normalized", muscle: "LG", segment: "all" }).reduce((sum, group) => sum + group.points.length, 0), 9759);
});

test("uses only the declared display transforms and preserves the exact source coordinate in receipts", () => {
  assert.deepEqual(displayCoordinate([0.25, 0.75, -120], "normalized"), [425, 675, -120]);
  assert.deepEqual(displayCoordinate([12.5, -2, 30], "raw"), [12.5, -2, 30]);
  const group = positionGroupsFor(payload, { frame: "raw", muscle: "TA", segment: "L1" })[0];
  const receipt = pointReceipt(group, 0, "raw");
  assert.equal(receipt.id, `${group.sourceFileId}:row:1`);
  assert.equal(receipt.sourceRow, 1);
  assert.deepEqual(receipt.sourceCoordinate, group.points[0]);
  assert.equal(receipt.objectClaim, "labelled_cell_position_only");
  assert.equal(receipt.registrationCount, 0);
  assert.throws(() => displayCoordinate([1, 2, 3], "atlas"), /Unsupported position frame/);
});

test("fails closed on a fabricated atlas registration or source-row count", () => {
  const registered = structuredClone(payload);
  registered.identityPolicy.registrationCount = 1;
  assert.throws(() => validateRonzanoPositionPayload(registered, contract), /creates a registration/);

  const truncated = structuredClone(payload);
  truncated.representations[0].groups[0].points.pop();
  assert.throws(() => validateRonzanoPositionPayload(truncated, contract), /row count mismatch/);
});
