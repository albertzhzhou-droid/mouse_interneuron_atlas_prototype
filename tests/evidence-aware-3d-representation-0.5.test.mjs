import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateEvidenceAware3dRepresentationContract05 } from "../scripts/validate-evidence-aware-3d-representation-contract-0.5.mjs";
import { buildEvidenceAware3dRepresentationContract05 } from "../tools/build_evidence_aware_3d_representation_contract_0_5.mjs";

const CONTRACT_URL = new URL("../data/evidence-aware-3d-representation-contract-0.5.json", import.meta.url);
const contractBytes = await readFile(CONTRACT_URL);
const contract = JSON.parse(contractBytes.toString("utf8"));
const clone = () => structuredClone(contract);

test("deterministically extends immutable representation 0.4 with one exact premotor comparison route", async () => {
  const built = await buildEvidenceAware3dRepresentationContract05();
  assert.deepEqual(built.bytes, contractBytes);
  assert.deepEqual(await validateEvidenceAware3dRepresentationContract05(), {
    releaseId: "ohri-evidence-aware-3d-representation-contract-0.5.0",
    stateCount: 9,
    routeCount: 16,
    baseRouteCount: 15,
    premotorComparisonRouteCount: 1,
    nativeDatSemanticAdmissionCount: 0,
    sameCellElectrophysiologyJoinCount: 0,
    sameSpecimenInternalStructureCount: 0,
    renderedInternalPrimitiveCount: 0,
    crossSourceIdentityCount: 0,
    projectRegistrationCount: 0,
  });
});

test("gates NMO 45718 to observed skeleton, radius derivative and unavailable internals", () => {
  const route = contract.routes.at(-1);
  assert.equal(route.routeId, "mouse.sc.repository_labeled_premotor_non_renshaw_l5_ventral_horn.observed.nmo_45718");
  assert.equal(route.stableIdAuthority, "NeuroMorpho:45718");
  assert.deepEqual(route.representationStateIds, ["OBS_SKELETON", "DER_RADIUS_SURFACE", "UNAVAILABLE"]);
  assert.equal(route.missingLayerPolicy, "zero_primitives");
  assert.equal(route.crossSourceIdentityCount, 0);
  assert.equal(route.projectRegistrationCount, 0);
});

test("rejects internal, identity, registration and source-receipt promotion", async () => {
  const internals = clone();
  internals.routes.at(-1).representationStateIds = ["OBS_SKELETON", "DER_RADIUS_SURFACE", "OBS_SEGMENTED_SURFACE"];
  await assert.rejects(() => validateEvidenceAware3dRepresentationContract05(internals), /representation-state|deterministic/i);

  const identity = clone();
  identity.routes.at(-1).crossSourceIdentityCount = 1;
  await assert.rejects(() => validateEvidenceAware3dRepresentationContract05(identity), /crossSourceIdentityCount|identity/i);

  const registration = clone();
  registration.routes.at(-1).projectRegistrationCount = 1;
  await assert.rejects(() => validateEvidenceAware3dRepresentationContract05(registration), /projectRegistrationCount|registration/i);

  const receipt = clone();
  receipt.buildInputs.premotorComparisonRoutePack.sha256 = "0".repeat(64);
  await assert.rejects(() => validateEvidenceAware3dRepresentationContract05(receipt), /receipt|SHA-256|deterministic/i);
});

test("locks repository-label, soma-standardization, preparation and zero-internal invariants", () => {
  assert.match(contract.globalInvariants.at(-4), /repository labels.*Renshaw exclusion/i);
  assert.match(contract.globalInvariants.at(-3), /eight original soma contours.*eight standardized type-1 points/i);
  assert.match(contract.globalInvariants.at(-2), /slicing fields.*SWC axes.*PCA morphometry.*shrinkage/i);
  assert.match(contract.globalInvariants.at(-1), /DAT contributes zero semantic objects.*physiology contributes zero exact object joins.*internals contribute zero rendered primitives/i);
});
