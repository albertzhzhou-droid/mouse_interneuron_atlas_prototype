#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUDIT_PATH = path.join(ROOT, "data/open-mouse-spinal-fibsem-near-miss-audit-0.1.json");
const check = (condition, message) => { if (!condition) throw new Error(message); };

export async function validateOpenMouseSpinalFibsemNearMissAudit(override = null) {
  const audit = override ?? JSON.parse(await readFile(AUDIT_PATH, "utf8"));
  check(audit.schemaVersion === "0.1.0" && audit.auditId === "open-mouse-spinal-fibsem-near-miss-audit-0.1"
    && audit.researchUpgradeId === "UPG-249" && audit.auditDate === "2026-09-23", "UPG-249 spinal FIB-SEM near-miss identity changed");
  check(audit.candidateVolumes.length === 2, "UPG-249 must retain both matched dorsal corticospinal-tract FIB-SEM volumes");
  const wildType = audit.candidateVolumes.find((volume) => volume.datasetId === "jrc_mus-sc-zp104a");
  const mutant = audit.candidateVolumes.find((volume) => volume.datasetId === "jrc_mus-sc-zp105a");
  check(wildType && mutant && wildType.genotype === "wild type" && /Atl1 KI\/KI \/ Reep1 KO/.test(mutant.genotype), "Wild-type and disease-model dataset identities must stay distinct");
  for (const volume of [wildType, mutant]) {
    check(volume.sex === "female" && volume.ageMonths === 6 && volume.anatomicalRegion === "dorsal corticospinal tract"
      && volume.modality === "FIB-SEM" && JSON.stringify(volume.voxelSizeNanometres) === "[6,6,6]"
      && JSON.stringify(volume.dimensionsMicrometres) === "[40,30,75]" && volume.license === "CC-BY-4.0",
    `${volume.datasetId} exact specimen, resolution, dimensions or license receipt changed`);
    check(volume.interneuronObjectCrosswalk === false && /not an interneuron record|not a normal interneuron template/.test(volume.admissionNote),
      `${volume.datasetId} cannot be promoted to an interneuron identity or template`);
    check(volume.rawVolumeUrl.startsWith(`s3://janelia-cosem-datasets/${volume.datasetId}/`) && volume.publishedStructures.includes("corticospinal axons"),
      `${volume.datasetId} public raw-volume route or publication structure scope changed`);
  }
  check(/501 consecutive images/.test(audit.article.reportedManualReconstruction)
    && /machine-learning-based/.test(audit.article.reportedManualReconstruction), "Published reconstruction scope changed");
  const admission = audit.admission;
  check(admission.publicAdultMouseSpinalEmVolumes === 2 && admission.eligibleMouseSpinalInterneuronObjectRoutes === 0
    && admission.rawVolumesDownloaded === 0 && admission.segmentationPayloadsDownloaded === 0
    && admission.interneuronObjectsAdmitted === 0 && admission.organelleObjectsAdmitted === 0
    && admission.sameCellJoins === 0 && admission.atlasRegistrations === 0 && admission.measurements === 0,
  "UPG-249 near-miss route must remain metadata-only, with zero object, geometry or identity admission");
  check(/not a mouse interneuron volume or interneuron cell identity/.test(admission.interpretation)
    && /separately labeled corticospinal-axon comparators/.test(admission.interpretation), "Near-miss interpretation must preserve the source-local comparator boundary");
  check(audit.sources.length >= 5 && audit.sources.every((source) => /^https:\/\//.test(source.url)), "UPG-249 FIB-SEM source links are incomplete");
  return {
    auditId: audit.auditId,
    publicAdultMouseSpinalEmVolumes: admission.publicAdultMouseSpinalEmVolumes,
    eligibleMouseSpinalInterneuronObjectRoutes: admission.eligibleMouseSpinalInterneuronObjectRoutes,
    rawVolumesDownloaded: admission.rawVolumesDownloaded,
    admittedObjects: admission.interneuronObjectsAdmitted + admission.organelleObjectsAdmitted,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateOpenMouseSpinalFibsemNearMissAudit()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
