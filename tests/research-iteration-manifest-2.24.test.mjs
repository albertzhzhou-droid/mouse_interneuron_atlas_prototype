import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest224 } from "../scripts/validate-research-iteration-manifest-2.24.mjs";

const manifest = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.24.json", import.meta.url), "utf8"));

test("validates the immutable 2.24 snapshot without rebuilding mutable inputs", async () => {
  assert.deepEqual(await validateResearchIterationManifest224(), {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.24.0",
    inputCount: 20,
    sourcePackageCount: 24,
    researchUpgradeCount: 111,
    molecularProfileCount: 161,
    legacyExemplarCount: 5,
    activeMainSceneMorphologyCount: 6,
    censusRecordCount: 142,
    representationStateCount: 9,
    routeCount: 7,
    registrationCount: 0,
  });
  assert.equal(manifest.manifestContentSha256, computeManifestContentSha256(manifest));
});

test("pins the independent NMO 109021 route without changing census or legacy denominators", () => {
  const reference = manifest.exactReferences.grpDorsalHornObservedMorphology;
  assert.equal(reference.neuronId, 109021);
  assert.equal(reference.swcSha256, "fd30c7fbafd6642a99265e0009ef0bc5b75709fc7a1fba3bcc80ad47d28bde02");
  assert.equal(reference.nodeCount, 2790);
  assert.equal(reference.segmentCount, 2789);
  assert.equal(reference.legacyExemplarCount, 5);
  assert.equal(reference.censusRecordCount, 142);
  assert.equal(reference.completeAxonClaim, false);
  assert.equal(reference.internalPrimitiveCount, 0);
  assert.equal(reference.crossSourceIdentityCount, 0);
  assert.equal(reference.projectRegistrationCount, 0);
});

test("pins zero-proxy evidence-aware rendering", () => {
  const reference = manifest.exactReferences.evidenceAware3dRepresentation;
  assert.equal(reference.representationStateCount, 9);
  assert.equal(reference.routeCount, 7);
  assert.deepEqual(reference.internalReferenceStateIds, ["UNAVAILABLE"]);
  assert.equal(reference.internalReferenceRenderedPrimitivePolicy, "zero_primitives");
  assert.equal(reference.proceduralBiologicalProxyAllowed, false);
  assert.equal(reference.missingLayerPrimitiveCount, 0);
});
