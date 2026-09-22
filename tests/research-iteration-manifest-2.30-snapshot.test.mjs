import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest230Snapshot } from "../scripts/validate-research-iteration-manifest-2.30-snapshot.mjs";

const manifest = JSON.parse(
  await readFile(new URL("../data/research-iteration-manifest-2.30.json", import.meta.url), "utf8"),
);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function withRecomputedContentHash(mutator) {
  const mutated = structuredClone(manifest);
  mutator(mutated);
  mutated.manifestContentSha256 = computeManifestContentSha256(mutated);
  return mutated;
}

test("validates immutable 2.30 without rebuilding it from live 2.31 inputs", async () => {
  assert.deepEqual(await validateResearchIterationManifest230Snapshot(), {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.30.0",
    fileBytes: 81964,
    fileSha256: "c8796b7732d2f36998976698f1991f5d70e95fae96b33c20301d4b21d80e5858",
    contentSha256: "c80407736016bf95e0b4dc9d937126e8955628cef4c2485384df835639c3538f",
    inputCount: 42,
    frozenCensusRecordCount: 142,
    supplementaryRecordCount: 7,
    viewableSourceObjectCount: 149,
    geometry3DCount: 147,
    geometry2DCount: 2,
    commonScaleAdmissionCount: 0,
    inferredMissingCoordinateCount: 0,
    repairedCutNeuriteCount: 0,
    restoredInVivoDimensionCount: 0,
    renderedInternalPrimitiveCount: 0,
    crossSourceIdentityCount: 0,
    registrationCount: 0,
    researchUpgradeCount: 140,
  });
});

test("does not compare the historical snapshot with a drifted live upgrade registry", async () => {
  const registryBytes = await readFile(
    new URL("../data/research-model-upgrade-registry-0.1.json", import.meta.url),
  );
  const inputs = new Map(manifest.authoritativeInputs.map((input) => [input.id, input]));
  assert.notEqual(sha256(registryBytes), inputs.get("researchModelUpgradeRegistry").sha256);
  await assert.doesNotReject(() => validateResearchIterationManifest230Snapshot());
});

test("rejects release, input-denominator and parent-receipt mutations", async () => {
  const releaseMutation = withRecomputedContentHash((value) => {
    value.application.version = "2.31.0-research.1";
  });
  await assert.rejects(
    () => validateResearchIterationManifest230Snapshot(releaseMutation),
    /content receipt|release identity|schema/,
  );

  const inputMutation = withRecomputedContentHash((value) => {
    value.integrity.inputCount = 43;
  });
  await assert.rejects(
    () => validateResearchIterationManifest230Snapshot(inputMutation),
    /content receipt|input denominator|schema/,
  );

  const parentMutation = withRecomputedContentHash((value) => {
    value.parentIterationManifest.fileSha256 = "0".repeat(64);
  });
  await assert.rejects(
    () => validateResearchIterationManifest230Snapshot(parentMutation),
    /content receipt|parent receipt|schema/,
  );
});

test("rejects source-object, dimensional-split and combined-census mutations", async () => {
  const sourceObjectMutation = withRecomputedContentHash((value) => {
    value.exactReferences.sourceFrameDisclosure.viewableSourceObjectCount = 150;
  });
  await assert.rejects(
    () => validateResearchIterationManifest230Snapshot(sourceObjectMutation),
    /content receipt|source-frame or dimensional denominator|schema/,
  );

  const dimensionalMutation = withRecomputedContentHash((value) => {
    value.exactReferences.sourceFrameDisclosure.geometry3DCount = 148;
  });
  await assert.rejects(
    () => validateResearchIterationManifest230Snapshot(dimensionalMutation),
    /content receipt|source-frame or dimensional denominator|schema/,
  );

  const combinedCensusMutation = withRecomputedContentHash((value) => {
    value.exactReferences.supplementaryMorphologyComparisonAdapter.combinedCensusClaim = true;
  });
  await assert.rejects(
    () => validateResearchIterationManifest230Snapshot(combinedCensusMutation),
    /content receipt|combined census|schema/,
  );
});

test("rejects common-scale, inferred-coordinate, repair and restoration mutations", async () => {
  for (const field of [
    "commonScaleAdmissionCount",
    "inferredMissingCoordinateCount",
    "repairedCutNeuriteCount",
    "restoredInVivoDimensionCount",
  ]) {
    const mutation = withRecomputedContentHash((value) => {
      value.exactReferences.sourceFrameDisclosure[field] = 1;
    });
    await assert.rejects(
      () => validateResearchIterationManifest230Snapshot(mutation),
      /content receipt|zero-claim|schema/,
    );
  }
});

test("rejects internal, cross-source, registration and upgrade-denominator mutations", async () => {
  const internalMutation = withRecomputedContentHash((value) => {
    value.exactReferences.sourceFrameDisclosure.sameSpecimenInternalStructureCount = 1;
  });
  await assert.rejects(
    () => validateResearchIterationManifest230Snapshot(internalMutation),
    /content receipt|zero-claim|schema/,
  );

  const identityMutation = withRecomputedContentHash((value) => {
    value.registrySummary.crossSourceIdentityCount = 1;
  });
  await assert.rejects(
    () => validateResearchIterationManifest230Snapshot(identityMutation),
    /content receipt|identity or registration zero-claim|schema/,
  );

  const registrationMutation = withRecomputedContentHash((value) => {
    value.registrations.count = 1;
  });
  await assert.rejects(
    () => validateResearchIterationManifest230Snapshot(registrationMutation),
    /content receipt|identity or registration zero-claim|schema/,
  );

  const upgradeMutation = withRecomputedContentHash((value) => {
    value.registrySummary.researchUpgradeCount = 141;
  });
  await assert.rejects(
    () => validateResearchIterationManifest230Snapshot(upgradeMutation),
    /content receipt|upgrade denominator|schema/,
  );
});
