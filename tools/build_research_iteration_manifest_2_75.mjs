#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_274, validateResearchIterationManifest274Snapshot } from "../scripts/validate-research-iteration-manifest-2.74-snapshot.mjs";
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
import { loadAndValidateBancV888MitochondriaRouteAudit } from "../scripts/validate-banc-v888-mitochondria-route-audit-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_275_PATH = path.join(ROOT, "data/research-iteration-manifest-2.75.json");
export const INPUTS_275 = Object.freeze([
  "data/research-iteration-manifest-2.74.json",
  "data/banc-v888-candidate-audit-0.1.json",
  "data/banc-v888-mitochondria-route-audit-0.1.json",
  "data/banc-v888-internal-object-source-audit-0.1.json",
  "schemas/banc-v888-internal-object-source-audit-0.1.schema.json",
  "scripts/validate-banc-v888-internal-object-source-audit-0.1.mjs",
  "tests/banc-v888-internal-object-source-audit.test.mjs",
  "app/atlas-types.ts",
  "app/InternalStructureReferencePanel.tsx",
  "app/AtlasPrototype.tsx",
  "app/layout.tsx",
  "docs/RESEARCH_MODEL_UPGRADE_QUEUE.md",
  "data/research-model-upgrade-registry-0.1.json",
  "tools/build_research_upgrade_registry.mjs",
  "scripts/validate-research-model-upgrade-registry-0.1.mjs",
  "tests/research-model-upgrade-registry.test.mjs",
  "scripts/validate-banc-v888-in14a018-morphology-route-0.1.mjs",
  "tests/banc-v888-in14a018-morphology-route.test.mjs",
  "scripts/validate-research-iteration-manifest-2.74-snapshot.mjs",
  "tests/research-iteration-manifest-2.74.test.mjs",
  "tests/research-iteration-manifest-2.75-snapshot.test.mjs",
  "tools/run_current_research_tests.mjs",
  "package.json",
  "package-lock.json",
  "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_75.md",
  "tools/build_research_iteration_manifest_2_75.mjs",
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function inputReceipt(relativePath) {
  if (path.isAbsolute(relativePath) || relativePath.split("/").includes("..")) throw new Error(`Invalid 2.75 input path: ${relativePath}`);
  const bytes = await readFile(path.join(ROOT, relativePath));
  return { path: relativePath, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildResearchIterationManifest275() {
  const parentReceipt = await validateResearchIterationManifest274Snapshot();
  const [sourceRegistry, upgradeRegistry, upgrades, denominatorReceipt, layout, route, routeAudit, mitoAudit, packageJson] = await Promise.all([
    loadResearchSourceRegistry(),
    loadResearchUpgradeRegistry(),
    validateCanonicalResearchUpgradeRegistry(),
    validateResearchSourceRegistryDenominators(),
    validateIncrementalIterationLayout(),
    validateBancV888IN14A018MorphologyRoute(),
    validateBancV888InternalObjectSourceAudit(),
    loadAndValidateBancV888MitochondriaRouteAudit(),
    readFile(path.join(ROOT, "package.json"), "utf8").then(JSON.parse),
  ]);
  validateResearchSourceRegistry(sourceRegistry);
  validateResearchSourceUpgradeLinks(sourceRegistry, upgradeRegistry);
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  if (packageJson.version !== "2.75.0-research.1") throw new Error("2.75 application version mismatch");
  if (sourceSummary.sourceCount !== 30 || sourceSummary.recordSetCount !== 39
    || sourceSummary.bundledExactRosterCount !== 13 || sourceSummary.bundledExactSourceObjectSetCount !== 4
    || sourceSummary.typeRecordCount !== 387) throw new Error("2.75 source denominators changed");
  if (upgrades.upgradeCount !== 231 || upgrades.displayedUpgradeCount !== 40
    || upgradeRegistry.summary.byStatus.completed !== 69 || upgradeRegistry.upgrades.at(-1)?.id !== "UPG-249"
    || !upgradeRegistry.upgrades.find((item) => item.id === "UPG-248")?.status.startsWith("completed")
    || !upgradeRegistry.upgrades.find((item) => item.id === "UPG-249")?.status.startsWith("partially completed")) {
    throw new Error("2.75 upgrade registry or UPG-249 route-audit status changed");
  }
  if (denominatorReceipt.staleLiteralCount !== 0 || layout.fullProjectCopyCount !== 0
    || route.rootId !== "720575941350424112" || route.nucleusId !== "73044750394982464"
    || route.nodeCount !== 7451 || route.segmentCount !== 7450
    || route.renderedSurfaces !== 0 || route.renderedMitochondria !== 0
    || route.mouseJoins !== 0 || route.atlasRegistrations !== 0
    || routeAudit.admittedGeometryCount !== 0 || routeAudit.privateCredentialsInspected !== false
    || routeAudit.mitochondriaRowsRetrieved !== false || routeAudit.synapseObjectsAdmitted !== 0
    || mitoAudit.representation.mitochondriaPointMarkersAdmitted !== 0
    || mitoAudit.representation.mitochondriaSurfacesAdmitted !== 0
    || mitoAudit.representation.mouseCellJoinCount !== 0) throw new Error("2.75 source-object or geometry admission boundary changed");

  const inputs = await Promise.all(INPUTS_275.map(inputReceipt));
  if (new Set(inputs.map((item) => item.path)).size !== inputs.length) throw new Error("Duplicate 2.75 input receipt");
  const manifest = {
    manifestSchemaVersion: "2.75.0",
    releaseId: "ohri-mouse-interneuron-research-iteration-2.75.0",
    releaseDate: "2026-09-23",
    releaseStatus: "localhost_research_iteration",
    application: {
      name: "ohri-mouse-interneuron-atlas-prototype",
      version: packageJson.version,
    },
    parentIterationManifest: {
      path: SNAPSHOT_274.path,
      releaseId: parentReceipt.releaseId,
      bytes: SNAPSHOT_274.bytes,
      fileSha256: SNAPSHOT_274.fileSha256,
      contentSha256: SNAPSHOT_274.contentSha256,
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
      bancV888IN14A018MorphologyRoute: route,
      bancV888InternalObjectAvailability: {
        auditId: routeAudit.auditId,
        rootId: routeAudit.candidateRootId,
        nucleusId: routeAudit.candidateNucleusId,
        publicNucleusMeshRouteDocumented: routeAudit.nucleusRouteDocumented,
        nucleusMeshAdmitted: routeAudit.nucleusMeshAdmitted,
        publicMitochondriaArchiveBytes: routeAudit.mitochondriaArchiveBytes,
        candidateMitochondriaRowsRetrieved: routeAudit.mitochondriaRowsRetrieved,
        synapseVersionsListed: routeAudit.synapseVersions,
        synapseObjectsAdmitted: routeAudit.synapseObjectsAdmitted,
        privateCredentialsInspected: routeAudit.privateCredentialsInspected,
        newGeometryCount: routeAudit.admittedGeometryCount,
      },
      mouseCensusExpansionCount: 0,
      mouseIdentityJoins: 0,
      projectAtlasRegistrations: 0,
      renderedBancCellSurfaces: 0,
      renderedBancNucleusSurfaces: 0,
      renderedBancMitochondria: 0,
      renderedBancSynapseObjects: 0,
      layout: {
        fullProjectCopyCount: layout.fullProjectCopyCount,
        rollbackParent: SNAPSHOT_274.path,
        distinctTimelinePath: "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_75.md",
      },
    },
    scientificBoundaries: {
      crossSpecies: "The exact adult-female Drosophila VNC object remains a separate comparator and is never a mouse interneuron, mouse denominator member, homolog claim, selected-record identity, or atlas registration.",
      publicAvailability: "Public v888 tables and documented client accessors establish source availability only; they do not prove that the candidate-specific payload has been retrieved, version-bound, hashed, or cleared for object-level reuse.",
      geometry: "The only admitted BANC primitives remain the exact checksum-pinned SWC line tree and its same-root nucleus annotation point. No nucleus surface, mitochondrial point/surface, synapse object, measurement, or new geometry is admitted.",
      access: "No private credential was inspected or used; no CAVE query or large archive download was performed.",
      unresolvedNextGate: "UPG-249 remains partially completed: obtain exact authorized source subsets and verify per-object IDs, materialization, payload hashes, coordinate frames, and reuse terms before any internal detail is rendered.",
    },
    manifestContentSha256: null,
  };
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildResearchIterationManifest275()
    .then(async ({ manifest, bytes }) => {
      if (process.argv.includes("--write")) await writeFile(MANIFEST_275_PATH, bytes);
      process.stdout.write(`${JSON.stringify({ releaseId: manifest.releaseId, version: manifest.application.version, inputCount: manifest.integrity.inputCount, sources: manifest.registrySummary.canonicalSourceCount, recordSets: manifest.registrySummary.canonicalRecordSetCount, upgrades: manifest.registrySummary.researchUpgradeCount, mitoArchiveBytes: manifest.exactReferences.bancV888InternalObjectAvailability.publicMitochondriaArchiveBytes, newGeometryCount: manifest.exactReferences.bancV888InternalObjectAvailability.newGeometryCount, fullProjectCopyCount: manifest.exactReferences.layout.fullProjectCopyCount })}\n`);
    })
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
