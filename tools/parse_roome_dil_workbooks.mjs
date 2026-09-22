import { createHash } from "node:crypto";
import { posix as pathPosix } from "node:path";
import { strFromU8, unzipSync } from "fflate";

export const ROOME_TABLE_RECEIPTS = Object.freeze({
  s6: Object.freeze({
    id: "PMC12879194-table-s6",
    fileName: "NIHMS2135978-supplement-table-Table_S6.xlsx",
    sheet: "Sheet1",
    range: "A1:F158",
    bytes: 21302,
    md5: "40d8d7215190cbde411a911e6d4e2841",
    sha256: "8f52a7a1f223953a5b57a50a01679f9626c6d73a13f1aba8b61093b2aeb4cdd2",
    url: "https://pmc-oa-opendata.s3.amazonaws.com/PMC12879194.1/NIHMS2135978-supplement-table-Table_S6.xlsx",
  }),
  s7: Object.freeze({
    id: "PMC12879194-table-s7",
    fileName: "NIHMS2135978-supplement-table-Table_S7.xlsx",
    sheet: "neuron_refined_markers",
    range: "A1:G15901",
    bytes: 1005043,
    md5: "11249c8380d23f7fecad4a7fbd79089b",
    sha256: "2ffcf3dc0773d4242cbd1d7312994ab64a2a474e463c13864d7aaa5f073a829e",
    url: "https://pmc-oa-opendata.s3.amazonaws.com/PMC12879194.1/NIHMS2135978-supplement-table-Table_S7.xlsx",
  }),
});

const S6_HEADERS = Object.freeze([
  "refined dIL types",
  "frequency",
  "percent composition",
  "Mean genes per cell",
  "Mean silhouette score",
  "Mean LISI score",
]);
const S7_HEADERS = Object.freeze(["p_val", "avg_log2FC", "pct.1", "pct.2", "p_val_adj", "cluster", "gene"]);

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function digest(algorithm, bytes) {
  return createHash(algorithm).update(bytes).digest("hex");
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

function attributeValue(attributes, name) {
  return new RegExp(`(?:^|\\s)${name}="([^"]+)"`).exec(attributes)?.[1];
}

function parseSharedStrings(xml) {
  const values = [];
  for (const match of xml.matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)) {
    const fragments = [...match[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)];
    values.push(fragments.map((fragment) => decodeXmlText(fragment[1])).join(""));
  }
  check(values.length > 0, "workbook shared strings are empty");
  return values;
}

function resolveWorksheet(archive, expectedSheet) {
  const workbookBytes = archive["xl/workbook.xml"];
  const relationshipsBytes = archive["xl/_rels/workbook.xml.rels"];
  check(workbookBytes && relationshipsBytes, "workbook relationships are unavailable");
  const workbookXml = strFromU8(workbookBytes);
  const sheetAttributes = [...workbookXml.matchAll(/<sheet\s+([^>]+?)\/?>(?:<\/sheet>)?/g)]
    .map((match) => match[1])
    .find((attributes) => attributeValue(attributes, "name") === expectedSheet);
  const relationshipId = sheetAttributes ? attributeValue(sheetAttributes, "r:id") : undefined;
  check(relationshipId, `worksheet ${expectedSheet} is unavailable`);
  const relationshipsXml = strFromU8(relationshipsBytes);
  const relationshipAttributes = [...relationshipsXml.matchAll(/<Relationship\s+([^>]+?)\/?>(?:<\/Relationship>)?/g)]
    .map((match) => match[1])
    .find((attributes) => attributeValue(attributes, "Id") === relationshipId);
  const target = relationshipAttributes ? attributeValue(relationshipAttributes, "Target") : undefined;
  check(target, `worksheet relationship for ${expectedSheet} is unavailable`);
  const worksheetPath = target.startsWith("/")
    ? pathPosix.normalize(target.slice(1))
    : pathPosix.normalize(pathPosix.join("xl", target));
  const worksheetBytes = archive[worksheetPath];
  check(worksheetBytes, `worksheet payload for ${expectedSheet} is unavailable`);
  return strFromU8(worksheetBytes);
}

function parseCells(worksheetXml, sharedStrings) {
  const cells = new Map();
  for (const match of worksheetXml.matchAll(/<c\s+([^>]*)>([\s\S]*?)<\/c>/g)) {
    const attributes = match[1];
    const reference = attributeValue(attributes, "r");
    if (!reference) continue;
    const rawValue = /<v>([\s\S]*?)<\/v>/.exec(match[2])?.[1];
    if (rawValue === undefined) continue;
    const type = attributeValue(attributes, "t") ?? "n";
    const styleIndex = Number(attributeValue(attributes, "s") ?? 0);
    const value = type === "s" ? sharedStrings[Number(rawValue)] : decodeXmlText(rawValue);
    check(value !== undefined, `${reference}: shared-string reference is invalid`);
    cells.set(reference, { reference, type, styleIndex, rawValue: decodeXmlText(rawValue), value });
  }
  return cells;
}

