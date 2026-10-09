import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_251, validateResearchIterationManifest251Snapshot } from "../scripts/validate-research-iteration-manifest-2.51-snapshot.mjs";
import { buildResearchIterationManifest252, INPUTS_252 } from "../tools/build_research_iteration_manifest_2_52.mjs";
import { validateResearchIterationManifest252 } from "../scripts/validate-research-iteration-manifest-2.52.mjs";
import { validateSuperClemPalmNativePoints } from "../scripts/validate-superclem-palm-native-points-0.1.mjs";

const manifestPath = new URL("../data/research-iteration-manifest-2.52.json", import.meta.url);

test("2.52 seals the 2.51 parent and receipts every source needed for the PALM point view", async () => {
  const parent = await validateResearchIterationManifest251Snapshot();
  const built = await buildResearchIterationManifest252();
  assert.deepEqual(await readFile(manifestPath), built.bytes);
  assert.equal(built.manifest.application.version, "2.52.0-research.1");
  assert.equal(built.manifest.parentIterationManifest.path, SNAPSHOT_251.path);
  assert.equal(built.manifest.parentIterationManifest.releaseId, parent.releaseId);
  assert.equal(built.manifest.integrity.inputCount, SNAPSHOT_251.inputCount + INPUTS_252.length);
  for (const [id, path] of INPUTS_252) assert.ok(built.manifest.authoritativeInputs.some((input) => input.id === id && input.path === path));
  assert.deepEqual(await validateSuperClemPalmNativePoints().then(({ detectionCount, physicalUnitsEstablished, driftCorrectionEstablished }) => ({ detectionCount, physicalUnitsEstablished, driftCorrectionEstablished })), { detectionCount: 18358, physicalUnitsEstablished: false, driftCorrectionEstablished: false });
  assert.equal(built.manifest.registrySummary.researchUpgradeCount, 206);
  assert.equal(built.manifest.exactReferences.superClemPalmNativePointReference252.selectedCellJoinCount, 0);
  const receipt = await validateResearchIterationManifest252();
  assert.equal(receipt.detectionCount, 18358);
  assert.equal(receipt.physicalUnitsEstablished, false);
});

test("recomputed manifest hashes cannot assign PALM detections to an atlas cell", async () => {
  const { manifest } = await buildResearchIterationManifest252();
  const changed = structuredClone(manifest);
  changed.exactReferences.superClemPalmNativePointReference252.selectedCellJoinCount = 1;
  changed.manifestContentSha256 = computeManifestContentSha256(changed);
  await assert.rejects(validateResearchIterationManifest252(changed), /differ from verified rebuild/);
});
