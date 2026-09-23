import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest248Snapshot } from "../scripts/validate-research-iteration-manifest-2.48-snapshot.mjs";
import { buildResearchIterationManifest249, INPUTS_249 } from "../tools/build_research_iteration_manifest_2_49.mjs";
import { validateResearchIterationManifest249 } from "../scripts/validate-research-iteration-manifest-2.49.mjs";

const manifestPath = new URL("../data/research-iteration-manifest-2.49.json", import.meta.url);

test("2.49 pins one BANC candidate and exact nucleus/SWC receipts above immutable 2.48 without rendering", async () => {
  const parent = await validateResearchIterationManifest248Snapshot();
  const built = await buildResearchIterationManifest249();
  assert.deepEqual(await readFile(manifestPath), built.bytes);
  assert.equal(built.manifest.application.version, "2.49.0-research.1");
  assert.equal(built.manifest.parentIterationManifest.releaseId, parent.releaseId);
  assert.equal(built.manifest.integrity.inputCount, 351 + INPUTS_249.length);
  for (const [id, path] of INPUTS_249) assert.ok(built.manifest.authoritativeInputs.some((input) => input.id === id && input.path === path));
  const audit = built.manifest.exactReferences.bancV888CandidateAudit249;
  assert.equal(audit.candidateRootId, "720575941350424112");
  assert.equal(audit.archivedMetadataRowCount, 188508);
  assert.equal(audit.documentedMetadataRowCount, 188162);
  assert.equal(audit.strictCandidateScreenRows, 12571);
  assert.equal(audit.nucleusExactRootJoinVerified, true);
  assert.equal(audit.swcNodeCount, 7451);
  assert.equal(audit.meshVersionLinkedToDataverseV888, false);
  assert.equal(audit.sameCellObjectChainComplete, false);
  assert.equal(audit.renderedGeometryCount, 0);
  assert.equal((await validateResearchIterationManifest249()).inputCount, 351 + INPUTS_249.length);
});

test("recomputed hashes cannot authorize BANC geometry or erase the candidate evidence boundary", async () => {
  const { manifest } = await buildResearchIterationManifest249();
  for (const mutate of [
    (copy) => { copy.exactReferences.bancV888CandidateAudit249.renderedGeometryCount = 1; },
    (copy) => { copy.exactReferences.bancV888CandidateAudit249.candidateRootId = "invented"; },
    (copy) => { copy.exactReferences.bancV888CandidateAudit249.sameCellObjectChainComplete = true; },
    (copy) => { copy.exactReferences.bancV888CandidateAudit249.archivedMetadataRowCount = 188162; },
    (copy) => { copy.parentIterationManifest.releaseId = "wrong-parent"; },
  ]) {
    const changed = structuredClone(manifest);
    mutate(changed);
    changed.manifestContentSha256 = computeManifestContentSha256(changed);
    await assert.rejects(validateResearchIterationManifest249(changed), /differ from verified rebuild/);
  }
});
