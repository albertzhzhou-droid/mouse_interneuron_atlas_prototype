#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export const QUEUE_PATH = "docs/RESEARCH_MODEL_UPGRADE_QUEUE.md";
export const REGISTRY_PATH = "data/research-model-upgrade-registry-0.1.json";
const QUEUE_URL = new URL(`../${QUEUE_PATH}`, import.meta.url);
const REGISTRY_URL = new URL(`../${REGISTRY_PATH}`, import.meta.url);

export const RESEARCH_LANES = Object.freeze([
  "reference_anatomy",
  "molecular_taxonomy",
  "spatial_context",
  "morphology",
  "connectivity",
  "injury_state_context",
  "electrophysiology",
  "internal_microdetail",
  "provenance_and_identity",
  "research_experience",
  "cross_cutting_research",
]);

export const BLOCKER_CODES = Object.freeze([
  "none_for_declared_increment",
  "implementation",
  "remaining_validation",
  "evidence_review",
  "source_object",
  "rights_or_permission",
  "data_anomaly",
  "admission_evidence",
  "raw_data_unavailable",
]);

const LANE_OVERRIDE_GROUPS = Object.freeze({
  reference_anatomy: ["UPG-022", "UPG-024", "UPG-025", "UPG-026", "UPG-037", "UPG-038"],
  molecular_taxonomy: [
    "UPG-023", "UPG-027A", "UPG-027B", "UPG-032", "UPG-033", "UPG-040", "UPG-041", "UPG-044",
    "UPG-054", "UPG-055", "UPG-056", "UPG-060", "UPG-066", "UPG-067", "UPG-072", "UPG-076",
    "UPG-077", "UPG-079", "UPG-082", "UPG-084", "UPG-086", "UPG-106", "UPG-117", "UPG-132",
    "UPG-133", "UPG-141", "UPG-142", "UPG-146", "UPG-157", "UPG-164", "UPG-171", "UPG-174",
    "UPG-180", "UPG-185", "UPG-187", "UPG-190", "UPG-204", "UPG-209", "UPG-210", "UPG-211",
  ],
  spatial_context: [
    "UPG-028", "UPG-029", "UPG-029A", "UPG-031", "UPG-035", "UPG-036", "UPG-039", "UPG-039A",
    "UPG-042", "UPG-065", "UPG-073", "UPG-083", "UPG-100", "UPG-114", "UPG-115", "UPG-135",
    "UPG-144", "UPG-161", "UPG-163", "UPG-170",
  ],
  morphology: [
    "UPG-030", "UPG-046", "UPG-050", "UPG-087", "UPG-088", "UPG-098", "UPG-105", "UPG-119",
    "UPG-126", "UPG-127", "UPG-130", "UPG-131", "UPG-137", "UPG-138", "UPG-139", "UPG-140",
    "UPG-143", "UPG-145", "UPG-149", "UPG-155", "UPG-158", "UPG-182", "UPG-186", "UPG-193", "UPG-194",
    "UPG-197", "UPG-198", "UPG-203", "UPG-205", "UPG-207", "UPG-208",
  ],
  connectivity: ["UPG-034", "UPG-045", "UPG-047", "UPG-057", "UPG-058", "UPG-059", "UPG-061", "UPG-081", "UPG-085", "UPG-123", "UPG-147"],
  injury_state_context: [
    "UPG-062", "UPG-063", "UPG-064", "UPG-068", "UPG-069", "UPG-070", "UPG-071", "UPG-074",
    "UPG-075", "UPG-078", "UPG-116", "UPG-148", "UPG-156", "UPG-162",
  ],
  electrophysiology: ["UPG-043", "UPG-080", "UPG-154", "UPG-172", "UPG-173"],
  internal_microdetail: [
    "UPG-089", "UPG-092", "UPG-093", "UPG-094", "UPG-095", "UPG-096", "UPG-099", "UPG-101",
    "UPG-103", "UPG-104", "UPG-111", "UPG-112", "UPG-120", "UPG-121", "UPG-122", "UPG-124", "UPG-128", "UPG-129",
    "UPG-134", "UPG-136", "UPG-177", "UPG-178", "UPG-179", "UPG-184", "UPG-188", "UPG-189",
    "UPG-195", "UPG-196", "UPG-213", "UPG-214", "UPG-215",
  ],
  provenance_and_identity: [
    "UPG-051", "UPG-052", "UPG-090", "UPG-091", "UPG-097", "UPG-102", "UPG-108", "UPG-109",
    "UPG-110", "UPG-113", "UPG-118", "UPG-125", "UPG-191", "UPG-192", "UPG-202",
  ],
  research_experience: [
    "UPG-048", "UPG-049", "UPG-053", "UPG-107", "UPG-159", "UPG-160", "UPG-167", "UPG-181", "UPG-183",
    "UPG-199", "UPG-200", "UPG-201", "UPG-206", "UPG-212",
  ],
});

