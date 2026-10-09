import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { compareResearchIteration291Bytes, validateResearchIterationManifest291 } from "../scripts/validate-research-iteration-manifest-2.91.mjs";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
test("2.91 replays all current bytes while preserving 2.90 and independent scientific gates", async () => {
  const result = await validateResearchIterationManifest291();
  assert.equal(result.version, "2.91.0-research.1"); assert.equal(result.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.90.0");
  assert.equal(result.sourceProfileCount, 387); assert.equal(result.researchUpgradeCount, 243); assert.ok(result.inputCount > 90);
  assert.equal(result.exactCrossSourceIdentityCount, 0); assert.equal(result.atlasRegistrationCount, 0);
  assert.equal(result.mouseSpinalInterneuronSameCellInternalObjectCount, 0); assert.equal(result.bilSectionLinkedCellNucleusGeometryCount, 0); assert.equal(result.fullGoalComplete, false);
});
test("a recomputed content digest cannot excuse changed current inputs or broadened geometry claims", async () => {
  const original = await readFile(new URL("../data/research-iteration-manifest-2.91.json", import.meta.url));
  for (const mutate of [(value) => { value.authoritativeInputs[0].sha256 = "0".repeat(64); }, (value) => { value.implementationScope.fullGoalComplete = true; }, (value) => { value.application.version = "2.90.0-research.1"; }]) {
    const changed = JSON.parse(original); mutate(changed); changed.manifestContentSha256 = computeManifestContentSha256(changed);
    assert.throws(() => compareResearchIteration291Bytes(Buffer.from(JSON.stringify(changed,null,2)+"\n"),original), /stale or changed/);
  }
});
