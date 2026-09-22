import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createResearchMvpValidator, formatSchemaErrors } from "./validate-json-schema.mjs";

const CONTRACT_URL = new URL("../data/curator-feedback-contract-0.8.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/curator-feedback-contract-0.8.schema.json", import.meta.url);

export async function validateCuratorFeedbackContract(contract) {
  const schema = JSON.parse(await readFile(SCHEMA_URL, "utf8"));
  const validate = createResearchMvpValidator(schema);
  if (!validate(contract)) throw new Error("Curator feedback contract validation failed:\n" + formatSchemaErrors(validate.errors).map((item) => "- " + item).join("\n"));
  const responseKeys = new Set([...contract.requiredResponseKeys, ...contract.optionalResponseKeys]);
  if (responseKeys.size !== contract.requiredResponseKeys.length + contract.optionalResponseKeys.length) {
    throw new Error("Curator feedback contract validation failed:\n- response keys must be unique across required and optional sets");
  }
  for (const key of ["curator_id", "overall_verdict", "attestation"]) {
    if (!contract.requiredResponseKeys.includes(key)) throw new Error("Curator feedback contract validation failed:\n- required response key is missing: " + key);
  }
  return { distributionVersion: contract.distributionVersion, requiredResponseKeyCount: contract.requiredResponseKeys.length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL("file://" + process.argv[1]))) {
  const contract = JSON.parse(await readFile(CONTRACT_URL, "utf8"));
  const report = await validateCuratorFeedbackContract(contract);
  console.log("Curator feedback contract validation passed: " + report.distributionVersion + " (" + report.requiredResponseKeyCount + " required responses)");
}
