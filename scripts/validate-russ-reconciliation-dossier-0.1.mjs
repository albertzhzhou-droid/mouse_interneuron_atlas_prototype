import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createResearchMvpValidator, formatSchemaErrors } from "./validate-json-schema.mjs";

const DOSSIER_URL = new URL("../data/russ-reconciliation-dossier-0.1.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/russ-reconciliation-dossier-0.1.schema.json", import.meta.url);
const EXPECTED_CORRECTIONS = new Map([
  ["COR-RUSS-2022-02", { doi: "10.1038/s41467-022-28698-7", published: "2022-02-18" }],
  ["COR-RUSS-2022-10", { doi: "10.1038/s41467-022-33998-z", published: "2022-10-19" }],
]);

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

export async function validateRussReconciliationDossier(dossier) {
  const schema = JSON.parse(await readFile(SCHEMA_URL, "utf8"));
  const validate = createResearchMvpValidator(schema);
  const errors = [];
  if (!validate(dossier)) errors.push(...formatSchemaErrors(validate.errors));
  check(dossier.authority === "PROVENANCE_RECONCILIATION_ONLY", "dossier must remain provenance reconciliation only", errors);
  check(dossier.sourceArticle?.doi === "10.1038/s41467-021-25125-1", "dossier must pin the Russ 2021 article DOI", errors);
  check(dossier.pinnedMarkerTable?.sourceFileBundled === false && dossier.pinnedMarkerTable?.derivedMetadataBundled === true, "dossier must keep source table unbundled and metadata derived", errors);
  check(dossier.pinnedMarkerTable?.tableContentChangeStatedByCorrections === false, "correction statements must not be converted into a Table 1 content change", errors);
  const correctionIds = new Set();
  for (const correction of dossier.corrections ?? []) {
    correctionIds.add(correction.id);
    const expected = EXPECTED_CORRECTIONS.get(correction.id);
    check(Boolean(expected), "unexpected correction ID " + correction.id, errors);
    if (expected) check(correction.doi === expected.doi && correction.published === expected.published, correction.id + " DOI or published date differs from the recorded correction", errors);
    check(/No Table 1 content or label change is stated/i.test(correction.directEffectOnPinnedMarkerTable ?? ""), correction.id + " must not imply a Table 1 content correction", errors);
  }
  check(correctionIds.size === EXPECTED_CORRECTIONS.size && [...EXPECTED_CORRECTIONS.keys()].every((id) => correctionIds.has(id)), "dossier must retain exactly the two published correction records", errors);
  const itemIds = new Set((dossier.reconciliationItems ?? []).map((item) => item.id));
  check(["REC-RUSS-001", "REC-RUSS-002", "REC-RUSS-003"].every((id) => itemIds.has(id)), "dossier must retain marker, adult-context and figure-correction review items", errors);
  check(/Do not change a prototype mapping to exact.*REG/i.test(dossier.releaseDecision?.forbidden ?? ""), "dossier decision must forbid exact mapping and REG", errors);
  if (errors.length) throw new Error("Russ reconciliation dossier 0.1 validation failed:\n" + errors.map((item) => "- " + item).join("\n"));
  return { releaseId: dossier.releaseId, correctionCount: dossier.corrections.length, reconciliationItemCount: dossier.reconciliationItems.length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL("file://" + process.argv[1]))) {
  try {
    const dossier = JSON.parse(await readFile(DOSSIER_URL, "utf8"));
    const result = await validateRussReconciliationDossier(dossier);
    console.log("Russ reconciliation dossier 0.1 validation passed: " + result.releaseId + " (" + result.correctionCount + " corrections; " + result.reconciliationItemCount + " review items)");
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
