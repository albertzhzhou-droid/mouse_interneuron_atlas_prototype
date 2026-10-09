import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildBilPublishedWorkflowAudit, ROOT, CANDIDATE } from '../tools/build_bil_xenium_published_workflow_audit.mjs';
import { validateBilPublishedWorkflowFiles } from '../scripts/validate-bil-xenium-published-workflow-audit-0.1.mjs';
import { validateBilPublishedWorkflowAudit, buildBilPublishedWorkflowContext } from '../app/bil-xenium-published-workflow-audit.js';
import { buildBilXeniumCurrentRunReceipt } from '../app/bil-xenium-geometry-schema-audit.js';
const json = async p => JSON.parse(await readFile(`${ROOT}/${p}`));
const [audit, schema, metadata, coordinates] = await Promise.all(['bil-xenium-published-workflow-audit-0.1', 'bil-xenium-geometry-schema-audit-0.1', 'bil-xenium-source-metadata-0.1', 'bil-xenium-coordinate-source-audit-0.1'].map(p => json(`data/${p}.json`)));
test('complete pinned trees and every acquired Git blob reproduce the software-only audit offline', async () => {
  assert.deepEqual(await buildBilPublishedWorkflowAudit(), audit);
  assert.equal((await validateBilPublishedWorkflowFiles()).verifiedInputCount, 23);
  assert.deepEqual(audit.repositories.map(r => [r.blobs, r.acquired]), [[11, 10], [7, 7]]);
  assert.equal(audit.repositories[0].unacquiredFiles.length, 1);
  assert.equal(audit.availability.namedProcessedInputs.length, 3);
});
test('changed source code, incomplete tree, or forged fetch bytes cannot retain provenance', async () => {
  for (const target of [`${CANDIDATE}/registration/R/image_registration_public_release.R`, `${CANDIDATE}/registration-tree.json`, `${CANDIDATE}/source-fetch-receipt.json`]) {
    await assert.rejects(buildBilPublishedWorkflowAudit(async p => {
      const b = Buffer.from(await readFile(`${ROOT}/${p}`));
      if (p === target) b[b.length - 2] ^= 1;
      return b;
    }));
  }
});
test('missing actual source files cannot be replaced by copied receipts or README promises', async () => {
  const target = `${CANDIDATE}/registration/data/input`;
  await assert.rejects(buildBilPublishedWorkflowAudit(async p => {
    if (p === target) throw new Error('missing actual input placeholder');
    return readFile(`${ROOT}/${p}`);
  }), /missing actual input/);
  assert(audit.availability.missingRegistrationPaths.includes('R/run_example.R'));
  assert(audit.availability.placeholdersAreFilesNotDirectories.includes('data/ouputs'));
});
test('renaming, example anchors, algorithm groups, and MIT software cannot authorise biological mappings', () => {
  for (const change of [
    a => { a.identity.originalCellIdMapPresent = true; },
    a => { a.identity.exactRunSourceObjectKey = schema.sourceObjectKey; },
    a => { a.identity.biologicalSectionMapPresent = true; },
    a => { a.identity.curatedCellTypeMapPresent = true; },
    a => { a.coordinate.sourceRunAnchorPairsPresent = true; },
    a => { a.coordinate.exactOutlineToCellTransform = [1, 0, 0, 1]; },
    a => { a.coordinate.physicalCalibrationOfTargetImage = 0.2125; },
    a => { a.coordinate.defaultTypeColumn = 'Interneuron'; },
    a => { a.rights.bilPolicyDifferenceResolved = true; },
    a => { a.rights.softwareLicenceAppliesToBILFiles = true; },
    a => { a.admission.geometryViewerAdmission = true; },
    a => { a.admission.sectionLinkedCellNucleusGeometryCount = 1; },
    a => { a.availability.specimenDataAcquired = true; },
  ]) { const changed = structuredClone(audit); change(changed); assert.throws(() => validateBilPublishedWorkflowAudit(changed)); }
});
test('each selected run exports independent software context without acquiring another run’s coordinates', () => {
  for (const run of metadata.runs) {
    const receipt = buildBilXeniumCurrentRunReceipt(schema, metadata, run.sourceObjectKey, coordinates, audit);
    assert.equal(receipt.publishedWorkflowInspection.selectedSourceObjectKey, run.sourceObjectKey);
    assert.equal(receipt.publishedWorkflowInspection.exactRunEvidence, false);
    assert.equal(receipt.publishedWorkflowInspection.audit.identity.exactRunSourceObjectKey, null);
    assert.equal(receipt.sourceCoordinateAudit !== null, run.sourceObjectKey === schema.sourceObjectKey);
    assert.equal(receipt.pilotAdmission.admitted, false);
  }
  const receipt = buildBilPublishedWorkflowContext(audit, schema.sourceObjectKey);
  receipt.audit.admission.fullGoalComplete = true;
  assert.equal(audit.admission.fullGoalComplete, false);
  assert.equal(buildBilXeniumCurrentRunReceipt(schema, metadata, 'BIL:absent', coordinates, audit), null);
});
