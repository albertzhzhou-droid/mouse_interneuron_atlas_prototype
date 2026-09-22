import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createResearchMvpValidator, formatSchemaErrors } from "./validate-json-schema.mjs";

const SCHEMA_URL = new URL("../schemas/public-file-admission-manifest.schema.json", import.meta.url);

export async function validatePublicFileAdmissionManifest(manifest) {
  const schema = JSON.parse(await readFile(SCHEMA_URL, "utf8"));
  const validate = createResearchMvpValidator(schema);
  if (!validate(manifest)) throw new Error("File-admission manifest validation failed:\n" + formatSchemaErrors(validate.errors).map((item) => "- " + item).join("\n"));
  for (const file of manifest.files) {
    const coordinates = file.coordinates;
    const complete = coordinates.unit && coordinates.axisOrder && coordinates.origin;
    if (!complete && !coordinates.missingReason) throw new Error("File-admission manifest validation failed:\n- " + file.id + ": incomplete coordinates require missingReason");
  }
  return { manifestId: manifest.manifestId, fileCount: manifest.files.length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL("file://" + process.argv[1]))) {
  const input = process.argv[2];
  if (!input) throw new Error("usage: node scripts/validate-public-file-admission-manifest.mjs <manifest.json>");
  const manifest = JSON.parse(await readFile(input, "utf8"));
  const report = await validatePublicFileAdmissionManifest(manifest);
  console.log("File-admission manifest validation passed: " + report.manifestId + " (" + report.fileCount + " metadata-only files)");
}
