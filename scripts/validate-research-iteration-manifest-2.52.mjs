#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { buildResearchIterationManifest252, MANIFEST_252_PATH } from "../tools/build_research_iteration_manifest_2_52.mjs";

export async function validateResearchIterationManifest252(override = null) {
  const built = await buildResearchIterationManifest252();
  const bytes = await readFile(MANIFEST_252_PATH);
  const manifest = override ?? JSON.parse(bytes);
  if (override === null && !bytes.equals(built.bytes)) throw new Error("2.52 on-disk manifest differs from verified rebuild");
  if (computeManifestContentSha256(manifest) !== manifest.manifestContentSha256) throw new Error("2.52 content hash invalid");
  if (JSON.stringify(manifest) !== JSON.stringify(built.manifest)) throw new Error("2.52 evidence or input receipts differ from verified rebuild");

  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== manifest.integrity.inputCount || paths.size !== ids.size) throw new Error("Duplicate 2.52 input receipt");
  if (manifest.parentIterationManifest.releaseId !== "ohri-mouse-interneuron-research-iteration-2.51.0"
    || manifest.parentIterationManifest.fileSha256 !== "6106cd1cd432f20848dd7b426ee2abd43ee483fe575c291661cf872a4ee84cfe") {
    throw new Error("2.52 parent must remain the sealed 2.51 release");
  }

  const palm = manifest.exactReferences.superClemPalmNativePointReference252;
  if (palm.figshareFileId !== 32526932 || palm.sourceSha256 !== "57999c43c3ce6d0406e3db35546ad6f3d8e153cefe04997ecb992b28df356272"
    || palm.plotPayloadSha256 !== "1fddc85f4cd6813be8b7f674d19d49dfcb9df81a0ff7401c9a76073dae1df9c8"
    || palm.acquisitionId !== "181130_EosRmov009" || palm.animalId !== "AQ848" || palm.region !== "dorsal spinal cord"
    || palm.physicalUnitsEstablished !== false || palm.coordinateOriginEstablished !== false
    || palm.axisOrientationEstablished !== false || palm.driftCorrectionEstablished !== false
    || palm.detectionCount !== 18358 || palm.sourceShapeRowsByColumns[0] !== 5 || palm.sourceShapeRowsByColumns[1] !== 18358
    || JSON.stringify(palm.plotColumns) !== JSON.stringify(["frame", "x", "y"])
    || palm.countTableClusterRows !== 2 || palm.countTableExhaustivelyPartitionsDetections !== false
    || palm.uniqueMoleculeCountKnown !== false || palm.bp057EmOverlayCount !== 0
    || palm.selectedCellJoinCount !== 0 || palm.cellInterneuronIdentityJoinCount !== 0
    || palm.physicalRegistrationCount !== 0 || palm.threeDimensionalObjectCount !== 0
    || palm.researchUpgradeLastId !== "UPG-224") {
    throw new Error("2.52 Super-CLEM PALM scientific boundary changed");
  }
  if (manifest.registrySummary.researchUpgradeCount !== 206
    || manifest.registrySummary.canonicalSourcePackageCount !== 27
    || manifest.registrySummary.canonicalRecordSetCount !== 36) {
    throw new Error("2.52 research registry denominators drifted");
  }
  return { releaseId: manifest.releaseId, inputCount: ids.size, parentReleaseId: manifest.parentIterationManifest.releaseId, detectionCount: palm.detectionCount, physicalUnitsEstablished: palm.physicalUnitsEstablished, threeDimensionalObjectCount: palm.threeDimensionalObjectCount, researchUpgradeLastId: palm.researchUpgradeLastId };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest252()
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
