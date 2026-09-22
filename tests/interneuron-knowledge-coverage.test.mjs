import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateInterneuronKnowledgeCoverage } from "../scripts/validate-interneuron-knowledge-coverage-0.1.mjs";

const coverage = JSON.parse(await readFile(new URL("../data/interneuron-knowledge-coverage-0.1.json", import.meta.url), "utf8"));

test("locks eight primary-source lanes, seven precision axes and zero project registrations", async () => {
  const result = await validateInterneuronKnowledgeCoverage(coverage);
  assert.deepEqual(result, {
    releaseId: "ohri-interneuron-knowledge-coverage-0.1.0",
    laneCount: 8,
    axisCount: 7,
    projectRegistrationCount: 0,
  });
  assert.deepEqual(coverage.lanes.map((lane) => lane.accessions.map((item) => item.id)), [
    ["GSE158380"],
    ["GSE103840"],
    ["GSE103892"],
    ["GSE108788"],
    ["E-MTAB-7320"],
    ["GSE234774", "GSE230765"],
    ["GSE185731"],
    ["GSE291462", "GSE291459", "GSE291460"],
  ]);
});

test("rejects cross-study identity, registration and asset-reuse promotion", async () => {
  const mapped = structuredClone(coverage);
  mapped.lanes[0].crossStudyMappingStatus = "established";
  await assert.rejects(() => validateInterneuronKnowledgeCoverage(mapped), /cross-study mapping/i);

  const registered = structuredClone(coverage);
  registered.lanes[1].projectRegistrationCount = 1;
  await assert.rejects(() => validateInterneuronKnowledgeCoverage(registered), /project registration count/i);

  const reused = structuredClone(coverage);
  reused.lanes[2].assetAccess.assetLevelReuseStatus = "permitted";
  await assert.rejects(() => validateInterneuronKnowledgeCoverage(reused), /asset-level reuse/i);
});

test("rejects a missing axis, causal-status drift and fabricated morphology coverage", async () => {
  const missing = structuredClone(coverage);
  missing.lanes[3].coverage.pop();
  await assert.rejects(() => validateInterneuronKnowledgeCoverage(missing), /every precision axis|coverage/i);

  const causal = structuredClone(coverage);
  causal.lanes[5].coverage.find((entry) => entry.axisId === "causal_mechanism").status = "contextual";
  await assert.rejects(() => validateInterneuronKnowledgeCoverage(causal), /causal-mechanism status/i);

  const unsupportedDirect = structuredClone(coverage);
  unsupportedDirect.lanes[0].coverage.find((entry) => entry.axisId === "causal_mechanism").status = "direct";
  await assert.rejects(() => validateInterneuronKnowledgeCoverage(unsupportedDirect), /causal-mechanism status/i);

  const morphology = structuredClone(coverage);
  morphology.lanes[0].coverage.find((entry) => entry.axisId === "morphology").status = "contextual";
  await assert.rejects(() => validateInterneuronKnowledgeCoverage(morphology), /morphology must remain not_measured/i);
});

test("keeps all gaps distinct from biological absence", () => {
  assert.match(coverage.statusSemantics.find((item) => item.id === "not_measured").meaning, /not biological absence/i);
  assert.ok(coverage.hardBoundaries.some((item) => /coverage gap, not evidence/i.test(item)));
  assert.ok(coverage.lanes.every((lane) => lane.cannotAnswer.length >= 3));
});

test("requires a publication locator for every project-curated coverage judgment", async () => {
  const entries = coverage.lanes.flatMap((lane) => lane.coverage);
  assert.equal(entries.length, 56);
  assert.ok(entries.every((entry) => typeof entry.sourceLocator === "string" && entry.sourceLocator.trim().length >= 20));
  assert.ok(entries.every((entry) => /Abstract|Results|Methods|Study|Fig\.|Supplement|Data availability|Activity-SEQ/i.test(entry.sourceLocator)));

  const missingLocator = structuredClone(coverage);
  delete missingLocator.lanes[0].coverage[0].sourceLocator;
  await assert.rejects(() => validateInterneuronKnowledgeCoverage(missingLocator), /source locator|sourceLocator/i);
});

