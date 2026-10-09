import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  RESEARCH_SELECTION_DELTA_BOUNDARY,
  RESEARCH_SELECTION_DELTA_CONTRACT_ID,
  RESEARCH_SELECTION_DELTA_DISCLAIMER,
  advanceResearchSelectionDeltaStream,
  buildResearchSelectionDeltaReceipt,
  createResearchSelectionDeltaStreamState,
  visibleResearchSelectionDeltaReceipt,
} from "../app/research-selection-delta.js";

const index = JSON.parse(await readFile(
  new URL("../public/data/research_explorer_index_v1/search-index.json", import.meta.url),
  "utf8",
));

function record(focusKind, focusId) {
  const value = index.records.find((candidate) => (
    candidate.focusKind === focusKind && candidate.focusId === focusId
  ));
  assert.ok(value, `Missing ${focusKind}:${focusId}`);
  return value;
}

function ready(value, generation) {
  return Object.freeze({
    generation,
    requestKey: value.key,
    focusKind: value.focusKind,
    focusId: value.focusId,
    status: "ready",
    record: value,
    error: "",
  });
}

function verifying(value, generation) {
  return Object.freeze({
    generation,
    requestKey: value.key,
    focusKind: value.focusKind,
    focusId: value.focusId,
    status: "verifying",
    record: null,
    error: "",
  });
}

function unavailable(value, generation) {
  return Object.freeze({
    generation,
    requestKey: value.key,
    focusKind: value.focusKind,
    focusId: value.focusId,
    status: "unavailable",
    record: null,
    error: "Exact record unavailable",
  });
}

const de1 = record("molecular_profile", "sathyamurthy-2018:DE-1");
const de2 = record("molecular_profile", "sathyamurthy-2018:DE-2");
const de3 = record("molecular_profile", "sathyamurthy-2018:DE-3");
const russ = record("molecular_profile", "russ-2021:CSF-cN");
const delile = record("molecular_profile", "delile-2019:E-MTAB-7320:dl1.1");
const morphology = record("morphology_record", "NeuroMorpho:109005");
const todd50424 = record("morphology_record", "NeuroMorpho:50424");
const todd50394 = record("morphology_record", "NeuroMorpho:50394");
const todd50408 = record("morphology_record", "NeuroMorpho:50408");

test("same-namespace adjacent records compare all eight slots and retain exact locators", () => {
  const receipt = buildResearchSelectionDeltaReceipt(de1, de2, {
    previousGeneration: 11,
    currentGeneration: 12,
  });

  assert.equal(receipt.contractId, RESEARCH_SELECTION_DELTA_CONTRACT_ID);
  assert.equal(receipt.mode, "ADJACENT_VERIFIED_SELECTION_PRESENTATION_AUDIT");
  assert.equal(receipt.previous.key, de1.key);
  assert.equal(receipt.current.key, de2.key);
  assert.deepEqual(receipt.selectionGeneration, { previous: 11, current: 12 });
  assert.deepEqual(receipt.namespace, {
    previous: "sathyamurthy-2018",
    current: "sathyamurthy-2018",
    changed: false,
  });
  assert.equal(receipt.fixedSlots.status, "compared");
  assert.equal(receipt.fixedSlots.comparedSlotCount, 8);
  assert.equal(receipt.fixedSlots.changedSlotCount, 2);
  assert.deepEqual(receipt.fixedSlots.changedSlots.map((slot) => slot.slotId), ["sampling", "markers"]);
  assert.ok(receipt.fixedSlots.changedSlots.every((slot) => (
    slot.previous.sourceLocator.length > 0 && slot.current.sourceLocator.length > 0
  )));
  assert.equal(receipt.sharedContext.status, "compared_same_namespace");
  assert.equal(receipt.sharedContext.unchangedRowCount, 5);
  assert.ok(receipt.sharedContext.unchangedRows.every((row) => row.sourceLocator.length > 0));
  assert.equal(receipt.disclaimer, RESEARCH_SELECTION_DELTA_DISCLAIMER);
  assert.equal(receipt.boundary, RESEARCH_SELECTION_DELTA_BOUNDARY);
  assert.equal(receipt.boundary.relationshipAdmissionCount, 0);
  assert.equal(Object.isFrozen(receipt), true);
});

