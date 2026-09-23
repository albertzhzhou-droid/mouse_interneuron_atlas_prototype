import assert from "node:assert/strict";
import test from "node:test";
import { validateBancV888CandidateAudit } from "../scripts/validate-banc-v888-candidate-audit-0.1.mjs";

test("BANC audit pins one v888 candidate, a same-root nucleus row, and one exact SWC member without admitting geometry", async () => {
  const receipt = await validateBancV888CandidateAudit();
  assert.equal(receipt.archiveVersion, 3);
  assert.equal(receipt.metadataRows, 188508);
  assert.equal(receipt.documentedMetadataRows, 188162);
  assert.equal(receipt.strictCandidateScreenRows, 12571);
  assert.equal(receipt.candidateRootId, "720575941350424112");
  assert.equal(receipt.candidateType, "IN14A018");
  assert.equal(receipt.verifiedNucleusRootJoin, true);
  assert.equal(receipt.verifiedSkeletonNodes, 7451);
  assert.equal(receipt.sameCellObjectChainComplete, false);
  assert.equal(receipt.renderedGeometryCount, 0);
});
