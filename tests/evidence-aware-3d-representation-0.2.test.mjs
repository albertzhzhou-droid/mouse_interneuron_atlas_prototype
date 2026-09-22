import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateEvidenceAware3dRepresentationContract02 } from "../scripts/validate-evidence-aware-3d-representation-contract-0.2.mjs";
import {
  buildEvidenceAware3dRepresentationContract02,
  serializeEvidenceAware3dRepresentationContract02,
} from "../tools/build_evidence_aware_3d_representation_contract_0_2.mjs";

const [contractBytes, baseBytes, routePackBytes] = await Promise.all([
  readFile(
    new URL(
      "../data/evidence-aware-3d-representation-contract-0.2.json",
      import.meta.url,
    ),
  ),
  readFile(
    new URL(
      "../data/evidence-aware-3d-representation-contract-0.1.json",
      import.meta.url,
    ),
  ),
  readFile(
    new URL(
      "../data/dorsal-horn-observed-morphology-route-pack-0.1.json",
      import.meta.url,
    ),
  ),
]);
const contract = JSON.parse(contractBytes.toString("utf8"));
const base = JSON.parse(baseBytes.toString("utf8"));
const routePack = JSON.parse(routePackBytes.toString("utf8"));

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

test("deterministically extends immutable 0.1 with exactly four route-pack routes", async () => {
  const built = await buildEvidenceAware3dRepresentationContract02();
  assert.ok(contractBytes.equals(built.bytes));
  assert.equal(
    serializeEvidenceAware3dRepresentationContract02(built.contract),
    contractBytes.toString("utf8"),
  );
  assert.equal(sha256(baseBytes), "9fdf8eaf3f37c50835e78af19d86c3e95269aeb67f43461a23f8298132eb9195");
  assert.equal(sha256(routePackBytes), "923db6a9ed013e856ffc7c6ab601c67b25608ac68572538c578fd75fa41fe593");
  assert.deepEqual(contract.representationStates, base.representationStates);
  assert.deepEqual(contract.routes.slice(0, 7), base.routes);
  assert.deepEqual(
    contract.routes.slice(7).map((route) => route.routeId),
    routePack.routes.map((route) => route.routeId),
  );
  assert.equal(contract.routes.length, 11);
});

test("validates nine states and eleven zero-join representation routes", async () => {
  assert.deepEqual(await validateEvidenceAware3dRepresentationContract02(), {
    releaseId: "ohri-evidence-aware-3d-representation-contract-0.2.0",
    stateCount: 9,
    routeCount: 11,
    baseRouteCount: 7,
    dorsalHornRouteCount: 4,
    sourceDiameterAvailableRouteCount: 2,
    sourceNoDiameterRouteCount: 2,
    unavailableRoutePrimitiveCount: 0,
    crossSourceIdentityCount: 0,
    projectRegistrationCount: 0,
  });
});

test("gates each appended route by exact diameter and identity evidence", () => {
  const appended = new Map(
    contract.routes.slice(7).map((route) => [route.stableIdAuthority, route]),
  );
  assert.deepEqual(appended.get("NeuroMorpho:249676").representationStateIds, [
    "OBS_SKELETON",
    "UNAVAILABLE",
  ]);
  assert.deepEqual(appended.get("NeuroMorpho:170035").representationStateIds, [
    "OBS_SKELETON",
    "UNAVAILABLE",
  ]);
  assert.deepEqual(appended.get("NeuroMorpho:108974").representationStateIds, [
    "OBS_SKELETON",
    "DER_RADIUS_SURFACE",
    "UNAVAILABLE",
  ]);
  assert.deepEqual(appended.get("NeuroMorpho:104003").representationStateIds, [
    "OBS_SKELETON",
    "DER_RADIUS_SURFACE",
    "UNAVAILABLE",
  ]);
  assert.match(
    appended.get("NeuroMorpho:104003").label,
    /PdynCre \/ AAV-eGFP, Sst2a-receptor-positive inhibitory interneuron/,
  );
  assert.doesNotMatch(
    appended.get("NeuroMorpho:104003").label,
    /SST\/VGLUT2 neuron/i,
  );
});

test("mutation gate rejects invented radius surfaces, false filename identity, joins and input drift", async () => {
  const inventedRadius = structuredClone(contract);
  inventedRadius.routes
    .find((route) => route.stableIdAuthority === "NeuroMorpho:249676")
    .representationStateIds.splice(1, 0, "DER_RADIUS_SURFACE");
  await assert.rejects(
    () => validateEvidenceAware3dRepresentationContract02(inventedRadius),
    /representation-state authority|placeholder radii|deterministic builder output/i,
  );

  const falseIdentity = structuredClone(contract);
  falseIdentity.routes.find(
    (route) => route.stableIdAuthority === "NeuroMorpho:104003",
  ).label = "SST/VGLUT2 neuron";
  await assert.rejects(
    () => validateEvidenceAware3dRepresentationContract02(falseIdentity),
    /corrected PdynCre\/Sst2a-receptor identity|filename channels|deterministic builder output/i,
  );

  const joined = structuredClone(contract);
  joined.routes[7].crossSourceIdentityCount = 1;
  await assert.rejects(
    () => validateEvidenceAware3dRepresentationContract02(joined),
    /crossSourceIdentityCount|constant|join/i,
  );

  const driftedInput = structuredClone(contract);
  driftedInput.buildInputs.dorsalHornRoutePack.sha256 = "0".repeat(64);
  await assert.rejects(
    () => validateEvidenceAware3dRepresentationContract02(driftedInput),
    /route-pack input SHA-256 drifted|route-pack receipt|deterministic builder output/i,
  );
});
