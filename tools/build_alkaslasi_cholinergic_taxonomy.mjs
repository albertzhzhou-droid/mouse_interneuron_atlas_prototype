#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gunzipSync } from "node:zlib";

import { validateAlkaslasiCholinergicSourceTaxonomy } from "../scripts/validate-alkaslasi-cholinergic-source-taxonomy-0.1.mjs";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_OUTPUT_PATH = resolve(PROJECT_ROOT, "data/alkaslasi-cholinergic-source-taxonomy-0.1.json");

export const ALKASLASI_SOURCE_RECEIPT = Object.freeze({
  fileName: "GSE167597_all_AlkaslasiPiccus_annotations.csv.gz",
  downloadUrl: "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE167nnn/GSE167597/suppl/GSE167597_all_AlkaslasiPiccus_annotations.csv.gz",
  geoDisplayedSize: "325.8 Kb",
  compressedBytes: 333655,
  compressedSha256: "6e69c106544a394dd23b6e7b4fc2d159a715aaa8a70adbd61721338e8d29c091",
  uncompressedBytes: 3372611,
  uncompressedSha256: "d8ca3a504cbbc3a96050e0c98ad7ac04d1a9a0b791b94acbee7ef158840febc2",
  sourceRowCount: 34231,
  uniqueBarcodeCount: 34231,
  exactHeaders: ["", "barcodes", "sex", "expt", "types", "newnames", "cholinergictypes", "skeletaltypes"],
  interneuronSubsetTupleSha256: "11e9f1dc232d08f26cbe657468b61000b6964be1046e0cab06c718d0c6e77bf9",
});

export const ALKASLASI_PROFILE_COUNTS = Object.freeze({
  I1: 1520,
  I2: 780,
  I3: 756,
  I4: 702,
  I5: 584,
  I6: 544,
  I7: 160,
  I8: 329,
});

export const ALKASLASI_PROFILE_REGION_COUNTS = Object.freeze({
  I1: Object.freeze({ Cervical: 361, Thoracic: 404, Lumbar: 755 }),
  I2: Object.freeze({ Cervical: 220, Thoracic: 208, Lumbar: 352 }),
  I3: Object.freeze({ Cervical: 171, Thoracic: 192, Lumbar: 393 }),
  I4: Object.freeze({ Cervical: 144, Thoracic: 161, Lumbar: 397 }),
  I5: Object.freeze({ Cervical: 199, Thoracic: 208, Lumbar: 177 }),
  I6: Object.freeze({ Cervical: 164, Thoracic: 209, Lumbar: 171 }),
  I7: Object.freeze({ Cervical: 33, Thoracic: 37, Lumbar: 90 }),
  I8: Object.freeze({ Cervical: 100, Thoracic: 70, Lumbar: 159 }),
});

export const ALKASLASI_PROFILE_SEX_COUNTS = Object.freeze({
  I1: Object.freeze({ M: 409, F: 444, NA: 667 }),
  I2: Object.freeze({ M: 263, F: 221, NA: 296 }),
  I3: Object.freeze({ M: 209, F: 223, NA: 324 }),
  I4: Object.freeze({ M: 183, F: 206, NA: 313 }),
  I5: Object.freeze({ M: 173, F: 178, NA: 233 }),
  I6: Object.freeze({ M: 171, F: 182, NA: 191 }),
  I7: Object.freeze({ M: 44, F: 33, NA: 83 }),
  I8: Object.freeze({ M: 81, F: 72, NA: 176 }),
});

const EXPECTED_TYPE_COUNTS = Object.freeze({
  "Excitatory Neurons": 13223,
  "Inhibitory Neurons": 4966,
  "Cholinergic Neurons": 16042,
});

const EXPECTED_CHOLINERGIC_TYPE_COUNTS = Object.freeze({
  "Cholinergic Interneurons": 5375,
  "Skeletal Motor Neurons": 5054,
  "Visceral Motor Neurons": 5613,
});

const EXPECTED_SKELETAL_TYPE_COUNTS = Object.freeze({
  "Alpha Motor Neurons": 1284,
  "Gamma Motor Neurons": 2243,
  "Type 3 Motor Neurons": 1527,
});
const EXPECTED_SKELETAL_NEWNAME_TO_TYPE = Object.freeze({
  S1: "Type 3 Motor Neurons",
  S2: "Alpha Motor Neurons",
  S3: "Gamma Motor Neurons",
});
const EXPECTED_SKELETAL_LABEL_CONFLICTS = Object.freeze([
  Object.freeze({ sourceRowIndex: 890, barcode: "CAGGCCACAGAGAAAG-1-thoracic_1", newnames: "S1", skeletaltypes: "Alpha Motor Neurons" }),
  Object.freeze({ sourceRowIndex: 11985, barcode: "CGGGACTCAGTTTCAG-1-cervical_5", newnames: "S2", skeletaltypes: "Type 3 Motor Neurons" }),
  Object.freeze({ sourceRowIndex: 15851, barcode: "GACGTTATCGATCCCT-1-cervical-cervical_6", newnames: "S1", skeletaltypes: "Gamma Motor Neurons" }),
  Object.freeze({ sourceRowIndex: 26156, barcode: "TATCCTAAGAATCGAT-1-lumbar_8", newnames: "S2", skeletaltypes: "Gamma Motor Neurons" }),
]);
const EXPECTED_INTERNEURON_REGION_COUNTS = Object.freeze({ Cervical: 1392, Thoracic: 1489, Lumbar: 2494 });
const EXPECTED_INTERNEURON_SEX_COUNTS = Object.freeze({ M: 1533, F: 1559, NA: 2283 });
const EXPECTED_ALL_SEX_COUNTS = Object.freeze({ M: 9460, F: 9924, NA: 14847 });

const EXPECTED_BARCODE_SUFFIX_COUNTS = Object.freeze([
  Object.freeze({ suffix: "thoracic_1", allRows: 3274, interneuronRows: 655 }),
  Object.freeze({ suffix: "thoracic_2", allRows: 2946, interneuronRows: 423 }),
  Object.freeze({ suffix: "thoracic_3", allRows: 3101, interneuronRows: 411 }),
  Object.freeze({ suffix: "cervical_4", allRows: 1620, interneuronRows: 161 }),
  Object.freeze({ suffix: "cervical_5", allRows: 2523, interneuronRows: 462 }),
  Object.freeze({ suffix: "cervical-cervical_6", allRows: 4798, interneuronRows: 769 }),
  Object.freeze({ suffix: "lumbar_7", allRows: 4566, interneuronRows: 717 }),
  Object.freeze({ suffix: "lumbar_8", allRows: 4455, interneuronRows: 674 }),
  Object.freeze({ suffix: "lumbar_9", allRows: 6948, interneuronRows: 1103 }),
]);

