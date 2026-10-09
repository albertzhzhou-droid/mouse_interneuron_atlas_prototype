import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import assert from "node:assert/strict";
import { nativeDatManifestSummary } from "../app/native-dat-manifest-transport.js";
const ROOT = fileURLToPath(new URL("../", import.meta.url));
const SOURCE = "data/neurolucida-dat-file-manifest-0.1.json";
const INDEX = "data/native-dat-manifest-transport-0.1.json";
const sha = b => createHash("sha256").update(b).digest("hex");

export async function buildNativeDatManifestTransport({ write = false } = {}) {
  const sourceBytes = await readFile(path.join(ROOT, SOURCE)), source = JSON.parse(sourceBytes), records = [];
  assert.equal(source.records.length, 7);
  for (const file of source.records) {
    const publicPath = `/data/native_dat_file_manifests_v1/nmo-${file.neuronId}.json`;
    const bytes = Buffer.from(JSON.stringify(file)+"\n"), target = path.join(ROOT, `public${publicPath}`);
    if (write) { await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, bytes); }
    else assert.deepEqual(await readFile(target), bytes, `Stale per-file DAT manifest ${file.neuronId}`);
    records.push({ ...nativeDatManifestSummary(file), transport: { path: publicPath, bytes: bytes.length, sha256: sha(bytes) } });
  }
  const document = { documentType: "native_dat_manifest_transport_index", schemaVersion: "0.1.0",
    sourceManifest: { path: SOURCE, bytes: sourceBytes.length, sha256: sha(sourceBytes), releaseId: source.releaseId },
    scope: "Lossless per-file transport of the complete existing DAT audit; exact source syntax is retained at each pinned local path. No new geometry or biological identity.", records };
  const bytes = Buffer.from(JSON.stringify(document,null,2)+"\n");
  if (write) await writeFile(path.join(ROOT, INDEX), bytes);
  else assert.deepEqual(await readFile(path.join(ROOT, INDEX)), bytes, "Stale DAT transport index");
  return document;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const doc = await buildNativeDatManifestTransport({ write: process.argv.includes("--write") });
  console.log(JSON.stringify({ records: doc.records.length, selectedManifestBytes: doc.records.map(r=>({neuronId:r.neuronId,bytes:r.transport.bytes})) }));
}
