#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const AUDIT_PATH = path.join(ROOT, "data/neuromorpho-type-source-doi-overlap-audit-0.1.json");
export const UNIVERSE_PATH = "public/data/neuromorpho_release_8_6_124_no_age_universe_v1/universe-index.json";

const TAXONOMY_SOURCES = Object.freeze([
  { namespace: "russ-2021", label: "Russ harmonized postnatal taxonomy", taxonomyId: "russ-harmonized-taxonomy-crosswalk-0.1", path: "data/russ-harmonized-taxonomy-crosswalk-0.1.json", count: (x) => x.populations.length, doi: (x) => x.source.publication.doi },
  { namespace: "sathyamurthy-2018", label: "Sathyamurthy adult lumbar taxonomy", taxonomyId: "sathyamurthy-source-taxonomy-0.1", path: "data/sathyamurthy-source-taxonomy-0.1.json", count: (x) => x.profiles.length, doi: (x) => x.source.publication.doi },
  { namespace: "hayashi-2018:GSE108788", label: "Hayashi spinal V2a taxonomy", taxonomyId: "hayashi-v2a-source-taxonomy-0.1", path: "data/hayashi-v2a-source-taxonomy-0.1.json", count: (x) => x.profiles.length, doi: (x) => x.source.publication.doi },
  { namespace: "haring-2018:GSE103840", label: "Häring dorsal-horn taxonomy", taxonomyId: "haring-dorsal-horn-source-taxonomy-0.1", path: "data/haring-dorsal-horn-source-taxonomy-0.1.json", count: (x) => x.profiles.length, doi: (x) => x.source.publication.doi },
  { namespace: "alkaslasi-2021:GSE167597", label: "Alkaslasi cholinergic taxonomy", taxonomyId: "alkaslasi-cholinergic-source-taxonomy-0.1", path: "data/alkaslasi-cholinergic-source-taxonomy-0.1.json", count: (x) => x.profiles.length, doi: (x) => x.source.publication.doi },
  { namespace: "iglesias-gonzalez-2021:gse185731:mmusculus", label: "Iglesias-González Dmrt3/dI6 taxonomy", taxonomyId: "dmrt3-di6-source-taxonomy-0.1", path: "data/dmrt3-di6-source-taxonomy-0.1.json", count: (x) => x.profiles.length, doi: (x) => x.source.publication.doi },
  { namespace: "roome-2026:GSE291462", label: "Roome developmental dIL taxonomy", taxonomyId: "roome-dil-source-taxonomy-0.1", path: "data/roome-dil-source-taxonomy-0.1.json", count: (x) => x.profiles.length, doi: (x) => x.source.publication.doi },
  { namespace: "delile-2019:E-MTAB-7320", label: "Delile developmental taxonomy", taxonomyId: "delile-developmental-interneuron-taxonomy-0.1", path: "data/delile-developmental-interneuron-taxonomy-0.1.json", count: (x) => x.profiles.length, doi: (x) => x.source.publication.doi },
  { namespace: "crozat-2025:figshare-29430869-v2", label: "Crozat PKD2L1 functional profile", taxonomyId: "crozat-pkd2l1-functional-profile-0.1", path: "data/crozat-pkd2l1-functional-profile-0.1.json", count: () => 1, doi: (x) => x.source.publication.doi },
  { namespace: "cano-gomez-2026:GSE318731", label: "Cano-Gómez P56 multiome taxonomy", taxonomyId: "cano-gomez-p56-multiome-interneuron-registry-0.1", path: "data/cano-gomez-p56-multiome-interneuron-registry-0.1.json", count: (x) => x.profiles.length, doi: (x) => x.sourceReferences.publication.doi },
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export function normalizeDoi(value) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//, "")
    .replace(/^doi:\s*/, "")
    .replace(/[.,;\])]+$/, "");
}

async function readJson(pathValue) {
  return JSON.parse(await readFile(path.join(ROOT, pathValue), "utf8"));
}