const PROFILE_MARKER_CONTEXT = Object.freeze({
  I1: Object.freeze({
    markerPanel: ["Pax2", "Mpped2", "Slc6a1", "Piezo2"],
    claims: [
      ["article_reported_group_context", ["Pax2", "Mpped2"], [], "I1 is within the Pax2-high I1-I7 group and the Mpped2-sharing I1-I8 group."],
      ["article_reported_group_context", ["Slc6a1"], [], "I1 is within the I1-I4 group described as selectively labelled by Slc6a1 and Mpped2."],
      ["article_reported_cluster_context", ["Piezo2"], [], "The article reports Piezo2 expression in I1, I7, and I8; this is not a per-nucleus quantitative expression record."],
    ],
  }),
  I2: Object.freeze({
    markerPanel: ["Pax2", "Mpped2", "Slc6a1"],
    claims: [
      ["article_reported_group_context", ["Pax2", "Mpped2"], [], "I2 is within the Pax2-high I1-I7 group and the Mpped2-sharing I1-I8 group."],
      ["article_reported_group_context", ["Slc6a1"], [], "I2 is within the I1-I4 group described as selectively labelled by Slc6a1 and Mpped2."],
    ],
  }),
  I3: Object.freeze({
    markerPanel: ["Pax2", "Mpped2", "Slc6a1"],
    claims: [
      ["article_reported_group_context", ["Pax2", "Mpped2"], [], "I3 is within the Pax2-high I1-I7 group and the Mpped2-sharing I1-I8 group."],
      ["article_reported_group_context", ["Slc6a1"], [], "I3 is within the I1-I4 group described as selectively labelled by Slc6a1 and Mpped2."],
    ],
  }),
  I4: Object.freeze({
    markerPanel: ["Pax2", "Mpped2", "Slc6a1"],
    claims: [
      ["article_reported_group_context", ["Pax2", "Mpped2"], [], "I4 is within the Pax2-high I1-I7 group and the Mpped2-sharing I1-I8 group."],
      ["article_reported_group_context", ["Slc6a1"], [], "I4 is within the I1-I4 group described as selectively labelled by Slc6a1 and Mpped2."],
    ],
  }),
  I5: Object.freeze({
    markerPanel: ["Pax2", "Mpped2", "Pitx2", "Tox"],
    claims: [
      ["article_reported_group_context", ["Pax2", "Mpped2"], [], "I5 is within the Pax2-high I1-I7 group and the Mpped2-sharing I1-I8 group."],
      ["article_profile_specific_ish_context", ["Pitx2", "Tox", "Chat"], [], "The article uses Pitx2 and Tox co-expression in a Chat-positive cell as an I5 example."],
    ],
  }),
  I6: Object.freeze({
    markerPanel: ["Pax2", "Mpped2", "Pitx2"],
    claims: [
      ["article_reported_group_context", ["Pax2", "Mpped2"], [], "I6 is within the Pax2-high I1-I7 group and the Mpped2-sharing I1-I8 group."],
      ["article_profile_specific_ish_context", ["Pitx2", "Chat"], ["Tox"], "The article distinguishes an I6 example as Pitx2-positive and Chat-positive without Tox; this negative marker context is not a biological absence claim for every I6 nucleus."],
    ],
  }),
  I7: Object.freeze({
    markerPanel: ["Pax2", "Mpped2", "Piezo2"],
    claims: [
      ["article_reported_group_context", ["Pax2", "Mpped2"], [], "I7 is within the Pax2-high I1-I7 group and the Mpped2-sharing I1-I8 group."],
      ["article_reported_cluster_context", ["Piezo2"], [], "The article reports Piezo2 expression in I1, I7, and I8; this is not a per-nucleus quantitative expression record."],
    ],
  }),
  I8: Object.freeze({
    markerPanel: ["Mpped2", "Piezo2", "Reln", "Chat"],
    claims: [
      ["article_reported_group_context", ["Mpped2"], ["Pax2"], "I8 shares Mpped2 with I1-I7 but was not Pax2-positive in the main classification analysis."],
      ["article_profile_specific_ish_context", ["Piezo2", "Reln", "Chat"], [], "The article validates a rare Piezo2-positive, Reln-positive, Chat-positive I8 population by in situ hybridization."],
    ],
  }),
});

const FIGURE_5A_PROMINENT_MARKER_LABELS = Object.freeze({
  I1: Object.freeze(["Igsl3", "Prlr", "Cdh23"]),
  I2: Object.freeze(["Chst9", "Lama2", "Pde5a"]),
  I3: Object.freeze(["Sox6", "Col18a1", "9530026P05Rik"]),
  I4: Object.freeze(["Zfp536", "Col18a1", "Pde11a"]),
  I5: Object.freeze(["Gm13912", "Ror2", "Gm12649"]),
  I6: Object.freeze(["Aldh1a1", "Gm21847", "Fer1l6"]),
  I7: Object.freeze(["Pde5a", "Adamtsl1", "Cpne4"]),
  I8: Object.freeze(["Pde11a", "Nr5a2", "CT010465.1", "Slc30a8"]),
});

const FIGURE_5A_MARKER_LABEL_UNION = Object.freeze([
  "Igsl3", "Prlr", "Cdh23", "Chst9", "Pde5a", "Lama2", "Sox6", "Col18a1",
  "9530026P05Rik", "Zfp536", "Pde11a", "Gm13912", "Ror2", "Gm12649", "Aldh1a1",
  "Gm21847", "Fer1l6", "Adamtsl1", "Cpne4", "Nr5a2", "CT010465.1", "Slc30a8",
]);

