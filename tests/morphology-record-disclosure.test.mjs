import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [contract, disclosureSource, viewerSource, comparatorSource] = await Promise.all([
  readFile(new URL("../data/morphology-source-frame-disclosure-0.1.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../app/MorphologyRecordDisclosure.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/MorphologyViewer.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/MorphologyComparePanel.tsx", import.meta.url), "utf8"),
]);

const byId = new Map(contract.records.map((record) => [record.neuronId, record]));

test("keeps record disclosures tied to the exact 142 + 7 source-object roster", () => {
  assert.equal(contract.records.length, 149);
  assert.equal(contract.records.filter((record) => record.membership.collection === "census").length, 142);
  assert.equal(contract.records.filter((record) => record.membership.collection === "supplementary").length, 7);
  assert.ok(contract.records.every((record) => record.membership.censusContribution + record.membership.supplementaryContribution === 1));
  assert.ok(contract.records.every((record) => /^[a-f0-9]{64}$/.test(record.geometryReceipt.sha256)));
});

test("source-backed preparation fields vary across records instead of collapsing to generic card copy", () => {
  const nmo109005 = byId.get(109005);
  const nmo260150 = byId.get(260150);
  const nmo45674 = byId.get(45674);
  const nmo194468 = byId.get(194468);
  assert.equal(nmo109005.preparation.sourceSectionWording, "300 micrometre · parasagittal");
  assert.equal(nmo260150.preparation.sourceSectionWording, "60 micrometre · transverse");
  assert.equal(nmo45674.preparation.shrinkage.reportedRaw, "Reported");
  assert.equal(nmo45674.preparation.shrinkage.correctedRaw, "Not Corrected");
  assert.equal(nmo45674.preparation.unresolvedPreparationConflict, "paper context and repository fields remain distinct; no stage equivalence or object-level crosswalk is inferred");
  assert.equal(nmo109005.preparation.numericAge.status, "unavailable");
  assert.equal(nmo260150.preparation.numericAge.status, "reported");
  assert.equal(nmo194468.sourceCoordinates.extentMicrometre[2], 0);
  assert.notDeepEqual(nmo109005.sourceCoordinates.extentMicrometre, nmo260150.sourceCoordinates.extentMicrometre);
  assert.notEqual(nmo109005.geometryReceipt.sha256, nmo260150.geometryReceipt.sha256);
});

test("shared card renders raw, normalized, truncation, membership and full receipt fields", () => {
  for (const token of [
    "sourceSectionWording",
    "slicingDirectionRaw",
    "slicingThicknessMicrometre",
    "reportedRaw",
    "correctedRaw",
    "morphologyShrinkageInterpretation",
    "extentMicrometre",
    "numericAge",
    "unresolvedPreparationConflict",
    "sourcePhysicalIntegrityVerbatim",
    "axonField",
    "membership.collection",
    "geometryReceipt.sha256",
    "geometryReceipt.rawSwcSha256",
  ]) assert.match(disclosureSource, new RegExp(token.replaceAll(".", "\\.")));
  assert.doesNotMatch(disclosureSource, /sha256.*slice\(/i);
});

test("individual card uses the disclosure and exposes every computed metric behind a counted disclosure", () => {
  assert.match(viewerSource, /morphologySourceFrameDisclosureFor\(selectedRecord\)/);
  assert.match(viewerSource, /<MorphologyRecordDisclosure/);
  assert.match(viewerSource, /Show all \{computedMetrics\.length\} computed fields/);
  assert.doesNotMatch(viewerSource, /Object\.entries\([^\n]+\)\.slice\(0,\s*8\)/);
  assert.match(viewerSource, /key !== "numericAge"/);
});

test("comparator keeps workspace limits global and removes repeated integrity, axon and hash copy from cards", () => {
  const cardSource = comparatorSource.slice(
    comparatorSource.indexOf("function ComparisonCard"),
    comparatorSource.indexOf("function ShollComparisonChart"),
  );
  assert.match(cardSource, /<MorphologyRecordDisclosure/);
  assert.doesNotMatch(cardSource, /0 REG|scale-limit|<dt>Integrity|<dt>Axon scope|sha256\?\.slice/);
  assert.equal(comparatorSource.match(/0 COMMON-SCALE ADMISSIONS/g)?.length, 1);
  assert.equal(comparatorSource.match(/<strong>0 REGISTRATIONS/g)?.length, 1);
  assert.equal(comparatorSource.match(/0 SAME-CELL LINKS/g)?.length, 1);
});
