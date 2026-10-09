#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { SNAPSHOT_262, validateResearchIterationManifest262Snapshot } from "./validate-research-iteration-manifest-2.62-snapshot.mjs";
import { INPUTS_263, MANIFEST_263_PATH, buildResearchIterationManifest263 } from "../tools/build_research_iteration_manifest_2_63.mjs";

export async function validateResearchIterationManifest263(override = null) {
  const built = await buildResearchIterationManifest263();
  const bytes = await readFile(MANIFEST_263_PATH);
  const manifest = override ?? JSON.parse(bytes);
  if (override === null && !bytes.equals(built.bytes)) throw new Error("2.63 on-disk manifest differs from verified rebuild");
  if (JSON.stringify(manifest) !== JSON.stringify(built.manifest)) throw new Error("2.63 evidence or input receipts differ from verified rebuild");

  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== manifest.integrity.inputCount || paths.size !== ids.size) throw new Error("Duplicate 2.63 input receipt");
  for (const [id, inputPath] of INPUTS_263) {
    if (!manifest.authoritativeInputs.some((input) => input.id === id && input.scope === "project" && input.path === inputPath)) throw new Error(`2.63 exact input receipt missing: ${id}`);
  }

  const parent = await validateResearchIterationManifest262Snapshot();
  if (manifest.parentIterationManifest.path !== SNAPSHOT_262.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_262.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_262.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_262.contentSha256) throw new Error("2.63 parent must remain the sealed 2.62 release");

  const reference = manifest.exactReferences.microStructFormerUltrastructureReference263;
  const registry = manifest.exactReferences.researchRegistryDenominators263;
  const layout = manifest.exactReferences.iteration263Layout;
  if (reference.researchUpgradeId !== "UPG-239"
    || reference.datasetRepository !== "Dnq2025/Mask2former_Finetune"
    || reference.datasetRevisionSha !== "92a2ca0f9d1387fcf7eaca0c67f5467cb3a5ad1f"
    || reference.rowCount !== 540 || reference.splitCounts.train !== 528 || reference.splitCounts.validation !== 12
    || JSON.stringify(reference.rowFields) !== JSON.stringify(["image", "label"])
    || JSON.stringify(reference.viewerSamplePixelDimensions) !== JSON.stringify([3964, 3964])
    || reference.pixelScaleKnown !== false || reference.modelLabelCount !== 5
    || reference.datasetModelLicense !== "CC BY-NC-SA 4.0" || reference.softwareLicenseIsSeparate !== true
    || reference.identifiedInterneuronCount !== 0 || reference.sameCellJoinCount !== 0
    || reference.admittedCellGeometryCount !== 0 || reference.admittedInternalGeometryCount !== 0
    || reference.registrationCount !== 0 || reference.predictionsAdmittedAsObservation !== false
    || reference.crossSectionStackingAllowed !== false || reference.downloadedPayloadBytes !== 0 || reference.linksOnly !== true
    || reference.runtime.collapsedByDefault !== true || reference.runtime.linkedToSelectedCell !== false
    || reference.runtime.changesActiveRecord !== false || reference.runtime.displaysImagesOrMasks !== false
    || reference.runtime.displaysPredictionsAsObservations !== false || reference.runtime.createsCellGeometry !== false
    || reference.runtime.createsInternalGeometry !== false) throw new Error("2.63 MicroStructFormer source, identity, geometry, or runtime boundary changed");
  if (registry.canonicalSourcePackageCount !== 28 || registry.canonicalRecordSetCount !== 37
    || registry.bundledExactCellProfileRosterCount !== 11 || registry.bundledExactSourceObjectSetCount !== 2
    || registry.sourceProfileCount !== 387 || registry.upgradeCount !== 222
    || registry.displayedUpgradeCount !== 34 || registry.staleCanonicalDenominatorLiteralCount !== 0
    || manifest.registrySummary.researchUpgradeCount !== 222
    || layout.fullProjectCopyCount !== 0 || layout.rollbackParent !== SNAPSHOT_262.path
    || layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_63.md") throw new Error("2.63 registry, rollback or no-copy receipt changed");

  return {
    releaseId: manifest.releaseId,
    inputCount: ids.size,
    parentReleaseId: parent.releaseId,
    researchUpgradeCount: registry.upgradeCount,
    pairedImageMaskRows: reference.rowCount,
    identifiedInterneuronCount: reference.identifiedInterneuronCount,
    admittedInternalGeometryCount: reference.admittedInternalGeometryCount,
    downloadedPayloadBytes: reference.downloadedPayloadBytes,
    fullProjectCopyCount: layout.fullProjectCopyCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest263()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
