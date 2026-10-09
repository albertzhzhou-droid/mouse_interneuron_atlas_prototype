import assert from "node:assert/strict";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_253, validateResearchIterationManifest253Snapshot } from "../scripts/validate-research-iteration-manifest-2.53-snapshot.mjs";

test("2.53 remains sealed byte-for-byte as the MICrONS spatial-eligibility parent", async () => {
  const { manifest, parentReleaseId } = await validateResearchIterationManifest253Snapshot();
  assert.equal(parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.52.0");
  assert.equal(manifest.releaseId, "ohri-mouse-interneuron-research-iteration-2.53.0");
  assert.equal(manifest.registrySummary.researchUpgradeCount, 207);
  assert.equal(manifest.exactReferences.micronsMitochondriaSpatialCompatibility253.mitochondriaObjectCount, 0);
  assert.equal(SNAPSHOT_253.bytes, 331728);
});

test("recomputed hashes cannot mutate the sealed 2.53 zero-mitochondria boundary", async () => {
  const { manifest } = await validateResearchIterationManifest253Snapshot();
  const changed = structuredClone(manifest);
  changed.exactReferences.micronsMitochondriaSpatialCompatibility253.mitochondriaObjectCount = 1;
  changed.manifestContentSha256 = computeManifestContentSha256(changed);
  await assert.rejects(validateResearchIterationManifest253Snapshot(changed), /content receipt changed/);
});