const laneOverrideEntries = Object.entries(LANE_OVERRIDE_GROUPS)
  .flatMap(([lane, ids]) => ids.map((id) => [id, lane]));
if (new Set(laneOverrideEntries.map(([id]) => id)).size !== laneOverrideEntries.length) {
  throw new Error("Research lane overrides contain a duplicate upgrade id");
}
const LANE_OVERRIDES = new Map(laneOverrideEntries);

const LANE_RULES = Object.freeze([
  ["internal_microdetail", /internal[- ](?:structure|detail)|micro[- ]detail|organelle|mitochondri|nucleus|same[- ]cell|segmentation|super-clem|serial[- ]em|serial sections|microns|openorganelle/i],
  ["electrophysiology", /electrophysiolog|\bephys\b|\.abf\b|nwb electrophysiology|patch-seq/i],
  ["morphology", /neuromorpho|\bswc\b|neurite|morpholog|reconstruction census|cell-form|sholl|branch-order/i],
  ["spatial_context", /xenium|merfish|visium|starmap|spatial|coordinate|registration|reference space|point viewer|cartesian|light-sheet/i],
  ["injury_state_context", /\bsci\b|spinal cord injury|\binjury\b|lesion|\bsni\b|neuropathic pain|microglia|odc-sci|contusion|transection/i],
  ["connectivity", /connectiv|connectome|projectome|projection|premotor|synap|monosynaptic|circuit|h129|tracing/i],
  ["molecular_taxonomy", /taxonomy|cell type|type-evidence|molecular|scrna|snrna|multiomic|marker|lineage|transcript|ribotag|trap population/i],
  ["reference_anatomy", /atlas|lamina|gray-matter|compartment|tract|anatom|reference frame|terminology|annotation-state/i],
  ["research_experience", /researcher|information experience|accessibility|browser|workbench|dossier|explorer/i],
]);

