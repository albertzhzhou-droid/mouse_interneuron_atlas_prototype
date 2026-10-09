import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateResearchIterationManifest265Snapshot } from "../scripts/validate-research-iteration-manifest-2.65-snapshot.mjs";

test("2.65 remains an immutable snapshot with the original UPG-242 watch boundary", async () => {
  const result = await validateResearchIterationManifest265Snapshot();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.65.0");
  assert.equal(result.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.64.0");
  assert.equal(result.researchUpgradeCount, 224);
  assert.equal(result.displayedUpgradeCount, 36);
  const manifest = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.65.json", import.meta.url), "utf8"));
  assert.equal(manifest.exactReferences.nakamuraSbfemAvailabilityWatch265.admittedCellOrOrganelleGeometry, 0);
});

test("2.65 snapshot rejects later registry, identity, geometry, or layout changes", async () => {
  const manifest = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.65.json", import.meta.url), "utf8"));
  for (const mutate of [
    (value) => { value.exactReferences.researchRegistryDenominators265.displayedUpgradeCount = 37; },
    (value) => { value.exactReferences.nakamuraSbfemAvailabilityWatch265.admittedEmVolumes = 1; },
    (value) => { value.exactReferences.morphologyLabelDiscovery265.sourceLabelToSameCellJoinCount = 1; },
    (value) => { value.exactReferences.iteration265Layout.fullProjectCopyCount = 1; },
  ]) {
    const altered = structuredClone(manifest);
    mutate(altered);
    await assert.rejects(validateResearchIterationManifest265Snapshot(altered));
  }
});
