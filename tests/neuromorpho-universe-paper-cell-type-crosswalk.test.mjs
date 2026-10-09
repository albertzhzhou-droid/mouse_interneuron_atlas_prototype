import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildPaperCellTypeCrossTab,
  UNREPORTED_SOURCE_ARCHIVE,
  UNREPORTED_SOURCE_CELL_TYPE,
  UNREPORTED_SOURCE_DOI,
} from "../app/neuromorpho-universe-facets.js";

test("paper-by-label cross-tab preserves exact DOI and raw labels with explicit missingness", () => {
  const records = [
    {
      neuronId: 10,
      officialMetadata: { archive: "Archive A", cell_type: ["interneuron", "Unusual label ", "interneuron"] },
      sourcePaper: { dois: ["10.Example/Alpha", "10.Example/Alpha", "10.Example/Beta"] },
    },
    {
      neuronId: 2,
      officialMetadata: { archive: null, cell_type: null },
      sourcePaper: { dois: null, figureIds: ["Fig. 1"] },
    },
    {
      neuronId: null,
      officialMetadata: { archive: "Archive B", cell_type: "Interneuron" },
      sourcePaper: { dois: ["10.Example/Alpha"] },
    },
  ];
  const crossTab = buildPaperCellTypeCrossTab(records);
  assert.equal(crossTab.recordCount, 3);
  assert.equal(crossTab.uniqueNmoIdCount, 2);
  assert.equal(crossTab.recordsWithoutNmoIdCount, 1);
  assert.equal(crossTab.doiCount, 2);
  assert.equal(crossTab.doiMembershipCount, 3);
  assert.equal(crossTab.recordsWithoutDoiCount, 1);
  assert.equal(crossTab.multiDoiRecordCount, 1);
  assert.equal(crossTab.multiLabelRecordCount, 1);
  assert.equal(crossTab.figureMembershipRecordCount, 1);
  assert.equal(crossTab.figureMembershipUnassessableRecordCount, 2);
  assert.equal(crossTab.figureMembershipStatus, "partially_encoded");

  const alpha = crossTab.papers.find((paper) => paper.doi === "10.Example/Alpha");
  assert.deepEqual(alpha.nmoIds, ["10"]);
  assert.equal(alpha.recordCount, 2);
  assert.equal(alpha.multiDoiRecordCount, 1);
  assert.equal(alpha.multiLabelRecordCount, 1);
  assert.deepEqual(alpha.archiveCounts, [
    { value: "Archive A", count: 1 },
    { value: "Archive B", count: 1 },
  ]);
  assert.deepEqual(alpha.cellTypeRows.map((row) => row.value), ["Interneuron", "Unusual label ", "interneuron"]);
  const exactLowercase = alpha.cellTypeRows.find((row) => row.value === "interneuron");
  assert.deepEqual(exactLowercase.nmoIds, ["10"]);
  assert.equal(exactLowercase.recordCount, 1);

  const beta = crossTab.papers.find((paper) => paper.doi === "10.Example/Beta");
  assert.deepEqual(beta.nmoIds, ["10"]);
  assert.equal(beta.recordCount, 1);
  assert.equal(beta.multiDoiRecordCount, 1);
  assert.equal(crossTab.missingDoi.doi, UNREPORTED_SOURCE_DOI);
  assert.deepEqual(crossTab.missingDoi.nmoIds, ["2"]);
  assert.equal(crossTab.missingDoi.cellTypeRows[0].value, UNREPORTED_SOURCE_CELL_TYPE);
  assert.equal(crossTab.missingDoi.archiveCounts[0].value, UNREPORTED_SOURCE_ARCHIVE);
});

test("pinned 8.6.124 DOI-by-label cross-tab is a reproducible record-provenance map", async () => {
  const contract = JSON.parse(await readFile(new URL("../data/neuromorpho-no-age-query-universe-0.1.json", import.meta.url), "utf8"));
  const bytes = await readFile(new URL(`../public${contract.dataset.indexPath}`, import.meta.url));
  assert.equal(bytes.byteLength, contract.dataset.indexBytes);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), contract.dataset.indexSha256);

  const index = JSON.parse(bytes.toString("utf8"));
  assert.equal(index.repositoryRelease, "8.6.124");
  const crossTab = buildPaperCellTypeCrossTab(index.records);
  assert.equal(crossTab.recordCount, 1_097);
  assert.equal(crossTab.uniqueNmoIdCount, 1_097);
  assert.equal(crossTab.recordsWithoutNmoIdCount, 0);
  assert.equal(crossTab.doiCount, 12);
  assert.equal(crossTab.doiMembershipCount, 1_097);
  assert.equal(crossTab.recordsWithoutDoiCount, 0);
  assert.equal(crossTab.multiDoiRecordCount, 0);
  assert.equal(crossTab.multiLabelRecordCount, 1_095);
  assert.equal(crossTab.figureMembershipRecordCount, 0);
  assert.equal(crossTab.figureMembershipUnassessableRecordCount, 1_097);
  assert.equal(crossTab.figureMembershipStatus, "not_encoded_in_index");
  assert.equal(crossTab.papers.reduce((sum, paper) => sum + paper.nmoIds.length, 0), 1_097);
  assert.equal(crossTab.papers.reduce((sum, paper) => sum + paper.cellTypeRows.reduce((n, row) => n + row.recordCount, 0), 0), 2_735);

  const abraira = crossTab.papers.find((paper) => paper.doi === "10.1016/j.cell.2016.12.010");
  assert.equal(abraira.recordCount, 650);
  assert.deepEqual(abraira.archiveCounts, [{ value: "Ginty", count: 650 }]);
  assert.equal(abraira.cellTypeRows.find((row) => row.value === "Excitatory").recordCount, 208);
  assert.equal(abraira.cellTypeRows.find((row) => row.value === "Inhibitory").recordCount, 442);
  assert.equal(abraira.cellTypeRows.find((row) => row.value === "interneuron").recordCount, 650);
  assert.equal(abraira.nmoIds.length, 650);

  const bannatyne = crossTab.papers.find((paper) => paper.doi === "10.1523/JNEUROSCI.0199-14.2014");
  assert.equal(bannatyne.recordCount, 49);
  assert.equal(bannatyne.cellTypeRows.find((row) => row.value === "Renshaw").recordCount, 8);
  assert.equal(bannatyne.cellTypeRows.find((row) => row.value === "pre-motor").recordCount, 49);
});

test("cross-tab UI filters only by the exact DOI-label pair and does not select geometry", async () => {
  const panel = await readFile(new URL("../app/NeuroMorphoUniversePanel.tsx", import.meta.url), "utf8");
  const facets = await readFile(new URL("../app/neuromorpho-universe-facets.js", import.meta.url), "utf8");
  assert.match(facets, /buildPaperCellTypeCrossTab/);
  assert.match(panel, /UPG-237 · Paper × source-label evidence map/);
  assert.match(panel, /figure membership is unassessable/);
  assert.match(panel, /Filtering a pair only narrows the list/);
  assert.match(panel, /setPaper\(paperRow\.doi\);\s*setSourceCellType\(cellTypeRow\.value\);\s*setPage\(0\);/);
  assert.doesNotMatch(panel, /setInternalSelectedId\(cellTypeRow|chooseRecord\(cellTypeRow/);
});
