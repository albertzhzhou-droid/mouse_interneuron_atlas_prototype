import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateResearchIterationManifest272 } from "../scripts/validate-research-iteration-manifest-2.72.mjs";

test("2.72 reconciles UPG-245 stable-ID candidates while holding geometry and denominator admission", async () => {
  const result = await validateResearchIterationManifest272();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.72.0");
  assert.equal(result.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.71.0");
  assert.equal(result.researchUpgradeCount, 228);
  assert.equal(result.completedUpgradeCount, 67);
  assert.equal(result.auditId, "neuromorpho-release-8-6-126-todd-stable-id-audit-0.1");
  assert.equal(result.candidateStableIdCount, 30);
  assert.equal(result.candidateIdsFoundInBaseline, 0);
  assert.equal(result.baselineToddQueryRecordCount, 309);
  assert.equal(result.currentUiHits, 339);
  assert.equal(result.currentRosterComplete, false);
  assert.equal(result.sourceFilesDownloaded, 0);
  assert.equal(result.objectLevelReuseTermsVerified, false);
  assert.equal(result.newGeometryObjectsAdmitted, 0);
  assert.equal(result.fullProjectCopyCount, 0);
});

test("2.72 rejects false current-roster certainty, source-file admission, or changed rollback", async () => {
  const manifest = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.72.json", import.meta.url), "utf8"));
  for (const mutate of [
    (value) => { value.exactReferences.neuromorphoRelease126ToddStableIdAudit245.candidateIdsFoundInBaseline = 1; },
    (value) => { value.exactReferences.neuromorphoRelease126ToddStableIdAudit245.completeCurrentStableIdRosterRetrieved = true; },
    (value) => { value.exactReferences.neuromorphoRelease126ToddStableIdAudit245.candidateSourceFilesDownloaded = 30; },
    (value) => { value.exactReferences.neuromorphoRelease126ToddStableIdAudit245.newGeometryObjectsAdmitted = 1; },
    (value) => { value.exactReferences.iteration272Layout.fullProjectCopyCount = 1; },
    (value) => { value.parentIterationManifest.path = "data/research-iteration-manifest-2.70.json"; },
  ]) {
    const altered = structuredClone(manifest);
    mutate(altered);
    await assert.rejects(validateResearchIterationManifest272(altered));
  }
});
