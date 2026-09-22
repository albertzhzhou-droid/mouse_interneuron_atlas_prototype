import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateMatsonSciTimecourse } from "../scripts/validate-matson-neuronal-sci-timecourse-0.1.mjs";

const timecourse = JSON.parse(await readFile(new URL("../data/matson-neuronal-sci-timecourse-0.1.json", import.meta.url), "utf8"));

test("locks five Matson timepoints, 15 cords, 17 populations and zero registrations", async () => {
  const result = await validateMatsonSciTimecourse(timecourse);
  assert.deepEqual(result, {
    releaseId: "ohri-matson-neuronal-sci-timecourse-0.2.0",
    timepointCount: 5,
    sampleCount: 15,
    populationCount: 17,
    rankedGeneRecordCount: 340,
    capturedNeuronalNucleiCount: 23651,
    projectRegistrationCount: 0,
  });
  assert.deepEqual(timecourse.timepoints.map((item) => [item.id, item.independentAnimalCount, item.capturedNeuronalNuclei]), [
    ["uninjured", 3, 3129],
    ["1dpi", 3, 4761],
    ["1wpi", 3, 4872],
    ["3wpi", 3, 6735],
    ["6wpi", 3, 4154],
  ]);
});

test("retains every population by all five timepoints and all 15 source samples", () => {
  assert.equal(timecourse.populations.length, 17);
  assert.equal(timecourse.populations.flatMap((population) => population.timepointCounts).length, 85);
  assert.equal(timecourse.populations.flatMap((population) => population.sampleCounts).length, 255);
  assert.ok(timecourse.populations.every((population) => population.timepointCounts.length === 5));
  assert.ok(timecourse.populations.every((population) => population.sampleCounts.length === 15));
  assert.equal(timecourse.populations.reduce((sum, population) => sum + population.capturedNeuronalNuclei, 0), 23651);
});

test("retains all 340 source-ranked genes with exact cells and no invented statistics", async () => {
  const pdyn = timecourse.populations.find((population) => population.shortLabel === "Pdyn");
  assert.deepEqual(pdyn.rankedMarkerPanel.rankedGenes.slice(0, 5), [
    { rank: 1, gene: "Gal", sourceCell: "K2" },
    { rank: 2, gene: "Pnoc", sourceCell: "K3" },
    { rank: 3, gene: "Ptprk", sourceCell: "K4" },
    { rank: 4, gene: "Zeb2", sourceCell: "K5" },
    { rank: 5, gene: "Pdyn", sourceCell: "K6" },
  ]);
  assert.deepEqual(pdyn.rankedMarkerPanel.rankedGenes.slice(-3), [
    { rank: 18, gene: "Nfib", sourceCell: "K19" },
    { rank: 19, gene: "Mlxipl", sourceCell: "K20" },
    { rank: 20, gene: "Pax8", sourceCell: "K21" },
  ]);
  assert.deepEqual(timecourse.populations.find((population) => population.shortLabel === "CSF-c").rankedMarkerPanel.rankedGenes.at(-1),
    { rank: 20, gene: "SDR42E2", sourceCell: "P21" });
  assert.equal(timecourse.populations.flatMap((population) => population.rankedMarkerPanel.rankedGenes).length, 340);
  assert.equal(pdyn.rankedMarkerPanel.sourceRankCount, 20);
  assert.equal(pdyn.rankedMarkerPanel.retainedRankCount, 20);
  assert.equal(pdyn.rankedMarkerPanel.scoreAvailable, false);
  assert.equal(pdyn.rankedMarkerPanel.pValueAvailable, false);
  assert.equal(timecourse.rankedMarkerPanelProvenance.derivedPanelSha256, "7b071d49c43816321fb24a3c31fb9282abf559d9b990a48549278410e85769a4");
  assert.equal(timecourse.sourceConflicts.length, 6);

  const inventedScore = structuredClone(timecourse);
  inventedScore.populations[0].rankedMarkerPanel.scoreAvailable = true;
  await assert.rejects(() => validateMatsonSciTimecourse(inventedScore), /statistics were invented|const/i);

  const inventedStatistic = structuredClone(timecourse);
  inventedStatistic.populations[0].rankedMarkerPanel.rankedGenes[0].pValue = 0.01;
  await assert.rejects(() => validateMatsonSciTimecourse(inventedStatistic), /additionalProperties|must NOT have additional properties/i);

  const removedConflict = structuredClone(timecourse);
  removedConflict.sourceConflicts.pop();
  await assert.rejects(() => validateMatsonSciTimecourse(removedConflict), /six declared Matson source conflicts|minItems/i);
});

