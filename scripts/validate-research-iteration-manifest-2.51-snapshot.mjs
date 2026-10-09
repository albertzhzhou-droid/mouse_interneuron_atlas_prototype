#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_250, validateResearchIterationManifest250Snapshot } from "./validate-research-iteration-manifest-2.50-snapshot.mjs";

export const SNAPSHOT_251 = Object.freeze({
  path: "data/research-iteration-manifest-2.51.json",
  bytes: 317976,
  fileSha256: "6106cd1cd432f20848dd7b426ee2abd43ee483fe575c291661cf872a4ee84cfe",
  contentSha256: "cf131c3616b53cf0f34afafb84b59547eb520b5f67a3b2a09494da2be98c30f6",
  inputCount: 378,
});

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest251Snapshot(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_251.path));
  const manifest = override ?? JSON.parse(bytes);
  if (bytes.byteLength !== SNAPSHOT_251.bytes || sha256(bytes) !== SNAPSHOT_251.fileSha256) {
    throw new Error("Immutable 2.51 file receipt changed");
  }
  if (manifest.manifestContentSha256 !== SNAPSHOT_251.contentSha256
    || computeManifestContentSha256(manifest) !== SNAPSHOT_251.contentSha256) {
    throw new Error("Immutable 2.51 content receipt changed");
  }
  if (manifest.manifestSchemaVersion !== "2.51.0"
    || manifest.releaseId !== "ohri-mouse-interneuron-research-iteration-2.51.0"
    || manifest.application.version !== "2.51.0-research.1"
    || manifest.integrity.inputCount !== SNAPSHOT_251.inputCount
    || manifest.authoritativeInputs.length !== SNAPSHOT_251.inputCount) {
    throw new Error("Immutable 2.51 identity or input count changed");
  }

  const parent = await validateResearchIterationManifest250Snapshot();
  const parentBytes = await readFile(path.join(ROOT, manifest.parentIterationManifest.path));
  if (manifest.parentIterationManifest.path !== SNAPSHOT_250.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_250.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_250.fileSha256
    || sha256(parentBytes) !== SNAPSHOT_250.fileSha256) {
    throw new Error("Immutable 2.51 parent receipt changed");
  }

  const audit = manifest.exactReferences.micronsSubcellularSourceAudit251;
  if (audit.auditId !== "microns-phase1-subcellular-source-audit-0.1.0"
    || audit.targetRootId !== "648518346349516051"
    || audit.targetCellRelease !== "v185.4"
    || audit.synapseTableRecordId !== "7510511"
    || audit.synapseTableDepositVersion !== "185.3"
    || audit.fullTableDownloaded !== false || audit.retainedSourcePayloadBytes !== 0
    || audit.exactRootLineageAcrossProductsVerified !== false
    || audit.exactMitochondriaTargetRootMappingVerified !== false
    || audit.synapsePointCount !== 0 || audit.mitochondriaObjectCount !== 0
    || audit.sameCellCrossSourceJoinCount !== 0 || audit.mouseSpinalIdentityJoinCount !== 0
    || audit.registrationCount !== 0 || audit.functionalConnectivityClaims !== false) {
    throw new Error("Immutable 2.51 MICrONS source-only boundary changed");
  }
  if (manifest.registrySummary.researchUpgradeCount !== 205
    || manifest.registrySummary.canonicalSourcePackageCount !== 27
    || manifest.registrySummary.canonicalRecordSetCount !== 36) {
    throw new Error("Immutable 2.51 registry snapshot changed");
  }
  return { releaseId: manifest.releaseId, inputCount: SNAPSHOT_251.inputCount, parentReleaseId: parent.releaseId, manifest };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest251Snapshot()
    .then(({ releaseId, inputCount, parentReleaseId }) => console.log(JSON.stringify({ releaseId, inputCount, parentReleaseId })))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
