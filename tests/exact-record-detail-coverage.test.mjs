import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildExactRecordDetailCoverage } from "../app/exact-record-detail-coverage.js";

const index = JSON.parse(await readFile(new URL("../public/data/research_explorer_index_v1/search-index.json", import.meta.url), "utf8"));

function selected(record) {
  const focus = { focusKind: record.focusKind, focusId: record.focusId };
  return {
    focus,
    activeRecordState: {
      status: "ready",
      requestKey: record.key,
      focusKind: record.focusKind,
      focusId: record.focusId,
      record,
    },
  };
}

function actualRecord(key) {
  const record = index.records.find((item) => item.key === key);
  assert.ok(record, `Missing fixture record ${key}`);
  return record;
}

function rowById(coverage, id) {
  const result = coverage.rows.find((item) => item.id === id);
  assert.ok(result, `Missing detail row ${id}`);
  return result;
}

test("a pending or mismatched selection never displays the prior record's detail receipt", () => {
  const morphology = actualRecord("morphology_record:NeuroMorpho:109005");
  const focus = { focusKind: "molecular_profile", focusId: "sathyamurthy-2018:DE-1" };
  const coverage = buildExactRecordDetailCoverage({
    indexState: { status: "ready", records: index.records },
    activeRecordState: { status: "ready", requestKey: morphology.key, focusKind: morphology.focusKind, focusId: morphology.focusId, record: morphology },
    focus,
  });
  assert.equal(coverage.status, "unavailable");
  assert.equal(coverage.record, null);
  assert.deepEqual(coverage.rows, []);

  const verifying = buildExactRecordDetailCoverage({
    indexState: { status: "ready", records: index.records },
    activeRecordState: { status: "verifying", requestKey: `${focus.focusKind}:${focus.focusId}`, focusKind: focus.focusKind, focusId: focus.focusId, record: null },
    focus,
  });
  assert.equal(verifying.status, "verifying");
  assert.equal(verifying.record, null);
});

test("the exact active record changes the matrix between a molecular profile and a morphology object", () => {
  const profile = actualRecord("molecular_profile:sathyamurthy-2018:DE-1");
  const profileSelection = selected(profile);
  const profileCoverage = buildExactRecordDetailCoverage({ indexState: { status: "ready", records: index.records }, ...profileSelection });
  assert.equal(rowById(profileCoverage, "cell_geometry").status, "not_measured");
  assert.equal(rowById(profileCoverage, "nucleus").status, "unavailable");
  assert.equal(rowById(profileCoverage, "source_frame").status, "source_level_only");

  const morphology = actualRecord("morphology_record:NeuroMorpho:109005");
  const morphologySelection = selected(morphology);
  const morphologyCoverage = buildExactRecordDetailCoverage({ indexState: { status: "ready", records: index.records }, ...morphologySelection });
  assert.equal(rowById(morphologyCoverage, "cell_geometry").status, "observed_source_object");
  assert.match(rowById(morphologyCoverage, "cell_geometry").locator, /nmo-109005\.json/);
  assert.equal(rowById(morphologyCoverage, "nucleus").status, "unavailable");
  assert.equal(rowById(morphologyCoverage, "relationships").status, "not_established");
});

test("an exact SWC is not promoted to a soma volume or membrane, and a radius surface stays DER", () => {
  const record = actualRecord("morphology_record:NeuroMorpho:109005");
  const coverage = buildExactRecordDetailCoverage({ indexState: { status: "ready", records: index.records }, ...selected(record) });
  assert.equal(rowById(coverage, "soma_trace").status, "source_reported");
  assert.match(rowById(coverage, "soma_trace").detail, /does not define a soma boundary or volume/);
  assert.equal(rowById(coverage, "radius_surface").status, "derived_display");
  assert.match(rowById(coverage, "radius_surface").detail, /not observed membrane/);
  assert.equal(rowById(coverage, "cell_boundary").status, "not_measured");
  assert.equal(rowById(coverage, "reconstruction_completeness").status, "source_reported");
  assert.match(rowById(coverage, "reconstruction_completeness").detail, /Moderate/);
});

test("a record without source diameter remains unavailable for radius-derived surface", () => {
  const record = actualRecord("morphology_record:NeuroMorpho:249676");
  const coverage = buildExactRecordDetailCoverage({ indexState: { status: "ready", records: index.records }, ...selected(record) });
  assert.equal(rowById(coverage, "cell_geometry").status, "observed_source_object");
  assert.equal(rowById(coverage, "radius_surface").status, "unavailable");
  assert.match(rowById(coverage, "radius_surface").detail, /No Diameter/);
  assert.equal(rowById(coverage, "source_frame").status, "observed_source_object");
});

