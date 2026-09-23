import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateDavisIcrSameCellReference } from "../scripts/validate-davis-icr-same-cell-reference-0.1.mjs";

const RECEIPT_URL = new URL("../data/source-candidates/davis-icr-same-cell-20260922/receipt.json", import.meta.url);

test("Davis Figure 1 remains an unchanged source-local same-cell 2D reference", async () => {
  const result = await validateDavisIcrSameCellReference();
  const receipt = JSON.parse(await readFile(RECEIPT_URL, "utf8"));
  assert.equal(result.sourceImageBytes, 1195290);
  assert.equal(result.sourceImageSha256, "3beafa543799863db6752e97e31b718e9d6e93645866d4065178c8ce3413cb74");
  assert.equal(receipt.sourceSupportedRelations[0].fromPanel, "d");
  assert.deepEqual(receipt.sourceSupportedRelations[0].toPanels, ["e", "f", "g"]);
  assert.equal(result.captionAssertedSameCellLinkCount, 1);
  assert.equal(result.admittedProjectGeometryCount, 0);
  assert.equal(result.activeRecordJoinCount, 0);
  assert.equal(result.atlasRegistrationCount, 0);
});

test("re-hashing cannot promote a different panel relation or add geometry", async () => {
  const receipt = JSON.parse(await readFile(RECEIPT_URL, "utf8"));
  for (const mutate of [
    (copy) => { copy.sourceSupportedRelations[0].fromPanel = "a"; },
    (copy) => { copy.sourceSupportedRelations[0].toPanels = ["e", "f"]; },
    (copy) => { copy.geometryAdmissionCount = 1; },
    (copy) => { copy.rights.license = "unknown"; },
  ]) {
    const changed = structuredClone(receipt);
    mutate(changed);
    await assert.rejects(validateDavisIcrSameCellReference(changed));
  }
});
