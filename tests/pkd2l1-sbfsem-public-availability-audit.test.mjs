import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { validatePkd2l1SbfsemPublicAvailabilityAudit } from "../scripts/validate-pkd2l1-sbfsem-public-availability-audit-0.1.mjs";

const [audit, schema] = await Promise.all([
  readFile(new URL("../data/pkd2l1-sbfsem-public-availability-audit-0.1.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../schemas/pkd2l1-sbfsem-public-availability-audit-0.1.schema.json", import.meta.url), "utf8").then(JSON.parse),
]);
const panel = await readFile(new URL("../app/InternalStructureReferencePanel.tsx", import.meta.url), "utf8");

function mutate(callback) {
  const value = structuredClone(audit);
  callback(value);
  return value;
}

test("UPG-242 distinguishes released publication media from a source EM volume", () => {
  assert.equal(validatePkd2l1SbfsemPublicAvailabilityAudit(audit), audit);
  assert.deepEqual(audit.articleDataAvailability.formalStatementNumericalSourceDataFigures, [2, 7]);
  assert.deepEqual(audit.articleDataAvailability.articleApiSourceDataFigureNumbers, [2, 3, 7]);
  assert.equal(audit.articleDataAvailability.singleCellLightMicroscopyTracingPopulationCount, 71);
  assert.equal(audit.articleDataAvailability.countIsSbfsemCellCensus, false);
  assert.equal(audit.video5.renditions.find((rendition) => rendition.format === "mp4").bytes, 46_541_650);
  assert.equal(audit.acquisitionMetadata.completeStackArrayDimensions, null);
  assert.equal(audit.objectAndRightsReadiness.admittedInternalObjects, 0);
  assert.equal(audit.scope.notAUniversalAbsenceClaim, true);
});

test("UPG-242 public-availability audit satisfies its strict JSON Schema", () => {
  const ajv = new Ajv2020({ allErrors: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  assert.equal(validate(audit), true, JSON.stringify(validate.errors));
  const altered = structuredClone(audit);
  altered.objectAndRightsReadiness.admittedInternalObjects = 1;
  assert.equal(validate(altered), false);
});

test("UPG-242 rejects a fabricated stack, object join, measurement permission, or absence claim", () => {
  for (const mutateAudit of [
    (value) => { value.figure4.rawVoxelStackProvidedInReviewedScope = true; },
    (value) => { value.objectAndRightsReadiness.exactVideoToCellObjectIdentityAvailable = true; },
    (value) => { value.objectAndRightsReadiness.admittedInternalObjects = 1; },
    (value) => { value.objectAndRightsReadiness.measurementUse = "allowed"; },
    (value) => { value.scope.notAUniversalAbsenceClaim = false; },
  ]) assert.throws(() => validatePkd2l1SbfsemPublicAvailabilityAudit(mutate(mutateAudit)));
});

test("the UI exposes the bounded evidence and terms audit without admitting geometry", () => {
  assert.match(panel, /pkd2l1SbfsemPublicAvailabilityAudit\.articleDataAvailability\.formalStatementNumericalSourceDataFigures/);
  assert.match(panel, /pkd2l1SbfsemPublicAvailabilityAudit\.objectAndRightsReadiness\.articleRelatedMediaReuseTerms/);
  assert.match(panel, /pkd2l1SbfsemPublicAvailabilityAudit\.source\.termsUrl/);
  assert.match(panel, /Figures, data, and video page/);
  assert.doesNotMatch(panel, /SphereGeometry|BoxGeometry|BufferGeometry|Mesh\s*\(/);
});
