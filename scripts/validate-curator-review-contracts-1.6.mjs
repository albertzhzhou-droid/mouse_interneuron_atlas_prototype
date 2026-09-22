import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createResearchMvpValidator, formatSchemaErrors } from "./validate-json-schema.mjs";

const feedbackUrl = new URL("../data/curator-feedback-contract-1.6.json", import.meta.url);
const feedbackSchemaUrl = new URL("../schemas/curator-feedback-contract-1.6.schema.json", import.meta.url);
const adjudicationUrl = new URL("../data/curator-adjudication-contract-1.6.json", import.meta.url);
const adjudicationSchemaUrl = new URL("../schemas/curator-adjudication-contract-1.6.schema.json", import.meta.url);

export async function validateCuratorReviewContracts16(feedback, adjudication) {
  const [feedbackSchema, adjudicationSchema] = await Promise.all([readFile(feedbackSchemaUrl, "utf8").then(JSON.parse), readFile(adjudicationSchemaUrl, "utf8").then(JSON.parse)]);
  for (const [label, schema, data] of [["feedback", feedbackSchema, feedback], ["adjudication", adjudicationSchema, adjudication]]) {
    const validate = createResearchMvpValidator(schema);
    if (!validate(data)) throw new Error("Curator " + label + " contract 1.6 validation failed:\n" + formatSchemaErrors(validate.errors).map((item) => "- " + item).join("\n"));
  }
  if (feedback.feedbackSchemaVersion !== adjudication.feedbackSchemaVersion || feedback.distributionVersion !== adjudication.distributionVersion || feedback.workbenchReleaseId !== adjudication.workbenchReleaseId || feedback.minimumIndependentCuratorsForComparison !== adjudication.minimumIndependentCurators || adjudication.readOnlyPacketImport !== true || adjudication.maximumPacketBytes !== feedback.maximumFileBytes) throw new Error("Curator review contracts 1.6 validation failed: identities or local-only limits differ");
  const keys = [...feedback.requiredResponseKeys, ...feedback.optionalResponseKeys];
  if (new Set(keys).size !== keys.length || !["curator_id", "zip_verified", "zip_sha256", "overall_verdict", "attestation"].every((key) => feedback.requiredResponseKeys.includes(key))) throw new Error("Curator review contracts 1.6 validation failed: response keys are incomplete or duplicated");
  return { distributionVersion: feedback.distributionVersion, requiredResponseKeyCount: feedback.requiredResponseKeys.length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL("file://" + process.argv[1]))) {
  const [feedback, adjudication] = await Promise.all([readFile(feedbackUrl, "utf8").then(JSON.parse), readFile(adjudicationUrl, "utf8").then(JSON.parse)]);
  const result = await validateCuratorReviewContracts16(feedback, adjudication);
  console.log("Curator review contracts 1.6 validation passed: " + result.distributionVersion + " (" + result.requiredResponseKeyCount + " required feedback responses)");
}
