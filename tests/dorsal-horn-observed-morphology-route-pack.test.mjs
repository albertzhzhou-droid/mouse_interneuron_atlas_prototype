import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateDorsalHornObservedMorphologyRoutePack } from "../scripts/validate-dorsal-horn-observed-morphology-route-pack-0.1.mjs";

const contract = JSON.parse(
  await readFile(new URL("../data/dorsal-horn-observed-morphology-route-pack-0.1.json", import.meta.url), "utf8"),
);

test("pins four independent dorsal-horn routes without expanding the frozen census", async () => {
  assert.deepEqual(await validateDorsalHornObservedMorphologyRoutePack(), {
    releaseId: "ohri-dorsal-horn-observed-morphology-route-pack-0.1.0",
    routeCount: 4,
    uniqueMainSceneNeuronCount: 8,
    censusRecordCount: 142,
    censusExpansionCount: 0,
    supplementaryRecordCount: 2,
    sourceDiameterAvailableCount: 2,
    sourceCompleteAxonCount: 0,
    internalPrimitiveCount: 0,
    crossSourceIdentityCount: 0,
    projectRegistrationCount: 0,
  });

  assert.deepEqual(
    contract.routes.map((route) => [route.sourceRecord.neuronId, route.sourceObjects.swc.sha256]),
    [
      [249676, "b5a96ebc6979f0022c70a26eaa6a5c060545a05d2164852a5a5dd8dc290f4f75"],
      [108974, "0fc8e7050e455ed1f79fa5a8e4da304c69054fb5ddd0167fcb3970c5d4c0982d"],
      [170035, "73f85373bd426e8ef4dc0f95b73a61678ffb454d963ec292a403ad31a0f116a6"],
      [104003, "0f24943c43854cbe48f8bebfd4b45b905a5f897580d4dc25fd55c8ec9c4b8d8d"],
    ],
  );
});

test("rejects duplicate identities and false census promotion", async () => {
  const duplicate = structuredClone(contract);
  duplicate.routes[1].routeId = duplicate.routes[0].routeId;
  await assert.rejects(() => validateDorsalHornObservedMorphologyRoutePack(duplicate), /route IDs are not unique/i);

  const promoted = structuredClone(contract);
  promoted.routes.find((route) => route.sourceRecord.neuronId === 170035).censusMembership = true;
  await assert.rejects(() => validateDorsalHornObservedMorphologyRoutePack(promoted), /census-membership|actual census membership/i);
});

test("rejects unsupported diameter, molecular identity, internals, joins and registration", async () => {
  const diameter = structuredClone(contract);
  const grpr = diameter.routes.find((route) => route.sourceRecord.neuronId === 249676);
  grpr.renderingContract.radiusSurface.available = true;
  grpr.renderingContract.radiusSurface.authority = "DERIVED_FROM_OBSERVED_RADIUS";
  await assert.rejects(() => validateDorsalHornObservedMorphologyRoutePack(diameter), /No Diameter route incorrectly authorizes a surface/i);

  const identity = structuredClone(contract);
  const pdyn = identity.routes.find((route) => route.sourceRecord.neuronId === 104003);
  pdyn.title = "SST/VGLUT2-coexpressing interneuron";
  await assert.rejects(() => validateDorsalHornObservedMorphologyRoutePack(identity), /corrected route identity label/i);

  const internals = structuredClone(contract);
  internals.routes[0].renderingContract.sameSpecimenInternalStructure.renderedPrimitiveCount = 1;
  await assert.rejects(() => validateDorsalHornObservedMorphologyRoutePack(internals), /renderedPrimitiveCount|internal primitives|constant/i);

  const joined = structuredClone(contract);
  joined.routes[0].identityBoundary.selectedSciEntityRelationship = "mouse.sc.vsx2_hoxa10";
  await assert.rejects(() => validateDorsalHornObservedMorphologyRoutePack(joined), /selectedSciEntityRelationship|route relationship|constant/i);

  const registered = structuredClone(contract);
  registered.routes[0].identityBoundary.projectRegistrationCount = 1;
  await assert.rejects(() => validateDorsalHornObservedMorphologyRoutePack(registered), /projectRegistrationCount|identity join or registration|constant/i);
});
