import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { loadVerifiedResearchExplorerIndex } from "../app/research-explorer-index.js";
import { molecularConcordanceProfile, buildMolecularConcordance, molecularConcordanceCsv } from "../app/molecular-concordance.js";

const fsFetch = async (path) => {
  const bytes = await readFile(new URL(`../public${path}`, import.meta.url));
  return { ok: true, status: 200, json: async () => JSON.parse(bytes), arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
};
const index = await loadVerifiedResearchExplorerIndex({ fetchImpl: fsFetch });
const molecular = index.records.filter((record) => record.focusKind === "molecular_profile");
const byId = (id) => molecular.find((record) => record.focusId === id);
const json = async (name) => JSON.parse(await readFile(new URL(`../data/${name}.json`, import.meta.url), "utf8"));
const sourceScopes = [];
for (const [namespace, name] of [["sathyamurthy-2018", "sathyamurthy-source-taxonomy-0.1"], ["alkaslasi-2021:GSE167597", "alkaslasi-cholinergic-source-taxonomy-0.1"], ["haring-2018:GSE103840", "haring-dorsal-horn-source-taxonomy-0.1"], ["hayashi-2018:GSE108788", "hayashi-v2a-source-taxonomy-0.1"], ["roome-2026:GSE291462", "roome-dil-source-taxonomy-0.1"]]) {
  const taxonomy = await json(name);
  sourceScopes.push({ namespace, path: `data/${name}.json`, releaseId: taxonomy.releaseId,
    lifeStage: taxonomy.scope.lifeStage ?? taxonomy.scope.lifeStages.join(" · "),
    lifeStageLocator: `data/${name}.json#scope/${taxonomy.scope.lifeStage ? "lifeStage" : "lifeStages"}`, profileIds: taxonomy.profiles.map((profile) => profile.id) });
}
function reportFor(ids, anchorIndex = 0) {
  return buildMolecularConcordance(index.records, { anchorKey: byId(ids[anchorIndex]).key, selectedKeys: ids.map((id) => byId(id).key), sourceScopes });
}

function parseCsv(text) {
  const rows = []; let row = []; let value = ""; let quoted = false;
  for (let offset = 0; offset < text.length; offset += 1) {
    const character = text[offset];
    if (character === '"') {
      if (quoted && text[offset + 1] === '"') { value += '"'; offset += 1; } else quoted = !quoted;
    } else if (character === "," && !quoted) { row.push(value); value = ""; }
    else if (character === "\n" && !quoted) { row.push(value.replace(/\r$/, "")); rows.push(row); row = []; value = ""; }
    else value += character;
  }
  assert.equal(quoted, false);
  return rows;
}

test("current checksum-verified scope covers 387 source profiles across ten namespaces, with all comparison fields present", () => {
  assert.equal(molecular.length, 387);
  assert.equal(new Set(molecular.map((record) => record.namespace)).size, 10);
  for (const record of molecular) {
    const profile = molecularConcordanceProfile(record, { sourceScopes });
    assert.equal(profile.key, record.key);
    assert.equal(profile.identity, "not_established");
    assert.deepEqual(Object.keys(profile.fields), ["region", "life_stage", "transmitter"]);
    assert.ok(Object.values(profile.fields).every((field) => typeof field.locator === "string" && field.locator.length > 0));
    assert.ok(profile.markers.locator, `${record.focusId} must retain a marker/missingness locator`);
  }
  const report = reportFor(["alkaslasi-2021:GSE167597:I1", "alkaslasi-2021:GSE167597:I2"]);
  assert.equal(report.sourceDenominator.value, 387);
  assert.equal(report.sourceDenominator.unit, "source_profiles");
  assert.equal(report.sourceDenominator.namespaceCounts["cano-gomez-2026:GSE318731"], 11);
  assert.equal(report.sourceDenominator.deduplicationCount, 0);
});

test("anchor to up to three source records retains exact markers and independent source contexts", () => {
  const report = reportFor(["alkaslasi-2021:GSE167597:I1", "alkaslasi-2021:GSE167597:I2", "hayashi-2018:GSE108788:cluster-1", "sathyamurthy-2018:DE-1"]);
  assert.equal(report.comparisons.length, 3);
  assert.deepEqual(report.comparisons[0].markers.sharedExactStrings, ["Pax2", "Mpped2", "Slc6a1"]);
  assert.deepEqual(report.comparisons[0].markers.anchorOnlyStrings, ["Piezo2"]);
  assert.equal(report.comparisons[0].fields.transmitter.status, "exact_agreement");
  assert.equal(report.comparisons[1].fields.transmitter.status, "different_source_assertions");
  assert.equal(report.comparisons[1].fields.life_stage.status, "different_source_assertions");
  assert.match(report.profiles[0].fields.life_stage.rawValue, /adult; 8 weeks/);
  assert.match(report.profiles[2].fields.life_stage.rawValue, /P0 neonatal/);
  assert.ok(report.comparisons.every((pair) => pair.identity === "not_established" && pair.relation === "inspection_candidate"));
  assert.equal(report.sameCellJoinCount + report.sameTypeJoinCount + report.generatedGeometryCount, 0);
  assert.equal(JSON.stringify(report).includes('"similarityScore"'), false);
  const reanchored = reportFor(["alkaslasi-2021:GSE167597:I1", "alkaslasi-2021:GSE167597:I2"], 1);
  assert.equal(reanchored.anchorKey, byId("alkaslasi-2021:GSE167597:I2").key);
  assert.deepEqual(reanchored.comparisons[0].markers.comparisonOnlyStrings, ["Piezo2"]);
});

test("case, qualifiers and different evidence roles stay exact; no source-label token creates a marker", () => {
  const anchor = structuredClone(byId("alkaslasi-2021:GSE167597:I1"));
  const comparison = structuredClone(byId("alkaslasi-2021:GSE167597:I2"));
  anchor.evidence.find((row) => row.label === "Article marker context").value = "Pax2 · PAX2 · Slc17a6 (low)";
  comparison.evidence.find((row) => row.label === "Article marker context").value = "Pax2 · Slc17a6";
  const report = buildMolecularConcordance([anchor, comparison], { anchorKey: anchor.key, selectedKeys: [anchor.key, comparison.key] });
  assert.deepEqual(report.comparisons[0].markers.sharedExactStrings, ["Pax2"]);
  assert.deepEqual(report.comparisons[0].markers.anchorOnlyStrings, ["PAX2", "Slc17a6 (low)"]);
  const cano = molecular.find((record) => record.namespace === "cano-gomez-2026:GSE318731");
  assert.equal(molecularConcordanceProfile(cano).markers.status, "missing");
  assert.deepEqual(molecularConcordanceProfile(cano).markers.exactStrings, []);
  const roome = molecular.find((record) => record.namespace === "roome-2026:GSE291462");
  assert.equal(molecularConcordanceProfile(roome).markers.sourceRowLabel, "Positive differential features meeting display thresholds");
  assert.deepEqual(molecularConcordanceProfile(roome).markers.exactStrings, ["Tfap2b", "Islr2", "Lhx1", "Lhx1os", "Npy", "2700069I18Rik"]);
});

test("Table 8 explicit fields preserve raw genes and missing co-markers; missing transmitter never becomes absence", () => {
  const haring = byId("haring-2018:GSE103840:Gaba1");
  const profile = molecularConcordanceProfile(haring, { sourceScopes });
  assert.deepEqual(profile.markers.exactStrings, ["Gal", "Slc17a6"]);
  assert.equal(profile.fields.life_stage.rawValue, haring.evidence.find((row) => row.label === "Sequencing-cohort age boundary").value);
  assert.match(profile.fields.life_stage.rawValue, /P17-P28.*broad life-stage category: not source-asserted/);
  assert.match(profile.markers.rawValue, /co-marker 2 not populated/);
  const delile = byId("delile-2019:E-MTAB-7320:dl1.1");
  const report = buildMolecularConcordance(index.records, { anchorKey: haring.key, selectedKeys: [haring.key, delile.key], sourceScopes });
  assert.equal(report.comparisons[0].fields.transmitter.status, "unknown");
  assert.equal(report.comparisons[0].markers.status, "unknown");
  assert.match(report.comparisons[0].fields.transmitter.comparisonEvidence.rawValue, /Not established/);
  assert.equal(report.comparisons[0].markers.sharedExactStrings.length, 0);
});

test("source discrepancies are retained separately from different scope strings, without silent correction", () => {
  const report = reportFor(["crozat-2025:figshare-29430869-v2:pkd2l1-csf-cn", "alkaslasi-2021:GSE167597:I1"]);
  assert.ok(report.profiles[0].sourceConflicts.some((row) => row.label === "Anatomy denominator conflict" && row.rawValue.includes("478") && row.rawValue.includes("457")));
  assert.ok(report.profiles[1].sourceConflicts.some((row) => row.label === "Publication identity discrepancy" && row.rawValue.includes("37559423")));
  assert.ok(report.comparisons[0].sourceConflicts.anchor.length > 0);
  assert.match(report.comparisons[0].fields.life_stage.boundary, /not automatically biological contradictions/);
});

test("source-cohort fallbacks require exact namespace and profile membership; unknown IDs/invalid anchors fail closed", () => {
  const sathy = byId("sathyamurthy-2018:DE-1");
  const scoped = molecularConcordanceProfile(sathy, { sourceScopes });
  assert.equal(scoped.fields.life_stage.rawValue, "adult");
  const mismatched = structuredClone(sourceScopes);
  mismatched.find((scope) => scope.namespace === sathy.namespace).profileIds = [];
  assert.equal(molecularConcordanceProfile(sathy, { sourceScopes: mismatched }).fields.life_stage.status, "missing");
  const second = byId("alkaslasi-2021:GSE167597:I1");
  assert.throws(() => buildMolecularConcordance(index.records, { anchorKey: sathy.key, selectedKeys: [sathy.key] }), /2–4/);
  assert.throws(() => buildMolecularConcordance(index.records, { anchorKey: sathy.key, selectedKeys: [sathy.key, sathy.key] }), /distinct/);
  assert.throws(() => buildMolecularConcordance(index.records, { anchorKey: "unknown", selectedKeys: [sathy.key, second.key] }), /anchor/);
  assert.throws(() => buildMolecularConcordance(index.records, { anchorKey: sathy.key, selectedKeys: [sathy.key, "molecular_profile:unknown"] }), /Unknown.*no default replacement/);
});

test("JSON and CSV exports round-trip raw values, locators, marker intersections and preserved conflicts", () => {
  const report = reportFor(["alkaslasi-2021:GSE167597:I1", "alkaslasi-2021:GSE167597:I2", "delile-2019:E-MTAB-7320:dl1.1"]);
  const replay = JSON.parse(JSON.stringify(report));
  assert.deepEqual(replay, report);
  const rows = parseCsv(molecularConcordanceCsv(report));
  assert.equal(rows.length, 11);
  assert.ok(rows.every((row) => row.length === 10));
  assert.deepEqual(JSON.parse(rows[1][6]), ["Pax2", "Mpped2", "Slc6a1"]);
  assert.equal(JSON.parse(rows[1][7]).locator, report.comparisons[0].markers.anchorEvidence.locator);
  assert.equal(rows[1][9], "not_established");
  assert.equal(rows[7][2], "transmitter");
  assert.equal(rows[7][3], "unknown");
  const anchor = structuredClone(byId("alkaslasi-2021:GSE167597:I1"));
  const comparison = structuredClone(byId("alkaslasi-2021:GSE167597:I2"));
  anchor.evidence.find((row) => row.label === "Article marker context").value = '=HYPERLINK("example") · Gene\nwith newline';
  const quoteReport = buildMolecularConcordance([anchor, comparison], { anchorKey: anchor.key, selectedKeys: [anchor.key, comparison.key] });
  const quoteRows = parseCsv(molecularConcordanceCsv(quoteReport));
  assert.deepEqual(JSON.parse(quoteRows[1][4]), ['=HYPERLINK("example")', 'Gene\nwith newline']);
  assert.ok(!quoteRows[1][4].startsWith("="), "raw values are JSON containers in spreadsheet cells");
});
