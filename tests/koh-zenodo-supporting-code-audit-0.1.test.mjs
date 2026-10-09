import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateKohZenodoSupportingCodeAudit } from "../scripts/validate-koh-zenodo-supporting-code-audit-0.1.mjs";

const audit = await readFile(new URL("../data/koh-zenodo-supporting-code-audit-0.1.json", import.meta.url), "utf8").then(JSON.parse);

test("Koh Zenodo deposit is versioned code-only and its external list inputs remain unavailable", () => {
  const receipt = validateKohZenodoSupportingCodeAudit(audit);
  assert.equal(receipt.versionDoi, "10.5281/zenodo.17475613");
  assert.equal(receipt.version, "v1.0");
  assert.equal(receipt.archiveBytes, 9289);
  assert.equal(receipt.sourceCodeFileCount, 2);
  assert.equal(receipt.publishedInputsSufficient, false);
  assert.equal(receipt.geometryAdmitted, 0);
});

test("Koh Zenodo audit rejects a public-workbook substitution or geometry promotion", () => {
  const alteredWorkbook = structuredClone(audit);
  alteredWorkbook.codeInputAudit.synapseGliaScript.allExpectedSheetsAbsentFromAuditedPmcWorkbook = false;
  assert.throws(() => validateKohZenodoSupportingCodeAudit(alteredWorkbook), /input and no-execution boundary changed/);

  const alteredGeometry = structuredClone(audit);
  alteredGeometry.rightsAndAdmission.geometryAdmitted = 1;
  assert.throws(() => validateKohZenodoSupportingCodeAudit(alteredGeometry), /must remain no-admission/);
});