function openWorkbook(bytes, receipt) {
  check(bytes.byteLength === receipt.bytes, `${receipt.id}: byte count changed`);
  check(digest("md5", bytes) === receipt.md5, `${receipt.id}: MD5 changed`);
  check(digest("sha256", bytes) === receipt.sha256, `${receipt.id}: SHA-256 changed`);
  const archive = unzipSync(bytes);
  const sharedStringsBytes = archive["xl/sharedStrings.xml"];
  check(sharedStringsBytes, `${receipt.id}: shared strings are unavailable`);
  const worksheetXml = resolveWorksheet(archive, receipt.sheet);
  const dimension = /<dimension\s+ref="([^"]+)"/.exec(worksheetXml)?.[1];
  check(dimension === receipt.range, `${receipt.id}: worksheet range changed from ${receipt.range} to ${dimension}`);
  check(!/<f(?:\s[^>]*)?>/.test(worksheetXml), `${receipt.id}: formulas are not admitted`);
  return {
    cells: parseCells(worksheetXml, parseSharedStrings(strFromU8(sharedStringsBytes))),
    dimension,
  };
}

function textCell(cells, reference) {
  const cell = cells.get(reference);
  check(cell?.type === "s" && typeof cell.value === "string", `${reference}: expected text cell`);
  return cell.value;
}

function numberCell(cells, reference) {
  const cell = cells.get(reference);
  const value = Number(cell?.rawValue);
  check(cell && cell.type !== "s" && Number.isFinite(value), `${reference}: expected numeric cell`);
  return value;
}

function excelDateIso(serial) {
  if (/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(String(serial))) return String(serial).slice(0, 10);
  check(Number.isFinite(Number(serial)), `unsupported deposited date token ${serial}`);
  const millis = Date.UTC(1899, 11, 30) + Number(serial) * 86400000;
  return new Date(millis).toISOString().slice(0, 10);
}

function familyFor(label) {
  const family = /^(dIL[AB][1-6])(?:-|$)/.exec(label)?.[1];
  check(family, `${label}: unsupported refined dIL family label`);
  return family;
}

function canonicalFeatureRow(row) {
  return [
    row.sourceRow,
    row.pValue,
    row.avgLog2Fc,
    row.pct1,
    row.pct2,
    row.adjustedPValue,
    row.cluster,
    row.gene ?? `QUARANTINED:${row.geneCell.rawNumericValue}:${row.geneCell.styleIndex}`,
  ].join("\t");
}

