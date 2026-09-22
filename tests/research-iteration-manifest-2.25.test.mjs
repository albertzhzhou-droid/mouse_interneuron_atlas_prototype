import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest225 } from "../scripts/validate-research-iteration-manifest-2.25.mjs";

const manifestBytes = await readFile(
  new URL("../data/research-iteration-manifest-2.25.json", import.meta.url),
);
const manifest = JSON.parse(manifestBytes.toString("utf8"));

test("validates the exact immutable 2.25 snapshot without rebuilding mutable inputs", async () => {
  assert.deepEqual(await validateResearchIterationManifest225(), {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.25.0",
    inputCount: 22,
    frozenExemplarCount: 5,
    censusRecordCount: 142,
    routePackMembershipCount: 4,
    overlapCount: 2,
    supplementaryRecordCount: 2,
    activeUniqueMorphologyCount: 8,
    namedDorsalHornRouteCount: 5,
    representationStateCount: 9,
    representationRouteCount: 11,
    sourcePackageCount: 24,
    recordSetCount: 25,
    researchUpgradeCount: 118,
    crossSourceIdentityCount: 0,
    registrationCount: 0,
    renderedInternalPrimitiveCount: 0,
  });

  assert.equal(
    manifest.manifestContentSha256,
    "f7bc56dfe6671b67f0fa8a5115faadf615e98e056d207894c75441fb3a5dc6e1",
  );
  assert.equal(
    manifest.manifestContentSha256,
    computeManifestContentSha256(manifest),
  );
  assert.deepEqual(manifest.application, {
    name: "ohri-mouse-interneuron-atlas-prototype",
    version: "2.25.0-research.1",
  });
});

test("pins all 22 historical authoritative inputs and registry receipts", () => {
  assert.equal(manifest.integrity.inputCount, 22);
  assert.equal(manifest.authoritativeInputs.length, 22);
  assert.equal(new Set(manifest.authoritativeInputs.map((input) => input.path)).size, 22);

  const inputs = new Map(
    manifest.authoritativeInputs.map((input) => [input.id, input]),
  );
  assert.deepEqual(
    {
      bytes: inputs.get("researchSourceRegistry").bytes,
      sha256: inputs.get("researchSourceRegistry").sha256,
    },
    {
      bytes: 84564,
      sha256: "3535f2e9b501743a3c432821bb2f944abcf18c6b68b1f02a0cccd52af0d9157b",
    },
  );
  assert.deepEqual(
    {
      bytes: inputs.get("researchModelUpgradeRegistry").bytes,
      sha256: inputs.get("researchModelUpgradeRegistry").sha256,
    },
    {
      bytes: 224132,
      sha256: "5d39f33d892b70fafe5b0fc3f48bd9413f65cb5af96a1ebcc515cdcf279e0b04",
    },
  );
  assert.deepEqual(
    {
      bytes: inputs.get("dorsalHornObservedMorphologyRoutePackContract").bytes,
      sha256: inputs.get("dorsalHornObservedMorphologyRoutePackContract").sha256,
    },
    {
      bytes: 42226,
      sha256: "923db6a9ed013e856ffc7c6ab601c67b25608ac68572538c578fd75fa41fe593",
    },
  );
  assert.deepEqual(
    {
      bytes: inputs.get("dorsalHornObservedMorphologySupplementaryAssetManifest")
        .bytes,
      sha256: inputs.get(
        "dorsalHornObservedMorphologySupplementaryAssetManifest",
      ).sha256,
    },
    {
      bytes: 1696,
      sha256: "4f64fb595a4362cf0403cb0d3abc3c6fdc14b7f74d473a82ccd67bed9b9dab87",
    },
  );
  assert.deepEqual(
    {
      sourcePackageCount: manifest.registrySummary.canonicalSourcePackageCount,
      recordSetCount: manifest.registrySummary.canonicalRecordSetCount,
      researchUpgradeCount: manifest.registrySummary.researchUpgradeCount,
    },
    {
      sourcePackageCount: 24,
      recordSetCount: 25,
      researchUpgradeCount: 118,
    },
  );
});