const SOURCE_LOCATORS = Object.freeze([
  {
    id: "paper-methods-sample-frame",
    sourceObjectId: "ALKASLASI-2021",
    locator: "Nature Communications Methods, Single nucleus isolation and sequencing: 12 eight-week-old mice (6 female, 6 male), matching regions pooled from two mice, and three processing replicates comprising male, female, and mixed-sex tissue.",
    supportsFields: ["sampleFrame", "depositedSexFieldMembership", "sampleRegionMembership"],
    evidenceStatus: "direct",
  },
  {
    id: "paper-results-source-denominators",
    sourceObjectId: "ALKASLASI-2021",
    locator: "Nature Communications Results, Transcriptional profiling of adult mouse spinal cholinergic neurons: 34,231 QC-retained nuclei, reporter-history/leaky-Cre non-cholinergic clusters, and 16,042 Chat-expressing nuclei resolving 21 cholinergic classes.",
    supportsFields: ["articlePipelineStages", "samplingBoundary", "reporterHistoryBoundary"],
    evidenceStatus: "direct",
  },
  {
    id: "paper-main-classification",
    sourceObjectId: "ALKASLASI-2021",
    locator: "Nature Communications Results and Figure 2: Pax2 was highly expressed in I1-I7; I8 lacked Pax2 but shared Mpped2 with the other interneuron clusters and was initially described as a suspected rare cholinergic interneuron.",
    supportsFields: ["sourceLocalLabel", "markerPanel", "putativeAssignmentStatus", "i8Caution"],
    evidenceStatus: "direct",
  },
  {
    id: "paper-interneuron-section",
    sourceObjectId: "ALKASLASI-2021",
    locator: "Nature Communications Cholinergic interneurons section and Figure 5: eight source clusters were used for the main analysis; 14 finer subclasses lacked robustly distinct markers and showed no rostrocaudal differences; I1-I4 carried Slc6a1/Mpped2 context and Piezo2 was also detected in I1 and I7.",
    supportsFields: ["markerPanel", "finerSubclassBoundary", "rostrocaudalContext"],
    evidenceStatus: "direct_and_contextual",
  },
  {
    id: "paper-figure-5-i5-i6",
    sourceObjectId: "ALKASLASI-2021",
    locator: "Nature Communications Figure 5c,g,h: Pitx2 marks I5 and I6 partition-cell context; Tox distinguishes the shown I5 cell from the shown I6 cell near the central canal.",
    supportsFields: ["markerPanel", "articleSpatialContext"],
    evidenceStatus: "profile_specific_ish_context",
  },
  {
    id: "paper-figure-5-i8",
    sourceObjectId: "ALKASLASI-2021",
    locator: "Nature Communications Figure 5d-f and associated text: Piezo2, Reln, and Chat co-expression validates a rare I8 population in the intermediate zone around the central canal; this is population-level ISH context, not a coordinate for deposited nuclei.",
    supportsFields: ["markerPanel", "articleSpatialContext", "i8Caution"],
    evidenceStatus: "profile_specific_ish_context",
  },
  {
    id: "paper-sex-analysis",
    sourceObjectId: "ALKASLASI-2021",
    locator: "Nature Communications Results reports that no sex-specific differences were observed among cholinergic neurons; this is a study-level analysis statement and not proof of equivalence or a per-profile negative finding.",
    supportsFields: ["articleSexAnalysis"],
    evidenceStatus: "study_level_negative_finding",
  },
  {
    id: "geo-series-record",
    sourceObjectId: "GSE167597",
    locator: "NCBI GEO GSE167597 series record: targeted adult mouse spinal cholinergic snRNA-seq, nine cervical/thoracic/lumbar-sacral region-by-replicate samples, PRJNA705097, and SRP308350.",
    supportsFields: ["sampleFrame", "accessions", "matrixReceipt"],
    evidenceStatus: "direct",
  },
  {
    id: "geo-annotation-object",
    sourceObjectId: "GSE167597_ANNOTATIONS",
    locator: "Checksum-pinned GSE167597_all_AlkaslasiPiccus_annotations.csv.gz: exact row index, barcode, deposited sex field, expt sample-region membership, broad type, newnames, cholinergictypes, and skeletaltypes columns.",
    supportsFields: ["samplingCount", "sourceLocalLabel", "sampleRegionMembership", "depositedSexFieldMembership", "sourceObjectAudit"],
    evidenceStatus: "checksum_verified_source_object",
  },
  {
    id: "geo-rights-boundary",
    sourceObjectId: "GSE167597_ANNOTATIONS",
    locator: "The annotation object is publicly downloadable from GEO, but no separate file-level redistribution licence is inferred from public access. The gzip and its 5,375-row barcode roster remain unbundled.",
    supportsFields: ["rightsBoundary", "sourceFileBundled"],
    evidenceStatus: "rights_boundary",
  },
  {
    id: "study-missing-axes",
    sourceObjectId: "ALKASLASI-2021",
    locator: "Neither the deposited annotation object nor the retained I1-I8 evidence supplies per-nucleus xyz coordinates, neurite or soma geometry, intracellular structures, electrophysiology, projection targets, synaptic edges, SCI states, atlas transforms, or cross-source identities.",
    supportsFields: ["missingEvidence"],
    evidenceStatus: "not_measured_or_not_linked",
  },
  {
    id: "article-license",
    sourceObjectId: "ALKASLASI-2021",
    locator: "Nature Communications article rights statement: the article is licensed under CC BY 4.0, subject to third-party-material exceptions; this article licence is not silently transferred to the distinct GEO annotation object.",
    supportsFields: ["articleLicense", "rightsBoundary"],
    evidenceStatus: "direct_rights_statement",
  },
]);

const HARD_BOUNDARIES = Object.freeze([
  "The 5,375 I1-I8 nuclei are a Chat-IRES-Cre/Sun1-GFP FACS-enriched source subset, not an unbiased census and not estimates of biological prevalence or abundance.",
  "The 34,231 QC-retained nuclei, 16,042 cholinergic nuclei, 5,375 interneuron nuclei, nine GEO samples, three processing replicates, and 12 mice are distinct denominator levels and must never be collapsed.",
  "Reporter history and leaky Cre produced non-cholinergic captured nuclei; GFP-positive sorting does not establish perfect adult cholinergic specificity.",
  "Cervical, Thoracic, and deposited Lumbar values are sample-membership labels, not xyz coordinates, spinal segments, laminae, centroids, or atlas registrations.",
  "The deposited value Lumbar remains verbatim; the article-level collection context lumbar/sacral is retained separately and is not used to rewrite source rows.",
  "Deposited sex value NA remains NA and is not imputed as mixed-sex, unknown animal sex, female, or male.",
  "Profile nucleus counts and region or sex-field proportions are sampling counts and cannot be interpreted as animal-level replication, population frequency, enrichment, depletion, or prevalence.",
  "The article's study-level report of no observed sex-specific differences is not proof of equivalence and is not promoted to a per-profile negative result.",
  "I1-I8 are source-local clusters; the article's 14 finer subclasses are contextual only because exact subclass assignments are absent from the deposited annotation object.",
  "I8 retains the article's initial suspected-rare-interneuron wording together with later ISH support; neither statement creates a universal canonical type identity.",
  "Article marker claims are group- or ISH-level evidence and are not deposited per-nucleus expression values in the annotation object.",
  "No profile contains observed cell morphology, soma or nucleus geometry, membrane, organelles, receptors, boutons, intracellular compartments, electrophysiology, projection targets, synaptic connectivity, or SCI-state evidence.",
  "Exact cross-source same-cell and same-type identity count remains zero; co-display, shared markers, or shared labels do not create a biological join or deduplicate records.",
  "Project registration count and generated geometry count remain zero; missing evidence generates no 3D primitive and is not biological absence.",
  "Public GEO access is not treated as file-level redistribution permission: the raw gzip and per-nucleus barcode roster are not bundled, while checksum-derived factual aggregates are retained.",
]);

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function increment(record, key) {
  record[key] = (record[key] ?? 0) + 1;
}

