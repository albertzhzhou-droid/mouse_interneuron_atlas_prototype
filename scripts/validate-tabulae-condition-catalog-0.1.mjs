import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createResearchMvpValidator, formatSchemaErrors } from "./validate-json-schema.mjs";

const CATALOG_URL = new URL("../data/tabulae-condition-catalog-0.1.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/tabulae-condition-catalog-0.1.schema.json", import.meta.url);
const EXPECTED_CONDITIONS = new Map([
  ["TPC-001", { family: "baseline", accession: "GSE234774", modality: "single-nucleus RNA sequencing", labels: 3 }],
  ["TPC-002", { family: "injury_timecourse", accession: "GSE234774", modality: "single-nucleus RNA sequencing", labels: 20 }],
  ["TPC-003", { family: "injury_mechanism", accession: "GSE234774", modality: "single-nucleus RNA sequencing", labels: 6 }],
  ["TPC-004", { family: "injury_severity", accession: "GSE234774", modality: "single-nucleus RNA sequencing", labels: 9 }],
  ["TPC-005", { family: "sex_label", accession: "GSE234774", modality: "single-nucleus RNA sequencing", labels: 3 }],
  ["TPC-006", { family: "drug_label", accession: "GSE234774", modality: "single-nucleus RNA sequencing", labels: 12 }],
  ["TPC-007", { family: "spatial_section", accession: "GSE234774", modality: "Visium spatial transcriptomics", labels: 24 }],
  ["TPC-008", { family: "multiome_timepoint", accession: "GSE230765", modality: "single-nucleus multiome", labels: 16 }],
]);

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

export async function validateTabulaeConditionCatalog(catalog) {
  const schema = JSON.parse(await readFile(SCHEMA_URL, "utf8"));
  const validate = createResearchMvpValidator(schema);
  const errors = [];
  if (!validate(catalog)) errors.push(...formatSchemaErrors(validate.errors));

  check(catalog.authority === "SOURCE_METADATA_CONDITION_INDEX_ONLY", "catalog must remain a source-metadata condition index only", errors);
  check(catalog.admissionDecision === "metadata_only_not_downloaded_not_bundled_not_registered", "catalog must not acquire, bundle or register data", errors);
  const sourceAccessions = new Set();
  for (const source of catalog.sources ?? []) {
    sourceAccessions.add(source.accession);
    check(source.bodyBundled === false && source.processedMetadataBundled === false && source.localFileHash === null, source.accession + " must retain zero bundled source bodies and a null local hash", errors);
  }
  check(sourceAccessions.size === 2 && sourceAccessions.has("GSE234774") && sourceAccessions.has("GSE230765"), "catalog must retain exactly the two Tabulae GEO source records", errors);

  const conditionIds = new Set();
  const sourceLabels = new Set();
  for (const condition of catalog.conditions ?? []) {
    conditionIds.add(condition.id);
    const expected = EXPECTED_CONDITIONS.get(condition.id);
    check(Boolean(expected), "unexpected condition ID " + condition.id, errors);
    if (expected) {
      check(condition.family === expected.family && condition.accession === expected.accession && condition.sourceModality === expected.modality, condition.id + " must retain its pinned source family, accession and modality", errors);
      check(condition.sourceSampleLabels?.length === expected.labels, condition.id + " source-label count differs from the public-series index", errors);
    }
    check(sourceAccessions.has(condition.accession), condition.id + " references an unlisted source accession", errors);
    for (const label of condition.sourceSampleLabels ?? []) {
      check(!sourceLabels.has(label), "source sample label is repeated across condition groups: " + label, errors);
      sourceLabels.add(label);
    }
    check(condition.metadataAuthority === "GEO_SERIES_LABEL_AND_DESIGN_ONLY", condition.id + " must remain limited to GEO series labels and design", errors);
    check(/not established|no current adapter|does not identify|no cell identity|a shared lesion geometry|the physical meaning|no female comparator|intervention identity|a spatial sample is not/i.test(condition.notEstablished ?? ""), condition.id + " needs an explicit interpretation boundary", errors);
    check(!/\bREG\b/i.test(condition.established ?? ""), condition.id + " must not grant REG", errors);
  }
  check(conditionIds.size === EXPECTED_CONDITIONS.size && [...EXPECTED_CONDITIONS.keys()].every((id) => conditionIds.has(id)), "catalog must retain exactly eight pinned condition groups", errors);
  check(sourceLabels.size === 93, "catalog must retain 93 distinct source-series labels", errors);
  check(/Do not download a source body.*create REG/i.test(catalog.releaseDecision?.forbidden ?? ""), "release decision must forbid acquisition and REG", errors);
  check(/object inventory.*asset-level terms.*condition-compatible analysis plan/i.test(catalog.releaseDecision?.nextCuratorGate ?? ""), "release decision must require object, rights and compatibility review", errors);

  if (errors.length) throw new Error("Tabulae condition catalog 0.1 validation failed:\n" + errors.map((item) => "- " + item).join("\n"));
  return { releaseId: catalog.releaseId, sourceCount: catalog.sources.length, conditionCount: catalog.conditions.length, sourceLabelCount: sourceLabels.size };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL("file://" + process.argv[1]))) {
  try {
    const catalog = JSON.parse(await readFile(CATALOG_URL, "utf8"));
    const result = await validateTabulaeConditionCatalog(catalog);
    console.log("Tabulae condition catalog 0.1 validation passed: " + result.releaseId + " (" + result.conditionCount + " condition groups; " + result.sourceLabelCount + " source labels)");
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
