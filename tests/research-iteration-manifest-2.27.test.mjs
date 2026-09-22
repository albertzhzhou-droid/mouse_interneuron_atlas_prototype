import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest227 } from "../scripts/validate-research-iteration-manifest-2.27.mjs";

const manifestBytes = await readFile(
  new URL("../data/research-iteration-manifest-2.27.json", import.meta.url),
);
const manifest = JSON.parse(manifestBytes.toString("utf8"));

test("validates the exact immutable 2.27 snapshot without rebuilding mutable inputs", async () => {
  assert.deepEqual(await validateResearchIterationManifest227(), {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.27.0",
    inputCount: 30,
    frozenExemplarCount: 5,
    censusRecordCount: 142,
    prpRouteCount: 2,
    activeUniqueMorphologyCount: 12,
    namedRouteCount: 9,
    namedDorsalHornRouteCount: 8,
    namedVentralHornRouteCount: 1,
    representationStateCount: 9,
    representationRouteCount: 15,
    sourcePackageCount: 24,
    recordSetCount: 27,
    bundledExactRosterCount: 6,
    researchUpgradeCount: 130,
    nativeDatSemanticAdmissionCount: 0,
    sameCellElectrophysiologyJoinCount: 0,
    crossSourceIdentityCount: 0,
    registrationCount: 0,
    renderedInternalPrimitiveCount: 0,
    manifestContentSha256: "d1d0d3420f4bd72e45e50f32e31ff02c81e9bf16594ba468f41f36215221943d",
  });
  assert.equal(
    manifest.manifestContentSha256,
    computeManifestContentSha256(manifest),
  );
});

test("pins the immutable 2.26 parent and all 30 authoritative inputs", () => {
  assert.deepEqual(manifest.parentIterationManifest, {
    path: "data/research-iteration-manifest-2.26.json",
    releaseId: "ohri-mouse-interneuron-research-iteration-2.26.0",
    bytes: 40818,
    fileSha256: "f65972360bfa8c376b9989a1e03a7a7e1e0029f5b76b2837742ebe52298a9196",
    contentSha256: "fbf40be71ab73e4a550d7be3e2791ef184ef784a33b5e8c3ac78f4e3cb465ba0",
  });
  assert.equal(manifest.integrity.inputCount, 30);
  assert.equal(manifest.authoritativeInputs.length, 30);
  assert.equal(new Set(manifest.authoritativeInputs.map((input) => input.id)).size, 30);
  assert.equal(new Set(manifest.authoritativeInputs.map((input) => input.path)).size, 30);

  const inputs = new Map(
    manifest.authoritativeInputs.map((input) => [input.id, input]),
  );
  assert.deepEqual(
    [
      "prpDorsalHornObservedMorphologyRoutePackContract",
      "prpDorsalHornObservedMorphologyAssetManifest",
      "evidenceAware3dRepresentationContract04",
      "researchIterationManifestSchema227",
    ].map((id) => [id, inputs.get(id).bytes, inputs.get(id).sha256]),
    [
      [
        "prpDorsalHornObservedMorphologyRoutePackContract",
        31435,
        "a8737dff3fbfe244d36e2af19b32e1dd8142e2626a90c0d89c00881b83eaf709",
      ],
      [
        "prpDorsalHornObservedMorphologyAssetManifest",
        2766,
        "2f17597f67532debfa79828a6313887fb362e9cdc4baba9d3015d94129c5ef8f",
      ],
      [
        "evidenceAware3dRepresentationContract04",
        21341,
        "1dec67e67884199a481ce8127793523acf56d0d50df83cfe330e933c8260e392",
      ],
      [
        "researchIterationManifestSchema227",
        inputs.get("researchIterationManifestSchema227").bytes,
        inputs.get("researchIterationManifestSchema227").sha256,
      ],
    ],
  );
});

