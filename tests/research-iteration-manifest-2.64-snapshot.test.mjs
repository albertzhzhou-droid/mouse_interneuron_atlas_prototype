import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateResearchIterationManifest264Snapshot } from "../scripts/validate-research-iteration-manifest-2.64-snapshot.mjs";

test("2.64 remains an immutable rollback parent after current registries advance", async () => {
  const result = await validateResearchIterationManifest264Snapshot();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.64.0");
  assert.equal(result.researchUpgradeCount, 222);
  assert.equal(result.fullProjectCopyCount, 0);
  const manifest = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.64.json", import.meta.url), "utf8"));
  assert.equal(manifest.exactReferences.researchRegistryDenominators264.displayedUpgradeCount, 35);
  assert.equal(manifest.exactReferences.svaraLarvalZebrafishSpinalSbemReference264.admittedNeuronObjects, 0);
});

test("2.64 snapshot rejects drift in frozen registry, geometry, and layout boundaries", async () => {
  const manifest = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.64.json", import.meta.url), "utf8"));
  for (const mutate of [
    (value) => { value.exactReferences.researchRegistryDenominators264.upgradeCount = 224; },
    (value) => { value.exactReferences.svaraLarvalZebrafishSpinalSbemReference264.admittedNeuronObjects = 1; },
    (value) => { value.exactReferences.iteration264Layout.fullProjectCopyCount = 1; },
  ]) {
    const altered = structuredClone(manifest);
    mutate(altered);
    await assert.rejects(validateResearchIterationManifest264Snapshot(altered));
  }
});
