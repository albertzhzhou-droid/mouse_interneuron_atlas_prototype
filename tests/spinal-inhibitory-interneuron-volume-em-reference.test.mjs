import assert from "node:assert/strict";
import test from "node:test";
import { validateSpinalInhibitoryInterneuronVolumeEmReference } from "../scripts/validate-spinal-inhibitory-interneuron-volume-em-reference-0.1.mjs";

test("published spinal volume reconstruction remains an independent reference, not selected-cell geometry", async () => {
  const receipt = await validateSpinalInhibitoryInterneuronVolumeEmReference();
  assert.equal(receipt.doi, "10.1038/s41593-019-0358-7");
  assert.deepEqual(receipt.reportedVolumeMicrometre, [35, 24, 2]);
  assert.equal(receipt.reconstructedStructureCount, 6);
  assert.equal(receipt.admittedProjectGeometryCount, 0);
  assert.equal(receipt.registrationCount, 0);
});
