#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { SNAPSHOT_273, validateResearchIterationManifest273Snapshot } from "../scripts/validate-research-iteration-manifest-2.73-snapshot.mjs";
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
import { validateBancV888IN14A018MorphologyRoute } from "../scripts/validate-banc-v888-in14a018-morphology-route-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_274_PATH = path.join(ROOT, "data/research-iteration-manifest-2.74.json");
export const INPUTS_274 = Object.freeze([
  "data/banc-v888-in14a018-morphology-route-0.1.json",
  "public/data/banc_v888_in14a018_comparative_v1/720575941350424112_skeleton.swc",
  "app/banc-v888-in14a018-morphology-route.js",
  "app/BancV888IN14A018MorphologyReference.tsx",
  "app/InternalStructureReferencePanel.tsx",
  "app/globals.css",
  "data/research-source-registry-0.1.json",
  "scripts/validate-research-source-registry-0.1.mjs",
  "scripts/validate-research-source-registry-denominators.mjs",
  "tests/research-source-registry.test.mjs",
  "tests/research-source-registry-summary.test.mjs",
  "docs/RESEARCH_MODEL_UPGRADE_QUEUE.md",
  "data/research-model-upgrade-registry-0.1.json",
  "tools/build_research_upgrade_registry.mjs",
  "scripts/validate-research-model-upgrade-registry-0.1.mjs",
  "tests/research-model-upgrade-registry.test.mjs",
  "scripts/validate-banc-v888-in14a018-morphology-route-0.1.mjs",
  "tests/banc-v888-in14a018-morphology-route.test.mjs",
  "scripts/validate-banc-v888-comparative-internal-reference-0.1.mjs",
  "tests/banc-v888-comparative-internal-reference.test.mjs",
  "package.json",
  "package-lock.json",
  "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_74.md",
  "tools/build_research_iteration_manifest_2_74.mjs",
  "scripts/validate-research-iteration-manifest-2.74.mjs",
  "tests/research-iteration-manifest-2.74.test.mjs",
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function inputReceipt(relativePath) {
  if (path.isAbsolute(relativePath) || relativePath.split("/").includes("..")) throw new Error(`Invalid 2.74 input path: ${relativePath}`);
  const bytes = await readFile(path.join(ROOT, relativePath));
  return { path: relativePath, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

function contentHash(manifest) {
  const content = { ...manifest };
  delete content.manifestContentSha256;
  return sha256(Buffer.from(JSON.stringify(content)));
}

export async function buildResearchIterationManifest274() {
  const parentReceipt = await validateResearchIterationManifest273Snapshot();
  const [sourceRegistry, upgradeRegistry, upgrades, denominatorReceipt, layout, routeResult, packageJson] = await Promise.all([
    loadResearchSourceRegistry(),
    loadResearchUpgradeRegistry(),
    validateCanonicalResearchUpgradeRegistry(),
    validateResearchSourceRegistryDenominators(),
    validateIncrementalIterationLayout(),
    validateBancV888IN14A018MorphologyRoute(),
    readFile(path.join(ROOT, "package.json"), "utf8").then(JSON.parse),
  ]);
  validateResearchSourceRegistry(sourceRegistry);
  validateResearchSourceUpgradeLinks(sourceRegistry, upgradeRegistry);
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  if (packageJson.version !== "2.74.0-research.1") throw new Error("2.74 application version mismatch");
  if (sourceSummary.sourceCount !== 30 || sourceSummary.recordSetCount !== 39
    || sourceSummary.bundledExactRosterCount !== 13 || sourceSummary.bundledExactSourceObjectSetCount !== 4
    || sourceSummary.typeRecordCount !== 387) throw new Error("2.74 canonical source denominators changed");
  if (upgrades.upgradeCount !== 231 || upgrades.displayedUpgradeCount !== 39
    || upgradeRegistry.summary.byStatus.completed !== 69 || upgradeRegistry.upgrades.at(-1)?.id !== "UPG-249"
    || !upgradeRegistry.upgrades.find((item) => item.id === "UPG-248")?.status.startsWith("completed")
    || !upgradeRegistry.upgrades.find((item) => item.id === "UPG-249")?.status.startsWith("planned")) throw new Error("2.74 upgrade queue receipt changed");
  if (denominatorReceipt.staleLiteralCount !== 0 || routeResult.nodeCount !== 7451 || routeResult.segmentCount !== 7450
    || routeResult.renderedSurfaces !== 0 || routeResult.renderedMitochondria !== 0
    || routeResult.mouseJoins !== 0 || routeResult.atlasRegistrations !== 0
    || layout.fullProjectCopyCount !== 0) throw new Error("2.74 geometry boundary or incremental layout changed");

  const inputs = await Promise.all(INPUTS_274.map(inputReceipt));
  if (new Set(inputs.map((item) => item.path)).size !== inputs.length) throw new Error("Duplicate 2.74 input receipt");
  const manifest = {
    manifestSchemaVersion: "2.74.0",
    releaseId: "ohri-mouse-interneuron-research-iteration-2.74.0",
    releaseDate: "2026-09-23",
    releaseStatus: "localhost_research_iteration",
    application: {
      name: "ohri-mouse-interneuron-atlas-prototype",
      version: packageJson.version,
    },
    parentIterationManifest: {
      path: SNAPSHOT_273.path,
      releaseId: parentReceipt.releaseId,
      bytes: SNAPSHOT_273.bytes,
      fileSha256: SNAPSHOT_273.fileSha256,
      contentSha256: SNAPSHOT_273.contentSha256,
    },
    authoritativeInputs: inputs,
    integrity: {
      inputCount: inputs.length,
      inputPathsUnique: true,
    },
    registrySummary: {
      canonicalSourceCount: sourceSummary.sourceCount,
      canonicalRecordSetCount: sourceSummary.recordSetCount,
      bundledExactCellProfileRosterCount: sourceSummary.bundledExactRosterCount,
      bundledExactSourceObjectSetCount: sourceSummary.bundledExactSourceObjectSetCount,
      sourceProfileCount: sourceSummary.typeRecordCount,
      researchUpgradeCount: upgrades.upgradeCount,
      completedResearchUpgradeCount: upgradeRegistry.summary.byStatus.completed,
      displayedResearchUpgradeCount: upgrades.displayedUpgradeCount,
      staleCanonicalDenominatorLiteralCount: denominatorReceipt.staleLiteralCount,
    },
    exactReferences: {
      bancV888IN14A018MorphologyRoute: routeResult,
      mouseCensusExpansionCount: 0,
      mouseIdentityJoins: 0,
      projectAtlasRegistrations: 0,
      renderedBancCellSurfaces: 0,
      renderedBancNucleusSurfaces: 0,
      renderedBancMitochondria: 0,
      sourceReportedMitochondriaCountIsGeometry: false,
      layout: {
        fullProjectCopyCount: layout.fullProjectCopyCount,
        rollbackParent: SNAPSHOT_273.path,
        distinctTimelinePath: "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_74.md",
      },
    },
    scientificBoundaries: {
      crossSpecies: "One adult-female Drosophila VNC source object is a separate comparison view; it is never a mouse interneuron, mouse denominator member, homolog claim or selected-record identity.",
      geometry: "Only checksum-verified SWC parent-child centerlines and one same-root source nucleus annotation point are rendered. Radius values are ignored; SWC type 2 remains uninterpreted. No cell/nucleus surfaces, mitochondria/synapse positions, measurement or registration are admitted.",
      provenance: "The exact member is from Harvard Dataverse DOI 10.7910/DVN/7WTH1N v3 under CC BY 4.0; the linked nucleus point comes from one exact annotation row with the same root and nucleus IDs.",
      unresolvedNextGate: "UPG-249 remains planned for version-matched nucleus boundaries, candidate-specific mitochondria/synapse rows, coordinates, reuse terms, and continued open mouse spinal EM discovery.",
    },
    manifestContentSha256: null,
  };
  manifest.manifestContentSha256 = contentHash(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildResearchIterationManifest274()
    .then(async ({ manifest, bytes }) => {
      if (process.argv.includes("--write")) await writeFile(MANIFEST_274_PATH, bytes);
      process.stdout.write(`${JSON.stringify({ releaseId: manifest.releaseId, version: manifest.application.version, inputCount: manifest.integrity.inputCount, sources: manifest.registrySummary.canonicalSourceCount, recordSets: manifest.registrySummary.canonicalRecordSetCount, exactRosters: manifest.registrySummary.bundledExactCellProfileRosterCount, sourceObjectSets: manifest.registrySummary.bundledExactSourceObjectSetCount, upgradeCount: manifest.registrySummary.researchUpgradeCount, routeNodes: manifest.exactReferences.bancV888IN14A018MorphologyRoute.nodeCount, fullProjectCopyCount: manifest.exactReferences.layout.fullProjectCopyCount })}\n`);
    })
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
