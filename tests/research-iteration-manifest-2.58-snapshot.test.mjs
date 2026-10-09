import assert from "node:assert/strict";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest258Snapshot } from "../scripts/validate-research-iteration-manifest-2.58-snapshot.mjs";

test("2.58 is sealed as the immutable BANC count-only rollback parent", async () => {
  const result = await validateResearchIterationManifest258Snapshot();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.58.0");
  assert.equal(result.inputCount, 469);
  assert.equal(result.researchUpgradeCount, 214);
  assert.equal(result.fullProjectCopyCount, 0);
});

test("a mutation cannot turn the 2.58 count metric into geometry", async () => {
  const { manifest } = await validateResearchIterationManifest258Snapshot();
  const changed = structuredClone(manifest);
  changed.exactReferences.bancV888MitochondriaRouteAudit258.admittedPointMarkers = 31;
  changed.manifestContentSha256 = computeManifestContentSha256(changed);
  await assert.rejects(validateResearchIterationManifest258Snapshot(changed), /content receipt changed/);
});
