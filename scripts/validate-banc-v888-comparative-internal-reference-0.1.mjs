#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_PATH = path.join(ROOT, "data/banc-v888-comparative-internal-reference-0.1.json");

export async function validateBancV888ComparativeInternalReference() {
  const reference = JSON.parse(await readFile(DATA_PATH, "utf8"));
  const [atlasTypes, panel, scene, queue] = await Promise.all([
    readFile(path.join(ROOT, "app/atlas-types.ts"), "utf8"),
    readFile(path.join(ROOT, "app/InternalStructureReferencePanel.tsx"), "utf8"),
    readFile(path.join(ROOT, "app/SceneCanvas.tsx"), "utf8"),
    readFile(path.join(ROOT, "docs/RESEARCH_MODEL_UPGRADE_QUEUE.md"), "utf8"),
  ]);

  assert.equal(reference.schemaVersion, "0.1.0");
  assert.equal(reference.contractId, "banc-v888-comparative-internal-reference-0.1.0");
  assert.equal(reference.source.doi, "10.1038/s41586-026-10735-w");
  assert.equal(reference.source.dataverseDoi, "10.7910/DVN/7WTH1N");
  assert.equal(reference.source.bossDbDoi, "10.60533/boss-2025-941r");
  assert.equal(reference.source.portalUrl, "https://ng.banc.community/view");
  assert.equal(reference.source.objectLevelBossDbReuseVerified, false);
  assert.equal(reference.biologicalScope.species, "Drosophila melanogaster");
  assert.equal(reference.biologicalScope.specimenCount, 1);
  assert.equal(reference.snapshot.materializationId, "v888");
  assert.equal(reference.snapshot.paperReleaseDate, "2026-04-17");
  assert.equal(reference.snapshot.metadataDocumentationDate, "2026-04-16");
  assert.deepEqual(reference.snapshot.rawVoxelResolutionNanometres, [4, 4, 45]);
  assert.equal(reference.snapshot.metadataRowCount, 188162);
  assert.equal(reference.sourceProducts.perNeuronMetadata.candidateVncInterneuronRosterAudited, false);
  assert.equal(reference.sourceProducts.nuclei.sameCellObjectAssociationVerified, false);
  assert.equal(reference.sourceProducts.mitochondria.availability, "source_documentation_conflict");
  assert.match(reference.sourceProducts.mitochondria.separateDetectedMitochondriaEntry, /MISSING/);
  assert.equal(reference.sourceProducts.synapseTables.exactCandidateSynapseRowsAdmitted, 0);
  assert.equal(reference.projectAdmission.selectedVncInterneuronRootId, null);
  assert.equal(reference.projectAdmission.cellMeshesAdmitted, 0);
  assert.equal(reference.projectAdmission.nucleusObjectsAdmitted, 0);
  assert.equal(reference.projectAdmission.mitochondriaObjectsAdmitted, 0);
  assert.equal(reference.projectAdmission.synapseObjectsAdmitted, 0);
  assert.equal(reference.projectAdmission.sameCellJoinCount, 0);
  assert.equal(reference.projectAdmission.registrationCount, 0);
  assert.equal(reference.projectAdmission.renderedGeometryCount, 0);
  assert.equal(reference.hardBoundaries.length >= 6, true);
  assert.equal(atlasTypes.includes("banc-v888-comparative-internal-reference-0.1.json"), true);
  assert.match(atlasTypes, /export const bancV888ComparativeInternalReference\s*=/);

  const cardStart = panel.indexOf('className="spinal-volume-em-reference-card banc-comparative-reference-card"');
  const cardEnd = panel.indexOf("</details>", cardStart);
  assert.ok(cardStart >= 0 && cardEnd > cardStart, "BANC source availability card must be rendered in the structure panel");
  const card = panel.slice(cardStart, cardEnd);
  assert.match(card, /UPG-219/);
  assert.match(card, /objectReceipts\.mitochondria/);
  assert.match(card, /sourceProducts\.neuronMeshes/);
  assert.match(card, /Nucleus ID ↔ root ID/);
  assert.match(card, /only admitted candidate geometry; this availability card imports no additional geometry/);
  assert.match(panel, /<BancV888IN14A018MorphologyReference\s*\/>/);
  assert.match(card, /source\.portalUrl/);
  assert.match(card, /source\.dataLocationsUrl/);
  assert.doesNotMatch(scene, /bancV888ComparativeInternalReference|banc-v888-comparative-internal-reference/, "availability reference must not become selected-cell scene geometry");
  assert.match(queue, /UPG-219[^\n]*partially completed/);
  assert.match(queue, /UPG-221/);
  assert.match(queue, /UPG-232[^\n]*count metric of 31/);

  return {
    contractId: reference.contractId,
    materializationId: reference.snapshot.materializationId,
    metadataRowCount: reference.snapshot.metadataRowCount,
    sourceDocumentationConflict: reference.sourceProducts.mitochondria.availability,
    admittedProjectGeometryCount: reference.projectAdmission.renderedGeometryCount,
    sameCellJoinCount: reference.projectAdmission.sameCellJoinCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateBancV888ComparativeInternalReference()
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