test("locks the Iglesias González E14.5 Dmrt3/dI6 group-summary lane and its missing axes", async () => {
  const dmrt3 = coverage.lanes.find((lane) => lane.id === "iglesias-gonzalez-2021");
  assert.equal(dmrt3.doi, "10.3389/fncel.2021.781197");
  assert.deepEqual(dmrt3.accessions.map((item) => item.id), ["GSE185731"]);
  assert.deepEqual(dmrt3.sourceLocalLabels, ["M1", "M2", "M3", "M4", "M5", "M6"]);
  assert.match(dmrt3.sampleFrame, /three E14\.5 mouse embryos pooled into one tube and one library/i);
  assert.match(dmrt3.sampleFrame, /384 deposited wells.*354 QC-retained cells.*274 retained dI6-lineage cells/i);
  assert.match(dmrt3.sampleFrame, /no per-well M1–M6 roster or scalar pseudotime/i);
  assert.deepEqual(dmrt3.coverage.map((entry) => [entry.axisId, entry.status]), [
    ["type_taxonomy", "direct"],
    ["region_lamina_context", "contextual"],
    ["life_stage", "direct"],
    ["injury_state", "not_measured"],
    ["spatial_measurement", "not_measured"],
    ["causal_mechanism", "not_measured"],
    ["morphology", "not_measured"],
  ]);
  assert.match(dmrt3.coverage.find((entry) => entry.axisId === "type_taxonomy").evidence, /six source-local M1–M6.*274 retained cells/i);
  assert.match(dmrt3.coverage.find((entry) => entry.axisId === "region_lamina_context").displayBoundary, /does not supply a lamina, cell coordinate, atlas transform or registered three-dimensional location/i);
  assert.match(dmrt3.coverage.find((entry) => entry.axisId === "spatial_measurement").evidence, /no cell-coordinate or spatial-assay measurement/i);
  assert.ok(dmrt3.cannotAnswer.some((item) => /deposited well belongs to M1–M6.*scalar pseudotime/i.test(item)));
  assert.ok(dmrt3.cannotAnswer.some((item) => /adult or other-study type.*exactly identical/i.test(item)));
  assert.ok(dmrt3.cannotAnswer.some((item) => /atlas coordinates.*neurite geometry and internal structure/i.test(item)));

  const promotedSpatial = structuredClone(coverage);
  promotedSpatial.lanes.find((lane) => lane.id === "iglesias-gonzalez-2021").coverage.find((entry) => entry.axisId === "spatial_measurement").status = "contextual";
  await assert.rejects(() => validateInterneuronKnowledgeCoverage(promotedSpatial), /Dmrt3\/dI6 coverage statuses/i);

  const inventedRoster = structuredClone(coverage);
  inventedRoster.lanes.find((lane) => lane.id === "iglesias-gonzalez-2021").sampleFrame = "Three E14.5 mouse embryos pooled into one tube and one library; individual M1–M6 well assignments and pseudotime are available.";
  await assert.rejects(() => validateInterneuronKnowledgeCoverage(inventedRoster), /384.*354.*274|per-well roster/i);
});

test("locks the Roome 157-type lane while withholding morphology, internal objects and same-cell joins", async () => {
  const roome = coverage.lanes.find((lane) => lane.id === "roome-2026");
  assert.equal(roome.doi, "10.1126/science.adx5781");
  assert.deepEqual(roome.accessions.map((item) => item.id), ["GSE291462", "GSE291459", "GSE291460"]);
  assert.equal(roome.sourceLocalLabels.length, 12);
  assert.match(roome.sampleFrame, /15 biological litter pools.*29 technical outputs.*157 refined dIL types.*61,444 captured dIL cells/i);
  assert.deepEqual(roome.coverage.map((entry) => [entry.axisId, entry.status]), [
    ["type_taxonomy", "direct"],
    ["region_lamina_context", "contextual"],
    ["life_stage", "direct"],
    ["injury_state", "not_measured"],
    ["spatial_measurement", "not_ingested"],
    ["causal_mechanism", "not_measured"],
    ["morphology", "not_measured"],
  ]);
  assert.match(roome.coverage.find((entry) => entry.axisId === "spatial_measurement").displayBoundary, /different cells.*same-cell identity.*pseudo-depth.*3D registration/i);
  assert.match(roome.coverage.find((entry) => entry.axisId === "morphology").displayBoundary, /No soma, neurite, organelle, internal primitive or type-specific 3D form/i);

  const inventedMorphology = structuredClone(coverage);
  inventedMorphology.lanes.find((lane) => lane.id === "roome-2026").coverage.find((entry) => entry.axisId === "morphology").status = "direct";
  await assert.rejects(() => validateInterneuronKnowledgeCoverage(inventedMorphology), /morphology must remain not_measured/i);
});

