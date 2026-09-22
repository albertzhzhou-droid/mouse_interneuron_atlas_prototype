import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createResearchMvpValidator, formatSchemaErrors } from "../scripts/validate-json-schema.mjs";

const [release, schema] = await Promise.all([
  readFile(new URL("../data/research-mvp-release-0.2.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../schemas/research-mvp-release.schema.json", import.meta.url), "utf8").then(JSON.parse),
]);

test("executes the Draft 2020-12 schema against release 0.2", () => {
  const validate = createResearchMvpValidator(schema);
  assert.equal(validate(release), true, formatSchemaErrors(validate.errors).join("\n"));
});

test("schema rejects a raw null and an undeclared field", () => {
  const invalid = structuredClone(release);
  invalid.conditions[0].sampleSize = null;
  invalid.conditions[0].inventedEffectSize = 42;
  const validate = createResearchMvpValidator(schema);
  assert.equal(validate(invalid), false);
  const errors = formatSchemaErrors(validate.errors).join("\n");
  assert.match(errors, /additional properties/);
  assert.match(errors, /sampleSize/);
});

test("standalone schema validator passes", () => {
  const result = spawnSync(process.execPath, [new URL("../scripts/validate-json-schema.mjs", import.meta.url).pathname], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /JSON Schema validation passed/);
});
