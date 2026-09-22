import { readFile } from "node:fs/promises";
import { createResearchMvpValidator, formatSchemaErrors } from "./validate-json-schema.mjs";

const CONTRACT_URL = new URL("../data/cross-lane-relationship-admission-0.1.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/cross-lane-relationship-admission-0.1.schema.json", import.meta.url);
const RESEARCH_URL = new URL("../data/research-mvp-release-0.2.json", import.meta.url);
const CATALOG_URL = new URL("../data/public-data-catalog-0.4.json", import.meta.url);
const TRACE_URL = new URL("../data/evidence-provenance-trace-0.1.json", import.meta.url);

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

export async function validateCrossLaneRelationshipAdmission() {
  const [contract, schema, research, catalog, trace] = await Promise.all([
    readFile(CONTRACT_URL, "utf8").then(JSON.parse),
    readFile(SCHEMA_URL, "utf8").then(JSON.parse),
    readFile(RESEARCH_URL, "utf8").then(JSON.parse),
    readFile(CATALOG_URL, "utf8").then(JSON.parse),
    readFile(TRACE_URL, "utf8").then(JSON.parse),
  ]);
  const validate = createResearchMvpValidator(schema);
  const errors = [];
  if (!validate(contract)) errors.push(...formatSchemaErrors(validate.errors));
  check(contract.researchReleaseId === research.releaseId, "relationship-admission contract must lock the current Research MVP release", errors);
  check(contract.catalogReleaseId === catalog.releaseId, "relationship-admission contract must lock the current public-data catalog", errors);
  check(contract.provenanceTraceReleaseId === trace.releaseId, "relationship-admission contract must lock the provenance-trace release", errors);
  const queueItem = catalog.upgradeQueue?.find((item) => item.id === contract.queueItemId);
  check(queueItem?.id === "UPG-017" && queueItem.status === "in_progress", "UPG-017 must be the implemented, still non-promoting relationship admission gate", errors);
  const expectedKinds = ["molecular_label_correspondence", "source_object_derivation", "same_specimen_relation", "coordinate_transform", "same_cell_identity"];
  check(JSON.stringify(contract.relationshipKinds?.map((item) => item.id)) === JSON.stringify(expectedKinds), "relationship kinds must remain typed and ordered", errors);
  check(contract.commonRequiredEvidence?.includes("stable_source_object_id") && contract.commonRequiredEvidence?.includes("asset_level_rights_decision") && contract.commonRequiredEvidence?.includes("independent_relation_evidence") && contract.commonRequiredEvidence?.includes("predeclared_validation_plan"), "common admission evidence must require object, rights, independent evidence and validation", errors);
  const transform = contract.relationshipKinds?.find((item) => item.id === "coordinate_transform");
  check(transform?.requiredEvidence?.includes("source_frame_units_axes_origin") && transform?.requiredEvidence?.includes("held_out_physical_space_error"), "coordinate transforms must require source-frame authority and held-out physical-space error", errors);
  const identity = contract.relationshipKinds?.find((item) => item.id === "same_cell_identity");
  check(identity?.requiredEvidence?.includes("persistent_cell_identifier_or_paired_measurement"), "same-cell identity must require a persistent ID or paired measurement", errors);
  check(contract.localRuntime?.networkRequests === false && contract.localRuntime?.sourceObjectAcquisition === false && contract.localRuntime?.sourceFileUpload === false && contract.localRuntime?.persistentStorage === "none", "relationship admission must remain local and source-object-free", errors);
  check(/cannot add a cross-lane edge.*create REG/i.test(contract.nonPromotionPolicy ?? ""), "relationship admission must forbid edge creation and REG", errors);
  if (errors.length) throw new Error(`Cross-lane relationship admission validation failed:\n- ${errors.join("\n- ")}`);
  return { relationshipKindCount: contract.relationshipKinds.length, catalogSourceCount: catalog.sources.length, admissionStatus: contract.admissionStatus };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1])) {
  const result = await validateCrossLaneRelationshipAdmission();
  process.stdout.write(`Cross-lane relationship admission validation passed (${result.relationshipKindCount} kinds; ${result.catalogSourceCount} public sources; ${result.admissionStatus})\n`);
}
