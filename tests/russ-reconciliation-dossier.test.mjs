import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateRussReconciliationDossier } from "../scripts/validate-russ-reconciliation-dossier-0.1.mjs";

const dossier = JSON.parse(await readFile(new URL("../data/russ-reconciliation-dossier-0.1.json", import.meta.url), "utf8"));

test("locks the two official Russ correction records without rewriting the marker table", async () => {
  const report = await validateRussReconciliationDossier(dossier);
  assert.equal(report.correctionCount, 2);
  assert.equal(report.reconciliationItemCount, 3);
  assert.equal(dossier.authority, "PROVENANCE_RECONCILIATION_ONLY");
  assert.equal(dossier.pinnedMarkerTable.sourceFileBundled, false);
  assert.equal(dossier.pinnedMarkerTable.tableContentChangeStatedByCorrections, false);
  assert.deepEqual(dossier.corrections.map((record) => record.doi), ["10.1038/s41467-022-28698-7", "10.1038/s41467-022-33998-z"]);
});

test("rejects a correction record that silently turns into a marker-table rewrite or registration", async () => {
  const altered = structuredClone(dossier);
  altered.corrections[0].directEffectOnPinnedMarkerTable = "Supplementary Table 1 contents were changed.";
  await assert.rejects(() => validateRussReconciliationDossier(altered), /must not imply a Table 1 content correction/i);

  const registration = structuredClone(dossier);
  registration.releaseDecision.forbidden = "Allow an exact mapping and REG after review.";
  await assert.rejects(() => validateRussReconciliationDossier(registration), /must forbid exact mapping and REG/i);
});
