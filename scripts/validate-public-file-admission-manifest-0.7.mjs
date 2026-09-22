import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createResearchMvpValidator, formatSchemaErrors } from "./validate-json-schema.mjs";

const SCHEMA_URL = new URL("../schemas/public-file-admission-manifest-0.7.schema.json", import.meta.url);

export async function validatePublicFileAdmissionManifest07(manifest) {
  const schema = JSON.parse(await readFile(SCHEMA_URL, "utf8"));
  const validate = createResearchMvpValidator(schema);
  if (!validate(manifest)) throw new Error("File-admission manifest 0.7 validation failed:\n" + formatSchemaErrors(validate.errors).map((item) => "- " + item).join("\n"));
  for (const file of manifest.files) {
    const coordinates = file.coordinates;
    if (!(coordinates.unit && coordinates.axisOrder && coordinates.origin) && !coordinates.missingReason) {
      throw new Error("File-admission manifest 0.7 validation failed:\n- " + file.id + ": incomplete coordinates require missingReason");
    }
    if (file.sourceChecksum.algorithm === "sha1" && file.localSha256 !== null) {
      throw new Error("File-admission manifest 0.7 validation failed:\n- " + file.id + ": source SHA-1 cannot be relabeled as local SHA-256");
    }
  }
  return { manifestId: manifest.manifestId, fileCount: manifest.files.length, algorithms: [...new Set(manifest.files.map((file) => file.sourceChecksum.algorithm))] };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL("file://" + process.argv[1]))) {
  const input = process.argv[2];
  if (!input) throw new Error("usage: node scripts/validate-public-file-admission-manifest-0.7.mjs <manifest.json>");
  const manifest = JSON.parse(await readFile(input, "utf8"));
  const report = await validatePublicFileAdmissionManifest07(manifest);
  console.log("File-admission manifest 0.7 validation passed: " + report.manifestId + " (" + report.fileCount + " metadata-only files)");
}
