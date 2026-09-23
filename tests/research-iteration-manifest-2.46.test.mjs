import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest245Snapshot } from "../scripts/validate-research-iteration-manifest-2.45-snapshot.mjs";
import { buildResearchIterationManifest246, INPUTS_246 } from "../tools/build_research_iteration_manifest_2_46.mjs";
import { validateResearchIterationManifest246 } from "../scripts/validate-research-iteration-manifest-2.46.mjs";

const MANIFEST_246_PATH = new URL("../data/research-iteration-manifest-2.46.json", import.meta.url);

test("2.46 seals the unchanged Davis Figure 1 source-local reference over immutable 2.45", async () => {
  const sealedParent = await validateResearchIterationManifest245Snapshot();
  const built = await buildResearchIterationManifest246();
  assert.deepEqual(await readFile(MANIFEST_246_PATH), built.bytes);
  assert.equal(built.manifest.application.version, "2.46.0-research.1");
  assert.equal(built.manifest.parentIterationManifest.releaseId, sealedParent.releaseId);
  assert.equal(built.manifest.integrity.inputCount, 314 + INPUTS_246.length + 1);
  for (const [id, inputPath] of INPUTS_246) {
    assert.ok(built.manifest.authoritativeInputs.some((input) => input.id === id && input.path === inputPath));
  }
  const reference = built.manifest.exactReferences.davisIcrSameCellFigure246;
  assert.equal(reference.doi, "10.1038/s41598-023-38605-9");
  assert.equal(reference.sourceImageBytes, 1195290);
  assert.equal(reference.sourceImageSha256, "3beafa543799863db6752e97e31b718e9d6e93645866d4065178c8ce3413cb74");
  assert.deepEqual(reference.captionAssertedSameCellRelation, { fromPanel: "d", toPanels: ["e", "f", "g"], independentIdentityValidation: false });
  assert.equal(reference.emTissuePreservationCompromised, true);
  assert.equal(reference.admittedProjectGeometryCount, 0);
  assert.equal(reference.activeRecordJoinCount, 0);
  assert.equal(reference.atlasRegistrationCount, 0);
  assert.equal((await validateResearchIterationManifest246()).inputCount, 314 + INPUTS_246.length + 1);
});

test("recomputed hashes cannot authorize 2.46 geometry, identity, license or receipt mutations", async () => {
  const { manifest } = await buildResearchIterationManifest246();
  for (const mutate of [
    (copy) => { copy.exactReferences.davisIcrSameCellFigure246.admittedProjectGeometryCount = 1; },
    (copy) => { copy.exactReferences.davisIcrSameCellFigure246.captionAssertedSameCellRelation.fromPanel = "a"; },
    (copy) => { copy.exactReferences.davisIcrSameCellFigure246.license = "unknown"; },
    (copy) => { copy.authoritativeInputs.pop(); copy.integrity.inputCount -= 1; },
    (copy) => { copy.parentIterationManifest.releaseId = "wrong-parent"; },
  ]) {
    const changed = structuredClone(manifest);
    mutate(changed);
    changed.manifestContentSha256 = computeManifestContentSha256(changed);
    await assert.rejects(validateResearchIterationManifest246(changed), /differ from verified rebuild/);
  }
});
