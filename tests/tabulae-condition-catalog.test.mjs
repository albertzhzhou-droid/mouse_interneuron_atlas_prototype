import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateTabulaeConditionCatalog } from "../scripts/validate-tabulae-condition-catalog-0.1.mjs";

const catalog = JSON.parse(await readFile(new URL("../data/tabulae-condition-catalog-0.1.json", import.meta.url), "utf8"));

test("pins a metadata-only Tabulae condition index without source-file admission", async () => {
  const report = await validateTabulaeConditionCatalog(catalog);
  assert.equal(report.sourceCount, 2);
  assert.equal(report.conditionCount, 8);
  assert.equal(report.sourceLabelCount, 93);
  assert.equal(catalog.authority, "SOURCE_METADATA_CONDITION_INDEX_ONLY");
  assert.equal(catalog.admissionDecision, "metadata_only_not_downloaded_not_bundled_not_registered");
  assert.ok(catalog.sources.every((source) => source.bodyBundled === false && source.processedMetadataBundled === false && source.localFileHash === null));
  assert.equal(catalog.conditions.find((condition) => condition.id === "TPC-007")?.aggregationLevel, "spatial sections; not a cell-level record");
  assert.match(catalog.conditions.find((condition) => condition.id === "TPC-008")?.notEstablished ?? "", /same-nucleus join/i);
});

test("rejects a duplicate source label, a changed modality, or an acquisition-promoting decision", async () => {
  const duplicateLabel = structuredClone(catalog);
  duplicateLabel.conditions[1].sourceSampleLabels[0] = duplicateLabel.conditions[0].sourceSampleLabels[0];
  await assert.rejects(() => validateTabulaeConditionCatalog(duplicateLabel), /repeated across condition groups/i);

  const changedModality = structuredClone(catalog);
  changedModality.conditions[6].sourceModality = "single-nucleus RNA sequencing";
  await assert.rejects(() => validateTabulaeConditionCatalog(changedModality), /pinned source family, accession and modality/i);

  const acquisition = structuredClone(catalog);
  acquisition.releaseDecision.forbidden = "Source data may be bundled and REG may be created.";
  await assert.rejects(() => validateTabulaeConditionCatalog(acquisition), /must forbid acquisition and REG/i);
});
