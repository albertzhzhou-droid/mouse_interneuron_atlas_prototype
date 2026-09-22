import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest226 } from "../scripts/validate-research-iteration-manifest-2.26.mjs";

const manifestBytes = await readFile(
  new URL("../data/research-iteration-manifest-2.26.json", import.meta.url),
);
const manifest = JSON.parse(manifestBytes.toString("utf8"));

test("validates the exact immutable 2.26 snapshot without rebuilding mutable inputs", async () => {
  assert.deepEqual(await validateResearchIterationManifest226(), {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.26.0",
    inputCount: 26,
    frozenExemplarCount: 5,
    censusRecordCount: 142,
    functionalRouteCount: 2,
    activeUniqueMorphologyCount: 10,
    namedRouteCount: 7,
    representationStateCount: 9,
    representationRouteCount: 13,
    sourcePackageCount: 24,
    recordSetCount: 26,
    researchUpgradeCount: 124,
    nativeDatSemanticAdmissionCount: 0,
    sameCellElectrophysiologyJoinCount: 0,
    crossSourceIdentityCount: 0,
    registrationCount: 0,
    renderedInternalPrimitiveCount: 0,
  });

  assert.equal(
    manifest.manifestContentSha256,
    "fbf40be71ab73e4a550d7be3e2791ef184ef784a33b5e8c3ac78f4e3cb465ba0",
  );
  assert.equal(
    manifest.manifestContentSha256,
    computeManifestContentSha256(manifest),
  );
  assert.deepEqual(manifest.application, {
    name: "ohri-mouse-interneuron-atlas-prototype",
    version: "2.26.0-research.1",
  });
});

test("pins all 26 historical authoritative inputs and key delta receipts", () => {
  assert.equal(manifest.integrity.inputCount, 26);
  assert.equal(manifest.authoritativeInputs.length, 26);
  assert.equal(
    new Set(manifest.authoritativeInputs.map((input) => input.path)).size,
    26,
  );

  const inputs = new Map(
    manifest.authoritativeInputs.map((input) => [input.id, input]),
  );
  assert.deepEqual(
    {
      bytes: inputs.get("researchSourceRegistry").bytes,
      sha256: inputs.get("researchSourceRegistry").sha256,
    },
    {
      bytes: 87071,
      sha256: "79cdc0e19b92a226fd5857372df3f33b20b624ba8c8511fa20efecfda5a599d9",
    },
  );
  assert.deepEqual(
    {
      bytes: inputs.get("researchModelUpgradeRegistry").bytes,
      sha256: inputs.get("researchModelUpgradeRegistry").sha256,
    },
    {
      bytes: 251969,
      sha256: "802f4ea756ff5fd8776318ccfae0afa6d10f105fb0c77e7f4246b2001cedbc75",
    },
  );
  assert.deepEqual(
    {
      bytes: inputs.get("functionalClassObservedMorphologyRoutePackContract")
        .bytes,
      sha256: inputs.get(
        "functionalClassObservedMorphologyRoutePackContract",
      ).sha256,
    },
    {
      bytes: 28937,
      sha256: "400b17afd707c3b53ee0cbb1d6402943535111c01402eb3903b256d12e176840",
    },
  );
  assert.deepEqual(
    {
      bytes: inputs.get("functionalClassObservedMorphologyAssetManifest").bytes,
      sha256: inputs.get("functionalClassObservedMorphologyAssetManifest")
        .sha256,
    },
    {
      bytes: 2768,
      sha256: "a44d7b109357d086d0d7bc27481ee76bdcfe7382e804f74aeb08195b47878f5f",
    },
  );
  assert.deepEqual(
    {
      bytes: inputs.get("evidenceAware3dRepresentationContract03").bytes,
      sha256: inputs.get("evidenceAware3dRepresentationContract03").sha256,
    },
    {
      bytes: 18496,
      sha256: "00c464afc793b8853d176366ece708f993c89920dba4027789bc7e84d9b03aa6",
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
      recordSetCount: 26,
      researchUpgradeCount: 124,
    },
  );
});