test("rejects incomplete, reordered, duplicated, altered or mislocated ranked-marker panels", async () => {
  const missingRank = structuredClone(timecourse);
  missingRank.populations[0].rankedMarkerPanel.rankedGenes.pop();
  await assert.rejects(() => validateMatsonSciTimecourse(missingRank), /20 ranked genes|minItems/i);

  const duplicateRank = structuredClone(timecourse);
  duplicateRank.populations[0].rankedMarkerPanel.rankedGenes[19].rank = 19;
  await assert.rejects(() => validateMatsonSciTimecourse(duplicateRank), /ranked marker order drift/i);

  const reordered = structuredClone(timecourse);
  [reordered.populations[0].rankedMarkerPanel.rankedGenes[3], reordered.populations[0].rankedMarkerPanel.rankedGenes[4]] = [
    reordered.populations[0].rankedMarkerPanel.rankedGenes[4],
    reordered.populations[0].rankedMarkerPanel.rankedGenes[3],
  ];
  await assert.rejects(() => validateMatsonSciTimecourse(reordered), /ranked marker order drift|source-cell order drift/i);

  const alteredGene = structuredClone(timecourse);
  alteredGene.populations[0].rankedMarkerPanel.rankedGenes[19].gene = "Invented20";
  await assert.rejects(() => validateMatsonSciTimecourse(alteredGene), /panel content drift|SHA-256 drift/i);

  const wrongRange = structuredClone(timecourse);
  wrongRange.populations[10].rankedMarkerPanel.rankCellRange = "J2:J21";
  await assert.rejects(() => validateMatsonSciTimecourse(wrongRange), /cell range drift/i);
});

test("rejects denominator, timepoint and per-sample observation drift", async () => {
  const denominator = structuredClone(timecourse);
  denominator.scope.capturedNeuronalNucleiCount += 1;
  await assert.rejects(() => validateMatsonSciTimecourse(denominator), /23,651|denominator/i);

  const timepoint = structuredClone(timecourse);
  timepoint.timepoints[1].capturedNeuronalNuclei += 1;
  await assert.rejects(() => validateMatsonSciTimecourse(timepoint), /timepoint neuronal|denominator drift/i);

  const sampleObservation = structuredClone(timecourse);
  sampleObservation.populations[0].sampleCounts[0].count += 1;
  await assert.rejects(() => validateMatsonSciTimecourse(sampleObservation), /sample counts do not sum|partition/i);
});

test("rejects source identity, rights and raw-file bundling promotion", async () => {
  const sourceHash = structuredClone(timecourse);
  sourceHash.source.sourceFiles[0].sha256 = "0".repeat(64);
  await assert.rejects(() => validateMatsonSciTimecourse(sourceHash), /SHA-256 drift/i);

  const bundled = structuredClone(timecourse);
  bundled.source.sourceFiles[0].bundled = true;
  await assert.rejects(() => validateMatsonSciTimecourse(bundled), /must not be bundled|const/i);

  const rights = structuredClone(timecourse);
  rights.source.sourceFiles[1].assetLevelReuseStatus = "permitted";
  await assert.rejects(() => validateMatsonSciTimecourse(rights), /reuse must not be assumed|const/i);
});

test("keeps 16 non-motor labels unresolved and motoneurons outside interneuron counts", async () => {
  assert.equal(timecourse.populations.filter((population) => population.projectUseClass === "source_local_spinal_neuron_population_local_vs_projection_unresolved").length, 16);
  assert.equal(timecourse.populations.filter((population) => population.projectUseClass === "motor_neuron_context_excluded_from_interneuron_count").length, 1);

  const promoted = structuredClone(timecourse);
  promoted.populations[0].projectUseClass = "confirmed_local_interneuron";
  await assert.rejects(() => validateMatsonSciTimecourse(promoted), /projectUseClass|16 non-motor/i);
});

test("keeps RAG, tracing and spinocerebellar evidence separate from population identity", async () => {
  assert.match(timecourse.rareStateEvidence.boundary, /not one of the 17 label-transfer population records/i);
  assert.match(timecourse.rareStateEvidence.boundary, /not same-cell joins/i);
  assert.match(timecourse.rareStateEvidence.boundary, /projection neurons, not local interneurons/i);

  const joined = structuredClone(timecourse);
  joined.rareStateEvidence.boundary = "RAG cluster 23 is identical to every Shox2 population and proves recovery.";
  await assert.rejects(() => validateMatsonSciTimecourse(joined), /RAG state must remain separate|unjoined|projection status/i);
});

test("rejects unsupported coordinate, morphology or synaptic relationship fields", async () => {
  for (const field of ["atlasTransform", "morphologyId", "sameCellId", "registeredCoordinate", "synapticPartnerId"]) {
    const mutated = structuredClone(timecourse);
    mutated.populations[0][field] = "unsupported";
    await assert.rejects(() => validateMatsonSciTimecourse(mutated), /additionalProperties|forbidden unsupported relationship/i);
  }
});
