import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateResearchIterationManifest266 } from "../scripts/validate-research-iteration-manifest-2.66.mjs";

test("2.66 remains an immutable public-availability snapshot with zero admitted EM detail", async () => {
  const result = await validateResearchIterationManifest266();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.66.0");
  assert.equal(result.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.65.0");
  assert.equal(result.inputCount, 547);
  assert.equal(result.researchUpgradeCount, 224);
  assert.equal(result.displayedUpgradeCount, 37);
  assert.equal(result.completedUpgradeCount, 65);
  assert.equal(result.admittedInternalObjects, 0);
  assert.equal(result.downloadedPayloadBytes, 0);
  assert.equal(result.fullProjectCopyCount, 0);
});

test("2.66 snapshot rejects changed evidence, registry denominators, or layout", async () => {
  const manifest = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.66.json", import.meta.url), "utf8"));
  for (const mutate of [
    (value) => { value.exactReferences.pkd2l1SbfsemPublicAvailabilityAudit242.noRawVolumeInReviewedScope = false; },
    (value) => { value.exactReferences.pkd2l1SbfsemPublicAvailabilityAudit242.independentAssetReuseRightsVerified = true; },
    (value) => { value.exactReferences.pkd2l1SbfsemPublicAvailabilityAudit242.sameCellJoins = 1; },
    (value) => { value.exactReferences.researchRegistryDenominators266.upgradeCount = 225; },
    (value) => { value.exactReferences.iteration266Layout.fullProjectCopyCount = 1; },
  ]) {
    const altered = structuredClone(manifest);
    mutate(altered);
    await assert.rejects(validateResearchIterationManifest266(altered));
  }
});
