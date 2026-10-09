#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { buildResearchIterationManifest251, MANIFEST_251_PATH } from "../tools/build_research_iteration_manifest_2_51.mjs";

export async function validateResearchIterationManifest251(override = null) {
  const built = await buildResearchIterationManifest251();
  const bytes = await readFile(MANIFEST_251_PATH);
  const manifest = override ?? JSON.parse(bytes);
  if (override === null && !bytes.equals(built.bytes)) throw new Error("2.51 on-disk manifest differs from verified rebuild");
  if (computeManifestContentSha256(manifest) !== manifest.manifestContentSha256) throw new Error("2.51 content hash invalid");
  if (JSON.stringify(manifest) !== JSON.stringify(built.manifest)) throw new Error("2.51 evidence or input receipts differ from verified rebuild");

  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== manifest.integrity.inputCount || paths.size !== ids.size) throw new Error("Duplicate 2.51 input receipt");
  if (manifest.parentIterationManifest.releaseId !== "ohri-mouse-interneuron-research-iteration-2.50.0"
    || manifest.parentIterationManifest.fileSha256 !== "939e2bdf3a149bed00b8b8b5734b6b1dee53fbe60de6d18a68101c62ef19416f") {
    throw new Error("2.51 parent must remain the sealed 2.50 release");
  }

  const audit = manifest.exactReferences.micronsSubcellularSourceAudit251;
  if (audit.auditId !== "microns-phase1-subcellular-source-audit-0.1.0"
    || audit.targetRootId !== "648518346349516051"
    || audit.targetCellRelease !== "v185.4"
    || audit.synapseTableRecordId !== "7510511"
    || audit.synapseTableDepositVersion !== "185.3"
    || audit.synapseTableFileName !== "221206_pni_synapses_v185.csv"
    || audit.synapseTableFileBytes !== 388781071
    || audit.synapseTablePublishedMd5 !== "19073f4b5cbae60d7f92d73f204940ed"
    || audit.caveExactRootQueryAuthenticated !== false
    || audit.fullTableDownloaded !== false || audit.retainedSourcePayloadBytes !== 0
    || audit.exactRootLineageAcrossProductsVerified !== false
    || audit.exactMitochondriaTargetRootMappingVerified !== false
    || audit.synapsePointCount !== 0 || audit.mitochondriaObjectCount !== 0
    || audit.sameCellCrossSourceJoinCount !== 0 || audit.mouseSpinalIdentityJoinCount !== 0
    || audit.registrationCount !== 0 || audit.functionalConnectivityClaims !== false
    || audit.researchUpgradeLastId !== "UPG-223") {
    throw new Error("2.51 MICrONS subcellular evidence or zero-admission boundary changed");
  }
  if (manifest.registrySummary.researchUpgradeCount !== 205
    || manifest.registrySummary.canonicalSourcePackageCount !== 27
    || manifest.registrySummary.canonicalRecordSetCount !== 36) {
    throw new Error("2.51 research registry denominators drifted");
  }
  return {
    releaseId: manifest.releaseId,
    inputCount: ids.size,
    parentReleaseId: manifest.parentIterationManifest.releaseId,
    targetRootId: audit.targetRootId,
    synapsePointCount: audit.synapsePointCount,
    mitochondriaObjectCount: audit.mitochondriaObjectCount,
    fullTableDownloaded: audit.fullTableDownloaded,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest251()
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
