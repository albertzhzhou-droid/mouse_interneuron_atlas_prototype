#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_253, validateResearchIterationManifest253Snapshot } from "./validate-research-iteration-manifest-2.53-snapshot.mjs";

export const SNAPSHOT_254 = Object.freeze({
  path: "data/research-iteration-manifest-2.54.json",
  bytes: 339442,
  fileSha256: "529a0206700ff2ac93fe4838cb3c8cd7051ebcc6b0100da17aad787b94beed75",
  contentSha256: "7b7b7a7ed249c0227607b27355f0e836cb4cb51d7e202da4ebd3a8cd1243adb0",
  inputCount: 420,
});

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest254Snapshot(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_254.path));
  const manifest = override ?? JSON.parse(bytes);
  if (bytes.byteLength !== SNAPSHOT_254.bytes || sha256(bytes) !== SNAPSHOT_254.fileSha256) throw new Error("Immutable 2.54 file receipt changed");
  if (manifest.manifestContentSha256 !== SNAPSHOT_254.contentSha256 || computeManifestContentSha256(manifest) !== SNAPSHOT_254.contentSha256) throw new Error("Immutable 2.54 content receipt changed");
  if (manifest.manifestSchemaVersion !== "2.54.0"
    || manifest.releaseId !== "ohri-mouse-interneuron-research-iteration-2.54.0"
    || manifest.application.version !== "2.54.0-research.1"
    || manifest.integrity.inputCount !== SNAPSHOT_254.inputCount
    || manifest.authoritativeInputs.length !== SNAPSHOT_254.inputCount) throw new Error("Immutable 2.54 identity or input count changed");

  const parent = await validateResearchIterationManifest253Snapshot();
  const parentBytes = await readFile(path.join(ROOT, manifest.parentIterationManifest.path));
  if (manifest.parentIterationManifest.path !== SNAPSHOT_253.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_253.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_253.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_253.contentSha256
    || sha256(parentBytes) !== SNAPSHOT_253.fileSha256) throw new Error("Immutable 2.54 parent receipt changed");

  const route = manifest.exactReferences.censusChildMorphologyRoute254;
  if (route.researchUpgradeId !== "UPG-226"
    || route.neuronId !== 108978
    || route.censusRecordCount !== 142
    || route.activeMainSceneMorphologyCount !== 14
    || route.namedSpinalMorphologyRouteCount !== 11
    || route.nativeDat.lineLoopCount !== 12
    || route.nativeDat.vertexCount !== 2614
    || route.renderedInternalPrimitiveCount !== 0
    || route.crossSourceIdentityCount !== 0
    || route.projectRegistrationCount !== 0) throw new Error("Immutable 2.54 morphology or denominator boundary changed");
  if (manifest.registrySummary.researchUpgradeCount !== 208
    || manifest.registrySummary.canonicalSourcePackageCount !== 27
    || manifest.registrySummary.canonicalRecordSetCount !== 36
    || manifest.registrySummary.bundledExactRosterCount !== 11) throw new Error("Immutable 2.54 registry denominators changed");
  return { releaseId: manifest.releaseId, inputCount: SNAPSHOT_254.inputCount, parentReleaseId: parent.releaseId, researchUpgradeLastId: route.researchUpgradeId, manifest };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest254Snapshot()
    .then(({ releaseId, inputCount, parentReleaseId, researchUpgradeLastId }) => console.log(JSON.stringify({ releaseId, inputCount, parentReleaseId, researchUpgradeLastId })))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
