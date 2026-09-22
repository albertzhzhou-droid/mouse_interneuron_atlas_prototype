import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest231Snapshot } from "../scripts/validate-research-iteration-manifest-2.31-snapshot.mjs";

const manifest = JSON.parse(
  await readFile(
    new URL("../data/research-iteration-manifest-2.31.json", import.meta.url),
    "utf8",
  ),
);
const activeManifest = JSON.parse(
  await readFile(
    new URL("../data/research-iteration-manifest-2.32.json", import.meta.url),
    "utf8",
  ),
);

function withRecomputedContentHash(mutator) {
  const mutated = structuredClone(manifest);
  mutator(mutated);
  mutated.manifestContentSha256 = computeManifestContentSha256(mutated);
  return mutated;
}

test("validates immutable 2.31 without rebuilding it from live 2.32 inputs", async () => {
  assert.deepEqual(await validateResearchIterationManifest231Snapshot(), {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.31.0",
    fileBytes: 87120,
    fileSha256: "49ef49fdaaf8e72976d01e7a6d3053d40735215c39bf890100ab464d7ac67996",
    contentSha256: "c714ba7ac7f306987b0344899c20381eda6a568d57b222773746839c687a0fd4",
    inputCount: 46,
    researchExplorerRecordCount: 413,
    sourceFileCount: 16,
    frozenCensusRecordCount: 142,
    supplementaryRecordCount: 7,
    viewableMorphologyRecordCount: 149,
    admittedMainSceneExactTargetCount: 13,
    sourceSpecificViewerOnlyCount: 136,
    nonMorphologyClearCount: 264,
    gapCount: 3634,
    fallbackGeometryCount: 0,
    substituteGeometryCount: 0,
    researchUpgradeCount: 144,
  });
});

test("keeps the historical resolver receipt while 2.32 pins the superseding live file", () => {
  const historical = manifest.authoritativeInputs.find((input) => input.id === "researchVisualTargetResolver");
  const active = activeManifest.authoritativeInputs.find((input) => input.id === "researchVisualTargetResolver");
  assert.deepEqual(historical, {
    id: "researchVisualTargetResolver",
    scope: "project",
    path: "app/research-visual-target.js",
    purpose: "Fail-closed research-focus to exact visual-target resolver",
    bytes: 4588,
    sha256: "21d20d86a7c687098f8f909c8b4b9b7737267163a9e4e84aacf15b74b48930a3",
  });
  assert.equal(active?.path, historical.path);
  assert.notEqual(active?.sha256, historical.sha256);
});

test("rejects release, input-denominator and parent-receipt mutations", async () => {
  const releaseMutation = withRecomputedContentHash((value) => {
    value.application.version = "2.32.0-research.1";
  });
  await assert.rejects(
    () => validateResearchIterationManifest231Snapshot(releaseMutation),
    /content receipt|release identity|schema/,
  );

  const inputMutation = withRecomputedContentHash((value) => {
    value.integrity.inputCount = 47;
  });
  await assert.rejects(
    () => validateResearchIterationManifest231Snapshot(inputMutation),
    /content receipt|input denominator|schema/,
  );

  const parentMutation = withRecomputedContentHash((value) => {
    value.parentIterationManifest.fileSha256 = "0".repeat(64);
  });
  await assert.rejects(
    () => validateResearchIterationManifest231Snapshot(parentMutation),
    /content receipt|parent receipt|schema/,
  );
});

test("rejects Explorer, morphology and visual-disposition mutations", async () => {
  const recordMutation = withRecomputedContentHash((value) => {
    value.exactReferences.researchExplorerVisualIntegrity.recordCount = 412;
  });
  await assert.rejects(
    () => validateResearchIterationManifest231Snapshot(recordMutation),
    /content receipt|Research Explorer|schema/,
  );

  const morphologyMutation = withRecomputedContentHash((value) => {
    value.exactReferences.researchExplorerVisualIntegrity.combinedCensusClaim = true;
  });
  await assert.rejects(
    () => validateResearchIterationManifest231Snapshot(morphologyMutation),
    /content receipt|combined census|Research Explorer|schema/,
  );

  const dispositionMutation = withRecomputedContentHash((value) => {
    value.exactReferences.researchExplorerVisualIntegrity.sourceSpecificViewerOnlyCount = 135;
  });
  await assert.rejects(
    () => validateResearchIterationManifest231Snapshot(dispositionMutation),
    /content receipt|visual-target|Research Explorer|schema/,
  );
});

test("rejects missingness and unsupported-geometry zero-claim mutations", async () => {
  const gapMutation = withRecomputedContentHash((value) => {
    value.exactReferences.researchExplorerVisualIntegrity.gapCount = 3633;
  });
  await assert.rejects(
    () => validateResearchIterationManifest231Snapshot(gapMutation),
    /content receipt|missingness|Research Explorer|schema/,
  );

  for (const field of [
    "fallbackGeometryCount",
    "sameSpecimenInternalStructureCount",
    "atlasTransformCount",
    "registrationCount",
  ]) {
    const mutation = withRecomputedContentHash((value) => {
      value.exactReferences.researchExplorerVisualIntegrity[field] = 1;
    });
    await assert.rejects(
      () => validateResearchIterationManifest231Snapshot(mutation),
      /content receipt|zero-claim|Research Explorer|schema/,
    );
  }
});

test("rejects registry and registration-denominator mutations", async () => {
  const upgradeMutation = withRecomputedContentHash((value) => {
    value.registrySummary.researchUpgradeCount = 145;
  });
  await assert.rejects(
    () => validateResearchIterationManifest231Snapshot(upgradeMutation),
    /content receipt|upgrade denominator|schema/,
  );

  const registrationMutation = withRecomputedContentHash((value) => {
    value.registrations.count = 1;
  });
  await assert.rejects(
    () => validateResearchIterationManifest231Snapshot(registrationMutation),
    /content receipt|registration zero-claim|schema/,
  );
});
