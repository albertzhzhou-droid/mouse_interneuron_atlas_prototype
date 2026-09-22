#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { createResearchMvpValidator, formatSchemaErrors } from "./validate-json-schema.mjs";
import { ROOME_TABLE_RECEIPTS } from "../tools/parse_roome_dil_workbooks.mjs";

const TAXONOMY_URL = new URL("../data/roome-dil-source-taxonomy-0.1.json", import.meta.url);
const FEATURES_URL = new URL("../data/roome-dil-differential-features-0.1.json", import.meta.url);
const TAXONOMY_SCHEMA_URL = new URL("../schemas/roome-dil-source-taxonomy-0.1.schema.json", import.meta.url);
const FEATURES_SCHEMA_URL = new URL("../schemas/roome-dil-differential-features-0.1.schema.json", import.meta.url);

const EXPECTED_FAMILY_COUNTS = Object.freeze({
  dILA1: 19,
  dILA2: 14,
  dILA3: 27,
  dILA4: 15,
  dILA5: 12,
  dILA6: 8,
  dILB1: 16,
  dILB2: 14,
  dILB3: 4,
  dILB4: 6,
  dILB5: 7,
  dILB6: 15,
});
const EXPECTED_QUARANTINE_CELLS = Object.freeze([
  "G277", "G870", "G1477", "G1856", "G2174", "G2333", "G2366", "G5798", "G7291", "G7365", "G7445", "G7728", "G7767", "G8332", "G8386", "G8560", "G8666", "G8674", "G8724", "G8877", "G10001", "G10695", "G11034", "G13457", "G13740", "G13853",
]);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

function displayCandidates(rows) {
  return rows
    .filter((row) => row.gene !== null && row.adjustedPValue <= 0.05 && row.avgLog2Fc > 0 && row.pct1 >= 0.25 && row.pct1 - row.pct2 >= 0.1)
    .map((row) => ({ ...row, prevalenceDelta: row.pct1 - row.pct2 }))
    .sort((left, right) => right.prevalenceDelta - left.prevalenceDelta || right.avgLog2Fc - left.avgLog2Fc || left.gene.localeCompare(right.gene));
}

