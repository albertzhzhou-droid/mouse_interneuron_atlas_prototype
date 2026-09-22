import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createResearchMvpValidator, formatSchemaErrors } from "./validate-json-schema.mjs";

const PREFLIGHT_URL = new URL("../data/file-admission-preflight-0.6.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/public-file-admission-preflight-0.6.schema.json", import.meta.url);

export async function validatePublicFileAdmissionPreflight(preflight) {
  const schema = JSON.parse(await readFile(SCHEMA_URL, "utf8"));
  const validate = createResearchMvpValidator(schema);
  if (!validate(preflight)) throw new Error("File-admission preflight validation failed:\n" + formatSchemaErrors(validate.errors).map((item) => "- " + item).join("\n"));
  const rejectionText = preflight.rejectionRules.join(" ");
  if (!["SHA-256", "rights", "coordinate", "registered"].every((term) => new RegExp(term, "i").test(rejectionText))) {
    throw new Error("File-admission preflight validation failed:\n- rejection rules must preserve checksum, rights, coordinate and registration boundaries");
  }
  return { preflightId: preflight.preflightId, candidateFilesAccepted: preflight.candidateFilesAccepted };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL("file://" + process.argv[1]))) {
  const preflight = JSON.parse(await readFile(PREFLIGHT_URL, "utf8"));
  const report = await validatePublicFileAdmissionPreflight(preflight);
  console.log("File-admission preflight validation passed: " + report.preflightId + " (" + report.candidateFilesAccepted + " accepted files)");
}
