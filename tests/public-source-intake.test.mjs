import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createResearchMvpValidator, formatSchemaErrors } from "../scripts/validate-json-schema.mjs";
import { validatePublicSourceIntake } from "../scripts/validate-public-source-intake.mjs";

const [intake, schema] = await Promise.all([
  readFile(new URL("../data/public-source-intakes/spinalj-processed-metadata-audit-0.4.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../schemas/public-source-intake.schema.json", import.meta.url), "utf8").then(JSON.parse),
]);

test("validates the SpinalJ metadata-only public-source intake", async () => {
  const validate = createResearchMvpValidator(schema);
  assert.equal(validate(intake), true, formatSchemaErrors(validate.errors).join("\n"));
  const report = await validatePublicSourceIntake();
  assert.equal(report.sourceId, "PDS-SPINALJ-PROCESSED");
  assert.equal(report.evidenceRecordCount, 3);
  assert.equal(report.reportedFactCount, 6);
});

test("cannot turn a metadata audit into a downloaded, bundled or registered source", () => {
  const invalid = structuredClone(intake);
  invalid.acquisition.status = "downloaded";
  invalid.acquisition.fileHashes = ["a".repeat(64)];
  invalid.coordinates.projectRegistrationStatus = "registered";
  const validate = createResearchMvpValidator(schema);
  assert.equal(validate(invalid), false);
  assert.match(formatSchemaErrors(validate.errors).join("\n"), /status|fileHashes|projectRegistrationStatus/);
});

test("links each reported fact to a public evidence record", () => {
  const recordIds = new Set(intake.publicSourceEvidence.records.map((record) => record.id));
  for (const fact of intake.publicSourceEvidence.reportedFacts) {
    assert.ok(recordIds.has(fact.evidenceRecordId), fact.id + ": no public evidence record");
  }
  assert.equal(intake.acquisition.bundledAssetCount, 0);
  assert.equal(intake.coordinates.projectRegistrationCount, 0);
});

test("standalone public-source intake validator passes", () => {
  const result = spawnSync(process.execPath, [new URL("../scripts/validate-public-source-intake.mjs", import.meta.url).pathname], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /0 downloaded files, 0 registrations/);
});
