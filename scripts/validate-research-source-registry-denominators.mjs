#!/usr/bin/env node

import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  deriveResearchSourceRegistrySummary,
  formatResearchSourceRegistrySummary,
  formatResearchSourceRegistryTab,
} from "../app/research-source-registry-summary.js";

export const CANONICAL_DENOMINATOR_DISPLAYS = Object.freeze([
  Object.freeze({ id: "overview_compound", path: "app/ResearchOverview.tsx", token: "formatResearchSourceRegistrySummary(researchSourceRegistrySummary)", units: ["sources", "record_sets", "cell_profile_rosters", "source_object_sets"] }),
  Object.freeze({ id: "sources_tab", path: "app/ResearchDataLab.tsx", token: "formatResearchSourceRegistryTab(researchSourceRegistrySummary)", units: ["sources"] }),
  Object.freeze({ id: "registry_sources", path: "app/ResearchSourceRegistry.tsx", token: "registrySummary.sourceCount", units: ["sources"] }),
  Object.freeze({ id: "registry_record_sets", path: "app/ResearchSourceRegistry.tsx", token: "registrySummary.recordSetCount", units: ["record_sets"] }),
  Object.freeze({ id: "registry_cell_profile_rosters", path: "app/ResearchSourceRegistry.tsx", token: "registrySummary.bundledExactCellProfileRosterCount", units: ["cell_profile_rosters"] }),
  Object.freeze({ id: "registry_source_object_sets", path: "app/ResearchSourceRegistry.tsx", token: "registrySummary.bundledExactSourceObjectSetCount", units: ["source_object_sets"] }),
  Object.freeze({ id: "footer_compound", path: "app/AtlasPrototype.tsx", token: "formatResearchSourceRegistrySummary(researchSourceRegistrySummary)", units: ["sources", "record_sets", "cell_profile_rosters", "source_object_sets"] }),
  Object.freeze({ id: "iteration_241_release_metadata", path: "tools/build_research_iteration_manifest_2_41.mjs", token: "canonicalSourcePackageCount: current.registrySummary.sourceCount", units: ["sources", "record_sets", "cell_profile_rosters", "source_object_sets"], requiredTokens: [
    "canonicalRecordSetCount: current.registrySummary.recordSetCount",
    "bundledExactRosterCount: current.registrySummary.bundledExactCellProfileRosterCount",
    "bundledExactObjectSetCount: current.registrySummary.bundledExactSourceObjectSetCount",
  ] }),
]);

const STALE_LITERAL_PATTERNS = Object.freeze([
  /\b\d+\s+sources\s*·\s*\d+\s+record sets\s*·\s*\d+\s+exact cell\/profile rosters\s*\+\s*\d+\s+exact source-object sets?\b/g,
  /Sources\s*·\s*\d+\s+canonical packages\b/g,
  /<strong>\s*\d+\s*<\/strong>\s*<span>(?:canonical source packages|declared record sets|bundled exact cell\/profile rosters|bundled exact source-object sets)<\/span>/g,
  /\b\d+\s+canonical source(?: packages?)?\b/gi,
  /\b\d+\s+(?:declared\s+)?record sets?\b/gi,
  /\b\d+\s+(?:bundled\s+)?exact(?:\s+cell\/profile)?\s+rosters?\b/gi,
  /\b\d+\s+(?:bundled\s+)?exact source-object sets?\b/gi,
]);

function check(condition, message) {
  if (!condition) throw new Error(message);
}

async function collectAppSources(directory = new URL("../app/", import.meta.url)) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const url = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directory);
    if (entry.isDirectory()) return collectAppSources(url);
    if (!/\.(?:js|jsx|ts|tsx)$/.test(entry.name)) return [];
    return [{ path: `app/${entry.name}`, source: await readFile(url, "utf8") }];
  }));
  return nested.flat();
}

export function findStaleCanonicalDenominatorLiterals(files) {
  return files.flatMap(({ path, source }) => STALE_LITERAL_PATTERNS.flatMap((pattern) => {
    pattern.lastIndex = 0;
    return [...source.matchAll(pattern)].map((match) => ({ path, literal: match[0] }));
  }));
}

export async function validateResearchSourceRegistryDenominators({
  registry = null,
  appFiles = null,
} = {}) {
  const canonicalRegistry = registry ?? JSON.parse(await readFile(new URL("../data/research-source-registry-0.1.json", import.meta.url), "utf8"));
  const summary = deriveResearchSourceRegistrySummary(canonicalRegistry);
  const files = appFiles ?? await collectAppSources();
  const byPath = new Map(files.map((file) => [file.path, file.source]));

  for (const display of CANONICAL_DENOMINATOR_DISPLAYS) {
    const source = byPath.get(display.path) ?? await readFile(new URL(`../${display.path}`, import.meta.url), "utf8");
    check(source.includes(display.token), `${display.id} is not derived from the canonical registry summary`);
    for (const token of display.requiredTokens ?? []) {
      check(source.includes(token), `${display.id} is missing registry-derived release metadata token: ${token}`);
    }
  }
  const staleLiterals = findStaleCanonicalDenominatorLiterals(files);
  check(staleLiterals.length === 0, `Stale canonical denominator literal(s): ${staleLiterals.map((item) => `${item.path}: ${item.literal}`).join("; ")}`);

  const units = new Set(CANONICAL_DENOMINATOR_DISPLAYS.flatMap((display) => display.units));
  check(units.size === 4, "Canonical denominator displays must keep all four units separately enumerated");
  return Object.freeze({
    ...summary,
    compoundDisplay: formatResearchSourceRegistrySummary(summary),
    tabDisplay: formatResearchSourceRegistryTab(summary),
    enumeratedDisplayCount: CANONICAL_DENOMINATOR_DISPLAYS.length,
    units: [...units],
    staleLiteralCount: staleLiterals.length,
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchSourceRegistryDenominators().then((receipt) => {
    process.stdout.write(`Research source-registry UI denominators valid: ${receipt.compoundDisplay}; ${receipt.enumeratedDisplayCount} displays; ${receipt.staleLiteralCount} stale literals.\n`);
  }).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
