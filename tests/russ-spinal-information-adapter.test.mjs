import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateRussSpinalInformationAdapter, russPrevalenceDisplay } from "../app/russ-spinal-information-adapter.js";
import { validateRussSpinalInformationFiles } from "../scripts/validate-russ-spinal-information-adapter-0.1.mjs";
import { selectMolecularCompletenessSlots } from "../app/research-record-presentation.js";
import { exportResearchRecordDossier, researchRecordDossierCsv } from "../app/research-record-source-scope.js";
import { selectResearchEvidencePreviewRows } from "../app/research-explorer-index.js";

const load = async (relative) => JSON.parse(await readFile(new URL(relative, import.meta.url), "utf8"));
const [adapter, taxonomy, index, registry] = await Promise.all([
  load("../data/russ-spinal-information-adapter-0.1.json"), load("../data/russ-harmonized-taxonomy-crosswalk-0.1.json"),
  load("../public/data/research_explorer_index_v1/search-index.json"), load("../data/research-source-registry-0.1.json"),
]);
const russ = index.records.filter((record) => record.namespace === "russ-2021");
const byLabel = new Map(adapter.populations.map((population) => [population.sourceLabelRaw, population]));
const field = (record, label) => record.evidence.find((row) => row.label === label);

test("attributed information adapter validates exact source bytes and deterministic offline replay", async () => {
  assert.equal(validateRussSpinalInformationAdapter(adapter, taxonomy), adapter);
  const receipt = await validateRussSpinalInformationFiles();
  assert.equal(receipt.exactSourceReplay, "passed");
  assert.deepEqual(receipt.sourceStudyTotals, [5473, 421, 1042, 11201, 1130, 86]);
  assert.equal(receipt.table1PopulationRows, 69);
  assert.equal(receipt.studyCountFields, 414);
  assert.equal(receipt.geoCellRosterAdmitted, false);
  assert.equal(receipt.broaderUpgradeCompletionClaimed, false);
});

test("all 69 unchanged record keys expose counts with mixed observation units, source locators and separate adult evidence", () => {
  assert.equal(russ.length, 69);
  assert.equal(index.counts.byFocusKind.molecular_profile, 387);
  assert.equal(index.records.length, 641);
  for (const record of russ) {
    const detail = byLabel.get(record.focusId.slice("russ-2021:".length));
    assert.equal(record.key, `molecular_profile:${detail.id}`);
    assert.equal(record.recordSemantics.unitOfObservation, "source_population");
    assert.equal(record.recordSemantics.cellRosterAvailability, "no_roster_retained");
    assert.equal(record.coordinate.registrationCount, 0);
    assert.equal(record.coordinate.geometryStatus, "TYPE_LEVEL");
    assert.equal(field(record, "Exact captured-cell/nucleus count").locator, detail.sequencingSampling.countLocator);
    assert.match(field(record, "Exact captured-cell/nucleus count").value, new RegExp(`^${detail.sequencingSampling.value} captured sequenced cells/nuclei`));
    assert.match(field(record, "Exact captured-cell/nucleus count").value, /denominator 19,353/);
    assert.equal(record.evidence.filter((row) => row.label.startsWith("Captured sequencing contribution · ")).length, 6);
    assert.equal(field(record, "Raw Table1 adult prevalence").value, russPrevalenceDisplay(detail.articleTable1.prevalence));
    const sampling = selectMolecularCompletenessSlots(record).find((slot) => slot.slotId === "sampling");
    assert.equal(sampling.status, "available");
    assert.equal(sampling.locator, detail.sequencingSampling.countLocator);
    assert.ok(record.gaps.some((gap) => gap.label === "Adult prevalence numerical denominator" && gap.inferenceAllowed === false));
    assert.ok(record.gaps.some((gap) => gap.label === "Sequenced-cell identity roster"));
    assert.ok(!record.gaps.some((gap) => gap.label === "Profile-specific sampling denominator"));
    assert.ok(record.provenance.objectHashes.some((object) => object.label === "data/russ-spinal-information-adapter-0.1.json"));
    assert.ok(selectResearchEvidencePreviewRows(record).some((row) => row.label === "Exact captured-cell/nucleus count"));
  }
});

