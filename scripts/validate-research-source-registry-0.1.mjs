#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { validateCanoGomezP56MultiomeInterneuronRegistryPackage } from "./validate-cano-gomez-p56-multiome-interneuron-registry-0.1.mjs";

import { validateResearchSourceExtensions243 } from "./validate-research-source-extensions-2.43.mjs";
import { validateGarciaRamirezSourceRegistryRelationship } from "./validate-garcia-ramirez-source-registry-0.1.mjs";
import { validateCrozatNaVSourceRegistryRelationship, validatePersistedCrozatNaVSourceRegistryRelationship } from "./validate-crozat-nav-inhibition-source-registry-0.1.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_PATH = path.join(PROJECT_ROOT, "data/research-source-registry-0.1.json");
const UPGRADE_REGISTRY_PATH = path.join(PROJECT_ROOT, "data/research-model-upgrade-registry-0.1.json");
export const CANO_GOMEZ_DATA_DIRECTORY = "public/data/cano_gomez_p56_multiome_interneuron_v1";
export const CANO_GOMEZ_REGISTRY_PATH = `${CANO_GOMEZ_DATA_DIRECTORY}/cano-gomez-p56-multiome-interneuron-registry-0.1.json`;

const CANO_GOMEZ_SOURCE_OBJECTS = Object.freeze([
  Object.freeze({
    objectId: "cholinergic",
    sourceFileName: "GSE318731_P56_cholinergic_multiome.rds",
    publicUrl: "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE318nnn/GSE318731/suppl/GSE318731_P56_cholinergic_multiome.rds",
    sourceRdsBytes: 127862795,
    nucleusCount: 3199,
    sourceScopedGroupCount: 5,
  }),
  Object.freeze({
    objectId: "gabaergic",
    sourceFileName: "GSE318731_P56_gabaergic_multiome.rds",
    publicUrl: "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE318nnn/GSE318731/suppl/GSE318731_P56_gabaergic_multiome.rds",
    sourceRdsBytes: 1646402816,
    nucleusCount: 73364,
    sourceScopedGroupCount: 24,
  }),
  Object.freeze({
    objectId: "glutamatergic",
    sourceFileName: "GSE318731_P56_glutamatergic_multiome_UPDATE.rds",
    publicUrl: "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE318nnn/GSE318731/suppl/GSE318731_P56_glutamatergic_multiome_UPDATE.rds",
    sourceRdsBytes: 1832005077,
    nucleusCount: 92782,
    sourceScopedGroupCount: 28,
  }),
]);

const CANO_GOMEZ_CONFIRMED_PROFILES = Object.freeze([
  Object.freeze(["CHOL_IN_Best3_Htr1b", 146]),
  Object.freeze(["CHOL_IN_Best3_Slc9a3", 119]),
  Object.freeze(["CHOL_IN_Galr1_Ccdc3", 150]),
  Object.freeze(["CHOL_IN_Galr1_P2rx5", 66]),
  Object.freeze(["CHOL_IN_Galr1_Rasgrp1", 20]),
  Object.freeze(["CHOL_IN_Nr5a2_Cdh23", 78]),
  Object.freeze(["CHOL_IN_Nr5a2_Rxfp2", 82]),
  Object.freeze(["CHOL_IN_Pde5a_Piezo2", 100]),
  Object.freeze(["CHOL_IN_Pitx2_ Srpx2", 74]),
  Object.freeze(["CHOL_IN_Pitx2_Eya1", 35]),
  Object.freeze(["CHOL_IN_Pitx2_Skor2", 53]),
]);

export const EXPECTED_RESEARCH_SOURCE_IDS = Object.freeze([
  "SRC-ALLEN-CORD-20UM-3",
  "SRC-NEUROMORPHO-8-6-124",
  "SRC-NEUROMORPHO-8-6-126-TODD-NTS",
  "SRC-SPINALJ-MKC37W4RRV-1",
  "SRC-CANOGOMEZ-2026",
  "SRC-RUSS-2021",
  "SRC-STARMAP-PLUS-2023",
  "SRC-TABULAE-PARALYTICA-2024",
  "SRC-HARING-2018",
  "SRC-SATHYAMURTHY-2018",
  "SRC-HAYASHI-2018",
  "SRC-ALKASLASI-2021",
  "SRC-DELILE-2019",
  "SRC-MATSON-2022",
  "SRC-COURTINE-2008",
  "SRC-BUI-2016",
  "SRC-CHEN-2018-KCC2",
  "SRC-BERTELS-2022",
  "SRC-KATHE-2022",
  "SRC-LIN-2019",
  "SRC-JENSEN-2024",
  "SRC-MICRONS-PHASE1-V185-4",
  "SRC-SUPERCLEM-GLYR-17816747-V1",
  "SRC-OPENORGANELLE-JRC-MUS-HIPPOCAMPUS-1",
  "SRC-RONZANO-2022-81976",
  "SRC-IGLESIAS-GONZALEZ-2021",
  "SRC-ROOME-2026",
  "SRC-CROZAT-2025",
  "SRC-KELLY-ZEBRAFISH-2023",
  "SRC-SVARA-2018-SBEM",
  "SRC-BANC-V888-IN14A018",
  "SRC-GARCIA-RAMIREZ-2022",
]);

const REQUIRED_ALIAS_TO_SOURCE = Object.freeze({
  "PDS-BRAINGLOBE-ATLAS": "SRC-ALLEN-CORD-20UM-3",
  "PDS-NEUROMORPHO-SWC": "SRC-NEUROMORPHO-8-6-124",
  "NeuroMorpho.Org release 8.6.126 Todd NTS additions": "SRC-NEUROMORPHO-8-6-126-TODD-NTS",
  "neuromorpho:8.6.126:Todd-NTS": "SRC-NEUROMORPHO-8-6-126-TODD-NTS",
  "PDS-SPINALJ-PROCESSED": "SRC-SPINALJ-MKC37W4RRV-1",
  "PDS-CANOGOMEZ-2026": "SRC-CANOGOMEZ-2026",
  "PDS-RUSS-2021": "SRC-RUSS-2021",
  "russ-2021": "SRC-RUSS-2021",
  "PDS-STARMAP-PLUS-2023": "SRC-STARMAP-PLUS-2023",
  "PDS-TABULAE-PARALYTICA": "SRC-TABULAE-PARALYTICA-2024",
  "tabulae-paralytica-2024": "SRC-TABULAE-PARALYTICA-2024",
  "haring-2018": "SRC-HARING-2018",
  "sathyamurthy-2018": "SRC-SATHYAMURTHY-2018",
  "hayashi-2018": "SRC-HAYASHI-2018",
  "hayashi-2018:GSE108788": "SRC-HAYASHI-2018",
  "alkaslasi-2021": "SRC-ALKASLASI-2021",
  "alkaslasi-2021:GSE167597": "SRC-ALKASLASI-2021",
  "GSE167597": "SRC-ALKASLASI-2021",
  "delile-2019": "SRC-DELILE-2019",
  "delile-2019:E-MTAB-7320": "SRC-DELILE-2019",
  "E-MTAB-7320": "SRC-DELILE-2019",
  "matson-2022-gse172167": "SRC-MATSON-2022",
  "SRC-P02": "SRC-COURTINE-2008",
  "SRC-P03": "SRC-BUI-2016",
  "SRC-P05": "SRC-CHEN-2018-KCC2",
  "SRC-P08": "SRC-BERTELS-2022",
  "SRC-P09": "SRC-KATHE-2022",
  "SRC-P14": "SRC-LIN-2019",
  "SRC-P16": "SRC-JENSEN-2024",
  "MICRONS_PHASE1_V185_4": "SRC-MICRONS-PHASE1-V185-4",
  "SUPERCLEM_GLYR_17816747_V1": "SRC-SUPERCLEM-GLYR-17816747-V1",
  "OPENORGANELLE_JRC_MUS_HIPPOCAMPUS_1": "SRC-OPENORGANELLE-JRC-MUS-HIPPOCAMPUS-1",
  "ronzano-2022-e81976": "SRC-RONZANO-2022-81976",
  "eLife-81976": "SRC-RONZANO-2022-81976",
  "iglesias-gonzalez-2021:gse185731:mmusculus": "SRC-IGLESIAS-GONZALEZ-2021",
  "GSE185731": "SRC-IGLESIAS-GONZALEZ-2021",
  "roome-2026": "SRC-ROOME-2026",
  "roome-2026:GSE291462": "SRC-ROOME-2026",
  "GSE291462": "SRC-ROOME-2026",
  "GSE291459": "SRC-ROOME-2026",
  "GSE291460": "SRC-ROOME-2026",
  "crozat-2025:figshare-29430869-v2": "SRC-CROZAT-2025",
  "Figshare:29430869.v2": "SRC-CROZAT-2025",
  "kelly-zebrafish-2023": "SRC-KELLY-ZEBRAFISH-2023",
  "kelly-2023:GSE232801": "SRC-KELLY-ZEBRAFISH-2023",
  "GSE232801": "SRC-KELLY-ZEBRAFISH-2023",
  "svara-2018": "SRC-SVARA-2018-SBEM",
  "Svara et al. 2018 larval zebrafish spinal SBEM": "SRC-SVARA-2018-SBEM",
  "10.1016/j.celrep.2018.05.023": "SRC-SVARA-2018-SBEM",
  "banc-v888-in14a018": "SRC-BANC-V888-IN14A018",
  "BANC v888 root 720575941350424112": "SRC-BANC-V888-IN14A018",
});

const EXPECTED_RECORD_SET_COUNTS = Object.freeze({
  "RS-ALLEN-DIRECT-LABELS": 73,
  "RS-NEUROMORPHO-RECONSTRUCTIONS": 142,
  "RS-NEUROMORPHO-DORSAL-HORN-ROUTE-PACK": 5,
  "RS-NEUROMORPHO-FUNCTIONAL-CLASS-ROUTE-PACK": 2,
  "RS-NEUROMORPHO-PRP-DORSAL-HORN-ROUTE-PACK": 2,
  "RS-NEUROMORPHO-PREMOTOR-COMPARISON-ROUTE-PACK": 1,
  "RS-NEUROMORPHO-NATIVE-CONTOUR-ADMISSION-CATALOG": 5,
  "RS-NEUROMORPHO-8-6-126-TODD-NTS-ROUTES": 30,
  "RS-RUSS-POPULATIONS": 69,
  "RS-HARING-FINAL-TYPES": 30,
  "RS-SATHYAMURTHY-CLUSTERS": 43,
  "RS-HAYASHI-CLUSTERS": 11,
  "RS-ALKASLASI-INTERNEURON-CLUSTERS": 8,
  "RS-MATSON-NEURONAL-POPULATIONS": 17,
  "RS-SUPERCLEM-EXACT-SLICE": 1,
  "RS-RONZANO-PREMOTOR-POSITIONS": 31878,
  "RS-DMRT3-DI6-M1-M6-GROUPS": 6,
  "RS-ROOME-REFINED-DIL-TYPES": 157,
  "RS-CROZAT-PKD2L1-FUNCTIONAL-PROFILE": 1,
  "RS-DELILE-FINE-SUBTYPES": 51,
  "RS-CANOGOMEZ-P56-CONFIRMED-INTERNEURON-PROFILES": 11,
  "RS-KELLY-GSE232801-ARTICLE-REPORTED-INTERNEURON-LABELS": 10,
  "RS-SVARA-CID-2018-RECONSTRUCTIONS": 39,
  "RS-SVARA-COBL-2018-RECONSTRUCTIONS": 34,
  "RS-BANC-V888-IN14A018-MORPHOLOGY": 1,
});

const ALLOWED_SOURCE_KINDS = new Set([
  "reference_atlas",
  "repository_release",
  "dataset",
  "multimodal_resource",
  "taxonomy_study",
  "sci_study",
  "cross_region_reference",
  "synapse_dataset",
]);

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function validateCountReceipt(receipt, label) {
  check(isRecord(receipt), `${label} must be an object`);
  check(receipt.value === null || (Number.isInteger(receipt.value) && receipt.value >= 0), `${label}.value must be a non-negative integer or null`);
  check(nonEmpty(receipt.unit), `${label}.unit is required`);
  check(nonEmpty(receipt.scope), `${label}.scope is required`);
  check(nonEmpty(receipt.authority), `${label}.authority is required`);
  if (receipt.value === null) {
    check(nonEmpty(receipt.missingReason), `${label} needs missingReason when value is null`);
  } else {
    check(receipt.missingReason === null, `${label}.missingReason must be null when value is present`);
  }
}

function validateProjectPath(value, label) {
  check(nonEmpty(value), `${label} is required`);
  check(!path.isAbsolute(value), `${label} must be project-relative`);
  const resolved = path.resolve(PROJECT_ROOT, value);
  check(resolved.startsWith(`${PROJECT_ROOT}${path.sep}`), `${label} escapes the project root`);
}

