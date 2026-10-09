import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateKohSpinalSupplementalFileAudit } from "../scripts/validate-koh-spinal-supplemental-file-audit-0.1.mjs";

const audit = await readFile(new URL("../data/koh-spinal-supplemental-file-audit-0.1.json", import.meta.url), "utf8").then(JSON.parse);

test("Koh supplement audit pins both official files without admitting object geometry", () => {
  const receipt = validateKohSpinalSupplementalFileAudit(audit);
  assert.equal(receipt.worksheetCount, 31);
  assert.equal(receipt.pdfPageCount, 7);
  assert.equal(receipt.articleVersionLicense, "CC BY-NC-ND");
  assert.equal(receipt.sourceObjectsAdmitted, 0);
  assert.equal(receipt.geometryAdmitted, 0);
});

test("Koh supplement audit fails closed if any worksheet range or rights boundary drifts", () => {
  const altered = structuredClone(audit);
  altered.files[1].worksheetRegions[0].visibleUsedRange = "A1:J6";
  assert.throws(() => validateKohSpinalSupplementalFileAudit(altered), /worksheet names or visible ranges changed/);

  const rightsAltered = structuredClone(audit);
  rightsAltered.rightsAndAdmission.geometryAdmitted = 1;
  assert.throws(() => validateKohSpinalSupplementalFileAudit(rightsAltered), /must remain no-admission/);
});