function orderedCounts(counts, labels) {
  return Object.fromEntries(labels.map((label) => [label, counts[label] ?? 0]));
}

function equalJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function parseCsvRow(line, rowNumber = "unknown") {
  const fields = [];
  let field = "";
  let quoted = false;
  let quoteClosed = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (quoted) {
      if (character === '"') {
        if (line[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
          quoteClosed = true;
        }
      } else {
        field += character;
      }
      continue;
    }
    if (character === ",") {
      fields.push(field);
      field = "";
      quoteClosed = false;
    } else if (character === '"') {
      check(field.length === 0 && !quoteClosed, `CSV row ${rowNumber} has a quote in an unquoted field`);
      quoted = true;
    } else {
      check(!quoteClosed, `CSV row ${rowNumber} has characters after a closing quote`);
      field += character;
    }
  }
  check(!quoted, `CSV row ${rowNumber} has an unterminated quoted field`);
  fields.push(field);
  return fields;
}

function barcodeSuffix(barcode) {
  const matches = EXPECTED_BARCODE_SUFFIX_COUNTS
    .map((item) => item.suffix)
    .filter((suffix) => barcode.endsWith(`-${suffix}`));
  check(matches.length === 1, `barcode has an unexpected or ambiguous sample suffix: ${barcode}`);
  return matches[0];
}

