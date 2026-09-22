import { readFile } from "node:fs/promises";
import { createResearchMvpValidator, formatSchemaErrors } from "./validate-json-schema.mjs";

const SERVICE_URL = new URL("../data/public-source-release-admission-service-0.1.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/public-source-release-admission-service-0.1.schema.json", import.meta.url);
const CATALOG_URL = new URL("../data/public-data-catalog-0.4.json", import.meta.url);
const COMPOSER_URL = new URL("../data/public-file-admission-composer-0.1.json", import.meta.url);

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

export async function validatePublicSourceReleaseAdmissionService() {
  const [service, schema, catalog, composer] = await Promise.all([
    readFile(SERVICE_URL, "utf8").then(JSON.parse),
    readFile(SCHEMA_URL, "utf8").then(JSON.parse),
    readFile(CATALOG_URL, "utf8").then(JSON.parse),
    readFile(COMPOSER_URL, "utf8").then(JSON.parse),
  ]);
  const validate = createResearchMvpValidator(schema);
  const errors = [];
  if (!validate(service)) errors.push(...formatSchemaErrors(validate.errors));
  check(service.catalogReleaseId === catalog.releaseId && service.manifestComposerReleaseId === composer.releaseId, "admission service must lock current catalogue and composer releases", errors);
  const queue = catalog.upgradeQueue?.find((item) => item.id === service.queueItemId);
  check(queue?.status === "in_progress", "UPG-006 must be the implemented non-promoting admission service", errors);
  check(JSON.stringify(service.supportedManifestFormats?.map((item) => [item.formatVersion, item.sourceId])) === JSON.stringify([["0.7.0", "PDS-SPINALJ-PROCESSED"], ["0.8.0", "PDS-CANOGOMEZ-2026"]]), "service must only accept the two frozen metadata manifest formats", errors);
  check(service.supportedManifestFormats?.every((item) => item.requiredChecks.includes("asset_level_rights_review") && item.requiredChecks.includes("null_local_checksum")), "every format must require asset-level rights review and null local checksum", errors);
  check(service.admissionDecision === "not_admitted_pending_curator_object_and_rights_review", "service must remain not admitted", errors);
  check(service.localRuntime?.networkRequests === false && service.localRuntime?.sourceFileDownload === false && service.localRuntime?.sourceFileUpload === false && service.localRuntime?.metadataManifestImport === true && service.localRuntime?.persistentStorage === "none", "service must accept metadata only and remain local", errors);
  check(service.reviewSemantics?.blockedActions?.includes("registration") && service.reviewSemantics?.blockedActions?.includes("source_object_acquisition"), "service must block registration and source acquisition", errors);
  check(/does not authenticate.*acquire or inspect.*create REG/i.test(service.scientificBoundary ?? ""), "service must retain authentication, acquisition and registration boundary", errors);
  if (errors.length) throw new Error(`Public-source release-admission service validation failed:\n- ${errors.join("\n- ")}`);
  return { formatCount: service.supportedManifestFormats.length, decision: service.admissionDecision };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1])) {
  const result = await validatePublicSourceReleaseAdmissionService();
  process.stdout.write(`Public-source release-admission service validation passed (${result.formatCount} formats; ${result.decision})\n`);
}