export function parseRoomeDilWorkbooks(s6Bytes, s7Bytes) {
  const s6 = openWorkbook(s6Bytes, ROOME_TABLE_RECEIPTS.s6);
  const s7 = openWorkbook(s7Bytes, ROOME_TABLE_RECEIPTS.s7);
  check(JSON.stringify(S6_HEADERS.map((_, index) => textCell(s6.cells, `${String.fromCharCode(65 + index)}1`))) === JSON.stringify(S6_HEADERS), "Table S6 headers changed");
  check(JSON.stringify(S7_HEADERS.map((_, index) => textCell(s7.cells, `${String.fromCharCode(65 + index)}1`))) === JSON.stringify(S7_HEADERS), "Table S7 headers changed");

  const roster = Array.from({ length: 157 }, (_, index) => {
    const sourceRow = index + 2;
    const sourceLocalLabel = textCell(s6.cells, `A${sourceRow}`);
    return {
      sourceRow,
      sourceRange: `A${sourceRow}:F${sourceRow}`,
      sourceLocalLabel,
      family: familyFor(sourceLocalLabel),
      transmitterClass: sourceLocalLabel.startsWith("dILA") ? "inhibitory_family_context" : "excitatory_family_context",
      frequency: numberCell(s6.cells, `B${sourceRow}`),
      percentOfDil: numberCell(s6.cells, `C${sourceRow}`),
      meanGenesPerCell: numberCell(s6.cells, `D${sourceRow}`),
      meanSilhouetteScore: numberCell(s6.cells, `E${sourceRow}`),
      meanLisiScore: numberCell(s6.cells, `F${sourceRow}`),
    };
  });
  check(new Set(roster.map((profile) => profile.sourceLocalLabel)).size === 157, "Table S6 refined-type labels are not unique");
  check(roster.reduce((sum, profile) => sum + profile.frequency, 0) === 61444, "Table S6 frequency denominator changed");
  check(Math.abs(roster.reduce((sum, profile) => sum + profile.percentOfDil, 0) - 100) < 1e-9, "Table S6 percent composition no longer sums to 100");

  const differentialFeatures = [];
  const quarantinedGeneCells = [];
  for (let sourceRow = 2; sourceRow <= 15901; sourceRow += 1) {
    const geneCell = s7.cells.get(`G${sourceRow}`);
    check(geneCell, `G${sourceRow}: gene cell is unavailable`);
    const cluster = textCell(s7.cells, `F${sourceRow}`);
    const row = {
      sourceRow,
      sourceRange: `A${sourceRow}:G${sourceRow}`,
      pValue: numberCell(s7.cells, `A${sourceRow}`),
      avgLog2Fc: numberCell(s7.cells, `B${sourceRow}`),
      pct1: numberCell(s7.cells, `C${sourceRow}`),
      pct2: numberCell(s7.cells, `D${sourceRow}`),
      adjustedPValue: numberCell(s7.cells, `E${sourceRow}`),
      cluster,
      gene: geneCell.type === "s" ? String(geneCell.value) : null,
      geneCell: geneCell.type === "s" ? { sourceCell: `G${sourceRow}` } : {
        sourceCell: `G${sourceRow}`,
        rawNumericValue: geneCell.rawValue,
        styleIndex: geneCell.styleIndex,
        spreadsheetDisplay: excelDateIso(geneCell.rawValue),
        status: "quarantined_excel_coercion",
      },
    };
    differentialFeatures.push(row);
    if (row.gene === null) quarantinedGeneCells.push({
      sourceRow,
      sourceCell: `G${sourceRow}`,
      cluster,
      rawNumericValue: geneCell.rawValue,
      styleIndex: geneCell.styleIndex,
      spreadsheetDisplay: excelDateIso(geneCell.rawValue),
      status: "quarantined_excel_coercion",
      interpretationBoundary: "The apparent date token is retained as deposited and is not auto-repaired into a gene symbol pending RDS or gene-dictionary reconciliation.",
    });
  }
  check(differentialFeatures.length === 15900, "Table S7 row denominator changed");
  const clusters = [...new Set(differentialFeatures.map((row) => row.cluster))];
  check(clusters.length === 159, "Table S7 cluster denominator changed");
  const clusterCounts = differentialFeatures.reduce((counts, row) => counts.set(row.cluster, (counts.get(row.cluster) ?? 0) + 1), new Map());
  check([...clusterCounts.values()].every((count) => count === 100), "Table S7 must retain 100 rows per cluster");
  check(quarantinedGeneCells.length === 26, "Table S7 coerced gene-cell quarantine denominator changed");

  const featuresByCluster = new Map(clusters.map((cluster) => [cluster, differentialFeatures.filter((row) => row.cluster === cluster)]));
  const profiles = roster.map((profile) => {
    const sourceRows = featuresByCluster.get(profile.sourceLocalLabel);
    check(sourceRows?.length === 100, `${profile.sourceLocalLabel}: expected 100 Table S7 rows`);
    const candidates = sourceRows
      .filter((row) => row.gene !== null && row.adjustedPValue <= 0.05 && row.avgLog2Fc > 0 && row.pct1 >= 0.25 && row.pct1 - row.pct2 >= 0.1)
      .map((row) => ({ ...row, prevalenceDelta: row.pct1 - row.pct2 }))
      .sort((left, right) => right.prevalenceDelta - left.prevalenceDelta || right.avgLog2Fc - left.avgLog2Fc || left.gene.localeCompare(right.gene));
    check(candidates.length >= 6, `${profile.sourceLocalLabel}: fewer than six display candidates`);
    const canonicalSourceRows = `${sourceRows.map(canonicalFeatureRow).join("\n")}\n`;
    return {
      ...profile,
      id: `roome-2026:GSE291462:${profile.sourceLocalLabel}`,
      differentialFeatureAudit: {
        sourceRowCount: sourceRows.length,
        retainedTextGeneRowCount: sourceRows.filter((row) => row.gene !== null).length,
        quarantinedGeneRowCount: sourceRows.filter((row) => row.gene === null).length,
        positiveDisplayCandidateCount: candidates.length,
        canonicalSourceRowsSha256: digest("sha256", Buffer.from(canonicalSourceRows, "utf8")),
      },
      displayFeatures: candidates.slice(0, 6).map((row, index) => ({
        rank: index + 1,
        gene: row.gene,
        sourceRow: row.sourceRow,
        sourceRange: row.sourceRange,
        pValue: row.pValue,
        avgLog2Fc: row.avgLog2Fc,
        pct1: row.pct1,
        pct2: row.pct2,
        prevalenceDelta: row.prevalenceDelta,
        adjustedPValue: row.adjustedPValue,
      })),
    };
  });

  const s6Labels = new Set(roster.map((profile) => profile.sourceLocalLabel));
  const excludedDevelopmentalLabels = clusters.filter((cluster) => !s6Labels.has(cluster));
  check(JSON.stringify(excludedDevelopmentalLabels) === JSON.stringify(["dILA-Immature", "dILB-Immature"]), "Table S7 non-roster cluster labels changed");
  const familyCounts = [...new Set(roster.map((profile) => profile.family))].map((family) => ({
    family,
    refinedTypeCount: roster.filter((profile) => profile.family === family).length,
    cellCount: roster.filter((profile) => profile.family === family).reduce((sum, profile) => sum + profile.frequency, 0),
  }));
  return { profiles, differentialFeatures, quarantinedGeneCells, excludedDevelopmentalLabels, familyCounts };
}
