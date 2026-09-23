import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest247Snapshot } from "../scripts/validate-research-iteration-manifest-2.47-snapshot.mjs";
import { buildResearchIterationManifest248, INPUTS_248 } from "../tools/build_research_iteration_manifest_2_48.mjs";
import { validateResearchIterationManifest248 } from "../scripts/validate-research-iteration-manifest-2.48.mjs";

const manifestPath = new URL("../data/research-iteration-manifest-2.48.json", import.meta.url);

test("2.48 adds source-bounded BANC availability information above immutable 2.47", async () => {
  const parent = await validateResearchIterationManifest247Snapshot();
  const built = await buildResearchIterationManifest248();
  assert.deepEqual(await readFile(manifestPath), built.bytes);
  assert.equal(built.manifest.application.version, "2.48.0-research.1");
  assert.equal(built.manifest.parentIterationManifest.releaseId, parent.releaseId);
  assert.equal(built.manifest.integrity.inputCount, 342 + INPUTS_248.length);
  for (const [id, path] of INPUTS_248) assert.ok(built.manifest.authoritativeInputs.some((input) => input.id === id && input.path === path));
  const reference = built.manifest.exactReferences.bancV888ComparativeInternalReference248;
  assert.equal(reference.materializationId, "v888");
  assert.equal(reference.metadataRowCount, 188162);
  assert.equal(reference.selectedVncInterneuronRootId, null);
  assert.equal(reference.renderedGeometryCount, 0);
  assert.equal(reference.sameCellJoinCount, 0);
  assert.equal(reference.nextExactCellGateUpgradeId, "UPG-221");
  assert.equal((await validateResearchIterationManifest248()).inputCount, 342 + INPUTS_248.length);
});

test("recomputed hashes cannot authorize a BANC cell identity or geometry", async () => {
  const { manifest } = await buildResearchIterationManifest248();
  for (const mutate of [
    (copy) => { copy.exactReferences.bancV888ComparativeInternalReference248.renderedGeometryCount = 1; },
    (copy) => { copy.exactReferences.bancV888ComparativeInternalReference248.selectedVncInterneuronRootId = "invented"; },
    (copy) => { copy.exactReferences.bancV888ComparativeInternalReference248.sameCellJoinCount = 1; },
    (copy) => { copy.exactReferences.bancV888ComparativeInternalReference248.metadataRowUnit = "interneuron count"; },
    (copy) => { copy.parentIterationManifest.releaseId = "wrong-parent"; },
  ]) {
    const changed = structuredClone(manifest);
    mutate(changed);
    changed.manifestContentSha256 = computeManifestContentSha256(changed);
    await assert.rejects(validateResearchIterationManifest248(changed), /differ from verified rebuild/);
  }
});
