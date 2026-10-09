#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_276, validateResearchIterationManifest276Snapshot } from "../scripts/validate-research-iteration-manifest-2.76-snapshot.mjs";
import { validateSvaraLarvalZebrafishSpinalSbemReference } from "../scripts/validate-svara-larval-zebrafish-spinal-sbem-reference-0.1.mjs";
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

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_277_PATH = path.join(ROOT, "data/research-iteration-manifest-2.77.json");
export const INPUTS_277 = Object.freeze([
  "data/research-iteration-manifest-2.76.json",
  "data/svara-larval-zebrafish-spinal-sbem-reference-0.1.json",
  "schemas/svara-larval-zebrafish-spinal-sbem-reference-0.1.schema.json",
  "scripts/validate-svara-larval-zebrafish-spinal-sbem-reference-0.1.mjs",
  "tests/svara-larval-zebrafish-spinal-sbem-reference.test.mjs",
  "data/research-source-registry-0.1.json",
  "scripts/validate-research-source-registry-0.1.mjs",
  "tests/research-source-registry.test.mjs",
  "tests/research-source-registry-summary.test.mjs",
  "docs/RESEARCH_MODEL_UPGRADE_QUEUE.md",
  "data/research-model-upgrade-registry-0.1.json",
  "scripts/validate-research-model-upgrade-registry-0.1.mjs",
  "tools/build_research_upgrade_registry.mjs",
  "tests/research-model-upgrade-registry.test.mjs",
  "app/atlas-types.ts",
  "app/layout.tsx",
  "app/AtlasPrototype.tsx",
  "app/SvaraLarvalZebrafishSpinalSbemReference.tsx",
  "app/InternalStructureReferencePanel.tsx",
  "app/globals.css",
  "package.json",
  "package-lock.json",
  "tools/run_current_research_tests.mjs",
  "tests/research-iteration-manifest-2.77-snapshot.test.mjs",
  "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_77.md",
  "tools/build_research_iteration_manifest_2_77.mjs",
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function inputReceipt(relativePath) {
  if (path.isAbsolute(relativePath) || relativePath.split("/").includes("..")) throw new Error(`Invalid 2.77 input path: ${relativePath}`);
  const bytes = await readFile(path.join(ROOT, relativePath));
  return { path: relativePath, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildResearchIterationManifest277() {
  const parent = await validateResearchIterationManifest276Snapshot();
  const [sourceRegistry, upgradeRegistry, upgrades, denominators, layout, svara, packageJson] = await Promise.all([
    loadResearchSourceRegistry(),
    loadResearchUpgradeRegistry(),
    validateCanonicalResearchUpgradeRegistry(),
    validateResearchSourceRegistryDenominators(),
    validateIncrementalIterationLayout(),
    validateSvaraLarvalZebrafishSpinalSbemReference(),
    readFile(path.join(ROOT, "package.json"), "utf8").then(JSON.parse),
  ]);
  validateResearchSourceRegistry(sourceRegistry);
  validateResearchSourceUpgradeLinks(sourceRegistry, upgradeRegistry);
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  if (packageJson.version !== "2.77.0-research.1") throw new Error("2.77 application version mismatch");
  if (sourceSummary.sourceCount !== 31 || sourceSummary.recordSetCount !== 41 || sourceSummary.bundledExactRosterCount !== 13
    || sourceSummary.bundledExactSourceObjectSetCount !== 4 || sourceSummary.typeRecordCount !== 387) throw new Error("2.77 source denominators changed");
  if (upgrades.upgradeCount !== 233 || upgrades.displayedUpgradeCount !== 42 || upgradeRegistry.summary.byStatus.completed !== 69
    || upgradeRegistry.upgrades.at(-1)?.id !== "UPG-251"
    || !upgradeRegistry.upgrades.find((item) => item.id === "UPG-240")?.status.startsWith("partially completed")
    || !upgradeRegistry.upgrades.find((item) => item.id === "UPG-250")?.status.startsWith("planned")
    || !upgradeRegistry.upgrades.find((item) => item.id === "UPG-251")?.status.startsWith("planned")) {
    throw new Error("2.77 research upgrade queue or source-object gates changed");
  }
  if (denominators.staleLiteralCount !== 0 || layout.fullProjectCopyCount !== 0
    || svara.contractId !== "svara-larval-zebrafish-spinal-sbem-reference-0.1" || svara.species !== "Danio rerio"
    || svara.specimenCount !== 1 || svara.reportedCiDCount !== 39 || svara.reportedCoBLCount !== 34
    || svara.listedSupplementPackageCount !== 3 || svara.packageLinks.length !== 3 || svara.inspectedSupplementPackageCount !== 0
    || svara.admittedNeuronObjectCount !== 0 || svara.admittedGeometryCount !== 0 || svara.downloadedPayloadBytes !== 0) {
    throw new Error("2.77 Svara package discovery or no-admission boundary changed");
  }

  const inputs = await Promise.all(INPUTS_277.map(inputReceipt));
  if (new Set(inputs.map((input) => input.path)).size !== inputs.length) throw new Error("Duplicate 2.77 input receipt");
  const manifest = {
    manifestSchemaVersion: "2.77.0",
    releaseId: "ohri-mouse-interneuron-research-iteration-2.77.0",
    releaseDate: "2026-09-23",
    releaseStatus: "localhost_research_iteration",
    application: { name: "ohri-mouse-interneuron-atlas-prototype", version: packageJson.version },
    parentIterationManifest: {
      path: SNAPSHOT_276.path,
      releaseId: parent.releaseId,
      bytes: SNAPSHOT_276.bytes,
      fileSha256: SNAPSHOT_276.fileSha256,
      contentSha256: SNAPSHOT_276.contentSha256,
    },
    authoritativeInputs: inputs,
    integrity: { inputCount: inputs.length, inputPathsUnique: true },
    registrySummary: {
      canonicalSourceCount: sourceSummary.sourceCount,
      canonicalRecordSetCount: sourceSummary.recordSetCount,
      bundledExactCellProfileRosterCount: sourceSummary.bundledExactRosterCount,
      bundledExactSourceObjectSetCount: sourceSummary.bundledExactSourceObjectSetCount,
      sourceProfileCount: sourceSummary.typeRecordCount,
      researchUpgradeCount: upgrades.upgradeCount,
      completedResearchUpgradeCount: upgradeRegistry.summary.byStatus.completed,
      displayedResearchUpgradeCount: upgrades.displayedUpgradeCount,
      staleCanonicalDenominatorLiteralCount: denominators.staleLiteralCount,
    },
    exactReferences: {
      svaraLarvalZebrafishSpinalSbem: {
        auditId: svara.contractId,
        species: svara.species,
        specimenCount: svara.specimenCount,
        reportedMorphologyConsistentCiDs: svara.reportedCiDCount,
        reportedCoBLReconstructions: svara.reportedCoBLCount,
        listedSupplementPackageCount: svara.listedSupplementPackageCount,
        packageUrls: svara.packageLinks,
        inspectedSupplementPackageCount: svara.inspectedSupplementPackageCount,
        downloadedPayloadBytes: svara.downloadedPayloadBytes,
        admittedNeuronObjects: svara.admittedNeuronObjectCount,
        admittedGeometry: svara.admittedGeometryCount,
        mouseIdentityTransfers: 0,
        atlasRegistrations: 0,
      },
      newGeometryCount: 0,
      mouseIdentityJoins: 0,
      layout: {
        fullProjectCopyCount: layout.fullProjectCopyCount,
        rollbackParent: SNAPSHOT_276.path,
        distinctTimelinePath: "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_77.md",
      },
    },
    scientificBoundaries: {
      sourceIdentity: "This is one 6 dpf Danio rerio spinal SBEM specimen and source-reported selected circuit reconstructions; it is not a mouse interneuron collection or a population prevalence denominator.",
      archiveAvailability: "Three exact official ZIP routes are surfaced for mmc6, mmc7 and mmc8. Package members, byte counts, hashes, stable neuron keys, coordinates, trace completeness and file-specific reuse terms remain unverified.",
      geometry: "No Svara package was downloaded or unpacked. Zero neuron objects, skeletons, meshes, synapse edges, internal structures, mouse identity transfers, or atlas registrations are admitted.",
      rights: "The article-level CC BY 4.0 statement is not treated as proof of independent archive-specific redistribution rights.",
      unresolvedNextGate: "UPG-240 remains partially completed pending package-member and file-level rights inspection. UPG-244 Xenium object/annotation audit, UPG-247 Todd publication/animal crosswalk, and UPG-249 exact BANC payload/version/reuse checks also remain open. UPG-250 gates source-local Svara object admission; UPG-251 plans exact-record internal-detail coverage without proxy fill.",
    },
    manifestContentSha256: null,
  };
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildResearchIterationManifest277()
    .then(async ({ manifest, bytes }) => {
      if (process.argv.includes("--write")) await writeFile(MANIFEST_277_PATH, bytes);
      process.stdout.write(`${JSON.stringify({ releaseId: manifest.releaseId, version: manifest.application.version, inputCount: manifest.integrity.inputCount, officialSupplementLinks: manifest.exactReferences.svaraLarvalZebrafishSpinalSbem.listedSupplementPackageCount, inspectedArchives: manifest.exactReferences.svaraLarvalZebrafishSpinalSbem.inspectedSupplementPackageCount, admittedObjects: manifest.exactReferences.svaraLarvalZebrafishSpinalSbem.admittedNeuronObjects, newGeometryCount: manifest.exactReferences.newGeometryCount, fullProjectCopyCount: manifest.exactReferences.layout.fullProjectCopyCount })}\n`);
    })
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
