import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateMicroStructFormerUltrastructureReference } from "../scripts/validate-microstructformer-ultrastructure-reference-0.1.mjs";

test("MicroStructFormer contract pins paired 2D image-mask scope without cell geometry", async () => {
  const result = await validateMicroStructFormerUltrastructureReference();
  assert.equal(result.rowCount, 540);
  assert.deepEqual(result.splitCounts, { train: 528, validation: 12 });
  assert.deepEqual(result.previewDimensionsPixel, [3964, 3964]);
  assert.equal(result.labelCount, 5);
  assert.equal(result.identifiedInterneuronCount, 0);
  assert.equal(result.admittedInternalGeometryCount, 0);
  assert.equal(result.downloadedPayloadBytes, 0);
});

test("MicroStructFormer contract rejects misjoined, extruded, or bundled geometry", async () => {
  const base = JSON.parse(await readFile(new URL("../data/microstructformer-ultrastructure-reference-0.1.json", import.meta.url), "utf8"));
  for (const mutate of [
    (value) => { value.datasetRelease.splitCounts.validation = 11; },
    (value) => { value.datasetRelease.reportedRepositorySize = "5.68 GB"; },
    (value) => { value.identityAndGeometryBoundary.sameCellJoinCount = 1; },
    (value) => { value.identityAndGeometryBoundary.crossSectionStackingAllowed = true; },
    (value) => { value.identityAndGeometryBoundary.predictionAdmittedAsObservation = true; },
    (value) => { value.images = [{ id: "fabricated" }]; },
  ]) {
    const candidate = structuredClone(base);
    mutate(candidate);
    await assert.rejects(validateMicroStructFormerUltrastructureReference(candidate));
  }
});
