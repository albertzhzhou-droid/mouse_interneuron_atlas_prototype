import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateEvidenceAware3dRepresentationContract04 } from "../scripts/validate-evidence-aware-3d-representation-contract-0.4.mjs";
import {
  buildEvidenceAware3dRepresentationContract04,
  serializeEvidenceAware3dRepresentationContract04,
} from "../tools/build_evidence_aware_3d_representation_contract_0_4.mjs";

const [contractBytes, baseBytes, routePackBytes] = await Promise.all([
  readFile(new URL("../data/evidence-aware-3d-representation-contract-0.4.json", import.meta.url)),
  readFile(new URL("../data/evidence-aware-3d-representation-contract-0.3.json", import.meta.url)),
  readFile(new URL("../data/prp-dorsal-horn-observed-morphology-route-pack-0.1.json", import.meta.url)),
]);
const contract = JSON.parse(contractBytes.toString("utf8"));
const base = JSON.parse(baseBytes.toString("utf8"));
const routePack = JSON.parse(routePackBytes.toString("utf8"));

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

test("deterministically extends the exact immutable 0.3 artifact with two PrP routes", async () => {
  const built = await buildEvidenceAware3dRepresentationContract04();
  assert.ok(contractBytes.equals(built.bytes));
  assert.equal(serializeEvidenceAware3dRepresentationContract04(built.contract), contractBytes.toString("utf8"));
  assert.equal(baseBytes.byteLength, 18496);
  assert.equal(sha256(baseBytes), "00c464afc793b8853d176366ece708f993c89920dba4027789bc7e84d9b03aa6");
  assert.equal(routePackBytes.byteLength, 31435);
  assert.equal(sha256(routePackBytes), "a8737dff3fbfe244d36e2af19b32e1dd8142e2626a90c0d89c00881b83eaf709");
  assert.deepEqual(contract.representationStates, base.representationStates);
  assert.deepEqual(contract.routes.slice(0, base.routes.length), base.routes);
  assert.deepEqual(contract.runtimeMetadataRequirements, base.runtimeMetadataRequirements);
  assert.deepEqual(contract.globalInvariants.slice(0, base.globalInvariants.length), base.globalInvariants);
  assert.deepEqual(contract.routes.slice(base.routes.length).map((route) => route.routeId), routePack.routes.map((route) => route.routeId));
  assert.equal(contract.routes.length, 15);
});

test("validates nine states and fifteen zero-semantic representation routes", async () => {
  assert.deepEqual(await validateEvidenceAware3dRepresentationContract04(), {
    releaseId: "ohri-evidence-aware-3d-representation-contract-0.4.0",
    stateCount: 9,
    routeCount: 15,
    baseRouteCount: 13,
    prpRouteCount: 2,
    sourceDiameterAvailableRouteCount: 2,
    nativeDatSemanticAdmissionCount: 0,
    sameCellElectrophysiologyJoinCount: 0,
    sameSpecimenInternalStructureCount: 0,
    renderedInternalPrimitiveCount: 0,
    crossSourceIdentityCount: 0,
    projectRegistrationCount: 0,
  });
});

test("gates both exact PrP routes to observed skeleton, radius derivative and unavailable internals", () => {
  const appended = new Map(contract.routes.slice(base.routes.length).map((route) => [route.stableIdAuthority, route]));
  assert.deepEqual([...appended.keys()], ["NeuroMorpho:50394", "NeuroMorpho:50408"]);
  for (const id of appended.keys()) {
    assert.deepEqual(appended.get(id).representationStateIds, ["OBS_SKELETON", "DER_RADIUS_SURFACE", "UNAVAILABLE"]);
    assert.equal(appended.get(id).renderedPrimitivePolicy, "checksum_verified_swc_or_source_radius_derivative_only_native_dat_zero_semantics");
    assert.equal(appended.get(id).crossSourceIdentityCount, 0);
    assert.equal(appended.get(id).projectRegistrationCount, 0);
  }
});

test("preserves positive-only marker, preparation-stage and object-join boundaries", () => {
  const [nnos, galanin] = routePack.routes;
  assert.deepEqual(nnos.sourceRecord.cellTypeLabels, [
    "Neuronal Nitric Oxide Synthase (nNOS)-positive",
    "prion protein (PrP) promoter-positive",
    "interneuron",
  ]);
  assert.deepEqual(galanin.sourceRecord.cellTypeLabels, [
    "galanin-expressing",
    "prion protein (PrP) promoter-positive",
    "interneuron",
  ]);
  for (const route of routePack.routes) {
    assert.equal(route.sourceRecord.repositorySlicingThicknessMicrometre, 300);
    assert.match(route.sourceRecord.paperPreparationContext, /60 micrometre serial resectioning/i);
    assert.equal(route.nativeDatContract.semanticObjectCountAdmitted, 0);
    assert.equal(route.identityBoundary.sameCellElectrophysiologyJoinStatus, "not_established");
    assert.equal(route.identityBoundary.paperMentionsExactNeuronIdOrFilename, false);
    assert.equal(route.renderingContract.sameSpecimenInternalStructure.renderedPrimitiveCount, 0);
    assert.equal(route.fidelityRecord.axon.completeAxon, false);
  }
  assert.match(contract.globalInvariants.at(-3), /does not establish endogenous PrP protein abundance/i);
});

test("mutation gate rejects DAT promotion, internal invention, joins, route drift and input drift", async () => {
  const dat = structuredClone(contract);
  dat.routes.find((route) => route.stableIdAuthority === "NeuroMorpho:50394").renderedPrimitivePolicy = "native_dat_objects";
  await assert.rejects(() => validateEvidenceAware3dRepresentationContract04(dat), /rendered-primitive policy|deterministic builder output/i);

  const internals = structuredClone(contract);
  internals.routes.find((route) => route.stableIdAuthority === "NeuroMorpho:50408").representationStateIds = ["OBS_SKELETON", "DER_RADIUS_SURFACE"];
  await assert.rejects(() => validateEvidenceAware3dRepresentationContract04(internals), /representation-state authority|deterministic builder output/i);

  const joined = structuredClone(contract);
  joined.routes.find((route) => route.stableIdAuthority === "NeuroMorpho:50408").crossSourceIdentityCount = 1;
  await assert.rejects(() => validateEvidenceAware3dRepresentationContract04(joined), /crossSourceIdentityCount|identity|constant/i);

  const missingRoute = structuredClone(contract);
  missingRoute.routes.pop();
  await assert.rejects(() => validateEvidenceAware3dRepresentationContract04(missingRoute), /must NOT have fewer than 15 items|exactly 15 routes/i);

  const driftedInput = structuredClone(contract);
  driftedInput.buildInputs.prpDorsalHornRoutePack.sha256 = "0".repeat(64);
  await assert.rejects(() => validateEvidenceAware3dRepresentationContract04(driftedInput), /route-pack input SHA-256 drifted|route-pack receipt|deterministic builder output/i);
});
