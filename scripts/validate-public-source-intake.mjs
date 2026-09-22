import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import {
  createResearchMvpValidator,
  formatSchemaErrors,
} from "./validate-json-schema.mjs";

const CATALOG_URL = new URL("../data/public-data-catalog-0.4.json", import.meta.url);
const INTAKE_URL = new URL("../data/public-source-intakes/spinalj-processed-metadata-audit-0.4.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/public-source-intake.schema.json", import.meta.url);

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

export async function validatePublicSourceIntake() {
  const [catalog, intake, schema] = await Promise.all([
    readFile(CATALOG_URL, "utf8").then(JSON.parse),
    readFile(INTAKE_URL, "utf8").then(JSON.parse),
    readFile(SCHEMA_URL, "utf8").then(JSON.parse),
  ]);
  const validate = createResearchMvpValidator(schema);
  const errors = [];

  if (!validate(intake)) errors.push(...formatSchemaErrors(validate.errors));
  const source = catalog.sources?.find((candidate) => candidate.id === intake.sourceId);
  check(Boolean(source), "intake source must exist in the public-data catalog", errors);
  check(source?.admissionStatus === "metadata_audited", "SpinalJ source must be marked metadata_audited", errors);
  check(source?.intakeRecordId === intake.intakeId, "catalog must link the exact SpinalJ intake ID", errors);
  check(intake.catalogReleaseId === catalog.releaseId, "intake must name the current catalog release", errors);
  check(intake.acquisition?.status === "not_downloaded", "metadata audit must not claim an acquired file", errors);
  check(intake.acquisition?.remoteAcquisitionAttempted === false, "metadata audit must not download remote files", errors);
  check(intake.acquisition?.candidateFilesEnumerated === false, "metadata audit must not claim a file inventory", errors);
  check(Array.isArray(intake.acquisition?.fileHashes) && intake.acquisition.fileHashes.length === 0, "metadata audit must contain zero file hashes", errors);
  check(intake.acquisition?.bundledAssetCount === 0, "metadata audit must contain zero bundled assets", errors);
  check(intake.coordinates?.projectRegistrationStatus === "not_proposed", "metadata audit must not propose project registration", errors);
  check(intake.coordinates?.projectRegistrationCount === 0, "metadata audit must contain zero registrations", errors);
  check(intake.rights?.bundleAuthorized === false, "metadata audit must not authorize bundling", errors);
  check(intake.rights?.publicHostingAuthorized === false, "metadata audit must not authorize public hosting", errors);
  check(intake.softwareProvenance?.datasetDeclaredSoftwareVersion === "SpinalJ v1.13", "dataset-declared pipeline version must remain pinned", errors);
  check(/do_not_substitute/.test(intake.softwareProvenance?.compatibilityDecision ?? ""), "repository version must not be silently substituted", errors);

  const recordIds = new Set();
  for (const record of intake.publicSourceEvidence?.records ?? []) {
    check(!recordIds.has(record.id), "duplicate public-source evidence record " + record.id, errors);
    recordIds.add(record.id);
    check(record.url?.startsWith("https://"), record.id + ": evidence URL must use HTTPS", errors);
  }
  const factIds = new Set();
  for (const fact of intake.publicSourceEvidence?.reportedFacts ?? []) {
    check(!factIds.has(fact.id), "duplicate public-source fact " + fact.id, errors);
    factIds.add(fact.id);
    check(recordIds.has(fact.evidenceRecordId), fact.id + ": fact references an unknown evidence record", errors);
  }
  const boundaryText = (intake.scientificBoundaries ?? []).join(" ");
  check(/zero downloaded candidate files/i.test(boundaryText), "boundaries must disclose zero downloaded candidate files", errors);
  check(/not a project atlas coordinate system/i.test(boundaryText), "boundaries must reject a project coordinate claim", errors);
  check(/no transform has been inspected or validated/i.test(boundaryText), "boundaries must disclose unvalidated transforms", errors);

  if (errors.length) throw new Error("Public-source intake validation failed:\n" + errors.map((item) => "- " + item).join("\n"));
  return {
    intakeId: intake.intakeId,
    sourceId: intake.sourceId,
    evidenceRecordCount: intake.publicSourceEvidence.records.length,
    reportedFactCount: intake.publicSourceEvidence.reportedFacts.length,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL("file://" + process.argv[1]))) {
  try {
    const result = await validatePublicSourceIntake();
    console.log("Public-source intake validation passed: " + result.intakeId);
    console.log(result.evidenceRecordCount + " evidence records, " + result.reportedFactCount + " reported facts, 0 downloaded files, 0 registrations");
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
