import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { parseSwcText, validateSpatialAssets } from "../scripts/validate-spatial-assets.mjs";

const atlasManifest = JSON.parse(
  await readFile(new URL("../public/data/allen_cord_20um_v3_0/asset-manifest.json", import.meta.url), "utf8"),
);
const contours = JSON.parse(
  await readFile(new URL("../public/data/allen_cord_20um_v3_0/atlas-contours.json", import.meta.url), "utf8"),
);
const internalCompartments = JSON.parse(
  await readFile(
    new URL("../public/data/allen_cord_20um_v3_0/atlas-internal-compartments.json", import.meta.url),
    "utf8",
  ),
);
const fineAnatomy = JSON.parse(
  await readFile(
    new URL("../public/data/allen_cord_20um_v3_0/atlas-fine-anatomy.json", import.meta.url),
    "utf8",
  ),
);
const morphologyManifest = JSON.parse(
  await readFile(
    new URL("../public/data/neuromorpho_release_8_6_124/asset-manifest.json", import.meta.url),
    "utf8",
  ),
);
const morphologyLines = JSON.parse(
  await readFile(
    new URL("../public/data/neuromorpho_release_8_6_124/morphology-lines.json", import.meta.url),
    "utf8",
  ),
);
const provenanceDocument = await readFile(
  new URL("../docs/SPATIAL_ASSET_PROVENANCE.md", import.meta.url),
  "utf8",
);
const rightsLedger = await readFile(new URL("../docs/RIGHTS_LEDGER.csv", import.meta.url), "utf8");

test("validates every declared spatial asset and locks the manifest checksums", async () => {
  const report = await validateSpatialAssets();
  assert.equal(report.atlas.manifestSha256, "75aa6dc5cbeb05b52eff2266751a700cced23c9b1ea2f880bede19bd03e225c8");
  assert.equal(report.atlas.sourceManifestSha256, "95f305de7b19274908ac5dd24abfa5a0e6544effad1bfdd7d542b177a27cfad1");
  assert.equal(report.neuromorpho.manifestSha256, "4ee24a35b282376ee507c0218806671b9c9f6f18c820d2ffaa298a53162a8647");
  assert.equal(report.neuromorpho.derivedLinesSha256, "6ba511fb2eb4dc23c20f4415c079cebe5bab565279f63fc72dc1c98ee6bd4330");
  assert.equal(report.atlas.declaredFileCount, 119);
  assert.equal(report.atlas.pngCount, 38);
  assert.equal(report.atlas.fillOverlayCount, 76);
  assert.ok(report.atlas.pngs.every((png) => png.width === 644 && png.height === 506 && png.nonBlank));
});

