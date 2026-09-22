import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest228 } from "../scripts/validate-research-iteration-manifest-2.28.mjs";
import {
  buildResearchIterationManifest228,
  serializeResearchIterationManifest228,
} from "../tools/build_research_iteration_manifest_2_28.mjs";

const manifestBytes = await readFile(new URL("../data/research-iteration-manifest-2.28.json", import.meta.url));
const manifest = JSON.parse(manifestBytes.toString("utf8"));
const pack = manifest.exactReferences.premotorComparisonObservedMorphologyRoutePack;
const route = pack.routeMemberships[0];

test("validates the exact 2.28 snapshot and zero-claim summary", async () => {
  assert.deepEqual(await validateResearchIterationManifest228(), {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.28.0",
    inputCount: 34,
    frozenExemplarCount: 5,
    censusRecordCount: 142,
    premotorComparisonRouteCount: 1,
    activeUniqueMorphologyCount: 13,
    namedRouteCount: 10,
    namedDorsalHornRouteCount: 8,
    namedVentralHornRouteCount: 2,
    representationStateCount: 9,
    representationRouteCount: 16,
    sourcePackageCount: 24,
    recordSetCount: 28,
    bundledExactRosterCount: 7,
    researchUpgradeCount: 131,
    nativeDatSemanticAdmissionCount: 0,
    sameCellElectrophysiologyJoinCount: 0,
    crossSourceIdentityCount: 0,
    registrationCount: 0,
    renderedInternalPrimitiveCount: 0,
    manifestContentSha256: "af376ba79d00132582448ab7217ca03c2e4af18efc5f0ca9720acef231f9b173",
  });
  assert.equal(manifest.manifestContentSha256, computeManifestContentSha256(manifest));
});

test("pins immutable 2.27 and all 34 authoritative inputs", () => {
  assert.deepEqual(manifest.parentIterationManifest, {
    path: "data/research-iteration-manifest-2.27.json",
    releaseId: "ohri-mouse-interneuron-research-iteration-2.27.0",
    bytes: 56245,
    fileSha256: "88560df20ed43c2cb3e002f654a8919b24967fefe25de70ae421b5b9ae71d233",
    contentSha256: "d1d0d3420f4bd72e45e50f32e31ff02c81e9bf16594ba468f41f36215221943d",
  });
  assert.equal(manifest.integrity.inputCount, 34);
  assert.equal(manifest.authoritativeInputs.length, 34);
  assert.equal(new Set(manifest.authoritativeInputs.map((input) => input.id)).size, 34);
  assert.equal(new Set(manifest.authoritativeInputs.map((input) => input.path)).size, 34);
  const inputs = new Map(manifest.authoritativeInputs.map((input) => [input.id, input]));
  assert.deepEqual(
    [
      "premotorComparisonObservedMorphologyRoutePackContract",
      "premotorComparisonObservedMorphologyAssetManifest",
      "evidenceAware3dRepresentationContract05",
      "premotorComparisonObservedMorphologyRoutePackSchema",
    ].map((id) => [id, inputs.get(id).bytes, inputs.get(id).sha256]),
    [
      ["premotorComparisonObservedMorphologyRoutePackContract", 19112, "39afe0acc449c367cd48776b150058982c8d57186ea9adbeb9314b08d62b2cb3"],
      ["premotorComparisonObservedMorphologyAssetManifest", 1647, "0220169ea294d8db086a228557b0b067fd057249e41f7187cf2a14ee924a33d8"],
      ["evidenceAware3dRepresentationContract05", 23381, "94085465117e4cbc70763ea78f931cfb17d3f99c5dc907a3fe4556ef1063dbed"],
      ["premotorComparisonObservedMorphologyRoutePackSchema", 13685, "3922062699463bad90e41ec6d5a64d07f949b62a6fd77f03540130d8d2602b15"],
    ],
  );
});

test("locks NMO 45718 identity, source objects and exact topology", () => {
  assert.deepEqual(pack.neuronIds, [45718]);
  assert.deepEqual(pack.supplementaryNeuronIds, [45718]);
  assert.equal(route.routeId, "mouse.sc.repository_labeled_premotor_non_renshaw_l5_ventral_horn.observed.nmo_45718");
  assert.equal(route.neuronName, "101026p1-A-In");
  assert.equal(route.sourcePaperDoi, "10.1523/JNEUROSCI.0199-14.2014");
  assert.equal(route.sourcePaperPmid, "25232126");
  assert.deepEqual(route.cellTypeLabels, ["Calbindin (CB)-negative", "glycinergic", "pre-motor", "non-renshaw", "interneuron"]);
  assert.deepEqual(
    {
      nodes: route.nodeCount,
      segments: route.segmentCount,
      types: route.nodeTypeCounts,
      bounds: route.boundsMicrometre,
      extent: route.extentMicrometre,
      canonical: route.canonicalGeometrySha256,
      topology: route.topologySha256,
    },
    {
      nodes: 5636,
      segments: 5635,
      types: { "1": 8, "2": 4237, "3": 1391 },
      bounds: { min: [-436.01, -264.19, -200], max: [251.84, 289.81, 28] },
      extent: [687.85, 554, 228],
      canonical: "08514c7c924c2b1ff444eb45f43e89ab1633bce64dc1618be148617e80de52a3",
      topology: "7fb6e4ed99208c66fa323a297bd85c800f3cbbe340baafcf7f0312832dda5af9",
    },
  );
  assert.deepEqual(
    [route.metadataReceipt.sha256, route.morphometryReceipt.sha256, route.geometryReceipt.sha256, route.originalDatReceipt.sha256, route.swcReceipt.sha256],
    [
      "ac769a76e959d093a0468d345356256627b0ccd5536334f7b943734521b55407",
      "d999e37d9b94650415fd50e795ff0b43af24045e95a87c43c1b5e2ee57dda38a",
      "c5193dbca4f17bb945a034196dd7dee130096502c71e01b6e5aedacfcade8865",
      "ae5f3122dfcebfa06f3e69351670ab6428ed61d4a2bc24f099edc98e62f69415",
      "c8926708a1350c58124c47ebee8167820b8e0bd568bcb676e90e34f3ca6dfaee",
    ],
  );
});

