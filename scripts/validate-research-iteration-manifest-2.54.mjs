#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_253, validateResearchIterationManifest253Snapshot } from "./validate-research-iteration-manifest-2.53-snapshot.mjs";
import { INPUTS_254, MANIFEST_254_PATH, buildResearchIterationManifest254 } from "../tools/build_research_iteration_manifest_2_54.mjs";

export async function validateResearchIterationManifest254(override = null) {
  const built = await buildResearchIterationManifest254();
  const bytes = await readFile(MANIFEST_254_PATH);
  const manifest = override ?? JSON.parse(bytes);
  if (override === null && !bytes.equals(built.bytes)) throw new Error("2.54 on-disk manifest differs from verified rebuild");
  if (computeManifestContentSha256(manifest) !== manifest.manifestContentSha256) throw new Error("2.54 content hash invalid");
  if (JSON.stringify(manifest) !== JSON.stringify(built.manifest)) throw new Error("2.54 evidence or input receipts differ from verified rebuild");

  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== manifest.integrity.inputCount || paths.size !== ids.size) throw new Error("Duplicate 2.54 input receipt");
  for (const [id, inputPath] of INPUTS_254) {
    if (!manifest.authoritativeInputs.some((input) => input.id === id && input.scope === "project" && input.path === inputPath)) throw new Error(`2.54 exact input receipt missing: ${id}`);
  }

  const parent = await validateResearchIterationManifest253Snapshot();
  if (manifest.parentIterationManifest.path !== SNAPSHOT_253.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_253.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_253.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_253.contentSha256) throw new Error("2.54 parent must remain the sealed 2.53 release");

  const route = manifest.exactReferences.censusChildMorphologyRoute254;
  if (route.routeId !== "mouse.sc.tac1_sp_dorsal_horn.observed.nmo_108978"
    || route.neuronId !== 108978
    || route.assetId !== "NeuroMorpho:108978"
    || route.censusRecordCount !== 142
    || route.censusMembership !== true
    || route.censusContribution !== 0
    || route.censusExpansionCount !== 0
    || route.frozenLensMembership !== false
    || route.mainSceneMorphologyIncrement !== 1
    || route.activeMainSceneMorphologyCount !== 14
    || route.namedSpinalMorphologyRouteCount !== 11) throw new Error("2.54 NMO 108978 census and route denominators drifted");
  if (route.standardizedSwc.nodeCount !== 1817
    || route.standardizedSwc.segmentCount !== 1816
    || route.standardizedSwc.sourceDiameterAvailable !== true
    || route.nativeDat.lineLoopCount !== 12
    || route.nativeDat.vertexCount !== 2614
    || route.nativeDat.rawSourceClosedFlag !== false
    || route.nativeDat.interpretedClosureAuthority !== "file_specific_MBF_Cell_Body_semantics"
    || route.coordinateTransformToStandardizedSwcStatus !== "not_established"
    || route.overlayWithStandardizedSwcAllowed !== false) throw new Error("2.54 NMO 108978 exact morphology or frame boundary changed");
  if (route.numericAge.value !== null
    || route.numericAge.missingReason !== "official_repository_metadata_reports_Not Reported"
    || route.exactPaperSubtypeJoinEstablished !== false
    || route.biologicalAxonClaim !== false
    || route.renderedInternalPrimitiveCount !== 0
    || route.crossSourceIdentityCount !== 0
    || route.projectRegistrationCount !== 0
    || route.researchUpgradeId !== "UPG-226") throw new Error("2.54 NMO 108978 scientific boundary changed");

  const representation = manifest.exactReferences.evidenceAware3dRepresentation;
  if (representation.contractId !== "evidence-aware-3d-representation-contract-0.6"
    || representation.representationStateCount !== 10
    || representation.routeCount !== 17
    || representation.namedSpinalMorphologyRouteCount !== 11
    || representation.mainSceneMorphologyCount !== 14
    || representation.nativeSomaLineLoopStateId !== "OBS_SOURCE_NATIVE_SOMA_LINE_LOOP"
    || representation.renderedInternalPrimitiveCount !== 0
    || representation.crossSourceIdentityCount !== 0
    || representation.projectRegistrationCount !== 0) throw new Error("2.54 representation-state receipt changed");
  if (manifest.registrySummary.researchUpgradeCount !== 208
    || manifest.registrySummary.canonicalSourcePackageCount !== 27
    || manifest.registrySummary.canonicalRecordSetCount !== 36
    || manifest.registrySummary.bundledExactRosterCount !== 11) throw new Error("2.54 canonical registry denominators drifted");
  return {
    releaseId: manifest.releaseId,
    inputCount: ids.size,
    parentReleaseId: parent.releaseId,
    researchUpgradeLastId: route.researchUpgradeId,
    censusRecordCount: route.censusRecordCount,
    mainSceneMorphologyCount: route.activeMainSceneMorphologyCount,
    namedSpinalMorphologyRouteCount: route.namedSpinalMorphologyRouteCount,
    nativeSomaLineLoopCount: route.nativeDat.lineLoopCount,
    nativeSomaLineLoopVertexCount: route.nativeDat.vertexCount,
    internalPrimitiveCount: route.renderedInternalPrimitiveCount,
    crossSourceIdentityCount: route.crossSourceIdentityCount,
    projectRegistrationCount: route.projectRegistrationCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest254()
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
