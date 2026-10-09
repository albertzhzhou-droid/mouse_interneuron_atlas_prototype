import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_250, validateResearchIterationManifest250Snapshot } from "../scripts/validate-research-iteration-manifest-2.50-snapshot.mjs";
import { buildResearchIterationManifest251, INPUTS_251 } from "../tools/build_research_iteration_manifest_2_51.mjs";
import { validateResearchIterationManifest251 } from "../scripts/validate-research-iteration-manifest-2.51.mjs";

const manifestPath = new URL("../data/research-iteration-manifest-2.51.json", import.meta.url);

test("2.51 preserves the 2.50 snapshot and records source-only MICrONS subcellular routes", async () => {
  const parent = await validateResearchIterationManifest250Snapshot();
  const built = await buildResearchIterationManifest251();
  assert.deepEqual(await readFile(manifestPath), built.bytes);
  assert.equal(built.manifest.application.version, "2.51.0-research.1");
  assert.equal(built.manifest.parentIterationManifest.path, SNAPSHOT_250.path);
  assert.equal(built.manifest.parentIterationManifest.releaseId, parent.releaseId);
  assert.equal(built.manifest.integrity.inputCount, SNAPSHOT_250.inputCount + INPUTS_251.length);
  for (const [id, path] of INPUTS_251) assert.ok(built.manifest.authoritativeInputs.some((input) => input.id === id && input.path === path));
  const audit = built.manifest.exactReferences.micronsSubcellularSourceAudit251;
  assert.equal(audit.targetRootId, "648518346349516051");
  assert.equal(audit.synapseTableDepositVersion, "185.3");
  assert.equal(audit.targetCellRelease, "v185.4");
  assert.equal(audit.fullTableDownloaded, false);
  assert.equal(audit.synapsePointCount, 0);
  assert.equal(audit.mitochondriaObjectCount, 0);
  assert.equal((await validateResearchIterationManifest251()).inputCount, SNAPSHOT_250.inputCount + INPUTS_251.length);
});

test("recomputed manifest hashes cannot promote a candidate subcellular route into admitted cell evidence", async () => {
  const { manifest } = await buildResearchIterationManifest251();
  const changed = structuredClone(manifest);
  changed.exactReferences.micronsSubcellularSourceAudit251.synapsePointCount = 1;
  changed.manifestContentSha256 = computeManifestContentSha256(changed);
  await assert.rejects(validateResearchIterationManifest251(changed), /differ from verified rebuild/);
});
