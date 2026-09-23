#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { buildResearchIterationManifest249, MANIFEST_249_PATH } from "../tools/build_research_iteration_manifest_2_49.mjs";

export async function validateResearchIterationManifest249(override = null) {
  const built = await buildResearchIterationManifest249();
  const bytes = await readFile(MANIFEST_249_PATH);
  const manifest = override ?? JSON.parse(bytes);
  if (override === null && !bytes.equals(built.bytes)) throw new Error("2.49 on-disk manifest differs from verified rebuild");
  if (computeManifestContentSha256(manifest) !== manifest.manifestContentSha256) throw new Error("2.49 content hash invalid");
  if (JSON.stringify(manifest) !== JSON.stringify(built.manifest)) throw new Error("2.49 evidence or input receipts differ from verified rebuild");
  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== manifest.integrity.inputCount || paths.size !== ids.size) throw new Error("Duplicate 2.49 input receipt");
  if (manifest.parentIterationManifest.releaseId !== "ohri-mouse-interneuron-research-iteration-2.48.0") throw new Error("2.49 parent must remain the sealed 2.48 release");
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
    throw new Error("2.49 candidate audit, denominator, or no-geometry boundary changed");
  }
  return {
    releaseId: manifest.releaseId,
    inputCount: ids.size,
    lastSealedParent: manifest.parentIterationManifest.releaseId,
    candidateRootId: audit.candidateRootId,
    metadataRows: audit.archivedMetadataRowCount,
    strictCandidateScreenRows: audit.strictCandidateScreenRows,
    swcNodeCount: audit.swcNodeCount,
    sameCellObjectChainComplete: audit.sameCellObjectChainComplete,
    renderedGeometryCount: audit.renderedGeometryCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest249()
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
