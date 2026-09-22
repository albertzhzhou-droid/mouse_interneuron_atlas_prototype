import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createResearchMvpValidator, formatSchemaErrors } from "./validate-json-schema.mjs";

const COMPOSER_URL = new URL("../data/public-file-admission-composer-0.1.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/public-file-admission-composer-0.1.schema.json", import.meta.url);

export async function validatePublicFileAdmissionComposer(composer) {
  const schema = JSON.parse(await readFile(SCHEMA_URL, "utf8"));
  const validate = createResearchMvpValidator(schema);
  const errors = [];
  if (!validate(composer)) errors.push(...formatSchemaErrors(validate.errors));

  const formats = new Map((composer.supportedManifestFormats ?? []).map((format) => [format.sourceId, format]));
  const spinalj = formats.get("PDS-SPINALJ-PROCESSED");
  const cano = formats.get("PDS-CANOGOMEZ-2026");
  if (spinalj?.formatVersion !== "0.7.0" || spinalj?.schemaPath !== "schemas/public-file-admission-manifest-0.7.schema.json") errors.push("SpinalJ composer must remain locked to the generic 0.7 manifest schema");
  if (cano?.formatVersion !== "0.8.0" || cano?.schemaPath !== "schemas/public-file-admission-manifest-0.8.schema.json" || cano?.fixedPreprintStatus !== "preprint_resource") errors.push("Cano-Gomez composer must remain locked to the specimen-aware 0.8 manifest schema and preprint boundary");
  for (const format of formats.values()) {
    if (format.fixedAdmissionDecision !== "metadata_only_not_downloaded_not_registered" || format.fixedLocalSha256 !== null) errors.push(format.sourceId + " must retain metadata-only admission and null local SHA-256");
  }
  const runtime = composer.localRuntime ?? {};
  if (runtime.automaticRemoteAcquisition || runtime.sourceFileUpload || runtime.credentialStorage || runtime.persistentStorage !== "none" || runtime.localHashCalculation) errors.push("composer runtime must not acquire, upload, persist, credential-store or locally hash a source file");
  const boundary = composer.scientificBoundary ?? "";
  if (!/does not contact a repository/i.test(boundary) || !/hash a source file/i.test(boundary) || !/create REG/i.test(boundary)) errors.push("composer scientific boundary must retain no-contact, no-local-hash and no-REG limits");
  if (!["UPG-001", "UPG-002", "UPG-014"].every((id) => composer.nextQueueItems?.includes(id))) errors.push("composer must retain the SpinalJ, Cano-Gomez and interoperability next gates");

  if (errors.length) throw new Error("Public file-admission composer validation failed:\n" + errors.map((error) => "- " + error).join("\n"));
  return { releaseId: composer.releaseId, formatCount: formats.size, sourceIds: [...formats.keys()] };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL("file://" + process.argv[1]))) {
  try {
    const result = await validatePublicFileAdmissionComposer(JSON.parse(await readFile(COMPOSER_URL, "utf8")));
    console.log("Public file-admission composer validation passed: " + result.releaseId + " (" + result.formatCount + " locked manifest formats)");
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
