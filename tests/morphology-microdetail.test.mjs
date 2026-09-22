import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  MORPHOLOGY_MICRODETAIL_AXIS_ORDER,
  MORPHOLOGY_MICRODETAIL_INTERNAL_AXIS_IDS,
  buildMorphologyMicrodetailCoverage,
} from "../app/morphology-microdetail.js";

const census = JSON.parse(await readFile(new URL("../public/data/neuromorpho_release_8_6_124_census_v1/census-index.json", import.meta.url), "utf8"));
const byId = new Map(census.records.map((record) => [record.neuronId, record]));

function axis(coverage, id) {
  return coverage.axes.find((candidate) => candidate.id === id);
}

test("builds 13 explicit structural axes for every admitted reconstruction", () => {
  const coverage = census.records.map(buildMorphologyMicrodetailCoverage);
  assert.equal(coverage.length, 142);
  assert.ok(coverage.every((item) => item.axes.map((itemAxis) => itemAxis.id).join("|") === MORPHOLOGY_MICRODETAIL_AXIS_ORDER.join("|")));
  assert.ok(coverage.every((item) => item.coverageStatus === "verified" && item.admissionConflicts.length === 0));
  assert.ok(coverage.every((item) => item.registrationCount === 0 && item.sameSpecimenInternalPrimitiveCount === 0));
  assert.ok(coverage.every((item) => MORPHOLOGY_MICRODETAIL_INTERNAL_AXIS_IDS.every((id) => axis(item, id).status === "UNAVAILABLE")));
});

test("separates observed axon fields, authorized radius derivatives, and official No Diameter records", () => {
  const axonRecord = buildMorphologyMicrodetailCoverage(byId.get(109005));
  const noAxonRecord = buildMorphologyMicrodetailCoverage(byId.get(104003));
  const noDiameterRecord = buildMorphologyMicrodetailCoverage(byId.get(260150));
  assert.equal(axis(axonRecord, "axon_field").status, "OBS");
  assert.match(axis(axonRecord, "axon_field").limitation, /never claimed complete/i);
  assert.equal(axis(noAxonRecord, "axon_field").status, "UNAVAILABLE");
  assert.equal(axis(axonRecord, "radius_derived_surface").status, "DERIVED");
  assert.equal(axis(noDiameterRecord, "diameter_input").status, "UNAVAILABLE");
  assert.equal(axis(noDiameterRecord, "radius_derived_surface").status, "UNAVAILABLE");
  assert.match(axis(noDiameterRecord, "radius_derived_surface").basis, /source_diameter_required/);
});

test("never promotes standardized soma samples into a contour or membrane", () => {
  for (const neuronId of [104003, 108974, 109005, 242822, 260150]) {
    const coverage = buildMorphologyMicrodetailCoverage(byId.get(neuronId));
    assert.equal(axis(coverage, "soma_contour").status, "UNAVAILABLE");
    assert.equal(axis(coverage, "plasma_membrane").status, "UNAVAILABLE");
    assert.equal(axis(coverage, "nucleus").status, "UNAVAILABLE");
  }
});

test("fails topology and QC receipt conflicts closed without crashing the coverage UI", () => {
  for (const mutate of [
    (record) => { record.geometry.sha256 = "0".repeat(64); },
    (record) => { record.geometry.rawSwcSha256 = "1".repeat(64); },
    (record) => { record.qc.status = "failed"; },
    (record) => { record.morphometrics.computed.topologySha256 = null; },
    (record) => { record.morphometrics.computed.segmentCount = 0; },
  ]) {
    const record = structuredClone(byId.get(109005));
    mutate(record);
    const coverage = buildMorphologyMicrodetailCoverage(record);
    assert.equal(coverage.coverageStatus, "conflict_fail_closed");
    assert.equal(axis(coverage, "centerline_topology").status, "UNAVAILABLE");
    assert.equal(axis(coverage, "radius_derived_surface").status, "UNAVAILABLE");
  }
});

test("cross-checks diameter attributes, flags and derived summaries before authorizing a surface", () => {
  const contradictoryDiameter = structuredClone(byId.get(109005));
  contradictoryDiameter.normalizedMetadata.attributes = "No Diameter, 3D, Angles";
  let coverage = buildMorphologyMicrodetailCoverage(contradictoryDiameter);
  assert.equal(coverage.coverageStatus, "conflict_fail_closed");
  assert.equal(axis(coverage, "diameter_input").status, "UNAVAILABLE");
  assert.equal(axis(coverage, "radius_derived_surface").status, "UNAVAILABLE");

  const placeholderPromotion = structuredClone(byId.get(260150));
  placeholderPromotion.morphometrics.computed.radiusDerived = {
    value: { minimumMicrometre: 0.1, maximumMicrometre: 5, meanMicrometre: 0.3 },
    missingReason: null,
  };
  coverage = buildMorphologyMicrodetailCoverage(placeholderPromotion);
  assert.equal(coverage.coverageStatus, "conflict_fail_closed");
  assert.equal(axis(coverage, "radius_derived_surface").status, "UNAVAILABLE");
  assert.match(axis(coverage, "radius_derived_surface").basis, /conflict_fail_closed/);
});

test("does not turn soma scalars, axon nodes, or marker labels into unsupported micro-detail", () => {
  const record = structuredClone(byId.get(109005));
  record.morphometrics.sourceReported.somaSurface.value = 999999;
  record.morphometrics.computed.nodeTypeCounts["1"] = 999;
  record.morphometrics.computed.nodeTypeCounts["2"] = 999999;
  record.normalizedMetadata.cellType.push("GlyR stain", "nuclear marker");
  const coverage = buildMorphologyMicrodetailCoverage(record);
  for (const id of ["soma_contour", "plasma_membrane", "nucleus", "organelles", "synaptic_boutons", "receptor_distribution", "synaptic_partners"]) {
    assert.equal(axis(coverage, id).status, "UNAVAILABLE");
  }
});

test("fails a non-null atlas transform or placement closed", () => {
  for (const key of ["atlasTransform", "atlasPlacement"]) {
    const record = structuredClone(byId.get(104003));
    record.missingness[key] = { value: { invented: true }, missingReason: null };
    const coverage = buildMorphologyMicrodetailCoverage(record);
    assert.equal(coverage.coverageStatus, "conflict_fail_closed");
    assert.equal(coverage.registrationCount, null);
    assert.equal(axis(coverage, "atlas_placement").status, "UNAVAILABLE");
    assert.match(axis(coverage, "atlas_placement").basis, /conflict_fail_closed/);
  }
});
