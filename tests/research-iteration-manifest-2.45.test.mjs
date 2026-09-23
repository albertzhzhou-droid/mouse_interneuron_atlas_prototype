import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest244Snapshot } from "../scripts/validate-research-iteration-manifest-2.44-snapshot.mjs";
import { buildResearchIterationManifest245, INPUTS_245 } from "../tools/build_research_iteration_manifest_2_45.mjs";
import { validateResearchIterationManifest245 } from "../scripts/validate-research-iteration-manifest-2.45.mjs";

const MANIFEST_245_PATH = new URL("../data/research-iteration-manifest-2.45.json", import.meta.url);

test("2.45 seals the serial image browser over immutable 2.44 with exact file receipts", async () => {
  const sealedParent = await validateResearchIterationManifest244Snapshot();
  const built = await buildResearchIterationManifest245();
  assert.deepEqual(await readFile(MANIFEST_245_PATH), built.bytes);
  assert.equal(built.manifest.application.version, "2.45.0-research.1");
  assert.equal(built.manifest.parentIterationManifest.releaseId, sealedParent.releaseId);
  assert.equal(built.manifest.integrity.inputCount, 280 + INPUTS_245.length + 22);
  for (const [id, inputPath] of INPUTS_245) {
    assert.ok(built.manifest.authoritativeInputs.some((input) => input.id === id && input.path === inputPath));
  }
  assert.deepEqual(built.manifest.exactReferences.superClemDorsalSynapse1SerialStack245.sourceSectionLabels, ["20140", "20141", "20142", "20143", "20144", "20145", "20146", "20147", "20148", "20149", "20150"]);
  assert.equal(built.manifest.exactReferences.superClemDorsalSynapse1SerialStack245.sourceSectionCount, 11);
  assert.equal(built.manifest.exactReferences.superClemDorsalSynapse1SerialStack245.totalSourceBytes, 26463987);
  assert.equal(built.manifest.exactReferences.superClemDorsalSynapse1SerialStack245.admittedProjectGeometryCount, 0);
  assert.equal(built.manifest.exactReferences.superClemDorsalSynapse1SerialStack245.selectedAtlasRecordJoinCount, 0);
  assert.equal((await validateResearchIterationManifest245()).inputCount, 280 + INPUTS_245.length + 22);
});

test("recomputed hashes cannot authorize 2.45 volume, registration, join or receipt mutations", async () => {
  const { manifest } = await buildResearchIterationManifest245();
  for (const mutate of [
    (copy) => { copy.exactReferences.superClemDorsalSynapse1SerialStack245.admittedVolumeCount = 1; },
    (copy) => { copy.exactReferences.superClemDorsalSynapse1SerialStack245.crossSectionRegistrationCount = 1; },
    (copy) => { copy.exactReferences.superClemDorsalSynapse1SerialStack245.selectedAtlasRecordJoinCount = 1; },
    (copy) => { copy.authoritativeInputs.pop(); copy.integrity.inputCount -= 1; },
    (copy) => { copy.parentIterationManifest.releaseId = "wrong-parent"; },
  ]) {
    const changed = structuredClone(manifest);
    mutate(changed);
    changed.manifestContentSha256 = computeManifestContentSha256(changed);
    await assert.rejects(validateResearchIterationManifest245(changed), /differ from verified rebuild/);
  }
});

