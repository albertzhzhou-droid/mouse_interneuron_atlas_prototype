#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { buildResearchIterationManifest250, MANIFEST_250_PATH } from "../tools/build_research_iteration_manifest_2_50.mjs";

export async function validateResearchIterationManifest250(override = null) {
  const built = await buildResearchIterationManifest250();
  const bytes = await readFile(MANIFEST_250_PATH);
  const manifest = override ?? JSON.parse(bytes);
  if (override === null && !bytes.equals(built.bytes)) throw new Error("2.50 on-disk manifest differs from verified rebuild");
  if (computeManifestContentSha256(manifest) !== manifest.manifestContentSha256) throw new Error("2.50 content hash invalid");
  if (JSON.stringify(manifest) !== JSON.stringify(built.manifest)) throw new Error("2.50 evidence or input receipts differ from verified rebuild");
  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== manifest.integrity.inputCount || paths.size !== ids.size) throw new Error("Duplicate 2.50 input receipt");
  if (manifest.parentIterationManifest.releaseId !== "ohri-mouse-interneuron-research-iteration-2.49.0"
    || manifest.parentIterationManifest.fileSha256 !== "3f68627b06c1bcdb31999da4ef7253fbfe075a509600ac545d7815cf51e28374") {
    throw new Error("2.50 parent must remain the sealed 2.49 release");
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
    throw new Error("2.50 MERFISH version lineage, denominator or no-geometry boundary changed");
  }
  return {
    releaseId: manifest.releaseId,
    inputCount: ids.size,
    parentReleaseId: manifest.parentIterationManifest.releaseId,
    earlierRecordId: audit.earlierRecordId,
    laterRecordId: audit.laterRecordId,
    versionLineageConfirmed: audit.candidateLineageStatus === "verified",
    bundledPayloads: audit.payloadsBundled,
    geometryCount: audit.cellMorphology + audit.membranes + audit.internalObjects,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest250()
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
