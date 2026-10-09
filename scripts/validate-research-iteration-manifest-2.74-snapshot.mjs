#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { SNAPSHOT_273, validateResearchIterationManifest273Snapshot } from "./validate-research-iteration-manifest-2.73-snapshot.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const SNAPSHOT_274 = Object.freeze({
  path: "data/research-iteration-manifest-2.74.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.74.0",
  version: "2.74.0-research.1",
  bytes: 7905,
  fileSha256: "3ad0540a47a65dae2381db57ff4741d3b0fe6f38f8f7f77a1be3dda7fb617e09",
  contentSha256: "bab1a470a2c2fc1fcf968f61b938241424d386ca2132b79f92f2e1f30e7d1d51",
  inputCount: 26,
});

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function contentHash(manifest) {
  const content = { ...manifest };
  delete content.manifestContentSha256;
  return sha256(Buffer.from(JSON.stringify(content)));
}

export async function validateResearchIterationManifest274Snapshot(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_274.path));
  if (bytes.byteLength !== SNAPSHOT_274.bytes || sha256(bytes) !== SNAPSHOT_274.fileSha256) {
    throw new Error("Immutable 2.74 manifest file receipt changed");
  }
  const diskManifest = JSON.parse(bytes.toString("utf8"));
  const manifest = override ?? diskManifest;
  if (JSON.stringify(manifest) !== JSON.stringify(diskManifest)) throw new Error("Immutable 2.74 manifest override differs from sealed file");
  const parent = await validateResearchIterationManifest273Snapshot();
  const counts = manifest.registrySummary;
  const route = manifest.exactReferences.bancV888IN14A018MorphologyRoute;
  const layout = manifest.exactReferences.layout;
  const inputs = manifest.authoritativeInputs;
  const paths = inputs.map((input) => input.path);
  if (contentHash(manifest) !== SNAPSHOT_274.contentSha256
    || manifest.manifestSchemaVersion !== "2.74.0"
    || manifest.releaseId !== SNAPSHOT_274.releaseId
    || manifest.application.version !== SNAPSHOT_274.version
    || manifest.integrity.inputCount !== SNAPSHOT_274.inputCount
    || manifest.integrity.inputPathsUnique !== true
    || inputs.length !== SNAPSHOT_274.inputCount
    || new Set(paths).size !== inputs.length
    || inputs.some((input) => typeof input.path !== "string" || path.isAbsolute(input.path) || input.path.split("/").includes("..")
      || !Number.isInteger(input.bytes) || input.bytes < 1 || !/^[a-f0-9]{64}$/.test(input.sha256))) {
    throw new Error("Immutable 2.74 content, identity, or input receipt changed");
  }
  if (manifest.parentIterationManifest.path !== SNAPSHOT_273.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_273.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_273.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_273.contentSha256) throw new Error("2.74 parent must remain the immutable 2.73 manifest");
  if (counts.canonicalSourceCount !== 30 || counts.canonicalRecordSetCount !== 39
    || counts.bundledExactCellProfileRosterCount !== 13 || counts.bundledExactSourceObjectSetCount !== 4
    || counts.sourceProfileCount !== 387 || counts.researchUpgradeCount !== 231
    || counts.completedResearchUpgradeCount !== 69 || counts.displayedResearchUpgradeCount !== 39
    || counts.staleCanonicalDenominatorLiteralCount !== 0) throw new Error("Immutable 2.74 registry denominators changed");
  if (route.rootId !== "720575941350424112" || route.nucleusId !== "73044750394982464"
    || route.nodeCount !== 7451 || route.segmentCount !== 7450 || route.renderedSurfaces !== 0
    || route.renderedMitochondria !== 0 || route.mouseJoins !== 0 || route.atlasRegistrations !== 0
    || manifest.exactReferences.mouseCensusExpansionCount !== 0
    || manifest.exactReferences.projectAtlasRegistrations !== 0
    || manifest.exactReferences.sourceReportedMitochondriaCountIsGeometry !== false) throw new Error("Immutable 2.74 geometry or mouse-identity boundary changed");
  if (layout.fullProjectCopyCount !== 0 || layout.rollbackParent !== SNAPSHOT_273.path
    || layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_74.md") throw new Error("Immutable 2.74 rollback or no-copy receipt changed");

  return {
    releaseId: manifest.releaseId,
    version: manifest.application.version,
    inputCount: inputs.length,
    parentReleaseId: parent.releaseId,
    sourceCount: counts.canonicalSourceCount,
    recordSetCount: counts.canonicalRecordSetCount,
    exactRosterCount: counts.bundledExactCellProfileRosterCount,
    sourceObjectSetCount: counts.bundledExactSourceObjectSetCount,
    routeNodeCount: route.nodeCount,
    internalSurfaceCount: route.renderedSurfaces,
    mouseJoinCount: route.mouseJoins,
    fullProjectCopyCount: layout.fullProjectCopyCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest274Snapshot()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
