import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../", import.meta.url));
const audit = JSON.parse(readFileSync(new URL("../data/neuromorpho-publication-discovery-audit-0.1.json", import.meta.url)));

test("bounded discovery uses receipt-verified official publication metadata", () => {
  for (const input of audit.inputReceipts) {
    const bytes = readFileSync(`${root}${input.path}`);
    assert.equal(bytes.length, input.bytes);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), input.sha256);
  }
  assert.equal(audit.taxonomyPublications.length, 10);
  assert.equal(audit.summary.sourceProfileCountUnchanged, 387);
  for (const source of audit.taxonomyPublications) assert.ok(source.resolvedPublication.dois.includes(source.sourcePublicationDoiRaw));
  assert.equal(audit.records.length, 1127);
  assert.equal(new Set(audit.records.map((row) => row.neuronId)).size, 1127);
  assert.deepEqual(audit.summary.publicationStatusCounts, { unmatched: 1097, unassessable: 30 });
  assert.equal(audit.summary.exactPmidCandidateRecordCount, 0);
  assert.equal(audit.summary.exactNormalizedTitleCandidateRecordCount, 0);
  assert.equal(audit.summary.sharedAuthorOnlyCandidateRecordCount, 0);
});

test("the resolved candidate article cannot overwrite anomalous Todd references", () => {
  assert.equal(audit.toddRefresh.candidateStudyCitationResolved.pmid, "42454582");
  assert.ok(audit.toddRefresh.candidateStudyCitationResolved.dois.includes("10.1177/17448069261468203"));
  assert.equal(audit.toddRefresh.candidateRelation, "context_only_exact_record_crosswalk_unverified");
  assert.equal(audit.toddRefresh.sourceApiReferenceValuesReplaced, false);
  assert.deepEqual(audit.toddRefresh.addedIdsSincePinnedQuery, []);
  assert.deepEqual(audit.toddRefresh.removedIdsSincePinnedQuery, []);
  const todd = audit.records.filter((row) => row.release === "8.6.126");
  assert.equal(todd.length, 30);
  for (const row of todd) {
    assert.deepEqual(row.referencePmidRaw, ["2017"]);
    assert.deepEqual(row.referenceDoiRaw, [""]);
    assert.equal(row.publicationDiscoveryStatus, "unassessable");
    assert.equal(row.exactObjectCrosswalk.publication, null);
  }
});

test("unknown supplemental and object mappings never become biological relationships", () => {
  for (const row of audit.records) {
    assert.equal(row.supplementFilenameScreen.status, "unassessable");
    assert.equal(row.exactObjectCrosswalk.identityAdmitted, false);
    for (const field of ["publication", "animalOrSpecimen", "figureOrSupplement", "laminaAssignment"]) assert.equal(row.exactObjectCrosswalk[field], null);
  }
  for (const field of ["exactObjectCrosswalksAdmitted", "sameCellJoins", "geometryObjectsAdmitted", "internalObjectsAdmitted", "denominatorChange"]) assert.equal(audit.summary[field], 0);
});
