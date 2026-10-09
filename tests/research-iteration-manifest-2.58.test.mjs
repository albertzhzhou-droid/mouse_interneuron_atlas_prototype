import assert from "node:assert/strict";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest257Snapshot } from "../scripts/validate-research-iteration-manifest-2.57-snapshot.mjs";
import { validateResearchIterationManifest258 } from "../scripts/validate-research-iteration-manifest-2.58.mjs";
import { buildResearchIterationManifest258 } from "../tools/build_research_iteration_manifest_2_58.mjs";

test("2.58 pins the BANC v888 count and query route without promoting unobserved geometry", async () => {
  const built = await buildResearchIterationManifest258();
  const result = await validateResearchIterationManifest258();
  const parent = await validateResearchIterationManifest257Snapshot();
  assert.equal(built.manifest.application.version, "2.58.0-research.1");
  assert.equal(built.manifest.parentIterationManifest.releaseId, parent.releaseId);
  assert.equal(result.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.57.0");
  assert.deepEqual({
    releaseId: result.releaseId,
    researchUpgradeCount: result.researchUpgradeCount,
    sourceCount: result.sourceCount,
    recordSetCount: result.recordSetCount,
    metadataMitochondriaCount: result.metadataMitochondriaCount,
    admittedMitochondrionRows: result.admittedMitochondrionRows,
    admittedPointMarkers: result.admittedPointMarkers,
    fullProjectCopyCount: result.fullProjectCopyCount,
  }, {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.58.0",
    researchUpgradeCount: 214,
    sourceCount: 28,
    recordSetCount: 37,
    metadataMitochondriaCount: 31,
    admittedMitochondrionRows: 0,
    admittedPointMarkers: 0,
    fullProjectCopyCount: 0,
  });
});

test("rehashed manifests cannot turn the BANC count into geometry or a mouse identity join", async () => {
  const { manifest } = await buildResearchIterationManifest258();
  for (const mutate of [
    (copy) => { copy.exactReferences.bancV888MitochondriaRouteAudit258.positionsVerified = true; },
    (copy) => { copy.exactReferences.bancV888MitochondriaRouteAudit258.admittedPointMarkers = 31; },
    (copy) => { copy.exactReferences.bancV888MitochondriaRouteAudit258.candidate.mouseInterneuronJoin = true; },
    (copy) => { copy.exactReferences.researchRegistryDenominators258.upgradeCount = 213; },
    (copy) => { copy.exactReferences.iteration258Layout.fullProjectCopyCount = 1; },
  ]) {
    const changed = structuredClone(manifest);
    mutate(changed);
    changed.manifestContentSha256 = computeManifestContentSha256(changed);
    await assert.rejects(validateResearchIterationManifest258(changed), /differ from verified rebuild/);
  }
});
