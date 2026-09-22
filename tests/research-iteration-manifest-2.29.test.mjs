import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest229 } from "../scripts/validate-research-iteration-manifest-2.29.mjs";
import {
  buildResearchIterationManifest229,
  serializeResearchIterationManifest229,
} from "../tools/build_research_iteration_manifest_2_29.mjs";

const manifestBytes = await readFile(new URL("../data/research-iteration-manifest-2.29.json", import.meta.url));
const manifest = JSON.parse(manifestBytes.toString("utf8"));
const parent = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.28.json", import.meta.url), "utf8"));
const comparison = manifest.exactReferences.supplementaryMorphologyComparisonAdapter;

test("validates the exact 2.29 snapshot and 142 + 7 denominator boundary", async () => {
  assert.deepEqual(await validateResearchIterationManifest229(), {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.29.0",
    inputCount: 38,
    frozenCensusRecordCount: 142,
    supplementaryRecordCount: 7,
    viewableSourceObjectCount: 149,
    combinedCensusClaim: false,
    routeSourceCount: 4,
    geometryReferenceCount: 7,
    geometryCopyCount: 0,
    swcCopyCount: 0,
    commonScaleAdmissionCount: 0,
    commonOrientationAdmissionCount: 0,
    completeAxonClaimCount: 0,
    crossSourceIdentityCount: 0,
    registrationCount: 0,
    renderedInternalPrimitiveCount: 0,
    researchUpgradeCount: 136,
    manifestContentSha256: "069b1be3a37a8086f89ea4467503235ed0734afcbfd2974538bae528c4995982",
  });
  assert.equal(manifest.manifestContentSha256, computeManifestContentSha256(manifest));
});

test("pins immutable 2.28 and all 38 authoritative inputs", () => {
  assert.deepEqual(manifest.parentIterationManifest, {
    path: "data/research-iteration-manifest-2.28.json",
    releaseId: "ohri-mouse-interneuron-research-iteration-2.28.0",
    bytes: 69092,
    fileSha256: "f599acbd6969ba082014b258c098e648014116dc736535265bc7d5c154110b8e",
    contentSha256: "af376ba79d00132582448ab7217ca03c2e4af18efc5f0ca9720acef231f9b173",
  });
  assert.equal(manifest.integrity.inputCount, 38);
  assert.equal(manifest.authoritativeInputs.length, 38);
  assert.equal(new Set(manifest.authoritativeInputs.map((input) => input.id)).size, 38);
  assert.equal(new Set(manifest.authoritativeInputs.map((input) => input.path)).size, 38);
  const inputs = new Map(manifest.authoritativeInputs.map((input) => [input.id, input]));
  assert.deepEqual(
    [
      "supplementaryMorphologyComparisonAdapter",
      "supplementaryMorphologyComparisonAnalysisDelta",
      "supplementaryMorphologyComparisonAssetManifest",
      "supplementaryMorphologyComparisonAdapterSchema",
    ].map((id) => [id, inputs.get(id).bytes, inputs.get(id).sha256]),
    [
      ["supplementaryMorphologyComparisonAdapter", 42808, "f487034457ec2187996f0d3db8935545e64d1ce6783391b668c0747bdf2d5e05"],
      ["supplementaryMorphologyComparisonAnalysisDelta", 34013, "b2f90156d9e9eb86cc2dfc72f05a140c6942c802a492274472c86a0c7a29d0df"],
      ["supplementaryMorphologyComparisonAssetManifest", 3619, "ab7b2a8fbc458e0871a39819e88007ffe3ad84f6378f87a2a24015484028db6f"],
      ["supplementaryMorphologyComparisonAdapterSchema", 24130, "50b79761fb881468d077a4f18c215fe544601789195c7ffe22e4d74bfeeeace0"],
    ],
  );
});

test("preserves every inherited 2.28 scientific reference and boundary", () => {
  const inheritedReferences = structuredClone(manifest.exactReferences);
  delete inheritedReferences.supplementaryMorphologyComparisonAdapter;
  assert.deepEqual(inheritedReferences, parent.exactReferences);
  const inheritedBoundaries = structuredClone(manifest.scientificBoundaries);
  delete inheritedBoundaries.supplementaryMorphologyComparisonAdapter;
  assert.deepEqual(inheritedBoundaries, parent.scientificBoundaries);
  assert.equal(manifest.exactReferences.evidenceAware3dRepresentation.renderedInternalPrimitiveCount, 0);
  assert.equal(manifest.exactReferences.evidenceAware3dRepresentation.projectRegistrationCount, 0);
  assert.equal(manifest.exactReferences.premotorComparisonObservedMorphologyRoutePack.censusExpansionCount, 0);
});