export function parseAlkaslasiAnnotationCsv(uncompressedBytes) {
  check(Buffer.isBuffer(uncompressedBytes) || uncompressedBytes instanceof Uint8Array, "uncompressed annotation must be bytes");
  const bytes = Buffer.from(uncompressedBytes);
  check(bytes.byteLength === ALKASLASI_SOURCE_RECEIPT.uncompressedBytes, `uncompressed source byte count changed: expected ${ALKASLASI_SOURCE_RECEIPT.uncompressedBytes}, received ${bytes.byteLength}`);
  check(sha256(bytes) === ALKASLASI_SOURCE_RECEIPT.uncompressedSha256, "uncompressed source SHA-256 changed");
  const text = bytes.toString("utf8");
  check(Buffer.from(text, "utf8").equals(bytes), "uncompressed annotation is not valid UTF-8");
  const lines = text.split(/\r?\n/);
  if (lines.at(-1) === "") lines.pop();
  check(lines.length === ALKASLASI_SOURCE_RECEIPT.sourceRowCount + 1, `source row count changed: expected ${ALKASLASI_SOURCE_RECEIPT.sourceRowCount}, received ${lines.length - 1}`);
  check(!lines.some((line) => line.length === 0), "annotation contains an empty CSV row");

  const header = parseCsvRow(lines[0], 1);
  check(equalJson(header, ALKASLASI_SOURCE_RECEIPT.exactHeaders), `CSV header changed: expected ${JSON.stringify(ALKASLASI_SOURCE_RECEIPT.exactHeaders)}, received ${JSON.stringify(header)}`);

  const uniqueBarcodes = new Set();
  const typeCounts = {};
  const cholinergicTypeCounts = {};
  const skeletalTypeCounts = {};
  const allSexCounts = {};
  const profileCounts = {};
  const profileRegionCounts = {};
  const profileSexCounts = {};
  const interneuronRegionCounts = {};
  const interneuronSexCounts = {};
  const suffixCounts = Object.fromEntries(EXPECTED_BARCODE_SUFFIX_COUNTS.map(({ suffix }) => [suffix, { allRows: 0, interneuronRows: 0 }]));
  const skeletalLabelConflicts = [];
  const allTupleHash = createHash("sha256");
  const interneuronTupleHash = createHash("sha256");

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const row = parseCsvRow(lines[lineIndex], lineIndex + 1);
    check(row.length === ALKASLASI_SOURCE_RECEIPT.exactHeaders.length, `CSV row ${lineIndex + 1} width changed`);
    const [sourceRow, barcode, sex, expt, type, newname, cholinergicType, skeletalType] = row;
    check(sourceRow === String(lineIndex), `source row index is not contiguous at CSV row ${lineIndex + 1}`);
    check(barcode.length > 0 && !uniqueBarcodes.has(barcode), `barcode is empty or duplicated at source row ${sourceRow}`);
    uniqueBarcodes.add(barcode);
    check(["M", "F", "NA"].includes(sex), `unexpected deposited sex value at source row ${sourceRow}: ${sex}`);
    check(["Cervical", "Thoracic", "Lumbar"].includes(expt), `unexpected expt sample-region value at source row ${sourceRow}: ${expt}`);
    check(Object.hasOwn(EXPECTED_TYPE_COUNTS, type), `unexpected broad type at source row ${sourceRow}: ${type}`);

    const suffix = barcodeSuffix(barcode);
    suffixCounts[suffix].allRows += 1;
    increment(typeCounts, type);
    increment(allSexCounts, sex);
    allTupleHash.update(`${row.join("\t")}\n`);

    if (type === "Cholinergic Neurons") {
      check(Object.hasOwn(EXPECTED_CHOLINERGIC_TYPE_COUNTS, cholinergicType), `unexpected cholinergic type at source row ${sourceRow}: ${cholinergicType}`);
      increment(cholinergicTypeCounts, cholinergicType);
      check(newname !== "NA", `cholinergic row ${sourceRow} lacks a newnames assignment`);
    } else {
      check(newname === "NA" && cholinergicType === "NA" && skeletalType === "NA", `non-cholinergic row ${sourceRow} has a cholinergic assignment`);
    }

    if (cholinergicType === "Skeletal Motor Neurons") {
      check(Object.hasOwn(EXPECTED_SKELETAL_TYPE_COUNTS, skeletalType), `unexpected skeletal type at source row ${sourceRow}: ${skeletalType}`);
      increment(skeletalTypeCounts, skeletalType);
      check(["S1", "S2", "S3"].includes(newname), `skeletal row ${sourceRow} has unexpected newnames value ${newname}`);
      if (EXPECTED_SKELETAL_NEWNAME_TO_TYPE[newname] !== skeletalType) {
        skeletalLabelConflicts.push({
          sourceRowIndex: Number(sourceRow),
          barcode,
          newnames: newname,
          skeletaltypes: skeletalType,
        });
      }
    } else {
      check(skeletalType === "NA", `non-skeletal row ${sourceRow} has a skeletaltypes assignment`);
    }

    if (cholinergicType === "Visceral Motor Neurons") check(/^V(?:10|[1-9])$/.test(newname), `visceral row ${sourceRow} has unexpected newnames value ${newname}`);

    if (cholinergicType === "Cholinergic Interneurons") {
      check(/^I[1-8]$/.test(newname), `interneuron row ${sourceRow} has unexpected newnames value ${newname}`);
      increment(profileCounts, newname);
      profileRegionCounts[newname] ??= {};
      profileSexCounts[newname] ??= {};
      increment(profileRegionCounts[newname], expt);
      increment(profileSexCounts[newname], sex);
      increment(interneuronRegionCounts, expt);
      increment(interneuronSexCounts, sex);
      suffixCounts[suffix].interneuronRows += 1;
      interneuronTupleHash.update(`${row.join("\t")}\n`);
    }
  }

  const orderedProfileCounts = orderedCounts(profileCounts, Object.keys(ALKASLASI_PROFILE_COUNTS));
  const orderedProfileRegionCounts = Object.fromEntries(Object.keys(ALKASLASI_PROFILE_COUNTS).map((label) => [label, orderedCounts(profileRegionCounts[label] ?? {}, ["Cervical", "Thoracic", "Lumbar"])]));
  const orderedProfileSexCounts = Object.fromEntries(Object.keys(ALKASLASI_PROFILE_COUNTS).map((label) => [label, orderedCounts(profileSexCounts[label] ?? {}, ["M", "F", "NA"])]));
  const orderedSuffixCounts = EXPECTED_BARCODE_SUFFIX_COUNTS.map(({ suffix }) => ({ suffix, ...suffixCounts[suffix] }));

  check(uniqueBarcodes.size === ALKASLASI_SOURCE_RECEIPT.uniqueBarcodeCount, "unique barcode denominator changed");
  check(equalJson(orderedCounts(typeCounts, Object.keys(EXPECTED_TYPE_COUNTS)), EXPECTED_TYPE_COUNTS), "broad type partition changed");
  check(equalJson(orderedCounts(cholinergicTypeCounts, Object.keys(EXPECTED_CHOLINERGIC_TYPE_COUNTS)), EXPECTED_CHOLINERGIC_TYPE_COUNTS), "cholinergic type partition changed");
  check(equalJson(orderedCounts(skeletalTypeCounts, Object.keys(EXPECTED_SKELETAL_TYPE_COUNTS)), EXPECTED_SKELETAL_TYPE_COUNTS), "skeletal type partition changed");
  check(equalJson(orderedCounts(allSexCounts, ["M", "F", "NA"]), EXPECTED_ALL_SEX_COUNTS), "all-row deposited sex partition changed");
  check(equalJson(orderedProfileCounts, ALKASLASI_PROFILE_COUNTS), "I1-I8 profile count vector changed");
  check(equalJson(orderedProfileRegionCounts, ALKASLASI_PROFILE_REGION_COUNTS), "I1-I8 region cross-tab changed");
  check(equalJson(orderedProfileSexCounts, ALKASLASI_PROFILE_SEX_COUNTS), "I1-I8 deposited sex cross-tab changed");
  check(equalJson(orderedCounts(interneuronRegionCounts, ["Cervical", "Thoracic", "Lumbar"]), EXPECTED_INTERNEURON_REGION_COUNTS), "interneuron sample-region partition changed");
  check(equalJson(orderedCounts(interneuronSexCounts, ["M", "F", "NA"]), EXPECTED_INTERNEURON_SEX_COUNTS), "interneuron deposited sex partition changed");
  check(equalJson(orderedSuffixCounts, EXPECTED_BARCODE_SUFFIX_COUNTS), "barcode sample-suffix partition changed");
  check(equalJson(skeletalLabelConflicts, EXPECTED_SKELETAL_LABEL_CONFLICTS), "skeletal newnames/skeletaltypes conflict roster changed");
  check(interneuronTupleHash.digest("hex") === ALKASLASI_SOURCE_RECEIPT.interneuronSubsetTupleSha256, "exact I1-I8 source tuple SHA-256 changed");

  const aggregateText = Object.keys(ALKASLASI_PROFILE_COUNTS).map((label) => [
    label,
    orderedProfileCounts[label],
    orderedProfileRegionCounts[label].Cervical,
    orderedProfileRegionCounts[label].Thoracic,
    orderedProfileRegionCounts[label].Lumbar,
    orderedProfileSexCounts[label].M,
    orderedProfileSexCounts[label].F,
    orderedProfileSexCounts[label].NA,
  ].join("\t")).join("\n") + "\n";

  return {
    sourceRowCount: lines.length - 1,
    uniqueBarcodeCount: uniqueBarcodes.size,
    contiguousSourceRowIndex: true,
    exactHeaders: header,
    typeCounts: orderedCounts(typeCounts, Object.keys(EXPECTED_TYPE_COUNTS)),
    cholinergicTypeCounts: orderedCounts(cholinergicTypeCounts, Object.keys(EXPECTED_CHOLINERGIC_TYPE_COUNTS)),
    skeletalTypeCounts: orderedCounts(skeletalTypeCounts, Object.keys(EXPECTED_SKELETAL_TYPE_COUNTS)),
    allSexCounts: orderedCounts(allSexCounts, ["M", "F", "NA"]),
    profileCounts: orderedProfileCounts,
    profileRegionCounts: orderedProfileRegionCounts,
    profileSexCounts: orderedProfileSexCounts,
    interneuronRegionCounts: orderedCounts(interneuronRegionCounts, ["Cervical", "Thoracic", "Lumbar"]),
    interneuronSexCounts: orderedCounts(interneuronSexCounts, ["M", "F", "NA"]),
    barcodeSuffixCounts: orderedSuffixCounts,
    skeletalLabelConflicts,
    allSourceRowsTupleSha256: allTupleHash.digest("hex"),
    interneuronSubsetTupleSha256: ALKASLASI_SOURCE_RECEIPT.interneuronSubsetTupleSha256,
    profileAggregateTupleSha256: sha256(Buffer.from(aggregateText, "utf8")),
  };
}

