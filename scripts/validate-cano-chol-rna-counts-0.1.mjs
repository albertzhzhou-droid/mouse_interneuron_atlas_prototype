import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCanoCholRnaChunk, validateCanoCholRnaDocument } from "../app/cano-chol-rna-counts.js";
import { sourceCsvRows } from "./validate-cano-gaba-source-labels-0.1.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hash = b => createHash("sha256").update(b).digest("hex");
const ordered = names => hash(names.join("\n") + "\n");
function check(v, m) { if (!v) throw new Error(`CHOL RNA source replay: ${m}`); }
export async function validateCanoCholRnaCounts({ root = ROOT } = {}) {
  const read = p => readFile(path.join(root, p));
  const doc = validateCanoCholRnaDocument(JSON.parse(await read("data/cano-chol-rna-counts-0.1.json")));
  for (const r of doc.reproduction.inputs) {
    check(!path.isAbsolute(r.path) && !r.path.split("/").includes(".."), "unsafe source input path");
    const b = await read(r.path); check(b.length === r.bytes && hash(b) === r.sha256, `changed input ${r.path}`);
  }
  check(hash(await read(doc.reproduction.builderPath)) === doc.reproduction.builderSha256, "builder changed without regeneration");
  const registry = JSON.parse(await read("data/cano-gomez-p56-multiome-interneuron-registry-0.1.json"));
  const [header, ...roster] = sourceCsvRows(gunzipSync(await read("public/data/cano_gomez_p56_multiome_interneuron_v1/GSE318731_confirmed_interneuron_nucleus_roster.csv.gz")).toString("utf8"));
  check(roster.length === 923, "retained nucleus roster denominator changed");
  for (const [j, values] of roster.entries()) {
    const r = Object.fromEntries(header.map((n, k) => [n, values[k]])); const n = doc.nuclei[j];
    check(r.compound_nucleus_key === n.key && r.source_nucleus_id === n.nativeId && r.confirmed_interneuron_profile_id === n.profileId && r.groups === "CHOL_IN", `retained base-R metadata roster differs at ${j + 1}`);
    check(registry.profiles.find(p => p.profileId === n.profileId)?.sourceLocalLabel === r.neuron_types, "source label/parent changed");
  }
  for (const p of doc.profiles) {
    const original = registry.profiles.find(r => r.profileId === p.id), keys = doc.nuclei.filter(n => n.profileId === p.id).map(n => n.key);
    check(p.label === original?.sourceLocalLabel && p.nucleusCount === original?.nucleusCount && ordered(keys) === original?.orderedCompoundNucleusKeysSha256 && p.orderedNucleusKeysSha256 === ordered(keys), "exact profile order/membership differs");
  }
  check(ordered(doc.genes) === doc.sourceAudit.featureLogMap.selectedNamesSha256, "source feature LogMap order differs");
  const sums = new Array(923).fill(0), detected = new Array(923).fill(0); let features = 0, compressedBytes = 0;
  for (const r of doc.chunks) {
    const packed = await read(r.path), plain = gunzipSync(packed);
    check(packed.length === r.bytes && hash(packed) === r.sha256 && plain.length === r.decodedBytes && hash(plain) === r.decodedSha256, `chunk byte receipt ${r.index}`);
    const chunk = parseCanoCholRnaChunk(plain.toString("utf8"), doc, r.index);
    for (const f of chunk.features) { features++; for (let j = 0; j < 923; j++) { sums[j] += f[2][j]; detected[j] += Number(f[2][j] > 0); } }
    compressedBytes += packed.length;
  }
  for (const [j, n] of doc.nuclei.entries()) check(n.totalRnaCount === sums[j] && n.detectedFeatureCount === detected[j], `all-feature original RNA column statistics differ at nucleus ${j + 1}`);
  check(sums.reduce((a, b) => a + b, 0) === doc.scope.selectedCountSum && detected.reduce((a, b) => a + b, 0) === doc.scope.selectedDetectedEntries && features === 32285, "matrix total/feature coverage changed");
  return { features, nuclei: 923, profiles: 11, chunks: doc.chunks.length, compressedBytes, allNucleusColumnStatisticsReplayed: 923, totalCount: doc.scope.selectedCountSum, positiveEntries: doc.scope.selectedDetectedEntries, mismatches: 0, canonicalProfilesAdded: 0, rnaAtacJoins: 0 };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) validateCanoCholRnaCounts().then(r => console.log(JSON.stringify(r))).catch(e => { console.error(e.message); process.exitCode = 1; });
