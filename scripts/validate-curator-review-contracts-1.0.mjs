import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createResearchMvpValidator, formatSchemaErrors } from "./validate-json-schema.mjs";

const FEEDBACK_URL = new URL("../data/curator-feedback-contract-1.0.json", import.meta.url);
const FEEDBACK_SCHEMA_URL = new URL("../schemas/curator-feedback-contract-1.0.schema.json", import.meta.url);
const ADJUDICATION_URL = new URL("../data/curator-adjudication-contract-1.0.json", import.meta.url);
const ADJUDICATION_SCHEMA_URL = new URL("../schemas/curator-adjudication-contract-1.0.schema.json", import.meta.url);

function assertContract(validate, contract, label) {
  if (!validate(contract)) throw new Error(label + " validation failed:\n" + formatSchemaErrors(validate.errors).map((item) => "- " + item).join("\n"));
}

export async function validateCuratorReviewContracts10(feedbackContract, adjudicationContract) {
  const [feedbackSchema, adjudicationSchema] = await Promise.all([
    readFile(FEEDBACK_SCHEMA_URL, "utf8").then(JSON.parse),
    readFile(ADJUDICATION_SCHEMA_URL, "utf8").then(JSON.parse),
  ]);
  assertContract(createResearchMvpValidator(feedbackSchema), feedbackContract, "Curator feedback contract 1.0");
  assertContract(createResearchMvpValidator(adjudicationSchema), adjudicationContract, "Curator adjudication contract 1.0");
  const responseKeys = new Set([...feedbackContract.requiredResponseKeys, ...feedbackContract.optionalResponseKeys]);
  if (responseKeys.size !== feedbackContract.requiredResponseKeys.length + feedbackContract.optionalResponseKeys.length) {
    throw new Error("Curator feedback contract 1.0 validation failed:\n- response keys must be unique across required and optional sets");
  }
  for (const key of ["curator_id", "zip_verified", "zip_sha256", "overall_verdict", "attestation"]) {
    if (!feedbackContract.requiredResponseKeys.includes(key)) throw new Error("Curator feedback contract 1.0 validation failed:\n- required response key is missing: " + key);
  }
  if (feedbackContract.feedbackSchemaVersion !== adjudicationContract.feedbackSchemaVersion
    || feedbackContract.distributionVersion !== adjudicationContract.distributionVersion
    || feedbackContract.workbenchReleaseId !== adjudicationContract.workbenchReleaseId
    || feedbackContract.minimumIndependentCuratorsForComparison !== adjudicationContract.minimumIndependentCurators) {
    throw new Error("Curator review contracts 1.0 validation failed:\n- feedback and adjudication identities must match");
  }
  if (!adjudicationContract.permittedDispositions.includes("defer_pending_evidence")
    || !adjudicationContract.permittedDispositions.includes("return_for_revision")
    || !adjudicationContract.permittedDispositions.includes("recommend_next_private_review")) {
    throw new Error("Curator adjudication contract 1.0 validation failed:\n- required non-promoting dispositions are missing");
  }
  return { distributionVersion: feedbackContract.distributionVersion, requiredResponseKeyCount: feedbackContract.requiredResponseKeys.length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL("file://" + process.argv[1]))) {
  const [feedbackContract, adjudicationContract] = await Promise.all([
    readFile(FEEDBACK_URL, "utf8").then(JSON.parse),
    readFile(ADJUDICATION_URL, "utf8").then(JSON.parse),
  ]);
  const report = await validateCuratorReviewContracts10(feedbackContract, adjudicationContract);
  console.log("Curator review contracts 1.0 validation passed: " + report.distributionVersion + " (" + report.requiredResponseKeyCount + " required feedback responses)");
}
