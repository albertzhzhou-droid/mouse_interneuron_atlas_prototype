#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_284, validateResearchIterationManifest284Snapshot } from "./validate-research-iteration-manifest-2.84-snapshot.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(ROOT, "data/research-iteration-manifest-2.85.json");
export const SNAPSHOT_285 = Object.freeze({
  path: "data/research-iteration-manifest-2.85.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.85.0",
  version: "2.85.0-research.1",
  bytes: 5686,
  fileSha256: "96d03a7ec4bbf6ce9789beb7f81f74c19f23f904d3ede0243f113371f4c27ddb",
  contentSha256: "a6f95280ec3ad69d81b38baf3b99651f7eaaa8acf7b25f2172df225b69f551e7",
  inputCount: 17,
});

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest285Snapshot() {
  const bytes = await readFile(MANIFEST_PATH);
  if (SNAPSHOT_285.bytes && (bytes.byteLength !== SNAPSHOT_285.bytes || sha256(bytes) !== SNAPSHOT_285.fileSha256)) {
    throw new Error("Immutable 2.85 manifest file receipt changed");
  }
  const manifest = JSON.parse(bytes.toString("utf8"));
  const parent = await validateResearchIterationManifest284Snapshot();
  const inputPaths = manifest.authoritativeInputs?.map((input) => input.path) ?? [];
  const summary = manifest.registrySummary;
  const refs = manifest.exactReferences;
  const audit = refs?.kohSpinalSupplementAudit;
  const expectedInputs = [
    "data/research-iteration-manifest-2.84.json",
    "data/research-source-registry-0.1.json",
    "scripts/validate-research-source-registry-0.1.mjs",
    "scripts/validate-research-source-registry-denominators.mjs",
    "data/research-model-upgrade-registry-0.1.json",
    "docs/RESEARCH_MODEL_UPGRADE_QUEUE.md",
    "docs/RESEARCH_WATCH_2026-09-24_KOH_SPINAL_SBEM.md",
    "tools/build_research_upgrade_registry.mjs",
    "scripts/validate-research-model-upgrade-registry-0.1.mjs",
    "tests/research-model-upgrade-registry.test.mjs",
    "app/ResearchOverview.tsx",
    "package.json",
    "package-lock.json",
    "tools/run_current_research_tests.mjs",
    "docs/RESEARCH_TIMELINE_2026-09-24_ITERATION_2_85.md",
    "tests/research-iteration-manifest-2.85-snapshot.test.mjs",
    "tools/build_research_iteration_manifest_2_85.mjs",
  ];
  if (computeManifestContentSha256(manifest) !== manifest.manifestContentSha256
    || (SNAPSHOT_285.contentSha256 && manifest.manifestContentSha256 !== SNAPSHOT_285.contentSha256)
    || manifest.manifestSchemaVersion !== "2.85.0"
    || manifest.releaseId !== SNAPSHOT_285.releaseId
    || manifest.application.version !== SNAPSHOT_285.version
    || manifest.integrity.inputCount !== SNAPSHOT_285.inputCount
    || manifest.integrity.inputPathsUnique !== true
    || manifest.authoritativeInputs.length !== manifest.integrity.inputCount
    || JSON.stringify(inputPaths) !== JSON.stringify(expectedInputs)
    || new Set(inputPaths).size !== inputPaths.length
    || manifest.authoritativeInputs.some((input) => typeof input.path !== "string" || path.isAbsolute(input.path)
      || input.path.split("/").includes("..") || !Number.isInteger(input.bytes) || input.bytes < 1
      || !/^[a-f0-9]{64}$/.test(input.sha256))
    || manifest.parentIterationManifest.path !== SNAPSHOT_284.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_284.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_284.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_284.contentSha256
    || summary.canonicalSourceCount !== 31 || summary.canonicalRecordSetCount !== 41
    || summary.bundledExactCellProfileRosterCount !== 13 || summary.bundledExactSourceObjectSetCount !== 4
    || summary.sourceProfileCount !== 387 || summary.researchUpgradeCount !== 239
    || summary.completedResearchUpgradeCount !== 69 || summary.displayedResearchUpgradeCount !== 44
    || summary.staleCanonicalDenominatorLiteralCount !== 0
    || audit.researchUpgradeId !== "UPG-257"
    || audit.listedSupplementFiles?.pdfCount !== 1 || audit.listedSupplementFiles?.xlsxCount !== 1
    || audit.listedSupplementFiles?.xlsxListedSize !== "216.8 KB"
    || audit.articleReportedScope?.species !== "Danio rerio"
    || audit.articleReportedScope?.ageDaysPostFertilization !== 6
    || audit.articleReportedScope?.healthyAnimals !== 1
    || JSON.stringify(audit.articleReportedScope?.volumeExtentMicrometers) !== JSON.stringify([74, 74, 207])
    || JSON.stringify(audit.articleReportedScope?.voxelSizeNanometers) !== JSON.stringify([9, 9, 21])
    || audit.articleDescribesObjectSynapseAndTripartiteGliaLists !== true
    || audit.workbookRetrieved !== false || audit.worksheetsInspected !== false || audit.rowCountsVerified !== false
    || audit.objectIdsObserved !== 0 || audit.synapseCoordinatesObserved !== 0 || audit.sourceObjectsAdmitted !== 0
    || audit.geometryAdmitted !== 0 || audit.coordinatesRendered !== 0 || audit.crossSpeciesIdentityJoins !== 0
    || audit.mouseDenominatorDelta !== 0 || audit.fileSpecificRightsVerified !== false
    || refs.fullProjectCopyCount !== 0 || refs.historicalParent.inputByteReplayRequired !== false) {
    throw new Error("Immutable 2.85 parent, UPG-257 source audit, registry denominators or no-admission boundary changed");
  }
  return {
    releaseId: manifest.releaseId,
    version: manifest.application.version,
    inputCount: manifest.integrity.inputCount,
    parentReleaseId: parent.releaseId,
    sourceCount: summary.canonicalSourceCount,
    sourceProfileCount: summary.sourceProfileCount,
    researchUpgradeCount: summary.researchUpgradeCount,
    workbookRetrieved: audit.workbookRetrieved,
    worksheetsInspected: audit.worksheetsInspected,
    geometryAdmitted: audit.geometryAdmitted,
    mouseDenominatorDelta: audit.mouseDenominatorDelta,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest285Snapshot()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