export async function validateRoomeDilSourceTaxonomy(taxonomyOverride = null, featuresOverride = null) {
  const [taxonomyText, featuresBytes, taxonomySchema, featuresSchema] = await Promise.all([
    readFile(TAXONOMY_URL, "utf8"),
    readFile(FEATURES_URL),
    readFile(TAXONOMY_SCHEMA_URL, "utf8").then(JSON.parse),
    readFile(FEATURES_SCHEMA_URL, "utf8").then(JSON.parse),
  ]);
  const taxonomy = taxonomyOverride ?? JSON.parse(taxonomyText);
  const features = featuresOverride ?? JSON.parse(featuresBytes.toString("utf8"));
  const errors = [];

  const validateTaxonomy = createResearchMvpValidator(taxonomySchema);
  const validateFeatures = createResearchMvpValidator(featuresSchema);
  if (!validateTaxonomy(taxonomy)) errors.push(...formatSchemaErrors(validateTaxonomy.errors).map((error) => `taxonomy ${error}`));
  if (!validateFeatures(features)) errors.push(...formatSchemaErrors(validateFeatures.errors).map((error) => `features ${error}`));

  check(taxonomy.source.publication.doi === "10.1126/science.adx5781" && taxonomy.source.publication.pmcid === "PMC12879194", "primary publication identity drifted", errors);
  check(taxonomy.source.geo.superSeries === "GSE291462" && taxonomy.source.geo.scrnaSeries === "GSE291459" && taxonomy.source.geo.xeniumSeries === "GSE291460", "GEO series identity drifted", errors);
  check(taxonomy.source.code.pinnedCommit === "138d321e2c3490189efcf7a10cf9b248b506bee4" && taxonomy.source.code.license === "NOASSERTION", "code receipt or rights boundary drifted", errors);
  check(same(taxonomy.source.tables.map(({ id, bytes, md5, sha256: hash }) => ({ id, bytes, md5, sha256: hash })), Object.values(ROOME_TABLE_RECEIPTS).map(({ id, bytes, md5, sha256: hash }) => ({ id, bytes, md5, sha256: hash }))), "Table S6/S7 source receipts drifted", errors);
  check(taxonomy.source.tables.every((table) => table.sourceFileBundled === false && table.accessMode === "link_only" && table.license === "CC BY"), "supplement rights or link-only package boundary drifted", errors);

  check(taxonomy.profiles.length === 157 && new Set(taxonomy.profiles.map((profile) => profile.id)).size === 157 && new Set(taxonomy.profiles.map((profile) => profile.sourceLocalLabel)).size === 157, "exact 157-profile roster drifted", errors);
  check(taxonomy.profiles.reduce((sum, profile) => sum + profile.frequency, 0) === 61444, "refined dIL cell denominator drifted", errors);
  check(Math.abs(taxonomy.profiles.reduce((sum, profile) => sum + profile.percentOfDil, 0) - 100) < 1e-9, "profile composition no longer sums to 100", errors);
  const observedFamilyCounts = Object.fromEntries(Object.keys(EXPECTED_FAMILY_COUNTS).map((family) => [family, taxonomy.profiles.filter((profile) => profile.family === family).length]));
  check(same(observedFamilyCounts, EXPECTED_FAMILY_COUNTS), "12-family refined-type counts drifted", errors);
  check(taxonomy.familySummaries.reduce((sum, family) => sum + family.cellCount, 0) === 61444, "family cell-count denominator drifted", errors);
  check(taxonomy.scope.biologicalLitterPoolCount === 15 && taxonomy.scope.retainedTechnicalOutputCount === 29 && /must not be reported as 29 biological replicates/i.test(taxonomy.denominatorBoundary), "biological-pool versus technical-output boundary drifted", errors);

  check(features.rows.length === 15900 && new Set(features.rows.map((row) => row.cluster)).size === 159, "full Table S7 row or cluster denominator drifted", errors);
  const rowsByCluster = features.rows.reduce((groups, row) => {
    if (!groups.has(row.cluster)) groups.set(row.cluster, []);
    groups.get(row.cluster).push(row);
    return groups;
  }, new Map());
  check([...rowsByCluster.values()].every((rows) => rows.length === 100), "Table S7 must retain 100 rows per source label", errors);
  check(features.rows.filter((row) => row.gene !== null).length === 15874 && features.rows.filter((row) => row.gene === null).length === 26, "retained or quarantined gene-row denominator drifted", errors);
  check(same(features.quarantinedGeneCells.map((item) => item.sourceCell), EXPECTED_QUARANTINE_CELLS), "exact Excel-coercion quarantine cell roster drifted", errors);
  check(same(features.excludedDevelopmentalLabels, ["dILA-Immature", "dILB-Immature"]), "non-roster developmental labels drifted", errors);

  for (const profile of taxonomy.profiles) {
    const rows = rowsByCluster.get(profile.sourceLocalLabel) ?? [];
    const candidates = displayCandidates(rows);
    check(rows.length === 100, `${profile.sourceLocalLabel}: full differential rows are unavailable`, errors);
    check(candidates.length === profile.differentialFeatureAudit.positiveDisplayCandidateCount && candidates.length >= 28, `${profile.sourceLocalLabel}: display candidate denominator drifted`, errors);
    check(same(profile.displayFeatures.map((feature) => feature.sourceRow), candidates.slice(0, 6).map((feature) => feature.sourceRow)), `${profile.sourceLocalLabel}: deterministic top-six feature selection drifted`, errors);
    check(profile.displayFeatures.every((feature, index) => feature.rank === index + 1 && feature.prevalenceDelta >= 0.1), `${profile.sourceLocalLabel}: display feature rank or threshold drifted`, errors);
    check(Object.values(profile.missingEvidence).every((status) => status === "not_measured_by_study" || status === "no_admitted_transform" || status === "relationship_not_established"), `${profile.sourceLocalLabel}: unsupported evidence status`, errors);
  }

  check(taxonomy.derivation.fullFeatureEvidenceBytes === featuresBytes.byteLength && taxonomy.derivation.fullFeatureEvidenceSha256 === sha256(featuresBytes), "full differential-feature file receipt drifted", errors);
  check(taxonomy.scope.admittedGeometryCount === 0 && taxonomy.scope.admittedInternalStructureCount === 0 && taxonomy.scope.sameCellCrossModalJoinCount === 0 && taxonomy.scope.projectRegistrationCount === 0, "zero geometry, internal structure, same-cell join or registration boundary drifted", errors);
  check(taxonomy.joinPolicy.scrnaToXeniumSameCellJoin === "forbidden_no_same_cell_relationship" && taxonomy.joinPolicy.typeToMorphologyJoin === "not_established" && taxonomy.joinPolicy.typeToInternalStructureJoin === "not_established", "cross-modal join boundary drifted", errors);
  check(taxonomy.hardBoundaries.some((boundary) => /zero dendrites, axons, synapses.*organelles.*whole-cell geometry.*internal structures/i.test(boundary)), "zero morphology/internal-object hard boundary is missing", errors);
  check(taxonomy.hardBoundaries.some((boundary) => /not canonical or defining marker/i.test(boundary)), "differential-feature interpretation boundary is missing", errors);

  if (errors.length) throw new Error(`Roome dIL source taxonomy 0.1 validation failed:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  return {
    releaseId: taxonomy.releaseId,
    profileCount: taxonomy.profiles.length,
    fullFeatureRowCount: features.rows.length,
    quarantinedGeneCellCount: features.quarantinedGeneCells.length,
    admittedGeometryCount: 0,
    admittedInternalStructureCount: 0,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file://${process.argv[1]}`))) {
  try {
    const result = await validateRoomeDilSourceTaxonomy();
    console.log(`Roome dIL source taxonomy 0.1 validation passed: ${result.profileCount} profiles; ${result.fullFeatureRowCount} rows; ${result.quarantinedGeneCellCount} quarantines; 0 geometry/internal structures`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
