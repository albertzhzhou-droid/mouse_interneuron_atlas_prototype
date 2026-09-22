import { createHash } from "node:crypto";
import { posix as pathPosix } from "node:path";
import { strFromU8, unzipSync } from "fflate";

export const MATSON_MARKER_WORKBOOK_SHA256 = "ce390abbaf5a6b4ca376e03112a34141f105774918339c59a3614c98d20b6c74";
export const MATSON_MARKER_WORKSHEET = "Sheet1";
export const MATSON_MARKER_RANK_COUNT = 20;
export const MATSON_NEURONAL_MARKER_ALIASES = Object.freeze([
  "Cpne4",
  "Maf",
  "Reln",
  "Rreb1",
  "Sox5",
  "Megf11",
  "ME",
  "VE",
  "Adamts5",
  "Cdh3",
  "Pdyn",
  "Npy",
  "Chat",
  "MI",
  "VI",
  "CSF-c",
  "MN",
]);

function check(condition, message) {
  if (!condition) throw new Error(message);
}

export function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function decodeXmlText(value) {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&")
    .replace(/&#(\d+);/g, (_, codePoint) => String.fromCodePoint(Number(codePoint)))
    .replace(/&#x([0-9a-f]+);/gi, (_, codePoint) => String.fromCodePoint(Number.parseInt(codePoint, 16)));
}

function parseSharedStrings(xml) {
  const values = [];
  for (const match of xml.matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)) {
    const fragments = [...match[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)];
    values.push(fragments.map((fragment) => decodeXmlText(fragment[1])).join(""));
  }
  check(values.length > 0, "Matson marker workbook shared strings are empty");
  return values;
}

function parseWorksheetCells(xml, sharedStrings) {
  const cells = new Map();
  for (const match of xml.matchAll(/<c\s+([^>]*)>([\s\S]*?)<\/c>/g)) {
    const attributes = match[1];
    const reference = /(?:^|\s)r="([A-Z]+[0-9]+)"/.exec(attributes)?.[1];
    if (!reference) continue;
    const rawValue = /<v>([\s\S]*?)<\/v>/.exec(match[2])?.[1];
    if (rawValue === undefined) continue;
    const type = /(?:^|\s)t="([^"]+)"/.exec(attributes)?.[1];
    const value = type === "s" ? sharedStrings[Number(rawValue)] : decodeXmlText(rawValue);
    check(value !== undefined, `${reference}: shared-string reference is invalid`);
    cells.set(reference, value);
  }
  return cells;
}

function attributeValue(attributes, name) {
  return new RegExp(`(?:^|\\s)${name}="([^"]+)"`).exec(attributes)?.[1];
}

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

export function canonicalMatsonMarkerPanel(populations) {
  return `${populations.flatMap((population) => population.rankedGenes.map((marker) => [
    population.markerColumnAlias,
    marker.rank,
    marker.gene,
    marker.sourceCell,
  ].join("\t"))).join("\n")}\n`;
}

