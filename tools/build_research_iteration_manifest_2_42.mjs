#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildResearchIterationManifest241 } from "./build_research_iteration_manifest_2_41.mjs";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateCanonicalResearchUpgradeRegistry } from "../scripts/validate-research-model-upgrade-registry-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_242_PATH = path.join(ROOT, "data/research-iteration-manifest-2.42.json");
export const INPUTS_242 = Object.freeze([
  ["neuriteInspectionRuntime", "app/morphology-neurite-inspection.js"],
  ["neuriteInspectorComponent", "app/MorphologyNeuriteInspector.tsx"],
  ["neuriteInspectorStyles", "app/morphology-neurite-inspector.css"],
  ["neuriteInspectionTests", "tests/morphology-neurite-inspection.test.mjs"],
  ["researchInformationStyles", "app/research-information-layout.css"],
  ["modelExpansionResearchWatch", "docs/RESEARCH_WATCH_2026-09-22_MODEL_EXPANSION.md"],
  ["researchTimeline242", "docs/RESEARCH_TIMELINE_2026-09-22_ITERATION_2_42.md"],
  ["researchIteration242Builder", "tools/build_research_iteration_manifest_2_42.mjs"],
  ["researchIteration242Validator", "scripts/validate-research-iteration-manifest-2.42.mjs"],
  ["researchIteration242Tests", "tests/research-iteration-manifest-2.42.test.mjs"],
  ["canoSourceRecoveryDownloader", "tools/fetch_cano_gomez_sources.py"],
  ["canoSourceRecoveryTests", "tests/test_cano_source_recovery.py"],
  ["canoGlutSourceAbsenceTests", "tests/cano-gomez-glut-source-absence.test.mjs"],
  ["nativeDetailResearchManifest", "data/source-candidates/neuromorpho-native-detail-20260922/manifest.json"],
  ["nativeDetail108978Dat", "data/source-candidates/neuromorpho-native-detail-20260922/nmo-108978.original.dat"],
  ["nativeDetail249676Dat", "data/source-candidates/neuromorpho-native-detail-20260922/nmo-249676.original.dat"],
  ["nativeDetail108978Api", "data/source-candidates/neuromorpho-native-detail-20260922/nmo-108978.api.json"],
  ["researchIteration234SnapshotValidator", "scripts/validate-research-iteration-manifest-2.34-snapshot.mjs"],
  ["canoBrowserImportMirror", "data/cano-gomez-p56-multiome-interneuron-registry-0.1.json"],
  ["canoBrowserImportMirrorTest", "tests/cano-gomez-import-mirror.test.mjs"],
  ["prpCurrentDerivativeInventoryValidator", "scripts/validate-prp-dorsal-horn-observed-morphology-route-pack-0.1.mjs"],
  ["prpCurrentDerivativeInventoryTests", "tests/prp-dorsal-horn-observed-morphology-route-pack.test.mjs"],
  ["canoGlutIdentitySlotObserver", "tools/inspect_cano_gomez_glut_active_ident.py"],
  ["canoGlutIdentitySlotObservation", "data/source-extractions/cano-gomez-p56/GSE318731_P56_glutamatergic_multiome_UPDATE.active-ident-observation.json"],
  ["canoCholExtractionAudit", "data/source-extractions/cano-gomez-p56/GSE318731_P56_cholinergic_multiome.audit.json"],
  ["canoCholExtractedMetadata", "data/source-extractions/cano-gomez-p56/GSE318731_P56_cholinergic_multiome.metadata.csv.gz"],
  ["canoCholAcquisitionReceipt", "data/source-extractions/cano-gomez-p56/GSE318731_P56_cholinergic_multiome.rds.download.json"],
  ["canoGabaExtractionAudit", "data/source-extractions/cano-gomez-p56/GSE318731_P56_gabaergic_multiome.audit.json"],
  ["canoGabaExtractedMetadata", "data/source-extractions/cano-gomez-p56/GSE318731_P56_gabaergic_multiome.metadata.csv.gz"],
  ["canoGabaAcquisitionReceipt", "data/source-extractions/cano-gomez-p56/GSE318731_P56_gabaergic_multiome.rds.download.json"],
  ["canoGlutExtractionAudit", "data/source-extractions/cano-gomez-p56/GSE318731_P56_glutamatergic_multiome_UPDATE.audit.json"],
  ["canoGlutExtractedMetadata", "data/source-extractions/cano-gomez-p56/GSE318731_P56_glutamatergic_multiome_UPDATE.metadata.csv.gz"],
  ["canoGlutAcquisitionReceipt", "data/source-extractions/cano-gomez-p56/GSE318731_P56_glutamatergic_multiome_UPDATE.rds.download.json"],
  ["canoRecoveredSourcesReadme", "data/source-extractions/cano-gomez-p56/README.md"],
]);

