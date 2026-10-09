import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateEvidenceAware3dRepresentationContract06 } from "../scripts/validate-evidence-aware-3d-representation-contract-0.6.mjs";
import { buildEvidenceAware3dRepresentationContract06 } from "../tools/build_evidence_aware_3d_representation_contract_0_6.mjs";

const contractBytes = await readFile(new URL("../data/evidence-aware-3d-representation-contract-0.6.json", import.meta.url));
const contract = JSON.parse(contractBytes.toString("utf8"));
const clone = () => structuredClone(contract);

test("deterministically appends NMO 108978 and its source-native state without mutating 0.5", async () => {
  const built = await buildEvidenceAware3dRepresentationContract06();
  assert.deepEqual(built.bytes, contractBytes);
  assert.deepEqual(await validateEvidenceAware3dRepresentationContract06(), {
    releaseId: "ohri-evidence-aware-3d-representation-contract-0.6.0",
    stateCount: 10,
    routeCount: 17,
    appendedRouteId: "mouse.sc.tac1_sp_dorsal_horn.observed.nmo_108978",
    nativeSomaLineLoopCount: 12,
    nativeSomaLineLoopVertexCount: 2614,
    internalPrimitiveCount: 0,
    crossSourceIdentityCount: 0,
    projectRegistrationCount: 0,
  });
});

test("records two source-local frames without a DAT-to-SWC overlay", () => {
  const route = contract.routes.at(-1);
  assert.equal(route.stableIdAuthority, "NeuroMorpho:108978");
  assert.deepEqual(route.representationStateIds, ["OBS_SKELETON", "DER_RADIUS_SURFACE", "OBS_SOURCE_NATIVE_SOMA_LINE_LOOP", "UNAVAILABLE"]);
  assert.equal(route.sourceFrame, "multiple_source_local_frames_without_overlay");
  assert.deepEqual(route.representationFrames.map(({ stateId, sourceFrame, overlayAllowed }) => ({ stateId, sourceFrame, overlayAllowed })), [
    { stateId: "OBS_SKELETON", sourceFrame: "NeuroMorpho_CNG_standardized_local_frame", overlayAllowed: false },
    { stateId: "OBS_SOURCE_NATIVE_SOMA_LINE_LOOP", sourceFrame: "Neurolucida_DAT_source_native_unregistered", overlayAllowed: false },
  ]);
  assert.equal(route.representationFrames[1].primitiveCount, 12);
  assert.equal(route.representationFrames[1].vertexCount, 2614);
});

test("rejects frame overlay, census inflation, internal primitives and false cell-type promotion", async () => {
  const overlay = clone();
  overlay.routes.at(-1).representationFrames[1].overlayAllowed = true;
  await assert.rejects(() => validateEvidenceAware3dRepresentationContract06(overlay), /overlay|deterministic/i);

  const internal = clone();
  internal.routes.at(-1).representationStateIds.push("OBS_SEGMENTED_SURFACE");
  await assert.rejects(() => validateEvidenceAware3dRepresentationContract06(internal), /representationStateIds|deterministic/i);

  const identity = clone();
  identity.routes.at(-1).crossSourceIdentityCount = 1;
  await assert.rejects(() => validateEvidenceAware3dRepresentationContract06(identity), /crossSourceIdentityCount|deterministic/i);

  const state = clone();
  state.representationStates.at(-1).geometryAuthority = "DER";
  await assert.rejects(() => validateEvidenceAware3dRepresentationContract06(state), /state authority|deterministic/i);
});