export async function auditAlkaslasiSourceGzip(sourceGzipPath) {
  check(typeof sourceGzipPath === "string" && sourceGzipPath.length > 0, "--source-gzip requires a path");
  const resolvedPath = resolve(sourceGzipPath);
  check(basename(resolvedPath) === ALKASLASI_SOURCE_RECEIPT.fileName, `source filename changed: expected ${ALKASLASI_SOURCE_RECEIPT.fileName}`);
  const compressed = await readFile(resolvedPath);
  check(compressed.byteLength === ALKASLASI_SOURCE_RECEIPT.compressedBytes, `compressed source byte count changed: expected ${ALKASLASI_SOURCE_RECEIPT.compressedBytes}, received ${compressed.byteLength}`);
  const compressedSha256 = sha256(compressed);
  check(compressedSha256 === ALKASLASI_SOURCE_RECEIPT.compressedSha256, `compressed source SHA-256 changed: expected ${ALKASLASI_SOURCE_RECEIPT.compressedSha256}, received ${compressedSha256}`);
  let uncompressed;
  try {
    uncompressed = gunzipSync(compressed);
  } catch (error) {
    throw new Error(`source gzip could not be decompressed: ${error instanceof Error ? error.message : error}`);
  }
  const parsed = parseAlkaslasiAnnotationCsv(uncompressed);
  return {
    sourcePath: resolvedPath,
    fileName: basename(resolvedPath),
    compressedBytes: compressed.byteLength,
    compressedSha256,
    uncompressedBytes: uncompressed.byteLength,
    uncompressedSha256: sha256(uncompressed),
    ...parsed,
  };
}

function markerLocatorIds(label) {
  if (label === "I5" || label === "I6") return ["paper-main-classification", "paper-interneuron-section", "paper-figure-5-i5-i6"];
  if (label === "I8") return ["paper-main-classification", "paper-interneuron-section", "paper-figure-5-i8"];
  return ["paper-main-classification", "paper-interneuron-section"];
}

function markerEvidence(label) {
  const locatorIds = markerLocatorIds(label);
  return PROFILE_MARKER_CONTEXT[label].claims.map(([evidenceStatus, positiveMarkers, negativeMarkers, claim]) => ({
    evidenceStatus,
    positiveMarkers,
    negativeMarkers,
    claim,
    sourceLocatorIds: evidenceStatus === "article_profile_specific_ish_context"
      ? locatorIds.filter((id) => id.startsWith("paper-figure-5"))
      : ["paper-main-classification", "paper-interneuron-section"],
    boundary: "Article marker context is not a deposited per-nucleus expression measurement, quantitative threshold, exclusive identity rule, or cross-source mapping.",
  }));
}

function articleSpatialContext(label) {
  if (label === "I5" || label === "I6") return {
    value: "Pitx2 partition-cell context near the central canal",
    authority: "article_profile_specific_ish_context",
    sourceLocatorIds: ["paper-figure-5-i5-i6"],
    boundary: "The shown ISH cells provide population context only; no deposited nucleus receives a coordinate, lamina, centroid, or atlas placement.",
  };
  if (label === "I8") return {
    value: "Intermediate zone around the central canal",
    authority: "article_profile_specific_ish_context",
    sourceLocatorIds: ["paper-figure-5-i8"],
    boundary: "The shown ISH cell and population localization do not assign xyz coordinates or atlas registration to the 329 deposited I8 nuclei.",
  };
  return {
    value: "Cholinergic-interneuron class context in the intermediate zone; no profile-specific location retained",
    authority: "article_class_level_context",
    sourceLocatorIds: ["paper-interneuron-section"],
    boundary: "Class-level narrative location must not be promoted to a profile-specific coordinate, lamina, centroid, or spatial distribution.",
  };
}

function profileMissingEvidence() {
  return {
    morphology: "not_measured",
    somaGeometry: "not_measured",
    nucleusGeometry: "not_measured",
    cellCoordinates: "not_available",
    intracellularStructures: "not_measured",
    organelles: "not_measured",
    electrophysiology: "not_linked_to_sequenced_nuclei",
    projectionTarget: "not_linked_to_sequenced_nuclei",
    synapticConnectivity: "not_linked_to_sequenced_nuclei",
    sciContext: "not_measured",
    atlasRegistration: "not_established",
    crossSourceSameCellIdentityLink: "not_established",
    crossSourceSameTypeIdentityLink: "not_established",
    biologicalPrevalence: "not_estimable_from_enriched_sample",
  };
}

function buildProfile(label, audit) {
  const markerContext = PROFILE_MARKER_CONTEXT[label];
  const locatorIds = markerLocatorIds(label);
  return {
    id: `alkaslasi-2021:GSE167597:${label}`,
    sourceLocalLabel: label,
    rawSourceLabels: [label],
    regionClass: "not_established",
    transmitterClass: "cholinergic",
    projectUseClass: "source_local_cholinergic_interneuron_cluster",
    lifeStage: "adult; source mice aged 8 weeks",
    spinalScope: "Cervical, Thoracic, and deposited Lumbar sample membership; article collection context cervical, thoracic, and lumbar/sacral",
    samplingCount: {
      value: audit.profileCounts[label],
      unit: "nuclei",
      interpretation: "CHECKSUM_PINNED_SOURCE_ASSIGNMENT_COUNT_NOT_PREVALENCE",
    },
    sampleRegionMembership: {
      field: "expt",
      authority: "checksum_pinned_annotation_field",
      counts: audit.profileRegionCounts[label],
      depositedLabels: ["Cervical", "Thoracic", "Lumbar"],
      boundary: "Counts are source-row sample membership, not xyz coordinates, segment identities, laminae, centroids, independent animals, or prevalence.",
    },
    depositedSexFieldMembership: {
      field: "sex",
      authority: "checksum_pinned_annotation_field",
      counts: audit.profileSexCounts[label],
      depositedLabels: ["M", "F", "NA"],
      naInterpretation: "PRESERVED_AS_DEPOSITED_NOT_IMPUTED",
      boundary: "These are nucleus-row metadata counts, not independent-animal sex denominators; NA is not relabelled as mixed-sex or unknown animal sex.",
    },
    markerPanel: markerContext.markerPanel,
    markerEvidence: markerEvidence(label),
    articleSpatialContext: articleSpatialContext(label),
    rostrocaudalContext: "exact_sample_membership_counts_only_no_coordinate_or_prevalence_claim",
    putativeCellTypeLabel: `cholinergic interneuron cluster ${label}`,
    putativeAssignmentStatus: label === "I8"
      ? "source_annotation_label_with_article_suspected_then_ish_supported_rare_interneuron_context"
      : "source_reported_cholinergic_interneuron_cluster",
    i8ArticleCaution: label === "I8"
      ? "The article first states that I8 is suspected to represent a rare cholinergic interneuron because it lacks Pax2, then reports Piezo2/Reln/Chat ISH support. Retain both stages and do not promote I8 to a universal canonical type."
      : null,
    fieldLocators: {
      sourceLocalLabel: ["geo-annotation-object", "paper-main-classification"],
      samplingCount: ["geo-annotation-object"],
      sampleRegionMembership: ["geo-annotation-object", "paper-methods-sample-frame"],
      depositedSexFieldMembership: ["geo-annotation-object", "paper-methods-sample-frame"],
      markerPanel: locatorIds,
      articleSpatialContext: articleSpatialContext(label).sourceLocatorIds,
      putativeAssignmentStatus: ["paper-main-classification", ...(label === "I8" ? ["paper-figure-5-i8"] : [])],
      missingEvidence: ["study-missing-axes"],
    },
    missingEvidence: profileMissingEvidence(),
  };
}