test("freezes the adult-mouse atlas coordinate and INF derivation contract", () => {
  assert.equal(atlasManifest.atlas, "allen_cord_20um");
  assert.equal(atlasManifest.atlasVersion, "3.0");
  assert.equal(atlasManifest.atlasApiVersion, "3.0.1");
  assert.deepEqual(atlasManifest.shapeZyx, [1567, 253, 322]);
  assert.deepEqual(atlasManifest.resolutionUmZyx, [20, 10, 10]);
  assert.equal(atlasManifest.orientation, "asr");
  assert.equal(atlasManifest.geometryStatus, "INF");
  assert.equal(atlasManifest.displayTransformUse, "visualization_only_not_cell_registration");
  assert.deepEqual(atlasManifest.registrationError, { value: null, missingReason: "not_applicable" });

  assert.equal(contours.geometryStatus, "INF");
  assert.deepEqual(contours.inputs, [
    "allen_spinal_cord-adult-mouse-annotation:2021",
    "allen_spinal_cord-adult-mouse-nissl-template:2021",
  ]);
  assert.match(contours.method, /sampled native transverse planes/i);
  assert.match(contours.method, /annotation>0/i);
  assert.match(contours.method, /4-voxel stride/i);
  assert.deepEqual(contours.confidence, { value: null, missingReason: "not_measured" });
  assert.equal(contours.measurementUse, "forbidden");
  assert.ok(contours.planes.every((plane) => plane.segment.value === null));
  assert.ok(contours.planes.every((plane) => plane.segment.missingReason === "pending_curation"));

  assert.equal(internalCompartments.geometryStatus, "INF");
  assert.equal(internalCompartments.measurementUse, "forbidden");
  assert.equal(internalCompartments.registrationCount, 0);
  assert.deepEqual(
    internalCompartments.structures.map((structure) => structure.identifier),
    [90, 100, 110, 16, 74, 75, 70],
  );
  assert.ok(
    internalCompartments.structures.every(
      (structure) =>
        structure.planes.length === 38 &&
        structure.planes.every(
          (plane) => plane.segment.value === null && plane.segment.missingReason === "pending_curation",
        ),
    ),
  );
  assert.equal(
    internalCompartments.structures.flatMap((structure) => structure.planes).filter((plane) => plane.presence === "missing")
      .length,
    3,
  );
  assert.equal(internalCompartments.structures.flatMap((structure) => structure.planes.flatMap((plane) => plane.components)).length, 973);

  assert.equal(fineAnatomy.geometryStatus, "INF");
  assert.equal(fineAnatomy.measurementUse, "forbidden");
  assert.equal(fineAnatomy.registrationCount, 0);
  assert.equal(fineAnatomy.structures.length, 37);
  assert.equal(fineAnatomy.structuralContextStructures.length, 3);
  assert.equal(fineAnatomy.motorContextStructures.length, 33);
  assert.equal(fineAnatomy.lanePolicy.allDirectStructureCount, 73);
  assert.equal(fineAnatomy.lanePolicy.atlasRegionCountsAreInterneuronCounts, false);
  assert.equal(fineAnatomy.lanePolicy.motorContextDefaultVisibility, "off");
  assert.equal(fineAnatomy.lanePolicy.motorContextIncludedInInterneuronCounts, false);
  assert.equal(fineAnatomy.sourceInventory.directLeafEqualityValidated, true);
  assert.equal(fineAnatomy.sourceInventory.hierarchyOnlyDirectVoxelCount, 0);
  assert.equal(fineAnatomy.sourceStateCoverage.distinctSourceStateCount, 32);
  assert.equal(fineAnatomy.sourceStateCoverage.coveredDistinctStateCount, 32);
  assert.equal(fineAnatomy.fillOverlayPolicy.lanes.length, 2);
  assert.ok(fineAnatomy.fillOverlayPolicy.lanes.every((lane) => lane.includedInInterneuronCounts === false));
  assert.deepEqual(fineAnatomy.samplingSummary.categoryCounts, {
    lamina: 14,
    nucleus_or_column: 17,
    tract: 6,
  });
  assert.equal(fineAnatomy.samplingSummary.componentCount, 2431);
  assert.equal(fineAnatomy.samplingSummary.polygonCount, 2511);
  assert.equal(fineAnatomy.samplingSummary.missingPlaneRecordCount, 670);
  assert.deepEqual(fineAnatomy.samplingSummary.fullyUnsampledStructureIdentifiers, []);
  assert.ok(fineAnatomy.structures.every((structure) => structure.selectionMode === "exact_identifier"));
  assert.ok(fineAnatomy.structures.every((structure) => !structure.rootIdentifierPath.includes(120)));
});

