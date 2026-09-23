#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_249, validateResearchIterationManifest249Snapshot } from "../scripts/validate-research-iteration-manifest-2.49-snapshot.mjs";
import { validateAdultMouseSpinalMerfishVersionAudit, AUDIT_PATH } from "../scripts/validate-adult-mouse-spinal-merfish-version-audit-0.1.mjs";
import { validateCanonicalResearchUpgradeRegistry } from "../scripts/validate-research-model-upgrade-registry-0.1.mjs";
import { loadResearchSourceRegistry, summarizeResearchSourceRegistry } from "../scripts/validate-research-source-registry-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_250_PATH = path.join(ROOT, "data/research-iteration-manifest-2.50.json");
export const INPUTS_250 = Object.freeze([
  ["sealedIteration249SnapshotValidator", "scripts/validate-research-iteration-manifest-2.49-snapshot.mjs"],
  ["sealedIteration249SnapshotTests", "tests/research-iteration-manifest-2.49-snapshot.test.mjs"],
  ["adultMouseSpinalMerfishVersionAudit", "data/adult-mouse-spinal-merfish-version-audit-0.1.json"],
  ["adultMouseSpinalMerfishVersionAuditValidator", "scripts/validate-adult-mouse-spinal-merfish-version-audit-0.1.mjs"],
  ["adultMouseSpinalMerfishVersionAuditTests", "tests/adult-mouse-spinal-merfish-version-audit.test.mjs"],
  ["iteration250Builder", "tools/build_research_iteration_manifest_2_50.mjs"],
  ["iteration250Validator", "scripts/validate-research-iteration-manifest-2.50.mjs"],
  ["iteration250Tests", "tests/research-iteration-manifest-2.50.test.mjs"],
  ["iteration250Timeline", "docs/RESEARCH_TIMELINE_2026-09-22_ITERATION_2_50.md"],
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

export async function buildResearchIterationManifest250() {
  const { manifest: parent } = await validateResearchIterationManifest249Snapshot();
  const upgrades = await validateCanonicalResearchUpgradeRegistry();
  const sourceRegistry = await loadResearchSourceRegistry();
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  const audit = JSON.parse(await readFile(AUDIT_PATH, "utf8"));
  const auditSummary = validateAdultMouseSpinalMerfishVersionAudit(audit);

  const refreshedParentInputs = parent.authoritativeInputs.map((input) => REFRESHED_PARENT_INPUT_PATHS.has(input.path)
    ? { ...input, purpose: `Iteration 2.50 refreshed ${input.id} receipt` }
    : input);
  const refreshedPaths = refreshedParentInputs.filter((input) => REFRESHED_PARENT_INPUT_PATHS.has(input.path)).map((input) => input.path);
  if (refreshedPaths.length !== REFRESHED_PARENT_INPUT_PATHS.size) {
    const missing = [...REFRESHED_PARENT_INPUT_PATHS].filter((inputPath) => !refreshedPaths.includes(inputPath));
    throw new Error(`Required 2.50 refreshed parent inputs are missing: ${missing.join(", ")}`);
  }

  const inputs = [
    ...refreshedParentInputs,
    ...INPUTS_250.map(([id, inputPath]) => ({ id, scope: "project", path: inputPath, purpose: "Iteration 2.50 immutable MERFISH record/version audit or its build, test and documentation input" })),
  ];
  if (new Set(inputs.map((input) => input.id)).size !== inputs.length
    || new Set(inputs.map((input) => `${input.scope}:${input.path}`)).size !== inputs.length) {
    throw new Error("Duplicate 2.50 input identity");
  }

  const receipts = await Promise.all(inputs.map(async (input) => receipt(input, parent.inputRoots[input.scope]?.locator)));
  const byId = new Map(receipts.map((input) => [input.id, input]));
  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  if (pkg.version !== "2.50.0-research.1") throw new Error("2.50 application version mismatch");

  const manifest = structuredClone(parent);
  manifest.authoritativeInputs = receipts;
  manifest.manifestSchemaVersion = "2.50.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.50.0";
  manifest.releaseDate = "2026-09-22";
  manifest.application.version = pkg.version;
  manifest.parentIterationManifest = {
    path: SNAPSHOT_249.path,
    releaseId: parent.releaseId,
    bytes: SNAPSHOT_249.bytes,
    fileSha256: SNAPSHOT_249.fileSha256,
    contentSha256: SNAPSHOT_249.contentSha256,
  };
  manifest.integrity.inputCount = receipts.length;
  manifest.baseResearchRelease.note = "Iteration 2.50 continues in the existing project tree. It reconciles only the published metadata for two adult mouse spinal MERFISH H5AD record candidates and preserves distinct file names/checksums while their Zenodo version lineage, exact object deltas and file-level reuse rights remain unverified. No H5AD payload, cross-version join, new cell denominator, morphology, internal object or atlas registration is admitted.";
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
  const earlier = audit.records[0];
  const later = audit.records[1];
  manifest.exactReferences.adultMouseSpinalMerfishVersionAudit250 = {
    auditId: audit.auditId,
    earlierRecordId: earlier.recordId,
    earlierCandidateVersionLabel: earlier.displayedVersion,
    earlierHealthyFileName: earlier.files[0].fileName,
    earlierHealthyFileMd5: earlier.files[0].publishedMd5,
    earlierSniFileName: earlier.files[1].fileName,
    earlierSniFileMd5: earlier.files[1].publishedMd5,
    laterRecordId: later.recordId,
    laterDisplayedVersion: later.displayedVersion,
    laterHealthyFileName: later.files[0].fileName,
    laterHealthyFileMd5: later.files[0].publishedMd5,
    laterHealthyFileBytes: later.files[0].exactBytes,
    laterSniFileName: later.files[1].fileName,
    laterSniFileMd5: later.files[1].publishedMd5,
    laterSniFileBytes: later.files[1].exactBytes,
    candidateLineageStatus: audit.candidateLineage.status,
    earlierRecordSectionCount: audit.contextualEvidence.earlierRecordSectionCount.value,
    laterAuditSectionIdCount: 108,
    sectionDenominatorsReconciled: false,
    sourceH5adsDownloaded: audit.admission.sourceH5adsDownloaded,
    dataDeltaCompared: audit.admission.dataDeltaCompared,
    fileRightsCleared: audit.admission.fileRightsCleared,
    payloadsBundled: audit.admission.payloadsBundled,
    crossVersionJoins: audit.admission.crossVersionJoins,
    interneuronDenominatorAsserted: audit.admission.interneuronDenominatorAsserted,
    zRegistration: audit.admission.zRegistration,
    cellMorphology: audit.admission.cellMorphology,
    membranes: audit.admission.membranes,
    internalObjects: audit.admission.internalObjects,
    atlasRegistrations: audit.admission.atlasRegistrations,
    researchUpgradeLastId: upgrades.lastIncludedId,
    versionAuditSummary: auditSummary,
  };
  manifest.scientificBoundaries.adultMouseSpinalMerfishVersionAudit250 = "The adult spinal MERFISH study uses a 500-gene panel and reports seven imaging z-planes, but a publication imaging plane is not a deposited 3D cell-boundary object. Zenodo record 20533289 is displayed as v2 and has H5AD names/checksums distinct from record 18039571; their machine-readable lineage and data/schema/section-key delta have not been confirmed here. The 18-section benchmark context and UPG-152's 108 section IDs stay unreconciled. Both file-level reuse licenses are unresolved in this audit. The increment downloads/bundles zero H5AD files and admits zero cross-version joins, interneuron denominators, z-registration, morphology, membranes, internal objects or atlas registration.";
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [flag] = process.argv.slice(2);
    if (process.argv.length !== 3 || !["--write", "--check"].includes(flag)) throw new Error("Use --write or --check");
    const built = await buildResearchIterationManifest250();
    if (flag === "--write") await writeFile(MANIFEST_250_PATH, built.bytes);
    else if (!(await readFile(MANIFEST_250_PATH)).equals(built.bytes)) throw new Error("2.50 manifest is stale");
    console.log(JSON.stringify({ releaseId: built.manifest.releaseId, inputCount: built.manifest.integrity.inputCount, researchUpgradeCount: built.manifest.registrySummary.researchUpgradeCount, manifestContentSha256: built.manifest.manifestContentSha256 }));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
