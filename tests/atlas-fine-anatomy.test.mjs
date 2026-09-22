import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  ATLAS_DIRECT_LEAF_STRUCTURE_IDS,
  ATLAS_MOTOR_CONTEXT_STRUCTURE_IDS,
  ATLAS_STRUCTURAL_CONTEXT_STRUCTURE_IDS,
  buildAtlasFineAnatomyGeometry,
} from "../app/atlas-reference-geometry.js";

const fineAnatomy = JSON.parse(
  await readFile(
    new URL("../public/data/allen_cord_20um_v3_0/atlas-fine-anatomy.json", import.meta.url),
    "utf8",
  ),
);

test("locks the 37-browser + 3-structural + 33-motor exact-label partition", () => {
  const report = buildAtlasFineAnatomyGeometry(fineAnatomy);
  assert.equal(report.structureCount, 37);
  assert.deepEqual(report.categoryCounts, { lamina: 14, nucleus_or_column: 17, tract: 6 });
  assert.equal(report.planeCount, 38);
  assert.equal(report.totalComponentCount, 2431);
  assert.equal(report.totalContourCount, 2511);
  assert.equal(report.missingPlaneCount, 670);
  assert.equal(report.directLeafStructureCount, 73);
  assert.equal(report.structuralContextStructureCount, 3);
  assert.equal(report.motorContextStructureCount, 33);
  assert.deepEqual(
    report.structuralContextStructures.map((structure) => structure.identifier),
    ATLAS_STRUCTURAL_CONTEXT_STRUCTURE_IDS,
  );
  assert.deepEqual(
    report.motorContextStructures.map((structure) => structure.identifier),
    ATLAS_MOTOR_CONTEXT_STRUCTURE_IDS,
  );
  assert.ok(
    [...report.structuralContextStructures, ...report.motorContextStructures].every(
      (structure) => structure.sampledPlaneSummary.presentPlaneCount > 0,
    ),
  );
  assert.deepEqual(fineAnatomy.sourceInventory.directLeafIdentifiers, ATLAS_DIRECT_LEAF_STRUCTURE_IDS);
  assert.deepEqual(fineAnatomy.sourceInventory.annotationNonzeroIdentifiers, ATLAS_DIRECT_LEAF_STRUCTURE_IDS);
  assert.equal(fineAnatomy.sourceInventory.hierarchyOnlyDirectVoxelCount, 0);
  assert.equal(report.sourceStateCount, 32);
  assert.equal(report.fillOverlayCount, 76);
  assert.deepEqual(
    report.fillOverlayLanes.map((lane) => [lane.laneId, lane.defaultVisibility, lane.includedInInterneuronCounts]),
    [
      ["interneuron_focused_plus_structural_context", "on", false],
      ["motor_context", "off", false],
    ],
  );
  assert.equal(fineAnatomy.lanePolicy.atlasRegionCountsAreInterneuronCounts, false);
  assert.deepEqual(report.fullyUnsampledStructureIdentifiers, []);
  assert.equal(report.geometryStatus, "INF");
  assert.equal(report.measurementUse, "forbidden");
  assert.equal(report.registrationCount, 0);
});

test("distinguishes sampled-plane missingness from full-volume source presence", () => {
  const report = buildAtlasFineAnatomyGeometry(fineAnatomy);
  for (const identifier of [25, 67]) {
    const structure = report.structures.find((candidate) => candidate.identifier === identifier);
    assert.ok(structure.fullVolumeDiagnostic.voxelCount > 0);
    assert.equal(structure.fullVolumeDiagnostic.presence, "present");
    assert.ok(structure.sampledPlaneSummary.presentPlaneCount > 0);
    assert.ok(structure.sampledPlaneSummary.missingPlaneCount > 0);
  }
});

test("passes the standalone fine-anatomy validator", () => {
  const scriptPath = new URL("../scripts/validate-atlas-fine-anatomy.mjs", import.meta.url).pathname;
  const result = spawnSync(process.execPath, [scriptPath], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /37 exact source IDs/);
  assert.match(result.stdout, /3 structural-context and 33 off-by-default motor-context IDs/);
  assert.match(result.stdout, /38 ordered planes/);
  assert.match(result.stdout, /32\/32 exact source states/);
  assert.match(result.stdout, /76 native RGBA fills/);
  assert.match(result.stdout, /all targets sampled/);
  assert.match(result.stdout, /0 REG/);
});
