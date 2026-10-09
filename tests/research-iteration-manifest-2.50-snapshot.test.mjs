import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_250, validateResearchIterationManifest250Snapshot } from "../scripts/validate-research-iteration-manifest-2.50-snapshot.mjs";

test("2.50 remains sealed byte-for-byte above 2.49 as a MERFISH metadata-only increment", async () => {
  const result = await validateResearchIterationManifest250Snapshot();
  const manifest = JSON.parse(await readFile(new URL(`../${SNAPSHOT_250.path}`, import.meta.url), "utf8"));
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.50.0");
  assert.equal(result.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.49.0");
  assert.equal(result.inputCount, 369);
  assert.equal(manifest.registrySummary.researchUpgradeCount, 204);
  assert.equal(SNAPSHOT_250.bytes, 311938);
});

test("recomputed content hashes cannot mutate the sealed 2.50 source-denominator boundary", async () => {
  const result = await validateResearchIterationManifest250Snapshot();
  const changed = structuredClone(result.manifest);
  changed.registrySummary.researchUpgradeCount += 1;
  changed.manifestContentSha256 = computeManifestContentSha256(changed);
  await assert.rejects(validateResearchIterationManifest250Snapshot(changed), /content receipt changed/);
});
