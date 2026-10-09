#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_257, validateResearchIterationManifest257Snapshot } from "./validate-research-iteration-manifest-2.57-snapshot.mjs";
import { INPUTS_258, MANIFEST_258_PATH, buildResearchIterationManifest258 } from "../tools/build_research_iteration_manifest_2_58.mjs";

export async function validateResearchIterationManifest258(override = null) {
  const built = await buildResearchIterationManifest258();
  const bytes = await readFile(MANIFEST_258_PATH);
  const manifest = override ?? JSON.parse(bytes);
  if (override === null && !bytes.equals(built.bytes)) throw new Error("2.58 on-disk manifest differs from verified rebuild");
  if (computeManifestContentSha256(manifest) !== manifest.manifestContentSha256) throw new Error("2.58 content hash invalid");
  if (JSON.stringify(manifest) !== JSON.stringify(built.manifest)) throw new Error("2.58 evidence or input receipts differ from verified rebuild");

  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== manifest.integrity.inputCount || paths.size !== ids.size) throw new Error("Duplicate 2.58 input receipt");
  for (const [id, inputPath] of INPUTS_258) {
    if (!manifest.authoritativeInputs.some((input) => input.id === id && input.scope === "project" && input.path === inputPath)) throw new Error(`2.58 exact input receipt missing: ${id}`);
  }

  const parent = await validateResearchIterationManifest257Snapshot();
  if (manifest.parentIterationManifest.path !== SNAPSHOT_257.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_257.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_257.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_257.contentSha256) throw new Error("2.58 parent must remain the sealed 2.57 release");

  const registry = manifest.exactReferences.researchRegistryDenominators258;
  if (registry.canonicalSourcePackageCount !== 28
    || registry.canonicalRecordSetCount !== 37
    || registry.bundledExactCellProfileRosterCount !== 11
    || registry.bundledExactSourceObjectSetCount !== 2
    || registry.sourceProfileCount !== 387
    || registry.upgradeCount !== 214
    || registry.displayedUpgradeCount !== 30
    || registry.denominatorDisplayCount !== 8
    || registry.staleCanonicalDenominatorLiteralCount !== 0) throw new Error("2.58 live research-registry denominators changed");

  const mito = manifest.exactReferences.bancV888MitochondriaRouteAudit258;
  if (mito.auditId !== "banc-v888-mitochondria-route-audit-0.1.0"
    || mito.candidate.rootId !== "720575941350424112"
    || mito.candidate.materializationId !== "v888"
    || mito.candidate.cellType !== "IN14A018"
    || mito.candidate.species !== "Drosophila melanogaster"
    || mito.candidate.mouseInterneuronJoin !== false
    || mito.metadataMitochondriaCount !== 31
    || mito.countInterpretation !== "source-reported count metric only"
    || mito.perMitochondrionAnnotationRowsRetrieved !== false
    || mito.positionsVerified !== false
    || mito.rootFilteredQuerySupported !== true
    || mito.rootFilterField !== "pt_root_id"
    || mito.configuredCaveClientRequired !== true
    || mito.credentialsInspectedOrUsed !== false
    || mito.queryExecuted !== false
    || mito.perMitochondrionTable.bytes !== 1107598431
    || mito.perMitochondrionTable.md5 !== "2e3be9c0d063969ae019121117007e9a"
    || mito.separateDetectedMitochondriaSegmentationProductStatus !== "MISSING"
    || mito.objectLevelRenderingEligible !== false
    || mito.admittedMitochondrionRows !== 0
    || mito.admittedPointMarkers !== 0
    || mito.admittedMitochondriaSurfaces !== 0
    || mito.admittedCellSurface !== false
    || mito.mouseCellJoinCount !== 0
    || mito.registrationCount !== 0
    || mito.researchUpgradeId !== "UPG-232") throw new Error("2.58 BANC candidate count-only, access-route or species boundary changed");

  if (manifest.exactReferences.iteration258Layout.fullProjectCopyCount !== 0
    || manifest.exactReferences.iteration258Layout.rollbackParent !== SNAPSHOT_257.path
    || manifest.exactReferences.iteration258Layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_58.md"
    || manifest.registrySummary.researchUpgradeCount !== 214
    || manifest.registrySummary.canonicalSourcePackageCount !== 28
    || manifest.registrySummary.canonicalRecordSetCount !== 37
    || manifest.registrySummary.bundledExactRosterCount !== 11
    || manifest.registrySummary.bundledExactObjectSetCount !== 2) throw new Error("2.58 rollback, no-copy or current registry receipt changed");

  return {
    releaseId: manifest.releaseId,
    inputCount: ids.size,
    parentReleaseId: parent.releaseId,
    researchUpgradeCount: registry.upgradeCount,
    sourceCount: registry.canonicalSourcePackageCount,
    recordSetCount: registry.canonicalRecordSetCount,
    metadataMitochondriaCount: mito.metadataMitochondriaCount,
    admittedMitochondrionRows: mito.admittedMitochondrionRows,
    admittedPointMarkers: mito.admittedPointMarkers,
    fullProjectCopyCount: manifest.exactReferences.iteration258Layout.fullProjectCopyCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest258()
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
