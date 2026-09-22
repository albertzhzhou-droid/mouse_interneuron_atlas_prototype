import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest234Snapshot } from "../scripts/validate-research-iteration-manifest-2.34-snapshot.mjs";

const manifest = JSON.parse(await readFile(
  new URL("../data/research-iteration-manifest-2.34.json", import.meta.url),
  "utf8",
));

function mutated(mutator) {
  const value = structuredClone(manifest);
  mutator(value);
  value.manifestContentSha256 = computeManifestContentSha256(value);
  return value;
}

test("validates immutable 2.34 without rebuilding it from live 2.35 inputs", async () => {
  assert.deepEqual(await validateResearchIterationManifest234Snapshot(), {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.34.0",
    fileBytes: 125197,
    fileSha256: "76ead4e29455c8e9250f294afa4e78b6a72bb76709115d15954564545bb43d1e",
    contentSha256: "266ee889a591368d30b655ee059659485e746df424f448a85a6819d28e3e920c",
    inputCount: 102,
    researchUpgradeCount: 155,
    canonicalSourcePackageCount: 24,
    canonicalRecordSetCount: 28,
    admittedSourceObjectCount: 1097,
    existingGeometryReferenceCount: 149,
    deltaRawSwcCount: 948,
    generatedGeometryCopyCount: 0,
    registrationCount: 0,
  });
});

test("keeps the Crozat PKD2L1 source profile out of the historical 2.34 roster", () => {
  assert.equal(manifest.authoritativeInputs.some((input) => input.path.includes("crozat-pkd2l1")), false);
  assert.equal(manifest.exactReferences.crozatPkd2l1FunctionalProfileIntegrity, undefined);
  assert.equal(manifest.registrySummary.canonicalSourcePackageCount, 24);
  assert.equal(manifest.registrySummary.canonicalRecordSetCount, 28);
});

test("rejects release, parent, roster and upgrade mutations", async () => {
  const cases = [
    mutated((value) => { value.application.version = "2.35.0-research.1"; }),
    mutated((value) => { value.parentIterationManifest.fileSha256 = "0".repeat(64); }),
    mutated((value) => { value.integrity.inputCount = 103; }),
    mutated((value) => { value.registrySummary.researchUpgradeCount = 158; }),
  ];
  for (const value of cases) {
    await assert.rejects(
      () => validateResearchIterationManifest234Snapshot(value),
      /content receipt|release identity|parent receipt|input denominator|registry|schema/i,
    );
  }
});

test("rejects universe identity, geometry and registration mutations", async () => {
  const cases = [
    mutated((value) => { value.exactReferences.neuromorphoNoAgeQueryUniverseIntegrity.queryRecordCount = 1096; }),
    mutated((value) => { value.exactReferences.neuromorphoNoAgeQueryUniverseIntegrity.generatedGeometryCopyCount = 1; }),
    mutated((value) => { value.exactReferences.neuromorphoNoAgeQueryUniverseIntegrity.crossSourceIdentityCount = 1; }),
    mutated((value) => { value.registrations.count = 1; }),
  ];
  for (const value of cases) {
    await assert.rejects(
      () => validateResearchIterationManifest234Snapshot(value),
      /content receipt|universe|zero|registration|schema/i,
    );
  }
});
