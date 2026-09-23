#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_248, validateResearchIterationManifest248Snapshot } from "../scripts/validate-research-iteration-manifest-2.48-snapshot.mjs";
import { validateCanonicalResearchUpgradeRegistry } from "../scripts/validate-research-model-upgrade-registry-0.1.mjs";
import { validateBancV888CandidateAudit } from "../scripts/validate-banc-v888-candidate-audit-0.1.mjs";
import { loadResearchSourceRegistry, summarizeResearchSourceRegistry } from "../scripts/validate-research-source-registry-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_249_PATH = path.join(ROOT, "data/research-iteration-manifest-2.49.json");
export const INPUTS_249 = Object.freeze([
  ["sealedIteration248SnapshotValidator", "scripts/validate-research-iteration-manifest-2.48-snapshot.mjs"],
  ["sealedIteration248SnapshotTests", "tests/research-iteration-manifest-2.48-snapshot.test.mjs"],
  ["bancCandidateAuditContract", "data/banc-v888-candidate-audit-0.1.json"],
  ["bancCandidateAuditValidator", "scripts/validate-banc-v888-candidate-audit-0.1.mjs"],
  ["bancCandidateAuditTests", "tests/banc-v888-candidate-audit.test.mjs"],
  ["iteration249Builder", "tools/build_research_iteration_manifest_2_49.mjs"],
  ["iteration249Validator", "scripts/validate-research-iteration-manifest-2.49.mjs"],
  ["iteration249Tests", "tests/research-iteration-manifest-2.49.test.mjs"],
  ["iteration249Timeline", "docs/RESEARCH_TIMELINE_2026-09-22_ITERATION_2_49.md"],
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
  "app/layout.tsx",
  "app/InternalStructureReferencePanel.tsx",
  "tests/microns-observed-cell-nucleus-reference.test.mjs",
  "tests/observed-morphology-runtime-contract.test.mjs",
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function receipt(input, rootLocator) {
  if (!rootLocator || path.isAbsolute(input.path) || input.path.split("/").includes("..")) {
    throw new Error(`Invalid scoped input: ${input.id}`);
  }
  const bytes = await readFile(path.resolve(ROOT, rootLocator, input.path));
  return { ...input, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildResearchIterationManifest249() {
  const { manifest: parent } = await validateResearchIterationManifest248Snapshot();
  const upgrades = await validateCanonicalResearchUpgradeRegistry();
  const sourceRegistry = await loadResearchSourceRegistry();
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  await validateBancV888CandidateAudit();
  const candidate = JSON.parse(await readFile(path.join(ROOT, "data/banc-v888-candidate-audit-0.1.json"), "utf8"));

  const refreshedParentInputs = parent.authoritativeInputs.map((input) => REFRESHED_PARENT_INPUT_PATHS.has(input.path)
    ? { ...input, purpose: `Iteration 2.49 refreshed ${input.id} receipt` }
    : input);
  const refreshedPaths = refreshedParentInputs.filter((input) => REFRESHED_PARENT_INPUT_PATHS.has(input.path)).map((input) => input.path);
  if (refreshedPaths.length !== REFRESHED_PARENT_INPUT_PATHS.size) {
    const missing = [...REFRESHED_PARENT_INPUT_PATHS].filter((inputPath) => !refreshedPaths.includes(inputPath));
    throw new Error(`Required 2.49 refreshed parent inputs are missing: ${missing.join(", ")}`);
  }

  const inputs = [
    ...refreshedParentInputs,
    ...INPUTS_249.map(([id, inputPath]) => ({ id, scope: "project", path: inputPath, purpose: "Iteration 2.49 source candidate, object-link audit, information-panel implementation or verification input" })),
  ];
  if (new Set(inputs.map((input) => input.id)).size !== inputs.length
    || new Set(inputs.map((input) => `${input.scope}:${input.path}`)).size !== inputs.length) {
    throw new Error("Duplicate 2.49 input identity");
  }

  const receipts = await Promise.all(inputs.map(async (input) => receipt(input, parent.inputRoots[input.scope]?.locator)));
  const byId = new Map(receipts.map((input) => [input.id, input]));
  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  if (pkg.version !== "2.49.0-research.1") throw new Error("2.49 application version mismatch");

  const manifest = structuredClone(parent);
  manifest.authoritativeInputs = receipts;
  manifest.manifestSchemaVersion = "2.49.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.49.0";
  manifest.releaseDate = "2026-09-22";
  manifest.application.version = pkg.version;
  manifest.parentIterationManifest = {
    path: SNAPSHOT_248.path,
    releaseId: parent.releaseId,
    bytes: SNAPSHOT_248.bytes,
    fileSha256: SNAPSHOT_248.fileSha256,
    contentSha256: SNAPSHOT_248.contentSha256,
  };
  manifest.integrity.inputCount = receipts.length;
  manifest.baseResearchRelease.note = "Iteration 2.49 continues in the existing project tree. It pins the released Dataverse v3 metadata, audits one source-classified Drosophila VNC candidate, verifies the exact root-to-nucleus row and a full-resolution SWC archive member, and records unresolved candidate mesh, mitochondria-row and synapse-row gates. This improves the comparative information card only: no BANC object geometry, same-cell internal-object chain, mouse-cell join or atlas registration is admitted.";
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
  manifest.exactReferences.bancV888CandidateAudit249 = {
    auditId: candidate.auditId,
    dataverseVersion: candidate.source.dataverseVersion.versionNumber,
    dataverseMetadataFileId: candidate.metadataSnapshot.file.fileId,
    dataverseMetadataFileMd5: candidate.metadataSnapshot.file.md5,
    archivedMetadataRowCount: candidate.metadataSnapshot.file.rows,
    documentedMetadataRowCount: candidate.metadataSnapshot.documentationDiscrepancy.documentedRows,
    archivedMetadataColumnCount: candidate.metadataSnapshot.file.columns,
    documentedMetadataColumnCount: candidate.metadataSnapshot.documentationDiscrepancy.documentedColumns,
    metadataRowsAreInterneuronDenominator: candidate.metadataSnapshot.screenCounts.isDatasetInterneuronDenominator,
    strictCandidateScreenRows: candidate.metadataSnapshot.screenCounts.strictlyProofreadWithNucleusPositionSubclassAndType,
    candidateRootId: candidate.candidate.rootId,
    candidateCellType: candidate.candidate.cellType,
    candidateCellClass: candidate.candidate.cellClass,
    candidateCellSubClass: candidate.candidate.cellSubClass,
    candidateSuperClass: candidate.candidate.superClass,
    candidateProofread: candidate.candidate.proofread,
    rootIdStableAcrossMaterializations: candidate.candidate.rootIdCrosswalk.allEqual,
    nucleusId: candidate.candidate.nucleusId,
    nucleusExactRootJoinVerified: candidate.objectReceipts.nucleusAnnotationRow.exactRootJoinVerified,
    nucleusSurfaceAvailable: candidate.objectReceipts.nucleusAnnotationRow.surfaceOrVolumeGeometryAvailableInThisTable,
    swcMemberName: candidate.objectReceipts.fullResolutionSkeletonMember.memberName,
    swcMemberSha256: candidate.objectReceipts.fullResolutionSkeletonMember.memberSha256,
    swcNodeCount: candidate.objectReceipts.fullResolutionSkeletonMember.swcNodeCount,
    nucleusPointWithinSwcBounds: candidate.objectReceipts.fullResolutionSkeletonMember.nucleusPointWithinSwcBounds,
    meshObjectsFound: candidate.objectReceipts.neuronMeshCandidateObjects.objects.length,
    meshVersionLinkedToDataverseV888: candidate.objectReceipts.neuronMeshCandidateObjects.versionLinkedToDataverseV888,
    mitochondriaMetadataCount: candidate.candidate.metadataMetrics.mitochondriaCount,
    candidateMitochondriaRowsFiltered: candidate.objectReceipts.mitochondria.candidateSpecificAnnotationRowsFiltered,
    candidateSynapseRowsFiltered: candidate.objectReceipts.synapses.candidateSpecificRowsFiltered,
    sameCellObjectChainComplete: candidate.admission.sameCellObjectChainComplete,
    sourceObjectsImported: candidate.admission.sourceObjectsImported,
    cellMeshesAdmitted: candidate.admission.cellMeshesAdmitted,
    nucleusSurfacesAdmitted: candidate.admission.nucleusSurfacesAdmitted,
    mitochondriaObjectsAdmitted: candidate.admission.mitochondriaObjectsAdmitted,
    synapseObjectsAdmitted: candidate.admission.synapseObjectsAdmitted,
    sameCellJoinCount: candidate.admission.sameCellJoinCount,
    registrationCount: candidate.admission.registrationCount,
    renderedGeometryCount: candidate.admission.renderedGeometryCount,
    nextGateUpgradeId: candidate.admission.nextGateUpgradeId,
    researchUpgradeLastId: upgrades.lastIncludedId,
  };
  manifest.scientificBoundaries.bancV888CandidateAudit249 = `BANC v888 is one adult female Drosophila comparison system. The pinned Dataverse v3 Feather has ${candidate.metadataSnapshot.file.rows.toLocaleString()} rows × ${candidate.metadataSnapshot.file.columns} columns, while the current schema documentation reports ${candidate.metadataSnapshot.documentationDiscrepancy.documentedRows.toLocaleString()} × ${candidate.metadataSnapshot.documentationDiscrepancy.documentedColumns}; neither count is an interneuron denominator. Candidate ${candidate.candidate.rootId} (${candidate.candidate.cellType}) has a verified nucleus-ID/root-ID annotation row and one exact 7,451-node full-resolution SWC member; this does not complete the same-cell chain. Its GCS mesh fragments are not version-linked to the Dataverse v888 release, candidate mitochondrial and synapse rows remain unfiltered, and no BANC objects, joins, registrations or geometry are admitted.`;
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [flag] = process.argv.slice(2);
    if (process.argv.length !== 3 || !["--write", "--check"].includes(flag)) throw new Error("Use --write or --check");
    const built = await buildResearchIterationManifest249();
    if (flag === "--write") await writeFile(MANIFEST_249_PATH, built.bytes);
    else if (!(await readFile(MANIFEST_249_PATH)).equals(built.bytes)) throw new Error("2.49 manifest is stale");
    console.log(JSON.stringify({ releaseId: built.manifest.releaseId, inputCount: built.manifest.integrity.inputCount, manifestContentSha256: built.manifest.manifestContentSha256 }));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