test("retains Hayashi P0 coverage and rejects an adult category for Häring", () => {
  const hayashi = coverage.lanes.find((lane) => lane.id === "hayashi-2018");
  const haring = coverage.lanes.find((lane) => lane.id === "haring-2018");
  assert.match(hayashi.sampleFrame, /P0.*two neonates.*one 10x library.*949 cells/i);
  assert.match(hayashi.coverage.find((entry) => entry.axisId === "type_taxonomy").displayBoundary, /must not be presented as deposited per-cell identities/i);
  assert.match(haring.sampleFrame, /P17–P28/);
  assert.doesNotMatch(haring.sampleFrame, /^Adult\b/);
  assert.match(haring.coverage.find((entry) => entry.axisId === "life_stage").displayBoundary, /does not assert an adult/i);
});

test("retains the corrected Tabulae citation and source-specific direct causal experiment", () => {
  const tabulae = coverage.lanes.find((lane) => lane.id === "tabulae-paralytica-2024");
  assert.match(tabulae.citation, /Nature 631, 150–163 \(2024\)/);
  const causal = tabulae.coverage.find((entry) => entry.axisId === "causal_mechanism");
  assert.equal(causal.status, "direct");
  assert.match(causal.evidence, /AAV-DTR.*two weeks before complete crush SCI.*diphtheria toxin.*at eight weeks.*ablate thoracic Vsx2ON neurons.*prevented natural walking recovery/i);
  assert.match(causal.sourceLocator, /Extended Data Fig\. 3j.?l.*AAV-DTR two weeks before complete crush SCI.*diphtheria toxin at eight weeks.*Supplementary Video 2.*prevents natural recovery of walking/i);
  assert.match(causal.displayBoundary, /specific to its Vsx2ON definition, injury model, vector and toxin timing, and outcome/i);
});

test("locks the primary-article locator corrections used by the coverage matrix", () => {
  const lane = (laneId) => coverage.lanes.find((item) => item.id === laneId);
  const locator = (laneId, axisId) => lane(laneId).coverage.find((entry) => entry.axisId === axisId).sourceLocator;

  assert.equal(locator("russ-2021", "type_taxonomy"), "Results — Overview of harmonized neuronal cell types; Fig. 2; Supplementary Figs. 4–5; Supplementary Table 2");
  assert.equal(locator("russ-2021", "region_lamina_context"), "Results — Overview and detailed cluster validation; Fig. 2e; Fig. 4d–f; Table 1; Supplementary Fig. 9");
  assert.equal(locator("russ-2021", "life_stage"), "Results — merged postnatal datasets, Fig. 1a; adult L4 validation, Fig. 4d–f and Supplementary Fig. 9");
  assert.equal(locator("russ-2021", "spatial_measurement"), "Abstract and Results — adult in situ mapping; Fig. 2e; Fig. 4d–f; Table 1; Supplementary Fig. 9");
  assert.equal(locator("sathyamurthy-2018", "type_taxonomy"), "Results — Census of Adult Spinal Cord Neuronal Populations; Figs. 2 and 4; Table S2");
  assert.equal(locator("sathyamurthy-2018", "causal_mechanism"), "Results — snRNA-seq Following Behavior Identified Active Neurons; Fig. 5; Fig. S4");
  assert.match(locator("tabulae-paralytica-2024", "causal_mechanism"), /Extended Data Fig\. 3j.?l.*two weeks before complete crush SCI.*diphtheria toxin at eight weeks.*Supplementary Video 2/i);
});
