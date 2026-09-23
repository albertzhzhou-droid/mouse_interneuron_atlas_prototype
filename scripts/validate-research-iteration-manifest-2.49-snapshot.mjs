#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_248, validateResearchIterationManifest248Snapshot } from "./validate-research-iteration-manifest-2.48-snapshot.mjs";

export const SNAPSHOT_249 = Object.freeze({
  path: "data/research-iteration-manifest-2.49.json",
  bytes: 306065,
  fileSha256: "3f68627b06c1bcdb31999da4ef7253fbfe075a509600ac545d7815cf51e28374",
  contentSha256: "00d9b0c28a5991ecbb40f91875c08c655e20073684daacfcb3b649e42c42639a",
  inputCount: 360,
});

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest249Snapshot(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_249.path));
  const manifest = override ?? JSON.parse(bytes);
  if (bytes.byteLength !== SNAPSHOT_249.bytes || sha256(bytes) !== SNAPSHOT_249.fileSha256) {
    throw new Error("Immutable 2.49 file receipt changed");
  }
  if (manifest.manifestContentSha256 !== SNAPSHOT_249.contentSha256
    || computeManifestContentSha256(manifest) !== SNAPSHOT_249.contentSha256) {
    throw new Error("Immutable 2.49 content receipt changed");
  }
  if (manifest.releaseId !== "ohri-mouse-interneuron-research-iteration-2.49.0"
    || manifest.application.version !== "2.49.0-research.1"
    || manifest.integrity.inputCount !== SNAPSHOT_249.inputCount
    || manifest.authoritativeInputs.length !== SNAPSHOT_249.inputCount) {
    throw new Error("Immutable 2.49 identity or input count changed");
  }

  const parent = await validateResearchIterationManifest248Snapshot();
  const parentBytes = await readFile(path.join(ROOT, manifest.parentIterationManifest.path));
  if (manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.path !== SNAPSHOT_248.path
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_248.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_248.fileSha256
    || sha256(parentBytes) !== SNAPSHOT_248.fileSha256) {
    throw new Error("Immutable 2.49 parent receipt changed");
  }

  const audit = manifest.exactReferences.bancV888CandidateAudit249;
  if (audit.dataverseVersion !== 3 || audit.dataverseMetadataFileId !== 14033740
    || audit.archivedMetadataRowCount !== 188508 || audit.documentedMetadataRowCount !== 188162
    || audit.archivedMetadataColumnCount !== 81 || audit.documentedMetadataColumnCount !== 79
    || audit.metadataRowsAreInterneuronDenominator !== false || audit.strictCandidateScreenRows !== 12571
    || audit.candidateRootId !== "720575941350424112" || audit.candidateCellType !== "IN14A018"
    || audit.rootIdStableAcrossMaterializations !== true || audit.nucleusExactRootJoinVerified !== true
    || audit.swcNodeCount !== 7451 || audit.nucleusPointWithinSwcBounds !== true
    || audit.meshVersionLinkedToDataverseV888 !== false || audit.candidateMitochondriaRowsFiltered !== false
    || audit.candidateSynapseRowsFiltered !== false || audit.sameCellObjectChainComplete !== false
    || audit.renderedGeometryCount !== 0 || audit.sameCellJoinCount !== 0
    || audit.registrationCount !== 0 || audit.researchUpgradeLastId !== "UPG-221") {
    throw new Error("Immutable 2.49 candidate audit or no-geometry boundary changed");
  }
  return {
    releaseId: manifest.releaseId,
    inputCount: SNAPSHOT_249.inputCount,
    parentReleaseId: parent.releaseId,
    candidateRootId: audit.candidateRootId,
    swcNodeCount: audit.swcNodeCount,
    renderedGeometryCount: audit.renderedGeometryCount,
    manifest,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest249Snapshot()
    .then(({ releaseId, inputCount, parentReleaseId, candidateRootId, swcNodeCount, renderedGeometryCount }) => console.log(JSON.stringify({ releaseId, inputCount, parentReleaseId, candidateRootId, swcNodeCount, renderedGeometryCount })))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
