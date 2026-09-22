import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createResearchMvpValidator, formatSchemaErrors } from "./validate-json-schema.mjs";

const PREFLIGHT_URL = new URL("../data/file-admission-preflight-0.8.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/public-file-admission-preflight-0.8.schema.json", import.meta.url);

export async function validatePublicFileAdmissionPreflight08(preflight) {
  const schema = JSON.parse(await readFile(SCHEMA_URL, "utf8"));
  const validate = createResearchMvpValidator(schema);
  if (!validate(preflight)) throw new Error("File-admission preflight 0.8 validation failed:\n" + formatSchemaErrors(validate.errors).map((item) => "- " + item).join("\n"));
  const rules = preflight.rejectionRules.join(" ");
  if (!["specimen", "source frame", "preprint", "local SHA-256", "registered"].every((term) => new RegExp(term, "i").test(rules))) {
    throw new Error("File-admission preflight 0.8 validation failed:\n- rejection rules must retain specimen, frame, preprint, local-hash and registration boundaries");
  }
  return { preflightId: preflight.preflightId, candidateFilesAccepted: preflight.candidateFilesAccepted };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL("file://" + process.argv[1]))) {
  const report = await validatePublicFileAdmissionPreflight08(JSON.parse(await readFile(PREFLIGHT_URL, "utf8")));
  console.log("File-admission preflight 0.8 validation passed: " + report.preflightId + " (" + report.candidateFilesAccepted + " accepted files)");
}
