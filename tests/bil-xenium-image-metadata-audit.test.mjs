import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateBilXeniumImageMetadataAudit } from '../app/bil-xenium-image-metadata-audit.js';
import { validateBilImageMetadataSourceFiles } from '../scripts/validate-bil-xenium-image-metadata-audit-0.1.mjs';
import { buildBilXeniumCurrentRunReceipt } from '../app/bil-xenium-geometry-schema-audit.js';
const json = async name => JSON.parse(await readFile(new URL(`../data/${name}`,import.meta.url)));
const [audit,coordinates,schema,metadata,workflow,polygons] = await Promise.all(['bil-xenium-image-metadata-audit-0.1.json','bil-xenium-coordinate-source-audit-0.1.json','bil-xenium-geometry-schema-audit-0.1.json','bil-xenium-source-metadata-0.1.json','bil-xenium-published-workflow-audit-0.1.json','bil-xenium-polygon-source-audit-0.1.json'].map(json));
const validate = a => validateBilXeniumImageMetadataAudit(a,coordinates,schema);
test('all exact original metadata intervals and prior coordinate/cell dependencies replay their sealed bytes',async () => {
  const result = await validateBilImageMetadataSourceFiles(audit,coordinates,schema);
  assert.equal(result.verifiedOriginalFileCount,130);assert.equal(result.metadataRangeBytes,1606);assert.equal(result.inBoundsCellCentroids,182698);assert.equal(result.geometryObjects,0);
});
test('a changed original OME range cannot retain its metadata authority',async () => {
  const target = audit.sourceInputs.find(r => r.path.endsWith('/range-25611492078-25611493267.bin')).path;
  await assert.rejects(validateBilImageMetadataSourceFiles(audit,coordinates,schema,async p => {
    const bytes = await readFile(new URL(`../${p}`,import.meta.url));
    if(p === target) {const changed = Buffer.from(bytes);changed[25] ^= 1;return changed;} return bytes;
  }),/original image-metadata input changed/);
});
test('selected exact run exports original image evidence; every other run and historical call clears it',() => {
  const receipt = buildBilXeniumCurrentRunReceipt(schema,metadata,audit.sourceObjectKey,coordinates,workflow,polygons,audit);
  assert.deepEqual(receipt.sourceImageMetadataAudit,audit);assert.equal(receipt.pilotAdmission.admitted,false);
  for(const run of metadata.runs.filter(r => r.sourceObjectKey !== audit.sourceObjectKey)) {
    const other = buildBilXeniumCurrentRunReceipt(schema,metadata,run.sourceObjectKey,coordinates,workflow,polygons,audit);
    assert.equal(other.sourceImageMetadataAudit,null);assert.equal(other.sourcePolygonAudit,null);
  }
  assert.equal(buildBilXeniumCurrentRunReceipt(schema,metadata,audit.sourceObjectKey,coordinates,workflow,polygons).sourceImageMetadataAudit,null);
});
test('source identity, dimensions, units, channel and stored matrix cannot be silently replaced',() => {
  for(const change of [
    a => {a.sourceObjectKey = 'BIL:ace-pie-bin';},
    a => {a.imageMetadata.ome.pixelsAttributes.SizeX = '54031';},
    a => {a.imageMetadata.ome.pixelsAttributes.PhysicalSizeXUnit = 'nm';},
    a => {a.imageMetadata.ome.channels[0].Name = 'membrane';},
    a => {a.calibration.storedSourcePhysicalToImageMatrix[0][0] = 1 / 0.2125;},
    a => {a.cellImageBounds.outsideImageCount = 1;}
  ]) {const copy = structuredClone(audit);change(copy);assert.throws(() => validate(copy),/image metadata audit/);}
});
test('image bounds and reproduced areas cannot clear frame, biological identity or unread pixel gates',() => {
  for(const change of [
    a => {a.cellImageBounds.maskOverlapOrPixelAlignmentVerified = true;},
    a => {a.outlineAreaConsistency.commonOriginOrOrientationVerified = true;},
    a => {a.outlineAreaConsistency.cellToSectionAssignments = 182698;},
    a => {a.calibration.sectionThicknessUm = 48;},
    a => {a.integrityScope.imagePixelsRead = true;},
    a => {a.imageMetadata.otherIfdsReplayed = true;},
    a => {a.integrityScope.wholeFileSha256 = 'a'.repeat(64);},
    a => {a.remainingGates = [];},
    a => {a.admission.geometryViewerAdmission = true;},
    a => {a.admission.fullGoalComplete = true;}
  ]) {const copy = structuredClone(audit);change(copy);assert.throws(() => validate(copy),/image metadata audit/);}
});
test('source-file receipts reject path escape, omission and impossible area or pixel counts',() => {
  for(const change of [
    a => {a.sourceInputs[0].path = 'data/../private/file';},
    a => {a.sourceInputs.pop();},
    a => {a.cellImageBounds.sourceMatrixImageBoundsPixels.max[1] = 112160;},
    a => {a.outlineAreaConsistency.outlines[0].computedMinusHeaderArea = 5;},
    a => {a.integrityScope.rangeTransferBytes = 25611493268;}
  ]) {const copy = structuredClone(audit);change(copy);assert.throws(() => validate(copy),/image metadata audit/);}
});
