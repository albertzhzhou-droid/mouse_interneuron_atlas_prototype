import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateResearchIterationManifest267 } from "../scripts/validate-research-iteration-manifest-2.67.mjs";

test("2.67 seals source-authority render defaults and the planned UPG-243 search", async () => {
  const result = await validateResearchIterationManifest267();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.67.0");
  assert.equal(result.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.66.0");
  assert.equal(result.researchUpgradeCount, 225);
  assert.equal(result.displayedUpgradeCount, 38);
  assert.equal(result.eligible3DDefault, "radius-derived-open-frusta");
  assert.equal(result.plannedOpenVolumeAudit, "UPG-243");
  assert.equal(result.admittedInternalObjects, 0);
  assert.equal(result.fullProjectCopyCount, 0);
});

test("2.67 rejects invented membrane geometry, 2D extrusion, or positive UPG-243 admissions", async () => {
  const manifest = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.67.json", import.meta.url), "utf8"));
  for (const mutate of [
    (value) => { value.exactReferences.morphologyRenderModePolicy267.surfaceIsObservedMembrane = true; },
    (value) => { value.exactReferences.morphologyRenderModePolicy267.planar2DAlwaysCenterlineOnly = false; },
    (value) => { value.exactReferences.openMouseSpinalEmSearch243.candidateVolumesAdmitted = 1; },
    (value) => { value.exactReferences.openMouseSpinalEmSearch243.exactInterneuronObjectCrosswalksAdmitted = 1; },
    (value) => { value.exactReferences.researchRegistryDenominators267.displayedUpgradeCount = 37; },
    (value) => { value.exactReferences.iteration267Layout.fullProjectCopyCount = 1; },
  ]) {
    const altered = structuredClone(manifest);
    mutate(altered);
    await assert.rejects(validateResearchIterationManifest267(altered));
  }
});
