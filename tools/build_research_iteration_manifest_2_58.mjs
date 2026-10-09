#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_257, validateResearchIterationManifest257Snapshot } from "../scripts/validate-research-iteration-manifest-2.57-snapshot.mjs";
import { validateCanonicalResearchUpgradeRegistry } from "../scripts/validate-research-model-upgrade-registry-0.1.mjs";
import { loadResearchSourceRegistry, loadResearchUpgradeRegistry, summarizeResearchSourceRegistry, validateResearchSourceRegistry, validateResearchSourceUpgradeLinks } from "../scripts/validate-research-source-registry-0.1.mjs";
import { validateResearchSourceRegistryDenominators } from "../scripts/validate-research-source-registry-denominators.mjs";
import { loadAndValidateBancV888MitochondriaRouteAudit } from "../scripts/validate-banc-v888-mitochondria-route-audit-0.1.mjs";
import { validateIncrementalIterationLayout } from "../scripts/validate-incremental-iteration-layout.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_258_PATH = path.join(ROOT, "data/research-iteration-manifest-2.58.json");
export const INPUTS_258 = Object.freeze([
  ["bancV888MitochondriaRouteAudit", "data/banc-v888-mitochondria-route-audit-0.1.json"],
  ["bancV888MitochondriaRouteAuditSchema", "schemas/banc-v888-mitochondria-route-audit-0.1.schema.json"],
  ["bancV888MitochondriaRouteAuditValidator", "scripts/validate-banc-v888-mitochondria-route-audit-0.1.mjs"],
  ["bancV888MitochondriaRouteAuditTests", "tests/banc-v888-mitochondria-route-audit.test.mjs"],
  ["bancMitochondriaRouteResearchWatch", "docs/RESEARCH_WATCH_2026-09-23_BANC_MITOCHONDRIA_ROUTE.md"],
  ["sealedIteration257SnapshotValidator", "scripts/validate-research-iteration-manifest-2.57-snapshot.mjs"],
  ["sealedIteration257SnapshotTests", "tests/research-iteration-manifest-2.57-snapshot.test.mjs"],
  ["iteration258Builder", "tools/build_research_iteration_manifest_2_58.mjs"],
  ["iteration258Validator", "scripts/validate-research-iteration-manifest-2.58.mjs"],
  ["iteration258Tests", "tests/research-iteration-manifest-2.58.test.mjs"],
  ["iteration258Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_58.md"],
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function receipt(input, rootLocator) {
  if (!rootLocator || path.isAbsolute(input.path) || input.path.split("/").includes("..")) throw new Error(`Invalid scoped input: ${input.id}`);
  const bytes = await readFile(path.resolve(ROOT, rootLocator, input.path));
  return { ...input, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildResearchIterationManifest258() {
  const parentReceipt = await validateResearchIterationManifest257Snapshot();
  const parent = parentReceipt.manifest;
  const [upgrades, sourceRegistry, upgradeRegistry, bancAudit, denominatorReceipt, layout] = await Promise.all([
    validateCanonicalResearchUpgradeRegistry(),
    loadResearchSourceRegistry(),
    loadResearchUpgradeRegistry(),
    loadAndValidateBancV888MitochondriaRouteAudit(),
    validateResearchSourceRegistryDenominators(),
    validateIncrementalIterationLayout(),
  ]);
  validateResearchSourceRegistry(sourceRegistry);
  validateResearchSourceUpgradeLinks(sourceRegistry, upgradeRegistry);
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  if (sourceSummary.sourceCount !== denominatorReceipt.sourceCount
    || sourceSummary.recordSetCount !== denominatorReceipt.recordSetCount
    || sourceSummary.bundledExactRosterCount !== denominatorReceipt.bundledExactCellProfileRosterCount
    || sourceSummary.bundledExactSourceObjectSetCount !== denominatorReceipt.bundledExactSourceObjectSetCount) throw new Error("2.58 source-registry denominators differ between runtime surfaces");

  const parentInputs = await Promise.all(parent.authoritativeInputs.map(async (input) => {
    const current = await receipt(input, parent.inputRoots[input.scope]?.locator);
    const changed = current.bytes !== input.bytes || current.sha256 !== input.sha256;
    return changed ? { ...current, purpose: `Iteration 2.58 refreshed ${input.id} receipt` } : current;
  }));
  const inputs = [
    ...parentInputs,
    ...INPUTS_258.map(([id, inputPath]) => ({ id, scope: "project", path: inputPath, purpose: "Iteration 2.58 BANC v888 mitochondria count/query-route audit, historical snapshot, validation, or unique timeline receipt" })),
  ];
  if (new Set(inputs.map((input) => input.id)).size !== inputs.length
    || new Set(inputs.map((input) => `${input.scope}:${input.path}`)).size !== inputs.length) throw new Error("Duplicate 2.58 input identity");
  const receipts = await Promise.all(inputs.map((input) => receipt(input, parent.inputRoots[input.scope]?.locator)));
  const byId = new Map(receipts.map((input) => [input.id, input]));

  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  if (pkg.version !== "2.58.0-research.1") throw new Error("2.58 application version mismatch");

  const manifest = structuredClone(parent);
  manifest.authoritativeInputs = receipts;
  manifest.manifestSchemaVersion = "2.58.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.58.0";
  manifest.releaseDate = "2026-09-23";
  manifest.application.version = pkg.version;
  manifest.parentIterationManifest = {
    path: SNAPSHOT_257.path,
    releaseId: parent.releaseId,
    bytes: SNAPSHOT_257.bytes,
    fileSha256: SNAPSHOT_257.fileSha256,
    contentSha256: SNAPSHOT_257.contentSha256,
  };
  manifest.integrity.inputCount = receipts.length;
  manifest.baseResearchRelease.note = "Iteration 2.58 adds a source-pinned, exact-root audit of the BANC v888 candidate’s mitochondrial count metric and documented query route. The v888 metadata reports 31 mitochondria, while candidate annotation rows and spatial positions have not been retrieved; a configured CAVE client is required by the documented root-filter path and no credentials or query were used. Keep the adult-fly record comparative and separate from selected mouse cells; admit zero mitochondrial markers, surfaces, cell geometry, identity joins or registrations. The separate detected-mitochondria segmentation product remains marked MISSING.";
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

  const mito = bancAudit.candidate.mitochondriaCountMetric;
  const representation = bancAudit.representation;
  manifest.exactReferences.bancV888MitochondriaRouteAudit258 = {
    auditId: bancAudit.auditId,
    auditReceipt: { path: INPUTS_258.find(([id]) => id === "bancV888MitochondriaRouteAudit")[1], ...byId.get("bancV888MitochondriaRouteAudit") },
    candidate: {
      rootId: bancAudit.candidate.rootId,
      materializationId: bancAudit.candidate.materializationId,
      cellType: bancAudit.candidate.cellType,
      cellSubClass: bancAudit.candidate.cellSubClass,
      species: bancAudit.candidate.species,
      proofread: bancAudit.candidate.proofread,
      rootIdStableAcrossMaterializations626850888890: bancAudit.candidate.rootIdStableAcrossMaterializations626850888890,
      mouseInterneuronJoin: bancAudit.candidate.mouseInterneuronJoin,
    },
    metadataMitochondriaCount: mito.value,
    countInterpretation: mito.interpretation,
    perMitochondrionAnnotationRowsRetrieved: mito.perMitochondrionAnnotationRowsRetrieved,
    positionsVerified: mito.positionsVerified,
    rootFilteredQuerySupported: bancAudit.queryRoute.rootFilteredQuerySupported,
    rootFilterField: bancAudit.queryRoute.rootFilterField,
    configuredCaveClientRequired: bancAudit.queryRoute.configuredCaveClientRequiredByDocumentedImplementation,
    credentialsInspectedOrUsed: bancAudit.queryRoute.credentialsInspectedOrUsed,
    queryExecuted: bancAudit.queryRoute.queryExecuted,
    perMitochondrionTable: {
      fileId: bancAudit.source.mitochondriaTable.fileId,
      filename: bancAudit.source.mitochondriaTable.filename,
      bytes: bancAudit.source.mitochondriaTable.bytes,
      md5: bancAudit.source.mitochondriaTable.md5,
      restricted: bancAudit.source.mitochondriaTable.restricted,
    },
    separateDetectedMitochondriaSegmentationProductStatus: bancAudit.source.separateSegmentationProductStatus,
    objectLevelRenderingEligible: representation.eligibleForObjectLevelInternalRendering,
    admittedMitochondrionRows: representation.perMitochondrionRowsAdmitted,
    admittedPointMarkers: representation.mitochondriaPointMarkersAdmitted,
    admittedMitochondriaSurfaces: representation.mitochondriaSurfacesAdmitted,
    admittedCellSurface: representation.cellSurfaceAdmitted,
    mouseCellJoinCount: representation.mouseCellJoinCount,
    registrationCount: representation.registrationCount,
    researchUpgradeId: "UPG-232",
  };
  manifest.exactReferences.researchRegistryDenominators258 = {
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
  manifest.exactReferences.iteration258Layout = {
    fullProjectCopyCount: layout.fullProjectCopyCount,
    distinctTimelinePath: "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_58.md",
    rollbackParent: SNAPSHOT_257.path,
  };

  manifest.scientificBoundaries.bancV888MitochondriaRouteAudit258 = "The exact BANC v888 candidate’s metadata reports a mitochondria count metric of 31; this is not 31 verified object coordinates, points, or meshes. The documented pt_root_id query route was not executed because no configured CAVE client was used; no credentials were inspected. The public table is over 1.1 GB compressed and was not bulk-downloaded. Keep BANC in an adult Drosophila comparison lane with zero admitted mitochondrial rows, markers, surfaces, cell geometry, mouse joins or registrations. The separate detected-mitochondria segmentation product remains MISSING.";
  manifest.scientificBoundaries.researchRegistryDenominators258 = "The live registry resolves 28 canonical sources, 37 record sets, 11 exact cell/profile rosters, 2 exact source-object sets, 387 mouse-centric source profiles, and 214 research/model upgrades. Display denominators are registry-derived with zero stale canonical literals. Historical release denominators remain sealed.";
  manifest.scientificBoundaries.iteration258Layout = "Iteration 2.58 updates the existing workspace and adds source-scoped audit/validation files plus one unique timeline. No complete project copy was created. The rollback parent is the immutable 2.57 manifest.";

  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [flag] = process.argv.slice(2);
    if (process.argv.length !== 3 || !["--write", "--check"].includes(flag)) throw new Error("Use --write or --check");
    const built = await buildResearchIterationManifest258();
    if (flag === "--write") await writeFile(MANIFEST_258_PATH, built.bytes);
    else if (!(await readFile(MANIFEST_258_PATH)).equals(built.bytes)) throw new Error("2.58 manifest is stale");
    process.stdout.write(`${JSON.stringify({ releaseId: built.manifest.releaseId, inputCount: built.manifest.integrity.inputCount, registry: built.manifest.exactReferences.researchRegistryDenominators258, bancMitochondria: built.manifest.exactReferences.bancV888MitochondriaRouteAudit258, fullProjectCopyCount: built.manifest.exactReferences.iteration258Layout.fullProjectCopyCount, contentSha256: built.manifest.manifestContentSha256 })}\n`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
