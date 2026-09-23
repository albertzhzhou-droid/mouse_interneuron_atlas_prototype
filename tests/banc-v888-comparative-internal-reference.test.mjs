import assert from "node:assert/strict";
import test from "node:test";
import { validateBancV888ComparativeInternalReference } from "../scripts/validate-banc-v888-comparative-internal-reference-0.1.mjs";

test("BANC v888 availability stays a fly comparison lane with no admitted cell or internal geometry", async () => {
  const receipt = await validateBancV888ComparativeInternalReference();
  assert.equal(receipt.materializationId, "v888");
  assert.equal(receipt.metadataRowCount, 188162);
  assert.equal(receipt.sourceDocumentationConflict, "source_documentation_conflict");
  assert.equal(receipt.admittedProjectGeometryCount, 0);
  assert.equal(receipt.sameCellJoinCount, 0);
});
