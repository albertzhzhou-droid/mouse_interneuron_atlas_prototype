import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildResearchRecordPresentation,
  MOLECULAR_COMPLETENESS_SLOT_IDS,
  rowsForPresentationIndices,
  selectMolecularCompletenessSlots,
  selectResearchNativeContourVisualization,
  selectResearchRecordScopedEvidenceReceipts,
  validateResearchRecordPresentation,
} from "../app/research-record-presentation.js";

const index = JSON.parse(await readFile(
  new URL("../public/data/research_explorer_index_v1/search-index.json", import.meta.url),
  "utf8",
));

function record(focusKind, focusId) {
  const value = index.records.find((candidate) => candidate.focusKind === focusKind && candidate.focusId === focusId);
  assert.ok(value, `Missing ${focusKind}:${focusId}`);
  return value;
}

function evidenceValue(value, label) {
  return value.evidence.find((row) => row.label === label)?.value;
}

test("every indexed record partitions evidence and missingness exactly once", () => {
  for (const value of index.records) {
    const presentation = validateResearchRecordPresentation(value);
    const evidenceIndices = [
      ...presentation.evidencePartition.identityEvidenceIndices,
      ...presentation.evidencePartition.recordSpecificEvidenceIndices,
      ...presentation.evidencePartition.sharedEvidenceIndices,
    ];
    const gapIndices = [
      ...presentation.missingnessPartition.recordSpecificGapIndices,
      ...presentation.missingnessPartition.sharedGapIndices,
    ];
    assert.deepEqual(evidenceIndices.toSorted((a, b) => a - b), value.evidence.map((_, index) => index));
    assert.deepEqual(gapIndices.toSorted((a, b) => a - b), value.gaps.map((_, index) => index));
  }
});

test("switching Sathyamurthy profiles replaces record facts while collapsing exact source context", () => {
  const de1 = record("molecular_profile", "sathyamurthy-2018:DE-1");
  const de2 = record("molecular_profile", "sathyamurthy-2018:DE-2");
  const rows = (value, partitionName) => rowsForPresentationIndices(
    value,
    value.presentation.evidencePartition[partitionName],
  );

  assert.equal(evidenceValue(de1, "Putative cell type"), "Grp");
  assert.equal(evidenceValue(de2, "Putative cell type"), "Npy1r");
  assert.equal(evidenceValue(de1, "Figure/source markers"), "Grp · Tacr3 · Reln");
  assert.equal(evidenceValue(de2, "Figure/source markers"), "Npy1r · Nmur2 · Car12");
  assert.equal(evidenceValue(de1, "Sampled nuclei"), "68 nuclei");
  assert.equal(evidenceValue(de2, "Sampled nuclei"), "80 nuclei");
  assert.ok(rows(de1, "identityEvidenceIndices").some((row) => row.label === "Figure/source markers"));
  assert.ok(rows(de2, "recordSpecificEvidenceIndices").some((row) => row.label === "Sampled nuclei"));
  assert.ok(rows(de1, "sharedEvidenceIndices").some((row) => row.label === "Source sample frame"));
  assert.equal(
    evidenceValue(de1, "Source sample frame"),
    evidenceValue(de2, "Source sample frame"),
    "identical dataset context should remain shared rather than being presented as a type difference",
  );

  for (const value of [de1, de2]) {
    assert.equal(value.presentation.modeling.route, "source_record_evidence_only");
    assert.equal(value.presentation.modeling.switchEffect, "clear_prior_cell_geometry_and_replace_source_record_evidence_model");
    assert.equal(value.presentation.modeling.admittedCellGeometryObjectCount, 0);
    assert.equal(value.presentation.modeling.admittedInternalObjectCount, 0);
    assert.equal(value.presentation.modeling.generatedFallbackPrimitiveCount, 0);
  }
});