const BOUNDARY_PATTERN = /\b(?:not|no|never|cannot|only|without|unless|disabled|unavailable|separate|distinct|blocked|pending|fail(?:s|ed)? closed|remain(?:s|ed)?|prohibit(?:s|ed)?|exclude(?:s|d)?)\b/i;
const GATE_PATTERN = /\b(?:only after|before any|blocked|pending|must|requires?|until|no-go|after resolving|after detecting|after .* audit|when .* verified)\b/i;

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function splitClauses(description) {
  const inlineCode = [];
  const protectedDescription = description.replace(/`[^`\n]+`/g, (segment) => {
    const token = `INLINECODETOKEN${inlineCode.length}`;
    inlineCode.push(segment);
    return token;
  });
  return protectedDescription
    .split(/(?<=[.!?])\s+|;\s+/)
    .map((clause) => normalizeWhitespace(clause).replace(/INLINECODETOKEN(\d+)/g, (_token, index) => inlineCode[Number(index)]))
    .filter(Boolean);
}

export function parseUpgradeId(id) {
  const match = /^UPG-(\d{3})([A-Z])?$/.exec(id);
  check(match, `Invalid research upgrade id: ${id}`);
  return { number: Number(match[1]), suffix: match[2] ?? "" };
}

function compareUpgradeIds(left, right) {
  const a = parseUpgradeId(left);
  const b = parseUpgradeId(right);
  return a.number - b.number || a.suffix.localeCompare(b.suffix);
}

export function parseEvidenceBasis(markdown) {
  const references = [];
  const pattern = /\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g;
  for (const match of markdown.matchAll(pattern)) {
    references.push({ label: normalizeWhitespace(match[1]), url: match[2] });
  }
  const unlinkedText = normalizeWhitespace(markdown.replace(pattern, "$1"));
  return { markdown, unlinkedText, references };
}

export function classifyResearchLane(row) {
  const override = LANE_OVERRIDES.get(row.id);
  if (override) return override;
  const corpus = `${row.description} ${row.evidenceBasisMarkdown}`;
  return LANE_RULES.find(([, pattern]) => pattern.test(corpus))?.[0] ?? "cross_cutting_research";
}

export function deriveBlocker(row) {
  const statusAndDescription = `${row.status} ${row.description}`;
  let code;
  if (/^completed$/i.test(row.status)) code = "none_for_declared_increment";
  else if (/raw-data-blocked|no stable raw object|raw ingestion is blocked/i.test(statusAndDescription)) code = "raw_data_unavailable";
  else if (/rights|permission|licen[cs]e/i.test(statusAndDescription)) code = "rights_or_permission";
  else if (/anomaly-gated|discrepancy|checksum match/i.test(statusAndDescription)) code = "data_anomaly";
  else if (/admission-gated|admit .* only|admission remains blocked/i.test(statusAndDescription)) code = "admission_evidence";
  else if (/exact-object|source-object|object-audit|stable (?:public )?(?:object|endpoint)|file-level/i.test(statusAndDescription)) code = "source_object";
  else if (/partially completed|in progress/i.test(row.status)) code = "remaining_validation";
  else if (/planned/i.test(row.status)) code = "implementation";
  else code = "evidence_review";

  const gatingClause = splitClauses(row.description).find((clause) => GATE_PATTERN.test(clause));
  const detail = code === "none_for_declared_increment"
    ? "No blocker is recorded for the queue row's currently declared completed increment; its acceptance boundary still applies."
    : gatingClause ?? `Queue status is "${row.status}"; completion remains blocked at the evidence and implementation boundary stated in the queue row.`;
  return { code, detail };
}

export function deriveAcceptanceBoundary(row) {
  const boundaryClauses = splitClauses(row.description).filter((clause) => BOUNDARY_PATTERN.test(clause));
  if (boundaryClauses.length) return boundaryClauses.join("; ");
  if (/^completed$/i.test(row.status)) {
    return "Acceptance is limited to the implemented increment described in this queue row; completion does not broaden its primary evidence basis.";
  }
  return "Acceptance requires the described increment to be completed within the cited evidence basis; no broader biological identity, geometry, or causal claim is authorized.";
}

export function parseResearchUpgradeQueue(markdown) {
  check(typeof markdown === "string" && markdown.length > 0, "Research upgrade queue Markdown is required");
  const snapshotMatch = /^Snapshot date:\s*(\d{4}-\d{2}-\d{2})\s*$/m.exec(markdown);
  check(snapshotMatch, "Research upgrade queue must declare an ISO snapshot date");

  const rows = [];
  for (const [index, line] of markdown.split(/\r?\n/).entries()) {
    if (!/^\|\s*UPG-\d{3}[A-Z]?\s*\|/.test(line)) continue;
    const cells = line.split("|").slice(1, -1).map((cell) => normalizeWhitespace(cell));
    check(cells.length === 5, `Queue line ${index + 1} must contain exactly five table cells`);
    const [id, priority, status, description, evidenceBasisMarkdown] = cells;
    const parsedId = parseUpgradeId(id);
    check(parsedId.number >= 22, `${id} belongs to the governance/admission queue and must not enter the research/model registry`);
    check(/^P[0-2]$/.test(priority), `${id} has invalid priority ${priority}`);
    for (const [label, value] of [["status", status], ["description", description], ["evidence basis", evidenceBasisMarkdown]]) {
      check(value.length > 0, `${id} has an empty ${label}`);
    }
    rows.push({ id, priority, status, description, evidenceBasisMarkdown, sourceLine: index + 1 });
  }

  check(rows.length > 0, "No UPG-022-or-later table rows were found");
  check(new Set(rows.map((row) => row.id)).size === rows.length, "Research upgrade ids must be unique");
  const sortedIds = rows.map((row) => row.id).toSorted(compareUpgradeIds);
  check(rows.every((row, index) => row.id === sortedIds[index]), "Research upgrade rows must remain sorted by id");
  check(rows[0].id === "UPG-022", "Research/model registry must begin at UPG-022");
  return { snapshotDate: snapshotMatch[1], rows };
}

function countBy(items, selector) {
  return Object.fromEntries([...items.reduce((counts, item) => {
    const key = selector(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    return counts;
  }, new Map()).entries()].sort(([left], [right]) => left.localeCompare(right)));
}

export function buildResearchUpgradeRegistry(markdown) {
  const { snapshotDate, rows } = parseResearchUpgradeQueue(markdown);
  const upgrades = rows.map((row) => ({
    id: row.id,
    priority: row.priority,
    status: row.status,
    lane: classifyResearchLane(row),
    description: row.description,
    blocker: deriveBlocker(row),
    evidenceBasis: parseEvidenceBasis(row.evidenceBasisMarkdown),
    lastVerification: {
      date: snapshotDate,
      scope: "queue_row_and_registry_derivation",
      sourcePath: `${QUEUE_PATH}#L${row.sourceLine}`,
      independentEvidenceRecheck: false,
    },
    acceptanceBoundary: deriveAcceptanceBoundary(row),
  }));

  return {
    schemaVersion: "0.1.0",
    registryId: "ohri-research-model-upgrade-registry-0.1.0",
    registryKind: "research_model_only",
    sourceQueue: {
      path: QUEUE_PATH,
      snapshotDate,
      firstIncludedId: "UPG-022",
      lastIncludedId: upgrades.at(-1).id,
      governanceAdmissionQueueIncluded: false,
      excludedGovernanceAdmissionRange: "UPG-001-UPG-021",
    },
    verificationPolicy: {
      lastVerificationMeaning: "The row was synchronized from the dated queue and deterministic derivations were recomputed; cited external evidence was not independently rechecked by this build.",
      acceptanceBoundaryMeaning: "The narrowest explicit no-go or scope boundary in the queue row; it cannot authorize a broader biological claim. Records retain stable source-qualified keys, and no cross-source join exists without an exact source-deposited shared key.",
    },
    controlledVocabularies: {
      lanes: [...RESEARCH_LANES],
      blockerCodes: [...BLOCKER_CODES],
    },
    summary: {
      upgradeCount: upgrades.length,
      byPriority: countBy(upgrades, (item) => item.priority),
      byStatus: countBy(upgrades, (item) => item.status),
      byLane: countBy(upgrades, (item) => item.lane),
    },
    upgrades,
  };
}

export function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export async function buildCanonicalRegistry() {
  const markdown = await readFile(QUEUE_URL, "utf8");
  return buildResearchUpgradeRegistry(markdown);
}

async function main() {
  const mode = process.argv[2] ?? "--write";
  check(["--write", "--check"].includes(mode), "Usage: build_research_upgrade_registry.mjs [--write|--check]");
  const registry = await buildCanonicalRegistry();
  const rendered = stableJson(registry);
  if (mode === "--write") {
    await writeFile(REGISTRY_URL, rendered, "utf8");
    console.log(`Wrote ${REGISTRY_PATH}: ${registry.summary.upgradeCount} research/model upgrades`);
    return;
  }
  const current = await readFile(REGISTRY_URL, "utf8");
  check(current === rendered, `${REGISTRY_PATH} is stale; run npm run build:research-upgrades`);
  console.log(`${REGISTRY_PATH} is deterministic and current: ${registry.summary.upgradeCount} upgrades`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
