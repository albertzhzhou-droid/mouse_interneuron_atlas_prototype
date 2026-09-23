import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest243Snapshot } from "../scripts/validate-research-iteration-manifest-2.43-snapshot.mjs";
import { buildResearchIterationManifest244, INPUTS_244, MANIFEST_244_PATH } from "../tools/build_research_iteration_manifest_2_44.mjs";
import { validateResearchIterationManifest244 } from "../scripts/validate-research-iteration-manifest-2.44.mjs";

test("current 2.44 rebuild verifies the public internal-detail reference and all input receipts", async () => {
  const sealedParent = await validateResearchIterationManifest243Snapshot();
  const built = await buildResearchIterationManifest244();
  assert.deepEqual(await readFile(MANIFEST_244_PATH), built.bytes);
  assert.equal(built.manifest.application.version, "2.44.0-research.1");
  assert.equal(built.manifest.parentIterationManifest.releaseId, sealedParent.releaseId);
  assert.equal(built.manifest.integrity.inputCount, 271 + INPUTS_244.length);
  for (const [id, inputPath] of INPUTS_244) {
    assert.ok(built.manifest.authoritativeInputs.some((input) => input.id === id && input.path === inputPath));
  }
  assert.deepEqual(built.manifest.exactReferences.spinalVolumeEmReference244, {
    sourceDoi: "10.1038/s41593-019-0358-7",
    reportedVolumeMicrometre: [35, 24, 2],
    publicationProfileCount: 3,
    profileCountIsCellCount: false,
    reconstructedStructureCount: 6,
    admittedProjectGeometryCount: 0,
    registrationCount: 0,
    sameCellJoinCount: 0,
    mediaRehosted: false,
    reuseLicenceVerified: false,
    researchUpgradeLastId: "UPG-217",
  });
  assert.equal((await validateResearchIterationManifest244()).inputCount, 271 + INPUTS_244.length);
});

test("recomputed hashes cannot authorize a project geometry or same-cell join", async () => {
  const { manifest } = await buildResearchIterationManifest244();
  for (const mutate of [
    (copy) => { copy.exactReferences.spinalVolumeEmReference244.admittedProjectGeometryCount = 1; },
    (copy) => { copy.exactReferences.spinalVolumeEmReference244.sameCellJoinCount = 1; },
    (copy) => { copy.authoritativeInputs.pop(); copy.integrity.inputCount -= 1; },
    (copy) => { copy.authoritativeInputs[0].sha256 = "0".repeat(64); },
    (copy) => { copy.parentIterationManifest.releaseId = "wrong-parent"; },
  ]) {
    const changed = structuredClone(manifest);
    mutate(changed);
    changed.manifestContentSha256 = computeManifestContentSha256(changed);
    await assert.rejects(validateResearchIterationManifest244(changed), /differ from verified rebuild/);
  }
});
