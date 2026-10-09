#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_274, validateResearchIterationManifest274Snapshot } from "./validate-research-iteration-manifest-2.74-snapshot.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const SNAPSHOT_275 = Object.freeze({
  path: "data/research-iteration-manifest-2.75.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.75.0",
  version: "2.75.0-research.1",
  bytes: 8541,
  fileSha256: "49cb3488c5ba9a7fc4dc05550b32d8520ed0ede930669206e0058ee4e779d472",
  contentSha256: "970fb3874c55da9838934634e3683340da67aff86850c1e066d414afa3a4c33f",
  inputCount: 26,
});

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest275Snapshot(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_275.path));
  if (bytes.byteLength !== SNAPSHOT_275.bytes || sha256(bytes) !== SNAPSHOT_275.fileSha256) throw new Error("Immutable 2.75 manifest file receipt changed");
  const diskManifest = JSON.parse(bytes.toString("utf8"));
  const manifest = override ?? diskManifest;
  if (JSON.stringify(manifest) !== JSON.stringify(diskManifest)) throw new Error("Immutable 2.75 manifest override differs from sealed file");
  const parent = await validateResearchIterationManifest274Snapshot();
  const inputs = manifest.authoritativeInputs;
  const paths = inputs.map((input) => input.path);
  const counts = manifest.registrySummary;
  const route = manifest.exactReferences.bancV888IN14A018MorphologyRoute;
  const audit = manifest.exactReferences.bancV888InternalObjectAvailability;
  const layout = manifest.exactReferences.layout;
  if (computeManifestContentSha256(manifest) !== SNAPSHOT_275.contentSha256
    || manifest.manifestSchemaVersion !== "2.75.0"
    || manifest.releaseId !== SNAPSHOT_275.releaseId
    || manifest.application.version !== SNAPSHOT_275.version
    || manifest.integrity.inputCount !== SNAPSHOT_275.inputCount
    || manifest.integrity.inputPathsUnique !== true
    || inputs.length !== SNAPSHOT_275.inputCount
    || new Set(paths).size !== inputs.length
    || inputs.some((input) => typeof input.path !== "string" || path.isAbsolute(input.path) || input.path.split("/").includes("..")
      || !Number.isInteger(input.bytes) || input.bytes < 1 || !/^[a-f0-9]{64}$/.test(input.sha256))) throw new Error("Immutable 2.75 content, identity, or input receipts changed");
  if (manifest.parentIterationManifest.path !== SNAPSHOT_274.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_274.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_274.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_274.contentSha256) throw new Error("2.75 parent must remain the immutable 2.74 manifest");
  if (counts.canonicalSourceCount !== 30 || counts.canonicalRecordSetCount !== 39
    || counts.bundledExactCellProfileRosterCount !== 13 || counts.bundledExactSourceObjectSetCount !== 4
    || counts.sourceProfileCount !== 387 || counts.researchUpgradeCount !== 231
    || counts.completedResearchUpgradeCount !== 69 || counts.displayedResearchUpgradeCount !== 40
    || counts.staleCanonicalDenominatorLiteralCount !== 0) throw new Error("Immutable 2.75 registry denominators changed");
  if (route.rootId !== "720575941350424112" || route.nucleusId !== "73044750394982464"
    || route.nodeCount !== 7451 || route.segmentCount !== 7450 || route.renderedSurfaces !== 0
    || route.renderedMitochondria !== 0 || route.mouseJoins !== 0 || route.atlasRegistrations !== 0
    || audit.rootId !== route.rootId || audit.nucleusId !== route.nucleusId
    || audit.publicNucleusMeshRouteDocumented !== true || audit.nucleusMeshAdmitted !== false
    || audit.publicMitochondriaArchiveBytes !== 1107598431 || audit.candidateMitochondriaRowsRetrieved !== false
    || audit.synapseVersionsListed.join(",") !== "v2,v3" || audit.synapseObjectsAdmitted !== 0
    || audit.privateCredentialsInspected !== false || audit.newGeometryCount !== 0
    || manifest.exactReferences.mouseCensusExpansionCount !== 0 || manifest.exactReferences.mouseIdentityJoins !== 0
    || manifest.exactReferences.renderedBancNucleusSurfaces !== 0
    || manifest.exactReferences.renderedBancMitochondria !== 0
    || manifest.exactReferences.renderedBancSynapseObjects !== 0) throw new Error("Immutable 2.75 source-object admission boundary changed");
  if (layout.fullProjectCopyCount !== 0 || layout.rollbackParent !== SNAPSHOT_274.path
    || layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_75.md") throw new Error("Immutable 2.75 rollback or no-copy receipt changed");
  return {
    releaseId: manifest.releaseId,
    version: manifest.application.version,
    inputCount: inputs.length,
    parentReleaseId: parent.releaseId,
    sourceCount: counts.canonicalSourceCount,
    recordSetCount: counts.canonicalRecordSetCount,
    upgradeCount: counts.researchUpgradeCount,
    routeNodeCount: route.nodeCount,
    nucleusRouteDocumented: audit.publicNucleusMeshRouteDocumented,
    newGeometryCount: audit.newGeometryCount,
    fullProjectCopyCount: layout.fullProjectCopyCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest275Snapshot()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
