import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest233Snapshot } from "../scripts/validate-research-iteration-manifest-2.33-snapshot.mjs";

const manifest = JSON.parse(await readFile(
  new URL("../data/research-iteration-manifest-2.33.json", import.meta.url),
  "utf8",
));

function mutated(mutator) {
  const value = structuredClone(manifest);
  mutator(value);
  value.manifestContentSha256 = computeManifestContentSha256(value);
  return value;
}

test("validates immutable 2.33 without rebuilding it from live 2.34 inputs", async () => {
  assert.deepEqual(await validateResearchIterationManifest233Snapshot(), {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.33.0",
    fileBytes: 109358,
    fileSha256: "6b2c1571c8dccf5aeced3518435dfe4bf0bff4c605f9a9255524299d72dda081",
    contentSha256: "1b4632ea19ea00b27422408bf96d4dabe39e7e23330d6511fe4b6ccdafa6752f",
    inputCount: 75,
    researchUpgradeCount: 151,
    clippingCellRootId: "648518346349516051",
    clippingLinkedNucleusId: "4309",
    sourceRecordDeltaUiWhitelistedRowCount: 24,
    sourceRecordDeltaDemonstrationChangedRowCount: 3,
    crossSourceSameCellIdentityCount: 0,
    generatedGeometryCount: 0,
    registrationCount: 0,
  });
});

test("keeps the no-age query universe out of the historical 2.33 roster", () => {
  assert.equal(manifest.authoritativeInputs.some((input) => input.path === "data/neuromorpho-no-age-query-universe-0.1.json"), false);
  assert.equal(manifest.authoritativeInputs.some((input) => input.path.includes("no_age_universe_v1")), false);
  assert.equal(manifest.exactReferences.neuromorphoNoAgeQueryUniverseIntegrity, undefined);
});

test("rejects release, parent, roster and upgrade mutations", async () => {
  const cases = [
    mutated((value) => { value.application.version = "2.34.0-research.1"; }),
    mutated((value) => { value.parentIterationManifest.fileSha256 = "0".repeat(64); }),
    mutated((value) => { value.integrity.inputCount = 76; }),
    mutated((value) => { value.registrySummary.researchUpgradeCount = 155; }),
  ];
  for (const value of cases) {
    await assert.rejects(
      () => validateResearchIterationManifest233Snapshot(value),
      /content receipt|release identity|parent receipt|input denominator|registry|schema/i,
    );
  }
});

test("rejects clipping, delta identity, geometry and registration mutations", async () => {
  const cases = [
    mutated((value) => { value.exactReferences.micronsClippingAndSourceRecordDeltaIntegrity.micronsSourceNativeClipping.sourceLinkedNucleusId = "4310"; }),
    mutated((value) => { value.exactReferences.micronsClippingAndSourceRecordDeltaIntegrity.micronsSourceNativeClipping.generatedGeometryCount = 1; }),
    mutated((value) => { value.exactReferences.micronsClippingAndSourceRecordDeltaIntegrity.sourceRecordDelta.crossSourceSameCellIdentityCount = 1; }),
    mutated((value) => { value.exactReferences.micronsClippingAndSourceRecordDeltaIntegrity.sourceRecordDelta.registrationCount = 1; }),
  ];
  for (const value of cases) {
    await assert.rejects(
      () => validateResearchIterationManifest233Snapshot(value),
      /content receipt|clipping|delta|zero|schema/i,
    );
  }
});
