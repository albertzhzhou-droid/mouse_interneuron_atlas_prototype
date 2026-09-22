import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest228Snapshot } from "../scripts/validate-research-iteration-manifest-2.28-snapshot.mjs";

const manifest = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.28.json", import.meta.url), "utf8"));

test("validates immutable 2.28 without rebuilding it from live 2.29 inputs", async () => {
  assert.deepEqual(await validateResearchIterationManifest228Snapshot(), {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.28.0",
    fileBytes: 69092,
    fileSha256: "f599acbd6969ba082014b258c098e648014116dc736535265bc7d5c154110b8e",
    contentSha256: "af376ba79d00132582448ab7217ca03c2e4af18efc5f0ca9720acef231f9b173",
    inputCount: 34,
    frozenCensusRecordCount: 142,
    activeUniqueMorphologyCount: 13,
    namedRouteCount: 10,
    representationRouteCount: 16,
    researchUpgradeCount: 131,
    registrationCount: 0,
  });
});

test("rejects mutation of the frozen census and zero-registration boundaries", async () => {
  const censusMutation = structuredClone(manifest);
  censusMutation.exactReferences.premotorComparisonObservedMorphologyRoutePack.frozenCensusRecordCount = 149;
  censusMutation.manifestContentSha256 = computeManifestContentSha256(censusMutation);
  await assert.rejects(() => validateResearchIterationManifest228Snapshot(censusMutation), /content receipt drifted|census/);

  const registrationMutation = structuredClone(manifest);
  registrationMutation.registrations.count = 1;
  registrationMutation.registrations.records.push({ invented: true });
  registrationMutation.manifestContentSha256 = computeManifestContentSha256(registrationMutation);
  await assert.rejects(() => validateResearchIterationManifest228Snapshot(registrationMutation), /content receipt drifted|registration/);
});

