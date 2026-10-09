#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildGintyNeuroMorphoStrainFacetAuditFromDisk } from "../tools/build_ginty_neuromorpho_strain_facet_audit_0_1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const AUDIT_PATH_233 = "data/ginty-neuromorpho-strain-facet-audit-0.1.json";
export const SCHEMA_PATH_233 = "schemas/ginty-neuromorpho-strain-facet-audit-0.1.schema.json";

export function validateGintyNeuroMorphoStrainFacetAudit(audit, schema, rebuilt) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(audit)) throw new Error(`Ginty strain-facet schema violation: ${validate.errors?.map((item) => `${item.instancePath || "/"} ${item.message}`).join("; ")}`);
  if (JSON.stringify(audit) !== JSON.stringify(rebuilt)) throw new Error("Ginty strain-facet audit differs from the verified 8.6.124 universe-index rebuild");
  const roster = audit.repositoryRoster;
  if (roster.recordCount !== 650 || roster.uniqueNeuronIdCount !== 650 || roster.uniqueIndexedSwcSha256Count !== 650
    || roster.sourceCellClassCounts.find((row) => row.sourceValue === "Excitatory")?.recordCount !== 208
    || roster.sourceCellClassCounts.find((row) => row.sourceValue === "Inhibitory")?.recordCount !== 442
    || roster.dimensionalityCounts.find((row) => row.sourceValue === "3D")?.recordCount !== 640
    || roster.dimensionalityCounts.find((row) => row.sourceValue === "2D")?.recordCount !== 10
    || roster.sourceAxonReconstructionCount !== 0
    || roster.indexedDuplicateNeuronIdCount !== 0 || roster.indexedDuplicateSwcSha256Count !== 0) {
    throw new Error("Ginty source-label or exact repository-record counts changed");
  }
  if (audit.paperScopeReconciliation.paperAnalysisMembershipReconciled !== false
    || audit.paperScopeReconciliation.exactRepositoryRecordToPaperFigureCrosswalk !== false
    || audit.representationBoundary.representativeOrMeanNeuronCreated !== false
    || audit.representationBoundary.molecularProfileJoinCount !== 0
    || audit.representationBoundary.internalStructurePrimitiveCount !== 0) throw new Error("Ginty roster audit crossed an unresolved paper, geometry, or identity boundary");
  return {
    auditId: audit.auditId,
    repositoryRecords: roster.recordCount,
    exactRawStrainLabels: roster.sourceStrainLabelCount,
    sourceClassCounts: Object.fromEntries(roster.sourceCellClassCounts.map((row) => [row.sourceValue, row.recordCount])),
    dimensionalityCounts: Object.fromEntries(roster.dimensionalityCounts.map((row) => [row.sourceValue, row.recordCount])),
    paperAnalysisMembershipReconciled: false,
    internalStructurePrimitiveCount: audit.representationBoundary.internalStructurePrimitiveCount,
  };
}

export async function loadAndValidateGintyNeuroMorphoStrainFacetAudit() {
  const [audit, schema, rebuilt] = await Promise.all([
    readFile(path.join(ROOT, AUDIT_PATH_233), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, SCHEMA_PATH_233), "utf8").then(JSON.parse),
    buildGintyNeuroMorphoStrainFacetAuditFromDisk(),
  ]);
  return { audit, summary: validateGintyNeuroMorphoStrainFacetAudit(audit, schema, rebuilt) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  loadAndValidateGintyNeuroMorphoStrainFacetAudit()
    .then(({ summary }) => process.stdout.write(`${JSON.stringify(summary)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
