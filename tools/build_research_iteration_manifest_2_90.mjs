#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_289, validateResearchIterationManifest289Snapshot } from "../scripts/validate-research-iteration-manifest-2.89-snapshot.mjs";
import {
  loadResearchSourceRegistry,
  loadResearchUpgradeRegistry,
  summarizeResearchSourceRegistry,
  validateResearchSourceRegistry,
  validateResearchSourceUpgradeLinks,
} from "../scripts/validate-research-source-registry-0.1.mjs";
import { validateResearchSourceRegistryDenominators } from "../scripts/validate-research-source-registry-denominators.mjs";
import { validateCanonicalResearchUpgradeRegistry } from "../scripts/validate-research-model-upgrade-registry-0.1.mjs";
import { validateIncrementalIterationLayout } from "../scripts/validate-incremental-iteration-layout.mjs";
import { validateNeurolucidaDatSwcCrosswalk } from "../scripts/validate-neurolucida-dat-swc-crosswalk-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_290_PATH = path.join(ROOT, "data/research-iteration-manifest-2.90.json");
export const INPUTS_290 = Object.freeze([
  "data/research-iteration-manifest-2.89.json",
  "data/research-source-registry-0.1.json",
  "scripts/validate-research-source-registry-0.1.mjs",
  "scripts/validate-research-source-registry-denominators.mjs",
  "data/research-model-upgrade-registry-0.1.json",
  "docs/RESEARCH_MODEL_UPGRADE_QUEUE.md",
  "tools/build_research_upgrade_registry.mjs",
  "scripts/validate-research-model-upgrade-registry-0.1.mjs",
  "tests/research-model-upgrade-registry.test.mjs",
  "data/neurolucida-dat-swc-crosswalk-0.1.json",
  "app/neurolucida-dat-swc-crosswalk.js",
  "tools/build_neurolucida_dat_swc_crosswalk_0_1.mjs",
  "scripts/validate-neurolucida-dat-swc-crosswalk-0.1.mjs",
  "tests/neurolucida-dat-swc-crosswalk-0.1.test.mjs",
  "app/Nmo45718DatSwcCrosswalkViewer.tsx",
  "app/nmo-dat-swc-crosswalk.css",
  "app/NeuroMorphoUniversePanel.tsx",
  "app/NativeContourRecordViewer.tsx",
  "app/neurolucida-native-contour-admission.js",
  "data/neurolucida-native-contour-admission-catalog-0.3.json",
  "public/data/premotor_comparison_observed_morphology_route_pack_v1/original/nmo-45718.dat",
  "public/data/premotor_comparison_observed_morphology_route_pack_v1/swc/nmo-45718.swc",
  "public/data/premotor_comparison_observed_morphology_route_pack_v1/native-contours/nmo-45718-soma-contours.json",
  "public/data/premotor_comparison_observed_morphology_route_pack_v1/geometry/nmo-45718.json",
  "package.json",
  "package-lock.json",
  "tools/run_current_research_tests.mjs",
  "docs/RESEARCH_TIMELINE_2026-09-24_ITERATION_2_90.md",
  "tests/research-iteration-manifest-2.90-snapshot.test.mjs",
  "tools/build_research_iteration_manifest_2_90.mjs",
  "scripts/validate-research-iteration-manifest-2.90-snapshot.mjs",
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function inputReceipt(relativePath) {
  if (path.isAbsolute(relativePath) || relativePath.split("/").includes("..")) {
    throw new Error("Invalid 2.90 input path: " + relativePath);
  }
  const bytes = await readFile(path.join(ROOT, relativePath));
  return { path: relativePath, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildResearchIterationManifest290() {
  const parent = await validateResearchIterationManifest289Snapshot();
  const [sourceRegistry, upgradeRegistry, upgrades, denominators, layout, packageJson, lockJson, crosswalk] = await Promise.all([
    loadResearchSourceRegistry(),
    loadResearchUpgradeRegistry(),
    validateCanonicalResearchUpgradeRegistry(),
    validateResearchSourceRegistryDenominators(),
    validateIncrementalIterationLayout(),
    readFile(path.join(ROOT, "package.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "package-lock.json"), "utf8").then(JSON.parse),
    validateNeurolucidaDatSwcCrosswalk(),
  ]);
  validateResearchSourceRegistry(sourceRegistry);
  validateResearchSourceUpgradeLinks(sourceRegistry, upgradeRegistry);
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);

  if (packageJson.version !== "2.90.0-research.1" || lockJson.version !== packageJson.version
    || lockJson.packages?.[""]?.version !== packageJson.version) {
    throw new Error("2.90 application and lockfile versions must match");
  }
  if (sourceSummary.sourceCount !== 31 || sourceSummary.recordSetCount !== 41 || sourceSummary.bundledExactRosterCount !== 13
    || sourceSummary.bundledExactSourceObjectSetCount !== 4 || sourceSummary.typeRecordCount !== 387) {
    throw new Error("2.90 canonical source denominators changed unexpectedly");
  }
  const nmoUpgrade = upgradeRegistry.upgrades.find((item) => item.id === "UPG-192");
  if (upgrades.upgradeCount !== 243 || upgradeRegistry.sourceQueue.lastIncludedId !== "UPG-261"
    || upgradeRegistry.summary.byStatus.completed !== 73 || nmoUpgrade?.status !== "completed"
    || nmoUpgrade.blocker.code !== "none_for_declared_increment" || upgrades.displayedUpgradeCount !== 45) {
    throw new Error("2.90 research upgrade queue state or display denominator changed unexpectedly");
  }
  if (denominators.staleLiteralCount !== 0 || layout.fullProjectCopyCount !== 0
    || crosswalk.recordId !== "NeuroMorpho:45718" || crosswalk.mappedSomaContours !== 7
    || crosswalk.mappedContourVertices !== 252 || crosswalk.standardizedSwcSegments !== 5635
    || crosswalk.registrationCount !== 0 || crosswalk.surfaces !== 0 || crosswalk.internalStructureObjects !== 0) {
    throw new Error("2.90 DAT↔SWC crosswalk, registry denominators or in-place layout boundary changed");
  }

  const inputs = await Promise.all(INPUTS_290.map(inputReceipt));
  if (new Set(inputs.map((input) => input.path)).size !== inputs.length) throw new Error("Duplicate 2.90 input receipt");
  const manifest = {
    manifestSchemaVersion: "2.90.0",
    releaseId: "ohri-mouse-interneuron-research-iteration-2.90.0",
    releaseDate: "2026-09-24",
    releaseStatus: "localhost_research_iteration",
    application: { name: "ohri-mouse-interneuron-atlas-prototype", version: packageJson.version },
    parentIterationManifest: {
      path: SNAPSHOT_289.path,
      releaseId: parent.releaseId,
      bytes: SNAPSHOT_289.bytes,
      fileSha256: SNAPSHOT_289.fileSha256,
      contentSha256: SNAPSHOT_289.contentSha256,
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
      nmo45718DatSwcCrosswalk: {
        contractPath: "data/neurolucida-dat-swc-crosswalk-0.1.json",
        researchUpgradeId: "UPG-192",
        recordId: crosswalk.recordId,
        sourceReceiptsChecked: crosswalk.sourceReceiptsChecked,
        mappedSomaContours: crosswalk.mappedSomaContours,
        mappedContourVertices: crosswalk.mappedContourVertices,
        standardizedSwcSegments: crosswalk.standardizedSwcSegments,
        primaryHeldOutMaximumMicrometre: crosswalk.primaryHeldOutMaximumMicrometre,
        sensitivityHeldOutMaximumMicrometre: crosswalk.sensitivityHeldOutMaximumMicrometre,
        properRotationHeldOutMaximumMicrometre: crosswalk.properRotationHeldOutMaximumMicrometre,
        excludedContourIds: crosswalk.excludedContourIds,
        surfaces: crosswalk.surfaces,
        internalStructureObjects: crosswalk.internalStructureObjects,
        registrationCount: crosswalk.registrationCount,
      },
      fullProjectCopyCount: layout.fullProjectCopyCount,
      historicalParent: {
        inputByteReplayRequired: false,
        note: "The 2.89 manifest retains release-time file hashes. This snapshot validates its sealed receipt without rebuilding it from mutable current project inputs.",
      },
    },
  };
  const sealed = { ...manifest, manifestContentSha256: computeManifestContentSha256(manifest) };
  return { manifest: sealed, bytes: Buffer.from(`${JSON.stringify(sealed, null, 2)}\n`, "utf8") };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildResearchIterationManifest290()
    .then(async ({ manifest, bytes }) => {
      if (process.argv.includes("--write")) await writeFile(MANIFEST_290_PATH, bytes);
      process.stdout.write(`${process.argv.includes("--write") ? "Wrote" : "Built"} ${path.relative(ROOT, MANIFEST_290_PATH)}: ${manifest.integrity.inputCount} inputs; 7 Soma 1 contour loops / 252 vertices crosswalked to the exact NMO 45718 SWC; no surfaces or registration\n`);
    })
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