test("pins four route-source receipts and the exact seven supplementary records", () => {
  assert.equal(comparison.routeSourceCount, 4);
  assert.deepEqual(
    comparison.routeSources.map((source) => [source.contractId, source.supplementaryNeuronIds]),
    [
      ["functional-class-observed-morphology-route-pack-0.1", [45674, 50424]],
      ["premotor-comparison-observed-morphology-route-pack-0.1", [45718]],
      ["prp-dorsal-horn-observed-morphology-route-pack-0.1", [50394, 50408]],
      ["dorsal-horn-observed-morphology-route-pack-0.1", [170035, 249676]],
    ],
  );
  assert.deepEqual(comparison.supplementaryNeuronIds, [45674, 45718, 50394, 50408, 50424, 170035, 249676]);
  assert.deepEqual(
    comparison.routeSources.map((source) => [source.contractSha256, source.assetManifestSha256]),
    [
      ["400b17afd707c3b53ee0cbb1d6402943535111c01402eb3903b256d12e176840", "a44d7b109357d086d0d7bc27481ee76bdcfe7382e804f74aeb08195b47878f5f"],
      ["39afe0acc449c367cd48776b150058982c8d57186ea9adbeb9314b08d62b2cb3", "0220169ea294d8db086a228557b0b067fd057249e41f7187cf2a14ee924a33d8"],
      ["a8737dff3fbfe244d36e2af19b32e1dd8142e2626a90c0d89c00881b83eaf709", "2f17597f67532debfa79828a6313887fb362e9cdc4baba9d3015d94129c5ef8f"],
      ["923db6a9ed013e856ffc7c6ab601c67b25608ac68572538c578fd75fa41fe593", "4f64fb595a4362cf0403cb0d3abc3c6fdc14b7f74d473a82ccd67bed9b9dab87"],
    ],
  );
});

test("keeps copy, padding, shared-frame, axon, internal, identity and registration claims at zero", () => {
  assert.deepEqual(
    {
      combinedCensusClaim: comparison.combinedCensusClaim,
      geometryCopyCount: comparison.geometryCopyCount,
      swcCopyCount: comparison.swcCopyCount,
      paddingRecordCount: comparison.paddingRecordCount,
      commonScaleAdmissionCount: comparison.commonScaleAdmissionCount,
      commonOrientationAdmissionCount: comparison.commonOrientationAdmissionCount,
      atlasPlacementCount: comparison.atlasPlacementCount,
      atlasTransformCount: comparison.atlasTransformCount,
      completeAxonClaimCount: comparison.completeAxonClaimCount,
      sameSpecimenInternalStructureCount: comparison.sameSpecimenInternalStructureCount,
      renderedInternalPrimitiveCount: comparison.renderedInternalPrimitiveCount,
      crossSourceIdentityCount: comparison.crossSourceIdentityCount,
      registrationCount: comparison.registrationCount,
    },
    {
      combinedCensusClaim: false,
      geometryCopyCount: 0,
      swcCopyCount: 0,
      paddingRecordCount: 0,
      commonScaleAdmissionCount: 0,
      commonOrientationAdmissionCount: 0,
      atlasPlacementCount: 0,
      atlasTransformCount: 0,
      completeAxonClaimCount: 0,
      sameSpecimenInternalStructureCount: 0,
      renderedInternalPrimitiveCount: 0,
      crossSourceIdentityCount: 0,
      registrationCount: 0,
    },
  );
});

test("matches deterministic 2.29 materialization byte-for-byte", async () => {
  const built = await buildResearchIterationManifest229();
  assert.equal(built.bytes.equals(manifestBytes), true);
  assert.equal(serializeResearchIterationManifest229(built.manifest), manifestBytes.toString("utf8"));
});

test("rejects denominator and combined-census mutations", async () => {
  const changedDenominator = structuredClone(manifest);
  changedDenominator.exactReferences.supplementaryMorphologyComparisonAdapter.frozenCensusRecordCount = 149;
  changedDenominator.manifestContentSha256 = computeManifestContentSha256(changedDenominator);
  await assert.rejects(() => validateResearchIterationManifest229(changedDenominator), /frozenCensusRecordCount|142 census \+ 7 supplementary|snapshot content SHA-256 drifted/);

  const combinedCensus = structuredClone(manifest);
  combinedCensus.exactReferences.supplementaryMorphologyComparisonAdapter.combinedCensusClaim = true;
  combinedCensus.manifestContentSha256 = computeManifestContentSha256(combinedCensus);
  await assert.rejects(() => validateResearchIterationManifest229(combinedCensus), /combinedCensusClaim|never a combined census|snapshot content SHA-256 drifted/);
});

test("rejects copied geometry, common scale and immutable-parent mutations", async () => {
  const copiedGeometry = structuredClone(manifest);
  copiedGeometry.exactReferences.supplementaryMorphologyComparisonAdapter.geometryCopyCount = 1;
  copiedGeometry.manifestContentSha256 = computeManifestContentSha256(copiedGeometry);
  await assert.rejects(() => validateResearchIterationManifest229(copiedGeometry), /geometryCopyCount|copy or padding|snapshot content SHA-256 drifted/);

  const commonScale = structuredClone(manifest);
  commonScale.exactReferences.supplementaryMorphologyComparisonAdapter.commonScaleAdmissionCount = 1;
  commonScale.manifestContentSha256 = computeManifestContentSha256(commonScale);
  await assert.rejects(() => validateResearchIterationManifest229(commonScale), /commonScaleAdmissionCount|admits scale|snapshot content SHA-256 drifted/);

  const changedParent = structuredClone(manifest);
  changedParent.parentIterationManifest.fileSha256 = "0".repeat(64);
  changedParent.manifestContentSha256 = computeManifestContentSha256(changedParent);
  await assert.rejects(() => validateResearchIterationManifest229(changedParent), /parentIterationManifest|immutable 2.28 parent receipt drifted|snapshot content SHA-256 drifted/);
});
