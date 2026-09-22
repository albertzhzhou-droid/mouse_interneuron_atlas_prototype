import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createResearchMvpValidator, formatSchemaErrors } from "./validate-json-schema.mjs";

const COMPARISON_URL = new URL("../data/tabulae-spatial-local-comparison-0.1.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/tabulae-spatial-local-comparison-0.1.schema.json", import.meta.url);

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

export async function validateTabulaeSpatialLocalComparison(comparison) {
  const schema = await readFile(SCHEMA_URL, "utf8").then(JSON.parse);
  const validate = createResearchMvpValidator(schema);
  const errors = [];
  if (!validate(comparison)) errors.push(...formatSchemaErrors(validate.errors));
  check(comparison.scientificInputPolicy === "public_sources_only", "comparison must retain public-data-only policy", errors);
  check(comparison.authority === "MULTI_SESSION_SOURCE_LOCAL_2D_ONLY", "comparison must remain multi-session source-local 2D only", errors);
  check(comparison.comparison?.maximumConcurrentSessions === 4, "comparison must limit active sessions to four", errors);
  check(comparison.comparison?.crossSectionTransform === "none" && comparison.comparison?.interSectionGeometry === "not_established", "comparison must not claim a cross-section transform or geometry", errors);
  check(comparison.comparison?.sectionOrderAuthority === "not_established_from_section_labels" && comparison.comparison?.quantitativeComparison === "not_permitted", "comparison must not infer order or a quantitative comparison", errors);
  check(comparison.localRuntime?.automaticRemoteAcquisition === false && comparison.localRuntime?.upload === false && comparison.localRuntime?.persistence === "none" && comparison.localRuntime?.sourceFilesBundled === false, "comparison must prohibit acquisition, upload, persistence and bundling", errors);
  check(JSON.stringify(comparison.localRuntime?.receiptMustExclude) === JSON.stringify(["source_image", "source_coordinate_rows", "source_expression_data"]), "receipt must exclude source content", errors);
  check(/do not fetch.*(?:overlay|normalize|order|stack|register).*REG/i.test(comparison.releaseDecision?.forbidden ?? ""), "comparison must forbid acquisition, cross-section manipulation and REG", errors);
  check(/UPG-012.*held-out.*error.*curator/i.test(comparison.releaseDecision?.nextGate ?? ""), "next gate must retain UPG-012 validation and curator review", errors);
  if (errors.length) throw new Error("Tabulae spatial local-comparison validation failed:\n" + errors.map((item) => "- " + item).join("\n"));
  return { releaseId: comparison.releaseId, maximumConcurrentSessions: comparison.comparison.maximumConcurrentSessions };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL("file://" + process.argv[1]))) {
  try {
    const comparison = JSON.parse(await readFile(COMPARISON_URL, "utf8"));
    const report = await validateTabulaeSpatialLocalComparison(comparison);
    console.log("Tabulae spatial local-comparison validation passed: " + report.releaseId);
    console.log("Maximum active source-local sessions: " + report.maximumConcurrentSessions);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
