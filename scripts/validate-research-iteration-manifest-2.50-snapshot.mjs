#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_249, validateResearchIterationManifest249Snapshot } from "./validate-research-iteration-manifest-2.49-snapshot.mjs";

export const SNAPSHOT_250 = Object.freeze({
  path: "data/research-iteration-manifest-2.50.json",
  bytes: 311938,
  fileSha256: "939e2bdf3a149bed00b8b8b5734b6b1dee53fbe60de6d18a68101c62ef19416f",
  contentSha256: "de8415c7ab5cb5a19c2dd8a63f1b5b5f4f12d7f69245cc332b2c2b3151474683",
  inputCount: 369,
});

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest250Snapshot(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_250.path));
  const manifest = override ?? JSON.parse(bytes);
  if (bytes.byteLength !== SNAPSHOT_250.bytes || sha256(bytes) !== SNAPSHOT_250.fileSha256) {
    throw new Error("Immutable 2.50 file receipt changed");
  }
  if (manifest.manifestContentSha256 !== SNAPSHOT_250.contentSha256
    || computeManifestContentSha256(manifest) !== SNAPSHOT_250.contentSha256) {
    throw new Error("Immutable 2.50 content receipt changed");
  }
  if (manifest.manifestSchemaVersion !== "2.50.0"
    || manifest.releaseId !== "ohri-mouse-interneuron-research-iteration-2.50.0"
    || manifest.application.version !== "2.50.0-research.1"
    || manifest.integrity.inputCount !== SNAPSHOT_250.inputCount
    || manifest.authoritativeInputs.length !== SNAPSHOT_250.inputCount) {
    throw new Error("Immutable 2.50 identity or input count changed");
  }

  const parent = await validateResearchIterationManifest249Snapshot();
  const parentBytes = await readFile(path.join(ROOT, manifest.parentIterationManifest.path));
  if (manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.path !== SNAPSHOT_249.path
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_249.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_249.fileSha256
    || sha256(parentBytes) !== SNAPSHOT_249.fileSha256) {
    throw new Error("Immutable 2.50 parent receipt changed");
  }

  const audit = manifest.exactReferences.adultMouseSpinalMerfishVersionAudit250;
  if (audit.earlierRecordId !== "18039571" || audit.laterRecordId !== "20533289"
    || audit.laterDisplayedVersion !== "v2" || audit.candidateLineageStatus !== "unverified"
    || audit.earlierRecordSectionCount !== 18 || audit.laterAuditSectionIdCount !== 108
    || audit.sectionDenominatorsReconciled !== false || audit.sourceH5adsDownloaded !== false
    || audit.dataDeltaCompared !== false || audit.fileRightsCleared !== false || audit.payloadsBundled !== 0
    || audit.crossVersionJoins !== 0 || audit.interneuronDenominatorAsserted !== false
    || audit.zRegistration !== 0 || audit.cellMorphology !== 0 || audit.membranes !== 0
    || audit.internalObjects !== 0 || audit.atlasRegistrations !== 0 || audit.researchUpgradeLastId !== "UPG-222") {
    throw new Error("Immutable 2.50 MERFISH version lineage, denominator or no-geometry boundary changed");
  }
  return { releaseId: manifest.releaseId, inputCount: SNAPSHOT_250.inputCount, parentReleaseId: parent.releaseId, manifest };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest250Snapshot()
    .then(({ releaseId, inputCount, parentReleaseId }) => console.log(JSON.stringify({ releaseId, inputCount, parentReleaseId })))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