export async function buildResearchIterationManifest242() {
  const upgrades = await validateCanonicalResearchUpgradeRegistry();
  // Reuse every original scientific check; 2.41 never produced a sealed manifest.
  // The immutable parent stays 2.40 instead of inventing a 2.41 snapshot.
  const { manifest } = await buildResearchIterationManifest241({
    iteration: "2.42", upgradeCount: upgrades.upgradeCount, lastUpgradeId: upgrades.lastIncludedId,
  });
  for (const [id, inputPath] of INPUTS_242) {
    if (manifest.authoritativeInputs.some((input) => input.id === id || input.path === inputPath)) {
      throw new Error(`Duplicate 2.42 input: ${id}`);
    }
    const bytes = await readFile(path.join(ROOT, inputPath));
    manifest.authoritativeInputs.push({
      id, scope: "project", path: inputPath, purpose: "Iteration 2.42 implementation, research or verification",
      bytes: bytes.byteLength, sha256: createHash("sha256").update(bytes).digest("hex"),
    });
  }
  const currentPurpose = {
    researchModelUpgradeRegistry: `Deterministic ${upgrades.upgradeCount}-row research/model upgrade registry through ${upgrades.lastIncludedId}; UPG-205 and UPG-206 implemented`,
    researchUpgradeQueue: `Evidence-gated research/model queue through ${upgrades.lastIncludedId}; exact-source future work remains explicit`,
    researchUpgradeRegistryBuilder: `Deterministic registry builder through ${upgrades.lastIncludedId}`,
    researchUpgradeRegistryValidator: `${upgrades.upgradeCount}-row upgrade-registry validator retaining completed source-evidence receipts`,
    researchUpgradeRegistryTest: `Registry deterministic and mutation tests through ${upgrades.lastIncludedId}`,
  };
  for (const input of manifest.authoritativeInputs) {
    if (currentPurpose[input.id]) input.purpose = currentPurpose[input.id];
  }
  manifest.manifestSchemaVersion = "2.42.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.42.0";
  manifest.releaseDate = "2026-09-22";
  manifest.integrity.inputCount = manifest.authoritativeInputs.length;
  manifest.baseResearchRelease.note = "Iteration 2.42 continues the unsealed 2.41 working tree in place. It restores Cano-Gomez production metadata from public sources, exposes exact deposited neurite topology and source-gated diameter inspection, and adds direct research-page navigation with expandable source context. Its last sealed immutable parent is 2.40. No full-project copy, inferred intracellular structure, or new biological identity is created.";
  manifest.exactReferences.neuriteInspectionAndInformation242 = {
    implementedUpgradeIds: ["UPG-205", "UPG-206"],
    geometryBasis: "deposited_swc_parent_tree",
    diameterAuthority: "source_record_radius_availability",
    anatomyRegistrationCount: 0,
    generatedIntracellularObjectCount: 0,
    generatedFallbackPrimitiveCount: 0,
    retainsSourceTwoDimensionality: true,
    previousUnsealedIteration: "2.41",
    researchQueueLastId: upgrades.lastIncludedId,
  };
  manifest.scientificBoundaries.neuriteInspection242 = "A selected SWC node, parent path, descendant arbor and cable/diameter values describe deposited reconstruction samples. They are not organelles, an observed cell membrane, a complete biological axon, a new type classification, or same-cell cross-modal evidence. No radius is inferred when the repository record lacks diameter authority. Source 2D data retain their original depth restriction.";
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.some((arg) => !["--write", "--check"].includes(arg)) || args.length > 1) throw new Error("Use --write or --check");
    const built = await buildResearchIterationManifest242();
    if (args.includes("--write")) await writeFile(MANIFEST_242_PATH, built.bytes);
    if (args.includes("--check") && !(await readFile(MANIFEST_242_PATH)).equals(built.bytes)) throw new Error("2.42 manifest is stale");
    console.log(JSON.stringify({ releaseId: built.manifest.releaseId, inputCount: built.manifest.integrity.inputCount, manifestContentSha256: built.manifest.manifestContentSha256 }));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
