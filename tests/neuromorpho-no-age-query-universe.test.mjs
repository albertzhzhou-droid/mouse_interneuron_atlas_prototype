import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateNeuromorphoNoAgeQueryUniverse } from "../scripts/validate-neuromorpho-no-age-query-universe-0.1.mjs";

const contract = JSON.parse(await readFile(new URL("../data/neuromorpho-no-age-query-universe-0.1.json", import.meta.url), "utf8"));
const index = JSON.parse(await readFile(new URL("../public/data/neuromorpho_release_8_6_124_no_age_universe_v1/universe-index.json", import.meta.url), "utf8"));

test("validates all 1,097 exact NeuroMorpho source objects and the reuse/delta boundary", async () => {
  const report = await validateNeuromorphoNoAgeQueryUniverse();
  assert.equal(report.queryRecordCount, 1097);
  assert.equal(report.admittedSourceObjectCount, 1097);
  assert.equal(report.existingGeometryReferenceCount, 149);
  assert.equal(report.deltaRawSwcCount, 948);
  assert.equal(report.indexSha256, contract.dataset.indexSha256);
  assert.equal(report.manifestSha256, contract.dataset.assetManifestSha256);
});

test("keeps independent denominators and never turns records into animals, types, or complete axons", () => {
  assert.deepEqual(index.summary.byLifeStage, { adult: 142, young: 729, "young adult": 226 });
  assert.equal(index.summary.diameterUnavailableCount, 142);
  assert.equal(index.summary.frozenAdultSubsetCount, 142);
  const noDiameterIds = index.records
    .filter((record) => !record.normalizedMetadata.sourceDiameterAvailable)
    .map((record) => record.neuronId);
  const frozenAdultIds = index.records
    .filter((record) => record.memberships.frozenAdultSubset)
    .map((record) => record.neuronId);
  assert.equal(noDiameterIds.length, 142);
  assert.equal(frozenAdultIds.length, 142);
  assert.notDeepEqual(noDiameterIds, frozenAdultIds, "equal counts remain independent record sets, not an identity join");
  assert.equal(index.summary.completeAxonClaimCount, 0);
  assert.equal(index.summary.registrationCount, 0);
  assert.match(index.scientificBoundary.scope, /not_biological_type_or_animal_census/);
});

test("preserves the source z columns of all 39 source-labelled 2D SWCs without pretending z is unavailable", async () => {
  const twoDimensionalRecords = index.records.filter(
    (record) => record.normalizedMetadata.dimensionality === "2D",
  );
  assert.equal(twoDimensionalRecords.length, 39);

  let nonZeroSourceZExtentCount = 0;
  for (const record of twoDimensionalRecords) {
    const swc = await readFile(new URL(`../public${record.sourceObject.rawSwcPath}`, import.meta.url), "utf8");
    const sourceZ = swc
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => Number(line.split(/\s+/)[4]));
    assert.ok(sourceZ.length > 0 && sourceZ.every(Number.isFinite), `NMO ${record.neuronId} has finite source z values`);
    let minimumZ = Number.POSITIVE_INFINITY;
    let maximumZ = Number.NEGATIVE_INFINITY;
    for (const value of sourceZ) {
      minimumZ = Math.min(minimumZ, value);
      maximumZ = Math.max(maximumZ, value);
    }
    const zExtent = maximumZ - minimumZ;
    assert.ok(Math.abs(zExtent - record.morphometrics.computed.extentMicrometre[2]) < 1e-9);
    if (zExtent > 0) nonZeroSourceZExtentCount += 1;
  }
  assert.equal(nonZeroSourceZExtentCount, 37);
});

test("the UI presents one shared boundary and record-specific cards while clearing prior geometry", async () => {
  const source = await readFile(new URL("../app/NeuroMorphoUniversePanel.tsx", import.meta.url), "utf8");
  const viewerSource = await readFile(new URL("../app/MorphologyViewer.tsx", import.meta.url), "utf8");
  const viewportSource = await readFile(new URL("../app/SourceLocalMorphologyViewport.tsx", import.meta.url), "utf8");
  assert.match(source, /Shared unavailable axes/);
  assert.match(source, /What differs for this cell/);
  assert.match(source, /setGeometryState\(\{ status: "loading", neuronId: selected\.neuronId, geometry: null/);
  assert.match(source, /Every switch discards the prior geometry/);
  assert.match(source, /externalMorphologyFocus[\s\S]*\? externalId && records\.some[\s\S]*\? externalId[\s\S]*: null[\s\S]*: internalSelectedId/);
  assert.match(source, /The requested NeuroMorpho focus is not admitted in this exact source universe/);
  assert.match(source, /setMembership\("all"\);\s*setPage\(0\);/);
  assert.match(source, /Official No Diameter authority/);
  assert.match(source, /Source-labelled 2D: source z values are preserved, rotation is locked to XY, and no depth is inferred or extruded/);
  assert.match(viewerSource, /event\.key === "Home"\s*\? "universe"/);
  assert.match(viewportSource, /Source-labelled 2D record; source z values are preserved without inference or extrusion/);
  assert.doesNotMatch(viewportSource, /z depth unavailable/);
  assert.doesNotMatch(source, /generic internal model/i);
});
