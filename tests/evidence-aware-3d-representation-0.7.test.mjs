import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateEvidenceAware3dRepresentationContract07 } from "../scripts/validate-evidence-aware-3d-representation-contract-0.7.mjs";
import { buildEvidenceAware3dRepresentationContract07 } from "../tools/build_evidence_aware_3d_representation_contract_0_7.mjs";

const [contractBytes, parent, routePack] = await Promise.all([
  readFile(new URL("../data/evidence-aware-3d-representation-contract-0.7.json", import.meta.url)),
  readFile(new URL("../data/evidence-aware-3d-representation-contract-0.6.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json", import.meta.url), "utf8").then(JSON.parse),
]);
const contract = JSON.parse(contractBytes.toString("utf8"));
const clone = () => structuredClone(contract);

test("deterministically appends 30 source-specific routes without changing the 0.6 parent", async () => {
  const built = await buildEvidenceAware3dRepresentationContract07();
  assert.deepEqual(built.bytes, contractBytes);
  assert.deepEqual(contract.routes.slice(0, parent.routes.length), parent.routes);
  assert.deepEqual(await validateEvidenceAware3dRepresentationContract07(), {
    releaseId: "ohri-evidence-aware-3d-representation-contract-0.7.0",
    stateCount: 10,
    routeCount: 47,
    supplementaryRouteCount: 30,
    radiusDerivedRouteCount: 10,
    centerlineOnlyRouteCount: 20,
    internalPrimitiveCount: 0,
    crossSourceIdentityCount: 0,
    projectRegistrationCount: 0,
  });
});

test("routes each supplementary NMO stable ID to its exact geometry and source SWC receipt", () => {
  const routes = contract.routes.slice(parent.routes.length);
  assert.deepEqual(routes.map((route) => route.routeId), routePack.routes.map((route) => route.routeId));
  for (const [index, route] of routes.entries()) {
    const source = routePack.routes[index];
    const hasDiameter = source.sourceRecord.sourceAttributes.startsWith("Diameter,");
    assert.equal(route.stableIdAuthority, source.sourceRecord.assetId);
    assert.deepEqual(route.representationStateIds, ["OBS_SKELETON", ...(hasDiameter ? ["DER_RADIUS_SURFACE"] : []), "UNAVAILABLE"]);
    assert.equal(route.representationFrames[0].path, source.sourceObjects.geometry.path);
    assert.equal(route.representationFrames[0].sourceSwc.path, source.sourceObjects.swc.path);
    assert.equal(route.representationFrames[0].overlayAllowed, false);
    assert.equal(route.crossSourceIdentityCount, 0);
    assert.equal(route.projectRegistrationCount, 0);
  }
});

test("fails closed if an unreported radius surface, cross-source identity, or overlay is introduced", async () => {
  const noDiameter = clone();
  const route = noDiameter.routes.find((candidate) => candidate.stableIdAuthority === "NeuroMorpho:322379");
  route.representationStateIds.push("DER_RADIUS_SURFACE");
  await assert.rejects(() => validateEvidenceAware3dRepresentationContract07(noDiameter), /rendering states|deterministic|schema/i);

  const identity = clone();
  identity.routes.at(-1).crossSourceIdentityCount = 1;
  await assert.rejects(() => validateEvidenceAware3dRepresentationContract07(identity), /crossSourceIdentityCount|schema|deterministic/i);

  const overlay = clone();
  overlay.routes.at(-1).representationFrames[0].overlayAllowed = true;
  await assert.rejects(() => validateEvidenceAware3dRepresentationContract07(overlay), /overlay|schema|deterministic/i);
});
