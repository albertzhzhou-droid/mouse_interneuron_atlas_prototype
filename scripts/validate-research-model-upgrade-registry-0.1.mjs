#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  BLOCKER_CODES,
  QUEUE_PATH,
  REGISTRY_PATH,
  RESEARCH_LANES,
  buildResearchUpgradeRegistry,
  parseUpgradeId,
  stableJson,
} from "../tools/build_research_upgrade_registry.mjs";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_URL = new URL(`../${REGISTRY_PATH}`, import.meta.url);
const QUEUE_URL = new URL(`../${QUEUE_PATH}`, import.meta.url);
const APP_ROOT = resolve(PROJECT_ROOT, "app");
const APP_SOURCE_EXTENSION = /\.(?:js|jsx|ts|tsx)$/;
const UPGRADE_ID_PATTERN = /UPG-\d{3}[A-Z]?/g;
const EXPECTED_UPGRADE_COUNT = 197;
const EXPECTED_COMPLETED_COUNT = 50;
const EXPECTED_LAST_INCLUDED_ID = "UPG-215";

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isIsoDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

async function listAppSourceFiles(directory = APP_ROOT) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listAppSourceFiles(path));
    else if (entry.isFile() && APP_SOURCE_EXTENSION.test(entry.name)) files.push(path);
  }
  return files.toSorted();
}

export async function collectDisplayedResearchUpgradeIds() {
  const ids = new Set();
  for (const path of await listAppSourceFiles()) {
    const source = await readFile(path, "utf8");
    for (const id of source.match(UPGRADE_ID_PATTERN) ?? []) {
      if (parseUpgradeId(id).number >= 22) ids.add(id);
    }
  }
  return [...ids].toSorted((left, right) => {
    const a = parseUpgradeId(left);
    const b = parseUpgradeId(right);
    return a.number - b.number || a.suffix.localeCompare(b.suffix);
  });
}

