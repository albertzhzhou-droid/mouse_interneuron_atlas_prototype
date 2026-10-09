#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_256, validateResearchIterationManifest256Snapshot } from "../scripts/validate-research-iteration-manifest-2.56-snapshot.mjs";
import { validateCanonicalResearchUpgradeRegistry } from "../scripts/validate-research-model-upgrade-registry-0.1.mjs";
import { loadResearchSourceRegistry, loadResearchUpgradeRegistry, summarizeResearchSourceRegistry, validateResearchSourceRegistry, validateResearchSourceUpgradeLinks } from "../scripts/validate-research-source-registry-0.1.mjs";
import { validateResearchSourceRegistryDenominators } from "../scripts/validate-research-source-registry-denominators.mjs";
import { loadAndValidateToddNativeContourTopologyAudit } from "../scripts/validate-todd-native-contour-topology-audit-0.1.mjs";
import { validateIncrementalIterationLayout } from "../scripts/validate-incremental-iteration-layout.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_257_PATH = path.join(ROOT, "data/research-iteration-manifest-2.57.json");
export const INPUTS_257 = Object.freeze([
  ["toddNativeContourTopologyAudit", "data/todd-native-contour-topology-audit-0.1.json"],
  ["toddNativeContourTopologyAuditSchema", "schemas/todd-native-contour-topology-audit-0.1.schema.json"],
  ["toddNativeContourTopologyAuditValidator", "scripts/validate-todd-native-contour-topology-audit-0.1.mjs"],
  ["toddNativeContourTopologyAuditTests", "tests/todd-native-contour-topology-audit.test.mjs"],
  ["toddNativeContourTopologyAuditBuilder", "tools/audit_todd_native_contour_topology_0_1.mjs"],
  ["sealedIteration256SnapshotValidator", "scripts/validate-research-iteration-manifest-2.56-snapshot.mjs"],
  ["sealedIteration256SnapshotTests", "tests/research-iteration-manifest-2.56-snapshot.test.mjs"],
  ["iteration257Builder", "tools/build_research_iteration_manifest_2_57.mjs"],
  ["iteration257Validator", "scripts/validate-research-iteration-manifest-2.57.mjs"],
  ["iteration257Tests", "tests/research-iteration-manifest-2.57.test.mjs"],
  ["iteration257Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_57.md"],
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function receipt(input, rootLocator) {
  if (!rootLocator || path.isAbsolute(input.path) || input.path.split("/").includes("..")) throw new Error(`Invalid scoped input: ${input.id}`);
  const bytes = await readFile(path.resolve(ROOT, rootLocator, input.path));
  return { ...input, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildResearchIterationManifest257() {
  const parentReceipt = await validateResearchIterationManifest256Snapshot();
  const parent = parentReceipt.manifest;
  const [upgrades, sourceRegistry, upgradeRegistry, toddAudit, denominatorReceipt, layout] = await Promise.all([
    validateCanonicalResearchUpgradeRegistry(),
    loadResearchSourceRegistry(),
    loadResearchUpgradeRegistry(),
    loadAndValidateToddNativeContourTopologyAudit(),
    validateResearchSourceRegistryDenominators(),
    validateIncrementalIterationLayout(),
  ]);
  validateResearchSourceRegistry(sourceRegistry);
  validateResearchSourceUpgradeLinks(sourceRegistry, upgradeRegistry);
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  if (sourceSummary.sourceCount !== denominatorReceipt.sourceCount
    || sourceSummary.recordSetCount !== denominatorReceipt.recordSetCount
    || sourceSummary.bundledExactRosterCount !== denominatorReceipt.bundledExactCellProfileRosterCount
    || sourceSummary.bundledExactSourceObjectSetCount !== denominatorReceipt.bundledExactSourceObjectSetCount) throw new Error("2.57 source-registry denominators differ between runtime surfaces");

  const parentInputs = await Promise.all(parent.authoritativeInputs.map(async (input) => {
    const current = await receipt(input, parent.inputRoots[input.scope]?.locator);
    const changed = current.bytes !== input.bytes || current.sha256 !== input.sha256;
    return changed ? { ...current, purpose: `Iteration 2.57 refreshed ${input.id} receipt` } : current;
  }));
  const inputs = [
    ...parentInputs,
    ...INPUTS_257.map(([id, inputPath]) => ({ id, scope: "project", path: inputPath, purpose: "Iteration 2.57 Todd native-contour topology audit, historical snapshot, validation, or unique timeline receipt" })),
  ];
  if (new Set(inputs.map((input) => input.id)).size !== inputs.length
    || new Set(inputs.map((input) => `${input.scope}:${input.path}`)).size !== inputs.length) throw new Error("Duplicate 2.57 input identity");
  const receipts = await Promise.all(inputs.map((input) => receipt(input, parent.inputRoots[input.scope]?.locator)));
  const byId = new Map(receipts.map((input) => [input.id, input]));

  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  if (pkg.version !== "2.57.0-research.1") throw new Error("2.57 application version mismatch");

  const manifest = structuredClone(parent);
  manifest.authoritativeInputs = receipts;
  manifest.manifestSchemaVersion = "2.57.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.57.0";
  manifest.releaseDate = "2026-09-23";
  manifest.application.version = pkg.version;
  manifest.parentIterationManifest = {
    path: SNAPSHOT_256.path,
    releaseId: parent.releaseId,
    bytes: SNAPSHOT_256.bytes,
    fileSha256: SNAPSHOT_256.fileSha256,
    contentSha256: SNAPSHOT_256.contentSha256,
  };
  manifest.integrity.inputCount = receipts.length;
  manifest.baseResearchRelease.note = "Iteration 2.57 adds a source-local checksum-gated topology and adjacent-section screen for Todd NeuroMorpho records 50424 and 50408. The audit preserves 19 exact `Cell Body` line loops and 1,136 ordered vertices, identifies two self-intersecting contours and one zero-length source edge, and holds eight of 17 adjacent intervals outside the exploratory NMO 50394 screen. Screen passage does not admit a shell or imply cell change; thresholds remain unvalidated as biological tolerances. Keep source lines exact, with zero generated surfaces/triangles, internal structures, cross-source identities or registrations.";
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
  manifest.exactReferences.toddNativeContourTopologyAudit257 = {
    auditId: toddAudit.audit.releaseId,
    auditReceipt: { path: INPUTS_257.find(([id]) => id === "toddNativeContourTopologyAudit")[1], ...byId.get("toddNativeContourTopologyAudit") },
    sourceCatalogueReceipt: {
      path: toddAudit.audit.catalogueReceipt.path,
      bytes: toddAudit.audit.catalogueReceipt.bytes,
      sha256: toddAudit.audit.catalogueReceipt.sha256,
      releaseId: toddAudit.audit.catalogueReceipt.releaseId,
    },
    auditedNeuronIds: toddAudit.audit.records.map((record) => record.neuronId),
    sourceContourCount: toddAudit.summary.contourCount,
    sourceVertexCount: toddAudit.summary.vertexCount,
    selfIntersectingContourCount: toddAudit.summary.selfIntersectionCount,
    zeroLengthSourceEdgeCount: toddAudit.summary.zeroLengthEdgeCount,
    adjacentTransitionCount: toddAudit.summary.adjacentTransitionCount,
    transitionsWithinExploratoryScreen: toddAudit.summary.transitionsWithinExploratoryScreen,
    transitionsHeld: toddAudit.summary.transitionsHeld,
    nmo50424: {
      contourCount: toddAudit.audit.records.find((record) => record.neuronId === 50424).summary.contourCount,
      vertexCount: toddAudit.audit.records.find((record) => record.neuronId === 50424).summary.vertexCount,
      transitionsWithinExploratoryScreen: toddAudit.audit.records.find((record) => record.neuronId === 50424).summary.adjacentTransitionsWithinReferenceScreen,
      transitionsHeld: toddAudit.audit.records.find((record) => record.neuronId === 50424).summary.adjacentTransitionsHeld,
      selfIntersectionCount: toddAudit.audit.records.find((record) => record.neuronId === 50424).summary.selfIntersectionCount,
    },
    nmo50408: {
      contourCount: toddAudit.audit.records.find((record) => record.neuronId === 50408).summary.contourCount,
      vertexCount: toddAudit.audit.records.find((record) => record.neuronId === 50408).summary.vertexCount,
      transitionsWithinExploratoryScreen: toddAudit.audit.records.find((record) => record.neuronId === 50408).summary.adjacentTransitionsWithinReferenceScreen,
      transitionsHeld: toddAudit.audit.records.find((record) => record.neuronId === 50408).summary.adjacentTransitionsHeld,
      selfIntersectionCount: toddAudit.audit.records.find((record) => record.neuronId === 50408).summary.selfIntersectionCount,
    },
    referenceScreenRecord: toddAudit.audit.referenceScreen.sourceRecordId,
    referenceThresholds: toddAudit.audit.referenceScreen.thresholds,
    independentlyValidatedBiologicalTolerance: toddAudit.audit.referenceScreen.independentlyValidatedAsBiologicalTolerances,
    contourDerivedSurfaceAdmittedCount: toddAudit.summary.contourDerivedSurfaceAdmittedCount,
    admittedTriangleCount: toddAudit.audit.summary.admittedTriangleCount,
    internalStructureObjectCount: toddAudit.audit.summary.internalStructureObjectCount,
    sameCellJoinCount: toddAudit.audit.summary.sameCellJoinCount,
    crossSourceIdentityCount: toddAudit.audit.summary.crossSourceIdentityCount,
    registrationCount: toddAudit.audit.summary.registrationCount,
    researchUpgradeId: "UPG-220",
  };
  manifest.exactReferences.researchRegistryDenominators257 = {
    canonicalSourcePackageCount: sourceSummary.sourceCount,
    canonicalRecordSetCount: sourceSummary.recordSetCount,
    bundledExactCellProfileRosterCount: sourceSummary.bundledExactRosterCount,
    bundledExactSourceObjectSetCount: sourceSummary.bundledExactSourceObjectSetCount,
    sourceProfileCount: sourceSummary.typeRecordCount,
    upgradeCount: upgrades.upgradeCount,
    displayedUpgradeCount: upgrades.displayedUpgradeCount,
    denominatorDisplayCount: denominatorReceipt.enumeratedDisplayCount,
    staleCanonicalDenominatorLiteralCount: denominatorReceipt.staleLiteralCount,
  };
  manifest.exactReferences.iteration257Layout = {
    fullProjectCopyCount: layout.fullProjectCopyCount,
    distinctTimelinePath: "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_57.md",
    rollbackParent: SNAPSHOT_256.path,
  };
  manifest.scientificBoundaries.toddNativeContourTopologyAudit257 = "Todd NMO 50424/50408 results describe exact source-local contour-section differences, not biological change. The NMO 50394-derived thresholds are exploratory software gates, not validated biological tolerances; passing intervals do not authorize shell generation. Preserve the exact 19 OBS line loops and their source order/coordinates; admit zero shells, triangles, internals, identity joins or registrations.";
  manifest.scientificBoundaries.researchRegistryDenominators257 = "The live registry resolves 28 canonical sources, 37 record sets, 11 exact cell/profile rosters, 2 exact source-object sets, 387 mouse-centric source profiles, and 213 research/model upgrades. The comparative zebrafish lane stays outside mouse types; displayed denominators remain registry-derived with zero stale canonical literals. Historical release denominators remain sealed.";
  manifest.scientificBoundaries.iteration257Layout = "Iteration 2.57 updates the existing workspace and adds source-scoped audit/validation files plus one unique timeline. No complete project copy was created. The rollback parent is the immutable 2.56 manifest.";

  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [flag] = process.argv.slice(2);
    if (process.argv.length !== 3 || !["--write", "--check"].includes(flag)) throw new Error("Use --write or --check");
    const built = await buildResearchIterationManifest257();
    if (flag === "--write") await writeFile(MANIFEST_257_PATH, built.bytes);
    else if (!(await readFile(MANIFEST_257_PATH)).equals(built.bytes)) throw new Error("2.57 manifest is stale");
    process.stdout.write(`${JSON.stringify({ releaseId: built.manifest.releaseId, inputCount: built.manifest.integrity.inputCount, registry: built.manifest.exactReferences.researchRegistryDenominators257, topology: built.manifest.exactReferences.toddNativeContourTopologyAudit257, fullProjectCopyCount: built.manifest.exactReferences.iteration257Layout.fullProjectCopyCount, contentSha256: built.manifest.manifestContentSha256 })}\n`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
