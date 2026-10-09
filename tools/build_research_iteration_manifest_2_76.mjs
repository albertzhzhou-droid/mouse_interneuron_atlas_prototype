#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_275, validateResearchIterationManifest275Snapshot } from "../scripts/validate-research-iteration-manifest-2.75-snapshot.mjs";
import { validateOpenMouseSpinalFibsemNearMissAudit } from "../scripts/validate-open-mouse-spinal-fibsem-near-miss-audit-0.1.mjs";
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
import { validateBancV888InternalObjectSourceAudit } from "../scripts/validate-banc-v888-internal-object-source-audit-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_276_PATH = path.join(ROOT, "data/research-iteration-manifest-2.76.json");
export const INPUTS_276 = Object.freeze([
  "data/research-iteration-manifest-2.75.json",
  "data/open-mouse-spinal-fibsem-near-miss-audit-0.1.json",
  "schemas/open-mouse-spinal-fibsem-near-miss-audit-0.1.schema.json",
  "scripts/validate-open-mouse-spinal-fibsem-near-miss-audit-0.1.mjs",
  "tests/open-mouse-spinal-fibsem-near-miss-audit.test.mjs",
  "data/mouse-spinal-em-repository-search-audit-0.1.json",
  "scripts/validate-mouse-spinal-em-repository-search-audit-0.1.mjs",
  "tests/mouse-spinal-em-repository-search-audit.test.mjs",
  "data/banc-v888-internal-object-source-audit-0.1.json",
  "data/banc-v888-in14a018-morphology-route-0.1.json",
  "app/atlas-types.ts",
  "app/MouseSpinalEmRepositorySearchAudit.tsx",
  "app/AtlasPrototype.tsx",
  "app/layout.tsx",
  "app/globals.css",
  "docs/RESEARCH_MODEL_UPGRADE_QUEUE.md",
  "data/research-model-upgrade-registry-0.1.json",
  "scripts/validate-research-model-upgrade-registry-0.1.mjs",
  "tools/build_research_upgrade_registry.mjs",
  "tools/run_current_research_tests.mjs",
  "package.json",
  "package-lock.json",
  "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_76.md",
  "tools/build_research_iteration_manifest_2_76.mjs",
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function inputReceipt(relativePath) {
  if (path.isAbsolute(relativePath) || relativePath.split("/").includes("..")) throw new Error(`Invalid 2.76 input path: ${relativePath}`);
  const bytes = await readFile(path.join(ROOT, relativePath));
  return { path: relativePath, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildResearchIterationManifest276() {
  const parent = await validateResearchIterationManifest275Snapshot();
  const [sourceRegistry, upgradeRegistry, upgrades, denominators, layout, route, bancAudit, mouseEmAudit, packageJson] = await Promise.all([
    loadResearchSourceRegistry(),
    loadResearchUpgradeRegistry(),
    validateCanonicalResearchUpgradeRegistry(),
    validateResearchSourceRegistryDenominators(),
    validateIncrementalIterationLayout(),
    validateBancV888IN14A018MorphologyRoute(),
    validateBancV888InternalObjectSourceAudit(),
    validateOpenMouseSpinalFibsemNearMissAudit(),
    readFile(path.join(ROOT, "package.json"), "utf8").then(JSON.parse),
  ]);
  validateResearchSourceRegistry(sourceRegistry);
  validateResearchSourceUpgradeLinks(sourceRegistry, upgradeRegistry);
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  if (packageJson.version !== "2.76.0-research.1") throw new Error("2.76 application version mismatch");
  if (sourceSummary.sourceCount !== 30 || sourceSummary.recordSetCount !== 39 || sourceSummary.bundledExactRosterCount !== 13
    || sourceSummary.bundledExactSourceObjectSetCount !== 4 || sourceSummary.typeRecordCount !== 387) throw new Error("2.76 source denominators changed");
  if (upgrades.upgradeCount !== 231 || upgrades.displayedUpgradeCount !== 40 || upgradeRegistry.summary.byStatus.completed !== 69
    || upgradeRegistry.upgrades.at(-1)?.id !== "UPG-249"
    || !upgradeRegistry.upgrades.find((item) => item.id === "UPG-249")?.status.startsWith("partially completed")) {
    throw new Error("2.76 research upgrade queue or UPG-249 partial status changed");
  }
  if (denominators.staleLiteralCount !== 0 || layout.fullProjectCopyCount !== 0
    || route.rootId !== "720575941350424112" || route.nucleusId !== "73044750394982464"
    || route.nodeCount !== 7451 || route.segmentCount !== 7450 || route.renderedSurfaces !== 0
    || route.renderedMitochondria !== 0 || route.mouseJoins !== 0 || route.atlasRegistrations !== 0
    || bancAudit.admittedGeometryCount !== 0 || bancAudit.privateCredentialsInspected !== false
    || mouseEmAudit.publicAdultMouseSpinalEmVolumes !== 2 || mouseEmAudit.eligibleMouseSpinalInterneuronObjectRoutes !== 0
    || mouseEmAudit.rawVolumesDownloaded !== 0 || mouseEmAudit.admittedObjects !== 0) throw new Error("2.76 source or geometry admission boundary changed");

  const inputs = await Promise.all(INPUTS_276.map(inputReceipt));
  if (new Set(inputs.map((input) => input.path)).size !== inputs.length) throw new Error("Duplicate 2.76 input receipt");
  const manifest = {
    manifestSchemaVersion: "2.76.0",
    releaseId: "ohri-mouse-interneuron-research-iteration-2.76.0",
    releaseDate: "2026-09-23",
    releaseStatus: "localhost_research_iteration",
    application: { name: "ohri-mouse-interneuron-atlas-prototype", version: packageJson.version },
    parentIterationManifest: {
      path: SNAPSHOT_275.path,
      releaseId: parent.releaseId,
      bytes: SNAPSHOT_275.bytes,
      fileSha256: SNAPSHOT_275.fileSha256,
      contentSha256: SNAPSHOT_275.contentSha256,
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
      openMouseSpinalFibsemNearMiss: {
        auditId: "open-mouse-spinal-fibsem-near-miss-audit-0.1",
        datasetIds: ["jrc_mus-sc-zp104a", "jrc_mus-sc-zp105a"],
        publicAdultMouseSpinalEmVolumes: mouseEmAudit.publicAdultMouseSpinalEmVolumes,
        eligibleMouseSpinalInterneuronObjectRoutes: mouseEmAudit.eligibleMouseSpinalInterneuronObjectRoutes,
        rawVolumesDownloaded: mouseEmAudit.rawVolumesDownloaded,
        segmentationPayloadsDownloaded: 0,
        admittedInterneuronObjects: 0,
        admittedOrganelleObjects: 0,
        sameCellJoins: 0,
        atlasRegistrations: 0,
        measurements: 0,
      },
      bancV888InternalObjectAvailability: {
        auditId: bancAudit.auditId,
        candidateRootId: bancAudit.candidateRootId,
        candidateNucleusId: bancAudit.candidateNucleusId,
        admittedGeometryCount: bancAudit.admittedGeometryCount,
        privateCredentialsInspected: bancAudit.privateCredentialsInspected,
      },
      mouseInterneuronCensusExpansionCount: 0,
      mouseIdentityJoins: 0,
      newGeometryCount: 0,
      layout: { fullProjectCopyCount: layout.fullProjectCopyCount, rollbackParent: SNAPSHOT_275.path, distinctTimelinePath: "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_76.md" },
    },
    scientificBoundaries: {
      adjacentMouseVolumes: "The two public 6-month-old female mouse spinal FIB-SEM volumes are dorsal corticospinal-tract datasets. They remain projection-axon comparators, not interneuron records, normal interneuron templates, selected-cell morphology, or atlas-registered data.",
      sourceObjects: "Figshare/OpenOrganelle metadata and the primary article establish public volume availability and reported axonal ER/mitochondria analyses. This iteration did not retrieve exact image arrays, labels, stable reconstructed-axon IDs, or segmentation payload receipts.",
      geometry: "No image voxels, masks, traces, meshes, organelles, measurements, same-cell joins, or atlas registrations from these sources are admitted. Existing mouse atlas geometry and records remain unchanged.",
      license: "Both Figshare volume records declare CC BY 4.0. This license supports reuse of the listed deposits subject to attribution; it does not create a biological identity crosswalk.",
      unresolvedNextGate: "UPG-249 remains partially completed. Continue exact authorized BANC object/version/hash/reuse checks and search for an openly licensed adult mouse spinal interneuron EM object route; do not infer interneuron identity from tract location or cross-modal proximity.",
    },
    manifestContentSha256: null,
  };
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildResearchIterationManifest276()
    .then(async ({ manifest, bytes }) => {
      if (process.argv.includes("--write")) await writeFile(MANIFEST_276_PATH, bytes);
      process.stdout.write(`${JSON.stringify({ releaseId: manifest.releaseId, version: manifest.application.version, inputCount: manifest.integrity.inputCount, publicMouseSpinalEmVolumes: manifest.exactReferences.openMouseSpinalFibsemNearMiss.publicAdultMouseSpinalEmVolumes, interneuronObjectRoutes: manifest.exactReferences.openMouseSpinalFibsemNearMiss.eligibleMouseSpinalInterneuronObjectRoutes, newGeometryCount: manifest.exactReferences.newGeometryCount, fullProjectCopyCount: manifest.exactReferences.layout.fullProjectCopyCount })}\n`);
    })
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
