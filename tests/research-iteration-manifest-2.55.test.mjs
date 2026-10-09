import assert from "node:assert/strict";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_255, validateResearchIterationManifest255Snapshot } from "../scripts/validate-research-iteration-manifest-2.55-snapshot.mjs";

test("2.55 remains sealed as the 149-object main-scene parent release", async () => {
  const result = await validateResearchIterationManifest255Snapshot();
  assert.equal(result.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.54.0");
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.55.0");
  assert.equal(result.censusRecordCount, 142);
  assert.equal(result.totalSelectableMainSceneMorphologyCount, 149);
  assert.equal(result.internalPrimitiveCount, 0);
  assert.equal(result.crossSourceIdentityCount, 0);
  assert.equal(result.registrationCount, 0);
  assert.equal(SNAPSHOT_255.bytes, 347440);
});

test("recomputed content hashes cannot mutate the sealed 2.55 denominator or release boundary", async () => {
  const { manifest } = await validateResearchIterationManifest255Snapshot();
  const changed = structuredClone(manifest);
  changed.exactReferences.neuromorphoCensusMainScene255.renderedInternalPrimitiveCount = 1;
  changed.manifestContentSha256 = computeManifestContentSha256(changed);
  await assert.rejects(validateResearchIterationManifest255Snapshot(changed), /content receipt changed/);
});
