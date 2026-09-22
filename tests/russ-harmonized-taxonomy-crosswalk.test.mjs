import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateRussHarmonizedTaxonomyCrosswalk } from "../scripts/validate-russ-harmonized-taxonomy-crosswalk-0.1.mjs";

const crosswalk = JSON.parse(await readFile(new URL("../data/russ-harmonized-taxonomy-crosswalk-0.1.json", import.meta.url), "utf8"));

test("locks the 69-population, type-level Russ taxonomy crosswalk", async () => {
  const report = await validateRussHarmonizedTaxonomyCrosswalk(crosswalk);
  assert.deepEqual(report, { releaseId: "ohri-russ-harmonized-taxonomy-crosswalk-0.1.0", populationCount: 69, crosswalkCount: 7 });
  assert.equal(crosswalk.coordinateAuthority, "TYPE_LEVEL");
  assert.equal(crosswalk.scope.displayedInterneuronCandidateCount, 65);
  assert.equal(crosswalk.source.markerTable.sourceFileBundled, false);
  assert.equal(crosswalk.source.markerTable.derivedMetadataBundled, true);
});

test("keeps marker context and broad relationships from becoming exact prototype identity", async () => {
  const altered = structuredClone(crosswalk);
  altered.prototypeCrosswalks[2].mappingStatus = "exact";
  await assert.rejects(() => validateRussHarmonizedTaxonomyCrosswalk(altered), /must not receive an exact Russ mapping/i);
  const badMarker = structuredClone(crosswalk);
  badMarker.populations[0].primaryMarkers = ["Chat", "", "Slit3"];
  await assert.rejects(() => validateRussHarmonizedTaxonomyCrosswalk(badMarker), /three source marker rows/i);
});

test("retains the source-table checksum and group coverage", async () => {
  assert.equal(crosswalk.source.markerTable.sha256, "a45578c893998fae42acf781c4700d162249497476b0b81149302f49929fd2e0");
  assert.deepEqual(crosswalk.groups.map((group) => group.populationLabels.length), [3, 1, 20, 14, 10, 7, 8, 6]);
  assert.deepEqual(crosswalk.populations.find((population) => population.label === "Excit-36")?.primaryMarkers, ["Vsx2", "Sox14", "Shox2"]);
  assert.deepEqual(crosswalk.populations.find((population) => population.label === "Excit-38")?.primaryMarkers, ["Sim1", "Ctcflos", "A230006K03Rik"]);
});
