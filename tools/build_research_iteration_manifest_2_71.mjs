#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_270, validateResearchIterationManifest270Snapshot } from "../scripts/validate-research-iteration-manifest-2.70-snapshot.mjs";
import { validateCanonicalResearchUpgradeRegistry } from "../scripts/validate-research-model-upgrade-registry-0.1.mjs";
import {
  loadResearchSourceRegistry,
  loadResearchUpgradeRegistry,
  summarizeResearchSourceRegistry,
  validateResearchSourceRegistry,
  validateResearchSourceUpgradeLinks,
} from "../scripts/validate-research-source-registry-0.1.mjs";
import { validateResearchSourceRegistryDenominators } from "../scripts/validate-research-source-registry-denominators.mjs";
import { validateIncrementalIterationLayout } from "../scripts/validate-incremental-iteration-layout.mjs";
import { validateNeuromorphoTypeSourceDoiOverlapAudit01 } from "../scripts/validate-neuromorpho-type-source-doi-overlap-audit-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_271_PATH = path.join(ROOT, "data/research-iteration-manifest-2.71.json");
export const INPUTS_271 = Object.freeze([
  ["sealedIteration270SnapshotValidator", "scripts/validate-research-iteration-manifest-2.70-snapshot.mjs"],
  ["iteration270SnapshotTests", "tests/research-iteration-manifest-2.70-snapshot.test.mjs"],
  ["neuromorphoTypeSourceDoiAudit", "data/neuromorpho-type-source-doi-overlap-audit-0.1.json"],
  ["neuromorphoTypeSourceDoiAuditSchema", "schemas/neuromorpho-type-source-doi-overlap-audit-0.1.schema.json"],
  ["neuromorphoTypeSourceDoiAuditBuilder", "tools/build_neuromorpho_type_source_doi_overlap_audit_0_1.mjs"],
  ["neuromorphoTypeSourceDoiAuditValidator", "scripts/validate-neuromorpho-type-source-doi-overlap-audit-0.1.mjs"],
  ["neuromorphoTypeSourceDoiAuditTests", "tests/neuromorpho-type-source-doi-overlap-audit.test.mjs"],
  ["researchUpgradeQueue", "docs/RESEARCH_MODEL_UPGRADE_QUEUE.md"],
  ["researchUpgradeRegistry", "data/research-model-upgrade-registry-0.1.json"],
  ["researchUpgradeRegistryBuilder", "tools/build_research_upgrade_registry.mjs"],
  ["researchUpgradeRegistryValidator", "scripts/validate-research-model-upgrade-registry-0.1.mjs"],
  ["researchUpgradeRegistryTests", "tests/research-model-upgrade-registry.test.mjs"],
  ["selectedInterneuronTypeDossier", "app/InterneuronTypeAtlas.tsx"],
  ["atlasIterationBanner", "app/AtlasPrototype.tsx"],
  ["applicationLayout", "app/layout.tsx"],
  ["applicationStyles", "app/globals.css"],
  ["renderedHtmlTests", "tests/rendered-html.test.mjs"],
  ["currentResearchTestRunner", "tools/run_current_research_tests.mjs"],
  ["applicationPackage", "package.json"],
  ["packageLock", "package-lock.json"],
  ["iteration271Builder", "tools/build_research_iteration_manifest_2_71.mjs"],
  ["iteration271Validator", "scripts/validate-research-iteration-manifest-2.71.mjs"],
  ["iteration271Tests", "tests/research-iteration-manifest-2.71.test.mjs"],
  ["iteration271Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_71.md"],
  ["neuromorphoNoAgeUniverseIndex", "public/data/neuromorpho_release_8_6_124_no_age_universe_v1/universe-index.json"],
  ["russTaxonomyForDoi", "data/russ-harmonized-taxonomy-crosswalk-0.1.json"],
  ["sathyamurthyTaxonomyForDoi", "data/sathyamurthy-source-taxonomy-0.1.json"],
  ["hayashiTaxonomyForDoi", "data/hayashi-v2a-source-taxonomy-0.1.json"],
  ["haringTaxonomyForDoi", "data/haring-dorsal-horn-source-taxonomy-0.1.json"],
  ["alkaslasiTaxonomyForDoi", "data/alkaslasi-cholinergic-source-taxonomy-0.1.json"],
  ["dmrt3TaxonomyForDoi", "data/dmrt3-di6-source-taxonomy-0.1.json"],
  ["roomeTaxonomyForDoi", "data/roome-dil-source-taxonomy-0.1.json"],
  ["delileTaxonomyForDoi", "data/delile-developmental-interneuron-taxonomy-0.1.json"],
  ["crozatProfileForDoi", "data/crozat-pkd2l1-functional-profile-0.1.json"],
  ["canoGomezTaxonomyForDoi", "data/cano-gomez-p56-multiome-interneuron-registry-0.1.json"],
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function receipt(input, rootLocator) {
  if (!rootLocator || path.isAbsolute(input.path) || input.path.split("/").includes("..")) throw new Error(`Invalid scoped input: ${input.id}`);
  const bytes = await readFile(path.resolve(ROOT, rootLocator, input.path));
  return { ...input, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildResearchIterationManifest271() {
  const parentReceipt = await validateResearchIterationManifest270Snapshot();
  const parent = JSON.parse(await readFile(path.join(ROOT, SNAPSHOT_270.path), "utf8"));
  const [upgrades, sourceRegistry, upgradeRegistry, denominatorReceipt, layout, doiAudit] = await Promise.all([
    validateCanonicalResearchUpgradeRegistry(),
    loadResearchSourceRegistry(),
    loadResearchUpgradeRegistry(),
    validateResearchSourceRegistryDenominators(),
    validateIncrementalIterationLayout(),
    validateNeuromorphoTypeSourceDoiOverlapAudit01(),
  ]);
  validateResearchSourceRegistry(sourceRegistry);
  validateResearchSourceUpgradeLinks(sourceRegistry, upgradeRegistry);
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  if (sourceSummary.sourceCount !== 28 || sourceSummary.recordSetCount !== 37
    || sourceSummary.bundledExactRosterCount !== 11 || sourceSummary.bundledExactSourceObjectSetCount !== 2
    || sourceSummary.typeRecordCount !== parent.registrySummary.sourceProfileCount) {
    throw new Error("2.71 source-registry denominators differ from immutable 2.70");
  }
  const coverageUpgrade = upgradeRegistry.upgrades.find((upgrade) => upgrade.id === "UPG-246");
  if (upgrades.upgradeCount !== 228 || upgrades.displayedUpgradeCount !== 39 || denominatorReceipt.staleLiteralCount !== 0
    || upgradeRegistry.summary.byStatus.completed !== 67
    || upgradeRegistry.upgrades.at(-1)?.id !== "UPG-246"
    || coverageUpgrade?.status !== "completed"
    || !/0\/10 taxonomy-source publication DOI overlaps/.test(coverageUpgrade.description)
    || doiAudit.taxonomySourceCount !== 10 || doiAudit.sourceProfileCount !== 387
    || doiAudit.exactDoiMatchedTaxonomySourceCount !== 0 || doiAudit.exactDoiMatchedRecordCount !== 0
    || doiAudit.identityJoins !== 0 || doiAudit.geometryObjectsAdmitted !== 0) {
    throw new Error("2.71 registry, source-publication coverage result, or no-admission boundary changed");
  }

  const parentInputs = await Promise.all(parent.authoritativeInputs.map(async (input) => {
    const current = await receipt(input, parent.inputRoots[input.scope]?.locator);
    const changed = current.bytes !== input.bytes || current.sha256 !== input.sha256;
    return changed ? { ...current, purpose: `Iteration 2.71 refreshed ${input.id} receipt` } : current;
  }));
  const inheritedPaths = new Set(parentInputs.map((input) => `${input.scope}:${input.path}`));
  const additions = INPUTS_271
    .filter(([, inputPath]) => !inheritedPaths.has(`project:${inputPath}`))
    .map(([id, inputPath]) => ({ id, scope: "project", path: inputPath, purpose: "Iteration 2.71 exact source-publication DOI coverage audit, per-profile evidence card, immutable rollback, tests, or unique timeline receipt" }));
  const inputs = [...parentInputs, ...additions];
  if (new Set(inputs.map((input) => input.id)).size !== inputs.length
    || new Set(inputs.map((input) => `${input.scope}:${input.path}`)).size !== inputs.length) throw new Error("Duplicate 2.71 input identity");
  const receipts = await Promise.all(inputs.map((input) => receipt(input, parent.inputRoots[input.scope]?.locator)));
  const byId = new Map(receipts.map((input) => [input.id, input]));
  for (const [, inputPath] of INPUTS_271) {
    if (!receipts.some((input) => input.scope === "project" && input.path === inputPath)) throw new Error(`2.71 exact input receipt missing: ${inputPath}`);
  }
  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  if (pkg.version !== "2.71.0-research.1") throw new Error("2.71 application version mismatch");

  const manifest = structuredClone(parent);
  manifest.authoritativeInputs = receipts;
  manifest.manifestSchemaVersion = "2.71.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.71.0";
  manifest.releaseDate = "2026-09-23";
  manifest.application.version = pkg.version;
  manifest.parentIterationManifest = {
    path: SNAPSHOT_270.path,
    releaseId: parentReceipt.releaseId,
    bytes: SNAPSHOT_270.bytes,
    fileSha256: SNAPSHOT_270.fileSha256,
    contentSha256: SNAPSHOT_270.contentSha256,
  };
  manifest.integrity.inputCount = receipts.length;
  manifest.baseResearchRelease.note = "Iteration 2.71 audits exact publication-DOI coverage between the ten current interneuron taxonomy namespaces (387 source profiles) and the frozen NeuroMorpho 8.6.124 no-age query (1,097 records). No exact DOI overlaps were found. The per-profile information card reports that bounded citation-level result while retaining independent literal source-label morphology search. A zero DOI match is not evidence of biological absence or same-cell identity; no denominator, geometry, identity join, internal structure, registration or measurement is added.";
  manifest.registrySummary = {
    ...manifest.registrySummary,
    researchUpgradeCount: upgrades.upgradeCount,
    sourceRegistryReceipt: byId.get("researchSourceRegistry"),
    upgradeRegistryReceipt: byId.get("researchModelUpgradeRegistry"),
  };
  manifest.exactReferences.researchRegistryDenominators271 = {
    canonicalSourcePackageCount: sourceSummary.sourceCount,
    canonicalRecordSetCount: sourceSummary.recordSetCount,
    bundledExactCellProfileRosterCount: sourceSummary.bundledExactRosterCount,
    bundledExactSourceObjectSetCount: sourceSummary.bundledExactSourceObjectSetCount,
    sourceProfileCount: sourceSummary.typeRecordCount,
    upgradeCount: upgrades.upgradeCount,
    completedUpgradeCount: upgradeRegistry.summary.byStatus.completed,
    displayedUpgradeCount: upgrades.displayedUpgradeCount,
    denominatorDisplayCount: denominatorReceipt.enumeratedDisplayCount,
    staleCanonicalDenominatorLiteralCount: denominatorReceipt.staleLiteralCount,
  };
  manifest.exactReferences.neuromorphoTypeSourceDoiOverlap246 = {
    auditId: "neuromorpho-type-source-doi-overlap-audit-0.1",
    researchUpgradeId: "UPG-246",
    morphologyRelease: "8.6.124",
    morphologyQueryRecordCount: doiAudit.queryRecordCount,
    taxonomySourceCount: doiAudit.taxonomySourceCount,
    sourceProfileCount: doiAudit.sourceProfileCount,
    exactDoiMatchedTaxonomySourceCount: doiAudit.exactDoiMatchedTaxonomySourceCount,
    exactDoiMatchedRecordCount: doiAudit.exactDoiMatchedRecordCount,
    identityJoins: doiAudit.identityJoins,
    geometryObjectsAdmitted: doiAudit.geometryObjectsAdmitted,
  };
  manifest.exactReferences.iteration271Layout = {
    fullProjectCopyCount: layout.fullProjectCopyCount,
    distinctTimelinePath: "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_71.md",
    rollbackParent: SNAPSHOT_270.path,
  };
  manifest.scientificBoundaries.neuromorphoTypeSourceDoiOverlap246 = "The audit compares normalized exact publication DOI strings between ten current taxonomy source packages (387 profiles) and sourcePaper.dois in the pinned 1,097-record NeuroMorpho 8.6.124 no-age query. Zero overlaps is bounded to this metadata snapshot and does not mean morphology is absent in other sources or records with missing citation metadata. DOI co-citation is not a type, subtype, specimen, or same-cell link. The profile card shows this boundary and keeps literal source-label search separate. No new records, geometry, internal structures, identity joins, registrations, measurements, or denominators are admitted.";
  manifest.scientificBoundaries.iteration271Layout = "Iteration 2.71 adds deterministic DOI-level source-coverage evidence to each selected source-profile dossier, seals the exact 2.70 manifest as immutable parent, refreshes changed inputs, and creates no full-project copy.";
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildResearchIterationManifest271()
    .then(async ({ manifest, bytes }) => {
      if (process.argv.includes("--write")) await writeFile(MANIFEST_271_PATH, bytes);
      const coverage = manifest.exactReferences.neuromorphoTypeSourceDoiOverlap246;
      process.stdout.write(`${JSON.stringify({ releaseId: manifest.releaseId, version: manifest.application.version, inputCount: manifest.integrity.inputCount, researchUpgradeCount: manifest.registrySummary.researchUpgradeCount, morphologyRelease: coverage.morphologyRelease, queryRecordCount: coverage.morphologyQueryRecordCount, taxonomySourceCount: coverage.taxonomySourceCount, sourceProfileCount: coverage.sourceProfileCount, exactDoiMatchedRecords: coverage.exactDoiMatchedRecordCount, identityJoins: coverage.identityJoins, geometryObjectsAdmitted: coverage.geometryObjectsAdmitted, fullProjectCopyCount: manifest.exactReferences.iteration271Layout.fullProjectCopyCount })}\n`);
    })
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
