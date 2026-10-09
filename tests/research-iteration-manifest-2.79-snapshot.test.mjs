import assert from "node:assert/strict";
import test from "node:test";
import { validateResearchIterationManifest279Snapshot } from "../scripts/validate-research-iteration-manifest-2.79-snapshot.mjs";

test("2.79 seals the article-derived V1 reference without admitting unsupported 3D detail", async () => {
  const result = await validateResearchIterationManifest279Snapshot();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.79.0");
  assert.equal(result.version, "2.79.0-research.1");
  assert.equal(result.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.78.0");
  assert.equal(result.sourceCount, 31);
  assert.equal(result.recordSetCount, 41);
  assert.equal(result.sourceProfileCount, 387);
  assert.equal(result.researchUpgradeCount, 236);
  assert.equal(result.reportedV1ClusterCount, 14);
  assert.equal(result.selectedStudyWideNucleusCount, 89494);
  assert.equal(result.newGeometryCount, 0);
  assert.equal(result.fullProjectCopyCount, 0);
});
