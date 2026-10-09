#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_252, validateResearchIterationManifest252Snapshot } from "./validate-research-iteration-manifest-2.52-snapshot.mjs";
import { buildResearchIterationManifest253, MANIFEST_253_PATH } from "../tools/build_research_iteration_manifest_2_53.mjs";

export async function validateResearchIterationManifest253(override = null) {
  const built = await buildResearchIterationManifest253();
  const bytes = await readFile(MANIFEST_253_PATH);
  const manifest = override ?? JSON.parse(bytes);
  if (override === null && !bytes.equals(built.bytes)) throw new Error("2.53 on-disk manifest differs from verified rebuild");
  if (computeManifestContentSha256(manifest) !== manifest.manifestContentSha256) throw new Error("2.53 content hash invalid");
  if (JSON.stringify(manifest) !== JSON.stringify(built.manifest)) throw new Error("2.53 evidence or input receipts differ from verified rebuild");

  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== manifest.integrity.inputCount || paths.size !== ids.size) throw new Error("Duplicate 2.53 input receipt");

  const parent = await validateResearchIterationManifest252Snapshot();
  if (manifest.parentIterationManifest.path !== SNAPSHOT_252.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_252.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_252.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_252.contentSha256) {
    throw new Error("2.53 parent must remain the sealed 2.52 release");
  }

  const audit = manifest.exactReferences.micronsMitochondriaSpatialCompatibility253;
  if (audit.auditId !== "microns-mitochondria-spatial-compatibility-0.1.0"
    || audit.targetRootId !== "648518346349516051"
    || audit.targetSegmentationRelease !== "v185.4"
    || audit.targetAssetManifestSha256 !== "063e66321ecfcb8633dd39be0e08d467318ea276eeae0e6fef8344b313c5f2f1"
    || audit.sourceInfoSha256 !== "e458ae905bab05a30957454eead792279a4611eb307c6c2c79e396f3a5549364"
    || JSON.stringify(audit.axisOverlapUnderIdentityMapping) !== JSON.stringify([false, false, true])
    || audit.spatialOverlapUnderIdentityMapping !== false
    || audit.crossLayerCoordinateMappingVerified !== false
    || audit.targetRootMembershipVerified !== false
    || audit.mitochondriaObjectCount !== 0
    || audit.registrationCount !== 0
    || audit.biologicalAbsenceClaim !== false
    || audit.researchUpgradeLastId !== "UPG-225") {
    throw new Error("2.53 MICrONS spatial-compatibility boundary changed");
  }
  if (manifest.registrySummary.researchUpgradeCount !== 207
    || manifest.registrySummary.canonicalSourcePackageCount !== 27
    || manifest.registrySummary.canonicalRecordSetCount !== 36) {
    throw new Error("2.53 research registry denominators drifted");
  }
  return { releaseId: manifest.releaseId, inputCount: ids.size, parentReleaseId: parent.releaseId, researchUpgradeLastId: audit.researchUpgradeLastId, spatialOverlapUnderIdentityMapping: audit.spatialOverlapUnderIdentityMapping, mitochondriaObjectCount: audit.mitochondriaObjectCount };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest253()
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