function buildTaxonomy(audit) {
  const profileLabels = Object.keys(ALKASLASI_PROFILE_COUNTS);
  return {
    releaseId: "ohri-alkaslasi-cholinergic-source-taxonomy-0.1.0",
    schemaVersion: "0.1.0",
    releaseDate: "2026-08-30",
    datasetId: "GSE167597",
    coordinateAuthority: "SOURCE_LOCAL_TYPE_ONLY",
    source: {
      publication: {
        id: "ALKASLASI-2021",
        citation: "Alkaslasi MR, Piccus ZE, Hareendran S, et al. Single nucleus RNA-sequencing defines unexpected diversity of cholinergic neuron types in the adult mouse spinal cord. Nature Communications 12, 2471 (2021).",
        doi: "10.1038/s41467-021-22691-2",
        pmid: "33931636",
        articleUrl: "https://www.nature.com/articles/s41467-021-22691-2",
        license: {
          id: "CC-BY-4.0",
          url: "https://creativecommons.org/licenses/by/4.0/",
          appliesTo: "article_and_article_source_data_subject_to_third_party_exceptions",
          sourceLocatorIds: ["article-license"],
          rightsBoundary: "The article is CC BY 4.0, but this contract does not infer that the distinct GEO-hosted annotation object carries the same file-level redistribution permission.",
        },
      },
      geo: {
        id: "GSE167597",
        accession: "GSE167597",
        recordUrl: "https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE167597",
        sraStudyAccession: "SRP308350",
        bioProjectAccession: "PRJNA705097",
        displayedCitationPmid: "37559423",
        citationLinkBoundary: "The current GEO series page displays PMID 37559423, which is not the Alkaslasi et al. 2021 article. DOI 10.1038/s41467-021-22691-2 and PMID 33931636 remain the authoritative publication identifiers for this contract.",
        sampleFrame: {
          species: "Mus musculus",
          sourceAnimalCount: 12,
          femaleAnimalCount: 6,
          maleAnimalCount: 6,
          ageWeeks: 8,
          matchingRegionMousePoolSize: 2,
          processingReplicateMouseCount: 4,
          processingReplicateCount: 3,
          replicateContexts: ["mixed-sex", "male", "female"],
          geoSampleCount: 9,
          geoSampleAccessions: ["GSM5111192", "GSM5111193", "GSM5111194", "GSM5111195", "GSM5111196", "GSM5111197", "GSM5111198", "GSM5111199", "GSM5111200"],
          sampledRegionLabels: ["Cervical", "Thoracic", "Lumbar/Sacral article context"],
          articleSexAnalysis: {
            finding: "no_sex_specific_differences_observed_among_cholinergic_neurons",
            authority: "article_reported_study_level_negative_finding",
            sourceLocatorIds: ["paper-sex-analysis"],
            boundary: "This is not proof of equivalence and is not a per-cluster or per-nucleus negative finding. Deposited NA sex rows remain uninterpreted.",
          },
          sourceLocatorIds: ["paper-methods-sample-frame", "geo-series-record"],
          interpretationBoundary: "Twelve source mice, four mice per processing replicate, two mice per first-stage matching-region pool, three processing replicates, nine GEO samples, and nucleus rows are distinct denominator levels. No profile-specific independent-animal denominator is recoverable from this annotation object.",
        },
        annotationAsset: {
          id: "GSE167597_ANNOTATIONS",
          fileName: ALKASLASI_SOURCE_RECEIPT.fileName,
          downloadUrl: ALKASLASI_SOURCE_RECEIPT.downloadUrl,
          geoDisplayedSize: ALKASLASI_SOURCE_RECEIPT.geoDisplayedSize,
          compressedBytes: ALKASLASI_SOURCE_RECEIPT.compressedBytes,
          compressedSha256: ALKASLASI_SOURCE_RECEIPT.compressedSha256,
          uncompressedBytes: ALKASLASI_SOURCE_RECEIPT.uncompressedBytes,
          uncompressedSha256: ALKASLASI_SOURCE_RECEIPT.uncompressedSha256,
          retrievedOn: "2026-08-30",
          sourceFileBundled: false,
          exactNucleusRosterBundled: false,
          derivedFactualMetadataBundled: true,
          reuseStatus: "PUBLIC_ACCESS_REUSE_NOT_ASSUMED",
          sourceLocatorIds: ["geo-annotation-object", "geo-rights-boundary"],
          rightsBoundary: "The processed GEO object is publicly downloadable, but no separate file-level redistribution licence is inferred. Neither the gzip nor a derivative 5,375-barcode roster is bundled; only factual aggregates and checksum receipts are retained.",
        },
      },
    },
    scope: {
      species: "Mus musculus",
      speciesTaxonId: 10090,
      lifeStage: "adult; 8 weeks",
      spinalRegion: "cervical, thoracic, and lumbar/sacral collection; deposited annotation uses Lumbar",
      modality: "targeted single-nucleus RNA sequencing after Chat-IRES-Cre/Sun1-GFP nuclear enrichment",
      sourceTotalQcRetainedNucleusCount: 34231,
      sourceCholinergicNucleusCount: 16042,
      sourceInterneuronNucleusCount: 5375,
      displayedProfileCount: 8,
      sourceLabelledCholinergicInterneuronProfileCount: 8,
      articlePax2HighProfileCount: 7,
      articleCautiousI8ProfileCount: 1,
      articleFinerInterneuronSubclassCount: 14,
      depositedFinerSubclassAssignmentsAvailable: false,
      samplingCountInterpretation: "SAMPLING_COUNT_ONLY_NOT_PREVALENCE",
      projectCanonicalTypeCount: 0,
      exactCrossSourceIdentityCount: 0,
      projectRegistrationCount: 0,
      generatedGeometryCount: 0,
    },
    articlePipelineStages: {
      preliminaryQcClusterCount: 38,
      preliminaryNonCholinergicClusterCount: 22,
      finalCholinergicClassCount: 21,
      interpretationBoundary: "These are distinct analysis stages. Subtracting preliminary cluster counts is not a valid reconstruction of the final 21-class cholinergic analysis.",
      sourceLocatorIds: ["paper-results-source-denominators"],
    },
    articleFigure5aMarkerContext: {
      authority: "article_figure_display_context",
      markerLabelUnion: FIGURE_5A_MARKER_LABEL_UNION,
      prominentLabelsByProfile: FIGURE_5A_PROMINENT_MARKER_LABELS,
      sourceLocatorIds: ["paper-interneuron-section"],
      boundary: "These are prominent labels displayed for I1-I8 in Figure 5a. Shared labels occur, and no label is promoted to a uniquely specific canonical marker, deposited per-nucleus expression value, or exact cross-study identity rule.",
    },
    sourceObjectAudit: {
      exactHeaders: audit.exactHeaders,
      sourceRowCount: audit.sourceRowCount,
      uniqueBarcodeCount: audit.uniqueBarcodeCount,
      contiguousSourceRowIndex: audit.contiguousSourceRowIndex,
      typeCounts: audit.typeCounts,
      cholinergicTypeCounts: audit.cholinergicTypeCounts,
      skeletalTypeCounts: audit.skeletalTypeCounts,
      allDepositedSexFieldCounts: audit.allSexCounts,
      interneuronSampleRegionCounts: audit.interneuronRegionCounts,
      interneuronDepositedSexFieldCounts: audit.interneuronSexCounts,
      barcodeSampleSuffixCounts: audit.barcodeSuffixCounts,
      skeletalLabelConflicts: audit.skeletalLabelConflicts.map((conflict) => ({
        ...conflict,
        conflictStatus: "PRESERVED_NOT_REPAIRED",
        boundary: "This excluded skeletal-motor context row disagrees with the source-wide S1=Type 3, S2=Alpha, S3=Gamma mapping. Both deposited fields remain verbatim; the conflict is not repaired and does not enter the I1-I8 profile denominator.",
      })),
      allSourceRowsTupleReceipt: {
        canonicalization: "Each source row in deposited order, eight parsed field values joined by TAB and terminated by LF.",
        sha256: audit.allSourceRowsTupleSha256,
      },
      interneuronSubsetTupleReceipt: {
        canonicalization: "Rows where cholinergictypes equals Cholinergic Interneurons, retained in deposited order; eight parsed field values joined by TAB and terminated by LF.",
        sha256: audit.interneuronSubsetTupleSha256,
      },
      profileAggregateTupleReceipt: {
        canonicalization: "I1-I8 in numeric order; label, total, Cervical, Thoracic, Lumbar, M, F, and NA joined by TAB; one LF-terminated row per profile.",
        sha256: audit.profileAggregateTupleSha256,
      },
      rawSourceAnomalies: [{
        field: "barcodes",
        rawValue: "cervical-cervical_6",
        kind: "DEPOSITED_DUPLICATED_REGION_TOKEN_IN_BARCODE_SUFFIX",
        allRowCount: 4798,
        interneuronRowCount: 769,
        boundary: "The suffix remains verbatim and is not silently normalized to cervical_6 or used to infer an unrecorded sample-accession mapping.",
      }],
      sourceLocatorIds: ["geo-annotation-object"],
    },
    excludedSourceContext: {
      displaySelectionRule: "cholinergictypes == Cholinergic Interneurons and newnames matches I1-I8",
      displayedNucleusCount: 5375,
      excludedNucleusCount: 28856,
      excludedCholinergicContext: {
        skeletalMotorNeuronNuclei: 5054,
        visceralMotorNeuronNuclei: 5613,
        reason: "Motor-neuron classes are retained only as source partition context and do not become displayed interneuron profiles.",
      },
      excludedReporterHistoryContext: {
        excitatoryNeuronNuclei: 13223,
        inhibitoryNeuronNuclei: 4966,
        reason: "The article attributes non-cholinergic captured nuclei to developmental Chat-IRES-Cre history or leaky Cre expression; they are excluded from the cholinergic-interneuron display subset.",
      },
      boundary: "Exclusion from this display is not evidence that a source row is biologically absent, invalid, or unimportant; it only enforces the I1-I8 project scope.",
    },
    sourceLocators: SOURCE_LOCATORS,
    profiles: profileLabels.map((label) => buildProfile(label, audit)),
    hardBoundaries: HARD_BOUNDARIES,
  };
}

