import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { AUDIT_PATH, validateAdultMouseSpinalMerfishVersionAudit } from "../scripts/validate-adult-mouse-spinal-merfish-version-audit-0.1.mjs";

const audit = JSON.parse(await readFile(AUDIT_PATH, "utf8"));

test("records distinct public H5AD file manifests without asserting an unverified version join", () => {
  const summary = validateAdultMouseSpinalMerfishVersionAudit(audit);
  assert.deepEqual(summary, {
    auditId: "adult-mouse-spinal-merfish-zenodo-version-audit-0.1.0",
    records: ["18039571", "20533289"],
    laterDisplayedVersion: "v2",
    versionLineageConfirmed: false,
    dataDeltaCompared: false,
    bundledPayloadCount: 0,
    geometryCount: 0,
  });
});

test("does not let version labels, matching names or publication context authorize data joins or geometry", () => {
  for (const mutate of [
    (copy) => { copy.candidateLineage.status = "verified"; },
    (copy) => { copy.records[0].files[0].publishedMd5 = "0".repeat(32); },
    (copy) => { copy.admission.dataDeltaCompared = true; },
    (copy) => { copy.admission.crossVersionJoins = 1; },
    (copy) => { copy.admission.cellMorphology = 1; },
    (copy) => { copy.admission.internalObjects = 1; },
  ]) {
    const changed = structuredClone(audit);
    mutate(changed);
    assert.throws(() => validateAdultMouseSpinalMerfishVersionAudit(changed));
  }
});
