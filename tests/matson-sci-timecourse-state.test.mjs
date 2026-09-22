import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  filterMatsonPopulations,
  findMatsonPopulation,
  groupMatsonPopulations,
  normalizeMatsonSciTimepoint,
  populationReplicatesForTimepoint,
  populationTimepointObservation,
} from "../app/matson-sci-timecourse.js";

const timecourse = JSON.parse(await readFile(new URL("../data/matson-neuronal-sci-timecourse-0.1.json", import.meta.url), "utf8"));
const pdyn = timecourse.populations.find((population) => population.shortLabel === "Pdyn");

test("normalizes the five discrete SCI timepoints without interpolation", () => {
  assert.equal(normalizeMatsonSciTimepoint("uninjured"), "uninjured");
  assert.equal(normalizeMatsonSciTimepoint("3wpi"), "3wpi");
  assert.equal(normalizeMatsonSciTimepoint(["6wpi", "1dpi"]), "6wpi");
  assert.equal(normalizeMatsonSciTimepoint("2wpi"), "all");
  assert.equal(normalizeMatsonSciTimepoint(undefined), "all");
});

test("finds only an exact source-local Matson population focus", () => {
  assert.equal(findMatsonPopulation(timecourse.populations, pdyn.id).shortLabel, "Pdyn");
  assert.equal(findMatsonPopulation(timecourse.populations, "matson-2022:GSE172167:unknown"), null);
  assert.equal(findMatsonPopulation(timecourse.populations, ""), null);
});

test("filters and groups populations without merging source identities", () => {
  assert.deepEqual(filterMatsonPopulations(timecourse.populations, { query: "pdyn" }).map((population) => population.id), [pdyn.id]);
  assert.deepEqual(filterMatsonPopulations(timecourse.populations, { query: "Parm1" }).map((population) => population.id), [pdyn.id]);
  assert.deepEqual(filterMatsonPopulations(timecourse.populations, { query: "SDR42E2" }).map((population) => population.shortLabel), ["CSF-c"]);
  assert.equal(filterMatsonPopulations(timecourse.populations, { classFilter: "excitatory" }).length, 8);
  assert.equal(filterMatsonPopulations(timecourse.populations, { classFilter: "inhibitory" }).length, 8);
  assert.equal(filterMatsonPopulations(timecourse.populations, { classFilter: "motor_context" }).length, 1);
  assert.deepEqual(groupMatsonPopulations(timecourse.populations).map((group) => [group.id, group.populations.length]), [
    ["excitatory", 8],
    ["inhibitory", 8],
    ["motor_context", 1],
  ]);
});

test("returns exact timepoint and replicate observations for the focused population", () => {
  assert.deepEqual(populationTimepointObservation(pdyn, "3wpi"), {
    timepointId: "3wpi",
    count: 328,
    capturedNeuronalNucleiDenominator: 6735,
    shareOfCapturedNeuronalNuclei: 0.048701,
  });
  assert.deepEqual(populationReplicatesForTimepoint(pdyn, timecourse.samples, "3wpi").map((item) => [item.sampleId, item.count, item.capturedNeuronalNucleiDenominator]), [
    ["D-25", 67, 1504],
    ["D-26", 157, 3295],
    ["D-29", 104, 1936],
  ]);
  assert.equal(populationTimepointObservation(pdyn, "all"), null);
  assert.deepEqual(populationReplicatesForTimepoint(pdyn, timecourse.samples, "all"), []);
});
