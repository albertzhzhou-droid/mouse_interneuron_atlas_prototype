import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { validateTrevisanV1AgeAtlasReference01 } from "../scripts/validate-trevisan-v1-age-atlas-reference-0.1.mjs";

const [reference, schema, component, atlas] = await Promise.all([
  readFile(new URL("../data/trevisan-v1-age-atlas-reference-0.1.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../schemas/trevisan-v1-age-atlas-reference-0.1.schema.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../app/TrevisanV1AgeAtlas.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/InterneuronTypeAtlas.tsx", import.meta.url), "utf8"),
]);

test("records the article-level V1 age atlas separately from the canonical 387-profile denominator", async () => {
  const result = await validateTrevisanV1AgeAtlasReference01();
  assert.equal(result.selectedNucleusCount, 89494);
  assert.equal(result.reportedClusterCount, 14);
  assert.equal(result.ageCount, 4);
  assert.equal(result.exactPerClusterCountsImported, false);
  assert.equal(result.canonicalSourceProfileContribution, 0);
  assert.equal(result.morphologyGeometryObjectCount, 0);
  assert.equal(result.internalStructureObjectCount, 0);
  assert.deepEqual(reference.clusters.map((cluster) => cluster.clusterId), Array.from({ length: 14 }, (_, index) => index));
});

test("strict schema and evidence checks reject identity, count, and geometry drift", async () => {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  assert.equal(validate(reference), true, JSON.stringify(validate.errors));
  const extra = structuredClone(reference);
  extra.clusters[0].unreviewedIdentity = true;
  assert.equal(validate(extra), false);
  for (const mutate of [
    (value) => { value.clusters[5].sourceAssignment = "Pou6f2 clade"; },
    (value) => { value.study.selectedNucleusCount += 1; },
    (value) => { value.study.exactPerClusterCountsImported = true; },
    (value) => { value.admissionBoundary.morphologyGeometryObjectCount = 1; },
    (value) => { value.admissionBoundary.includedInMain3dScene = true; },
  ]) {
    const altered = structuredClone(reference);
    mutate(altered);
    await assert.rejects(validateTrevisanV1AgeAtlasReference01(altered));
  }
});

test("cluster selection remains a source-only dossier and never drives the main 3D selection", () => {
  assert.match(atlas, /<TrevisanV1AgeAtlas\s*\/>/);
  assert.match(component, /aria-pressed=\{selected\.clusterId === cluster\.clusterId\}/);
  assert.match(component, /aria-live="polite"/);
  assert.match(component, /ageCoverageDescription/);
  assert.match(reference.study.ageCoverageDescription, /not longitudinal tracking/i);
  assert.match(component, /not represented in the main 3D scene/i);
  assert.doesNotMatch(component, /onSelectedFocusChange|setSelectedFocusId|SceneCanvas/);
});
