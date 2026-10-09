import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCanoGabaAssignmentText, validateCanoGabaLabels } from "../app/cano-gaba-source-labels.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hash = b => createHash("sha256").update(b).digest("hex");
function check(value, message) { if (!value) throw new Error(`GABA source replay: ${message}`); }
/** Independent CSV reader retains unquoted source NA and exact quoted strings. */
export function sourceCsvRows(text) {
  const rows = []; let row = [], field = "", quoted = false, inQuote = false, closed = false;
  const endField = () => { row.push(!quoted && field === "NA" ? null : field); field = ""; quoted = false; closed = false; };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuote) {
      if (c !== '"') field += c;
      else if (text[i + 1] === '"') { field += '"'; i++; }
      else { inQuote = false; closed = true; }
    } else if (c === ",") endField();
    else if (c === "\n") { endField(); rows.push(row); row = []; }
    else if (c === '"' && field === "" && !closed) { quoted = true; inQuote = true; }
    else { check(!closed && c !== '"' && c !== "\r", "invalid source CSV quoting"); field += c; }
  }
  check(!inQuote && row.length === 0 && field === "" && !closed, "truncated source CSV"); return rows;
}
export async function validateCanoGabaSourceLabels({ root = ROOT } = {}) {
  const read = f => readFile(path.join(root, f));
  const doc = validateCanoGabaLabels(JSON.parse(await read("data/cano-gomez-gaba-source-labels-0.1.json")));
  for (const input of doc.reproduction.inputs) {
    check(!path.isAbsolute(input.path) && !input.path.split("/").includes(".."), "unsafe input path");
    const b = await read(input.path); check(b.length === input.bytes && hash(b) === input.sha256, `changed ${input.path}`);
  }
  const builder = await read(doc.reproduction.builderPath); check(hash(builder) === doc.reproduction.builderSha256, "builder changed without regeneration");
  const metadata = await read("data/source-extractions/cano-gomez-p56/GSE318731_P56_gabaergic_multiome.metadata.csv.gz");
  const audit = JSON.parse(await read("data/source-extractions/cano-gomez-p56/GSE318731_P56_gabaergic_multiome.audit.json"));
  const prior = audit.output.metadataCsvGzip; const original = gunzipSync(metadata);
  check(hash(metadata) === prior.compressedSha256 && metadata.length === prior.compressedBytes && hash(original) === prior.uncompressedSha256 && original.length === prior.uncompressedBytes && audit.sourceSha256 === doc.source.sha256 && audit.sourceBytes === doc.source.bytes && audit.authorityMode === doc.source.authorityMode, "original extraction receipt changed");
  check(!audit.metadataColumns.includes("source") && !audit.metadataColumns.includes("Sex") && audit.metadataColumns.includes("neuron_types"), "source column absence differs from original inventory");
  const compressed = await read(doc.artifact.path), plain = gunzipSync(compressed);
  check(compressed.length === doc.artifact.compressedBytes && hash(compressed) === doc.artifact.compressedSha256 && plain.length === doc.artifact.uncompressedBytes && hash(plain) === doc.artifact.uncompressedSha256, "derived transport receipt changed");
  const rows = parseCanoGabaAssignmentText(plain.toString("utf8"), doc);
  const [header, ...source] = sourceCsvRows(original.toString("utf8")); check(source.length === rows.length, "original source row count differs");
  for (let i = 0; i < rows.length; i++) check(JSON.stringify(rows[i].raw) === JSON.stringify(Object.fromEntries(header.map((name, column) => [name, source[i][column]]))), `source metadata differs at data row ${i + 1}`);
  check(hash(rows.map(row => row.raw.nucleus_id).join("\n") + "\n") === doc.identity.orderedSourceNucleusNamesSha256, "ordered source identities differ");
  const grouped = new Map(doc.labels.map(label => [label.id, []])); for (const row of rows) grouped.get(row.labelId).push(row.key);
  for (const label of doc.labels) {
    check(label.id === `cano.gaba.metadata-label.sha256.${hash(label.rawLabel).slice(0, 24)}`, "wrong label identity");
    check(hash(grouped.get(label.id).join("\n") + "\n") === label.orderedCompoundNucleusKeysSha256, "ordered label membership differs");
  }
  return { rows: rows.length, labels: doc.labels.length, groups: doc.groupCounts.length, exactSourceRows: rows.length, mismatches: 0, originalRdsReacquired: false, confirmedProfilesAdded: 0 };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) validateCanoGabaSourceLabels().then(r => console.log(JSON.stringify(r))).catch(e => { console.error(e.message); process.exitCode = 1; });
