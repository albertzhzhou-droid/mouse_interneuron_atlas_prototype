#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import Ajv2020 from "ajv/dist/2020.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const TAXONOMY_PATH = "data/kelly-zebrafish-spinal-interneuron-taxonomy-0.1.json";
export const TAXONOMY_SCHEMA_PATH = "schemas/kelly-zebrafish-spinal-interneuron-taxonomy-0.1.schema.json";
const EXPECTED_LABELS = ["DoLA", "CoLo", "v1", "v2b", "v2s", "dl1", "dl2", "v2a", "v0v", "v0c"];

function check(condition, message) {
  if (!condition) throw new Error(message);
}

export function validateKellyZebrafishTaxonomy(taxonomy, schema) {
  const validator = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
  if (!validator(taxonomy)) {
    throw new Error(`Kelly zebrafish taxonomy schema violation: ${validator.errors?.map((error) => `${error.instancePath || "/"} ${error.message}`).join("; ")}`);
  }

  check(taxonomy.source.sourceId === "SRC-KELLY-ZEBRAFISH-2023"
    && taxonomy.source.datasetId === "GSE232801"
    && taxonomy.source.species === "Danio rerio"
    && taxonomy.source.taxonId === "NCBITaxon:7955"
    && taxonomy.source.lifeStage === "4 dpf larva"
    && taxonomy.source.region === "spinal cord", "Kelly taxonomy species, dataset or scope changed");
  check(taxonomy.source.article.doi === "10.7554/eLife.89338"
    && taxonomy.source.article.reviewedStatus === "peer_reviewed_article"
    && taxonomy.source.geo.spinalNeuronSamples.map((sample) => sample.accession).join(",") === "GSM7383490,GSM7383491", "Kelly article or spinal sample source locators changed");

  const sampling = taxonomy.samplingAndAssignment;
  check(sampling.reportedSequencingReplicateCount === 2
    && sampling.reportedIntegratedPostQcSpinalCellCount === 11762
    && sampling.reportedAllSpinalNeuronClusterCount === 33
    && sampling.reportedConfidentlyAssignedClusterCount === 22
    && sampling.reportedCombinationCodeTableRowCount === 13
    && sampling.includedInterneuronLabelCount === taxonomy.populations.length, "Kelly study denominators drifted");
  check(sampling.animalDenominator.value === null
    && sampling.animalDenominator.status === "source_report_conflict"
    && sampling.cellRoster.exactBarcodeToInterneuronLabelMapVerified === false, "Conflicting animal denominator or unverified cell roster was promoted");
  check(taxonomy.source.geo.integratedNeuronalObject.downloaded === false
    && taxonomy.source.geo.integratedNeuronalObject.exactBytes === null
    && taxonomy.source.geo.integratedNeuronalObject.sha256 === null
    && taxonomy.source.geo.integratedNeuronalObject.redistributionStatus === "not_assessed_link_only", "Uninspected GEO RDS gained download, integrity or redistribution claims");

  const labels = taxonomy.populations.map((population) => population.sourceLabel);
  check(new Set(labels).size === labels.length && JSON.stringify(labels) === JSON.stringify(EXPECTED_LABELS), "Kelly source-reported interneuron label roster changed");
  const byLabel = new Map(taxonomy.populations.map((population) => [population.sourceLabel, population]));
  check(byLabel.get("CoLo").combinationCodeMarkers.join(",") === "chga"
    && byLabel.get("v2a").subtypeEvidence.length === 2
    && byLabel.get("v0c").filterClass === "mixed"
    && byLabel.get("v0c").transmitterLabel === "glutamate/acetylcholine", "Kelly marker, subtype or mixed-transmitter source evidence changed");
  check(JSON.stringify(taxonomy.excludedSourceLabels.map((item) => item.sourceLabel)) === JSON.stringify(["KA", "RB", "Mns"]), "Sensory and motor exclusions changed");
  check(JSON.stringify(taxonomy.unassignedOrAmbiguousEvidence.mixedNeuronGliaClusters) === JSON.stringify([6, 11, 17])
    && taxonomy.unassignedOrAmbiguousEvidence.unidentifiedMentionedTypes.join(",") === "v3,v0d", "Ambiguous and unidentified cluster boundaries changed");

  const authority = taxonomy.modelingAuthority;
  for (const key of ["cellGeometry", "internalStructures", "sameCellMorphologyLinks", "mouseTypeEquivalences", "atlasRegistrations"]) {
    check(authority[key] === 0, `Kelly taxonomy cannot create ${key}`);
  }
  check(authority.animalPrevalenceEstimate === false, "Kelly taxonomy cannot imply prevalence");
  return { releaseId: taxonomy.releaseId, populationCount: taxonomy.populations.length, labelCount: labels.length, geometryCount: authority.cellGeometry, internalStructureCount: authority.internalStructures };
}

export async function loadAndValidateKellyZebrafishTaxonomy() {
  const [taxonomy, schema] = await Promise.all([
    readFile(path.join(ROOT, TAXONOMY_PATH), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, TAXONOMY_SCHEMA_PATH), "utf8").then(JSON.parse),
  ]);
  return { taxonomy, summary: validateKellyZebrafishTaxonomy(taxonomy, schema) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  loadAndValidateKellyZebrafishTaxonomy()
    .then(({ summary }) => process.stdout.write(`${JSON.stringify(summary)}\n`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
