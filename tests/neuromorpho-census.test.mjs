import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createResearchMvpValidator } from "../scripts/validate-json-schema.mjs";
import {
  parseCensusSwc,
  validateNeuromorphoCensus,
} from "../scripts/validate-neuromorpho-census.mjs";

const BASE_URL = new URL(
  "../public/data/neuromorpho_release_8_6_124_census_v1/",
  import.meta.url,
);
const index = JSON.parse(await readFile(new URL("census-index.json", BASE_URL), "utf8"));
const manifest = JSON.parse(await readFile(new URL("asset-manifest.json", BASE_URL), "utf8"));
const snapshot = JSON.parse(await readFile(new URL("official-query-snapshot.json", BASE_URL), "utf8"));
const quarantine = JSON.parse(await readFile(new URL("quarantine-report.json", BASE_URL), "utf8"));
const schema = JSON.parse(
  await readFile(new URL("../schemas/neuromorpho-census-v1.schema.json", import.meta.url), "utf8"),
);

test("validates the pinned 142-record census and locks its generated roots", async () => {
  const result = await validateNeuromorphoCensus();
  assert.equal(result.queryRecordCount, 142);
  assert.equal(result.admittedGeometryCount, 142);
  assert.equal(result.quarantinedGeometryCount, 0);
  assert.equal(result.geometry3DCount, 140);
  assert.equal(result.geometry2DCount, 2);
  assert.equal(
    result.indexSha256,
    "1598b5119f5826719e390fe46615a291b51fa3cd7716e9a191ad645f73165364",
  );
  assert.equal(
    result.manifestSha256,
    "2c1153fe86e3bc2f08505cf2416ab25b2d8e9ca747b0bffcfad5aacc9286cf91",
  );
  assert.equal(
    index.snapshot.sha256,
    "f35f1755885ca495ab3fecb2385e797eaeec3dc56d684413a8324a2e9297113b",
  );
  assert.equal(index.snapshot.retrievalEvidence, "Wed, 26 Aug 2026 23:52:32 GMT");
});

test("preserves the complete official API page and every raw record", () => {
  assert.equal(snapshot.page.totalElements, 142);
  assert.equal(snapshot.page.totalPages, 1);
  assert.equal(snapshot.page.number, 0);
  assert.equal(snapshot._embedded.neuronResources.length, 142);
  assert.equal(index.records.length, 142);
  assert.deepEqual(
    index.records.map((record) => record.officialMetadata),
    snapshot._embedded.neuronResources,
  );
  assert.equal(new Set(index.records.map((record) => record.neuronId)).size, 142);
  assert.equal(new Set(index.records.map((record) => record.normalizedMetadata.name)).size, 142);
  assert.ok(index.records.every((record) => record.officialMetadata.physical_Integrity));
  assert.ok(index.records.every((record) => record.sourcePaper.pmids.length === 1));
  assert.ok(index.records.every((record) => record.sourcePaper.dois.length === 1));
});

