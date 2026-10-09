import assert from "node:assert/strict";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest258Snapshot } from "../scripts/validate-research-iteration-manifest-2.58-snapshot.mjs";
import { validateResearchIterationManifest259 } from "../scripts/validate-research-iteration-manifest-2.59.mjs";
import { buildResearchIterationManifest259 } from "../tools/build_research_iteration_manifest_2_59.mjs";

test("2.59 exposes exact source-strain morphology faceting with paper membership still unresolved", async () => {
  const built = await buildResearchIterationManifest259();
  const result = await validateResearchIterationManifest259();
  const parent = await validateResearchIterationManifest258Snapshot();
  assert.equal(built.manifest.application.version, "2.59.0-research.1");
  assert.equal(built.manifest.parentIterationManifest.releaseId, parent.releaseId);
  assert.deepEqual(result, {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.59.0",
    inputCount: 482,
    parentReleaseId: "ohri-mouse-interneuron-research-iteration-2.58.0",
    researchUpgradeCount: 215,
    sourceProfileCount: 387,
    paperLinkedRepositoryRecordCount: 650,
    rawSourceStrainLabelCount: 12,
    paperMembershipReconciled: false,
    fullProjectCopyCount: 0,
  });
});

test("rehashing cannot turn source strain into a canonical type, crosswalk, or synthetic geometry", async () => {
  const { manifest } = await buildResearchIterationManifest259();
  for (const mutate of [
    (copy) => { copy.exactReferences.gintyNeuroMorphoStrainFacetAudit259.paperMembershipReconciled = true; },
    (copy) => { copy.exactReferences.gintyNeuroMorphoStrainFacetAudit259.molecularProfileJoinCount = 1; },
    (copy) => { copy.exactReferences.gintyNeuroMorphoStrainFacetAudit259.representativeOrMeanNeuronCreated = true; },
    (copy) => { copy.exactReferences.gintyNeuroMorphoStrainFacetAudit259.surfacesAdmittedByAudit = 1; },
    (copy) => { copy.exactReferences.iteration259Layout.fullProjectCopyCount = 1; },
    (copy) => { copy.exactReferences.researchRegistryDenominators259.upgradeCount = 214; },
  ]) {
    const changed = structuredClone(manifest);
    mutate(changed);
    changed.manifestContentSha256 = computeManifestContentSha256(changed);
    await assert.rejects(validateResearchIterationManifest259(changed), /differ from verified rebuild/);
  }
});
