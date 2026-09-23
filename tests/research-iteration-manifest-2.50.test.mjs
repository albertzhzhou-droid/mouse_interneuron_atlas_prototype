import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest249Snapshot } from "../scripts/validate-research-iteration-manifest-2.49-snapshot.mjs";
import { buildResearchIterationManifest250, INPUTS_250 } from "../tools/build_research_iteration_manifest_2_50.mjs";
import { validateResearchIterationManifest250 } from "../scripts/validate-research-iteration-manifest-2.50.mjs";

const manifestPath = new URL("../data/research-iteration-manifest-2.50.json", import.meta.url);

test("2.50 preserves 2.49 and records the unresolved adult spinal MERFISH version comparison", async () => {
  const parent = await validateResearchIterationManifest249Snapshot();
  const built = await buildResearchIterationManifest250();
  assert.deepEqual(await readFile(manifestPath), built.bytes);
  assert.equal(built.manifest.application.version, "2.50.0-research.1");
  assert.equal(built.manifest.parentIterationManifest.releaseId, parent.releaseId);
  assert.equal(built.manifest.integrity.inputCount, 360 + INPUTS_250.length);
  for (const [id, path] of INPUTS_250) assert.ok(built.manifest.authoritativeInputs.some((input) => input.id === id && input.path === path));
  const audit = built.manifest.exactReferences.adultMouseSpinalMerfishVersionAudit250;
  assert.equal(audit.earlierRecordId, "18039571");
  assert.equal(audit.laterRecordId, "20533289");
  assert.equal(audit.candidateLineageStatus, "unverified");
  assert.equal(audit.sectionDenominatorsReconciled, false);
  assert.equal(audit.payloadsBundled, 0);
  assert.equal(audit.crossVersionJoins, 0);
  assert.equal(audit.internalObjects, 0);
  assert.equal((await validateResearchIterationManifest250()).inputCount, 360 + INPUTS_250.length);
});

test("recomputed manifest hashes cannot imply that two MERFISH records are the same immutable dataset", async () => {
  const { manifest } = await buildResearchIterationManifest250();
  const changed = structuredClone(manifest);
  changed.exactReferences.adultMouseSpinalMerfishVersionAudit250.sectionDenominatorsReconciled = true;
  changed.manifestContentSha256 = computeManifestContentSha256(changed);
  await assert.rejects(validateResearchIterationManifest250(changed), /differ from verified rebuild/);
});