test("fails closed across label, preparation, shrinkage, soma, DAT, physiology and internals", () => {
  assert.equal(route.repositoryLabelOnly, true);
  assert.equal(route.definitiveRenshawExclusionClaim, false);
  assert.equal(route.paperKeyedPremotorIdentityClaim, false);
  assert.equal(route.individualCalbindinAssayClaim, false);
  assert.equal(route.individualSexClaim, false);
  assert.equal(route.preparationJoinStatus, "context_only_not_exact_stage_equivalence");
  assert.equal(route.repositorySlicingDirection, "horizontal");
  assert.equal(route.repositorySlicingThicknessMicrometre, 50);
  assert.equal(route.shrinkageReported, "Reported");
  assert.equal(route.shrinkageCorrected, "Not Corrected");
  assert.equal(route.shrinkageRestoredInVivoClaim, false);
  assert.equal(route.originalContourCount, 8);
  assert.equal(route.standardizedSomaPointCount, 8);
  assert.equal(route.nativeContourVerticesAdmitted, false);
  assert.equal(route.standardizedSomaMembraneClaim, false);
  assert.equal(route.completeAxonClaim, false);
  assert.equal(route.nativeDatParsed, false);
  assert.equal(route.nativeDatRendered, false);
  assert.equal(route.nativeDatSemanticObjectCount, 0);
  assert.equal(route.paperMentionsExactNeuronIdOrFilename, false);
  assert.equal(route.sameCellElectrophysiologyJoinStatus, "not_established");
  assert.equal(route.internalPrimitiveCount, 0);
  assert.equal(route.crossSourceIdentityCount, 0);
  assert.equal(route.projectRegistrationCount, 0);
});

test("extends representation to sixteen routes while keeping all prohibited claims at zero", () => {
  const representation = manifest.exactReferences.evidenceAware3dRepresentation;
  assert.equal(representation.contractId, "evidence-aware-3d-representation-contract-0.5");
  assert.equal(representation.representationStateCount, 9);
  assert.equal(representation.routeCount, 16);
  assert.equal(representation.premotorComparisonRouteCount, 1);
  assert.deepEqual(representation.premotorComparisonRouteIds, [route.routeId]);
  assert.equal(representation.namedDorsalHornRouteCount, 8);
  assert.equal(representation.namedVentralHornRouteCount, 2);
  assert.equal(representation.nativeDatSemanticAdmissionCount, 0);
  assert.equal(representation.sameCellElectrophysiologyJoinCount, 0);
  assert.equal(representation.sameSpecimenInternalStructureCount, 0);
  assert.equal(representation.renderedInternalPrimitiveCount, 0);
  assert.equal(representation.crossSourceIdentityCount, 0);
  assert.equal(representation.projectRegistrationCount, 0);
  assert.deepEqual(
    {
      sources: manifest.registrySummary.canonicalSourcePackageCount,
      recordSets: manifest.registrySummary.canonicalRecordSetCount,
      rosters: manifest.registrySummary.bundledExactRosterCount,
      upgrades: manifest.registrySummary.researchUpgradeCount,
    },
    { sources: 24, recordSets: 28, rosters: 7, upgrades: 131 },
  );
});

test("matches deterministic 2.28 materialization byte-for-byte", async () => {
  const built = await buildResearchIterationManifest228();
  assert.equal(built.bytes.equals(manifestBytes), true);
  assert.equal(serializeResearchIterationManifest228(built.manifest), manifestBytes.toString("utf8"));
});

test("rejects mutations that promote repository labels or invent internal geometry", async () => {
  const promotedLabel = structuredClone(manifest);
  promotedLabel.exactReferences.premotorComparisonObservedMorphologyRoutePack.routeMemberships[0].definitiveRenshawExclusionClaim = true;
  promotedLabel.manifestContentSha256 = computeManifestContentSha256(promotedLabel);
  await assert.rejects(() => validateResearchIterationManifest228(promotedLabel), /definitiveRenshawExclusionClaim|snapshot content SHA-256 drifted/);

  const inventedInternal = structuredClone(manifest);
  inventedInternal.exactReferences.premotorComparisonObservedMorphologyRoutePack.routeMemberships[0].internalPrimitiveCount = 1;
  inventedInternal.manifestContentSha256 = computeManifestContentSha256(inventedInternal);
  await assert.rejects(() => validateResearchIterationManifest228(inventedInternal), /internalPrimitiveCount|snapshot content SHA-256 drifted/);
});
