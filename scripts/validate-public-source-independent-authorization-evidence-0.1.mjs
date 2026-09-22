import { readFile } from "node:fs/promises";
import { createResearchMvpValidator, formatSchemaErrors } from "./validate-json-schema.mjs";

const urls = {
  contract: new URL("../data/public-source-independent-authorization-evidence-0.1.json", import.meta.url),
  schema: new URL("../schemas/public-source-independent-authorization-evidence-0.1.schema.json", import.meta.url),
  catalog: new URL("../data/public-data-catalog-0.4.json", import.meta.url),
  assertion: new URL("../data/public-source-assertion-provenance-0.1.json", import.meta.url),
  plan: new URL("../data/public-source-authorization-plan-0.1.json", import.meta.url),
};
const check = (condition, message, errors) => { if (!condition) errors.push(message); };
export async function validatePublicSourceIndependentAuthorizationEvidence() {
  const [contract, schema, catalog, assertion, plan] = await Promise.all(Object.values(urls).map((url) => readFile(url, "utf8").then(JSON.parse)));
  const validate = createResearchMvpValidator(schema); const errors = [];
  if (!validate(contract)) errors.push(...formatSchemaErrors(validate.errors));
  check(contract.catalogReleaseId === catalog.releaseId && contract.assertionProvenanceReleaseId === assertion.releaseId && contract.authorizationPlanReleaseId === plan.releaseId, "evidence-packet composer must lock catalog and predecessor releases", errors);
  check(catalog.upgradeQueue?.find((item) => item.id === "UPG-020")?.status === "in_progress", "UPG-020 must identify the implemented evidence-packet composer", errors);
  check(JSON.stringify(contract.supportedManifestFormats?.map((item) => [item.formatVersion, item.sourceId])) === JSON.stringify([["0.7.0", "PDS-SPINALJ-PROCESSED"], ["0.8.0", "PDS-CANOGOMEZ-2026"]]), "composer must support only the two frozen metadata-manifest formats", errors);
  const stages = ["authority_identity_confirmation", "object_specific_terms_scope_review", "authorized_retrieval_conditions", "local_integrity_comparison", "content_scope_retention_review"];
  check(contract.supportedManifestFormats?.every((format) => JSON.stringify(format.requiredReviewStageIds) === JSON.stringify(stages)), "every format must retain all five independent-review stages", errors);
  check(JSON.stringify(contract.evidenceRecordStates) === JSON.stringify(["review_request_prepared", "external_evidence_declared_not_authenticated", "execution_declined", "unresolved"]), "composer must not offer an authenticated authorization state", errors);
  check(contract.nonPromotion?.packetStatus === "independent_authorization_evidence_packet_draft_only" && contract.nonPromotion?.authorityStatus === "not_authenticated_by_this_packet" && contract.nonPromotion?.executionStatus === "not_executed_pending_independent_authorization" && contract.nonPromotion?.verificationStatus === "not_locally_verified", "composer must remain a non-authorizing, non-executing draft", errors);
  check(["source_object_acquisition", "credential_storage", "local_checksum_calculation", "content_inspection", "data_retention", "reuse_authorization", "registration"].every((action) => contract.nonPromotion?.blockedActions?.includes(action)), "composer must block execution, credentials, inspection, retention, rights grants and registration", errors);
  check(contract.localRuntime?.networkRequests === false && contract.localRuntime?.sourceFileDownload === false && contract.localRuntime?.sourceFileUpload === false && contract.localRuntime?.persistentStorage === "none", "composer must remain browser-local without network, transfer or persistence", errors);
  check(/does not authenticate.*authorize.*acquire.*retain.*create REG/i.test(contract.scientificBoundary ?? ""), "composer must retain independent-decision, execution, retention and REG boundaries", errors);
  check(contract.nextQueueItems?.includes("UPG-021") && catalog.upgradeQueue?.find((item) => item.id === "UPG-021")?.status === "research_watch", "composer must place separately approved execution on the future queue", errors);
  if (errors.length) throw new Error("Independent authorization-evidence validation failed:\n- " + errors.join("\n- "));
  return { supportedFormatCount: contract.supportedManifestFormats.length, reviewStageCount: stages.length };
}
if (process.argv[1] && import.meta.url.endsWith(process.argv[1])) { const result = await validatePublicSourceIndependentAuthorizationEvidence(); console.log("Independent authorization-evidence validation passed (" + result.supportedFormatCount + " formats; " + result.reviewStageCount + " planned stages)"); }
