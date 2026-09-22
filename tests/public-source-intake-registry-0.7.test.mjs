import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createResearchMvpValidator, formatSchemaErrors } from "../scripts/validate-json-schema.mjs";
import { validatePublicSourceIntakeRegistry07 } from "../scripts/validate-public-source-intake-registry-0.7.mjs";

const [registry, schema] = await Promise.all([
  readFile(new URL("../data/public-source-intake-registry-0.7.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../schemas/public-source-intake-registry-0.7.schema.json", import.meta.url), "utf8").then(JSON.parse),
]);

test("validates the 0.7 public metadata intake registry", async () => {
  const validate = createResearchMvpValidator(schema);
  assert.equal(validate(registry), true, formatSchemaErrors(validate.errors).join("\n"));
  const report = await validatePublicSourceIntakeRegistry07();
  assert.deepEqual(report, {
    releaseId: "ohri-mouse-interneuron-public-source-intake-registry-0.7.0",
    intakeCount: 3,
    objectInventoryCount: 1,
  });
});

test("keeps Cano-Gomez method evidence source-local, preprint-bounded, and non-registering", () => {
  const cano = registry.records.find((record) => record.sourceId === "PDS-CANOGOMEZ-2026");
  assert.equal(cano.studyStatus, "preprint_resource");
  assert.equal(cano.admission.nextQueueItem, "UPG-002B");
  assert.equal(cano.coordinates.sourceCoordinateAuthority, "AUTHOR_SPACE_OBS");
  assert.equal(cano.coordinates.transformStatus, "method_reported_transform_artifact_and_error_not_file_verified");
  assert.equal(cano.coordinates.projectRegistrationCount, 0);
  assert.equal(cano.acquisition.fileHashes.length, 0);
  assert.equal(cano.acquisition.bundledAssetCount, 0);
  assert.equal(cano.publicSourceEvidence.records.length, 4);
  assert.match(cano.publicSourceEvidence.reportedFacts.find((fact) => fact.id === "PSF-CANO-004").statement, /22 manually defined gray-matter-boundary anchors.*not a project registration/i);
  assert.match(cano.publicSourceEvidence.reportedFacts.find((fact) => fact.id === "PSF-CANO-005").statement, /pinned transform artifact.*held-out error.*BrainGlobe/i);
});

test("rejects a claimed Cano-Gomez project registration or file acquisition", () => {
  const invalid = structuredClone(registry);
  const cano = invalid.records.find((record) => record.sourceId === "PDS-CANOGOMEZ-2026");
  cano.coordinates.projectRegistrationCount = 1;
  cano.acquisition.bundledAssetCount = 1;
  const validate = createResearchMvpValidator(schema);
  assert.equal(validate(invalid), false);
  assert.match(formatSchemaErrors(validate.errors).join("\n"), /projectRegistrationCount|bundledAssetCount/);
});

test("standalone 0.7 intake registry validator passes", () => {
  const result = spawnSync(process.execPath, [new URL("../scripts/validate-public-source-intake-registry-0.7.mjs", import.meta.url).pathname], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /3 metadata-only public intakes; 1 object header inventory; 0 downloaded files; 0 registrations/);
});
