import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createResearchMvpValidator, formatSchemaErrors } from "./validate-json-schema.mjs";

const REGISTRY_URL = new URL("../data/public-source-intake-registry-0.5.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/public-source-intake-registry-0.5.schema.json", import.meta.url);

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

export async function validatePublicSourceIntakeRegistry() {
  const [registry, schema] = await Promise.all([
    readFile(REGISTRY_URL, "utf8").then(JSON.parse),
    readFile(SCHEMA_URL, "utf8").then(JSON.parse),
  ]);
  const validate = createResearchMvpValidator(schema);
  const errors = [];
  if (!validate(registry)) errors.push(...formatSchemaErrors(validate.errors));

  const intakeIds = new Set();
  const representedSources = new Set();
  for (const intake of registry.records ?? []) {
    check(!intakeIds.has(intake.intakeId), "duplicate intake ID " + intake.intakeId, errors);
    intakeIds.add(intake.intakeId);
    check(!representedSources.has(intake.sourceId), "duplicate source intake " + intake.sourceId, errors);
    representedSources.add(intake.sourceId);
    check(intake.acquisition?.status === "not_downloaded", intake.intakeId + ": must not claim a downloaded candidate file", errors);
    check(intake.acquisition?.remoteAcquisitionAttempted === false, intake.intakeId + ": must not auto-acquire remote files", errors);
    check(intake.acquisition?.bundledAssetCount === 0, intake.intakeId + ": must contain zero bundled assets", errors);
    check(Array.isArray(intake.acquisition?.fileHashes) && intake.acquisition.fileHashes.length === 0, intake.intakeId + ": must contain zero file hashes", errors);
    check(intake.coordinates?.projectRegistrationStatus === "not_proposed", intake.intakeId + ": must not propose registration", errors);
    check(intake.coordinates?.projectRegistrationCount === 0, intake.intakeId + ": must contain zero registrations", errors);
    check(intake.rights?.bundleAuthorized === false && intake.rights?.publicHostingAuthorized === false, intake.intakeId + ": must not authorize bundling or public hosting", errors);
    const evidenceIds = new Set((intake.publicSourceEvidence?.records ?? []).map((record) => record.id));
    for (const fact of intake.publicSourceEvidence?.reportedFacts ?? []) {
      check(evidenceIds.has(fact.evidenceRecordId), intake.intakeId + ": fact references an unknown evidence record", errors);
    }
  }
  check(representedSources.has("PDS-SPINALJ-PROCESSED"), "SpinalJ intake is missing", errors);
  check(representedSources.has("PDS-CANOGOMEZ-2026"), "Cano-Gomez intake is missing", errors);
  const cano = (registry.records ?? []).find((record) => record.sourceId === "PDS-CANOGOMEZ-2026");
  check(cano?.studyStatus === "preprint_resource", "Cano-Gomez preprint status must remain explicit", errors);
  check(cano?.coordinates?.sourceCoordinateAuthority === "AUTHOR_SPACE_OBS", "Cano-Gomez coordinates must remain author-space", errors);
  check(cano?.coordinates?.transformStatus === "public_code_referenced_not_file_or_error_verified", "Cano-Gomez transform status must remain unverified", errors);

  if (errors.length) throw new Error("Public-source intake registry validation failed:\n" + errors.map((item) => "- " + item).join("\n"));
  return { releaseId: registry.releaseId, intakeCount: registry.records.length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL("file://" + process.argv[1]))) {
  try {
    const result = await validatePublicSourceIntakeRegistry();
    console.log("Public-source intake registry validation passed: " + result.releaseId);
    console.log(result.intakeCount + " metadata-only public intakes; 0 downloaded files; 0 registrations");
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