export async function buildAlkaslasiCholinergicTaxonomy({ sourceGzipPath } = {}) {
  const audit = await auditAlkaslasiSourceGzip(sourceGzipPath);
  const taxonomy = buildTaxonomy(audit);
  await validateAlkaslasiCholinergicSourceTaxonomy(taxonomy);
  return taxonomy;
}

export async function writeAlkaslasiCholinergicTaxonomy({ sourceGzipPath, outputPath = DEFAULT_OUTPUT_PATH } = {}) {
  const taxonomy = await buildAlkaslasiCholinergicTaxonomy({ sourceGzipPath });
  const serialized = stableJson(taxonomy);
  const resolvedOutputPath = resolve(outputPath);
  await mkdir(dirname(resolvedOutputPath), { recursive: true });
  await writeFile(resolvedOutputPath, serialized, "utf8");
  return {
    taxonomy,
    outputPath: resolvedOutputPath,
    outputBytes: Buffer.byteLength(serialized),
    outputSha256: sha256(Buffer.from(serialized, "utf8")),
  };
}

function readPathArgument(argv, index, name) {
  const value = argv[index + 1];
  check(value && !value.startsWith("--"), `${name} requires a path`);
  return value;
}

function parseArguments(argv) {
  let sourceGzipPath = null;
  let outputPath = DEFAULT_OUTPUT_PATH;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--source-gzip") {
      sourceGzipPath = readPathArgument(argv, index, "--source-gzip");
      index += 1;
    } else if (argument.startsWith("--source-gzip=")) {
      sourceGzipPath = argument.slice("--source-gzip=".length);
    } else if (argument === "--output") {
      outputPath = readPathArgument(argv, index, "--output");
      index += 1;
    } else if (argument.startsWith("--output=")) {
      outputPath = argument.slice("--output=".length);
    } else if (argument === "--help" || argument === "-h") {
      return { help: true, sourceGzipPath, outputPath };
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  check(sourceGzipPath, "--source-gzip is required because the raw GEO object is not bundled");
  return { help: false, sourceGzipPath, outputPath };
}

const invokedAsMain = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href === import.meta.url
  : false;

if (invokedAsMain) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      console.log("Usage: node tools/build_alkaslasi_cholinergic_taxonomy.mjs --source-gzip PATH [--output PATH]");
    } else {
      const result = await writeAlkaslasiCholinergicTaxonomy(options);
      console.log(`Built ${result.outputPath} (${result.outputBytes} bytes; SHA-256 ${result.outputSha256}; 8 profiles; 5,375 source-assigned nuclei)`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
