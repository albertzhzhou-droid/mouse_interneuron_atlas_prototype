#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const AUDIT_PATH_233 = "data/ginty-neuromorpho-strain-facet-audit-0.1.json";
export const UNIVERSE_INDEX_PATH_233 = "public/data/neuromorpho_release_8_6_124_no_age_universe_v1/universe-index.json";
export const UNIVERSE_CONTRACT_PATH_233 = "data/neuromorpho-no-age-query-universe-0.1.json";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const check = (condition, message) => { if (!condition) throw new Error(message); };

export function buildGintyNeuroMorphoStrainFacetAudit(index, contract, indexBytes, contractBytes) {
  check(indexBytes.byteLength === contract.dataset.indexBytes
    && sha256(indexBytes) === contract.dataset.indexSha256, "The 8.6.124 no-age index does not match its retained byte/hash contract");
  check(index.summary?.queryRecordCount === 1097 && index.records?.length === 1097
    && contract.summary.queryRecordCount === 1097, "The source universe must remain the exact 1,097-record query");

  const doi = "10.1016/j.cell.2016.12.010";
  const records = index.records.filter((record) => record.sourcePaper.dois.includes(doi));
  check(records.every((record) => record.officialMetadata.archive === "Ginty"
    && record.normalizedMetadata.species === "mouse"
    && record.normalizedMetadata.brainRegion.includes("spinal cord")
    && record.normalizedMetadata.cellType.includes("interneuron")), "Paper-linked records exceed the pinned mouse spinal interneuron query scope");

  const sourceStrainCounts = new Map();
  const sourceStrainIds = new Map();
  const sourceClassCounts = new Map();
  const dimensions = new Map();
  const domains = new Map();
  const integrity = new Map();
  const swcHashes = new Set();
  const neuronIds = new Set();
  let diameterAvailableCount = 0;
  for (const record of records) {
    check(Number.isSafeInteger(record.neuronId) && !neuronIds.has(record.neuronId), "Duplicate or invalid NeuroMorpho record ID in the Ginty paper-linked roster");
    neuronIds.add(record.neuronId);
    check(record.sourceObject.status === "admitted" && /^[a-f0-9]{64}$/.test(record.sourceObject.rawSwcSha256 ?? ""), "Ginty source object is not admitted with an indexed SWC SHA-256 receipt");
    check(!swcHashes.has(record.sourceObject.rawSwcSha256), "Duplicate indexed SWC hash in the Ginty paper-linked roster");
    swcHashes.add(record.sourceObject.rawSwcSha256);

    const label = record.officialMetadata.strain;
    check(typeof label === "string" && label.length > 0, "An exact raw source strain label is missing from a paper-linked Ginty record");
    sourceStrainCounts.set(label, (sourceStrainCounts.get(label) ?? 0) + 1);
    if (!sourceStrainIds.has(label)) sourceStrainIds.set(label, []);
    sourceStrainIds.get(label).push(record.neuronId);

    const sourceClass = record.officialMetadata.cell_type.find((value) => value === "Excitatory" || value === "Inhibitory") ?? "Not reported";
    sourceClassCounts.set(sourceClass, (sourceClassCounts.get(sourceClass) ?? 0) + 1);
    const dimension = record.normalizedMetadata.dimensionality;
    dimensions.set(dimension, (dimensions.get(dimension) ?? 0) + 1);
    const domain = record.normalizedMetadata.domain;
    domains.set(domain, (domains.get(domain) ?? 0) + 1);
    const tier = record.normalizedMetadata.physicalIntegrity;
    integrity.set(tier, (integrity.get(tier) ?? 0) + 1);
    if (record.normalizedMetadata.sourceDiameterAvailable) diameterAvailableCount += 1;
  }

  const strainRows = [...sourceStrainCounts.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([sourceStrainLabel, recordCount]) => ({
    sourceStrainLabel,
    recordCount,
    neuronIds: sourceStrainIds.get(sourceStrainLabel).toSorted((left, right) => left - right),
  }));
  const groupCounts = (map) => [...map.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([sourceValue, recordCount]) => ({ sourceValue, recordCount }));
  return {
    schemaVersion: "0.1.0",
    auditId: "ginty-neuromorpho-strain-facet-audit-0.1",
    releaseId: "ohri-ginty-neuromorpho-strain-facet-audit-0.1.0",
    observedDate: "2026-09-23",
    repositoryRelease: "8.6.124",
    sourceUniverse: {
      contractPath: UNIVERSE_CONTRACT_PATH_233,
      contractSha256: sha256(contractBytes),
      indexPath: UNIVERSE_INDEX_PATH_233,
      indexBytes: indexBytes.byteLength,
      indexSha256: sha256(indexBytes),
      indexQueryRecordCount: index.records.length,
      geometryCopyCount: 0,
      repositoryQuery: "species:mouse; brain_region:spinal cord; cell_type:interneuron; no age filter",
    },
    selection: {
      paperDoi: doi,
      archive: "Ginty",
      exactSourceFields: ["officialMetadata.strain", "officialMetadata.cell_type", "normalizedMetadata.dimensionality", "normalizedMetadata.domain", "normalizedMetadata.physicalIntegrity"],
    },
    repositoryRoster: {
      recordCount: records.length,
      uniqueNeuronIdCount: neuronIds.size,
      uniqueIndexedSwcSha256Count: swcHashes.size,
      rawSwcBytesRehashedInThisAudit: false,
      sourceStrainLabelCount: strainRows.length,
      sourceStrainGroups: strainRows,
      sourceCellClassCounts: groupCounts(sourceClassCounts),
      dimensionalityCounts: groupCounts(dimensions),
      sourceDomainCounts: groupCounts(domains),
      sourceIntegrityCounts: groupCounts(integrity),
      diameterAvailableRecordCount: diameterAvailableCount,
      sourceAxonReconstructionCount: records.filter((record) => record.normalizedMetadata.domain.includes("Axon")
        && !record.normalizedMetadata.domain.includes("No Axon")).length,
      indexedDuplicateNeuronIdCount: records.length - neuronIds.size,
      indexedDuplicateSwcSha256Count: records.length - swcHashes.size,
    },
    paperScopeReconciliation: {
      sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5236062/",
      distinctReportedMorphologyAnalysisCounts: [
        { count: 305, scope: "unbiased genetic-labelling morphology assessment in the main text", rosterCrosswalk: false },
        { count: 351, scope: "subtype-focused morphology analysis described for Figures 3 and 4", rosterCrosswalk: false },
      ],
      exactRepositoryRecordToPaperFigureCrosswalk: false,
      independentAnimalDenominator: false,
      paperAnalysisMembershipReconciled: false,
      status: "repository-roster-counted; paper-analysis membership unresolved",
      interpretation: "The 650 exact NeuroMorpho repository records are not substituted for either paper-reported analysis count. Distinct paper passages describe different morphology-analysis scopes; the deposited record IDs do not provide a verified per-figure or per-animal crosswalk.",
    },
    representationBoundary: {
      sourceStrainValuesAreCanonicalSubtypeIds: false,
      repositoryRecordsAreSubtypePrevalence: false,
      representativeOrMeanNeuronCreated: false,
      molecularProfileJoinCount: 0,
      sameCellJoinCount: 0,
      atlasRegistrationCount: 0,
      internalStructurePrimitiveCount: 0,
      surfacesAdmittedByThisAudit: 0,
      axonsAddedOrRepaired: 0,
      use: "Exact raw source strain is a faceting field. Only a selected checksum-gated individual SWC may be shown in its own source-local frame; group membership does not generate a mean cell, a canonical type, or a link to another molecular profile.",
    },
    references: [
      { label: "NeuroMorpho.Org API reference", url: "https://neuromorpho.org/apiReference.html" },
      { label: "NeuroMorpho NMO_75265 source record", url: "https://neuromorpho.org/neuron_info.jsp?neuron_name=RorBCreER-261-04-B_1" },
      { label: "Abraira et al. 2017, full text", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5236062/" },
      { label: "NeuroMorpho terms of use", url: "https://neuromorpho.org/useterm.jsp" },
    ],
  };
}

export async function buildGintyNeuroMorphoStrainFacetAuditFromDisk() {
  const [indexBytes, contractBytes] = await Promise.all([
    readFile(path.join(ROOT, UNIVERSE_INDEX_PATH_233)),
    readFile(path.join(ROOT, UNIVERSE_CONTRACT_PATH_233)),
  ]);
  const [index, contract] = [JSON.parse(indexBytes), JSON.parse(contractBytes)];
  return buildGintyNeuroMorphoStrainFacetAudit(index, contract, indexBytes, contractBytes);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildGintyNeuroMorphoStrainFacetAuditFromDisk()
    .then(async (audit) => {
      const bytes = Buffer.from(`${JSON.stringify(audit, null, 2)}\n`);
      if (process.argv.includes("--write")) await writeFile(path.join(ROOT, AUDIT_PATH_233), bytes);
      process.stdout.write(`${JSON.stringify({ auditId: audit.auditId, recordCount: audit.repositoryRoster.recordCount, strainLabelCount: audit.repositoryRoster.sourceStrainLabelCount, bytes: bytes.byteLength, sha256: sha256(bytes) })}\n`);
    })
    .catch((error) => { console.error(error.message); process.exitCode = 1; });
}