test("distant Roome selections expose distinct quantitative and marker evidence without inventing shapes", () => {
  const a1 = record("molecular_profile", "roome-2026:GSE291462:dILA1-A1");
  const e1 = record("molecular_profile", "roome-2026:GSE291462:dILB6-E1");
  assert.notEqual(evidenceValue(a1, "Exact captured-cell count"), evidenceValue(e1, "Exact captured-cell count"));
  assert.notEqual(
    evidenceValue(a1, "Positive differential features meeting display thresholds"),
    evidenceValue(e1, "Positive differential features meeting display thresholds"),
  );
  assert.ok(a1.presentation.evidencePartition.sharedEvidenceIndices.includes(
    a1.evidence.findIndex((row) => row.label === "Experimental-unit boundary"),
  ));
  assert.equal(a1.presentation.modeling.admittedCellGeometryObjectCount, 0);
  assert.equal(e1.presentation.modeling.admittedCellGeometryObjectCount, 0);
});

test("only an exact morphology record receives the exact-source geometry route", () => {
  const morphology = record("morphology_record", "NeuroMorpho:109005");
  assert.equal(morphology.presentation.modeling.route, "exact_source_morphology");
  assert.equal(morphology.presentation.modeling.admittedCellGeometryObjectCount, 1);
  assert.equal(morphology.presentation.modeling.generatedFallbackPrimitiveCount, 0);
  assert.equal(morphology.presentation.modeling.switchEffect, "replace_with_exact_selected_source_geometry");
});

test("Todd presentation selectors expose exact record-scoped locators and separate native contour quantities", () => {
  const expected = new Map([
    ["NeuroMorpho:50424", [8, 427, "functional_class_observed_morphology_route_pack_v1"]],
    ["NeuroMorpho:50394", [14, 768, "prp_dorsal_horn_observed_morphology_route_pack_v1"]],
    ["NeuroMorpho:50408", [11, 709, "prp_dorsal_horn_observed_morphology_route_pack_v1"]],
  ]);
  for (const [focusId, [lineLoopCount, vertexCount, pathFragment]] of expected) {
    const morphology = record("morphology_record", focusId);
    const evidence = selectResearchRecordScopedEvidenceReceipts(morphology);
    const geometryReceipt = evidence.find((row) => row.label === "Geometry receipt");
    const nativeContour = selectResearchNativeContourVisualization(morphology);

    assert.ok(geometryReceipt);
    assert.equal(geometryReceipt.sourceLocator, morphology.morphologyMembership.geometryPath);
    assert.equal(nativeContour.lineLoopCount, lineLoopCount);
    assert.equal(nativeContour.vertexCount, vertexCount);
    assert.equal(nativeContour.authority, "OBS_SOURCE_NATIVE_MBF_CELL_BODY_LINE_LOOP");
    assert.match(nativeContour.sourceLocator, new RegExp(`${pathFragment}/native-contours/nmo-`));
    assert.equal(Object.isFrozen(nativeContour), true);
  }

  assert.deepEqual(selectResearchNativeContourVisualization(record("morphology_record", "NeuroMorpho:109005")), {
    lineLoopCount: 0,
    vertexCount: 0,
    authority: null,
    sourceLocator: null,
  });
});

test("presentation validation rejects promoted molecular geometry and incomplete partitions", () => {
  const source = record("molecular_profile", "sathyamurthy-2018:DE-1");
  const promoted = structuredClone(source);
  promoted.presentation.modeling.admittedCellGeometryObjectCount = 1;
  assert.throws(() => validateResearchRecordPresentation(promoted), /modeling presentation/i);

  const incomplete = structuredClone(source);
  incomplete.presentation.evidencePartition.sharedEvidenceIndices.pop();
  assert.throws(() => validateResearchRecordPresentation(incomplete), /evidence presentation partition/i);

  const rebuilt = buildResearchRecordPresentation(index.records, source);
  assert.deepEqual(rebuilt, source.presentation);
});

