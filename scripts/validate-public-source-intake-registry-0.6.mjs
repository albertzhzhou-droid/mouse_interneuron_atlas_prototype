import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createResearchMvpValidator, formatSchemaErrors } from "./validate-json-schema.mjs";

const REGISTRY_URL = new URL("../data/public-source-intake-registry-0.6.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/public-source-intake-registry-0.6.schema.json", import.meta.url);

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

export async function validatePublicSourceIntakeRegistry06() {
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
    check(intake.acquisition?.remoteAcquisitionAttempted === false, intake.intakeId + ": must not acquire remote file bodies", errors);
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

  for (const sourceId of ["PDS-SPINALJ-PROCESSED", "PDS-CANOGOMEZ-2026", "PDS-TABULAE-PARALYTICA"]) {
    check(representedSources.has(sourceId), "required source intake is missing: " + sourceId, errors);
  }
  const cano = (registry.records ?? []).find((record) => record.sourceId === "PDS-CANOGOMEZ-2026");
  check(cano?.studyStatus === "preprint_resource", "Cano-Gomez preprint status must remain explicit", errors);
  check(cano?.coordinates?.sourceCoordinateAuthority === "AUTHOR_SPACE_OBS", "Cano-Gomez coordinates must remain author-space", errors);

  const tabulae = (registry.records ?? []).find((record) => record.sourceId === "PDS-TABULAE-PARALYTICA");
  const object = tabulae?.objectInventory?.objects?.[0];
  check(tabulae?.auditScope === "public_object_header_metadata_only_no_candidate_file_acquired", "Tabulae must remain a header-only object audit", errors);
  check(tabulae?.objectInventory?.status === "one_public_object_header_observed_checksum_and_asset_rights_unresolved", "Tabulae object audit state is invalid", errors);
  check(tabulae?.objectInventory?.objects?.length === 1, "Tabulae audit must pin exactly one object", errors);
  check(object?.id === "GEO-GSE234774-RNASEQ-META" && object?.stableName === "GSE234774_rnaseq_meta.txt.gz", "Tabulae object identity is invalid", errors);
  check(object?.bytes === 10427632 && object?.contentType === "application/x-gzip", "Tabulae object header metadata is invalid", errors);
  check(object?.sourceChecksum === null && object?.localSha256 === null, "Tabulae audit must not invent a checksum", errors);
  check(object?.assetRightsDecision === "unresolved_not_admitted", "Tabulae object must remain rights-unresolved", errors);
  check(tabulae?.coordinates?.sourceCoordinateAuthority === "AGGREGATED_OR_SPOT_LEVEL", "Tabulae must remain aggregate-or-spot level", errors);
  check(tabulae?.admission?.nextQueueItem === "UPG-008", "Tabulae must remain linked to the object-admission gate", errors);

  if (errors.length) throw new Error("Public-source intake registry 0.6 validation failed:\n" + errors.map((item) => "- " + item).join("\n"));
  return { releaseId: registry.releaseId, intakeCount: registry.records.length, objectInventoryCount: registry.records.reduce((count, intake) => count + intake.objectInventory.objects.length, 0) };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL("file://" + process.argv[1]))) {
  try {
    const result = await validatePublicSourceIntakeRegistry06();
    console.log("Public-source intake registry 0.6 validation passed: " + result.releaseId);
    console.log(result.intakeCount + " metadata-only public intakes; " + result.objectInventoryCount + " object header inventory; 0 downloaded files; 0 registrations");
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