export function parseMatsonRankedMarkerWorkbook(bytes, { expectedSha256 = MATSON_MARKER_WORKBOOK_SHA256 } = {}) {
  const sourceSha256 = sha256Bytes(bytes);
  check(sourceSha256 === expectedSha256, "Matson marker workbook SHA-256 changed");

  const archive = unzipSync(bytes);
  const sharedStringsBytes = archive["xl/sharedStrings.xml"];
  const workbookBytes = archive["xl/workbook.xml"];
  const workbookRelationshipsBytes = archive["xl/_rels/workbook.xml.rels"];
  check(sharedStringsBytes && workbookBytes && workbookRelationshipsBytes, "Matson marker workbook is missing required OOXML members");

  const workbookXml = strFromU8(workbookBytes);
  const sheetAttributes = [...workbookXml.matchAll(/<sheet\s+([^>]+?)\/?>(?:<\/sheet>)?/g)]
    .map((match) => match[1])
    .find((attributes) => attributeValue(attributes, "name") === MATSON_MARKER_WORKSHEET);
  const relationshipId = sheetAttributes ? attributeValue(sheetAttributes, "r:id") : undefined;
  check(relationshipId, "Matson marker worksheet identity changed");

  const workbookRelationshipsXml = strFromU8(workbookRelationshipsBytes);
  const relationshipAttributes = [...workbookRelationshipsXml.matchAll(/<Relationship\s+([^>]+?)\/?>(?:<\/Relationship>)?/g)]
    .map((match) => match[1])
    .find((attributes) => attributeValue(attributes, "Id") === relationshipId);
  const worksheetTarget = relationshipAttributes ? attributeValue(relationshipAttributes, "Target") : undefined;
  check(worksheetTarget, "Matson marker worksheet relationship is unavailable");
  const worksheetPath = worksheetTarget.startsWith("/")
    ? pathPosix.normalize(worksheetTarget.slice(1))
    : pathPosix.normalize(pathPosix.join("xl", worksheetTarget));
  const worksheetBytes = archive[worksheetPath];
  check(worksheetBytes, "Matson marker worksheet OOXML member is unavailable");

  const worksheetXml = strFromU8(worksheetBytes);
  const sheetDimension = /<dimension\s+ref="([^"]+)"/.exec(worksheetXml)?.[1];
  check(sheetDimension === "A1:AM43", "Matson marker worksheet dimensions changed");
  check(!/<f(?:\s[^>]*)?>/.test(worksheetXml), "Matson marker worksheet must not contain formulas");
  const sharedStrings = parseSharedStrings(strFromU8(sharedStringsBytes));
  const cells = parseWorksheetCells(worksheetXml, sharedStrings);
  check(
    [...cells.entries()].every(([reference, value]) => Number(reference.match(/[0-9]+$/)?.[0] ?? 0) <= 21 || String(value).trim() === ""),
    "Matson marker worksheet contains populated values below rank 20",
  );

  const sourceAliases = Array.from({ length: 39 }, (_, index) => cells.get(`${columnLabel(index)}1`));
  check(sourceAliases.every(Boolean), "Matson marker workbook must retain 39 source-type headers");
  check(new Set(sourceAliases).size === sourceAliases.length, "Matson marker workbook source-type headers must be unique");
  check(
    JSON.stringify(sourceAliases.slice(0, MATSON_NEURONAL_MARKER_ALIASES.length)) === JSON.stringify(MATSON_NEURONAL_MARKER_ALIASES),
    "Matson neuronal marker columns or order changed",
  );

  const populations = MATSON_NEURONAL_MARKER_ALIASES.map((markerColumnAlias, index) => {
    const column = columnLabel(index);
    const rankedGenes = Array.from({ length: MATSON_MARKER_RANK_COUNT }, (_, rankIndex) => {
      const rank = rankIndex + 1;
      const sourceCell = `${column}${rank + 1}`;
      const gene = cells.get(sourceCell);
      check(typeof gene === "string" && /^[A-Za-z0-9.-]+$/.test(gene), `${sourceCell}: ranked marker gene is unavailable or invalid`);
      return { rank, gene, sourceCell };
    });
    check(new Set(rankedGenes.map((marker) => marker.gene)).size === MATSON_MARKER_RANK_COUNT, `${markerColumnAlias}: ranked marker genes must be unique`);
    return {
      markerColumnAlias,
      headerCell: `${column}1`,
      rankCellRange: `${column}2:${column}21`,
      rankedGenes,
    };
  });

  const canonicalPanel = canonicalMatsonMarkerPanel(populations);
  return {
    sourceSha256,
    worksheet: MATSON_MARKER_WORKSHEET,
    sourceRange: "A1:Q21",
    sheetDimension,
    sourceTypeCountInWorkbook: sourceAliases.length,
    modeledPopulationCount: populations.length,
    ranksPerPopulation: MATSON_MARKER_RANK_COUNT,
    rankedGeneRecordCount: populations.length * MATSON_MARKER_RANK_COUNT,
    derivedPanelSha256: sha256Bytes(Buffer.from(canonicalPanel, "utf8")),
    digestCanonicalization: "UTF-8 lines: <markerColumnAlias>\\t<rank>\\t<gene>\\t<sourceCell>, joined with LF and terminated by LF.",
    populations,
  };
}
