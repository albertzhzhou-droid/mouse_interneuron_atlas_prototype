import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validatePkd2l1SbfsemVideoReference } from "../scripts/validate-pkd2l1-sbfsem-video-reference-0.1.mjs";

const contract = JSON.parse(await readFile(
  new URL("../data/pkd2l1-sbfsem-video-reference-0.1.json", import.meta.url),
  "utf8",
));
const component = await readFile(
  new URL("../app/InternalStructureReferencePanel.tsx", import.meta.url),
  "utf8",
);

function mutate(callback) {
  const value = structuredClone(contract);
  callback(value);
  return value;
}

test("validates the exact publication-video receipt and zero-object readiness gate", () => {
  assert.equal(validatePkd2l1SbfsemVideoReference(contract), contract);
  assert.equal(contract.source.doi, "10.7554/eLife.83108");
  assert.equal(contract.acquisition.pixelSizeNanometre, 5);
  assert.equal(contract.acquisition.sectionStepNanometre, 50);
  assert.equal(contract.video.id, "video5");
  assert.equal(contract.video.sources.find((source) => source.format === "mp4").bytes, 46_541_650);
  assert.equal(contract.objectReadiness.admittedGeometryPrimitiveCount, 0);
  assert.equal(contract.objectReadiness.admittedInternalObjectCount, 0);
  assert.equal(contract.objectReadiness.measurementUse, "forbidden");
  assert.equal(contract.availabilityAudit.notAUniversalAbsenceClaim, true);
});

test("rejects reconstruction promotion, object admission, and receipt drift", () => {
  assert.throws(() => validatePkd2l1SbfsemVideoReference(mutate((value) => {
    value.objectReadiness.rawVoxelStackExposedByArticleApi = true;
  })), /object-readiness gate/i);
  assert.throws(() => validatePkd2l1SbfsemVideoReference(mutate((value) => {
    value.objectReadiness.admittedGeometryPrimitiveCount = 1;
  })), /object-readiness gate/i);
  assert.throws(() => validatePkd2l1SbfsemVideoReference(mutate((value) => {
    value.biologicalScope.sameCellJoinCount = 1;
  })), /relationship boundary/i);
  assert.throws(() => validatePkd2l1SbfsemVideoReference(mutate((value) => {
    value.video.width = 873;
  })), /video identity/i);
});

test("the internal-reference UI streams the official video without constructing geometry", () => {
  assert.match(component, /<video\s+controls\s+preload="metadata"/);
  assert.match(component, /pkd2l1SbfsemVideoReference\.video\.sources\.map/);
  assert.match(component, /OBS PUBLICATION VIDEO · MOUSE SPINAL/);
  assert.match(component, /0 admitted 3D objects/i);
  assert.match(component, /not a universal absence claim/i);
  assert.doesNotMatch(component, /SphereGeometry|BoxGeometry|BufferGeometry|Mesh\s*\(/);
});