test("source metadata about a nucleus does not become an admitted geometry object", () => {
  const record = {
    key: "morphology_record:fixture-1",
    focusKind: "morphology_record",
    focusId: "fixture-1",
    evidence: [{ label: "Nucleus annotation", value: "stable nucleus ID 22", authority: "source_reported", locator: "table:row-22" }],
    gaps: [],
    provenance: { locators: ["fixture-1"], objectHashes: [] },
    presentation: { modeling: { admittedInternalObjectCount: 0, axes: [{ axisId: "internal_structure", status: "unavailable", authority: "record_missingness_contract", detail: "No exact internal objects." }] } },
  };
  const focus = { focusKind: record.focusKind, focusId: record.focusId };
  const coverage = buildExactRecordDetailCoverage({
    indexState: { status: "ready", records: [record] },
    activeRecordState: { status: "ready", requestKey: record.key, focusKind: record.focusKind, focusId: record.focusId, record },
    focus,
  });
  assert.equal(rowById(coverage, "nucleus").status, "source_reported");
  assert.match(rowById(coverage, "nucleus").detail, /no internal geometry is admitted/);
  assert.equal(coverage.indexSummary.admittedInternalObjectCount, 0);
});

test("source-reported absence and rights-held states stay distinct from generic unavailability", () => {
  const record = {
    key: "molecular_profile:fixture-2",
    focusKind: "molecular_profile",
    focusId: "fixture-2",
    evidence: [],
    gaps: [
      { axisId: "nucleus", status: "source_reported_absent", reasonCode: "source_reports_absence", authority: "source_record", sourceLocator: "paper:p3", detail: "The source explicitly reports no nucleus label." },
      { axisId: "organelle_geometry", status: "unavailable", reasonCode: "rights_held", authority: "rights_review", sourceLocator: "deposit:license", detail: "Object-level reuse permission is held." },
    ],
    provenance: { locators: ["fixture-2"], objectHashes: [] },
    presentation: { modeling: { admittedInternalObjectCount: 0, axes: [{ axisId: "internal_structure", status: "unavailable", authority: "record_missingness_contract", detail: "No internal geometry." }] } },
  };
  const focus = { focusKind: record.focusKind, focusId: record.focusId };
  const coverage = buildExactRecordDetailCoverage({
    indexState: { status: "ready", records: [record] },
    activeRecordState: { status: "ready", requestKey: record.key, focusKind: record.focusKind, focusId: record.focusId, record },
    focus,
  });
  assert.equal(rowById(coverage, "nucleus").status, "source_reported_absent");
  assert.equal(rowById(coverage, "organelles").status, "rights_held");
});

test("shared internal-structure missingness is shown once, not repeated as four slot-specific claims", () => {
  const record = actualRecord("molecular_profile:alkaslasi-2021:GSE167597:I1");
  const coverage = buildExactRecordDetailCoverage({ indexState: { status: "ready", records: index.records }, ...selected(record) });
  const rows = ["nucleus", "organelles", "synaptic_structures", "receptor_distribution"].map((id) => rowById(coverage, id));

  assert.equal(coverage.sharedInternalBoundary?.axisId, "internal_structure");
  assert.equal(coverage.sharedInternalBoundary?.detail, "No membrane, nucleus geometry, organelle, receptor, bouton, or intracellular-compartment object is linked.");
  assert.ok(rows.every((item) => item.status === "not_measured"));
  assert.equal(new Set(rows.map((item) => item.detail)).size, rows.length);
  assert.ok(rows.every((item) => /shared internal-structure boundary above/.test(item.detail)));
  assert.ok(rows.every((item) => !item.detail.includes(coverage.sharedInternalBoundary.detail)));
  assert.ok(rows.every((item) => item.locator === coverage.sharedInternalBoundary.sourceLocator));
});

test("Explorer and supplemental morphology denominators remain separate and registry-derived", () => {
  const morphology = actualRecord("morphology_record:NeuroMorpho:109005");
  const profile = actualRecord("molecular_profile:sathyamurthy-2018:DE-1");
  const coverage = buildExactRecordDetailCoverage({
    indexState: { status: "ready", index: { records: [profile] }, records: [morphology, profile] },
    ...selected(morphology),
  });
  assert.equal(coverage.indexSummary.exactRecordCount, 1);
  assert.equal(coverage.indexSummary.supplementalRecordCount, 1);
  assert.equal(coverage.indexSummary.sourceMorphologyRecordCount, 0);
  assert.equal(coverage.indexSummary.supplementalMorphologyRecordCount, 1);
  assert.equal(coverage.indexSummary.admittedInternalObjectCount, 0);
  assert.equal(coverage.indexSummary.fallbackPrimitiveCount, 0);
});
