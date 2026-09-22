import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateCuratorReviewContracts28 } from "../scripts/validate-curator-review-contracts-2.8.mjs";

const [contract, adjudicationContract] = await Promise.all([
  readFile(new URL("../data/curator-feedback-contract-2.8.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/curator-adjudication-contract-2.8.json", import.meta.url), "utf8").then(JSON.parse),
]);

test("validates the versioned local-only curator feedback and adjudication contracts", async () => {
  const report = await validateCuratorReviewContracts28(contract, adjudicationContract);
  assert.equal(report.distributionVersion, "2.8.0-curator.1");
  assert.equal(report.requiredResponseKeyCount, 17);
  assert.equal(contract.workbenchReleaseId, "ohri-mouse-interneuron-public-data-workbench-2.8.0");
  assert.equal(contract.maximumFileBytes, 2097152);
  assert.equal(contract.maximumFeedbackRecords, 10);
  assert.equal(contract.minimumIndependentCuratorsForComparison, 2);
  assert.equal(contract.privacy, "Created locally; not uploaded.");
  assert.ok(contract.requiredResponseKeys.includes("zip_sha256"));
  assert.equal(adjudicationContract.maximumPacketBytes, 2097152);
  assert.equal(adjudicationContract.readOnlyPacketImport, true);
  assert.deepEqual(adjudicationContract.permittedDispositions, ["defer_pending_evidence", "return_for_revision", "recommend_next_private_review"]);
  assert.match(adjudicationContract.boundary, /align reference anatomy.*molecular type.*morphology.*SCI evidence lanes.*cross-study identity or morphology join/i);
  assert.deepEqual(contract.optionalResponseKeys.slice(0, 6), ["us01_notes", "us02_notes", "us03_notes", "us04_notes", "us05_notes", "us06_notes"]);
});

test("rejects duplicate feedback keys and a missing ZIP identity key", async () => {
  const duplicate = structuredClone(contract);
  duplicate.optionalResponseKeys.push("curator_id");
  await assert.rejects(() => validateCuratorReviewContracts28(duplicate, adjudicationContract), /response keys are incomplete or duplicated/i);

  const missingZipSha = structuredClone(contract);
  missingZipSha.requiredResponseKeys = missingZipSha.requiredResponseKeys.filter((key) => key !== "zip_sha256");
  await assert.rejects(() => validateCuratorReviewContracts28(missingZipSha, adjudicationContract), /response keys are incomplete or duplicated/i);
});

test("keeps feedback import bounded, exact-versioned and local-only in the browser", async () => {
  const inbox = await readFile(new URL("../app/CuratorFeedbackInbox.tsx", import.meta.url), "utf8");
  assert.match(inbox, /releaseManifestContentSha256 !== publicWorkbenchManifest\.manifestContentSha256/);
  assert.match(inbox, /registrationCount !== 0/);
  assert.match(inbox, /ZIP SHA-256 must be a 64-character hexadecimal value/);
  assert.match(inbox, /maximumFileBytes/);
  assert.match(inbox, /maximumFeedbackRecords/);
  assert.match(inbox, /a feedback record from this curator ID is already loaded/);
  assert.match(inbox, /Local receipt only/);
  assert.match(inbox, /Independent-curator comparison/);
  assert.match(inbox, /buildAdjudicationPacket/);
  assert.match(inbox, /recommend_next_private_review/);
  assert.match(inbox, /does not recalculate or certify the original ZIP digest/);
  assert.match(inbox, /Verify adjudication packet/);
  assert.match(inbox, /validateAdjudicationPacket/);
  assert.match(inbox, /read-only; release remains unchanged and 0 REG/);
  assert.doesNotMatch(inbox, /fetch\(/);
  assert.doesNotMatch(inbox, /localStorage|sessionStorage/);
});
