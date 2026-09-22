import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  SOURCE_RECORD_DELTA_BOUNDARY,
  SOURCE_RECORD_DELTA_CONTRACT_ID,
  buildSourceRecordDelta,
} from "../app/source-record-delta.js";

const taxonomy = JSON.parse(await readFile(
  new URL("../data/alkaslasi-cholinergic-source-taxonomy-0.1.json", import.meta.url),
  "utf8",
));
const componentSource = await readFile(
  new URL("../app/SourceRecordDeltaInspector.tsx", import.meta.url),
  "utf8",
);
const i1 = taxonomy.profiles.find((profile) => profile.id === "alkaslasi-2021:GSE167597:I1");
const i2 = taxonomy.profiles.find((profile) => profile.id === "alkaslasi-2021:GSE167597:I2");

const rows = [
  {
    id: "sampling-count",
    label: "Dataset sampling count",
    read: (profile) => `${profile.samplingCount.value.toLocaleString("en-US")} ${profile.samplingCount.unit}`,
  },
  {
    id: "markers",
    label: "Source marker panel",
    read: (profile) => profile.markerPanel.join(" · "),
  },
  {
    id: "region-membership",
    label: "Source-region membership",
    read: (profile) => Object.entries(profile.sampleRegionMembership.counts)
      .map(([region, count]) => `${region} ${count}`)
      .join(" · "),
  },
  { id: "life-stage", label: "Life stage", read: (profile) => profile.lifeStage },
  { id: "transmitter", label: "Transmitter class", read: (profile) => profile.transmitterClass },
  { id: "morphology", label: "Morphology", read: (profile) => profile.missingEvidence.morphology },
  { id: "internal-structure", label: "Internal structure", read: (profile) => profile.missingEvidence.intracellularStructures },
  { id: "same-cell-link", label: "Cross-source same-cell link", read: (profile) => profile.missingEvidence.crossSourceSameCellIdentityLink },
];

function descriptor(profile) {
  return {
    id: profile.id,
    label: profile.sourceLocalLabel,
    namespace: "alkaslasi-2021:GSE167597",
    value: profile,
  };
}

test("groups exact I1/I2 shared rows once and retains changed old/current values", () => {
  const delta = buildSourceRecordDelta({
    oldRecord: descriptor(i1),
    currentRecord: descriptor(i2),
    rows,
  });

  assert.equal(delta.contractId, SOURCE_RECORD_DELTA_CONTRACT_ID);
  assert.equal(delta.mode, "EXACT_WHITELISTED_DISPLAY_STRING_DELTA");
  assert.deepEqual(delta.summary, {
    whitelistedRowCount: 8,
    sharedRowCount: 5,
    changedRowCount: 3,
    unlistedFieldCountInspected: 0,
  });
  assert.deepEqual(delta.changedRows, [
    {
      id: "sampling-count",
      label: "Dataset sampling count",
      oldValue: "1,520 nuclei",
      currentValue: "780 nuclei",
    },
    {
      id: "markers",
      label: "Source marker panel",
      oldValue: "Pax2 · Mpped2 · Slc6a1 · Piezo2",
      currentValue: "Pax2 · Mpped2 · Slc6a1",
    },
    {
      id: "region-membership",
      label: "Source-region membership",
      oldValue: "Cervical 361 · Thoracic 404 · Lumbar 755",
      currentValue: "Cervical 220 · Thoracic 208 · Lumbar 352",
    },
  ]);
  assert.deepEqual(
    delta.sharedRows.map((row) => row.id),
    ["life-stage", "transmitter", "morphology", "internal-structure", "same-cell-link"],
  );
  assert.equal(delta.sharedRows.filter((row) => row.id === "life-stage").length, 1);
});

