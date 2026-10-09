import assert from "node:assert/strict";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_252, validateResearchIterationManifest252Snapshot } from "../scripts/validate-research-iteration-manifest-2.52-snapshot.mjs";

test("2.52 is sealed byte-for-byte as the source-native PALM parent of 2.53", async () => {
  const { manifest, parentReleaseId } = await validateResearchIterationManifest252Snapshot();
  assert.equal(parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.51.0");
  assert.equal(manifest.releaseId, "ohri-mouse-interneuron-research-iteration-2.52.0");
  assert.equal(manifest.registrySummary.researchUpgradeCount, 206);
  assert.equal(manifest.exactReferences.superClemPalmNativePointReference252.detectionCount, 18358);
  assert.equal(SNAPSHOT_252.bytes, 326208);
});

test("recomputed hashes cannot mutate the sealed 2.52 zero-geometry boundary", async () => {
  const { manifest } = await validateResearchIterationManifest252Snapshot();
  const changed = structuredClone(manifest);
  changed.exactReferences.superClemPalmNativePointReference252.threeDimensionalObjectCount = 1;
  changed.manifestContentSha256 = computeManifestContentSha256(changed);
  await assert.rejects(validateResearchIterationManifest252Snapshot(changed), /content receipt changed/);
});
