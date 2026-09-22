#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, copyFile, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { strFromU8, unzipSync } from "fflate";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.join(PROJECT_ROOT, "public/data/ronzano_premotor_positions_v1");
const SOURCE_OUTPUT_ROOT = path.join(ASSET_ROOT, "source");
const POSITION_OUTPUT_PATH = path.join(ASSET_ROOT, "positions.json");
const CONTRACT_OUTPUT_PATH = path.join(PROJECT_ROOT, "data/ronzano-premotor-position-reference-0.1.json");
const FILE_PATTERN = /^elife-81976-fig3-figsupp([12])-data(\d+)-v3\.xlsx$/;
const FRAME_ORDER = Object.freeze({ raw: 0, normalized: 1 });
const MUSCLE_ORDER = Object.freeze({ LG: 0, TA: 1 });
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function decodeEntities(value) {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

function columnIndexFromReference(reference) {
  const letters = reference.match(/^[A-Z]+/)?.[0];
  if (!letters) throw new Error(`Invalid cell reference ${reference}`);
  return [...letters].reduce((value, letter) => value * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

export function parseCoordinateWorkbook(bytes, fileName = "workbook.xlsx") {
  const archive = unzipSync(new Uint8Array(bytes));
  const sheetBytes = archive["xl/worksheets/sheet1.xml"];
  if (!sheetBytes) throw new Error(`${fileName} has no xl/worksheets/sheet1.xml`);
  const sheetXml = strFromU8(sheetBytes);
  if (/<f(?:\s|>)/.test(sheetXml)) throw new Error(`${fileName} contains formulas`);
  if (/<(?:is|t)(?:\s|>)/.test(sheetXml)) throw new Error(`${fileName} contains inline text`);

  const rows = [];
  const seenRows = new Set();
  const rowPattern = /<row\b([^>]*)>([\s\S]*?)<\/row>/g;
  for (const rowMatch of sheetXml.matchAll(rowPattern)) {
    const rowAttribute = rowMatch[1].match(/\br="(\d+)"/);
    if (!rowAttribute) throw new Error(`${fileName} contains a row without an index`);
    const sourceRow = Number(rowAttribute[1]);
    if (!Number.isInteger(sourceRow) || sourceRow < 1 || seenRows.has(sourceRow)) {
      throw new Error(`${fileName} has an invalid or duplicate row ${sourceRow}`);
    }
    seenRows.add(sourceRow);
    const values = [null, null, null];
    const cellPattern = /<c\b([^>]*)>([\s\S]*?)<\/c>/g;
    for (const cellMatch of rowMatch[2].matchAll(cellPattern)) {
      const reference = cellMatch[1].match(/\br="([A-Z]+\d+)"/)?.[1];
      if (!reference) throw new Error(`${fileName} row ${sourceRow} contains a cell without a reference`);
      const columnIndex = columnIndexFromReference(reference);
      if (columnIndex < 0 || columnIndex > 2) throw new Error(`${fileName} has an unexpected cell ${reference}`);
      const valueText = cellMatch[2].match(/<v>([\s\S]*?)<\/v>/)?.[1];
      if (valueText === undefined) throw new Error(`${fileName} cell ${reference} is blank`);
      const numericValue = Number(decodeEntities(valueText));
      if (!Number.isFinite(numericValue)) throw new Error(`${fileName} cell ${reference} is not finite`);
      if (values[columnIndex] !== null) throw new Error(`${fileName} repeats cell ${reference}`);
      values[columnIndex] = numericValue;
    }
    if (values.some((value) => value === null)) throw new Error(`${fileName} row ${sourceRow} is not an exact numeric XYZ triple`);
    rows.push({ sourceRow, point: values });
  }
  if (!rows.length) throw new Error(`${fileName} contains no coordinate rows`);
  rows.sort((left, right) => left.sourceRow - right.sourceRow);
  rows.forEach((row, index) => {
    if (row.sourceRow !== index + 1) throw new Error(`${fileName} source rows are not contiguous from row 1`);
  });
  return rows;
}

function sourceMetadata(fileName) {
  const match = fileName.match(FILE_PATTERN);
  if (!match) throw new Error(`Unexpected source file ${fileName}`);
  const frame = Number(match[1]) === 1 ? "normalized" : "raw";
  const dataNumber = Number(match[2]);
  if (dataNumber < 2 || dataNumber > 12) throw new Error(`Unsupported data number in ${fileName}`);
  const muscle = dataNumber <= 6 ? "LG" : "TA";
  const segmentNumber = dataNumber <= 6 ? dataNumber : dataNumber - 6;
  const segment = `L${segmentNumber}`;
  const frameLabel = frame === "normalized" ? "normalized" : "raw-before-normalization";
  return {
    id: `RONZANO-81976-${frame === "normalized" ? "NORM" : "RAW"}-${muscle}-${segment}`,
    frame,
    dataNumber,
    muscle,
    muscleRole: muscle === "LG" ? "ankle_extensor" : "ankle_flexor",
    segment,
    sourceDescription: `Cartesian x-y-z ${frameLabel} coordinates pooled within lumbar segment ${segment} for ${muscle}`,
  };
}

function coordinateRange(points, columnIndex) {
  const values = points.map((point) => point[columnIndex]);
  return { minimum: Math.min(...values), maximum: Math.max(...values) };
}

function stableSourceSort(left, right) {
  return FRAME_ORDER[left.frame] - FRAME_ORDER[right.frame]
    || MUSCLE_ORDER[left.muscle] - MUSCLE_ORDER[right.muscle]
    || Number(left.segment.slice(1)) - Number(right.segment.slice(1));
}

function canonicalBundleReceipt(sourceFiles) {
  const canonicalText = sourceFiles
    .map((file) => `${file.fileName}\t${file.bytes}\t${file.sha256}\t${file.rowCount}`)
    .join("\n") + "\n";
  return {
    algorithm: "sha256_of_sorted_filename_tab_bytes_tab_sha256_tab_rowcount_lines_utf8",
    sha256: sha256(Buffer.from(canonicalText)),
  };
}

function representationSummary(sourceFiles, frame) {
  const selected = sourceFiles.filter((file) => file.frame === frame);
  return {
    frame,
    sourceFileCount: selected.length,
    coordinateRowCount: selected.reduce((sum, file) => sum + file.rowCount, 0),
    byMuscle: Object.fromEntries(["LG", "TA"].map((muscle) => [
      muscle,
      selected.filter((file) => file.muscle === muscle).reduce((sum, file) => sum + file.rowCount, 0),
    ])),
    representedSegmentsByMuscle: Object.fromEntries(["LG", "TA"].map((muscle) => [
      muscle,
      selected.filter((file) => file.muscle === muscle).map((file) => file.segment),
    ])),
  };
}

function crossFramePairAudit(sourceFiles) {
  const audits = [];
  for (const normalized of sourceFiles.filter((file) => file.frame === "normalized")) {
    const raw = sourceFiles.find((file) => file.frame === "raw" && file.muscle === normalized.muscle && file.segment === normalized.segment);
    if (!raw) throw new Error(`Missing raw pair for ${normalized.muscle} ${normalized.segment}`);
    const normalizedPoints = normalized.points;
    const rawPoints = raw.points;
    audits.push({
      muscle: normalized.muscle,
      segment: normalized.segment,
      normalizedRowCount: normalizedPoints.length,
      rawRowCount: rawPoints.length,
      rowCountMatch: normalizedPoints.length === rawPoints.length,
      zSequenceExactMatch: normalizedPoints.length === rawPoints.length
        && normalizedPoints.every((point, index) => point[2] === rawPoints[index][2]),
      admittedPointIdentityAcrossFrames: false,
      reason: normalizedPoints.length === rawPoints.length
        ? "Matching row counts and z order do not establish a source-declared stable cell identifier across workbooks."
        : "The source workbooks contain different row counts, so point-level pairing is impossible.",
    });
  }
  return audits.sort((left, right) => MUSCLE_ORDER[left.muscle] - MUSCLE_ORDER[right.muscle] || Number(left.segment.slice(1)) - Number(right.segment.slice(1)));
}

export async function buildRonzanoPremotorPositionReference({ sourceDir }) {
  const fileNames = (await readdir(sourceDir)).filter((fileName) => FILE_PATTERN.test(fileName)).sort();
  if (fileNames.length !== 22) throw new Error(`Expected 22 source workbooks; found ${fileNames.length}`);
  const sourceFiles = [];
  for (const fileName of fileNames) {
    const metadata = sourceMetadata(fileName);
    const sourcePath = path.join(sourceDir, fileName);
    const bytes = await readFile(sourcePath);
    const rows = parseCoordinateWorkbook(bytes, fileName);
    const points = rows.map((row) => row.point);
    const fileSha256 = sha256(bytes);
    if (!SHA256_PATTERN.test(fileSha256)) throw new Error(`Invalid SHA-256 for ${fileName}`);
    sourceFiles.push({
      ...metadata,
      fileName,
      sourceUrl: `https://cdn.elifesciences.org/articles/81976/${fileName}`,
      bundledPath: `public/data/ronzano_premotor_positions_v1/source/${fileName}`,
      browserUrl: `/data/ronzano_premotor_positions_v1/source/${fileName}`,
      bytes: bytes.length,
      sha256: fileSha256,
      rowCount: points.length,
      firstSourceRow: rows[0].sourceRow,
      lastSourceRow: rows.at(-1).sourceRow,
      columns: ["x", "y", "z"],
      coordinateRanges: {
        x: coordinateRange(points, 0),
        y: coordinateRange(points, 1),
        z: coordinateRange(points, 2),
      },
      points,
    });
  }
  sourceFiles.sort(stableSourceSort);

  const representations = ["raw", "normalized"].map((frame) => ({
    frame,
    groups: sourceFiles.filter((file) => file.frame === frame).map((file) => ({
      sourceFileId: file.id,
      sourceFileSha256: file.sha256,
      muscle: file.muscle,
      muscleRole: file.muscleRole,
      segment: file.segment,
      sourceRows: { first: file.firstSourceRow, last: file.lastSourceRow },
      points: file.points,
    })),
  }));
  const rawSummary = representationSummary(sourceFiles, "raw");
  const normalizedSummary = representationSummary(sourceFiles, "normalized");
  const positionPayload = {
    schemaVersion: "0.1.0",
    assetId: "ronzano-premotor-positions-v1",
    sourceDoi: "10.7554/eLife.81976",
    sourceObjectKind: "labelled_cell_coordinate_rows",
    columns: ["x", "y", "z"],
    representations,
    totals: {
      sourceFileCount: sourceFiles.length,
      coordinateRowCountAcrossRepresentations: rawSummary.coordinateRowCount + normalizedSummary.coordinateRowCount,
      byFrame: {
        raw: rawSummary.coordinateRowCount,
        normalized: normalizedSummary.coordinateRowCount,
      },
    },
    identityPolicy: {
      rowIdentity: "source_file_id_plus_one_based_excel_row",
      crossFramePointIdentity: "not_established",
      crossSourceIdentity: "not_established",
      registrationCount: 0,
    },
  };
  const positionBytes = Buffer.from(`${JSON.stringify(positionPayload)}\n`);
  const positionReceipt = { bytes: positionBytes.length, sha256: sha256(positionBytes) };
  const sourceBundle = canonicalBundleReceipt(sourceFiles);
  const pairAudit = crossFramePairAudit(sourceFiles);
  const contract = {
    schemaVersion: "0.1.0",
    releaseId: "ohri-ronzano-premotor-position-reference-0.1.0",
    releaseDate: "2026-08-30",
    iteration: "2.22",
    assetId: "ronzano-premotor-positions-v1",
    source: {
      title: "Spinal premotor interneurons controlling antagonistic muscles are spatially intermingled",
      citation: "Ronzano R, Skarlatou S, Barriga BK, et al. eLife 11:e81976 (2022).",
      doi: "10.7554/eLife.81976",
      pmid: "36512397",
      pmcid: "PMC9844990",
      articleUrl: "https://elifesciences.org/articles/81976",
      figuresAndDataUrl: "https://elifesciences.org/articles/81976/figures",
      species: { scientificName: "Mus musculus", taxonId: "NCBITaxon:10090" },
      lifeStage: {
        injection: "postnatal day P1-P2",
        analysisInterval: "8-9 days after injection",
        adultTransfer: "not_established",
      },
      region: "lumbar spinal cord, source segments L1-L6; LG segment files begin at L2",
      cohort: {
        LGExperiments: 11,
        TAExperiments: 7,
        authority: "Figure 3 figure supplement 1 and 2 source-data descriptions",
      },
      tracingContext: "delta-G rabies viral tracing in ChatCre/+; Rosa26-RPhiGT neonatal mice for the pooled LG and TA coordinate series",
    },
    rights: {
      status: "CC-BY-4.0",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
      articleCopyright: "Copyright 2022 Ronzano, Skarlatou, Barriga et al.",
      scope: "Article and supporting source-data files redistributed with attribution.",
    },
    sourceObjectContract: {
      sourceObjectKind: "labelled_cell_coordinate_row",
      rowIdentity: "source_file_id_plus_one_based_excel_row",
      columnOrder: ["x", "y", "z"],
      headerRows: 0,
      everyCellNumericFinite: true,
      sourceFileCount: 22,
      coordinateRowCountAcrossRepresentations: rawSummary.coordinateRowCount + normalizedSummary.coordinateRowCount,
      representations: { raw: rawSummary, normalized: normalizedSummary },
      sourceBundleTotalBytes: sourceFiles.reduce((sum, file) => sum + file.bytes, 0),
      sourceBundleCanonicalReceipt: sourceBundle,
    },
    coordinateFrames: {
      raw: {
        x: "source x coordinate before normalization",
        y: "source y coordinate before normalization",
        z: "micrometre coordinate shifted so zero is the L4-L5 border; negative is rostral",
        displayTransform: "uniform viewer scaling only; no atlas transform",
        measurementUse: "forbidden",
      },
      normalized: {
        x: "source section-normalized mediolateral coordinate relative to central-canal and white-matter reference points",
        y: "source quadrant-normalized dorsoventral coordinate relative to central-canal and white-matter reference points",
        z: "micrometre coordinate shifted so zero is the L4-L5 border; negative is rostral",
        displayTransform: "x multiplied by 1700 micrometres and y multiplied by 900 micrometres, matching the source's illustrational idealized-cord scaling; z unchanged; then uniformly fit to the viewport",
        measurementUse: "forbidden",
      },
      registrationStatus: "source_local_unregistered",
      registrationCount: 0,
      atlasJoinCount: 0,
    },
    crossFrameAudit: {
      pairCount: pairAudit.length,
      exactRowCountAndZSequencePairs: pairAudit.filter((audit) => audit.rowCountMatch && audit.zSequenceExactMatch).length,
      mismatchedRowCountPairs: pairAudit.filter((audit) => !audit.rowCountMatch).length,
      admittedPointIdentityAcrossFrames: false,
      pairs: pairAudit,
    },
    sourceFiles: sourceFiles.map((sourceFile) => {
      const receipt = { ...sourceFile };
      delete receipt.points;
      return receipt;
    }),
    derivedAsset: {
      path: "public/data/ronzano_premotor_positions_v1/positions.json",
      browserUrl: "/data/ronzano_premotor_positions_v1/positions.json",
      bytes: positionReceipt.bytes,
      sha256: positionReceipt.sha256,
      derivation: "Exact numeric XYZ cells copied in source-file row order; no smoothing, interpolation, imputation, registration, point pairing, deduplication, coordinate rounding, cell generation, or geometry generation.",
    },
    relationshipBoundary: {
      relationshipToMuscle: "source experimental tracing group, not a complete connectome edge list",
      samePhysicalCellAcrossFrames: "not_established",
      crossSourceRelationship: "co_display_only",
      crossSourceJoinCount: 0,
      registrationCount: 0,
    },
    missingness: [
      { field: "soma_surface", status: "UNAVAILABLE", reason: "Coordinate rows provide positions, not soma contours, radii, volumes, or membranes." },
      { field: "neurite_morphology", status: "UNAVAILABLE", reason: "No dendrite or axon tracing is present in the admitted workbooks." },
      { field: "molecular_identity", status: "UNAVAILABLE", reason: "The pooled LG and TA coordinate workbooks do not assign a molecular interneuron type to each row." },
      { field: "same_cell_nucleus_or_organelles", status: "UNAVAILABLE", reason: "No nucleus, mitochondrion, ER, Golgi, vesicle, receptor, or other internal object is linked to a coordinate row." },
      { field: "synapse_roster", status: "UNAVAILABLE", reason: "Tracing group context is not a complete source-object synapse or partner roster." },
      { field: "adult_anatomy", status: "NOT_ESTABLISHED", reason: "The source explicitly limits the neonatal tracing result; adult output connectivity is not established." },
      { field: "atlas_registration", status: "UNAVAILABLE", reason: "Neither raw nor normalized source coordinates are registered to the project's Allen-derived anatomy." },
    ],
    scientificBoundary: "Every rendered primitive is one source coordinate row from a pinned workbook. A point is a labelled-cell position only—not a soma, neurite, molecular type, synapse, internal structure, adult placement, atlas registration, prevalence estimate, or complete interneuron census.",
  };
  return { contract, positionPayload, positionBytes, sourceFiles };
}

async function writeBuild(sourceDir, build) {
  await mkdir(SOURCE_OUTPUT_ROOT, { recursive: true });
  for (const sourceFile of build.sourceFiles) {
    const sourcePath = path.join(sourceDir, sourceFile.fileName);
    const outputPath = path.join(SOURCE_OUTPUT_ROOT, sourceFile.fileName);
    if (path.resolve(sourcePath) !== path.resolve(outputPath)) await copyFile(sourcePath, outputPath);
  }
  await writeFile(POSITION_OUTPUT_PATH, build.positionBytes);
  await writeFile(CONTRACT_OUTPUT_PATH, `${JSON.stringify(build.contract, null, 2)}\n`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const sourceDir = path.resolve(argValue("--source-dir") ?? SOURCE_OUTPUT_ROOT);
  const write = process.argv.includes("--write");
  const build = await buildRonzanoPremotorPositionReference({ sourceDir });
  if (write) await writeBuild(sourceDir, build);
  process.stdout.write(JSON.stringify({
    sourceDir,
    wrote: write,
    sourceFileCount: build.contract.sourceObjectContract.sourceFileCount,
    sourceBundleBytes: build.contract.sourceObjectContract.sourceBundleTotalBytes,
    sourceBundleSha256: build.contract.sourceObjectContract.sourceBundleCanonicalReceipt.sha256,
    rawCoordinateRows: build.contract.sourceObjectContract.representations.raw.coordinateRowCount,
    normalizedCoordinateRows: build.contract.sourceObjectContract.representations.normalized.coordinateRowCount,
    derivedBytes: build.contract.derivedAsset.bytes,
    derivedSha256: build.contract.derivedAsset.sha256,
    crossFrameMismatchedPairs: build.contract.crossFrameAudit.mismatchedRowCountPairs,
    registrationCount: build.contract.relationshipBoundary.registrationCount,
  }, null, 2) + "\n");
}
