import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest229Snapshot } from "../scripts/validate-research-iteration-manifest-2.29-snapshot.mjs";

const manifest = JSON.parse(
  await readFile(new URL("../data/research-iteration-manifest-2.29.json", import.meta.url), "utf8"),
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

test("validates immutable 2.29 without rebuilding it from live 2.30 inputs", async () => {
  assert.deepEqual(await validateResearchIterationManifest229Snapshot(), {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.29.0",
    fileBytes: 77136,
    fileSha256: "8856ad6413fae98f5f6f9d13cbb0627c8b41b8a9dbaa04ebd9a232689edaeba5",
    contentSha256: "069b1be3a37a8086f89ea4467503235ed0734afcbfd2974538bae528c4995982",
    inputCount: 38,
    frozenCensusRecordCount: 142,
    supplementaryRecordCount: 7,
    viewableSourceObjectCount: 149,
    combinedCensusClaim: false,
    geometryCopyCount: 0,
    commonScaleAdmissionCount: 0,
    renderedInternalPrimitiveCount: 0,
    crossSourceIdentityCount: 0,
    registrationCount: 0,
    researchUpgradeCount: 136,
  });
});

test("does not compare the historical snapshot with drifted live registry or package-lock files", async () => {
  const [registryBytes, packageLockBytes] = await Promise.all([
    readFile(new URL("../data/research-model-upgrade-registry-0.1.json", import.meta.url)),
    readFile(new URL("../package-lock.json", import.meta.url)),
  ]);
  const inputs = new Map(manifest.authoritativeInputs.map((input) => [input.id, input]));
  assert.notEqual(sha256(registryBytes), inputs.get("researchModelUpgradeRegistry").sha256);
  assert.notEqual(sha256(packageLockBytes), inputs.get("packageLock").sha256);
  await assert.doesNotReject(() => validateResearchIterationManifest229Snapshot());
});

test("rejects release, input-denominator and parent-receipt mutations", async () => {
  const releaseMutation = withRecomputedContentHash((value) => {
    value.application.version = "2.30.0-research.1";
  });
  await assert.rejects(
    () => validateResearchIterationManifest229Snapshot(releaseMutation),
    /content receipt|release identity|schema/,
  );

  const inputMutation = withRecomputedContentHash((value) => {
    value.integrity.inputCount = 39;
  });
  await assert.rejects(
    () => validateResearchIterationManifest229Snapshot(inputMutation),
    /content receipt|input denominator|schema/,
  );

  const parentMutation = withRecomputedContentHash((value) => {
    value.parentIterationManifest.fileSha256 = "0".repeat(64);
  });
  await assert.rejects(
    () => validateResearchIterationManifest229Snapshot(parentMutation),
    /content receipt|parent receipt|schema/,
  );
});

test("rejects denominator, combined-census and zero-claim mutations", async () => {
  const denominatorMutation = withRecomputedContentHash((value) => {
    value.exactReferences.supplementaryMorphologyComparisonAdapter.viewableSourceObjectCount = 150;
  });
  await assert.rejects(
    () => validateResearchIterationManifest229Snapshot(denominatorMutation),
    /content receipt|142 census \+ 7 supplementary|schema/,
  );

  const combinedCensusMutation = withRecomputedContentHash((value) => {
    value.exactReferences.supplementaryMorphologyComparisonAdapter.combinedCensusClaim = true;
  });
  await assert.rejects(
    () => validateResearchIterationManifest229Snapshot(combinedCensusMutation),
    /content receipt|combined census|schema/,
  );

  const zeroClaimMutation = withRecomputedContentHash((value) => {
    value.exactReferences.supplementaryMorphologyComparisonAdapter.commonScaleAdmissionCount = 1;
    value.registrySummary.renderedInternalPrimitiveCount = 1;
  });
  await assert.rejects(
    () => validateResearchIterationManifest229Snapshot(zeroClaimMutation),
    /content receipt|zero-claim|schema/,
  );
});

test("rejects an embedded research-upgrade denominator mutation", async () => {
  const mutation = withRecomputedContentHash((value) => {
    value.registrySummary.researchUpgradeCount = 137;
  });
  await assert.rejects(
    () => validateResearchIterationManifest229Snapshot(mutation),
    /content receipt|upgrade denominator|schema/,
  );
});
