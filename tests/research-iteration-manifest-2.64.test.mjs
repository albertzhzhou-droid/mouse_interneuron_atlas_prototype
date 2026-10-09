import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest264 } from "../scripts/validate-research-iteration-manifest-2.64.mjs";

test("2.64 seals a species-separated Svara article comparator without admitting source-package geometry", async () => {
  const result = await validateResearchIterationManifest264();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.64.0");
  assert.equal(result.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.63.0");
  assert.equal(result.species, "Danio rerio");
  assert.equal(result.specimenCount, 1);
  assert.equal(result.listedSupplementPackageCount, 3);
  assert.equal(result.admittedNeuronObjects, 0);
  assert.equal(result.admittedGeometryCount, 0);
  assert.equal(result.downloadedPayloadBytes, 0);
  assert.equal(result.fullProjectCopyCount, 0);
});

test("2.64 refuses inferred package metadata, mouse transfer, geometry, or payload", async () => {
  await validateResearchIterationManifest264();
  const manifest = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.64.json", import.meta.url), "utf8"));
  for (const mutate of [
    (value) => { value.exactReferences.svaraLarvalZebrafishSpinalSbemReference264.supplementChecksumsKnown = true; },
    (value) => { value.exactReferences.svaraLarvalZebrafishSpinalSbemReference264.admittedSkeletons = 1; },
    (value) => { value.exactReferences.svaraLarvalZebrafishSpinalSbemReference264.mouseIdentityTransferAllowed = true; },
    (value) => { value.exactReferences.svaraLarvalZebrafishSpinalSbemReference264.downloadedPayloadBytes = 1; },
    (value) => { value.exactReferences.iteration264Layout.fullProjectCopyCount = 1; },
  ]) {
    const changed = structuredClone(manifest);
    mutate(changed);
    changed.manifestContentSha256 = computeManifestContentSha256(changed);
    await assert.rejects(validateResearchIterationManifest264(changed));
  }
});
