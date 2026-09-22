import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const RELEASE_URL = new URL("../data/research-mvp-release-0.2.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/research-mvp-release.schema.json", import.meta.url);

export function createResearchMvpValidator(schema) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  return ajv.compile(schema);
}

export function formatSchemaErrors(errors = []) {
  return (errors ?? []).map((error) => {
    const location = error.instancePath || "/";
    return `${location}: ${error.message ?? "schema violation"}`;
  });
}

export async function validateResearchMvpSchema() {
  const [release, schema] = await Promise.all([
    readFile(RELEASE_URL, "utf8").then(JSON.parse),
    readFile(SCHEMA_URL, "utf8").then(JSON.parse),
  ]);
  const validate = createResearchMvpValidator(schema);
  if (!validate(release)) {
    const details = formatSchemaErrors(validate.errors);
    throw new Error(`Research MVP JSON Schema validation failed:\n${details.map((item) => `- ${item}`).join("\n")}`);
  }
  return { releaseId: release.releaseId, schemaVersion: release.schemaVersion };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file://${process.argv[1]}`))) {
  try {
    const result = await validateResearchMvpSchema();
    console.log(`Research MVP JSON Schema validation passed: ${result.releaseId} (schema ${result.schemaVersion})`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