async function inputReceipt(id, inputPath) {
  const bytes = await readFile(path.join(ROOT, inputPath));
  return { id, path: inputPath, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildNeuromorphoTypeSourceDoiOverlapAudit01() {
  const universe = await readJson(UNIVERSE_PATH);
  if (universe.repositoryRelease !== "8.6.124" || universe.summary?.queryRecordCount !== 1097
    || universe.records?.length !== 1097) throw new Error("Pinned NeuroMorpho universe identity or denominator changed");
  const sourceRows = [];
  for (const source of TAXONOMY_SOURCES) {
    const taxonomy = await readJson(source.path);
    const doi = normalizeDoi(source.doi(taxonomy));
    const profileCount = source.count(taxonomy);
    if (!doi || !Number.isInteger(profileCount) || profileCount < 1) throw new Error(`Missing exact DOI or profile count for ${source.namespace}`);
    const matchingNeuronIds = universe.records
      .filter((record) => (record.sourcePaper?.dois ?? []).some((candidate) => normalizeDoi(candidate) === doi))
      .map((record) => record.neuronId)
      .sort((left, right) => left - right);
    sourceRows.push({
      namespace: source.namespace,
      label: source.label,
      taxonomyId: source.taxonomyId,
      taxonomyPath: source.path,
      sourceProfileCount: profileCount,
      sourcePublicationDoi: doi,
      comparison: "exact_normalized_doi_match_to_neuromorpho_source_paper_metadata",
      matchedNeuronIds: matchingNeuronIds,
      matchedRecordCount: matchingNeuronIds.length,
      interpretation: "publication_level_metadata_overlap_only_not_profile_or_same_cell_identity",
    });
  }
  if (sourceRows.reduce((total, row) => total + row.sourceProfileCount, 0) !== 387) throw new Error("Taxonomy source-profile total differs from the current 387-profile registry");
  const inputReceipts = [
    await inputReceipt("neuromorpho8124UniverseIndex", UNIVERSE_PATH),
    ...await Promise.all(TAXONOMY_SOURCES.map((source) => inputReceipt(source.namespace, source.path))),
  ];
  const exactDoiMatchedRecordCount = sourceRows.reduce((total, row) => total + row.matchedRecordCount, 0);
  return {
    documentType: "neuromorpho_type_source_doi_overlap_audit",
    schemaVersion: "0.1.0",
    auditId: "neuromorpho-type-source-doi-overlap-audit-0.1",
    snapshotDate: universe.snapshotDate,
    morphologyUniverse: {
      repository: "NeuroMorpho.Org",
      release: universe.repositoryRelease,
      assetSetId: universe.assetSetId,
      queryRecordCount: universe.records.length,
      query: universe.query,
      indexPath: UNIVERSE_PATH,
      exactDoiField: "records[].sourcePaper.dois",
    },
    method: {
      operation: "Exact normalized DOI equality between each source taxonomy publication and each NeuroMorpho source-paper DOI field.",
      normalization: "Trim whitespace; lowercase; remove doi.org URL or doi: prefix; strip trailing citation punctuation.",
      profileCoverage: "Each selected profile is represented by its source namespace; the source study's DOI is used for the publication-level check.",
      noPayloadDownload: true,
    },
    summary: {
      taxonomySourceCount: sourceRows.length,
      sourceProfileCount: sourceRows.reduce((total, row) => total + row.sourceProfileCount, 0),
      exactDoiMatchedTaxonomySourceCount: sourceRows.filter((row) => row.matchedRecordCount > 0).length,
      exactDoiMatchedRecordCount,
      identityJoins: 0,
      geometryObjectsAdmitted: 0,
      internalStructureObjectsAdmitted: 0,
      registrations: 0,
      measurements: 0,
      payloadBytesDownloaded: 0,
    },
    rows: sourceRows,
    inputReceipts,
    scientificBoundaries: [
      "A DOI overlap is a publication-level metadata relation only; it does not establish a matching profile, subtype, specimen, cell, or geometry.",
      "Zero DOI overlap is limited to the pinned 1,097-record NeuroMorpho 8.6.124 query and the ten listed taxonomy source publications; it does not establish that morphology is absent from other archives, papers, or records with incomplete citation metadata.",
      "No morphology geometry, same-cell identity, cross-source join, registration, measurement, or new biological denominator is admitted by this audit.",
    ],
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildNeuromorphoTypeSourceDoiOverlapAudit01()
    .then(async (audit) => {
      if (process.argv.includes("--write")) await writeFile(AUDIT_PATH, `${JSON.stringify(audit, null, 2)}\n`);
      process.stdout.write(`${JSON.stringify({ auditId: audit.auditId, release: audit.morphologyUniverse.release, queryRecordCount: audit.morphologyUniverse.queryRecordCount, taxonomySourceCount: audit.summary.taxonomySourceCount, sourceProfileCount: audit.summary.sourceProfileCount, exactDoiMatchedTaxonomySourceCount: audit.summary.exactDoiMatchedTaxonomySourceCount, exactDoiMatchedRecordCount: audit.summary.exactDoiMatchedRecordCount, geometryObjectsAdmitted: audit.summary.geometryObjectsAdmitted })}\n`);
    })
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
