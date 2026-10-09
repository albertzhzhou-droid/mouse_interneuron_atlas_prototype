import assert from "node:assert/strict";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_251, validateResearchIterationManifest251Snapshot } from "../scripts/validate-research-iteration-manifest-2.51-snapshot.mjs";

test("2.51 remains sealed byte-for-byte as the parent of the new source-only PALM increment", async () => {
  const { manifest, parentReleaseId } = await validateResearchIterationManifest251Snapshot();
  assert.equal(parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.50.0");
  assert.equal(manifest.releaseId, "ohri-mouse-interneuron-research-iteration-2.51.0");
  assert.equal(manifest.registrySummary.researchUpgradeCount, 205);
  assert.equal(SNAPSHOT_251.bytes, 317976);
});

test("recomputed hashes cannot mutate the sealed 2.51 zero-admission boundary", async () => {
  const { manifest } = await validateResearchIterationManifest251Snapshot();
  const changed = structuredClone(manifest);
  changed.exactReferences.micronsSubcellularSourceAudit251.synapsePointCount = 1;
  changed.manifestContentSha256 = computeManifestContentSha256(changed);
  await assert.rejects(validateResearchIterationManifest251Snapshot(changed), /content receipt changed/);
});
