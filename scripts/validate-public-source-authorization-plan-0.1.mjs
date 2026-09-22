import { readFile } from "node:fs/promises";

import { createResearchMvpValidator, formatSchemaErrors } from "./validate-json-schema.mjs";

const CONTRACT_URL = new URL("../data/public-source-authorization-plan-0.1.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/public-source-authorization-plan-0.1.schema.json", import.meta.url);
const CATALOG_URL = new URL("../data/public-data-catalog-0.4.json", import.meta.url);
const ADMISSION_SERVICE_URL = new URL("../data/public-source-release-admission-service-0.1.json", import.meta.url);
const ASSERTION_PROVENANCE_URL = new URL("../data/public-source-assertion-provenance-0.1.json", import.meta.url);

function check(condition, message, errors) { if (!condition) errors.push(message); }

export async function validatePublicSourceAuthorizationPlan() {
  const [contract, schema, catalog, admissionService, assertionProvenance] = await Promise.all([
    readFile(CONTRACT_URL, "utf8").then(JSON.parse),
    readFile(SCHEMA_URL, "utf8").then(JSON.parse),
    readFile(CATALOG_URL, "utf8").then(JSON.parse),
    readFile(ADMISSION_SERVICE_URL, "utf8").then(JSON.parse),
    readFile(ASSERTION_PROVENANCE_URL, "utf8").then(JSON.parse),
  ]);
  const validate = createResearchMvpValidator(schema);
  const errors = [];
  if (!validate(contract)) errors.push(...formatSchemaErrors(validate.errors));
  check(contract.catalogReleaseId === catalog.releaseId, "authorization-plan composer must lock the current public-data catalogue", errors);
  check(contract.admissionServiceReleaseId === admissionService.releaseId, "authorization-plan composer must lock the current admission-service release", errors);
  check(contract.assertionProvenanceReleaseId === assertionProvenance.releaseId, "authorization-plan composer must lock the current assertion-provenance release", errors);
  const queueItem = catalog.upgradeQueue?.find((item) => item.id === contract.queueItemId);
  check(queueItem?.status === "in_progress", "UPG-019 must identify the implemented authorization-plan composer", errors);
  check(JSON.stringify(contract.supportedManifestFormats?.map((format) => [format.formatVersion, format.sourceId])) === JSON.stringify([["0.7.0", "PDS-SPINALJ-PROCESSED"], ["0.8.0", "PDS-CANOGOMEZ-2026"]]), "composer must support only the two frozen metadata-manifest formats", errors);
  const requiredSteps = ["object_identity_confirmation", "object_specific_rights_review", "authorized_acquisition_record", "local_checksum_verification", "content_scope_validation"];
  check(contract.supportedManifestFormats?.every((format) => JSON.stringify(format.requiredPlanStepIds) === JSON.stringify(requiredSteps)), "every format must retain all five planned stages in order", errors);
  check(JSON.stringify(contract.requestedRightsDispositions) === JSON.stringify(["unresolved", "request_independent_rights_review", "decline_acquisition"]), "composer must request review without granting a rights disposition", errors);
  check(contract.evidenceLocatorKinds?.includes("rights_statement_url") && contract.evidenceLocatorKinds?.includes("publisher_object_url"), "composer must retain typed rights and publisher object locators", errors);
  check(contract.nonPromotion?.planStatus === "authorization_and_verification_plan_only" && contract.nonPromotion?.authorizationStatus === "not_authorized_by_this_plan" && contract.nonPromotion?.verificationStatus === "not_locally_verified", "composer must emit only a non-authorizing, non-verifying plan", errors);
  check(["source_object_acquisition", "local_checksum_calculation", "content_inspection", "reuse_authorization", "redistribution_authorization", "coordinate_transform", "registration"].every((action) => contract.nonPromotion?.blockedActions?.includes(action)), "composer must block acquisition, checksum execution, inspection, rights grants, transforms and registration", errors);
  check(contract.localRuntime?.networkRequests === false && contract.localRuntime?.sourceFileDownload === false && contract.localRuntime?.sourceFileUpload === false && contract.localRuntime?.persistentStorage === "none", "composer must remain browser-local without network, source-file transfer or persistence", errors);
  check(/does not authenticate.*authorize.*acquire.*hash.*create REG/i.test(contract.scientificBoundary ?? ""), "composer must retain authentication, authorization, acquisition, hashing and REG boundaries", errors);
  check(contract.nextQueueItems?.includes("UPG-020"), "composer must place independent authorization-evidence execution on the future queue", errors);
  if (errors.length) throw new Error(`Public-source authorization-plan validation failed:\n- ${errors.join("\n- ")}`);
  return { supportedFormatCount: contract.supportedManifestFormats.length, plannedStageCount: requiredSteps.length };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1])) {
  const result = await validatePublicSourceAuthorizationPlan();
  process.stdout.write(`Public-source authorization-plan validation passed (${result.supportedFormatCount} formats; ${result.plannedStageCount} planned stages)\n`);
}
