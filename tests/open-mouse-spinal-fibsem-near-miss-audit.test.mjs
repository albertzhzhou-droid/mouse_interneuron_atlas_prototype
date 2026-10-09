import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { validateOpenMouseSpinalFibsemNearMissAudit } from "../scripts/validate-open-mouse-spinal-fibsem-near-miss-audit-0.1.mjs";

const auditUrl = new URL("../data/open-mouse-spinal-fibsem-near-miss-audit-0.1.json", import.meta.url);

test("UPG-249 finds two openly licensed adult-mouse spinal EM volumes but no interneuron object route", async () => {
  const result = await validateOpenMouseSpinalFibsemNearMissAudit();
  assert.equal(result.publicAdultMouseSpinalEmVolumes, 2);
  assert.equal(result.eligibleMouseSpinalInterneuronObjectRoutes, 0);
  assert.equal(result.rawVolumesDownloaded, 0);
  assert.equal(result.admittedObjects, 0);
});

test("UPG-249 near-miss audit rejects interneuron reassignment and unverified geometry admission", async () => {
  const base = JSON.parse(await readFile(auditUrl, "utf8"));
  for (const mutate of [
    (value) => { value.candidateVolumes[0].interneuronObjectCrosswalk = true; },
    (value) => { value.candidateVolumes[1].anatomicalRegion = "interneuron soma"; },
    (value) => { value.candidateVolumes[0].license = "unknown"; },
    (value) => { value.admission.organelleObjectsAdmitted = 1; },
    (value) => { value.admission.eligibleMouseSpinalInterneuronObjectRoutes = 1; },
  ]) {
    const changed = structuredClone(base);
    mutate(changed);
    await assert.rejects(validateOpenMouseSpinalFibsemNearMissAudit(changed));
  }
});

test("UPG-249 near-miss audit conforms to its strict schema", async () => {
  const [audit, schema] = await Promise.all([
    readFile(auditUrl, "utf8").then(JSON.parse),
    readFile(new URL("../schemas/open-mouse-spinal-fibsem-near-miss-audit-0.1.schema.json", import.meta.url), "utf8").then(JSON.parse),
  ]);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  assert.equal(validate(audit), true, JSON.stringify(validate.errors));
});