test("ten panels are identical shared study rows while exact selected membership stays record-specific", () => {
  const canonical = russ[0].evidence.filter((row) => row.label.startsWith("Adult in situ panel context · "));
  assert.equal(canonical.length, 10);
  for (const record of russ) {
    assert.deepEqual(record.evidence.filter((row) => row.label.startsWith("Adult in situ panel context · ")), canonical);
    const sharedIndices = record.presentation.evidencePartition.sharedEvidenceIndices;
    for (const row of canonical) assert.ok(sharedIndices.includes(record.evidence.indexOf(field(record, row.label))));
    assert.ok(!sharedIndices.includes(record.evidence.indexOf(field(record, "Selected raw-label panel membership"))));
  }
  const motor = russ.find((record) => record.focusId === "russ-2021:MN-alpha");
  assert.match(field(motor, "Selected raw-label panel membership").value, /native alias not normalized/);
  assert.match(canonical[0].value, /MNa/);
  assert.match(canonical[0].value, /MNg/);
  assert.ok(canonical.every((row) => /cumulative single-cluster-or-related-pair fraction/.test(row.value)));
});

test("scientific dossier JSON and CSV include all panel context, source locators and the unresolved source discrepancy", () => {
  const record = russ.find((item) => item.focusId === "russ-2021:Excit-36");
  const dossier = exportResearchRecordDossier({ record, collection: index.records, baseIndex: index, registry, mvp: { conditions: [] } }, {
    applicationVersion: "I53-candidate", selectionGeneration: 53, requestedKey: record.key,
  });
  const csv = researchRecordDossierCsv(dossier);
  assert.equal(dossier.record.evidence.filter((row) => row.label.startsWith("Adult in situ panel context · ")).length, 10);
  assert.equal(dossier.sourceScope.physicalSpecimenIdentity.status, "not_established");
  assert.equal(dossier.sourceScope.relationship.samePhysicalObject, false);
  assert.equal(dossier.sourceScope.relationship.grantsGeometryTransfer, false);
  assert.equal(dossier.view.status, "not_included");
  assert.match(csv, /192 captured sequenced cells\/nuclei/);
  assert.match(csv, /2371 Supplement3 panel sum versus 2894 article counted total/);
  assert.match(csv, /MOESM6_ESM.xlsx#Sheet1!H/);
  assert.match(csv, /Adult in situ panel context · Set 10/);
  assert.match(csv, /body\/\/p\[@id='Par83'\]/);
  assert.throws(() => exportResearchRecordDossier({ record, collection: index.records, baseIndex: index, registry, mvp: { conditions: [] } }, {
    applicationVersion: "I53-candidate", selectionGeneration: 0, requestedKey: record.key,
  }), /current ready selection generation/);
});

test("blank, N/A and genuine zero stay distinct and raw panel colors do not become gene validation", () => {
  assert.equal(russPrevalenceDisplay(byLabel.get("PGC").articleTable1.prevalence), "Blank source value");
  assert.equal(russPrevalenceDisplay(byLabel.get("Excit-7").articleTable1.prevalence), "N/A (source text)");
  assert.match(russPrevalenceDisplay(byLabel.get("Excit-11").articleTable1.prevalence), /^0% /);
  const nos1 = adapter.adultValidationContext.panels.flatMap((panel) => panel.targetGenesRaw).filter((gene) => gene.raw === "Nos1");
  assert.equal(nos1.length, 2);
  assert.notDeepEqual(nos1[0].fontColorRaw, nos1[1].fontColorRaw);
  assert.ok(nos1.every((gene) => gene.validationStatus === "not_assessable_from_retained_color_legend"));
});

test("contract rejects adult denominator substitution, promoted validation, joins and admissions", () => {
  for (const [mutate, reason] of [
    [(value) => { value.populations[0].articleTable1.prevalence.numericalDenominator = 19353; }, /denominator substitution/],
    [(value) => { value.populations[0].sequencingSampling.byStudy[0].value += 1; }, /row total/],
    [(value) => { value.populations[0].sourceProfileJoin.samePhysicalCell = true; }, /physical-cell/],
    [(value) => { value.adultValidationContext.panels[0].targetGenesRaw[0].validationStatus = "verified"; }, /panel target/],
    [(value) => { value.admissionBoundary.atlasRegistrationCount = 1; }, /atlasRegistrationCount/],
    [(value) => { value.populations[0].articleTable1.putativeLineage.exactLineageAssignmentAllowed = true; }, /exact lineage/],
    [(value) => { value.adultValidationContext.countDiscrepancy.countsHarmonized = true; }, /reconciled without evidence/],
  ]) {
    const changed = structuredClone(adapter);
    mutate(changed);
    assert.throws(() => validateRussSpinalInformationAdapter(changed, taxonomy), reason);
  }
});
