import { readFile } from "node:fs/promises";

import { createResearchMvpValidator, formatSchemaErrors } from "./validate-json-schema.mjs";

const CONTRACT_URL = new URL("../data/public-source-assertion-provenance-0.1.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/public-source-assertion-provenance-0.1.schema.json", import.meta.url);
const CATALOG_URL = new URL("../data/public-data-catalog-0.4.json", import.meta.url);
const ADMISSION_SERVICE_URL = new URL("../data/public-source-release-admission-service-0.1.json", import.meta.url);

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

export async function validatePublicSourceAssertionProvenance() {
  const [contract, schema, catalog, admissionService] = await Promise.all([
    readFile(CONTRACT_URL, "utf8").then(JSON.parse),
    readFile(SCHEMA_URL, "utf8").then(JSON.parse),
    readFile(CATALOG_URL, "utf8").then(JSON.parse),
    readFile(ADMISSION_SERVICE_URL, "utf8").then(JSON.parse),
  ]);
  const validate = createResearchMvpValidator(schema);
  const errors = [];
  if (!validate(contract)) errors.push(...formatSchemaErrors(validate.errors));
  check(contract.catalogReleaseId === catalog.releaseId, "assertion-provenance composer must lock the current public-data catalogue", errors);
  check(contract.admissionServiceReleaseId === admissionService.releaseId, "assertion-provenance composer must lock the current admission-service release", errors);
  const queueItem = catalog.upgradeQueue?.find((item) => item.id === contract.queueItemId);
  check(queueItem?.status === "in_progress", "UPG-018 must identify the implemented assertion-provenance composer", errors);
  check(JSON.stringify(contract.assertionSourceStates) === JSON.stringify(["publisher_asserted", "curator_transcribed", "unresolved"]), "composer must permit only publisher-asserted, curator-transcribed and unresolved states", errors);
  check(!contract.assertionSourceStates?.some((state) => /verified|admitted|authorized|registered/i.test(state)), "composer must not offer a locally verified, admitted, authorized or registered assertion state", errors);
  check(JSON.stringify(contract.subjectKinds) === JSON.stringify(["declared_unacquired_source_object", "unknown_source_object"]), "composer must distinguish declared unacquired and unknown subjects", errors);
  check(contract.evidenceLocatorKinds?.includes("publisher_object_url") && contract.evidenceLocatorKinds?.includes("source_metadata_field"), "composer must support typed publisher URL and metadata-field locators", errors);
  check(contract.claimScopes?.includes("declared_source_checksum") && contract.claimScopes?.includes("local_verification_missingness") && contract.claimScopes?.includes("asset_rights_metadata"), "composer must retain checksum, missing-local-verification and asset-rights scopes", errors);
  check(contract.nonPromotion?.admissionDecision === admissionService.admissionDecision && contract.nonPromotion?.verificationStatus === "not_locally_verified", "composer must preserve the non-admitted, not-locally-verified result", errors);
  check(["source_object_acquisition", "source_object_bundling", "local_checksum_calculation", "reuse_authorization", "coordinate_transform", "registration"].every((action) => contract.nonPromotion?.blockedActions?.includes(action)), "composer must block acquisition, bundling, local checksums, authorization, transforms and registration", errors);
  check(contract.localRuntime?.networkRequests === false && contract.localRuntime?.sourceFileDownload === false && contract.localRuntime?.sourceFileUpload === false && contract.localRuntime?.persistentStorage === "none", "composer must remain browser-local without network, source-file transfer or persistence", errors);
  check(/does not authenticate.*acquire.*calculate a local checksum.*create REG/i.test(contract.scientificBoundary ?? ""), "composer must retain authentication, acquisition, local-checksum and REG boundaries", errors);
  check(contract.nextQueueItems?.includes("UPG-019"), "composer must place asset-level authorization and reproducible local verification on the future queue", errors);
  if (errors.length) throw new Error(`Public-source assertion-provenance validation failed:\n- ${errors.join("\n- ")}`);
  return { claimScopeCount: contract.claimScopes.length, assertionStateCount: contract.assertionSourceStates.length };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1])) {
  const result = await validatePublicSourceAssertionProvenance();
  process.stdout.write(`Public-source assertion-provenance validation passed (${result.claimScopeCount} scopes; ${result.assertionStateCount} allowed states)\n`);
}
