import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { validateMouseSpinalEmRepositorySearchAudit } from "../scripts/validate-mouse-spinal-em-repository-search-audit-0.1.mjs";

test("UPG-243 seals the bounded repository screen without admitting a mouse spinal cell object", async () => {
  const result = await validateMouseSpinalEmRepositorySearchAudit();
  assert.equal(result.repositoryQueries, 4);
  assert.equal(result.reviewedCandidates, 2);
  assert.equal(result.eligibleMouseSpinalInterneuronObjectRoutes, 0);
  assert.equal(result.downloadedPayloadBytes, 0);
  assert.equal(result.admittedSegmentationObjects, 0);
});

test("UPG-243 rejects universal no-hit, false spinal identity, and geometry admission", async () => {
  const base = JSON.parse(await readFile(new URL("../data/mouse-spinal-em-repository-search-audit-0.1.json", import.meta.url), "utf8"));
  for (const mutate of [
    (value) => { value.admission.voxelVolumesAdmitted = 1; },
    (value) => { value.admission.stableInterneuronObjectCrosswalksAdmitted = 1; },
    (value) => { value.admission.interpretation = "No qualifying record exists anywhere."; },
    (value) => { value.reviewedCandidateRecords.find((record) => record.accession === "S-BIAD2822").observedSegmentationScope = "Mouse spinal interneuron segmentation."; },
    (value) => { value.repositoryQueries = value.repositoryQueries.slice(1); },
  ]) {
    const altered = structuredClone(base);
    mutate(altered);
    await assert.rejects(validateMouseSpinalEmRepositorySearchAudit(altered));
  }
});

test("UPG-243 search receipts conform to the bounded audit schema", async () => {
  const [audit, schema] = await Promise.all([
    readFile(new URL("../data/mouse-spinal-em-repository-search-audit-0.1.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../schemas/mouse-spinal-em-repository-search-audit-0.1.schema.json", import.meta.url), "utf8").then(JSON.parse),
  ]);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  assert.equal(validate(audit), true, JSON.stringify(validate.errors));
});