test("inspects only the explicit whitelist and carries zero identity or geometry implications", () => {
  const oldValue = { shown: "same", hiddenGeometry: "sphere-a", hiddenIdentity: "joined-a" };
  const currentValue = { shown: "same", hiddenGeometry: "sphere-b", hiddenIdentity: "joined-b" };
  const delta = buildSourceRecordDelta({
    oldRecord: { id: "source:old", label: "Old", namespace: "source-a", value: oldValue },
    currentRecord: { id: "source:current", label: "Current", namespace: "source-b", value: currentValue },
    rows: [{ id: "shown", label: "Shown", read: (record) => record.shown }],
  });

  assert.deepEqual(delta.sharedRows, [{ id: "shown", label: "Shown", value: "same" }]);
  assert.deepEqual(delta.changedRows, []);
  assert.equal(JSON.stringify(delta).includes("sphere-a"), false);
  assert.equal(JSON.stringify(delta).includes("sphere-b"), false);
  assert.equal(JSON.stringify(delta).includes("joined-a"), false);
  assert.equal(JSON.stringify(delta).includes("joined-b"), false);
  assert.deepEqual(delta.boundary, SOURCE_RECORD_DELTA_BOUNDARY);
  assert.deepEqual({
    sameCell: delta.boundary.crossSourceSameCellIdentityCount,
    sameType: delta.boundary.crossSourceSameTypeIdentityCount,
    geometry: delta.boundary.admittedGeometryPrimitiveCount,
    generated: delta.boundary.generatedBiologicalGeometryPrimitiveCount,
    joins: delta.boundary.joinCount,
    registrations: delta.boundary.registrationCount,
  }, { sameCell: 0, sameType: 0, geometry: 0, generated: 0, joins: 0, registrations: 0 });
});

test("uses exact display-string equality without silent normalization", () => {
  const delta = buildSourceRecordDelta({
    oldRecord: { id: "old", label: "Old", namespace: "source", value: { markers: "Pax2 · Mpped2" } },
    currentRecord: { id: "current", label: "Current", namespace: "source", value: { markers: "Pax2  · Mpped2" } },
    rows: [{ id: "markers", label: "Markers", read: (record) => record.markers }],
  });
  assert.equal(delta.sharedRows.length, 0);
  assert.deepEqual(delta.changedRows[0], {
    id: "markers",
    label: "Markers",
    oldValue: "Pax2 · Mpped2",
    currentValue: "Pax2  · Mpped2",
  });
});

test("fails closed for invalid descriptors, duplicate rows, and non-display values", () => {
  const oldRecord = { id: "old", label: "Old", namespace: "source", value: { value: "A" } };
  const currentRecord = { id: "current", label: "Current", namespace: "source", value: { value: "B" } };
  assert.throws(
    () => buildSourceRecordDelta({ oldRecord, currentRecord: { ...currentRecord, id: "old" }, rows: [{ id: "value", label: "Value", read: (record) => record.value }] }),
    /two distinct source records/i,
  );
  assert.throws(
    () => buildSourceRecordDelta({
      oldRecord,
      currentRecord,
      rows: [
        { id: "value", label: "Value", read: (record) => record.value },
        { id: "value", label: "Other", read: (record) => record.value },
      ],
    }),
    /duplicate display-row ID/i,
  );
  assert.throws(
    () => buildSourceRecordDelta({
      oldRecord,
      currentRecord,
      rows: [{ id: "value", label: "Value", read: () => ({ inferred: true }) }],
    }),
    /must return a non-empty string/i,
  );
});

test("evaluates each whitelisted row exactly once per source record and preserves row order", () => {
  const calls = [];
  const delta = buildSourceRecordDelta({
    oldRecord: { id: "old", label: "Old", namespace: "source", value: { a: "A", b: "B" } },
    currentRecord: { id: "current", label: "Current", namespace: "source", value: { a: "A2", b: "B" } },
    rows: [
      { id: "a", label: "A", read: (record) => { calls.push(`a:${record.a}`); return record.a; } },
      { id: "b", label: "B", read: (record) => { calls.push(`b:${record.b}`); return record.b; } },
    ],
  });
  assert.deepEqual(calls, ["a:A", "a:A2", "b:B", "b:B"]);
  assert.deepEqual(delta.whitelistedRowIds, ["a", "b"]);
  assert.deepEqual(delta.changedRows.map((row) => row.id), ["a"]);
  assert.deepEqual(delta.sharedRows.map((row) => row.id), ["b"]);
});

test("component presents old/current changes, one shared block, and the scientific zero boundary", () => {
  assert.match(componentSource, /SOURCE-RECORD DELTA · DISPLAY ONLY/);
  assert.match(componentSource, /OLD SOURCE RECORD/);
  assert.match(componentSource, /CURRENT SOURCE RECORD/);
  assert.match(componentSource, /exact shared display rows · shown once/);
  assert.match(componentSource, /Only the explicitly whitelisted rows below were inspected/);
  assert.match(componentSource, /0 same-cell identities · 0 same-type identities · 0 geometry primitives · 0 joins · 0 registrations/);
  assert.match(componentSource, /does not establish biological identity, morphology, geometry, abundance, causality, connectivity, spatial correspondence, or atlas registration/);
  assert.doesNotMatch(componentSource, /SphereGeometry|BoxGeometry|BufferGeometry|Mesh\s*\(/);
});