test("reports source concentration and morphology eligibility with fixed denominators", () => {
  assert.deepEqual(index.summary.byArchive, [
    { value: "Todd", count: 140 },
    { value: "Chen_Dai", count: 2 },
  ]);
  assert.deepEqual(index.summary.bySecondaryType, [
    { value: "Excitatory", count: 125 },
    { value: "Inhibitory", count: 15 },
    { value: null, count: 2 },
  ]);
  assert.deepEqual(index.summary.byDomain, [
    { value: "Dendrites, Soma, No Axon", count: 95 },
    { value: "Dendrites, Soma, Axon", count: 45 },
    { value: "Neurites, Soma", count: 2 },
  ]);
  assert.deepEqual(index.summary.byPhysicalIntegrity, [
    { value: "Dendrites Complete", count: 79 },
    { value: "Dendrites & Axon Moderate", count: 45 },
    { value: "Dendrites Moderate", count: 16 },
    { value: "Neurites Moderate", count: 2 },
  ]);
  assert.deepEqual(index.summary.byAttributes, [
    { value: "Diameter, 3D, Angles", count: 92 },
    { value: "No Diameter, 3D, Angles", count: 48 },
    { value: "Diameter, 2D, Angles", count: 2 },
  ]);
  assert.deepEqual(index.summary.bySourcePaper.map((paper) => paper.count), [77, 30, 18, 15, 2]);
  assert.equal(index.summary.sourceDiameterAvailableCount, 94);
  assert.equal(index.summary.sourceDiameterUnavailableCount, 48);
  assert.equal(index.summary.numericAgeReportedCount, 32);
  assert.equal(index.summary.numericAgeMissingCount, 110);
  assert.equal(index.summary.registrationCount, 0);
  assert.deepEqual(index.summary.duplicateRawSwcGroups, []);
  assert.deepEqual(index.summary.duplicateCanonicalGeometryGroups, []);
  assert.ok(
    index.records
      .filter((record) => record.normalizedMetadata.domain === "Dendrites, Soma, Axon")
      .every((record) => record.normalizedMetadata.physicalIntegrity === "Dendrites & Axon Moderate"),
  );
});

test("admits 142 independently lazy, source-local, unregistered geometry assets", () => {
  assert.equal(index.summary.admittedGeometryCount, 142);
  assert.equal(index.summary.quarantinedGeometryCount, 0);
  assert.ok(index.records.every((record) => record.geometry.available));
  assert.ok(
    index.records.every(
      (record) => record.geometry.path === `geometry/nmo-${record.neuronId}.json`,
    ),
  );
  assert.ok(
    index.records.every(
      (record) => record.geometry.rawSwcPath === `swc/nmo-${record.neuronId}.swc`,
    ),
  );
  assert.ok(index.records.every((record) => record.qc.status === "passed"));
  assert.ok(index.records.every((record) => record.qc.errors.length === 0));
  assert.ok(index.records.every((record) => record.normalizedMetadata.registrationStatus === "unregistered"));
  assert.ok(index.records.every((record) => record.missingness.atlasTransform.value === null));
  assert.ok(index.records.every((record) => record.missingness.atlasPlacement.value === null));
  assert.equal(manifest.files.filter((file) => file.kind === "standardized_swc").length, 142);
  assert.equal(manifest.files.filter((file) => file.kind === "lazy_geometry").length, 142);
  assert.equal(manifest.files.length, 287);
  assert.equal(quarantine.quarantinedGeometryCount, 0);
  assert.deepEqual(quarantine.records, []);
});

test("keeps both Chen_Dai 2D type-6 reconstructions uninterpreted", async () => {
  const chenRecords = index.records.filter((record) => record.normalizedMetadata.archive === "Chen_Dai");
  assert.deepEqual(chenRecords.map((record) => record.neuronId), [194468, 194469]);
  assert.ok(chenRecords.every((record) => record.normalizedMetadata.dimensionality === "2D"));
  for (const record of chenRecords) {
    const geometryText = await readFile(new URL(record.geometry.path, BASE_URL), "utf8");
    const geometry = JSON.parse(geometryText);
    assert.ok(geometry.swc.nodeTypeCounts["6"] > 0);
    assert.equal(
      geometry.swc.type6Policy,
      "preserve_uninterpreted_never_infer_axon_or_dendrite",
    );
    assert.ok(
      geometry.segments
        .filter((segment) => segment[8] === 6)
        .every((segment) => segment[9] === "uninterpreted_neurite_type_6"),
    );
    assert.ok(geometry.nodes.every((node) => node[4] === 0));
    assert.equal(geometry.registration.registrationCount, 0);
    assert.equal(geometry.displayTransform.use, "viewer_only");
  }
});