test("locks the two functional-class routes and frozen denominators", () => {
  const pack = manifest.exactReferences.functionalClassObservedMorphologyRoutePack;
  assert.equal(pack.frozenExemplarCount, 5);
  assert.equal(pack.frozenCensusRecordCount, 142);
  assert.equal(pack.censusExpansionCount, 0);
  assert.equal(pack.routeCount, 2);
  assert.deepEqual(pack.neuronIds, [45674, 50424]);
  assert.deepEqual(pack.supplementaryNeuronIds, [45674, 50424]);
  assert.equal(pack.activeUniqueMorphologyCount, 10);
  assert.equal(pack.namedRouteCount, 7);
  assert.equal(pack.namedDorsalHornRouteCount, 6);
  assert.equal(pack.namedVentralHornRouteCount, 1);
  assert.equal(pack.assetManifestReceipt.fileCount, 10);
  assert.deepEqual(
    pack.routeMemberships.map((route) => [
      route.neuronId,
      route.swcReceipt.sha256,
      route.originalDatReceipt.sha256,
    ]),
    [
      [
        45674,
        "95b2fc29900a994ef87d6f50c07481115f94207c5ebaeb9f436e7e494edac1fd",
        "9d5a8670fdb97656c18eb8819b3c4723f438fb8929e66ea8dc6103c6bb547d87",
      ],
      [
        50424,
        "0cdb5c32555f94d2ffd1765d8c21f1f95703692c45917f2a2d2449ecc457138b",
        "90662374ccfacc0404b1b8817161015fa52c6c384911700f428a4c5421cb79d9",
      ],
    ],
  );
});

test("locks thirteen evidence routes and zero semantic promotions", () => {
  const representation = manifest.exactReferences.evidenceAware3dRepresentation;
  assert.equal(representation.representationStateCount, 9);
  assert.equal(representation.routeCount, 13);
  assert.equal(new Set(representation.representationStateIds).size, 9);
  assert.equal(new Set(representation.routeIds).size, 13);
  assert.deepEqual(representation.functionalClassRouteIds, [
    "mouse.sc.renshaw_l5_lamina_vii.observed.nmo_45674",
    "mouse.sc.npy_l2i_dorsal_horn.observed.nmo_50424",
  ]);
  assert.equal(representation.nativeDatSemanticAdmissionCount, 0);
  assert.equal(representation.sameCellElectrophysiologyJoinCount, 0);
  assert.equal(representation.proceduralBiologicalProxyAllowed, false);
  assert.equal(representation.missingLayerPrimitiveCount, 0);
  assert.equal(manifest.registrySummary.crossSourceIdentityCount, 0);
  assert.equal(manifest.registrySummary.registrationCount, 0);
  assert.equal(manifest.registrySummary.renderedInternalPrimitiveCount, 0);
});

test("immutable snapshot gate rejects mutations even with a recomputed content hash", async () => {
  const countDrift = structuredClone(manifest);
  countDrift.registrySummary.researchUpgradeCount = 125;
  countDrift.manifestContentSha256 = computeManifestContentSha256(countDrift);
  await assert.rejects(
    () => validateResearchIterationManifest226(countDrift),
    (error) => {
      assert.match(error.message, /immutable 2\.26 snapshot content SHA-256/i);
      assert.match(error.message, /upgrade count/i);
      return true;
    },
  );

  const inventedInternal = structuredClone(manifest);
  inventedInternal.exactReferences.functionalClassObservedMorphologyRoutePack
    .routeMemberships[0].internalPrimitiveCount = 1;
  inventedInternal.manifestContentSha256 =
    computeManifestContentSha256(inventedInternal);
  await assert.rejects(
    () => validateResearchIterationManifest226(inventedInternal),
    (error) => {
      assert.match(error.message, /immutable 2\.26 snapshot content SHA-256/i);
      assert.match(error.message, /unsupported biological claim/i);
      return true;
    },
  );

  const historicalReceiptDrift = structuredClone(manifest);
  historicalReceiptDrift.authoritativeInputs.find(
    (input) => input.id === "researchSourceRegistry",
  ).sha256 = "0".repeat(64);
  historicalReceiptDrift.manifestContentSha256 =
    computeManifestContentSha256(historicalReceiptDrift);
  await assert.rejects(
    () => validateResearchIterationManifest226(historicalReceiptDrift),
    (error) => {
      assert.match(error.message, /immutable 2\.26 snapshot content SHA-256/i);
      assert.match(error.message, /researchSourceRegistry exact receipt drifted/i);
      return true;
    },
  );
});
