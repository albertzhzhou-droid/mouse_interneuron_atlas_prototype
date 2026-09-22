import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateEvidenceAware3dRepresentationContract03 } from "../scripts/validate-evidence-aware-3d-representation-contract-0.3.mjs";
import {
  buildEvidenceAware3dRepresentationContract03,
  serializeEvidenceAware3dRepresentationContract03,
} from "../tools/build_evidence_aware_3d_representation_contract_0_3.mjs";

const [contractBytes, baseBytes, routePackBytes] = await Promise.all([
  readFile(new URL("../data/evidence-aware-3d-representation-contract-0.3.json", import.meta.url)),
  readFile(new URL("../data/evidence-aware-3d-representation-contract-0.2.json", import.meta.url)),
  readFile(new URL("../data/functional-class-observed-morphology-route-pack-0.1.json", import.meta.url)),
]);
const contract = JSON.parse(contractBytes.toString("utf8"));
const base = JSON.parse(baseBytes.toString("utf8"));
const routePack = JSON.parse(routePackBytes.toString("utf8"));

test("deterministically extends immutable 0.2 with exactly two functional-class routes", async () => {
  const built = await buildEvidenceAware3dRepresentationContract03();
  assert.ok(contractBytes.equals(built.bytes));
  assert.equal(serializeEvidenceAware3dRepresentationContract03(built.contract), contractBytes.toString("utf8"));
  assert.deepEqual(contract.representationStates, base.representationStates);
  assert.deepEqual(contract.routes.slice(0, base.routes.length), base.routes);
  assert.deepEqual(contract.routes.slice(base.routes.length).map((route) => route.routeId), routePack.routes.map((route) => route.routeId));
  assert.equal(contract.routes.length, 13);
});

test("validates nine states and thirteen zero-join representation routes", async () => {
  assert.deepEqual(await validateEvidenceAware3dRepresentationContract03(), {
    releaseId: "ohri-evidence-aware-3d-representation-contract-0.3.0",
    stateCount: 9,
    routeCount: 13,
    baseRouteCount: 11,
    functionalClassRouteCount: 2,
    sourceDiameterAvailableRouteCount: 2,
    nativeDatSemanticAdmissionCount: 0,
    sameCellElectrophysiologyJoinCount: 0,
    unavailableRoutePrimitiveCount: 0,
    crossSourceIdentityCount: 0,
    projectRegistrationCount: 0,
  });
});

test("gates both appended routes to observed skeleton, radius derivative and unavailable internals", () => {
  const appended = new Map(contract.routes.slice(base.routes.length).map((route) => [route.stableIdAuthority, route]));
  for (const id of ["NeuroMorpho:45674", "NeuroMorpho:50424"]) {
    assert.deepEqual(appended.get(id).representationStateIds, ["OBS_SKELETON", "DER_RADIUS_SURFACE", "UNAVAILABLE"]);
    assert.equal(appended.get(id).renderedPrimitivePolicy, "checksum_verified_swc_or_source_radius_derivative_only_native_dat_zero_semantics");
  }
});

test("mutation gate rejects DAT promotion, physiology joins, route drift and input drift", async () => {
  const dat = structuredClone(contract);
  dat.routes.find((route) => route.stableIdAuthority === "NeuroMorpho:45674").renderedPrimitivePolicy = "native_dat_objects";
  await assert.rejects(() => validateEvidenceAware3dRepresentationContract03(dat), /rendered-primitive policy|deterministic builder output/i);

  const physiology = structuredClone(contract);
  physiology.routes.find((route) => route.stableIdAuthority === "NeuroMorpho:50424").crossSourceIdentityCount = 1;
  await assert.rejects(() => validateEvidenceAware3dRepresentationContract03(physiology), /crossSourceIdentityCount|join|constant/i);

  const missingRoute = structuredClone(contract);
  missingRoute.routes.pop();
  await assert.rejects(() => validateEvidenceAware3dRepresentationContract03(missingRoute), /must NOT have fewer than 13 items|exactly 13 routes/i);

  const driftedInput = structuredClone(contract);
  driftedInput.buildInputs.functionalClassRoutePack.sha256 = "0".repeat(64);
  await assert.rejects(() => validateEvidenceAware3dRepresentationContract03(driftedInput), /route-pack input SHA-256 drifted|route-pack receipt|deterministic builder output/i);
});