test("locks route-pack membership arithmetic without changing frozen denominators", () => {
  const pack = manifest.exactReferences.dorsalHornObservedMorphologyRoutePack;
  assert.equal(pack.frozenExemplarCount, 5);
  assert.equal(pack.frozenCensusRecordCount, 142);
  assert.equal(pack.censusExpansionCount, 0);
  assert.equal(pack.routePackMembershipCount, 4);
  assert.deepEqual(pack.overlappingFrozenNeuronIds, [104003, 108974]);
  assert.equal(pack.overlapCount, 2);
  assert.deepEqual(pack.supplementaryNeuronIds, [170035, 249676]);
  assert.equal(pack.supplementaryRecordCount, 2);
  assert.equal(pack.activeUniqueMorphologyCount, 8);
  assert.equal(pack.namedDorsalHornRouteCount, 5);
  assert.deepEqual(pack.namedDorsalHornRouteIds, [
    "mouse.sc.grp_dorsal_horn.observed.nmo_109021",
    "mouse.sc.grpr_lamina_i_ii.observed.nmo_249676",
    "mouse.sc.tac1_sp_dorsal_horn.observed.nmo_108974",
    "mouse.sc.pv_pax2_lamina_ii_iii.observed.nmo_170035",
    "mouse.sc.pdyn_dorsal_horn.observed.nmo_104003",
  ]);
  assert.deepEqual(
    pack.routeMemberships.map((route) => [
      route.neuronId,
      route.censusMembership,
      route.swcSha256,
    ]),
    [
      [
        249676,
        false,
        "b5a96ebc6979f0022c70a26eaa6a5c060545a05d2164852a5a5dd8dc290f4f75",
      ],
      [
        108974,
        true,
        "0fc8e7050e455ed1f79fa5a8e4da304c69054fb5ddd0167fcb3970c5d4c0982d",
      ],
      [
        170035,
        false,
        "73f85373bd426e8ef4dc0f95b73a61678ffb454d963ec292a403ad31a0f116a6",
      ],
      [
        104003,
        true,
        "0f24943c43854cbe48f8bebfd4b45b905a5f897580d4dc25fd55c8ec9c4b8d8d",
      ],
    ],
  );
  assert.equal(pack.supplementaryAssetManifestReceipt.fileCount, 6);
});

test("locks nine states, eleven routes and zero internal, identity and REG claims", () => {
  const representation =
    manifest.exactReferences.evidenceAware3dRepresentation;
  assert.equal(representation.representationStateCount, 9);
  assert.equal(representation.routeCount, 11);
  assert.equal(new Set(representation.representationStateIds).size, 9);
  assert.equal(new Set(representation.routeIds).size, 11);
  assert.deepEqual(representation.internalReferenceStateIds, ["UNAVAILABLE"]);
  assert.equal(
    representation.internalReferenceRenderedPrimitivePolicy,
    "zero_primitives",
  );
  assert.equal(representation.proceduralBiologicalProxyAllowed, false);
  assert.equal(representation.missingLayerPrimitiveCount, 0);
  assert.deepEqual(representation.deterministicMaterializationReceipt, {
    path: "data/evidence-aware-3d-representation-contract-0.2.json",
    bytes: 15818,
    sha256: "86568689f340d8f506590e16e28f3ffed25bc7e040b09f422126a53abcd87346",
    buildInputs: {
      baseContract: {
        path: "/project/data/evidence-aware-3d-representation-contract-0.1.json",
        bytes: 11044,
        sha256: "9fdf8eaf3f37c50835e78af19d86c3e95269aeb67f43461a23f8298132eb9195",
      },
      dorsalHornRoutePack: {
        path: "/project/data/dorsal-horn-observed-morphology-route-pack-0.1.json",
        bytes: 42226,
        sha256: "923db6a9ed013e856ffc7c6ab601c67b25608ac68572538c578fd75fa41fe593",
      },
    },
  });

  const pack = manifest.exactReferences.dorsalHornObservedMorphologyRoutePack;
  assert.ok(
    pack.routeMemberships.every(
      (route) =>
        route.internalPrimitiveCount === 0 &&
        route.crossSourceIdentityCount === 0 &&
        route.projectRegistrationCount === 0,
    ),
  );
  assert.equal(manifest.registrySummary.crossSourceIdentityCount, 0);
  assert.equal(manifest.registrySummary.registrationCount, 0);
  assert.equal(manifest.registrySummary.renderedInternalPrimitiveCount, 0);
  assert.deepEqual(manifest.registrations, { count: 0, records: [] });
});

test("immutable snapshot gate rejects mutations even when their content hash is recomputed", async () => {
  const countDrift = structuredClone(manifest);
  countDrift.registrySummary.researchUpgradeCount = 119;
  countDrift.manifestContentSha256 = computeManifestContentSha256(countDrift);
  await assert.rejects(
    () => validateResearchIterationManifest225(countDrift),
    (error) => {
      assert.match(error.message, /immutable 2\.25 snapshot content SHA-256/i);
      assert.match(error.message, /upgrade count/i);
      return true;
    },
  );

  const inventedInternal = structuredClone(manifest);
  inventedInternal.exactReferences.dorsalHornObservedMorphologyRoutePack
    .routeMemberships[0].internalPrimitiveCount = 1;
  inventedInternal.manifestContentSha256 =
    computeManifestContentSha256(inventedInternal);
  await assert.rejects(
    () => validateResearchIterationManifest225(inventedInternal),
    (error) => {
      assert.match(error.message, /immutable 2\.25 snapshot content SHA-256/i);
      assert.match(error.message, /internal primitive/i);
      return true;
    },
  );

  const historicalReceiptDrift = structuredClone(manifest);
  historicalReceiptDrift.authoritativeInputs.find(
    (input) => input.id === "researchSourceRegistry",
  ).sha256 = "0".repeat(64);
  historicalReceiptDrift.manifestContentSha256 = computeManifestContentSha256(
    historicalReceiptDrift,
  );
  await assert.rejects(
    () => validateResearchIterationManifest225(historicalReceiptDrift),
    (error) => {
      assert.match(error.message, /immutable 2\.25 snapshot content SHA-256/i);
      assert.match(error.message, /researchSourceRegistry exact receipt drifted/i);
      return true;
    },
  );
});
