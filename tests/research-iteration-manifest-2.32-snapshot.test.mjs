import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest232Snapshot } from "../scripts/validate-research-iteration-manifest-2.32-snapshot.mjs";

const manifest = JSON.parse(await readFile(
  new URL("../data/research-iteration-manifest-2.32.json", import.meta.url),
  "utf8",
));
const activeClippingContract = JSON.parse(await readFile(
  new URL("../data/microns-source-native-clipping-0.1.json", import.meta.url),
  "utf8",
));

function withRecomputedContentHash(mutator) {
  const mutated = structuredClone(manifest);
  mutator(mutated);
  mutated.manifestContentSha256 = computeManifestContentSha256(mutated);
  return mutated;
}

test("validates immutable 2.32 without rebuilding it from live 2.33 inputs", async () => {
  assert.deepEqual(await validateResearchIterationManifest232Snapshot(), {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.32.0",
    fileBytes: 98357,
    fileSha256: "eaacd5bb0acae3c704e24ac2c1ffa4ef508bc5491155898bec6f28a825ea5e77",
    contentSha256: "4b0ed4508655553736b656f7a72a6d2e869218e0a4eff886811c7f0f15e113a2",
    inputCount: 63,
    researchUpgradeCount: 148,
    indexedMolecularProfileCount: 161,
    frozenCensusRecordCount: 142,
    supplementaryRecordCount: 7,
    morphologyTopologyRecordCount: 149,
    totalNodeCount: 566511,
    totalTerminalLandmarkCount: 6957,
    totalBifurcationLandmarkCount: 6223,
    nonSciActiveEntityCount: 0,
    admittedMolecularGeometryPrimitiveCount: 0,
  });
});

test("keeps clipping out of the historical 2.32 authoritative roster", () => {
  assert.equal(activeClippingContract.upgradeId, "UPG-166");
  assert.equal(manifest.authoritativeInputs.some((input) => input.path === "data/microns-source-native-clipping-0.1.json"), false);
  assert.equal(manifest.exactReferences.micronsClippingAndSourceRecordDeltaIntegrity, undefined);
});

test("rejects release, input-denominator and parent-receipt mutations", async () => {
  for (const mutation of [
    withRecomputedContentHash((value) => { value.application.version = "2.33.0-research.1"; }),
    withRecomputedContentHash((value) => { value.integrity.inputCount = 64; }),
    withRecomputedContentHash((value) => { value.parentIterationManifest.fileSha256 = "0".repeat(64); }),
  ]) {
    await assert.rejects(
      () => validateResearchIterationManifest232Snapshot(mutation),
      /content receipt|release identity|input denominator|parent receipt|schema/i,
    );
  }
});

test("rejects focus, molecular fingerprint and topology mutations", async () => {
  const cases = [
    withRecomputedContentHash((value) => {
      value.exactReferences.uiKnowledgeAndTopologyIntegrity.focusSynchronization.nonSciActiveEntityCount = 1;
    }),
    withRecomputedContentHash((value) => {
      value.exactReferences.uiKnowledgeAndTopologyIntegrity.molecularEvidenceFingerprint.exactDemonstrationRecords.i2.sampledNucleusCount = 1520;
    }),
    withRecomputedContentHash((value) => {
      value.exactReferences.uiKnowledgeAndTopologyIntegrity.morphologyTopologyDetail.totalTerminalLandmarkCount = 6956;
    }),
  ];
  for (const mutation of cases) {
    await assert.rejects(
      () => validateResearchIterationManifest232Snapshot(mutation),
      /content receipt|focus|fingerprint|topology|schema/i,
    );
  }
});

test("rejects internal, identity, registration and upgrade mutations", async () => {
  for (const field of ["internalStructureModelCount", "crossSourceIdentityCount", "registrationCount"]) {
    const mutation = withRecomputedContentHash((value) => {
      value.exactReferences.uiKnowledgeAndTopologyIntegrity.morphologyTopologyDetail[field] = 1;
    });
    await assert.rejects(
      () => validateResearchIterationManifest232Snapshot(mutation),
      /content receipt|must remain zero|topology|schema/i,
    );
  }
  const upgradeMutation = withRecomputedContentHash((value) => {
    value.registrySummary.researchUpgradeCount = 149;
  });
  await assert.rejects(
    () => validateResearchIterationManifest232Snapshot(upgradeMutation),
    /content receipt|registry|schema/i,
  );
});
