import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  validateRonzanoPremotorContractSemantics,
  validateRonzanoPremotorPositionReference,
} from "../scripts/validate-ronzano-premotor-position-reference-0.1.mjs";

const CONTRACT_URL = new URL("../data/ronzano-premotor-position-reference-0.1.json", import.meta.url);
const POSITIONS_URL = new URL("../public/data/ronzano_premotor_positions_v1/positions.json", import.meta.url);
const [contract, positionsBytes] = await Promise.all([
  readFile(CONTRACT_URL, "utf8").then(JSON.parse),
  readFile(POSITIONS_URL),
]);

test("rebuilds all 22 Ronzano workbooks into exact source-local point rows", async () => {
  assert.deepEqual(await validateRonzanoPremotorPositionReference(), {
    releaseId: "ohri-ronzano-premotor-position-reference-0.1.0",
    sourceFileCount: 22,
    sourceBundleBytes: 1046636,
    sourceBundleSha256: "2b8b75cae1a7cd559dc4b213923538c5a08b66ecd7a8dfec4b72a355aa8e7481",
    rawCoordinateRows: 14484,
    normalizedCoordinateRows: 17394,
    coordinateRowsAcrossRepresentations: 31878,
    derivedBytes: 1274690,
    derivedSha256: "abf46460d0e37c2ea82b90f2eaf6531d5df8f44e9dcea8448d43d321835184f3",
    crossFrameMismatchedPairs: 5,
    crossFramePointIdentityCount: 0,
    generatedCellGeometryCount: 0,
    registrationCount: 0,
  });
});

test("pins the derived payload and preserves neonatal, point-only, unregistered scope", () => {
  assert.equal(positionsBytes.byteLength, contract.derivedAsset.bytes);
  assert.equal(createHash("sha256").update(positionsBytes).digest("hex"), contract.derivedAsset.sha256);
  assert.equal(contract.rights.status, "CC-BY-4.0");
  assert.equal(contract.source.lifeStage.injection, "postnatal day P1-P2");
  assert.equal(contract.source.lifeStage.adultTransfer, "not_established");
  assert.equal(contract.coordinateFrames.registrationStatus, "source_local_unregistered");
  assert.equal(contract.coordinateFrames.registrationCount, 0);
  assert.equal(contract.coordinateFrames.atlasJoinCount, 0);
  assert.equal(contract.relationshipBoundary.samePhysicalCellAcrossFrames, "not_established");
  assert.match(contract.scientificBoundary, /labelled-cell position only/);
  assert.match(contract.scientificBoundary, /not a soma, neurite, molecular type, synapse, internal structure, adult placement, atlas registration/);
});

test("rejects identity, geometry, adult-transfer, measurement, and registration promotion", () => {
  const altered = structuredClone(contract);
  altered.source.lifeStage.adultTransfer = "established";
  altered.coordinateFrames.normalized.measurementUse = "allowed";
  altered.coordinateFrames.registrationCount = 1;
  altered.crossFrameAudit.admittedPointIdentityAcrossFrames = true;
  altered.relationshipBoundary.samePhysicalCellAcrossFrames = "established";
  altered.relationshipBoundary.registrationCount = 1;
  assert.throws(
    () => validateRonzanoPremotorContractSemantics(altered),
    /adult-transfer boundary changed|registration|measurement gate|point identity|same-cell/i,
  );
});

test("retains source-file plus one-based Excel row as the only admitted point identity", () => {
  assert.equal(contract.sourceObjectContract.rowIdentity, "source_file_id_plus_one_based_excel_row");
  assert.equal(contract.sourceFiles.length, 22);
  for (const file of contract.sourceFiles) {
    assert.equal(file.firstSourceRow, 1);
    assert.equal(file.lastSourceRow, file.rowCount);
    assert.match(file.sha256, /^[a-f0-9]{64}$/);
    assert.match(file.bundledPath, /^public\/data\/ronzano_premotor_positions_v1\/source\//);
  }
  assert.equal(contract.crossFrameAudit.pairCount, 11);
  assert.equal(contract.crossFrameAudit.exactRowCountAndZSequencePairs, 6);
  assert.equal(contract.crossFrameAudit.mismatchedRowCountPairs, 5);
  assert.ok(contract.crossFrameAudit.pairs.every((pair) => pair.admittedPointIdentityAcrossFrames === false));
});
