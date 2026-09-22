import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateEvidenceAware3dRepresentationContract } from "../scripts/validate-evidence-aware-3d-representation-contract-0.1.mjs";

const contract = JSON.parse(await readFile(new URL("../data/evidence-aware-3d-representation-contract-0.1.json", import.meta.url), "utf8"));

test("locks nine evidence-aware representation states across seven routes", async () => {
  assert.deepEqual(await validateEvidenceAware3dRepresentationContract(), {
    releaseId: "ohri-evidence-aware-3d-representation-contract-0.1.0",
    stateCount: 9,
    routeCount: 7,
    unavailableRoutePrimitiveCount: 0,
    crossSourceIdentityCount: 0,
    projectRegistrationCount: 0,
  });
  assert.deepEqual(contract.runtimeMetadataRequirements, [
    "stableId",
    "representationState",
    "sourceFrame",
    "sourceVersion",
    "sourceReceiptSha256",
    "cellMorphologyClaim",
    "projectRegistrationCount",
    "crossSourceIdentityCount",
  ]);
});

test("keeps raw texture distinct from segmented surface and synthetic data glyphs", () => {
  const byId = new Map(contract.representationStates.map((state) => [state.id, state]));
  assert.equal(byId.get("OBS_RAW_TEXTURE").currentlyRendered, false);
  assert.match(byId.get("OBS_RAW_TEXTURE").forbiddenClaim, /segmentation/);
  assert.match(byId.get("OBS_SEGMENTED_SURFACE").forbiddenClaim, /membrane/);
  assert.match(byId.get("SYN_DATA_GLYPH").forbiddenClaim, /soma/);
  assert.equal(byId.get("UNAVAILABLE").visualRule, "zero primitives plus explicit missingness text");
});

test("rejects procedural internals, joins, registrations and source-receipt drift", async () => {
  const joined = structuredClone(contract);
  joined.routes[3].crossSourceIdentityCount = 1;
  await assert.rejects(() => validateEvidenceAware3dRepresentationContract(joined), /crossSourceIdentityCount|constant|join/i);

  const registered = structuredClone(contract);
  registered.routes[0].projectRegistrationCount = 1;
  await assert.rejects(() => validateEvidenceAware3dRepresentationContract(registered), /projectRegistrationCount|constant|registration/i);

  const drifted = structuredClone(contract);
  drifted.routes[3].sourceReceipt.sha256 = "0".repeat(64);
  await assert.rejects(() => validateEvidenceAware3dRepresentationContract(drifted), /source SHA-256 drifted/i);
});