test("cross-namespace receipt preserves source-specific availability, missingness and locators", () => {
  const receipt = buildResearchSelectionDeltaReceipt(russ, delile);
  const changed = Object.fromEntries(receipt.fixedSlots.changedSlots.map((slot) => [slot.slotId, slot]));

  assert.equal(receipt.namespace.changed, true);
  assert.equal(receipt.sharedContext.status, "not_compared_different_namespace");
  assert.equal(receipt.sharedContext.unchangedRowCount, 0);
  assert.equal(changed.sampling.previous.status, "available");
  assert.equal(changed.sampling.previous.reasonCode, null);
  assert.match(changed.sampling.previous.sourceLocator, /MOESM6_ESM\.xlsx#Sheet1!H/);
  assert.equal(changed.sampling.current.status, "available");
  assert.match(changed.sampling.current.sourceLocator, /phenoData_annotated\.csv/);
  assert.equal(changed.markers.previous.status, "available");
  assert.equal(changed.markers.current.status, "missing");
  assert.equal(changed.markers.current.reasonCode, "exact_record_field_not_retained");
  assert.match(changed.markers.current.sourceLocator, /phenoData_annotated\.csv/);
  assert.equal(changed.transmitter.previous.status, "available");
  assert.equal(changed.transmitter.current.status, "missing");
  assert.equal(changed.transmitter.current.reasonCode, "evidence_row_explicitly_not_established");
  assert.match(changed.transmitter.current.sourceLocator, /phenoData_annotated\.csv/);
});

test("molecular-to-morphology receipt reports only visualization authority outside the molecular slot contract", () => {
  const receipt = buildResearchSelectionDeltaReceipt(de1, morphology);
  const counts = Object.fromEntries(receipt.visualizationAuthority.counts.map((item) => [item.id, item]));

  assert.equal(receipt.fixedSlots.status, "not_applicable");
  assert.equal(receipt.fixedSlots.reasonCode, "fixed_slots_defined_for_molecular_profiles_only");
  assert.equal(receipt.fixedSlots.comparedSlotCount, 0);
  assert.equal(counts.admitted_cell_geometry.previousCount, 0);
  assert.equal(counts.admitted_cell_geometry.currentCount, 1);
  assert.equal(counts.admitted_cell_geometry.difference, 1);
  assert.equal(counts.admitted_cell_geometry.changed, true);
  for (const countId of ["admitted_internal", "generated_fallback", "registration", "same_cell_join"]) {
    assert.equal(counts[countId].previousCount, 0);
    assert.equal(counts[countId].currentCount, 0);
    assert.equal(counts[countId].changed, false);
  }
  assert.equal(receipt.visualizationAuthority.changedCount, 1);
  assert.equal(receipt.boundary.morphologyCausation, false);
  assert.equal(receipt.boundary.sameCellEvidence, false);
});

test("Todd morphology switches retain exact record locators and native LineLoop/vertex deltas", () => {
  const cases = [
    [todd50424, todd50394, 8, 14, 427, 768],
    [todd50394, todd50408, 14, 11, 768, 709],
  ];

  for (const [previous, current, previousLoops, currentLoops, previousVertices, currentVertices] of cases) {
    const receipt = buildResearchSelectionDeltaReceipt(previous, current);
    const counts = Object.fromEntries(receipt.visualizationAuthority.counts.map((item) => [item.id, item]));
    const geometryReceipt = receipt.recordScopedEvidence.changedRows.find((row) => row.label === "Geometry receipt");

    assert.equal(receipt.fixedSlots.status, "not_applicable");
    assert.equal(receipt.recordScopedEvidence.status, "compared_morphology_records");
    assert.ok(receipt.recordScopedEvidence.changedRowCount > 0);
    assert.ok(geometryReceipt);
    assert.equal(geometryReceipt.previous.sourceLocator, previous.morphologyMembership.geometryPath);
    assert.equal(geometryReceipt.current.sourceLocator, current.morphologyMembership.geometryPath);
    assert.ok(geometryReceipt.changedFields.includes("sourceLocator"));

    assert.equal(counts.source_native_line_loop.previousCount, previousLoops);
    assert.equal(counts.source_native_line_loop.currentCount, currentLoops);
    assert.equal(counts.source_native_line_loop.difference, currentLoops - previousLoops);
    assert.equal(counts.source_native_line_loop_vertex.previousCount, previousVertices);
    assert.equal(counts.source_native_line_loop_vertex.currentCount, currentVertices);
    assert.equal(counts.source_native_line_loop_vertex.difference, currentVertices - previousVertices);
    assert.match(counts.source_native_line_loop.previousSourceLocator, /native-contours\/nmo-/);
    assert.match(counts.source_native_line_loop.currentSourceLocator, /native-contours\/nmo-/);
    assert.equal(counts.source_native_line_loop.previousAuthority, "OBS_SOURCE_NATIVE_MBF_CELL_BODY_LINE_LOOP");
    assert.equal(counts.source_native_line_loop.currentAuthority, "OBS_SOURCE_NATIVE_MBF_CELL_BODY_LINE_LOOP");
    assert.equal(receipt.summary.changedVisualizationAuthorityCount, 2);
    assert.equal(receipt.summary.changedRecordScopedEvidenceRowCount, receipt.recordScopedEvidence.changedRowCount);
    assert.equal(receipt.boundary.morphologyCausation, false);
    assert.equal(receipt.boundary.sameCellEvidence, false);
    assert.equal(receipt.boundary.relationshipAdmissionCount, 0);
  }
});

test("A-ready to B-verifying to B-ready produces one adjacent verified receipt with shared objects", () => {
  let state = createResearchSelectionDeltaStreamState();
  state = advanceResearchSelectionDeltaStream(state, ready(de1, 1));
  assert.equal(state.receipt, null);
  assert.equal(state.readyRecord, de1);

  const checkingB = verifying(de2, 2);
  state = advanceResearchSelectionDeltaStream(state, checkingB);
  assert.equal(state.receipt, null);
  assert.equal(state.readyRecord, null);
  assert.equal(state.previousReadyRecord, de1);
  assert.equal(visibleResearchSelectionDeltaReceipt(state, checkingB), null);

  const readyB = ready(de2, 2);
  state = advanceResearchSelectionDeltaStream(state, readyB);
  assert.equal(state.readyRecord, de2);
  assert.equal(state.previousReadyRecord, de1);
  assert.equal(state.receipt.previous.key, de1.key);
  assert.equal(state.receipt.current.key, de2.key);
  assert.equal(visibleResearchSelectionDeltaReceipt(state, readyB), state.receipt);
});

test("unavailable is a comparison barrier so A cannot bridge across failed B to C", () => {
  let state = createResearchSelectionDeltaStreamState();
  state = advanceResearchSelectionDeltaStream(state, ready(de1, 1));
  state = advanceResearchSelectionDeltaStream(state, verifying(de2, 2));
  state = advanceResearchSelectionDeltaStream(state, unavailable(de2, 2));
  assert.equal(state.receipt, null);
  assert.equal(state.previousReadyRecord, null);
  assert.equal(visibleResearchSelectionDeltaReceipt(state, unavailable(de2, 2)), null);

  state = advanceResearchSelectionDeltaStream(state, verifying(de3, 3));
  state = advanceResearchSelectionDeltaStream(state, ready(de3, 3));
  assert.equal(state.receipt, null);
  assert.equal(state.previousReadyRecord, null);
});

test("unverified attempts and same-key revalidation never create a new receipt", () => {
  let state = createResearchSelectionDeltaStreamState();
  state = advanceResearchSelectionDeltaStream(state, verifying(de1, 1));
  state = advanceResearchSelectionDeltaStream(state, ready(de1, 1));
  assert.equal(state.receipt, null);

  const sameObservation = advanceResearchSelectionDeltaStream(state, ready(de1, 1));
  assert.equal(sameObservation, state);

  state = advanceResearchSelectionDeltaStream(state, verifying(de1, 2));
  state = advanceResearchSelectionDeltaStream(state, ready(de1, 2));
  assert.equal(state.receipt, null);
  assert.equal(state.previousReadyRecord, de1);
});

test("a superseded verifying attempt does not break adjacency between verified-ready selections", () => {
  let state = createResearchSelectionDeltaStreamState();
  state = advanceResearchSelectionDeltaStream(state, ready(de1, 1));
  state = advanceResearchSelectionDeltaStream(state, verifying(de2, 2));
  state = advanceResearchSelectionDeltaStream(state, verifying(de3, 3));
  assert.equal(state.receipt, null);
  assert.equal(state.previousReadyRecord, de1);

  const readyC = ready(de3, 3);
  state = advanceResearchSelectionDeltaStream(state, readyC);
  assert.equal(state.receipt.previous.key, de1.key);
  assert.equal(state.receipt.current.key, de3.key);
  assert.equal(visibleResearchSelectionDeltaReceipt(state, readyC), state.receipt);
});

test("receipt visibility is fail-closed for loading, unavailable, stale key and stale generation", () => {
  let state = createResearchSelectionDeltaStreamState();
  state = advanceResearchSelectionDeltaStream(state, ready(de1, 1));
  state = advanceResearchSelectionDeltaStream(state, verifying(de2, 2));
  state = advanceResearchSelectionDeltaStream(state, ready(de2, 2));
  assert.ok(state.receipt);

  assert.equal(visibleResearchSelectionDeltaReceipt(state, verifying(de3, 3)), null);
  assert.equal(visibleResearchSelectionDeltaReceipt(state, unavailable(de3, 3)), null);
  assert.equal(visibleResearchSelectionDeltaReceipt(state, ready(de3, 3)), null);
  assert.equal(visibleResearchSelectionDeltaReceipt(state, ready(de2, 4)), null);
});

test("receipt construction rejects noncanonical ready identities and invalid modeling counts", () => {
  assert.equal(buildResearchSelectionDeltaReceipt(de1, de1), null);
  assert.throws(
    () => buildResearchSelectionDeltaReceipt({ ...de1, key: "molecular_profile:wrong" }, de2),
    /canonical research focus key/,
  );
  assert.throws(
    () => buildResearchSelectionDeltaReceipt(de1, {
      ...de2,
      presentation: {
        ...de2.presentation,
        modeling: { ...de2.presentation.modeling, sameCellJoinCount: -1 },
      },
    }),
    /sameCellJoinCount/,
  );
  assert.throws(
    () => advanceResearchSelectionDeltaStream(createResearchSelectionDeltaStreamState(), {
      ...ready(de1, 1),
      requestKey: de2.key,
    }),
    /exactly match/,
  );

  const invalidSharedLocator = structuredClone(de2);
  const sharedIndex = invalidSharedLocator.presentation.evidencePartition.sharedEvidenceIndices
    .find((indexValue) => invalidSharedLocator.evidence[indexValue].label === "Record granularity");
  assert.ok(Number.isInteger(sharedIndex));
  invalidSharedLocator.evidence[sharedIndex].locator = "";
  assert.throws(
    () => buildResearchSelectionDeltaReceipt(de1, invalidSharedLocator),
    /Shared source context requires exact labeled evidence/,
  );

  const invalidMorphologyLocator = structuredClone(todd50394);
  const geometryIndex = invalidMorphologyLocator.evidence.findIndex((row) => row.label === "Geometry receipt");
  assert.ok(geometryIndex >= 0);
  invalidMorphologyLocator.evidence[geometryIndex].locator = "";
  assert.throws(
    () => buildResearchSelectionDeltaReceipt(todd50424, invalidMorphologyLocator),
    /Record-scoped evidence requires exact labeled rows/,
  );
});

test("the evidence rail is the single receipt UI location and consumes the provider stream", async () => {
  const paths = {
    provider: new URL("../app/ResearchActiveRecordProvider.tsx", import.meta.url),
    evidence: new URL("../app/ResearchFocusEvidencePanel.tsx", import.meta.url),
    receipt: new URL("../app/ResearchSelectionDeltaReceipt.tsx", import.meta.url),
    explorer: new URL("../app/ResearchExplorer.tsx", import.meta.url),
    model: new URL("../app/ResearchRecordModelReadout.tsx", import.meta.url),
  };
  const sources = Object.fromEntries(await Promise.all(
    Object.entries(paths).map(async ([name, path]) => [name, await readFile(path, "utf8")]),
  ));

  assert.match(sources.provider, /advanceResearchSelectionDeltaStream\(\s*previous\.selectionDeltaStream,\s*storedActiveRecord/);
  assert.match(sources.provider, /visibleResearchSelectionDeltaReceipt\(runtime\.selectionDeltaStream, activeRecord\)/);
  assert.match(sources.provider, /selectionDelta,/);
  assert.equal((sources.evidence.match(/<ResearchSelectionDeltaReceipt \/>/g) ?? []).length, 1);
  assert.match(sources.evidence, /<VerifiedResearchFocusShell><VerifiedResearchRecord record=\{activeRecord\.record\} \/><\/VerifiedResearchFocusShell>/);
  assert.match(sources.receipt, /activeRecord\.status !== "ready" \|\| !selectionDelta/);
  assert.match(sources.receipt, /slot\.sourceLocator/);
  assert.match(sources.receipt, /recordScopedEvidence\.changedRows/);
  assert.match(sources.receipt, /row\.sourceLocator/);
  assert.match(sources.receipt, /item\.previousSourceLocator/);
  assert.match(sources.receipt, /Visualization-authority counts/);
  assert.match(sources.receipt, /Source namespaces differ/);
  assert.match(sources.receipt, /<strong>\{receipt\.disclaimer\}<\/strong>/);
  assert.doesNotMatch(sources.explorer, /ResearchSelectionDeltaReceipt/);
  assert.doesNotMatch(sources.model, /ResearchSelectionDeltaReceipt/);
});