test("keeps exactly five NeuroMorpho exemplars as OBS local and unregistered", async () => {
  const report = await validateSpatialAssets();
  assert.deepEqual(
    report.neuromorpho.records.map((record) => record.neuronId),
    [104003, 108974, 109005, 242822, 260150],
  );
  assert.ok(report.neuromorpho.records.every((record) => record.geometryStatus === "OBS"));
  assert.ok(report.neuromorpho.records.every((record) => record.registrationStatus === "unregistered"));
  assert.match(morphologyManifest.selection, /not a representative sample/i);
  assert.match(morphologyLines.warning, /not a representative census/i);
  assert.match(morphologyLines.warning, /not registered to allen_cord_20um/i);

  for (const record of morphologyManifest.records) {
    assert.match(record.sourceFrame, /local_frame/i);
    assert.equal(record.atlasTransform.value, null);
    assert.equal(record.atlasTransform.missingReason, "asset_unavailable");
    assert.equal(record.atlasPlacement.value, null);
    assert.equal(record.scientificUse, "morphology_illustration_only_not_spatial_query");
    assert.equal(record.qc.sevenColumns, true);
    assert.equal(record.qc.finite, true);
    assert.equal(record.qc.uniqueNodeIds, true);
    assert.equal(record.qc.parentsPresent, true);
    assert.equal(record.qc.singleRoot, true);
    assert.equal(record.qc.acyclic, true);
    assert.equal(record.qc.positiveRadius, true);
    assert.equal(record.qc.domainMatchesTypes, true);
  }
});

test("SWC parser rejects malformed columns, duplicate ids, cycles, non-finite values, and invalid radii", () => {
  assert.throws(() => parseSwcText("1 1 0 0 0 1", "columns"), /expected 7 columns/);
  assert.throws(
    () => parseSwcText("1 1 0 0 0 1 -1\n1 3 1 0 0 1 1", "duplicate"),
    /duplicate node id/,
  );
  assert.throws(
    () => parseSwcText("1 1 0 0 0 1 -1\n2 3 1 0 0 1 3\n3 3 2 0 0 1 2", "cycle"),
    /cycle/,
  );
  assert.throws(() => parseSwcText("1 1 NaN 0 0 1 -1", "finite"), /non-finite/);
  assert.throws(() => parseSwcText("1 1 0 0 0 0 -1", "radius"), /radius must be positive/);
});

test("documents versions, sources, rights, regeneration, and scientific limitations", () => {
  assert.match(provenanceDocument, /BrainGlobe atlas version \| `3\.0`/);
  assert.match(provenanceDocument, /Repository release: `8\.6\.124`/);
  assert.match(provenanceDocument, /registry\.opendata\.aws\/brainglobe/);
  assert.match(provenanceDocument, /data\.mendeley\.com\/datasets\/4rrggzv5d5\/1/);
  assert.match(provenanceDocument, /neuromorpho\.org\/useterm\.jsp/);
  assert.match(provenanceDocument, /tools\/build_atlas_reference\.py/);
  assert.match(provenanceDocument, /tools\/build_morphology_assets\.py/);
  assert.match(provenanceDocument, /not a representative sample/i);
  assert.match(provenanceDocument, /registrationStatus` is `unregistered`/);
  assert.match(provenanceDocument, /atlasTransform\.value` is `null`/);
  assert.match(provenanceDocument, /## 4\. Scientific limitations/);
  assert.match(rightsLedger, /BrainGlobe allen_cord_20um assets,atlas 3\.0 with 2021 components,yes/);
  assert.match(rightsLedger, /NeuroMorpho\.Org SWC exemplars,release 8\.6\.124 snapshot 2026-08-17,yes/);
  assert.match(rightsLedger, /CC BY-NC-ND 4\.0,not copied into bundle/);
});

test("passes the standalone spatial-asset validator", () => {
  const scriptPath = new URL("../scripts/validate-spatial-assets.mjs", import.meta.url).pathname;
  const result = spawnSync(process.execPath, [scriptPath], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Spatial asset validation passed/);
  assert.match(result.stdout, /38 non-blank 644x506 reference PNG planes/);
  assert.match(result.stdout, /76 exact 322x253 RGBA fill overlays/);
  assert.match(result.stdout, /Fine anatomy: 37 browser IDs \+ 3 structural-context IDs \+ 33 off-by-default motor-context IDs/);
  assert.match(result.stdout, /5 checksum-verified OBS local exemplars/);
  assert.match(result.stdout, /all unregistered with null atlas transforms/);
});
