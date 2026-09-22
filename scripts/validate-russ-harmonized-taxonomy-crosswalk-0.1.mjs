import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createResearchMvpValidator, formatSchemaErrors } from "./validate-json-schema.mjs";

const CROSSWALK_URL = new URL("../data/russ-harmonized-taxonomy-crosswalk-0.1.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/russ-harmonized-taxonomy-crosswalk-0.1.schema.json", import.meta.url);
const EXPECTED_GROUP_SIZES = new Map([
  ["motoneuron_preganglionic", 3],
  ["csf_contacting", 1],
  ["dorsal_excitatory", 20],
  ["dorsal_inhibitory", 14],
  ["mid_excitatory", 10],
  ["mid_inhibitory", 7],
  ["ventral_excitatory", 8],
  ["ventral_inhibitory", 6],
]);
const EXPECTED_ENTITY_IDS = new Set([
  "mouse.propriospinal.relay",
  "mouse.di3.isl1",
  "mouse.sc.vsx2_hoxa10",
  "mouse.v3.sim1",
  "mouse.v2a.cervical_ipsilateral",
  "mouse.overlay.vgat_kcc2",
  "mouse.overlay.vglut2_vgat_switch",
]);

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

export async function validateRussHarmonizedTaxonomyCrosswalk(crosswalk) {
  const schema = JSON.parse(await readFile(SCHEMA_URL, "utf8"));
  const validate = createResearchMvpValidator(schema);
  const errors = [];
  if (!validate(crosswalk)) errors.push(...formatSchemaErrors(validate.errors));

  check(crosswalk.coordinateAuthority === "TYPE_LEVEL", "crosswalk must remain TYPE_LEVEL", errors);
  check(crosswalk.source?.markerTable?.sha256 === "a45578c893998fae42acf781c4700d162249497476b0b81149302f49929fd2e0", "marker-table SHA-256 is not pinned", errors);
  check(crosswalk.source?.markerTable?.bytes === 1475885, "marker-table byte count is not pinned", errors);
  check(crosswalk.source?.markerTable?.sourceFileBundled === false, "source XLSX must not be bundled", errors);
  check(crosswalk.source?.markerTable?.derivedMetadataBundled === true, "derived metadata must be declared", errors);
  check(crosswalk.scope?.reportedNeuralPopulationCount === 69 && crosswalk.scope?.displayedPopulationCount === 69, "crosswalk must retain all 69 reported neural populations", errors);
  check(crosswalk.scope?.displayedInterneuronCandidateCount === 65, "interneuron candidate count must remain 65", errors);

  const groupIds = new Set();
  const labels = new Set();
  for (const group of crosswalk.groups ?? []) {
    check(!groupIds.has(group.id), "duplicate group ID " + group.id, errors);
    groupIds.add(group.id);
    check(EXPECTED_GROUP_SIZES.get(group.id) === group.populationLabels.length, group.id + " must retain its published population count", errors);
    for (const label of group.populationLabels) {
      check(!labels.has(label), "population label appears in multiple groups: " + label, errors);
      labels.add(label);
    }
  }
  check(groupIds.size === EXPECTED_GROUP_SIZES.size && [...EXPECTED_GROUP_SIZES].every(([id]) => groupIds.has(id)), "crosswalk groups are incomplete", errors);
  check(labels.size === 69, "groups must cover exactly 69 unique population labels", errors);

  const populationIds = new Set();
  const populationLabels = new Set();
  for (const population of crosswalk.populations ?? []) {
    check(!populationIds.has(population.id), "duplicate population ID " + population.id, errors);
    check(!populationLabels.has(population.label), "duplicate population label " + population.label, errors);
    populationIds.add(population.id);
    populationLabels.add(population.label);
    check(groupIds.has(population.groupId), population.label + " references an unknown group", errors);
    check(labels.has(population.label), population.label + " is not declared by its group", errors);
    check(population.primaryMarkers?.length === 3 && population.primaryMarkers.every((marker) => typeof marker === "string" && marker.length > 0), population.label + " must retain three source marker rows", errors);
    check(/not a unique identity rule or a spatial coordinate/i.test(population.markerEvidence ?? ""), population.label + " marker evidence must retain its non-spatial boundary", errors);
  }
  check(populationLabels.size === labels.size && [...labels].every((label) => populationLabels.has(label)), "population records do not exactly cover the published group labels", errors);

  const entityIds = new Set();
  for (const mapping of crosswalk.prototypeCrosswalks ?? []) {
    check(!entityIds.has(mapping.entityId), "duplicate prototype mapping " + mapping.entityId, errors);
    entityIds.add(mapping.entityId);
    check(EXPECTED_ENTITY_IDS.has(mapping.entityId), "unexpected prototype mapping " + mapping.entityId, errors);
    check(mapping.mappingStatus !== "exact", mapping.entityId + " must not receive an exact Russ mapping", errors);
    for (const groupId of mapping.candidateGroupIds ?? []) check(groupIds.has(groupId), mapping.entityId + " references unknown candidate group", errors);
    for (const label of mapping.candidatePopulationLabels ?? []) check(populationLabels.has(label), mapping.entityId + " references unknown candidate population", errors);
    check(/not|no|cannot|does not/i.test(mapping.notEstablished ?? ""), mapping.entityId + " must retain an explicit non-establishment boundary", errors);
  }
  check(entityIds.size === EXPECTED_ENTITY_IDS.size && [...EXPECTED_ENTITY_IDS].every((id) => entityIds.has(id)), "crosswalk must cover every prototype entity exactly once", errors);
  check((crosswalk.hardBoundaries ?? []).some((item) => /not a census/i.test(item)), "crosswalk must retain the no-census boundary", errors);
  check((crosswalk.hardBoundaries ?? []).some((item) => /no population.*REG/i.test(item)), "crosswalk must retain the no-registration boundary", errors);

  if (errors.length) throw new Error("Russ taxonomy crosswalk 0.1 validation failed:\n" + errors.map((item) => "- " + item).join("\n"));
  return { releaseId: crosswalk.releaseId, populationCount: populationLabels.size, crosswalkCount: entityIds.size };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL("file://" + process.argv[1]))) {
  const report = await validateRussHarmonizedTaxonomyCrosswalk(JSON.parse(await readFile(CROSSWALK_URL, "utf8")));
  console.log("Russ taxonomy crosswalk 0.1 validation passed: " + report.releaseId + " (" + report.populationCount + " populations; " + report.crosswalkCount + " prototype mappings)");
}
