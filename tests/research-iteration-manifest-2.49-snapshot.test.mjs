import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_249, validateResearchIterationManifest249Snapshot } from "../scripts/validate-research-iteration-manifest-2.49-snapshot.mjs";

test("2.49 is sealed byte-for-byte above immutable 2.48 with no BANC geometry admission", async () => {
  const result = await validateResearchIterationManifest249Snapshot();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.49.0");
  assert.equal(result.inputCount, 360);
  assert.equal(result.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.48.0");
  assert.equal(result.candidateRootId, "720575941350424112");
  assert.equal(result.swcNodeCount, 7451);
  assert.equal(result.renderedGeometryCount, 0);
  assert.equal(SNAPSHOT_249.bytes, 306065);
});

test("recomputed content hashes cannot mutate sealed 2.49 evidence", async () => {
  await validateResearchIterationManifest249Snapshot();
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const manifest = JSON.parse(await readFile(path.resolve(root, SNAPSHOT_249.path), "utf8"));
  manifest.exactReferences.bancV888CandidateAudit249.renderedGeometryCount = 1;
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  await assert.rejects(validateResearchIterationManifest249Snapshot(manifest), /content receipt changed/);
});
