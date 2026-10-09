#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_252, validateResearchIterationManifest252Snapshot } from "./validate-research-iteration-manifest-2.52-snapshot.mjs";

export const SNAPSHOT_253 = Object.freeze({
  path: "data/research-iteration-manifest-2.53.json",
  bytes: 331728,
  fileSha256: "29c3ace548627b6c782e0491bc635edcba31e2ded94142d3a453c0e017d5d258",
  contentSha256: "7da11ebd786e9a2d7bcc2dca6129b4d6fd4231bf49cba10cb99b1f604c0dd63b",
  inputCount: 402,
});

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest253Snapshot(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_253.path));
  const manifest = override ?? JSON.parse(bytes);
  if (bytes.byteLength !== SNAPSHOT_253.bytes || sha256(bytes) !== SNAPSHOT_253.fileSha256) throw new Error("Immutable 2.53 file receipt changed");
  if (manifest.manifestContentSha256 !== SNAPSHOT_253.contentSha256 || computeManifestContentSha256(manifest) !== SNAPSHOT_253.contentSha256) throw new Error("Immutable 2.53 content receipt changed");
  if (manifest.manifestSchemaVersion !== "2.53.0"
    || manifest.releaseId !== "ohri-mouse-interneuron-research-iteration-2.53.0"
    || manifest.application.version !== "2.53.0-research.1"
    || manifest.integrity.inputCount !== SNAPSHOT_253.inputCount
    || manifest.authoritativeInputs.length !== SNAPSHOT_253.inputCount) throw new Error("Immutable 2.53 identity or input count changed");

  const parent = await validateResearchIterationManifest252Snapshot();
  const parentBytes = await readFile(path.join(ROOT, manifest.parentIterationManifest.path));
  if (manifest.parentIterationManifest.path !== SNAPSHOT_252.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_252.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_252.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_252.contentSha256
    || sha256(parentBytes) !== SNAPSHOT_252.fileSha256) throw new Error("Immutable 2.53 parent receipt changed");

  const audit = manifest.exactReferences.micronsMitochondriaSpatialCompatibility253;
  if (audit.auditId !== "microns-mitochondria-spatial-compatibility-0.1.0"
    || audit.targetRootId !== "648518346349516051"
    || audit.targetSegmentationRelease !== "v185.4"
    || audit.sourceInfoSha256 !== "e458ae905bab05a30957454eead792279a4611eb307c6c2c79e396f3a5549364"
    || JSON.stringify(audit.axisOverlapUnderIdentityMapping) !== JSON.stringify([false, false, true])
    || audit.spatialOverlapUnderIdentityMapping !== false
    || audit.crossLayerCoordinateMappingVerified !== false
    || audit.targetRootMembershipVerified !== false
    || audit.mitochondriaObjectCount !== 0
    || audit.registrationCount !== 0
    || audit.biologicalAbsenceClaim !== false
    || audit.researchUpgradeLastId !== "UPG-225") throw new Error("Immutable 2.53 MICrONS source boundary changed");
  if (manifest.registrySummary.researchUpgradeCount !== 207
    || manifest.registrySummary.canonicalSourcePackageCount !== 27
    || manifest.registrySummary.canonicalRecordSetCount !== 36) throw new Error("Immutable 2.53 registry denominators changed");
  return { releaseId: manifest.releaseId, inputCount: SNAPSHOT_253.inputCount, parentReleaseId: parent.releaseId, researchUpgradeLastId: audit.researchUpgradeLastId, manifest };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest253Snapshot()
    .then(({ releaseId, inputCount, parentReleaseId, researchUpgradeLastId }) => console.log(JSON.stringify({ releaseId, inputCount, parentReleaseId, researchUpgradeLastId })))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
