#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_250, validateResearchIterationManifest250Snapshot } from "../scripts/validate-research-iteration-manifest-2.50-snapshot.mjs";
import { validateMicronsSubcellularSourceAudit } from "../scripts/validate-microns-subcellular-source-audit-0.1.mjs";
import { validateCanonicalResearchUpgradeRegistry } from "../scripts/validate-research-model-upgrade-registry-0.1.mjs";
import { loadResearchSourceRegistry, summarizeResearchSourceRegistry } from "../scripts/validate-research-source-registry-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_251_PATH = path.join(ROOT, "data/research-iteration-manifest-2.51.json");
export const INPUTS_251 = Object.freeze([
  ["sealedIteration250SnapshotValidator", "scripts/validate-research-iteration-manifest-2.50-snapshot.mjs"],
  ["sealedIteration250SnapshotTests", "tests/research-iteration-manifest-2.50-snapshot.test.mjs"],
  ["micronsSubcellularSourceAudit", "data/microns-subcellular-source-audit-0.1.json"],
  ["micronsSubcellularSourceAuditValidator", "scripts/validate-microns-subcellular-source-audit-0.1.mjs"],
  ["micronsSubcellularSourceAuditTests", "tests/microns-subcellular-source-audit.test.mjs"],
  ["iteration251Builder", "tools/build_research_iteration_manifest_2_51.mjs"],
  ["iteration251Validator", "scripts/validate-research-iteration-manifest-2.51.mjs"],
  ["iteration251Tests", "tests/research-iteration-manifest-2.51.test.mjs"],
  ["iteration251Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_51.md"],
]);

