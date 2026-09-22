import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createResearchMvpValidator, formatSchemaErrors } from "./validate-json-schema.mjs";

const SCHEMA_URL = new URL("../schemas/public-file-admission-manifest-0.8.schema.json", import.meta.url);

export async function validatePublicFileAdmissionManifest08(manifest) {
  const schema = JSON.parse(await readFile(SCHEMA_URL, "utf8"));
  const validate = createResearchMvpValidator(schema);
  if (!validate(manifest)) throw new Error("File-admission manifest 0.8 validation failed:\n" + formatSchemaErrors(validate.errors).map((item) => "- " + item).join("\n"));
  const specimenIds = new Set();
  for (const specimen of manifest.specimens) {
    if (specimenIds.has(specimen.specimenId)) throw new Error("File-admission manifest 0.8 validation failed:\n- duplicate specimen ID " + specimen.specimenId);
    specimenIds.add(specimen.specimenId);
    const coordinateValues = [specimen.coordinateUnit, specimen.axisOrder, specimen.axisDirection, specimen.coordinateOrigin, specimen.pixelOrVoxelScale];
    if (coordinateValues.some((value) => value === null) && !specimen.missingReason) {
      throw new Error("File-admission manifest 0.8 validation failed:\n- " + specimen.specimenId + ": incomplete specimen coordinate metadata requires missingReason");
    }
    if (specimen.animalId === null && !specimen.missingReason) {
      throw new Error("File-admission manifest 0.8 validation failed:\n- " + specimen.specimenId + ": missing animal ID requires missingReason");
    }
  }
  for (const file of manifest.files) {
    for (const specimenId of file.specimenIds) {
      if (!specimenIds.has(specimenId)) throw new Error("File-admission manifest 0.8 validation failed:\n- " + file.id + ": references undeclared specimen " + specimenId);
    }
    if (file.localSha256 !== null) throw new Error("File-admission manifest 0.8 validation failed:\n- " + file.id + ": local SHA-256 must remain null before acquisition");
  }
  return { manifestId: manifest.manifestId, specimenCount: manifest.specimens.length, fileCount: manifest.files.length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL("file://" + process.argv[1]))) {
  const input = process.argv[2];
  if (!input) throw new Error("usage: node scripts/validate-public-file-admission-manifest-0.8.mjs <manifest.json>");
  const report = await validatePublicFileAdmissionManifest08(JSON.parse(await readFile(input, "utf8")));
  console.log("File-admission manifest 0.8 validation passed: " + report.manifestId + " (" + report.specimenCount + " specimens; " + report.fileCount + " metadata-only files)");
}
