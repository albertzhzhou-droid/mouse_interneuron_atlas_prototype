#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_285, validateResearchIterationManifest285Snapshot } from "./validate-research-iteration-manifest-2.85-snapshot.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(ROOT, "data/research-iteration-manifest-2.86.json");
export const SNAPSHOT_286 = Object.freeze({
  path: "data/research-iteration-manifest-2.86.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.86.0",
  version: "2.86.0-research.1",
  bytes: 5795,
  fileSha256: "33ba46324e1eb5bba05e7de8dfca087a36a742c52fc8b2462ed37672dcfe3bb1",
  contentSha256: "85fd9420b91de6b5313e3120636b09f4d1e5e658f5cb513b6ddbb3967b5b16d5",
  inputCount: 20,
});

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest286Snapshot() {
  const bytes = await readFile(MANIFEST_PATH);
  if (SNAPSHOT_286.bytes && (bytes.byteLength !== SNAPSHOT_286.bytes || sha256(bytes) !== SNAPSHOT_286.fileSha256)) {
    throw new Error("Immutable 2.86 manifest file receipt changed");
  }
  const manifest = JSON.parse(bytes.toString("utf8"));
  const parent = await validateResearchIterationManifest285Snapshot();
  const inputPaths = manifest.authoritativeInputs?.map((input) => input.path) ?? [];
  const summary = manifest.registrySummary;
  const detail = manifest.exactReferences?.activeRecordInternalDetailNormalization;
  const expectedInputs = [
    "data/research-iteration-manifest-2.85.json",
    "data/research-source-registry-0.1.json",
    "scripts/validate-research-source-registry-0.1.mjs",
    "scripts/validate-research-source-registry-denominators.mjs",
    "data/research-model-upgrade-registry-0.1.json",
    "docs/RESEARCH_MODEL_UPGRADE_QUEUE.md",
    "tools/build_research_upgrade_registry.mjs",
    "scripts/validate-research-model-upgrade-registry-0.1.mjs",
    "tests/research-model-upgrade-registry.test.mjs",
    "public/data/research_explorer_index_v1/search-index.json",
    "app/exact-record-detail-coverage.js",
    "app/InternalStructureReferencePanel.tsx",
    "app/globals.css",
    "tests/exact-record-detail-coverage.test.mjs",
    "package.json",
    "package-lock.json",
    "tools/run_current_research_tests.mjs",
    "docs/RESEARCH_TIMELINE_2026-09-24_ITERATION_2_86.md",
    "tests/research-iteration-manifest-2.86-snapshot.test.mjs",
    "tools/build_research_iteration_manifest_2_86.mjs",
  ];
  if (computeManifestContentSha256(manifest) !== manifest.manifestContentSha256
    || (SNAPSHOT_286.contentSha256 && manifest.manifestContentSha256 !== SNAPSHOT_286.contentSha256)
    || manifest.manifestSchemaVersion !== "2.86.0"
    || manifest.releaseId !== SNAPSHOT_286.releaseId
    || manifest.application.version !== SNAPSHOT_286.version
    || manifest.integrity.inputCount !== SNAPSHOT_286.inputCount
    || manifest.integrity.inputPathsUnique !== true
    || manifest.authoritativeInputs.length !== manifest.integrity.inputCount
    || JSON.stringify(inputPaths) !== JSON.stringify(expectedInputs)
    || new Set(inputPaths).size !== inputPaths.length
    || manifest.authoritativeInputs.some((input) => typeof input.path !== "string" || path.isAbsolute(input.path)
      || input.path.split("/").includes("..") || !Number.isInteger(input.bytes) || input.bytes < 1
      || !/^[a-f0-9]{64}$/.test(input.sha256))
    || manifest.parentIterationManifest.path !== SNAPSHOT_285.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_285.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_285.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_285.contentSha256
    || summary.canonicalSourceCount !== 31 || summary.canonicalRecordSetCount !== 41
    || summary.bundledExactCellProfileRosterCount !== 13 || summary.bundledExactSourceObjectSetCount !== 4
    || summary.sourceProfileCount !== 387 || summary.researchUpgradeCount !== 240
    || summary.completedResearchUpgradeCount !== 70 || summary.displayedResearchUpgradeCount !== 45
    || summary.staleCanonicalDenominatorLiteralCount !== 0
    || detail.researchUpgradeId !== "UPG-258" || detail.exactExplorerRecordCount !== 641
    || detail.sharedInternalBoundaryRecordCount !== 536 || detail.repeatedFourSlotRecordCountBefore !== 165
    || detail.repeatedFourSlotRecordCountAfter !== 0
    || JSON.stringify(detail.normalizedSlotIds) !== JSON.stringify(["nucleus", "organelles", "synaptic_structures", "receptor_distribution"])
    || detail.sharedBoundaryRenderedOncePerRecord !== true || detail.perSlotLocatorsRetained !== true
    || detail.admittedGeometryDelta !== 0 || detail.sameCellJoinDelta !== 0
    || detail.registrationDelta !== 0 || detail.mouseDenominatorDelta !== 0
    || manifest.exactReferences.fullProjectCopyCount !== 0
    || manifest.exactReferences.historicalParent.inputByteReplayRequired !== false) {
    throw new Error("Immutable 2.86 parent, internal-detail de-duplication receipt, registries or no-admission boundary changed");
  }
  return {
    releaseId: manifest.releaseId,
    version: manifest.application.version,
    inputCount: manifest.integrity.inputCount,
    parentReleaseId: parent.releaseId,
    sourceCount: summary.canonicalSourceCount,
    sourceProfileCount: summary.sourceProfileCount,
    researchUpgradeCount: summary.researchUpgradeCount,
    exactExplorerRecordCount: detail.exactExplorerRecordCount,
    repeatedFourSlotRecordCountBefore: detail.repeatedFourSlotRecordCountBefore,
    repeatedFourSlotRecordCountAfter: detail.repeatedFourSlotRecordCountAfter,
    admittedGeometryDelta: detail.admittedGeometryDelta,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest286Snapshot()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