test("all ten molecular namespaces expose the same eight fixed completeness slots without silent omissions", () => {
  const molecularRecords = index.records.filter((value) => value.focusKind === "molecular_profile");
  const namespaces = [...new Set(molecularRecords.map((value) => value.namespace))];
  assert.deepEqual(namespaces.toSorted(), [
    "alkaslasi-2021:GSE167597",
    "cano-gomez-2026:GSE318731",
    "crozat-2025:figshare-29430869-v2",
    "delile-2019:E-MTAB-7320",
    "haring-2018:GSE103840",
    "hayashi-2018:GSE108788",
    "iglesias-gonzalez-2021:gse185731:mmusculus",
    "roome-2026:GSE291462",
    "russ-2021",
    "sathyamurthy-2018",
  ]);

  for (const value of molecularRecords) {
    const slots = selectMolecularCompletenessSlots(value);
    assert.deepEqual(slots.map((slot) => slot.slotId), MOLECULAR_COMPLETENESS_SLOT_IDS);
    assert.equal(slots.length, 8);
    assert.equal(slots.filter((slot) => slot.slotId === "cell_geometry" && slot.status === "missing").length, 1);
    assert.equal(slots.filter((slot) => slot.slotId === "internal_structure" && slot.status === "missing").length, 1);
    assert.equal(slots.filter((slot) => slot.slotId === "provenance" && slot.status === "available").length, 1);
    for (const slot of slots) {
      if (slot.status === "available") {
        assert.ok(Number.isInteger(slot.evidenceIndex));
        assert.equal(value.evidence[slot.evidenceIndex].label, slot.rowLabel);
        assert.equal(value.evidence[slot.evidenceIndex].authority, slot.authority);
        assert.equal(value.evidence[slot.evidenceIndex].locator, slot.locator);
        assert.ok(slot.authority.length > 0);
        assert.ok(slot.locator.length > 0);
      } else {
        assert.ok(slot.reasonCode.length > 0, `${value.focusId}:${slot.slotId} must retain a reason code`);
        assert.ok(slot.sourceLocator.length > 0, `${value.focusId}:${slot.slotId} must retain a source locator`);
      }
    }
  }
});

test("Russ, Delile and Crozat completeness preserves source-specific availability and missingness", () => {
  const bySlot = (value) => Object.fromEntries(
    selectMolecularCompletenessSlots(value).map((slot) => [slot.slotId, slot]),
  );

  const russ = bySlot(record("molecular_profile", "russ-2021:CSF-cN"));
  assert.equal(russ.sampling.status, "missing");
  assert.equal(russ.sampling.reasonCode, "not_ingested");
  assert.equal(russ.sampling.sourceLocator, "Results; Fig. 2");
  assert.equal(russ.markers.rowLabel, "Primary markers");
  assert.equal(russ.region.rowLabel, "Region class");
  assert.equal(russ.life_stage.rowLabel, "Life-stage scope");
  assert.equal(russ.transmitter.status, "available");

  const delile = bySlot(record("molecular_profile", "delile-2019:E-MTAB-7320:dl1.1"));
  assert.equal(delile.sampling.rowLabel, "Exact sampled-cell count");
  assert.equal(delile.markers.status, "missing");
  assert.equal(delile.markers.reasonCode, "exact_record_field_not_retained");
  assert.equal(delile.region.rowLabel, "DV field coverage");
  assert.equal(delile.life_stage.rowLabel, "Life-stage scope");
  assert.equal(delile.transmitter.status, "missing");
  assert.equal(delile.transmitter.reasonCode, "evidence_row_explicitly_not_established");
  assert.match(delile.transmitter.sourceLocator, /phenoData_annotated\.csv/);

  const crozat = bySlot(record("molecular_profile", "crozat-2025:figshare-29430869-v2:pkd2l1-csf-cn"));
  assert.equal(crozat.sampling.rowLabel, "Firing-pattern total");
  assert.equal(crozat.markers.rowLabel, "Source markers");
  assert.equal(crozat.region.rowLabel, "Spinal and anatomy context");
  assert.equal(crozat.life_stage.rowLabel, "Life-stage and preparation");
  assert.equal(crozat.transmitter.status, "available");
  assert.equal(crozat.cell_geometry.reasonCode, "repository_object_unavailable");
  assert.equal(crozat.internal_structure.reasonCode, "repository_object_unavailable");
});