function validateSource(source, canonicalIds, aliases, recordSetIds, assetIds) {
  check(isRecord(source), "Every source must be an object");
  check(/^SRC-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(source.id), `Invalid canonical source id: ${source.id}`);
  check(!canonicalIds.has(source.id), `Duplicate canonical source id: ${source.id}`);
  canonicalIds.add(source.id);
  check(ALLOWED_SOURCE_KINDS.has(source.sourceKind), `${source.id} has invalid sourceKind`);
  for (const field of ["title", "shortLabel"]) check(nonEmpty(source[field]), `${source.id}.${field} is required`);

  check(Array.isArray(source.aliases) && source.aliases.length > 0, `${source.id}.aliases must be non-empty`);
  for (const alias of source.aliases) {
    check(nonEmpty(alias), `${source.id} has an empty alias`);
    check(alias !== source.id, `${source.id} repeats its canonical id as an alias`);
    check(!aliases.has(alias), `Legacy source alias is ambiguous: ${alias}`);
    aliases.set(alias, source.id);
  }

  check(isRecord(source.citation), `${source.id}.citation is required`);
  check(nonEmpty(source.citation.text), `${source.id}.citation.text is required`);
  check(/^10\.[0-9]{4,9}\/.+/.test(source.citation.doi), `${source.id}.citation.doi is invalid`);
  check(/^https:\/\//.test(source.citation.articleUrl), `${source.id}.citation.articleUrl must use https`);
  check(Array.isArray(source.accessions), `${source.id}.accessions must be an array`);

  check(Array.isArray(source.speciesScopes) && source.speciesScopes.length > 0, `${source.id}.speciesScopes must be non-empty`);
  for (const scope of source.speciesScopes) {
    check(nonEmpty(scope.scientificName) && /^NCBITaxon:[1-9][0-9]*$/.test(scope.taxonId), `${source.id} has invalid species scope`);
    check(nonEmpty(scope.context) && nonEmpty(scope.authority), `${source.id} species scope needs context and authority`);
  }

  check(Array.isArray(source.lifeStageScopes) && source.lifeStageScopes.length > 0, `${source.id}.lifeStageScopes must be non-empty`);
  for (const scope of source.lifeStageScopes) {
    check(scope.value === null || nonEmpty(scope.value), `${source.id} has invalid life-stage value`);
    check(nonEmpty(scope.context) && nonEmpty(scope.authority), `${source.id} life-stage scope needs context and authority`);
    if (scope.value === null) check(nonEmpty(scope.missingReason), `${source.id} null life stage needs missingReason`);
    else check(scope.missingReason === null, `${source.id} known life stage must have null missingReason`);
  }

  check(Array.isArray(source.regionScopes) && source.regionScopes.length > 0, `${source.id}.regionScopes must be non-empty`);
  for (const scope of source.regionScopes) {
    check(nonEmpty(scope.value) && nonEmpty(scope.context) && nonEmpty(scope.authority), `${source.id} has invalid region scope`);
  }
  for (const field of ["conditionScopes", "modalities", "researchLanes", "linkedUpgradeIds", "missingness"]) {
    check(Array.isArray(source[field]) && source[field].length > 0, `${source.id}.${field} must be non-empty`);
  }

  check(Array.isArray(source.experimentalUnits) && source.experimentalUnits.length > 0, `${source.id}.experimentalUnits must be non-empty`);
  for (const [index, unit] of source.experimentalUnits.entries()) {
    check(nonEmpty(unit.unit) && nonEmpty(unit.scope) && nonEmpty(unit.authority), `${source.id}.experimentalUnits[${index}] is invalid`);
    check(unit.count === null || (Number.isInteger(unit.count) && unit.count >= 0), `${source.id}.experimentalUnits[${index}].count is invalid`);
    if (unit.count === null) check(nonEmpty(unit.missingReason), `${source.id}.experimentalUnits[${index}] needs missingReason`);
    else check(unit.missingReason === null, `${source.id}.experimentalUnits[${index}] known count must have null missingReason`);
  }

  check(Array.isArray(source.recordSets) && source.recordSets.length > 0, `${source.id}.recordSets must be non-empty`);
  for (const recordSet of source.recordSets) {
    check(nonEmpty(recordSet.recordSetId) && !recordSetIds.has(recordSet.recordSetId), `Duplicate or invalid recordSetId: ${recordSet.recordSetId}`);
    recordSetIds.add(recordSet.recordSetId);
    check(recordSet.parentSourceId === source.id, `${recordSet.recordSetId} has an orphan parentSourceId`);
    for (const field of ["recordKind", "unitOfObservation", "assignmentAuthority", "cellRosterAvailability", "canonicalIdentityStatus", "idField"]) {
      check(nonEmpty(recordSet[field]), `${recordSet.recordSetId}.${field} is required`);
    }
    check(recordSet.canonicalIdentityStatus === "source_local_not_cross_source_canonical", `${recordSet.recordSetId} promotes a cross-source canonical identity`);
    validateCountReceipt(recordSet.includedRecordCount, `${recordSet.recordSetId}.includedRecordCount`);
    validateProjectPath(recordSet.dataPath, `${recordSet.recordSetId}.dataPath`);
    check(isRecord(recordSet.childRosterRef), `${recordSet.recordSetId}.childRosterRef is required`);
    check(nonEmpty(recordSet.childRosterRef.status), `${recordSet.recordSetId}.childRosterRef.status is required`);
    if (recordSet.childRosterRef.status === "bundled_exact") {
      validateProjectPath(recordSet.childRosterRef.path, `${recordSet.recordSetId}.childRosterRef.path`);
      check(nonEmpty(recordSet.childRosterRef.idField), `${recordSet.recordSetId} bundled roster needs idField`);
      check(recordSet.childRosterRef.missingReason === null, `${recordSet.recordSetId} bundled roster cannot have missingReason`);
      check(recordSet.cellRosterAvailability === "bundled_exact", `${recordSet.recordSetId} bundled roster status disagrees with cellRosterAvailability`);
    } else {
      check(recordSet.childRosterRef.path === null, `${recordSet.recordSetId} non-bundled roster cannot expose a local path`);
      check(nonEmpty(recordSet.childRosterRef.missingReason), `${recordSet.recordSetId} non-bundled roster needs missingReason`);
    }
    if (recordSet.sourceObjectSetRef !== undefined) {
      check(isRecord(recordSet.sourceObjectSetRef), `${recordSet.recordSetId}.sourceObjectSetRef must be an object`);
      check(nonEmpty(recordSet.sourceObjectSetRef.status), `${recordSet.recordSetId}.sourceObjectSetRef.status is required`);
      if (recordSet.sourceObjectSetRef.status === "bundled_exact") {
        validateProjectPath(recordSet.sourceObjectSetRef.path, `${recordSet.recordSetId}.sourceObjectSetRef.path`);
        check(nonEmpty(recordSet.sourceObjectSetRef.idField), `${recordSet.recordSetId} bundled source-object set needs idField`);
        check(recordSet.sourceObjectSetRef.missingReason === null, `${recordSet.recordSetId} bundled source-object set cannot have missingReason`);
      } else {
        check(recordSet.sourceObjectSetRef.path === null, `${recordSet.recordSetId} non-bundled source-object set cannot expose a local path`);
        check(nonEmpty(recordSet.sourceObjectSetRef.missingReason), `${recordSet.recordSetId} non-bundled source-object set needs missingReason`);
      }
    }
  }

  check(Array.isArray(source.assets) && source.assets.length > 0, `${source.id}.assets must be non-empty`);
  for (const asset of source.assets) {
    check(nonEmpty(asset.id) && !assetIds.has(asset.id), `Duplicate or invalid asset id: ${asset.id}`);
    assetIds.add(asset.id);
    check(nonEmpty(asset.kind) && nonEmpty(asset.accession), `${asset.id} kind and accession are required`);
    check(asset.url === null || /^https:\/\//.test(asset.url), `${asset.id}.url must be null or https`);
    check(typeof asset.bundled === "boolean" && isRecord(asset.integrity), `${asset.id} bundling receipt is invalid`);
    if (asset.bundled) {
      check(asset.integrity.status === "verified", `${asset.id} bundled asset must be verified`);
      check(Number.isInteger(asset.integrity.bytes) && asset.integrity.bytes > 0, `${asset.id} bundled asset needs byte count`);
      check(validSha256(asset.integrity.sha256), `${asset.id} bundled asset needs SHA-256`);
      check(asset.integrity.missingReason === null, `${asset.id} bundled verified asset cannot have missingReason`);
    } else if (asset.integrity.bytes === null || asset.integrity.sha256 === null) {
      check(nonEmpty(asset.integrity.missingReason), `${asset.id} missing integrity needs an explicit reason`);
    } else {
      check(Number.isInteger(asset.integrity.bytes) && asset.integrity.bytes > 0 && validSha256(asset.integrity.sha256), `${asset.id} remote integrity receipt is invalid`);
      check(asset.integrity.missingReason === null, `${asset.id} complete remote receipt cannot have missingReason`);
    }
  }

  check(isRecord(source.rights) && nonEmpty(source.rights.status) && nonEmpty(source.rights.note), `${source.id}.rights is invalid`);
  check(isRecord(source.admission) && nonEmpty(source.admission.status) && nonEmpty(source.admission.note), `${source.id}.admission is invalid`);
  for (const gap of source.missingness) {
    check(nonEmpty(gap.field) && nonEmpty(gap.status) && nonEmpty(gap.reason), `${source.id} has invalid missingness`);
  }
}

function sourceById(registry, sourceId) {
  const source = registry.sources.find((candidate) => candidate.id === sourceId);
  check(source, `Required source is missing: ${sourceId}`);
  return source;
}

function recordSetById(registry, recordSetId) {
  const recordSet = registry.sources.flatMap((source) => source.recordSets).find((candidate) => candidate.recordSetId === recordSetId);
  check(recordSet, `Required record set is missing: ${recordSetId}`);
  return recordSet;
}

function lifeStageValues(source) {
  return source.lifeStageScopes.map((scope) => scope.value).filter((value) => value !== null);
}

function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function packageBytes(packageFiles, projectPath) {
  const fileName = path.posix.basename(projectPath);
  const bytes = packageFiles instanceof Map
    ? packageFiles.get(projectPath) ?? packageFiles.get(fileName)
    : packageFiles?.[projectPath] ?? packageFiles?.[fileName];
  check(bytes instanceof Uint8Array, `Cano-Gomez package bytes are missing: ${projectPath}`);
  return bytes;
}

function oneAssetByAccession(source, accession) {
  const matches = source.assets.filter((asset) => asset.accession === accession);
  check(matches.length === 1, `Cano-Gomez source card must expose exactly one asset receipt for ${accession}`);
  return matches[0];
}

function verifyBundledCanoAsset(asset, bytes, label) {
  check(asset.kind === "checksum_pinned_project_derivative", `${label} must be a checksum-pinned project derivative`);
  check(asset.url === null && asset.bundled === true, `${label} must be bundled locally and cannot claim a remote source URL`);
  check(asset.integrity?.status === "verified" && asset.integrity?.missingReason === null, `${label} bundled integrity status is invalid`);
  check(asset.integrity?.bytes === bytes.byteLength, `${label} source-card byte receipt does not match the packaged file`);
  check(asset.integrity?.sha256 === sha256Bytes(bytes), `${label} source-card SHA-256 does not match the packaged file`);
}

/**
 * Relates the canonical source card to the checksum-pinned UPG-204 package.
 * The package validator owns CSV/schema checks; this gate owns the cross-file
 * source-card relationship and its conservative admission/rights boundary.
 */
export function validateCanoGomezSourceRegistryRelationship(researchRegistry, canoRegistry, packageFiles) {
  check(isRecord(canoRegistry), "Cano-Gomez production registry must be an object");
  check(canoRegistry.releaseId === "ohri-cano-gomez-p56-multiome-interneuron-registry-0.1.0", "Cano-Gomez production release identity changed");
  check(canoRegistry.datasetId === "GSE318731", "Cano-Gomez production dataset identity changed");
  check(canoRegistry.lifeStage === "P56", "Cano-Gomez production registry must remain P56");

  const canoSource = sourceById(researchRegistry, "SRC-CANOGOMEZ-2026");
  check(canoSource.accessions.includes("GSE318731"), "Cano-Gomez source card must retain GSE318731");
  check(canoSource.speciesScopes.length === 1
    && canoSource.speciesScopes[0].scientificName === "Mus musculus"
    && canoSource.speciesScopes[0].taxonId === "NCBITaxon:10090", "Cano-Gomez source card must remain mouse-only");
  check(JSON.stringify(lifeStageValues(canoSource)) === JSON.stringify(["P56"]), "Cano-Gomez source card life stage must be exactly P56, not a broad adult label");
  check(canoSource.regionScopes.some((scope) => /mouse spinal cord|spinal cord/i.test(scope.value)), "Cano-Gomez source card must retain its mouse spinal-cord region scope");
  check(canoSource.citation.doi === canoRegistry.sourceReferences?.publication?.doi
    && canoSource.citation.articleUrl === canoRegistry.sourceReferences?.publication?.articleUrl, "Cano-Gomez source-card publication locator does not match the production registry");

  const denominator = canoRegistry.denominatorReconciliation;
  check(denominator?.sourceTotalNucleusCount === 169345, "Cano-Gomez source nucleus denominator must remain 169345");
  check(denominator?.sourceObjectCount === 3, "Cano-Gomez source-object denominator must remain three RDS objects");
  check(denominator?.sourceScopedGroupCount === 57, "Cano-Gomez source-scoped group denominator must remain 57");
  check(denominator?.paperReportedNeuronTypeCount === 516
    && denominator?.paperReportedTypeCountUsedAsInterneuronDenominator === false, "Cano-Gomez paper-reported 516 types must remain reconciliation-only");
  check(denominator?.confirmedInterneuronProfileCount === 11, "Cano-Gomez confirmed profile denominator must remain 11");
  check(denominator?.confirmedInterneuronNucleusCount === 923, "Cano-Gomez confirmed CHOL_IN nucleus denominator must remain 923");
  check(denominator?.generatedGeometryCount === 0
    && denominator?.internalStructureObjectCount === 0
    && denominator?.sameCellLinkCount === 0
    && denominator?.atlasRegistrationCount === 0, "Cano-Gomez production registry gained unsupported geometry, internal, same-cell, or registration authority");

  check(Array.isArray(canoRegistry.profiles) && canoRegistry.profiles.length === CANO_GOMEZ_CONFIRMED_PROFILES.length, "Cano-Gomez production registry must expose exactly 11 profiles");
  check(JSON.stringify(canoRegistry.profiles.map((profile) => [profile.sourceLocalLabel, profile.nucleusCount]))
    === JSON.stringify(CANO_GOMEZ_CONFIRMED_PROFILES), "Cano-Gomez exact CHOL_IN profile roster/counts drifted, including raw label anomalies");
  check(canoRegistry.profiles.every((profile) => profile.recordKind === "source_local_exact_nucleus_roster_profile"
    && profile.unitOfObservation === "nucleus"
    && profile.sourceObjectId === "cholinergic"
    && profile.sourceGroup === "CHOL_IN"
    && profile.assignmentAuthority === "source_explicit_groups_equals_CHOL_IN"
    && profile.stableIdentityField === "compound_nucleus_key"
    && profile.markerEvidenceStatus === "NOT_EXTRACTED_NO_LABEL_TOKEN_INFERENCE"
    && profile.rosterLink?.artifactFileName === "GSE318731_confirmed_interneuron_nucleus_roster.csv.gz"
    && Object.values(profile.geometryAuthority ?? {}).length === 4
    && Object.values(profile.geometryAuthority).every((value) => value === 0)), "Cano-Gomez profiles gained inferred markers, widened scope, or model authority");
  check(canoRegistry.profiles.reduce((total, profile) => total + profile.nucleusCount, 0) === 923, "Cano-Gomez profile counts must sum to 923 exact nuclei");

  const identityMode = canoRegistry.identityAuthority?.mode;
  check(identityMode === "PYTHON_RDATA_META_DATA_ROW_ONLY" || identityMode === "BASE_R_STREAM_META_DATA_ROW_ONLY", "Cano-Gomez source-registry admission requires a row-only identity authority with zero cross-assay claims");
  check(canoRegistry.identityAuthority?.crossAssayCellIdentityVerified === false
    && canoRegistry.identityAuthority?.sameCellAssertionAdmitted === false
    && canoRegistry.inputReceipts?.authorityMode === identityMode
    && canoRegistry.inputReceipts?.combinedReceiptFileName === null
    && canoRegistry.inputReceipts?.combinedReceiptSha256 === null, "Cano-Gomez cross-assay or same-cell identity boundary changed");

  check(Array.isArray(canoRegistry.sourceObjects) && canoRegistry.sourceObjects.length === 3, "Cano-Gomez production registry must retain three source objects");
  check(Array.isArray(canoRegistry.inputReceipts?.sourceObjects) && canoRegistry.inputReceipts.sourceObjects.length === 3, "Cano-Gomez production registry must retain three extraction receipts");
  const sourceObjects = new Map(canoRegistry.sourceObjects.map((sourceObject) => [sourceObject.objectId, sourceObject]));
  const inputReceipts = new Map(canoRegistry.inputReceipts.sourceObjects.map((receipt) => [receipt.objectId, receipt]));
  check(sourceObjects.size === 3 && inputReceipts.size === 3, "Cano-Gomez source-object and extraction-receipt identities must be unique");
  for (const expected of CANO_GOMEZ_SOURCE_OBJECTS) {
    const sourceObject = sourceObjects.get(expected.objectId);
    const receipt = inputReceipts.get(expected.objectId);
    check(sourceObject?.sourceFileName === expected.sourceFileName
      && sourceObject?.sourceRdsBytes === expected.sourceRdsBytes
      && sourceObject?.nucleusCount === expected.nucleusCount
      && sourceObject?.sourceScopedGroupCount === expected.sourceScopedGroupCount
      && validSha256(sourceObject?.sourceRdsSha256), `Cano-Gomez ${expected.objectId} RDS receipt drifted`);
    check(sourceObject?.identityAuthorityMode === identityMode
      && sourceObject?.crossAssayCellIdentityVerified === false, `Cano-Gomez ${expected.objectId} gained unsupported cross-assay identity authority`);
    const expectedReceiptKind = identityMode === "BASE_R_STREAM_META_DATA_ROW_ONLY"
      ? "base_r_stream_meta_data_row_only_receipt"
      : "python_rdata_meta_data_row_only_receipt";
    check(receipt?.receiptKind === expectedReceiptKind
      && validSha256(receipt?.receiptSha256)
      && validSha256(receipt?.rawMetadataCompressedSha256)
      && validSha256(receipt?.rawMetadataUncompressedSha256)
      && validSha256(receipt?.orderedSourceNucleusIdsSha256), `Cano-Gomez ${expected.objectId} extraction receipt is incomplete or mismatched`);

    const sourceAsset = oneAssetByAccession(canoSource, expected.sourceFileName);
    check(sourceAsset.kind === "remote_geo_rds_source_object", `Cano-Gomez ${expected.objectId} must be represented as a remote GEO RDS source object`);
    check(sourceAsset.url === expected.publicUrl && sourceAsset.bundled === false, `Cano-Gomez ${expected.objectId} RDS must remain exact-link-only and unbundled`);
    check(sourceAsset.integrity?.status === "remote_checksum_verified"
      && sourceAsset.integrity?.bytes === sourceObject.sourceRdsBytes
      && sourceAsset.integrity?.sha256 === sourceObject.sourceRdsSha256
      && sourceAsset.integrity?.missingReason === null, `Cano-Gomez ${expected.objectId} source-card receipt does not match the production registry`);
  }
  check([...sourceObjects.values()].reduce((total, item) => total + item.nucleusCount, 0) === 169345
    && [...sourceObjects.values()].reduce((total, item) => total + item.sourceScopedGroupCount, 0) === 57, "Cano-Gomez three RDS receipts do not reconcile to 169345 nuclei and 57 source-scoped groups");

  const profileRecordSet = recordSetById(researchRegistry, "RS-CANOGOMEZ-P56-CONFIRMED-INTERNEURON-PROFILES");
  check(profileRecordSet.parentSourceId === canoSource.id
    && profileRecordSet.recordKind === "source_explicit_confirmed_interneuron_profile"
    && profileRecordSet.unitOfObservation === "source_local_neuron_type_assignment"
    && profileRecordSet.assignmentAuthority === "checksum_pinned_GSE318731_groups_equals_CHOL_IN", "Cano-Gomez source record-set granularity or authority is invalid");
  check(profileRecordSet.includedRecordCount.value === 11
    && profileRecordSet.includedRecordCount.unit === "source_local_CHOL_IN_profiles"
    && /516.*not.*interneuron denominator/i.test(profileRecordSet.includedRecordCount.scope), "Cano-Gomez source record set must retain 11 profiles and reject 516 as an interneuron denominator");
  check(profileRecordSet.cellRosterAvailability === "bundled_exact"
    && profileRecordSet.dataPath === CANO_GOMEZ_REGISTRY_PATH
    && profileRecordSet.idField === "profiles[].profileId"
    && profileRecordSet.childRosterRef?.status === "bundled_exact"
    && profileRecordSet.childRosterRef?.path === CANO_GOMEZ_REGISTRY_PATH
    && profileRecordSet.childRosterRef?.idField === "profiles[].profileId", "Cano-Gomez exact profile-roster relationship is invalid");

  const experimentalUnits = new Map(canoSource.experimentalUnits.map((unit) => [unit.unit, unit]));
  check(experimentalUnits.get("P56_multiome_nucleus")?.count === 169345, "Cano-Gomez source card must expose the 169345-nucleus P56 denominator");
  check(experimentalUnits.get("source_scoped_group")?.count === 57, "Cano-Gomez source card must expose the 57 source-scoped-group denominator");
  check(experimentalUnits.get("confirmed_CHOL_IN_nucleus")?.count === 923, "Cano-Gomez source card must expose the exact 923-nucleus CHOL_IN denominator");

  const registryBytes = packageBytes(packageFiles, CANO_GOMEZ_REGISTRY_PATH);
  let packagedRegistry;
  try {
    packagedRegistry = JSON.parse(Buffer.from(registryBytes).toString("utf8"));
  } catch (error) {
    throw new Error(`Cano-Gomez packaged registry is not valid JSON: ${error.message}`);
  }
  check(JSON.stringify(packagedRegistry) === JSON.stringify(canoRegistry), "Cano-Gomez in-memory registry does not match the packaged registry bytes");
  const registryAsset = oneAssetByAccession(canoSource, canoRegistry.releaseId);
  verifyBundledCanoAsset(registryAsset, registryBytes, "Cano-Gomez production registry");

  check(Array.isArray(canoRegistry.artifacts) && canoRegistry.artifacts.length === 2, "Cano-Gomez production registry must expose exactly two derived CSV artifacts");
  const expectedArtifacts = new Map([
    ["GSE318731_all_nucleus_assignment_audit.csv.gz", ["all_nucleus_assignment_audit", 169345]],
    ["GSE318731_confirmed_interneuron_nucleus_roster.csv.gz", ["confirmed_interneuron_nucleus_roster", 923]],
  ]);
  for (const [fileName, [artifactKind, rowCount]] of expectedArtifacts) {
    const artifacts = canoRegistry.artifacts.filter((artifact) => artifact.fileName === fileName);
    check(artifacts.length === 1, `Cano-Gomez production registry must expose exactly one ${fileName} receipt`);
    const artifact = artifacts[0];
    check(artifact.artifactKind === artifactKind && artifact.rowCount === rowCount, `Cano-Gomez ${fileName} kind or row denominator drifted`);
    const artifactPath = `${CANO_GOMEZ_DATA_DIRECTORY}/${fileName}`;
    const artifactBytes = packageBytes(packageFiles, artifactPath);
    check(artifact.compressedBytes === artifactBytes.byteLength
      && artifact.compressedSha256 === sha256Bytes(artifactBytes), `Cano-Gomez ${fileName} packaged bytes do not match its production receipt`);
    const sourceAsset = oneAssetByAccession(canoSource, fileName);
    verifyBundledCanoAsset(sourceAsset, artifactBytes, `Cano-Gomez ${fileName}`);
    check(sourceAsset.integrity.bytes === artifact.compressedBytes
      && sourceAsset.integrity.sha256 === artifact.compressedSha256, `Cano-Gomez ${fileName} source-card receipt does not match the production registry`);
  }
  const addedSlotAssetIds = new Set(["ASSET-CANOGOMEZ-GLUT-ACTIVE-IDENT-SUMMARY", "ASSET-CANOGOMEZ-GLUT-ACTIVE-IDENT-ROWS"]);
  check(canoSource.assets.filter((asset) => asset.bundled && !addedSlotAssetIds.has(asset.id)).length === 3, "Cano-Gomez confirmed-profile package must retain exactly its registry and two project-derived CSV artifacts");
  check(canoSource.assets.filter((asset) => asset.bundled && addedSlotAssetIds.has(asset.id)).length === 2, "Cano-Gomez source-slot extension must retain exactly its independently verified summary and row map");

  const boundaryText = [canoSource.rights?.status, canoSource.rights?.note, canoSource.admission?.note].join("\n");
  check(/CC[- ]BY[- ]NC[- ]4\.0/i.test(boundaryText), "Cano-Gomez source card must retain the article CC-BY-NC-4.0 notice");
  check(/GEO/i.test(boundaryText)
    && /(?:not generalized|not assumed|not independently established|NOASSERTION)/i.test(boundaryText)
    && /RDS/i.test(boundaryText)
    && /(?:not bundled|unbundled|link-only)/i.test(boundaryText), "Cano-Gomez article rights must not be generalized to GEO RDS redistribution");
  check(/private research repository/i.test(boundaryText)
    && /pending (?:a )?separate public-release review/i.test(boundaryText), "Cano-Gomez derived artifacts must retain the private-repository-only boundary pending public-release review");

  check(canoSource.admission?.status === "confirmed_only_source_local_profiles_admitted"
    && /11 source-explicit CHOL_IN profiles/i.test(canoSource.admission.note)
    && /923 exact source-local nuclei/i.test(canoSource.admission.note), "Cano-Gomez source-card admission is not limited to the exact 11-profile/923-nucleus CHOL_IN roster");
  check(/motor/i.test(canoSource.admission.note)
    && /sensory/i.test(canoSource.admission.note)
    && /projection/i.test(canoSource.admission.note)
    && /ambiguous/i.test(canoSource.admission.note), "Cano-Gomez source-card admission does not retain all exclusion classes");
  const missingness = new Map(canoSource.missingness.map((item) => [item.field, item]));
  check(missingness.get("cell_geometry_and_internal_structure")?.status === "UNAVAILABLE"
    && /zero/i.test(missingness.get("cell_geometry_and_internal_structure")?.reason ?? ""), "Cano-Gomez geometry and internal-structure authority must remain zero");
  check(missingness.get("atlas_registration")?.status === "NOT_ESTABLISHED"
    && /zero/i.test(missingness.get("atlas_registration")?.reason ?? ""), "Cano-Gomez atlas registration must remain zero");
  check(missingness.get("cross_source_identity")?.status === "NOT_ESTABLISHED", "Cano-Gomez cross-source identity must remain unestablished");
  check(missingness.get("cross_assay_identity")?.status === "NOT_ESTABLISHED", "Cano-Gomez cross-assay identity must remain unestablished");

  return researchRegistry;
}

export function validateResearchSourceRegistry(registry) {
  check(isRecord(registry), "Research source registry must be an object");
  check(registry.schemaVersion === "0.1.0", "Research source registry schemaVersion is invalid");
  check(registry.releaseId === "ohri-research-source-registry-0.1.0", "Research source registry releaseId is invalid");
  check(registry.releaseDate === "2026-09-23", "Research source registry releaseDate is invalid");
  check(registry.sourceCount === EXPECTED_RESEARCH_SOURCE_IDS.length, "Research source registry sourceCount is invalid");
  check(Array.isArray(registry.sources) && registry.sources.length === registry.sourceCount, "Research source registry source denominator is invalid");
  check(isRecord(registry.scientificPolicy), "Research source registry scientificPolicy is required");
  check(registry.scientificPolicy.canonicalIdNamespace === "SRC-", "Canonical source namespace is invalid");
  check(registry.scientificPolicy.legacyIdsAreAliasesOnly === true, "Legacy source ids must be aliases only");
  check(registry.scientificPolicy.sourceRecordIsBiologicalRecord === false, "A source record cannot be a biological record");
  check(registry.scientificPolicy.crossSourceIdentityDefault === "not_established", "Cross-source identity default is invalid");
  check(registry.scientificPolicy.registrationCount === 0, "Source registry cannot create registrations");
  check(registry.scientificPolicy.missingIsBiologicalAbsence === false, "Missing evidence cannot mean biological absence");
  check(registry.scientificPolicy.publicAccessImpliesRedistributionPermission === false, "Public access cannot imply redistribution permission");
  check(/only when childRosterRef\.status is bundled_exact/.test(registry.scientificPolicy.drillDownGate), "Roster drill-down gate is invalid");

  check(Array.isArray(registry.knownScopeContradictions) && registry.knownScopeContradictions.length === 1, "Known scope contradiction inventory is invalid");
  const haringConflict = registry.knownScopeContradictions[0];
  check(haringConflict.id === "AGE-HARING-COVERAGE-001" && haringConflict.status === "resolved" && haringConflict.sourceId === "SRC-HARING-2018", "Häring age contradiction resolution identity is invalid");
  check(/Adult mouse dorsal-horn neurons/.test(haringConflict.broadValue), "Häring broad age value is not preserved");
  check(/postnatal P17-P28/.test(haringConflict.authoritativeValue) && /no adult, juvenile, or young-adult/.test(haringConflict.authoritativeValue), "Häring authoritative age value is invalid");
  check(haringConflict.resolvedValuePath === "data/interneuron-knowledge-coverage-0.1.json#lanes/haring-2018/sampleFrame", "Häring contradiction resolvedValuePath is invalid");
  check(haringConflict.resolvedDate === "2026-08-30", "Häring contradiction resolvedDate is invalid");
  check(/coverage lane sample frame and life-stage evidence now state P17-P28/.test(haringConflict.resolution), "Häring contradiction resolution note is invalid");

  const canonicalIds = new Set();
  const aliases = new Map();
  const recordSetIds = new Set();
  const assetIds = new Set();
  for (const source of registry.sources) validateSource(source, canonicalIds, aliases, recordSetIds, assetIds);
  check(canonicalIds.size === EXPECTED_RESEARCH_SOURCE_IDS.length, "Canonical source id denominator is invalid");
  for (const expectedId of EXPECTED_RESEARCH_SOURCE_IDS) check(canonicalIds.has(expectedId), `Canonical source id is missing: ${expectedId}`);
  for (const [alias, expectedSourceId] of Object.entries(REQUIRED_ALIAS_TO_SOURCE)) {
    check(aliases.get(alias) === expectedSourceId, `Legacy source alias is missing or misdirected: ${alias}`);
  }
  check(recordSetIds.size === 42, "Research source registry record-set denominator must remain 42");
  const coverageLaneAliases = ["russ-2021", "haring-2018", "sathyamurthy-2018", "hayashi-2018", "delile-2019", "tabulae-paralytica-2024", "iglesias-gonzalez-2021", "roome-2026"];
  check(coverageLaneAliases.every((alias) => aliases.has(alias)), "All eight knowledge-coverage lane ids must resolve as canonical source aliases");
  check(coverageLaneAliases.every((alias) => sourceById(registry, aliases.get(alias)).researchLanes.includes("coverage")), "All eight knowledge-coverage sources must declare the coverage research lane");

  for (const [recordSetId, expectedCount] of Object.entries(EXPECTED_RECORD_SET_COUNTS)) {
    check(recordSetById(registry, recordSetId).includedRecordCount.value === expectedCount, `${recordSetId} included-record denominator is invalid`);
  }
  const typeRecordTotal = ["RS-RUSS-POPULATIONS", "RS-SATHYAMURTHY-CLUSTERS", "RS-HAYASHI-CLUSTERS", "RS-HARING-FINAL-TYPES", "RS-ALKASLASI-INTERNEURON-CLUSTERS", "RS-DMRT3-DI6-M1-M6-GROUPS", "RS-ROOME-REFINED-DIL-TYPES", "RS-CROZAT-PKD2L1-FUNCTIONAL-PROFILE", "RS-DELILE-FINE-SUBTYPES", "RS-CANOGOMEZ-P56-CONFIRMED-INTERNEURON-PROFILES"]
    .reduce((total, id) => total + recordSetById(registry, id).includedRecordCount.value, 0);
  check(typeRecordTotal === 387, "Canonical source-profile denominator must remain 387 source records, not unique types");
  check(registry.sources.flatMap((source) => source.recordSets).filter((recordSet) => recordSet.childRosterRef.status === "bundled_exact").length === 13, "Bundled exact cell/profile roster denominator must remain 13");
  check(registry.sources.flatMap((source) => source.recordSets).filter((recordSet) => recordSet.sourceObjectSetRef?.status === "bundled_exact").length === 4, "Bundled exact source-object set denominator must remain 4");

  const bancRoute = sourceById(registry, "SRC-BANC-V888-IN14A018");
  const bancRouteSet = recordSetById(registry, "RS-BANC-V888-IN14A018-MORPHOLOGY");
  check(bancRoute.citation.doi === "10.1038/s41586-026-10735-w"
    && bancRoute.speciesScopes[0]?.scientificName === "Drosophila melanogaster"
    && bancRoute.regionScopes[0]?.value === "ventral nerve cord"
    && bancRoute.linkedUpgradeIds.includes("UPG-248"), "BANC exact comparative route source identity or taxonomic scope changed");
  check(bancRouteSet.includedRecordCount.value === 1
    && /not a species-wide or interneuron denominator/.test(bancRouteSet.includedRecordCount.scope)
    && bancRouteSet.childRosterRef.status === "bundled_exact"
    && bancRouteSet.sourceObjectSetRef?.status === "bundled_exact"
    && bancRouteSet.dataPath === "data/banc-v888-in14a018-morphology-route-0.1.json", "BANC exact one-object route denominator or source-object set changed");

  const kelly = sourceById(registry, "SRC-KELLY-ZEBRAFISH-2023");
  check(kelly.citation.doi === "10.7554/eLife.89338"
    && kelly.accessions.includes("GSE232801")
    && kelly.speciesScopes.length === 1
    && kelly.speciesScopes[0].scientificName === "Danio rerio"
    && kelly.lifeStageScopes[0].value === "4 dpf larva"
    && kelly.regionScopes[0].value === "spinal cord", "Kelly source identity or taxonomic scope changed");
  check(JSON.stringify(kelly.linkedUpgradeIds) === JSON.stringify(["UPG-229"])
    && JSON.stringify(kelly.researchLanes) === JSON.stringify(["types", "sources"]), "Kelly source-to-upgrade or research-lane link changed");
  const kellyLabels = recordSetById(registry, "RS-KELLY-GSE232801-ARTICLE-REPORTED-INTERNEURON-LABELS");
  check(kellyLabels.includedRecordCount.value === 10
    && kellyLabels.includedRecordCount.unit === "article_reported_interneuron_labels"
    && kellyLabels.childRosterRef.status === "not_linkable"
    && /not a cluster, barcode, captured-cell, animal or prevalence denominator/.test(kellyLabels.includedRecordCount.scope), "Kelly article-reported label set was promoted to an exact cellular roster");
  const kellyRds = kelly.assets.find((asset) => asset.id === "ASSET-KELLY-GSE232801-NEURONS-RDS");
  check(kellyRds?.bundled === false
    && kellyRds.integrity.status === "not_inventoried"
    && kellyRds.integrity.bytes === null
    && kellyRds.integrity.sha256 === null, "Kelly GEO RDS source object must remain link-only and unverified");
  const kellyContract = kelly.assets.find((asset) => asset.id === "ASSET-KELLY-COMPACT-TAXONOMY");
  check(kellyContract?.bundled === true
    && kellyContract.integrity.status === "verified"
    && kellyContract.integrity.bytes > 0
    && validSha256(kellyContract.integrity.sha256), "Kelly project factual derivative receipt is invalid");
  check(/150 zebrafish overall/.test(kelly.experimentalUnits.find((unit) => unit.unit === "source_animal_or_cord")?.missingReason ?? "")
    && /150 spinal cords for each of two duplicate experiments/.test(kelly.experimentalUnits.find((unit) => unit.unit === "source_animal_or_cord")?.missingReason ?? ""), "Kelly animal/cord denominator conflict was not retained");

  const svara = sourceById(registry, "SRC-SVARA-2018-SBEM");
  const svaraCiD = recordSetById(registry, "RS-SVARA-CID-2018-RECONSTRUCTIONS");
  const svaraCoBL = recordSetById(registry, "RS-SVARA-COBL-2018-RECONSTRUCTIONS");
  check(svara.citation.doi === "10.1016/j.celrep.2018.05.023"
    && svara.speciesScopes[0]?.scientificName === "Danio rerio"
    && svara.lifeStageScopes[0]?.value === "6 dpf larva"
    && svara.experimentalUnits.find((unit) => unit.unit === "larva")?.count === 1
    && JSON.stringify(svara.linkedUpgradeIds) === JSON.stringify(["UPG-240", "UPG-250"]), "Svara source identity, specimen frame or queue links changed");
  check(svaraCiD.includedRecordCount.value === 39 && svaraCoBL.includedRecordCount.value === 34
    && svaraCiD.childRosterRef.status === "not_linkable" && svaraCoBL.childRosterRef.status === "not_linkable"
    && /not prevalence/.test(svaraCiD.includedRecordCount.scope)
    && /not an exact deposited roster/.test(svaraCoBL.includedRecordCount.scope), "Svara source-reported reconstructions were promoted to exact rosters or prevalence");
  check(svara.assets.length === 3 && svara.assets.every((asset) => asset.bundled === false
    && asset.integrity.status === "not_inventoried" && asset.integrity.bytes === null && asset.integrity.sha256 === null
    && asset.url?.startsWith("https://pure.mpg.de/pubman/item/item_3055210_7/component/file_305523")), "Svara archive links gained unverified payload or checksum authority");
  check(/file-specific licence.*not been verified/i.test(svara.rights.note)
    && /public access is not treated as reuse permission/i.test(svara.rights.note)
    && /No archive member, cell skeleton, mesh, synapse edge, coordinate/.test(svara.admission.note), "Svara supplement rights or geometry admission boundary changed");

  const neuromorpho = sourceById(registry, "SRC-NEUROMORPHO-8-6-124");
  const neuromorpho126 = sourceById(registry, "SRC-NEUROMORPHO-8-6-126-TODD-NTS");
  const neuromorpho126Routes = recordSetById(registry, "RS-NEUROMORPHO-8-6-126-TODD-NTS-ROUTES");
  check(neuromorpho126.citation.doi === "10.1096/fba.2024-00048"
    && neuromorpho126.accessions.includes("NeuroMorpho.Org release 8.6.126")
    && neuromorpho126.lifeStageScopes.length === 1
    && neuromorpho126.lifeStageScopes[0].value === "adult", "NeuroMorpho 8.6.126 supplementary source identity or cohort scope drifted");
  check(neuromorpho126Routes.includedRecordCount.value === 30
    && neuromorpho126Routes.includedRecordCount.unit === "supplementary_reconstructions"
    && /do not add records to or change the 1,097-record 8.6.124 query universe/.test(neuromorpho126Routes.includedRecordCount.scope)
    && neuromorpho126Routes.childRosterRef.status === "bundled_exact"
    && neuromorpho126Routes.childRosterRef.path === "data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json"
    && neuromorpho126Routes.sourceObjectSetRef?.status === "bundled_exact"
    && neuromorpho126Routes.sourceObjectSetRef.path === neuromorpho126Routes.dataPath, "NeuroMorpho 8.6.126 route roster/source-object set must remain exact and supplementary");
  const neuromorpho126RouteAsset = neuromorpho126.assets.find((asset) => asset.id === "ASSET-NEUROMORPHO-8-6-126-TODD-NTS-ROUTE-PACK");
  check(neuromorpho126RouteAsset?.integrity.bytes === 302205
    && neuromorpho126RouteAsset.integrity.sha256 === "2071aa60e8dd41f715844a4302b80c5fe2fbad61d413cc417f7f1d87f1b3038d", "NeuroMorpho 8.6.126 route-pack asset receipt is invalid");
  check(/CC BY 4\.0/.test(neuromorpho126.rights.note)
    && /original-paper/.test(neuromorpho126.rights.note)
    && /unverified cohort context only/.test(neuromorpho126.rights.note), "NeuroMorpho 8.6.126 reuse and citation boundary is incomplete");
  const neuromorpho126Gaps = new Map(neuromorpho126.missingness.map((item) => [item.field, item]));
  check(neuromorpho126Gaps.get("source_paper_citation_and_cell_crosswalk")?.status === "NOT_ESTABLISHED"
    && neuromorpho126Gaps.get("same_specimen_internal_structure")?.status === "UNAVAILABLE"
    && neuromorpho126Gaps.get("atlas_registration")?.status === "NOT_ESTABLISHED", "NeuroMorpho 8.6.126 paper identity, same-specimen internal and registration missingness drifted");
  check(neuromorpho.speciesScopes[0]?.context === "admitted census query plus independent dorsal-horn, functional-class, PrP-reporter dorsal-horn, and ventral-horn premotor comparison routes", "NeuroMorpho species-scope context is incomplete");
  check(neuromorpho.regionScopes[0]?.context === "admitted census query plus independent dorsal-horn, functional-class, PrP-reporter dorsal-horn, and ventral-horn premotor comparison routes", "NeuroMorpho region-scope context is incomplete");
  check(JSON.stringify(neuromorpho.lifeStageScopes) === JSON.stringify([
    {value: "adult", context: "142 admitted census records; active route children include NMO 104003, 108974 and 108978, with only 104003 and 108974 overlapping the frozen five-record lens", authority: "official_repository_metadata", missingReason: null},
    {value: "young", context: "supplementary dorsal-horn record NMO 249676, functional-class Renshaw record NMO 45674, and repository-labelled premotor comparison record NMO 45718; all outside the 142-record adult-query census", authority: "official_repository_metadata", missingReason: null},
    {value: "young adult", context: "supplementary dorsal-horn record NMO 170035, functional-class NPY record NMO 50424, and PrP-reporter records NMO 50394 and 50408; all outside the 142-record adult-query census", authority: "official_repository_metadata", missingReason: null},
  ]), "NeuroMorpho adult, young, and young-adult scopes or their record-level contexts drifted");
  check(neuromorpho.recordSets.length === 7, "NeuroMorpho must expose the census, four independent route packs and two disjoint exact native-contour record sets");
  const neuromorphoCensus = recordSetById(registry, "RS-NEUROMORPHO-RECONSTRUCTIONS");
  check(neuromorphoCensus.includedRecordCount.value === 142 && /adult-query census/.test(neuromorphoCensus.includedRecordCount.scope), "NeuroMorpho adult-query census denominator or scope drifted");
  const dorsalHornPack = recordSetById(registry, "RS-NEUROMORPHO-DORSAL-HORN-ROUTE-PACK");
  check(dorsalHornPack.includedRecordCount.value === 5 && dorsalHornPack.includedRecordCount.unit === "route_memberships", "Dorsal-horn route-pack denominator or unit is invalid");
  check(/three adult census members \(NMO 104003, 108974 and 108978\), of which two overlap the frozen cell-form lens/.test(dorsalHornPack.includedRecordCount.scope), "Dorsal-horn route-pack census and frozen-lens overlap denominators are invalid");
  check(/two supplementary records \(NMO 170035 and 249676\)/.test(dorsalHornPack.includedRecordCount.scope), "Dorsal-horn route-pack supplementary denominator is invalid");
  check(/not additive to the 142-record census/.test(dorsalHornPack.includedRecordCount.scope), "Dorsal-horn route pack must not expand the census denominator");
  check(dorsalHornPack.dataPath === "data/census-child-observed-morphology-route-0.1.json", "Dorsal-horn route-pack data path is invalid");
  check(dorsalHornPack.idField === "dorsalHornRouteSet.members[].assetId" && dorsalHornPack.childRosterRef.idField === "dorsalHornRouteSet.members[].assetId", "Dorsal-horn route-pack child identity field is invalid");
  check(dorsalHornPack.childRosterRef.status === "bundled_exact" && dorsalHornPack.childRosterRef.path === dorsalHornPack.dataPath, "Dorsal-horn route-pack child roster must be the bundled exact contract");
  const dorsalHornPackAsset = neuromorpho.assets.find((asset) => asset.id === "ASSET-NEUROMORPHO-DORSAL-HORN-ROUTE-PACK");
  check(dorsalHornPackAsset?.accession === "dorsal_horn_observed_morphology_route_pack_v1" && dorsalHornPackAsset.bundled === true, "Dorsal-horn route-pack asset identity is invalid");
  check(dorsalHornPackAsset?.integrity.bytes === 1696, "Dorsal-horn route-pack asset-manifest byte count is invalid");
  check(dorsalHornPackAsset?.integrity.sha256 === "4f64fb595a4362cf0403cb0d3abc3c6fdc14b7f74d473a82ccd67bed9b9dab87", "Dorsal-horn route-pack asset-manifest SHA-256 is invalid");
  const functionalClassPack = recordSetById(registry, "RS-NEUROMORPHO-FUNCTIONAL-CLASS-ROUTE-PACK");
  check(functionalClassPack.includedRecordCount.value === 2 && functionalClassPack.includedRecordCount.unit === "supplementary_reconstructions", "Functional-class route-pack denominator or unit is invalid");
  check(/Exactly NMO 45674 and NMO 50424/.test(functionalClassPack.includedRecordCount.scope), "Functional-class route-pack exact child identity scope is invalid");
  check(/neither record is a frozen-census member/.test(functionalClassPack.includedRecordCount.scope), "Functional-class route-pack census-membership boundary is missing");
  check(/does not expand or alter the 142-record census denominator/.test(functionalClassPack.includedRecordCount.scope), "Functional-class route pack must not expand the census denominator");
  check(functionalClassPack.dataPath === "data/functional-class-observed-morphology-route-pack-0.1.json", "Functional-class route-pack data path is invalid");
  check(functionalClassPack.idField === "routes[].sourceRecord.assetId" && functionalClassPack.childRosterRef.idField === "routes[].sourceRecord.assetId", "Functional-class route-pack child identity field is invalid");
  check(functionalClassPack.childRosterRef.status === "bundled_exact" && functionalClassPack.childRosterRef.path === functionalClassPack.dataPath, "Functional-class route-pack child roster must be the bundled exact contract");
  const functionalClassPackAsset = neuromorpho.assets.find((asset) => asset.id === "ASSET-NEUROMORPHO-FUNCTIONAL-CLASS-ROUTE-PACK");
  check(functionalClassPackAsset?.accession === "functional_class_observed_morphology_route_pack_v1" && functionalClassPackAsset.bundled === true, "Functional-class route-pack asset identity is invalid");
  check(functionalClassPackAsset?.integrity.bytes === 2768, "Functional-class route-pack asset-manifest byte count is invalid");
  check(functionalClassPackAsset?.integrity.sha256 === "a44d7b109357d086d0d7bc27481ee76bdcfe7382e804f74aeb08195b47878f5f", "Functional-class route-pack asset-manifest SHA-256 is invalid");
  const prpDorsalHornPack = recordSetById(registry, "RS-NEUROMORPHO-PRP-DORSAL-HORN-ROUTE-PACK");
  check(prpDorsalHornPack.includedRecordCount.value === 2 && prpDorsalHornPack.includedRecordCount.unit === "supplementary_reconstructions", "PrP dorsal-horn route-pack denominator or unit is invalid");
  check(/Exactly NMO 50394 and NMO 50408/.test(prpDorsalHornPack.includedRecordCount.scope), "PrP dorsal-horn route-pack exact child identity scope is invalid");
  check(/neither record is a frozen-census member/.test(prpDorsalHornPack.includedRecordCount.scope), "PrP dorsal-horn route-pack census-membership boundary is missing");
  check(/does not expand or alter the 142-record census denominator/.test(prpDorsalHornPack.includedRecordCount.scope), "PrP dorsal-horn route pack must not expand the census denominator");
  check(prpDorsalHornPack.dataPath === "data/prp-dorsal-horn-observed-morphology-route-pack-0.1.json", "PrP dorsal-horn route-pack data path is invalid");
  check(prpDorsalHornPack.idField === "routes[].sourceRecord.assetId" && prpDorsalHornPack.childRosterRef.idField === "routes[].sourceRecord.assetId", "PrP dorsal-horn route-pack child identity field is invalid");
  check(prpDorsalHornPack.childRosterRef.status === "bundled_exact" && prpDorsalHornPack.childRosterRef.path === prpDorsalHornPack.dataPath, "PrP dorsal-horn route-pack child roster must be the bundled exact contract");
  const prpDorsalHornPackAsset = neuromorpho.assets.find((asset) => asset.id === "ASSET-NEUROMORPHO-PRP-DORSAL-HORN-ROUTE-PACK");
  check(prpDorsalHornPackAsset?.accession === "prp_dorsal_horn_observed_morphology_route_pack_v1" && prpDorsalHornPackAsset.bundled === true, "PrP dorsal-horn route-pack asset identity is invalid");
  check(prpDorsalHornPackAsset?.integrity.bytes === 2766, "PrP dorsal-horn route-pack asset-manifest byte count is invalid");
  check(prpDorsalHornPackAsset?.integrity.sha256 === "2f17597f67532debfa79828a6313887fb362e9cdc4baba9d3015d94129c5ef8f", "PrP dorsal-horn route-pack asset-manifest SHA-256 is invalid");
  const premotorComparisonPack = recordSetById(registry, "RS-NEUROMORPHO-PREMOTOR-COMPARISON-ROUTE-PACK");
  check(premotorComparisonPack.includedRecordCount.value === 1 && premotorComparisonPack.includedRecordCount.unit === "supplementary_reconstructions", "Premotor comparison route-pack denominator or unit is invalid");
  check(/Exactly NMO 45718/.test(premotorComparisonPack.includedRecordCount.scope) && /repository-labelled/.test(premotorComparisonPack.includedRecordCount.scope), "Premotor comparison route-pack exact child identity scope is invalid");
  check(/not a frozen-census member/.test(premotorComparisonPack.includedRecordCount.scope) && /does not expand or alter the 142-record census denominator/.test(premotorComparisonPack.includedRecordCount.scope), "Premotor comparison route pack must not expand the census denominator");
  check(premotorComparisonPack.dataPath === "data/premotor-comparison-observed-morphology-route-pack-0.1.json", "Premotor comparison route-pack data path is invalid");
  check(premotorComparisonPack.idField === "routes[].sourceRecord.assetId" && premotorComparisonPack.childRosterRef.idField === "routes[].sourceRecord.assetId", "Premotor comparison route-pack child identity field is invalid");
  check(premotorComparisonPack.childRosterRef.status === "bundled_exact" && premotorComparisonPack.childRosterRef.path === premotorComparisonPack.dataPath, "Premotor comparison route-pack child roster must be the bundled exact contract");
  const premotorComparisonPackAsset = neuromorpho.assets.find((asset) => asset.id === "ASSET-NEUROMORPHO-PREMOTOR-COMPARISON-ROUTE-PACK");
  check(premotorComparisonPackAsset?.accession === "premotor_comparison_observed_morphology_route_pack_v1" && premotorComparisonPackAsset.bundled === true, "Premotor comparison route-pack asset identity is invalid");
  check(premotorComparisonPackAsset?.integrity.bytes === 1647, "Premotor comparison route-pack asset-manifest byte count is invalid");
  check(premotorComparisonPackAsset?.integrity.sha256 === "0220169ea294d8db086a228557b0b067fd057249e41f7187cf2a14ee924a33d8", "Premotor comparison route-pack asset-manifest SHA-256 is invalid");
  const nativeContours = recordSetById(registry, "RS-NEUROMORPHO-NATIVE-CONTOUR-ADMISSION-CATALOG");
  check(nativeContours.includedRecordCount.value === 5 && nativeContours.includedRecordCount.unit === "audited_DAT_files", "Native-contour catalog denominator or unit is invalid");
  check(/Exactly NMO 45718, 45674, 50424, 50394 and 50408/.test(nativeContours.includedRecordCount.scope) && /48 admitted source-native line loops \/ 2,379 vertices/.test(nativeContours.includedRecordCount.scope) && /Todd subset of 33 MBF Cell Body line loops \/ 1,904 vertices/.test(nativeContours.includedRecordCount.scope), "Native-contour catalog membership boundary is incomplete");
  check(nativeContours.dataPath === "data/neurolucida-native-contour-admission-catalog-0.3.json", "Native-contour catalog data path is invalid");
  check(nativeContours.cellRosterAvailability === "not_applicable", "Native-contour admission decisions must not be represented as a cell roster");
  check(nativeContours.childRosterRef.status === "not_applicable_source_object_set" && nativeContours.childRosterRef.path === null && nativeContours.childRosterRef.idField === null && /not cells or type profiles/.test(nativeContours.childRosterRef.missingReason ?? ""), "Native-contour catalog child-roster boundary is invalid");
  check(nativeContours.sourceObjectSetRef?.status === "bundled_exact" && nativeContours.sourceObjectSetRef.path === nativeContours.dataPath && nativeContours.sourceObjectSetRef.idField === "records[].assetId" && nativeContours.sourceObjectSetRef.missingReason === null, "Native-contour exact source-object set is invalid");
  const nativeContourCatalogAsset = neuromorpho.assets.find((asset) => asset.id === "ASSET-NEUROMORPHO-NATIVE-CONTOUR-ADMISSION-CATALOG");
  check(nativeContourCatalogAsset?.accession === "neurolucida-native-contour-admission-catalog-0.3.0" && nativeContourCatalogAsset?.integrity.bytes === 23571 && nativeContourCatalogAsset?.integrity.sha256 === "d5cc13f99c2e6ec0e41d6352512e592f5d6dc1d118f7d7c0b69ec2239deda8fe", "Native-contour catalog asset receipt is invalid");
  const renshawNativeContourAsset = neuromorpho.assets.find((asset) => asset.id === "ASSET-NEUROMORPHO-45674-SOURCE-CLOSED-SOMA-CONTOURS");
  check(renshawNativeContourAsset?.integrity.bytes === 35842 && renshawNativeContourAsset?.integrity.sha256 === "1e41538a6443dcf7893386c180d3d22ddf81cc72a4d96f66a16193c97747cec3", "NMO 45674 native-contour asset receipt is invalid");
  const nativeContour45718Asset = neuromorpho.assets.find((asset) => asset.id === "ASSET-NEUROMORPHO-45718-NATIVE-SOMA-CONTOURS");
  check(nativeContour45718Asset?.integrity.bytes === 45606 && nativeContour45718Asset?.integrity.sha256 === "a0aa80ce0f12b08cfe61b2862f1b3a29f67a1105a722b0dceda2fd3b25e898e8", "NMO 45718 native-contour asset receipt is invalid");
  const toddNativeContourAssets = new Map(neuromorpho.assets
    .filter((asset) => /^ASSET-NEUROMORPHO-(50424|50394|50408)-MBF-CELL-BODY-LINE-LOOPS$/.test(asset.id))
    .map((asset) => [asset.id, asset.integrity]));
  check(toddNativeContourAssets.size === 3, "Todd MBF Cell Body geometry asset denominator is invalid");
  check(toddNativeContourAssets.get("ASSET-NEUROMORPHO-50424-MBF-CELL-BODY-LINE-LOOPS")?.bytes === 71212 && toddNativeContourAssets.get("ASSET-NEUROMORPHO-50424-MBF-CELL-BODY-LINE-LOOPS")?.sha256 === "8bd390d698a77dc80a95c7d560e823d5f0ff1d5daadb2194be6475ba250851d6", "NMO 50424 MBF Cell Body geometry receipt is invalid");
  check(toddNativeContourAssets.get("ASSET-NEUROMORPHO-50394-MBF-CELL-BODY-LINE-LOOPS")?.bytes === 123254 && toddNativeContourAssets.get("ASSET-NEUROMORPHO-50394-MBF-CELL-BODY-LINE-LOOPS")?.sha256 === "61fddbab3764e761600c2519e478eec4cee7918a581b2fde29ac2d8880c90a92", "NMO 50394 MBF Cell Body geometry receipt is invalid");
  check(toddNativeContourAssets.get("ASSET-NEUROMORPHO-50408-MBF-CELL-BODY-LINE-LOOPS")?.bytes === 110635 && toddNativeContourAssets.get("ASSET-NEUROMORPHO-50408-MBF-CELL-BODY-LINE-LOOPS")?.sha256 === "30d9c7870329aa0d2c6c2e83aeb020587973bf44e72c214a46f809532ba9ae78", "NMO 50408 MBF Cell Body geometry receipt is invalid");
  check(neuromorpho.modalities.includes("repository morphometry") && neuromorpho.modalities.includes("source-native DAT provenance receipt") && neuromorpho.modalities.includes("source-native DAT contour trace"), "NeuroMorpho source-native provenance modalities are incomplete");
  const neuromorphoMissingness = new Map(neuromorpho.missingness.map((item) => [item.field, item]));
  check(neuromorphoMissingness.get("same_specimen_internal_structure")?.status === "UNAVAILABLE" && /remain zero/.test(neuromorphoMissingness.get("same_specimen_internal_structure")?.reason ?? ""), "Same-specimen internals must remain unavailable with zero admitted objects");
  check(neuromorphoMissingness.get("atlas_registration")?.status === "UNAVAILABLE" && /remains zero/.test(neuromorphoMissingness.get("atlas_registration")?.reason ?? ""), "Atlas registration must remain unavailable with zero registrations");
  check(neuromorphoMissingness.get("source_native_DAT_semantics")?.status === "PARTIALLY_AVAILABLE", "Native DAT semantics must remain limited to exact admitted source objects");
  check(/Exactly 48 ordered soma contour line loops and 2,379 vertices/.test(neuromorphoMissingness.get("source_native_DAT_semantics")?.reason ?? "") && /NMO 50424 = 8 loops \/ 427 vertices, NMO 50394 = 14 \/ 768 and NMO 50408 = 11 \/ 709 \(33 \/ 1,904 combined\)/.test(neuromorphoMissingness.get("source_native_DAT_semantics")?.reason ?? "") && /raw sourceClosedFlag=false/.test(neuromorphoMissingness.get("source_native_DAT_semantics")?.reason ?? "") && /User Line 1–4 remain excluded/.test(neuromorphoMissingness.get("source_native_DAT_semantics")?.reason ?? "") && /No line trace authorizes fill, triangulation, loft, surface, membrane, volume, internal object, biological measurement, DAT-to-SWC overlay, join, registration/.test(neuromorphoMissingness.get("source_native_DAT_semantics")?.reason ?? ""), "Native DAT contour scope or prohibited-inference boundary is incomplete");
  check(neuromorphoMissingness.get("same_cell_electrophysiology")?.status === "UNAVAILABLE" && /exact physiology join count remains zero/.test(neuromorphoMissingness.get("same_cell_electrophysiology")?.reason ?? ""), "Same-cell electrophysiology must remain unavailable with zero exact joins");
  check(neuromorphoMissingness.get("marker_exclusivity")?.status === "NOT_ESTABLISHED" && /marker-exclusivity claim count remains zero/.test(neuromorphoMissingness.get("marker_exclusivity")?.reason ?? ""), "Marker exclusivity must remain unestablished with zero claims");
  check(neuromorphoMissingness.get("cross_source_identity")?.status === "NOT_ESTABLISHED" && /exact cross-source identity count remains zero/.test(neuromorphoMissingness.get("cross_source_identity")?.reason ?? ""), "Cross-source identities must remain unestablished with zero exact identities");
  check(neuromorphoMissingness.get("repository_metadata_conflicts")?.status === "CONFLICT_UNRESOLVED", "Repository metadata conflicts must remain unresolved and visible");
  check(/NMO 50394 and NMO 50408/.test(neuromorphoMissingness.get("repository_metadata_conflicts")?.reason ?? "") && /raw inverted weight bounds/.test(neuromorphoMissingness.get("repository_metadata_conflicts")?.reason ?? ""), "PrP route raw invalid repository weights must remain visible");
  check(/NMO 45718/.test(neuromorphoMissingness.get("repository_metadata_conflicts")?.reason ?? "") && /calbindin-washout/.test(neuromorphoMissingness.get("repository_metadata_conflicts")?.reason ?? "") && /reported-but-uncorrected shrinkage/.test(neuromorphoMissingness.get("repository_metadata_conflicts")?.reason ?? ""), "Premotor comparison label and shrinkage conflicts must remain visible");
  check(/two-route PrP-reporter dorsal-horn contract admits supplementary NMO 50394 and 50408/.test(neuromorpho.admission.note), "PrP dorsal-horn route-pack admission note is incomplete");
  check(/one-route premotor comparison contract admits repository-labelled NMO 45718/.test(neuromorpho.admission.note), "Premotor comparison route-pack admission note is incomplete");
  check(/48 source-native ordered line loops \/ 2,379 vertices across the exact five records/.test(neuromorpho.admission.note) && /NMO 50424, 50394 and 50408 add exactly 8 \/ 427, 14 \/ 768 and 11 \/ 709 MBF Cell Body LineLoops/.test(neuromorpho.admission.note) && /raw sourceClosedFlag=false/.test(neuromorpho.admission.note) && /User Line 1–4 remain excluded/.test(neuromorpho.admission.note), "NeuroMorpho native-contour admission scope is incomplete");
  check(/zero fill, triangles, lofts, surfaces, membranes, volumes, internal structures, biological measurements, DAT-to-SWC overlays, joins or registrations/.test(neuromorpho.admission.note) && /no route creates exact physiology, marker-exclusivity, cross-source identity, or type-representative morphology claims/.test(neuromorpho.admission.note), "NeuroMorpho admission boundaries are incomplete");
  check(neuromorpho.linkedUpgradeIds.includes("UPG-137"), "PrP dorsal-horn route pack must remain linked to UPG-137");
  check(neuromorpho.linkedUpgradeIds.includes("UPG-143"), "Premotor comparison route pack must remain linked to UPG-143");
  check(neuromorpho.linkedUpgradeIds.includes("UPG-226"), "NMO 108978 census-child route must remain linked to UPG-226");
  check(neuromorpho.linkedUpgradeIds.includes("UPG-186"), "NMO 45718 native contour traces must remain linked to completed UPG-186");
  check(neuromorpho.linkedUpgradeIds.includes("UPG-197") && neuromorpho.linkedUpgradeIds.includes("UPG-198"), "Per-record native DAT audit and strict NMO 45674 admission upgrades are missing");
  check(neuromorpho.linkedUpgradeIds.includes("UPG-203"), "Todd MBF Cell Body LineLoop admission upgrade is missing");
  check(neuromorpho.linkedUpgradeIds.includes("UPG-236"), "NeuroMorpho exact source cell-type facet upgrade is missing");
  check(neuromorpho.linkedUpgradeIds.includes("UPG-237"), "NeuroMorpho source paper-by-label cross-tab watch is missing");

  const canoGomez = sourceById(registry, "SRC-CANOGOMEZ-2026");
  check(canoGomez.linkedUpgradeIds.includes("UPG-190"), "Cano-Gomez RDS/Table S1 audit must remain linked to UPG-190");
  check(canoGomez.linkedUpgradeIds.includes("UPG-191"), "Cano-Gomez BIL identity bridge must remain linked to UPG-191");
  check(canoGomez.linkedUpgradeIds.includes("UPG-204"), "Cano-Gomez confirmed-only P56 registry must remain linked to UPG-204");
  check(JSON.stringify(lifeStageValues(canoGomez)) === JSON.stringify(["P56"]), "Cano-Gomez source-card life stage must remain exactly P56");
  const canoProfiles = recordSetById(registry, "RS-CANOGOMEZ-P56-CONFIRMED-INTERNEURON-PROFILES");
  check(canoProfiles.parentSourceId === canoGomez.id, "Cano-Gomez confirmed profile record set has the wrong parent source");
  check(canoProfiles.recordKind === "source_explicit_confirmed_interneuron_profile" && canoProfiles.unitOfObservation === "source_local_neuron_type_assignment", "Cano-Gomez record granularity is invalid");
  check(canoProfiles.assignmentAuthority === "checksum_pinned_GSE318731_groups_equals_CHOL_IN", "Cano-Gomez profile assignment authority is invalid");
  check(canoProfiles.includedRecordCount.value === 11 && canoProfiles.includedRecordCount.unit === "source_local_CHOL_IN_profiles", "Cano-Gomez 11-profile denominator or unit is invalid");
  check(/not the paper-reported 516 neuronal types/.test(canoProfiles.includedRecordCount.scope), "Cano-Gomez record-set scope must reject 516 as an interneuron denominator");
  check(canoProfiles.dataPath === CANO_GOMEZ_REGISTRY_PATH, "Cano-Gomez registry path is invalid");
  check(canoProfiles.idField === "profiles[].profileId" && canoProfiles.childRosterRef.status === "bundled_exact" && canoProfiles.childRosterRef.path === canoProfiles.dataPath && canoProfiles.childRosterRef.idField === canoProfiles.idField, "Cano-Gomez exact profile roster link is invalid");
  check(canoGomez.experimentalUnits.some((unit) => unit.unit === "P56_multiome_nucleus" && unit.count === 169345), "Cano-Gomez exact three-object nucleus denominator is invalid");
  check(canoGomez.experimentalUnits.some((unit) => unit.unit === "source_scoped_group" && unit.count === 57), "Cano-Gomez exact source-scoped group denominator is invalid");
  check(canoGomez.experimentalUnits.some((unit) => unit.unit === "confirmed_CHOL_IN_nucleus" && unit.count === 923), "Cano-Gomez exact CHOL_IN nucleus denominator is invalid");
  check(canoGomez.admission.status === "confirmed_only_source_local_profiles_admitted" && /11 source-explicit CHOL_IN profiles/.test(canoGomez.admission.note) && /923 exact source-local nuclei/.test(canoGomez.admission.note), "Cano-Gomez conservative admission boundary is invalid");
  check(/motor, sensory-scope, glutamatergic projection\/local-unresolved and remaining GABA ambiguous\/projection-exception/.test(canoGomez.admission.note), "Cano-Gomez exclusion policy is incomplete");
  const canoMissingness = new Map(canoGomez.missingness.map((item) => [item.field, item]));
  check(canoMissingness.get("cell_geometry_and_internal_structure")?.status === "UNAVAILABLE" && /zero/.test(canoMissingness.get("cell_geometry_and_internal_structure")?.reason ?? ""), "Cano-Gomez geometry and internal structures must remain zero");
  check(canoMissingness.get("atlas_registration")?.status === "NOT_ESTABLISHED" && /zero/.test(canoMissingness.get("atlas_registration")?.reason ?? ""), "Cano-Gomez registration count must remain zero");
  check(canoMissingness.get("cross_source_identity")?.status === "NOT_ESTABLISHED", "Cano-Gomez cross-source identity must remain unestablished");
  check(canoMissingness.get("cross_assay_identity")?.status === "NOT_ESTABLISHED", "Cano-Gomez cross-assay identity must remain unestablished");

  const haring = sourceById(registry, "SRC-HARING-2018");
  check(JSON.stringify(haring.lifeStageScopes) === JSON.stringify([{value: "postnatal P17-P28", context: "sequencing cell columns; source text 3-4 week mice", authority: "checksum_pinned_matrix", missingReason: null}]), "Häring life-stage scope must remain exact P17-P28 and must not be broadened");
  check(haring.recordSets[0].childRosterRef.status === "exact_remote_not_bundled", "Häring roster must not be exposed as bundled");
  check(sourceById(registry, "SRC-SATHYAMURTHY-2018").recordSets[0].childRosterRef.status === "exact_remote_not_bundled", "Sathyamurthy roster must not be exposed as bundled");
  check(sourceById(registry, "SRC-HAYASHI-2018").recordSets[0].childRosterRef.status === "not_linkable", "Hayashi clusters must not expose barcode drill-down");
  const alkaslasi = sourceById(registry, "SRC-ALKASLASI-2021");
  check(alkaslasi.recordSets[0].childRosterRef.status === "exact_remote_not_bundled", "Alkaslasi roster must not be exposed as bundled");
  check(alkaslasi.recordSets[0].includedRecordCount.value === 8, "Alkaslasi I1-I8 type denominator is invalid");
  check(alkaslasi.experimentalUnits.find((unit) => unit.unit === "source_animal")?.count === 12, "Alkaslasi source-animal denominator is invalid");
  check(alkaslasi.experimentalUnits.find((unit) => unit.unit === "qc_retained_nucleus")?.count === 34231, "Alkaslasi QC-retained nucleus denominator is invalid");
  check(alkaslasi.experimentalUnits.find((unit) => unit.unit === "source_annotated_interneuron_nucleus")?.count === 5375, "Alkaslasi I1-I8 nucleus denominator is invalid");
  check(alkaslasi.assets[0].integrity.bytes === 333655 && alkaslasi.assets[0].integrity.sha256 === "6e69c106544a394dd23b6e7b4fc2d159a715aaa8a70adbd61721338e8d29c091", "Alkaslasi source-object receipt is invalid");
  check(alkaslasi.rights.status === "public_access_reuse_not_assumed" && alkaslasi.assets[0].bundled === false, "Alkaslasi remote-object rights boundary is invalid");
  check(/not an unbiased population census/.test(alkaslasi.missingness.find((item) => item.field === "biological_prevalence")?.reason ?? ""), "Alkaslasi enrichment/prevalence boundary is invalid");
  check(/not xyz coordinates/.test(alkaslasi.missingness.find((item) => item.field === "cell_coordinates")?.reason ?? ""), "Alkaslasi sample-region coordinate boundary is invalid");
  check(sourceById(registry, "SRC-RUSS-2021").recordSets[0].childRosterRef.status === "not_retained_in_project", "Russ populations must not expose a retained roster");

  check(new Set(lifeStageValues(sourceById(registry, "SRC-BERTELS-2022"))).size === 2
    && lifeStageValues(sourceById(registry, "SRC-BERTELS-2022")).includes("neonatal")
    && lifeStageValues(sourceById(registry, "SRC-BERTELS-2022")).includes("adult"), "Bertels neonatal and adult conditions must remain separate");
  const katheSpecies = new Set(sourceById(registry, "SRC-KATHE-2022").speciesScopes.map((scope) => scope.scientificName));
  check(katheSpecies.has("Mus musculus") && katheSpecies.has("Homo sapiens") && katheSpecies.size === 2, "Kathe mouse and human evidence scopes must remain separate");
  check(lifeStageValues(sourceById(registry, "SRC-HAYASHI-2018"))[0] === "P0 neonatal", "Hayashi life stage must remain P0 neonatal");
  const delile = sourceById(registry, "SRC-DELILE-2019");
  check(lifeStageValues(delile)[0] === "E9.5-E13.5", "Delile life stage must remain E9.5-E13.5");
  check(delile.citation.doi === "10.1242/dev.173807", "Delile primary DOI is invalid");
  check(JSON.stringify(delile.researchLanes) === JSON.stringify(["types", "coverage", "sources"]), "Delile research lanes are invalid");
  check(JSON.stringify(delile.linkedUpgradeIds) === JSON.stringify(["UPG-084", "UPG-108", "UPG-110", "UPG-185"]), "Delile linked upgrades are invalid");
  check(delile.experimentalUnits.find((unit) => unit.unit === "source_metadata_cell")?.count === 41025, "Delile metadata-cell denominator is invalid");
  check(delile.experimentalUnits.find((unit) => unit.unit === "source_defined_neuron_cell")?.count === 18144, "Delile neuron denominator is invalid");
  check(delile.experimentalUnits.find((unit) => unit.unit === "typed_nonmotor_neuron_cell")?.count === 15394, "Delile typed non-motor denominator is invalid");
  check(delile.experimentalUnits.find((unit) => unit.unit === "fine_subtype_interneuron_cell")?.count === 15217, "Delile fine-subtype cell denominator is invalid");
  check(delile.experimentalUnits.find((unit) => unit.unit === "cardinal_only_interneuron_cell")?.count === 177, "Delile cardinal-only denominator is invalid");
  const delileAnimals = delile.experimentalUnits.find((unit) => unit.unit === "biological_animal");
  check(delileAnimals?.count === null && /replicate labels are not animals/.test(delileAnimals.missingReason ?? ""), "Delile biological-animal denominator must remain unresolved");
  const delileRecordSet = recordSetById(registry, "RS-DELILE-FINE-SUBTYPES");
  check(delileRecordSet.includedRecordCount.value === 51 && /15,217 source cells/.test(delileRecordSet.includedRecordCount.scope), "Delile 51-profile denominator is invalid");
  check(delileRecordSet.dataPath === "data/delile-developmental-interneuron-taxonomy-0.1.json", "Delile taxonomy path is invalid");
  check(delileRecordSet.idField === "profiles[].id" && delileRecordSet.childRosterRef.idField === "profiles[].id", "Delile profile identity field is invalid");
  check(delileRecordSet.childRosterRef.status === "bundled_exact" && delileRecordSet.childRosterRef.path === delileRecordSet.dataPath, "Delile exact profile roster must resolve to the bundled factual contract");
  const delileRemote = delile.assets.find((asset) => asset.id === "ASSET-DELILE-ANNOTATED-METADATA");
  check(delileRemote?.bundled === false && delileRemote.integrity.bytes === 3036323 && delileRemote.integrity.sha256 === "4f5bd353771ea478928e305df784f3fc868bb89a9ffc5fbce112da70c4a769bf", "Delile link-only annotation receipt is invalid");
  const delileContract = delile.assets.find((asset) => asset.id === "ASSET-DELILE-COMPACT-TAXONOMY");
  check(delileContract?.bundled === true && delileContract.integrity.bytes === 122037 && delileContract.integrity.sha256 === "7a77c8c10f15224188bb542fddf63bc97de57b06dd9289e324bc7b8612219597", "Delile compact taxonomy receipt is invalid");
  check(delile.rights.status === "public_repository_NOASSERTION_source_link_only" && /source annotation table remains link-only/.test(delile.rights.note), "Delile source-object rights boundary is invalid");
  check(/Fifty-one exact source-local fine-subtype aggregates/.test(delile.admission.note) && /no cross-study identity or registration/.test(delile.admission.note), "Delile admission boundary is incomplete");
  const delileMissingness = new Map(delile.missingness.map((item) => [item.field, item]));
  check(delileMissingness.get("biological_animal_denominator")?.status === "UNAVAILABLE", "Delile animal denominator must remain unavailable");
  check(delileMissingness.get("cell_geometry_and_internal_structure")?.status === "UNAVAILABLE" && /No same-cell morphology/.test(delileMissingness.get("cell_geometry_and_internal_structure")?.reason ?? ""), "Delile geometry and internal structures must remain unavailable");
  check(delileMissingness.get("atlas_registration")?.status === "NOT_ESTABLISHED", "Delile registration must remain unestablished");
  check(delileMissingness.get("cross_source_identity")?.status === "NOT_ESTABLISHED", "Delile cross-source identity must remain unestablished");
  check(lifeStageValues(sourceById(registry, "SRC-MICRONS-PHASE1-V185-4"))[0] === "P36 male", "MICrONS life stage must remain P36 male");
  check(lifeStageValues(sourceById(registry, "SRC-OPENORGANELLE-JRC-MUS-HIPPOCAMPUS-1"))[0] === "P7", "OpenOrganelle life stage must remain P7");
  const superClem = sourceById(registry, "SRC-SUPERCLEM-GLYR-17816747-V1");
  check(superClem.lifeStageScopes[0].value === null && /exact source age/.test(superClem.lifeStageScopes[0].missingReason), "Super-CLEM exact age must remain explicit missingness");
  check(superClem.recordSets[0].cellRosterAvailability === "parent_cell_unresolved", "Super-CLEM parent cell must remain unresolved");

  const ronzano = sourceById(registry, "SRC-RONZANO-2022-81976");
  check(ronzano.citation.doi === "10.7554/eLife.81976", "Ronzano DOI is invalid");
  check(/early postnatal/.test(ronzano.lifeStageScopes[0].value), "Ronzano life stage must remain early postnatal");
  check(JSON.stringify(ronzano.researchLanes) === JSON.stringify(["positions", "sources"]), "Ronzano research lanes are invalid");
  check(JSON.stringify(ronzano.linkedUpgradeIds) === JSON.stringify(["UPG-108", "UPG-110", "UPG-114"]), "Ronzano linked upgrades are invalid");
  const ronzanoExperiments = ronzano.experimentalUnits.find((unit) => unit.unit === "experiment");
  const ronzanoCoordinateRows = ronzano.experimentalUnits.find((unit) => unit.unit === "coordinate_row");
  check(ronzanoExperiments?.count === 18 && /11 LG experiments and 7 TA experiments/.test(ronzanoExperiments.scope), "Ronzano experiment denominator is invalid");
  check(ronzanoCoordinateRows?.count === 31878 && /not a unique-cell denominator/.test(ronzanoCoordinateRows.scope), "Ronzano coordinate-row denominator is invalid");
  const ronzanoRecordSet = recordSetById(registry, "RS-RONZANO-PREMOTOR-POSITIONS");
  check(ronzanoRecordSet.includedRecordCount.unit === "coordinate_rows_across_two_independent_representations", "Ronzano record-set unit is invalid");
  check(/not unique cells/.test(ronzanoRecordSet.includedRecordCount.scope), "Ronzano record-set scope must reject a unique-cell interpretation");
  check(ronzanoRecordSet.dataPath === "public/data/ronzano_premotor_positions_v1/positions.json", "Ronzano positions data path is invalid");
  check(ronzanoRecordSet.idField === "sourceFileId+sourceRow" && ronzanoRecordSet.childRosterRef.idField === "sourceFileId+sourceRow", "Ronzano row identity key is invalid");
  const ronzanoAsset = ronzano.assets.find((asset) => asset.id === "ASSET-RONZANO-PREMOTOR-POSITIONS-V1");
  check(ronzanoAsset?.integrity.bytes === 1274690, "Ronzano derived position asset byte count is invalid");
  check(ronzanoAsset?.integrity.sha256 === "abf46460d0e37c2ea82b90f2eaf6531d5df8f44e9dcea8448d43d321835184f3", "Ronzano derived position asset SHA-256 is invalid");
  check(ronzano.rights.status === "CC-BY-4.0" && /CC BY 4\.0/.test(ronzano.rights.note), "Ronzano rights receipt is invalid");
  const ronzanoMissingFields = new Set(ronzano.missingness.map((gap) => gap.field));
  for (const field of ["life_stage_scope", "adult_persistence", "coordinate_frame_scope", "atlas_registration", "cross_representation_row_identity", "soma_geometry", "cell_morphology", "synapses", "organelles"]) {
    check(ronzanoMissingFields.has(field), `Ronzano missingness is incomplete: ${field}`);
  }

  const crozat = sourceById(registry, "SRC-CROZAT-2025");
  check(crozat.citation.doi === "10.1038/s42003-025-08559-x", "Crozat primary DOI is invalid");
  check(crozat.rights.status === "CC-BY-4.0" && /CC BY 4\.0/.test(crozat.rights.note), "Crozat Figshare rights receipt is invalid");
  check(JSON.stringify(crozat.researchLanes) === JSON.stringify(["types", "sources"]), "Crozat research lanes are invalid");
  check(JSON.stringify(crozat.linkedUpgradeIds) === JSON.stringify(["UPG-168", "UPG-172"]), "Crozat linked upgrades are invalid");
  const crozatRecordSet = recordSetById(registry, "RS-CROZAT-PKD2L1-FUNCTIONAL-PROFILE");
  check(crozatRecordSet.includedRecordCount.value === 1 && /rather than additional types/.test(crozatRecordSet.includedRecordCount.scope), "Crozat one-profile type boundary is invalid");
  check(crozatRecordSet.childRosterRef.status === "none_reported" && /no globally stable cell identifier/.test(crozatRecordSet.childRosterRef.missingReason), "Crozat global cell-roster boundary is invalid");
  const crozatRemote = crozat.assets.find((asset) => asset.id === "ASSET-CROZAT-FIGSHARE-29430869-V2");
  check(crozatRemote?.bundled === false && crozatRemote.integrity.bytes === 1848613 && crozatRemote.integrity.sha256 === null, "Crozat remote-dataset receipt is invalid");
  const crozatContract = crozat.assets.find((asset) => asset.id === "ASSET-CROZAT-PKD2L1-DERIVED-CONTRACT");
  check(crozatContract?.bundled === true && crozatContract.integrity.bytes === 20460 && crozatContract.integrity.sha256 === "ca022532c23f5d9967fce7efcbd5bde57b1d4f59516cb10764dd1b422dd8ed64", "Crozat derived-contract receipt is invalid");
  check(crozat.experimentalUnits.find((unit) => unit.unit === "firing_pattern_cell")?.count === 65, "Crozat firing-pattern denominator is invalid");
  check(crozat.experimentalUnits.find((unit) => unit.unit === "passive_property_observation")?.count === 654, "Crozat deposited passive-property denominator is invalid");
  check(/Four source conflicts stay quarantined/.test(crozat.admission.note), "Crozat source-conflict quarantine is missing");

  const dmrt3 = sourceById(registry, "SRC-IGLESIAS-GONZALEZ-2021");
  check(dmrt3.citation.doi === "10.3389/fncel.2021.781197", "Dmrt3/dI6 primary DOI is invalid");
  check(JSON.stringify(dmrt3.researchLanes) === JSON.stringify(["types", "coverage", "sources"]), "Dmrt3/dI6 research lanes are invalid");
  check(JSON.stringify(dmrt3.linkedUpgradeIds) === JSON.stringify(["UPG-171", "UPG-174"]), "Dmrt3/dI6 linked upgrades are invalid");
  check(dmrt3.experimentalUnits.find((unit) => unit.unit === "source_embryo")?.count === 3, "Dmrt3/dI6 embryo denominator is invalid");
  check(dmrt3.experimentalUnits.find((unit) => unit.unit === "pooled_library")?.count === 1, "Dmrt3/dI6 pooled-library denominator is invalid");
  check(dmrt3.experimentalUnits.find((unit) => unit.unit === "deposited_mouse_well")?.count === 384, "Dmrt3/dI6 deposited-well denominator is invalid");
  check(dmrt3.experimentalUnits.find((unit) => unit.unit === "executed_notebook_qc_cell")?.count === 354, "Dmrt3/dI6 QC denominator is invalid");
  check(dmrt3.experimentalUnits.find((unit) => unit.unit === "retained_di6_lineage_cell")?.count === 274, "Dmrt3/dI6 retained-lineage denominator is invalid");
  const dmrt3RecordSet = recordSetById(registry, "RS-DMRT3-DI6-M1-M6-GROUPS");
  check(dmrt3RecordSet.includedRecordCount.value === 6 && /not adult canonical types/.test(dmrt3RecordSet.includedRecordCount.scope), "Dmrt3/dI6 six-group boundary is invalid");
  check(dmrt3RecordSet.childRosterRef.status === "not_exported_by_source" && /does not reconstruct/.test(dmrt3RecordSet.childRosterRef.missingReason), "Dmrt3/dI6 per-well roster must remain unavailable");
  const dmrt3Loom = dmrt3.assets.find((asset) => asset.id === "ASSET-DMRT3-GSE185731-LOOM");
  check(dmrt3Loom?.bundled === false && dmrt3Loom.integrity.bytes === 47641669 && dmrt3Loom.integrity.sha256 === "f31abb7678ed88af3e140ca488dfdce867809569784bc1881777462fdc87b23c", "Dmrt3/dI6 GEO loom receipt is invalid");
  const dmrt3Notebook = dmrt3.assets.find((asset) => asset.id === "ASSET-DMRT3-EXECUTED-NOTEBOOK");
  check(dmrt3Notebook?.bundled === false && dmrt3Notebook.integrity.bytes === 21627568 && dmrt3Notebook.integrity.sha256 === "c51fa89ea3ce7f55a361ffe8b94f48b73bd9669c4260aeb3ee482208f23a9008", "Dmrt3/dI6 notebook receipt is invalid");
  const dmrt3Contract = dmrt3.assets.find((asset) => asset.id === "ASSET-DMRT3-DI6-DERIVED-CONTRACT");
  check(dmrt3Contract?.bundled === true && dmrt3Contract.integrity.bytes === 22490 && dmrt3Contract.integrity.sha256 === "e5d7b26df781033a971282b697684cf6f71daa2fe711883475723186c2d92468", "Dmrt3/dI6 derived-contract receipt is invalid");
  check(dmrt3.rights.status === "source_code_MIT_data_reuse_not_assumed" && /link-only/.test(dmrt3.rights.note), "Dmrt3/dI6 rights boundary is invalid");
  check(/No per-well roster.*morphology.*internal object/i.test(dmrt3.admission.note), "Dmrt3/dI6 admission boundary is incomplete");

  const roome = sourceById(registry, "SRC-ROOME-2026");
  check(roome.citation.doi === "10.1126/science.adx5781", "Roome primary DOI is invalid");
  check(roome.citation.articleUrl === "https://pmc.ncbi.nlm.nih.gov/articles/PMC12879194/", "Roome article URL is invalid");
  check(JSON.stringify(roome.researchLanes) === JSON.stringify(["types", "coverage", "sources"]), "Roome research lanes are invalid");
  check(JSON.stringify(roome.linkedUpgradeIds) === JSON.stringify(["UPG-180"]), "Roome linked upgrades are invalid");
  check(roome.experimentalUnits.find((unit) => unit.unit === "biological_litter_pool")?.count === 15, "Roome biological litter-pool denominator is invalid");
  const roomeTechnicalOutputs = roome.experimentalUnits.find((unit) => unit.unit === "retained_technical_output");
  check(roomeTechnicalOutputs?.count === 29 && /not 29 biological replicates/.test(roomeTechnicalOutputs.scope), "Roome retained technical-output boundary is invalid");
  check(roome.experimentalUnits.find((unit) => unit.unit === "post_filter_cell")?.count === 195146, "Roome post-filter cell denominator is invalid");
  check(roome.experimentalUnits.find((unit) => unit.unit === "neuron")?.count === 94048, "Roome neuron denominator is invalid");
  check(roome.experimentalUnits.find((unit) => unit.unit === "refined_dil_cell")?.count === 61444, "Roome refined dIL cell denominator is invalid");
  const roomeRecordSet = recordSetById(registry, "RS-ROOME-REFINED-DIL-TYPES");
  check(roomeRecordSet.includedRecordCount.value === 157 && /exact Table S6 refined dIL labels/.test(roomeRecordSet.includedRecordCount.scope), "Roome exact 157-profile denominator is invalid");
  check(/captured-cell counts, composition and QC remain source-local/.test(roomeRecordSet.includedRecordCount.scope), "Roome source-local metric boundary is invalid");
  check(roomeRecordSet.dataPath === "data/roome-dil-source-taxonomy-0.1.json", "Roome taxonomy path is invalid");
  check(roomeRecordSet.idField === "profiles[].id" && roomeRecordSet.childRosterRef.idField === "profiles[].id", "Roome profile identity field is invalid");
  check(roomeRecordSet.childRosterRef.status === "bundled_exact" && roomeRecordSet.childRosterRef.path === roomeRecordSet.dataPath, "Roome exact profile roster must resolve to the bundled factual contract");
  const roomeTableS6 = roome.assets.find((asset) => asset.id === "ASSET-ROOME-TABLE-S6");
  check(roomeTableS6?.bundled === false && roomeTableS6.integrity.bytes === 21302 && roomeTableS6.integrity.sha256 === "8f52a7a1f223953a5b57a50a01679f9626c6d73a13f1aba8b61093b2aeb4cdd2", "Roome Table S6 link-only receipt is invalid");
  const roomeTableS7 = roome.assets.find((asset) => asset.id === "ASSET-ROOME-TABLE-S7");
  check(roomeTableS7?.bundled === false && roomeTableS7.integrity.bytes === 1005043 && roomeTableS7.integrity.sha256 === "2ffcf3dc0773d4242cbd1d7312994ab64a2a474e463c13864d7aaa5f073a829e", "Roome Table S7 link-only receipt is invalid");
  const roomeGeo = roome.assets.find((asset) => asset.id === "ASSET-ROOME-GSE291462");
  check(roomeGeo?.bundled === false && roomeGeo.integrity.bytes === null && roomeGeo.integrity.sha256 === null && /37-sample SuperSeries/.test(roomeGeo.integrity.missingReason ?? ""), "Roome GEO SuperSeries link-only boundary is invalid");
  const roomeCode = roome.assets.find((asset) => asset.id === "ASSET-ROOME-AUTHOR-CODE");
  check(roomeCode?.bundled === false && /@138d321e2c3490189efcf7a10cf9b248b506bee4$/.test(roomeCode.accession) && /no detected license/.test(roomeCode.integrity.missingReason ?? ""), "Roome author-code link-only boundary is invalid");
  const roomeContract = roome.assets.find((asset) => asset.id === "ASSET-ROOME-DIL-DERIVED-CONTRACT");
  check(roomeContract?.bundled === true && roomeContract.integrity.bytes === 631320 && roomeContract.integrity.sha256 === "dc25145e21a2f3be4faf0d65c2bd8418339a173c99ed1548564cc07c03c348e9", "Roome derived taxonomy receipt is invalid");
  const roomeFeatureEvidence = roome.assets.find((asset) => asset.id === "ASSET-ROOME-DIL-FULL-FEATURE-EVIDENCE");
  check(roomeFeatureEvidence?.bundled === true && roomeFeatureEvidence.integrity.bytes === 5072736 && roomeFeatureEvidence.integrity.sha256 === "5cecf178f75aa00aff1b73ad43565fb9b85b3cfa75093c6cca2ea2ae4615b6c9", "Roome full differential-feature receipt is invalid");
  check(/Tables S6 and S7 CC BY/.test(roome.rights.note) && /GEO source objects.*NOASSERTION/.test(roome.rights.note) && /author-code repository.*NOASSERTION/.test(roome.rights.note) && /link-only/.test(roome.rights.note), "Roome mixed-rights boundary is invalid");
  check(/26 quarantined spreadsheet gene-cell anomalies/.test(roome.admission.note), "Roome anomaly quarantine is missing");
  check(/No source workbook, GEO object or author code is copied/.test(roome.admission.note), "Roome link-only source-object boundary is incomplete");
  check(/no morphology.*whole-cell geometry.*internal structure.*same-cell scRNA-Xenium join.*cross-source identity/i.test(roome.admission.note), "Roome zero-geometry and no-join boundaries are incomplete");
  const roomeMissingness = new Map(roome.missingness.map((item) => [item.field, item]));
  check(roomeMissingness.get("biological_prevalence")?.status === "NOT_ESTABLISHED" && /not unbiased population prevalence/.test(roomeMissingness.get("biological_prevalence")?.reason ?? ""), "Roome captured-cell prevalence boundary is invalid");
  check(roomeMissingness.get("per_type_spatial_coordinates")?.status === "NOT_ADMITTED", "Roome coordinates must remain unadmitted");
  check(roomeMissingness.get("same_cell_scrna_xenium_join")?.status === "NOT_ESTABLISHED", "Roome scRNA-Xenium same-cell relationship must remain unestablished");
  check(roomeMissingness.get("cell_geometry_and_internal_structure")?.status === "UNAVAILABLE" && /zero soma boundaries/.test(roomeMissingness.get("cell_geometry_and_internal_structure")?.reason ?? ""), "Roome geometry and internal structures must remain unavailable");
  check(roomeMissingness.get("atlas_registration")?.status === "NOT_ESTABLISHED" && /registration count remains zero/.test(roomeMissingness.get("atlas_registration")?.reason ?? ""), "Roome registration must remain zero");
  check(roomeMissingness.get("cross_source_identity")?.status === "NOT_ESTABLISHED", "Roome cross-source identity must remain unestablished");
  check(roomeMissingness.get("spreadsheet_gene_cell_anomalies")?.status === "CONFLICT_QUARANTINED" && /Twenty-six Table S7 gene cells/.test(roomeMissingness.get("spreadsheet_gene_cell_anomalies")?.reason ?? ""), "Roome spreadsheet anomaly quarantine is invalid");

  validateCrozatNaVSourceRegistryRelationship(registry);
  validateGarciaRamirezSourceRegistryRelationship(registry);
  return registry;
}

export function summarizeResearchSourceRegistry(registry) {
  validateResearchSourceRegistry(registry);
  const recordSets = registry.sources.flatMap((source) => source.recordSets);
  return {
    releaseId: registry.releaseId,
    sourceCount: registry.sources.length,
    recordSetCount: recordSets.length,
    aliasCount: registry.sources.reduce((total, source) => total + source.aliases.length, 0),
    typeRecordCount: ["RS-RUSS-POPULATIONS", "RS-SATHYAMURTHY-CLUSTERS", "RS-HAYASHI-CLUSTERS", "RS-HARING-FINAL-TYPES", "RS-ALKASLASI-INTERNEURON-CLUSTERS", "RS-DMRT3-DI6-M1-M6-GROUPS", "RS-ROOME-REFINED-DIL-TYPES", "RS-CROZAT-PKD2L1-FUNCTIONAL-PROFILE", "RS-DELILE-FINE-SUBTYPES", "RS-CANOGOMEZ-P56-CONFIRMED-INTERNEURON-PROFILES"]
      .reduce((total, id) => total + recordSetById(registry, id).includedRecordCount.value, 0),
    bundledExactRosterCount: recordSets.filter((recordSet) => recordSet.childRosterRef.status === "bundled_exact").length,
    bundledExactSourceObjectSetCount: recordSets.filter((recordSet) => recordSet.sourceObjectSetRef?.status === "bundled_exact").length,
    openScopeContradictionCount: registry.knownScopeContradictions.filter((item) => item.status === "open").length,
    registrationCount: registry.scientificPolicy.registrationCount,
  };
}

export function validateResearchSourceUpgradeLinks(registry, upgradeRegistry) {
  validateResearchSourceRegistry(registry);
  check(isRecord(upgradeRegistry) && Array.isArray(upgradeRegistry.upgrades), "Research upgrade registry is required for source-link validation");
  const upgradeIds = new Set(upgradeRegistry.upgrades.map((upgrade) => upgrade.id));
  for (const source of registry.sources) {
    for (const upgradeId of source.linkedUpgradeIds) {
      check(upgradeIds.has(upgradeId), `${source.id} linked research upgrade is unresolved: ${upgradeId}`);
    }
  }
  return registry;
}

export async function loadResearchSourceRegistry() {
  return JSON.parse(await readFile(REGISTRY_PATH, "utf8"));
}

export async function loadResearchUpgradeRegistry() {
  return JSON.parse(await readFile(UPGRADE_REGISTRY_PATH, "utf8"));
}

export async function loadCanoGomezSourceRegistryPackage() {
  const registryBytes = await readFile(path.join(PROJECT_ROOT, CANO_GOMEZ_REGISTRY_PATH));
  const registry = JSON.parse(registryBytes.toString("utf8"));
  const artifactFileNames = [
    "GSE318731_all_nucleus_assignment_audit.csv.gz",
    "GSE318731_confirmed_interneuron_nucleus_roster.csv.gz",
  ];
  const artifactEntries = await Promise.all(artifactFileNames.map(async (fileName) => {
    const projectPath = `${CANO_GOMEZ_DATA_DIRECTORY}/${fileName}`;
    return [projectPath, await readFile(path.join(PROJECT_ROOT, projectPath))];
  }));
  return {
    registry,
    packageFiles: new Map([
      [CANO_GOMEZ_REGISTRY_PATH, registryBytes],
      ...artifactEntries,
    ]),
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const [registry, upgradeRegistry] = await Promise.all([
    loadResearchSourceRegistry(),
    loadResearchUpgradeRegistry(),
  ]);
  validateResearchSourceUpgradeLinks(registry, upgradeRegistry);
  const releaseDeltaBytes = await readFile(path.join(PROJECT_ROOT, "data/neuromorpho-release-8-6-125-query-delta-audit-0.1.json"));
  const neuromorpho = sourceById(registry, "SRC-NEUROMORPHO-8-6-124");
  const releaseDeltaAsset = neuromorpho.assets.find((asset) => asset.id === "ASSET-NEUROMORPHO-RELEASE-8-6-125-METADATA-DELTA");
  check(neuromorpho.linkedUpgradeIds.includes("UPG-228")
    && neuromorpho.modalities.includes("repository version metadata delta audit"), "NeuroMorpho release-delta audit must remain linked to UPG-228");
  check(releaseDeltaAsset?.accession === "ohri-neuromorpho-release-8-6-125-query-delta-audit-0.1.0"
    && releaseDeltaAsset.bundled === true
    && releaseDeltaAsset.integrity?.bytes === releaseDeltaBytes.byteLength
    && releaseDeltaAsset.integrity?.sha256 === sha256Bytes(releaseDeltaBytes), "NeuroMorpho release-delta source asset receipt does not match the bundled contract");
  const canoPackage = await loadCanoGomezSourceRegistryPackage();
  await validateCanoGomezP56MultiomeInterneuronRegistryPackage(path.join(PROJECT_ROOT, CANO_GOMEZ_REGISTRY_PATH));
  validateCanoGomezSourceRegistryRelationship(registry, canoPackage.registry, canoPackage.packageFiles);
  await validateResearchSourceExtensions243(registry);
  await validatePersistedCrozatNaVSourceRegistryRelationship(registry);
  const summary = summarizeResearchSourceRegistry(registry);
  process.stdout.write(`Research source registry valid: ${summary.sourceCount} canonical sources, ${summary.recordSetCount} record sets, ${summary.typeRecordCount} source profiles, ${summary.bundledExactRosterCount} bundled exact cell/profile rosters, ${summary.bundledExactSourceObjectSetCount} bundled exact source-object set, ${summary.openScopeContradictionCount} open scope contradictions, ${summary.registrationCount} registrations.\n`);
}