export function validateResearchUpgradeRegistry(registry, {
  queueMarkdown,
  displayedUpgradeIds = [],
  requireDeterministicMatch = true,
} = {}) {
  check(isRecord(registry), "Research/model upgrade registry must be an object");
  check(registry.schemaVersion === "0.1.0", "Research/model upgrade registry schemaVersion must be 0.1.0");
  check(registry.registryId === "ohri-research-model-upgrade-registry-0.1.0", "Research/model upgrade registry id changed");
  check(registry.registryKind === "research_model_only", "Registry must remain research/model-only");
  check(isRecord(registry.sourceQueue), "Registry sourceQueue is required");
  check(registry.sourceQueue.path === QUEUE_PATH, "Registry source queue path changed");
  check(registry.sourceQueue.firstIncludedId === "UPG-022", "Registry must begin at UPG-022");
  check(registry.sourceQueue.governanceAdmissionQueueIncluded === false, "Governance/admission queue must remain excluded");
  check(registry.sourceQueue.excludedGovernanceAdmissionRange === "UPG-001-UPG-021", "Excluded governance/admission range changed");
  check(isIsoDate(registry.sourceQueue.snapshotDate), "Registry queue snapshot date must be ISO YYYY-MM-DD");
  check(isRecord(registry.verificationPolicy), "Registry verification policy is required");
  check(nonEmpty(registry.verificationPolicy.lastVerificationMeaning), "Registry must explain lastVerification semantics");
  check(nonEmpty(registry.verificationPolicy.acceptanceBoundaryMeaning), "Registry must explain acceptanceBoundary semantics");
  check(isRecord(registry.controlledVocabularies), "Registry controlled vocabularies are required");
  check(stableJson(registry.controlledVocabularies.lanes) === stableJson(RESEARCH_LANES), "Research lane vocabulary changed");
  check(stableJson(registry.controlledVocabularies.blockerCodes) === stableJson(BLOCKER_CODES), "Blocker-code vocabulary changed");
  check(Array.isArray(registry.upgrades) && registry.upgrades.length > 0, "Registry upgrades must be a non-empty array");
  check(registry.upgrades.length === EXPECTED_UPGRADE_COUNT, `Registry must contain exactly ${EXPECTED_UPGRADE_COUNT} research/model upgrades`);

  const ids = new Set();
  for (const [index, upgrade] of registry.upgrades.entries()) {
    check(isRecord(upgrade), `upgrades[${index}] must be an object`);
    const parsedId = parseUpgradeId(upgrade.id);
    check(parsedId.number >= 22, `${upgrade.id} belongs to the excluded governance/admission queue`);
    check(!ids.has(upgrade.id), `Duplicate research/model upgrade id: ${upgrade.id}`);
    ids.add(upgrade.id);
    check(/^P[0-2]$/.test(upgrade.priority), `${upgrade.id}.priority is invalid`);
    for (const field of ["status", "lane", "description", "acceptanceBoundary"]) {
      check(nonEmpty(upgrade[field]), `${upgrade.id}.${field} is required`);
    }
    check(RESEARCH_LANES.includes(upgrade.lane), `${upgrade.id}.lane is not controlled`);
    check(isRecord(upgrade.blocker), `${upgrade.id}.blocker is required`);
    check(BLOCKER_CODES.includes(upgrade.blocker.code), `${upgrade.id}.blocker.code is not controlled`);
    check(nonEmpty(upgrade.blocker.detail), `${upgrade.id}.blocker.detail is required`);
    check(isRecord(upgrade.evidenceBasis), `${upgrade.id}.evidenceBasis is required`);
    check(nonEmpty(upgrade.evidenceBasis.markdown), `${upgrade.id}.evidenceBasis.markdown is required`);
    check(nonEmpty(upgrade.evidenceBasis.unlinkedText), `${upgrade.id}.evidenceBasis.unlinkedText is required`);
    check(Array.isArray(upgrade.evidenceBasis.references), `${upgrade.id}.evidenceBasis.references must be an array`);
    for (const [referenceIndex, reference] of upgrade.evidenceBasis.references.entries()) {
      check(isRecord(reference) && nonEmpty(reference.label), `${upgrade.id}.evidenceBasis.references[${referenceIndex}].label is required`);
      check(/^https:\/\//.test(reference.url), `${upgrade.id}.evidenceBasis.references[${referenceIndex}].url must use HTTPS`);
    }
    check(isRecord(upgrade.lastVerification), `${upgrade.id}.lastVerification is required`);
    check(upgrade.lastVerification.date === registry.sourceQueue.snapshotDate, `${upgrade.id}.lastVerification.date must match the queue snapshot`);
    check(upgrade.lastVerification.scope === "queue_row_and_registry_derivation", `${upgrade.id}.lastVerification.scope changed`);
    check(upgrade.lastVerification.independentEvidenceRecheck === false, `${upgrade.id} must not imply an independent evidence recheck`);
    check(new RegExp(`^${QUEUE_PATH.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}#L[1-9][0-9]*$`).test(upgrade.lastVerification.sourcePath), `${upgrade.id}.lastVerification.sourcePath is invalid`);
  }

  check(ids.has("UPG-113"), "UPG-113 must resolve in its own research/model registry");
  const upgradeById = new Map(registry.upgrades.map((upgrade) => [upgrade.id, upgrade]));
  for (const id of ["UPG-197", "UPG-198", "UPG-199"]) {
    check(upgradeById.get(id)?.status === "completed", `${id} must remain a completed 2.40 increment`);
  }
  for (const id of ["UPG-200", "UPG-201", "UPG-202", "UPG-203", "UPG-204"]) {
    const upgrade = upgradeById.get(id);
    check(upgrade?.status === "completed", `${id} must remain a completed 2.41 increment`);
    check(upgrade?.blocker?.code === "none_for_declared_increment", `${id} must retain the completed-increment blocker receipt`);
  }
  check(/seven explicitly source-closed.*200 vertices/i.test(upgradeById.get("UPG-197")?.description ?? ""), "UPG-197 exact NMO 45674 admission drifted");
  check(/15 source-native line loops and 475 vertices/i.test(upgradeById.get("UPG-198")?.description ?? ""), "UPG-198 five-file DAT audit denominator drifted");
  check(/eight-slot completeness selector.*376 molecular profiles.*nine exact source namespaces/i.test(upgradeById.get("UPG-199")?.description ?? ""), "UPG-199 fixed-slot completeness scope drifted");

  const activeRecordText = `${upgradeById.get("UPG-200")?.description ?? ""} ${upgradeById.get("UPG-200")?.acceptanceBoundary ?? ""}`;
  check(/deep-freezes? the full nested record graph/i.test(activeRecordText), "UPG-200 deep-frozen active-record receipt drifted");
  check(/same immutable object identity/i.test(activeRecordText), "UPG-200 shared immutable record identity drifted");

  const selectionDeltaText = `${upgradeById.get("UPG-201")?.description ?? ""} ${upgradeById.get("UPG-201")?.acceptanceBoundary ?? ""}`;
  for (const [recordId, loops, vertices] of [["50424", 8, 427], ["50394", 14, 768], ["50408", 11, 709]]) {
    check(new RegExp(`NMO[ _]${recordId}\\s*=\\s*${loops}\\s*\\/\\s*${vertices}`, "i").test(selectionDeltaText), `UPG-201 NMO ${recordId} selection-delta receipt drifted`);
  }
  check(/not evidence of developmental or biological transition/i.test(selectionDeltaText), "UPG-201 non-biological delta boundary drifted");

  const denominatorText = `${upgradeById.get("UPG-202")?.description ?? ""} ${upgradeById.get("UPG-202")?.acceptanceBoundary ?? ""}`;
  check(/derive every live research-facing[^.]*denominator from the checksum-verified canonical source registry/i.test(denominatorText), "UPG-202 dynamic registry-derivation boundary drifted");
  check(/resolves automatically to 27, 34, 10 and 1/i.test(denominatorText), "UPG-202 dynamic 27/34/10+1 denominator receipt drifted");

  const toddText = `${upgradeById.get("UPG-203")?.description ?? ""} ${upgradeById.get("UPG-203")?.acceptanceBoundary ?? ""}`;
  check(/33 retained objects and 1,904 vertices/i.test(toddText), "UPG-203 Todd 33/1,904 source-object receipt drifted");
  check(/48 ordered line loops\s*\/\s*2,379 vertices/i.test(toddText), "UPG-203 five-record 48/2,379 aggregate receipt drifted");
  check(/zero fill, triangles, loft, surface, membrane, volume, internal object/i.test(toddText), "UPG-203 zero-surface/internal boundary drifted");

  const canoText = `${upgradeById.get("UPG-204")?.description ?? ""} ${upgradeById.get("UPG-204")?.acceptanceBoundary ?? ""}`;
  check(/169,345 (?:source-scoped )?neuronal nuclei/i.test(canoText), "UPG-204 169,345-nucleus denominator drifted");
  check(/57 source-scoped groups/i.test(canoText), "UPG-204 57-group denominator drifted");
  check(/11 exact[^.]{0,80}`?CHOL_IN`? profiles/i.test(canoText), "UPG-204 exact 11-profile CHOL_IN admission drifted");
  check(/923 (?:admitted |confirmed )?(?:`?CHOL_IN`? )?nuclei/i.test(canoText), "UPG-204 923-nucleus admission drifted");
  check(/explicit(?:ly)?[^.]{0,160}(?:exclud|boundary)/i.test(canoText), "UPG-204 explicit exclusion-partition boundary drifted");
  for (const [label, pattern] of [["motor", "(?:motor|motoneuron)"], ["sensory", "sensory"], ["projection", "projection"], ["ambiguous", "ambiguous"], ["non-neuronal", "non[- ]?neuronal"]]) {
    check(new RegExp(`\\b${pattern}\\b`, "i").test(canoText), `UPG-204 ${label} exclusion boundary drifted`);
  }
  check(/516[^.]{0,180}(?:is|as|be|become|used)[^.]{0,80}(?:not|never)[^.]{0,120}interneuron denominator|516[^.]{0,180}(?:not|never)[^.]{0,120}interneuron denominator|(?:not|never)[^.]{0,120}516[^.]{0,120}interneuron denominator/i.test(canoText), "UPG-204 must state that paper total 516 is not the interneuron denominator");
  for (const [label, pattern] of [["geometry", "geometry"], ["internal-object", "internal objects?"], ["join", "(?:cross-source |same-cell )?joins?"], ["registration", "registrations?"]]) {
    check(new RegExp(`zero[^.]{0,160}\\b${pattern}\\b`, "i").test(canoText), `UPG-204 zero-${label} boundary drifted`);
  }
  check(registry.sourceQueue.lastIncludedId === EXPECTED_LAST_INCLUDED_ID, `Registry must end at ${EXPECTED_LAST_INCLUDED_ID}`);
  check(registry.sourceQueue.lastIncludedId === registry.upgrades.at(-1).id, "lastIncludedId does not match the final registry row");
  check(registry.summary?.upgradeCount === registry.upgrades.length, "Registry summary upgradeCount drifted");
  check(registry.summary?.byStatus?.completed === EXPECTED_COMPLETED_COUNT, `Registry must contain exactly ${EXPECTED_COMPLETED_COUNT} completed rows`);
  for (const id of displayedUpgradeIds) {
    check(parseUpgradeId(id).number >= 22, `${id} is not a research/model upgrade id`);
    check(ids.has(id), `Research-facing UI displays unresolved upgrade id ${id}`);
  }

  if (requireDeterministicMatch) {
    check(typeof queueMarkdown === "string", "Queue Markdown is required for deterministic validation");
    const expected = buildResearchUpgradeRegistry(queueMarkdown);
    check(stableJson(registry) === stableJson(expected), `${REGISTRY_PATH} is stale or was edited outside the deterministic builder`);
  }
  return registry;
}

export function summarizeResearchUpgradeRegistry(registry, displayedUpgradeIds = []) {
  return {
    registryId: registry.registryId,
    upgradeCount: registry.upgrades.length,
    firstIncludedId: registry.sourceQueue.firstIncludedId,
    lastIncludedId: registry.sourceQueue.lastIncludedId,
    displayedUpgradeCount: displayedUpgradeIds.length,
    unresolvedDisplayedUpgradeCount: displayedUpgradeIds.filter((id) => !registry.upgrades.some((upgrade) => upgrade.id === id)).length,
    governanceAdmissionQueueIncluded: registry.sourceQueue.governanceAdmissionQueueIncluded,
  };
}

export async function validateCanonicalResearchUpgradeRegistry() {
  const [registry, queueMarkdown, displayedUpgradeIds] = await Promise.all([
    readFile(REGISTRY_URL, "utf8").then(JSON.parse),
    readFile(QUEUE_URL, "utf8"),
    collectDisplayedResearchUpgradeIds(),
  ]);
  validateResearchUpgradeRegistry(registry, { queueMarkdown, displayedUpgradeIds });
  return summarizeResearchUpgradeRegistry(registry, displayedUpgradeIds);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateCanonicalResearchUpgradeRegistry().then((summary) => {
    console.log(`Research/model upgrade registry validation passed: ${summary.registryId}`);
    console.log(`${summary.upgradeCount} queue rows (${summary.firstIncludedId}–${summary.lastIncludedId}); ${summary.displayedUpgradeCount} research-facing UI ids resolved; governance/admission queue excluded`);
  }).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