test("does not emit radius-derived claims for the 48 no-diameter records", async () => {
  const noDiameterRecords = index.records.filter(
    (record) => !record.normalizedMetadata.sourceDiameterAvailable,
  );
  assert.equal(noDiameterRecords.length, 48);
  for (const record of noDiameterRecords) {
    assert.equal(record.morphometrics.computed.radiusDerived.value, null);
    assert.equal(
      record.morphometrics.computed.radiusDerived.missingReason,
      "official_attributes_report_no_diameter",
    );
    const geometry = JSON.parse(await readFile(new URL(record.geometry.path, BASE_URL), "utf8"));
    assert.equal(geometry.morphometrics.computedFromStandardizedSwc.radiusDerived.value, null);
    assert.equal(
      geometry.morphometrics.computedFromStandardizedSwc.radiusDerived.missingReason,
      "official_attributes_report_no_diameter",
    );
  }
});

test("retains explicit missingness, rights, and query-complete-not-biologically-complete scope", () => {
  assert.equal(
    index.records.filter((record) => record.missingness.numericAge.value === null).length,
    110,
  );
  assert.ok(index.records.every((record) => record.missingness.donorId.value === null));
  assert.ok(index.records.every((record) => record.missingness.specimenId.value === null));
  assert.ok(index.records.every((record) => record.missingness.originalMorphologyFile.value === null));
  assert.ok(index.records.every((record) => record.missingness.standardizationLog.value === null));
  assert.equal(
    index.scientificBoundary.scope,
    "query_complete_for_pinned_release_not_biologically_complete_census",
  );
  assert.equal(index.scientificBoundary.type6Policy, "preserve_uninterpreted_never_infer_axon_or_dendrite");
  assert.match(index.rights.license, /CC BY 4\.0/);
  assert.ok(index.rights.requiredCitations.some((citation) => citation.includes("RRID:SCR_002145")));
  assert.ok(
    index.rights.requiredCitations.some((citation) => citation.includes("10.1096/fba.2024-00048")),
  );
  assert.match(index.rights.programmaticAccess, /no JSP scraping/i);
});

test("schema rejects registration and lazy-path drift", () => {
  const validate = createResearchMvpValidator(schema);
  const mutated = structuredClone(index);
  mutated.scientificBoundary.registrationCount = 1;
  mutated.records[0].geometry.path = "../escaped.json";
  assert.equal(validate(mutated), false);
});

test("census SWC parser accepts type 6 but rejects malformed topology", () => {
  const parsed = parseCensusSwc("1 1 0 0 0 1 -1\n2 6 1 0 0 0.5 1\n", "type6");
  assert.equal(parsed.nodeTypeCounts[6], 1);
  assert.equal(parsed.segmentRows[0][9], "uninterpreted_neurite_type_6");
  assert.throws(() => parseCensusSwc("1 1 0 0 0 1", "columns"), /expected 7 columns/);
  assert.throws(
    () => parseCensusSwc("1 1 0 0 0 1 -1\n1 3 1 0 0 1 1", "duplicate"),
    /duplicate node id/,
  );
  assert.throws(
    () => parseCensusSwc("1 1 0 0 0 1 -1\n2 3 1 0 0 1 3\n3 3 2 0 0 1 2", "cycle"),
    /cycle/,
  );
  assert.throws(() => parseCensusSwc("1 1 NaN 0 0 1 -1", "finite"), /non-finite/);
  assert.throws(() => parseCensusSwc("1 1 0 0 0 0 -1", "radius"), /non-positive radius/);
});

test("passes the standalone NeuroMorpho census validator", () => {
  const scriptPath = new URL("../scripts/validate-neuromorpho-census.mjs", import.meta.url).pathname;
  const result = spawnSync(process.execPath, [scriptPath], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /142 indexed/);
  assert.match(result.stdout, /142 admitted \(140 3D \+ 2 2D\)/);
  assert.match(result.stdout, /0 quarantined; 0 registrations/);
});