test("locks both exact PrP routes, raw metadata conflicts and source receipts", () => {
  const pack = manifest.exactReferences.prpDorsalHornObservedMorphologyRoutePack;
  assert.deepEqual(pack.neuronIds, [50394, 50408]);
  assert.equal(pack.activeUniqueMorphologyCount, 12);
  assert.equal(pack.namedRouteCount, 9);
  assert.equal(pack.namedDorsalHornRouteCount, 8);
  assert.equal(pack.namedVentralHornRouteCount, 1);
  assert.equal(pack.frozenCensusRecordCount, 142);
  assert.equal(pack.censusExpansionCount, 0);
  assert.equal(pack.assetManifestReceipt.fileCount, 10);
  assert.deepEqual(
    pack.routeMemberships.map((route) => ({
      routeId: route.routeId,
      neuronId: route.neuronId,
      nodeCount: route.nodeCount,
      segmentCount: route.segmentCount,
      axonNodeCount: route.observedAxonNodeCount,
      rawStrain: route.repositoryStrainRaw,
      weight: [
        route.repositoryWeightMinimumGrams,
        route.repositoryWeightMaximumGrams,
        route.repositoryWeightValidForBiologicalInterpretation,
      ],
      swc: route.swcReceipt.sha256,
      dat: route.originalDatReceipt.sha256,
    })),
    [
      {
        routeId: "mouse.sc.nnos_prp_l2i_dorsal_horn.observed.nmo_50394",
        neuronId: 50394,
        nodeCount: 4012,
        segmentCount: 4011,
        axonNodeCount: 1520,
        rawStrain: "Swiss-Webster ",
        weight: [27, 15, false],
        swc: "adeb2b0c6934ae07f32d54e8fcaebc8cee29429d884e44692756ee15da8a00d2",
        dat: "eceb6bc0cd2247e2ef2c51c6063b97db64d194d8483ef6d7427c715d9054a109",
      },
      {
        routeId: "mouse.sc.galanin_prp_l2i_dorsal_horn.observed.nmo_50408",
        neuronId: 50408,
        nodeCount: 6125,
        segmentCount: 6124,
        axonNodeCount: 3244,
        rawStrain: "Swiss-Webster ",
        weight: [27, 15, false],
        swc: "452c2b3d76d9680318470ba16b5c271a403018a1c6dcedaa94b68f1fdec6c470",
        dat: "78cfeae785b8ab4cf0792e7223cf310cd4aef1e3caa3447aa14ca61421ed9cb2",
      },
    ],
  );
  for (const route of pack.routeMemberships) {
    assert.equal(route.markerExclusivityClaim, false);
    assert.equal(route.endogenousPrpProteinAbundanceClaim, false);
    assert.equal(route.completeAxonClaim, false);
    assert.equal(route.nativeDatParsed, false);
    assert.equal(route.nativeDatRendered, false);
    assert.equal(route.nativeDatSemanticObjectCount, 0);
    assert.equal(route.paperMentionsExactNeuronIdOrFilename, false);
    assert.equal(route.sameCellElectrophysiologyJoinStatus, "not_established");
    assert.equal(route.internalPrimitiveCount, 0);
    assert.equal(route.crossSourceIdentityCount, 0);
    assert.equal(route.projectRegistrationCount, 0);
  }
});

test("distinguishes the four-route legacy subgroup from eight named dorsal routes", () => {
  const representation = manifest.exactReferences.evidenceAware3dRepresentation;
  assert.equal(representation.contractId, "evidence-aware-3d-representation-contract-0.4");
  assert.equal(representation.representationStateCount, 9);
  assert.equal(representation.routeCount, 15);
  assert.equal(representation.legacyDorsalHornPackRouteCount, 4);
  assert.equal(representation.namedDorsalHornRouteCount, 8);
  assert.equal(representation.namedVentralHornRouteCount, 1);
  assert.equal("dorsalHornRouteCount" in representation, false);
  assert.equal(representation.nativeDatSemanticAdmissionCount, 0);
  assert.equal(representation.sameCellElectrophysiologyJoinCount, 0);
  assert.equal(representation.sameSpecimenInternalStructureCount, 0);
  assert.equal(representation.renderedInternalPrimitiveCount, 0);
  assert.equal(representation.crossSourceIdentityCount, 0);
  assert.equal(representation.projectRegistrationCount, 0);

  assert.deepEqual(
    {
      sourcePackages: manifest.registrySummary.canonicalSourcePackageCount,
      recordSets: manifest.registrySummary.canonicalRecordSetCount,
      bundledExactRosters: manifest.registrySummary.bundledExactRosterCount,
      upgrades: manifest.registrySummary.researchUpgradeCount,
    },
    { sourcePackages: 24, recordSets: 27, bundledExactRosters: 6, upgrades: 130 },
  );
});

test("locks the immutable 2.27 file bytes independently of current registries", () => {
  assert.equal(manifestBytes.byteLength, 56245);
  assert.equal(
    createHash("sha256").update(manifestBytes).digest("hex"),
    "88560df20ed43c2cb3e002f654a8919b24967fefe25de70ae421b5b9ae71d233",
  );
});

test("rejects recomputed mutations that invent internals or marker exclusivity", async () => {
  const inventedInternal = structuredClone(manifest);
  inventedInternal.exactReferences.prpDorsalHornObservedMorphologyRoutePack
    .routeMemberships[0].internalPrimitiveCount = 1;
  inventedInternal.manifestContentSha256 =
    computeManifestContentSha256(inventedInternal);
  await assert.rejects(
    () => validateResearchIterationManifest227(inventedInternal),
    /internalPrimitiveCount|internal|snapshot content SHA-256 drifted/,
  );

  const inventedExclusivity = structuredClone(manifest);
  inventedExclusivity.exactReferences.prpDorsalHornObservedMorphologyRoutePack
    .routeMemberships[1].markerExclusivityClaim = true;
  inventedExclusivity.manifestContentSha256 =
    computeManifestContentSha256(inventedExclusivity);
  await assert.rejects(
    () => validateResearchIterationManifest227(inventedExclusivity),
    /markerExclusivityClaim|marker|snapshot content SHA-256 drifted/,
  );
});
