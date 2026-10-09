import assert from "node:assert/strict";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest260Snapshot } from "../scripts/validate-research-iteration-manifest-2.60-snapshot.mjs";

test("2.60 is sealed as the immutable source-context rollback parent", async () => {
  const result = await validateResearchIterationManifest260Snapshot();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.60.0");
  assert.equal(result.inputCount, 494);
  assert.equal(result.researchUpgradeCount, 217);
  assert.equal(result.fullProjectCopyCount, 0);
});

test("2.60 snapshot cannot be mutated into cell geometry, raw-image access or a same-cell join", async () => {
  const { manifest } = await validateResearchIterationManifest260Snapshot();
  for (const mutate of [
    (value) => { value.exactReferences.pkd2l1IndependentPopulationContext260.publicRawDataDepositVerified = true; },
    (value) => { value.exactReferences.pkd2l1IndependentPopulationContext260.sameCellJoinToCrozat = true; },
    (value) => { value.exactReferences.pkd2l1IndependentPopulationContext260.geometryPrimitivesAdmitted = 1; },
    (value) => { value.exactReferences.iteration260Layout.fullProjectCopyCount = 1; },
    (value) => { value.exactReferences.researchRegistryDenominators260.upgradeCount = 218; },
  ]) {
    const changed = structuredClone(manifest);
    mutate(changed);
    changed.manifestContentSha256 = computeManifestContentSha256(changed);
    await assert.rejects(validateResearchIterationManifest260Snapshot(changed), /content receipt changed/);
  }
});
