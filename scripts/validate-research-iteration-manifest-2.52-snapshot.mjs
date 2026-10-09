#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_251, validateResearchIterationManifest251Snapshot } from "./validate-research-iteration-manifest-2.51-snapshot.mjs";

export const SNAPSHOT_252 = Object.freeze({
  path: "data/research-iteration-manifest-2.52.json",
  bytes: 326208,
  fileSha256: "43da0f5088a99a6824d41b64f7d2d31eae95bf75cd8e9d81049b25e665350a19",
  contentSha256: "41d0c0dfcb0d6f441c60a7f172e704d7668af4a43c37fe72fea5ef0df352473e",
  inputCount: 393,
});

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest252Snapshot(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_252.path));
  const manifest = override ?? JSON.parse(bytes);
  if (bytes.byteLength !== SNAPSHOT_252.bytes || sha256(bytes) !== SNAPSHOT_252.fileSha256) {
    throw new Error("Immutable 2.52 file receipt changed");
  }
  if (manifest.manifestContentSha256 !== SNAPSHOT_252.contentSha256
    || computeManifestContentSha256(manifest) !== SNAPSHOT_252.contentSha256) {
    throw new Error("Immutable 2.52 content receipt changed");
  }
  if (manifest.manifestSchemaVersion !== "2.52.0"
    || manifest.releaseId !== "ohri-mouse-interneuron-research-iteration-2.52.0"
    || manifest.application.version !== "2.52.0-research.1"
    || manifest.integrity.inputCount !== SNAPSHOT_252.inputCount
    || manifest.authoritativeInputs.length !== SNAPSHOT_252.inputCount) {
    throw new Error("Immutable 2.52 identity or input count changed");
  }

  const parent = await validateResearchIterationManifest251Snapshot();
  const parentBytes = await readFile(path.join(ROOT, manifest.parentIterationManifest.path));
  if (manifest.parentIterationManifest.path !== SNAPSHOT_251.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_251.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_251.fileSha256
    || sha256(parentBytes) !== SNAPSHOT_251.fileSha256) {
    throw new Error("Immutable 2.52 parent receipt changed");
  }

  const palm = manifest.exactReferences.superClemPalmNativePointReference252;
  if (palm.figshareFileId !== 32526932
    || palm.sourceSha256 !== "57999c43c3ce6d0406e3db35546ad6f3d8e153cefe04997ecb992b28df356272"
    || palm.plotPayloadSha256 !== "1fddc85f4cd6813be8b7f674d19d49dfcb9df81a0ff7401c9a76073dae1df9c8"
    || palm.acquisitionId !== "181130_EosRmov009"
    || palm.animalId !== "AQ848"
    || palm.detectionCount !== 18358
    || palm.physicalUnitsEstablished !== false
    || palm.coordinateOriginEstablished !== false
    || palm.axisOrientationEstablished !== false
    || palm.driftCorrectionEstablished !== false
    || palm.uniqueMoleculeCountKnown !== false
    || palm.selectedCellJoinCount !== 0
    || palm.cellInterneuronIdentityJoinCount !== 0
    || palm.physicalRegistrationCount !== 0
    || palm.threeDimensionalObjectCount !== 0
    || palm.researchUpgradeLastId !== "UPG-224") {
    throw new Error("Immutable 2.52 PALM/source boundary changed");
  }
  if (manifest.registrySummary.researchUpgradeCount !== 206
    || manifest.registrySummary.canonicalSourcePackageCount !== 27
    || manifest.registrySummary.canonicalRecordSetCount !== 36) {
    throw new Error("Immutable 2.52 registry snapshot changed");
  }
  return { releaseId: manifest.releaseId, inputCount: SNAPSHOT_252.inputCount, parentReleaseId: parent.releaseId, manifest };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest252Snapshot()
    .then(({ releaseId, inputCount, parentReleaseId }) => console.log(JSON.stringify({ releaseId, inputCount, parentReleaseId })))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