const REFRESHED_PARENT_INPUT_PATHS = new Set([
  "package.json",
  "package-lock.json",
  "docs/RESEARCH_MODEL_UPGRADE_QUEUE.md",
  "data/research-model-upgrade-registry-0.1.json",
  "tools/build_research_upgrade_registry.mjs",
  "scripts/validate-research-model-upgrade-registry-0.1.mjs",
  "tests/research-model-upgrade-registry.test.mjs",
  "tools/run_current_research_tests.mjs",
  "app/AtlasPrototype.tsx",
  "app/atlas-types.ts",
  "app/InternalStructureReferencePanel.tsx",
  "app/globals.css",
  "app/layout.tsx",
  "tests/microns-observed-cell-nucleus-reference.test.mjs",
  "tests/observed-morphology-runtime-contract.test.mjs",
  "tests/rendered-html.test.mjs",
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function receipt(input, rootLocator) {
  if (!rootLocator || path.isAbsolute(input.path) || input.path.split("/").includes("..")) {
    throw new Error(`Invalid scoped input: ${input.id}`);
  }
  const bytes = await readFile(path.resolve(ROOT, rootLocator, input.path));
  return { ...input, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildResearchIterationManifest251() {
  const { manifest: parent } = await validateResearchIterationManifest250Snapshot();
  const upgrades = await validateCanonicalResearchUpgradeRegistry();
  const sourceRegistry = await loadResearchSourceRegistry();
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  const audit = JSON.parse(await readFile(path.join(ROOT, "data/microns-subcellular-source-audit-0.1.json"), "utf8"));
  const auditSummary = await validateMicronsSubcellularSourceAudit(audit);

  const refreshedParentInputs = parent.authoritativeInputs.map((input) => REFRESHED_PARENT_INPUT_PATHS.has(input.path)
    ? { ...input, purpose: `Iteration 2.51 refreshed ${input.id} receipt` }
    : input);
  const refreshedPaths = refreshedParentInputs.filter((input) => REFRESHED_PARENT_INPUT_PATHS.has(input.path)).map((input) => input.path);
  if (refreshedPaths.length !== REFRESHED_PARENT_INPUT_PATHS.size) {
    const missing = [...REFRESHED_PARENT_INPUT_PATHS].filter((inputPath) => !refreshedPaths.includes(inputPath));
    throw new Error(`Required 2.51 refreshed parent inputs are missing: ${missing.join(", ")}`);
  }

  const inputs = [
    ...refreshedParentInputs,
    ...INPUTS_251.map(([id, inputPath]) => ({ id, scope: "project", path: inputPath, purpose: "Iteration 2.51 MICrONS subcellular source audit or its build, test and documentation input" })),
  ];
  if (new Set(inputs.map((input) => input.id)).size !== inputs.length
    || new Set(inputs.map((input) => `${input.scope}:${input.path}`)).size !== inputs.length) {
    throw new Error("Duplicate 2.51 input identity");
  }

  const receipts = await Promise.all(inputs.map(async (input) => receipt(input, parent.inputRoots[input.scope]?.locator)));
  const byId = new Map(receipts.map((input) => [input.id, input]));
  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  if (pkg.version !== "2.51.0-research.1") throw new Error("2.51 application version mismatch");

  const manifest = structuredClone(parent);
  manifest.authoritativeInputs = receipts;
  manifest.manifestSchemaVersion = "2.51.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.51.0";
  manifest.releaseDate = "2026-09-23";
  manifest.application.version = pkg.version;
  manifest.parentIterationManifest = {
    path: SNAPSHOT_250.path,
    releaseId: parent.releaseId,
    bytes: SNAPSHOT_250.bytes,
    fileSha256: SNAPSHOT_250.fileSha256,
    contentSha256: SNAPSHOT_250.contentSha256,
  };
  manifest.integrity.inputCount = receipts.length;
  manifest.baseResearchRelease.note = "Iteration 2.51 audits candidate same-cell subcellular detail for the existing cross-region MICrONS visual-cortex reference. The public v185 synapse-table schema, checksum, nominal native coordinate fields, automated-detection quality boundary and documented mitochondria layer are recorded, but no full table or cell-specific payload is imported. Exact v185-table to v185.4-mesh lineage, an authorized root-filtered synapse query, point-to-mesh agreement and mitochondria object membership remain unverified. The interface exposes the data routes and blockers without adding geometry or linking this cortical comparator to spinal records.";
  manifest.registrySummary = {
    ...manifest.registrySummary,
    canonicalSourcePackageCount: sourceSummary.sourceCount,
    canonicalRecordSetCount: sourceSummary.recordSetCount,
    bundledExactRosterCount: sourceSummary.bundledExactRosterCount,
    bundledExactObjectSetCount: sourceSummary.bundledExactSourceObjectSetCount,
    researchUpgradeCount: upgrades.upgradeCount,
    sourceRegistryReceipt: byId.get("researchSourceRegistry"),
    upgradeRegistryReceipt: byId.get("researchModelUpgradeRegistry"),
  };
  const table = audit.synapseTable;
  manifest.exactReferences.micronsSubcellularSourceAudit251 = {
    auditId: audit.auditId,
    targetRootId: audit.targetReference.cellRootId,
    targetCellRelease: audit.targetReference.segmentationRelease,
    synapseTableRecordId: table.zenodoRecordId,
    synapseTableDepositVersion: table.metadataDepositVersion,
    synapseTableLabel: table.tableLabel,
    synapseTableFileName: table.fileName,
    synapseTableFileBytes: table.fileBytes,
    synapseTablePublishedMd5: table.publishedMd5,
    synapseTableRowsDescription: table.publishedRowDescription,
    nominalVoxelResolutionNanometre: table.coordinateFields.releaseNotesNominalVoxelResolutionNanometre,
    caveExactRootQueryAuthenticated: table.accessAudit.authenticatedExactRootQueryRun,
    fullTableDownloaded: table.accessAudit.fullTableDownloaded,
    retainedSourcePayloadBytes: table.accessAudit.retainedSourcePayloadBytes,
    exactRootLineageAcrossProductsVerified: table.versionJoin.exactRootLineageAcrossTheseProductsVerified,
    officialMitochondriaRouteListed: audit.mitochondriaRoute.status === "official_source_route_listed_exact_cell_mapping_pending",
    exactMitochondriaTargetRootMappingVerified: audit.mitochondriaRoute.exactTargetRootMappingVerified,
    synapsePointCount: audit.admission.synapsePointCount,
    mitochondriaObjectCount: audit.admission.mitochondriaObjectCount,
    sameCellCrossSourceJoinCount: audit.admission.sameCellCrossSourceJoinCount,
    mouseSpinalIdentityJoinCount: audit.admission.mouseSpinalIdentityJoinCount,
    registrationCount: audit.admission.registrationCount,
    functionalConnectivityClaims: audit.admission.functionalConnectivityClaims,
    researchUpgradeLastId: upgrades.lastIncludedId,
    auditSummary,
  };
  manifest.scientificBoundaries.micronsSubcellularSourceAudit251 = "MICrONS Phase 1 is a P36 male mouse visual-cortex L2/3 comparator, not a spinal-cell model. Its Zenodo 185.3 synapse table contains 3.2 million putative automated detections, lacks a per-row proofread flag and is explicitly not a straightforward connectivity graph; no full 388,781,071-byte table was downloaded. The table exposes nominal nanometre point columns, but its exact root lineage to the v185.4 mesh and point-to-mesh agreement remain unresolved. CAVE exact-root querying requires configured authentication. The v185 release also lists a manual mitochondria layer without yet verifying exact membership for the selected root. The data card adds source availability and blockers only: zero synapse points, mitochondria objects, additional geometry, cross-source joins, spinal identity joins, registrations or functional-connectivity claims.";
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [flag] = process.argv.slice(2);
    if (process.argv.length !== 3 || !["--write", "--check"].includes(flag)) throw new Error("Use --write or --check");
    const built = await buildResearchIterationManifest251();
    if (flag === "--write") await writeFile(MANIFEST_251_PATH, built.bytes);
    else if (!(await readFile(MANIFEST_251_PATH)).equals(built.bytes)) throw new Error("2.51 manifest is stale");
    console.log(JSON.stringify({ releaseId: built.manifest.releaseId, inputCount: built.manifest.integrity.inputCount, researchUpgradeCount: built.manifest.registrySummary.researchUpgradeCount, admittedSubcellularObjects: built.manifest.exactReferences.micronsSubcellularSourceAudit251.synapsePointCount + built.manifest.exactReferences.micronsSubcellularSourceAudit251.mitochondriaObjectCount, manifestContentSha256: built.manifest.manifestContentSha256 }));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
