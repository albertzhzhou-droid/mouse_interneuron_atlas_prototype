#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_PATH = path.join(ROOT, "data/spinal-inhibitory-interneuron-volume-em-reference-0.1.json");

export async function validateSpinalInhibitoryInterneuronVolumeEmReference() {
  const reference = JSON.parse(await readFile(DATA_PATH, "utf8"));
  const [atlasTypes, panel, scene] = await Promise.all([
    readFile(path.join(ROOT, "app/atlas-types.ts"), "utf8"),
    readFile(path.join(ROOT, "app/InternalStructureReferencePanel.tsx"), "utf8"),
    readFile(path.join(ROOT, "app/SceneCanvas.tsx"), "utf8"),
  ]);

  assert.equal(reference.schemaVersion, "0.1.0");
  assert.equal(reference.contractId, "spinal-inhibitory-interneuron-volume-em-reference-0.1.0");
  assert.equal(reference.authority, "PUBLICATION_RENDERED_RECONSTRUCTION_REFERENCE");
  assert.equal(reference.source.doi, "10.1038/s41593-019-0358-7");
  assert.equal(reference.source.pmcid, "PMC6555422");
  assert.deepEqual(reference.acquisition.reportedVolumeMicrometre, [35, 24, 2]);
  assert.equal(reference.biologicalScope.subtypeResolution, "broad inhibitory population; no molecular interneuron subtype assigned to the reconstructed profiles");
  assert.equal(reference.biologicalScope.stableCellIds, false);
  assert.equal(reference.biologicalScope.sameSpecimenJoinCount, 0);
  assert.equal(reference.biologicalScope.sameCellJoinCount, 0);
  assert.equal(reference.biologicalScope.registrationCount, 0);
  assert.equal(reference.publishedReconstruction.profileCountIsCellCount, false);
  assert.equal(reference.publishedReconstruction.admittedProjectGeometryCount, 0);
  assert.equal(reference.publishedReconstruction.measurementUse, "forbidden");
  assert.equal(reference.publishedReconstruction.rawSerialImageStackExposedInThisApp, false);
  assert.equal(reference.publishedReconstruction.editableAreaListsExposedInThisApp, false);
  assert.equal(reference.publishedReconstruction.meshOrSegmentationExposedInThisApp, false);
  assert.equal(reference.availabilityBoundary.fileLevelReuseLicenceVerified, false);
  assert.equal(reference.source.reuseStatus, "link_only_no_media_rehosted_or_embedded");
  assert.equal(reference.hardBoundaries.length >= 5, true);
  assert.equal(atlasTypes.includes("spinal-inhibitory-interneuron-volume-em-reference-0.1.json"), true);
  assert.match(atlasTypes, /export const spinalInhibitoryInterneuronVolumeEmReference\s*=/);

  const cardStart = panel.indexOf('className="spinal-volume-em-reference-card"');
  const cardEnd = panel.indexOf("</details>", cardStart);
  assert.ok(cardStart >= 0 && cardEnd > cardStart, "published volume reference card must be rendered");
  const card = panel.slice(cardStart, cardEnd);
  assert.match(card, /<summary>/);
  assert.match(card, /UPG-216/);
  assert.match(card, /reportedVolumeMicrometre/);
  assert.match(card, /reconstructedStructures\.map/);
  assert.match(card, /source\.articleUrl/);
  assert.match(card, /source\.figureUrl/);
  assert.match(card, /source\.fullTextAndSupplementUrl/);
  assert.match(card, /target="_blank"/);
  assert.doesNotMatch(card, /<(?:video|iframe|img)\b/i, "source media must not be embedded or copied into the app");
  assert.doesNotMatch(scene, /spinalInhibitoryInterneuronVolumeEmReference|spinal-inhibitory-interneuron-volume-em-reference/, "independent publication geometry must not enter the selected-cell scene");

  return {
    contractId: reference.contractId,
    doi: reference.source.doi,
    reportedVolumeMicrometre: reference.acquisition.reportedVolumeMicrometre,
    reconstructedStructureCount: reference.publishedReconstruction.reconstructedStructures.length,
    admittedProjectGeometryCount: reference.publishedReconstruction.admittedProjectGeometryCount,
    registrationCount: reference.biologicalScope.registrationCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateSpinalInhibitoryInterneuronVolumeEmReference()
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
