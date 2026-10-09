import assert from "node:assert/strict";
import test from "node:test";
import { strToU8, zipSync } from "fflate";

import {
  MATSON_NEURONAL_MARKER_ALIASES,
  parseMatsonRankedMarkerWorkbook,
  sha256Bytes,
} from "../tools/parse_matson_marker_workbook.mjs";

const CONTEXT_ALIASES = Array.from({ length: 22 }, (_, index) => `Context${index + 1}`);

function columnLabel(index) {
  let value = index + 1;
  let label = "";
  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }
  return label;
}

function syntheticWorkbook({ swapHeaders = false, omitCell = null, duplicateColumn = null, populatedBelowRanks = false, formula = false } = {}) {
  const aliases = [...MATSON_NEURONAL_MARKER_ALIASES, ...CONTEXT_ALIASES];
  if (swapHeaders) [aliases[0], aliases[1]] = [aliases[1], aliases[0]];
  const sharedStrings = [];
  const sharedStringIndex = (value) => {
    sharedStrings.push(value);
    return sharedStrings.length - 1;
  };
  const rows = [];
  for (let row = 1; row <= 21; row += 1) {
    const cells = [];
    for (let columnIndex = 0; columnIndex < 39; columnIndex += 1) {
      const reference = `${columnLabel(columnIndex)}${row}`;
      if (reference === omitCell) continue;
      const value = row === 1
        ? aliases[columnIndex]
        : `G${columnIndex + 1}R${duplicateColumn === columnIndex && row === 21 ? 19 : row - 1}`;
      const formulaXml = formula && reference === "A2" ? "<f>1+1</f>" : "";
      cells.push(`<c r="${reference}" t="s">${formulaXml}<v>${sharedStringIndex(value)}</v></c>`);
    }
    rows.push(`<row r="${row}">${cells.join("")}</row>`);
  }
  const emptyIndex = sharedStringIndex("");
  rows.push(`<row r="22"><c r="A22" t="s"><v>${populatedBelowRanks ? sharedStringIndex("Unexpected") : emptyIndex}</v></c></row>`);

  const workbook = `<?xml version="1.0"?><workbook><sheets><sheet sheetId="1" r:id="rId9" name="Sheet1"/></sheets></workbook>`;
  const relationships = `<?xml version="1.0"?><Relationships><Relationship Target="worksheets/markers.xml" Id="rId9"/></Relationships>`;
  const strings = `<?xml version="1.0"?><sst>${sharedStrings.map((value) => `<si><t>${value}</t></si>`).join("")}</sst>`;
  const worksheet = `<?xml version="1.0"?><worksheet><dimension ref="A1:AM43"/><sheetData>${rows.join("")}</sheetData></worksheet>`;
  return zipSync({
    "xl/workbook.xml": strToU8(workbook),
    "xl/_rels/workbook.xml.rels": strToU8(relationships),
    "xl/sharedStrings.xml": strToU8(strings),
    "xl/worksheets/markers.xml": strToU8(worksheet),
  }, { level: 9 });
}

function parseSynthetic(options) {
  const bytes = syntheticWorkbook(options);
  return parseMatsonRankedMarkerWorkbook(bytes, { expectedSha256: sha256Bytes(bytes) });
}

test("parses exactly 17 neuronal columns × 20 ranks through the workbook relationship", () => {
  const parsed = parseSynthetic();
  assert.equal(parsed.sourceTypeCountInWorkbook, 39);
  assert.equal(parsed.modeledPopulationCount, 17);
  assert.equal(parsed.rankedGeneRecordCount, 340);
  assert.equal(parsed.populations[10].markerColumnAlias, "Pdyn");
  assert.deepEqual(parsed.populations[10].rankedGenes.at(-1), { rank: 20, gene: "G11R20", sourceCell: "K21" });
  assert.equal(parsed.populations.at(-1).rankCellRange, "Q2:Q21");
});

test("produces a deterministic derived panel digest", () => {
  const bytes = syntheticWorkbook();
  const options = { expectedSha256: sha256Bytes(bytes) };
  assert.deepEqual(
    parseMatsonRankedMarkerWorkbook(bytes, options),
    parseMatsonRankedMarkerWorkbook(bytes, options),
  );
});

test("rejects a workbook unless its expected source checksum matches", () => {
  const bytes = syntheticWorkbook();
  assert.throws(() => parseMatsonRankedMarkerWorkbook(bytes), /SHA-256 changed/i);
});

test("rejects header, rank depth, uniqueness, lower-row and formula drift", () => {
  assert.throws(() => parseSynthetic({ swapHeaders: true }), /columns or order changed/i);
  assert.throws(() => parseSynthetic({ omitCell: "Q21" }), /Q21: ranked marker gene is unavailable/i);
  assert.throws(() => parseSynthetic({ duplicateColumn: 10 }), /Pdyn: ranked marker genes must be unique/i);
  assert.throws(() => parseSynthetic({ populatedBelowRanks: true }), /populated values below rank 20/i);
  assert.throws(() => parseSynthetic({ formula: true }), /must not contain formulas/i);
});
