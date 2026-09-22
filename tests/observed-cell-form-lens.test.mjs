import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateObservedCellFormLens } from "../scripts/validate-observed-cell-form-lens-0.1.mjs";

const contract = JSON.parse(
  await readFile(new URL("../data/observed-cell-form-lens-0.1.json", import.meta.url), "utf8"),
);

test("locks the five source-observed cell forms and zero-relationship rendering contract", async () => {
  const report = await validateObservedCellFormLens(contract);
  assert.deepEqual(report, {
    releaseId: "ohri-observed-cell-form-lens-0.1.0",
    recordCount: 5,
    sourceBytes: 984826,
    sourceSha256: "6ba511fb2eb4dc23c20f4415c079cebe5bab565279f63fc72dc1c98ee6bd4330",
    projectRegistrationCount: 0,
    exactCrossSourceIdentityCount: 0,
  });
  assert.deepEqual(contract.records.map((record) => record.neuronId), [104003, 108974, 109005, 242822, 260150]);
  assert.ok(contract.records.every((record) => record.geometryStatus === "OBS"));
  assert.ok(contract.records.every((record) => record.registrationStatus === "unregistered"));
});

test("rejects promotion of a source-local cell form to atlas registration or selected-entity morphology", async () => {
  const registered = structuredClone(contract);
  registered.renderingContract.observedCellFormLane.projectRegistrationCount = 1;
  await assert.rejects(() => validateObservedCellFormLens(registered), /registration count must remain zero|must be equal to constant/);

  const linked = structuredClone(contract);
  linked.renderingContract.observedCellFormLane.coordinateRelationshipToPopulationEvidence = "selected_entity_identity";
  await assert.rejects(() => validateObservedCellFormLens(linked), /must not gain an evidence-entity relationship|must be equal to constant/);
});

test("rejects synthetic population nodes that masquerade as observed cell morphology", async () => {
  const falseCell = structuredClone(contract);
  falseCell.renderingContract.populationEvidenceLane.cellMorphologyClaim = true;
  await assert.rejects(() => validateObservedCellFormLens(falseCell), /population evidence lane must remain a non-cell SYN node|must be equal to constant/);
});

test("rejects phenotype or source-segment drift", async () => {
  const drifted = structuredClone(contract);
  drifted.records[2].segmentCount = 10312;
  await assert.rejects(() => validateObservedCellFormLens(drifted), /109005 segment count changed/);

  const relabeled = structuredClone(contract);
  relabeled.records[0].phenotype = "canonical inhibitory cluster";
  await assert.rejects(() => validateObservedCellFormLens(relabeled), /104003 phenotype changed/);
});
